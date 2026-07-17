from rest_framework import serializers

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "label",
            "actor",
            "actor_username",
            "action",
            "action_display",
            "resource_type",
            "resource_id",
            "summary",
            "metadata",
            "created_at",
        )
        read_only_fields = fields

    def get_actor_username(self, obj: AuditEvent) -> str | None:
        return obj.actor.username if obj.actor_id else None
