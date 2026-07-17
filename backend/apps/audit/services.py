from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model

from .models import AuditAction, AuditEvent

User = get_user_model()


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def log_audit_event(
    *,
    label_id: int,
    action: str,
    resource_type: str,
    resource_id: int,
    summary: str,
    actor: User | None = None,
    metadata: dict | None = None,
) -> AuditEvent:
    return AuditEvent.objects.create(
        label_id=label_id,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        summary=summary[:512],
        metadata=_json_safe(metadata or {}),
    )


__all__ = ["AuditAction", "AuditEvent", "log_audit_event"]
