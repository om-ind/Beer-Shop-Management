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
        SELECT * FROM users
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
            "full_name": user["full_name"]
        }
    })