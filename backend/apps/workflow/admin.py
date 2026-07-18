from django.contrib import admin

from .models import ReleaseTask


@admin.register(ReleaseTask)
class ReleaseTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "release", "status", "priority", "due_date", "assigned_to")
    list_filter = ("status", "priority", "label")
    raw_id_fields = ("release", "assigned_to", "created_by")
