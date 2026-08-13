from django.urls import path

from .views import (
    EmployeeStatsView,
    GenerateQRTokenView,
    MyAttendanceView,
    RecordAttendanceView,
    ValidateQRView,
)

urlpatterns = [
    path("qr/generate/", GenerateQRTokenView.as_view(), name="qr_generate"),
    path("qr/validate/", ValidateQRView.as_view(), name="qr_validate"),
    path("attendance/record/", RecordAttendanceView.as_view(), name="attendance_record"),
    path("attendance/my/", MyAttendanceView.as_view(), name="attendance_my"),
    path("attendance/stats/", EmployeeStatsView.as_view(), name="attendance_stats"),
]
