from rest_framework import serializers

from apps.royalties.models import RoyaltyRun

from .models import Payout, PayoutBatch


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = (
            "id",
            "batch",
            "artist",
            "participant_name",
            "amount",
            "status",
            "paid_at",
            "payment_reference",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "batch",
            "artist",
            "participant_name",
            "amount",
            "created_at",
            "updated_at",
        )


class PayoutBatchSerializer(serializers.ModelSerializer):
    payout_count = serializers.IntegerField(source="payouts.count", read_only=True)
    pending_count = serializers.SerializerMethodField()
    paid_count = serializers.SerializerMethodField()
    run_name = serializers.CharField(source="run.name", read_only=True)

    class Meta:
        model = PayoutBatch
        fields = (
            "id",
            "label",
            "run",
            "run_name",
            "name",
            "status",
            "total_amount",
            "currency",
            "payout_count",
            "pending_count",
            "paid_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_pending_count(self, obj: PayoutBatch) -> int:
        return obj.payouts.filter(status="pending").count()

    def get_paid_count(self, obj: PayoutBatch) -> int:
        return obj.payouts.filter(status="paid").count()


class PayoutBatchCreateSerializer(serializers.Serializer):
    run = serializers.PrimaryKeyRelatedField(queryset=RoyaltyRun.objects.all())

    def validate_run(self, run: RoyaltyRun) -> RoyaltyRun:
        label_ids = self.context["label_ids"]
        if run.label_id not in label_ids:
            raise serializers.ValidationError("Run is not in your label.")
        return run


class MarkPayoutPaidSerializer(serializers.Serializer):
    payment_reference = serializers.CharField(required=False, allow_blank=True, max_length=128)
