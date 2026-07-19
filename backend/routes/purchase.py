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

    if filter_shop:
        cursor.execute("""
            SELECT
                p.id,
                p.invoice_number,
                s.name AS supplier,
                p.purchase_date,
                p.total_amount,
                p.payment_mode
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.shop_id = %s
            ORDER BY p.id DESC
        """, (filter_shop,))
    else:
        cursor.execute("""
            SELECT
                p.id,
                p.invoice_number,
                s.name AS supplier,
                p.purchase_date,
                p.total_amount,
                p.payment_mode
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.id DESC
        """)

    purchases = cursor.fetchall()
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

        total_amount = sum(
            item["quantity"] * item["purchase_price"]
            for item in data["items"]
        )

        cursor.execute("""
            INSERT INTO purchases
            (supplier_id, invoice_number, purchase_date, total_amount, remarks, payment_mode, shop_id)
            VALUES (%s,%s,CURDATE(),%s,%s,%s,%s)
        """, (
            data["supplier_id"],
            invoice_number,
            total_amount,
            data.get("remarks", ""),
            data["payment_mode"],
            shop_id
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
            paid_amt = total_amount
            bill_status = "paid"

        cursor.execute("""
            INSERT INTO supplier_bills
            (supplier_id, bill_number, bill_date, due_date, total_amount, paid_amount, status, notes, shop_id)
            VALUES (%s, %s, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), %s, %s, %s, %s, %s)
        """, (
            data["supplier_id"],
            invoice_number,
            total_amount,
            paid_amt,
            bill_status,
            f"Auto-generated from Purchase {invoice_number}. Remarks: {data.get('remarks', '')}".strip(),
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