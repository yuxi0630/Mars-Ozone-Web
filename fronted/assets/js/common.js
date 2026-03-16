(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  const pages = {
    'index.html': 'navHome',
    'predict.html': 'navPredict',
    'explorer.html': 'navExplorer',
    'metrics.html': 'navMetrics',
    'assistant.html': 'navAssistant',
    'governance.html': 'navGovernance',
    'science.html': 'navScience',
    'user.html': 'navUser'
  };

  function currentLang() {
    return localStorage.getItem('marsLang') || 'zh';
  }

  function t(key) {
    return (window.I18N[currentLang()] || {})[key] || key;
  }

  function renderShell(titleKey, descKey) {
    const root = document.getElementById('app');
    const activeKey = pages[path];
    root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-logo">MO</div>
            <div>
              <h1 data-i18n="brandTitle"></h1>
              <p data-i18n="brandSub"></p>
            </div>
          </div>
          <div class="nav-title" data-i18n="groupMain"></div>
          <div class="nav-group">
            ${navItem('index.html', 'navHome', activeKey)}
            ${navItem('predict.html', 'navPredict', activeKey)}
            ${navItem('explorer.html', 'navExplorer', activeKey)}
            ${navItem('metrics.html', 'navMetrics', activeKey)}
          </div>
          <div class="nav-title" data-i18n="groupSupport"></div>
          <div class="nav-group">
            ${navItem('assistant.html', 'navAssistant', activeKey)}
            ${navItem('governance.html', 'navGovernance', activeKey)}
            ${navItem('science.html', 'navScience', activeKey)}
            ${navItem('user.html', 'navUser', activeKey)}
          </div>
          <div class="footer-note">API: <span id="apiHealth" class="status warn">--</span></div>
        </aside>
        <main class="main">
          <div class="topbar">
            <div class="page-title">
              <h2 data-i18n="${titleKey}"></h2>
              <p data-i18n="${descKey}"></p>
            </div>
            <div class="top-actions">
              <div class="lang-toggle">
                <button data-lang="zh">中文</button>
                <button data-lang="en">EN</button>
              </div>
            </div>
          </div>
          <div id="page-content"></div>
        </main>
      </div>
    `;
    applyI18n();
    bindLang();
    checkHealth();
  }

  function navItem(href, key, activeKey) {
    return `<a href="${href}" class="nav-item ${key === activeKey ? 'active' : ''}"><span data-i18n="${key}"></span><small>›</small></a>`;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang());
    });
  }

  function bindLang() {
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.onclick = () => {
        localStorage.setItem('marsLang', btn.dataset.lang);
        applyI18n();
        document.dispatchEvent(new CustomEvent('mars:langchange'));
      };
    });
  }

  async function checkHealth() {
    const tag = document.getElementById('apiHealth');
    try {
      const res = await fetch(`${window.API_BASE}/health`);
      const json = await res.json();
      tag.className = `status ${json.code === 0 ? 'ok' : 'warn'}`;
      tag.textContent = json.code === 0 ? t('online') : t('pending');
    } catch (e) {
      tag.className = 'status danger';
      tag.textContent = t('offline');
    }
  }

  function toast(message, isError = false) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9999;padding:12px 16px;border-radius:14px;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);color:#fff;max-width:360px';
      document.body.appendChild(el);
    }
    el.style.boxShadow = isError ? '0 0 0 1px rgba(255,109,134,.25), 0 20px 40px rgba(0,0,0,.35)' : '0 0 0 1px rgba(91,213,157,.15), 0 20px 40px rgba(0,0,0,.35)';
    el.textContent = message;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.remove(), 2400);
  }

  function getPredictPayload() {
    return {
      lat: parseFloat(document.getElementById('latInput').value),
      lon: parseFloat(document.getElementById('lonInput').value),
      martian_year: document.getElementById('yearInput').value,
      sol: parseInt(document.getElementById('solInput').value, 10)
    };
  }

  function fillDemo() {
    ['latInput', 'lonInput', 'yearInput', 'solInput'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'latInput') el.value = 10.5;
      if (id === 'lonInput') el.value = 45.2;
      if (id === 'yearInput') el.value = 'MY27';
      if (id === 'solInput') el.value = 120;
    });
  }

  function exportJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  window.marsApp = { renderShell, toast, t, currentLang, applyI18n, getPredictPayload, fillDemo, exportJson };
})();