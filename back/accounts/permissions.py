from rest_framework.permissions import BasePermission

from core.models import SystemSettings


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsEntryUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_entry)


class IsEmployeeUser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_employee):
            return False
        if not user.is_regular and SystemSettings.get_solo().block_irregular_employees:
            # يرفض حتى الطلبات بتوكن لسه صالح — هيك تفعيل السويتش يقطع وصول الموظفين غير
            # النظاميين فورًا، مو بس يمنع تسجيل دخول جديد.
            return False
        return True
