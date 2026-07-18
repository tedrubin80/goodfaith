from rest_framework import serializers

from apps.catalog.models import Label

from .models import Budget, LabelExpense, RecoupmentEntry


def _user_label_ids(context: dict) -> set[int]:
    return set(context["request"].user.label_memberships.values_list("label_id", flat=True))


class LabelExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    release_title = serializers.CharField(source="release.title", read_only=True, default="")
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = LabelExpense
        fields = (
            "id",
            "label",
            "artist",
            "artist_name",
            "release",
            "release_title",
            "category",
            "category_display",
            "description",
            "amount",
            "currency",
            "incurred_on",
            "is_recoupable",
            "notes",
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
            obj = attrs.get(field, getattr(self.instance, field, None) if self.instance else None)
            if field in attrs and attrs[field] is None:
                obj = None
            if obj is not None and label is not None and obj.label_id != label.id:
                raise serializers.ValidationError({field: "Must belong to the same label."})
        return attrs

    def create(self, validated_data: dict) -> LabelExpense:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    release_title = serializers.CharField(source="release.title", read_only=True, default="")
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = Budget
        fields = (
            "id",
            "label",
            "artist",
            "artist_name",
            "release",
            "release_title",
            "name",
            "category",
            "category_display",
            "amount",
            "currency",
            "period_start",
            "period_end",
            "notes",
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
        start = attrs.get("period_start", getattr(self.instance, "period_start", None))
        end = attrs.get("period_end", getattr(self.instance, "period_end", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"period_end": "Period end must be on or after start."}
            )
        return attrs

    def create(self, validated_data: dict) -> Budget:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class RecoupmentEntrySerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(
        source="get_entry_type_display",
        read_only=True,
    )
    artist_name = serializers.CharField(source="artist.name", read_only=True, default="")
    release_title = serializers.CharField(source="release.title", read_only=True, default="")
    signed_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = RecoupmentEntry
        fields = (
            "id",
            "label",
            "artist",
            "artist_name",
            "release",
            "release_title",
            "expense",
            "entry_type",
            "entry_type_display",
            "amount",
            "signed_amount",
            "currency",
            "effective_on",
            "description",
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
        artist = attrs.get("artist") or getattr(self.instance, "artist", None)
        if label and artist and artist.label_id != label.id:
            raise serializers.ValidationError(
                {"artist": "Artist must belong to the same label."}
            )
        release = attrs.get("release", getattr(self.instance, "release", None))
        if "release" in attrs and attrs["release"] is None:
            release = None
        if release is not None and label is not None and release.label_id != label.id:
            raise serializers.ValidationError(
                {"release": "Release must belong to the same label."}
            )
        amount = attrs.get("amount", getattr(self.instance, "amount", None))
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be positive."})
        return attrs

    def create(self, validated_data: dict) -> RecoupmentEntry:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
