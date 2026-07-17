import json
import zipfile
from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track
from apps.payments.models import Payout, PayoutBatch
from apps.payments.services import generate_payout_batch
from apps.royalties.consolidation import consolidate_run
from apps.royalties.models import Distributor, RoyaltyLineItem, RoyaltyRun, RoyaltyStatement, StatementStatus
from apps.splits.models import SplitEntry, SplitRole, SplitSheet, SplitSheetStatus

User = get_user_model()


class LabelExportTests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Export Label", slug="export-label")
        self.finance = User.objects.create_user(
            username="exportfinance",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.ar = User.objects.create_user(
            username="exportar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar, label=self.label)

        self.artist_user = User.objects.create_user(
            username="exportartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Export Artist",
            slug="export-artist",
            user=self.artist_user,
        )

        release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Export EP",
        )
        self.track = Track.objects.create(
            release=release,
            title="Export Track",
            isrc="USRC17607840",
            track_number=1,
        )
        sheet = SplitSheet.objects.create(track=self.track, status=SplitSheetStatus.FINALIZED)
        SplitEntry.objects.create(
            split_sheet=sheet,
            participant_name="Export Artist",
            artist=self.artist,
            role=SplitRole.ARTIST,
            percentage=Decimal("100.00"),
        )

        from django.core.files.uploadedfile import SimpleUploadedFile

        statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.DISTROKID,
            filename="export-q1.csv",
            file=SimpleUploadedFile("export-q1.csv", b"x"),
            status=StatementStatus.PROCESSED,
            currency="USD",
            uploaded_by=self.finance,
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=self.track,
            isrc="USRC17607840",
            track_title="Export Track",
            amount=Decimal("10.0000"),
        )
        self.run = RoyaltyRun.objects.create(label=self.label, name="Export Run", currency="USD")
        self.run.statements.set([statement])
        consolidate_run(self.run)
        generate_payout_batch(self.run)

        self.client = APIClient()

    def test_finance_json_export_includes_financial_data(self):
        self.client.force_authenticate(user=self.finance)
        response = self.client.get("/api/export/?export_format=json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        payload = json.loads(response.content)
        self.assertEqual(payload["scope"], "full")
        self.assertEqual(len(payload["catalog"]["tracks"]), 1)
        self.assertEqual(len(payload["royalties"]["statements"]), 1)
        self.assertEqual(len(payload["payments"]["payouts"]), 1)

    def test_ar_export_is_catalog_only(self):
        self.client.force_authenticate(user=self.ar)
        response = self.client.get("/api/export/?export_format=json")
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["scope"], "catalog")
        self.assertIn("catalog", payload)
        self.assertNotIn("royalties", payload)
        self.assertNotIn("payments", payload)

    def test_artist_export_scoped_to_own_data(self):
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/export/?export_format=json")
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["scope"], "artist")
        self.assertNotIn("royalties", payload)
        self.assertEqual(len(payload["payments"]["payouts"]), 1)
        self.assertEqual(payload["payments"]["payouts"][0]["participant_name"], "Export Artist")

    def test_csv_export_returns_zip(self):
        self.client.force_authenticate(user=self.finance)
        response = self.client.get("/api/export/?export_format=csv")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/zip")
        self.assertIn("attachment", response["Content-Disposition"])

        with zipfile.ZipFile(BytesIO(response.content)) as archive:
            names = archive.namelist()
            self.assertIn("manifest.json", names)
            self.assertIn("catalog/tracks.csv", names)
            self.assertIn("royalties/statements.csv", names)
            self.assertIn("payments/payouts.csv", names)
