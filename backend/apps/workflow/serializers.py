from rest_framework import serializers

from apps.catalog.models import Label

from .models import ReleaseTask


def _label_ids(context):
    return set(context["request"].user.label_memberships.values_list("label_id", flat=True))


class ReleaseTaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    release_title = serializers.CharField(source="release.title", read_only=True)
    assigned_to_username = serializers.CharField(
        source="assigned_to.username", read_only=True, default=""
    )
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=""
    )

    class Meta:
        model = ReleaseTask
        fields = (
            "id",
            "label",
            "release",
            "release_title",
            "title",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "due_date",
            "notes",
            "assigned_to",
            "assigned_to_username",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def validate_label(self, label: Label) -> Label:
        if label.id not in _label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs):
        label = attrs.get("label") or getattr(self.instance, "label", None)
        release = attrs.get("release") or getattr(self.instance, "release", None)
        if label and release and release.label_id != label.id:
            raise serializers.ValidationError(
                {"release": "Release must belong to the same label."}
            )
        assigned = attrs.get("assigned_to", getattr(self.instance, "assigned_to", None))
        if "assigned_to" in attrs and attrs["assigned_to"] is None:
            assigned = None
        if assigned is not None and label is not None:
            if not assigned.label_memberships.filter(label=label).exists():
                raise serializers.ValidationError(
                    {"assigned_to": "Assignee must be a member of this label."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
