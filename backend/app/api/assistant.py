from flask import Blueprint, request

from app.services.assistant_service import AssistantService
from app.utils.response import success, fail

assistant_bp = Blueprint("assistant", __name__)


@assistant_bp.post("/chat")
def chat():
    data = request.get_json() or {}
    question = (data.get("question") or "").strip()

    if not question:
        return fail("question is required")

    result = AssistantService.chat(question)
    return success(result)