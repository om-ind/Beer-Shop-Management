from flask import Blueprint, request, jsonify
import bcrypt

from database import get_connection
from utils.jwt_helper import generate_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and Password are required"
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT id, username, password, role, full_name, shop_id, is_active
        FROM users
        WHERE username=%s
        """,
        (username,)
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user is None:
        return jsonify({
            "success": False,
            "message": "Invalid Username"
        }), 401

    if user.get("is_active") == 0:
        return jsonify({
            "success": False,
            "message": "Account is deactivated. Please contact Admin."
        }), 403

    if not bcrypt.checkpw(
        password.encode(),
        user["password"].encode()
    ):
        return jsonify({
            "success": False,
            "message": "Invalid Password"
        }), 401

    token = generate_token(user)

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name", ""),
            "shop_id": user.get("shop_id")     # None for Admin
        }
    })


@auth_bp.route("/auth/change-password", methods=["PUT"])
def change_password():

    data = request.get_json()

    username = data.get("username")
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not username or not current_password or not new_password:
        return jsonify({
            "success": False,
            "message": "All fields are required"
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "success": False,
            "message": "New password must be at least 6 characters"
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE username = %s",
        (username,)
    )

    user = cursor.fetchone()

    if user is None:
        cursor.close()
        conn.close()
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if not bcrypt.checkpw(current_password.encode(), user["password"].encode()):
        cursor.close()
        conn.close()
        return jsonify({
            "success": False,
            "message": "Current password is incorrect"
        }), 401

    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    cursor.execute(
        "UPDATE users SET password = %s WHERE username = %s",
        (hashed, username)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Password changed successfully"
    })