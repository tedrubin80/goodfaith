from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class DeliveryStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    SUBMITTED = "submitted", "Submitted"
    LIVE = "live", "Live"
    TAKEN_DOWN = "taken_down", "Taken down"
    FAILED = "failed", "Failed"


class DspTarget(models.TextChoices):
    SPOTIFY = "spotify", "Spotify"
    APPLE = "apple", "Apple Music"
    AMAZON = "amazon", "Amazon Music"
    YOUTUBE = "youtube", "YouTube Music"
    TIDAL = "tidal", "Tidal"
    DEEZER = "deezer", "Deezer"
    OTHER = "other", "Other"


class DspDelivery(TimeStampedModel):
    """DSP delivery tracking for a release (Module 9) — calendar, not distributor APIs."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="dsp_deliveries",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.CASCADE,
        related_name="dsp_deliveries",
    )
    dsp = models.CharField(max_length=16, choices=DspTarget.choices, default=DspTarget.SPOTIFY)
    status = models.CharField(
        max_length=16,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PLANNED,
    )
    distributor = models.CharField(
        max_length=128,
        blank=True,
        help_text="Distributor used for this delivery (DistroKid, FUGA, etc.).",
    )
    target_live_date = models.DateField(null=True, blank=True)
    submitted_at = models.DateField(null=True, blank=True)
    live_at = models.DateField(null=True, blank=True)
    store_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dsp_deliveries_created",
    )

    class Meta:
        ordering = ("target_live_date", "dsp")
        verbose_name_plural = "DSP deliveries"
        constraints = [
            models.UniqueConstraint(
                fields=["release", "dsp"],
                name="unique_dsp_per_release",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.release} → {self.get_dsp_display()}"
