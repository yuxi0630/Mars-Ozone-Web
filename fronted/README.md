# Mars Ozone Platform Frontend (generated)

这是按你当前 Flask 后端接口生成的一套前端多页面静态版本，已经接入以下接口：

- `/api/health`
- `/api/predict/point`
- `/api/predict/24h`
- `/api/predict/grid`
- `/api/metrics/model`
- `/api/metrics/scatter`
- `/api/metrics/residual`
- `/api/assistant/chat`
- `/api/datasets/upload`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/profile`
- `/api/predict/history`

## 页面

- `index.html` 首页 / 总览
- `predict.html` 臭氧预测
- `explorer.html` 时空可视化 / 数据探索
- `metrics.html` 模型评估 / 可信度
- `assistant.html` 智能助手
- `governance.html` 数据治理
- `science.html` 科普中心
- `user.html` 用户中心

## 国际化

- 语言切换：右上角 `中文 / EN`
- 字典文件：`assets/js/i18n.js`
- 当前语言保存在 `localStorage.marsLang`

## Token

- 登录成功后 token 保存在 `localStorage.marsToken`

## Base URL

默认后端地址在 `assets/js/api.js`：

```js
window.API_BASE = 'http://127.0.0.1:5000/api';