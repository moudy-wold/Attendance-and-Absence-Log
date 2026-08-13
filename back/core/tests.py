from datetime import timedelta

from accounts.models import User
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Attendance, QRToken, SystemSettings


class GenerateQRTokenTests(APITestCase):
    url = "/api/qr/generate/"

    def setUp(self):
        self.entry = User.objects.create_user(username="entry1", password="x", is_entry=True)
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)

    def test_entry_can_generate(self):
        self.client.force_authenticate(self.entry)
        response = self.client.post(self.url, {"action": "check_in"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)

    def test_employee_cannot_generate(self):
        self.client.force_authenticate(self.employee)
        response = self.client.post(self.url, {"action": "check_in"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_uses_system_settings_lifetime(self):
        settings_obj = SystemSettings.get_solo()
        settings_obj.qr_token_lifetime_seconds = 30
        settings_obj.save()

        self.client.force_authenticate(self.entry)
        response = self.client.post(self.url, {"action": "check_in"}, format="json")
        token = QRToken.objects.get(token=response.data["token"])
        delta = (token.expires_at - token.created_at).total_seconds()
        self.assertAlmostEqual(delta, 30, delta=1)


class ValidateQRTests(APITestCase):
    url = "/api/qr/validate/"

    def setUp(self):
        self.entry = User.objects.create_user(username="entry1", password="x", is_entry=True)
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)
        self.client.force_authenticate(self.employee)

    def _make_token(self, expired=False):
        return QRToken.objects.create(
            token="tok123",
            generated_by=self.entry,
            action=QRToken.Action.CHECK_IN,
            expires_at=timezone.now() + (timedelta(seconds=-1) if expired else timedelta(seconds=15)),
        )

    def test_valid_token(self):
        self._make_token()
        response = self.client.post(self.url, {"token": "tok123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["valid"])

    def test_nonexistent_token(self):
        response = self.client.post(self.url, {"token": "nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_token(self):
        self._make_token(expired=True)
        response = self.client.post(self.url, {"token": "tok123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RecordAttendanceTests(APITestCase):
    url = "/api/attendance/record/"

    def setUp(self):
        self.entry = User.objects.create_user(username="entry1", password="x", is_entry=True)
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)
        self.client.force_authenticate(self.employee)

    def _token(self, action):
        return QRToken.objects.create(
            token=f"tok-{action}-{timezone.now().timestamp()}",
            generated_by=self.entry,
            action=action,
            expires_at=timezone.now() + timedelta(seconds=15),
        )

    def test_check_out_before_check_in_rejected(self):
        token = self._token(QRToken.Action.CHECK_OUT)
        response = self.client.post(self.url, {"token": token.token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_in_success(self):
        token = self._token(QRToken.Action.CHECK_IN)
        response = self.client.post(self.url, {"token": token.token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["check_in"])
        self.assertIsNone(response.data["check_out"])

    def test_duplicate_check_in_rejected(self):
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json")
        response = self.client.post(
            self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_out_closes_session(self):
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json")
        response = self.client.post(
            self.url, {"token": self._token(QRToken.Action.CHECK_OUT).token}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["check_out"])

    def test_duplicate_check_out_rejected(self):
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json")
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_OUT).token}, format="json")
        response = self.client.post(
            self.url, {"token": self._token(QRToken.Action.CHECK_OUT).token}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_multiple_sessions_same_day_allowed(self):
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json")
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_OUT).token}, format="json")
        self.client.post(self.url, {"token": self._token(QRToken.Action.CHECK_IN).token}, format="json")
        response = self.client.post(
            self.url, {"token": self._token(QRToken.Action.CHECK_OUT).token}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Attendance.objects.filter(user=self.employee, date=timezone.localdate()).count(), 2
        )

    def test_two_open_sessions_blocked_at_database_level(self):
        Attendance.objects.create(user=self.employee, date=timezone.localdate(), check_in=timezone.now())
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Attendance.objects.create(
                    user=self.employee, date=timezone.localdate(), check_in=timezone.now()
                )

    def test_entry_role_cannot_record(self):
        self.client.force_authenticate(self.entry)
        token = self._token(QRToken.Action.CHECK_IN)
        response = self.client.post(self.url, {"token": token.token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MyAttendanceTests(APITestCase):
    url = "/api/attendance/my/"

    def setUp(self):
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)
        self.other = User.objects.create_user(username="emp2", password="x", is_employee=True)
        self.client.force_authenticate(self.employee)

    def test_shows_only_current_month(self):
        today = timezone.localdate()
        last_month = today.replace(day=1) - timedelta(days=1)
        Attendance.objects.create(user=self.employee, date=today, check_in=timezone.now())
        Attendance.objects.create(
            user=self.employee, date=last_month, check_in=timezone.now(), check_out=timezone.now()
        )
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 1)

    def test_isolated_per_user(self):
        Attendance.objects.create(user=self.other, date=timezone.localdate(), check_in=timezone.now())
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 0)


class EmployeeAdminViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="x", is_admin=True)
        self.employee = User.objects.create_user(
            username="emp1", password="x", is_employee=True, first_name="Test", last_name="Employee"
        )
        self.entry = User.objects.create_user(username="entry1", password="x", is_entry=True)
        self.client.force_authenticate(self.admin)

    def test_list_shows_employees_only(self):
        response = self.client.get("/api/admin/employees/")
        usernames = [u["username"] for u in response.data]
        self.assertIn("emp1", usernames)
        self.assertNotIn("entry1", usernames)

    def test_detail_includes_attendance(self):
        Attendance.objects.create(user=self.employee, date=timezone.localdate(), check_in=timezone.now())
        response = self.client.get(f"/api/admin/employees/{self.employee.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["attendance"]), 1)

    def test_detail_404_for_non_employee(self):
        response = self.client.get(f"/api/admin/employees/{self.entry.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get("/api/admin/employees/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ExportAttendanceTests(APITestCase):
    url = "/api/admin/attendance/export/"

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="x", is_admin=True)
        self.client.force_authenticate(self.admin)

    def test_export_succeeds(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    def test_invalid_year_returns_400_not_500(self):
        response = self.client.get(self.url, {"year": "abc"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_out_of_range_month_rejected(self):
        response = self.client.get(self.url, {"month": 13})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SystemSettingsTests(APITestCase):
    url = "/api/admin/settings/"

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="x", is_admin=True)
        self.employee = User.objects.create_user(username="emp1", password="x", is_employee=True)

    def test_default_value(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.data["qr_token_lifetime_seconds"], 15)

    def test_admin_can_update(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(self.url, {"qr_token_lifetime_seconds": 30}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(SystemSettings.get_solo().qr_token_lifetime_seconds, 30)

    def test_out_of_range_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(self.url, {"qr_token_lifetime_seconds": 3000}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
