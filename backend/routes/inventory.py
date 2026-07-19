from flask import Blueprint, request, jsonify, g
from database import get_connection
from utils.auth_middleware import token_required

inventory_bp = Blueprint("inventory", __name__)


def get_shop_id():
    """Return caller's shop_id. Admin can pass ?shop_id= to scope a specific shop."""
    role = g.user.get("role")
    if role == "Admin":
        sid = request.args.get("shop_id", type=int)
        return sid  # None = all shops (admin global view)
    return g.user.get("shop_id")


# GET all products
@inventory_bp.route("/products", methods=["GET"])
@token_required
def get_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = get_shop_id()
    if shop_id:
        cursor.execute("SELECT * FROM products WHERE shop_id=%s ORDER BY name", (shop_id,))
    else:
        cursor.execute("SELECT * FROM products ORDER BY name")
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(products)


# ADD product
@inventory_bp.route("/products", methods=["POST"])
@token_required
def add_product():
    data = request.json
    shop_id = g.user.get("shop_id")

    # Admin must supply shop_id
    if g.user.get("role") == "Admin":
        shop_id = data.get("shop_id") or shop_id
        if not shop_id:
            return jsonify({"error": "shop_id is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO products
        (barcode, name, brand, category, purchase_price, selling_price, stock, minimum_stock, expiry_date, shop_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get("barcode"),
            data.get("name"),
            data.get("brand"),
            data.get("category"),
            data.get("purchase_price"),
            data.get("selling_price"),
            data.get("stock"),
            data.get("minimum_stock"),
            data.get("expiry_date") or None,
            shop_id,
        ))
        conn.commit()
        return jsonify({"message": "Product Added Successfully"}), 201

    except Exception as e:
        conn.rollback()
        err = str(e)
        if "Duplicate entry" in err and "barcode" in err:
            return jsonify({"error": "A product with this barcode already exists"}), 409
        return jsonify({"error": err}), 500

    finally:
        cursor.close()
        conn.close()


# UPDATE product
@inventory_bp.route("/products/<int:id>", methods=["PUT"])
@token_required
def update_product(id):
    data = request.json
    shop_id = g.user.get("shop_id")
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Ownership check
        if g.user.get("role") != "Admin":
            cursor.execute("SELECT shop_id FROM products WHERE id=%s", (id,))
            row = cursor.fetchone()
            if not row or row[0] != shop_id:
                return jsonify({"error": "Forbidden"}), 403

        barcode = data.get("barcode", "").strip()
        if barcode:
            cursor.execute(
                "SELECT id FROM products WHERE barcode = %s AND id != %s AND shop_id = %s",
                (barcode, id, shop_id)
            )
            if cursor.fetchone():
                return jsonify({"error": "Another product already uses this barcode"}), 409

        cursor.execute("""
        UPDATE products
        SET barcode=%s, name=%s, brand=%s, category=%s, purchase_price=%s,
            selling_price=%s, stock=%s, minimum_stock=%s, expiry_date=%s
        WHERE id=%s
        """, (
            barcode or None,
            data.get("name"),
            data.get("brand"),
            data.get("category"),
            data.get("purchase_price"),
            data.get("selling_price"),
            data.get("stock"),
            data.get("minimum_stock"),
            data.get("expiry_date") or None,
            id
        ))
        conn.commit()
        return jsonify({"message": "Product Updated"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# CHECK product links before delete
@inventory_bp.route("/products/<int:id>/check", methods=["GET"])
@token_required
def check_product_links(id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS cnt FROM sale_items WHERE product_id = %s", (id,))
        sales_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) AS cnt FROM purchase_items WHERE product_id = %s", (id,))
        purchase_count = cursor.fetchone()["cnt"]

        return jsonify({
            "sale_items": sales_count,
            "purchase_items": purchase_count,
            "has_links": sales_count > 0 or purchase_count > 0
        })
    finally:
        cursor.close()
        conn.close()


# DELETE product
@inventory_bp.route("/products/<int:id>", methods=["DELETE"])
@token_required
def delete_product(id):
    force = request.args.get("force", "false").lower() == "true"
    shop_id = g.user.get("shop_id")
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if g.user.get("role") != "Admin":
            cursor.execute("SELECT shop_id FROM products WHERE id=%s", (id,))
            row = cursor.fetchone()
            if not row or row[0] != shop_id:
                return jsonify({"error": "Forbidden"}), 403

        if force:
            cursor.execute("UPDATE sale_items SET product_id = NULL WHERE product_id = %s", (id,))
            cursor.execute("UPDATE purchase_items SET product_id = NULL WHERE product_id = %s", (id,))
            cursor.execute("DELETE FROM products WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"message": "Product deleted"})

        else:
            cursor.execute("SELECT COUNT(*) FROM sale_items WHERE product_id = %s", (id,))
            if cursor.fetchone()[0] > 0:
                return jsonify({"message": "Product has sales records", "has_links": True}), 400

            cursor.execute("SELECT COUNT(*) FROM purchase_items WHERE product_id = %s", (id,))
            if cursor.fetchone()[0] > 0:
                return jsonify({"message": "Product has purchase records", "has_links": True}), 400

            cursor.execute("DELETE FROM products WHERE id = %s", (id,))
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"error": "Product not found"}), 404

            return jsonify({"message": "Deleted Successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()