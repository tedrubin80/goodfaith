"""PDF export for payout batches and individual artist payout statements."""

from __future__ import annotations

import io
from decimal import Decimal

from django.db.models import QuerySet
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import Payout, PayoutBatch


def _money(amount: Decimal | str | float, currency: str) -> str:
    return f"{Decimal(str(amount)):,.4f} {currency}"


def payout_batch_pdf(batch: PayoutBatch, payouts: QuerySet[Payout] | list[Payout] | None = None) -> bytes:
    """Build a PDF payout summary for a batch (optionally scoped to a subset of payouts)."""
    rows = list(payouts) if payouts is not None else list(batch.payouts.select_related("artist"))
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=f"Payout statement — {batch.name}",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BatchTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "BatchMeta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=4,
    )

    total = sum((p.amount for p in rows), Decimal("0"))
    story = [
        Paragraph("Good Faith Record Management", meta_style),
        Paragraph(batch.label.name, meta_style),
        Paragraph(batch.name, title_style),
        Paragraph(
            f"Royalty run: {batch.run.name} · Status: {batch.get_status_display()} · "
            f"Total (this statement): {_money(total, batch.currency)}",
            meta_style,
        ),
        Spacer(1, 12),
    ]

    table_rows = [["Participant", "Amount", "Status", "Paid at", "Reference"]]
    for payout in rows:
        paid_at = payout.paid_at.strftime("%Y-%m-%d") if payout.paid_at else "—"
        table_rows.append(
            [
                payout.participant_name,
                _money(payout.amount, batch.currency),
                payout.get_status_display(),
                paid_at,
                payout.payment_reference or "—",
            ]
        )
    if len(table_rows) == 1:
        table_rows.append(["—", "—", "—", "—", "—"])

    table = Table(
        table_rows,
        colWidths=[1.8 * inch, 1.3 * inch, 1.0 * inch, 1.0 * inch, 1.6 * inch],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F0EEE8")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAF8")]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "This statement is generated from your label’s royalty run consolidation. "
            "It is not a tax form.",
            meta_style,
        )
    )

    doc.build(story)
    return buffer.getvalue()


def payout_batch_pdf_filename(batch: PayoutBatch, *, scoped: bool = False) -> str:
    suffix = "artist" if scoped else "batch"
    return f"goodfaith-payout-{suffix}-{batch.label.slug}-{batch.pk}.pdf"


def payout_pdf(payout: Payout) -> bytes:
    """Single-participant payout statement PDF."""
    return payout_batch_pdf(payout.batch, payouts=[payout])


def payout_pdf_filename(payout: Payout) -> str:
    slug = payout.batch.label.slug
    return f"goodfaith-payout-{slug}-{payout.pk}.pdf"
