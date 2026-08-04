from flask import Blueprint, request, jsonify, g
from database import get_connection
from utils.auth_middleware import token_required

products_bp = Blueprint("products", __name__)


@products_bp.route("/products/search", methods=["GET"])
@token_required
def search_products():
    keyword = request.args.get("q", "")
    shop_id = g.user.get("shop_id")
    role = g.user.get("role")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    if keyword.strip():
        search = f"%{keyword.strip()}%"
        if filter_shop:
            cursor.execute("""
                SELECT * FROM products
                WHERE (barcode LIKE %s OR name LIKE %s OR brand LIKE %s)
                AND shop_id = %s
                ORDER BY name
                LIMIT 50
            """, (search, search, search, filter_shop))
        else:
            cursor.execute("""
                SELECT * FROM products
                WHERE barcode LIKE %s OR name LIKE %s OR brand LIKE %s
                ORDER BY name
                LIMIT 50
            """, (search, search, search))
    else:
        if filter_shop:
            cursor.execute("""
                SELECT * FROM products
                WHERE shop_id = %s
                ORDER BY stock DESC, name ASC
                LIMIT 50
            """, (filter_shop,))
        else:
            cursor.execute("""
                SELECT * FROM products
                ORDER BY stock DESC, name ASC
                LIMIT 50
            """)

    products = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(products), 200