from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.accounts.models import Role, User
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
