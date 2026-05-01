const DOWNLOAD_TIMEOUT_MS = 45000;
const SCADA_FETCH_TIMEOUT_MS = 25000;
const CSRF_CACHE_TTL_MS = 5 * 60 * 1000;
const SCADA_AUTH_CONFIG_PATH = 'data/scada_auth.json';
try {
  if (typeof importScripts === 'function') importScripts('rgdh-api-client.js');
} catch (error) {
  console.warn('[RGDH] API client yuklenemedi.', error?.message || error);
}
try {
  if (typeof importScripts === 'function') importScripts('rgdh-diagnostics.js');
} catch (error) {
  console.warn('[RGDH] Diagnostics yuklenemedi.', error?.message || error);
}

const RGDH_YKS_ORIGIN = 'https://yks.teias.gov.tr';
const RGDH_PAGE_FETCH_TIMEOUT_MS = 60000;
const RGDH_JOB_TIMEOUT_MS = 60000;
const RGDH_HYBRID_JOB_TIMEOUT_MS = 180000;
const RGDH_MAX_JOB_TIMEOUT_MS = 180000;
const RGDH_HOUR_TIMEOUT_MS = 10000;
const RGDH_PREFLIGHT_TIMEOUT_MS = 10000;
const RGDH_HOUR_CONCURRENCY = 6;
const RGDH_HYBRID_WIND_HOUR_TIMEOUT_MS = 20000;
const RGDH_HYBRID_WIND_HOUR_CONCURRENCY = 2;
const RGDH_HYBRID_WIND_PROBE_TIMEOUT_MS = 20000;
const RGDH_HYBRID_WIND_PROBE_HOURS = [11, 12, 0];
const RGDH_WIND_CHUNK_TIMEOUT_MS = 12000;
const RGDH_WIND_CHUNK_CONCURRENCY = 3;
const RGDH_WIND_CHUNK_SPAN_HOURS = 2;
const RGDH_CATALOG_TARGETED_SIZE = 50;
const RGDH_CATALOG_FALLBACK_MAX_PAGES = 5;
const RGDH_FETCH_ROW_KINDS = ['conventionalRows', 'windRows', 'domRows'];
const RGDH_ALLOWED_PATHS = [
  '/api/rgdh-conventional-busbar-data',
  '/api/rgdh-wind-busbar-data',
  '/api/general-parameter-by-name',
  '/api/busbars'
];
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
let rgdhDiagnosticEvents = [];
const RGDH_DIAGNOSTIC_LIMIT = 1000;
const rgdhFetchJobs = new Map();
let rgdhFetchJobSeq = 0;
const rgdhBusbarInternalIdCache = new Map();
let rgdhLastInternalIdResolution = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'DOWNLOAD_URL_AND_WAIT') {
    handleDownloadAndWait(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message || String(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_FETCH') {
    handleRgdhFetch(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_FETCH_START') {
    handleRgdhFetchStart(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_FETCH_STATUS') {
    handleRgdhFetchStatus(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_FETCH_ROWS') {
    handleRgdhFetchRows(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_FETCH_CANCEL') {
    handleRgdhFetchCancel(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_DIAG_EVENT') {
    handleRgdhDiagnosticEvent(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_DIAG_LIST') {
    handleRgdhDiagnosticList(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_DIAG_CLEAR') {
    handleRgdhDiagnosticClear().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_DIAG_CSV') {
    handleRgdhDiagnosticCsv().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_PAGE_FETCH') {
    handleRgdhPageFetch(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
    });
    return true;
  }
  if (message?.type === 'RGDH_DOM_SCRAPE') {
    handleRgdhDomScrape(message.payload || {}).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, ...sanitizeRgdhBackgroundError(error) });
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

async function handleRgdhDiagnosticEvent(payload) {
  const diag = getRgdhDiagnostics();
  const event = diag.sanitizeDiagnosticEvent(payload);
  rgdhDiagnosticEvents = diag.pushBoundedEvent(rgdhDiagnosticEvents, event, RGDH_DIAGNOSTIC_LIMIT);
  return { ok: true, event };
}

async function handleRgdhDiagnosticList(payload = {}) {
  const limit = Math.max(1, Number(payload.limit || RGDH_DIAGNOSTIC_LIMIT));
  return {
    ok: true,
    events: rgdhDiagnosticEvents.slice(0, limit),
    total: rgdhDiagnosticEvents.length
  };
}

async function handleRgdhDiagnosticClear() {
  rgdhDiagnosticEvents = [];
  return { ok: true, events: [] };
}

async function handleRgdhDiagnosticCsv() {
  const diag = getRgdhDiagnostics();
  return {
    ok: true,
    csv: diag.diagnosticEventsToCsv(rgdhDiagnosticEvents),
    filename: `RGDH_HATA_DETAYLARI_${new Date().toISOString().slice(0, 10)}.csv`
  };
}

async function handleRgdhFetchStart(payload) {
  const jobId = `rgdh-job-${Date.now()}-${++rgdhFetchJobSeq}`;
  const effectivePayload = {
    ...(payload || {}),
    jobTimeoutMs: normalizeRgdhJobTimeoutMs(payload?.jobTimeoutMs, payload)
  };
  const job = {
    jobId,
    ok: true,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: '',
    payload: sanitizeRgdhLogDetail(effectivePayload),
    result: null,
    error: null,
    logs: [],
    rowStore: createEmptyRgdhRowStore()
  };
  rgdhFetchJobs.set(jobId, job);
  await handleRgdhDiagnosticEvent({
    level: 'info',
    category: 'fetch-job',
    route: 'rgdh-monitor',
    message: `YKS cekim isi basladi: ${jobId}`,
    detail: {
      jobId,
      ...job.payload,
      displayBusbarId: job.payload?.selectedBusbar?.busbarId || job.payload?.busbarId || '',
      internalBusbarId: firstRgdhValue(job.payload?.busbarInternalIds)
    }
  });

  Promise.resolve()
    .then(() => handleRgdhFetch(effectivePayload))
    .then((result) => {
      if (job.status === 'cancelled') return;
      job.status = 'completed';
      job.finishedAt = new Date().toISOString();
      job.rowStore = extractRgdhResultRows(result);
      job.result = summarizeRgdhFetchResult(result, job.rowStore);
      job.logs = result?.logs || [];
      handleRgdhDiagnosticEvent({
        level: job.result.partialErrors?.length || !job.result.rowCounts?.apiRows ? 'warn' : 'success',
        category: 'fetch-job',
        route: 'rgdh-monitor',
        message: `YKS cekim isi tamamlandi: ${jobId}`,
        detail: {
          jobId,
          sourceType: job.payload?.sourceType || '',
          selectedBusbar: job.payload?.selectedBusbar || null,
          busbarInternalIds: result?.busbarInternalIds || job.payload?.busbarInternalIds || [],
          displayBusbarId: job.payload?.selectedBusbar?.busbarId || job.payload?.busbarId || '',
          internalBusbarId: firstRgdhValue(result?.busbarInternalIds || job.payload?.busbarInternalIds),
          apiRows: job.result.rowCounts?.apiRows || 0,
          domRows: job.result.rowCounts?.domRows || 0,
          partialErrors: job.result.partialErrors?.length || 0,
          errorClass: job.result.partialErrors?.[0]?.errorType || ''
        }
      });
    })
    .catch((error) => {
      if (job.status === 'cancelled') return;
      job.status = 'failed';
      job.finishedAt = new Date().toISOString();
      job.error = sanitizeRgdhBackgroundError(error);
      if (Array.isArray(error?.rgdhLogs)) job.logs = error.rgdhLogs;
      handleRgdhDiagnosticEvent({
        level: 'error',
        category: 'fetch-job',
        route: 'rgdh-monitor',
        message: error?.message || String(error),
        detail: { jobId, ...job.error }
      });
    });

  return { ok: true, jobId, status: job.status, startedAt: job.startedAt };
}

async function handleRgdhFetchStatus(payload) {
  const job = rgdhFetchJobs.get(String(payload.jobId || ''));
  if (!job) return { ok: false, error: 'RGDH cekim isi bulunamadi.', errorType: 'JOB_NOT_FOUND' };
  return {
    ok: true,
    jobId: job.jobId,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    result: job.result,
    error: job.error,
    logs: job.logs
  };
}

async function handleRgdhFetchRows(payload) {
  const job = rgdhFetchJobs.get(String(payload.jobId || ''));
  if (!job) return { ok: false, error: 'RGDH cekim isi bulunamadi.', errorType: 'JOB_NOT_FOUND' };
  const kind = String(payload.kind || '');
  if (!RGDH_FETCH_ROW_KINDS.includes(kind)) {
    return { ok: false, error: 'RGDH satir turu gecersiz.', errorType: 'VALIDATION_ERROR' };
  }
  const rows = Array.isArray(job.rowStore?.[kind]) ? job.rowStore[kind] : [];
  const offset = Math.max(0, Number(payload.offset || 0));
  const limit = Math.min(5000, Math.max(1, Number(payload.limit || 1000)));
  return {
    ok: true,
    jobId: job.jobId,
    kind,
    offset,
    limit,
    total: rows.length,
    rows: rows.slice(offset, offset + limit)
  };
}

async function handleRgdhFetchCancel(payload) {
  const job = rgdhFetchJobs.get(String(payload.jobId || ''));
  if (!job) return { ok: false, error: 'RGDH cekim isi bulunamadi.', errorType: 'JOB_NOT_FOUND' };
  if (job.status === 'running') {
    job.status = 'cancelled';
    job.finishedAt = new Date().toISOString();
    await handleRgdhDiagnosticEvent({
      level: 'warn',
      category: 'fetch-job',
      route: 'rgdh-monitor',
      message: `YKS cekim isi iptal edildi: ${job.jobId}`
    });
  }
  return { ok: true, jobId: job.jobId, status: job.status };
}

function createEmptyRgdhRowStore() {
  return { conventionalRows: [], windRows: [], domRows: [] };
}

function extractRgdhResultRows(result) {
  const store = createEmptyRgdhRowStore();
  RGDH_FETCH_ROW_KINDS.forEach((kind) => {
    store[kind] = Array.isArray(result?.[kind]) ? result[kind] : [];
  });
  return store;
}

function summarizeRgdhFetchResult(result, rowStore = createEmptyRgdhRowStore()) {
  const summary = { ...(result || {}) };
  RGDH_FETCH_ROW_KINDS.forEach((kind) => {
    delete summary[kind];
  });
  const conventionalRows = rowStore.conventionalRows?.length || 0;
  const windRows = rowStore.windRows?.length || 0;
  const domRows = rowStore.domRows?.length || 0;
  summary.rowCounts = {
    conventionalRows,
    windRows,
    domRows,
    apiRows: conventionalRows + windRows
  };
  summary.hasRowChunks = true;
  return summary;
}

function normalizeRgdhJobTimeoutMs(value, payload = {}) {
  const defaultTimeout = isHybridRgdhFetchPayload(payload) ? RGDH_HYBRID_JOB_TIMEOUT_MS : RGDH_JOB_TIMEOUT_MS;
  const requested = Number(value || defaultTimeout);
  if (!Number.isFinite(requested) || requested <= 0) return defaultTimeout;
  return Math.max(5000, Math.min(RGDH_MAX_JOB_TIMEOUT_MS, requested));
}

function isHybridRgdhFetchPayload(payload = {}) {
  const sourceType = String(payload?.sourceType || '').toUpperCase();
  return sourceType === 'WIND' && isAuxiliaryRgdhBusbar(payload?.selectedBusbar || payload?.busbar || {});
}

async function handleRgdhFetch(payload) {
  const api = getRgdhApiClient();
  payload = {
    ...(payload || {}),
    jobTimeoutMs: normalizeRgdhJobTimeoutMs(payload?.jobTimeoutMs, payload)
  };
  const deadlineAt = Date.now() + payload.jobTimeoutMs;
  const startDate = String(payload.localDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw createRgdhError('RGDH tarih degeri YYYY-MM-DD formatinda olmali.', 'VALIDATION_ERROR');
  }
  const endDate = String(payload.endDate || '').trim();
  const dates = api.buildLocalDateRange(startDate, endDate);

  const requestedSourceType = String(payload.sourceType || 'ALL').toUpperCase();
  const selectedBusbar = normalizeSelectedRgdhBusbar(payload.selectedBusbar || payload.busbar || {});
  const selectedInternalIds = await resolveSelectedRgdhBusbarInternalIds(payload, selectedBusbar, requestedSourceType);
  const sourceType = resolveEffectiveRgdhSourceType(requestedSourceType, selectedBusbar);
  const result = {
    ok: true,
    conventionalRows: [],
    windRows: [],
    domRows: [],
    partialErrors: [],
    busbarInternalIds: selectedInternalIds,
    selectedBusbar,
    logs: [],
    transport: 'direct'
  };
  addRgdhLog(result, 'info', 'Hazirlik', 'RGDH YKS sorgusu hazirlandi.', {
    localDate: startDate,
    endDate: endDate || startDate,
    dateCount: dates.length,
    sourceType,
    busbarInternalIds: selectedInternalIds,
    busbarId: selectedBusbar.busbarId || null,
    busbarName: selectedBusbar.busbarName || null,
    internalBusbarId: selectedInternalIds[0] || null,
    resolverMethod: rgdhLastInternalIdResolution?.method || null,
    resolverPageCount: rgdhLastInternalIdResolution?.pageCount || null
  });

  for (const localDate of dates) {
    if (sourceType === 'ALL' || sourceType === 'CONVENTIONAL') {
      try {
        const fetched = await fetchRgdhBusbarByHours({
          api,
          source: 'CONVENTIONAL',
          endpoint: api.RGDH_ENDPOINTS.conventional,
          buildParams: (hour) => api.buildConventionalHourParams(localDate, selectedInternalIds[0], hour, { size: Number(payload.conventionalPageSize || 60) }),
          localDate,
          busbarId: selectedInternalIds[0],
          payload,
          deadlineAt
        });
        result.logs.push(...fetched.logs);
        result.conventionalRows.push(...fetched.rows);
        result.partialErrors.push(...fetched.partialErrors);
      } catch (error) {
        if (Array.isArray(error.rgdhLogs)) result.logs.push(...error.rgdhLogs);
        result.partialErrors.push({ source: 'CONVENTIONAL', localDate, ...sanitizeRgdhBackgroundError(error) });
        addRgdhLog(result, 'error', 'CONVENTIONAL', `${localDate}: ${error.message || String(error)}`, { ...sanitizeRgdhBackgroundError(error), localDate });
        const dom = await safeRgdhDomScrape({ kind: 'CONVENTIONAL' });
        result.domRows.push(...(dom.rows || []));
        addRgdhLog(result, dom.rows?.length ? 'success' : 'error', 'DOM', dom.rows?.length ? `${dom.rows.length} DOM satiri okundu.` : (dom.message || dom.error || 'DOM fallback satir uretmedi.'), { rowCount: dom.rows?.length || 0 });
      }
    }

    if (sourceType === 'ALL' || sourceType === 'WIND') {
      const busbarIds = selectedInternalIds;
      addRgdhLog(result, 'info', 'WIND', `${localDate}: ${busbarIds.length} RES/GES ic busbar ID bulundu.`, { busbarInternalIds: busbarIds, localDate });
      if (!busbarIds.length) {
        result.partialErrors.push({
          source: 'WIND',
          localDate,
          message: 'RES/GES verisi icin busbarId.equals degeri bulunamadi. Once katalogdan bara secin.',
          errorType: 'MISSING_BUSBAR_SELECTION',
          httpStatus: null
        });
      }
      for (const busbarId of busbarIds) {
        const fetched = await fetchRgdhWindBusbarWithCandidateFallback({
          api,
          source: 'WIND',
          endpoint: api.RGDH_ENDPOINTS.wind,
          localDate,
          busbarId,
          payload,
          deadlineAt,
          selectedBusbar,
          requestedSourceType
        });
        result.logs.push(...fetched.logs);
        result.windRows.push(...fetched.rows);
        result.partialErrors.push(...fetched.partialErrors);
        if (fetched.usedBusbarId && String(fetched.usedBusbarId) !== String(busbarId)) {
          result.busbarInternalIds = [String(fetched.usedBusbarId)];
          cacheResolvedRgdhWindCandidate(selectedBusbar, requestedSourceType, fetched.usedBusbarId);
        }
      }
    }
  }

  return result;
}

async function fetchRgdhWindBusbarWithCandidateFallback({ api, source, endpoint, localDate, busbarId, payload, deadlineAt, selectedBusbar, requestedSourceType }) {
  const hybridAuxiliary = isAuxiliaryRgdhBusbar(selectedBusbar);
  const candidateIds = buildRgdhWindCandidateIds(busbarId, selectedBusbar, hybridAuxiliary);
  const resolvedInternalBusbarId = String(busbarId || '');
  const displayBusbarId = String(selectedBusbar?.busbarId || '');
  const logs = [];
  const failedCandidateErrors = [];

  for (let index = 0; index < candidateIds.length; index += 1) {
    const candidateBusbarId = candidateIds[index];
    const candidatePayload = hybridAuxiliary ? withHybridWindFetchDefaults(payload) : payload;
    const logContext = {
      candidateBusbarId,
      displayBusbarId,
      resolvedInternalBusbarId,
      hybridAuxiliary
    };

    if (index > 0) {
      const probe = await probeRgdhWindCandidate({
        api,
        endpoint,
        localDate,
        candidateBusbarId,
        payload: withHybridWindFetchDefaults(payload),
        deadlineAt,
        logContext
      });
      logs.push(...probe.logs);
      if (!probe.ok) {
        failedCandidateErrors.push(probe.error);
        continue;
      }
    }

    const fetched = await fetchRgdhBusbarByHours({
      api,
      source,
      endpoint,
      buildParams: (hour) => api.buildWindHourParams(localDate, candidateBusbarId, hour, { size: Number(payload.windPageSize || 60), page: 0 }),
      localDate,
      busbarId: candidateBusbarId,
      payload: candidatePayload,
      deadlineAt,
      preflight: false,
      logContext
    });
    logs.push(...fetched.logs);

    const partialErrors = annotateRgdhCandidateErrors(fetched.partialErrors, logContext);
    if (!fetched.rows.length && hybridAuxiliary && shouldTryNextRgdhWindCandidate({ hybridAuxiliary, candidateIds, index, partialErrors })) {
      const fallback = await tryHybridWindCandidateDayFallback({
        api,
        source,
        endpoint,
        localDate,
        candidateBusbarId,
        payload: candidatePayload,
        deadlineAt,
        logContext
      });
      logs.push(...fallback.logs);
      if (fallback.rows.length) {
        return {
          rows: fallback.rows,
          logs,
          partialErrors: [...failedCandidateErrors, ...partialErrors, ...annotateRgdhCandidateErrors(fallback.partialErrors, logContext)],
          usedBusbarId: candidateBusbarId
        };
      }
    }
    if (fetched.rows.length || !shouldTryNextRgdhWindCandidate({ hybridAuxiliary, candidateIds, index, partialErrors })) {
      return {
        rows: fetched.rows,
        logs,
        partialErrors: fetched.rows.length ? [...failedCandidateErrors, ...partialErrors] : partialErrors,
        usedBusbarId: candidateBusbarId
      };
    }

    failedCandidateErrors.push(...partialErrors);
    logs.push(createRgdhLog('warn', source, `${localDate}: ${candidateBusbarId} aday RES/GES busbar id zaman asimina ugradi; display id probe denenecek.`, {
      ...logContext,
      localDate,
      candidateBusbarIds: candidateIds,
      errorType: 'YKS_HOURLY_TIMEOUT',
      errorClass: 'YKS_HOURLY_TIMEOUT'
    }));
  }

  const summary = summarizeRgdhFailedWindCandidates(failedCandidateErrors, {
    candidateBusbarIds: candidateIds,
    displayBusbarId,
    resolvedInternalBusbarId,
    localDate,
    source,
    hybridAuxiliary
  });
  logs.push(createRgdhLog('error', source, summary.message, summary));
  return { rows: [], logs, partialErrors: [summary], usedBusbarId: null };
}

async function tryHybridWindCandidateDayFallback({ api, source, endpoint, localDate, candidateBusbarId, payload, deadlineAt, logContext }) {
  const logs = [];
  const partialErrors = [];
  try {
    logs.push(createRgdhLog('info', source, `${localDate}: hibrit RES/GES aday tam gun fallback denenecek: ${candidateBusbarId}`, {
      endpoint,
      localDate,
      busbarId: candidateBusbarId,
      internalBusbarId: candidateBusbarId,
      fallbackPhase: 'hybrid-full-day',
      ...logContext
    }));
    const fallback = await fetchRgdhWindBusbarByDayPages({
      api,
      source,
      endpoint,
      localDate,
      busbarId: candidateBusbarId,
      payload,
      deadlineAt
    });
    logs.push(...(fallback.logs || []));
    return {
      rows: sortRgdhRowsByMeasurementDate(fallback.rows || []),
      logs,
      partialErrors: fallback.partialErrors || []
    };
  } catch (error) {
    if (Array.isArray(error?.rgdhLogs)) logs.push(...error.rgdhLogs);
    const sanitized = sanitizeRgdhBackgroundError(error);
    const fallbackError = {
      source,
      busbarId: candidateBusbarId,
      internalBusbarId: candidateBusbarId,
      localDate,
      fallbackPhase: 'hybrid-full-day',
      errorClass: sanitized.errorType,
      ...logContext,
      ...sanitized
    };
    partialErrors.push(fallbackError);
    logs.push(createRgdhLog('warn', source, `${localDate}: hibrit RES/GES aday tam gun fallback basarisiz: ${sanitized.message}`, fallbackError));
    return { rows: [], logs, partialErrors };
  }
}

function buildRgdhWindCandidateIds(busbarId, selectedBusbar, hybridAuxiliary) {
  const candidates = [String(busbarId || '').trim()].filter(Boolean);
  const displayBusbarId = String(selectedBusbar?.busbarId || '').trim();
  if (hybridAuxiliary && displayBusbarId && !candidates.includes(displayBusbarId)) {
    candidates.push(displayBusbarId);
  }
  return candidates;
}

function withHybridWindFetchDefaults(payload) {
  return {
    ...(payload || {}),
    windHourTimeoutMs: payload?.windHourTimeoutMs || RGDH_HYBRID_WIND_HOUR_TIMEOUT_MS,
    windHourConcurrency: payload?.windHourConcurrency || RGDH_HYBRID_WIND_HOUR_CONCURRENCY,
    windProbeTimeoutMs: payload?.windProbeTimeoutMs || RGDH_HYBRID_WIND_PROBE_TIMEOUT_MS,
    jobTimeoutMs: payload?.jobTimeoutMs || RGDH_HYBRID_JOB_TIMEOUT_MS
  };
}

async function probeRgdhWindCandidate({ api, endpoint, localDate, candidateBusbarId, payload, deadlineAt, logContext }) {
  const logs = [];
  const timeoutMs = clampRgdhRequestTimeout(Number(payload.windProbeTimeoutMs || RGDH_HYBRID_WIND_PROBE_TIMEOUT_MS), deadlineAt);
  if (timeoutMs <= 0) {
    return {
      ok: false,
      logs,
      error: {
        ...logContext,
        source: 'WIND',
        busbarId: candidateBusbarId,
        internalBusbarId: candidateBusbarId,
        localDate,
        probeHours: resolveHybridWindProbeHours(payload),
        errorType: 'YKS_JOB_TIMEOUT',
        errorClass: 'YKS_JOB_TIMEOUT',
        message: `YKS cekimi ${Math.round(Number(payload.jobTimeoutMs || RGDH_JOB_TIMEOUT_MS) / 1000)} sn toplam sure butcesini doldurdu.`
      }
    };
  }
  const errors = [];
  for (const hour of resolveHybridWindProbeHours(payload)) {
    const params = api.buildWindHourParams(localDate, candidateBusbarId, hour, { size: Number(payload.windPageSize || 60), page: 0 });
    const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, params);
    logs.push(createRgdhLog('info', 'WIND', `${localDate}: hibrit RES/GES aday probe sorgulanacak: ${candidateBusbarId} (${String(hour).padStart(2, '0')}:00)`, {
      endpoint,
      params,
      localDate,
      hour,
      hourStart: params['measurementDate.greaterOrEqualThan'] || '',
      hourEnd: params['measurementDate.lessThan'] || '',
      requestUrl,
      pageTimeoutMs: timeoutMs,
      probeHours: resolveHybridWindProbeHours(payload),
      ...logContext
    }));
    const pageResult = await runRgdhPageFetchInYksTab({ endpoint, params, timeoutMs });
    if (pageResult?.ok) {
      logs.push(createRgdhLog('success', 'WIND', `${localDate}: hibrit RES/GES aday probe basarili: ${candidateBusbarId} (${String(hour).padStart(2, '0')}:00)`, {
        endpoint,
        localDate,
        hour,
        hourStart: params['measurementDate.greaterOrEqualThan'] || '',
        hourEnd: params['measurementDate.lessThan'] || '',
        rowCount: (pageResult.rows || []).length,
        requestUrl,
        httpStatus: pageResult.httpStatus || 200,
        ...logContext
      }));
      return { ok: true, logs };
    }
    const sanitized = sanitizeRgdhBackgroundError({ ...(pageResult || {}), message: pageResult?.error || pageResult?.reason || pageResult?.message });
    const error = {
      ...logContext,
      source: 'WIND',
      busbarId: candidateBusbarId,
      internalBusbarId: candidateBusbarId,
      localDate,
      hour,
      hourStart: params['measurementDate.greaterOrEqualThan'] || '',
      hourEnd: params['measurementDate.lessThan'] || '',
      requestUrl,
      errorClass: sanitized.errorType,
      ...sanitized
    };
    errors.push(error);
    logs.push(createRgdhLog('warn', 'WIND', `${localDate}: hibrit RES/GES aday probe basarisiz: ${candidateBusbarId} (${String(hour).padStart(2, '0')}:00)`, error));
  }
  return { ok: false, logs, error: errors[0] || { ...logContext, errorType: 'PAGE_FETCH_TIMEOUT', errorClass: 'PAGE_FETCH_TIMEOUT' } };
}

function resolveHybridWindProbeHours(payload = {}) {
  const raw = Array.isArray(payload.windProbeHours) ? payload.windProbeHours : RGDH_HYBRID_WIND_PROBE_HOURS;
  const unique = [];
  raw.forEach((value) => {
    const hour = Number(value);
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23 && !unique.includes(hour)) unique.push(hour);
  });
  return unique.length ? unique : RGDH_HYBRID_WIND_PROBE_HOURS;
}

function annotateRgdhCandidateErrors(errors, logContext) {
  return (errors || []).map((error) => ({
    ...error,
    candidateBusbarId: logContext.candidateBusbarId,
    displayBusbarId: logContext.displayBusbarId,
    resolvedInternalBusbarId: logContext.resolvedInternalBusbarId,
    hybridAuxiliary: logContext.hybridAuxiliary
  }));
}

function shouldTryNextRgdhWindCandidate({ hybridAuxiliary, candidateIds, index, partialErrors }) {
  if (!hybridAuxiliary || index >= candidateIds.length - 1) return false;
  return (partialErrors || []).some((error) => {
    const type = String(error?.errorType || error?.errorClass || '');
    return type === 'YKS_HOURLY_TIMEOUT' && Number(error?.failedHours || 0) >= 24;
  });
}

function summarizeRgdhFailedWindCandidates(errors, context) {
  const first = (errors || [])[0] || {};
  const last = (errors || [])[errors.length - 1] || first;
  return {
    source: context.source || 'WIND',
    busbarId: context.displayBusbarId || context.resolvedInternalBusbarId || '',
    internalBusbarId: context.resolvedInternalBusbarId || '',
    candidateBusbarId: first.candidateBusbarId || '',
    candidateBusbarIds: context.candidateBusbarIds,
    displayBusbarId: context.displayBusbarId || '',
    resolvedInternalBusbarId: context.resolvedInternalBusbarId || '',
    hybridAuxiliary: context.hybridAuxiliary === true,
    localDate: context.localDate,
    hourStart: first.hourStart || '',
    hourEnd: last.hourEnd || '',
    failedHours: Number(first.failedHours || 24),
    attemptedHours: 24,
    requestUrl: first.requestUrl || '',
    errorType: 'YKS_HOURLY_TIMEOUT',
    errorClass: 'YKS_HOURLY_TIMEOUT',
    message: `${context.localDate}: tum aday RES/GES busbar id degerleri basarisiz: ${context.candidateBusbarIds.join(', ')}`
  };
}

function isAuxiliaryRgdhBusbar(selectedBusbar) {
  if (!selectedBusbar) return false;
  if (selectedBusbar.hasAuxiliarySource === true || selectedBusbar.hybridAuxiliary === true) return true;
  const text = normalizeRgdhLookupText([
    selectedBusbar.busbarName,
    selectedBusbar.plantName,
    selectedBusbar.rgkType,
    selectedBusbar.sourceKind
  ].filter(Boolean).join(' '));
  return /yardimci|hibrit|auxiliary/.test(text);
}

function cacheResolvedRgdhWindCandidate(selectedBusbar, requestedSourceType, usedBusbarId) {
  if (!selectedBusbar || !usedBusbarId) return;
  const cacheKey = buildRgdhBusbarCacheKey(selectedBusbar, requestedSourceType || 'WIND');
  rgdhBusbarInternalIdCache.set(cacheKey, {
    id: String(usedBusbarId),
    meta: {
      method: 'hybrid-display-probe',
      pageCount: 0,
      internalBusbarId: String(usedBusbarId),
      displayBusbarId: String(selectedBusbar.busbarId || ''),
      busbarName: selectedBusbar.busbarName || ''
    }
  });
}

async function fetchRgdhWithFallback(endpoint, params) {
  const fetched = await fetchRgdhWithFallbackDetailed(endpoint, params);
  return fetched.rows;
}

async function fetchRgdhWithFallbackDetailed(endpoint, params, options = {}) {
  const api = getRgdhApiClient();
  const logs = [];
  try {
    logs.push(createRgdhLog('info', 'Page Fetch', 'YKS sayfa context tokenli fetch basladi (chunked).', { endpoint, params: sanitizeRgdhParams(params), transport: 'page-context' }));
    const allRows = [];
    let page = Number(params.page || 0);
    const size = Number(params.size || 2000);
    const maxPages = Math.max(1, Number(options.maxPages || 250));
    let lastPage = null;
    let totalCount = null;
    while (page < maxPages) {
      const pageParams = { ...params, page, size };
      const pageResult = await runRgdhPageFetchInYksTab({ endpoint, params: pageParams, timeoutMs: options.pageTimeoutMs || RGDH_PAGE_FETCH_TIMEOUT_MS });
      if (!pageResult?.ok) {
        logs.push(createRgdhLog('error', 'Page Fetch', pageResult?.error || pageResult?.reason || `Page ${page} fetch basarisiz.`, { endpoint, transport: 'page-context', httpStatus: pageResult?.httpStatus || null, errorType: pageResult?.errorType || 'PAGE_FETCH_ERROR' }));
        throw createRgdhError(pageResult?.error || pageResult?.reason || `Page ${page} fetch basarisiz.`, pageResult?.errorType || 'PAGE_FETCH_ERROR', pageResult?.httpStatus);
      }
      const rows = pageResult.rows || [];
      allRows.push(...rows);
      if (lastPage === null && pageResult.lastPage !== undefined) lastPage = pageResult.lastPage;
      if (totalCount === null && pageResult.totalCount !== undefined) totalCount = pageResult.totalCount;
      logs.push(createRgdhLog('success', 'Page Fetch', `Sayfa ${page}: ${rows.length} kayit alindi.`, { endpoint, page, rowCount: rows.length, transport: pageResult.transport || 'page-context' }));
      if (lastPage !== null && page >= lastPage) break;
      if (totalCount !== null && allRows.length >= totalCount) break;
      if (!rows.length && lastPage === null) break;
      page += 1;
    }
    logs.push(createRgdhLog('success', 'Page Fetch', `${allRows.length} toplam kayit alindi.`, { endpoint, rowCount: allRows.length, transport: 'page-context' }));
    return { rows: allRows, logs };
  } catch (pageError) {
    if (Array.isArray(pageError.rgdhLogs)) logs.push(...pageError.rgdhLogs);
    if (options.skipDirectFallback) {
      pageError.rgdhLogs = logs;
      throw pageError;
    }
    try {
      logs.push(createRgdhLog('info', 'Direct Fetch', 'Extension context direct fetch tanisal olarak basladi.', { endpoint, params: sanitizeRgdhParams(params), transport: 'direct' }));
      const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(Number(options.directTimeoutMs || 30000)) : undefined;
      const rows = await api.fetchAllPages(endpoint, params, { fetchImpl: fetch, baseUrl: RGDH_YKS_ORIGIN, signal });
      logs.push(createRgdhLog('warn', 'Direct Fetch', `${rows.length} kayit tanisal olarak alindi; page-context hatasi nedeniyle sonuc olarak kullanilmadi.`, { endpoint, rowCount: rows.length, transport: 'direct' }));
      const error = createRgdhError(pageError.message || 'YKS page-context fetch basarisiz.', pageError.errorType || 'PAGE_FETCH_ERROR', pageError.httpStatus);
      error.rgdhLogs = logs;
      throw error;
    } catch (directError) {
      if (directError.errorType === 'AUTH_REQUIRED') {
        directError.errorType = 'AUTH_REQUIRED_DIRECT_FALLBACK';
      }
      logs.push(createRgdhLog('error', 'Direct Fetch', directError.message || String(directError), { ...sanitizeRgdhBackgroundError(directError), endpoint, transport: 'direct' }));
      directError.pageErrorType = pageError.errorType || '';
      directError.rgdhLogs = logs;
      throw directError;
    }
  }
}

async function fetchRgdhBusbarByHours({ api, source, endpoint, buildParams, localDate, busbarId, payload, deadlineAt, preflight = true, logContext = {} }) {
  const rows = [];
  const logs = [];
  const partialErrors = [];
  const sourceKey = String(source || 'RGDH').toUpperCase();
  const pageTimeoutMs = Number(payload[`${sourceKey.toLowerCase()}HourTimeoutMs`] || payload.hourTimeoutMs || RGDH_HOUR_TIMEOUT_MS);
  const preflightTimeoutMs = Number(payload[`${sourceKey.toLowerCase()}PreflightTimeoutMs`] || payload.preflightTimeoutMs || RGDH_PREFLIGHT_TIMEOUT_MS);
  const concurrency = Math.max(1, Math.min(8, Number(payload[`${sourceKey.toLowerCase()}HourConcurrency`] || payload.hourConcurrency || RGDH_HOUR_CONCURRENCY)));
  const hours = Array.from({ length: 24 }, (_value, hour) => hour);

  const fetchHour = async (hour, timeoutMs, phase = 'Saatlik') => {
    const effectiveTimeoutMs = clampRgdhRequestTimeout(timeoutMs, deadlineAt);
    if (effectiveTimeoutMs <= 0) {
      return {
        ok: false,
        error: {
          source: sourceKey,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          hour,
          errorType: 'YKS_JOB_TIMEOUT',
          errorClass: 'YKS_JOB_TIMEOUT',
          message: `YKS cekimi ${Math.round(Number(payload.jobTimeoutMs || RGDH_JOB_TIMEOUT_MS) / 1000)} sn toplam sure butcesini doldurdu.`
        }
      };
    }
    const params = buildParams(hour);
    const hourLabel = buildRgdhHourLabel(hour);
    const hourStartUtc = params['measurementDate.greaterOrEqualThan'] || '';
    const hourEndUtc = params['measurementDate.lessThan'] || '';
    const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, params);
    logs.push(createRgdhLog('info', sourceKey, `${sourceLabelForLog(sourceKey)} ${phase.toLowerCase()} endpoint sorgulanacak: ${busbarId} (${localDate} ${hourLabel.localStart}-${hourLabel.localEnd})`, {
      endpoint,
      params: sanitizeRgdhParams(params),
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      hour,
      hourStart: hourStartUtc,
      hourEnd: hourEndUtc,
      requestUrl,
      pageTimeoutMs: effectiveTimeoutMs,
      concurrency,
      ...logContext
    }));
    try {
      const fetched = await fetchRgdhWithFallbackDetailed(endpoint, params, {
        maxPages: 1,
        pageTimeoutMs: effectiveTimeoutMs,
        skipDirectFallback: true
      });
      logs.push(...fetched.logs);
      rows.push(...fetched.rows);
      logs.push(createRgdhLog('success', sourceKey, `${localDate} ${hourLabel.localStart}-${hourLabel.localEnd}: ${fetched.rows.length} kayit alindi.`, {
        endpoint,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour,
        hourStart: hourStartUtc,
        hourEnd: hourEndUtc,
        rowCount: fetched.rows.length,
        ...logContext
      }));
      return { ok: true, rowCount: fetched.rows.length };
    } catch (error) {
      if (Array.isArray(error.rgdhLogs)) logs.push(...error.rgdhLogs);
      const sanitized = sanitizeRgdhBackgroundError(error);
      const partial = {
        source: sourceKey,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour,
        hourStart: hourStartUtc,
        hourEnd: hourEndUtc,
        requestUrl,
        errorClass: sanitized.errorType,
        ...logContext,
        phase,
        ...sanitized
      };
      logs.push(createRgdhLog('warn', sourceKey, `${localDate} ${hourLabel.localStart}-${hourLabel.localEnd} | ${busbarId}: ${sanitized.message}`, {
        ...sanitized,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour,
        hourStart: hourStartUtc,
        hourEnd: hourEndUtc,
        requestUrl,
        errorClass: sanitized.errorType,
        ...logContext
      }));
      return { ok: false, error: partial };
    }
  };

  if (preflight) {
    const preflightResult = await fetchHour(0, preflightTimeoutMs, 'On kontrol');
    if (!preflightResult.ok) {
    const preflightError = {
      ...preflightResult.error,
      message: `YKS on kontrol zaman asimi: ${preflightResult.error?.message || preflightResult.error?.error || 'YKS yanit vermedi.'}`,
      errorType: preflightResult.error?.errorType || 'PAGE_FETCH_TIMEOUT',
      errorClass: preflightResult.error?.errorClass || preflightResult.error?.errorType || 'PAGE_FETCH_TIMEOUT'
    };
    partialErrors.push(preflightError);
    logs.push(createRgdhLog('error', sourceKey, preflightError.message, {
      ...preflightError,
      failedHours: 1,
      attemptedHours: 1
    }));
    return { rows: [], logs, partialErrors };
    }
  }

  const remainingHours = preflight ? hours.slice(1) : hours;
  await runWithConcurrency(remainingHours, concurrency, async (hour) => {
    const result = await fetchHour(hour, pageTimeoutMs, 'Saatlik');
    if (!result.ok) partialErrors.push(result.error);
  });

  const aggregatedPartialErrors = aggregateRgdhHourlyErrors(partialErrors, {
    sourceKey,
    busbarId,
    localDate
  });
  if (aggregatedPartialErrors.length !== partialErrors.length) {
    const timeoutSummary = aggregatedPartialErrors.find((item) => item.errorType === 'YKS_HOURLY_TIMEOUT');
    if (timeoutSummary) {
      logs.push(createRgdhLog('warn', sourceKey, timeoutSummary.message, timeoutSummary));
    }
  }

  logs.push(createRgdhLog('success', sourceKey, `Saatlik toplam ${rows.length} kayit alindi.`, {
    endpoint,
    busbarId,
    internalBusbarId: busbarId,
    localDate,
    rowCount: rows.length,
    partialErrors: aggregatedPartialErrors.length,
    ...logContext
  }));

  return {
    rows: sortRgdhRowsByMeasurementDate(rows),
    logs,
    partialErrors: aggregatedPartialErrors
  };
}

async function fetchRgdhWindBusbarByChunks({ api, source, endpoint, buildParams, localDate, busbarId, payload, deadlineAt }) {
  const rows = [];
  const logs = [];
  const partialErrors = [];
  const sourceKey = String(source || 'WIND').toUpperCase();
  const chunkSpanHours = Math.max(1, Math.min(4, Number(payload.windChunkSpanHours || RGDH_WIND_CHUNK_SPAN_HOURS)));
  const pageTimeoutMs = Number(payload.windChunkTimeoutMs || payload.windHourTimeoutMs || payload.hourTimeoutMs || RGDH_WIND_CHUNK_TIMEOUT_MS);
  const concurrency = Math.max(1, Math.min(4, Number(payload.windChunkConcurrency || payload.windHourConcurrency || payload.hourConcurrency || RGDH_WIND_CHUNK_CONCURRENCY)));
  const chunkStarts = [];
  for (let hour = 0; hour < 24; hour += chunkSpanHours) chunkStarts.push(hour);

  const fetchChunk = async (startHour, timeoutMs, phase = 'Parca') => {
    const effectiveTimeoutMs = clampRgdhRequestTimeout(timeoutMs, deadlineAt);
    const label = buildRgdhChunkLabel(startHour, chunkSpanHours);
    const params = buildParams(startHour, chunkSpanHours);
    const chunkStartUtc = params['measurementDate.greaterOrEqualThan'] || '';
    const chunkEndUtc = params['measurementDate.lessThan'] || '';
    const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, params);
    if (effectiveTimeoutMs <= 0) {
      return {
        ok: false,
        error: {
          source: sourceKey,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          hour: startHour,
          chunkStart: chunkStartUtc,
          chunkEnd: chunkEndUtc,
          hourStart: chunkStartUtc,
          hourEnd: chunkEndUtc,
          requestUrl,
          errorType: 'YKS_JOB_TIMEOUT',
          errorClass: 'YKS_JOB_TIMEOUT',
          phase,
          message: `YKS cekimi ${Math.round(Number(payload.jobTimeoutMs || RGDH_JOB_TIMEOUT_MS) / 1000)} sn toplam sure butcesini doldurdu.`
        }
      };
    }
    logs.push(createRgdhLog('info', sourceKey, `RES/GES ${phase.toLowerCase()} endpoint sorgulanacak: ${busbarId} (${localDate} ${label.localStart}-${label.localEnd})`, {
      endpoint,
      params: sanitizeRgdhParams(params),
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      hour: startHour,
      chunkStart: chunkStartUtc,
      chunkEnd: chunkEndUtc,
      hourStart: chunkStartUtc,
      hourEnd: chunkEndUtc,
      requestUrl,
      pageTimeoutMs: effectiveTimeoutMs,
      concurrency
    }));
    try {
      const fetched = await fetchRgdhWithFallbackDetailed(endpoint, params, {
        maxPages: 2,
        pageTimeoutMs: effectiveTimeoutMs,
        skipDirectFallback: true
      });
      logs.push(...fetched.logs);
      rows.push(...fetched.rows);
      logs.push(createRgdhLog('success', sourceKey, `${localDate} ${label.localStart}-${label.localEnd}: ${fetched.rows.length} kayit alindi.`, {
        endpoint,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour: startHour,
        chunkStart: chunkStartUtc,
        chunkEnd: chunkEndUtc,
        hourStart: chunkStartUtc,
        hourEnd: chunkEndUtc,
        rowCount: fetched.rows.length,
        apiRows: fetched.rows.length
      }));
      return { ok: true, rowCount: fetched.rows.length, startHour };
    } catch (error) {
      if (Array.isArray(error.rgdhLogs)) logs.push(...error.rgdhLogs);
      const sanitized = sanitizeRgdhBackgroundError(error);
      const partial = {
        source: sourceKey,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour: startHour,
        chunkStart: chunkStartUtc,
        chunkEnd: chunkEndUtc,
        hourStart: chunkStartUtc,
        hourEnd: chunkEndUtc,
        requestUrl,
        errorClass: sanitized.errorType,
        phase,
        ...sanitized
      };
      logs.push(createRgdhLog('warn', sourceKey, `${localDate} ${label.localStart}-${label.localEnd} | ${busbarId}: ${sanitized.message}`, {
        ...sanitized,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        hour: startHour,
        chunkStart: chunkStartUtc,
        chunkEnd: chunkEndUtc,
        hourStart: chunkStartUtc,
        hourEnd: chunkEndUtc,
        requestUrl,
        errorClass: sanitized.errorType
      }));
      return { ok: false, error: partial, startHour };
    }
  };

  let successfulPreflight = null;
  const preflightStarts = [...new Set([0, 12].filter((hour) => chunkStarts.includes(hour)))];
  const preflightFailures = [];
  for (const startHour of preflightStarts) {
    const result = await fetchChunk(startHour, pageTimeoutMs, 'On kontrol');
    if (result.ok) {
      successfulPreflight = result;
      break;
    }
    preflightFailures.push(result.error);
  }

  if (!successfulPreflight) {
    if (!payload.disableWindDayFallback) {
      try {
        logs.push(createRgdhLog('info', sourceKey, `RES/GES tam gun sayfali fallback deneniyor: ${busbarId} (${localDate})`, {
          endpoint,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          pageTimeoutMs: clampRgdhRequestTimeout(Number(payload.windDayPageTimeoutMs || 45000), deadlineAt)
        }));
        const fallback = await fetchRgdhWindBusbarByDayPages({
          api,
          source,
          endpoint,
          localDate,
          busbarId,
          payload,
          deadlineAt
        });
        logs.push(...fallback.logs);
        return {
          rows: sortRgdhRowsByMeasurementDate(fallback.rows),
          logs,
          partialErrors: fallback.partialErrors
        };
      } catch (error) {
        if (Array.isArray(error.rgdhLogs)) logs.push(...error.rgdhLogs);
        const sanitized = sanitizeRgdhBackgroundError(error);
        logs.push(createRgdhLog('warn', sourceKey, `RES/GES tam gun sayfali fallback basarisiz: ${sanitized.message}`, {
          ...sanitized,
          endpoint,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          errorClass: sanitized.errorType
        }));
      }
    }
    const first = preflightFailures[0] || {};
    const last = preflightFailures[preflightFailures.length - 1] || first;
    const preflightError = {
      source: sourceKey,
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      errorType: 'WIND_PRECHECK_TIMEOUT',
      errorClass: 'WIND_PRECHECK_TIMEOUT',
      httpStatus: null,
      message: `YKS RES/GES on kontrol zaman asimi: ${first.message || first.error || 'YKS yanit vermedi.'}`,
      failedChunks: preflightFailures.length,
      attemptedChunks: preflightFailures.length,
      chunkStart: first.chunkStart || '',
      chunkEnd: last.chunkEnd || '',
      hourStart: first.hourStart || '',
      hourEnd: last.hourEnd || '',
      requestUrl: first.requestUrl || ''
    };
    partialErrors.push(preflightError);
    logs.push(createRgdhLog('error', sourceKey, preflightError.message, preflightError));
    return { rows: [], logs, partialErrors };
  }

  const remainingStarts = chunkStarts.filter((hour) => hour !== successfulPreflight.startHour);
  await runWithConcurrency(remainingStarts, concurrency, async (startHour) => {
    const result = await fetchChunk(startHour, pageTimeoutMs, 'Parca');
    if (!result.ok) partialErrors.push(result.error);
  });

  const aggregatedPartialErrors = aggregateRgdhChunkErrors(partialErrors, {
    sourceKey,
    busbarId,
    localDate
  });
  const timeoutSummary = aggregatedPartialErrors.find((item) => item.errorType === 'YKS_CHUNK_TIMEOUT');
  if (timeoutSummary) {
    logs.push(createRgdhLog('warn', sourceKey, timeoutSummary.message, timeoutSummary));
  }

  logs.push(createRgdhLog('success', sourceKey, `RES/GES parca toplam ${rows.length} kayit alindi.`, {
    endpoint,
    busbarId,
    internalBusbarId: busbarId,
    localDate,
    rowCount: rows.length,
    apiRows: rows.length,
    partialErrors: aggregatedPartialErrors.length
  }));

  return {
    rows: sortRgdhRowsByMeasurementDate(rows),
    logs,
    partialErrors: aggregatedPartialErrors
  };
}

async function fetchRgdhWindBusbarByDayPages({ api, source, endpoint, localDate, busbarId, payload, deadlineAt }) {
  const sourceKey = String(source || 'WIND').toUpperCase();
  const rows = [];
  const logs = [];
  const pageSize = Number(payload.windPageSize || 60);
  const maxPages = Math.max(1, Math.min(24, Number(payload.windDayMaxPages || 24)));
  const pageTimeoutMs = Number(payload.windDayPageTimeoutMs || payload.windFullDayTimeoutMs || 45000);
  const baseParams = api.buildWindDayParams(localDate, busbarId, { size: pageSize });
  let page = 0;
  let lastPage = null;
  let totalCount = null;

  while (page < maxPages) {
    const effectiveTimeoutMs = clampRgdhRequestTimeout(pageTimeoutMs, deadlineAt);
    const pageParams = { ...baseParams, page, size: pageSize };
    const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, pageParams);
    if (effectiveTimeoutMs <= 0) {
      const error = createRgdhError(`YKS cekimi ${Math.round(Number(payload.jobTimeoutMs || RGDH_JOB_TIMEOUT_MS) / 1000)} sn toplam sure butcesini doldurdu.`, 'YKS_JOB_TIMEOUT');
      error.rgdhLogs = logs;
      throw error;
    }
    logs.push(createRgdhLog('info', sourceKey, `RES/GES tam gun sayfa ${page} sorgulanacak: ${busbarId} (${localDate})`, {
      endpoint,
      params: sanitizeRgdhParams(pageParams),
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      chunkStart: pageParams['measurementDate.greaterOrEqualThan'] || '',
      chunkEnd: pageParams['measurementDate.lessThan'] || '',
      hourStart: pageParams['measurementDate.greaterOrEqualThan'] || '',
      hourEnd: pageParams['measurementDate.lessThan'] || '',
      requestUrl,
      pageTimeoutMs: effectiveTimeoutMs,
      pageCount: page + 1
    }));

    const pageResult = await runRgdhPageFetchInYksTab({
      endpoint,
      params: pageParams,
      timeoutMs: effectiveTimeoutMs
    });
    if (!pageResult?.ok) {
      logs.push(createRgdhLog('error', 'Page Fetch', pageResult?.error || pageResult?.reason || `RES/GES tam gun sayfa ${page} basarisiz.`, {
        endpoint,
        transport: 'page-context',
        httpStatus: pageResult?.httpStatus || null,
        errorType: pageResult?.errorType || 'PAGE_FETCH_ERROR',
        requestUrl
      }));
      const error = createRgdhError(pageResult?.error || pageResult?.reason || `RES/GES tam gun sayfa ${page} basarisiz.`, pageResult?.errorType || 'PAGE_FETCH_ERROR', pageResult?.httpStatus);
      error.rgdhLogs = logs;
      throw error;
    }

    const pageRows = pageResult.rows || [];
    rows.push(...pageRows);
    if (lastPage === null && pageResult.lastPage !== undefined && pageResult.lastPage !== null) lastPage = Number(pageResult.lastPage);
    if (totalCount === null && pageResult.totalCount !== undefined && pageResult.totalCount !== null) totalCount = Number(pageResult.totalCount);
    logs.push(createRgdhLog('success', sourceKey, `RES/GES tam gun sayfa ${page}: ${pageRows.length} kayit alindi.`, {
      endpoint,
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      rowCount: pageRows.length,
      apiRows: rows.length,
      pageCount: page + 1,
      chunkStart: pageParams['measurementDate.greaterOrEqualThan'] || '',
      chunkEnd: pageParams['measurementDate.lessThan'] || ''
    }));

    if (lastPage !== null && page >= lastPage) break;
    if (totalCount !== null && rows.length >= totalCount) break;
    if (!pageRows.length && lastPage === null) break;
    page += 1;
  }

  logs.push(createRgdhLog('success', sourceKey, `RES/GES tam gun sayfali fallback toplam ${rows.length} kayit aldi.`, {
    endpoint,
    busbarId,
    internalBusbarId: busbarId,
    localDate,
    rowCount: rows.length,
    apiRows: rows.length,
    pageCount: Math.min(page + 1, maxPages)
  }));
  return { rows, logs, partialErrors: [] };
}

function clampRgdhRequestTimeout(timeoutMs, deadlineAt) {
  const requested = Math.max(1000, Number(timeoutMs || RGDH_HOUR_TIMEOUT_MS));
  if (!Number.isFinite(Number(deadlineAt))) return requested;
  const remaining = Number(deadlineAt) - Date.now();
  if (remaining <= 0) return 0;
  return Math.max(0, Math.min(requested, remaining));
}

function sourceLabelForLog(source) {
  return String(source).toUpperCase() === 'CONVENTIONAL' ? 'Konvansiyonel' : 'RES/GES';
}

function buildRgdhHourLabel(hour) {
  return {
    localStart: `${String(hour).padStart(2, '0')}:00`,
    localEnd: `${String((hour + 1) % 24).padStart(2, '0')}:00`
  };
}

function buildRgdhChunkLabel(startHour, spanHours) {
  const start = Number(startHour || 0);
  const end = Math.min(24, start + Number(spanHours || 1));
  return {
    localStart: `${String(start).padStart(2, '0')}:00`,
    localEnd: `${String(end).padStart(2, '0')}:00`
  };
}

function buildSafeRgdhRequestUrl(api, endpoint, params) {
  try {
    return api.buildRgdhUrl(endpoint, params, RGDH_YKS_ORIGIN).toString();
  } catch {
    return endpoint;
  }
}

function aggregateRgdhHourlyErrors(errors, context = {}) {
  const items = Array.isArray(errors) ? errors : [];
  const timeoutErrors = items.filter((item) => item?.phase !== 'On kontrol' && item?.errorType === 'PAGE_FETCH_TIMEOUT');
  if (!timeoutErrors.length) return items;
  const timeoutHours = timeoutErrors
    .map((item) => Number(item.hour))
    .filter((hour) => Number.isFinite(hour))
    .sort((a, b) => a - b);
  const otherErrors = items.filter((item) => !(item?.phase !== 'On kontrol' && item?.errorType === 'PAGE_FETCH_TIMEOUT'));
  const first = timeoutErrors[0] || {};
  return [
    ...otherErrors,
    {
      source: context.sourceKey || first.source || 'RGDH',
      busbarId: context.busbarId || first.busbarId || '',
      internalBusbarId: context.busbarId || first.internalBusbarId || '',
      localDate: context.localDate || first.localDate || '',
      errorType: 'YKS_HOURLY_TIMEOUT',
      errorClass: 'YKS_HOURLY_TIMEOUT',
      httpStatus: null,
      message: `${timeoutErrors.length} ${sourceLabelForLog(context.sourceKey || first.source || 'RGDH')} saatlik YKS istegi zaman asimina ugradi.`,
      failedHours: timeoutErrors.length,
      attemptedHours: timeoutErrors.length,
      hourRange: timeoutHours.length ? `${timeoutHours[0]}-${timeoutHours[timeoutHours.length - 1]}` : '',
      hourStart: first.hourStart || '',
      hourEnd: timeoutErrors[timeoutErrors.length - 1]?.hourEnd || '',
      requestUrl: first.requestUrl || ''
    }
  ];
}

function aggregateRgdhChunkErrors(errors, context = {}) {
  const items = Array.isArray(errors) ? errors : [];
  const timeoutErrors = items.filter((item) => item?.phase !== 'On kontrol' && item?.errorType === 'PAGE_FETCH_TIMEOUT');
  if (!timeoutErrors.length) return items;
  const otherErrors = items.filter((item) => !(item?.phase !== 'On kontrol' && item?.errorType === 'PAGE_FETCH_TIMEOUT'));
  const timeoutHours = timeoutErrors
    .map((item) => Number(item.hour))
    .filter((hour) => Number.isFinite(hour))
    .sort((a, b) => a - b);
  const first = timeoutErrors[0] || {};
  const last = timeoutErrors[timeoutErrors.length - 1] || first;
  return [
    ...otherErrors,
    {
      source: context.sourceKey || first.source || 'WIND',
      busbarId: context.busbarId || first.busbarId || '',
      internalBusbarId: context.busbarId || first.internalBusbarId || '',
      localDate: context.localDate || first.localDate || '',
      errorType: 'YKS_CHUNK_TIMEOUT',
      errorClass: 'YKS_CHUNK_TIMEOUT',
      httpStatus: null,
      message: `${timeoutErrors.length} RES/GES parca istegi zaman asimina ugradi.`,
      failedChunks: timeoutErrors.length,
      attemptedChunks: timeoutErrors.length,
      hourRange: timeoutHours.length ? `${timeoutHours[0]}-${timeoutHours[timeoutHours.length - 1]}` : '',
      chunkStart: first.chunkStart || first.hourStart || '',
      chunkEnd: last.chunkEnd || last.hourEnd || '',
      hourStart: first.hourStart || first.chunkStart || '',
      hourEnd: last.hourEnd || last.chunkEnd || '',
      requestUrl: first.requestUrl || ''
    }
  ];
}

async function runWithConcurrency(items, limit, worker) {
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, Number(limit || 1)), items.length || 1);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  }));
}

