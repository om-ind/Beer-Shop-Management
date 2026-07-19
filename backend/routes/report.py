from flask import Blueprint, jsonify, request, g
from database import get_connection
from utils.auth_middleware import token_required

report_bp = Blueprint("report", __name__)


def _shop_id():
    role = g.user.get("role")
    shop_id = g.user.get("shop_id")
    if role == "Admin":
        return request.args.get("shop_id", type=int) or shop_id
    return shop_id


@report_bp.route("/reports/dashboard")
@token_required
def report_dashboard():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    sf = f"AND shop_id = {shop_id}" if shop_id else ""

    try:
        cursor.execute(f"""
            SELECT IFNULL(SUM(total_amount),0) AS today_sales
            FROM sales WHERE DATE(sale_date)=CURDATE() {sf}
        """)
        today_sales = cursor.fetchone()["today_sales"]

        cursor.execute(f"""
            SELECT IFNULL(SUM(total_amount),0) AS monthly_sales
            FROM sales
            WHERE MONTH(sale_date)=MONTH(CURDATE())
            AND YEAR(sale_date)=YEAR(CURDATE()) {sf}
        """)
        monthly_sales = cursor.fetchone()["monthly_sales"]

        cursor.execute(f"""
            SELECT IFNULL(SUM(total_amount),0) AS purchases
            FROM purchases {"WHERE shop_id = " + str(shop_id) if shop_id else ""}
        """)
        purchases = cursor.fetchone()["purchases"]

        cursor.execute(f"""
            SELECT COUNT(*) AS low_stock FROM products
            {"WHERE shop_id = " + str(shop_id) + " AND" if shop_id else "WHERE"} stock<=minimum_stock
        """)
        low_stock = cursor.fetchone()["low_stock"]

        return jsonify({
            "today_sales": float(today_sales),
            "monthly_sales": float(monthly_sales),
            "total_purchases": float(purchases),
            "low_stock": low_stock
        })

    finally:
        cursor.close()
        conn.close()


@report_bp.route("/reports/sales-trend")
@token_required
def sales_trend():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    sf = f"AND shop_id = {shop_id}" if shop_id else ""

    try:
        cursor.execute(f"""
            SELECT DATE(sale_date) AS day, IFNULL(SUM(total_amount),0) AS total
            FROM sales
            WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) {sf}
            GROUP BY DATE(sale_date)
            ORDER BY DATE(sale_date)
        """)
        data = cursor.fetchall()
        for row in data:
            if row.get("day"):
                row["day"] = str(row["day"])
        return jsonify(data)

    finally:
        cursor.close()
        conn.close()


@report_bp.route("/reports/top-products")
@token_required
def top_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    sf = f"WHERE s.shop_id = {shop_id}" if shop_id else ""

    try:
        cursor.execute(f"""
            SELECT
                p.name,
                SUM(si.quantity) AS qty_sold,
                SUM(si.quantity * si.price) AS revenue
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            {sf}
            GROUP BY p.id, p.name
            ORDER BY qty_sold DESC
            LIMIT 10
        """)
        data = cursor.fetchall()
        for row in data:
            row["qty_sold"] = int(row["qty_sold"] or 0)
            row["revenue"] = float(row["revenue"] or 0)
        return jsonify(data)

    finally:
        cursor.close()
        conn.close()


@report_bp.route("/reports/low-stock")
@token_required
def low_stock_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    sf = f"AND shop_id = {shop_id}" if shop_id else ""

    try:
        cursor.execute(f"""
            SELECT barcode, name, category, brand, stock, minimum_stock
            FROM products
            WHERE stock <= minimum_stock {sf}
            ORDER BY stock ASC
        """)
        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        conn.close()


@report_bp.route("/reports/profit-summary")
@token_required
def profit_summary():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    sf = f"JOIN sales s ON s.id = si.sale_id WHERE s.shop_id = {shop_id}" if shop_id else ""

    try:
        cursor.execute(f"""
            SELECT
                IFNULL(SUM(si.profit),0) AS total_profit,
                IFNULL(SUM(si.quantity),0) AS total_items
            FROM sale_items si {sf}
        """)
        summary = cursor.fetchone()
        return jsonify({
            "total_profit": float(summary["total_profit"] or 0),
            "total_items": int(summary["total_items"] or 0)
        })

    finally:
        cursor.close()
        conn.close()