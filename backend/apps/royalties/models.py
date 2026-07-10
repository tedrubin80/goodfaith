from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.catalog.models import Label
from apps.core.models import TimeStampedModel


class Distributor(models.TextChoices):
    DISTROKID = "distrokid", "DistroKid"
    TUNECORE = "tunecore", "TuneCore"
    CD_BABY = "cd_baby", "CD Baby"
    SYMPHONIC = "symphonic", "Symphonic"
    ONERPM = "onerpm", "ONErpm"
    ROUTENOTE = "routenote", "RouteNote"
    TOOLOST = "toolost", "TooLost"
    FUGA = "fuga", "FUGA"
    VYDIA = "vydia", "Vydia"
    THE_ORCHARD = "the_orchard", "The Orchard"
    OTHER = "other", "Other"


class StatementStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    PROCESSED = "processed", "Processed"
    FAILED = "failed", "Failed"


class RoyaltyStatement(TimeStampedModel):
    """Uploaded distributor royalty statement awaiting normalization."""

    label = models.ForeignKey(Label, on_delete=models.CASCADE, related_name="royalty_statements")
    distributor = models.CharField(max_length=32, choices=Distributor.choices)
    filename = models.CharField(max_length=512)
    file = models.FileField(upload_to="royalty_statements/%Y/%m/")
    period_start = models.DateField(blank=True, null=True)
    period_end = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=16,
        choices=StatementStatus.choices,
        default=StatementStatus.PENDING,
    )
    row_count = models.PositiveIntegerField(blank=True, null=True)
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        blank=True,
        null=True,
    )
    currency = models.CharField(max_length=3, default="USD")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_statements",
    )
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.get_distributor_display()} — {self.filename}"


class RoyaltyRunStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    READY = "ready", "Ready"
    CLOSED = "closed", "Closed"


class RoyaltyRun(TimeStampedModel):
    """A consolidated royalty run combining one or more normalized statements."""

    label = models.ForeignKey(Label, on_delete=models.CASCADE, related_name="royalty_runs")
    name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=16,
        choices=RoyaltyRunStatus.choices,
        default=RoyaltyRunStatus.DRAFT,
    )
    statements = models.ManyToManyField(RoyaltyStatement, related_name="runs", blank=True)
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        default=Decimal("0"),
    )
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.name
