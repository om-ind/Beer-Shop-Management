from flask import Blueprint, jsonify
from database import get_connection

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("/customers", methods=["GET"])
def get_customers():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            name
        FROM customers
        ORDER BY name
    """)

    customers = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(customers)