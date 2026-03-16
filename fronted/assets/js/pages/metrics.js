let scatterChart = null;
let residualChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  marsApp.renderShell('metricsTitle', 'metricsDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-4">
      <div class="card"><div class="kpi" id="metricR2">--</div><div class="kpi-label">R²</div></div>
      <div class="card"><div class="kpi" id="metricMSE">--</div><div class="kpi-label">MSE</div></div>
      <div class="card"><div class="kpi" id="metricMAE">--</div><div class="kpi-label">MAE</div></div>
      <div class="card"><div class="kpi" id="metricRMSE">--</div><div class="kpi-label">RMSE</div></div>
    </section>
    <section class="card" style="margin-top:18px">
      <div class="card-actions"><button class="btn" id="reloadMetrics" data-i18n="btnLoadMetrics"></button></div>
    </section>
    <section class="grid grid-2" style="margin-top:18px">
      <div class="card"><h3>Scatter / Fit</h3><div class="chart-wrap"><canvas id="scatterChart"></canvas></div></div>
      <div class="card"><h3>Residual Distribution</h3><div class="chart-wrap"><canvas id="residualChart"></canvas></div></div>
    </section>
    <section class="grid grid-2" style="margin-top:18px">
      <div class="card"><h3>Credibility Notes</h3><p class="muted">Explain why the metrics are trustworthy, how residuals behave, and where the model is stable or uncertain.</p></div>
      <div class="card"><h3>Model Comparison</h3><p class="muted">Reserved for future version switch and side-by-side comparison with the newer graduate model.</p></div>
    </section>
  `;
  marsApp.applyI18n();
  document.getElementById('reloadMetrics').onclick = loadMetrics;
  loadMetrics();
});

async function loadMetrics() {
  try {
    const metricData = await api.get('/metrics/model');
    metricR2.textContent = metricData.r2 ?? '--';
    metricMSE.textContent = metricData.mse ?? '--';
    metricMAE.textContent = metricData.mae ?? '--';
    metricRMSE.textContent = metricData.rmse ?? '--';
    const scatterData = await api.get('/metrics/scatter');
    const residualData = await api.get('/metrics/residual');
    renderCharts(scatterData, residualData);
    marsApp.toast('指标已刷新');
  } catch (e) {
    marsApp.toast(`指标加载失败：${e.message}`, true);
  }
}

function renderCharts(scatterData, residualData) {
  const sctx = document.getElementById('scatterChart');
  const rctx = document.getElementById('residualChart');
  if (scatterChart) scatterChart.destroy();
  if (residualChart) residualChart.destroy();
  scatterChart = new Chart(sctx, {
    type: 'scatter',
    data: { datasets: [{ label: 'Real vs Pred', data: (scatterData.points || []).map(p => ({ x: p.real, y: p.pred })), backgroundColor: 'rgba(51,181,255,.72)' }] },
    options: chartOptions('Prediction Scatter')
  });
  residualChart = new Chart(rctx, {
    type: 'bar',
    data: { labels: (residualData.residuals || []).map((_, i) => `R${i + 1}`), datasets: [{ label: 'Residual', data: residualData.residuals || [], backgroundColor: 'rgba(255,138,69,.7)' }] },
    options: chartOptions('Residual Distribution')
  });
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#d9ebff' } }, title: { display: true, text: title, color: '#e8f2ff' } },
    scales: { x: { ticks: { color: '#9eb1d6' }, grid: { color: 'rgba(255,255,255,.06)' } }, y: { ticks: { color: '#9eb1d6' }, grid: { color: 'rgba(255,255,255,.06)' } } }
  };
}