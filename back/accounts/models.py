from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    type = models.CharField(
        max_length=50, null=True, blank=True, help_text="نوع الدوام"
    )
    tc = models.CharField(
        max_length=11, unique=True, null=True, blank=True, help_text="الرقم الوطني (TC)"
    )
    entity = models.CharField(
        max_length=255, null=True, blank=True, help_text="الجهة التي يتبع لها الموظف"
    )

    is_admin = models.BooleanField(default=False)
    is_entry = models.BooleanField(default=False)
    is_employee = models.BooleanField(default=False)
    is_regular = models.BooleanField(default=True)
    device_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="معرّف الجهاز المرتبط بالحساب — يُضبط تلقائيًا أول استخدام",
    )
    is_first_login = models.BooleanField(
        default=True, help_text="يصبح False بعد أول تغيير لكلمة المرور"
    )

    def save(self, *args, **kwargs):
        self.phone = self.phone or None
        self.type = self.type or None
        self.tc = self.tc or None
        self.entity = self.entity or None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
