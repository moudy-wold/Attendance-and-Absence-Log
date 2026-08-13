from django.contrib import admin

from .models import Attendance, QRToken, SystemSettings


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ("qr_token_lifetime_seconds", "min_session_duration_seconds")

    def has_add_permission(self, request):
        return not SystemSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(QRToken)
class QRTokenAdmin(admin.ModelAdmin):
    list_display = ("token", "generated_by", "created_at", "expires_at", "is_active")
    list_filter = ("is_active",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "check_in", "check_out")
    list_filter = ("date",)
