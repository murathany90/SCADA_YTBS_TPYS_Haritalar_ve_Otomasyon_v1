const WebSCADAQuery = (() => {
  const BATCH_SIZE = 200;
  const rowsFrom = (response) => Array.isArray(response?.data?.result) ? response.data.result.flatMap((item) => Array.isArray(item?.data) ? item.data : []) : [];
  const chunks = (ids) => ids.length ? Array.from({ length: Math.ceil(ids.length / BATCH_SIZE) }, (_, i) => ids.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)) : [[]];
  const uniqueIds = (payload) => [...new Set((Array.isArray(payload?.measurementIds) ? payload.measurementIds : []).map(String).filter(Boolean))];
  const status = (payload, message) => { if (payload?.requestId) chrome.runtime.sendMessage({ type: 'SCADA_FETCH_PROGRESS', payload: { requestId: payload.requestId, stage: 'auth', phaseMessage: message } }).catch(() => {}); };
  async function authenticated(payload) {
    const config = await WebSCADAAuth.loadConfig();
    const auth = await WebSCADAAuth.ensureSession(config, (message) => status(payload, message));
    return { config, auth };
  }
  async function fetchBatches(payload, makePayload) {
    const { config, auth } = await authenticated(payload);
    if (!auth.ok) return { ok: false, error: auth.error, errorType: auth.errorType || 'AUTH_REQUIRED', authMode: auth.authMode, usedFallback: auth.authMode === 'hidden-tab' };
    const ids = uniqueIds(payload); const results = [];
    for (const group of chunks(ids)) {
      const response = await WebSCADAApi.fetchChart(config, makePayload(group, config), auth.authMode);
      results.push(response); if (!response.ok) break;
    }
    const failed = results.find((result) => !result.ok); if (failed && !results.some((result) => result.ok)) return { ...failed, usedFallback: auth.authMode === 'hidden-tab' };
    return { ok: true, data: { result: [{ data: results.flatMap(rowsFrom) }] }, authMode: auth.authMode, usedFallback: auth.authMode === 'hidden-tab', httpStatus: results.find((result) => result.ok)?.httpStatus || null, meta: { totalBatches: chunks(ids).length, completedBatches: results.filter((result) => result.ok).length, failedBatches: results.filter((result) => !result.ok).length } };
  }
  function executeLiveScada(payload) {
    const livePayload = { ...payload, timeRange: payload?.timeRange || 'DATEADD(DATETIME("now"), -10, minute) : now', queryMode: 'raw' };
    return fetchBatches(livePayload, (measurementIds, config) => ({ ...livePayload, measurementIds, chartPayload: WebSCADAApi.chartPayload({ ...config, ...livePayload }, measurementIds) }));
  }
  function executeHistorySeries(payload) {
    const historyPayload = { ...payload, queryMode: payload?.queryMode || 'timeseries' };
    return fetchBatches(historyPayload, (measurementIds, config) => ({ ...historyPayload, measurementIds, chartPayload: WebSCADAApi.historyPayload(config, { ...historyPayload, measurementIds }, measurementIds) }));
  }
  function timestampOf(row) { const value = row?.__time ?? row?.timestamp ?? row?.['MAX(__time)']; const ms = value instanceof Date ? value.getTime() : new Date(value).getTime(); return Number.isFinite(ms) ? ms : NaN; }
  function idOf(row) { return String(row?.sinsid ?? row?.measurementId ?? ''); }
  function elementOf(row) { return String(row?.elementName ?? ''); }
  function pickSnapshot(rows, at, ids) {
    const requested = new Set(ids); const best = new Map();
    rows.forEach((row) => { const id = idOf(row); const time = timestampOf(row); if (!id || (requested.size && !requested.has(id)) || !Number.isFinite(time) || time > at) return; const key = `${id}|${elementOf(row)}`; if (!best.has(key) || timestampOf(best.get(key)) < time) best.set(key, row); });
    return [...best.values()];
  }
  async function executeHistoricalSnapshot(payload) {
    const at = Number(payload?.at); if (!Number.isFinite(at)) return { ok: false, error: 'Gecmis an (at) eksik veya gecersiz.', errorType: 'INVALID_PAYLOAD', authMode: 'none', usedFallback: false };
    const windowMs = Math.max(60 * 1000, Number(payload?.windowMs || payload?.toleranceMs || 10 * 60 * 1000)); const startTime = at - windowMs;
    const raw = await executeHistorySeries({ ...payload, startTime, endTime: at, queryMode: 'raw' }); if (!raw.ok) return raw;
    const ids = uniqueIds(payload); let sourceRows = rowsFrom(raw); let rows = pickSnapshot(sourceRows, at, ids); let missingIds = ids.filter((id) => !rows.some((row) => idOf(row) === id)); let recoveredViaFallback = false;
    if (missingIds.length) { const fallback = await executeHistorySeries({ ...payload, measurementIds: missingIds, startTime: at - 24 * 3600 * 1000, endTime: at, queryMode: 'raw' }); if (fallback.ok) { sourceRows = sourceRows.concat(rowsFrom(fallback)); rows = pickSnapshot(sourceRows, at, ids); missingIds = ids.filter((id) => !rows.some((row) => idOf(row) === id)); recoveredViaFallback = true; } }
    return { ...raw, data: { result: [{ data: rows }] }, meta: { ...raw.meta, at, windowStartMs: startTime, windowEndMs: at, requestedIds: ids, matchedIds: [...new Set(rows.map(idOf))], missingIds, recoveredViaFallback } };
  }
  function executeWorkspaceQuery(payload) { return executeHistorySeries({ ...payload, queryMode: 'timeseries' }); }
  return { executeLiveScada, executeHistorySeries, executeHistoricalSnapshot, executeWorkspaceQuery, pickSnapshot, timestampOf };
})();
