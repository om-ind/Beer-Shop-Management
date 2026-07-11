from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import date as date_obj

supplier_bills_bp = Blueprint("supplier_bills", __name__)


def _serialize_bill(bill):
    bill["total_amount"] = float(bill.get("total_amount") or 0)
    bill["paid_amount"] = float(bill.get("paid_amount") or 0)
    bill["balance_due"] = round(bill["total_amount"] - bill["paid_amount"], 2)
    bill["bill_date"] = str(bill["bill_date"]) if bill.get("bill_date") else None
    bill["due_date"] = str(bill["due_date"]) if bill.get("due_date") else None
    bill["created_at"] = str(bill["created_at"]) if bill.get("created_at") else None

    # Compute overdue
    if bill["status"] != "paid" and bill["due_date"]:
        bill["overdue"] = bill["due_date"] < str(date_obj.today())
    else:
        bill["overdue"] = False

    return bill


# ─────────────────────────────────
# GET  /suppliers/<id>/bills
# All bills for a specific supplier
# ─────────────────────────────────
@supplier_bills_bp.route("/suppliers/<int:supplier_id>/bills", methods=["GET"])
def get_supplier_bills(supplier_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify supplier exists
        cursor.execute("SELECT id, name, company FROM suppliers WHERE id=%s", (supplier_id,))
        supplier = cursor.fetchone()

        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404

        cursor.execute("""
            SELECT
                id, supplier_id, bill_number, bill_date, due_date,
                total_amount, paid_amount, status, notes, created_at
            FROM supplier_bills
            WHERE supplier_id = %s
            ORDER BY bill_date DESC
        """, (supplier_id,))

        bills = cursor.fetchall()
        bills = [_serialize_bill(b) for b in bills]

        total_billed = sum(b["total_amount"] for b in bills)
        total_paid = sum(b["paid_amount"] for b in bills)
        total_pending = total_billed - total_paid
        overdue_count = sum(1 for b in bills if b["overdue"])

        return jsonify({
            "supplier": supplier,
            "bills": bills,
            "summary": {
                "total_billed": round(total_billed, 2),
                "total_paid": round(total_paid, 2),
                "total_pending": round(total_pending, 2),
                "overdue_count": overdue_count,
            }
        })

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# GET  /supplier-bills/overview
# Pending totals across ALL suppliers
# ─────────────────────────────────
@supplier_bills_bp.route("/supplier-bills/overview", methods=["GET"])
def get_bills_overview():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                s.id AS supplier_id,
                s.name AS supplier_name,
                s.company,
                COUNT(sb.id) AS bill_count,
                IFNULL(SUM(sb.total_amount), 0) AS total_billed,
                IFNULL(SUM(sb.paid_amount), 0) AS total_paid,
                IFNULL(SUM(sb.total_amount - sb.paid_amount), 0) AS total_pending,
                SUM(CASE
                    WHEN sb.status != 'paid' AND sb.due_date IS NOT NULL AND sb.due_date < CURDATE()
                    THEN 1 ELSE 0
                END) AS overdue_count
            FROM suppliers s
            LEFT JOIN supplier_bills sb ON sb.supplier_id = s.id
            GROUP BY s.id
            ORDER BY total_pending DESC
        """)
        rows = cursor.fetchall()

        for r in rows:
            r["total_billed"] = float(r["total_billed"])
            r["total_paid"] = float(r["total_paid"])
            r["total_pending"] = float(r["total_pending"])

        # Grand totals
        cursor.execute("""
            SELECT
                IFNULL(SUM(total_amount - paid_amount), 0) AS grand_pending,
                SUM(CASE
                    WHEN status != 'paid' AND due_date IS NOT NULL AND due_date < CURDATE()
                    THEN 1 ELSE 0
                END) AS grand_overdue
            FROM supplier_bills
        """)
        totals = cursor.fetchone()

        return jsonify({
            "suppliers": rows,
            "grand_pending": float(totals["grand_pending"]),
            "grand_overdue": int(totals["grand_overdue"]),
        })

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# POST /supplier-bills
# Add a new bill
# ─────────────────────────────────
@supplier_bills_bp.route("/supplier-bills", methods=["POST"])
def add_supplier_bill():
    data = request.get_json()

    supplier_id = data.get("supplier_id")
    bill_number = data.get("bill_number", "").strip()
    bill_date = data.get("bill_date", str(date_obj.today()))
    due_date = data.get("due_date") or None
    total_amount = float(data.get("total_amount", 0))
    notes = data.get("notes", "").strip()

    if not supplier_id:
        return jsonify({"error": "supplier_id is required"}), 400
    if total_amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO supplier_bills
            (supplier_id, bill_number, bill_date, due_date, total_amount, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (supplier_id, bill_number, bill_date, due_date, total_amount, notes))

        conn.commit()

        return jsonify({
            "success": True,
            "id": cursor.lastrowid,
            "message": "Bill added successfully"
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# PUT /supplier-bills/<id>/pay
# Record a payment (partial or full)
# ─────────────────────────────────
@supplier_bills_bp.route("/supplier-bills/<int:bill_id>/pay", methods=["PUT"])
def pay_supplier_bill(bill_id):
    data = request.get_json()
    payment = float(data.get("amount", 0))

    if payment <= 0:
        return jsonify({"error": "Payment amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id, total_amount, paid_amount FROM supplier_bills WHERE id=%s",
            (bill_id,)
        )
        bill = cursor.fetchone()

        if not bill:
            return jsonify({"error": "Bill not found"}), 404

        total = float(bill["total_amount"])
        already_paid = float(bill["paid_amount"])
        remaining = total - already_paid

        if payment > remaining + 0.001:   # small float tolerance
            return jsonify({
                "error": f"Payment ₹{payment:.2f} exceeds remaining balance ₹{remaining:.2f}"
            }), 400

        new_paid = already_paid + payment
        if new_paid >= total - 0.001:
            new_status = "paid"
            new_paid = total
        else:
            new_status = "partial"

        cursor.execute("""
            UPDATE supplier_bills
            SET paid_amount = %s, status = %s
            WHERE id = %s
        """, (new_paid, new_status, bill_id))

        conn.commit()

        return jsonify({
            "success": True,
            "new_paid": round(new_paid, 2),
            "new_status": new_status,
            "message": f"Payment of ₹{payment:.2f} recorded. Status: {new_status}"
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────
# DELETE /supplier-bills/<id>
# ─────────────────────────────────
@supplier_bills_bp.route("/supplier-bills/<int:bill_id>", methods=["DELETE"])
def delete_supplier_bill(bill_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM supplier_bills WHERE id=%s", (bill_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Bill not found"}), 404

        return jsonify({"success": True, "message": "Bill deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
