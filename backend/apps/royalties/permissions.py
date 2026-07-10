from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class CanAccessRoyalties(BasePermission):
    """
    Finance and Manager roles see royalty data; A&R and Artist are excluded (Gap 5).
    """

    read_roles = {Role.MANAGER, Role.FINANCE, Role.ADMIN}
    write_roles = {Role.MANAGER, Role.FINANCE, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.read_roles
        return user.role in self.write_roles
