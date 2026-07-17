from django.http import HttpResponse
from django.db.models import Q, QuerySet
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from apps.audit.models import AuditAction
from apps.audit.services import log_audit_event

from .models import Payout, PayoutBatch
from .permissions import CanAccessPayments
from .serializers import (
    MarkPayoutPaidSerializer,
    PayoutBatchCreateSerializer,
    PayoutBatchSerializer,
    PayoutSerializer,
)
from .ach_export import ach_export_filename, payout_batch_ach_csv
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
        log_audit_event(
            label_id=batch.label_id,
            action=AuditAction.PAYOUT_BATCH_ISSUED,
            resource_type="payout_batch",
            resource_id=batch.pk,
            summary=f"Issued payout batch “{batch.name}” — {batch.total_amount} {batch.currency}",
            actor=request.user,
            metadata={
                "run_id": run.pk,
                "total_amount": str(batch.total_amount),
                "currency": batch.currency,
                "payout_count": batch.payouts.count(),
            },
        )
        return Response(PayoutBatchSerializer(batch).data, status=201)

    @action(detail=True, methods=["get"])
    def ach_export(self, request, pk=None):
        batch = self.get_object()
        content = payout_batch_ach_csv(batch)
        response = HttpResponse(content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{ach_export_filename(batch)}"'
        return response

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
        log_audit_event(
            label_id=payout.batch.label_id,
            action=AuditAction.PAYOUT_MARKED_PAID,
            resource_type="payout",
            resource_id=payout.pk,
            summary=f"Marked paid: {payout.participant_name} — {payout.amount} {payout.batch.currency}",
            actor=request.user,
            metadata={
                "batch_id": payout.batch_id,
                "participant_name": payout.participant_name,
                "amount": str(payout.amount),
                "payment_reference": payout.payment_reference,
            },
        )
        return Response(PayoutSerializer(payout).data)
