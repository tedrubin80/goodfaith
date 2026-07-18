"""Aggregate royalty / catalog / pipeline metrics from existing models (no external APIs)."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from apps.accounts.models import Role
from apps.ar.models import PipelineStage, Prospect
from apps.catalog.models import Artist, Release, Track
from apps.payments.models import Payout, PayoutStatus
from apps.royalties.models import (
    Distributor,
    RoyaltyLineItem,
    RoyaltyRunPayout,
    RoyaltyStatement,
    StatementStatus,
)


def _dec(value) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(value)


def _money(value: Decimal) -> str:
    return f"{_dec(value):.4f}"


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def catalog_counts(label_ids: list[int]) -> dict[str, int]:
    return {
        "artists": Artist.objects.filter(label_id__in=label_ids).count(),
        "releases": Release.objects.filter(label_id__in=label_ids).count(),
        "tracks": Track.objects.filter(release__label_id__in=label_ids).count(),
    }


def pipeline_counts(label_ids: list[int]) -> dict[str, Any]:
    rows = (
        Prospect.objects.filter(label_id__in=label_ids)
        .values("stage")
        .annotate(count=Count("id"))
    )
    by_stage_map = {row["stage"]: row["count"] for row in rows}
    by_stage = [
        {
            "stage": stage.value,
            "stage_display": stage.label,
            "count": by_stage_map.get(stage.value, 0),
        }
        for stage in PipelineStage
    ]
    return {
        "total": sum(by_stage_map.values()),
        "by_stage": by_stage,
    }


def _statement_qs(label_ids: list[int], period_start: date | None, period_end: date | None):
    qs = RoyaltyStatement.objects.filter(
        label_id__in=label_ids,
        status=StatementStatus.PROCESSED,
    )
    if period_start:
        qs = qs.filter(Q(period_end__gte=period_start) | Q(period_end__isnull=True, period_start__gte=period_start))
    if period_end:
        qs = qs.filter(Q(period_start__lte=period_end) | Q(period_start__isnull=True, period_end__lte=period_end))
    return qs


def _line_item_qs(label_ids: list[int], period_start: date | None, period_end: date | None):
    qs = RoyaltyLineItem.objects.filter(
        statement__label_id__in=label_ids,
        statement__status=StatementStatus.PROCESSED,
    )
    if period_start:
        qs = qs.filter(
            Q(sale_period__gte=period_start)
            | Q(sale_period__isnull=True, statement__period_start__gte=period_start)
            | Q(
                sale_period__isnull=True,
                statement__period_start__isnull=True,
                statement__period_end__gte=period_start,
            )
        )
    if period_end:
        qs = qs.filter(
            Q(sale_period__lte=period_end)
            | Q(sale_period__isnull=True, statement__period_end__lte=period_end)
            | Q(
                sale_period__isnull=True,
                statement__period_end__isnull=True,
                statement__period_start__lte=period_end,
            )
        )
    return qs


def _run_payout_qs(label_ids: list[int], *, artist_id: int | None = None):
    qs = RoyaltyRunPayout.objects.filter(run__label_id__in=label_ids)
    if artist_id is not None:
        qs = qs.filter(artist_id=artist_id)
    return qs


def label_financial_summary(
    label_ids: list[int],
    *,
    period_start: date | None = None,
    period_end: date | None = None,
) -> dict[str, Any]:
    statements = _statement_qs(label_ids, period_start, period_end)
    statement_agg = statements.aggregate(
        gross=Coalesce(Sum("total_amount"), Decimal("0")),
        count=Count("id"),
    )
    line_items = _line_item_qs(label_ids, period_start, period_end)

    by_distributor_rows = (
        statements.values("distributor")
        .annotate(
            amount=Coalesce(Sum("total_amount"), Decimal("0")),
            statement_count=Count("id"),
        )
        .order_by("-amount")
    )
    by_distributor = [
        {
            "distributor": row["distributor"],
            "distributor_display": dict(Distributor.choices).get(
                row["distributor"], row["distributor"]
            ),
            "amount": _money(row["amount"]),
            "statement_count": row["statement_count"],
        }
        for row in by_distributor_rows
    ]

    # Period buckets: prefer sale_period month; fall back to statement period_end month.
    period_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for item in line_items.select_related("statement").only(
        "amount", "sale_period", "statement__period_end", "statement__period_start"
    ):
        bucket_date = item.sale_period or item.statement.period_end or item.statement.period_start
        if not bucket_date:
            continue
        key = f"{bucket_date.year:04d}-{bucket_date.month:02d}"
        period_totals[key] += _dec(item.amount)
    by_period = [
        {"period": period, "amount": _money(amount)}
        for period, amount in sorted(period_totals.items())
    ]

    payouts = _run_payout_qs(label_ids)
    by_artist_rows = (
        payouts.filter(artist__isnull=False)
        .values("artist_id", "artist__name")
        .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-amount")[:25]
    )
    by_artist = [
        {
            "artist_id": row["artist_id"],
            "artist_name": row["artist__name"],
            "amount": _money(row["amount"]),
        }
        for row in by_artist_rows
    ]

    by_track_rows = (
        payouts.values("track_id", "track_title", "isrc")
        .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-amount")[:25]
    )
    by_track = [
        {
            "track_id": row["track_id"],
            "track_title": row["track_title"] or "—",
            "isrc": row["isrc"] or "",
            "amount": _money(row["amount"]),
        }
        for row in by_track_rows
    ]

    run_total = payouts.aggregate(total=Coalesce(Sum("amount"), Decimal("0")))["total"]

    payable = Payout.objects.filter(batch__label_id__in=label_ids)
    pending = payable.filter(status=PayoutStatus.PENDING).aggregate(
        total=Coalesce(Sum("amount"), Decimal("0"))
    )["total"]
    paid = payable.filter(status=PayoutStatus.PAID).aggregate(
        total=Coalesce(Sum("amount"), Decimal("0"))
    )["total"]

    currency = (
        statements.order_by("-created_at").values_list("currency", flat=True).first() or "USD"
    )

    return {
        "scope": "label",
        "currency": currency,
        "totals": {
            "statement_gross": _money(statement_agg["gross"]),
            "statement_count": statement_agg["count"],
            "run_allocated": _money(run_total),
            "payout_pending": _money(pending),
            "payout_paid": _money(paid),
            **catalog_counts(label_ids),
        },
        "by_distributor": by_distributor,
        "by_period": by_period,
        "by_artist": by_artist,
        "by_track": by_track,
    }


def artist_financial_summary(
    label_ids: list[int],
    artist: Artist,
    *,
    period_start: date | None = None,
    period_end: date | None = None,
) -> dict[str, Any]:
    payouts = _run_payout_qs(label_ids, artist_id=artist.pk)
    if period_start or period_end:
        # Scope artist lines via related run statements' periods when possible.
        run_ids = set(
            _statement_qs(label_ids, period_start, period_end).values_list("runs", flat=True)
        )
        payouts = payouts.filter(run_id__in=run_ids) if run_ids else payouts.none()

    earnings = payouts.aggregate(total=Coalesce(Sum("amount"), Decimal("0")))["total"]

    period_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for row in payouts.select_related("run").only("amount", "run__created_at"):
        created = row.run.created_at
        key = f"{created.year:04d}-{created.month:02d}"
        period_totals[key] += _dec(row.amount)
    by_period = [
        {"period": period, "amount": _money(amount)}
        for period, amount in sorted(period_totals.items())
    ]

    by_track_rows = (
        payouts.values("track_id", "track_title", "isrc")
        .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-amount")[:25]
    )
    by_track = [
        {
            "track_id": row["track_id"],
            "track_title": row["track_title"] or "—",
            "isrc": row["isrc"] or "",
            "amount": _money(row["amount"]),
        }
        for row in by_track_rows
    ]

    by_run_rows = (
        payouts.values("run_id", "run__name", "run__currency")
        .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-run_id")
    )
    by_run = [
        {
            "run_id": row["run_id"],
            "run_name": row["run__name"],
            "currency": row["run__currency"] or "USD",
            "amount": _money(row["amount"]),
        }
        for row in by_run_rows
    ]

    payable = Payout.objects.filter(
        batch__label_id__in=label_ids,
        artist=artist,
    )
    pending = payable.filter(status=PayoutStatus.PENDING).aggregate(
        total=Coalesce(Sum("amount"), Decimal("0"))
    )["total"]
    paid = payable.filter(status=PayoutStatus.PAID).aggregate(
        total=Coalesce(Sum("amount"), Decimal("0"))
    )["total"]

    currency = by_run[0]["currency"] if by_run else "USD"

    return {
        "scope": "artist",
        "currency": currency,
        "artist_id": artist.pk,
        "artist_name": artist.name,
        "totals": {
            "earnings": _money(earnings),
            "payout_pending": _money(pending),
            "payout_paid": _money(paid),
        },
        "by_period": by_period,
        "by_track": by_track,
        "by_run": by_run,
    }


def ops_summary(label_ids: list[int]) -> dict[str, Any]:
    return {
        "scope": "ops",
        "catalog": catalog_counts(label_ids),
        "pipeline": pipeline_counts(label_ids),
    }


def build_summary_for_user(
    user,
    label_ids: list[int],
    *,
    period_start: str | None = None,
    period_end: str | None = None,
) -> dict[str, Any]:
    start = _parse_date(period_start)
    end = _parse_date(period_end)

    if user.role == Role.AR:
        return ops_summary(label_ids)

    if user.role == Role.ARTIST:
        artist = getattr(user, "artist_profile", None)
        if artist is None:
            return {
                "scope": "artist",
                "currency": "USD",
                "artist_id": None,
                "artist_name": None,
                "totals": {
                    "earnings": "0.0000",
                    "payout_pending": "0.0000",
                    "payout_paid": "0.0000",
                },
                "by_period": [],
                "by_track": [],
                "by_run": [],
            }
        return artist_financial_summary(
            label_ids, artist, period_start=start, period_end=end
        )

    # Manager / Finance / Admin — full label financials + catalog counts.
    # Pipeline counts included for Manager/Admin ops glance (not financial).
    data = label_financial_summary(label_ids, period_start=start, period_end=end)
    if user.role in {Role.MANAGER, Role.ADMIN}:
        data["pipeline"] = pipeline_counts(label_ids)
    return data
