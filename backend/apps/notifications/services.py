from __future__ import annotations

from apps.accounts.models import Role
from apps.catalog.models import LabelMembership

from .models import Notification, NotificationKind

FINANCE_ROLES = (Role.MANAGER, Role.FINANCE, Role.ADMIN)


def create_notification(
    *,
    user,
    label_id: int,
    kind: str,
    title: str,
    body: str = "",
    link_path: str = "",
    resource_type: str = "",
    resource_id: int | None = None,
) -> Notification:
    return Notification.objects.create(
        user=user,
        label_id=label_id,
        kind=kind,
        title=title[:255],
        body=body,
        link_path=link_path,
        resource_type=resource_type,
        resource_id=resource_id,
    )


def notify_label_roles(
    *,
    label_id: int,
    roles: tuple[str, ...] | list[str],
    kind: str,
    title: str,
    body: str = "",
    link_path: str = "",
    resource_type: str = "",
    resource_id: int | None = None,
    exclude_user_id: int | None = None,
) -> list[Notification]:
    memberships = LabelMembership.objects.filter(
        label_id=label_id,
        user__role__in=roles,
        user__is_active=True,
    ).select_related("user")
    created: list[Notification] = []
    for membership in memberships:
        if exclude_user_id and membership.user_id == exclude_user_id:
            continue
        created.append(
            create_notification(
                user=membership.user,
                label_id=label_id,
                kind=kind,
                title=title,
                body=body,
                link_path=link_path,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        )
    return created


def notify_statement_processed(statement) -> list[Notification]:
    return notify_label_roles(
        label_id=statement.label_id,
        roles=FINANCE_ROLES,
        kind=NotificationKind.STATEMENT_PROCESSED,
        title=f"Statement processed: {statement.filename}",
        body=(
            f"{statement.get_distributor_display()} — "
            f"{statement.total_amount} {statement.currency} "
            f"({statement.row_count or 0} rows)."
        ),
        link_path=f"/royalties/statements/{statement.pk}",
        resource_type="royalty_statement",
        resource_id=statement.pk,
    )


def notify_statement_failed(statement) -> list[Notification]:
    return notify_label_roles(
        label_id=statement.label_id,
        roles=FINANCE_ROLES,
        kind=NotificationKind.STATEMENT_FAILED,
        title=f"Statement failed: {statement.filename}",
        body=statement.error_message[:500] if statement.error_message else "Parse failed.",
        link_path=f"/royalties/statements/{statement.pk}",
        resource_type="royalty_statement",
        resource_id=statement.pk,
    )


def notify_payout_batch_issued(batch) -> list[Notification]:
    created: list[Notification] = []
    for payout in batch.payouts.select_related("artist", "artist__user"):
        artist = payout.artist
        if not artist or not artist.user_id:
            continue
        created.append(
            create_notification(
                user=artist.user,
                label_id=batch.label_id,
                kind=NotificationKind.PAYOUT_READY,
                title=f"Payout ready: {payout.amount} {batch.currency}",
                body=f"A payout from “{batch.name}” is ready for you.",
                link_path="/payments",
                resource_type="payout",
                resource_id=payout.pk,
            )
        )
    return created


def notify_payout_paid(payout) -> Notification | None:
    artist = payout.artist
    if not artist or not artist.user_id:
        return None
    return create_notification(
        user=artist.user,
        label_id=payout.batch.label_id,
        kind=NotificationKind.PAYOUT_PAID,
        title=f"Payout marked paid: {payout.amount} {payout.batch.currency}",
        body=(
            f"Payment reference: {payout.payment_reference}"
            if payout.payment_reference
            else f"Your payout from “{payout.batch.name}” was marked paid."
        ),
        link_path="/payments",
        resource_type="payout",
        resource_id=payout.pk,
    )