function sortRgdhRowsByMeasurementDate(rows) {
  return [...(rows || [])].sort((a, b) => String(a?.measurementDate || '').localeCompare(String(b?.measurementDate || '')));
}

function firstRgdhValue(value) {
  return Array.isArray(value) && value.length ? value[0] : '';
}

async function resolveSelectedRgdhBusbarInternalIds(payload, selectedBusbar, sourceType) {
  const explicit = Array.isArray(payload.busbarInternalIds)
    ? payload.busbarInternalIds
    : [payload.busbarInternalId];
  const cleaned = explicit.map((value) => String(value || '').trim()).filter(Boolean);
  if (cleaned.length) {
    rgdhLastInternalIdResolution = { method: 'explicit', pageCount: 0, internalBusbarId: cleaned[0] };
    return [...new Set(cleaned)];
  }

  if (selectedBusbar.busbarInternalId) {
    rgdhLastInternalIdResolution = { method: 'selectedBusbar', pageCount: 0, internalBusbarId: selectedBusbar.busbarInternalId };
    return [String(selectedBusbar.busbarInternalId)];
  }
  if (!selectedBusbar.busbarId && !selectedBusbar.busbarName) {
    throw createRgdhError('Once katalogdan bara secin. Toplu YKS cekimi yerine tek bara secimi zorunludur.', 'MISSING_BUSBAR_SELECTION');
  }

  const cacheKey = buildRgdhBusbarCacheKey(selectedBusbar, sourceType);
  const cached = rgdhBusbarInternalIdCache.get(cacheKey);
  if (cached?.id) {
    rgdhLastInternalIdResolution = { ...(cached.meta || {}), method: `${cached.meta?.method || 'catalog'}-cache`, internalBusbarId: cached.id };
    return [String(cached.id)];
  }

  const resolved = await resolveRgdhInternalIdFromCatalog(selectedBusbar, sourceType);
  if (resolved?.id) {
    rgdhBusbarInternalIdCache.set(cacheKey, resolved);
    rgdhLastInternalIdResolution = { ...(resolved.meta || {}), internalBusbarId: resolved.id };
    return [String(resolved.id)];
  }

  throw createRgdhError('Secili bara icin YKS ic ID bulunamadi. Bara listesini yenileyip tekrar deneyin.', 'MISSING_BUSBAR_SELECTION');
}

