from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.audit.models import AuditAction, AuditEvent
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track
from apps.payments.models import Payout
from apps.payments.services import generate_payout_batch
from apps.royalties.consolidation import consolidate_run
from apps.royalties.models import Distributor, RoyaltyLineItem, RoyaltyRun, RoyaltyStatement, StatementStatus
from apps.splits.models import SplitEntry, SplitRole, SplitSheet, SplitSheetStatus

User = get_user_model()


class AuditLogTests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Audit Label", slug="audit-label")
        self.finance = User.objects.create_user(
            username="auditfinance",
            password="testpass123",
            role=Role.FINANCE,
        )
        self.artist_user = User.objects.create_user(
            username="auditartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.finance, label=self.label)
        satisfy_mandatory_2fa(self.finance)
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Audit Artist",
            slug="audit-artist",
            user=self.artist_user,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.finance)

    def test_statement_upload_creates_audit_event(self):
        response = self.client.post(
            "/api/royalties/statements/",
            {
                "label": self.label.pk,
                "distributor": Distributor.DISTROKID,
                "file": SimpleUploadedFile("audit.csv", b"isrc,amount\nUSRC1,1.00"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        event = AuditEvent.objects.get(action=AuditAction.STATEMENT_UPLOADED)
        self.assertEqual(event.actor, self.finance)
        self.assertEqual(event.resource_type, "royalty_statement")

    def test_payout_mark_paid_creates_audit_event(self):
        release = Release.objects.create(label=self.label, primary_artist=self.artist, title="Audit EP")
        track = Track.objects.create(release=release, title="Audit Track", isrc="USRC17607842", track_number=1)
        sheet = SplitSheet.objects.create(track=track, status=SplitSheetStatus.FINALIZED)
        SplitEntry.objects.create(
            split_sheet=sheet,
            participant_name="Audit Artist",
            artist=self.artist,
            role=SplitRole.ARTIST,
            percentage=Decimal("100.00"),
        )
        statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.DISTROKID,
            filename="audit-pay.csv",
            file=SimpleUploadedFile("audit-pay.csv", b"x"),
            status=StatementStatus.PROCESSED,
            currency="USD",
            uploaded_by=self.finance,
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=track,
            isrc="USRC17607842",
            amount=Decimal("12.0000"),
        )
        run = RoyaltyRun.objects.create(label=self.label, name="Audit Run", currency="USD")
        run.statements.set([statement])
        consolidate_run(run)
        batch = generate_payout_batch(run)
        payout = Payout.objects.get(batch=batch)

        response = self.client.post(
            f"/api/payments/payouts/{payout.pk}/mark_paid/",
            {"payment_reference": "WIRE-99"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        event = AuditEvent.objects.get(action=AuditAction.PAYOUT_MARKED_PAID)
        self.assertEqual(event.metadata["payment_reference"], "WIRE-99")

    def test_artist_cannot_read_audit_log(self):
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/audit/events/")
        self.assertEqual(response.status_code, 403)

    def test_finance_can_list_audit_events(self):
        AuditEvent.objects.create(
            label=self.label,
            actor=self.finance,
            action=AuditAction.RUN_CREATED,
            resource_type="royalty_run",
            resource_id=1,
            summary="Test event",
        )
        response = self.client.get("/api/audit/events/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
