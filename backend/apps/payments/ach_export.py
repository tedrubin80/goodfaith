import csv
import io

from .models import PayoutBatch


def payout_batch_ach_csv(batch: PayoutBatch) -> bytes:
    """Export pending payouts in a simple CSV suitable for bank/ACH batch upload."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "participant_name",
            "amount",
            "currency",
            "payout_id",
            "batch_id",
            "payment_reference",
        ]
    )
    for payout in batch.payouts.filter(status="pending").order_by("participant_name"):
        writer.writerow(
            [
                payout.participant_name,
                str(payout.amount),
                batch.currency,
                payout.pk,
                batch.pk,
                "",
            ]
        )
    return buffer.getvalue().encode("utf-8")


def ach_export_filename(batch: PayoutBatch) -> str:
    slug = batch.label.slug
    return f"goodfaith-ach-{slug}-batch-{batch.pk}.csv"
