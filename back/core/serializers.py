from accounts.serializers import UserSerializer
from rest_framework import serializers

from .models import Attendance, QRToken


class GenerateQRTokenSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=QRToken.Action.choices)
    device_id = serializers.CharField()


class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRToken
        fields = ["token", "action", "created_at", "expires_at", "is_active"]


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
    action = serializers.ChoiceField(choices=QRToken.Action.choices)


class YearMonthQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "date", "check_in", "check_out"]


class EmployeeAttendanceSerializer(UserSerializer):
    attendance = AttendanceSerializer(many=True, read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["attendance"]
