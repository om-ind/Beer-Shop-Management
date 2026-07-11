from flask import Blueprint, jsonify, request
from mysql.connector import Error
from database import get_connection

customers_bp = Blueprint("customers", __name__)


# --------------------------
# GET ALL CUSTOMERS
# --------------------------
@customers_bp.route("/customers", methods=["GET"])
def get_customers():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM customers
        ORDER BY id DESC
    """)

    customers = cursor.fetchall()

    cursor.close()
    conn.close()

    for c in customers:
        c["credit_balance"] = float(c.get("credit_balance") or 0)

    return jsonify(customers)


# --------------------------
# ADD CUSTOMER
# --------------------------
@customers_bp.route("/customers", methods=["POST"])
def add_customer():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO customers
        (
            name,
            mobile,
            address
        )
        VALUES
        (%s,%s,%s)
    """, (

        data["name"],
        data.get("mobile", ""),
        data.get("address", "")

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Customer added successfully."
    }, 201


# --------------------------
# UPDATE CUSTOMER
# --------------------------
@customers_bp.route("/customers/<int:id>", methods=["PUT"])
def update_customer(id):

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE customers
        SET
            name=%s,
            mobile=%s,
            address=%s
        WHERE id=%s
    """, (

        data["name"],
        data.get("mobile", ""),
        data.get("address", ""),
        id

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Customer updated successfully."
    }


# --------------------------
# DELETE CUSTOMER
# --------------------------
@customers_bp.route("/customers/<int:id>", methods=["DELETE"])
def delete_customer(id):

    conn = None
    cursor = None

    try:

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM customers WHERE id=%s",
            (id,)
        )

        conn.commit()

        return {
            "success": True,
            "message": "Customer deleted successfully."
        }, 200

    except Error as e:

        if conn:
            conn.rollback()

        message = str(e)

        if "1451" in message:

            return {
                "success": False,
                "message": "Customer has sales history and cannot be deleted."
            }, 400

        return {
            "success": False,
            "message": message
        }, 400

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# --------------------------
# GET CREDIT HISTORY
# --------------------------
@customers_bp.route("/customers/<int:id>/credit-history", methods=["GET"])
def get_credit_history(id):
    """Return credit payment history for a customer."""

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch customer info
        cursor.execute(
            "SELECT id, name, credit_balance FROM customers WHERE id=%s",
            (id,)
        )
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        customer["credit_balance"] = float(customer.get("credit_balance") or 0)

        # Fetch all credit history entries
        cursor.execute("""
            SELECT
                id,
                amount,
                remarks,
                payment_date
            FROM credit_payments
            WHERE customer_id = %s
            ORDER BY payment_date DESC
        """, (id,))

        history = cursor.fetchall()

        for row in history:
            row["amount"] = float(row.get("amount") or 0)
            row["payment_date"] = str(row["payment_date"])

        return jsonify({
            "customer": customer,
            "history": history
        })

    finally:
        cursor.close()
        conn.close()


# --------------------------
# ADD CREDIT PAYMENT (repayment)
# --------------------------
@customers_bp.route("/customers/<int:id>/credit-payment", methods=["POST"])
def add_credit_payment(id):
    """Record a customer repayment — reduces their credit balance."""

    data = request.get_json()
    amount = float(data.get("amount", 0))
    remarks = data.get("remarks", "").strip()

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check customer exists + current balance
        cursor.execute(
            "SELECT id, name, credit_balance FROM customers WHERE id=%s",
            (id,)
        )
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        current_balance = float(customer.get("credit_balance") or 0)

        if amount > current_balance:
            return jsonify({
                "error": f"Payment ₹{amount:.2f} exceeds outstanding balance ₹{current_balance:.2f}"
            }), 400

        # Reduce credit balance
        cursor.execute(
            "UPDATE customers SET credit_balance = credit_balance - %s WHERE id=%s",
            (amount, id)
        )

        # Record the repayment as a positive amount
        cursor.execute(
            """
            INSERT INTO credit_payments (customer_id, amount, remarks)
            VALUES (%s, %s, %s)
            """,
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
def add_credit_transaction(id):
    """
    Manually add a credit transaction with a custom date.
    type: 'debit'   → customer owes more (negative in credit_payments, balance increases)
    type: 'payment' → customer pays back (positive in credit_payments, balance decreases)
    """

    data = request.get_json()
    txn_type = data.get("type", "debit")        # 'debit' or 'payment'
    amount = float(data.get("amount", 0))
    remarks = data.get("remarks", "").strip()
    txn_date = data.get("date", "")             # ISO date string e.g. "2025-06-15"

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    if txn_type not in ("debit", "payment"):
        return jsonify({"error": "type must be 'debit' or 'payment'"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify customer exists
        cursor.execute(
            "SELECT id, name, credit_balance FROM customers WHERE id=%s",
            (id,)
        )
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        current_balance = float(customer.get("credit_balance") or 0)

        if txn_type == "payment":
            if amount > current_balance:
                return jsonify({
                    "error": f"Payment ₹{amount:.2f} exceeds outstanding balance ₹{current_balance:.2f}"
                }), 400

            # Reduce balance, insert positive amount
            cursor.execute(
                "UPDATE customers SET credit_balance = credit_balance - %s WHERE id=%s",
                (amount, id)
            )
            stored_amount = amount   # positive = payment
            new_balance = current_balance - amount
            default_remark = "Manual payment entry"

        else:  # debit
            # Increase balance, insert negative amount
            cursor.execute(
                "UPDATE customers SET credit_balance = credit_balance + %s WHERE id=%s",
                (amount, id)
            )
            stored_amount = -amount  # negative = debit (customer owes)
            new_balance = current_balance + amount
            default_remark = "Manual credit entry"

        # Insert with custom date if provided, otherwise use NOW()
        if txn_date:
            cursor.execute(
                """
                INSERT INTO credit_payments (customer_id, amount, remarks, payment_date)
                VALUES (%s, %s, %s, %s)
                """,
                (id, stored_amount, remarks or default_remark, txn_date)
            )
        else:
            cursor.execute(
                """
                INSERT INTO credit_payments (customer_id, amount, remarks)
                VALUES (%s, %s, %s)
                """,
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