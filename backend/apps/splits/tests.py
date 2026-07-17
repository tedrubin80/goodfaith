from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.catalog.models import Artist, Label, LabelMembership, Release, ReleaseType, Track

from .models import SplitRole, SplitSheet

User = get_user_model()


class SplitAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Split Label", slug="split-label")
        self.manager = User.objects.create_user(
            username="splitmgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)
        satisfy_mandatory_2fa(self.manager)
        self.ar_user = User.objects.create_user(
            username="splitar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)
        self.artist_user = User.objects.create_user(
            username="splitartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Main Artist",
            slug="main-artist",
            user=self.artist_user,
        )
        release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Split Release",
            release_type=ReleaseType.SINGLE,
        )
        self.track = Track.objects.create(
            release=release,
            title="Split Track",
            isrc="USRC17607839",
            track_number=1,
        )
        self.client = APIClient()

    def test_manager_can_create_split_sheet(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/splits/sheets/",
            {
                "track": self.track.pk,
                "status": "finalized",
                "entries": [
                    {
                        "participant_name": "Main Artist",
                        "artist": self.artist.pk,
                        "role": SplitRole.ARTIST,
                        "percentage": "70.00",
                    },
                    {
                        "participant_name": "Producer Co",
                        "role": SplitRole.PRODUCER,
                        "percentage": "30.00",
                    },
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        sheet = SplitSheet.objects.get()
        self.assertEqual(sheet.entries.count(), 2)
        self.assertEqual(sheet.total_percentage, Decimal("100"))

    def test_finalized_sheet_must_total_100(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/splits/sheets/",
            {
                "track": self.track.pk,
                "status": "finalized",
                "entries": [
                    {
                        "participant_name": "Main Artist",
                        "role": SplitRole.ARTIST,
                        "percentage": "60.00",
                    },
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_ar_cannot_access_splits(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.get("/api/splits/sheets/")
        self.assertEqual(response.status_code, 403)

    def test_artist_can_read_own_track_splits(self):
        SplitSheet.objects.create(track=self.track, status="finalized")
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/splits/sheets/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
