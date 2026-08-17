from accounts.serializers import UserSerializer
from rest_framework import serializers

from .models import Action, Attendance, QRToken, SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    qr_token_lifetime_seconds = serializers.IntegerField(min_value=5, max_value=300)
    min_session_duration_seconds = serializers.IntegerField(min_value=0, max_value=3600)

    class Meta:
        model = SystemSettings
        fields = [
            "qr_token_lifetime_seconds",
            "min_session_duration_seconds",
            "work_start_time",
            "work_end_time",
            "block_irregular_employees",
        ]


class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRToken
        fields = ["token", "created_at", "expires_at", "is_active"]


class QRTokenInputSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        """يستبدل نص الرمز بكائن QRToken المتحقق منه، ليستخدمه الـ view مباشرة."""
        try:
            qr_token = QRToken.objects.get(token=value)
        except QRToken.DoesNotExist:
            raise serializers.ValidationError("Invalid QR code.")
        if not qr_token.is_valid():
            raise serializers.ValidationError("This QR code has expired or is inactive.")
        return qr_token


class ValidateQRResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    action = serializers.ChoiceField(choices=Action.choices)


class YearMonthQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "date", "check_in", "check_out"]


class EmployeeAttendanceSerializer(UserSerializer):
    attendance = AttendanceSerializer(many=True, read_only=True)
    present_days = serializers.IntegerField(read_only=True)
    absent_days = serializers.IntegerField(read_only=True)
    late_minutes = serializers.IntegerField(read_only=True)
    early_leave_minutes = serializers.IntegerField(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            "attendance",
            "present_days",
            "absent_days",
            "late_minutes",
            "early_leave_minutes",
        ]


class DailyAttendanceCountSerializer(serializers.Serializer):
    date = serializers.DateField()
    present_count = serializers.IntegerField()


class TopEmployeeStatSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    value = serializers.IntegerField()


class AdminStatsOverviewSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    month = serializers.IntegerField()
    working_days = serializers.IntegerField()
    total_employees = serializers.IntegerField()
    regular_count = serializers.IntegerField()
    irregular_count = serializers.IntegerField()
    active_count = serializers.IntegerField()
    suspended_count = serializers.IntegerField()
    entry_account_count = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    total_present_days = serializers.IntegerField()
    total_absent_days = serializers.IntegerField()
    total_late_minutes = serializers.IntegerField()
    total_early_leave_minutes = serializers.IntegerField()
    daily_trend = DailyAttendanceCountSerializer(many=True)
    top_late = TopEmployeeStatSerializer(many=True)
    top_absent = TopEmployeeStatSerializer(many=True)
    top_early_leave = TopEmployeeStatSerializer(many=True)


class DailyLateMinutesSerializer(serializers.Serializer):
    date = serializers.DateField()
    late_minutes = serializers.IntegerField()


class DailyEarlyLeaveMinutesSerializer(serializers.Serializer):
    date = serializers.DateField()
    early_leave_minutes = serializers.IntegerField()


class EmployeeStatsSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    month = serializers.IntegerField()
    working_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_minutes = serializers.IntegerField()
    early_leave_minutes = serializers.IntegerField()
    on_time_rate = serializers.FloatField()
    daily_late_minutes = DailyLateMinutesSerializer(many=True)
    daily_early_leave_minutes = DailyEarlyLeaveMinutesSerializer(many=True)
