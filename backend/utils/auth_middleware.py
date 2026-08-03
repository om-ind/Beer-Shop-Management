from functools import wraps
from flask import request, jsonify, g
from utils.jwt_helper import verify_token


from database import get_connection


def _get_payload():
    """Extract and verify JWT from Authorization header. Returns payload or None."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, (jsonify({"success": False, "message": "Token is missing"}), 401)
    try:
        token = auth_header.split(" ")[1]
    except Exception:
        return None, (jsonify({"success": False, "message": "Invalid Authorization header"}), 401)
    payload = verify_token(token)
    if payload is None:
        return None, (jsonify({"success": False, "message": "Invalid or expired token"}), 401)
    return payload, None


def token_required(f):
    """Decorator: validates JWT and sets g.user for the request."""

    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = _get_payload()
        if err:
            return err

        # Detect old-format token (pre-migration): non-Admin with no shop_id
        # Force re-login so a fresh token is issued
        if payload.get("role") and payload.get("role") != "Admin" and payload.get("shop_id") is None:
            return jsonify({
                "success": False,
                "message": "Session expired after system upgrade. Please log in again."
            }), 401

        # Check account and shop active status for non-Admin users
        if payload.get("role") != "Admin":
            user_id = payload.get("id")
            if user_id:
                try:
                    conn = get_connection()
                    cursor = conn.cursor(dictionary=True)
                    cursor.execute(
                        """
                        SELECT u.is_active AS user_active, s.is_active AS shop_active
                        FROM users u
                        LEFT JOIN shops s ON u.shop_id = s.id
                        WHERE u.id = %s
                        """,
                        (user_id,)
                    )
                    st = cursor.fetchone()
                    cursor.close()
                    conn.close()

                    if not st or st.get("user_active") == 0:
                        return jsonify({
                            "success": False,
                            "message": "Account is deactivated. Access denied."
                        }), 403

                    if payload.get("shop_id") is not None and st.get("shop_active") == 0:
                        return jsonify({
                            "success": False,
                            "message": "This shop has been deactivated. Access denied."
                        }), 403
                except Exception as e:
                    print("Auth middleware status check error:", e)

        g.user = payload
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator: only allows users with role 'Admin'."""

    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = _get_payload()
        if err:
            return err

        if payload.get("role") != "Admin":
            return jsonify({"success": False, "message": "Admin access required"}), 403

        g.user = payload
        return f(*args, **kwargs)

    return decorated