async function resolveRgdhInternalIdFromCatalog(selectedBusbar, sourceType) {
  const api = getRgdhApiClient();
  const catalogType = sourceType === 'CONVENTIONAL' ? 'CONVENTIONAL' : (sourceType === 'ALL' ? selectedBusbar.sourceType || 'ALL' : sourceType);
  const selectedId = String(selectedBusbar.busbarId || '').trim();
  const selectedName = normalizeRgdhLookupText(selectedBusbar.busbarName);
  const attempts = buildRgdhBusbarLookupAttempts(api, catalogType, selectedBusbar);
  let pageCount = 0;
  let lastError = null;

  for (const attempt of attempts) {
    try {
      const fetched = await fetchRgdhWithFallbackDetailed(api.RGDH_ENDPOINTS.busbars, attempt.params, {
        maxPages: attempt.maxPages,
        skipDirectFallback: true
      });
      pageCount += countRgdhCatalogPages(fetched.logs);
      const hit = findSelectedRgdhCatalogHit(fetched.rows, selectedId, selectedName);
      if (hit?.id) {
        return {
          id: String(hit.id),
          meta: {
            method: attempt.method,
            pageCount,
            sourceType: catalogType,
            displayBusbarId: selectedId,
            busbarName: selectedBusbar.busbarName || '',
            internalBusbarId: String(hit.id)
          }
        };
      }
    } catch (error) {
      lastError = error;
      pageCount += countRgdhCatalogPages(error?.rgdhLogs);
    }
  }

  rgdhLastInternalIdResolution = {
    method: 'not-found',
    pageCount,
    sourceType: catalogType,
    displayBusbarId: selectedId,
    busbarName: selectedBusbar.busbarName || '',
    errorType: sanitizeRgdhBackgroundError(lastError).errorType
  };
  return null;
}

