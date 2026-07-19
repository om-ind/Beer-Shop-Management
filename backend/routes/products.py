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

    search = f"%{keyword}%"

    if role == "Admin":
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    if filter_shop:
        cursor.execute("""
            SELECT *
            FROM products
            WHERE (barcode LIKE %s OR name LIKE %s OR brand LIKE %s)
            AND shop_id = %s
            ORDER BY name
            LIMIT 20
        """, (search, search, search, filter_shop))
    else:
        cursor.execute("""
            SELECT *
            FROM products
            WHERE barcode LIKE %s OR name LIKE %s OR brand LIKE %s
            ORDER BY name
            LIMIT 20
        """, (search, search, search))

    products = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(products), 200