from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

UserModel = get_user_model()


class NationalIdBackend(ModelBackend):
    """يسمح بتسجيل الدخول عبر الرقم الوطني (tc) لكل المستخدمين، مع استثناء واحد: حسابات
    الأدمن (is_admin=True) يمكنها الدخول أيضًا باسم المستخدم كبديل عن tc."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if username is None or password is None:
            return None
        try:
            user = UserModel._default_manager.get(tc=username)
        except UserModel.DoesNotExist:
            try:
                user = UserModel._default_manager.get(username=username, is_admin=True)
            except UserModel.DoesNotExist:
                UserModel().set_password(password)
                return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
