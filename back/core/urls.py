from django.urls import path

from .views import GenerateQRTokenView, MyAttendanceView, ScanQRView

urlpatterns = [
    path("qr/generate/", GenerateQRTokenView.as_view(), name="qr_generate"),
    path("attendance/scan/", ScanQRView.as_view(), name="attendance_scan"),
    path("attendance/my/", MyAttendanceView.as_view(), name="attendance_my"),
]
