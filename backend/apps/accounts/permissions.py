from rest_framework.permissions import BasePermission

from .models import Role


MANDATORY_2FA_ROLES = {Role.MANAGER, Role.FINANCE, Role.ADMIN}


def role_requires_2fa(role: str) -> bool:
    return role in MANDATORY_2FA_ROLES


def user_has_mandatory_2fa(user) -> bool:
    if not role_requires_2fa(user.role):
        return True
    return bool(user.is_2fa_enabled)


class Mandatory2FAEnforced(BasePermission):
    """Block financial operations until mandatory 2FA is enabled (Manager/Finance/Admin)."""

    message = (
        "Two-factor authentication is required for your role. "
        "Enable it in Security settings before accessing financial data."
    )

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user_has_mandatory_2fa(user)
