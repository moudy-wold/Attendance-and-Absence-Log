from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    device_id = serializers.CharField(required=False, allow_blank=True, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["full_name"] = user.full_name
        token["is_admin"] = user.is_admin
        token["is_entry"] = user.is_entry
        token["is_employee"] = user.is_employee
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.is_employee or self.user.is_entry:
            device_id = attrs.get("device_id")
            if not device_id:
                raise serializers.ValidationError(
                    {"device_id": "This field is required."}
                )
            self._check_device(device_id)

        data["user"] = UserSerializer(self.user).data
        return data

    def _check_device(self, device_id: str) -> None:
        """يربط الجهاز أول مرة، ويرفض تسجيل الدخول لاحقًا من أي جهاز آخر."""
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=self.user.pk)
            if not user.device_id:
                user.device_id = device_id
                user.save(update_fields=["device_id"])
            elif user.device_id != device_id:
                raise serializers.ValidationError(
                    {
                        "device_id": "This account is bound to a different device. "
                        "Contact an administrator to reset it."
                    }
                )
        self.user.device_id = user.device_id


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
            "is_active",
            "device_id",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
            "is_active",
            "device_id",
        ]
