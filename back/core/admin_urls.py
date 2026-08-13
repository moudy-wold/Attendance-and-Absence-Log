from django.urls import path

from .views import (
    EmployeeDetailView,
    EmployeeExportAttendanceView,
    EmployeeListView,
    SystemSettingsView,
)

urlpatterns = [
    path("employees/", EmployeeListView.as_view(), name="employee_list"),
    path("employees/<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),
    path(
        "employees/<int:pk>/export/",
        EmployeeExportAttendanceView.as_view(),
        name="employee_attendance_export",
    ),
    path("settings/", SystemSettingsView.as_view(), name="system_settings"),
]
