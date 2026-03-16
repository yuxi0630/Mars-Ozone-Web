from flask import Blueprint, request, g

from app.services.dataset_service import DatasetService
from app.utils.response import success, fail
from app.utils.auth import login_required

datasets_bp = Blueprint("datasets", __name__)


@datasets_bp.post("/upload")
@login_required
def upload_dataset():
    file = request.files.get("file")
    dataset_name = request.form.get("datasetName", "").strip()
    dataset_type = request.form.get("datasetType", "").strip()
    description = request.form.get("description", "").strip()
    source = request.form.get("source", "").strip()

    if not file:
        return fail("file is required")
    if not dataset_name or not dataset_type:
        return fail("datasetName and datasetType are required")

    result = DatasetService.save_dataset(
        file_storage=file,
        dataset_name=dataset_name,
        dataset_type=dataset_type,
        description=description,
        source=source,
        created_by=g.current_user.id
    )
    return success(result, "upload success")


@datasets_bp.get("/list")
def list_datasets():
    return success({"list": DatasetService.list_datasets()})