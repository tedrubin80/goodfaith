from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership

from .models import PipelineStage, Prospect, ProspectPriority

User = get_user_model()


class ARPipelineAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Pipeline Label", slug="pipeline-label")
        self.manager = User.objects.create_user(
            username="pipelinemgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.ar_user = User.objects.create_user(
            username="pipelinear",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.finance = User.objects.create_user(
            username="pipelinefin",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.artist_user = User.objects.create_user(
            username="pipelineartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Signed Act",
            slug="signed-act",
            user=self.artist_user,
        )
        self.client = APIClient()

    def test_ar_creates_prospect(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/ar/prospects/",
            {
                "label": self.label.pk,
                "name": "Nova Echo",
                "stage": PipelineStage.LEAD,
                "priority": ProspectPriority.HOT,
                "genre": "Indie Pop",
                "source": "Demo drop",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Prospect.objects.count(), 1)
        self.assertEqual(response.data["created_by_username"], "pipelinear")
        self.assertEqual(response.data["stage_display"], "Lead")

    def test_manager_lists_and_filters_by_stage(self):
        Prospect.objects.create(
            label=self.label,
            name="Lead Act",
            stage=PipelineStage.LEAD,
            created_by=self.manager,
        )
        Prospect.objects.create(
            label=self.label,
            name="Negotiating Act",
            stage=PipelineStage.NEGOTIATING,
            created_by=self.ar_user,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/ar/prospects/?stage=negotiating")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Negotiating Act")

    def test_finance_cannot_access_pipeline(self):
        self.client.force_authenticate(user=self.finance)
        response = self.client.get("/api/ar/prospects/")
        self.assertEqual(response.status_code, 403)

    def test_artist_cannot_access_pipeline(self):
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/ar/prospects/")
        self.assertEqual(response.status_code, 403)

    def test_ar_can_link_signed_artist(self):
        prospect = Prospect.objects.create(
            label=self.label,
            name="Signing Soon",
            stage=PipelineStage.NEGOTIATING,
            created_by=self.ar_user,
        )
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.patch(
            f"/api/ar/prospects/{prospect.pk}/",
            {
                "stage": PipelineStage.SIGNED,
                "signed_artist": self.artist.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        prospect.refresh_from_db()
        self.assertEqual(prospect.stage, PipelineStage.SIGNED)
        self.assertEqual(prospect.signed_artist_id, self.artist.pk)

    def test_assignee_must_belong_to_label(self):
        outsider = User.objects.create_user(
            username="outsider",
            password="testpass123",
            role=Role.AR,
        )
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/ar/prospects/",
            {
                "label": self.label.pk,
                "name": "Bad Assign",
                "assigned_to": outsider.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("assigned_to", response.data)
