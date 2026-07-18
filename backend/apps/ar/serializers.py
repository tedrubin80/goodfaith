from rest_framework import serializers

from apps.catalog.models import Label

from .models import Prospect


def _user_label_ids(context: dict) -> set[int]:
    user = context["request"].user
    return set(user.label_memberships.values_list("label_id", flat=True))


class ProspectSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        default="",
    )
    signed_artist_name = serializers.CharField(
        source="signed_artist.name",
        read_only=True,
        default="",
    )
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = Prospect
        fields = (
            "id",
            "label",
            "name",
            "stage",
            "stage_display",
            "priority",
            "priority_display",
            "genre",
            "location",
            "contact_email",
            "contact_phone",
            "spotify_url",
            "instagram_url",
            "other_links",
            "source",
            "notes",
            "assigned_to",
            "assigned_to_username",
            "signed_artist",
            "signed_artist_name",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def validate_label(self, label: Label) -> Label:
        if label.id not in _user_label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs: dict) -> dict:
        label = attrs.get("label") or getattr(self.instance, "label", None)
        signed_artist = attrs.get("signed_artist", getattr(self.instance, "signed_artist", None))
        if "signed_artist" in attrs and attrs["signed_artist"] is None:
            signed_artist = None

        if label and signed_artist and signed_artist.label_id != label.id:
            raise serializers.ValidationError(
                {"signed_artist": "Artist must belong to the same label."}
            )

        assigned_to = attrs.get("assigned_to", getattr(self.instance, "assigned_to", None))
        if "assigned_to" in attrs and attrs["assigned_to"] is None:
            assigned_to = None
        if assigned_to is not None and label is not None:
            if not assigned_to.label_memberships.filter(label=label).exists():
                raise serializers.ValidationError(
                    {"assigned_to": "Assignee must be a member of this label."}
                )

        return attrs

    def create(self, validated_data: dict) -> Prospect:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
