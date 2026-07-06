from flask import Blueprint, request, jsonify
from database import get_connection

purchase_bp = Blueprint("purchase", __name__)


@purchase_bp.route("/purchase", methods=["POST"])
def create_purchase():

    data = request.get_json()

    supplier_id = data.get("supplier_id")
    invoice_number = data.get("invoice_number")
    purchase_date = data.get("purchase_date")
    payment_mode = data.get("payment_mode")
    remarks = data.get("remarks", "")
    items = data.get("items", [])

    if not supplier_id:
        return jsonify({"error": "Supplier ID required"}), 400

    if len(items) == 0:
        return jsonify({"error": "No purchase items"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        total_amount = 0

        cursor.execute("""
            INSERT INTO purchases
            (supplier_id,invoice_number,purchase_date,payment_mode,remarks,total_amount)
            VALUES(%s,%s,%s,%s,%s,0)
        """,
        (
            supplier_id,
            invoice_number,
            purchase_date,
            payment_mode,
            remarks
        ))

        purchase_id = cursor.lastrowid

        for item in items:

            product_id = item["product_id"]
            quantity = item["quantity"]

            cursor.execute("""
                SELECT purchase_price,stock,name
                FROM products
                WHERE id=%s
            """, (product_id,))

            product = cursor.fetchone()

            if not product:
                conn.rollback()
                return jsonify({"error": f"Product {product_id} not found"}), 404

            purchase_price = float(product["purchase_price"])

            subtotal = purchase_price * quantity

            total_amount += subtotal

            cursor.execute("""
                INSERT INTO purchase_items
                (purchase_id,product_id,quantity,purchase_price)
                VALUES(%s,%s,%s,%s)
            """,
            (
                purchase_id,
                product_id,
                quantity,
                purchase_price
            ))

            cursor.execute("""
                UPDATE products
                SET stock=stock+%s
                WHERE id=%s
            """,
            (
                quantity,
                product_id
            ))

        cursor.execute("""
            UPDATE purchases
            SET total_amount=%s
            WHERE id=%s
        """,
        (
            total_amount,
            purchase_id
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "purchase_id": purchase_id,
            "total_amount": total_amount
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()