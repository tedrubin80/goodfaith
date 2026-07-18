from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class PipelineStage(models.TextChoices):
    LEAD = "lead", "Lead"
    RESEARCHING = "researching", "Researching"
    CONTACTING = "contacting", "Contacting"
    MEETING = "meeting", "Meeting"
    NEGOTIATING = "negotiating", "Negotiating"
    SIGNED = "signed", "Signed"
    PASSED = "passed", "Passed"
    ON_HOLD = "on_hold", "On hold"


class ProspectPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    HOT = "hot", "Hot"


class Prospect(TimeStampedModel):
    """
    A&R talent pipeline prospect (Module 11).
    Tracks unsigned / in-discussion talent without exposing financial data.
    """

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="prospects",
    )
    name = models.CharField(max_length=255)
    stage = models.CharField(
        max_length=16,
        choices=PipelineStage.choices,
        default=PipelineStage.LEAD,
    )
    priority = models.CharField(
        max_length=8,
        choices=ProspectPriority.choices,
        default=ProspectPriority.MEDIUM,
    )
    genre = models.CharField(max_length=128, blank=True)
    location = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=64, blank=True)
    spotify_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    other_links = models.TextField(
        blank=True,
        help_text="Additional discovery links (SoundCloud, TikTok, press, etc.).",
    )
    source = models.CharField(
        max_length=255,
        blank=True,
        help_text="How this prospect was discovered (demo, referral, showcase, etc.).",
    )
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_prospects",
    )
    signed_artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prospect_origin",
        help_text="Roster artist created when this prospect signs.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prospects_created",
    )

    class Meta:
        ordering = ("-updated_at", "name")

    def __str__(self) -> str:
        return f"{self.name} ({self.get_stage_display()})"
