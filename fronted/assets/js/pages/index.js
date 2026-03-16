document.addEventListener('DOMContentLoaded', async () => {
  marsApp.renderShell('homeTitle', 'homeDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid hero">
      <div class="card">
        <h3>Mission Dashboard</h3>
        <p class="muted">OpenMars + MCD + deep learning inference + explainable presentation.</p>
        <div class="grid grid-3" style="margin-top:16px">
          <div><div class="kpi" id="kpiModel">--</div><div class="kpi-label">Model Version</div></div>
          <div><div class="kpi" id="kpiApi">--</div><div class="kpi-label">API Health</div></div>
          <div><div class="kpi" id="kpiRisk">--</div><div class="kpi-label">Risk Summary</div></div>
        </div>
        <div class="card-actions">
          <a class="btn" href="predict.html">Forecast Center</a>
          <a class="ghost-btn" href="explorer.html">Visualization</a>
          <a class="ghost-btn" href="metrics.html">Credibility</a>
        </div>
      </div>
      <div class="hero-visual"></div>
    </section>
    <section class="grid grid-4" style="margin-top:18px">
      <div class="card"><h4>Project Brief</h4><p class="muted">Platform intro, data sources and model overview.</p></div>
      <div class="card"><h4>Realtime Snapshot</h4><p class="muted">Key region, today focus and risk digest.</p></div>
      <div class="card"><h4>Core Capability</h4><p class="muted">Forecasting, visualization, assistant and governance.</p></div>
      <div class="card"><h4>Highlights</h4><p class="muted">Real model, 3D Mars globe, explainability and MY34 topic.</p></div>
    </section>
    <section class="card" style="margin-top:18px">
      <h3>Quick Entry</h3>
      <div class="quick-links">
        <a class="quick-link" href="predict.html">Point / 24h / Grid</a>
        <a class="quick-link" href="explorer.html">Mars globe & heatmap</a>
        <a class="quick-link" href="assistant.html">AI explanation</a>
        <a class="quick-link" href="user.html">Profile & history</a>
      </div>
    </section>
  `;

  document.getElementById('kpiModel').textContent = 'Real-v1';
  document.getElementById('kpiApi').textContent = 'ONLINE';
  document.getElementById('kpiRisk').textContent = 'Moderate';
});