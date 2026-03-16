from app.extensions import db
from app.models.prediction_record import PredictionRecord
from app.services.model_adapter import MarsOzoneModelAdapter


class PredictionService:

    @staticmethod
    def _db_martian_year(year_value):
        year_str = str(year_value).strip().upper()
        if year_str == "MY27":
            return 27
        if year_str == "MY28":
            return 28
        if year_str == "27":
            return 27
        if year_str == "28":
            return 28
        raise ValueError("目前仅支持 MY27 / MY28")

    @staticmethod
    def predict_point(payload: dict, user_id=None):
        result = MarsOzoneModelAdapter.predict_point(payload)

        db_year = PredictionService._db_martian_year(payload.get("martian_year"))

        record = PredictionRecord(
            user_id=user_id,
            predict_type="point",
            martian_year=db_year,
            sol=int(payload.get("sol")),
            lat=float(payload.get("lat")),
            lon=float(payload.get("lon")),
            input_payload=payload,
            prediction_value=result["prediction"],
            confidence_lower=result["confidenceInterval"][0],
            confidence_upper=result["confidenceInterval"][1],
            risk_level=result["riskLevel"],
            model_version=result["modelVersion"],
            result_json=result
        )
        db.session.add(record)
        db.session.commit()

        result["recordId"] = record.id
        return result

    @staticmethod
    def predict_24h(payload: dict, user_id=None):
        result = MarsOzoneModelAdapter.predict_24h(payload)

        db_year = PredictionService._db_martian_year(payload.get("martian_year"))

        record = PredictionRecord(
            user_id=user_id,
            predict_type="24h",
            martian_year=db_year,
            sol=int(payload.get("sol")),
            lat=float(payload.get("lat")),
            lon=float(payload.get("lon")),
            input_payload=payload,
            model_version=result["modelVersion"],
            result_json=result
        )
        db.session.add(record)
        db.session.commit()

        result["recordId"] = record.id
        return result

    @staticmethod
    def predict_grid(payload: dict, user_id=None):
        result = MarsOzoneModelAdapter.predict_grid(payload)

        db_year = PredictionService._db_martian_year(payload.get("martian_year"))

        record = PredictionRecord(
            user_id=user_id,
            predict_type="grid",
            martian_year=db_year,
            sol=int(payload.get("sol")),
            input_payload=payload,
            model_version=result["modelVersion"],
            result_json=result
        )
        db.session.add(record)
        db.session.commit()

        result["recordId"] = record.id
        return result

    @staticmethod
    def get_history(user_id=None):
        query = PredictionRecord.query.order_by(PredictionRecord.id.desc())
        if user_id:
            query = query.filter_by(user_id=user_id)
        return [item.to_dict() for item in query.limit(50).all()]