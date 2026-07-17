from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Track

from .models import SplitEntry, SplitSheet, SplitSheetStatus, validate_split_entries


class SplitEntrySerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = SplitEntry
        fields = (
            "id",
            "participant_name",
            "artist",
            "role",
            "role_display",
            "percentage",
        )


class SplitSheetSerializer(serializers.ModelSerializer):
    entries = SplitEntrySerializer(many=True)
    track_title = serializers.CharField(source="track.title", read_only=True)
    track_isrc = serializers.CharField(source="track.isrc", read_only=True)
    release_title = serializers.CharField(source="track.release.title", read_only=True)
    release_id = serializers.IntegerField(source="track.release_id", read_only=True)
    primary_artist_name = serializers.CharField(
        source="track.release.primary_artist.name", read_only=True
    )
    total_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SplitSheet
        fields = (
            "id",
            "track",
            "track_title",
            "track_isrc",
            "release_id",
            "release_title",
            "primary_artist_name",
            "status",
            "notes",
            "entries",
            "total_percentage",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_total_percentage(self, obj: SplitSheet) -> str:
        return str(obj.total_percentage)

    def validate(self, attrs):
        entries = attrs.get("entries")
        if entries is None and self.instance:
            return attrs
        if entries is None:
            raise serializers.ValidationError({"entries": "At least one entry is required."})
        status = attrs.get("status", getattr(self.instance, "status", SplitSheetStatus.DRAFT))
        require_full = status == SplitSheetStatus.FINALIZED
        try:
            validate_split_entries(entries, require_full=require_full)
        except Exception as exc:
            raise serializers.ValidationError({"entries": str(exc)}) from exc
        return attrs

    def _sync_entries(self, sheet: SplitSheet, entries_data: list[dict]) -> None:
        sheet.entries.all().delete()
        SplitEntry.objects.bulk_create(
            [SplitEntry(split_sheet=sheet, **entry) for entry in entries_data]
        )

    @transaction.atomic
    def create(self, validated_data):
        entries_data = validated_data.pop("entries")
        sheet = SplitSheet.objects.create(**validated_data)
        self._sync_entries(sheet, entries_data)
        return sheet

    @transaction.atomic
    def update(self, instance, validated_data):
        entries_data = validated_data.pop("entries", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if entries_data is not None:
            self._sync_entries(instance, entries_data)
        return instance


class SplitSheetCreateSerializer(SplitSheetSerializer):
    """Ensures the track belongs to the caller's label before create."""

    def validate_track(self, track: Track):
        label_ids = self.context["label_ids"]
        if track.release.label_id not in label_ids:
            raise serializers.ValidationError("Track is not in your label catalog.")
        if SplitSheet.objects.filter(track=track).exists():
            raise serializers.ValidationError("This track already has a split sheet.")
        return track
