from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class TaskStatus(models.TextChoices):
    TODO = "todo", "To do"
    IN_PROGRESS = "in_progress", "In progress"
    BLOCKED = "blocked", "Blocked"
    DONE = "done", "Done"


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"


class ReleaseTask(TimeStampedModel):
    """Release project task board item (Module 16)."""

    label = models.ForeignKey(
        "catalog.Label",
        on_delete=models.CASCADE,
        related_name="release_tasks",
    )
    release = models.ForeignKey(
        "catalog.Release",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=16,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    priority = models.CharField(
        max_length=8,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
    )
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_release_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="release_tasks_created",
    )

    class Meta:
        ordering = ("status", "due_date", "-updated_at")

    def __str__(self) -> str:
        return self.title
