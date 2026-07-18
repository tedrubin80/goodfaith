from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track

from .models import SyncMediaType, SyncOpportunity, SyncStatus

User = get_user_model()


class SyncOpportunityAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Sync Label", slug="sync-label")
        self.manager = User.objects.create_user(
            username="syncmgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.ar_user = User.objects.create_user(
            username="syncar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.finance = User.objects.create_user(
            username="syncfin",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.artist_user = User.objects.create_user(
            username="syncartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Pitch Artist",
            slug="pitch-artist",
            user=self.artist_user,
        )
        self.release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Pitch EP",
            release_type="ep",
        )
        self.track = Track.objects.create(
            release=self.release,
            title="Cue Track",
            track_number=1,
            isrc="USS1Z2600001",
        )
        self.client = APIClient()

    def test_ar_creates_opportunity(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/sync/opportunities/",
            {
                "label": self.label.pk,
                "title": "Netflix S2 cold open",
                "status": SyncStatus.PITCHED,
                "media_type": SyncMediaType.TV,
                "client_name": "Netflix",
                "supervisor_name": "Alex Supervisor",
                "fee_amount": "15000.00",
                "track": self.track.pk,
                "artist": self.artist.pk,
                "release": self.release.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(SyncOpportunity.objects.count(), 1)
        self.assertEqual(response.data["created_by_username"], "syncar")
        self.assertEqual(response.data["status_display"], "Pitched")
        self.assertEqual(response.data["track_title"], "Cue Track")

    def test_manager_filters_by_status(self):
        SyncOpportunity.objects.create(
            label=self.label,
            title="Inquiry Brief",
            status=SyncStatus.INQUIRY,
            created_by=self.manager,
        )
        SyncOpportunity.objects.create(
            label=self.label,
            title="Licensed Spot",
            status=SyncStatus.LICENSED,
            created_by=self.ar_user,
            fee_amount=Decimal("5000.00"),
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/sync/opportunities/?status=licensed")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Licensed Spot")

    def test_finance_can_read_but_not_write(self):
        SyncOpportunity.objects.create(
            label=self.label,
            title="Fee Deal",
            status=SyncStatus.CLEARED,
            fee_amount=Decimal("8000.00"),
            created_by=self.manager,
        )
        self.client.force_authenticate(user=self.finance)
        list_response = self.client.get("/api/sync/opportunities/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)

        create_response = self.client.post(
            "/api/sync/opportunities/",
            {
                "label": self.label.pk,
                "title": "Finance Should Fail",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 403)

    def test_artist_sees_only_own_opportunities(self):
        other_artist = Artist.objects.create(
            label=self.label,
            name="Other Act",
            slug="other-act",
        )
        SyncOpportunity.objects.create(
            label=self.label,
            title="My Pitch",
            artist=self.artist,
            created_by=self.ar_user,
        )
        SyncOpportunity.objects.create(
            label=self.label,
            title="Other Pitch",
            artist=other_artist,
            created_by=self.ar_user,
        )
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/sync/opportunities/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My Pitch")

    def test_track_must_belong_to_label(self):
        other_label = Label.objects.create(name="Other", slug="other-sync")
        other_artist = Artist.objects.create(
            label=other_label,
            name="Foreign",
            slug="foreign",
        )
        other_release = Release.objects.create(
            label=other_label,
            primary_artist=other_artist,
            title="Foreign Rel",
            release_type="single",
        )
        foreign_track = Track.objects.create(
            release=other_release,
            title="Foreign Track",
            track_number=1,
        )
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/sync/opportunities/",
            {
                "label": self.label.pk,
                "title": "Bad Track",
                "track": foreign_track.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("track", response.data)

    def test_assignee_must_belong_to_label(self):
        outsider = User.objects.create_user(
            username="syncoutsider",
            password="testpass123",
            role=Role.AR,
        )
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/sync/opportunities/",
            {
                "label": self.label.pk,
                "title": "Bad Assign",
                "assigned_to": outsider.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("assigned_to", response.data)
