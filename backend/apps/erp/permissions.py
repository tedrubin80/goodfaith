from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class CanAccessERP(BasePermission):
    """ERP is financial — Manager/Finance/Admin; Artists read own recoupment only."""

    read_roles = {Role.MANAGER, Role.FINANCE, Role.ARTIST, Role.ADMIN}
    write_roles = {Role.MANAGER, Role.FINANCE, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        if user.role == Role.AR:
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.read_roles
        return user.role in self.write_roles