function buildRgdhBusbarLookupAttempts(api, catalogType, selectedBusbar) {
  const attempts = [];
  const selectedId = String(selectedBusbar.busbarId || '').trim();
  const selectedName = String(selectedBusbar.busbarName || '').trim();
  if (selectedId) {
    attempts.push({
      method: 'targeted-busbarId',
      maxPages: 1,
      params: api.buildBusbarCatalogParams(catalogType, {
        'busbarId.equals': selectedId,
        size: RGDH_CATALOG_TARGETED_SIZE,
        page: 0
      })
    });
  }
  if (selectedName) {
    attempts.push({
      method: 'targeted-busbarName',
      maxPages: 1,
      params: api.buildBusbarCatalogParams(catalogType, {
        'busbarName.contains': selectedName,
        size: RGDH_CATALOG_TARGETED_SIZE,
        page: 0
      })
    });
  }
  attempts.push({
    method: 'bounded-catalog',
    maxPages: RGDH_CATALOG_FALLBACK_MAX_PAGES,
    params: api.buildBusbarCatalogParams(catalogType, {
      size: 2000,
      page: 0
    })
  });
  return attempts;
}

function findSelectedRgdhCatalogHit(rows, selectedId, selectedName) {
  return (rows || []).find((row) => {
    const rowBusbarId = String(row?.busbarId || '').trim();
    const rowName = normalizeRgdhLookupText(row?.busbarName || row?.name || '');
    if (selectedId && rowBusbarId === selectedId) return true;
    return selectedName && rowName === selectedName;
  });
}

