from rest_framework import serializers

from apps.catalog.models import Artist, Label

from .models import Contract


def _user_label_ids(context: dict) -> set[int]:
    user = context["request"].user
    return set(user.label_memberships.values_list("label_id", flat=True))


class ContractSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    contract_type_display = serializers.CharField(
        source="get_contract_type_display",
        read_only=True,
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default="")
    filename = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = (
            "id",
            "label",
            "artist",
            "artist_name",
            "title",
            "contract_type",
            "contract_type_display",
            "status",
            "status_display",
            "start_date",
            "end_date",
            "term_notes",
            "file",
            "filename",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def get_filename(self, obj: Contract) -> str:
        if obj.file:
            return obj.file.name.rsplit("/", 1)[-1]
        return ""

    def validate_label(self, label: Label) -> Label:
        if label.id not in _user_label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs: dict) -> dict:
        label = attrs.get("label") or getattr(self.instance, "label", None)
        artist = attrs.get("artist") or getattr(self.instance, "artist", None)
        if label and artist and artist.label_id != label.id:
            raise serializers.ValidationError({"artist": "Artist must belong to the same label."})
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        return attrs

    def create(self, validated_data: dict) -> Contract:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
