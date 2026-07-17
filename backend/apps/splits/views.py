from django.db.models import Q, QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.audit.models import AuditAction
from apps.audit.services import log_audit_event
from apps.catalog.views import _user_label_ids

from .models import SplitSheet, SplitSheetStatus
from apps.accounts.permissions import Mandatory2FAEnforced
from .permissions import CanAccessSplits
from .serializers import SplitSheetCreateSerializer, SplitSheetSerializer


class SplitSheetViewSet(viewsets.ModelViewSet):
    permission_classes = [CanAccessSplits, Mandatory2FAEnforced]

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

    def _log_finalized(self, sheet: SplitSheet) -> None:
        log_audit_event(
            label_id=sheet.track.release.label_id,
            action=AuditAction.SPLIT_SHEET_FINALIZED,
            resource_type="split_sheet",
            resource_id=sheet.pk,
            summary=f"Finalized split sheet for “{sheet.track.title}”",
            actor=self.request.user,
            metadata={
                "track_id": sheet.track_id,
                "track_title": sheet.track.title,
                "isrc": sheet.track.isrc,
                "entry_count": sheet.entries.count(),
                "total_percentage": str(sheet.total_percentage),
            },
        )

    def perform_create(self, serializer):
        sheet = serializer.save()
        if sheet.status == SplitSheetStatus.FINALIZED:
            self._log_finalized(sheet)

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        sheet = serializer.save()
        if sheet.status == SplitSheetStatus.FINALIZED and previous_status != SplitSheetStatus.FINALIZED:
            self._log_finalized(sheet)
