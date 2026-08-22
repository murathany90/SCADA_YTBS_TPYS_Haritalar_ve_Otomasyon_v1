const WebSCADAApi = (() => {
  const DEFAULTS = { dashboardId: 89, chartSliceId: 454, datasourceId: 3, rowLimit: 50000, timeRange: 'DATEADD(DATETIME("now"), -24, hour) : now' };
  function chartPayload(config, ids) {
    const elementNames = Array.isArray(config.elementNames) && config.elementNames.length ? config.elementNames.map(String) : [String(config.elementName || 'P')];
    const filters = [];
    const adhoc = [];
    const add = (col, op, val) => { filters.push({ col, op, val }); adhoc.push({ clause: 'WHERE', expressionType: 'SIMPLE', subject: col, operator: op, comparator: val }); };
    add('elementName', elementNames.length === 1 ? '==' : 'IN', elementNames.length === 1 ? elementNames[0] : elementNames);
    if (ids.length) add('sinsid', 'IN', ids);
    if (config.kvFilters?.length) add('b2Name', 'IN', config.kvFilters.map(String));
    if (config.tearFilters?.length) add('tear', 'IN', config.tearFilters.map(String));
    const columns = ['sinsid', 'b1Name', 'b2Name', 'b3Name', 'elementName'];
    const metrics = [{ label: 'MAX(__time)', expressionType: 'SQL', sqlExpression: 'MAX(__time)' }, { label: 'AVG(maxValue)', expressionType: 'SQL', sqlExpression: 'AVG(maxValue)' }];
    const timeRange = String(config.timeRange || DEFAULTS.timeRange);
    const limit = Number(config.rowLimit || DEFAULTS.rowLimit);
    return { datasource: { id: Number(config.datasourceId || DEFAULTS.datasourceId), type: 'table' }, force: true,
      form_data: { slice_id: Number(config.chartSliceId || DEFAULTS.chartSliceId), viz_type: 'table', datasource: `${Number(config.datasourceId || DEFAULTS.datasourceId)}__table`, granularity_sqla: '__time', time_range: timeRange, groupby: columns, metrics, adhoc_filters: adhoc, row_limit: limit, order_desc: true },
      queries: [{ time_range: timeRange, granularity: '__time', columns, metrics, filters, orderby: [['MAX(__time)', false]], row_limit: limit }], result_format: 'json', result_type: 'full' };
  }
  async function fetchChart(config, payload, authMode) {
    const ids = Array.isArray(payload.measurementIds) ? payload.measurementIds.map(String) : [];
    const body = payload.chartPayload || chartPayload({ ...config, ...payload }, ids);
    const token = await WebSCADAAuth.csrfToken(config);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${WebSCADAAuth.baseUrl(config.baseUrl)}/api/v1/chart/data?dashboard_id=${Number(config.dashboardId || DEFAULTS.dashboardId)}&force=true`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { 'X-CSRFToken': token } : {}) }, body: JSON.stringify(body), signal: controller.signal });
      if (!response.ok) return { ok: false, error: `Superset sorgusu basarisiz (${response.status}).`, errorType: response.status === 401 || response.status === 403 ? 'AUTH_REQUIRED' : 'UPSTREAM_ERROR', httpStatus: response.status, authMode };
      return { ok: true, data: await response.json(), httpStatus: response.status, authMode };
    } catch (error) { return { ok: false, error: error?.name === 'AbortError' ? 'Superset sorgusu zaman asimina ugradi.' : (error.message || String(error)), errorType: error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR', authMode }; }
    finally { clearTimeout(timer); }
  }
  return { DEFAULTS, chartPayload, fetchChart };
})();
