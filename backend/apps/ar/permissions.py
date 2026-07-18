from rest_framework.permissions import BasePermission

from apps.accounts.models import Role


class CanAccessARPipeline(BasePermission):
    """
    A&R pipeline is ops/talent only (Gap 5).
    Artists never see unsigned prospects; Finance stays on financial modules.
    """

    allowed_roles = {Role.MANAGER, Role.AR, Role.ADMIN}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.label_memberships.exists():
            return False
        return user.role in self.allowed_roles
