from flask import Blueprint, jsonify
from database import get_connection

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        dashboard = {}

        # Today's Sales
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE DATE(sale_date)=CURDATE()
        """)
        dashboard["today_sales"] = cursor.fetchone()["value"]

        # Today's Profit
        cursor.execute("""
        SELECT IFNULL(SUM(profit),0) AS value
        FROM sale_items
        """)
        dashboard["today_profit"] = cursor.fetchone()["value"]

        # Weekly Sales
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE YEARWEEK(sale_date,1)=YEARWEEK(CURDATE(),1)
        """)
        dashboard["weekly_sales"] = cursor.fetchone()["value"]

        # Monthly Sales
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE MONTH(sale_date)=MONTH(CURDATE())
        AND YEAR(sale_date)=YEAR(CURDATE())
        """)
        dashboard["monthly_sales"] = cursor.fetchone()["value"]

        # Inventory Value
        cursor.execute("""
        SELECT IFNULL(SUM(stock*purchase_price),0) AS value
        FROM products
        """)
        dashboard["inventory_value"] = cursor.fetchone()["value"]

        # Total Products
        cursor.execute("""
        SELECT COUNT(*) AS value
        FROM products
        """)
        dashboard["total_products"] = cursor.fetchone()["value"]

        # Customers
        cursor.execute("""
        SELECT COUNT(*) AS value
        FROM customers
        """)
        dashboard["total_customers"] = cursor.fetchone()["value"]

        # Suppliers
        cursor.execute("""
        SELECT COUNT(*) AS value
        FROM suppliers
        """)
        dashboard["total_suppliers"] = cursor.fetchone()["value"]

        # Low Stock
        cursor.execute("""
        SELECT COUNT(*) AS value
        FROM products
        WHERE stock<=minimum_stock
        """)
        dashboard["low_stock"] = cursor.fetchone()["value"]

        # Top Selling Product
        cursor.execute("""
        SELECT
            p.name,
            SUM(si.quantity) qty
        FROM sale_items si
        JOIN products p
        ON p.id=si.product_id
        GROUP BY p.id
        ORDER BY qty DESC
        LIMIT 1
        """)

        top = cursor.fetchone()

        dashboard["top_product"] = top["name"] if top else "N/A"

        # Highest Profit Brand
        cursor.execute("""
        SELECT
            p.brand,
            SUM(si.profit) profit
        FROM sale_items si
        JOIN products p
        ON p.id=si.product_id
        GROUP BY p.brand
        ORDER BY profit DESC
        LIMIT 1
        """)

        brand = cursor.fetchone()

        dashboard["highest_profit_brand"] = brand["brand"] if brand else "N/A"

        # Monthly Profit (all time sum of profits for this month)
        cursor.execute("""
        SELECT IFNULL(SUM(si.profit),0) AS value
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE MONTH(s.sale_date)=MONTH(CURDATE())
        AND YEAR(s.sale_date)=YEAR(CURDATE())
        """)
        monthly_profit = float(cursor.fetchone()["value"])
        dashboard["monthly_profit"] = monthly_profit

        # Monthly Expenses (safe even if table doesn't exist yet)
        try:
            cursor.execute("""
            SELECT IFNULL(SUM(amount),0) AS value
            FROM expenses
            WHERE MONTH(expense_date)=MONTH(CURDATE())
            AND YEAR(expense_date)=YEAR(CURDATE())
            """)
            monthly_expenses = float(cursor.fetchone()["value"])
        except Exception:
            monthly_expenses = 0.0
        dashboard["monthly_expenses"] = monthly_expenses

        # Net Profit = Monthly Profit - Monthly Expenses
        dashboard["net_profit"] = round(monthly_profit - monthly_expenses, 2)

        return jsonify(dashboard)

    finally:

        cursor.close()
        conn.close()