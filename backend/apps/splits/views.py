from django.db.models import Q, QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import SplitSheet
from .permissions import CanAccessSplits
from .serializers import SplitSheetCreateSerializer, SplitSheetSerializer


class SplitSheetViewSet(viewsets.ModelViewSet):
    permission_classes = [CanAccessSplits]

    def get_queryset(self) -> QuerySet[SplitSheet]:
        label_ids = _user_label_ids(self.request.user)
        qs = (
            SplitSheet.objects.filter(track__release__label_id__in=label_ids)
            .select_related(
                "track",
                "track__release",
                "track__release__primary_artist",
            )
            .prefetch_related("entries", "entries__artist")
        )
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            artist = user.artist_profile
            qs = qs.filter(
                Q(track__release__primary_artist=artist)
                | Q(entries__artist=artist)
            ).distinct()
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return SplitSheetCreateSerializer
        return SplitSheetSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["label_ids"] = set(_user_label_ids(self.request.user))
        return context
