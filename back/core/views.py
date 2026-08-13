import calendar
import secrets
from datetime import date, timedelta

from accounts.models import User
from accounts.permissions import IsAdminUser, IsEmployeeUser, IsEntryUser
from accounts.serializers import UserSerializer
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from openpyxl import Workbook
from rest_framework import filters as drf_filters
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Action, Attendance, QRToken, SystemSettings
from .serializers import (
    AdminStatsOverviewSerializer,
    AttendanceSerializer,
    EmployeeAttendanceSerializer,
    EmployeeStatsSerializer,
    QRTokenInputSerializer,
    QRTokenSerializer,
    SystemSettingsSerializer,
    ValidateQRResponseSerializer,
    YearMonthQuerySerializer,
)


def _resolve_year_month(request) -> tuple[int, int]:
    query = YearMonthQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    today = timezone.localdate()
    return (
        query.validated_data.get("year", today.year),
        query.validated_data.get("month", today.month),
    )

YEAR_MONTH_PARAMETERS = [
    OpenApiParameter("year", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
    OpenApiParameter("month", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
]


class GenerateQRTokenView(APIView):
    """يولّد رمز QR عامًا — لا يحمل نوع إجراء، يُحدَّد ذلك تلقائيًا وقت المسح حسب حالة كل موظف."""

    permission_classes = [IsEntryUser]

    @extend_schema(request=None, responses={201: QRTokenSerializer})
    def post(self, request):
        lifetime_seconds = SystemSettings.get_solo().qr_token_lifetime_seconds
        qr_token = QRToken.objects.create(
            token=secrets.token_urlsafe(24),
            generated_by=request.user,
            expires_at=timezone.now() + timedelta(seconds=lifetime_seconds),
        )
        return Response(
            QRTokenSerializer(qr_token).data, status=status.HTTP_201_CREATED
        )


def _has_open_session(user) -> bool:
    return Attendance.objects.filter(
        user=user, date=timezone.localdate(), check_out__isnull=True
    ).exists()


class ValidateQRView(APIView):
    """يتحقق من أن الرمز سارٍ، ويتوقّع الإجراء (دخول/خروج) حسب حالة الموظف الحالي — بدون أي أثر جانبي."""

    permission_classes = [IsEmployeeUser]

    @extend_schema(request=QRTokenInputSerializer, responses={200: ValidateQRResponseSerializer})
    def post(self, request):
        serializer = QRTokenInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = Action.CHECK_OUT if _has_open_session(request.user) else Action.CHECK_IN
        return Response({"valid": True, "action": action})


def _check_in(user, qr_token: QRToken) -> tuple[Attendance | None, str | None]:
    """ينشئ جلسة جديدة. القيد الفريد الشرطي على الموديل يمنع أي جلسة مفتوحة ثانية بنفس اليوم حتى تحت التزامن."""
    try:
        with transaction.atomic():
            attendance = Attendance.objects.create(
                user=user,
                date=timezone.localdate(),
                check_in=timezone.now(),
                qr_token=qr_token,
            )
    except IntegrityError:
        return None, "Already checked in today. Check out first before checking in again."
    return attendance, None


def _check_out(user, qr_token: QRToken) -> tuple[Attendance | None, str | None]:
    """يغلق آخر جلسة مفتوحة لهذا الموظف اليوم، بشرط مرور الحد الأدنى الزمني منذ الدخول.
    select_for_update تمنع إغلاق نفس الجلسة مرتين بالتزامن."""
    with transaction.atomic():
        attendance = (
            Attendance.objects.select_for_update()
            .filter(user=user, date=timezone.localdate(), check_out__isnull=True)
            .first()
        )
        if attendance is None:
            return None, "Cannot check out before checking in."

        min_seconds = SystemSettings.get_solo().min_session_duration_seconds
        elapsed = (timezone.now() - attendance.check_in).total_seconds()
        if elapsed < min_seconds:
            remaining = int(min_seconds - elapsed)
            return None, f"Please wait {remaining} more second(s) before checking out."

        attendance.check_out = timezone.now()
        attendance.qr_token = qr_token
        attendance.save()
    return attendance, None


class RecordAttendanceView(APIView):
    """يحفظ الحضور/الانصراف فعليًا — يُستدعى بعد نجاح البصمة محليًا فقط.
    الإجراء (دخول/خروج) يُحدَّد تلقائيًا حسب وجود جلسة مفتوحة للموظف أم لا."""

    permission_classes = [IsEmployeeUser]

    @extend_schema(request=QRTokenInputSerializer, responses={200: AttendanceSerializer})
    def post(self, request):
        serializer = QRTokenInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr_token = serializer.validated_data["token"]

        if _has_open_session(request.user):
            attendance, error = _check_out(request.user, qr_token)
        else:
            attendance, error = _check_in(request.user, qr_token)

        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AttendanceSerializer(attendance).data)


class MyAttendanceView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsEmployeeUser]

    def get_queryset(self):
        today = timezone.localdate()
        return Attendance.objects.filter(
            user=self.request.user, date__year=today.year, date__month=today.month
        )


