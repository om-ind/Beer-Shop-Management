from flask import Blueprint, jsonify, request
from database import get_connection
import datetime

expenses_bp = Blueprint("expenses", __name__)

VALID_CATEGORIES = ["Electricity", "Rent", "Salary", "Transport", "Maintenance", "Misc"]


# ===============================
# GET /expenses  — list with optional month/year filter
# ===============================
@expenses_bp.route("/expenses", methods=["GET"])
def get_expenses():
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if month and year:
            cursor.execute("""
                SELECT * FROM expenses
                WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
                ORDER BY expense_date DESC, id DESC
            """, (month, year))
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
# POST /expenses  — add new expense
# ===============================
@expenses_bp.route("/expenses", methods=["POST"])
def add_expense():
    data = request.get_json()

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
            INSERT INTO expenses (category, description, amount, expense_date, created_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (category, description, float(amount), expense_date, created_by))
        conn.commit()

        return jsonify({"message": "Expense added", "id": cursor.lastrowid}), 201

    finally:
        cursor.close()
        conn.close()


# ===============================
# PUT /expenses/<id>  — edit expense
# ===============================
@expenses_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
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
# GET /expenses/summary  — totals by category for a month
# ===============================
@expenses_bp.route("/expenses/summary", methods=["GET"])
def expense_summary():
    month = request.args.get("month", type=int, default=datetime.date.today().month)
    year  = request.args.get("year",  type=int, default=datetime.date.today().year)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                category,
                IFNULL(SUM(amount), 0) AS total
            FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
            GROUP BY category
            ORDER BY total DESC
        """, (month, year))

        rows = cursor.fetchall()

        cursor.execute("""
            SELECT IFNULL(SUM(amount), 0) AS grand_total
            FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
        """, (month, year))

        grand = cursor.fetchone()

        result = {
            "month": month,
            "year": year,
            "grand_total": float(grand["grand_total"]),
            "by_category": [{"category": r["category"], "total": float(r["total"])} for r in rows]
        }

        return jsonify(result)

    finally:
        cursor.close()
        conn.close()
