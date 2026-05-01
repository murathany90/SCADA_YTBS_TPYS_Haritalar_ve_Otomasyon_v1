(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_DIAGNOSTICS = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const SENSITIVE_KEYS = /authorization|cookie|token|jwt|session|password|credential/i;
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

  function routeFromUrl(value) {
    const raw = String(value || '');
    const hashMatch = raw.match(/#\/([^?&#]+)/);
    if (hashMatch) {
      const route = hashMatch[1].replace(/^\/+/, '').split('/')[0];
      return TARGET_ROUTES.includes(route) ? route : route;
    }
    try {
      const url = new URL(raw, 'https://yks.teias.gov.tr');
      const apiPath = TARGET_API_PATHS.find((path) => url.pathname === path);
      if (apiPath) return apiPath.replace(/^\/api\//, '').replace(/-csv$/, '');
    } catch {}
    return '';
  }

  function isTargetYksRoute(value) {
    return TARGET_ROUTES.includes(routeFromUrl(value));
  }

  function isTargetApiUrl(value) {
    try {
      const url = new URL(String(value || ''), 'https://yks.teias.gov.tr');
      return url.hostname === 'yks.teias.gov.tr' && TARGET_API_PATHS.includes(url.pathname);
    } catch {
      return false;
    }
  }

  function sanitizeDiagnosticEvent(input) {
    const event = input && typeof input === 'object' ? input : {};
    return {
      id: stringValue(event.id || createEventId()),
      time: stringValue(event.time || new Date().toISOString()),
      level: safeLevel(event.level),
      category: stringValue(event.category || 'runtime').slice(0, 40),
      route: stringValue(event.route || routeFromUrl(event.url || '')).slice(0, 80),
      method: stringValue(event.method || '').slice(0, 12),
      url: sanitizeUrl(event.url || ''),
      status: nullableNumber(event.status),
      durationMs: nullableNumber(event.durationMs),
      requestHeaders: sanitizeHeaders(event.requestHeaders),
      responseHeaders: sanitizeHeaders(event.responseHeaders),
      responsePreview: sanitizeMessage(event.responsePreview || '').slice(0, 4000),
      responseRowCount: nullableNumber(event.responseRowCount),
      responseTotalCount: nullableNumber(event.responseTotalCount),
      responseLink: sanitizeMessage(event.responseLink || '').slice(0, 1000),
      responseKeys: normalizeStringArray(event.responseKeys, 40),
      message: sanitizeMessage(event.message || ''),
      detail: sanitizeDetail(event.detail)
    };
  }

  function pushBoundedEvent(events, event, limit) {
    const max = Math.max(1, Number(limit || 500));
    const next = [sanitizeDiagnosticEvent(event), ...(Array.isArray(events) ? events : [])];
    return next.slice(0, max);
  }

  function legacyDiagnosticEventsToCsv(events) {
    const headers = ['Zaman', 'Seviye', 'Kategori', 'Route', 'Metot', 'URL', 'HTTP', 'Süre(ms)', 'Mesaj', 'Detay'];
    const lines = [headers.join(';')];
    (events || []).forEach((event) => {
      const safe = sanitizeDiagnosticEvent(event);
      lines.push([
        safe.time,
        safe.level,
        safe.category,
        safe.route,
        safe.method,
        safe.url,
        safe.status ?? '',
        safe.durationMs ?? '',
        safe.message,
        JSON.stringify({
          requestHeaders: safe.requestHeaders,
          responseHeaders: safe.responseHeaders,
          detail: safe.detail
        })
      ].map(csvCell).join(';'));
    });
    return `\uFEFF${lines.join('\n')}`;
  }

  function diagnosticEventsToCsv(events) {
    const extraHeaders = ['Job ID', 'Kaynak Tipi', 'Secili Bara ID', 'YKS Ic Bara ID', 'Saat Baslangic', 'Saat Bitis', 'Chunk Baslangic', 'Chunk Bitis', 'Fallback Phase', 'Hata Sinifi', 'Istek URL', 'API Satir', 'Metrik Bos Satir'];
    const headers = ['Zaman', 'Seviye', 'Kategori', 'Route', 'Metot', 'URL', 'HTTP', 'Süre(ms)', 'Mesaj', 'Request Headers', 'Response Headers', 'Response Preview', 'Response Row Count', 'Response Total Count', 'Response Link', 'Response Keys', ...extraHeaders];
    const lines = [headers.join(';')];
    (events || []).forEach((event) => {
      const safe = sanitizeDiagnosticEvent(event);
      const detail = safe.detail || {};
      lines.push([
        safe.time,
        safe.level,
        safe.category,
        safe.route,
        safe.method,
        safe.url,
        safe.status ?? '',
        safe.durationMs ?? '',
        safe.message,
        JSON.stringify(safe.requestHeaders || {}),
        JSON.stringify(safe.responseHeaders || {}),
        safe.responsePreview || '',
        safe.responseRowCount ?? '',
        safe.responseTotalCount ?? '',
        safe.responseLink || '',
        (safe.responseKeys || []).join(','),
        detail.jobId || '',
        detail.sourceType || detail.source || '',
        detail.displayBusbarId || detail.busbarId || '',
        detail.internalBusbarId || firstArrayValue(detail.busbarInternalIds) || '',
        detail.hourStart || '',
        detail.hourEnd || '',
        detail.chunkStart || '',
        detail.chunkEnd || '',
        detail.fallbackPhase || '',
        detail.errorClass || detail.errorType || '',
        detail.requestUrl || safe.url || '',
        detail.apiRows || detail.rowCount || '',
        detail.metricEmptyRows || ''
      ].map(csvCell).join(';'));
    });
    return `\uFEFF${lines.join('\n')}`;
  }

  function firstArrayValue(value) {
    return Array.isArray(value) && value.length ? value[0] : '';
  }

  function sanitizeHeaders(headers) {
    const result = {};
    const entries = headersToEntries(headers);
    entries.forEach(([key, value]) => {
      const cleanKey = stringValue(key).slice(0, 80);
      if (!cleanKey) return;
      result[cleanKey] = SENSITIVE_KEYS.test(cleanKey)
        ? '[redacted]'
        : sanitizeMessage(value).slice(0, 300);
    });
    return result;
  }

  function headersToEntries(headers) {
    if (!headers) return [];
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
      return Array.from(headers.entries());
    }
    if (typeof headers.entries === 'function') {
      try { return Array.from(headers.entries()); } catch {}
    }
    if (Array.isArray(headers)) return headers;
    if (typeof headers === 'object') return Object.entries(headers);
    return [];
  }

  function sanitizeUrl(value) {
    const raw = stringValue(value);
    if (!raw) return '';
    try {
      const url = new URL(raw, 'https://yks.teias.gov.tr');
      Array.from(url.searchParams.keys()).forEach((key) => {
        if (SENSITIVE_KEYS.test(key)) url.searchParams.set(key, '[redacted]');
      });
      return url.toString().replace(/%5Bredacted%5D/gi, '[redacted]').slice(0, 1000);
    } catch {
      return sanitizeMessage(raw).slice(0, 1000);
    }
  }

  function sanitizeMessage(value) {
    return stringValue(value)
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
      .replace(/(authorization|cookie|token|jwt|session)["':=\s]+[A-Za-z0-9._-]+/gi, '$1 [redacted]')
      .replace(/([?&](?:access_token|id_token|token|jwt|session)=)[^&\s]+/gi, '$1[redacted]')
      .slice(0, 1000);
  }

  function sanitizeDetail(detail) {
    if (!detail || typeof detail !== 'object') return {};
    return sanitizeObject(detail, 0);
  }

  function sanitizeObject(input, depth) {
    if (!input || typeof input !== 'object' || depth > 4) return {};
    const safe = Array.isArray(input) ? [] : {};
    Object.entries(input).forEach(([key, value]) => {
      const cleanKey = stringValue(key).slice(0, 80);
      if (!cleanKey) return;
      if (SENSITIVE_KEYS.test(cleanKey)) {
        safe[cleanKey] = '[redacted]';
      } else if (value && typeof value === 'object') {
        safe[cleanKey] = sanitizeObject(value, depth + 1);
      } else {
        safe[cleanKey] = sanitizeMessage(value);
      }
    });
    return safe;
  }

  function csvCell(value) {
    const text = sanitizeMessage(value ?? '');
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function safeLevel(value) {
    const level = stringValue(value || 'info').toLowerCase();
    return ['debug', 'info', 'success', 'warn', 'error'].includes(level) ? level : 'info';
  }

  function nullableNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function normalizeStringArray(value, limit) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => stringValue(item).slice(0, 80))
      .filter((item) => item && !SENSITIVE_KEYS.test(item))
      .slice(0, limit || 20);
  }

  function stringValue(value) {
    return String(value ?? '').trim();
  }

  function createEventId() {
    return `rgdh-diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return {
    TARGET_ROUTES,
    TARGET_API_PATHS,
    routeFromUrl,
    isTargetYksRoute,
    isTargetApiUrl,
    sanitizeDiagnosticEvent,
    pushBoundedEvent,
    diagnosticEventsToCsv,
    sanitizeHeaders,
    sanitizeMessage,
    sanitizeUrl
  };
});
