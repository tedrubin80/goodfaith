from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "summary", "actor", "label")
    list_filter = ("action", "resource_type", "label")
    search_fields = ("summary", "resource_id")
    readonly_fields = (
        "label",
        "actor",
        "action",
        "resource_type",
        "resource_id",
        "summary",
        "metadata",
        "created_at",
    )

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
