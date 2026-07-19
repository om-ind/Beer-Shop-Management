from flask import Blueprint, jsonify, make_response
from database import get_connection
from io import BytesIO
import datetime

invoice_bp = Blueprint("invoice", __name__)


def _get_sale_data(sale_id):
    """Fetch full sale data including items for invoice generation."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                s.id,
                s.invoice_no,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                c.address AS customer_address,
                s.total_amount,
                s.payment_mode,
                s.sale_date
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.id = %s
        """, (sale_id,))

        sale = cursor.fetchone()

        if not sale:
            return None

        cursor.execute("""
            SELECT
                p.name AS product_name,
                p.brand,
                si.quantity,
                si.price,
                (si.quantity * si.price) AS subtotal
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            WHERE si.sale_id = %s
        """, (sale_id,))

        sale["items"] = cursor.fetchall()
        sale["total_amount"] = float(sale["total_amount"] or 0)
        sale["sale_date"] = str(sale["sale_date"])

        for item in sale["items"]:
            item["price"] = float(item["price"] or 0)
            item["subtotal"] = float(item["subtotal"] or 0)

        return sale

    finally:
        cursor.close()
        conn.close()


@invoice_bp.route("/sales/<int:sale_id>/invoice", methods=["GET"])
def download_invoice(sale_id):
    """Generate and return a PDF invoice for a sale."""

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    except ImportError:
        return jsonify({"error": "reportlab not installed. Run: pip install reportlab"}), 500

    sale = _get_sale_data(sale_id)

    if not sale:
        return jsonify({"error": "Sale not found"}), 404

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()
    AMBER = colors.HexColor("#F59E0B")
    DARK = colors.HexColor("#1E293B")
    SLATE = colors.HexColor("#64748B")
    LIGHT_BG = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle("title", fontSize=24, leading=28, textColor=DARK, fontName="Helvetica-Bold", alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("subtitle", fontSize=10, leading=12, textColor=SLATE, alignment=TA_CENTER)
    label_style = ParagraphStyle("label", fontSize=9, leading=11, textColor=SLATE, fontName="Helvetica")
    value_style = ParagraphStyle("value", fontSize=10, leading=12, textColor=DARK, fontName="Helvetica-Bold")
    right_style = ParagraphStyle("right", fontSize=10, leading=12, textColor=DARK, alignment=TA_RIGHT)

    elements = []

    # Header
    elements.append(Paragraph("🍺 Beer Shop ERP", title_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Tax Invoice", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=AMBER, spaceAfter=12))

    # Invoice Meta
    sale_date = sale.get("sale_date", "")
    invoice_no = sale.get("invoice_no", "")

    meta_data = [
        [
            Paragraph(f"Invoice No: <b>{invoice_no}</b>", value_style),
            Paragraph(f"Date: <b>{sale_date[:10] if sale_date else ''}</b>", right_style)
        ],
        [
            Paragraph(f"Customer: <b>{sale.get('customer_name', 'Walk-in')}</b>", value_style),
            Paragraph(f"Payment: <b>{sale.get('payment_mode', 'Cash')}</b>", right_style)
        ],
    ]

    if sale.get("customer_mobile"):
        meta_data.append([
            Paragraph(f"Mobile: {sale['customer_mobile']}", label_style),
            Paragraph("", label_style)
        ])

    meta_table = Table(meta_data, colWidths=["60%", "40%"])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    # Items Table
    header = ["#", "Product", "Brand", "Qty", "Unit Price", "Amount"]
    rows = [header]

    for i, item in enumerate(sale.get("items", []), 1):
        rows.append([
            str(i),
            item.get("product_name", ""),
            item.get("brand", ""),
            str(item.get("quantity", 0)),
            f"Rs. {item.get('price', 0):.2f}",
            f"Rs. {item.get('subtotal', 0):.2f}",
        ])

    items_table = Table(rows, colWidths=["5%", "30%", "20%", "10%", "17.5%", "17.5%"])
    items_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("PADDING", (0, 0), (-1, 0), 8),
        # Data rows
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("PADDING", (0, 1), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        # Borders
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 12))

    # Total
    total = sale.get("total_amount", 0)
    total_data = [
        ["", "GRAND TOTAL:", f"Rs. {total:.2f}"]
    ]
    total_table = Table(total_data, colWidths=["55%", "27.5%", "17.5%"])
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (2, 0), AMBER),
        ("TEXTCOLOR", (1, 0), (2, 0), colors.white),
        ("FONTNAME", (1, 0), (2, 0), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (2, 0), 11),
        ("ALIGN", (1, 0), (2, 0), "RIGHT"),
        ("PADDING", (1, 0), (2, 0), 8),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 24))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0")))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("Thank you for your purchase! 🍺", subtitle_style))
    elements.append(Paragraph("Beer Shop ERP — Management System", subtitle_style))

    doc.build(elements)

    buffer.seek(0)
    response = make_response(buffer.read())
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename=invoice_{invoice_no}.pdf"

    return response
