from decimal import Decimal

from celery import shared_task
from django.db import transaction

from apps.catalog.models import Track

from apps.audit.models import AuditAction
from apps.audit.services import log_audit_event

from .models import RoyaltyLineItem, RoyaltyRun, RoyaltyStatement, StatementStatus
from .parsers.aliases import aliases_for
from .parsers.base import StatementParseError, load_dataframe, normalize_rows


@shared_task
def process_statement(statement_id: int) -> None:
    try:
        statement = RoyaltyStatement.objects.get(pk=statement_id)
    except RoyaltyStatement.DoesNotExist:
        return

    statement.status = StatementStatus.PROCESSING
    statement.error_message = ""
    statement.save(update_fields=["status", "error_message", "updated_at"])

    try:
        with statement.file.open("rb") as fileobj:
            df = load_dataframe(fileobj, statement.filename)
        rows, skipped = normalize_rows(df, aliases_for(statement.distributor))
    except StatementParseError as exc:
        statement.status = StatementStatus.FAILED
        statement.error_message = str(exc)
        statement.save(update_fields=["status", "error_message", "updated_at"])
        log_audit_event(
            label_id=statement.label_id,
            action=AuditAction.STATEMENT_FAILED,
            resource_type="royalty_statement",
            resource_id=statement.pk,
            summary=f"Parse failed for {statement.filename}",
            metadata={"error": str(exc)},
        )
        return
    except Exception as exc:  # noqa: BLE001 — surface any parse failure on the statement
        statement.status = StatementStatus.FAILED
        statement.error_message = f"Unexpected error while parsing: {exc}"
        statement.save(update_fields=["status", "error_message", "updated_at"])
        log_audit_event(
            label_id=statement.label_id,
            action=AuditAction.STATEMENT_FAILED,
            resource_type="royalty_statement",
            resource_id=statement.pk,
            summary=f"Parse failed for {statement.filename}",
            metadata={"error": str(exc)},
        )
        return

    isrcs = {row.isrc for row in rows if row.isrc}
    track_by_isrc = {
        track.isrc: track
        for track in Track.objects.filter(
            isrc__in=isrcs, release__label_id=statement.label_id
        )
    }

    line_items = [
        RoyaltyLineItem(
            statement=statement,
            track=track_by_isrc.get(row.isrc),
            sale_period=row.sale_period,
            store=row.store,
            country=row.country,
            artist_name=row.artist_name,
            track_title=row.track_title,
            isrc=row.isrc,
            upc=row.upc,
            quantity=row.quantity,
            amount=row.amount,
            raw_data=row.raw,
        )
        for row in rows
    ]

    total_amount = sum((row.amount for row in rows), Decimal("0"))

    with transaction.atomic():
        RoyaltyLineItem.objects.filter(statement=statement).delete()
        RoyaltyLineItem.objects.bulk_create(line_items, batch_size=1000)
        statement.row_count = len(line_items)
        statement.total_amount = total_amount
        statement.status = StatementStatus.PROCESSED
        if skipped:
            statement.error_message = f"Skipped {skipped} row(s) with no readable amount."
        statement.save(
            update_fields=["row_count", "total_amount", "status", "error_message", "updated_at"]
        )
        log_audit_event(
            label_id=statement.label_id,
            action=AuditAction.STATEMENT_PROCESSED,
            resource_type="royalty_statement",
            resource_id=statement.pk,
            summary=f"Processed {statement.filename} — {total_amount} {statement.currency}",
            metadata={
                "row_count": len(line_items),
                "total_amount": str(total_amount),
                "currency": statement.currency,
                "skipped_rows": skipped,
            },
        )


@shared_task
def consolidate_run_task(run_id: int) -> None:
    from .consolidation import ConsolidationError, consolidate_run

    try:
        run = RoyaltyRun.objects.prefetch_related("statements").get(pk=run_id)
    except RoyaltyRun.DoesNotExist:
        return

    try:
        consolidate_run(run)
    except ConsolidationError as exc:
        run.consolidation_error = str(exc)
        run.status = RoyaltyRunStatus.DRAFT
        run.save(update_fields=["consolidation_error", "status", "updated_at"])
