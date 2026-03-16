import os
import joblib
import numpy as np
import torch
import torch.nn as nn
import xarray as xr


class SpatioTemporalLSTMCellv2(nn.Module):
    def __init__(self, in_channel, num_hidden, height, width, filter_size):
        super().__init__()
        padding = filter_size // 2
        self.conv_x = nn.Conv2d(in_channel, num_hidden * 7, filter_size, padding=padding)
        self.conv_h = nn.Conv2d(num_hidden, num_hidden * 4, filter_size, padding=padding)
        self.conv_m = nn.Conv2d(num_hidden, num_hidden * 3, filter_size, padding=padding)
        self.conv_o = nn.Conv2d(num_hidden * 2, num_hidden, filter_size, padding=padding)
        self.conv_last = nn.Conv2d(num_hidden * 2, num_hidden, 1)
        self.num_hidden = num_hidden

    def forward(self, x, h, c, m):
        x_concat = self.conv_x(x)
        h_concat = self.conv_h(h)
        m_concat = self.conv_m(m)
        i_x, f_x, g_x, i_xp, f_xp, g_xp, o_x = torch.split(x_concat, self.num_hidden, 1)
        i_h, f_h, g_h, o_h = torch.split(h_concat, self.num_hidden, 1)
        i_m, f_m, g_m = torch.split(m_concat, self.num_hidden, 1)

        i_t = torch.sigmoid(i_x + i_h)
        f_t = torch.sigmoid(f_x + f_h + 1.0)
        g_t = torch.tanh(g_x + g_h)
        c_new = f_t * c + i_t * g_t

        i_tp = torch.sigmoid(i_xp + i_m)
        f_tp = torch.sigmoid(f_xp + f_m + 1.0)
        g_tp = torch.tanh(g_xp + g_m)
        m_new = f_tp * m + i_tp * g_tp

        mem = torch.cat([c_new, m_new], dim=1)
        o_t = torch.sigmoid(o_x + o_h + self.conv_o(mem))
        h_new = o_t * torch.tanh(self.conv_last(mem))
        return h_new, c_new, m_new


class PredRNNv2(nn.Module):
    def __init__(self, input_dim=7, hidden_dims=None, height=36, width=72, horizon=3):
        super().__init__()
        if hidden_dims is None:
            hidden_dims = [64, 64, 64]
        self.layers = nn.ModuleList()
        for i in range(len(hidden_dims)):
            in_ch = input_dim if i == 0 else hidden_dims[i - 1]
            self.layers.append(SpatioTemporalLSTMCellv2(in_ch, hidden_dims[i], height, width, 3))
        self.conv_last = nn.Conv2d(hidden_dims[-1], 1, 1)
        self.horizon = horizon
        self.hidden_dims = hidden_dims

    def forward(self, x):
        bsz, seq_len, _, height, width = x.shape
        h = [torch.zeros(bsz, d, height, width, device=x.device) for d in self.hidden_dims]
        c = [torch.zeros_like(h[i]) for i in range(len(h))]
        m = torch.zeros_like(h[0])

        for t in range(seq_len):
            inp = x[:, t]
            for i, cell in enumerate(self.layers):
                h[i], c[i], m = cell(inp, h[i], c[i], m)
                inp = h[i]

        preds = []
        dec_inp = x[:, -1]
        for _ in range(self.horizon):
            inp = dec_inp
            for i, cell in enumerate(self.layers):
                h[i], c[i], m = cell(inp, h[i], c[i], m)
                inp = h[i]
            pred = self.conv_last(h[-1])
            preds.append(pred)
            # 保持与原训练脚本兼容：环境通道沿用最后一帧，只替换第0通道臭氧
            dec_inp = dec_inp.clone()
            dec_inp[:, 0:1] = pred

        return torch.stack(preds, dim=1)


