from datetime import datetime

from app.extensions import db


class PredictionRecord(db.Model):
    __tablename__ = "prediction_records"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, nullable=True)
    predict_type = db.Column(db.String(20), nullable=False)  # point/grid/24h
    martian_year = db.Column(db.Integer, nullable=False)
    sol = db.Column(db.Integer, nullable=False)
    lat = db.Column(db.Float, nullable=True)
    lon = db.Column(db.Float, nullable=True)
    input_payload = db.Column(db.JSON, nullable=True)
    prediction_value = db.Column(db.Float, nullable=True)
    confidence_lower = db.Column(db.Float, nullable=True)
    confidence_upper = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(20), nullable=True)
    model_version = db.Column(db.String(50), default="baseline-v1")
    result_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "predictType": self.predict_type,
            "martianYear": self.martian_year,
            "sol": self.sol,
            "lat": self.lat,
            "lon": self.lon,
            "inputPayload": self.input_payload,
            "predictionValue": self.prediction_value,
            "confidenceLower": self.confidence_lower,
            "confidenceUpper": self.confidence_upper,
            "riskLevel": self.risk_level,
            "modelVersion": self.model_version,
            "resultJson": self.result_json,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }