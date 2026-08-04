from flask import Blueprint, request, jsonify, g
from database import get_connection
from utils.auth_middleware import token_required

products_bp = Blueprint("products", __name__)


@products_bp.route("/products/search", methods=["GET"])
@token_required
def search_products():
    keyword = request.args.get("q", "").strip()
    user_shop_id = g.user.get("shop_id")
    role = g.user.get("role")

    filter_shop = request.args.get("shop_id", type=int) or user_shop_id

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    if keyword:
        search = f"%{keyword}%"
        if filter_shop:
            cursor.execute("""
                SELECT * FROM products
                WHERE (barcode LIKE %s OR name LIKE %s OR brand LIKE %s)
                AND (shop_id = %s OR shop_id IS NULL)
                ORDER BY stock DESC, name ASC
                LIMIT 50
            """, (search, search, search, filter_shop))
            products = cursor.fetchall()

            # Fallback: if no products found for specific shop_id, search across all products in DB!
            if not products:
                cursor.execute("""
                    SELECT * FROM products
                    WHERE (barcode LIKE %s OR name LIKE %s OR brand LIKE %s)
                    ORDER BY stock DESC, name ASC
                    LIMIT 50
                """, (search, search, search))
                products = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT * FROM products
                WHERE (barcode LIKE %s OR name LIKE %s OR brand LIKE %s)
                ORDER BY stock DESC, name ASC
                LIMIT 50
            """, (search, search, search))
            products = cursor.fetchall()
    else:
        if filter_shop:
            cursor.execute("""
                SELECT * FROM products
                WHERE (shop_id = %s OR shop_id IS NULL)
                ORDER BY stock DESC, name ASC
                LIMIT 50
            """, (filter_shop,))
            products = cursor.fetchall()

            if not products:
                cursor.execute("""
                    SELECT * FROM products
                    ORDER BY stock DESC, name ASC
                    LIMIT 50
                """)
                products = cursor.fetchall()
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