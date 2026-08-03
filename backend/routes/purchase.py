from flask import Blueprint, jsonify, request, g
from database import get_connection
from datetime import datetime
from utils.auth_middleware import token_required

purchase_bp = Blueprint("purchase", __name__)


def _shop_id():
    return g.user.get("shop_id")

def _is_admin():
    return g.user.get("role") == "Admin"


@purchase_bp.route("/purchases", methods=["GET"])
@token_required
def get_purchases():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()

    if _is_admin():
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    where_clause = "WHERE p.shop_id = %s" if filter_shop else ""
    params = (filter_shop,) if filter_shop else ()

    try:
        cursor.execute(f"""
            SELECT
                p.id,
                COALESCE(p.invoice_number, p.invoice_no, CONCAT('PUR', p.id)) AS invoice_number,
                s.name AS supplier,
                p.purchase_date,
                COALESCE(p.total_amount, p.total, 0) AS total_amount,
                IFNULL(p.payment_mode, 'Cash') AS payment_mode,
                IFNULL(p.transport_per_carton, 0) AS transport_per_carton,
                IFNULL(p.total_cartons, 0) AS total_cartons,
                IFNULL(p.transport_total, 0) AS transport_total
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            {where_clause}
            ORDER BY p.id DESC
        """, params)
        purchases = cursor.fetchall()
    except Exception:
        cursor.execute(f"""
            SELECT
                p.id,
                COALESCE(p.invoice_no, CONCAT('PUR', p.id)) AS invoice_number,
                s.name AS supplier,
                p.purchase_date,
                p.total AS total_amount,
                'Cash' AS payment_mode,
                0 AS transport_per_carton,
                0 AS total_cartons,
                0 AS transport_total
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            {where_clause}
            ORDER BY p.id DESC
        """, params)
        purchases = cursor.fetchall()

    for row in purchases:
        if row.get("purchase_date"):
            row["purchase_date"] = str(row["purchase_date"])
        row["total_amount"] = float(row.get("total_amount") or 0)
        row["transport_per_carton"] = float(row.get("transport_per_carton") or 0)
        row["total_cartons"] = float(row.get("total_cartons") or 0)
        row["transport_total"] = float(row.get("transport_total") or 0)

    cursor.close()
    conn.close()

    return jsonify(purchases)


@purchase_bp.route("/purchases", methods=["POST"])
@token_required
def create_purchase():
    data = request.get_json()
    shop_id = _shop_id()

    if _is_admin():
        shop_id = data.get("shop_id") or shop_id

    conn = get_connection()
    cursor = conn.cursor()

    try:
        invoice_number = "PUR" + datetime.now().strftime("%Y%m%d%H%M%S")

        items_subtotal = sum(
            item["quantity"] * item["purchase_price"]
            for item in data["items"]
        )

        transport_per_carton = float(data.get("transport_per_carton", 0))
        total_cartons = float(data.get("total_cartons", 0))
        transport_total = float(data.get("transport_total", total_cartons * transport_per_carton))

        grand_total = round(items_subtotal + transport_total, 2)

        cursor.execute("""
            INSERT INTO purchases
            (supplier_id, invoice_number, purchase_date, total_amount, remarks, payment_mode, shop_id,
             transport_per_carton, total_cartons, transport_total)
            VALUES (%s,%s,CURDATE(),%s,%s,%s,%s,%s,%s,%s)
        """, (
            data["supplier_id"],
            invoice_number,
            grand_total,
            data.get("remarks", ""),
            data["payment_mode"],
            shop_id,
            transport_per_carton,
            total_cartons,
            transport_total
        ))

        purchase_id = cursor.lastrowid

        for item in data["items"]:
            cursor.execute("""
                INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price)
                VALUES (%s,%s,%s,%s)
            """, (purchase_id, item["id"], item["quantity"], item["purchase_price"]))

            cursor.execute(
                "UPDATE products SET stock = stock + %s WHERE id = %s",
                (item["quantity"], item["id"])
            )

        # Auto-create supplier bill
        payment_mode = data.get("payment_mode", "Cash").strip()
        paid_amt = 0.0
        bill_status = "pending"
        if payment_mode.lower() in ["cash", "card", "upi"]:
            paid_amt = grand_total
            bill_status = "paid"

        cursor.execute("""
            INSERT INTO supplier_bills
            (supplier_id, bill_number, bill_date, due_date, total_amount, paid_amount, status, notes, shop_id)
            VALUES (%s, %s, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), %s, %s, %s, %s, %s)
        """, (
            data["supplier_id"],
            invoice_number,
            grand_total,
            paid_amt,
            bill_status,
            f"Auto-generated from Purchase {invoice_number}. Includes ₹{transport_total:.2f} transport ({total_cartons} cartons @ ₹{transport_per_carton:.2f}/carton). Remarks: {data.get('remarks', '')}".strip(),
            shop_id
        ))

        # Auto-create transport expense entry if transport charge > 0
        if transport_total > 0:
            cursor.execute("""
                INSERT INTO expenses (category, amount, expense_date, description, shop_id)
                VALUES (%s, %s, CURDATE(), %s, %s)
            """, (
                "Transport",
                transport_total,
                f"Transport charge for Purchase {invoice_number} ({total_cartons} cartons @ ₹{transport_per_carton:.2f}/carton)",
                shop_id
            ))

        conn.commit()

        return {
            "success": True,
            "purchase_id": purchase_id,
            "invoice_number": invoice_number
        }, 201

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}, 500

    finally:
        cursor.close()
        conn.close()