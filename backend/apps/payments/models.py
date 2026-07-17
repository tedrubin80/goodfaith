from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.catalog.models import Artist, Label
from apps.core.models import TimeStampedModel
from apps.royalties.models import RoyaltyRun, RoyaltyRunStatus


class PayoutBatchStatus(models.TextChoices):
    READY = "ready", "Ready to pay"
    PARTIALLY_PAID = "partially_paid", "Partially paid"
    PAID = "paid", "Paid"
    CLOSED = "closed", "Closed"


class PayoutStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    CANCELLED = "cancelled", "Cancelled"


class PayoutBatch(TimeStampedModel):
    """Payable batch generated from a consolidated royalty run."""

    label = models.ForeignKey(Label, on_delete=models.CASCADE, related_name="payout_batches")
    run = models.OneToOneField(
        RoyaltyRun,
        on_delete=models.CASCADE,
        related_name="payout_batch",
    )
    name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=16,
        choices=PayoutBatchStatus.choices,
        default=PayoutBatchStatus.READY,
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal("0"))
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.name

    def refresh_status(self) -> None:
        payouts = self.payouts.all()
        if not payouts.exists():
            self.status = PayoutBatchStatus.READY
        elif payouts.filter(status=PayoutStatus.PENDING).exists():
            if payouts.filter(status=PayoutStatus.PAID).exists():
                self.status = PayoutBatchStatus.PARTIALLY_PAID
            else:
                self.status = PayoutBatchStatus.READY
        else:
            self.status = PayoutBatchStatus.PAID
        self.save(update_fields=["status", "updated_at"])


class Payout(TimeStampedModel):
    """Aggregated payable amount for one participant from a royalty run."""

    batch = models.ForeignKey(PayoutBatch, on_delete=models.CASCADE, related_name="payouts")
    artist = models.ForeignKey(
        Artist,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payouts",
    )
    participant_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal("0"))
    status = models.CharField(
        max_length=16,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(
        max_length=128,
        blank=True,
        help_text="Bank transfer ID, check number, or other payment trace reference.",
    )

    class Meta:
        ordering = ("-amount", "participant_name")
        constraints = [
            models.UniqueConstraint(
                fields=["batch", "participant_name", "artist"],
                name="unique_payout_per_participant_in_batch",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.participant_name} — {self.amount}"

    def mark_paid(self, reference: str = "") -> None:
        self.status = PayoutStatus.PAID
        self.paid_at = timezone.now()
        if reference:
            self.payment_reference = reference
        self.save(update_fields=["status", "paid_at", "payment_reference", "updated_at"])
        self.batch.refresh_status()
