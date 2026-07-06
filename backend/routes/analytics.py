from flask import Blueprint, jsonify
from database import get_connection

analytics_bp = Blueprint("analytics", __name__)


# ===============================
# Highest Profit Brand
# ===============================
@analytics_bp.route("/analytics/highest-profit-brand", methods=["GET"])
def highest_profit_brand():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.brand,
            SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p
        ON si.product_id = p.id
        GROUP BY p.brand
        ORDER BY total_profit DESC
        LIMIT 1
    """)

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
def lowest_profit_brand():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.brand,
            SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p
        ON si.product_id = p.id
        GROUP BY p.brand
        ORDER BY total_profit ASC
        LIMIT 1
    """)

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
def top_products():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.name,
            SUM(si.quantity) AS total_quantity
        FROM sale_items si
        JOIN products p
        ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 10
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# ===============================
# Brand Profit Report
# ===============================
@analytics_bp.route("/analytics/brand-profit", methods=["GET"])
def brand_profit():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.brand,
            SUM(si.profit) AS total_profit
        FROM sale_items si
        JOIN products p
        ON si.product_id = p.id
        GROUP BY p.brand
        ORDER BY total_profit DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# ===============================
# Low Stock Products
# ===============================
@analytics_bp.route("/analytics/restock", methods=["GET"])
def restock_products():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            name,
            brand,
            stock,
            minimum_stock
        FROM products
        WHERE stock <= minimum_stock
        ORDER BY stock ASC
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# ===============================
# Sales Trend (Last 30 Days)
# ===============================
@analytics_bp.route("/analytics/sales-trend", methods=["GET"])
def sales_trend():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            DATE(sale_date) AS date,
            SUM(total_amount) AS sales
        FROM sales
        GROUP BY DATE(sale_date)
        ORDER BY DATE(sale_date)
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)