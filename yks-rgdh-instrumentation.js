(function () {
  if (window.__rgdhYksInstrumentationLoaded) return;
  window.__rgdhYksInstrumentationLoaded = true;

  const TARGET_ROUTES = [
    'rgdh-conventional-busbar-data',
    'rgdh-wind-busbar-data',
    'analogchart-busbar-data',
    'rgdh-busbar-participant'
  ];
  const TARGET_API_PATHS = [
    '/api/rgdh-conventional-busbar-data',
    '/api/rgdh-wind-busbar-data',
    '/api/general-parameter-by-name',
    '/api/busbars'
  ];
  const SENSITIVE_KEYS = /authorization|cookie|token|jwt|session|password|credential/i;

  emit('info', 'route', 'RGDH YKS instrumentation basladi.', { route: currentRoute() });
  emitRoute();
  window.addEventListener('hashchange', emitRoute, true);
  window.addEventListener('popstate', emitRoute, true);
  window.addEventListener('pageshow', emitRoute, true);

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
      const shouldLog = isTargetApiUrl(url) || isTargetRouteActive();
      const started = Date.now();
      let requestHeaders = {};
      if (shouldLog) requestHeaders = readRequestHeaders(input, init);
      try {
        const response = await originalFetch.apply(this, arguments);
        if (shouldLog) {
          emit(response.ok ? 'info' : 'error', 'network', `${requestMethod(input, init)} ${safeUrl(url)} -> ${response.status}`, {
            route: currentRoute() || routeFromUrl(url),
            method: requestMethod(input, init),
            url,
            status: response.status,
            durationMs: Date.now() - started,
            requestHeaders,
            responseHeaders: headersObject(response.headers)
          });
        }
        return response;
      } catch (error) {
        if (shouldLog) {
          emit('error', 'network', error && error.message ? error.message : String(error), {
            route: currentRoute() || routeFromUrl(url),
            method: requestMethod(input, init),
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
      const shouldLog = diag && (isTargetApiUrl(diag.url) || isTargetRouteActive());
      if (diag) diag.started = Date.now();
      if (shouldLog) {
        this.addEventListener('loadend', () => {
          emit(this.status >= 200 && this.status < 400 ? 'info' : 'error', 'network', `${diag.method} ${safeUrl(diag.url)} -> ${this.status}`, {
            route: currentRoute() || routeFromUrl(diag.url),
            method: diag.method,
            url: diag.url,
            status: this.status,
            durationMs: Date.now() - diag.started,
            requestHeaders: diag.requestHeaders,
            responseHeaders: parseRawHeaders(this.getAllResponseHeaders())
          });
        }, { once: true });
      }
      return originalSend.apply(this, arguments);
    };
  }

  function emitRoute() {
    const route = currentRoute();
    if (route && TARGET_ROUTES.includes(route)) {
      emit('info', 'route', `YKS route aktif: ${route}`, { route, url: location.href });
    }
  }

  function emit(level, category, message, detail) {
    window.postMessage({
      source: 'RGDH_YKS_DIAGNOSTIC',
      event: {
        time: new Date().toISOString(),
        level,
        category,
        route: detail && detail.route ? detail.route : currentRoute(),
        method: detail && detail.method,
        url: detail && detail.url,
        status: detail && detail.status,
        durationMs: detail && detail.durationMs,
        requestHeaders: sanitizeHeaders(detail && detail.requestHeaders),
        responseHeaders: sanitizeHeaders(detail && detail.responseHeaders),
        message,
        detail
      }
    }, window.location.origin);
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
      return apiPath ? apiPath.replace(/^\/api\//, '') : '';
    } catch {
      return '';
    }
  }

  function isTargetRouteActive() {
    return TARGET_ROUTES.includes(currentRoute());
  }

  function isTargetApiUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      return url.hostname === 'yks.teias.gov.tr' && TARGET_API_PATHS.includes(url.pathname);
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

  function sanitizeHeaders(headers) {
    const result = {};
    Object.entries(headers || {}).forEach(([key, value]) => {
      result[key] = SENSITIVE_KEYS.test(key) ? '[redacted]' : sanitizeText(value).slice(0, 300);
    });
    return result;
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      Array.from(url.searchParams.keys()).forEach((key) => {
        if (SENSITIVE_KEYS.test(key)) url.searchParams.set(key, '[redacted]');
      });
      return `${url.pathname}${url.search}`;
    } catch {
      return sanitizeText(value).slice(0, 300);
    }
  }

  function sanitizeText(value) {
    return String(value ?? '')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
      .replace(/(authorization|cookie|token|jwt|session)["':=\s]+[A-Za-z0-9._-]+/gi, '$1 [redacted]')
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
