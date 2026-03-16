from datetime import datetime

from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    task_type = db.Column(db.String(30), nullable=False)
    biz_id = db.Column(db.BigInteger, nullable=True)
    status = db.Column(db.String(20), default="pending")
    progress = db.Column(db.Integer, default=0)
    payload = db.Column(db.JSON, nullable=True)
    result_summary = db.Column(db.JSON, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.BigInteger, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "taskType": self.task_type,
            "bizId": self.biz_id,
            "status": self.status,
            "progress": self.progress,
            "payload": self.payload,
            "resultSummary": self.result_summary,
            "errorMessage": self.error_message,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }