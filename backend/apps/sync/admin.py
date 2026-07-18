from django.contrib import admin

from .models import SyncOpportunity


@admin.register(SyncOpportunity)
class SyncOpportunityAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "label",
        "status",
        "media_type",
        "client_name",
        "fee_amount",
        "artist",
        "updated_at",
    )
    list_filter = ("status", "media_type", "label")
    search_fields = ("title", "client_name", "supervisor_name", "supervisor_email")
    raw_id_fields = (
        "track",
        "release",
        "artist",
        "contract",
        "assigned_to",
        "created_by",
    )
