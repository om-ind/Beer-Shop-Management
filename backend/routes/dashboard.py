from flask import Blueprint, jsonify, request
from database import get_connection
import datetime

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        selected_date_str = request.args.get("date")
        if not selected_date_str:
            selected_date = datetime.date.today()
        else:
            try:
                selected_date = datetime.datetime.strptime(selected_date_str, "%Y-%m-%d").date()
            except ValueError:
                selected_date = datetime.date.today()

        dashboard = {}

        # Selected Date's Sales
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE DATE(sale_date)=%s
        """, (selected_date,))
        dashboard["today_sales"] = cursor.fetchone()["value"]

        # Selected Date's Profit
        cursor.execute("""
        SELECT IFNULL(SUM(si.profit),0) AS value
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE DATE(s.sale_date)=%s
        """, (selected_date,))
        dashboard["today_profit"] = cursor.fetchone()["value"]

        # Weekly Sales (relative to selected date)
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE YEARWEEK(sale_date,1)=YEARWEEK(%s,1)
        """, (selected_date,))
        dashboard["weekly_sales"] = cursor.fetchone()["value"]

        # Monthly Sales (relative to selected date)
        cursor.execute("""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE MONTH(sale_date)=MONTH(%s)
        AND YEAR(sale_date)=YEAR(%s)
        """, (selected_date, selected_date))
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

        # Monthly Profit (relative to selected date)
        cursor.execute("""
        SELECT IFNULL(SUM(si.profit),0) AS value
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE MONTH(s.sale_date)=MONTH(%s)
        AND YEAR(s.sale_date)=YEAR(%s)
        """, (selected_date, selected_date))
        monthly_profit = float(cursor.fetchone()["value"])
        dashboard["monthly_profit"] = monthly_profit

        # Monthly Expenses (relative to selected date)
        try:
            cursor.execute("""
            SELECT IFNULL(SUM(amount),0) AS value
            FROM expenses
            WHERE MONTH(expense_date)=MONTH(%s)
            AND YEAR(expense_date)=YEAR(%s)
            """, (selected_date, selected_date))
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