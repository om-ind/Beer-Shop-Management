from flask import Blueprint, jsonify, request, g
from mysql.connector import Error
from database import get_connection
from utils.auth_middleware import token_required

customers_bp = Blueprint("customers", __name__)


def _shop_id():
    return g.user.get("shop_id")

def _is_admin():
    return g.user.get("role") == "Admin"


# --------------------------
# GET ALL CUSTOMERS
# --------------------------
@customers_bp.route("/customers", methods=["GET"])
@token_required
def get_customers():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()

    if _is_admin():
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    if filter_shop:
        cursor.execute("SELECT * FROM customers WHERE shop_id=%s ORDER BY id DESC", (filter_shop,))
    else:
        cursor.execute("SELECT * FROM customers ORDER BY id DESC")

    customers = cursor.fetchall()
    cursor.close()
    conn.close()

    for c in customers:
        c["credit_balance"] = float(c.get("credit_balance") or 0)
        c["phone"] = c.get("mobile") or ""

    return jsonify(customers)


# --------------------------
# ADD CUSTOMER
# --------------------------
@customers_bp.route("/customers", methods=["POST"])
@token_required
def add_customer():
    data = request.get_json()
    shop_id = _shop_id()

    if _is_admin():
        shop_id = data.get("shop_id") or shop_id

    conn = get_connection()
    cursor = conn.cursor()

    mobile_num = data.get("mobile") or data.get("phone") or ""

    cursor.execute("""
        INSERT INTO customers (name, mobile, address, shop_id)
        VALUES (%s,%s,%s,%s)
    """, (data["name"], mobile_num, data.get("address", ""), shop_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Customer added successfully."}, 201


# --------------------------
# UPDATE CUSTOMER
# --------------------------
@customers_bp.route("/customers/<int:id>", methods=["PUT"])
@token_required
def update_customer(id):
    data = request.get_json()
    conn = get_connection()
    cursor = conn.cursor()

    mobile_num = data.get("mobile") or data.get("phone") or ""

    cursor.execute("""
        UPDATE customers
        SET name=%s, mobile=%s, address=%s
        WHERE id=%s
    """, (data["name"], mobile_num, data.get("address", ""), id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Customer updated successfully."}


# --------------------------
# CHECK CUSTOMER LINKS
# --------------------------
@customers_bp.route("/customers/<int:id>/check", methods=["GET"])
@token_required
def check_customer_links(id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS cnt FROM sales WHERE customer_id = %s", (id,))
        sales_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) AS cnt FROM credit_payments WHERE customer_id = %s", (id,))
        payments_count = cursor.fetchone()["cnt"]

        return jsonify({
            "sales": sales_count,
            "credit_payments": payments_count,
            "has_links": sales_count > 0 or payments_count > 0
        })
    finally:
        cursor.close()
        conn.close()


# --------------------------
# DELETE CUSTOMER
# --------------------------
@customers_bp.route("/customers/<int:id>", methods=["DELETE"])
@token_required
def delete_customer(id):
    force = request.args.get("force", "false").lower() == "true"
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        if force:
            cursor.execute("DELETE FROM credit_payments WHERE customer_id = %s", (id,))
            cursor.execute("SELECT id FROM sales WHERE customer_id = %s", (id,))
            sale_ids = [row[0] for row in cursor.fetchall()]

            if sale_ids:
                placeholders = ",".join(["%s"] * len(sale_ids))
                cursor.execute(f"DELETE FROM sale_items WHERE sale_id IN ({placeholders})", sale_ids)

            cursor.execute("DELETE FROM sales WHERE customer_id = %s", (id,))
            cursor.execute("DELETE FROM customers WHERE id = %s", (id,))
            conn.commit()
            return {"success": True, "message": "Customer and all linked data deleted."}, 200

        else:
            cursor.execute("SELECT COUNT(*) FROM sales WHERE customer_id = %s", (id,))
            if cursor.fetchone()[0] > 0:
                return {"success": False, "message": "Customer has sales history.", "has_links": True}, 400

            cursor.execute("SELECT COUNT(*) FROM credit_payments WHERE customer_id = %s", (id,))
            if cursor.fetchone()[0] > 0:
                return {"success": False, "message": "Customer has credit records.", "has_links": True}, 400

            cursor.execute("DELETE FROM customers WHERE id = %s", (id,))
            conn.commit()
            return {"success": True, "message": "Customer deleted successfully."}, 200

    except Error as e:
        if conn:
            conn.rollback()
        return {"success": False, "message": str(e)}, 400

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# --------------------------
# GET CREDIT HISTORY
# --------------------------
@customers_bp.route("/customers/<int:id>/credit-history", methods=["GET"])
@token_required
def get_credit_history(id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, name, credit_balance FROM customers WHERE id=%s", (id,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        customer["credit_balance"] = float(customer.get("credit_balance") or 0)

        cursor.execute("""
            SELECT id, amount, remarks, payment_date
            FROM credit_payments
            WHERE customer_id = %s
            ORDER BY payment_date DESC
        """, (id,))

        history = cursor.fetchall()

        for row in history:
            row["amount"] = float(row.get("amount") or 0)
            row["payment_date"] = str(row["payment_date"])

        return jsonify({"customer": customer, "history": history})

    finally:
        cursor.close()
        conn.close()


# --------------------------
# ADD CREDIT PAYMENT (repayment)
# --------------------------
@customers_bp.route("/customers/<int:id>/credit-payment", methods=["POST"])
@token_required
def add_credit_payment(id):
    data = request.get_json()
    amount = float(data.get("amount", 0))
    remarks = data.get("remarks", "").strip()

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, name, credit_balance FROM customers WHERE id=%s", (id,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        current_balance = float(customer.get("credit_balance") or 0)

        if amount > current_balance:
            return jsonify({"error": f"Payment ₹{amount:.2f} exceeds outstanding balance ₹{current_balance:.2f}"}), 400

        cursor.execute("UPDATE customers SET credit_balance = credit_balance - %s WHERE id=%s", (amount, id))
        cursor.execute(
            "INSERT INTO credit_payments (customer_id, amount, remarks) VALUES (%s, %s, %s)",
            (id, amount, remarks or "Credit repayment")
        )

        conn.commit()
        new_balance = current_balance - amount

        return jsonify({
            "success": True,
            "message": f"Payment of ₹{amount:.2f} recorded. Remaining balance: ₹{new_balance:.2f}",
            "new_balance": new_balance
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# -----------------------------------
# ADD MANUAL / BACKDATED TRANSACTION
# -----------------------------------
@customers_bp.route("/customers/<int:id>/credit-transaction", methods=["POST"])
@token_required
def add_credit_transaction(id):
    data = request.get_json()
    txn_type = data.get("type", "debit")
    amount = float(data.get("amount", 0))
    remarks = data.get("remarks", "").strip()
    txn_date = data.get("date", "")

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    if txn_type not in ("debit", "payment"):
        return jsonify({"error": "type must be 'debit' or 'payment'"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, name, credit_balance FROM customers WHERE id=%s", (id,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        current_balance = float(customer.get("credit_balance") or 0)

        if txn_type == "payment":
            if amount > current_balance:
                return jsonify({"error": f"Payment ₹{amount:.2f} exceeds outstanding balance ₹{current_balance:.2f}"}), 400
            cursor.execute("UPDATE customers SET credit_balance = credit_balance - %s WHERE id=%s", (amount, id))
            stored_amount = amount
            new_balance = current_balance - amount
            default_remark = "Manual payment entry"

        else:
            cursor.execute("UPDATE customers SET credit_balance = credit_balance + %s WHERE id=%s", (amount, id))
            stored_amount = -amount
            new_balance = current_balance + amount
            default_remark = "Manual credit entry"

        if txn_date:
            cursor.execute(
                "INSERT INTO credit_payments (customer_id, amount, remarks, payment_date) VALUES (%s, %s, %s, %s)",
                (id, stored_amount, remarks or default_remark, txn_date)
            )
        else:
            cursor.execute(
                "INSERT INTO credit_payments (customer_id, amount, remarks) VALUES (%s, %s, %s)",
                (id, stored_amount, remarks or default_remark)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Transaction recorded. New balance: ₹{new_balance:.2f}",
            "new_balance": new_balance
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()