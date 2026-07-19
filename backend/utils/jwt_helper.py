import jwt
from datetime import datetime, timedelta
from config import SECRET_KEY, JWT_EXPIRATION_HOURS
from jwt import ExpiredSignatureError, InvalidTokenError


def generate_token(user):
    payload = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "shop_id": user.get("shop_id"),          # None for Admin
        "full_name": user.get("full_name", ""),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except (ExpiredSignatureError, InvalidTokenError):
        return None