function countRgdhCatalogPages(logs) {
  return (logs || []).filter((log) => /Sayfa \d+:/.test(String(log?.message || ''))).length;
}

function buildRgdhBusbarCacheKey(selectedBusbar, sourceType) {
  return [
    String(sourceType || '').toUpperCase(),
    String(selectedBusbar.sourceType || '').toUpperCase(),
    String(selectedBusbar.busbarId || '').trim(),
    normalizeRgdhLookupText(selectedBusbar.busbarName)
  ].join('|');
}

function normalizeSelectedRgdhBusbar(raw) {
  const item = raw && typeof raw === 'object' ? raw : {};
  return {
    busbarInternalId: String(item.busbarInternalId || item.internalId || '').trim(),
    busbarId: String(item.busbarId || '').trim(),
    busbarName: String(item.busbarName || '').trim(),
    sourceType: normalizeRgdhSourceType(item.sourceType || item.busbarType || item.sourceKind || ''),
    plantName: String(item.plantName || '').trim(),
    rgkType: String(item.rgkType || '').trim(),
    sourceKind: String(item.sourceKind || '').trim(),
    hasAuxiliarySource: item.hasAuxiliarySource === true || item.hybridAuxiliary === true,
    hybridAuxiliary: item.hybridAuxiliary === true || item.hasAuxiliarySource === true
  };
}

