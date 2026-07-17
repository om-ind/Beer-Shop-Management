from flask import Blueprint, jsonify
from database import get_connection
from flask import request
from datetime import datetime
from utils.auth_middleware import token_required

purchase_bp = Blueprint("purchase", __name__)


@purchase_bp.route("/purchases", methods=["GET"])
@token_required
def get_purchases():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.id,
            p.invoice_number,
            s.name AS supplier,
            p.purchase_date,
            p.total_amount,
            p.payment_mode
        FROM purchases p
        LEFT JOIN suppliers s
            ON p.supplier_id = s.id
        ORDER BY p.id DESC
    """)

    purchases = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(purchases)

from flask import request
from datetime import datetime

@purchase_bp.route("/purchases", methods=["POST"])
@token_required
def create_purchase():

    data = request.get_json()

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
            (
                supplier_id,
                invoice_number,
                purchase_date,
                total_amount,
                remarks,
                payment_mode
            )
            VALUES
            (%s,%s,CURDATE(),%s,%s,%s)
        """, (

            data["supplier_id"],
            invoice_number,
            total_amount,
            data.get("remarks", ""),
            data["payment_mode"]

        ))

        purchase_id = cursor.lastrowid

        for item in data["items"]:

            cursor.execute("""
                INSERT INTO purchase_items
                (
                    purchase_id,
                    product_id,
                    quantity,
                    purchase_price
                )
                VALUES
                (%s,%s,%s,%s)
            """, (

                purchase_id,
                item["id"],
                item["quantity"],
                item["purchase_price"]

            ))

            cursor.execute("""
                UPDATE products
                SET stock = stock + %s
                WHERE id = %s
            """, (

                item["quantity"],
                item["id"]

            ))

        # Auto-create supplier bill
        payment_mode = data.get("payment_mode", "Cash").strip()
        paid_amt = 0.0
        bill_status = "pending"
        if payment_mode.lower() in ["cash", "card", "upi"]:
            paid_amt = total_amount
            bill_status = "paid"

        cursor.execute("""
            INSERT INTO supplier_bills
            (supplier_id, bill_number, bill_date, due_date, total_amount, paid_amount, status, notes)
            VALUES (%s, %s, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), %s, %s, %s, %s)
        """, (
            data["supplier_id"],
            invoice_number,
            total_amount,
            paid_amt,
            bill_status,
            f"Auto-generated from Purchase {invoice_number}. Remarks: {data.get('remarks', '')}".strip()
        ))

        conn.commit()

        return {
            "success": True,
            "purchase_id": purchase_id,
            "invoice_number": invoice_number
        }, 201

    except Exception as e:

        conn.rollback()

        return {
            "success": False,
            "error": str(e)
        }, 500

    finally:

        cursor.close()
        conn.close()
        
    return {
        "success": True,
        "purchase_id": purchase_id,
        "invoice_number": invoice_number
    }