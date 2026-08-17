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
            {"first_name": "Ali", "last_name": "Hassan", "password": "StrongPass@123", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "ali.hassan")

    def test_duplicate_name_rejected(self):
        User.objects.create_user(username="ali.hassan", password="x", first_name="Ali", last_name="Hassan")
        response = self.client.post(
            self.url,
            {"first_name": "Ali", "last_name": "Hassan", "password": "StrongPass@123", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_first_and_last_name(self):
        response = self.client.post(
            self.url, {"password": "StrongPass@123", "is_employee": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)

    def test_password_falls_back_to_phone_when_omitted(self):
        response = self.client.post(
            self.url,
            {"first_name": "Sami", "last_name": "Nasser", "phone": "0912345678", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="sami.nasser")
        self.assertTrue(user.check_password("0912345678"))

    def test_rejects_when_no_password_and_no_phone(self):
        response = self.client.post(
            self.url, {"first_name": "No", "last_name": "Phone", "is_employee": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_explicit_password_ignores_phone(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Explicit",
                "last_name": "Pwd",
                "password": "StrongPass@999",
                "phone": "0999999999",
                "is_employee": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="explicit.pwd")
        self.assertTrue(user.check_password("StrongPass@999"))
        self.assertFalse(user.check_password("0999999999"))

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url,
            {"first_name": "Weak", "last_name": "Pass", "password": "123", "is_employee": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_forbidden(self):
        employee = User.objects.create_user(username="emp", password="x", is_employee=True)
        self.client.force_authenticate(employee)
        response = self.client.post(
            self.url, {"first_name": "A", "last_name": "B", "password": "StrongPass@123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_phone_rejected_by_register_api(self):
        User.objects.create_user(username="existing", password="x", phone="0912345678")
        response = self.client.post(
            self.url,
            {"first_name": "Dup", "last_name": "Phone", "password": "StrongPass@123", "phone": "0912345678"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_new_user_defaults_is_first_login_true(self):
        response = self.client.post(
            self.url,
            {"first_name": "First", "last_name": "Login", "password": "StrongPass@123", "is_employee": True},
            format="json",
        )
        self.assertTrue(response.data["is_first_login"])


class LoginDeviceBindingTests(APITestCase):
    url = "/api/auth/login/"

    def setUp(self):
        self.employee = User.objects.create_user(
            username="employee1", password="Employee@12345", is_employee=True
        )
        self.entry = User.objects.create_user(username="entry1", password="Entry@12345", is_entry=True)
        self.admin = User.objects.create_superuser(username="admin", password="Admin@12345", is_admin=True)

    def test_admin_login_without_device_id(self):
        response = self.client.post(
            self.url, {"username": "admin", "password": "Admin@12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_login_without_device_id_rejected(self):
        response = self.client.post(
            self.url, {"username": "employee1", "password": "Employee@12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_first_login_binds_device(self):
        response = self.client.post(
            self.url,
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceA"},
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
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_different_device_login_rejected(self):
        self.employee.device_id = "deviceA"
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceB"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_entry_role_also_enforced(self):
        self.entry.device_id = "entryDeviceA"
        self.entry.save()
        response = self.client.post(
            self.url,
            {"username": "entry1", "password": "Entry@12345", "device_id": "entryDeviceB"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_user_cannot_login(self):
        self.employee.is_active = False
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_irregular_employee_cannot_login(self):
        self.employee.is_regular = False
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": "employee1", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_irregular_entry_can_still_login(self):
        self.entry.is_regular = False
        self.entry.save()
        response = self.client.post(
            self.url,
            {"username": "entry1", "password": "Entry@12345", "device_id": "entryDeviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_with_phone_number(self):
        self.employee.phone = "0991655832"
        self.employee.save()
        response = self.client.post(
            self.url,
            {"username": "0991655832", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["username"], "employee1")

    def test_login_with_unknown_phone_rejected(self):
        response = self.client.post(
            self.url,
            {"username": "0000000000", "password": "Employee@12345", "device_id": "deviceA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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
