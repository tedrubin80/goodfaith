from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import Role


class IsLabelMember(BasePermission):
    """Authenticated users must belong to at least one label."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.label_memberships.exists())


class CanManageCatalog(BasePermission):
    """
    Manager, Finance, A&R, and Admin roles can create/update/delete catalog data.
    Artists get read-only access to their own catalog via queryset filtering.
    """

    write_roles = {Role.MANAGER, Role.FINANCE, Role.AR, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.label_memberships.exists()
        return user.role in self.write_roles
