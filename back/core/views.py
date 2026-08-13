import secrets
from datetime import timedelta

from accounts.models import User
from accounts.permissions import IsAdminUser, IsEmployeeUser, IsEntryUser
from accounts.serializers import UserSerializer
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from openpyxl import Workbook
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendance, QRToken, SystemSettings
from .serializers import (
    AttendanceSerializer,
    EmployeeAttendanceSerializer,
    GenerateQRTokenSerializer,
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
    permission_classes = [IsEntryUser]

    @extend_schema(request=GenerateQRTokenSerializer, responses={201: QRTokenSerializer})
    def post(self, request):
        serializer = GenerateQRTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lifetime_seconds = SystemSettings.get_solo().qr_token_lifetime_seconds
        qr_token = QRToken.objects.create(
            token=secrets.token_urlsafe(24),
            generated_by=request.user,
            action=serializer.validated_data["action"],
            expires_at=timezone.now() + timedelta(seconds=lifetime_seconds),
        )
        return Response(
            QRTokenSerializer(qr_token).data, status=status.HTTP_201_CREATED
        )


class ValidateQRView(APIView):
    """يتحقق فقط من أن الرمز موجود وسارٍ، بدون أي أثر جانبي — يُستدعى قبل طلب البصمة."""

    permission_classes = [IsEmployeeUser]

    @extend_schema(request=QRTokenInputSerializer, responses={200: ValidateQRResponseSerializer})
    def post(self, request):
        serializer = QRTokenInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr_token = serializer.validated_data["token"]

        return Response({"valid": True, "action": qr_token.action})


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
    """يغلق آخر جلسة مفتوحة لهذا الموظف اليوم. select_for_update تمنع إغلاق نفس الجلسة مرتين بالتزامن."""
    with transaction.atomic():
        attendance = (
            Attendance.objects.select_for_update()
            .filter(user=user, date=timezone.localdate(), check_out__isnull=True)
            .first()
        )
        if attendance is None:
            return None, "Cannot check out before checking in."

        attendance.check_out = timezone.now()
        attendance.qr_token = qr_token
        attendance.save()
    return attendance, None


class RecordAttendanceView(APIView):
    """يحفظ الحضور/الانصراف فعليًا — يُستدعى بعد نجاح البصمة محليًا فقط."""

    permission_classes = [IsEmployeeUser]

    @extend_schema(request=QRTokenInputSerializer, responses={200: AttendanceSerializer})
    def post(self, request):
        serializer = QRTokenInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr_token = serializer.validated_data["token"]

        if qr_token.action == QRToken.Action.CHECK_IN:
            attendance, error = _check_in(request.user, qr_token)
        else:
            attendance, error = _check_out(request.user, qr_token)

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


class ExportAttendanceView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(parameters=YEAR_MONTH_PARAMETERS, responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        year, month = _resolve_year_month(request)

        records = (
            Attendance.objects.filter(
                date__year=year, date__month=month, user__is_employee=True
            )
            .select_related("user")
            .order_by("user__username", "date")
        )

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = f"{year}-{month:02d}"
        sheet.append(
            [
                "اسم الموظف",
                "اسم المستخدم",
                "التاريخ",
                "وقت الحضور",
                "وقت الانصراف",
            ]
        )

        for record in records:
            sheet.append(
                [
                    f"{record.user.first_name} {record.user.last_name}".strip(),
                    record.user.username,
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
            f"attachment; filename=attendance_{year}_{month:02d}.xlsx"
        )
        workbook.save(response)
        return response


class EmployeeListView(generics.ListAPIView):
    queryset = User.objects.filter(is_employee=True).order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


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
