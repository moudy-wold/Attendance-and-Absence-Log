from django.urls import path

from .views import (
    AdminStatsOverviewView,
    EmployeeDetailView,
    EmployeeExportAttendanceView,
    EmployeeListView,
    EntryUserListView,
    MonthlyAttendanceSummaryExportView,
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
    path(
        "attendance/summary-export/",
        MonthlyAttendanceSummaryExportView.as_view(),
        name="attendance_summary_export",
    ),
    path("entry-users/", EntryUserListView.as_view(), name="entry_user_list"),
    path("settings/", SystemSettingsView.as_view(), name="system_settings"),
    path("stats/overview/", AdminStatsOverviewView.as_view(), name="admin_stats_overview"),
]
