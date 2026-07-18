from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class ContractType(models.TextChoices):
    RECORDING = "recording", "Recording"
    DISTRIBUTION = "distribution", "Distribution"
    LICENSE = "license", "License"
    SYNC = "sync", "Sync"
    PUBLISHING = "publishing", "Publishing"
    OTHER = "other", "Other"


class ContractStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    ACTIVE = "active", "Active"
    EXPIRED = "expired", "Expired"
    TERMINATED = "terminated", "Terminated"


class Contract(TimeStampedModel):
    """Label contract record — linked to roster artists when applicable."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="contracts",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contracts",
        help_text="Primary artist on this deal, when applicable.",
    )
    title = models.CharField(max_length=512)
    contract_type = models.CharField(
        max_length=16,
        choices=ContractType.choices,
        default=ContractType.RECORDING,
    )
    status = models.CharField(
        max_length=16,
        choices=ContractStatus.choices,
        default=ContractStatus.DRAFT,
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    term_notes = models.TextField(
        blank=True,
        help_text="Key terms, recoupment notes, territories, or obligations.",
    )
    file = models.FileField(
        upload_to="contracts/%Y/%m/",
        blank=True,
        null=True,
        help_text="Signed contract PDF or scan.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contracts_created",
    )

    class Meta:
        ordering = ("-created_at", "title")

    def __str__(self) -> str:
        return self.title


class ObligationStatus(models.TextChoices):
    OPEN = "open", "Open"
    DONE = "done", "Done"
    WAIVED = "waived", "Waived"


class ContractObligation(TimeStampedModel):
    """Tracked obligation on a contract (options, delivery dates, reversion) — no e-sign."""

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="obligations",
    )
    title = models.CharField(max_length=512)
    status = models.CharField(
        max_length=16,
        choices=ObligationStatus.choices,
        default=ObligationStatus.OPEN,
    )
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contract_obligations_created",
    )

    class Meta:
        ordering = ("due_date", "title")

    def __str__(self) -> str:
        return self.title
