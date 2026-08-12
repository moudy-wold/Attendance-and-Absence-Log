from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "full_name",
        "email",
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
                    "is_admin",
                    "is_entry",
                    "is_employee",
                    "is_regular",
                )
            },
        ),
    )
