from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from apps.catalog.models import Artist, Track
from apps.core.models import TimeStampedModel


class SplitRole(models.TextChoices):
    ARTIST = "artist", "Artist"
    PRODUCER = "producer", "Producer"
    FEATURED = "featured", "Featured Artist"
    WRITER = "writer", "Writer"
    LABEL = "label", "Label"
    OTHER = "other", "Other"


class SplitSheetStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    FINALIZED = "finalized", "Finalized"


class SplitSheet(TimeStampedModel):
    """Track-level master-recording royalty split sheet."""

    track = models.OneToOneField(Track, on_delete=models.CASCADE, related_name="split_sheet")
    status = models.CharField(
        max_length=16,
        choices=SplitSheetStatus.choices,
        default=SplitSheetStatus.DRAFT,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self) -> str:
        return f"Split sheet — {self.track.title}"

    @property
    def total_percentage(self) -> Decimal:
        return self.entries.aggregate(total=models.Sum("percentage"))["total"] or Decimal("0")


class SplitEntry(TimeStampedModel):
    split_sheet = models.ForeignKey(SplitSheet, on_delete=models.CASCADE, related_name="entries")
    participant_name = models.CharField(max_length=255)
    artist = models.ForeignKey(
        Artist,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="split_entries",
        help_text="Optional link to a roster artist for payouts and portal access.",
    )
    role = models.CharField(max_length=16, choices=SplitRole.choices, default=SplitRole.ARTIST)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ("-percentage", "participant_name")

    def __str__(self) -> str:
        return f"{self.participant_name} — {self.percentage}%"


def validate_split_entries(entries: list[dict], *, require_full: bool) -> None:
    if not entries:
        raise ValidationError("At least one split entry is required.")
    total = sum(Decimal(str(e["percentage"])) for e in entries)
    if require_full and total != Decimal("100"):
        raise ValidationError(f"Split percentages must total 100% (currently {total}%).")
    if total > Decimal("100"):
        raise ValidationError(f"Split percentages cannot exceed 100% (currently {total}%).")
