from django.urls import path

from .views import (
    EmployeeDetailView,
    EmployeeListView,
    ExportAttendanceView,
    SystemSettingsView,
)

urlpatterns = [
    path("attendance/export/", ExportAttendanceView.as_view(), name="attendance_export"),
    path("employees/", EmployeeListView.as_view(), name="employee_list"),
    path("employees/<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),
    path("settings/", SystemSettingsView.as_view(), name="system_settings"),
]
