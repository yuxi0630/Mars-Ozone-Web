from flask import Blueprint, request, g

from app.extensions import db
from app.models.user import User
from app.utils.response import success, fail
from app.utils.auth import generate_token, login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not email or not password:
        return fail("username, email and password are required")

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return fail("username or email already exists")

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return success(user.to_dict(), "register success")


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return fail("username and password are required")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return fail("invalid username or password", http_status=401)

    token = generate_token(user.id)
    return success({
        "token": token,
        "user": user.to_dict()
    }, "login success")


@auth_bp.get("/profile")
@login_required
def profile():
    return success(g.current_user.to_dict())