from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Role
from apps.accounts.permissions import Mandatory2FAEnforced
from apps.catalog.views import _user_label_ids

from .permissions import CanAccessAnalytics
from .services import build_summary_for_user


class AnalyticsSummaryView(APIView):
    """
    Role-scoped analytics summary (Module 15 basics).

    - Finance / Manager / Admin: label earnings by distributor, period, artist, track
    - Artist: own earnings / payouts only
    - A&R: catalog + pipeline counts (no financials)
    """

    def get_permissions(self):
        user = self.request.user
        perms = [IsAuthenticated(), CanAccessAnalytics()]
        if user and user.is_authenticated and user.role in {
            Role.MANAGER,
            Role.FINANCE,
            Role.ADMIN,
        }:
            perms.append(Mandatory2FAEnforced())
        return perms

    def get(self, request):
        label_ids = _user_label_ids(request.user)
        data = build_summary_for_user(
            request.user,
            label_ids,
            period_start=request.query_params.get("period_start"),
            period_end=request.query_params.get("period_end"),
        )
        return Response(data)
