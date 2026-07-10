from django.db.models import QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role

from .models import Artist, Label, Release, Track
from .permissions import CanManageCatalog
from .serializers import ArtistSerializer, LabelSerializer, ReleaseSerializer, TrackSerializer


def _user_label_ids(user) -> list[int]:
    return list(user.label_memberships.values_list("label_id", flat=True))


class LabelViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [CanManageCatalog]

    def get_queryset(self) -> QuerySet[Label]:
        return Label.objects.filter(id__in=_user_label_ids(self.request.user))


class ArtistViewSet(viewsets.ModelViewSet):
    serializer_class = ArtistSerializer
    permission_classes = [CanManageCatalog]

    def get_queryset(self) -> QuerySet[Artist]:
        qs = Artist.objects.filter(label_id__in=_user_label_ids(self.request.user))
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(pk=user.artist_profile.pk)
        return qs


class ReleaseViewSet(viewsets.ModelViewSet):
    serializer_class = ReleaseSerializer
    permission_classes = [CanManageCatalog]

    def get_queryset(self) -> QuerySet[Release]:
        qs = Release.objects.filter(label_id__in=_user_label_ids(self.request.user)).prefetch_related(
            "tracks"
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(primary_artist=user.artist_profile)
        return qs


class TrackViewSet(viewsets.ModelViewSet):
    serializer_class = TrackSerializer
    permission_classes = [CanManageCatalog]

    def get_queryset(self) -> QuerySet[Track]:
        qs = Track.objects.filter(release__label_id__in=_user_label_ids(self.request.user))
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(release__primary_artist=user.artist_profile)
        return qs
