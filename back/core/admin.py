from django.contrib import admin

from .models import Attendance, QRToken


@admin.register(QRToken)
class QRTokenAdmin(admin.ModelAdmin):
    list_display = ("token", "generated_by", "action", "created_at", "expires_at", "is_active")
    list_filter = ("action", "is_active")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "check_in", "check_out")
    list_filter = ("date",)
