from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "label",
            "kind",
            "kind_display",
            "title",
            "body",
            "link_path",
            "resource_type",
            "resource_id",
            "is_read",
            "read_at",
            "created_at",
        )
        read_only_fields = fields
