from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ARTIST = "artist", "Artist"
    MANAGER = "manager", "Manager"
    FINANCE = "finance", "Finance"
    AR = "ar", "A&R"
    ADMIN = "admin", "Admin"


class User(AbstractUser):
    """
    Custom user model carrying the role that drives RBAC across every module
    (Gap 5 — Role-Based Operations Security). Every permission check in the
    app should key off `role`, not Django's built-in is_staff/is_superuser,
    so that Artist/Manager/Finance/A&R boundaries stay enforced consistently.
    """

    role = models.CharField(max_length=16, choices=Role.choices, default=Role.ARTIST)
    totp_secret = models.CharField(max_length=32, blank=True, default="")
    is_2fa_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list, blank=True)

    @property
    def requires_2fa(self) -> bool:
        return self.role in {Role.MANAGER, Role.FINANCE, Role.ADMIN}

    @property
    def must_enable_2fa(self) -> bool:
        return self.requires_2fa and not self.is_2fa_enabled

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
