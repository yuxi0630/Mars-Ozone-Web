let seriesChart = null;
let currentGridData = null;

document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('predictTitle', 'predictDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card">
        <h3>Forecast Controls</h3>
        <div class="form-grid">
          <div class="field"><label data-i18n="labelLat"></label><input id="latInput" type="number" step="0.1"></div>
          <div class="field"><label data-i18n="labelLon"></label><input id="lonInput" type="number" step="0.1"></div>
          <div class="field"><label data-i18n="labelYear"></label><select id="yearInput"><option>MY27</option><option>MY28</option></select></div>
          <div class="field"><label data-i18n="labelSol"></label><input id="solInput" type="number" step="1"></div>
        </div>
        <div class="card-actions">
          <button class="btn" id="btnDemo" data-i18n="actionDemo"></button>
          <button class="btn" id="btnPoint" data-i18n="btnRunPoint"></button>
          <button class="btn" id="btn24h" data-i18n="btnRun24h"></button>
          <button class="btn" id="btnGrid" data-i18n="btnRunGrid"></button>
          <button class="ghost-btn" id="btnDownload" data-i18n="btnDownload"></button>
        </div>
      </div>
      <div class="card">
        <h3>Point Result</h3>
        <div class="metric-list">
          <div class="metric-row"><span>Summary</span><strong id="pointSummary">--</strong></div>
          <div class="metric-row"><span>Prediction</span><strong id="pointValue">--</strong></div>
          <div class="metric-row"><span>Unit</span><strong id="pointUnit">--</strong></div>
          <div class="metric-row"><span>Confidence</span><strong id="pointConf">--</strong></div>
          <div class="metric-row"><span>Risk</span><strong id="pointRisk">--</strong></div>
          <div class="metric-row"><span>Ls</span><strong id="pointLs">--</strong></div>
        </div>
      </div>
    </section>
    <section class="grid grid-2" style="margin-top:18px">
      <div class="card">
        <h3>24h Trend</h3>
        <div class="chart-wrap"><canvas id="seriesChart"></canvas></div>
      </div>
      <div class="card">
        <h3>Global Heatmap</h3>
        <div class="canvas-wrap"><canvas id="heatmapCanvas" width="900" height="420"></canvas></div>
      </div>
    </section>
  `;
  marsApp.applyI18n();
  marsApp.fillDemo();
  bindEvents();
});

function bindEvents() {
  document.getElementById('btnDemo').onclick = () => marsApp.fillDemo();
  document.getElementById('btnPoint').onclick = runPoint;
  document.getElementById('btn24h').onclick = runSeries;
  document.getElementById('btnGrid').onclick = runGrid;
  document.getElementById('btnDownload').onclick = () => {
    if (!currentGridData) return marsApp.toast('请先生成热图数据', true);
    marsApp.exportJson('mars_grid_prediction.json', currentGridData);
  };
}

async function runPoint() {
  try {
    const data = await api.post('/predict/point', marsApp.getPredictPayload());
    pointSummary.textContent = `${data.martianYear} / Sol ${data.sol} / Ls ${data.ls}`;
    pointValue.textContent = data.prediction;
    pointUnit.textContent = data.unit;
    pointConf.textContent = `${data.confidenceInterval[0]} ~ ${data.confidenceInterval[1]}`;
    pointRisk.textContent = data.riskLevel;
    pointLs.textContent = data.ls;
    marsApp.toast('单点预测完成');
  } catch (e) {
    marsApp.toast(`单点预测失败：${e.message}`, true);
  }
}

async function runSeries() {
  try {
    const data = await api.post('/predict/24h', marsApp.getPredictPayload());
    const series = data.series || [];
    const ctx = document.getElementById('seriesChart');
    if (seriesChart) seriesChart.destroy();
    seriesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(x => x.label),
        datasets: [
          { label: 'Prediction', data: series.map(x => x.prediction), borderColor: '#33b5ff', tension: .35 },
          { label: 'Upper', data: series.map(x => x.upperBound), borderColor: '#ff8a45', tension: .35 },
          { label: 'Lower', data: series.map(x => x.lowerBound), borderColor: '#7fd3ff', tension: .35 }
        ]
      },
      options: chartOptions('24h Ozone Trend')
    });
    marsApp.toast('24h 预测完成');
  } catch (e) {
    marsApp.toast(`24h 预测失败：${e.message}`, true);
  }
}

async function runGrid() {
  try {
    const payload = { martian_year: document.getElementById('yearInput').value, sol: parseInt(document.getElementById('solInput').value, 10) };
    const data = await api.post('/predict/grid', payload);
    currentGridData = data;
    renderHeatmap(data.grid);
    marsApp.toast('全球热图已生成');
  } catch (e) {
    marsApp.toast(`热图预测失败：${e.message}`, true);
  }
}

function renderHeatmap(grid) {
  const canvas = document.getElementById('heatmapCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!Array.isArray(grid) || !grid.length) return;
  let min = Infinity, max = -Infinity;
  grid.forEach(row => row.forEach(v => { if (Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v); } }));
  const rows = grid.length, cols = grid[0].length, cellW = canvas.width / cols, cellH = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ratio = (grid[r][c] - min) / ((max - min) || 1);
      ctx.fillStyle = colorScale(ratio);
      ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Range: ${min.toFixed(3)} ~ ${max.toFixed(3)} um-atm`, 16, 24);
}

function colorScale(t) {
  const s = [[9,19,39],[27,56,92],[51,181,255],[186,81,43],[255,138,69],[255,211,112]];
  const p = Math.max(0, Math.min(1, t)) * (s.length - 1);
  const i = Math.floor(p), f = p - i; const a = s[i], b = s[Math.min(i + 1, s.length - 1)];
  return `rgb(${Math.round(a[0] + (b[0]-a[0])*f)}, ${Math.round(a[1] + (b[1]-a[1])*f)}, ${Math.round(a[2] + (b[2]-a[2])*f)})`;
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#d9ebff' } }, title: { display: true, text: title, color: '#e8f2ff' } },
    scales: { x: { ticks: { color: '#9eb1d6' }, grid: { color: 'rgba(255,255,255,.06)' } }, y: { ticks: { color: '#9eb1d6' }, grid: { color: 'rgba(255,255,255,.06)' } } }
  };
}