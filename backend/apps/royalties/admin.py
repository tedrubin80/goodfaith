from django.contrib import admin

from .models import RoyaltyLineItem, RoyaltyRun, RoyaltyRunPayout, RoyaltyStatement


class RoyaltyRunPayoutInline(admin.TabularInline):
    model = RoyaltyRunPayout
    extra = 0
    readonly_fields = (
        "participant_name",
        "track_title",
        "isrc",
        "share_percentage",
        "track_gross",
        "amount",
    )


@admin.register(RoyaltyRun)
class RoyaltyRunAdmin(admin.ModelAdmin):
    list_display = ("name", "label", "status", "total_amount", "currency", "created_at")
    list_filter = ("status", "label")
    filter_horizontal = ("statements",)
    inlines = [RoyaltyRunPayoutInline]


@admin.register(RoyaltyRunPayout)
class RoyaltyRunPayoutAdmin(admin.ModelAdmin):
    list_display = (
        "run",
        "participant_name",
        "track_title",
        "amount",
        "share_percentage",
    )
    list_filter = ("run__label",)


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


@admin.register(RoyaltyLineItem)
class RoyaltyLineItemAdmin(admin.ModelAdmin):
    list_display = ("track_title", "isrc", "statement", "amount", "store", "sale_period")
    list_filter = ("statement__label", "statement__distributor")
