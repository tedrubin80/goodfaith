from django.contrib import admin

from .models import DigitalAsset


@admin.register(DigitalAsset)
class DigitalAssetAdmin(admin.ModelAdmin):
    list_display = ("title", "asset_type", "version_label", "release", "artist", "created_at")
    list_filter = ("asset_type", "label")
    raw_id_fields = ("artist", "release", "track", "uploaded_by")
