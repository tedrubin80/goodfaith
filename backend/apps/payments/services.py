from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from apps.royalties.models import RoyaltyRun, RoyaltyRunStatus

from .models import Payout, PayoutBatch, PayoutBatchStatus, PayoutStatus

MONEY_QUANT = Decimal("0.0001")


class PayoutGenerationError(Exception):
    pass


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


@transaction.atomic
def generate_payout_batch(run: RoyaltyRun) -> PayoutBatch:
    """Aggregate run payout lines into payable records, one row per participant."""
    if run.status != RoyaltyRunStatus.READY:
        raise PayoutGenerationError("Royalty run must be in ready status before issuing payouts.")
    if hasattr(run, "payout_batch"):
        raise PayoutGenerationError("A payout batch already exists for this run.")
    if not run.payouts.exists():
        raise PayoutGenerationError("Run has no payout lines to issue.")

    totals: dict[tuple[str, int | None], Decimal] = defaultdict(lambda: Decimal("0"))
    artists: dict[tuple[str, int | None], object] = {}

    for line in run.payouts.select_related("artist"):
        key = (line.participant_name, line.artist_id)
        totals[key] += line.amount
        if line.artist_id:
            artists[key] = line.artist

    batch = PayoutBatch.objects.create(
        label=run.label,
        run=run,
        name=f"Payouts — {run.name}",
        total_amount=_quantize(sum(totals.values(), Decimal("0"))),
        currency=run.currency,
        status=PayoutBatchStatus.READY,
    )

    payout_rows = [
        Payout(
            batch=batch,
            artist=artists.get(key),
            participant_name=key[0],
            amount=_quantize(amount),
            status=PayoutStatus.PENDING,
        )
        for key, amount in totals.items()
    ]
    Payout.objects.bulk_create(payout_rows)

    run.status = RoyaltyRunStatus.CLOSED
    run.save(update_fields=["status", "updated_at"])

    return batch
