from flask import Blueprint, jsonify, request, g
from database import get_connection
import datetime
from utils.auth_middleware import token_required

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
@token_required
def dashboard():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        role = g.user.get("role")
        shop_id = g.user.get("shop_id")

        if role == "Admin":
            filter_shop = request.args.get("shop_id", type=int) or shop_id
        else:
            filter_shop = shop_id

        selected_date_str = request.args.get("date")
        if not selected_date_str:
            selected_date = datetime.date.today()
        else:
            try:
                selected_date = datetime.datetime.strptime(selected_date_str, "%Y-%m-%d").date()
            except ValueError:
                selected_date = datetime.date.today()

        dashboard = {}

        def shop_filter(col="shop_id"):
            if filter_shop:
                return f"AND {col} = {filter_shop}"
            return ""

        sf = shop_filter()
        sf_s = shop_filter("s.shop_id")

        # Today's Sales
        cursor.execute(f"""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE DATE(sale_date)=%s {sf}
        """, (selected_date,))
        dashboard["today_sales"] = float(cursor.fetchone()["value"])

        # Today's Profit
        cursor.execute(f"""
        SELECT IFNULL(SUM(si.profit),0) AS value
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE DATE(s.sale_date)=%s {sf_s}
        """, (selected_date,))
        dashboard["today_profit"] = float(cursor.fetchone()["value"])

        # Weekly Sales
        cursor.execute(f"""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE YEARWEEK(sale_date,1)=YEARWEEK(%s,1) {sf}
        """, (selected_date,))
        dashboard["weekly_sales"] = float(cursor.fetchone()["value"])

        # Monthly Sales
        cursor.execute(f"""
        SELECT IFNULL(SUM(total_amount),0) AS value
        FROM sales
        WHERE MONTH(sale_date)=MONTH(%s)
        AND YEAR(sale_date)=YEAR(%s) {sf}
        """, (selected_date, selected_date))
        dashboard["monthly_sales"] = float(cursor.fetchone()["value"])

        # Inventory Value
        inv_filter = f"WHERE shop_id = {filter_shop}" if filter_shop else ""
        cursor.execute(f"""
        SELECT IFNULL(SUM(stock*purchase_price),0) AS value
        FROM products {inv_filter}
        """)
        dashboard["inventory_value"] = float(cursor.fetchone()["value"])

        # Total Products
        cursor.execute(f"SELECT COUNT(*) AS value FROM products {inv_filter}")
        dashboard["total_products"] = cursor.fetchone()["value"]

        # Customers
        cust_filter = f"WHERE shop_id = {filter_shop}" if filter_shop else ""
        cursor.execute(f"SELECT COUNT(*) AS value FROM customers {cust_filter}")
        dashboard["total_customers"] = cursor.fetchone()["value"]

        # Suppliers
        sup_filter = f"WHERE shop_id = {filter_shop}" if filter_shop else ""
        cursor.execute(f"SELECT COUNT(*) AS value FROM suppliers {sup_filter}")
        dashboard["total_suppliers"] = cursor.fetchone()["value"]

        # Low Stock
        cursor.execute(f"SELECT COUNT(*) AS value FROM products {inv_filter} {'AND' if inv_filter else 'WHERE'} stock<=minimum_stock")
        dashboard["low_stock"] = cursor.fetchone()["value"]

        # Top Selling Product
        cursor.execute(f"""
        SELECT p.name, SUM(si.quantity) qty
        FROM sale_items si
        JOIN products p ON p.id=si.product_id
        JOIN sales s ON s.id=si.sale_id
        {('WHERE s.shop_id=' + str(filter_shop)) if filter_shop else ''}
        GROUP BY p.id
        ORDER BY qty DESC
        LIMIT 1
        """)
        top = cursor.fetchone()
        dashboard["top_product"] = top["name"] if top else "N/A"

        # Highest Profit Brand
        cursor.execute(f"""
        SELECT p.brand, SUM(si.profit) profit
        FROM sale_items si
        JOIN products p ON p.id=si.product_id
        JOIN sales s ON s.id=si.sale_id
        {('WHERE s.shop_id=' + str(filter_shop)) if filter_shop else ''}
        GROUP BY p.brand
        ORDER BY profit DESC
        LIMIT 1
        """)
        brand = cursor.fetchone()
        dashboard["highest_profit_brand"] = brand["brand"] if brand else "N/A"

        # Monthly Profit
        cursor.execute(f"""
        SELECT IFNULL(SUM(si.profit),0) AS value
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE MONTH(s.sale_date)=MONTH(%s)
        AND YEAR(s.sale_date)=YEAR(%s) {sf_s}
        """, (selected_date, selected_date))
        monthly_profit = float(cursor.fetchone()["value"])
        dashboard["monthly_profit"] = monthly_profit

        # Monthly Expenses
        try:
            exp_filter = f"AND shop_id = {filter_shop}" if filter_shop else ""
            cursor.execute(f"""
            SELECT IFNULL(SUM(amount),0) AS value
            FROM expenses
            WHERE MONTH(expense_date)=MONTH(%s)
            AND YEAR(expense_date)=YEAR(%s) {exp_filter}
            """, (selected_date, selected_date))
            monthly_expenses = float(cursor.fetchone()["value"])
        except Exception:
            monthly_expenses = 0.0
        dashboard["monthly_expenses"] = monthly_expenses

        # Net Profit
        dashboard["net_profit"] = round(monthly_profit - monthly_expenses, 2)

        return jsonify(dashboard)

    finally:
        cursor.close()
        conn.close()