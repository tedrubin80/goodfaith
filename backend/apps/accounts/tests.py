from io import StringIO

import pyotp
from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.accounts.two_factor import create_pending_2fa_token
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track


class SeedLabelCommandTests(TestCase):
    def test_seed_label_creates_manager_and_label(self):
        out = StringIO()
        call_command(
            "seed_label",
            label_name="Seed Test Label",
            manager_username="seedmanager",
            manager_password="testpass123",
            stdout=out,
        )
        label = Label.objects.get(slug="seed-test-label")
        user = User.objects.get(username="seedmanager")
        self.assertEqual(user.role, Role.MANAGER)
        self.assertTrue(LabelMembership.objects.filter(user=user, label=label).exists())

    def test_seed_label_demo_catalog(self):
        call_command(
            "seed_label",
            label_name="Demo Label",
            manager_username="demomgr",
            manager_password="testpass123",
            demo=True,
        )
        self.assertEqual(Artist.objects.count(), 1)
        self.assertEqual(Release.objects.count(), 1)
        self.assertEqual(Track.objects.count(), 1)


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class TwoFactorAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="finance1",
            password="testpass123",
            role=Role.FINANCE,
        )
        self.label = Label.objects.create(name="Test Label", slug="test-label")
        LabelMembership.objects.create(user=self.user, label=self.label)

    def test_login_without_2fa_issues_token(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "finance1", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertFalse(response.data["user"]["is_2fa_enabled"])
        self.assertTrue(response.data["user"]["must_enable_2fa"])

    def test_setup_and_confirm_2fa(self):
        self.client.force_authenticate(user=self.user)
        setup = self.client.post("/api/auth/2fa/setup/", format="json")
        self.assertEqual(setup.status_code, 200)
        secret = setup.data["secret"]
        code = pyotp.TOTP(secret).now()
        confirm = self.client.post("/api/auth/2fa/confirm/", {"code": code}, format="json")
        self.assertEqual(confirm.status_code, 200)
        self.assertEqual(len(confirm.data["backup_codes"]), 10)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_2fa_enabled)

    def test_login_with_2fa_requires_second_step(self):
        secret = pyotp.random_base32()
        self.user.totp_secret = secret
        self.user.is_2fa_enabled = True
        self.user.backup_codes = [make_password("ABCD1234")]
        self.user.save()

        response = self.client.post(
            "/api/auth/login/",
            {"username": "finance1", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["requires_2fa"])
        self.assertNotIn("token", response.data)

        verify = self.client.post(
            "/api/auth/2fa/verify/",
            {
                "pending_token": response.data["pending_token"],
                "code": pyotp.TOTP(secret).now(),
            },
            format="json",
        )
        self.assertEqual(verify.status_code, 200)
        self.assertIn("token", verify.data)

    def test_mandatory_2fa_blocks_royalties_until_enabled(self):
        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.get("/api/royalties/statements/")
        self.assertEqual(response.status_code, 403)

        secret = pyotp.random_base32()
        self.user.totp_secret = secret
        self.user.is_2fa_enabled = True
        self.user.save()
        response = self.client.get("/api/royalties/statements/")
        self.assertEqual(response.status_code, 200)

    def test_backup_code_login_consumes_code(self):
        secret = pyotp.random_base32()
        backup_code = "ABCD1234"
        self.user.totp_secret = secret
        self.user.is_2fa_enabled = True
        self.user.backup_codes = [make_password(backup_code)]
        self.user.save()

        pending = create_pending_2fa_token(self.user.pk)
        verify = self.client.post(
            "/api/auth/2fa/verify/",
            {"pending_token": pending, "code": backup_code},
            format="json",
        )
        self.assertEqual(verify.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.backup_codes, [])

    def test_change_password_invalidates_tokens(self):
        user = User.objects.create_user(
            username="passuser",
            password="oldpass123",
            role=Role.ARTIST,
        )
        token, _ = Token.objects.get_or_create(user=user)
        self.client.force_authenticate(user=user)
        response = self.client.post(
            "/api/auth/password/",
            {"current_password": "oldpass123", "new_password": "newpass456"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass456"))
        self.assertFalse(Token.objects.filter(key=token.key).exists())