class EmployeeExportAttendanceView(APIView):
    """يصدّر تقرير إكسل شهري لموظف واحد محدَّد بمعرّفه."""

    permission_classes = [IsAdminUser]

    @extend_schema(parameters=YEAR_MONTH_PARAMETERS, responses={200: OpenApiTypes.BINARY})
    def get(self, request, pk):
        employee = get_object_or_404(User, pk=pk, is_employee=True)
        year, month = _resolve_year_month(request)

        records = Attendance.objects.filter(
            user=employee, date__year=year, date__month=month
        ).order_by("date")

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = f"{year}-{month:02d}"
        sheet.append(["التاريخ", "وقت الحضور", "وقت الانصراف"])

        for record in records:
            sheet.append(
                [
                    record.date.isoformat(),
                    timezone.localtime(record.check_in).strftime("%H:%M:%S")
                    if record.check_in
                    else "",
                    timezone.localtime(record.check_out).strftime("%H:%M:%S")
                    if record.check_out
                    else "",
                ]
            )

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            f"attachment; filename=attendance_{employee.username}_{year}_{month:02d}.xlsx"
        )
        workbook.save(response)
        return response


WEEKEND_ISOWEEKDAYS = {6, 7}  # السبت والأحد

USER_FILTERSET_FIELDS = [
    "username",
    "email",
    "first_name",
    "last_name",
    "phone",
    "is_admin",
    "is_entry",
    "is_employee",
    "is_regular",
    "is_active",
    "is_first_login",
    "device_id",
]
USER_SEARCH_FIELDS = ["first_name", "last_name", "username", "phone"]


def _working_days_in_range(year: int, month: int, up_to_day: int) -> int:
    return sum(
        1
        for day in range(1, up_to_day + 1)
        if date(year, month, day).isoweekday() not in WEEKEND_ISOWEEKDAYS
    )


def _resolve_working_days(year: int, month: int) -> int:
    """أيام العمل (باستثناء السبت والأحد) من بداية الشهر حتى اليوم، أو حتى نهاية الشهر لو كان شهرًا سابقًا."""
    today = timezone.localdate()
    days_in_month = calendar.monthrange(year, month)[1]
    last_relevant_day = today.day if (year, month) == (today.year, today.month) else days_in_month
    return _working_days_in_range(year, month, last_relevant_day)