function resolveEffectiveRgdhSourceType(requestedSourceType, selectedBusbar) {
  const requested = String(requestedSourceType || 'ALL').toUpperCase();
  if (requested === 'HYBRID') return selectedBusbar.sourceType || 'ALL';
  if (requested !== 'ALL') return requested;
  return selectedBusbar.sourceType || 'CONVENTIONAL';
}

function normalizeRgdhSourceType(value) {
  const text = String(value || '').toUpperCase();
  if (/HYBRID|HIBRIT/.test(text)) return 'WIND';
  if (/WIND|SOLAR|RES|GES|RUZGAR|RÜZGAR/.test(text)) return 'WIND';
  if (/CONVENTIONAL|KONV/.test(text)) return 'CONVENTIONAL';
  return '';
}

function normalizeRgdhLookupText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ıI]/g, 'i')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function resolveRgdhWindBusbarIds(payload) {
  const explicit = Array.isArray(payload.busbarInternalIds)
    ? payload.busbarInternalIds
    : [payload.busbarInternalId];
  const cleaned = explicit.map((value) => String(value || '').trim()).filter(Boolean);
  if (cleaned.length) return [...new Set(cleaned)];

  try {
    const api = getRgdhApiClient();
    const fetched = await fetchRgdhWithFallbackDetailed(api.RGDH_ENDPOINTS.busbars, api.buildBusbarCatalogParams('WIND'));
    const ids = extractWindBusbarInternalIds(fetched.rows);
    if (ids.length) return ids;
  } catch {
    // DOM discovery below is a diagnostic fallback when the catalog endpoint is unavailable.
  }

  const discovered = await safeRgdhDomScrape({ discoverOnly: true });
  return [...new Set((discovered.busbarInternalIds || []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function extractWindBusbarInternalIds(rows) {
  return [...new Set((rows || [])
    .filter((row) => /WIND|SOLAR|HYBRID|RES|GES|HIBRIT/i.test(String(row?.busbarType || row?.type || '')))
    .map((row) => String(row?.id || '').trim())
    .filter((value) => /^\d{6,}$/.test(value)))];
}

async function handleRgdhPageFetch(payload) {
  const result = await runRgdhPageFetchInYksTab(payload);
  return result?.ok ? result : { ok: false, error: result?.error || 'RGDH page fetch basarisiz.' };
}

async function handleRgdhDomScrape(payload) {
  return safeRgdhDomScrape(payload);
}

async function safeRgdhDomScrape(payload) {
  try {
    return await runRgdhDomScrapeInYksTab(payload);
  } catch (error) {
    return { ok: false, rows: [], busbarInternalIds: [], ...sanitizeRgdhBackgroundError(error) };
  }
}

async function runRgdhPageFetchInYksTab(payload) {
  validateRgdhEndpoint(payload.endpoint);
  const tab = await findYksTab();
  await injectRgdhYksInstrumentation(tab.id);
  const startedAt = Date.now();
  const [execution] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: rgdhPageFetchMainWorld,
    args: [{ endpoint: payload.endpoint, params: payload.params || {}, baseUrl: RGDH_YKS_ORIGIN, timeoutMs: payload.timeoutMs || RGDH_PAGE_FETCH_TIMEOUT_MS }]
  });
  const result = execution?.result || { ok: false, error: 'YKS sekmesinden yanit alinamadi.', errorType: 'PAGE_FETCH_ERROR' };
  await recordRgdhPageFetchDiagnostic(payload, result, Date.now() - startedAt);
  return result;
}

async function injectRgdhYksInstrumentation(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      files: ['yks-rgdh-instrumentation.js']
    });
  } catch (error) {
    await handleRgdhDiagnosticEvent({
      level: 'warn',
      category: 'instrumentation',
      route: 'rgdh-monitor',
      message: `YKS instrumentation enjekte edilemedi: ${error?.message || String(error)}`,
      detail: { errorType: 'INSTRUMENTATION_INJECT_FAILED' }
    });
  }
}

