from flask import Blueprint, request, jsonify, g
from database import get_connection
from datetime import datetime
from utils.auth_middleware import token_required

sales_bp = Blueprint("sales", __name__)


def _shop_id():
    return g.user.get("shop_id")

def _is_admin():
    return g.user.get("role") == "Admin"


@sales_bp.route("/sales", methods=["GET"])
@token_required
def get_sales():
    """Get paginated list of sales with customer name."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        offset = (page - 1) * per_page
        shop_id = _shop_id()

        if _is_admin():
            filter_shop = request.args.get("shop_id", type=int) or shop_id
        else:
            filter_shop = shop_id

        if filter_shop:
            cursor.execute("""
                SELECT
                    s.id, s.invoice_no, c.name AS customer_name,
                    s.total_amount, s.payment_mode, s.sale_date,
                    COUNT(si.id) AS item_count
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customer_id
                LEFT JOIN sale_items si ON si.sale_id = s.id
                WHERE s.shop_id = %s
                GROUP BY s.id
                ORDER BY s.id DESC
                LIMIT %s OFFSET %s
            """, (filter_shop, per_page, offset))
        else:
            # Admin global
            cursor.execute("""
                SELECT
                    s.id, s.invoice_no, c.name AS customer_name,
                    s.total_amount, s.payment_mode, s.sale_date,
                    COUNT(si.id) AS item_count
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customer_id
                LEFT JOIN sale_items si ON si.sale_id = s.id
                GROUP BY s.id
                ORDER BY s.id DESC
                LIMIT %s OFFSET %s
            """, (per_page, offset))

        sales = cursor.fetchall()

        for sale in sales:
            if sale.get("sale_date"):
                sale["sale_date"] = str(sale["sale_date"])
            if sale.get("total_amount"):
                sale["total_amount"] = float(sale["total_amount"])

        if filter_shop:
            cursor.execute("SELECT COUNT(*) AS total FROM sales WHERE shop_id=%s", (filter_shop,))
        else:
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
@token_required
def get_sale_detail(sale_id):
    """Get single sale with all line items."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                s.id, s.invoice_no, c.name AS customer_name,
                c.mobile AS customer_mobile, s.total_amount,
                s.payment_mode, s.sale_date, s.shop_id
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.id = %s
        """, (sale_id,))

        sale = cursor.fetchone()

        if not sale:
            return jsonify({"error": "Sale not found"}), 404

        # Ownership check
        if not _is_admin() and sale["shop_id"] != _shop_id():
            return jsonify({"error": "Forbidden"}), 403

        if sale.get("sale_date"):
            sale["sale_date"] = str(sale["sale_date"])
        if sale.get("total_amount"):
            sale["total_amount"] = float(sale["total_amount"])

        cursor.execute("""
            SELECT
                p.name AS product_name, p.brand,
                si.quantity, si.price, si.profit,
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
@token_required
def create_sale():
    data = request.get_json()
    shop_id = _shop_id()

    if _is_admin():
        shop_id = data.get("shop_id") or shop_id
        if not shop_id:
            return jsonify({"error": "shop_id is required"}), 400

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
        cursor.execute(
            "SELECT * FROM customers WHERE id=%s AND shop_id=%s",
            (customer_id, shop_id)
        )
        customer = cursor.fetchone()

        if customer is None:
            return jsonify({"error": f"Customer ID {customer_id} not found"}), 400

        total = 0

        for item in items:
            cursor.execute(
                "SELECT * FROM products WHERE id=%s AND shop_id=%s",
                (item["product_id"], shop_id)
            )
            product = cursor.fetchone()

            if product is None:
                return jsonify({"error": f"Product {item['product_id']} not found"}), 400

            if product["stock"] < item["quantity"]:
                return jsonify({"error": f"Insufficient stock for {product['name']}"}), 400

            try:
                item_price = float(item.get("selling_price"))
            except (ValueError, TypeError):
                item_price = float(product["selling_price"])

            total += item_price * item["quantity"]

        invoice_no = "INV" + datetime.now().strftime("%Y%m%d%H%M%S")
        sale_date = data.get("sale_date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute(
            """
            INSERT INTO sales
            (invoice_no, customer_id, total_amount, payment_mode, sale_date, shop_id)
            VALUES(%s,%s,%s,%s,%s,%s)
            """,
            (invoice_no, customer_id, total, payment_mode, sale_date, shop_id)
        )

        sale_id = cursor.lastrowid

        for item in items:
            cursor.execute(
                "SELECT selling_price, purchase_price FROM products WHERE id=%s",
                (item["product_id"],)
            )
            product = cursor.fetchone()
            try:
                item_price = float(item.get("selling_price"))
            except (ValueError, TypeError):
                item_price = float(product["selling_price"])

            profit = (item_price - float(product["purchase_price"])) * item["quantity"]

            cursor.execute(
                """
                INSERT INTO sale_items
                (sale_id, product_id, quantity, price, profit)
                VALUES(%s,%s,%s,%s,%s)
                """,
                (sale_id, item["product_id"], item["quantity"], item_price, profit)
            )

            cursor.execute(
                "UPDATE products SET stock = stock - %s WHERE id=%s",
                (item["quantity"], item["product_id"])
            )

        conn.commit()

        if payment_mode == "Credit":
            cursor.execute(
                "UPDATE customers SET credit_balance = credit_balance + %s WHERE id = %s",
                (total, customer_id)
            )
            cursor.execute(
                """
                INSERT INTO credit_payments (customer_id, amount, remarks)
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
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@sales_bp.route("/sales/<int:sale_id>", methods=["PUT"])
@token_required
def update_sale(sale_id):
    """Update sale attributes (like sale_date)."""
    data = request.get_json()
    sale_date = data.get("sale_date")

    if not sale_date:
        return jsonify({"error": "sale_date is required"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, shop_id FROM sales WHERE id=%s", (sale_id,))
        sale = cursor.fetchone()
        if not sale:
            return jsonify({"error": "Sale not found"}), 404

        if not _is_admin() and sale["shop_id"] != _shop_id():
            return jsonify({"error": "Forbidden"}), 403

        cursor.execute(
            "UPDATE sales SET sale_date = %s WHERE id = %s",
            (sale_date, sale_id)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Sale updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()