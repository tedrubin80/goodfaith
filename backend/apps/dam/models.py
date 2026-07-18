from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class AssetType(models.TextChoices):
    MASTER = "master", "Master audio"
    STEM = "stem", "Stem"
    ARTWORK = "artwork", "Artwork"
    VIDEO = "video", "Video"
    DOCUMENT = "document", "Document"
    OTHER = "other", "Other"


class DigitalAsset(TimeStampedModel):
    """Catalog file asset — masters, artwork, stems (Module 3)."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="digital_assets",
    )
    artist = models.ForeignKey(
        "catalog.Artist",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="digital_assets",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="digital_assets",
    )
    track = models.ForeignKey(
        "catalog.Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="digital_assets",
    )
    asset_type = models.CharField(
        max_length=16,
        choices=AssetType.choices,
        default=AssetType.OTHER,
    )
    title = models.CharField(max_length=512)
    version_label = models.CharField(
        max_length=128,
        blank=True,
        help_text="e.g. Mastered v3, Cover 3000px",
    )
    file = models.FileField(upload_to="assets/%Y/%m/")
    notes = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="digital_assets_uploaded",
    )

    class Meta:
        ordering = ("-created_at", "title")

    def __str__(self) -> str:
        return self.title