async function recordRgdhPageFetchDiagnostic(payload, result, durationMs) {
  const api = getRgdhApiClient();
  const endpoint = String(payload?.endpoint || '');
  const params = payload?.params || {};
  const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, params);
  const ok = Boolean(result?.ok);
  const httpStatus = Number.isFinite(Number(result?.httpStatus))
    ? Number(result.httpStatus)
    : (ok ? 200 : null);
  const rowCount = Array.isArray(result?.rows) ? result.rows.length : 0;
  await handleRgdhDiagnosticEvent({
    level: ok ? 'success' : 'error',
    category: 'network',
    route: endpoint.replace(/^\/api\//, ''),
    method: 'GET',
    url: requestUrl,
    status: httpStatus,
    durationMs,
    message: ok ? `GET ${endpoint} -> ${httpStatus}` : (result?.error || result?.reason || `GET ${endpoint} basarisiz.`),
    detail: {
      endpoint,
      params: sanitizeRgdhParams(params),
      requestUrl,
      rowCount,
      apiRows: rowCount,
      httpStatus,
      errorType: result?.errorType || null,
      errorClass: result?.errorType || null,
      transport: result?.transport || 'page-context',
      internalBusbarId: params['busbarId.equals'] || ''
    }
  });
}

async function runRgdhDomScrapeInYksTab(payload) {
  const tab = await findYksTab();
  try {
    return await sendMessageToTab(tab.id, { type: 'RGDH_DOM_SCRAPE', payload });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] });
    return sendMessageToTab(tab.id, { type: 'RGDH_DOM_SCRAPE', payload });
  }
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

