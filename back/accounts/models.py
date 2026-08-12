from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)

    is_admin = models.BooleanField(default=False)
    is_entry = models.BooleanField(default=False)
    is_employee = models.BooleanField(default=False)
    is_regular = models.BooleanField(
        default=True, help_text="True = دوام كامل، False = دوام جزئي"
    )
    device_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="معرّف الجهاز المرتبط بالحساب — يُضبط تلقائيًا أول استخدام",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def __str__(self):
        return self.full_name
