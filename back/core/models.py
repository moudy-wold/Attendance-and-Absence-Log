import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone


class Action(models.TextChoices):
    """نوع حدث الحضور، محسوب تلقائيًا من حالة الموظف — لا يُخزَّن على QRToken."""

    CHECK_IN = "check_in", "Check In"
    CHECK_OUT = "check_out", "Check Out"


class SystemSettings(models.Model):
    """صف وحيد (Singleton) يحمل إعدادات النظام القابلة للتعديل من الأدمن أثناء التشغيل."""

    qr_token_lifetime_seconds = models.PositiveIntegerField(
        default=15,
        help_text="مدة صلاحية رمز QR بالثواني — نفس المدة تُستخدم كفاصل التحديث التلقائي في شاشة الدخول",
    )
    min_session_duration_seconds = models.PositiveIntegerField(
        default=60,
        help_text="أقل مدة مسموحة بين تسجيل الدخول والخروج لنفس الجلسة — يمنع تسجيل خروج فوري بعد الدخول مباشرة",
    )
    work_start_time = models.TimeField(
        default=datetime.time(9, 0),
        help_text="وقت بدء الدوام الرسمي — يُستخدم لحساب دقائق التأخير في التقارير",
    )
    work_end_time = models.TimeField(
        default=datetime.time(17, 0),
        help_text="وقت انتهاء الدوام الرسمي — يُستخدم لحساب دقائق الانصراف المبكر في التقارير",
    )

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return "System Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls) -> "SystemSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class QRToken(models.Model):
    token = models.CharField(max_length=64, unique=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="generated_tokens"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def is_valid(self):
        return self.is_active and timezone.now() <= self.expires_at

    def __str__(self):
        return self.token


class Attendance(models.Model):
    """سجل جلسة حضور واحدة (دخول وخروج). يمكن أن يملك الموظف عدة جلسات بنفس اليوم."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_records"
    )
    qr_token = models.ForeignKey(
        QRToken,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_records",
    )
    date = models.DateField(default=timezone.localdate)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-check_in"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"],
                condition=models.Q(check_out__isnull=True),
                name="one_open_session_per_user_per_day",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.date}"
