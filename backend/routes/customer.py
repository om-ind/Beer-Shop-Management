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
        data["mobile"],
        data["address"]

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
        data["mobile"],
        data["address"],
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