class MarsDataLoader:
    """
    改进版 Web 推理加载器。

    相比旧版，主要修复：
    1. 历史臭氧通道不再全零，而是优先使用外部历史臭氧场；没有时使用 climatology 回退。
    2. MCD 时间选择改为线性插值，不再只取最近邻。
    3. 全场标准化改为向量化，显著减少 Web 请求耗时。
    4. 经度支持 0~360 / -180~180 两套坐标系自动兼容。
    5. 提供 predict_point / predict_grid 两个接口，便于后端扩展热力图。

    注意：如果没有提供真实历史臭氧场，本类会退回 climatology，能跑但精度通常不如训练分布一致的版本。
    """

    ENV_KEYS = ["u", "v", "ps", "temp", "dustq", "fluxsurf_dn_sw"]

    def __init__(
        self,
        mcd_paths,
        scaler_dir=".",
        model_path=None,
        device="cpu",
        ozone_history_path=None,
        ozone_history_ls_path=None,
        window=3,
        horizon=3,
    ):
        self.window = int(window)
        self.horizon = int(horizon)
        self.device = device
        self.model = None

        self.file_sols = []
        self.file_hours = []
        self.file_start_idx = []

        self._load_scalers(scaler_dir)
        self._load_mcd(mcd_paths)
        self._build_file_start_idx()
        self._load_optional_ozone_history(ozone_history_path, ozone_history_ls_path)

        if model_path is not None and os.path.exists(model_path):
            self._load_model(model_path)

    def _load_scalers(self, scaler_dir):
        self.scalers = [joblib.load(os.path.join(scaler_dir, f"scaler_feat_{i}.pkl")) for i in range(6)]
        self.means = [np.asarray(s.mean_, dtype=np.float32).reshape(-1) for s in self.scalers]
        self.scales = [np.asarray(s.scale_, dtype=np.float32).reshape(-1) for s in self.scalers]

        self.y_mean = float(np.squeeze(np.load(os.path.join(scaler_dir, "y_mean.npy"))))
        self.y_std = float(np.squeeze(np.load(os.path.join(scaler_dir, "y_std.npy"))))
        self.max_flux = float(np.squeeze(np.load(os.path.join(scaler_dir, "max_flux.npy"))))
        if self.max_flux == 0:
            self.max_flux = 1.0

    def _build_file_start_idx(self):
        total_hours = 0
        for sols, hours in zip(self.file_sols, self.file_hours):
            self.file_start_idx.append(total_hours)
            total_hours += sols * hours
        self.total_hours = total_hours

    def _load_mcd(self, mcd_paths):
        data_dict = {name: [] for name in self.ENV_KEYS}
        ls_list = []
        self.lat = None
        self.lon = None

        def merge_sol_hour(x):
            s_dim, h_dim, y_dim, x_dim = x.shape
            return x.reshape(s_dim * h_dim, y_dim, x_dim)

        for f_path in mcd_paths:
            if not os.path.exists(f_path):
                print(f"警告：文件不存在，跳过: {f_path}")
                continue

            print(f"正在加载 MCD 文件: {os.path.basename(f_path)}")
            ds = xr.open_dataset(f_path)
            try:
                u_shape = ds["U_Wind"].shape
                s_dim, h_dim = u_shape[0], u_shape[1]
                self.file_sols.append(int(s_dim))
                self.file_hours.append(int(h_dim))

                data_dict["u"].append(merge_sol_hour(ds["U_Wind"].values).astype(np.float32))
                data_dict["v"].append(merge_sol_hour(ds["V_Wind"].values).astype(np.float32))
                data_dict["ps"].append(merge_sol_hour(ds["Pressure"].values).astype(np.float32))
                data_dict["temp"].append(merge_sol_hour(ds["Temperature"].values).astype(np.float32))
                data_dict["dustq"].append(merge_sol_hour(ds["Dust_Optical_Depth"].values).astype(np.float32))
                data_dict["fluxsurf_dn_sw"].append(merge_sol_hour(ds["Solar_Flux_DN"].values).astype(np.float32))

                ls_tmp = np.asarray(ds["Ls"].values, dtype=np.float32)
                if ls_tmp.ndim == 1 and len(ls_tmp) == s_dim:
                    ls_expanded = np.zeros(s_dim * h_dim, dtype=np.float32)
                    for i in range(s_dim):
                        ls_start = float(ls_tmp[i])
                        if i < s_dim - 1:
                            ls_end = float(ls_tmp[i + 1])
                            if ls_end < ls_start:
                                ls_end += 360.0
                        else:
                            delta = float(ls_tmp[1] - ls_tmp[0]) if s_dim > 1 else 0.5
                            ls_end = ls_start + delta
                        ls_expanded[i * h_dim : (i + 1) * h_dim] = np.linspace(ls_start, ls_end, h_dim, endpoint=False)
                    ls_list.append(ls_expanded)
                else:
                    ls_list.append(ls_tmp.reshape(-1).astype(np.float32))

                if self.lat is None:
                    self.lat = np.asarray(ds["lat"].values, dtype=np.float32)
                    self.lon = np.asarray(ds["lon"].values, dtype=np.float32)
            finally:
                ds.close()

        if not data_dict["u"]:
            raise FileNotFoundError("没有成功加载任何 MCD 文件，请检查路径")

        self.mcd_data = {k: np.concatenate(v, axis=0) for k, v in data_dict.items()}
        self.mcd_ls = np.concatenate(ls_list, axis=0).astype(np.float32)
        self.H = len(self.lat)
        self.W = len(self.lon)
        self.grid_size = self.H * self.W
        self.lon_is_360 = float(self.lon.max()) > 180.0

        # 展平后的 mean / scale 应与空间格点数匹配
        for i, arr in enumerate(self.means):
            if arr.size != self.grid_size:
                raise ValueError(
                    f"scaler_feat_{i}.pkl 空间维度不匹配：期望 {self.grid_size}，实际 {arr.size}"
                )

        print(f"MCD 数据加载完成，总时间点数: {len(self.mcd_ls)}")
        print(f"经纬度范围: lat {self.lat.min()}~{self.lat.max()}, lon {self.lon.min()}~{self.lon.max()}")
        print(f"空间网格: {self.H} x {self.W}")

    def _load_optional_ozone_history(self, ozone_history_path=None, ozone_history_ls_path=None):
        self.ozone_history = None
        self.ozone_history_ls = None

        if ozone_history_path and os.path.exists(ozone_history_path):
            ozone_arr = np.load(ozone_history_path)
            if ozone_arr.ndim != 3:
                raise ValueError("ozone_history_path 必须是 shape=(T,H,W) 的 .npy 文件")
            if ozone_arr.shape[1:] != (self.H, self.W):
                raise ValueError(
                    f"历史臭氧场网格尺寸不匹配：期望 {(self.H, self.W)}，实际 {ozone_arr.shape[1:]}"
                )
            self.ozone_history = ozone_arr.astype(np.float32)

            if ozone_history_ls_path and os.path.exists(ozone_history_ls_path):
                self.ozone_history_ls = np.asarray(np.load(ozone_history_ls_path), dtype=np.float32).reshape(-1)
                if len(self.ozone_history_ls) != len(self.ozone_history):
                    raise ValueError("ozone_history_ls_path 长度必须与 ozone_history_path 的时间维一致")
            else:
                self.ozone_history_ls = self.mcd_ls[: len(self.ozone_history)]

            print("已加载历史臭氧场，将用于第0通道 O3_prev")
        else:
            print("未提供历史臭氧场，将使用 climatology 回退构造 O3_prev")

    def _load_model(self, model_path):
        self.model = PredRNNv2(
            input_dim=7,
            hidden_dims=[64, 64, 64],
            height=self.H,
            width=self.W,
            horizon=self.horizon,
        )
        state = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(state)
        self.model.to(self.device)
        self.model.eval()
        print(f"模型已加载: {model_path}")

    def _normalize_lon(self, lon):
        lon = float(lon)
        if self.lon_is_360:
            return lon % 360.0
        if lon > 180.0:
            lon = ((lon + 180.0) % 360.0) - 180.0
        return lon

    def _find_bracketing_indices(self, ls_target, ls_array):
        ls_array = np.asarray(ls_array, dtype=np.float32)
        ls_target = float(ls_target) % 360.0
        ls_shifted = ls_array.copy()
        if len(ls_shifted) == 0:
            raise ValueError("时间轴为空")

        # 在环状 [0,360) 上取最近前后点
        sort_idx = np.argsort(ls_shifted)
        sorted_ls = ls_shifted[sort_idx]
        insert_pos = np.searchsorted(sorted_ls, ls_target, side="left")
        right_pos = insert_pos % len(sorted_ls)
        left_pos = (insert_pos - 1) % len(sorted_ls)
        left_idx = int(sort_idx[left_pos])
        right_idx = int(sort_idx[right_pos])

        left_ls = float(sorted_ls[left_pos])
        right_ls = float(sorted_ls[right_pos])
        if right_pos <= left_pos:
            right_ls += 360.0
        target_for_weight = ls_target
        if target_for_weight < left_ls:
            target_for_weight += 360.0

        gap = max(right_ls - left_ls, 1e-6)
        alpha = (target_for_weight - left_ls) / gap
        alpha = float(np.clip(alpha, 0.0, 1.0))
        return left_idx, right_idx, alpha

    def _interp_field(self, field_seq, ls_target, ls_array=None):
        if ls_array is None:
            ls_array = self.mcd_ls
        left_idx, right_idx, alpha = self._find_bracketing_indices(ls_target, ls_array)
        if left_idx == right_idx:
            return field_seq[left_idx].astype(np.float32)
        return ((1.0 - alpha) * field_seq[left_idx] + alpha * field_seq[right_idx]).astype(np.float32)

    def _build_climatology_o3(self, ls_value):
        lat2d = np.repeat(self.lat[:, None], self.W, axis=1)
        seasonal = 1.0 + 0.18 * np.sin(np.deg2rad(ls_value))
        polar = 0.12 + 0.38 * (np.abs(lat2d) / 90.0) ** 1.7
        wave = 0.05 * np.cos(np.deg2rad(ls_value + lat2d))
        ozone = np.maximum((polar + wave) * seasonal, 0.0)
        return ozone.astype(np.float32)

    def _get_o3_field(self, ls_value):
        if self.ozone_history is not None and self.ozone_history_ls is not None:
            return self._interp_field(self.ozone_history, ls_value, self.ozone_history_ls)
        return self._build_climatology_o3(ls_value)

    def _standardize_env_fields(self, env_raw):
        """
        env_raw shape: (6,H,W)
        返回 shape: (6,H,W)
        顺序与训练兼容: [u, v, ps, temp, dust, flux]
        """
        env = env_raw.astype(np.float32).copy()
        env[4] = np.log1p(np.clip(env[4], 0.0, None))
        env[5] = env[5] / self.max_flux

        flat = env.reshape(6, -1)
        out = np.empty_like(flat)
        for i in range(6):
            scale = np.where(self.scales[i] == 0, 1.0, self.scales[i])
            out[i] = (flat[i] - self.means[i]) / scale
        return out.reshape(6, self.H, self.W)

    def get_features(self, lat, lon, ls_target):
        lon = self._normalize_lon(lon)
        env = self.get_env_fields_at_ls(ls_target)
        lat_idx = int(np.abs(self.lat - float(lat)).argmin())
        lon_idx = int(np.abs(self.lon - lon).argmin())
        std_env = self._standardize_env_fields(env)
        return std_env[:, lat_idx, lon_idx].astype(np.float32)

    def get_env_fields_at_ls(self, ls_target):
        fields = [self._interp_field(self.mcd_data[name], ls_target) for name in self.ENV_KEYS]
        return np.stack(fields, axis=0).astype(np.float32)

    def get_historical_full_fields(self, ls_target, window=None):
        if window is None:
            window = self.window
        step_ls = 360.0 / max(len(self.mcd_ls), 1)
        step_ls = max(step_ls, 0.05)

        seq = []
        for back in range(window - 1, -1, -1):
            ls_t = (float(ls_target) - back * step_ls) % 360.0
            o3_field = self._get_o3_field(ls_t)
            env_raw = self.get_env_fields_at_ls(ls_t)
            env_std = self._standardize_env_fields(env_raw)
            field = np.concatenate([o3_field[None, :, :], env_std], axis=0)
            seq.append(field)
        return np.stack(seq, axis=0).astype(np.float32)

    def predict_grid(self, ls_target):
        if self.model is None:
            raise RuntimeError("模型未加载，无法执行真实预测")

        hist_fields = self.get_historical_full_fields(ls_target, window=self.window)
        input_tensor = torch.from_numpy(hist_fields).unsqueeze(0).float().to(self.device)

        with torch.no_grad():
            output = self.model(input_tensor)

        pred_scaled = output[0, 0, 0].cpu().numpy().astype(np.float32)
        pred = pred_scaled * self.y_std + self.y_mean
        pred = np.maximum(pred, 0.0).astype(np.float32)
        return {
            "lats": self.lat.tolist(),
            "lons": self.lon.tolist(),
            "values": pred.tolist(),
            "unit": "um-atm",
        }

    def predict_point(self, lat, lon, ls_target):
        grid = self.predict_grid(ls_target)
        values = np.asarray(grid["values"], dtype=np.float32)
        lon = self._normalize_lon(lon)
        lat_idx = int(np.abs(self.lat - float(lat)).argmin())
        lon_idx = int(np.abs(self.lon - lon).argmin())
        return float(values[lat_idx, lon_idx])

    # 向后兼容旧接口名
    def real_predict(self, lat, lon, ls_target):
        if self.model is None:
            print("警告：模型未加载，返回模拟值")
            return self.mock_predict(lat, lon, ls_target)
        return self.predict_point(lat, lon, ls_target)

    def get_ls_from_year_sol(self, year, sol):
        year_upper = str(year).upper()
        if year_upper == "MY27":
            file_idx = 0
        elif year_upper == "MY28":
            file_idx = 1
        else:
            raise ValueError(f"不支持的火星年: {year}，目前仅支持 MY27 和 MY28")

        if file_idx >= len(self.file_sols):
            raise ValueError(f"未找到 {year} 的数据文件")

        sols_in_file = int(self.file_sols[file_idx])
        hours_per_sol = int(self.file_hours[file_idx])
        sol = int(sol)
        if sol < 1 or sol > sols_in_file:
            raise ValueError(f"{year} 的 sol 应在 1 到 {sols_in_file} 之间")

        global_hour_idx = self.file_start_idx[file_idx] + (sol - 1) * hours_per_sol
        if global_hour_idx >= len(self.mcd_ls):
            raise ValueError("计算出的索引超出 mcd_ls 范围，请检查数据")
        return float(self.mcd_ls[global_hour_idx])

    def get_ls_series_for_day(self, year, sol, num_points=8):
        year_upper = str(year).upper()
        if year_upper == "MY27":
            file_idx = 0
        elif year_upper == "MY28":
            file_idx = 1
        else:
            raise ValueError(f"不支持的火星年: {year}，目前仅支持 MY27 和 MY28")

        if file_idx >= len(self.file_sols):
            raise ValueError(f"未找到 {year} 的数据文件")

        sols_in_file = int(self.file_sols[file_idx])
        hours_per_sol = int(self.file_hours[file_idx])
        sol = int(sol)
        if sol < 1 or sol > sols_in_file:
            raise ValueError(f"{year} 的 sol 应在 1 到 {sols_in_file} 之间")

        sol_start_idx = self.file_start_idx[file_idx] + (sol - 1) * hours_per_sol
        hour_offsets = np.linspace(0, hours_per_sol - 1, num_points, dtype=int)

        ls_list = []
        time_labels = []
        for h in hour_offsets:
            idx = sol_start_idx + int(h)
            if idx >= len(self.mcd_ls):
                idx = len(self.mcd_ls) - 1
            ls_list.append(float(self.mcd_ls[idx]))
            time_labels.append(f"{int(h):02d}:00")
        return ls_list, time_labels

    def predict_day_series(self, lat, lon, year, sol, num_points=8):
        ls_list, time_labels = self.get_ls_series_for_day(year, sol, num_points=num_points)
        values = [float(self.real_predict(float(lat), float(lon), float(ls))) for ls in ls_list]
        return {
            "labels": time_labels,
            "values": values,
            "unit": "um-atm",
        }

    def mock_predict(self, lat, lon, ls_target):
        lat = float(lat)
        ls_target = float(ls_target)
        ozone = 0.1 + 0.3 * np.abs(lat) / 90.0
        ozone *= 1.0 + 0.2 * np.sin(np.deg2rad(ls_target))
        return float(max(ozone, 0.0))


if __name__ == "__main__":
    mcd_files = [
        "Dataset/MCDALL/MCD_MY27_Lat-90-90_real.nc",
        "Dataset/MCDALL/MCD_MY28_Lat-90-90_real.nc",
    ]

    loader = MarsDataLoader(
        mcd_paths=mcd_files,
        scaler_dir=".",
        model_path="predrnn_highlat_gpu.pth",
        ozone_history_path=None,
        ozone_history_ls_path=None,
        device="cpu",
    )

    lat, lon = 45.0, 120.0
    ls = loader.get_ls_from_year_sol("MY27", 100)
    print("Ls:", ls)
    print("标准化环境特征:", loader.get_features(lat, lon, ls))
    print("模拟预测:", loader.mock_predict(lat, lon, ls))
    if loader.model is not None:
        print("真实预测:", loader.real_predict(lat, lon, ls))
