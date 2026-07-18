from django.contrib import admin

from .models import MarketingCampaign


@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "label",
        "status",
        "campaign_type",
        "artist",
        "release",
        "start_date",
        "updated_at",
    )
    list_filter = ("status", "campaign_type", "label")
    search_fields = ("title", "channels", "goals", "smart_link_url")
    raw_id_fields = ("artist", "release", "assigned_to", "created_by")
