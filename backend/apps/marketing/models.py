from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class CampaignStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class CampaignType(models.TextChoices):
    RELEASE = "release", "Release campaign"
    PLAYLIST = "playlist", "Playlist pitch"
    PRESS = "press", "Press / PR"
    SOCIAL = "social", "Social"
    ADS = "ads", "Paid ads"
    OTHER = "other", "Other"


class MarketingCampaign(TimeStampedModel):
    """
    Release / promo campaign tracker (Module 13).
    Stores smart-link URLs and channel plans without external ad/DSP integrations.
    """

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="marketing_campaigns",
    )
    title = models.CharField(max_length=512)
    status = models.CharField(
        max_length=16,
        choices=CampaignStatus.choices,
        default=CampaignStatus.DRAFT,
    )
    campaign_type = models.CharField(
        max_length=16,
        choices=CampaignType.choices,
        default=CampaignType.RELEASE,
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marketing_campaigns",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marketing_campaigns",
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    smart_link_url = models.URLField(
        blank=True,
        help_text="External smart link / landing page (Linkfire, Feature.fm, etc.).",
    )
    channels = models.TextField(
        blank=True,
        help_text="Channels in play (Spotify, Instagram, press list, playlist targets…).",
    )
    goals = models.TextField(
        blank=True,
        help_text="Campaign goals (streams, playlist adds, press hits, etc.).",
    )
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_marketing_campaigns",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marketing_campaigns_created",
    )

    class Meta:
        ordering = ("-updated_at", "title")

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"
