from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track
from apps.notifications.models import Notification, NotificationKind
from apps.payments.models import Payout, PayoutBatch
from apps.royalties.consolidation import consolidate_run
from apps.royalties.models import (
    Distributor,
    RoyaltyLineItem,
    RoyaltyRun,
    RoyaltyStatement,
    StatementStatus,
)
from apps.splits.models import SplitEntry, SplitRole, SplitSheet, SplitSheetStatus

User = get_user_model()


class NotificationAndPdfAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Notify Label", slug="notify-label")
        self.finance = User.objects.create_user(
            username="notifyfinance",
            password="testpass123",
            role=Role.FINANCE,
        )
        satisfy_mandatory_2fa(self.finance)
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.artist_user = User.objects.create_user(
            username="notifyartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Notify Artist",
            slug="notify-artist",
            user=self.artist_user,
        )
        release = Release.objects.create(
            label=self.label, primary_artist=self.artist, title="Notify EP"
        )
        track = Track.objects.create(
            release=release,
            title="Notify Track",
            isrc="USRC17607840",
            track_number=1,
        )
        sheet = SplitSheet.objects.create(track=track, status=SplitSheetStatus.FINALIZED)
        SplitEntry.objects.create(
            split_sheet=sheet,
            participant_name="Notify Artist",
            artist=self.artist,
            role=SplitRole.ARTIST,
            percentage=Decimal("100.00"),
        )

        statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.DISTROKID,
            filename="notify-q1.csv",
            file=SimpleUploadedFile("notify-q1.csv", b"x"),
            status=StatementStatus.PROCESSED,
            currency="USD",
            uploaded_by=self.finance,
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=track,
            isrc="USRC17607840",
            track_title="Notify Track",
            amount=Decimal("40.0000"),
        )

        self.run = RoyaltyRun.objects.create(
            label=self.label,
            name="Q1 Notify Run",
            currency="USD",
        )
        self.run.statements.set([statement])
        consolidate_run(self.run)

        self.client = APIClient()
        self.client.force_authenticate(user=self.finance)

    def test_royalty_run_pdf(self):
        response = self.client.get(f"/api/royalties/runs/{self.run.pk}/pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertIn("attachment", response["Content-Disposition"])

    def test_payout_batch_pdf_and_notifications(self):
        response = self.client.post(
            "/api/payments/batches/from_run/",
            {"run": self.run.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        batch = PayoutBatch.objects.get()

        artist_notes = Notification.objects.filter(
            user=self.artist_user, kind=NotificationKind.PAYOUT_READY
        )
        self.assertEqual(artist_notes.count(), 1)

        pdf = self.client.get(f"/api/payments/batches/{batch.pk}/pdf/")
        self.assertEqual(pdf.status_code, 200)
        self.assertEqual(pdf["Content-Type"], "application/pdf")
        self.assertTrue(pdf.content.startswith(b"%PDF"))

        payout = Payout.objects.get()
        paid = self.client.post(
            f"/api/payments/payouts/{payout.pk}/mark_paid/",
            {"payment_reference": "ACH-999"},
            format="json",
        )
        self.assertEqual(paid.status_code, 200)
        self.assertEqual(
            Notification.objects.filter(
                user=self.artist_user, kind=NotificationKind.PAYOUT_PAID
            ).count(),
            1,
        )

        payout_pdf = self.client.get(f"/api/payments/payouts/{payout.pk}/pdf/")
        self.assertEqual(payout_pdf.status_code, 200)
        self.assertTrue(payout_pdf.content.startswith(b"%PDF"))

    def test_artist_notifications_list_and_mark_read(self):
        self.client.post(
            "/api/payments/batches/from_run/",
            {"run": self.run.pk},
            format="json",
        )
        self.client.force_authenticate(user=self.artist_user)

        unread = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(unread.status_code, 200)
        self.assertEqual(unread.data["count"], 1)

        listing = self.client.get("/api/notifications/")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.data), 1)
        note_id = listing.data[0]["id"]

        marked = self.client.post(f"/api/notifications/{note_id}/mark_read/")
        self.assertEqual(marked.status_code, 200)
        self.assertTrue(marked.data["is_read"])

        unread_after = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(unread_after.data["count"], 0)

    def test_artist_scoped_batch_pdf(self):
        self.client.post(
            "/api/payments/batches/from_run/",
            {"run": self.run.pk},
            format="json",
        )
        batch = PayoutBatch.objects.get()
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get(f"/api/payments/batches/{batch.pk}/pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertIn("artist", response["Content-Disposition"])
