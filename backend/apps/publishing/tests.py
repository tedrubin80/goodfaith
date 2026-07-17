from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track

from .models import MusicalWork, RegistrationStatus

User = get_user_model()


class PublishingAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Pub Label", slug="pub-label")
        self.manager = User.objects.create_user(
            username="pubmgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.artist_user = User.objects.create_user(
            username="pubartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Pub Artist",
            slug="pub-artist",
            user=self.artist_user,
        )
        release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Pub EP",
        )
        self.track = Track.objects.create(
            release=release,
            title="Pub Track",
            isrc="USRC17607850",
            track_number=1,
        )
        self.client = APIClient()

    def test_manager_creates_work_with_shares(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/publishing/works/",
            {
                "label": self.label.pk,
                "title": "Midnight Song",
                "iswc": "T-123.456.789-0",
                "registration_status": RegistrationStatus.DRAFT,
                "target_pro": "ascap",
                "track_ids": [self.track.pk],
                "shares": [
                    {
                        "contributor_name": "Pub Artist",
                        "artist": self.artist.pk,
                        "role": "writer",
                        "percentage": "60.00",
                        "pro_affiliation": "ascap",
                    },
                    {
                        "contributor_name": "Co-Writer",
                        "role": "composer",
                        "percentage": "40.00",
                        "pro_affiliation": "bmi",
                    },
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(MusicalWork.objects.count(), 1)
        work = MusicalWork.objects.get()
        self.assertEqual(work.shares.count(), 2)
        self.assertEqual(Decimal(response.data["total_percentage"]), Decimal("100.00"))
        self.assertEqual(response.data["track_titles"], ["Pub Track"])

    def test_ready_requires_100_percent_shares(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/publishing/works/",
            {
                "label": self.label.pk,
                "title": "Incomplete",
                "registration_status": RegistrationStatus.READY,
                "shares": [
                    {
                        "contributor_name": "Only Writer",
                        "role": "writer",
                        "percentage": "50.00",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_artist_sees_only_own_works(self):
        own = MusicalWork.objects.create(label=self.label, title="Own Work")
        own.shares.create(
            contributor_name="Pub Artist",
            artist=self.artist,
            role="writer",
            percentage=Decimal("100.00"),
        )
        MusicalWork.objects.create(label=self.label, title="Other Work")

        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/publishing/works/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Own Work")
