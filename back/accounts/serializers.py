from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from core.models import SystemSettings

from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    device_id = serializers.CharField(required=False, allow_blank=True, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_admin"] = user.is_admin
        token["is_entry"] = user.is_entry
        token["is_employee"] = user.is_employee
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        if (
            self.user.is_employee
            and not self.user.is_regular
            and SystemSettings.get_solo().block_irregular_employees
        ):
            # نفس استثناء ورسالة "بيانات خاطئة" العادية بالضبط، عمدًا — حتى ما يعرف
            # الموظف المحظور إنه محظور تحديدًا، بدل رسالة "هذا الحساب غير مسموح له بالدخول".
            raise AuthenticationFailed(
                "No active account found with the given credentials", "no_active_account"
            )

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
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "type",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
            "is_active",
            "device_id",
            "is_first_login",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, validators=[validate_password]
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "password",
            "email",
            "first_name",
            "last_name",
            "phone",
            "type",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", "") or validated_data.get("phone")
        if not password:
            raise serializers.ValidationError(
                {"detail": "Either password or phone is required to create a user."}
            )
        username = self._generate_username(
            validated_data["first_name"], validated_data["last_name"]
        )
        user = User(username=username, **validated_data)
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def _generate_username(first_name: str, last_name: str) -> str:
        username = f"{first_name}.{last_name}".strip().lower().replace(" ", "")
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError(
                {"detail": "A user with this name already exists."}
            )
        return username


class UpdateUserSerializer(serializers.ModelSerializer):
    """يستخدمها الأدمن فقط (الفيو مقيّد بـ IsAdminUser) — لذا تضمين كلمة مرور هنا آمن،
    وهي منفصلة تمامًا عن ChangePasswordSerializer التي تخص المستخدم نفسه ذاتيًا."""

    password = serializers.CharField(
        write_only=True, required=False, allow_blank=False, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "type",
            "is_admin",
            "is_entry",
            "is_employee",
            "is_regular",
            "is_active",
            "device_id",
            "is_first_login",
            "password",
        ]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.is_first_login = True
            user.save(update_fields=["password", "is_first_login"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class MessageResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
