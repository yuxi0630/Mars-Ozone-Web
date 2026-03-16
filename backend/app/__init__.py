from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db
from app.api.auth import auth_bp
from app.api.predict import predict_bp
from app.api.metrics import metrics_bp
from app.api.datasets import datasets_bp
from app.api.assistant import assistant_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api/predict")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(datasets_bp, url_prefix="/api/datasets")
    app.register_blueprint(assistant_bp, url_prefix="/api/assistant")

    with app.app_context():
        db.create_all()

    @app.route("/api/health", methods=["GET"])
    def health():
        return {
            "code": 0,
            "message": "success",
            "data": {
                "status": "ok"
            }
        }

    return app