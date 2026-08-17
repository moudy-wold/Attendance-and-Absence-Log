from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

UserModel = get_user_model()


class PhoneOrUsernameBackend(ModelBackend):
    """يسمح بتسجيل الدخول عبر اسم المستخدم أو رقم الهاتف في نفس الحقل."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if username is None or password is None:
            return None
        try:
            user = UserModel._default_manager.get(
                Q(username=username) | Q(phone=username)
            )
        except UserModel.DoesNotExist:
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            user = (
                UserModel._default_manager.filter(Q(username=username) | Q(phone=username))
                .order_by("pk")
                .first()
            )
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
