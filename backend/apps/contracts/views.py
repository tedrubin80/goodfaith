from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import Contract
from .permissions import CanAccessContracts
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [CanAccessContracts]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self) -> QuerySet[Contract]:
        label_ids = _user_label_ids(self.request.user)
        qs = Contract.objects.filter(label_id__in=label_ids).select_related(
            "artist",
            "created_by",
            "label",
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(artist=user.artist_profile)
        return qs
