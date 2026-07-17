from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class CanAccessAuditLog(BasePermission):
    """Financial audit log — Finance and Manager only; Artist and A&R excluded."""

    read_roles = {Role.MANAGER, Role.FINANCE, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.read_roles
        return False
