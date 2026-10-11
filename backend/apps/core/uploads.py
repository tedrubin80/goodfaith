"""Shared upload validation helpers."""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from rest_framework import serializers

# Royalty statement spreadsheets / CSVs
STATEMENT_EXTENSIONS = {".csv", ".tsv", ".txt", ".xlsx", ".xls"}
# Contract PDFs / scans
CONTRACT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
# DAM media (masters, artwork, stems)
DAM_EXTENSIONS = {
    ".wav",
    ".flac",
    ".aiff",
    ".aif",
    ".mp3",
    ".m4a",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".tif",
    ".tiff",
    ".pdf",
    ".zip",
}


def max_upload_bytes() -> int:
    return int(getattr(settings, "GFRM_MAX_UPLOAD_BYTES", 25 * 1024 * 1024))


def validate_uploaded_file(uploaded, *, allowed_extensions: set[str], field_name: str = "file"):
    """Validate extension and size for an uploaded file. Raises ValidationError."""
    if uploaded is None:
        raise serializers.ValidationError({field_name: "A file is required."})

    name = getattr(uploaded, "name", "") or ""
    ext = Path(name).suffix.lower()
    if ext not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise serializers.ValidationError(
            {field_name: f"Unsupported file type “{ext or 'unknown'}”. Allowed: {allowed}."}
        )

    size = getattr(uploaded, "size", None)
    limit = max_upload_bytes()
    if size is not None and size > limit:
        mb = limit / (1024 * 1024)
        raise serializers.ValidationError(
            {field_name: f"File exceeds the {mb:.0f} MB upload limit."}
        )
    return uploaded
