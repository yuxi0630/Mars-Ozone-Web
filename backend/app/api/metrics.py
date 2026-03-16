from flask import Blueprint

from app.services.metrics_service import MetricsService
from app.utils.response import success

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.get("/model")
def model_metrics():
    return success(MetricsService.get_model_metrics())


@metrics_bp.get("/scatter")
def scatter():
    return success(MetricsService.get_scatter_data())


@metrics_bp.get("/residual")
def residual():
    return success(MetricsService.get_residual_data())