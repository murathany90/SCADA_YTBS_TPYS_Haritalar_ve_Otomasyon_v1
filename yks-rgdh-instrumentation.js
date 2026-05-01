(function () {
  if (window.__rgdhYksInstrumentationLoaded) return;
  window.__rgdhYksInstrumentationLoaded = true;

  const TARGET_ROUTES = [
    'rgdh-conventional-busbar-data',
    'rgdh-wind-busbar-data',
    'analogchart-busbar-data',
    'rgdh-busbar-participant',
    'teias-rgdh-conv-unit-data'
  ];
  const TARGET_API_PATHS = [
    '/api/rgdh-conventional-busbar-data',
    '/api/rgdh-wind-busbar-data',
    '/api/rgdh-wind-busbar-data-csv',
    '/api/rgdh-busbar-participant',
    '/api/rgdh-busbar-participants',
    '/api/teias-rgdh-conv-unit-data',
    '/api/general-parameter-by-name',
    '/api/busbars'
  ];
  const SENSITIVE_KEYS = /authorization|cookie|token|jwt|session|password|credential/i;
  const MAX_BUFFERED_EVENTS = 500;
  const MAX_PREVIEW_LENGTH = 4000;

  window.__rgdhYksDiagnosticBuffer = Array.isArray(window.__rgdhYksDiagnosticBuffer)
    ? window.__rgdhYksDiagnosticBuffer
    : [];
  let bridgeReady = false;

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY') return;
    bridgeReady = true;
    flushBuffer();
  }, true);

  emit('info', 'route', 'RGDH YKS instrumentation basladi.', { route: currentRoute() });
  emitRoute();
  window.addEventListener('hashchange', emitRoute, true);
  window.addEventListener('popstate', emitRoute, true);
  window.addEventListener('pageshow', emitRoute, true);
  window.addEventListener('error', (event) => {
    if (!isTargetRouteActive()) return;
    emit('error', 'runtime', event.message || 'YKS runtime hatasi', {
      route: currentRoute(),
      detail: {
        filename: event.filename || '',
        lineno: event.lineno || '',
        colno: event.colno || ''
      }
    });
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    if (!isTargetRouteActive()) return;
    emit('error', 'runtime', formatArg(event.reason || 'Unhandled promise rejection'), { route: currentRoute() });
  }, true);

  patchConsole();
  patchFetch();
  patchXhr();

  function patchConsole() {
    ['debug', 'info', 'log', 'warn', 'error'].forEach((name) => {
      const original = console[name];
      if (typeof original !== 'function') return;
      console[name] = function (...args) {
        try {
          if (isTargetRouteActive()) {
            emit(name === 'log' ? 'info' : name, 'console', args.map(formatArg).join(' '), { route: currentRoute() });
          }
        } catch {}
        return original.apply(this, args);
      };
    });
  }

  function patchFetch() {
    const originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;
    window.fetch = async function (input, init) {
      const url = requestUrl(input);
      const shouldLog = shouldLogNetworkUrl(url);
      const started = Date.now();
      const method = requestMethod(input, init);
      let requestHeaders = {};
      if (shouldLog) requestHeaders = readRequestHeaders(input, init);
      try {
        const response = await originalFetch.apply(this, arguments);
        if (shouldLog) {
          const summary = await summarizeFetchResponse(response);
          emit(response.ok ? 'info' : 'error', 'network', `${method} ${safeUrl(url)} -> ${response.status}`, {
            route: currentRoute() || routeFromUrl(url),
            method,
            url,
            status: response.status,
            durationMs: Date.now() - started,
            requestHeaders,
            responseHeaders: summary.responseHeaders,
            responsePreview: summary.responsePreview,
            responseRowCount: summary.responseRowCount,
            responseTotalCount: summary.responseTotalCount,
            responseLink: summary.responseLink,
            responseKeys: summary.responseKeys
          });
        }
        return response;
      } catch (error) {
        if (shouldLog) {
          emit('error', 'network', error && error.message ? error.message : String(error), {
            route: currentRoute() || routeFromUrl(url),
            method,
            url,
            durationMs: Date.now() - started,
            requestHeaders
          });
        }
        throw error;
      }
    };
  }

  function patchXhr() {
    const Xhr = window.XMLHttpRequest;
    if (!Xhr || !Xhr.prototype) return;
    const originalOpen = Xhr.prototype.open;
    const originalSend = Xhr.prototype.send;
    const originalSetRequestHeader = Xhr.prototype.setRequestHeader;

    Xhr.prototype.open = function (method, url) {
      this.__rgdhDiag = {
        method: String(method || 'GET').toUpperCase(),
        url: new URL(String(url || ''), location.href).toString(),
        requestHeaders: {},
        started: 0
      };
      return originalOpen.apply(this, arguments);
    };

    Xhr.prototype.setRequestHeader = function (key, value) {
      if (this.__rgdhDiag) this.__rgdhDiag.requestHeaders[key] = value;
      return originalSetRequestHeader.apply(this, arguments);
    };

    Xhr.prototype.send = function () {
      const diag = this.__rgdhDiag;
      const shouldLog = diag && shouldLogNetworkUrl(diag.url);
      if (diag) diag.started = Date.now();
      if (shouldLog) {
        this.addEventListener('loadend', () => {
          const responseHeaders = parseRawHeaders(this.getAllResponseHeaders());
          const summary = summarizeTextResponse(this.responseText || '', responseHeaders);
          emit(this.status >= 200 && this.status < 400 ? 'info' : 'error', 'network', `${diag.method} ${safeUrl(diag.url)} -> ${this.status}`, {
            route: currentRoute() || routeFromUrl(diag.url),
            method: diag.method,
            url: diag.url,
            status: this.status,
            durationMs: Date.now() - diag.started,
            requestHeaders: diag.requestHeaders,
            responseHeaders,
            responsePreview: summary.responsePreview,
            responseRowCount: summary.responseRowCount,
            responseTotalCount: summary.responseTotalCount,
            responseLink: summary.responseLink,
            responseKeys: summary.responseKeys
          });
        }, { once: true });
      }
      return originalSend.apply(this, arguments);
    };
  }

  async function summarizeFetchResponse(response) {
    const responseHeaders = headersObject(response?.headers);
    let responsePreview = '';
    let parsed = undefined;
    try {
      const clone = response.clone();
      parsed = await clone.json();
      responsePreview = JSON.stringify(parsed);
    } catch {
      try {
        responsePreview = await response.clone().text();
        parsed = tryParseJson(responsePreview);
      } catch {
        responsePreview = '';
      }
    }
    const summary = summarizeParsedBody(parsed);
    return {
      responseHeaders,
      responsePreview: sanitizeText(responsePreview).slice(0, MAX_PREVIEW_LENGTH),
      responseRowCount: summary.responseRowCount,
      responseTotalCount: headerNumber(responseHeaders, 'x-total-count'),
      responseLink: headerValue(responseHeaders, 'link'),
      responseKeys: summary.responseKeys
    };
  }

  function summarizeTextResponse(text, responseHeaders = {}) {
    const parsed = tryParseJson(text);
    const summary = summarizeParsedBody(parsed);
    return {
      responsePreview: sanitizeText(text).slice(0, MAX_PREVIEW_LENGTH),
      responseRowCount: summary.responseRowCount,
      responseTotalCount: headerNumber(responseHeaders, 'x-total-count'),
      responseLink: headerValue(responseHeaders, 'link'),
      responseKeys: summary.responseKeys
    };
  }

  function summarizeParsedBody(parsed) {
    if (Array.isArray(parsed)) return { responseRowCount: parsed.length, responseKeys: [] };
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed).filter((key) => !SENSITIVE_KEYS.test(key)).slice(0, 40);
      const arrayValue = ['data', 'items', 'content', 'rows'].map((key) => parsed[key]).find(Array.isArray);
      return { responseRowCount: Array.isArray(arrayValue) ? arrayValue.length : null, responseKeys: keys };
    }
    return { responseRowCount: null, responseKeys: [] };
  }

  function tryParseJson(text) {
    try {
      return JSON.parse(String(text || ''));
    } catch {
      return undefined;
    }
  }

  function emitRoute() {
    const route = currentRoute();
    if (route && TARGET_ROUTES.includes(route)) {
      emit('info', 'route', `YKS route aktif: ${route}`, { route, url: location.href });
    }
  }

  function emit(level, category, message, detail = {}) {
    const event = {
      time: new Date().toISOString(),
      level,
      category,
      route: detail.route || currentRoute(),
      method: detail.method,
      url: detail.url ? safeUrl(detail.url) : '',
      status: detail.status,
      durationMs: detail.durationMs,
      requestHeaders: sanitizeHeaders(detail.requestHeaders),
      responseHeaders: sanitizeHeaders(detail.responseHeaders),
      responsePreview: sanitizeText(detail.responsePreview || '').slice(0, MAX_PREVIEW_LENGTH),
      responseRowCount: detail.responseRowCount === undefined ? null : detail.responseRowCount,
      responseTotalCount: detail.responseTotalCount === undefined ? null : detail.responseTotalCount,
      responseLink: sanitizeText(detail.responseLink || '').slice(0, 1000),
      responseKeys: Array.isArray(detail.responseKeys) ? detail.responseKeys.slice(0, 40) : [],
      message: sanitizeText(message),
      detail: sanitizeDetail(detail)
    };
    if (bridgeReady) {
      postDiagnostic(event);
      return;
    }
    window.__rgdhYksDiagnosticBuffer.push(event);
    if (window.__rgdhYksDiagnosticBuffer.length > MAX_BUFFERED_EVENTS) {
      window.__rgdhYksDiagnosticBuffer.splice(0, window.__rgdhYksDiagnosticBuffer.length - MAX_BUFFERED_EVENTS);
    }
  }

  function flushBuffer() {
    const buffer = window.__rgdhYksDiagnosticBuffer;
    while (buffer.length) postDiagnostic(buffer.shift());
  }

  function postDiagnostic(event) {
    window.postMessage({ source: 'RGDH_YKS_DIAGNOSTIC', event }, window.location.origin || '*');
  }

  function currentRoute() {
    return routeFromUrl(location.href);
  }

  function routeFromUrl(value) {
    const raw = String(value || '');
    const hashMatch = raw.match(/#\/([^?&#]+)/);
    if (hashMatch) return hashMatch[1].replace(/^\/+/, '').split('/')[0];
    try {
      const url = new URL(raw, location.href);
      const apiPath = TARGET_API_PATHS.find((path) => url.pathname === path);
      return apiPath ? apiPath.replace(/^\/api\//, '').replace(/-csv$/, '') : '';
    } catch {
      return '';
    }
  }

  function isTargetRouteActive() {
    return TARGET_ROUTES.includes(currentRoute());
  }

  function shouldLogNetworkUrl(value) {
    return isTargetApiUrl(value) || (isTargetRouteActive() && isYksApiUrl(value));
  }

  function isTargetApiUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      return url.hostname === 'yks.teias.gov.tr' && TARGET_API_PATHS.includes(url.pathname);
    } catch {
      return false;
    }
  }

  function isYksApiUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      return url.hostname === 'yks.teias.gov.tr' && url.pathname.startsWith('/api/');
    } catch {
      return false;
    }
  }

  function requestUrl(input) {
    if (typeof input === 'string') return new URL(input, location.href).toString();
    if (input && typeof input.url === 'string') return new URL(input.url, location.href).toString();
    return String(input || '');
  }

  function requestMethod(input, init) {
    return String(init && init.method || input && input.method || 'GET').toUpperCase();
  }

  function readRequestHeaders(input, init) {
    return {
      ...headersObject(input && input.headers),
      ...headersObject(init && init.headers)
    };
  }

  function headersObject(headers) {
    const result = {};
    if (!headers) return result;
    try {
      if (typeof headers.entries === 'function') {
        Array.from(headers.entries()).forEach(([key, value]) => { result[key] = value; });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => { result[key] = value; });
      } else if (typeof headers === 'object') {
        Object.assign(result, headers);
      }
    } catch {}
    return sanitizeHeaders(result);
  }

  function parseRawHeaders(raw) {
    const result = {};
    String(raw || '').split(/\r?\n/).forEach((line) => {
      const index = line.indexOf(':');
      if (index <= 0) return;
      result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    });
    return sanitizeHeaders(result);
  }

  function headerValue(headers, name) {
    const expected = String(name || '').toLowerCase();
    const entry = Object.entries(headers || {}).find(([key]) => String(key || '').toLowerCase() === expected);
    return entry ? sanitizeText(entry[1]).slice(0, 1000) : '';
  }

  function headerNumber(headers, name) {
    const value = Number(headerValue(headers, name));
    return Number.isFinite(value) ? value : null;
  }

  function sanitizeHeaders(headers) {
    const result = {};
    Object.entries(headers || {}).forEach(([key, value]) => {
      result[key] = SENSITIVE_KEYS.test(key) ? '[redacted]' : sanitizeText(value).slice(0, 300);
    });
    return result;
  }

  function sanitizeDetail(detail) {
    const result = {};
    Object.entries(detail || {}).forEach(([key, value]) => {
      if (key === 'requestHeaders') result[key] = sanitizeHeaders(value);
      else if (key === 'responseHeaders') result[key] = sanitizeHeaders(value);
      else if (key === 'url') result[key] = safeUrl(value);
      else if (key === 'responsePreview') result[key] = sanitizeText(value).slice(0, MAX_PREVIEW_LENGTH);
      else if (Array.isArray(value)) result[key] = value.map((item) => sanitizeText(item)).slice(0, 40);
      else if (value && typeof value === 'object') result[key] = sanitizeNestedObject(value, 0);
      else result[key] = sanitizeText(value);
    });
    return result;
  }

  function sanitizeNestedObject(input, depth) {
    if (!input || typeof input !== 'object' || depth > 3) return {};
    const result = Array.isArray(input) ? [] : {};
    Object.entries(input).forEach(([key, value]) => {
      if (SENSITIVE_KEYS.test(key)) result[key] = '[redacted]';
      else if (value && typeof value === 'object') result[key] = sanitizeNestedObject(value, depth + 1);
      else result[key] = sanitizeText(value);
    });
    return result;
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      Array.from(url.searchParams.keys()).forEach((key) => {
        if (SENSITIVE_KEYS.test(key)) url.searchParams.set(key, '[redacted]');
      });
      return url.toString().replace(/%5Bredacted%5D/gi, '[redacted]').slice(0, 1000);
    } catch {
      return sanitizeText(value).slice(0, 300);
    }
  }

  function sanitizeText(value) {
    return String(value ?? '')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
      .replace(/(authorization|cookie|token|jwt|session|password)["':=\s]+[A-Za-z0-9._-]+/gi, '$1 [redacted]')
      .replace(/([?&](?:access_token|id_token|token|jwt|session)=)[^&\s]+/gi, '$1[redacted]')
      .slice(0, 1000);
  }

  function formatArg(value) {
    if (typeof value === 'string') return sanitizeText(value);
    try {
      return sanitizeText(JSON.stringify(value));
    } catch {
      return sanitizeText(String(value));
    }
  }
})();
