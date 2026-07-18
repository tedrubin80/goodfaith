from rest_framework import serializers

from apps.catalog.models import Label

from .models import SyncOpportunity


def _user_label_ids(context: dict) -> set[int]:
    user = context["request"].user
    return set(user.label_memberships.values_list("label_id", flat=True))


class SyncOpportunitySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    media_type_display = serializers.CharField(
        source="get_media_type_display",
        read_only=True,
    )
    track_title = serializers.CharField(source="track.title", read_only=True, default="")
    release_title = serializers.CharField(
        source="release.title",
        read_only=True,
        default="",
    )
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    contract_title = serializers.CharField(
        source="contract.title",
        read_only=True,
        default="",
    )
    assigned_to_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        default="",
    )
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = SyncOpportunity
        fields = (
            "id",
            "label",
            "title",
            "status",
            "status_display",
            "media_type",
            "media_type_display",
            "client_name",
            "supervisor_name",
            "supervisor_email",
            "territory",
            "exclusivity",
            "fee_amount",
            "currency",
            "term_notes",
            "track",
            "track_title",
            "release",
            "release_title",
            "artist",
            "artist_name",
            "contract",
            "contract_title",
            "pitched_at",
            "licensed_at",
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
        if label.id not in _user_label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs: dict) -> dict:
        label = attrs.get("label") or getattr(self.instance, "label", None)

        def _same_label(obj, field: str) -> None:
            if obj is not None and label is not None and obj.label_id != label.id:
                raise serializers.ValidationError(
                    {field: "Must belong to the same label."}
                )

        for field, key in (
            ("artist", "artist"),
            ("release", "release"),
            ("contract", "contract"),
        ):
            if key in attrs:
                _same_label(attrs[key], field)
            elif self.instance is not None:
                _same_label(getattr(self.instance, key), field)

        track = attrs["track"] if "track" in attrs else getattr(self.instance, "track", None)
        if track is not None and label is not None:
            if track.release.label_id != label.id:
                raise serializers.ValidationError(
                    {"track": "Track must belong to the same label."}
                )

        assigned_to = (
            attrs["assigned_to"]
            if "assigned_to" in attrs
            else getattr(self.instance, "assigned_to", None)
        )
        if assigned_to is not None and label is not None:
            if not assigned_to.label_memberships.filter(label=label).exists():
                raise serializers.ValidationError(
                    {"assigned_to": "Assignee must be a member of this label."}
                )

        return attrs

    def create(self, validated_data: dict) -> SyncOpportunity:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
