from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "type",
        "is_admin",
        "is_entry",
        "is_employee",
        "is_regular",
        "is_active",
    )
    fieldsets = UserAdmin.fieldsets + (
        (
            "Attendance roles",
            {
                "fields": (
                    "phone",
                    "type",
                    "is_admin",
                    "is_entry",
                    "is_employee",
                    "is_regular",
                )
            },
        ),
    )
