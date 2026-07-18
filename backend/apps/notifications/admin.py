from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "kind", "label", "read_at", "created_at")
    list_filter = ("kind", "read_at")
    search_fields = ("title", "body", "user__username")
    readonly_fields = ("created_at",)
