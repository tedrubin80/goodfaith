from django.db.models import QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import ReleaseTask
from .permissions import CanAccessWorkflow
from .serializers import ReleaseTaskSerializer


class ReleaseTaskViewSet(viewsets.ModelViewSet):
    serializer_class = ReleaseTaskSerializer
    permission_classes = [CanAccessWorkflow]

    def get_queryset(self) -> QuerySet[ReleaseTask]:
        qs = ReleaseTask.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).select_related("release", "assigned_to", "created_by", "label")
        user = self.request.user
        if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
            qs = qs.filter(release__primary_artist=user.artist_profile)
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        release = self.request.query_params.get("release")
        if release:
            qs = qs.filter(release_id=release)
        return qs
