from django.contrib import admin

from .models import MusicalWork, WorkShare


class WorkShareInline(admin.TabularInline):
    model = WorkShare
    extra = 0


@admin.register(MusicalWork)
class MusicalWorkAdmin(admin.ModelAdmin):
    list_display = ("title", "label", "iswc", "registration_status", "target_pro")
    list_filter = ("registration_status", "target_pro", "label")
    search_fields = ("title", "iswc")
    filter_horizontal = ("tracks",)
    inlines = [WorkShareInline]
