from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track
from apps.payments.models import Payout, PayoutBatch, PayoutStatus
from apps.royalties.consolidation import consolidate_run
from apps.royalties.models import Distributor, RoyaltyLineItem, RoyaltyRun, RoyaltyRunStatus, RoyaltyStatement, StatementStatus
from apps.splits.models import SplitEntry, SplitRole, SplitSheet, SplitSheetStatus

User = get_user_model()


class PaymentAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Pay Label", slug="pay-label")
        self.finance = User.objects.create_user(
            username="payfinance",
            password="testpass123",
            role=Role.FINANCE,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)
        self.artist_user = User.objects.create_user(
            username="payartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)

        self.artist = Artist.objects.create(
            label=self.label,
            name="Pay Artist",
            slug="pay-artist",
            user=self.artist_user,
        )
        release = Release.objects.create(label=self.label, primary_artist=self.artist, title="Pay EP")
        track = Track.objects.create(
            release=release,
            title="Pay Track",
            isrc="USRC17607839",
            track_number=1,
        )
        sheet = SplitSheet.objects.create(track=track, status=SplitSheetStatus.FINALIZED)
        SplitEntry.objects.create(
            split_sheet=sheet,
            participant_name="Pay Artist",
            artist=self.artist,
            role=SplitRole.ARTIST,
            percentage=Decimal("100.00"),
        )

        statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.DISTROKID,
            filename="pay-q1.csv",
            file=SimpleUploadedFile("pay-q1.csv", b"x"),
            status=StatementStatus.PROCESSED,
            currency="USD",
            uploaded_by=self.finance,
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=track,
            isrc="USRC17607839",
            track_title="Pay Track",
            amount=Decimal("25.0000"),
        )

        self.run = RoyaltyRun.objects.create(
            label=self.label,
            name="Q1 Pay Run",
            currency="USD",
        )
        self.run.statements.set([statement])
        consolidate_run(self.run)

        self.client = APIClient()
        self.client.force_authenticate(user=self.finance)

    def test_issue_payout_batch_from_run(self):
        response = self.client.post(
            "/api/payments/batches/from_run/",
            {"run": self.run.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data["total_amount"]), Decimal("25.0000"))

        batch = PayoutBatch.objects.get()
        payout = Payout.objects.get()
        self.assertEqual(payout.participant_name, "Pay Artist")
        self.assertEqual(payout.amount, Decimal("25.0000"))
        self.assertEqual(payout.status, PayoutStatus.PENDING)

        self.run.refresh_from_db()
        self.assertEqual(self.run.status, RoyaltyRunStatus.CLOSED)

    def test_mark_payout_paid(self):
        self.client.post("/api/payments/batches/from_run/", {"run": self.run.pk}, format="json")
        payout = Payout.objects.get()

        response = self.client.post(
            f"/api/payments/payouts/{payout.pk}/mark_paid/",
            {"payment_reference": "ACH-12345"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "paid")
        self.assertEqual(response.data["payment_reference"], "ACH-12345")

    def test_artist_can_see_own_payout(self):
        self.client.post("/api/payments/batches/from_run/", {"run": self.run.pk}, format="json")
        payout = Payout.objects.get()

        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/payments/payouts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], payout.id)

    def test_cannot_issue_batch_twice(self):
        self.client.post("/api/payments/batches/from_run/", {"run": self.run.pk}, format="json")
        response = self.client.post(
            "/api/payments/batches/from_run/",
            {"run": self.run.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_ach_export_csv(self):
        self.client.post("/api/payments/batches/from_run/", {"run": self.run.pk}, format="json")
        batch = PayoutBatch.objects.get()
        response = self.client.get(f"/api/payments/batches/{batch.pk}/ach_export/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        body = response.content.decode()
        self.assertIn("participant_name", body)
        self.assertIn("Pay Artist", body)
        self.assertIn("25.0000", body)
