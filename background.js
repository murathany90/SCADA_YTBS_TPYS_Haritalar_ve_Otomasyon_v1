const DOWNLOAD_TIMEOUT_MS = 45000;
const SCADA_FETCH_TIMEOUT_MS = 25000;
const CSRF_CACHE_TTL_MS = 5 * 60 * 1000;
const SCADA_AUTH_CONFIG_PATH = 'data/scada_auth.json';
const SCADA_DEFAULTS = {
  baseUrl: 'https://analytics.teias.gov.tr',
  dashboardId: 89,
  chartSliceId: 454,
  datasourceId: 3,
  timeRange: 'DATEADD(DATETIME("now"), -24, hour) : now',
  kvFilters: ['400', '380', '420', '154'],
  tearFilters: ['Golbasi_YTM'],
  elementNames: ['P'],
  elementName: 'P',
  measurementIds: [],
  rowLimit: 50000,
  enabled: false,
  username: '',
  password: ''
};

let cachedCsrfToken = null;
let cachedCsrfBaseUrl = '';
let csrfTokenFetchedAt = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'DOWNLOAD_URL_AND_WAIT') {
    handleDownloadAndWait(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message || String(error) });
    });
    return true;
  }
  if (message?.type === 'SCADA_FETCH') {
    handleScadaFetch(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({
        ok: false,
        error: error.message || String(error),
        errorType: 'BACKGROUND_ERROR',
        authMode: 'session',
        usedFallback: false
      });
    });
    return true;
  }
  return false;
});

async function handleScadaFetch(payload) {
  if (payload?.mockData) {
    return {
      ok: true,
      data: payload.mockData,
      authMode: 'mock',
      usedFallback: false,
      httpStatus: 200
    };
  }

  const authConfig = await loadScadaAuthConfig();
  const transport = buildScadaTransport(payload, authConfig);
  const sessionAttempt = await fetchChartData(transport, 'session', false);
  if (sessionAttempt.ok || !sessionAttempt.shouldRetryAuth) {
    return sessionAttempt;
  }

  if (!authConfig.enabled || !authConfig.username || !authConfig.password) {
    return sessionAttempt;
  }

  const directLogin = await tryDirectLogin(authConfig);
  if (directLogin.ok) {
    invalidateSupersetCsrfToken(authConfig.baseUrl);
    const directAttempt = await fetchChartData(transport, 'direct-login', false);
    if (directAttempt.ok || !directAttempt.shouldRetryAuth) return directAttempt;
  }

  const hiddenTabLogin = await tryHiddenTabLogin(authConfig);
  if (hiddenTabLogin.ok) {
    invalidateSupersetCsrfToken(authConfig.baseUrl);
    return fetchChartData(transport, 'hidden-tab', true);
  }

  return {
    ok: false,
    error: hiddenTabLogin.error || directLogin.error || sessionAttempt.error || 'SCADA auth yenilenemedi.',
    errorType: hiddenTabLogin.errorType || directLogin.errorType || sessionAttempt.errorType || 'AUTH_REQUIRED',
    httpStatus: sessionAttempt.httpStatus || null,
    authMode: 'hidden-tab',
    usedFallback: true
  };
}

function buildScadaTransport(payload, authConfig) {
  const mergedConfig = {
    ...SCADA_DEFAULTS,
    ...authConfig,
    ...payload
  };
  const chartPayload = payload?.chartPayload && typeof payload.chartPayload === 'object'
    ? payload.chartPayload
    : buildChartPayload(mergedConfig);
  return {
    baseUrl: normalizeBaseUrl(mergedConfig.baseUrl || SCADA_DEFAULTS.baseUrl),
    dashboardId: Number(mergedConfig.dashboardId || SCADA_DEFAULTS.dashboardId),
    chartSliceId: Number(mergedConfig.chartSliceId || SCADA_DEFAULTS.chartSliceId),
    datasourceId: Number(mergedConfig.datasourceId || SCADA_DEFAULTS.datasourceId),
    timeRange: String(mergedConfig.timeRange || SCADA_DEFAULTS.timeRange),
    kvFilters: Array.isArray(mergedConfig.kvFilters) ? mergedConfig.kvFilters.map((value) => String(value)) : SCADA_DEFAULTS.kvFilters.slice(),
    tearFilters: Array.isArray(mergedConfig.tearFilters) ? mergedConfig.tearFilters.map((value) => String(value)) : SCADA_DEFAULTS.tearFilters.slice(),
    elementNames: Array.isArray(mergedConfig.elementNames) && mergedConfig.elementNames.length
      ? mergedConfig.elementNames.map((value) => String(value))
      : SCADA_DEFAULTS.elementNames.slice(),
    elementName: String(mergedConfig.elementName || SCADA_DEFAULTS.elementName),
    measurementIds: Array.isArray(mergedConfig.measurementIds) ? mergedConfig.measurementIds.map((value) => String(value)) : SCADA_DEFAULTS.measurementIds.slice(),
    rowLimit: Number(mergedConfig.rowLimit || SCADA_DEFAULTS.rowLimit),
    chartPayload
  };
}

