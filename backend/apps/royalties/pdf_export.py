"""PDF export for consolidated royalty runs (statement / payout summary)."""

from __future__ import annotations

import io
from collections import defaultdict
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import RoyaltyRun


def _money(amount: Decimal | str | float, currency: str) -> str:
    return f"{Decimal(str(amount)):,.4f} {currency}"


def royalty_run_pdf(run: RoyaltyRun) -> bytes:
    """Build a PDF summary of a consolidated royalty run and its payout lines."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=f"Royalty run — {run.name}",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "RunTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "RunMeta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=4,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=14,
        spaceAfter=8,
    )

    payouts = list(run.payouts.select_related("track", "artist").order_by("-amount", "participant_name"))
    participant_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for line in payouts:
        participant_totals[line.participant_name] += line.amount

    story = [
        Paragraph("Good Faith Record Management", meta_style),
        Paragraph(run.label.name, meta_style),
        Paragraph(run.name, title_style),
        Paragraph(
            f"Status: {run.get_status_display()} · "
            f"Total: {_money(run.total_amount, run.currency)} · "
            f"Statements: {run.statements.count()} · "
            f"Generated for royalty accounting",
            meta_style,
        ),
        Spacer(1, 8),
    ]

    story.append(Paragraph("By participant", section_style))
    participant_rows = [["Participant", "Amount"]]
    for name, total in sorted(participant_totals.items(), key=lambda item: (-item[1], item[0])):
        participant_rows.append([name, _money(total, run.currency)])
    if len(participant_rows) == 1:
        participant_rows.append(["—", "—"])
    story.append(_table(participant_rows, col_widths=[4.5 * inch, 2 * inch]))

    story.append(Paragraph("Payout breakdown", section_style))
    detail_rows = [["Participant", "Track", "ISRC", "Share %", "Gross", "Payout"]]
    for line in payouts:
        detail_rows.append(
            [
                line.participant_name,
                (line.track_title or "—")[:40],
                line.isrc or "—",
                f"{line.share_percentage}",
                _money(line.track_gross, run.currency),
                _money(line.amount, run.currency),
            ]
        )
    if len(detail_rows) == 1:
        detail_rows.append(["—", "—", "—", "—", "—", "—"])
    story.append(
        _table(
            detail_rows,
            col_widths=[1.4 * inch, 1.6 * inch, 1.0 * inch, 0.7 * inch, 1.0 * inch, 1.0 * inch],
            font_size=7,
        )
    )

    doc.build(story)
    return buffer.getvalue()


def royalty_run_pdf_filename(run: RoyaltyRun) -> str:
    return f"goodfaith-royalty-run-{run.label.slug}-{run.pk}.pdf"


def _table(rows: list[list[str]], col_widths: list[float], font_size: int = 8) -> Table:
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), font_size),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F0EEE8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#333333")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAF8")]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ALIGN", (-2, 1), (-1, -1), "RIGHT"),
            ]
        )
    )
    return table
