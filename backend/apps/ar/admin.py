from django.contrib import admin

from .models import Prospect


@admin.register(Prospect)
class ProspectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "label",
        "stage",
        "priority",
        "genre",
        "assigned_to",
        "signed_artist",
        "updated_at",
    )
    list_filter = ("stage", "priority", "label")
    search_fields = ("name", "genre", "location", "contact_email", "source")
    raw_id_fields = ("assigned_to", "signed_artist", "created_by")
