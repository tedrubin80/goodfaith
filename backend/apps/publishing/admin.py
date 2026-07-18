from django.contrib import admin

from .models import MusicalWork, RegistrationEvent, WorkShare


class WorkShareInline(admin.TabularInline):
    model = WorkShare
    extra = 0


class RegistrationEventInline(admin.TabularInline):
    model = RegistrationEvent
    extra = 0


@admin.register(MusicalWork)
class MusicalWorkAdmin(admin.ModelAdmin):
    list_display = ("title", "label", "iswc", "registration_status", "target_pro")
    list_filter = ("registration_status", "target_pro", "label")
    search_fields = ("title", "iswc")
    filter_horizontal = ("tracks",)
    inlines = [WorkShareInline, RegistrationEventInline]


@admin.register(RegistrationEvent)
class RegistrationEventAdmin(admin.ModelAdmin):
    list_display = ("work", "status", "pro_society", "occurred_on", "reference")
    list_filter = ("status", "pro_society")
    raw_id_fields = ("work", "created_by")
