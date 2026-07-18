from django.db.models import Q, QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import SyncOpportunity
from .permissions import CanAccessSync
from .serializers import SyncOpportunitySerializer


class SyncOpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = SyncOpportunitySerializer
    permission_classes = [CanAccessSync]

    def get_queryset(self) -> QuerySet[SyncOpportunity]:
        label_ids = _user_label_ids(self.request.user)
        qs = SyncOpportunity.objects.filter(label_id__in=label_ids).select_related(
            "track",
            "release",
            "artist",
            "contract",
            "assigned_to",
            "created_by",
            "label",
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            profile = user.artist_profile
            qs = qs.filter(
                Q(artist=profile) | Q(release__primary_artist=profile)
            ).distinct()

        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        media_type = self.request.query_params.get("media_type")
        if media_type:
            qs = qs.filter(media_type=media_type)
        return qs
