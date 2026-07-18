from django.conf import settings
from django.db import models
from django.utils import timezone


class NotificationKind(models.TextChoices):
    STATEMENT_PROCESSED = "statement_processed", "Statement processed"
    STATEMENT_FAILED = "statement_failed", "Statement failed"
    PAYOUT_READY = "payout_ready", "Payout ready"
    PAYOUT_PAID = "payout_paid", "Payout paid"


class Notification(models.Model):
    """In-app notification for a portal user (no email delivery in Phase 2)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=32, choices=NotificationKind.choices)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    link_path = models.CharField(
        max_length=512,
        blank=True,
        help_text="Portal-relative path, e.g. /payments or /royalties/runs/3.",
    )
    resource_type = models.CharField(max_length=64, blank=True)
    resource_id = models.PositiveIntegerField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def is_read(self) -> bool:
        return self.read_at is not None

    def mark_read(self) -> None:
        if self.read_at is None:
            self.read_at = timezone.now()
            self.save(update_fields=["read_at"])