async function fetchChartData(config, authMode, usedFallback) {
  const url = buildChartUrl(config);
  const csrfToken = await getSupersetCsrfToken(config.baseUrl);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCADA_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(config.chartPayload || buildChartPayload(config)),
      signal: controller.signal,
      redirect: 'follow'
    });

    if (response.status === 401 || response.status === 403) {
      invalidateSupersetCsrfToken(config.baseUrl);
      return {
        ok: false,
        error: `SCADA chart auth hatasi (${response.status}).`,
        errorType: 'AUTH_REQUIRED',
        httpStatus: response.status,
        authMode,
        usedFallback,
        shouldRetryAuth: true
      };
    }

    if (!response.ok) {
      const errorText = await safeReadText(response);
      return {
        ok: false,
        error: errorText || `SCADA chart fetch basarisiz (${response.status}).`,
        errorType: response.status >= 500 ? 'UPSTREAM_ERROR' : 'NETWORK_ERROR',
        httpStatus: response.status,
        authMode,
        usedFallback,
        shouldRetryAuth: false
      };
    }

    const json = await response.json();
    return {
      ok: true,
      data: json,
      authMode,
      usedFallback,
      httpStatus: response.status
    };
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? `SCADA chart fetch zaman asimina ugradi (${Math.round(SCADA_FETCH_TIMEOUT_MS / 1000)} sn).`
        : (error.message || String(error)),
      errorType: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      httpStatus: null,
      authMode,
      usedFallback,
      shouldRetryAuth: false
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getSupersetCsrfToken(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const now = Date.now();
  if (
    cachedCsrfToken
    && cachedCsrfBaseUrl === normalizedBaseUrl
    && (now - csrfTokenFetchedAt) < CSRF_CACHE_TTL_MS
  ) {
    return cachedCsrfToken;
  }
  try {
    const response = await fetch(`${normalizedBaseUrl}/api/v1/security/csrf_token/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      invalidateSupersetCsrfToken(normalizedBaseUrl);
      return null;
    }
    const json = await response.json();
    const token = json?.result || null;
    if (!token) {
      invalidateSupersetCsrfToken(normalizedBaseUrl);
      return null;
    }
    cachedCsrfToken = token;
    cachedCsrfBaseUrl = normalizedBaseUrl;
    csrfTokenFetchedAt = now;
    return token;
  } catch {
    invalidateSupersetCsrfToken(normalizedBaseUrl);
    return null;
  }
}

function invalidateSupersetCsrfToken(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl || cachedCsrfBaseUrl || SCADA_DEFAULTS.baseUrl);
  if (cachedCsrfBaseUrl && cachedCsrfBaseUrl !== normalizedBaseUrl) return;
  cachedCsrfToken = null;
  cachedCsrfBaseUrl = '';
  csrfTokenFetchedAt = 0;
}

async function loadScadaAuthConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL(SCADA_AUTH_CONFIG_PATH));
    if (!response.ok) return { ...SCADA_DEFAULTS };
    const json = await response.json();
    return {
      ...SCADA_DEFAULTS,
      ...json,
      baseUrl: normalizeBaseUrl(json?.baseUrl || SCADA_DEFAULTS.baseUrl)
    };
  } catch {
    return { ...SCADA_DEFAULTS };
  }
}

async function validateSupersetSession(baseUrl) {
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/v1/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      redirect: 'follow'
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchLoginPage(config) {
  const loginUrl = `${normalizeBaseUrl(config.baseUrl)}/login/`;
  const response = await fetch(loginUrl, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow'
  });
  if (!response.ok) {
    throw new Error(`Login sayfasi alinamadi (${response.status}).`);
  }
  return {
    loginUrl,
    html: await response.text()
  };
}

function extractLoginMeta(html, baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const actionMatch = String(html || '').match(/<form[^>]+action=["']([^"']+)["']/i);
  const actionUrl = new URL(actionMatch?.[1] || '/login/', `${normalizedBaseUrl}/login/`).toString();

  const hiddenInputs = {};
  const hiddenRegex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
  const hiddenNodes = String(html || '').match(hiddenRegex) || [];
  hiddenNodes.forEach((node) => {
    const nameMatch = node.match(/\sname=["']([^"']+)["']/i);
    const valueMatch = node.match(/\svalue=["']([^"']*)["']/i);
    if (nameMatch?.[1]) hiddenInputs[nameMatch[1]] = valueMatch?.[1] || '';
  });

  const usernameField = findFieldName(html, [
    /<input[^>]+name=["']([^"']*(?:user|email|login)[^"']*)["'][^>]*>/i,
    /<input[^>]+type=["'](?:text|email)["'][^>]+name=["']([^"']+)["']/i
  ]) || 'username';
  const passwordField = findFieldName(html, [
    /<input[^>]+name=["']([^"']*pass[^"']*)["'][^>]*>/i,
    /<input[^>]+type=["']password["'][^>]+name=["']([^"']+)["']/i
  ]) || 'password';

  return {
    actionUrl,
    hiddenInputs,
    csrfField: Object.keys(hiddenInputs).find((key) => /csrf/i.test(key)) || 'csrf_token',
    csrfValue: hiddenInputs.csrf_token || hiddenInputs.csrfmiddlewaretoken || '',
    usernameField,
    passwordField
  };
}

function findFieldName(html, patterns) {
  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

async function tryDirectLogin(config) {
  try {
    const loginPage = await fetchLoginPage(config);
    const meta = extractLoginMeta(loginPage.html, config.baseUrl);
    const body = new URLSearchParams();
    Object.entries(meta.hiddenInputs).forEach(([key, value]) => body.set(key, value));
    body.set(meta.usernameField, String(config.username || ''));
    body.set(meta.passwordField, String(config.password || ''));
    if (meta.csrfValue && !body.has(meta.csrfField)) body.set(meta.csrfField, meta.csrfValue);

    const response = await fetch(meta.actionUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: normalizeBaseUrl(config.baseUrl),
        Referer: loginPage.loginUrl
      },
      body: body.toString(),
      redirect: 'follow'
    });

    if (!response.ok && response.status !== 302) {
      return {
        ok: false,
        error: `Direct login basarisiz (${response.status}).`,
        errorType: 'LOGIN_FAILED'
      };
    }

    const valid = await validateSupersetSession(config.baseUrl);
    return valid
      ? { ok: true }
      : { ok: false, error: 'Direct login sonrasi oturum dogrulanamadi.', errorType: 'AUTH_VALIDATION_FAILED' };
  } catch (error) {
    return {
      ok: false,
      error: error.message || String(error),
      errorType: 'LOGIN_FAILED'
    };
  }
}

async function tryHiddenTabLogin(config) {
  let tabId = null;
  try {
    const loginUrl = `${normalizeBaseUrl(config.baseUrl)}/login/`;
    const tab = await chrome.tabs.create({ url: loginUrl, active: false });
    tabId = tab.id;
    await waitForTabComplete(tabId, 20000);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (username, password) => {
        const findInput = (candidates, type) => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find((input) => {
            const name = String(input.name || '').toLowerCase();
            const id = String(input.id || '').toLowerCase();
            const placeholder = String(input.placeholder || '').toLowerCase();
            if (type && String(input.type || '').toLowerCase() === type) return true;
            return candidates.some((candidate) => name.includes(candidate) || id.includes(candidate) || placeholder.includes(candidate));
          }) || null;
        };

        const usernameInput = findInput(['user', 'email', 'login'], 'email') || findInput(['user', 'email', 'login'], 'text');
        const passwordInput = findInput(['pass'], 'password');
        const form = passwordInput?.form || usernameInput?.form || document.querySelector('form');
        if (!usernameInput || !passwordInput || !form) {
          throw new Error('Login form alanlari bulunamadi.');
        }

        usernameInput.focus();
        usernameInput.value = username;
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
        usernameInput.dispatchEvent(new Event('change', { bubbles: true }));

        passwordInput.focus();
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

        form.submit();
      },
      args: [String(config.username || ''), String(config.password || '')]
    });

    const valid = await waitForSession(config.baseUrl, 15000);
    return valid
      ? { ok: true }
      : { ok: false, error: 'Hidden tab login sonrasi oturum dogrulanamadi.', errorType: 'AUTH_VALIDATION_FAILED' };
  } catch (error) {
    return {
      ok: false,
      error: error.message || String(error),
      errorType: 'LOGIN_FAILED'
    };
  } finally {
    if (typeof tabId === 'number') {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // ignore tab cleanup failures
      }
    }
  }
}

async function waitForSession(baseUrl, timeoutMs) {
  const deadline = Date.now() + Math.max(5000, timeoutMs);
  while (Date.now() < deadline) {
    if (await validateSupersetSession(baseUrl)) return true;
    await sleep(1000);
  }
  return false;
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + Math.max(5000, timeoutMs);
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timer);
      callback(value);
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === 'complete') finish(resolve, true);
    };

    const timer = setTimeout(async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab?.status === 'complete') finish(resolve, true);
        else finish(reject, new Error('Login sekmesi zaman asimina ugradi.'));
      } catch (error) {
        finish(reject, error);
      }
    }, Math.max(5000, deadline - Date.now()));

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

function buildChartPayload(config) {
  const datasourceId = Number(config.datasourceId || SCADA_DEFAULTS.datasourceId);
  const chartSliceId = Number(config.chartSliceId || SCADA_DEFAULTS.chartSliceId);
  const timeRange = String(config.timeRange || SCADA_DEFAULTS.timeRange);
  const elementNames = Array.isArray(config.elementNames) && config.elementNames.length
    ? config.elementNames.map((value) => String(value))
    : [String(config.elementName || SCADA_DEFAULTS.elementName)];
  const kvFilters = Array.isArray(config.kvFilters) && config.kvFilters.length
    ? config.kvFilters.map((value) => String(value))
    : SCADA_DEFAULTS.kvFilters.slice();
  const tearFilters = Array.isArray(config.tearFilters) && config.tearFilters.length
    ? config.tearFilters.map((value) => String(value))
    : SCADA_DEFAULTS.tearFilters.slice();
  const measurementIds = Array.isArray(config.measurementIds) && config.measurementIds.length
    ? config.measurementIds.map((value) => String(value))
    : [];
  const rowLimit = Number(config.rowLimit || SCADA_DEFAULTS.rowLimit);
  const metrics = [
    { label: 'MAX(__time)', expressionType: 'SQL', sqlExpression: 'MAX(__time)' },
    { label: 'AVG(maxValue)', expressionType: 'SQL', sqlExpression: 'AVG(maxValue)' }
  ];
  const columns = ['sinsid', 'b1Name', 'b2Name', 'b3Name', 'elementName'];
  const filters = [];
  const adhocFilters = [];
  if (elementNames.length === 1) {
    filters.push({ col: 'elementName', op: '==', val: elementNames[0] });
    adhocFilters.push({
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'elementName',
      operator: '==',
      comparator: elementNames[0]
    });
  } else if (elementNames.length > 1) {
    filters.push({ col: 'elementName', op: 'IN', val: elementNames.slice() });
    adhocFilters.push({
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'elementName',
      operator: 'IN',
      comparator: elementNames.slice()
    });
  }
  if (measurementIds.length) {
    filters.push({ col: 'sinsid', op: 'IN', val: measurementIds.slice() });
    adhocFilters.push({
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'sinsid',
      operator: 'IN',
      comparator: measurementIds.slice()
    });
  }
  if (kvFilters.length) {
    filters.push({ col: 'b2Name', op: 'IN', val: kvFilters.slice() });
    adhocFilters.push({
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'b2Name',
      operator: 'IN',
      comparator: kvFilters.slice()
    });
  }
  if (tearFilters.length) {
    filters.push({ col: 'tear', op: 'IN', val: tearFilters.slice() });
    adhocFilters.push({
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'tear',
      operator: 'IN',
      comparator: tearFilters.slice()
    });
  }
  const formData = {
    slice_id: chartSliceId,
    viz_type: 'table',
    datasource: `${datasourceId}__table`,
    granularity_sqla: '__time',
    time_range: timeRange,
    groupby: columns.slice(),
    metrics: metrics.slice(),
    adhoc_filters: adhocFilters,
    row_limit: Number.isFinite(rowLimit) && rowLimit > 0 ? rowLimit : SCADA_DEFAULTS.rowLimit,
    order_desc: true
  };
  return {
    datasource: { id: datasourceId, type: 'table' },
    force: true,
    form_data: formData,
    queries: [{
      time_range: timeRange,
      granularity: '__time',
      columns: columns.slice(),
      metrics: metrics.slice(),
      filters,
      orderby: [['MAX(__time)', false]],
      row_limit: Number.isFinite(rowLimit) && rowLimit > 0 ? rowLimit : SCADA_DEFAULTS.rowLimit
    }],
    result_format: 'json',
    result_type: 'full'
  };
}

function buildChartUrl(config) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || SCADA_DEFAULTS.baseUrl);
  const dashboardId = Number(config.dashboardId || SCADA_DEFAULTS.dashboardId);
  return `${baseUrl}/api/v1/chart/data?dashboard_id=${dashboardId}&force=true`;
}

function normalizeBaseUrl(value) {
  return String(value || SCADA_DEFAULTS.baseUrl).replace(/\/+$/, '');
}

async function safeReadText(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleDownloadAndWait(payload) {
  const url = String(payload.url || '').trim();
  if (!url) return { ok: false, reason: 'Indirilecek URL bos.' };

  const filename = sanitizeFilename(payload.filenameHint || '') || undefined;
  const downloadId = await chrome.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: 'uniquify'
  });

  if (typeof downloadId !== 'number') {
    return { ok: false, reason: 'Download API indirme baslatamadi.' };
  }

  const result = await waitForDownloadCompletion(downloadId, Number(payload.timeoutMs) || DOWNLOAD_TIMEOUT_MS);
  return { ok: result.ok, downloadId, ...result };
}

function waitForDownloadCompletion(downloadId, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.downloads.onChanged.removeListener(onChanged);
      resolve(value);
    };

    const timer = setTimeout(async () => {
      try {
        const [item] = await chrome.downloads.search({ id: downloadId });
        if (item?.state === 'complete') {
          finish({ ok: true, state: 'complete', filename: item.filename || '', finalUrl: item.finalUrl || item.url || '' });
        } else {
          finish({ ok: false, reason: 'Indirme zaman asimina ugradi.', state: item?.state || 'timeout' });
        }
      } catch (error) {
        finish({ ok: false, reason: `Indirme dogrulanamadi: ${error.message}` });
      }
    }, Math.max(8000, timeoutMs));

    const onChanged = async (delta) => {
      if (delta.id !== downloadId) return;
      if (delta.error?.current) {
        finish({ ok: false, reason: `Indirme hatasi: ${delta.error.current}`, state: 'interrupted' });
        return;
      }
      if (delta.state?.current === 'complete') {
        const [item] = await chrome.downloads.search({ id: downloadId });
        finish({ ok: true, state: 'complete', filename: item?.filename || '', finalUrl: item?.finalUrl || item?.url || '' });
      }
      if (delta.state?.current === 'interrupted') {
        const [item] = await chrome.downloads.search({ id: downloadId });
        finish({ ok: false, reason: 'Indirme kesildi.', state: item?.state || 'interrupted' });
      }
    };

    chrome.downloads.onChanged.addListener(onChanged);
  });
}

function sanitizeFilename(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/[\\/:*?"<>|]+/g, '_').replace(/^_+/, '').slice(0, 180);
}
