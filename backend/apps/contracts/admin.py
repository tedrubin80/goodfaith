from django.contrib import admin

from .models import Contract, ContractObligation


class ContractObligationInline(admin.TabularInline):
    model = ContractObligation
    extra = 0


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "label",
        "artist",
        "contract_type",
        "status",
        "start_date",
        "end_date",
    )
    list_filter = ("contract_type", "status", "label")
    search_fields = ("title", "artist__name")
    inlines = [ContractObligationInline]


@admin.register(ContractObligation)
class ContractObligationAdmin(admin.ModelAdmin):
    list_display = ("title", "contract", "status", "due_date")
    list_filter = ("status",)
    raw_id_fields = ("contract", "created_by")
