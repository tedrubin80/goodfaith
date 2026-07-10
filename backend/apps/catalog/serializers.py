from rest_framework import serializers

from .models import Artist, Label, Release, Track


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ("id", "name", "slug", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ("id", "label", "name", "slug", "user", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = (
            "id",
            "release",
            "title",
            "isrc",
            "track_number",
            "duration_seconds",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ReleaseSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    primary_artist_name = serializers.CharField(source="primary_artist.name", read_only=True)
    track_count = serializers.SerializerMethodField()

    class Meta:
        model = Release
        fields = (
            "id",
            "label",
            "primary_artist",
            "primary_artist_name",
            "title",
            "release_type",
            "upc",
            "release_date",
            "tracks",
            "track_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_track_count(self, obj: Release) -> int:
        if hasattr(obj, "_prefetched_objects_cache") and "tracks" in obj._prefetched_objects_cache:
            return len(obj.tracks.all())
        return obj.tracks.count()
