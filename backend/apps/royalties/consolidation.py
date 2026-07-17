from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from apps.splits.models import SplitSheetStatus

from .models import RoyaltyLineItem, RoyaltyRun, RoyaltyRunPayout, RoyaltyRunStatus, StatementStatus

MONEY_QUANT = Decimal("0.0001")


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def _group_key(item: RoyaltyLineItem) -> str:
    if item.track_id:
        return f"track:{item.track_id}"
    if item.isrc:
        return f"isrc:{item.isrc.upper()}"
    title = (item.track_title or "unknown").strip().lower()
    return f"title:{title}"


class ConsolidationError(Exception):
    pass


def consolidate_run(run: RoyaltyRun) -> RoyaltyRun:
    """
    Aggregate parsed line items across the run's statements and apply
    finalized track split sheets to produce per-participant payout rows.
    """
    statements = list(run.statements.all())
    if not statements:
        raise ConsolidationError("Add at least one statement to the run.")

    label_id = run.label_id
    for statement in statements:
        if statement.label_id != label_id:
            raise ConsolidationError("All statements must belong to the run's label.")
        if statement.status != StatementStatus.PROCESSED:
            raise ConsolidationError(
                f"Statement “{statement.filename}” is not processed yet (status: {statement.status})."
            )
        if statement.currency != run.currency:
            raise ConsolidationError(
                f"Statement “{statement.filename}” uses {statement.currency}; run uses {run.currency}."
            )

    line_items = (
        RoyaltyLineItem.objects.filter(statement__in=statements)
        .select_related("track", "track__split_sheet")
        .prefetch_related("track__split_sheet__entries")
    )

    groups: dict[str, list[RoyaltyLineItem]] = defaultdict(list)
    for item in line_items:
        groups[_group_key(item)].append(item)

    payouts: list[RoyaltyRunPayout] = []
    run_total = Decimal("0")

    for group_items in groups.values():
        gross = _quantize(sum((item.amount for item in group_items), Decimal("0")))
        if gross == 0:
            continue

        sample = group_items[0]
        track = sample.track
        isrc = sample.isrc or ""
        track_title = sample.track_title or (track.title if track else "")

        split_sheet = None
        if track and hasattr(track, "split_sheet"):
            split_sheet = track.split_sheet

        if (
            split_sheet
            and split_sheet.status == SplitSheetStatus.FINALIZED
            and split_sheet.entries.exists()
        ):
            for entry in split_sheet.entries.all():
                share = _quantize(gross * entry.percentage / Decimal("100"))
                payouts.append(
                    RoyaltyRunPayout(
                        run=run,
                        track=track,
                        isrc=isrc,
                        track_title=track_title,
                        participant_name=entry.participant_name,
                        artist=entry.artist,
                        role=entry.role,
                        share_percentage=entry.percentage,
                        track_gross=gross,
                        amount=share,
                    )
                )
                run_total += share
        else:
            reason = "no split sheet"
            if split_sheet and split_sheet.status != SplitSheetStatus.FINALIZED:
                reason = "split sheet not finalized"
            payouts.append(
                RoyaltyRunPayout(
                    run=run,
                    track=track,
                    isrc=isrc,
                    track_title=track_title,
                    participant_name="Unallocated",
                    artist=None,
                    role="",
                    share_percentage=Decimal("100"),
                    track_gross=gross,
                    amount=gross,
                    unallocated_reason=reason,
                )
            )
            run_total += gross

    with transaction.atomic():
        RoyaltyRunPayout.objects.filter(run=run).delete()
        RoyaltyRunPayout.objects.bulk_create(payouts, batch_size=500)
        run.total_amount = _quantize(run_total)
        run.status = RoyaltyRunStatus.READY
        run.consolidation_error = ""
        run.save(update_fields=["total_amount", "status", "consolidation_error", "updated_at"])

    return run
