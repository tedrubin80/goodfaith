from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Label, LabelMembership

from .models import Distributor, RoyaltyStatement, StatementStatus

User = get_user_model()


class RoyaltyAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Demo Label", slug="demo-label")
        self.finance = User.objects.create_user(
            username="finance",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)
        self.artist = User.objects.create_user(
            username="artist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist, label=self.label)
        self.client = APIClient()

    def test_finance_can_upload_statement(self):
        self.client.force_authenticate(user=self.finance)
        upload = SimpleUploadedFile(
            "distrokid-q1.csv",
            b"date,amount,isrc\n2026-01-01,1.23,USRC17607839\n",
            content_type="text/csv",
        )
        response = self.client.post(
            "/api/royalties/statements/",
            {
                "label": self.label.pk,
                "distributor": Distributor.DISTROKID,
                "file": upload,
                "currency": "USD",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        statement = RoyaltyStatement.objects.get()
        self.assertEqual(statement.filename, "distrokid-q1.csv")
        self.assertEqual(statement.status, StatementStatus.PENDING)
        self.assertEqual(statement.uploaded_by, self.finance)

    def test_artist_cannot_list_statements(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.get("/api/royalties/statements/")
        self.assertEqual(response.status_code, 403)
