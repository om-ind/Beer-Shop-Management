from flask import Blueprint, jsonify
from database import get_connection
from flask import request
from datetime import datetime

purchase_bp = Blueprint("purchase", __name__)


@purchase_bp.route("/purchases", methods=["GET"])
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

@purchase_bp.route("/purchases", methods=["POST"])
def create_purchase():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    invoice_number = "PUR" + datetime.now().strftime("%Y%m%d%H%M%S")

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
        0,
        data.get("remarks", ""),
        data["payment_mode"]
    ))

    conn.commit()

    purchase_id = cursor.lastrowid

    cursor.close()
    conn.close()

    return {
        "success": True,
        "purchase_id": purchase_id,
        "invoice_number": invoice_number
    }