def _employee_month_stats(employee, year: int, month: int, work_start_time, working_days: int) -> dict:
    """يحسب أيام الدوام/الغياب ودقائق التأخير اليومية لموظف واحد خلال شهر محدَّد، بالاعتماد على أول
    تسجيل حضور بكل يوم مقارنة بوقت بدء الدوام الرسمي."""
    records = Attendance.objects.filter(
        user=employee, date__year=year, date__month=month
    ).order_by("check_in")

    first_check_in_by_day = {}
    for record in records:
        first_check_in_by_day.setdefault(record.date, record.check_in)

    daily_late_minutes = {}
    for day, check_in in first_check_in_by_day.items():
        local_check_in = timezone.localtime(check_in)
        scheduled_start = local_check_in.replace(
            hour=work_start_time.hour, minute=work_start_time.minute, second=0, microsecond=0
        )
        late = int((local_check_in - scheduled_start).total_seconds() // 60)
        daily_late_minutes[day] = max(late, 0)

    present_days = len(first_check_in_by_day)
    return {
        "present_days": present_days,
        "absent_days": max(working_days - present_days, 0),
        "late_minutes": sum(daily_late_minutes.values()),
        "daily_late_minutes": daily_late_minutes,
    }


EXPORT_SUMMARY_LABELS = {
    "ar": {
        "columns": ["اسم الموظف", "نوع الدوام", "أيام الدوام", "أيام الغياب", "دقائق التأخير"],
        "full_time": "دوام كامل",
        "part_time": "دوام جزئي",
    },
    "en": {
        "columns": ["Employee name", "Duty type", "Days present", "Days absent", "Late minutes"],
        "full_time": "Full-time",
        "part_time": "Part-time",
    },
    "tr": {
        "columns": ["Çalışan adı", "Çalışma türü", "Çalışılan gün", "Devamsızlık günü", "Geç kalma (dakika)"],
        "full_time": "Tam zamanlı",
        "part_time": "Yarı zamanlı",
    },
}


class MonthlyAttendanceSummaryExportView(generics.GenericAPIView):
    """يصدّر تقرير إكسل يلخّص حضور كل الموظفين خلال شهر محدَّد: أيام دوام، أيام غياب، دقائق تأخير.
    يُطبَّق نفس فلتر/بحث قائمة الموظفين حتى يطابق الملف ما يراه الأدمن على الشاشة، وتُترجَم عناوينه
    حسب باراميتر lang (ar/en/tr) لتطابق لغة الواجهة وقت التصدير."""

    permission_classes = [IsAdminUser]
    queryset = User.objects.filter(is_employee=True).order_by("username")
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = USER_FILTERSET_FIELDS
    search_fields = USER_SEARCH_FIELDS

    @extend_schema(
        parameters=YEAR_MONTH_PARAMETERS
        + [OpenApiParameter("lang", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False)],
        responses={200: OpenApiTypes.BINARY},
    )
    def get(self, request):
        year, month = _resolve_year_month(request)
        work_start_time = SystemSettings.get_solo().work_start_time
        labels = EXPORT_SUMMARY_LABELS.get(request.query_params.get("lang"), EXPORT_SUMMARY_LABELS["ar"])
        working_days = _resolve_working_days(year, month)

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = f"{year}-{month:02d}"
        sheet.append(labels["columns"])

        employees = self.filter_queryset(self.get_queryset())
        for employee in employees:
            stats = _employee_month_stats(employee, year, month, work_start_time, working_days)
            sheet.append(
                [
                    f"{employee.first_name} {employee.last_name}".strip(),
                    labels["full_time"] if employee.is_regular else labels["part_time"],
                    stats["present_days"],
                    stats["absent_days"],
                    stats["late_minutes"],
                ]
            )

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            f"attachment; filename=attendance_summary_{year}_{month:02d}.xlsx"
        )
        workbook.save(response)
        return response


