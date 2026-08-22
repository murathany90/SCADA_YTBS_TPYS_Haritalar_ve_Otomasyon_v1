const WebSCADAAuth = (() => {
  const AUTH_PATH = 'data/scada_auth.json';
  const DEFAULT_BASE_URL = 'https://analytics.teias.gov.tr';
  let csrf = { token: '', baseUrl: '', at: 0 };

  function baseUrl(value) { return String(value || DEFAULT_BASE_URL).replace(/\/+$/, ''); }
  async function loadConfig() {
    const response = await fetch(chrome.runtime.getURL(AUTH_PATH));
    if (!response.ok) throw new Error('Yerel SCADA kimlik dosyasi bulunamadi.');
    const config = await response.json();
    return { ...config, baseUrl: baseUrl(config.baseUrl) };
  }
  async function sessionValid(config) {
    try {
      const response = await fetch(`${baseUrl(config.baseUrl)}/api/v1/me`, { credentials: 'include', headers: { Accept: 'application/json' } });
      return response.ok;
    } catch { return false; }
  }
  async function csrfToken(config) {
    const normalized = baseUrl(config.baseUrl);
    if (csrf.token && csrf.baseUrl === normalized && Date.now() - csrf.at < 300000) return csrf.token;
    const response = await fetch(`${normalized}/api/v1/security/csrf_token/`, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!response.ok) return '';
    const json = await response.json();
    csrf = { token: json?.result || '', baseUrl: normalized, at: Date.now() };
    return csrf.token;
  }
  async function directLogin(config) {
    if (!config.username || !config.password) return { ok: false, error: 'Yerel SCADA kimlik bilgisi eksik.' };
    const loginPage = await fetch(`${baseUrl(config.baseUrl)}/login/`, { credentials: 'include' });
    if (!loginPage.ok) return { ok: false, error: `Login sayfasi alinamadi (${loginPage.status}).` };
    const html = await loginPage.text();
    const csrfValue = (html.match(/name=["']csrf_token["'][^>]*value=["']([^"']*)/i) || [])[1] || '';
    const form = new URLSearchParams({ username: String(config.username), password: String(config.password) });
    if (csrfValue) form.set('csrf_token', csrfValue);
    const response = await fetch(`${baseUrl(config.baseUrl)}/login/`, {
      method: 'POST', credentials: 'include', redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' }, body: form.toString()
    });
    return response.ok && await sessionValid(config) ? { ok: true } : { ok: false, error: `Direct login basarisiz (${response.status}).` };
  }
  async function ensureSession(config) {
    if (await sessionValid(config)) return { ok: true, authMode: 'session' };
    const login = await directLogin(config);
    return login.ok ? { ok: true, authMode: 'direct-login' } : { ok: false, authMode: 'none', error: login.error };
  }
  return { loadConfig, ensureSession, csrfToken, baseUrl };
})();
