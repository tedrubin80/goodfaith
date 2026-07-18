from rest_framework import serializers

from apps.catalog.models import Label

from .models import DigitalAsset


def _label_ids(context):
    return set(context["request"].user.label_memberships.values_list("label_id", flat=True))


class DigitalAssetSerializer(serializers.ModelSerializer):
    asset_type_display = serializers.CharField(
        source="get_asset_type_display", read_only=True
    )
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    release_title = serializers.CharField(source="release.title", read_only=True, default="")
    track_title = serializers.CharField(source="track.title", read_only=True, default="")
    uploaded_by_username = serializers.CharField(
        source="uploaded_by.username", read_only=True, default=""
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = DigitalAsset
        fields = (
            "id",
            "label",
            "artist",
            "artist_name",
            "release",
            "release_title",
            "track",
            "track_title",
            "asset_type",
            "asset_type_display",
            "title",
            "version_label",
            "file",
            "file_url",
            "notes",
            "uploaded_by",
            "uploaded_by_username",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "uploaded_by", "created_at", "updated_at")

    def get_file_url(self, obj: DigitalAsset) -> str:
        if not obj.file:
            return ""
        request = self.context.get("request")
        url = obj.file.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def validate_label(self, label: Label) -> Label:
        if label.id not in _label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs):
        label = attrs.get("label") or getattr(self.instance, "label", None)
        for field in ("artist", "release"):
            if field in attrs and attrs[field] is not None and label is not None:
                if attrs[field].label_id != label.id:
                    raise serializers.ValidationError(
                        {field: "Must belong to the same label."}
                    )
        track = attrs.get("track", getattr(self.instance, "track", None))
        if "track" in attrs and attrs["track"] is None:
            track = None
        if track is not None and label is not None and track.release.label_id != label.id:
            raise serializers.ValidationError(
                {"track": "Track must belong to the same label."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)
