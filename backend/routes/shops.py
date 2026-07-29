from flask import Blueprint, request, jsonify, g
import bcrypt
from database import get_connection
from utils.auth_middleware import admin_required, token_required

shops_bp = Blueprint("shops", __name__)


# ===============================
# GET all shops  (Admin only)
# ===============================
@shops_bp.route("/shops", methods=["GET"])
@admin_required
def get_shops():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                s.id,
                s.name,
                s.address,
                s.phone,
                s.owner_name,
                s.is_active,
                s.created_at,
                COUNT(DISTINCT u.id) AS user_count
            FROM shops s
            LEFT JOIN users u ON u.shop_id = s.id
            GROUP BY s.id
            ORDER BY s.id ASC
        """)
        shops = cursor.fetchall()

        for shop in shops:
            if shop.get("created_at"):
                shop["created_at"] = str(shop["created_at"])

        return jsonify(shops)

    finally:
        cursor.close()
        conn.close()


# ===============================
# GET a single shop's stats  (Admin only)
# ===============================
@shops_bp.route("/shops/<int:shop_id>/stats", methods=["GET"])
@admin_required
def get_shop_stats(shop_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify shop exists
        cursor.execute("SELECT * FROM shops WHERE id = %s", (shop_id,))
        shop = cursor.fetchone()
        if not shop:
            return jsonify({"error": "Shop not found"}), 404

        stats = {"shop": shop}

        cursor.execute("SELECT COUNT(*) AS v FROM products WHERE shop_id=%s", (shop_id,))
        stats["total_products"] = cursor.fetchone()["v"]

        cursor.execute("SELECT COUNT(*) AS v FROM customers WHERE shop_id=%s", (shop_id,))
        stats["total_customers"] = cursor.fetchone()["v"]

        cursor.execute("SELECT IFNULL(SUM(total_amount),0) AS v FROM sales WHERE shop_id=%s", (shop_id,))
        stats["total_revenue"] = float(cursor.fetchone()["v"])

        cursor.execute("""
            SELECT IFNULL(SUM(si.profit),0) AS v
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE s.shop_id = %s
        """, (shop_id,))
        stats["total_profit"] = float(cursor.fetchone()["v"])

        cursor.execute("SELECT COUNT(*) AS v FROM sales WHERE shop_id=%s", (shop_id,))
        stats["total_sales"] = cursor.fetchone()["v"]

        cursor.execute("""
            SELECT id, full_name, username, role, is_active
            FROM users WHERE shop_id = %s ORDER BY id
        """, (shop_id,))
        stats["users"] = cursor.fetchall()

        return jsonify(stats)

    finally:
        cursor.close()
        conn.close()


# ===============================
# GET admin overview (all shops)
# ===============================
@shops_bp.route("/admin/overview", methods=["GET"])
@admin_required
def admin_overview():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT COUNT(*) AS v FROM shops WHERE is_active=1")
        total_shops = cursor.fetchone()["v"]

        cursor.execute("SELECT COUNT(*) AS v FROM users WHERE role != 'Admin'")
        total_users = cursor.fetchone()["v"]

        cursor.execute("SELECT IFNULL(SUM(total_amount),0) AS v FROM sales")
        total_revenue = float(cursor.fetchone()["v"])

        cursor.execute("SELECT IFNULL(SUM(si.profit),0) AS v FROM sale_items si")
        total_profit = float(cursor.fetchone()["v"])

        cursor.execute("SELECT COUNT(*) AS v FROM sales")
        total_sales = cursor.fetchone()["v"]

        # Per-shop revenue breakdown
        cursor.execute("""
            SELECT
                sh.id,
                sh.name,
                sh.is_active,
                IFNULL(SUM(sa.total_amount),0) AS revenue,
                COUNT(DISTINCT sa.id) AS sales_count
            FROM shops sh
            LEFT JOIN sales sa ON sa.shop_id = sh.id
            GROUP BY sh.id
            ORDER BY revenue DESC
        """)
        shop_breakdown = cursor.fetchall()
        for row in shop_breakdown:
            row["revenue"] = float(row["revenue"])

        return jsonify({
            "total_shops": total_shops,
            "total_users": total_users,
            "total_revenue": total_revenue,
            "total_profit": total_profit,
            "total_sales": total_sales,
            "shop_breakdown": shop_breakdown
        })

    finally:
        cursor.close()
        conn.close()


# ===============================
# POST — Create shop + Owner user  (Admin only)
# ===============================
@shops_bp.route("/shops", methods=["POST"])
@admin_required
def create_shop():
    data = request.get_json()

    shop_name   = (data.get("name") or "").strip()
    address     = (data.get("address") or "").strip()
    phone       = (data.get("phone") or "").strip()
    owner_name  = (data.get("owner_name") or "").strip()

    # Owner user credentials
    owner_username = (data.get("owner_username") or "").strip()
    owner_password = (data.get("owner_password") or "").strip()
    owner_full_name = owner_name

    if not shop_name:
        return jsonify({"success": False, "message": "Shop name is required"}), 400
    if not owner_username or not owner_password:
        return jsonify({"success": False, "message": "Owner username and password are required"}), 400
    if len(owner_password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Create shop
        cursor.execute("""
            INSERT INTO shops (name, address, phone, owner_name)
            VALUES (%s, %s, %s, %s)
        """, (shop_name, address, phone, owner_name))
        shop_id = cursor.lastrowid

        # Create owner user
        hashed = bcrypt.hashpw(owner_password.encode(), bcrypt.gensalt()).decode()
        cursor.execute("""
            INSERT INTO users (full_name, username, password, role, shop_id)
            VALUES (%s, %s, %s, 'Owner', %s)
        """, (owner_full_name, owner_username, hashed, shop_id))

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Shop '{shop_name}' created with Owner user '{owner_username}'",
            "shop_id": shop_id
        }), 201

    except Exception as e:
        conn.rollback()
        if "Duplicate entry" in str(e):
            return jsonify({"success": False, "message": f"Username '{owner_username}' already exists"}), 409
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# PUT — Edit shop  (Admin only)
# ===============================
@shops_bp.route("/shops/<int:shop_id>", methods=["PUT"])
@admin_required
def update_shop(shop_id):
    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    try:
        fields = []
        values = []

        for col in ("name", "address", "phone", "owner_name"):
            if col in data:
                fields.append(f"{col} = %s")
                values.append(data[col])

        if "is_active" in data:
            fields.append("is_active = %s")
            values.append(1 if data["is_active"] else 0)

        if not fields:
            return jsonify({"success": False, "message": "No fields to update"}), 400

        values.append(shop_id)
        cursor.execute(f"UPDATE shops SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()

        return jsonify({"success": True, "message": "Shop updated"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# DELETE — Deactivate shop  (Admin only)
# ===============================
@shops_bp.route("/shops/<int:shop_id>", methods=["DELETE"])
@admin_required
def deactivate_shop(shop_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE shops SET is_active = 0 WHERE id = %s", (shop_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Shop deactivated"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
