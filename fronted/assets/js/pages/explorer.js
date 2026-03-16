let marsViewer = null;
let marsEntities = [];
let currentGrid = null;

document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('explorerTitle', 'explorerDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card">
        <h3>Cesium Mars Globe</h3>
        <div id="marsViewer" style="height:420px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.08)"></div>
        <div class="card-actions">
          <button class="btn" id="loadGlobe" data-i18n="btnGlobe"></button>
          <button class="ghost-btn" id="clearGlobe" data-i18n="btnClearGlobe"></button>
        </div>
      </div>
      <div class="card">
        <h3>Grid Heatmap & Topic Reserve</h3>
        <div class="form-grid">
          <div class="field"><label data-i18n="labelYear"></label><select id="yearInput"><option>MY27</option><option>MY28</option></select></div>
          <div class="field"><label data-i18n="labelSol"></label><input id="solInput" type="number" value="120"></div>
        </div>
        <div class="card-actions"><button class="btn" id="loadGrid">Load Grid</button></div>
        <div class="canvas-wrap" style="margin-top:14px"><canvas id="heatmapCanvas" width="900" height="360"></canvas></div>
        <div class="footer-note">预留：因子联动、差值分析、MY34 沙尘暴专题页。</div>
      </div>
    </section>
  `;
  marsApp.applyI18n();
  document.getElementById('loadGlobe').onclick = loadGridToGlobe;
  document.getElementById('clearGlobe').onclick = clearEntities;
  document.getElementById('loadGrid').onclick = loadGridOnly;
});

function initViewer() {
  if (marsViewer) return;
  marsViewer = new Cesium.Viewer('marsViewer', {
    animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, infoBox: false, selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });
  marsViewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a0f0a');
  marsViewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#050912');
  marsViewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(0, 15, 18000000) });
}

async function fetchGrid() {
  const payload = { martian_year: document.getElementById('yearInput').value, sol: parseInt(document.getElementById('solInput').value, 10) };
  currentGrid = await api.post('/predict/grid', payload);
  renderHeatmap(currentGrid.grid);
  return currentGrid;
}

async function loadGridOnly() {
  try {
    await fetchGrid();
    marsApp.toast('热图数据已加载');
  } catch (e) {
    marsApp.toast(`加载失败：${e.message}`, true);
  }
}

async function loadGridToGlobe() {
  try {
    initViewer();
    const data = currentGrid || await fetchGrid();
    clearEntities(false);
    const grid = data.grid, lats = data.lats, lons = data.lons;
    let min = Infinity, max = -Infinity;
    grid.forEach(row => row.forEach(v => { if (Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v); } }));
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const ratio = (grid[i][j] - min) / ((max - min) || 1);
        const entity = marsViewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lons[j], lats[i]),
          point: { pixelSize: 6, color: colorScale(ratio), outlineColor: Cesium.Color.BLACK.withAlpha(.25), outlineWidth: 1 },
          description: `Lat: ${lats[i]}<br>Lon: ${lons[j]}<br>Ozone: ${grid[i][j]}`
        });
        marsEntities.push(entity);
      }
    }
    marsViewer.zoomTo(marsViewer.entities);
    marsApp.toast('火星球可视化完成');
  } catch (e) {
    marsApp.toast(`火星球加载失败：${e.message}`, true);
  }
}

function clearEntities(withToast = true) {
  if (!marsViewer) return;
  marsEntities.forEach(item => marsViewer.entities.remove(item));
  marsEntities = [];
  if (withToast) marsApp.toast('已清空点位');
}

function renderHeatmap(grid) {
  const canvas = document.getElementById('heatmapCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let min = Infinity, max = -Infinity;
  grid.forEach(row => row.forEach(v => { if (Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v); } }));
  const rows = grid.length, cols = grid[0].length, cellW = canvas.width / cols, cellH = canvas.height / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { ctx.fillStyle = cssColor((grid[r][c] - min) / ((max - min) || 1)); ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1); }
}

function cssColor(t) {
  const s = [[9,19,39],[27,56,92],[51,181,255],[186,81,43],[255,138,69],[255,211,112]];
  const p = Math.max(0, Math.min(1, t)) * (s.length - 1); const i = Math.floor(p), f = p - i; const a = s[i], b = s[Math.min(i + 1, s.length - 1)];
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)}, ${Math.round(a[1]+(b[1]-a[1])*f)}, ${Math.round(a[2]+(b[2]-a[2])*f)})`;
}
function colorScale(t) { const c = cssColor(t).match(/\d+/g).map(Number); return new Cesium.Color(c[0]/255, c[1]/255, c[2]/255, .95); }