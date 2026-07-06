from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("/sales", methods=["POST"])
def create_sale():
    data = request.get_json()

    customer_id = data.get("customer_id")
    payment_mode = data.get("payment_mode")
    items = data.get("items", [])

    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400

    if len(items) == 0:
        return jsonify({"error": "No items selected"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # -----------------------------
        # Check Customer
        # -----------------------------
        cursor.execute(
            "SELECT * FROM customers WHERE id=%s",
            (customer_id,)
        )

        customer = cursor.fetchone()

        if customer is None:
            return jsonify({
                "error": f"Customer ID {customer_id} not found"
            }), 400

        total = 0

        # -----------------------------
        # Check Products
        # -----------------------------
        for item in items:

            cursor.execute(
                "SELECT * FROM products WHERE id=%s",
                (item["product_id"],)
            )

            product = cursor.fetchone()

            if product is None:
                return jsonify({
                    "error": f"Product {item['product_id']} not found"
                }), 400

            if product["stock"] < item["quantity"]:
                return jsonify({
                    "error": f"Insufficient stock for {product['name']}"
                }), 400

            total += product["selling_price"] * item["quantity"]

        # -----------------------------
        # Generate Invoice Number
        # -----------------------------
        invoice_no = "INV" + datetime.now().strftime("%Y%m%d%H%M%S")

        # -----------------------------
        # Insert Sale
        # -----------------------------
        cursor.execute(
            """
            INSERT INTO sales
            (invoice_no, customer_id, total_amount, payment_mode)
            VALUES(%s,%s,%s,%s)
            """,
            (
                invoice_no,
                customer_id,
                total,
                payment_mode
            )
        )

        sale_id = cursor.lastrowid

        # -----------------------------
        # Insert Sale Items
        # -----------------------------
        for item in items:

            cursor.execute(
                """
                SELECT selling_price
                FROM products
                WHERE id=%s
                """,
                (item["product_id"],)
            )

            product = cursor.fetchone()

            cursor.execute(
                """
                INSERT INTO sale_items
                (sale_id, product_id, quantity, price)
                VALUES(%s,%s,%s,%s)
                """,
                (
                    sale_id,
                    item["product_id"],
                    item["quantity"],
                    product["selling_price"]
                )
            )

            cursor.execute(
                """
                UPDATE products
                SET stock = stock - %s
                WHERE id=%s
                """,
                (
                    item["quantity"],
                    item["product_id"]
                )
            )

        conn.commit()

        return jsonify({
            "success": True,
            "invoice_no": invoice_no,
            "sale_id": sale_id,
            "total_amount": total
        })

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()