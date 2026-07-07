from flask import Blueprint, jsonify
from database import get_connection

report_bp = Blueprint("report", __name__)


@report_bp.route("/reports/dashboard")
def report_dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Today's Sales
    cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS today_sales
        FROM sales
        WHERE DATE(sale_date)=CURDATE()
    """)
    today_sales = cursor.fetchone()["today_sales"]

    # Monthly Sales
    cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS monthly_sales
        FROM sales
        WHERE MONTH(sale_date)=MONTH(CURDATE())
        AND YEAR(sale_date)=YEAR(CURDATE())
    """)
    monthly_sales = cursor.fetchone()["monthly_sales"]

    # Total Purchases
    cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS purchases
        FROM purchases
    """)
    purchases = cursor.fetchone()["purchases"]

    # Low Stock
    cursor.execute("""
        SELECT COUNT(*) AS low_stock
        FROM products
        WHERE stock<=minimum_stock
    """)
    low_stock = cursor.fetchone()["low_stock"]

    cursor.close()
    conn.close()

    return jsonify({

        "today_sales": today_sales,

        "monthly_sales": monthly_sales,

        "total_purchases": purchases,

        "low_stock": low_stock

    })

@report_bp.route("/reports/sales-trend")
def sales_trend():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            DATE(sale_date) AS day,
            IFNULL(SUM(total_amount),0) AS total
        FROM sales
        WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(sale_date)
        ORDER BY DATE(sale_date)
    """)

@report_bp.route("/reports/top-products")
def top_products():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.name,
            SUM(si.quantity) AS qty_sold,
            SUM(si.quantity * si.price) AS revenue
        FROM sale_items si
        JOIN products p
            ON p.id = si.product_id
        GROUP BY p.id, p.name
        ORDER BY qty_sold DESC
        LIMIT 10
    """)
@report_bp.route("/reports/low-stock")
def low_stock_products():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            barcode,
            name,
            category,
            stock,
            minimum_stock
        FROM products
        WHERE stock <= minimum_stock
        ORDER BY stock ASC
    """)

@report_bp.route("/reports/profit-summary")
def profit_summary():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            IFNULL(SUM(profit),0) AS total_profit,
            IFNULL(SUM(quantity),0) AS total_items
        FROM sale_items
    """)
    summary = cursor.fetchone()


    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)
    