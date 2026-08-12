from rest_framework import serializers

from .models import Attendance, QRToken


class GenerateQRTokenSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=QRToken.Action.choices)


class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRToken
        fields = ["token", "action", "created_at", "expires_at", "is_active"]


class ScanQRSerializer(serializers.Serializer):
    token = serializers.CharField()
    verified = serializers.BooleanField()


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = [
            "id",
            "date",
            "check_in",
            "check_out",
            "checkin_verified",
            "checkout_verified",
        ]
