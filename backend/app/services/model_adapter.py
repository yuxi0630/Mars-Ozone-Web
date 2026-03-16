from app.services.real_model_loader import get_loader


class MarsOzoneModelAdapter:
    MODEL_VERSION = "predrnn-real-v1"

    @staticmethod
    def _normalize_martian_year(year_value):
        year_str = str(year_value).strip().upper()
        if year_str in ["27", "MY27"]:
            return "MY27"
        if year_str in ["28", "MY28"]:
            return "MY28"
        raise ValueError("目前真实模型仅支持 MY27 和 MY28")

    @staticmethod
    def predict_point(payload: dict) -> dict:
        loader = get_loader()

        lat = float(payload.get("lat"))
        lon = float(payload.get("lon"))
        martian_year = MarsOzoneModelAdapter._normalize_martian_year(payload.get("martian_year"))
        sol = int(payload.get("sol"))

        ls = loader.get_ls_from_year_sol(martian_year, sol)
        value = float(loader.real_predict(lat, lon, ls))

        lower = max(0.0, value * 0.95)
        upper = value * 1.05

        if value < 0.4:
            risk_level = "high"
        elif value < 0.8:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "prediction": round(value, 4),
            "unit": "um-atm",
            "confidenceInterval": [round(lower, 4), round(upper, 4)],
            "riskLevel": risk_level,
            "modelVersion": MarsOzoneModelAdapter.MODEL_VERSION,
            "martianYear": martian_year,
            "sol": sol,
            "ls": round(float(ls), 4)
        }

    @staticmethod
    def predict_24h(payload: dict) -> dict:
        loader = get_loader()

        lat = float(payload.get("lat"))
        lon = float(payload.get("lon"))
        martian_year = MarsOzoneModelAdapter._normalize_martian_year(payload.get("martian_year"))
        sol = int(payload.get("sol"))

        day_series = loader.predict_day_series(lat, lon, martian_year, sol, num_points=8)

        series = []
        values = day_series.get("values", [])
        labels = day_series.get("labels", [])

        for i, value in enumerate(values):
            value = float(value)
            series.append({
                "hourOffset": i * 3,
                "label": labels[i] if i < len(labels) else f"{i * 3:02d}:00",
                "prediction": round(value, 4),
                "lowerBound": round(max(0.0, value * 0.95), 4),
                "upperBound": round(value * 1.05, 4)
            })

        return {
            "series": series,
            "unit": day_series.get("unit", "um-atm"),
            "modelVersion": MarsOzoneModelAdapter.MODEL_VERSION,
            "martianYear": martian_year,
            "sol": sol
        }

    @staticmethod
    def predict_grid(payload: dict) -> dict:
        loader = get_loader()

        martian_year = MarsOzoneModelAdapter._normalize_martian_year(payload.get("martian_year"))
        sol = int(payload.get("sol"))

        ls = loader.get_ls_from_year_sol(martian_year, sol)
        grid = loader.predict_grid(ls)

        return {
            "grid": grid["values"],
            "lats": grid["lats"],
            "lons": grid["lons"],
            "unit": grid.get("unit", "um-atm"),
            "modelVersion": MarsOzoneModelAdapter.MODEL_VERSION,
            "martianYear": martian_year,
            "sol": sol,
            "ls": round(float(ls), 4)
        }