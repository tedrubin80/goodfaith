from decimal import Decimal

from django.db.models import QuerySet, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import Role
from apps.accounts.permissions import Mandatory2FAEnforced
from apps.catalog.views import _user_label_ids

from .models import Budget, LabelExpense, RecoupmentEntry, RecoupmentEntryType
from .permissions import CanAccessERP
from .serializers import BudgetSerializer, LabelExpenseSerializer, RecoupmentEntrySerializer


class _ERPViewSetMixin:
    permission_classes = [CanAccessERP, Mandatory2FAEnforced]

    def _scoped_qs(self, qs: QuerySet) -> QuerySet:
        label_ids = _user_label_ids(self.request.user)
        qs = qs.filter(label_id__in=label_ids)
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(artist=user.artist_profile)
        return qs


class LabelExpenseViewSet(_ERPViewSetMixin, viewsets.ModelViewSet):
    serializer_class = LabelExpenseSerializer

    def get_queryset(self) -> QuerySet[LabelExpense]:
        qs = LabelExpense.objects.select_related(
            "artist",
            "release",
            "created_by",
            "label",
        )
        return self._scoped_qs(qs)


class BudgetViewSet(_ERPViewSetMixin, viewsets.ModelViewSet):
    serializer_class = BudgetSerializer

    def get_queryset(self) -> QuerySet[Budget]:
        qs = Budget.objects.select_related("artist", "release", "created_by", "label")
        return self._scoped_qs(qs)


class RecoupmentEntryViewSet(_ERPViewSetMixin, viewsets.ModelViewSet):
    serializer_class = RecoupmentEntrySerializer

    def get_queryset(self) -> QuerySet[RecoupmentEntry]:
        qs = RecoupmentEntry.objects.select_related(
            "artist",
            "release",
            "expense",
            "created_by",
            "label",
        )
        artist_id = self.request.query_params.get("artist")
        if artist_id:
            qs = qs.filter(artist_id=artist_id)
        return self._scoped_qs(qs)

    @action(detail=False, methods=["get"])
    def balances(self, request):
        """Unrecouped balance per artist (charges + adjustments − credits)."""
        qs = self.get_queryset()
        rows = []
        artist_ids = (
            qs.order_by()
            .values_list("artist_id", flat=True)
            .distinct()
        )
        for artist_id in artist_ids:
            artist_qs = qs.filter(artist_id=artist_id)
            first = artist_qs.select_related("artist").first()
            if not first:
                continue
            charges = artist_qs.filter(entry_type=RecoupmentEntryType.CHARGE).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")
            credits = artist_qs.filter(entry_type=RecoupmentEntryType.CREDIT).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")
            adjustments = artist_qs.filter(
                entry_type=RecoupmentEntryType.ADJUSTMENT
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
            rows.append(
                {
                    "artist": artist_id,
                    "artist_name": first.artist.name,
                    "unrecouped": f"{charges + adjustments - credits:.2f}",
                    "currency": first.currency,
                }
            )
        return Response(rows, status=status.HTTP_200_OK)
