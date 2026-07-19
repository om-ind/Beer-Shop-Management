from flask import Blueprint, jsonify, request, g
from database import get_connection
from utils.auth_middleware import token_required

analytics_bp = Blueprint("analytics", __name__)


def _shop_clause():
    """Returns (where_clause, params) for shop filtering."""
    role = g.user.get("role")
    shop_id = g.user.get("shop_id")
    if role == "Admin":
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id
    if filter_shop:
        return "WHERE s.shop_id = %s", (filter_shop,)
    return "", ()


def _shop_clause_products():
    role = g.user.get("role")
    shop_id = g.user.get("shop_id")
    if role == "Admin":
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id
    if filter_shop:
        return "WHERE p.shop_id = %s", (filter_shop,)
    return "", ()


# ===============================
# Highest Profit Brand
# ===============================
@analytics_bp.route("/analytics/highest-profit-brand", methods=["GET"])
@token_required
def highest_profit_brand():
    wc, params = _shop_clause()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    q = f"""
        SELECT p.brand, SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        {wc}
        GROUP BY p.brand
        ORDER BY total_profit DESC
        LIMIT 1
    """
    cursor.execute(q, params)
    data = cursor.fetchone()
    cursor.close()
    conn.close()

    if not data:
        return jsonify({"message": "No sales found"})
    return jsonify(data)


# ===============================
# Lowest Profit Brand
# ===============================
@analytics_bp.route("/analytics/lowest-profit-brand", methods=["GET"])
@token_required
def lowest_profit_brand():
    wc, params = _shop_clause()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    q = f"""
        SELECT p.brand, SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        {wc}
        GROUP BY p.brand
        ORDER BY total_profit ASC
        LIMIT 1
    """
    cursor.execute(q, params)
    data = cursor.fetchone()
    cursor.close()
    conn.close()

    if not data:
        return jsonify({"message": "No sales found"})
    return jsonify(data)


# ===============================
# Top Selling Products
# ===============================
@analytics_bp.route("/analytics/top-products", methods=["GET"])
@token_required
def top_products():
    wc, params = _shop_clause()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    q = f"""
        SELECT p.name, SUM(si.quantity) AS total_quantity
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        {wc}
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 10
    """
    cursor.execute(q, params)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ===============================
# Brand Profit Report
# ===============================
@analytics_bp.route("/analytics/brand-profit", methods=["GET"])
@token_required
def brand_profit():
    wc, params = _shop_clause()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    q = f"""
        SELECT p.brand, SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        {wc}
        GROUP BY p.brand
        ORDER BY total_profit DESC
    """
    cursor.execute(q, params)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ===============================
# Low Stock Products
# ===============================
@analytics_bp.route("/analytics/restock", methods=["GET"])
@token_required
def restock_products():
    wc, params = _shop_clause_products()
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    q = f"""
        SELECT id, name, brand, stock, minimum_stock
        FROM products
        {wc}
        {'AND' if wc else 'WHERE'} stock <= minimum_stock
        ORDER BY stock ASC
    """
    # Fix: if no where clause, add WHERE
    if not wc:
        q = """
            SELECT id, name, brand, stock, minimum_stock
            FROM products
            WHERE stock <= minimum_stock
            ORDER BY stock ASC
        """
    cursor.execute(q, params)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ===============================
# Sales Trend (All Time)
# ===============================
@analytics_bp.route("/analytics/sales-trend", methods=["GET"])
@token_required
def sales_trend():
    role = g.user.get("role")
    shop_id = g.user.get("shop_id")
    if role == "Admin":
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    if filter_shop:
        cursor.execute("""
            SELECT DATE(sale_date) AS date, SUM(total_amount) AS sales
            FROM sales
            WHERE shop_id = %s
            GROUP BY DATE(sale_date)
            ORDER BY DATE(sale_date)
        """, (filter_shop,))
    else:
        cursor.execute("""
            SELECT DATE(sale_date) AS date, SUM(total_amount) AS sales
            FROM sales
            GROUP BY DATE(sale_date)
            ORDER BY DATE(sale_date)
        """)

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)