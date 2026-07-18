from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class CanAccessWorkflow(BasePermission):
    read_roles = {Role.MANAGER, Role.AR, Role.ARTIST, Role.ADMIN, Role.FINANCE}
    write_roles = {Role.MANAGER, Role.AR, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.read_roles
        return user.role in self.write_roles
