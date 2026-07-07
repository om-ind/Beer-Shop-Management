from functools import wraps
from flask import request, jsonify
from flask import g
from utils.jwt_helper import verify_token


print(g.user["username"])
print(g.user["role"])


def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:

            return jsonify({
                "success": False,
                "message": "Token is missing"
            }), 401

        try:

            token = auth_header.split(" ")[1]

        except:

            return jsonify({
                "success": False,
                "message": "Invalid Authorization header"
            }), 401

        payload = verify_token(token)

        if payload is None:

            return jsonify({
                "success": False,
                "message": "Invalid or expired token"
            }), 401

        return f(*args, **kwargs)

    return decorated