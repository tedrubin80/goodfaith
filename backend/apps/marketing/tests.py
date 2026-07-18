from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release

from .models import CampaignStatus, CampaignType, MarketingCampaign

User = get_user_model()


class MarketingCampaignAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Promo Label", slug="promo-label")
        self.manager = User.objects.create_user(
            username="promomgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.ar_user = User.objects.create_user(
            username="promoar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.finance = User.objects.create_user(
            username="promofin",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.artist_user = User.objects.create_user(
            username="promoartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Promo Act",
            slug="promo-act",
            user=self.artist_user,
        )
        self.release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Promo Single",
            release_type="single",
        )
        self.client = APIClient()

    def test_ar_creates_campaign(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/marketing/campaigns/",
            {
                "label": self.label.pk,
                "title": "Single week-of push",
                "status": CampaignStatus.PLANNED,
                "campaign_type": CampaignType.RELEASE,
                "artist": self.artist.pk,
                "release": self.release.pk,
                "smart_link_url": "https://example.com/s/promo",
                "channels": "Spotify, Instagram, press list",
                "goals": "10k streams week one",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(MarketingCampaign.objects.count(), 1)
        self.assertEqual(response.data["created_by_username"], "promoar")
        self.assertEqual(response.data["campaign_type_display"], "Release campaign")

    def test_manager_filters_by_status(self):
        MarketingCampaign.objects.create(
            label=self.label,
            title="Draft Plan",
            status=CampaignStatus.DRAFT,
            created_by=self.manager,
        )
        MarketingCampaign.objects.create(
            label=self.label,
            title="Live Push",
            status=CampaignStatus.ACTIVE,
            created_by=self.ar_user,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/marketing/campaigns/?status=active")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Live Push")

    def test_finance_can_read_but_not_write(self):
        MarketingCampaign.objects.create(
            label=self.label,
            title="Visible to finance",
            status=CampaignStatus.ACTIVE,
            created_by=self.manager,
        )
        self.client.force_authenticate(user=self.finance)
        list_response = self.client.get("/api/marketing/campaigns/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)

        create_response = self.client.post(
            "/api/marketing/campaigns/",
            {"label": self.label.pk, "title": "No write"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 403)

    def test_artist_sees_only_own_campaigns(self):
        other = Artist.objects.create(
            label=self.label,
            name="Other Act",
            slug="other-promo",
        )
        MarketingCampaign.objects.create(
            label=self.label,
            title="My Campaign",
            artist=self.artist,
            created_by=self.ar_user,
        )
        MarketingCampaign.objects.create(
            label=self.label,
            title="Other Campaign",
            artist=other,
            created_by=self.ar_user,
        )
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/marketing/campaigns/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My Campaign")

    def test_end_date_must_not_precede_start(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/marketing/campaigns/",
            {
                "label": self.label.pk,
                "title": "Bad dates",
                "start_date": "2026-08-10",
                "end_date": "2026-08-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("end_date", response.data)

    def test_assignee_must_belong_to_label(self):
        outsider = User.objects.create_user(
            username="promooutsider",
            password="testpass123",
            role=Role.AR,
        )
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/marketing/campaigns/",
            {
                "label": self.label.pk,
                "title": "Bad assign",
                "assigned_to": outsider.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("assigned_to", response.data)
