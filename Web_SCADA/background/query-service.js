const WebSCADAQuery = (() => {
  const batchSize = 200;
  function rowsFrom(response) {
    const result = response?.data?.result;
    if (!Array.isArray(result)) return [];
    return result.flatMap((item) => Array.isArray(item?.data) ? item.data : []);
  }
  async function execute(payload) {
    const config = await WebSCADAAuth.loadConfig();
    const auth = await WebSCADAAuth.ensureSession(config);
    if (!auth.ok) return { ok: false, error: auth.error || 'Superset oturumu acilamadi.', errorType: 'AUTH_REQUIRED', authMode: auth.authMode, usedFallback: false };
    const ids = Array.isArray(payload.measurementIds) ? payload.measurementIds.map(String) : [];
    const chunks = ids.length ? Array.from({ length: Math.ceil(ids.length / batchSize) }, (_, i) => ids.slice(i * batchSize, (i + 1) * batchSize)) : [[]];
    const responses = await Promise.all(chunks.map((measurementIds) => WebSCADAApi.fetchChart(config, { ...payload, measurementIds, chartPayload: null }, auth.authMode)));
    const failed = responses.find((result) => !result.ok);
    if (failed && !responses.some((result) => result.ok)) return { ...failed, usedFallback: false };
    const rows = responses.flatMap(rowsFrom);
    return { ok: true, data: { result: [{ data: rows }] }, authMode: auth.authMode, usedFallback: false, httpStatus: responses.find((result) => result.ok)?.httpStatus || null,
      meta: { totalBatches: chunks.length, completedBatches: responses.filter((result) => result.ok).length, failedBatches: responses.filter((result) => !result.ok).length } };
  }
  return { execute };
})();
