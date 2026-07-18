from django.db.models import QuerySet
from rest_framework import viewsets

from apps.catalog.views import _user_label_ids

from .models import Prospect
from .permissions import CanAccessARPipeline
from .serializers import ProspectSerializer


class ProspectViewSet(viewsets.ModelViewSet):
    serializer_class = ProspectSerializer
    permission_classes = [CanAccessARPipeline]

    def get_queryset(self) -> QuerySet[Prospect]:
        label_ids = _user_label_ids(self.request.user)
        qs = Prospect.objects.filter(label_id__in=label_ids).select_related(
            "assigned_to",
            "signed_artist",
            "created_by",
            "label",
        )
        stage = self.request.query_params.get("stage")
        if stage:
            qs = qs.filter(stage=stage)
        priority = self.request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority=priority)
        return qs
