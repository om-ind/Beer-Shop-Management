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
            SELECT id, entry_type, category, amount, description, entry_date, created_at, supplier_bill_id
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
            e["supplier_bill_id"] = e.get("supplier_bill_id")

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

    supplier_bill_id = data.get("supplier_bill_id")
    if supplier_bill_id:
        try:
            supplier_bill_id = int(supplier_bill_id)
        except (ValueError, TypeError):
            supplier_bill_id = None

    if entry_type not in VALID_TYPES:
        return jsonify({"error": f"Invalid entry_type. Must be one of: {VALID_TYPES}"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check supplier bill if linked
        if supplier_bill_id:
            cursor.execute("SELECT id, total_amount, paid_amount FROM supplier_bills WHERE id=%s", (supplier_bill_id,))
            bill = cursor.fetchone()
            if not bill:
                return jsonify({"error": "Supplier bill not found"}), 404

            total = float(bill["total_amount"])
            already_paid = float(bill["paid_amount"])
            remaining = total - already_paid
            if amount > remaining + 0.001:
                return jsonify({"error": f"Payment ₹{amount:.2f} exceeds remaining balance ₹{remaining:.2f}"}), 400

        cursor.close()
        cursor = conn.cursor()

        # Update bill if present
        if supplier_bill_id:
            new_paid = already_paid + amount
            if new_paid >= total - 0.001:
                new_status = "paid"
                new_paid = total
            else:
                new_status = "partial"
            cursor.execute("""
                UPDATE supplier_bills
                SET paid_amount = %s, status = %s
                WHERE id = %s
            """, (new_paid, new_status, supplier_bill_id))

        is_transfer = (category == "transfer")
        counterpart_type = None

        if is_transfer:
            if entry_type == "cash_out":
                counterpart_type = "bank_in"
            elif entry_type == "bank_out":
                counterpart_type = "cash_in"
            elif entry_type == "cash_in":
                counterpart_type = "bank_out"
            elif entry_type == "bank_in":
                counterpart_type = "cash_out"

        main_id = None
        if is_transfer and counterpart_type:
            import time
            import random
            ref_token = f"TRF-{int(time.time())}-{random.randint(100, 999)}"
            desc_with_ref = f"{description} [Ref: {ref_token}]".strip()

            # Insert main entry
            cursor.execute("""
                INSERT INTO cash_register (entry_type, category, amount, description, entry_date, supplier_bill_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (entry_type, category, amount, desc_with_ref, entry_date, supplier_bill_id))
            main_id = cursor.lastrowid

            # Insert counterpart entry
            cursor.execute("""
                INSERT INTO cash_register (entry_type, category, amount, description, entry_date, supplier_bill_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (counterpart_type, category, amount, desc_with_ref, entry_date, supplier_bill_id))
        else:
            cursor.execute("""
                INSERT INTO cash_register (entry_type, category, amount, description, entry_date, supplier_bill_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (entry_type, category, amount, description, entry_date, supplier_bill_id))
            main_id = cursor.lastrowid

        conn.commit()

        return jsonify({"success": True, "id": main_id, "message": "Entry added"}), 201

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
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT amount, description, supplier_bill_id FROM cash_register WHERE id = %s", (entry_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Entry not found"}), 404

        description = row["description"] or ""
        supplier_bill_id = row.get("supplier_bill_id")
        amount = float(row["amount"] or 0)

        # Check for transfer ref e.g. [Ref: TRF-123456-789]
        import re
        match = re.search(r"\[Ref:\s*(TRF-\d+-\d+)\]", description)

        cursor.close()
        cursor = conn.cursor()

        # Revert supplier bill payment if linked
        if supplier_bill_id:
            cursor.execute("SELECT total_amount, paid_amount FROM supplier_bills WHERE id = %s", (supplier_bill_id,))
            bill_row = cursor.fetchone()
            if bill_row:
                total_amt = float(bill_row[0])
                paid_amt = float(bill_row[1])
                new_paid = max(0.0, paid_amt - amount)
                new_status = "pending" if new_paid <= 0.001 else ("partial" if new_paid < total_amt - 0.001 else "paid")
                cursor.execute("""
                    UPDATE supplier_bills
                    SET paid_amount = %s, status = %s
                    WHERE id = %s
                """, (new_paid, new_status, supplier_bill_id))

        if match:
            ref_token = match.group(1)
            cursor.execute("DELETE FROM cash_register WHERE description LIKE %s", (f"%[Ref: {ref_token}]%",))
        else:
            cursor.execute("DELETE FROM cash_register WHERE id = %s", (entry_id,))

        conn.commit()
        return jsonify({"success": True, "message": "Entry deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
