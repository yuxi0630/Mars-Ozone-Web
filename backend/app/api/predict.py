from flask import Blueprint, request, g

from app.services.prediction_service import PredictionService
from app.utils.response import success, fail
from app.utils.auth import login_required

predict_bp = Blueprint("predict", __name__)


def _validate_point_payload(data: dict):
    required_fields = ["lat", "lon", "martian_year", "sol"]
    for field in required_fields:
        if field not in data:
            return f"{field} is required"
    return None


@predict_bp.post("/point")
def predict_point():
    data = request.get_json() or {}
    error = _validate_point_payload(data)
    if error:
        return fail(error)

    result = PredictionService.predict_point(data)
    return success(result)


@predict_bp.post("/24h")
def predict_24h():
    data = request.get_json() or {}
    error = _validate_point_payload(data)
    if error:
        return fail(error)

    result = PredictionService.predict_24h(data)
    return success(result)


@predict_bp.post("/grid")
def predict_grid():
    data = request.get_json() or {}

    required_fields = ["martian_year", "sol"]
    for field in required_fields:
        if field not in data:
            return fail(f"{field} is required")

    result = PredictionService.predict_grid(data)
    return success(result)


@predict_bp.get("/history")
@login_required
def history():
    result = PredictionService.get_history(user_id=g.current_user.id)
    return success({"list": result})