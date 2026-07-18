from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.ar.models import PipelineStage, Prospect
from apps.catalog.models import Artist, Label, LabelMembership, Release, Track
from apps.payments.models import Payout, PayoutBatch, PayoutStatus
from apps.royalties.models import (
    Distributor,
    RoyaltyLineItem,
    RoyaltyRun,
    RoyaltyRunPayout,
    RoyaltyRunStatus,
    RoyaltyStatement,
    StatementStatus,
)
from apps.splits.models import SplitEntry, SplitRole, SplitSheet, SplitSheetStatus

User = get_user_model()


class AnalyticsSummaryAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Analytics Label", slug="analytics-label")
        self.manager = User.objects.create_user(
            username="analyticsmgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        satisfy_mandatory_2fa(self.manager)
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.finance = User.objects.create_user(
            username="analyticsfin",
            password="testpass123",
            role=Role.FINANCE,
        )
        satisfy_mandatory_2fa(self.finance)
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.ar_user = User.objects.create_user(
            username="analyticsar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.artist_user = User.objects.create_user(
            username="analyticsartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Analytics Artist",
            slug="analytics-artist",
            user=self.artist_user,
        )
        other_artist = Artist.objects.create(
            label=self.label,
            name="Other Artist",
            slug="other-artist",
        )

        release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Analytics EP",
        )
        track = Track.objects.create(
            release=release,
            title="Hit Track",
            isrc="USRC17607899",
            track_number=1,
        )
        other_release = Release.objects.create(
            label=self.label,
            primary_artist=other_artist,
            title="Other EP",
        )
        other_track = Track.objects.create(
            release=other_release,
            title="Other Track",
            isrc="USRC17607900",
            track_number=1,
        )

        for t, a, pct in (
            (track, self.artist, Decimal("100.00")),
            (other_track, other_artist, Decimal("100.00")),
        ):
            sheet = SplitSheet.objects.create(track=t, status=SplitSheetStatus.FINALIZED)
            SplitEntry.objects.create(
                split_sheet=sheet,
                participant_name=a.name,
                artist=a,
                role=SplitRole.ARTIST,
                percentage=pct,
            )

        statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.DISTROKID,
            filename="analytics.csv",
            file=SimpleUploadedFile("analytics.csv", b"x"),
            status=StatementStatus.PROCESSED,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            total_amount=Decimal("100.0000"),
            currency="USD",
            uploaded_by=self.finance,
            row_count=2,
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=track,
            isrc="USRC17607899",
            sale_period=date(2026, 1, 15),
            amount=Decimal("60.0000"),
        )
        RoyaltyLineItem.objects.create(
            statement=statement,
            track=other_track,
            isrc="USRC17607900",
            sale_period=date(2026, 1, 20),
            amount=Decimal("40.0000"),
        )

        tc_statement = RoyaltyStatement.objects.create(
            label=self.label,
            distributor=Distributor.TUNECORE,
            filename="analytics-tc.csv",
            file=SimpleUploadedFile("analytics-tc.csv", b"x"),
            status=StatementStatus.PROCESSED,
            period_start=date(2026, 2, 1),
            period_end=date(2026, 2, 28),
            total_amount=Decimal("25.0000"),
            currency="USD",
            uploaded_by=self.finance,
            row_count=1,
        )
        RoyaltyLineItem.objects.create(
            statement=tc_statement,
            track=track,
            isrc="USRC17607899",
            sale_period=date(2026, 2, 10),
            amount=Decimal("25.0000"),
        )

        run = RoyaltyRun.objects.create(
            label=self.label,
            name="Q1 Analytics",
            currency="USD",
            status=RoyaltyRunStatus.READY,
            total_amount=Decimal("125.0000"),
        )
        run.statements.set([statement, tc_statement])
        RoyaltyRunPayout.objects.create(
            run=run,
            track=track,
            isrc="USRC17607899",
            track_title="Hit Track",
            participant_name=self.artist.name,
            artist=self.artist,
            role=SplitRole.ARTIST,
            share_percentage=Decimal("100.00"),
            track_gross=Decimal("85.0000"),
            amount=Decimal("85.0000"),
        )
        RoyaltyRunPayout.objects.create(
            run=run,
            track=other_track,
            isrc="USRC17607900",
            track_title="Other Track",
            participant_name=other_artist.name,
            artist=other_artist,
            role=SplitRole.ARTIST,
            share_percentage=Decimal("100.00"),
            track_gross=Decimal("40.0000"),
            amount=Decimal("40.0000"),
        )

        batch = PayoutBatch.objects.create(
            label=self.label,
            run=run,
            name="Q1 Batch",
            total_amount=Decimal("125.0000"),
            currency="USD",
        )
        Payout.objects.create(
            batch=batch,
            artist=self.artist,
            participant_name=self.artist.name,
            amount=Decimal("85.0000"),
            status=PayoutStatus.PENDING,
        )
        Payout.objects.create(
            batch=batch,
            artist=other_artist,
            participant_name=other_artist.name,
            amount=Decimal("40.0000"),
            status=PayoutStatus.PAID,
        )

        Prospect.objects.create(
            label=self.label,
            name="Lead Prospect",
            stage=PipelineStage.LEAD,
            created_by=self.ar_user,
        )
        Prospect.objects.create(
            label=self.label,
            name="Signed Prospect",
            stage=PipelineStage.SIGNED,
            created_by=self.ar_user,
            signed_artist=self.artist,
        )

        self.client = APIClient()

    def test_finance_sees_label_aggregations(self):
        self.client.force_authenticate(user=self.finance)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["scope"], "label")
        self.assertEqual(Decimal(response.data["totals"]["statement_gross"]), Decimal("125.0000"))
        self.assertEqual(response.data["totals"]["statement_count"], 2)
        self.assertEqual(Decimal(response.data["totals"]["run_allocated"]), Decimal("125.0000"))
        self.assertEqual(Decimal(response.data["totals"]["payout_pending"]), Decimal("85.0000"))
        self.assertEqual(Decimal(response.data["totals"]["payout_paid"]), Decimal("40.0000"))
        self.assertEqual(response.data["totals"]["artists"], 2)
        self.assertEqual(response.data["totals"]["tracks"], 2)

        distributors = {row["distributor"]: row for row in response.data["by_distributor"]}
        self.assertEqual(Decimal(distributors["distrokid"]["amount"]), Decimal("100.0000"))
        self.assertEqual(Decimal(distributors["tunecore"]["amount"]), Decimal("25.0000"))

        periods = {row["period"]: row for row in response.data["by_period"]}
        self.assertEqual(Decimal(periods["2026-01"]["amount"]), Decimal("100.0000"))
        self.assertEqual(Decimal(periods["2026-02"]["amount"]), Decimal("25.0000"))

        artists = {row["artist_name"]: row for row in response.data["by_artist"]}
        self.assertEqual(Decimal(artists["Analytics Artist"]["amount"]), Decimal("85.0000"))
        self.assertEqual(Decimal(artists["Other Artist"]["amount"]), Decimal("40.0000"))
        self.assertNotIn("pipeline", response.data)

    def test_manager_includes_pipeline_counts(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["scope"], "label")
        self.assertEqual(response.data["pipeline"]["total"], 2)
        stages = {row["stage"]: row["count"] for row in response.data["pipeline"]["by_stage"]}
        self.assertEqual(stages["lead"], 1)
        self.assertEqual(stages["signed"], 1)

    def test_artist_sees_own_earnings_only(self):
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["scope"], "artist")
        self.assertEqual(Decimal(response.data["totals"]["earnings"]), Decimal("85.0000"))
        self.assertEqual(Decimal(response.data["totals"]["payout_pending"]), Decimal("85.0000"))
        self.assertNotIn("by_distributor", response.data)
        self.assertNotIn("by_artist", response.data)
        self.assertEqual(len(response.data["by_track"]), 1)
        self.assertEqual(response.data["by_track"][0]["track_title"], "Hit Track")
        self.assertEqual(Decimal(response.data["by_track"][0]["amount"]), Decimal("85.0000"))

    def test_ar_sees_ops_without_financials(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["scope"], "ops")
        self.assertEqual(response.data["catalog"]["artists"], 2)
        self.assertEqual(response.data["catalog"]["releases"], 2)
        self.assertEqual(response.data["pipeline"]["total"], 2)
        self.assertNotIn("by_distributor", response.data)
        self.assertNotIn("totals", response.data)

    def test_finance_requires_2fa(self):
        self.finance.is_2fa_enabled = False
        self.finance.save(update_fields=["is_2fa_enabled"])
        self.client.force_authenticate(user=self.finance)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, 403)

    def test_period_filter_on_label_summary(self):
        self.client.force_authenticate(user=self.finance)
        response = self.client.get(
            "/api/analytics/summary/",
            {"period_start": "2026-02-01", "period_end": "2026-02-28"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data["totals"]["statement_gross"]), Decimal("25.0000"))
        self.assertEqual(len(response.data["by_distributor"]), 1)
        self.assertEqual(response.data["by_distributor"][0]["distributor"], "tunecore")
