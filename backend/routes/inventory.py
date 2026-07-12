from flask import Blueprint, request, jsonify
from database import get_connection

inventory_bp = Blueprint("inventory", __name__)


# GET all products
@inventory_bp.route("/products", methods=["GET"])
def get_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products ORDER BY name")
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(products)


# ADD product
@inventory_bp.route("/products", methods=["POST"])
def add_product():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO products
        (barcode, name, brand, category, purchase_price, selling_price, stock, minimum_stock, expiry_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
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


# UPDATE product — exclude barcode from unique check by using id != self
@inventory_bp.route("/products/<int:id>", methods=["PUT"])
def update_product(id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check barcode uniqueness manually (ignore current product's own barcode)
        barcode = data.get("barcode", "").strip()
        if barcode:
            cursor.execute(
                "SELECT id FROM products WHERE barcode = %s AND id != %s",
                (barcode, id)
            )
            if cursor.fetchone():
                return jsonify({"error": "Another product already uses this barcode"}), 409

        cursor.execute("""
        UPDATE products
        SET
            barcode=%s,
            name=%s,
            brand=%s,
            category=%s,
            purchase_price=%s,
            selling_price=%s,
            stock=%s,
            minimum_stock=%s,
            expiry_date=%s
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
# ?force=true: nullifies FK references then deletes
@inventory_bp.route("/products/<int:id>", methods=["DELETE"])
def delete_product(id):
    force = request.args.get("force", "false").lower() == "true"
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if force:
            # Nullify references in sale_items and purchase_items
            # (set product_id to NULL so history is kept but FK is released)
            cursor.execute("UPDATE sale_items SET product_id = NULL WHERE product_id = %s", (id,))
            cursor.execute("UPDATE purchase_items SET product_id = NULL WHERE product_id = %s", (id,))
            cursor.execute("DELETE FROM products WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"message": "Product deleted"})

        else:
            # Safe check first
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