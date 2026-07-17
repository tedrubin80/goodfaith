from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class CanAccessPublishing(BasePermission):
    """
    Publishing works are visible to label ops; artists see works they share on.
    A&R and Manager manage registrations; Finance reads for compliance.
    """

    read_roles = {Role.MANAGER, Role.FINANCE, Role.AR, Role.ARTIST, Role.ADMIN}
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
