(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_API_CLIENT = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const YKS_BASE_URL = 'https://yks.teias.gov.tr';
  const RGDH_ENDPOINTS = {
    conventional: '/api/rgdh-conventional-busbar-data',
    conventionalUnit: '/api/teias-rgdh-conv-unit-data',
    wind: '/api/rgdh-wind-busbar-data',
    windCsv: '/api/rgdh-wind-busbar-data-csv',
    parameter: '/api/general-parameter-by-name',
    busbars: '/api/busbars'
  };
  const ALLOWED_RGDH_PATHS = Object.values(RGDH_ENDPOINTS);

  function buildUtcDayRangeForIstanbul(localDate) {
    const match = String(localDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new Error('localDate must be YYYY-MM-DD.');
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const start = new Date(Date.UTC(year, month - 1, day, -3, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, 21, 0, 0));
    return {
      startUtc: toIsoNoMs(start),
      endUtc: toIsoNoMs(end)
    };
  }

  function buildLocalDateRange(startDate, endDateExclusive = '') {
    const start = parseLocalDateParts(startDate, 'startDate');
    const endText = String(endDateExclusive || '').trim();
    if (!endText) return [formatLocalDateParts(start)];
    const end = parseLocalDateParts(endText, 'endDateExclusive');
    const dates = [];
    let current = start;
    while (compareLocalDateParts(current, end) < 0) {
      dates.push(formatLocalDateParts(current));
      current = addLocalDays(current, 1);
    }
    if (!dates.length) {
      throw new Error('endDateExclusive must be after startDate.');
    }
    return dates;
  }

  function buildUtcHourRangeForIstanbul(localDate, localHour, durationHours = 1) {
    const hour = Number(localHour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error('localHour must be an integer between 0 and 23.');
    }
    const span = Number(durationHours || 1);
    if (!Number.isInteger(span) || span < 1 || hour + span > 24) {
      throw new Error('durationHours must keep the range inside the local day.');
    }
    const dayRange = buildUtcDayRangeForIstanbul(localDate);
    const start = addHours(new Date(dayRange.startUtc), hour);
    const end = addHours(start, span);
    return {
      startUtc: toIsoNoMs(start),
      endUtc: toIsoNoMs(end)
    };
  }

  function buildRgdhUrl(pathname, params = {}, baseUrl = YKS_BASE_URL) {
    assertAllowedPath(pathname);
    const url = new URL(pathname, normalizeBaseUrl(baseUrl));
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
    return url;
  }

  function parseLastPageFromLinkHeader(header) {
    const raw = String(header || '');
    const lastPart = raw.split(',').find((part) => /rel="?last"?/i.test(part));
    if (!lastPart) return null;
    const pageMatch = lastPart.match(/[?&]page=(\d+)/i);
    return pageMatch ? Number(pageMatch[1]) : null;
  }

  async function fetchAllPages(pathname, params = {}, options = {}) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required.');
    const rows = [];
    const pageSize = Number(params.size || options.size || 2000);
    const maxPages = Number(options.maxPages || 200);
    let page = Number(params.page || 0);
    let lastPage = null;
    let totalCount = null;

    while (page < maxPages) {
      const url = buildRgdhUrl(pathname, { ...params, size: pageSize, page }, options.baseUrl);
      const response = await fetchImpl(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        redirect: 'follow',
        signal: options.signal
      });
      if (!response.ok) {
        const classified = classifyHttpError(response.status);
        let text = '';
        try {
          text = await response.text();
        } catch {}
        const error = new Error(text.slice(0, 300) || classified.message);
        error.httpStatus = response.status;
        error.errorType = classified.errorType;
        throw error;
      }
      const json = await response.json();
      const pageRows = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
      rows.push(...pageRows);

      const headers = response.headers;
      const link = headers?.get?.('link') || headers?.get?.('Link') || '';
      const total = Number(headers?.get?.('x-total-count') || headers?.get?.('X-Total-Count') || NaN);
      if (Number.isFinite(total)) totalCount = total;
      if (lastPage === null) lastPage = parseLastPageFromLinkHeader(link);

      if (lastPage !== null && page >= lastPage) break;
      if (lastPage === null && totalCount !== null && rows.length >= totalCount) break;
      if (!pageRows.length && lastPage === null) break;
      page += 1;
    }

    return rows;
  }

  function buildConventionalDayParams(localDate, extra = {}) {
    const range = buildUtcDayRangeForIstanbul(localDate);
    const normalizedExtra = normalizeBusbarExtra(extra);
    return {
      'measurementDate.greaterOrEqualThan': range.startUtc,
      'measurementDate.lessThan': range.endUtc,
      size: 2000,
      sort: 'measurementDate,asc',
      ...normalizedExtra
    };
  }

  function buildConventionalUnitDayParams(localDate, busbarInternalId, extra = {}) {
    const range = buildUtcDayRangeForIstanbul(localDate);
    return normalizeBusbarExtra({
      'measurementDate.greaterOrEqualThan': range.startUtc,
      'measurementDate.lessThan': range.endUtc,
      busbarInternalId,
      size: 57600,
      sort: 'measurementDate,asc',
      ...extra
    });
  }

  function buildWindDayParams(localDate, busbarInternalId, extra = {}) {
    const params = buildConventionalDayParams(localDate, { size: 60, ...extra });
    if (busbarInternalId !== undefined && busbarInternalId !== null && busbarInternalId !== '') {
      params['busbarId.equals'] = busbarInternalId;
    }
    return params;
  }

  function buildConventionalHourParams(localDate, busbarInternalId, localHour, extra = {}) {
    const range = buildUtcHourRangeForIstanbul(localDate, localHour);
    return normalizeBusbarExtra({
      'measurementDate.greaterOrEqualThan': range.startUtc,
      'measurementDate.lessThan': range.endUtc,
      size: 60,
      page: 0,
      sort: 'measurementDate,asc',
      busbarInternalId,
      ...extra
    });
  }

  function buildWindHourParams(localDate, busbarInternalId, localHour, extra = {}) {
    const range = buildUtcHourRangeForIstanbul(localDate, localHour);
    return normalizeBusbarExtra({
      'measurementDate.greaterOrEqualThan': range.startUtc,
      'measurementDate.lessThan': range.endUtc,
      size: 60,
      page: 0,
      sort: 'measurementDate,asc',
      busbarInternalId,
      ...extra
    });
  }

  function buildWindRangeParams(startUtc, endUtc, busbarInternalId, extra = {}) {
    const params = normalizeBusbarExtra({
      'measurementDate.greaterOrEqualThan': startUtc,
      'measurementDate.lessThan': endUtc,
      size: 60,
      sort: 'measurementDate,asc',
      busbarInternalId,
      ...extra
    });
    delete params.page;
    return params;
  }

  function buildWindChunkParams(localDate, busbarInternalId, localHour, durationHours = 2, extra = {}) {
    let span = durationHours;
    let normalizedExtra = extra;
    if (durationHours && typeof durationHours === 'object') {
      span = durationHours.durationHours || durationHours.spanHours || 2;
      normalizedExtra = { ...durationHours };
      delete normalizedExtra.durationHours;
      delete normalizedExtra.spanHours;
    }
    const range = buildUtcHourRangeForIstanbul(localDate, localHour, span);
    return normalizeBusbarExtra({
      'measurementDate.greaterOrEqualThan': range.startUtc,
      'measurementDate.lessThan': range.endUtc,
      size: 60,
      sort: 'measurementDate,asc',
      busbarInternalId,
      ...normalizedExtra
    });
  }

  function normalizeBusbarExtra(extra = {}) {
    const normalized = { ...(extra || {}) };
    const explicit = firstDefined(normalized['busbarId.equals'], normalized.busbarInternalId);
    delete normalized.busbarInternalId;
    if (explicit !== undefined && explicit !== null && explicit !== '') {
      normalized['busbarId.equals'] = explicit;
    }
    return normalized;
  }

  function buildGeneralParameterParams(localDate, paramName = 'KONVGERTOL') {
    const range = buildUtcDayRangeForIstanbul(localDate);
    return {
      generalParametersMeasurementDate: range.startUtc,
      paramName
    };
  }

  function buildBusbarCatalogParams(sourceType = 'ALL', extra = {}) {
    const selected = String(sourceType || 'ALL').toUpperCase();
    const params = {
      size: 2000,
      sort: 'busbarName,asc'
    };
    if (selected === 'WIND' || selected === 'HYBRID' || selected === 'SOLAR') {
      params['busbarType.in'] = 'WIND,SOLAR,HYBRID';
    } else if (selected === 'CONVENTIONAL') {
      params['busbarType.equals'] = 'CONVENTIONAL';
    }
    return { ...params, ...extra };
  }

  function fetchConventionalDay(localDate, options = {}) {
    return fetchAllPages(RGDH_ENDPOINTS.conventional, buildConventionalDayParams(localDate, options.params), options);
  }

  function fetchWindBusbarDay(localDate, busbarInternalId, options = {}) {
    return fetchAllPages(RGDH_ENDPOINTS.wind, buildWindDayParams(localDate, busbarInternalId, options.params), options);
  }

  function fetchBusbarCatalog(sourceType = 'ALL', options = {}) {
    return fetchAllPages(RGDH_ENDPOINTS.busbars, buildBusbarCatalogParams(sourceType, options.params), options);
  }

  async function fetchGeneralParameter(localDate, paramName = 'KONVGERTOL', options = {}) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    const url = buildRgdhUrl(RGDH_ENDPOINTS.parameter, buildGeneralParameterParams(localDate, paramName), options.baseUrl);
    const response = await fetchImpl(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
      signal: options.signal
    });
    if (!response.ok) {
      const classified = classifyHttpError(response.status);
      const error = new Error(classified.message);
      error.httpStatus = response.status;
      error.errorType = classified.errorType;
      throw error;
    }
    return response.json();
  }

  function classifyHttpError(status) {
    const code = Number(status);
    if (code === 401 || code === 403) {
      return { errorType: 'AUTH_REQUIRED', message: `YKS oturum hatasi (${code}).` };
    }
    if (code >= 500) {
      return { errorType: 'UPSTREAM_ERROR', message: `YKS endpoint hata dondurdu (${code}).` };
    }
    if (code === 408 || code === 429) {
      return { errorType: 'RETRYABLE', message: `YKS gecici hata dondurdu (${code}).` };
    }
    return { errorType: 'NETWORK_ERROR', message: `YKS istegi basarisiz (${code}).` };
  }

  function assertAllowedPath(pathname) {
    if (!ALLOWED_RGDH_PATHS.includes(String(pathname))) {
      throw new Error(`RGDH endpoint not allowed: ${pathname}`);
    }
  }

  function normalizeBaseUrl(value) {
    return String(value || YKS_BASE_URL).replace(/\/+$/, '');
  }

  function toIsoNoMs(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  function addHours(date, hours) {
    return new Date(date.getTime() + (Number(hours) * 60 * 60 * 1000));
  }

  function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
  }

  function parseLocalDateParts(value, name) {
    const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new Error(`${name} must be YYYY-MM-DD.`);
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3])
    };
  }

  function formatLocalDateParts(parts) {
    return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  }

  function addLocalDays(parts, days) {
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Number(days || 0)));
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate()
    };
  }

  function compareLocalDateParts(left, right) {
    const l = (left.year * 10000) + (left.month * 100) + left.day;
    const r = (right.year * 10000) + (right.month * 100) + right.day;
    return l === r ? 0 : (l < r ? -1 : 1);
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  return {
    YKS_BASE_URL,
    RGDH_ENDPOINTS,
    ALLOWED_RGDH_PATHS,
    buildUtcDayRangeForIstanbul,
    buildLocalDateRange,
    buildUtcHourRangeForIstanbul,
    buildRgdhUrl,
    parseLastPageFromLinkHeader,
    fetchAllPages,
    buildConventionalDayParams,
    buildConventionalUnitDayParams,
    buildWindDayParams,
    buildConventionalHourParams,
    buildWindHourParams,
    buildWindRangeParams,
    buildWindChunkParams,
    buildGeneralParameterParams,
    buildBusbarCatalogParams,
    fetchConventionalDay,
    fetchWindBusbarDay,
    fetchBusbarCatalog,
    fetchGeneralParameter,
    classifyHttpError
  };
});
