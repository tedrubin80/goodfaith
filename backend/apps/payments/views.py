from django.db.models import Q, QuerySet
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import Payout, PayoutBatch
from .permissions import CanAccessPayments
from .serializers import (
    MarkPayoutPaidSerializer,
    PayoutBatchCreateSerializer,
    PayoutBatchSerializer,
    PayoutSerializer,
)
from .services import PayoutGenerationError, generate_payout_batch


class PayoutBatchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayoutBatchSerializer
    permission_classes = [CanAccessPayments]

    def get_queryset(self) -> QuerySet[PayoutBatch]:
        label_ids = _user_label_ids(self.request.user)
        qs = PayoutBatch.objects.filter(label_id__in=label_ids).select_related("run")
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(payouts__artist=user.artist_profile).distinct()
        return qs

    @action(detail=False, methods=["post"])
    def from_run(self, request):
        serializer = PayoutBatchCreateSerializer(
            data=request.data,
            context={"label_ids": set(_user_label_ids(request.user))},
        )
        serializer.is_valid(raise_exception=True)
        run = serializer.validated_data["run"]
        try:
            batch = generate_payout_batch(run)
        except PayoutGenerationError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc
        return Response(PayoutBatchSerializer(batch).data, status=201)

    @action(detail=True, methods=["get"])
    def payouts(self, request, pk=None):
        batch = self.get_object()
        payouts = batch.payouts.select_related("artist")
        user = request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            payouts = payouts.filter(artist=user.artist_profile)
        return Response(PayoutSerializer(payouts, many=True).data)


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [CanAccessPayments]

    def get_queryset(self) -> QuerySet[Payout]:
        label_ids = _user_label_ids(self.request.user)
        qs = Payout.objects.filter(batch__label_id__in=label_ids).select_related(
            "batch", "artist"
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(artist=user.artist_profile)
        return qs

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        payout = self.get_object()
        if payout.status == "paid":
            return Response(PayoutSerializer(payout).data)
        body = MarkPayoutPaidSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        payout.mark_paid(body.validated_data.get("payment_reference", ""))
        return Response(PayoutSerializer(payout).data)
