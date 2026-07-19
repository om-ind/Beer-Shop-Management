from functools import wraps
from flask import request, jsonify, g
from utils.jwt_helper import verify_token


def token_required(f):
    """Decorator: validates JWT and sets g.user for the request."""

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token missing"}), 401

        try:
            token = auth_header.split(" ")[1]
        except Exception:
            return jsonify({"error": "Invalid Authorization header"}), 401

        payload = verify_token(token)

        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Reject old-format tokens (pre-migration, no shop_id for non-Admins)
        role = payload.get("role")
        shop_id = payload.get("shop_id")
        if role and role != "Admin" and shop_id is None:
            return jsonify({"error": "Session expired after system upgrade. Please log in again."}), 401

        g.user = payload

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator: only allows users with role 'Admin'."""

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token missing"}), 401

        try:
            token = auth_header.split(" ")[1]
        except Exception:
            return jsonify({"error": "Invalid Authorization header"}), 401

        payload = verify_token(token)

        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        if payload.get("role") != "Admin":
            return jsonify({"error": "Admin access required"}), 403

        g.user = payload

        return f(*args, **kwargs)

    return decorated