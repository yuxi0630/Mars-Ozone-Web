import os
from data_loader import MarsDataLoader

_loader_instance = None


def get_loader():
    global _loader_instance
    if _loader_instance is not None:
        return _loader_instance

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    model_assets_dir = os.path.join(base_dir, "model_assets")

    mcd_files = [
        os.path.join(model_assets_dir, "Dataset", "MCDALL", "MCD_MY27_Lat-90-90_real.nc"),
        os.path.join(model_assets_dir, "Dataset", "MCDALL", "MCD_MY28_Lat-90-90_real.nc"),
    ]

    _loader_instance = MarsDataLoader(
        mcd_paths=mcd_files,
        scaler_dir=model_assets_dir,
        model_path=os.path.join(model_assets_dir, "predrnn_highlat_gpu.pth"),
        ozone_history_path=None,
        ozone_history_ls_path=None,
        device="cpu",
    )
    return _loader_instance