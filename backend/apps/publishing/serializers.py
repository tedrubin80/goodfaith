from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Artist, Label, Track

from .models import MusicalWork, RegistrationStatus, WorkShare


def _user_label_ids(context: dict) -> set[int]:
    user = context["request"].user
    return set(user.label_memberships.values_list("label_id", flat=True))


class WorkShareSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    pro_affiliation_display = serializers.CharField(
        source="get_pro_affiliation_display",
        read_only=True,
    )
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")

    class Meta:
        model = WorkShare
        fields = (
            "id",
            "contributor_name",
            "artist",
            "artist_name",
            "role",
            "role_display",
            "percentage",
            "ipi_cae",
            "pro_affiliation",
            "pro_affiliation_display",
        )


class MusicalWorkSerializer(serializers.ModelSerializer):
    shares = WorkShareSerializer(many=True)
    track_ids = serializers.PrimaryKeyRelatedField(
        source="tracks",
        many=True,
        queryset=Track.objects.all(),
        required=False,
    )
    registration_status_display = serializers.CharField(
        source="get_registration_status_display",
        read_only=True,
    )
    target_pro_display = serializers.CharField(
        source="get_target_pro_display",
        read_only=True,
    )
    total_percentage = serializers.SerializerMethodField()
    track_titles = serializers.SerializerMethodField()

    class Meta:
        model = MusicalWork
        fields = (
            "id",
            "label",
            "title",
            "iswc",
            "registration_status",
            "registration_status_display",
            "target_pro",
            "target_pro_display",
            "notes",
            "track_ids",
            "track_titles",
            "shares",
            "total_percentage",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_total_percentage(self, obj: MusicalWork) -> str:
        total = sum((s.percentage for s in obj.shares.all()), Decimal("0"))
        return str(total)

    def get_track_titles(self, obj: MusicalWork) -> list[str]:
        return [t.title for t in obj.tracks.all()]

    def validate_label(self, label: Label) -> Label:
        if label.id not in _user_label_ids(self.context):
            raise serializers.ValidationError("Label not accessible.")
        return label

    def validate(self, attrs: dict) -> dict:
        label = attrs.get("label") or getattr(self.instance, "label", None)
        tracks = attrs.get("tracks")
        if tracks is None and self.instance:
            tracks = list(self.instance.tracks.all())
        if label and tracks:
            for track in tracks:
                if track.release.label_id != label.id:
                    raise serializers.ValidationError(
                        {"track_ids": f"Track “{track.title}” belongs to a different label."}
                    )

        shares_data = self.initial_data.get("shares")
        if shares_data is not None:
            total = sum(Decimal(str(s.get("percentage", 0))) for s in shares_data)
            status = attrs.get(
                "registration_status",
                getattr(self.instance, "registration_status", RegistrationStatus.DRAFT),
            )
            if status in {
                RegistrationStatus.READY,
                RegistrationStatus.SUBMITTED,
                RegistrationStatus.REGISTERED,
            } and total != Decimal("100.00"):
                raise serializers.ValidationError(
                    {
                        "shares": (
                            f"Shares must total 100% before marking ready/submitted/registered "
                            f"(currently {total}%)."
                        )
                    }
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> MusicalWork:
        tracks = validated_data.pop("tracks", [])
        validated_data.pop("shares", None)
        shares_data = self.initial_data.get("shares", [])
        work = MusicalWork.objects.create(**validated_data)
        if tracks:
            work.tracks.set(tracks)
        self._replace_shares(work, shares_data)
        return work

    @transaction.atomic
    def update(self, instance: MusicalWork, validated_data: dict) -> MusicalWork:
        tracks = validated_data.pop("tracks", None)
        validated_data.pop("shares", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tracks is not None:
            instance.tracks.set(tracks)
        if "shares" in self.initial_data:
            self._replace_shares(instance, self.initial_data.get("shares", []))
        return instance

    def _replace_shares(self, work: MusicalWork, shares_data: list) -> None:
        work.shares.all().delete()
        label_ids = _user_label_ids(self.context)
        for row in shares_data:
            artist_id = row.get("artist")
            artist = None
            if artist_id:
                artist = Artist.objects.filter(pk=artist_id, label_id__in=label_ids).first()
            WorkShare.objects.create(
                work=work,
                contributor_name=row.get("contributor_name", "").strip() or "Unknown",
                artist=artist,
                role=row.get("role") or "writer",
                percentage=Decimal(str(row.get("percentage") or 0)),
                ipi_cae=(row.get("ipi_cae") or "").strip(),
                pro_affiliation=row.get("pro_affiliation") or "",
            )
