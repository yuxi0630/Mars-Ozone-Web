from datetime import datetime

from app.extensions import db


class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dataset_name = db.Column(db.String(100), nullable=False)
    dataset_type = db.Column(db.String(50), nullable=False)  # OpenMars / MCD / custom
    description = db.Column(db.Text, nullable=True)
    source = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default="draft")
    created_by = db.Column(db.BigInteger, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "datasetName": self.dataset_name,
            "datasetType": self.dataset_type,
            "description": self.description,
            "source": self.source,
            "status": self.status,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class DatasetVersion(db.Model):
    __tablename__ = "dataset_versions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dataset_id = db.Column(db.BigInteger, nullable=False)
    version_code = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)
    schema_json = db.Column(db.JSON, nullable=True)
    validation_report = db.Column(db.JSON, nullable=True)
    change_log = db.Column(db.Text, nullable=True)
    publish_status = db.Column(db.String(20), default="draft")
    created_by = db.Column(db.BigInteger, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "datasetId": self.dataset_id,
            "versionCode": self.version_code,
            "filePath": self.file_path,
            "schemaJson": self.schema_json,
            "validationReport": self.validation_report,
            "changeLog": self.change_log,
            "publishStatus": self.publish_status,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }