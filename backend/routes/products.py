from flask import Blueprint, request, jsonify
from database import get_connection

products_bp = Blueprint("products", __name__)

@products_bp.route("/products/search", methods=["GET"])
def search_products():
    keyword = request.args.get("q", "")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT *
        FROM products
        WHERE barcode LIKE %s
           OR name LIKE %s
           OR brand LIKE %s
        ORDER BY name
        LIMIT 20
    """

    search = f"%{keyword}%"

    cursor.execute(query, (search, search, search))

    products = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(products), 200