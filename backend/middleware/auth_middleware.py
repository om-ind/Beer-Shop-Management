from functools import wraps
from flask import request, jsonify
from utils.jwt_helper import verify_token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token missing"}), 401

        token = token.replace("Bearer ", "")

        user = verify_token(token)

        if not user:
            return jsonify({"error": "Invalid Token"}), 401

        return f(user, *args, **kwargs)

    return decorated