from functools import wraps
from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app, request, g

from app.models.user import User
from app.utils.response import fail


def generate_token(user_id: int):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")
    return token


def parse_token(token: str):
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return fail("Unauthorized", http_status=401)

        token = auth_header.replace("Bearer ", "", 1).strip()
        try:
            payload = parse_token(token)
            user = User.query.get(payload["user_id"])
            if not user:
                return fail("User not found", http_status=401)
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return fail("Token expired", http_status=401)
        except Exception:
            return fail("Invalid token", http_status=401)

        return func(*args, **kwargs)
    return wrapper