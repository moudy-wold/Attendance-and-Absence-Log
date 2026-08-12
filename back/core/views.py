import secrets
from datetime import timedelta

from accounts.permissions import IsAdminUser, IsEmployeeUser, IsEntryUser
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from openpyxl import Workbook
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendance, QRToken
from .serializers import (
    AttendanceSerializer,
    GenerateQRTokenSerializer,
    QRTokenSerializer,
    ScanQRSerializer,
)


class GenerateQRTokenView(APIView):
    permission_classes = [IsEntryUser]

    def post(self, request):
        serializer = GenerateQRTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_token = QRToken.objects.create(
            token=secrets.token_urlsafe(24),
            generated_by=request.user,
            action=serializer.validated_data["action"],
            expires_at=timezone.now()
            + timedelta(seconds=settings.QR_TOKEN_LIFETIME_SECONDS),
        )
        return Response(
            QRTokenSerializer(qr_token).data, status=status.HTTP_201_CREATED
        )


class ScanQRView(APIView):
    permission_classes = [IsEmployeeUser]

    def post(self, request):
        serializer = ScanQRSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_token = get_object_or_404(
            QRToken, token=serializer.validated_data["token"]
        )
        if not qr_token.is_valid():
            return Response(
                {"detail": "رمز QR منتهي الصلاحية أو غير فعّال."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verified = serializer.validated_data["verified"]
        attendance, _ = Attendance.objects.get_or_create(
            user=request.user, date=timezone.localdate()
        )

        if qr_token.action == QRToken.Action.CHECK_IN:
            if attendance.check_in:
                return Response(
                    {"detail": "تم تسجيل الحضور مسبقًا لهذا اليوم."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            attendance.check_in = timezone.now()
            attendance.checkin_verified = verified
        else:
            if not attendance.check_in:
                return Response(
                    {"detail": "لا يمكن تسجيل الانصراف قبل تسجيل الحضور."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if attendance.check_out:
                return Response(
                    {"detail": "تم تسجيل الانصراف مسبقًا لهذا اليوم."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            attendance.check_out = timezone.now()
            attendance.checkout_verified = verified

        attendance.qr_token = qr_token
        attendance.save()

        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)


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

    def get(self, request):
        today = timezone.localdate()
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))

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
                "تحقق الحضور",
                "تحقق الانصراف",
            ]
        )

        for record in records:
            sheet.append(
                [
                    record.user.full_name,
                    record.user.username,
                    record.date.isoformat(),
                    timezone.localtime(record.check_in).strftime("%H:%M:%S")
                    if record.check_in
                    else "",
                    timezone.localtime(record.check_out).strftime("%H:%M:%S")
                    if record.check_out
                    else "",
                    "نعم" if record.checkin_verified else "لا",
                    "نعم" if record.checkout_verified else "لا",
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
