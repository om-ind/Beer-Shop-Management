from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("/sales", methods=["GET"])
def get_sales():
    """Get paginated list of sales with customer name."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        offset = (page - 1) * per_page

        cursor.execute("""
            SELECT
                s.id,
                s.invoice_no,
                c.name AS customer_name,
                s.total_amount,
                s.payment_mode,
                s.sale_date,
                COUNT(si.id) AS item_count
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN sale_items si ON si.sale_id = s.id
            GROUP BY s.id
            ORDER BY s.id DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))

        sales = cursor.fetchall()

        # Serialize
        for sale in sales:
            if sale.get("sale_date"):
                sale["sale_date"] = str(sale["sale_date"])
            if sale.get("total_amount"):
                sale["total_amount"] = float(sale["total_amount"])

        # Total count
        cursor.execute("SELECT COUNT(*) AS total FROM sales")
        total = cursor.fetchone()["total"]

        return jsonify({
            "sales": sales,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        })

    finally:
        cursor.close()
        conn.close()


@sales_bp.route("/sales/<int:sale_id>", methods=["GET"])
def get_sale_detail(sale_id):
    """Get single sale with all line items."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Sale header
        cursor.execute("""
            SELECT
                s.id,
                s.invoice_no,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                s.total_amount,
                s.payment_mode,
                s.sale_date
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.id = %s
        """, (sale_id,))

        sale = cursor.fetchone()

        if not sale:
            return jsonify({"error": "Sale not found"}), 404

        # Serialize
        if sale.get("sale_date"):
            sale["sale_date"] = str(sale["sale_date"])
        if sale.get("total_amount"):
            sale["total_amount"] = float(sale["total_amount"])

        # Line items
        cursor.execute("""
            SELECT
                p.name AS product_name,
                p.brand,
                si.quantity,
                si.price,
                si.profit,
                (si.quantity * si.price) AS subtotal
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            WHERE si.sale_id = %s
        """, (sale_id,))

        items = cursor.fetchall()

        for item in items:
            item["price"] = float(item["price"] or 0)
            item["profit"] = float(item["profit"] or 0)
            item["subtotal"] = float(item["subtotal"] or 0)

        sale["items"] = items

        return jsonify(sale)

    finally:
        cursor.close()
        conn.close()


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
        # Check Customer
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

        # Check Products
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

        # Generate Invoice Number
        invoice_no = "INV" + datetime.now().strftime("%Y%m%d%H%M%S")

        # Insert Sale
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

        # Insert Sale Items
        for item in items:

            cursor.execute(
                """
                SELECT selling_price, purchase_price
                FROM products
                WHERE id=%s
                """,
                (item["product_id"],)
            )

            product = cursor.fetchone()
            profit = (product["selling_price"] - product["purchase_price"]) * item["quantity"]

            cursor.execute(
                """
                INSERT INTO sale_items
                (sale_id, product_id, quantity, price, profit)
                VALUES(%s,%s,%s,%s,%s)
                """,
                (
                    sale_id,
                    item["product_id"],
                    item["quantity"],
                    product["selling_price"],
                    profit
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

        # ----------------------------------------
        # If paid by Credit — add to credit balance
        # ----------------------------------------
        if payment_mode == "Credit":
            cursor.execute(
                """
                UPDATE customers
                SET credit_balance = credit_balance + %s
                WHERE id = %s
                """,
                (total, customer_id)
            )
            cursor.execute(
                """
                INSERT INTO credit_payments
                (customer_id, amount, remarks)
                VALUES (%s, %s, %s)
                """,
                (customer_id, -float(total), f"Credit sale — Invoice {invoice_no}")
            )
            conn.commit()

        return jsonify({
            "success": True,
            "invoice_no": invoice_no,
            "sale_id": sale_id,
            "total_amount": float(total)
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