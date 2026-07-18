from rest_framework.permissions import BasePermission

from apps.accounts.models import Role


class CanAccessAnalytics(BasePermission):
    """Any label member may hit analytics; response shape is role-scoped (Gap 5)."""

    allowed_roles = {Role.ARTIST, Role.MANAGER, Role.FINANCE, Role.AR, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        return user.role in self.allowed_roles
