from django.conf import settings
from django.db import models


class AuditAction(models.TextChoices):
    STATEMENT_UPLOADED = "statement_uploaded", "Statement uploaded"
    STATEMENT_REPROCESSED = "statement_reprocessed", "Statement reprocessed"
    STATEMENT_PROCESSED = "statement_processed", "Statement processed"
    STATEMENT_FAILED = "statement_failed", "Statement parse failed"
    RUN_CREATED = "run_created", "Royalty run created"
    RUN_CONSOLIDATED = "run_consolidated", "Royalty run consolidated"
    RUN_CONSOLIDATION_FAILED = "run_consolidation_failed", "Run consolidation failed"
    PAYOUT_BATCH_ISSUED = "payout_batch_issued", "Payout batch issued"
    PAYOUT_MARKED_PAID = "payout_marked_paid", "Payout marked paid"
    SPLIT_SHEET_FINALIZED = "split_sheet_finalized", "Split sheet finalized"


class AuditEvent(models.Model):
    """Immutable log of financial and royalty-related changes."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
        help_text="Null for system/Celery actions.",
    )
    action = models.CharField(max_length=32, choices=AuditAction.choices)
    resource_type = models.CharField(max_length=64)
    resource_id = models.PositiveIntegerField()
    summary = models.CharField(max_length=512)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["label", "-created_at"]),
            models.Index(fields=["resource_type", "resource_id"]),
        ]

    def __str__(self) -> str:
        return self.summary
