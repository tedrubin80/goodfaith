from django.db.models import QuerySet
from rest_framework import viewsets

from apps.catalog.views import _user_label_ids

from .models import AuditEvent
from .permissions import CanAccessAuditLog
from .serializers import AuditEventSerializer


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditEventSerializer
    permission_classes = [CanAccessAuditLog]

    def get_queryset(self) -> QuerySet[AuditEvent]:
        qs = AuditEvent.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).select_related("actor", "label")

        resource_type = self.request.query_params.get("resource_type")
        resource_id = self.request.query_params.get("resource_id")
        action = self.request.query_params.get("action")

        if resource_type:
            qs = qs.filter(resource_type=resource_type)
        if resource_id:
            qs = qs.filter(resource_id=resource_id)
        if action:
            qs = qs.filter(action=action)

        return qs
