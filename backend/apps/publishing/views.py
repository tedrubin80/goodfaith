from django.db.models import Prefetch, Q, QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import MusicalWork, WorkShare
from .permissions import CanAccessPublishing
from .serializers import MusicalWorkSerializer


class MusicalWorkViewSet(viewsets.ModelViewSet):
    serializer_class = MusicalWorkSerializer
    permission_classes = [CanAccessPublishing]

    def get_queryset(self) -> QuerySet[MusicalWork]:
        label_ids = _user_label_ids(self.request.user)
        qs = (
            MusicalWork.objects.filter(label_id__in=label_ids)
            .prefetch_related(
                Prefetch("shares", queryset=WorkShare.objects.select_related("artist")),
                "tracks",
            )
            .select_related("label")
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            artist = user.artist_profile
            qs = qs.filter(
                Q(shares__artist=artist) | Q(tracks__release__primary_artist=artist)
            ).distinct()
        return qs
