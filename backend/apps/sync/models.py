from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class SyncStatus(models.TextChoices):
    INQUIRY = "inquiry", "Inquiry"
    PITCHED = "pitched", "Pitched"
    SHORTLISTED = "shortlisted", "Shortlisted"
    CLEARED = "cleared", "Cleared"
    LICENSED = "licensed", "Licensed"
    PASSED = "passed", "Passed"
    ON_HOLD = "on_hold", "On hold"


class SyncMediaType(models.TextChoices):
    FILM = "film", "Film"
    TV = "tv", "TV"
    AD = "ad", "Advertising"
    TRAILER = "trailer", "Trailer"
    GAME = "game", "Game"
    SOCIAL = "social", "Social / digital"
    OTHER = "other", "Other"


class SyncOpportunity(TimeStampedModel):
    """
    Sync licensing opportunity (Module 10).
    Tracks pitch → clearance → license without requiring DISCO/Synchtank.
    """

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="sync_opportunities",
    )
    title = models.CharField(
        max_length=512,
        help_text="Project or brief name (e.g. Netflix S2E4, Brand campaign).",
    )
    status = models.CharField(
        max_length=16,
        choices=SyncStatus.choices,
        default=SyncStatus.INQUIRY,
    )
    media_type = models.CharField(
        max_length=16,
        choices=SyncMediaType.choices,
        default=SyncMediaType.OTHER,
    )
    client_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Studio, brand, agency, or production company.",
    )
    supervisor_name = models.CharField(max_length=255, blank=True)
    supervisor_email = models.EmailField(blank=True)
    territory = models.CharField(
        max_length=255,
        blank=True,
        help_text="e.g. Worldwide, US/CA, EU.",
    )
    exclusivity = models.CharField(
        max_length=255,
        blank=True,
        help_text="Exclusivity terms, if any.",
    )
    fee_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    currency = models.CharField(max_length=3, default="USD")
    term_notes = models.TextField(
        blank=True,
        help_text="Use type, term length, revision rights, or other deal terms.",
    )
    track = models.ForeignKey(
        "catalog.Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_opportunities",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_opportunities",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_opportunities",
    )
    contract = models.ForeignKey(
        "contracts.Contract",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_opportunities",
        help_text="Optional linked sync contract when the deal closes.",
    )
    pitched_at = models.DateField(null=True, blank=True)
    licensed_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_sync_opportunities",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_opportunities_created",
    )

    class Meta:
        ordering = ("-updated_at", "title")
        verbose_name_plural = "sync opportunities"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"
