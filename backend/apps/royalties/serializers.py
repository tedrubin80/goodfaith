from rest_framework import serializers

from .models import RoyaltyLineItem, RoyaltyRun, RoyaltyStatement


class RoyaltyStatementSerializer(serializers.ModelSerializer):
    distributor_display = serializers.CharField(source="get_distributor_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)

    class Meta:
        model = RoyaltyStatement
        fields = (
            "id",
            "label",
            "distributor",
            "distributor_display",
            "filename",
            "period_start",
            "period_end",
            "status",
            "status_display",
            "row_count",
            "total_amount",
            "currency",
            "uploaded_by",
            "uploaded_by_username",
            "error_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "filename",
            "status",
            "row_count",
            "total_amount",
            "uploaded_by",
            "error_message",
            "created_at",
            "updated_at",
        )


class RoyaltyStatementUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoyaltyStatement
        fields = ("label", "distributor", "file", "period_start", "period_end", "currency")


class RoyaltyLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoyaltyLineItem
        fields = (
            "id",
            "statement",
            "track",
            "sale_period",
            "store",
            "country",
            "artist_name",
            "track_title",
            "isrc",
            "upc",
            "quantity",
            "amount",
        )
        read_only_fields = fields


class RoyaltyRunSerializer(serializers.ModelSerializer):
    statement_count = serializers.IntegerField(source="statements.count", read_only=True)

    class Meta:
        model = RoyaltyRun
        fields = (
            "id",
            "label",
            "name",
            "status",
            "statements",
            "statement_count",
            "total_amount",
            "currency",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "total_amount", "created_at", "updated_at")
