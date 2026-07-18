from django.contrib import admin

from .models import DspDelivery


@admin.register(DspDelivery)
class DspDeliveryAdmin(admin.ModelAdmin):
    list_display = ("release", "dsp", "status", "target_live_date", "distributor")
    list_filter = ("dsp", "status", "label")
    raw_id_fields = ("release", "created_by")
