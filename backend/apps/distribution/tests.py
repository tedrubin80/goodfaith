from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release

from .models import DeliveryStatus, DspDelivery, DspTarget

User = get_user_model()


class DistributionAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Dist Label", slug="dist-label")
        self.manager = User.objects.create_user(
            username="distmgr", password="testpass123", role=Role.MANAGER
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label, name="Dist Act", slug="dist-act"
        )
        self.release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Dist Single",
            release_type="single",
        )
        self.client = APIClient()

    def test_manager_creates_delivery(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/distribution/deliveries/",
            {
                "label": self.label.pk,
                "release": self.release.pk,
                "dsp": DspTarget.SPOTIFY,
                "status": DeliveryStatus.PLANNED,
                "distributor": "DistroKid",
                "target_live_date": "2026-09-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(DspDelivery.objects.count(), 1)

    def test_duplicate_dsp_rejected(self):
        DspDelivery.objects.create(
            label=self.label,
            release=self.release,
            dsp=DspTarget.SPOTIFY,
            created_by=self.manager,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/distribution/deliveries/",
            {
                "label": self.label.pk,
                "release": self.release.pk,
                "dsp": DspTarget.SPOTIFY,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
