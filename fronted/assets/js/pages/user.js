document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('userTitle', 'userDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card">
        <h3>Login</h3>
        <div class="field"><label data-i18n="labelUsername"></label><input id="loginUsername"></div>
        <div class="field"><label data-i18n="labelPassword"></label><input id="loginPassword" type="password"></div>
        <div class="card-actions"><button class="btn" id="loginBtn" data-i18n="btnLogin"></button><button class="ghost-btn" id="profileBtn" data-i18n="btnLoadProfile"></button></div>
        <div class="footer-note" id="loginStatus">--</div>
      </div>
      <div class="card">
        <h3>Register</h3>
        <div class="field"><label data-i18n="labelUsername"></label><input id="registerUsername"></div>
        <div class="field"><label data-i18n="labelEmail"></label><input id="registerEmail"></div>
        <div class="field"><label data-i18n="labelPassword"></label><input id="registerPassword" type="password"></div>
        <div class="card-actions"><button class="btn" id="registerBtn" data-i18n="btnRegister"></button></div>
        <div class="footer-note" id="registerStatus">--</div>
      </div>
    </section>
    <section class="grid grid-2" style="margin-top:18px">
      <div class="card">
        <h3>Profile</h3>
        <div class="metric-list">
          <div class="metric-row"><span>Username</span><strong id="profileUsername">--</strong></div>
          <div class="metric-row"><span>Email</span><strong id="profileEmail">--</strong></div>
          <div class="metric-row"><span>Role</span><strong id="profileRole">--</strong></div>
          <div class="metric-row"><span>Language</span><strong id="profileLanguage">--</strong></div>
        </div>
      </div>
      <div class="card">
        <h3>History</h3>
        <div class="card-actions"><button class="btn" id="historyBtn" data-i18n="btnLoadHistory"></button><button class="ghost-btn" id="logoutBtn">Logout</button></div>
        <div class="list" id="historyList"><div class="list-item">尚未加载历史记录。</div></div>
      </div>
    </section>
  `;
  marsApp.applyI18n();
  loginBtn.onclick = login;
  registerBtn.onclick = registerUser;
  profileBtn.onclick = loadProfile;
  historyBtn.onclick = loadHistory;
  logoutBtn.onclick = logout;
  if (api.getToken()) loadProfile().catch(() => {});
});

async function registerUser() {
  try {
    const data = await api.post('/auth/register', { username: registerUsername.value.trim(), email: registerEmail.value.trim(), password: registerPassword.value.trim() });
    registerStatus.textContent = `注册成功：${data.username}`;
    marsApp.toast('注册成功');
  } catch (e) {
    registerStatus.textContent = `注册失败：${e.message}`;
    marsApp.toast(`注册失败：${e.message}`, true);
  }
}

async function login() {
  try {
    const data = await api.post('/auth/login', { username: loginUsername.value.trim(), password: loginPassword.value.trim() });
    api.setToken(data.token);
    loginStatus.textContent = `登录成功：${data.user.username}`;
    marsApp.toast('登录成功');
    await loadProfile();
  } catch (e) {
    loginStatus.textContent = `登录失败：${e.message}`;
    marsApp.toast(`登录失败：${e.message}`, true);
  }
}

async function loadProfile() {
  try {
    const data = await api.get('/auth/profile', true);
    profileUsername.textContent = data.username || '--';
    profileEmail.textContent = data.email || '--';
    profileRole.textContent = data.role || '--';
    profileLanguage.textContent = data.language || '--';
  } catch (e) {
    marsApp.toast(`获取资料失败：${e.message}`, true);
  }
}

async function loadHistory() {
  try {
    const data = await api.get('/predict/history', true);
    const list = data.list || [];
    historyList.innerHTML = list.length ? list.map(item => `<div class="list-item"><strong>${item.predictType}</strong><div class="muted">MY${item.martianYear} / Sol ${item.sol} · ${item.riskLevel || '--'} · ${item.createdAt || '--'}</div></div>`).join('') : '<div class="list-item">暂无历史记录。</div>';
  } catch (e) {
    marsApp.toast(`加载历史失败：${e.message}`, true);
  }
}

function logout() {
  api.setToken('');
  profileUsername.textContent = profileEmail.textContent = profileRole.textContent = profileLanguage.textContent = '--';
  historyList.innerHTML = '<div class="list-item">尚未加载历史记录。</div>';
  marsApp.toast('已退出登录');
}