import os
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.dataset import Dataset, DatasetVersion


class DatasetService:

    UPLOAD_DIR = "uploads"

    @staticmethod
    def save_dataset(file_storage, dataset_name, dataset_type, description="", source="", created_by=None):
        os.makedirs(DatasetService.UPLOAD_DIR, exist_ok=True)

        filename = secure_filename(file_storage.filename)
        save_path = os.path.join(DatasetService.UPLOAD_DIR, filename)
        file_storage.save(save_path)

        dataset = Dataset(
            dataset_name=dataset_name,
            dataset_type=dataset_type,
            description=description,
            source=source,
            created_by=created_by
        )
        db.session.add(dataset)
        db.session.flush()

        version = DatasetVersion(
            dataset_id=dataset.id,
            version_code="v1.0.0",
            file_path=save_path,
            schema_json={"filename": filename},
            validation_report={"status": "pending"},
            change_log="Initial upload",
            publish_status="draft",
            created_by=created_by
        )
        db.session.add(version)
        db.session.commit()

        return {
            "dataset": dataset.to_dict(),
            "version": version.to_dict()
        }

    @staticmethod
    def list_datasets():
        datasets = Dataset.query.order_by(Dataset.id.desc()).all()
        return [d.to_dict() for d in datasets]