from django.contrib import admin

from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("title", "label", "artist", "contract_type", "status", "start_date", "end_date")
    list_filter = ("contract_type", "status", "label")
    search_fields = ("title", "artist__name")
