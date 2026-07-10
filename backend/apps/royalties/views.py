from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.catalog.views import _user_label_ids

from .models import RoyaltyRun, RoyaltyStatement, StatementStatus
from .permissions import CanAccessRoyalties
from .serializers import (
    RoyaltyRunSerializer,
    RoyaltyStatementSerializer,
    RoyaltyStatementUploadSerializer,
)


class RoyaltyStatementViewSet(viewsets.ModelViewSet):
    permission_classes = [CanAccessRoyalties]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self) -> QuerySet[RoyaltyStatement]:
        return RoyaltyStatement.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).select_related("uploaded_by", "label")

    def get_serializer_class(self):
        if self.action == "create":
            return RoyaltyStatementUploadSerializer
        return RoyaltyStatementSerializer

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get("file")
        filename = uploaded.name if uploaded else "statement"
        serializer.save(
            uploaded_by=self.request.user,
            filename=filename,
            status=StatementStatus.PENDING,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = RoyaltyStatementSerializer(serializer.instance)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=201, headers=headers)


class RoyaltyRunViewSet(viewsets.ModelViewSet):
    serializer_class = RoyaltyRunSerializer
    permission_classes = [CanAccessRoyalties]

    def get_queryset(self) -> QuerySet[RoyaltyRun]:
        return RoyaltyRun.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).prefetch_related("statements")
