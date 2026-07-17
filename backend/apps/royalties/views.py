from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.catalog.views import _user_label_ids

from .models import RoyaltyRun, RoyaltyStatement, StatementStatus
from .permissions import CanAccessRoyalties
from .serializers import (
    RoyaltyLineItemSerializer,
    RoyaltyRunSerializer,
    RoyaltyStatementSerializer,
    RoyaltyStatementUploadSerializer,
)
from .tasks import process_statement


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
        process_statement.delay(serializer.instance.pk)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = RoyaltyStatementSerializer(serializer.instance)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=201, headers=headers)

    @action(detail=True, methods=["get"])
    def line_items(self, request, pk=None):
        statement = self.get_object()
        items = statement.line_items.all()
        return Response(RoyaltyLineItemSerializer(items, many=True).data)

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        statement = self.get_object()
        statement.status = StatementStatus.PENDING
        statement.save(update_fields=["status", "updated_at"])
        process_statement.delay(statement.pk)
        return Response(RoyaltyStatementSerializer(statement).data)


class RoyaltyRunViewSet(viewsets.ModelViewSet):
    serializer_class = RoyaltyRunSerializer
    permission_classes = [CanAccessRoyalties]

    def get_queryset(self) -> QuerySet[RoyaltyRun]:
        return RoyaltyRun.objects.filter(
            label_id__in=_user_label_ids(self.request.user)
        ).prefetch_related("statements")
