from flask import Blueprint, request, jsonify
import bcrypt

from database import get_connection
from utils.jwt_helper import generate_token
from utils.auth_middleware import token_required

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

    try:
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
    except Exception as e:
        print("Auth DB Error:", e)
        return jsonify({
            "success": False,
            "message": f"Database connection error: {str(e)}"
        }), 500

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

    password_db = user["password"]
    pwd_matched = False
    try:
        if password_db.startswith("$2b$") or password_db.startswith("$2a$"):
            pwd_matched = bcrypt.checkpw(password.encode(), password_db.encode())
        else:
            pwd_matched = (password == password_db)
    except Exception:
        pwd_matched = (password == password_db)

    if not pwd_matched:
        return jsonify({
            "success": False,
            "message": "Invalid Password"
        }), 401

    # Auto-upgrade plaintext passwords to bcrypt hash on successful login
    if not (password_db.startswith("$2b$") or password_db.startswith("$2a$")):
        try:
            hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode('utf-8')
            up_conn = get_connection()
            up_cursor = up_conn.cursor()
            up_cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_pwd, user["id"]))
            up_conn.commit()
            up_cursor.close()
            up_conn.close()
        except Exception as e:
            print("Notice: Could not auto-hash user password:", e)

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
@token_required
def change_password():
    from flask import g
    data = request.get_json()

    # Username comes from the verified token, not the request body
    username = g.user.get("username")
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
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