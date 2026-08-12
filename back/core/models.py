from django.conf import settings
from django.db import models
from django.utils import timezone


class QRToken(models.Model):
    class Action(models.TextChoices):
        CHECK_IN = "check_in", "Check In"
        CHECK_OUT = "check_out", "Check Out"

    token = models.CharField(max_length=64, unique=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="generated_tokens"
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def is_valid(self):
        return self.is_active and timezone.now() <= self.expires_at

    def __str__(self):
        return f"{self.token} ({self.action})"


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
