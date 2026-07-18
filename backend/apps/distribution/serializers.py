from rest_framework import serializers

from apps.catalog.models import Label

from .models import DspDelivery


def _label_ids(context):
    return set(context["request"].user.label_memberships.values_list("label_id", flat=True))


class DspDeliverySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    dsp_display = serializers.CharField(source="get_dsp_display", read_only=True)
    release_title = serializers.CharField(source="release.title", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=""
    )

    class Meta:
        model = DspDelivery
        fields = (
            "id",
            "label",
            "release",
            "release_title",
            "dsp",
            "dsp_display",
            "status",
            "status_display",
            "distributor",
            "target_live_date",
            "submitted_at",
            "live_at",
            "store_url",
            "notes",
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
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
