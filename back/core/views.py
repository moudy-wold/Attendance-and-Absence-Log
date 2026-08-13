import secrets
from datetime import timedelta

from accounts.models import User
from accounts.permissions import IsAdminUser, IsEmployeeUser, IsEntryUser
from accounts.serializers import UserSerializer
from django.db import IntegrityError, transaction
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
    AttendanceSerializer,
    EmployeeAttendanceSerializer,
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
