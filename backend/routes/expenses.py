from flask import Blueprint, jsonify, request, g
from database import get_connection
import datetime
from utils.auth_middleware import token_required

expenses_bp = Blueprint("expenses", __name__)

VALID_CATEGORIES = ["Electricity", "Rent", "Salary", "Transport", "Maintenance", "Misc"]


def _shop_id():
    return g.user.get("shop_id")

def _is_admin():
    return g.user.get("role") == "Admin"


# ===============================
# GET /expenses
# ===============================
@expenses_bp.route("/expenses", methods=["GET"])
@token_required
def get_expenses():
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    shop_id = _shop_id()

    if _is_admin():
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if month and year:
            if filter_shop:
                cursor.execute("""
                    SELECT * FROM expenses
                    WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s AND shop_id = %s
                    ORDER BY expense_date DESC, id DESC
                """, (month, year, filter_shop))
            else:
                cursor.execute("""
                    SELECT * FROM expenses
                    WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
                    ORDER BY expense_date DESC, id DESC
                """, (month, year))
        else:
            if filter_shop:
                cursor.execute("""
                    SELECT * FROM expenses
                    WHERE shop_id = %s
                    ORDER BY expense_date DESC, id DESC
                    LIMIT 200
                """, (filter_shop,))
            else:
                cursor.execute("""
                    SELECT * FROM expenses
                    ORDER BY expense_date DESC, id DESC
                    LIMIT 200
                """)

        data = cursor.fetchall()

        for row in data:
            row["amount"] = float(row["amount"])
            if row.get("expense_date"):
                row["expense_date"] = str(row["expense_date"])
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])

        return jsonify(data)

    finally:
        cursor.close()
        conn.close()


# ===============================
# POST /expenses
# ===============================
@expenses_bp.route("/expenses", methods=["POST"])
@token_required
def add_expense():
    data = request.get_json()
    shop_id = _shop_id()

    if _is_admin():
        shop_id = data.get("shop_id") or shop_id

    category    = data.get("category", "Misc")
    description = data.get("description", "")
    amount      = data.get("amount")
    expense_date = data.get("expense_date", str(datetime.date.today()))
    created_by  = data.get("created_by", "")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    if category not in VALID_CATEGORIES:
        return jsonify({"error": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO expenses (category, description, amount, expense_date, created_by, shop_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (category, description, float(amount), expense_date, created_by, shop_id))
        conn.commit()

        return jsonify({"message": "Expense added", "id": cursor.lastrowid}), 201

    finally:
        cursor.close()
        conn.close()


# ===============================
# PUT /expenses/<id>
# ===============================
@expenses_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
@token_required
def update_expense(expense_id):
    data = request.get_json()

    category    = data.get("category", "Misc")
    description = data.get("description", "")
    amount      = data.get("amount")
    expense_date = data.get("expense_date", str(datetime.date.today()))

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    if category not in VALID_CATEGORIES:
        return jsonify({"error": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE expenses
            SET category = %s, description = %s, amount = %s, expense_date = %s
            WHERE id = %s
        """, (category, description, float(amount), expense_date, expense_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Expense not found"}), 404

        return jsonify({"message": "Expense updated"})

    finally:
        cursor.close()
        conn.close()


# ===============================
# DELETE /expenses/<id>
# ===============================
@expenses_bp.route("/expenses/<int:expense_id>", methods=["DELETE"])
@token_required
def delete_expense(expense_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Expense not found"}), 404

        return jsonify({"message": "Expense deleted"})

    finally:
        cursor.close()
        conn.close()


# ===============================
# GET /expenses/summary
# ===============================
@expenses_bp.route("/expenses/summary", methods=["GET"])
@token_required
def expense_summary():
    month = request.args.get("month", type=int, default=datetime.date.today().month)
    year  = request.args.get("year",  type=int, default=datetime.date.today().year)
    shop_id = _shop_id()

    if _is_admin():
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        shop_clause = "AND shop_id = %s" if filter_shop else ""
        params = (month, year, filter_shop) if filter_shop else (month, year)
        grand_params = params

        cursor.execute(f"""
            SELECT category, IFNULL(SUM(amount), 0) AS total
            FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s {shop_clause}
            GROUP BY category
            ORDER BY total DESC
        """, params)

        rows = cursor.fetchall()

        cursor.execute(f"""
            SELECT IFNULL(SUM(amount), 0) AS grand_total
            FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s {shop_clause}
        """, grand_params)

        grand = cursor.fetchone()

        return jsonify({
            "month": month,
            "year": year,
            "grand_total": float(grand["grand_total"]),
            "by_category": [{"category": r["category"], "total": float(r["total"])} for r in rows]
        })

    finally:
        cursor.close()
        conn.close()
