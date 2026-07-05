from rest_framework.permissions import BasePermission

from apps.accounts.models import Role


class HasRole(BasePermission):
    """
    DRF permission factory keying access off User.role (Gap 5 — RBAC).
    Usage: permission_classes = [HasRole.any_of(Role.MANAGER, Role.ADMIN)]
    """

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role in self.allowed_roles or user.role == Role.ADMIN)
        )

    @classmethod
    def any_of(cls, *roles: str) -> type["HasRole"]:
        return type("HasRoleAnyOf", (cls,), {"allowed_roles": roles})
