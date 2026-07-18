from django.db.models import Prefetch, QuerySet
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import Contract, ContractObligation
from .permissions import CanAccessContracts
from .serializers import ContractObligationSerializer, ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [CanAccessContracts]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self) -> QuerySet[Contract]:
        label_ids = _user_label_ids(self.request.user)
        qs = (
            Contract.objects.filter(label_id__in=label_ids)
            .select_related("artist", "created_by", "label")
            .prefetch_related(
                Prefetch(
                    "obligations",
                    queryset=ContractObligation.objects.select_related("created_by"),
                )
            )
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(artist=user.artist_profile)
        return qs


class ContractObligationViewSet(viewsets.ModelViewSet):
    serializer_class = ContractObligationSerializer
    permission_classes = [CanAccessContracts]

    def get_queryset(self) -> QuerySet[ContractObligation]:
        label_ids = _user_label_ids(self.request.user)
        qs = ContractObligation.objects.filter(
            contract__label_id__in=label_ids
        ).select_related("contract", "created_by")
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(contract__artist=user.artist_profile)
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            qs = qs.filter(contract_id=contract_id)
        return qs
