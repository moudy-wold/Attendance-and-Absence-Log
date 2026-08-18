from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class UserPhoneUniquenessTests(APITestCase):
    def test_duplicate_phone_rejected(self):
        User.objects.create_user(username="u1", password="x", phone="0912345678")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(username="u2", password="x", phone="0912345678")

    def test_multiple_users_without_phone_allowed(self):
        User.objects.create_user(username="u1", password="x")
        User.objects.create_user(username="u2", password="x")
        self.assertEqual(User.objects.filter(phone__isnull=True).count(), 2)


class UserTcUniquenessTests(APITestCase):
    def test_duplicate_tc_rejected(self):
        User.objects.create_user(username="u1", password="x", tc="11111111111")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(username="u2", password="x", tc="11111111111")

    def test_multiple_users_without_tc_allowed(self):
        User.objects.create_user(username="u1", password="x")
        User.objects.create_user(username="u2", password="x")
        self.assertEqual(User.objects.filter(tc__isnull=True).count(), 2)


class RegisterViewTests(APITestCase):
    url = "/api/auth/register/"

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", password="Admin@12345", is_admin=True
        )
        self.client.force_authenticate(self.admin)

    def test_generates_username_from_first_last_name(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Ali",
                "last_name": "Hassan",
                "password": "StrongPass@123",
                "tc": "10000000001",
                "is_employee": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "ali.hassan")

    def test_duplicate_name_rejected(self):
        User.objects.create_user(username="ali.hassan", password="x", first_name="Ali", last_name="Hassan")
        response = self.client.post(
            self.url,
            {
                "first_name": "Ali",
                "last_name": "Hassan",
                "password": "StrongPass@123",
                "tc": "10000000002",
                "is_employee": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_first_and_last_name(self):
        response = self.client.post(
            self.url,
            {"password": "StrongPass@123", "tc": "10000000003", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)

    def test_requires_tc(self):
        response = self.client.post(
            self.url,
            {"first_name": "No", "last_name": "Tc", "password": "StrongPass@123", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tc", response.data)

    def test_password_falls_back_to_tc_when_omitted(self):
        response = self.client.post(
            self.url,
            {"first_name": "Sami", "last_name": "Nasser", "tc": "10000000004", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="sami.nasser")
        self.assertTrue(user.check_password("10000000004"))

    def test_explicit_password_ignores_tc(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Explicit",
                "last_name": "Pwd",
                "password": "StrongPass@999",
                "tc": "10000000005",
                "is_employee": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="explicit.pwd")
        self.assertTrue(user.check_password("StrongPass@999"))
        self.assertFalse(user.check_password("10000000005"))

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Weak",
                "last_name": "Pass",
                "password": "123",
                "tc": "10000000006",
                "is_employee": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_forbidden(self):
        employee = User.objects.create_user(username="emp", password="x", is_employee=True)
        self.client.force_authenticate(employee)
        response = self.client.post(
            self.url,
            {"first_name": "A", "last_name": "B", "password": "StrongPass@123", "tc": "10000000007"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_phone_rejected_by_register_api(self):
        User.objects.create_user(username="existing", password="x", phone="0912345678")
        response = self.client.post(
            self.url,
            {
                "first_name": "Dup",
                "last_name": "Phone",
                "password": "StrongPass@123",
                "phone": "0912345678",
                "tc": "10000000008",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_duplicate_tc_rejected_by_register_api(self):
        User.objects.create_user(username="existing2", password="x", tc="10000000009")
        response = self.client.post(
            self.url,
            {
                "first_name": "Dup",
                "last_name": "Tc",
                "password": "StrongPass@123",
                "tc": "10000000009",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tc", response.data)

    def test_new_user_defaults_is_first_login_true(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "First",
                "last_name": "Login",
                "password": "StrongPass@123",
                "tc": "10000000010",
                "is_employee": True,
            },
            format="json",
        )
        self.assertTrue(response.data["is_first_login"])


class LoginDeviceBindingTests(APITestCase):
    url = "/api/auth/login/"

    employee_tc = "20000000001"
    entry_tc = "20000000002"
    admin_tc = "20000000003"

    def setUp(self):
        self.employee = User.objects.create_user(
            username="employee1", password="Employee@12345", is_employee=True, tc=self.employee_tc
        )
        self.entry = User.objects.create_user(
            username="entry1", password="Entry@12345", is_entry=True, tc=self.entry_tc
        )
        self.admin = User.objects.create_superuser(
            username="admin", password="Admin@12345", is_admin=True, tc=self.admin_tc
        )

    def test_admin_login_without_device_id(self):
        response = self.client.post(
            self.url, {"username": self.admin_tc, "password": "Admin@12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_login_without_device_id_rejected(self):
        response = self.client.post(
            self.url, {"username": self.employee_tc, "password": "Employee@12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_first_login_binds_device(self):
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.device_id, "deviceA")

    def test_same_device_login_succeeds(self):
        self.employee.device_id = "deviceA"
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_different_device_login_rejected(self):
        self.employee.device_id = "deviceA"
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceB"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_entry_role_also_enforced(self):
        self.entry.device_id = "entryDeviceA"
        self.entry.save()
        response = self.client.post(
            self.url,
            {"username": self.entry_tc, "password": "Entry@12345", "device_id": "entryDeviceB"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_user_cannot_login(self):
        self.employee.is_active = False
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_irregular_employee_cannot_login(self):
        self.employee.is_regular = False
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        # 401 بنفس رسالة بيانات الدخول الخاطئة العادية — عمدًا لا يُميَّز هذا عن محاولة دخول
        # بكلمة مرور خاطئة، حتى لا يعرف الموظف المحظور إنه محظور تحديدًا.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "No active account found with the given credentials")

    def test_irregular_employee_can_login_when_block_disabled(self):
        from core.models import SystemSettings

        settings_obj = SystemSettings.get_solo()
        settings_obj.block_irregular_employees = False
        settings_obj.save()

        self.employee.is_regular = False
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": self.employee_tc, "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_irregular_entry_can_still_login(self):
        self.entry.is_regular = False
        self.entry.save()
        response = self.client.post(
            self.url,
            {"username": self.entry_tc, "password": "Entry@12345", "device_id": "entryDeviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_with_unknown_tc_rejected(self):
        response = self.client.post(
            self.url,
            {"username": "00000000000", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_login_with_username_rejected(self):
        response = self.client.post(
            self.url,
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_entry_login_with_username_rejected(self):
        response = self.client.post(
            self.url,
            {"username": "entry1", "password": "Entry@12345", "device_id": "entryDeviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_login_with_username_still_works(self):
        response = self.client.post(
            self.url, {"username": "admin", "password": "Admin@12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BlockIrregularEmployeesSwitchTests(APITestCase):
    """السويتش لا يمنع تسجيل الدخول فقط، بل يقطع وصول أي جلسة مفتوحة عندهم فورًا —
    حتى لو التوكن لسه صالح، يُرفض أول طلب جاي منهم لأي endpoint يخص الموظفين."""

    def setUp(self):
        self.employee = User.objects.create_user(
            username="irregular1", password="Employee@12345", is_employee=True, is_regular=False
        )
        self.client.force_authenticate(self.employee)

    def test_irregular_employee_request_rejected_when_block_enabled(self):
        from core.models import SystemSettings

        SystemSettings.get_solo()  # يضمن وجود الصف بقيمته الافتراضية (block=True)
        response = self.client.get("/api/attendance/my/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_irregular_employee_request_allowed_when_block_disabled(self):
        from core.models import SystemSettings

        settings_obj = SystemSettings.get_solo()
        settings_obj.block_irregular_employees = False
        settings_obj.save()

        response = self.client.get("/api/attendance/my/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UpdateUserViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="x", is_admin=True)
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)
        self.client.force_authenticate(self.admin)

    def test_admin_can_deactivate_user(self):
        response = self.client.patch(
            f"/api/auth/users/{self.employee.pk}/", {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.employee)
        response = self.client.patch(
            f"/api/auth/users/{self.employee.pk}/", {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reset_device_id(self):
        self.employee.device_id = "old"
        self.employee.is_first_login = False
        self.employee.save()
        response = self.client.patch(
            f"/api/auth/users/{self.employee.pk}/", {"device_id": None}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertIsNone(self.employee.device_id)
        self.assertFalse(self.employee.is_first_login)

    def test_admin_password_reset_forces_first_login(self):
        self.employee.is_first_login = False
        self.employee.save()
        response = self.client.patch(
            f"/api/auth/users/{self.employee.pk}/", {"password": "NewDefault@123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertTrue(self.employee.is_first_login)
        self.assertTrue(self.employee.check_password("NewDefault@123"))


class ChangePasswordViewTests(APITestCase):
    url = "/api/auth/change-password/"

    def setUp(self):
        self.user = User.objects.create_user(username="emp1", password="OldPass@123", is_employee=True)
        self.client.force_authenticate(self.user)

    def test_wrong_old_password_rejected(self):
        response = self.client.post(
            self.url, {"old_password": "wrong", "new_password": "NewPass@123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_change_clears_first_login(self):
        self.assertTrue(self.user.is_first_login)
        response = self.client.post(
            self.url, {"old_password": "OldPass@123", "new_password": "NewPass@123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_first_login)
        self.assertTrue(self.user.check_password("NewPass@123"))
