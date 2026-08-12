from django.urls import path

from .views import ExportAttendanceView

urlpatterns = [
    path("attendance/export/", ExportAttendanceView.as_view(), name="attendance_export"),
]
