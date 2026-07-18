from django.db.models import QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import DspDelivery
from .permissions import CanAccessDistribution
from .serializers import DspDeliverySerializer


class DspDeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DspDeliverySerializer
    permission_classes = [CanAccessDistribution]

    def get_queryset(self) -> QuerySet[DspDelivery]:
        qs = DspDelivery.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).select_related("release", "created_by", "label")
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(release__primary_artist=user.artist_profile)
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs
