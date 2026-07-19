from flask import Blueprint, request, jsonify, g
import bcrypt
from database import get_connection
from utils.auth_middleware import token_required, admin_required

users_bp = Blueprint("users", __name__)


# ===============================
# GET All Users (scoped by shop)
# ===============================
@users_bp.route("/users", methods=["GET"])
@token_required
def get_users():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        role = g.user.get("role")
        shop_id = g.user.get("shop_id")

        if role == "Admin":
            # Admin can optionally filter by shop_id
            filter_shop = request.args.get("shop_id", type=int)
            if filter_shop:
                cursor.execute("""
                    SELECT id, full_name, username, role, shop_id, is_active, created_at
                    FROM users
                    WHERE shop_id = %s AND role != 'Admin'
                    ORDER BY id DESC
                """, (filter_shop,))
            else:
                cursor.execute("""
                    SELECT id, full_name, username, role, shop_id, is_active, created_at
                    FROM users
                    WHERE role != 'Admin'
                    ORDER BY id DESC
                """)
        else:
            # Owner/Manager/Cashier: only their shop
            cursor.execute("""
                SELECT id, full_name, username, role, shop_id, is_active, created_at
                FROM users
                WHERE shop_id = %s AND role != 'Admin'
                ORDER BY id DESC
            """, (shop_id,))

        users = cursor.fetchall()

        for u in users:
            if u.get("created_at"):
                u["created_at"] = str(u["created_at"])

        return jsonify(users)

    finally:
        cursor.close()
        conn.close()


# ===============================
# CREATE User
# ===============================
@users_bp.route("/users", methods=["POST"])
@token_required
def create_user():
    data = request.get_json()

    full_name = data.get("full_name", "").strip()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "Cashier")

    if not full_name or not username or not password:
        return jsonify({
            "success": False,
            "message": "Full name, username, and password are required"
        }), 400

    if role not in ("Owner", "Manager", "Cashier"):
        return jsonify({
            "success": False,
            "message": "Invalid role. Must be Owner, Manager, or Cashier"
        }), 400

    # Determine which shop this user belongs to
    caller_role = g.user.get("role")
    caller_shop_id = g.user.get("shop_id")

    if caller_role == "Admin":
        # Admin must supply shop_id
        target_shop_id = data.get("shop_id")
        if not target_shop_id:
            return jsonify({"success": False, "message": "shop_id is required when Admin creates a user"}), 400
    else:
        # Owner creates users for their own shop
        target_shop_id = caller_shop_id

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO users (full_name, username, password, role, shop_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (full_name, username, hashed, role, target_shop_id)
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "User created successfully",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:
        conn.rollback()

        if "Duplicate entry" in str(e):
            return jsonify({
                "success": False,
                "message": f"Username '{username}' already exists"
            }), 409

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# UPDATE User (role / active status)
# ===============================
@users_bp.route("/users/<int:user_id>", methods=["PUT"])
@token_required
def update_user(user_id):
    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify the target user belongs to caller's shop (unless Admin)
        cursor.execute("SELECT id, shop_id FROM users WHERE id = %s", (user_id,))
        target = cursor.fetchone()

        if not target:
            return jsonify({"success": False, "message": "User not found"}), 404

        caller_role = g.user.get("role")
        caller_shop_id = g.user.get("shop_id")

        if caller_role != "Admin" and target["shop_id"] != caller_shop_id:
            return jsonify({"success": False, "message": "Forbidden"}), 403

        fields = []
        values = []

        if "role" in data:
            if data["role"] not in ("Owner", "Manager", "Cashier"):
                return jsonify({"success": False, "message": "Invalid role"}), 400
            fields.append("role = %s")
            values.append(data["role"])

        if "is_active" in data:
            fields.append("is_active = %s")
            values.append(1 if data["is_active"] else 0)

        if "full_name" in data:
            fields.append("full_name = %s")
            values.append(data["full_name"])

        if not fields:
            return jsonify({"success": False, "message": "No fields to update"}), 400

        values.append(user_id)

        cursor.execute(
            f"UPDATE users SET {', '.join(fields)} WHERE id = %s",
            values
        )

        conn.commit()

        return jsonify({"success": True, "message": "User updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# DELETE User
# ===============================
@users_bp.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
def delete_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, shop_id, role FROM users WHERE id = %s", (user_id,))
        target = cursor.fetchone()

        if not target:
            return jsonify({"success": False, "message": "User not found"}), 404

        caller_role = g.user.get("role")
        caller_shop_id = g.user.get("shop_id")

        if caller_role != "Admin" and target["shop_id"] != caller_shop_id:
            return jsonify({"success": False, "message": "Forbidden"}), 403

        if target["role"] == "Admin":
            return jsonify({"success": False, "message": "Cannot delete the Admin account"}), 403

        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()

        return jsonify({"success": True, "message": "User deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# RESET Password
# ===============================
@users_bp.route("/users/<int:user_id>/reset-password", methods=["PUT"])
@token_required
def reset_password(user_id):
    data = request.get_json()
    new_password = data.get("new_password", "")

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, shop_id FROM users WHERE id = %s", (user_id,))
        target = cursor.fetchone()

        if not target:
            return jsonify({"success": False, "message": "User not found"}), 404

        caller_role = g.user.get("role")
        caller_shop_id = g.user.get("shop_id")

        if caller_role != "Admin" and target["shop_id"] != caller_shop_id:
            return jsonify({"success": False, "message": "Forbidden"}), 403

        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed, user_id))
        conn.commit()

        return jsonify({"success": True, "message": "Password reset successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
