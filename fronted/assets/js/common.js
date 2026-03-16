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

  const SHARED_I18N = {
    zh: {
      brandTitle: '火星臭氧智能预报平台',
      brandSub: 'Mars Ozone Intelligence Platform',
      navHome: '首页',
      navPredict: '臭氧预测',
      navExplorer: '时空可视化',
      navMetrics: '模型评估',
      navAssistant: '智能助手',
      navGovernance: '数据治理',
      navScience: '科普中心',
      navUser: '用户中心',
      userMenuHistory: '历史记录',
      userMenuExports: '导出记录',
      online: '在线',
      offline: '离线',
      pending: '检测中'
    },
    en: {
      brandTitle: 'Mars Ozone Intelligence Platform',
      brandSub: 'Mars Ozone Intelligence Platform',
      navHome: 'Home',
      navPredict: 'Forecast',
      navExplorer: 'Visualization',
      navMetrics: 'Credibility',
      navAssistant: 'AI Assistant',
      navGovernance: 'Governance',
      navScience: 'Science Hub',
      navUser: 'User Center',
      userMenuHistory: 'History',
      userMenuExports: 'Exports',
      online: 'Online',
      offline: 'Offline',
      pending: 'Checking'
    }
  };

  function ensureSharedI18n() {
    window.I18N = window.I18N || {};
    ['zh', 'en'].forEach(lang => {
      window.I18N[lang] = Object.assign({}, SHARED_I18N[lang], window.I18N[lang] || {});
    });
  }

  function currentLang() {
    return localStorage.getItem('marsLang') || 'zh';
  }

  function t(key) {
    ensureSharedI18n();
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
    ensureSharedI18n();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  function syncLangToggle() {
    const lang = currentLang();
    const zhBtn = document.getElementById('langZh');
    const enBtn = document.getElementById('langEn');
    if (!zhBtn || !enBtn) return;

    const base = 'lang-btn min-w-[56px] whitespace-nowrap px-4 py-2 text-sm font-medium transition';
    const active = ' bg-white/10 text-white';
    const inactive = ' text-slate-400 hover:bg-white/5 hover:text-white';

    zhBtn.className = base + (lang === 'zh' ? active : inactive);
    enBtn.className = base + (lang === 'en' ? active : inactive);
  }

  function bindLang() {
    const zhBtn = document.getElementById('langZh');
    const enBtn = document.getElementById('langEn');

    if (zhBtn) {
      zhBtn.onclick = () => {
        localStorage.setItem('marsLang', 'zh');
        applyI18n();
        syncLangToggle();
        checkHealthForTopNavbar();
        document.dispatchEvent(new CustomEvent('mars:langchange', { detail: { lang: 'zh' } }));
      };
    }

    if (enBtn) {
      enBtn.onclick = () => {
        localStorage.setItem('marsLang', 'en');
        applyI18n();
        syncLangToggle();
        checkHealthForTopNavbar();
        document.dispatchEvent(new CustomEvent('mars:langchange', { detail: { lang: 'en' } }));
      };
    }

    syncLangToggle();
  }

  async function checkHealth() {
    const tag = document.getElementById('apiHealth');
    if (!tag) return;
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

  const TOP_NAV_ITEMS = [
    { href: 'index.html', key: 'navHome' },
    { href: 'predict.html', key: 'navPredict' },
    { href: 'explorer.html', key: 'navExplorer' },
    { href: 'metrics.html', key: 'navMetrics' },
    { href: 'assistant.html', key: 'navAssistant' },
    { href: 'governance.html', key: 'navGovernance' },
    { href: 'science.html', key: 'navScience' }
  ];

  function renderTopNavbar(options = {}) {
    ensureSharedI18n();
    const { mountId = 'globalHeader', showApiStatus = true, showLangToggle = true, showUserMenu = true } = options;
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const activeKey = pages[path];
    const lang = currentLang();
    mount.innerHTML = `
      <header class="sticky top-0 z-50 border-b border-white/10 bg-[#071015]/78 backdrop-blur-2xl">
        <div class="mx-auto grid max-w-[1680px] grid-cols-[minmax(220px,1fr)_auto] items-center gap-4 px-4 py-4 lg:px-8 2xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(240px,320px)]">
          <a href="index.html" class="min-w-0 flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_30px_rgba(19,164,236,0.15)]">
              <span class="material-symbols-outlined text-[28px]">hub</span>
            </div>
            <div class="min-w-0">
              <div class="truncate text-lg font-bold tracking-tight text-white" data-i18n="brandTitle">火星臭氧智能预报平台</div>
              <div class="truncate text-xs tracking-[0.18em] text-slate-400" data-i18n="brandSub">Mars Ozone Intelligence Platform</div>
            </div>
          </a>

          <nav class="hidden min-w-0 items-center justify-center gap-5 2xl:flex">
            ${TOP_NAV_ITEMS.map(item => topNavItem(item, activeKey)).join('')}
          </nav>

          <div class="flex min-w-0 items-center justify-end gap-2 lg:gap-3">
            ${showApiStatus ? `<div class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 md:flex"><span class="material-symbols-outlined text-[16px] text-primary">lan</span><span>API</span><span id="apiStatus" class="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-300">${lang==='zh'?'检测中':'Checking'}</span></div>` : ''}
            ${showLangToggle ? `<div class="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-white/10 bg-white/5"><button id="langZh" data-lang="zh" class="lang-btn min-w-[56px] whitespace-nowrap px-4 py-2 text-sm font-medium transition">中文</button><button id="langEn" data-lang="en" class="lang-btn min-w-[56px] whitespace-nowrap px-4 py-2 text-sm font-medium transition">EN</button></div>` : ''}
            ${showUserMenu ? `<details class="relative hidden md:block"><summary class="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white transition hover:bg-white/10"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><span class="material-symbols-outlined text-[18px]">person</span></div><span data-i18n="navUser">用户中心</span><span class="material-symbols-outlined text-[18px] text-slate-400">expand_more</span></summary><div class="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0b151b]/95 shadow-2xl backdrop-blur-xl"><a href="user.html" class="block px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5" data-i18n="navUser">用户中心</a><a href="user.html#history" class="block px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5" data-i18n="userMenuHistory">历史记录</a><a href="user.html#exports" class="block px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5" data-i18n="userMenuExports">导出记录</a></div></details>` : ''}
          </div>
        </div>
        <div class="border-t border-white/5 2xl:hidden">
          <div class="mx-auto flex max-w-[1680px] items-center gap-2 overflow-x-auto px-4 py-3 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            ${TOP_NAV_ITEMS.map(item => topNavItemMobile(item, activeKey)).join('')}
          </div>
        </div>
      </header>
    `;
    applyI18n();
    bindLang();
    syncLangToggle();
    checkHealthForTopNavbar();
  }

  function topNavItem(item, activeKey) {
    const active = item.key === activeKey;
    return `<a href="${item.href}" class="group relative whitespace-nowrap px-1 py-2 text-sm font-medium transition ${active ? 'text-white' : 'text-slate-300 hover:text-white'}"><span data-i18n="${item.key}"></span><span class="absolute inset-x-0 -bottom-[18px] h-[2px] rounded-full transition ${active ? 'bg-accent shadow-[0_0_18px_rgba(255,123,84,0.55)]' : 'bg-transparent group-hover:bg-white/20'}"></span></a>`;
  }

  function topNavItemMobile(item, activeKey) {
    const active = item.key === activeKey;
    return `<a href="${item.href}" class="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-accent/40 bg-accent/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}" data-i18n="${item.key}"></a>`;
  }

  async function checkHealthForTopNavbar() {
    const tag = document.getElementById('apiStatus');
    if (!tag) return;
    const candidates = [];
    if (window.API_BASE) candidates.push(`${window.API_BASE}/health`);
    candidates.push('/api/health', 'http://127.0.0.1:5000/api/health');
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (res.ok && json.code === 0) {
          tag.className = 'rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300';
          tag.textContent = t('online');
          return;
        }
      } catch (e) {}
    }
    tag.className = 'rounded-full bg-rose-400/15 px-2 py-0.5 text-rose-300';
    tag.textContent = t('offline');
  }

  window.marsApp = { renderShell, renderTopNavbar, toast, t, currentLang, applyI18n, getPredictPayload, fillDemo, exportJson, ensureSharedI18n };
})();