class AdminStatsOverviewView(APIView):
    """لوحة إحصائيات شاملة للأدمن خلال شهر محدَّد: ملخص عام، اتجاه الحضور اليومي، وأكثر الموظفين
    تأخيرًا وغيابًا. لا تُطبَّق عليها فلاتر — تغطي كل الموظفين دائمًا."""

    permission_classes = [IsAdminUser]

    @extend_schema(parameters=YEAR_MONTH_PARAMETERS, responses={200: AdminStatsOverviewSerializer})
    def get(self, request):
        year, month = _resolve_year_month(request)
        work_start_time = SystemSettings.get_solo().work_start_time
        working_days = _resolve_working_days(year, month)

        employees = list(User.objects.filter(is_employee=True).order_by("username"))
        total_employees = len(employees)
        regular_count = sum(1 for employee in employees if employee.is_regular)
        active_count = sum(1 for employee in employees if employee.is_active)

        total_present_days = 0
        total_absent_days = 0
        total_late_minutes = 0
        top_late = []
        top_absent = []

        for employee in employees:
            stats = _employee_month_stats(employee, year, month, work_start_time, working_days)
            total_present_days += stats["present_days"]
            total_absent_days += stats["absent_days"]
            total_late_minutes += stats["late_minutes"]
            name = f"{employee.first_name} {employee.last_name}".strip() or employee.username
            top_late.append({"id": employee.id, "name": name, "value": stats["late_minutes"]})
            top_absent.append({"id": employee.id, "name": name, "value": stats["absent_days"]})

        top_late.sort(key=lambda item: item["value"], reverse=True)
        top_absent.sort(key=lambda item: item["value"], reverse=True)

        daily_trend = list(
            Attendance.objects.filter(user__is_employee=True, date__year=year, date__month=month)
            .values("date")
            .annotate(present_count=Count("user", distinct=True))
            .order_by("date")
        )

        possible_present_days = total_employees * working_days
        attendance_rate = (
            round((total_present_days / possible_present_days) * 100, 1) if possible_present_days else 0.0
        )

        data = {
            "year": year,
            "month": month,
            "working_days": working_days,
            "total_employees": total_employees,
            "regular_count": regular_count,
            "irregular_count": total_employees - regular_count,
            "active_count": active_count,
            "suspended_count": total_employees - active_count,
            "entry_account_count": User.objects.filter(is_entry=True).count(),
            "attendance_rate": attendance_rate,
            "total_present_days": total_present_days,
            "total_absent_days": total_absent_days,
            "total_late_minutes": total_late_minutes,
            "daily_trend": daily_trend,
            "top_late": top_late[:5],
            "top_absent": top_absent[:5],
        }
        return Response(AdminStatsOverviewSerializer(data).data)


class EmployeeStatsView(APIView):
    """إحصائيات الحضور الشخصية للموظف الحالي (وحده) خلال شهر محدَّد."""

    permission_classes = [IsEmployeeUser]

    @extend_schema(parameters=YEAR_MONTH_PARAMETERS, responses={200: EmployeeStatsSerializer})
    def get(self, request):
        year, month = _resolve_year_month(request)
        work_start_time = SystemSettings.get_solo().work_start_time
        working_days = _resolve_working_days(year, month)

        stats = _employee_month_stats(request.user, year, month, work_start_time, working_days)
        present_days = stats["present_days"]
        on_time_days = sum(1 for minutes in stats["daily_late_minutes"].values() if minutes == 0)
        on_time_rate = round((on_time_days / present_days) * 100, 1) if present_days else 0.0

        data = {
            "year": year,
            "month": month,
            "working_days": working_days,
            "present_days": present_days,
            "absent_days": stats["absent_days"],
            "late_minutes": stats["late_minutes"],
            "on_time_rate": on_time_rate,
            "daily_late_minutes": [
                {"date": day, "late_minutes": minutes}
                for day, minutes in sorted(stats["daily_late_minutes"].items())
            ],
        }
        return Response(EmployeeStatsSerializer(data).data)


class EmployeeListView(generics.ListAPIView):
    queryset = User.objects.filter(is_employee=True).order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = USER_FILTERSET_FIELDS
    search_fields = USER_SEARCH_FIELDS


class EntryUserListView(generics.ListAPIView):
    queryset = User.objects.filter(is_entry=True).order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = USER_FILTERSET_FIELDS
    search_fields = USER_SEARCH_FIELDS


class EmployeeDetailView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(parameters=YEAR_MONTH_PARAMETERS, responses={200: EmployeeAttendanceSerializer})
    def get(self, request, pk):
        employee = get_object_or_404(User, pk=pk, is_employee=True)
        year, month = _resolve_year_month(request)
        attendance = Attendance.objects.filter(
            user=employee, date__year=year, date__month=month
        ).order_by("date")

        data = UserSerializer(employee).data
        data["attendance"] = AttendanceSerializer(attendance, many=True).data
        return Response(data)


class SystemSettingsView(APIView):
    """يدير الأدمن منها مدة صلاحية رمز QR — نفس المدة تُستخدم كفاصل التحديث التلقائي بالفرونت."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: SystemSettingsSerializer})
    def get(self, request):
        return Response(SystemSettingsSerializer(SystemSettings.get_solo()).data)

    @extend_schema(request=SystemSettingsSerializer, responses={200: SystemSettingsSerializer})
    def patch(self, request):
        serializer = SystemSettingsSerializer(
            SystemSettings.get_solo(), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
