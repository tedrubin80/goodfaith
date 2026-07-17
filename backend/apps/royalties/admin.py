from django.contrib import admin

from .models import RoyaltyLineItem, RoyaltyRun, RoyaltyStatement


@admin.register(RoyaltyStatement)
class RoyaltyStatementAdmin(admin.ModelAdmin):
    list_display = (
        "filename",
        "distributor",
        "label",
        "status",
        "row_count",
        "total_amount",
        "currency",
        "created_at",
    )
    list_filter = ("distributor", "status", "label")
    search_fields = ("filename",)


@admin.register(RoyaltyLineItem)
class RoyaltyLineItemAdmin(admin.ModelAdmin):
    list_display = (
        "statement",
        "track_title",
        "artist_name",
        "isrc",
        "store",
        "sale_period",
        "quantity",
        "amount",
    )
    list_filter = ("store", "statement__distributor")
    search_fields = ("isrc", "upc", "track_title", "artist_name")


@admin.register(RoyaltyRun)
class RoyaltyRunAdmin(admin.ModelAdmin):
    list_display = ("name", "label", "status", "total_amount", "currency", "created_at")
    list_filter = ("status", "label")
    filter_horizontal = ("statements",)
