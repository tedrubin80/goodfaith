from django.db.models import Q, QuerySet
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import DigitalAsset
from .permissions import CanAccessDAM
from .serializers import DigitalAssetSerializer


class DigitalAssetViewSet(viewsets.ModelViewSet):
    serializer_class = DigitalAssetSerializer
    permission_classes = [CanAccessDAM]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self) -> QuerySet[DigitalAsset]:
        qs = DigitalAsset.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).select_related("artist", "release", "track", "uploaded_by", "label")
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            profile = user.artist_profile
            qs = qs.filter(
                Q(artist=profile) | Q(release__primary_artist=profile)
            ).distinct()
        asset_type = self.request.query_params.get("asset_type")
        if asset_type:
            qs = qs.filter(asset_type=asset_type)
        return qs
