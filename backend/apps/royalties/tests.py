from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track

from .models import Distributor, RoyaltyLineItem, RoyaltyStatement, StatementStatus

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

    def test_finance_can_upload_and_parse_distrokid_statement(self):
        self.client.force_authenticate(user=self.finance)
        catalog_artist = Artist.objects.create(label=self.label, name="Test Artist", slug="test-artist")
        release = Release.objects.create(label=self.label, primary_artist=catalog_artist, title="Test EP")
        Track.objects.create(release=release, title="Track One", isrc="USRC17607839", track_number=1)

        upload = SimpleUploadedFile(
            "distrokid-q1.csv",
            (
                b"Sale Month,Store,Title,Artist,ISRC,Quantity,Earnings (USD)\n"
                b"2026-01,Spotify,Track One,Test Artist,USRC17607839,100,1.23\n"
                b"2026-01,Apple Music,Unmatched Track,Test Artist,USRC00000000,10,0.45\n"
            ),
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
        self.assertEqual(statement.uploaded_by, self.finance)
        # CELERY_TASK_ALWAYS_EAGER runs the parse inline during the request.
        self.assertEqual(statement.status, StatementStatus.PROCESSED)
        self.assertEqual(statement.row_count, 2)
        self.assertEqual(statement.total_amount, Decimal("1.68"))

        matched = RoyaltyLineItem.objects.get(isrc="USRC17607839")
        self.assertEqual(matched.track.title, "Track One")
        self.assertEqual(matched.amount, Decimal("1.23"))

        unmatched = RoyaltyLineItem.objects.get(isrc="USRC00000000")
        self.assertIsNone(unmatched.track)

    def test_upload_with_unmappable_columns_fails_gracefully(self):
        self.client.force_authenticate(user=self.finance)
        upload = SimpleUploadedFile(
            "mystery-statement.csv",
            b"foo,bar\n1,2\n",
            content_type="text/csv",
        )
        response = self.client.post(
            "/api/royalties/statements/",
            {
                "label": self.label.pk,
                "distributor": Distributor.OTHER,
                "file": upload,
                "currency": "USD",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        statement = RoyaltyStatement.objects.get()
        self.assertEqual(statement.status, StatementStatus.FAILED)
        self.assertIn("revenue/earnings column", statement.error_message)

    def test_artist_cannot_list_statements(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.get("/api/royalties/statements/")
        self.assertEqual(response.status_code, 403)
