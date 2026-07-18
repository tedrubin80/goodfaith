from rest_framework import serializers

from apps.catalog.models import Label

from .models import MarketingCampaign


def _user_label_ids(context: dict) -> set[int]:
    user = context["request"].user
    return set(user.label_memberships.values_list("label_id", flat=True))


class MarketingCampaignSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    campaign_type_display = serializers.CharField(
        source="get_campaign_type_display",
        read_only=True,
    )
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    release_title = serializers.CharField(
        source="release.title",
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
        model = MarketingCampaign
        fields = (
            "id",
            "label",
            "title",
            "status",
            "status_display",
            "campaign_type",
            "campaign_type_display",
            "artist",
            "artist_name",
            "release",
            "release_title",
            "start_date",
            "end_date",
            "smart_link_url",
            "channels",
            "goals",
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

        for field in ("artist", "release"):
            if field in attrs and attrs[field] is not None and label is not None:
                if attrs[field].label_id != label.id:
                    raise serializers.ValidationError(
                        {field: "Must belong to the same label."}
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

        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )

        return attrs

    def create(self, validated_data: dict) -> MarketingCampaign:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
