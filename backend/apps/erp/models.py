from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class ExpenseCategory(models.TextChoices):
    ADVANCE = "advance", "Advance"
    RECORDING = "recording", "Recording"
    MARKETING = "marketing", "Marketing"
    VIDEO = "video", "Video"
    TOURING = "touring", "Touring"
    LEGAL = "legal", "Legal"
    OTHER = "other", "Other"


class LabelExpense(TimeStampedModel):
    """Label spend against an artist/release — optionally recoupable (Module 18)."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    category = models.CharField(
        max_length=16,
        choices=ExpenseCategory.choices,
        default=ExpenseCategory.OTHER,
    )
    description = models.CharField(max_length=512)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    incurred_on = models.DateField()
    is_recoupable = models.BooleanField(
        default=True,
        help_text="If true, counts toward the artist's unrecouped balance.",
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses_created",
    )

    class Meta:
        ordering = ("-incurred_on", "-created_at")

    def __str__(self) -> str:
        return f"{self.description} ({self.amount} {self.currency})"


class Budget(TimeStampedModel):
    """Simple budget envelope for a label, artist, or release."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="budgets",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="budgets",
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=16,
        choices=ExpenseCategory.choices,
        default=ExpenseCategory.OTHER,
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="budgets_created",
    )

    class Meta:
        ordering = ("-created_at", "name")

    def __str__(self) -> str:
        return self.name


class RecoupmentEntryType(models.TextChoices):
    CHARGE = "charge", "Charge (unrecouped)"
    CREDIT = "credit", "Credit (recouped)"
    ADJUSTMENT = "adjustment", "Adjustment"


class RecoupmentEntry(TimeStampedModel):
    """
    Ledger line for artist recoupment balances.
    Charges increase unrecouped; credits decrease (e.g. from royalty runs).
    """

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="recoupment_entries",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.CASCADE,
        related_name="recoupment_entries",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recoupment_entries",
    )
    expense = models.ForeignKey(
        LabelExpense,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recoupment_entries",
    )
    entry_type = models.CharField(
        max_length=16,
        choices=RecoupmentEntryType.choices,
        default=RecoupmentEntryType.CHARGE,
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Always positive; entry_type determines debit/credit.",
    )
    currency = models.CharField(max_length=3, default="USD")
    effective_on = models.DateField()
    description = models.CharField(max_length=512)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recoupment_entries_created",
    )

    class Meta:
        ordering = ("-effective_on", "-created_at")
        verbose_name_plural = "recoupment entries"

    def __str__(self) -> str:
        return f"{self.artist} {self.entry_type} {self.amount}"

    @property
    def signed_amount(self) -> Decimal:
        if self.entry_type == RecoupmentEntryType.CREDIT:
            return -self.amount
        if self.entry_type == RecoupmentEntryType.ADJUSTMENT:
            return self.amount
        return self.amount
