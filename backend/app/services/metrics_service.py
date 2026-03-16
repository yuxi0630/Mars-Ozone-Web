class MetricsService:

    @staticmethod
    def get_model_metrics():
        return {
            "modelName": "PredRNN-Demo",
            "version": "v1.0.0",
            "r2": 0.9123,
            "mse": 0.0124,
            "mae": 0.0641,
            "rmse": 0.1114
        }

    @staticmethod
    def get_scatter_data():
        points = []
        for i in range(1, 21):
            real_val = round(0.2 + i * 0.05, 4)
            pred_val = round(real_val * 0.96 + 0.02, 4)
            points.append({
                "real": real_val,
                "pred": pred_val
            })
        return {"points": points}

    @staticmethod
    def get_residual_data():
        residuals = [0.01, -0.02, 0.03, 0.00, -0.01, 0.02, -0.03, 0.01, -0.01, 0.02]
        return {"residuals": residuals}