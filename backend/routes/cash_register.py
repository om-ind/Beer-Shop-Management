from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import date

cash_register_bp = Blueprint("cash_register", __name__)

VALID_TYPES = ("cash_in", "cash_out", "bank_in", "bank_out")
VALID_CATEGORIES = ("daily_sales", "bill_payment", "expense", "transfer", "salary", "other")


# ─────────────────────────────────
# GET  /cash-register/summary
# Returns cash balance, bank balance, grand total
# ─────────────────────────────────
@cash_register_bp.route("/cash-register/summary", methods=["GET"])
def get_summary():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                IFNULL(SUM(CASE WHEN entry_type = 'cash_in'  THEN amount ELSE 0 END), 0) AS cash_in,
                IFNULL(SUM(CASE WHEN entry_type = 'cash_out' THEN amount ELSE 0 END), 0) AS cash_out,
                IFNULL(SUM(CASE WHEN entry_type = 'bank_in'  THEN amount ELSE 0 END), 0) AS bank_in,
                IFNULL(SUM(CASE WHEN entry_type = 'bank_out' THEN amount ELSE 0 END), 0) AS bank_out
            FROM cash_register
        """)
        row = cursor.fetchone()

        cash_balance = float(row["cash_in"]) - float(row["cash_out"])
        bank_balance = float(row["bank_in"]) - float(row["bank_out"])

        # Today's in
        cursor.execute("""
            SELECT
                IFNULL(SUM(CASE WHEN entry_type IN ('cash_in','bank_in')  THEN amount ELSE 0 END), 0) AS today_in,
                IFNULL(SUM(CASE WHEN entry_type IN ('cash_out','bank_out') THEN amount ELSE 0 END), 0) AS today_out
            FROM cash_register
            WHERE entry_date = CURDATE()
        """)
        today = cursor.fetchone()

        return jsonify({
            "cash_balance": cash_balance,
            "bank_balance": bank_balance,
            "total_balance": cash_balance + bank_balance,
            "today_in": float(today["today_in"]),
            "today_out": float(today["today_out"]),
        })

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# GET  /cash-register
# Paginated ledger with optional filters
# ─────────────────────────────────
@cash_register_bp.route("/cash-register", methods=["GET"])
def get_entries():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 30))
        offset = (page - 1) * per_page
        entry_type = request.args.get("type", "")
        date_from = request.args.get("from", "")
        date_to = request.args.get("to", "")

        filters = []
        params = []

        if entry_type and entry_type in VALID_TYPES:
            filters.append("entry_type = %s")
            params.append(entry_type)

        if date_from:
            filters.append("entry_date >= %s")
            params.append(date_from)

        if date_to:
            filters.append("entry_date <= %s")
            params.append(date_to)

        where = ("WHERE " + " AND ".join(filters)) if filters else ""

        cursor.execute(f"""
            SELECT COUNT(*) AS total FROM cash_register {where}
        """, params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
            SELECT id, entry_type, category, amount, description, entry_date, created_at
            FROM cash_register
            {where}
            ORDER BY entry_date DESC, created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])

        entries = cursor.fetchall()

        for e in entries:
            e["amount"] = float(e["amount"])
            e["entry_date"] = str(e["entry_date"])
            e["created_at"] = str(e["created_at"])

        return jsonify({
            "entries": entries,
            "total": total,
            "page": page,
            "pages": max(1, (total + per_page - 1) // per_page)
        })

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# POST /cash-register
# Add a new ledger entry
# ─────────────────────────────────
@cash_register_bp.route("/cash-register", methods=["POST"])
def add_entry():
    data = request.get_json()

    entry_type = data.get("entry_type", "").strip()
    category = data.get("category", "other").strip()
    amount = float(data.get("amount", 0))
    description = data.get("description", "").strip()
    entry_date = data.get("entry_date", str(date.today()))

    if entry_type not in VALID_TYPES:
        return jsonify({"error": f"Invalid entry_type. Must be one of: {VALID_TYPES}"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO cash_register (entry_type, category, amount, description, entry_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (entry_type, category, amount, description, entry_date))

        conn.commit()

        return jsonify({"success": True, "id": cursor.lastrowid, "message": "Entry added"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# DELETE /cash-register/<id>
# ─────────────────────────────────
@cash_register_bp.route("/cash-register/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM cash_register WHERE id = %s", (entry_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Entry not found"}), 404

        return jsonify({"success": True, "message": "Entry deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
