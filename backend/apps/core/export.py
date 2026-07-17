import csv
import io
import json
import zipfile
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from django.db.models import Q
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.catalog.models import Artist, Label, Release, Track
from apps.payments.models import Payout, PayoutBatch
from apps.royalties.models import RoyaltyLineItem, RoyaltyRun, RoyaltyRunPayout, RoyaltyStatement
from apps.splits.models import SplitEntry, SplitSheet

EXPORT_VERSION = "1.0"


def _serialize(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _row(obj: object, fields: tuple[str, ...]) -> dict[str, Any]:
    return {field: _serialize(getattr(obj, field)) for field in fields}


def _user_label_ids(user: User) -> list[int]:
    return list(user.label_memberships.values_list("label_id", flat=True))


def _includes_financial(user: User) -> bool:
    return user.role in {Role.MANAGER, Role.FINANCE, Role.ADMIN}


def _includes_splits(user: User) -> bool:
    return user.role in {Role.MANAGER, Role.FINANCE, Role.ARTIST, Role.ADMIN}


def _includes_payments(user: User) -> bool:
    return user.role in {Role.MANAGER, Role.FINANCE, Role.ARTIST, Role.ADMIN}


def export_scope(user: User) -> str:
    if _includes_financial(user):
        return "full"
    if user.role == Role.ARTIST:
        return "artist"
    return "catalog"


def build_export_payload(user: User, label: Label) -> dict[str, Any]:
    label_ids = _user_label_ids(user)
    if label.id not in label_ids:
        raise PermissionError("Label not accessible.")

    payload: dict[str, Any] = {
        "export_version": EXPORT_VERSION,
        "exported_at": timezone.now().isoformat(),
        "scope": export_scope(user),
        "label": _row(label, ("id", "name", "slug", "created_at", "updated_at")),
        "catalog": _export_catalog(user, label),
    }

    if _includes_splits(user):
        payload["splits"] = _export_splits(user, label)
    if _includes_financial(user):
        payload["royalties"] = _export_royalties(label)
    if _includes_payments(user):
        payload["payments"] = _export_payments(user, label)

    return payload


def _export_catalog(user: User, label: Label) -> dict[str, list[dict[str, Any]]]:
    artists = Artist.objects.filter(label=label)
    releases = Release.objects.filter(label=label).select_related("primary_artist")
    tracks = Track.objects.filter(release__label=label).select_related("release")

    if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
        artist = user.artist_profile
        artists = artists.filter(pk=artist.pk)
        releases = releases.filter(primary_artist=artist)
        tracks = tracks.filter(release__primary_artist=artist)

    return {
        "artists": [
            _row(a, ("id", "name", "slug", "user_id", "created_at", "updated_at"))
            for a in artists
        ],
        "releases": [
            {
                **_row(r, ("id", "title", "release_type", "upc", "release_date", "created_at", "updated_at")),
                "primary_artist_id": r.primary_artist_id,
            }
            for r in releases
        ],
        "tracks": [
            {
                **_row(t, ("id", "title", "isrc", "track_number", "duration_seconds", "created_at", "updated_at")),
                "release_id": t.release_id,
            }
            for t in tracks
        ],
    }


def _export_splits(user: User, label: Label) -> dict[str, list[dict[str, Any]]]:
    sheets = SplitSheet.objects.filter(track__release__label=label).select_related("track")
    if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
        artist = user.artist_profile
        sheets = sheets.filter(
            Q(track__release__primary_artist=artist) | Q(entries__artist=artist)
        ).distinct()

    sheet_ids = list(sheets.values_list("id", flat=True))
    entries = SplitEntry.objects.filter(split_sheet_id__in=sheet_ids).select_related("split_sheet")

    return {
        "sheets": [
            {
                **_row(s, ("id", "status", "notes", "created_at", "updated_at")),
                "track_id": s.track_id,
            }
            for s in sheets
        ],
        "entries": [
            {
                **_row(e, ("id", "participant_name", "artist_id", "role", "percentage", "created_at", "updated_at")),
                "split_sheet_id": e.split_sheet_id,
            }
            for e in entries
        ],
    }


def _export_royalties(label: Label) -> dict[str, list[dict[str, Any]]]:
    statements = RoyaltyStatement.objects.filter(label=label)
    line_items = RoyaltyLineItem.objects.filter(statement__label=label).select_related("statement")
    runs = RoyaltyRun.objects.filter(label=label).prefetch_related("statements")
    run_payouts = RoyaltyRunPayout.objects.filter(run__label=label)

    return {
        "statements": [
            {
                **_row(
                    s,
                    (
                        "id",
                        "distributor",
                        "filename",
                        "period_start",
                        "period_end",
                        "status",
                        "row_count",
                        "total_amount",
                        "currency",
                        "error_message",
                        "uploaded_by_id",
                        "created_at",
                        "updated_at",
                    ),
                ),
            }
            for s in statements
        ],
        "line_items": [
            {
                **_row(
                    item,
                    (
                        "id",
                        "statement_id",
                        "track_id",
                        "sale_period",
                        "store",
                        "country",
                        "artist_name",
                        "track_title",
                        "isrc",
                        "upc",
                        "quantity",
                        "amount",
                        "created_at",
                        "updated_at",
                    ),
                ),
                "raw_data": item.raw_data,
            }
            for item in line_items
        ],
        "runs": [
            {
                **_row(
                    run,
                    (
                        "id",
                        "name",
                        "status",
                        "total_amount",
                        "currency",
                        "consolidation_error",
                        "created_at",
                        "updated_at",
                    ),
                ),
                "statement_ids": list(run.statements.values_list("id", flat=True)),
            }
            for run in runs
        ],
        "run_payouts": [
            _row(
                payout,
                (
                    "id",
                    "run_id",
                    "track_id",
                    "isrc",
                    "track_title",
                    "participant_name",
                    "artist_id",
                    "role",
                    "share_percentage",
                    "track_gross",
                    "amount",
                    "unallocated_reason",
                    "created_at",
                    "updated_at",
                ),
            )
            for payout in run_payouts
        ],
    }


def _export_payments(user: User, label: Label) -> dict[str, list[dict[str, Any]]]:
    batches = PayoutBatch.objects.filter(label=label).select_related("run")
    payouts = Payout.objects.filter(batch__label=label).select_related("batch")

    if user.role == Role.ARTIST and hasattr(user, "artist_profile"):
        artist = user.artist_profile
        batches = batches.filter(payouts__artist=artist).distinct()
        payouts = payouts.filter(artist=artist)

    return {
        "batches": [
            {
                **_row(b, ("id", "run_id", "name", "status", "total_amount", "currency", "created_at", "updated_at")),
            }
            for b in batches
        ],
        "payouts": [
            _row(
                p,
                (
                    "id",
                    "batch_id",
                    "artist_id",
                    "participant_name",
                    "amount",
                    "status",
                    "paid_at",
                    "payment_reference",
                    "created_at",
                    "updated_at",
                ),
            )
            for p in payouts
        ],
    }


def payload_to_json(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")


def _write_csv(rows: list[dict[str, Any]]) -> bytes:
    if not rows:
        return b""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()), extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        flat = {}
        for key, value in row.items():
            if isinstance(value, (dict, list)):
                flat[key] = json.dumps(value, sort_keys=True)
            else:
                flat[key] = value
        writer.writerow(flat)
    return buffer.getvalue().encode("utf-8")


def payload_to_csv_zip(payload: dict[str, Any]) -> bytes:
    label_slug = payload["label"]["slug"]
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", payload_to_json(payload))

        catalog = payload.get("catalog", {})
        for name, rows in catalog.items():
            archive.writestr(f"catalog/{name}.csv", _write_csv(rows))

        splits = payload.get("splits", {})
        for name, rows in splits.items():
            archive.writestr(f"splits/{name}.csv", _write_csv(rows))

        royalties = payload.get("royalties", {})
        for name, rows in royalties.items():
            archive.writestr(f"royalties/{name}.csv", _write_csv(rows))

        payments = payload.get("payments", {})
        for name, rows in payments.items():
            archive.writestr(f"payments/{name}.csv", _write_csv(rows))

    buffer.seek(0)
    return buffer.read()


def export_filename(label: Label, export_format: str) -> str:
    stamp = timezone.now().strftime("%Y%m%d")
    if export_format == "json":
        return f"goodfaith-{label.slug}-{stamp}.json"
    return f"goodfaith-{label.slug}-{stamp}.zip"
