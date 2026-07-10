from django.contrib import admin

from .models import RoyaltyRun, RoyaltyStatement


@admin.register(RoyaltyStatement)
class RoyaltyStatementAdmin(admin.ModelAdmin):
    list_display = (
        "filename",
        "distributor",
        "label",
        "status",
        "total_amount",
        "currency",
        "created_at",
    )
    list_filter = ("distributor", "status", "label")
    search_fields = ("filename",)


@admin.register(RoyaltyRun)
class RoyaltyRunAdmin(admin.ModelAdmin):
    list_display = ("name", "label", "status", "total_amount", "currency", "created_at")
    list_filter = ("status", "label")
    filter_horizontal = ("statements",)
