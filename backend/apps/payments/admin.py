from django.contrib import admin

from .models import Payout, PayoutBatch


class PayoutInline(admin.TabularInline):
    model = Payout
    extra = 0


@admin.register(PayoutBatch)
class PayoutBatchAdmin(admin.ModelAdmin):
    list_display = ("name", "label", "status", "total_amount", "currency", "created_at")
    list_filter = ("status", "label")
    inlines = [PayoutInline]


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("participant_name", "batch", "amount", "status", "paid_at")
    list_filter = ("status", "batch__label")
