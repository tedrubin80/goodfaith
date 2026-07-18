from django.db.models import Q, QuerySet
from rest_framework import viewsets

from apps.accounts.models import Role
from apps.catalog.views import _user_label_ids

from .models import MarketingCampaign
from .permissions import CanAccessMarketing
from .serializers import MarketingCampaignSerializer


class MarketingCampaignViewSet(viewsets.ModelViewSet):
    serializer_class = MarketingCampaignSerializer
    permission_classes = [CanAccessMarketing]

    def get_queryset(self) -> QuerySet[MarketingCampaign]:
        label_ids = _user_label_ids(self.request.user)
        qs = MarketingCampaign.objects.filter(label_id__in=label_ids).select_related(
            "artist",
            "release",
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
        campaign_type = self.request.query_params.get("campaign_type")
        if campaign_type:
            qs = qs.filter(campaign_type=campaign_type)
        return qs
