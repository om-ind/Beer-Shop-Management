from flask import Blueprint, jsonify, request, g
from database import get_connection
from utils.auth_middleware import token_required

supplier_bp = Blueprint("supplier", __name__)


def _shop_id():
    return g.user.get("shop_id")

def _is_admin():
    return g.user.get("role") == "Admin"


# ===============================
# GET /suppliers — list all
# ===============================
@supplier_bp.route("/suppliers", methods=["GET"])
@token_required
def get_suppliers():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()

    if _is_admin():
        filter_shop = request.args.get("shop_id", type=int) or shop_id
    else:
        filter_shop = shop_id

    if filter_shop:
        cursor.execute("""
            SELECT id, name, company, mobile, address
            FROM suppliers
            WHERE shop_id=%s
            ORDER BY name
        """, (filter_shop,))
    else:
        cursor.execute("SELECT id, name, company, mobile, address FROM suppliers ORDER BY name")

    suppliers = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(suppliers)


# ===============================
# POST /suppliers — add new supplier
# ===============================
@supplier_bp.route("/suppliers", methods=["POST"])
@token_required
def add_supplier():
    data = request.get_json()
    shop_id = _shop_id()

    if _is_admin():
        shop_id = data.get("shop_id") or shop_id

    name    = data.get("name", "").strip()
    company = data.get("company", "").strip()
    mobile  = data.get("mobile", "").strip()
    address = data.get("address", "").strip()

    if not name:
        return jsonify({"error": "Supplier name is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO suppliers (name, company, mobile, address, shop_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, company, mobile, address, shop_id))
        conn.commit()
        return jsonify({"message": "Supplier added", "id": cursor.lastrowid}), 201

    finally:
        cursor.close()
        conn.close()


# ===============================
# PUT /suppliers/<id> — update supplier
# ===============================
@supplier_bp.route("/suppliers/<int:supplier_id>", methods=["PUT"])
@token_required
def update_supplier(supplier_id):
    data = request.get_json()

    name    = data.get("name", "").strip()
    company = data.get("company", "").strip()
    mobile  = data.get("mobile", "").strip()
    address = data.get("address", "").strip()

    if not name:
        return jsonify({"error": "Supplier name is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE suppliers
            SET name = %s, company = %s, mobile = %s, address = %s
            WHERE id = %s
        """, (name, company, mobile, address, supplier_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Supplier not found"}), 404

        return jsonify({"message": "Supplier updated"})

    finally:
        cursor.close()
        conn.close()


# ===============================
# GET /suppliers/<id>/check
# ===============================
@supplier_bp.route("/suppliers/<int:supplier_id>/check", methods=["GET"])
@token_required
def check_supplier_links(supplier_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS cnt FROM purchases WHERE supplier_id = %s", (supplier_id,))
        purchases_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) AS cnt FROM supplier_bills WHERE supplier_id = %s", (supplier_id,))
        bills_count = cursor.fetchone()["cnt"]

        return jsonify({
            "purchases": purchases_count,
            "bills": bills_count,
            "has_links": purchases_count > 0 or bills_count > 0
        })
    finally:
        cursor.close()
        conn.close()


# ===============================
# DELETE /suppliers/<id>?force=true
# ===============================
@supplier_bp.route("/suppliers/<int:supplier_id>", methods=["DELETE"])
@token_required
def delete_supplier(supplier_id):
    force = request.args.get("force", "false").lower() == "true"

    conn = get_connection()
    cursor = conn.cursor()

    try:
        if force:
            cursor.execute("DELETE FROM supplier_bills WHERE supplier_id = %s", (supplier_id,))
            cursor.execute("SELECT id FROM purchases WHERE supplier_id = %s", (supplier_id,))
            purchase_ids = [row[0] for row in cursor.fetchall()]
            if purchase_ids:
                placeholders = ",".join(["%s"] * len(purchase_ids))
                cursor.execute(f"DELETE FROM purchase_items WHERE purchase_id IN ({placeholders})", purchase_ids)
            cursor.execute("DELETE FROM purchases WHERE supplier_id = %s", (supplier_id,))
            cursor.execute("DELETE FROM suppliers WHERE id = %s", (supplier_id,))
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"error": "Supplier not found"}), 404

            return jsonify({"message": "Supplier and all linked data deleted"})

        else:
            cursor.execute("SELECT COUNT(*) FROM purchases WHERE supplier_id = %s", (supplier_id,))
            if cursor.fetchone()[0] > 0:
                return jsonify({"message": "Cannot delete: supplier has linked purchases", "has_links": True}), 400

            cursor.execute("SELECT COUNT(*) FROM supplier_bills WHERE supplier_id = %s", (supplier_id,))
            if cursor.fetchone()[0] > 0:
                return jsonify({"message": "Cannot delete: supplier has linked bills", "has_links": True}), 400

            cursor.execute("DELETE FROM suppliers WHERE id = %s", (supplier_id,))
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"error": "Supplier not found"}), 404

            return jsonify({"message": "Supplier deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()