async function findYksTab() {
  const tabs = await chrome.tabs.query({});
  const tab = tabs.find((item) => /^https:\/\/yks\.teias\.gov\.tr\//i.test(String(item.url || '')));
  if (!tab?.id) throw createRgdhError('Acik YKS sekmesi bulunamadi. Lutfen YKS sayfasinda oturum acin.', 'NO_YKS_TAB');
  return tab;
}

function getRgdhApiClient() {
  const api = globalThis.RGDH_API_CLIENT;
  if (!api) throw createRgdhError('RGDH API client yuklu degil.', 'CLIENT_UNAVAILABLE');
  return api;
}

function getRgdhDiagnostics() {
  const diag = globalThis.RGDH_DIAGNOSTICS;
  if (diag) return diag;
  return {
    sanitizeDiagnosticEvent: (event) => ({
      time: new Date().toISOString(),
      level: String(event?.level || 'info'),
      category: String(event?.category || 'runtime'),
      route: String(event?.route || ''),
      method: String(event?.method || ''),
      url: sanitizeRgdhLogMessage(event?.url || ''),
      status: Number.isFinite(Number(event?.status)) ? Number(event.status) : null,
      durationMs: Number.isFinite(Number(event?.durationMs)) ? Number(event.durationMs) : null,
      requestHeaders: {},
      responseHeaders: {},
      message: sanitizeRgdhLogMessage(event?.message || ''),
      detail: sanitizeRgdhLogDetail(event?.detail || {})
    }),
    pushBoundedEvent: (events, event, limit) => [event, ...(events || [])].slice(0, limit || RGDH_DIAGNOSTIC_LIMIT),
    diagnosticEventsToCsv: (events) => {
      const rows = ['\uFEFFZaman;Seviye;Kategori;Route;Metot;URL;HTTP;Süre(ms);Mesaj;Detay'];
      (events || []).forEach((event) => {
        rows.push([
          event.time || '',
          event.level || '',
          event.category || '',
          event.route || '',
          event.method || '',
          event.url || '',
          event.status ?? '',
          event.durationMs ?? '',
          event.message || '',
          JSON.stringify(event.detail || {})
        ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'));
      });
      return rows.join('\n');
    }
  };
}

function validateRgdhEndpoint(endpoint) {
  if (!RGDH_ALLOWED_PATHS.includes(String(endpoint || ''))) {
    throw createRgdhError('RGDH endpoint whitelist disinda.', 'VALIDATION_ERROR');
  }
}

function sanitizeRgdhBackgroundError(error) {
  const message = String(error?.message || error || 'Bilinmeyen RGDH hatasi').slice(0, 500);
  return {
    error: message,
    message,
    errorType: classifyRgdhBackgroundErrorType(error, message),
    httpStatus: Number.isFinite(Number(error?.httpStatus)) ? Number(error.httpStatus) : null
  };
}

function classifyRgdhBackgroundErrorType(error, message) {
  const explicit = String(error?.errorType || '').trim();
  if (/maximum allowed size|64MiB|message length|message exceeded/i.test(message)) return 'MESSAGE_TOO_LARGE';
  if (explicit === 'AUTH_REQUIRED' && error?.pageErrorType) return 'AUTH_REQUIRED_DIRECT_FALLBACK';
  if (/abort|aborted|timeout|zaman asimi|zaman aşımı/i.test(message)) return 'PAGE_FETCH_TIMEOUT';
  if (Number(error?.httpStatus) >= 500 && !/busbarId\.equals/i.test(JSON.stringify(error?.detail || {}))) return 'UPSTREAM_500_NO_BUSBAR';
  return String(explicit || 'RGDH_ERROR').slice(0, 80);
}

function addRgdhLog(target, level, phase, message, detail) {
  if (!Array.isArray(target.logs)) target.logs = [];
  target.logs.push(createRgdhLog(level, phase, message, detail));
}

function createRgdhLog(level, phase, message, detail) {
  return {
    time: new Date().toLocaleString('tr-TR'),
    level: String(level || 'info'),
    phase: String(phase || 'YKS').slice(0, 80),
    message: sanitizeRgdhLogMessage(message),
    detail: sanitizeRgdhLogDetail(detail)
  };
}

function sanitizeRgdhLogMessage(message) {
  return String(message || 'Bilinmeyen RGDH durumu')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/authorization["':=\s]+[A-Za-z0-9._-]+/gi, 'authorization [redacted]')
    .slice(0, 500);
}

function sanitizeRgdhLogDetail(detail) {
  if (!detail || typeof detail !== 'object') return {};
  const allowed = {};
  [
    'endpoint', 'params', 'httpStatus', 'errorType', 'errorClass', 'source', 'busbarId', 'busbarName',
    'selectedBusbar', 'busbarInternalIds', 'internalBusbarId', 'displayBusbarId', 'resolvedInternalBusbarId',
    'candidateBusbarId', 'candidateBusbarIds', 'hybridAuxiliary', 'localDate',
    'sourceType', 'hour', 'hourStart', 'hourEnd', 'hourRange', 'chunkStart', 'chunkEnd', 'rowCount', 'rowCounts', 'pageCount',
    'resolverMethod', 'resolverPageCount', 'transport', 'apiRows', 'domRows', 'partialErrors',
    'metricEmptyRows', 'failedHours', 'attemptedHours', 'failedChunks', 'attemptedChunks',
    'requestUrl', 'pageTimeoutMs', 'concurrency', 'jobTimeoutMs'
  ].forEach((key) => {
    if (detail[key] !== undefined) allowed[key] = key === 'params' ? sanitizeRgdhParams(detail[key]) : detail[key];
  });
  return allowed;
}

function sanitizeRgdhParams(params) {
  const safe = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (/authorization|token|cookie/i.test(key)) return;
    safe[key] = value;
  });
  return safe;
}

function createRgdhError(message, errorType, httpStatus) {
  const error = new Error(message);
  error.errorType = errorType || 'RGDH_ERROR';
  error.httpStatus = Number.isFinite(Number(httpStatus)) ? Number(httpStatus) : null;
  return error;
}

async function rgdhPageFetchMainWorld(request) {
  const allowed = [
    '/api/rgdh-conventional-busbar-data',
    '/api/rgdh-wind-busbar-data',
    '/api/general-parameter-by-name',
    '/api/busbars'
  ];
  const endpoint = String(request?.endpoint || '');
  if (!allowed.includes(endpoint)) return { ok: false, error: 'Endpoint whitelist disinda.', errorType: 'VALIDATION_ERROR' };

  const baseUrl = String(request?.baseUrl || 'https://yks.teias.gov.tr').replace(/\/+$/, '');
  const params = request?.params || {};
  const page = Number(params.page || 0);
  const size = Number(params.size || 2000);
  const pageFetchTimeoutMs = Math.max(5000, Math.min(60000, Number(request?.timeoutMs || 60000)));
  const token = readYksBearerToken();

  const buildUrl = () => {
    const url = new URL(endpoint, baseUrl);
    Object.entries({ ...params, page, size }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const parseLast = (header) => {
    const part = String(header || '').split(',').find((item) => /rel="?last"?/i.test(item));
    const match = part?.match(/[?&]page=(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  let fetchTimer = null;
  try {
    const controller = new AbortController();
    fetchTimer = setTimeout(() => controller.abort(), pageFetchTimeoutMs);
    const response = await fetch(buildUrl(), {
      method: 'GET',
      credentials: 'include',
      headers: token
        ? { Accept: 'application/json', Authorization: `Bearer ${token}` }
        : { Accept: 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(fetchTimer);
    fetchTimer = null;
    if (!response.ok) {
      return {
        ok: false,
        error: `YKS endpoint hata dondurdu (${response.status}).`,
        errorType: response.status === 401 || response.status === 403 ? 'AUTH_REQUIRED' : (response.status >= 500 ? 'UPSTREAM_ERROR' : 'NETWORK_ERROR'),
        httpStatus: response.status
      };
    }
    const json = await response.json();
    const pageRows = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    const lastPage = parseLast(response.headers.get('link'));
    const totalCount = Number(response.headers.get('x-total-count')) || null;
    return { ok: true, rows: pageRows, page, lastPage, totalCount, httpStatus: 200, transport: 'page-context' };
  } catch (error) {
    if (fetchTimer !== null) clearTimeout(fetchTimer);
    return { ok: false, error: String(error?.message || error).slice(0, 500), errorType: classifyPageFetchMainWorldError(error) };
  }

  function classifyPageFetchMainWorldError(error) {
    const message = String(error?.message || error || '');
    if (String(error?.name || '') === 'AbortError' || /abort|aborted|timeout|zaman asimi|zaman aşımı/i.test(message)) {
      return 'PAGE_FETCH_TIMEOUT';
    }
    return 'PAGE_FETCH_ERROR';
  }

  function readYksBearerToken() {
    const storages = [];
    try { if (localStorage) storages.push(localStorage); } catch {}
    try { if (sessionStorage) storages.push(sessionStorage); } catch {}
    const preferredKeys = [
      'jhi-authenticationToken',
      'authenticationToken',
      'id_token',
      'access_token',
      'token',
      'jwt'
    ];

    for (const storage of storages) {
      for (const key of preferredKeys) {
        const token = cleanToken(safeGetItem(storage, key));
        if (token) return token;
      }
      const length = Number(storage?.length || 0);
      for (let index = 0; index < length; index += 1) {
        const key = storage.key?.(index);
        if (!/token|jwt/i.test(String(key || ''))) continue;
        const token = cleanToken(safeGetItem(storage, key));
        if (token) return token;
      }
    }
    return '';
  }

  function safeGetItem(storage, key) {
    try {
      return storage?.getItem?.(key);
    } catch {
      return '';
    }
  }

  function cleanToken(value) {
    let raw = String(value || '').trim();
    if (!raw || raw === 'null' || raw === 'undefined') return '';
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') raw = parsed.trim();
      else if (parsed?.token) raw = String(parsed.token).trim();
      else if (parsed?.access_token) raw = String(parsed.access_token).trim();
      else if (parsed?.id_token) raw = String(parsed.id_token).trim();
    } catch {}
    raw = raw.replace(/^Bearer\s+/i, '').trim();
    return /^[A-Za-z0-9._-]{8,}$/.test(raw) ? raw : '';
  }
}

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
