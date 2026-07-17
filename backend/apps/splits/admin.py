from django.contrib import admin

from .models import SplitEntry, SplitSheet


class SplitEntryInline(admin.TabularInline):
    model = SplitEntry
    extra = 1


@admin.register(SplitSheet)
class SplitSheetAdmin(admin.ModelAdmin):
    list_display = ("track", "status", "created_at", "updated_at")
    list_filter = ("status", "track__release__label")
    search_fields = ("track__title", "track__isrc")
    inlines = [SplitEntryInline]


@admin.register(SplitEntry)
class SplitEntryAdmin(admin.ModelAdmin):
    list_display = ("participant_name", "split_sheet", "role", "percentage", "artist")
    list_filter = ("role",)
