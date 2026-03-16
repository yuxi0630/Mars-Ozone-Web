window.API_BASE = 'http://127.0.0.1:5000/api';
window.api = {
  getToken() { return localStorage.getItem('marsToken') || ''; },
  setToken(token) { localStorage.setItem('marsToken', token || ''); },
  authHeaders(extra = {}) {
    const token = this.getToken();
    return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  },
  async get(path, auth = false) {
    const res = await fetch(`${window.API_BASE}${path}`, { headers: auth ? this.authHeaders() : {} });
    const json = await res.json();
    if (!res.ok || json.code !== 0) throw new Error(json.message || 'Request failed');
    return json.data;
  },
  async post(path, payload, auth = false) {
    const res = await fetch(`${window.API_BASE}${path}`, {
      method: 'POST',
      headers: auth ? this.authHeaders({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok || json.code !== 0) throw new Error(json.message || 'Request failed');
    return json.data;
  },
  async upload(path, formData, auth = true) {
    const res = await fetch(`${window.API_BASE}${path}`, {
      method: 'POST',
      headers: auth ? this.authHeaders() : {},
      body: formData
    });
    const json = await res.json();
    if (!res.ok || json.code !== 0) throw new Error(json.message || 'Upload failed');
    return json.data;
  }
};