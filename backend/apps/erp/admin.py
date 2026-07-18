from django.contrib import admin

from .models import Budget, LabelExpense, RecoupmentEntry


@admin.register(LabelExpense)
class LabelExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "description",
        "label",
        "artist",
        "category",
        "amount",
        "incurred_on",
        "is_recoupable",
    )
    list_filter = ("category", "is_recoupable", "label")
    search_fields = ("description",)
    raw_id_fields = ("artist", "release", "created_by")


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("name", "label", "artist", "category", "amount", "period_start")
    list_filter = ("category", "label")
    raw_id_fields = ("artist", "release", "created_by")


@admin.register(RecoupmentEntry)
class RecoupmentEntryAdmin(admin.ModelAdmin):
    list_display = (
        "artist",
        "entry_type",
        "amount",
        "effective_on",
        "description",
        "label",
    )
    list_filter = ("entry_type", "label")
    raw_id_fields = ("artist", "release", "expense", "created_by")
