from flask import Blueprint, jsonify
from database import get_connection

supplier_bp = Blueprint("supplier", __name__)

@supplier_bp.route("/suppliers", methods=["GET"])
def get_suppliers():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            name,
            company
        FROM suppliers
        ORDER BY name
    """)

    suppliers = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(suppliers)