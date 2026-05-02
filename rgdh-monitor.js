(function () {
  const state = {
    apiRows: [],
    domRows: [],
    ekcRows: [],
    ekcGroups: [],
    ekcLoaded: false,
    ekcBindingTarget: null,
    catalogRows: [],
    discoveredBusbarInternalIds: [],
    comparison: null,
    pivot: { rows: [] },
    activeTab: 'raw',
    chartSelection: { busbarId: null, hour: null, date: null },
    compareSelection: { busbarId: '', ytm: '', hourMode: 'all', hourStart: null, hourEnd: null, hour: null, date: null },
    selectedTestBusbarKey: '',
    errors: [],
    fetchLogs: [],
    yksLogs: [],
    activeFetchJobId: '',
    showVoltage: false
  };

  const el = {};
  const RGDH_STANDARD_JOB_TIMEOUT_MS = 60000;
  const RGDH_HYBRID_JOB_TIMEOUT_MS = 300000;
  const RGDH_HYBRID_CONTINUATION_TIMEOUT_MS = 900000;
  const RGDH_HYBRID_CONTINUATION_POLL_GRACE_MS = 60000;
  const COMPARE_KY_THRESHOLD_PCT = 80;
  const COMPARE_AVG_DELTA_LIMITS = { dV: 0.5, dP: 1, dQ: 1 };
  const COMPARE_MAX_DELTA_LIMITS = { dV: 3, dP: 10, dQ: 5 };

  document.addEventListener('DOMContentLoaded', init);

  const CATALOG_SHORT_TO_LONG = {
    bt: 'baraTipi', bid: 'busbarId', bn: 'busbarName', rt: 'rgkType', vl: 'voltageLevel',
    ytm: 'ytm', pid: 'plantId', pn: 'plantName',
    b1t: 'busbar1Ta', b1s: 'busbar1Setnum', b2t: 'busbar2Ta', b2s: 'busbar2Setnum',
    b3t: 'busbar3Ta', b3s: 'busbar3Setnum',
    un: 'unitName', ue: 'uevcbName', uid: 'unitId', sk: 'sourceKind',
    apt: 'activePowerTa', aps: 'activePowerSetnum', rpt: 'reactivePowerTa', rps: 'reactivePowerSetnum',
    pnom: 'unitPnomMw', pmkud: 'unitPmkudMw',
    lowTest: 'lowExcitationTest', highTest: 'highExcitationTest',
    nomLow: 'nominalLowExcitation', nomHigh: 'nominalHighExcitation',
    sd: 'speedDrop', pf: 'powerFactor', tv: 'terminalVoltage', ua: 'unitActive'
  };

  function expandCatalogRow(short) {
    const row = {};
    for (const [shortKey, longKey] of Object.entries(CATALOG_SHORT_TO_LONG)) {
      row[longKey] = short[shortKey] !== undefined ? short[shortKey] : null;
    }
    row.sourceOrigin = 'CATALOG_EMBED';
    row.sourceType = short.bt === 'WIND' ? 'WIND' : 'CONVENTIONAL';
    row.unitActive = short.ua === 'AKT\u0130F' ? true : short.ua === 'PAS\u0130F' ? false : null;
    return row;
  }

  const DEFAULT_CATALOG_PATHS = [
    'yks_izleme_modul/yks_docs/rgdh_unite_tanimi_.csv',
    'yks_izleme_modul/yks_docs/data1/_BARA_VE_UNITE_TANIMLAMA_CSV_2026-04-30T12_20_06Z_.csv',
    'yks_izleme_modul/yks_docs/data1/_BARA_VE_\u00DCN\u0130TE_TANIMLAMA_CSV_2026-04-30T12_20_06Z_.csv'
  ];

  async function init() {
    cacheElements();
    restoreTheme();
    bindEvents();
    el.filterDate.value = await initialDate();
    const filters = await RGDH_STORAGE.loadFilters();
    applyFilters(filters);
    loadEmbeddedCatalog();
    await loadDefaultCatalog();
    syncDynamicOptions();
    renderAll();
  }

  function loadEmbeddedCatalog() {
    const embeddedRows = [];
    const auxiliaryRows = [];
    if (typeof RGDH_CATALOG_DATA !== 'undefined' && Array.isArray(RGDH_CATALOG_DATA)) {
      embeddedRows.push(...RGDH_CATALOG_DATA.map(expandCatalogRow));
    }
    if (typeof RGDH_AUXILIARY_CATALOG_DATA !== 'undefined' && Array.isArray(RGDH_AUXILIARY_CATALOG_DATA)) {
      auxiliaryRows.push(...RGDH_AUXILIARY_CATALOG_DATA);
    }
    const rows = [...auxiliaryRows, ...embeddedRows];
    if (!rows.length) return;
    state.catalogRows = mergeCatalogRows([...state.catalogRows, ...rows]);
    pushFetchLog('success', 'Katalog', `Gomulu katalog yuklendi: ${rows.length} satir.`, { source: 'embedded' });
  }

  async function loadDefaultCatalog() {
    let loaded = false;
    for (const path of DEFAULT_CATALOG_PATHS) {
      try {
        const url = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
          ? chrome.runtime.getURL(path)
          : path;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const parsed = RGDH_CSV.parseRgdhCsvText(text, { filename: path });
        if (parsed.type === 'BUSBAR_UNIT_CATALOG') {
          replaceCatalogRowsWithPrimary(parsed.rows);
          pushFetchLog('success', 'Katalog', `Dosya katalogu yuklendi: ${parsed.rows.length} satir.`, { path });
          loaded = true;
          break;
        }
      } catch (error) {
        pushFetchLog('warn', 'Katalog', `Katalog denendi: ${path} - ${error.message}`, { path });
      }
    }
    if (!loaded && state.catalogRows.length === 0) {
      pushFetchLog('error', 'Katalog', 'Dosya ve gomulu katalog yuklenemedi.', { paths: DEFAULT_CATALOG_PATHS });
    }
  }

  function cacheElements() {
    [
      'filterDate', 'filterEndDate', 'filterSourceType', 'filterSearch', 'filterNotice',
      'btnFetchYks', 'btnCancelFetch', 'btnPickCsv', 'csvInput',
      'btnExportCsv', 'btnToggleTheme', 'btnToggleVoltage',
      'statSource', 'statRows', 'statBusbars',
      'statMismatch', 'statStatus', 'rawTable', 'dailyTable', 'btnToggleDailyMetricTable', 'dailyMetricWrap', 'dailyMetricTable', 'chartContextLabel', 'chartsRoot', 'compareContextLabel', 'compareChartsRoot', 'compareTable', 'testsTable', 'testUnitDetailsTable',
      'testCatalogSearchInput', 'testBusbarTypeSelect', 'testBusbarSelect', 'testHybridOnlyCheckbox', 'btnExportTestsCsv',
      'btnErrorDetails', 'extensionLogCount', 'extensionLogPanel', 'btnCloseErrors', 'btnExportExtensionLogCsv', 'btnClearErrorLogs', 'extensionLogList',
      'btnYksLogs', 'yksLogCount', 'yksLogPanel', 'btnRefreshYksLogs', 'btnExportYksLogCsv', 'btnClearYksLogs', 'btnCloseYksLogs', 'yksLogList',
      'fetchLogPanel', 'btnCloseFetchLog', 'fetchLogList'
    ].forEach((id) => { el[id] = document.getElementById(id); });
    el.tabs = Array.from(document.querySelectorAll('[data-tab]'));
    el.panels = Array.from(document.querySelectorAll('[data-panel]'));
  }

  function bindEvents() {
    el.tabs.forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    [el.filterDate, el.filterEndDate, el.filterSourceType, el.filterSearch]
      .forEach((input) => input.addEventListener('input', () => {
        persistFilters();
        renderAll();
      }));
    [el.testCatalogSearchInput, el.testBusbarTypeSelect, el.testBusbarSelect, el.testHybridOnlyCheckbox]
      .forEach((input) => input.addEventListener('input', () => {
        syncDynamicOptions();
        renderTestsTable();
      }));
    el.btnFetchYks.addEventListener('click', fetchYksData);
    el.btnCancelFetch?.addEventListener('click', cancelYksFetch);
    el.btnPickCsv.addEventListener('click', () => el.csvInput.click());
    el.csvInput.addEventListener('change', handleCsvFiles);
    el.btnToggleDailyMetricTable?.addEventListener('click', toggleDailyMetricTable);
    el.btnExportCsv.addEventListener('click', exportCsv);
    el.btnExportTestsCsv?.addEventListener('click', exportTestsCsv);
    el.btnErrorDetails.addEventListener('click', () => {
      el.extensionLogPanel.hidden = !el.extensionLogPanel.hidden;
      if (!el.extensionLogPanel.hidden) renderErrors();
    });
    el.btnYksLogs?.addEventListener('click', async () => {
      el.yksLogPanel.hidden = !el.yksLogPanel.hidden;
      if (!el.yksLogPanel.hidden) await refreshYksLogs();
    });
    el.btnCloseErrors.addEventListener('click', () => { el.extensionLogPanel.hidden = true; });
    el.btnCloseYksLogs?.addEventListener('click', () => { el.yksLogPanel.hidden = true; });
    el.btnRefreshYksLogs?.addEventListener('click', refreshYksLogs);
    el.btnExportExtensionLogCsv?.addEventListener('click', exportExtensionLogCsv);
    el.btnExportYksLogCsv?.addEventListener('click', exportYksLogCsv);
    el.btnClearErrorLogs?.addEventListener('click', clearErrorLogs);
    el.btnClearYksLogs?.addEventListener('click', clearYksLogs);
    el.btnCloseFetchLog.addEventListener('click', () => { el.fetchLogPanel.hidden = true; });
    el.btnToggleTheme.addEventListener('click', toggleTheme);
    el.btnToggleVoltage.addEventListener('click', toggleVoltageColumns);
  }

  async function initialDate() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  function applyFilters(filters) {
    if (!filters || typeof filters !== 'object') return;
    Object.entries({
      filterDate: filters.date,
      filterEndDate: filters.endDate,
      filterSourceType: normalizeSelectedSourceType(filters.sourceType || 'ALL'),
      filterSearch: filters.search
    }).forEach(([id, value]) => {
      if (value !== undefined && value !== null && el[id]) el[id].value = value;
    });
  }

  function readFilters() {
    return {
      date: el.filterDate.value,
      endDate: el.filterEndDate.value,
      sourceType: normalizeSelectedSourceType(el.filterSourceType.value || 'ALL'),
      search: el.filterSearch.value.trim()
    };
  }

  function persistFilters() {
    RGDH_STORAGE.saveFilters(readFilters()).catch(() => {});
  }

  async function fetchYksData() {
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    const selectedInternalIds = resolveSelectedInternalIds(filters, selectedBusbar);
    const fetchSourceType = resolveFetchSourceType(filters.sourceType, selectedBusbar);
    resetFetchLogs();
    el.fetchLogPanel.hidden = false;
    el.btnFetchYks.disabled = true;
    if (el.btnCancelFetch) {
      el.btnCancelFetch.hidden = false;
      el.btnCancelFetch.disabled = false;
    }
    pushFetchLog('info', 'Hazirlik', 'YKS veri cekimi baslatildi.', {
      localDate: filters.date,
      endDate: filters.endDate,
      sourceType: fetchSourceType,
      busbarInternalIds: selectedInternalIds.length ? selectedInternalIds : ['YKS katalogundan cozumlenecek'],
      busbarId: selectedBusbar?.busbarId || null,
      busbarName: selectedBusbar?.busbarName || null
    });
    setStatus('YKS verisi cekiliyor...');

    try {
      if (!selectedBusbar && !selectedInternalIds.length) {
        const error = new Error('Once katalogdan bara secin. Toplu YKS cekimi yerine tek bara secimi zorunludur.');
        error.errorType = 'MISSING_BUSBAR_SELECTION';
        throw error;
      }
      const payload = {
        localDate: filters.date,
        endDate: filters.endDate,
        sourceType: fetchSourceType,
        busbarInternalIds: selectedInternalIds,
        selectedBusbar,
        jobTimeoutMs: resolveFetchJobTimeoutMs(fetchSourceType, selectedBusbar)
      };
      const response = await runFetchJob(payload);
      applyYksFetchResponse(response);
      syncDynamicOptions();
      setFetchCompletionStatus(response);
    } catch (error) {
      let msg = error.message || String(error);
      if (error.errorType === 'NO_YKS_TAB' || msg.includes('Acik YKS sekmesi bulunamadi')) {
        msg = 'Acik YKS sekmesi bulunamadi. Lutfen YKS sayfasinda oturum acip tekrar deneyin.';
      }
      pushError('YKS', msg, error);
      pushFetchLog('error', 'YKS', msg, error);
      setStatus('YKS cekimi basarisiz');
    } finally {
      state.activeFetchJobId = '';
      el.btnFetchYks.disabled = false;
      if (el.btnCancelFetch) {
        el.btnCancelFetch.hidden = true;
        el.btnCancelFetch.disabled = false;
      }
      refreshYksLogs();
    }
    renderAll();
  }

  async function runFetchJob(payload) {
    if (!RGDH_DOM_BRIDGE.startRgdhFetchJob) {
      return RGDH_DOM_BRIDGE.requestRgdhFetch(payload);
    }
    const started = await RGDH_DOM_BRIDGE.startRgdhFetchJob(payload);
    if (!started?.ok) throw toError(started);
    state.activeFetchJobId = started.jobId;
    pushFetchLog('info', 'Job', `YKS cekim isi basladi: ${started.jobId}`, { transport: 'background-job' });
    const startedAt = Date.now();
    const timeoutMs = Math.min(RGDH_HYBRID_JOB_TIMEOUT_MS, Math.max(5000, Number(payload?.jobTimeoutMs || RGDH_STANDARD_JOB_TIMEOUT_MS)));
    while (Date.now() - startedAt < timeoutMs) {
      await delay(1000);
      const status = await RGDH_DOM_BRIDGE.getRgdhFetchJobStatus(started.jobId);
      appendFetchLogs(status?.logs || []);
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      if (status?.status === 'completed') {
        let result = await hydrateFetchResultRows(started.jobId, status.result || {});
        result = await waitForContinuationFetchJob(result);
        const hasWarnings = (result.partialErrors || []).length || !((result.rowCounts?.apiRows ?? ((result.conventionalRows?.length || 0) + (result.windRows?.length || 0))));
        pushFetchLog(hasWarnings ? 'warn' : 'success', 'Job', `YKS cekim isi tamamlandi (${elapsed} sn).`, { transport: 'background-job', rowCounts: result.rowCounts || {} });
        return result;
      }
      if (status?.status === 'failed') throw toError(status.error || status);
      if (status?.status === 'cancelled') throw new Error('YKS cekimi iptal edildi.');
      setStatus(`YKS verisi cekiliyor... (${elapsed} sn)`);
    }
    throw new Error('YKS veri cekme isi zaman asimina ugradi.');
  }

  async function waitForContinuationFetchJob(parentResult) {
    const continuationJobId = parentResult?.continuationJobId || '';
    if (!continuationJobId || !RGDH_DOM_BRIDGE.getRgdhFetchJobStatus) return parentResult || {};

    const parentApiRows = Number(parentResult?.rowCounts?.apiRows ?? ((parentResult?.conventionalRows?.length || 0) + (parentResult?.windRows?.length || 0)));
    const previousActiveJobId = state.activeFetchJobId;
    state.activeFetchJobId = continuationJobId;
    const waitBudgetMs = RGDH_HYBRID_CONTINUATION_TIMEOUT_MS + RGDH_HYBRID_CONTINUATION_POLL_GRACE_MS;
    pushFetchLog('info', 'Job', `Hibrit YKS tamamlama isi bekleniyor: ${continuationJobId}`, {
      continuationJobId,
      parentJobId: previousActiveJobId,
      transport: 'background-job',
      jobTimeoutMs: RGDH_HYBRID_CONTINUATION_TIMEOUT_MS,
      waitBudgetMs
    });

    const startedAt = Date.now();
    while (Date.now() - startedAt < waitBudgetMs) {
      await delay(1000);
      const status = await RGDH_DOM_BRIDGE.getRgdhFetchJobStatus(continuationJobId);
      appendFetchLogs(status?.logs || []);
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      if (status?.status === 'completed') {
        const continuationResult = await hydrateFetchResultRows(continuationJobId, status.result || {});
        pushFetchLog('success', 'Job', `Hibrit YKS tamamlama isi tamamlandi (${elapsed} sn).`, {
          continuationJobId,
          rowCounts: continuationResult.rowCounts || {},
          transport: 'background-job'
        });
        state.activeFetchJobId = previousActiveJobId;
        return {
          ...continuationResult,
          parentJobId: previousActiveJobId,
          continuationJobId,
          continuationCompleted: true
        };
      }
      if (status?.status === 'failed') {
        state.activeFetchJobId = previousActiveJobId;
        return buildContinuationNoRowsResult(parentResult, status.error || status, parentApiRows);
      }
      if (status?.status === 'cancelled') {
        state.activeFetchJobId = previousActiveJobId;
        return buildContinuationNoRowsResult(parentResult, { message: 'Hibrit YKS tamamlama isi iptal edildi.', errorType: 'JOB_CANCELLED' }, parentApiRows);
      }
      setStatus(`Hibrit YKS tamamlaniyor... (${elapsed} sn)`);
    }

    state.activeFetchJobId = previousActiveJobId;
    return buildContinuationNoRowsResult(parentResult, {
      message: 'Hibrit YKS tamamlama isi zaman asimina ugradi.',
      errorType: 'NO_NORMALIZED_ROWS_AFTER_CONTINUATION'
    }, parentApiRows);
  }

  function buildContinuationNoRowsResult(parentResult, error, parentApiRows) {
    if (parentApiRows > 0) return parentResult || {};
    const detail = {
      errorType: 'NO_NORMALIZED_ROWS_AFTER_CONTINUATION',
      errorClass: 'NO_NORMALIZED_ROWS_AFTER_CONTINUATION',
      message: error?.message || error?.error || 'Hibrit YKS tamamlama isi kayit uretmedi.',
      continuationJobId: parentResult?.continuationJobId || '',
      rowCounts: parentResult?.rowCounts || {}
    };
    return {
      ...(parentResult || {}),
      partialErrors: [...(parentResult?.partialErrors || []), detail],
      continuationCompleted: true
    };
  }

  async function hydrateFetchResultRows(jobId, result) {
    if (!result?.hasRowChunks || !RGDH_DOM_BRIDGE.getRgdhFetchRows) return result || {};
    const hydrated = { ...result };
    for (const kind of ['conventionalRows', 'windRows', 'domRows']) {
      const total = Number(result.rowCounts?.[kind] || 0);
      hydrated[kind] = [];
      for (let offset = 0; offset < total; offset += 1000) {
        const chunk = await RGDH_DOM_BRIDGE.getRgdhFetchRows(jobId, kind, offset, 1000);
        if (!chunk?.ok) throw toError(chunk);
        hydrated[kind].push(...(chunk.rows || []));
      }
    }
    return hydrated;
  }

  function applyYksFetchResponse(response) {
    appendFetchLogs(response?.logs || []);
    if (!response?.ok) throw toError(response);

    state.discoveredBusbarInternalIds = uniqueStrings([
      ...state.discoveredBusbarInternalIds,
      ...(response.busbarInternalIds || [])
    ]);
    const conventional = (response.conventionalRows || []).map(RGDH_NORMALIZER.normalizeConventionalApiRow);
    const wind = (response.windRows || []).map(RGDH_NORMALIZER.normalizeWindApiRow);
    const dom = (response.domRows || [])
      .map((row) => RGDH_NORMALIZER.finalizeRow({ ...row, sourceOrigin: 'DOM' }))
      .filter((row) => !RGDH_NORMALIZER.isZeroDomMeasurementRow(row));
    state.apiRows = enrichRows([...conventional, ...wind]);
    state.domRows = enrichRows(dom);
    (response.partialErrors || []).forEach((item) => {
      pushError('API', item.message || item.error || String(item), item);
      pushFetchLog('error', item.source || 'API', item.message || item.error || String(item), item);
    });
    const metricSummary = buildMetricCompletenessSummary(state.apiRows);
    const normalizedLevel = state.apiRows.length
      ? (metricSummary.metricEmptyRows ? 'warn' : 'success')
      : 'warn';
    const normalizedMessage = state.apiRows.length
      ? (metricSummary.metricEmptyRows
        ? `${state.apiRows.length} API kaydi normalize edildi; ${metricSummary.metricEmptyRows} kayitta metrik alanlari YKS kaynaginda bos.`
        : `${state.apiRows.length} API kaydi normalize edildi.`)
      : 'API kaydi normalize edilmedi.';
    pushFetchLog(normalizedLevel, 'Normalize', normalizedMessage, {
      apiRows: state.apiRows.length,
      domRows: state.domRows.length,
      metricSummary,
      metricEmptyRows: metricSummary.metricEmptyRows,
      rawFieldKeys: sampleRawFieldKeys(response)
    });
    if (metricSummary.metricEmptyRows) {
      pushError('Normalize', 'YKS satiri geldi ancak metrik alanlari kaynakta bos.', {
        errorType: 'METRIC_FIELDS_EMPTY_SOURCE',
        errorClass: 'METRIC_FIELDS_EMPTY_SOURCE',
        metricSummary,
        metricEmptyRows: metricSummary.metricEmptyRows
      });
    }
  }

  function buildMetricCompletenessSummary(rows) {
    const fields = ['pgenMw', 'qgenMvar', 'diMvarLimit', 'aiMvarLimit', 'approvalStatus', 'auxiliaryMw', 'auxiliaryMvar', 'auxiliaryDiMvarLimit', 'auxiliaryAiMvarLimit', 'auxiliaryApprovalStatus'];
    const summary = { total: rows.length };
    fields.forEach((field) => {
      summary[field] = rows.filter((row) => row[field] !== null && row[field] !== undefined && row[field] !== '').length;
    });
    summary.metricEmptyRows = rows.filter((row) => row.flags?.metricFieldsEmptySource).length;
    return summary;
  }

  function sampleRawFieldKeys(response) {
    const rawRows = [
      ...((response?.conventionalRows || []).slice(0, 1)),
      ...((response?.windRows || []).slice(0, 1))
    ];
    return rawRows.map((row) => Object.keys(row || {})
      .filter((key) => !/token|authorization|cookie|secret|password/i.test(key))
      .sort()
      .slice(0, 80));
  }

  function setFetchCompletionStatus(response) {
    const partialCount = response?.partialErrors?.length || 0;
    if (!state.apiRows.length) {
      const afterContinuation = (response?.partialErrors || []).some((item) => String(item?.errorType || item?.errorClass || '') === 'NO_NORMALIZED_ROWS_AFTER_CONTINUATION');
      const errorType = afterContinuation ? 'NO_NORMALIZED_ROWS_AFTER_CONTINUATION' : 'NO_NORMALIZED_ROWS';
      const message = afterContinuation
        ? 'YKS cekimi ve hibrit tamamlama tamamlandi ancak normalize API kaydi olusmadi.'
        : 'YKS cekimi tamamlandi ancak normalize API kaydi olusmadi.';
      pushError('YKS', message, { errorType, rowCounts: response?.rowCounts || {}, continuationJobId: response?.continuationJobId || '' });
      pushFetchLog('error', 'Normalize', message, { errorType, rowCounts: response?.rowCounts || {}, continuationJobId: response?.continuationJobId || '' });
      setStatus('YKS cekimi basarisiz: kayit yok');
      return;
    }
    const metricSummary = buildMetricCompletenessSummary(state.apiRows);
    if (metricSummary.metricEmptyRows) {
      setStatus(`YKS satiri geldi: ${state.apiRows.length} API kaydi, ${metricSummary.metricEmptyRows} metrik kaynakta bos`);
      return;
    }
    if (partialCount) {
      setStatus(`YKS cekimi uyarili: ${state.apiRows.length} API kaydi, ${partialCount} hata`);
      return;
    }
    setStatus(`YKS cekildi: ${state.apiRows.length} API kaydi`);
  }

  async function cancelYksFetch() {
    if (!state.activeFetchJobId || !RGDH_DOM_BRIDGE.cancelRgdhFetchJob) return;
    el.btnCancelFetch.disabled = true;
    await RGDH_DOM_BRIDGE.cancelRgdhFetchJob(state.activeFetchJobId).catch((error) => {
      pushError('YKS', error.message || String(error), error);
    });
    pushFetchLog('warn', 'Job', 'YKS cekimi icin iptal istegi gonderildi.', { transport: 'background-job' });
  }

  async function handleCsvFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const ekcRows = [];
    const ekcGroups = [];
    const bindingTarget = resolveEkcBindingTarget();

    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = RGDH_CSV.parseEkcCsvText(text, { filename: file.name });
        ekcRows.push(...(parsed.rows || []));
        ekcGroups.push(...(parsed.groups || []));
      } catch (error) {
        pushError('EK-C', error.message || String(error), { file: file.name });
      }
    }

    if (ekcRows.length) {
      state.ekcRows = bindEkcRowsToSelectedBusbar(ekcRows, bindingTarget);
      state.ekcGroups = ekcGroups;
      state.ekcLoaded = true;
      state.ekcBindingTarget = bindingTarget || null;
      syncFiltersToEkcDates(state.ekcRows);
    }
    rebuildEnrichment();
    syncDynamicOptions();
    const bindingText = bindingTarget?.busbarId
      ? ` ${bindingTarget.busbarName || bindingTarget.busbarId} YKS SCADA barasina baglandi.`
      : ' YKS SCADA barasi otomatik baglanamadi.';
    setStatus(`EK-C CSV yuklendi: ${state.ekcRows.length} dakika.${bindingText}`);
    pushFetchLog('success', 'EK-C', `${ekcRows.length} EK-C dakika satiri okundu.${bindingText}`, { fileCount: files.length, bindingTarget });
    if (state.ekcRows.length) {
      autoCompareAfterEkcLoad();
    } else {
      renderAll();
    }
    event.target.value = '';
  }

  function bindEkcRowsToSelectedBusbar(rows, target = resolveEkcBindingTarget()) {
    return RGDH_COMPARISON.bindEkcRowsToSelectedBusbar(rows, target);
  }

  function resolveEkcBindingTarget() {
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    if (selectedBusbar?.busbarId) return completeEkcBindingTarget(selectedBusbar);

    const filteredTargets = uniqueEkcBindingTargets(getFilteredRows());
    if (filteredTargets.length === 1) return filteredTargets[0];

    const allTargets = uniqueEkcBindingTargets(allRows());
    return allTargets.length === 1 ? allTargets[0] : null;
  }

  function uniqueEkcBindingTargets(rows) {
    const map = new Map();
    (rows || []).forEach((row) => {
      if (row?.busbarId === null || row?.busbarId === undefined || row?.busbarId === '') return;
      const key = String(row.busbarId);
      if (!map.has(key)) map.set(key, completeEkcBindingTarget(row));
    });
    return [...map.values()];
  }

  function completeEkcBindingTarget(target) {
    const busbarId = target?.busbarId === null || target?.busbarId === undefined ? '' : String(target.busbarId);
    const platformRow = allRows().find((row) => busbarId && String(row.busbarId) === busbarId) || {};
    return {
      busbarId,
      busbarInternalId: target?.busbarInternalId ?? platformRow.busbarInternalId ?? null,
      busbarName: target?.busbarName || platformRow.busbarName || '',
      plantName: target?.plantName || platformRow.plantName || '',
      sourceType: target?.sourceType || platformRow.sourceType || '',
      ytm: target?.ytm || platformRow.ytm || ''
    };
  }

  function syncFiltersToEkcDates(rows) {
    const update = RGDH_COMPARISON.getEkcDateFilterUpdate(rows, readFilters());
    if (!update.changed) return update;
    el.filterDate.value = update.date;
    el.filterEndDate.value = update.endDate;
    persistFilters();
    return update;
  }

  function dateRangeCovers(filters, dates) {
    if (!filters?.date) return false;
    const start = filters.date;
    const end = filters.endDate || addLocalDays(start, 1);
    return (dates || []).every((date) => date >= start && date < end);
  }

  function addLocalDays(localDate, days) {
    const parts = String(localDate || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return '';
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function autoCompareAfterEkcLoad() {
    state.comparison = buildEkcPlatformComparison(getFilteredRows(), getFilteredEkcRows());
    const summary = state.comparison.summary || {};
    setStatus(`EK-C / YKS SCADA: ${summary.both || 0} ortak, ${summary.ekcOnly || 0} yalniz EK-C, ${summary.platformOnly || 0} yalniz YKS SCADA${state.comparison.diagnosis ? ` - ${state.comparison.diagnosis}` : ''}`);
    switchTab('compare');
  }

  function compareSources() {
    state.comparison = buildEkcPlatformComparison(getFilteredRows(), getFilteredEkcRows());
    const summary = state.comparison.summary || {};
    setStatus(`EK-C / YKS SCADA: ${summary.both || 0} ortak, ${summary.ekcOnly || 0} yalniz EK-C, ${summary.platformOnly || 0} yalniz YKS SCADA${state.comparison.diagnosis ? ` - ${state.comparison.diagnosis}` : ''}`);
    switchTab('compare');
  }

  function switchTab(tab) {
    state.activeTab = tab;
    el.tabs.forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    el.panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tab));
    renderAll();
  }

  function renderAll() {
    const rows = getFilteredRows();
    state.pivot = RGDH_PIVOT.buildDailyPivot(rows);
    renderFilterNotice(rows);
    renderStats(rows);
    renderRawTable(rows);
    renderDailyTable(state.pivot.rows);
    renderDailyMetricTable(state.pivot.rows);
    renderCharts(rows, state.pivot.rows);
    renderCompareView(rows);
    renderTestsTable();
    renderErrors();
    renderFetchLogs();
    applyVoltageVisibility();
  }

  function allRows() {
    return [...state.apiRows, ...state.domRows];
  }

  function getFilteredRows() {
    const filters = readFilters();
    const search = normalizeText(filters.search);
    const selectedBusbar = resolveSelectedBusbar(filters);
    return allRows().filter((row) => {
      if (filters.date && row.localDate) {
        if (filters.endDate) {
          if (row.localDate < filters.date || row.localDate >= filters.endDate) return false;
        } else if (row.localDate !== filters.date) {
          return false;
        }
      }
      if (filters.sourceType !== 'ALL' && !sourceTypeMatches(row.sourceType, filters.sourceType)) return false;
      if (selectedBusbar) {
        if (String(row.busbarId || '') !== String(selectedBusbar.busbarId || '')) return false;
      } else if (search) {
        const text = normalizeText(`${row.busbarInternalId || ''} ${row.busbarId || ''} ${row.busbarName || ''} ${row.plantName || ''}`);
        if (!text.includes(search)) return false;
      }
      return true;
    });
  }

  function getFilteredEkcRows() {
    const filters = readFilters();
    const search = normalizeText(filters.search);
    const selectedBusbar = resolveSelectedBusbar(filters);
    return (state.ekcRows || []).filter((row) => {
      if (filters.date && row.localDate) {
        if (filters.endDate) {
          if (row.localDate < filters.date || row.localDate >= filters.endDate) return false;
        } else if (row.localDate !== filters.date) {
          return false;
        }
      }
      if (filters.sourceType !== 'ALL' && !sourceTypeMatches(row.sourceType, filters.sourceType)) return false;
      if (selectedBusbar) {
        const selectedText = normalizeText(`${selectedBusbar.busbarId || ''} ${selectedBusbar.busbarName || ''} ${selectedBusbar.plantName || ''}`);
        const rowText = normalizeText(`${row.busbarId || ''} ${row.busbarName || ''} ${row.plantName || ''} ${row.fileName || ''}`);
        if (!rowText.includes(selectedText) && !selectedText.includes(rowText)) return false;
      } else if (search) {
        const text = normalizeText(`${row.busbarInternalId || ''} ${row.busbarId || ''} ${row.busbarName || ''} ${row.plantName || ''} ${row.fileName || ''}`);
        if (!text.includes(search)) return false;
      }
      return true;
    });
  }

  function buildEkcPlatformComparison(platformRows, ekcRows) {
    return RGDH_COMPARISON.buildEkcPlatformComparison(platformRows, ekcRows, {
      pivot: RGDH_PIVOT,
      bindingTargetMissing: state.ekcLoaded && !state.ekcBindingTarget?.busbarId,
      missingBindingDiagnosis: 'Ortak dakika bulunamadi: secili YKS SCADA barasi yok veya EK-C icin otomatik bara eslesmesi yapilamadi'
    });
  }

  function buildComparisonDiagnosis(platformRows, ekcRows, summary = {}) {
    if ((summary.both || 0) > 0) return '';
    const platform = Array.isArray(platformRows) ? platformRows : [];
    const ekc = Array.isArray(ekcRows) ? ekcRows : [];
    if (ekc.length && !platform.length) return 'Ortak dakika bulunamadi: EK-C tarihi icin YKS SCADA verisi yok';
    if (!ekc.length && platform.length) return 'Ortak dakika bulunamadi: aktif filtrelerde EK-C verisi yok';
    if (!ekc.length && !platform.length) return 'Ortak dakika bulunamadi: aktif filtrelerde EK-C ve YKS SCADA verisi yok';

    const platformDates = new Set(platform.map((row) => row.localDate).filter(Boolean));
    const ekcDates = new Set(ekc.map((row) => row.localDate).filter(Boolean));
    const hasDateOverlap = [...ekcDates].some((date) => platformDates.has(date));
    if (!hasDateOverlap) return 'Ortak dakika bulunamadi: EK-C ve YKS SCADA tarihleri uyusmuyor';

    const missingEkcFields = ekc.some((row) => !Number.isFinite(Number(row.vBara)) || !Number.isFinite(Number(row.pTotal)) || !Number.isFinite(Number(row.qMeas)));
    if (missingEkcFields) return 'Ortak dakika bulunamadi: EK-C V/P/Q alanlari eksik veya okunamadi';

    return 'Ortak dakika bulunamadi: secili YKS SCADA barasi ile EK-C dakika anahtarlari eslesmedi';
  }

  function indexRowsForComparison(rows, kind) {
    const map = new Map();
    (rows || []).forEach((row) => {
      comparisonKeys(row, kind).forEach((key) => {
        if (key && !map.has(key)) map.set(key, row);
      });
    });
    return map;
  }

  function buildCompareMinuteRow(key, ekc, platform) {
    const joinState = ekc && platform ? 'both' : (ekc ? 'ekc_only' : 'platform_only');
    const platformVerdict = platform ? RGDH_PIVOT.derivePlatformMinuteResult(platform) : null;
    const ekcResult = normalizeReactiveResult(ekc?.minuteStat?.result);
    const platformResult = normalizeReactiveResult(platformVerdict?.result);
    const platformEquivalentLimit = platform ? platformEquivalentQLimit(platform) : null;
    const ekcLimitComparable = ekc ? ekcComparableLimit(ekc) : null;
    const measurementDateLocal = ekc?.measurementDateLocal || platform?.measurementDateLocal || '';
    return {
      key,
      joinState,
      ekc,
      platform,
      measurementDateLocal,
      localDate: ekc?.localDate || platform?.localDate || '',
      hour: Number(ekc?.hour ?? ekc?.localHour ?? platform?.localHour ?? 0),
      minuteIndex: Number(ekc?.dakikaIndex ?? platformMinuteIndex(platform)),
      ekcResult,
      platformResult,
      ekcLimitComparable,
      platformEquivalentLimit,
      deltaV: deltaNumber(ekc?.vBara, platform?.liveBusbarVoltage),
      deltaP: deltaNumber(ekc?.pTotal, platform?.pgenMw),
      deltaQ: deltaNumber(ekc?.qMeas, platform?.qgenMvar),
      ekcHybridDutyFlag: ekc?.minuteStat?.hybridDutyFlag || '',
      platformProvidedBy: platform?.auxiliaryApprovalStatus === 1 ? 'AUX' : 'MAIN',
      hybridConsistency: compareHybridDuty(ekc, platform)
    };
  }

  function comparisonKeys(row, kind) {
    if (!row) return [];
    const date = row.localDate || '';
    const minute = kind === 'ekc' ? Number(row.dakikaIndex) : platformMinuteIndex(row);
    if (!date || !Number.isFinite(minute)) return [];
    return comparisonEntityKeys(row).map((entity) => `${entity}|${date}|${minute}`).filter(Boolean);
  }

  function comparisonEntityKey(row) {
    return comparisonEntityKeys(row)[0] || '';
  }

  function comparisonEntityKeys(row) {
    const keys = [];
    if (row?.catalog?.busbarId) keys.push(`catalog:${row.catalog.busbarId}`);
    if (row?.busbarInternalId) keys.push(`internal:${row.busbarInternalId}`);
    if (row?.busbarId) keys.push(`busbar:${row.busbarId}`);
    const name = normalizeText(row?.busbarName || row?.plantName || row?.fileName || '');
    if (name) keys.push(`name:${name}`);
    return [...new Set(keys)];
  }

  function platformMinuteIndex(row) {
    if (!row) return null;
    const explicit = Number(row.minuteIndex ?? row.dakikaIndex);
    if (Number.isFinite(explicit)) return explicit;
    const hour = Number(row.localHour);
    const minute = Number(row.localMinute);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
  }

  function platformEquivalentQLimit(row) {
    const q = Number(row?.qgenMvar);
    const di = Number(row?.diMvarLimit);
    const ai = Number(row?.aiMvarLimit);
    if (Number.isFinite(q) && q < 0 && Number.isFinite(di)) return di;
    if (Number.isFinite(q) && q > 0 && Number.isFinite(ai)) return ai;
    if (Number.isFinite(di) && !Number.isFinite(ai)) return di;
    if (Number.isFinite(ai) && !Number.isFinite(di)) return ai;
    if (Number.isFinite(q) && Number.isFinite(di) && Number.isFinite(ai)) {
      return Math.abs(q - di) <= Math.abs(q - ai) ? di : ai;
    }
    return null;
  }

  function ekcComparableLimit(row) {
    const stat = row?.minuteStat || {};
    const q = Number(row?.qMeas);
    if (Number.isFinite(stat.limitValue)) return stat.limitValue;
    if (Number.isFinite(q) && q < 0 && Number.isFinite(stat.limitHigh)) return stat.limitHigh;
    if (Number.isFinite(q) && q > 0 && Number.isFinite(stat.limitLow)) return stat.limitLow;
    if (Number.isFinite(stat.limitLow) && !Number.isFinite(stat.limitHigh)) return stat.limitLow;
    if (Number.isFinite(stat.limitHigh) && !Number.isFinite(stat.limitLow)) return stat.limitHigh;
    return null;
  }

  function buildCompareHourRows(compareRows) {
    const grouped = new Map();
    (compareRows || []).forEach((row) => {
      const entity = comparisonEntityKey(row.ekc || row.platform);
      const key = `${entity}|${row.localDate}|${row.hour}`;
      if (!grouped.has(key)) grouped.set(key, { key, entity, localDate: row.localDate, hour: row.hour, rows: [] });
      grouped.get(key).rows.push(row);
    });
    return [...grouped.values()].map((group) => {
      const bothRows = group.rows.filter((row) => row.joinState === 'both');
      const ekcSourceRows = group.rows.filter((row) => row.joinState !== 'platform_only');
      const platformSourceRows = group.rows.filter((row) => row.joinState !== 'ekc_only');
      const ekcStat = ekcSourceRows.length ? buildHourStatFromResultRows(ekcSourceRows, 'ekcResult') : null;
      const platformStat = platformSourceRows.length ? buildHourStatFromResultRows(platformSourceRows, 'platformResult') : null;
      return {
        ...group,
        ekcStat,
        platformStat,
        commonMinutes: bothRows.length,
        ekcOnlyMinutes: group.rows.filter((row) => row.joinState === 'ekc_only').length,
        platformOnlyMinutes: group.rows.filter((row) => row.joinState === 'platform_only').length,
        ddCount: countResult(group.rows, 'DD'),
        yyCount: countResult(group.rows, 'YY'),
        kyCount: countResult(group.rows, 'KY'),
        passCount: countResult(group.rows, 'SAGLADI'),
        failCount: countResult(group.rows, 'SAGLAMADI'),
        avgYksV: average(group.rows.map((row) => row.platform?.liveBusbarVoltage)),
        avgEkcV: average(group.rows.map((row) => row.ekc?.vBara)),
        avgYksP: average(group.rows.map((row) => row.platform?.pgenMw)),
        avgEkcP: average(group.rows.map((row) => row.ekc?.pTotal)),
        avgYksQ: average(group.rows.map((row) => row.platform?.qgenMvar)),
        avgEkcQ: average(group.rows.map((row) => row.ekc?.qMeas)),
        avgDeltaV: average(bothRows.map((row) => row.deltaV)),
        avgDeltaP: average(bothRows.map((row) => row.deltaP)),
        avgDeltaQ: average(bothRows.map((row) => row.deltaQ)),
        maxDeltaV: maxAbs(bothRows.map((row) => row.deltaV)),
        maxDeltaP: maxAbs(bothRows.map((row) => row.deltaP)),
        maxDeltaQ: maxAbs(bothRows.map((row) => row.deltaQ)),
        hybridConsistency: uniqueStrings(bothRows.map((row) => row.hybridConsistency).filter(Boolean)).join(', ')
      };
    }).sort((a, b) => `${a.localDate}|${a.hour}`.localeCompare(`${b.localDate}|${b.hour}`));
  }

  function buildHourStatFromResultRows(rows, field) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    if (!sourceRows.length) {
      return RGDH_PIVOT.reactiveHourSummary({
        passCount: 0,
        failCount: 0,
        kyCount: 1,
        ddCount: 0,
        yyCount: 0,
        missingCount: 1,
        activeLiabilityMinutes: 0
      }, {
        expectedMinuteCount: 1,
        failMinuteThreshold: 0,
        minActiveLiabilityMinutes: 1,
        dominantOfflineThreshold: 0,
        kyMinuteThreshold: 1
      });
    }
    const counts = { passCount: 0, failCount: 0, kyCount: 0, ddCount: 0, yyCount: 0 };
    sourceRows.forEach((row) => {
      const result = normalizeReactiveResult(row[field]);
      if (result === 'SAGLADI') counts.passCount += 1;
      else if (result === 'SAGLAMADI') counts.failCount += 1;
      else if (result === 'KY') counts.kyCount += 1;
      else if (result === 'DD') counts.ddCount += 1;
      else if (result === 'YY') counts.yyCount += 1;
    });
    const expectedMinuteCount = sourceRows.length;
    return RGDH_PIVOT.reactiveHourSummary({
      ...counts,
      missingCount: 0,
      activeLiabilityMinutes: counts.passCount + counts.failCount + counts.ddCount + counts.yyCount
    }, {
      expectedMinuteCount,
      failMinuteThreshold: Math.floor(expectedMinuteCount * 0.2),
      minActiveLiabilityMinutes: 1,
      dominantOfflineThreshold: Math.max(0, expectedMinuteCount - 1),
      kyMinuteThreshold: expectedMinuteCount
    });
  }

  function countResult(rows, result) {
    return (rows || []).filter((row) => row.ekcResult === result || row.platformResult === result).length;
  }

  function normalizeReactiveResult(value) {
    return RGDH_PIVOT.normalizeReactiveResultCode ? RGDH_PIVOT.normalizeReactiveResultCode(value) : String(value || '');
  }

  function reactiveLabel(value) {
    return RGDH_PIVOT.reactiveDisplayLabel ? RGDH_PIVOT.reactiveDisplayLabel(value) : (value || '-');
  }

  function reactiveStatusBadge(value) {
    const code = normalizeReactiveResult(value);
    return `<span class="badge ${escapeHtml(code || 'KY')}">${escapeHtml(reactiveLabel(code || 'KY'))}</span>`;
  }

  function compareStatusBadge(stat) {
    if (!stat?.hourResult) return '<span class="badge KY">Eslesmedi</span>';
    return reactiveStatusBadge(stat.hourResult);
  }

  function formatComparisonEvaluation(stat) {
    if (!stat) return '<span class="badge KY">Eslesmedi</span>';
    const pass = Number(stat.passCount || stat.successMinuteCount || 0);
    const fail = Number(stat.failCount || 0);
    const dd = Number(stat.ddCount || 0);
    const yy = Number(stat.yyCount || 0);
    const ky = Number(stat.kyCount || 0);
    return [
      `<span class="rgdh-eval-pass">✓ ${formatNumber(pass)}</span>`,
      `<span class="rgdh-eval-fail">✕ ${formatNumber(fail)}</span>`,
      `<span class="rgdh-eval-neutral">DD ${formatNumber(dd)} / YY ${formatNumber(yy)} / KY ${formatNumber(ky)}</span>`
    ].join(' ');
  }

  function formatCompareParticipationCell(stat) {
    const result = normalizeReactiveResult(stat?.hourResult || stat?.status);
    if (result === 'DD' || result === 'YY' || result === 'KY') {
      return { html: escapeHtml(result), className: `compare-ky-neutral participation-${result.toLowerCase()}` };
    }
    const ratio = Number(stat?.passRatio ?? stat?.participationPct);
    if (!Number.isFinite(ratio)) return '-';
    return {
      html: formatFixedPercent(ratio),
      className: ratio >= COMPARE_KY_THRESHOLD_PCT ? 'compare-ky-ok' : 'compare-ky-fail'
    };
  }

  function formatCompareDeltaCell(value, metric, limitType = 'avg') {
    const numeric = Number(value);
    const limits = limitType === 'max' ? COMPARE_MAX_DELTA_LIMITS : COMPARE_AVG_DELTA_LIMITS;
    const limit = limits[metric];
    const className = Number.isFinite(numeric) && Number.isFinite(Number(limit)) && numeric > limit
      ? 'compare-delta-blue'
      : '';
    return { html: formatFixedNumber(value), className };
  }

  function formatCompareDataBarCell(value, maxValue) {
    const numeric = Number(value);
    const maxNumeric = Number(maxValue);
    if (!Number.isFinite(numeric) || !Number.isFinite(maxNumeric) || maxNumeric <= 0) {
      return formatFixedNumber(value);
    }
    const pct = Math.max(0, Math.min(100, (Math.abs(numeric) / maxNumeric) * 100));
    return {
      html: `<span class="compare-data-bar" style="--bar-pct: ${pct.toFixed(2)}%;"><span class="compare-data-bar-value">${escapeHtml(formatFixedNumber(value))}</span></span>`,
      className: 'compare-data-bar-cell'
    };
  }

  function compareCellHtml(cell) {
    if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'html')) {
      const className = cell.className ? ` class="${escapeHtml(cell.className)}"` : '';
      return `<td${className}>${cell.html}</td>`;
    }
    return `<td>${cell}</td>`;
  }

  function compareHybridDuty(ekc, platform) {
    const ekcFlag = ekc?.minuteStat?.hybridDutyFlag || '';
    if (!ekcFlag) return '';
    const platformBy = platform?.auxiliaryApprovalStatus === 1 ? 'AUX' : 'MAIN';
    return ekcFlag === platformBy ? 'uyumlu' : 'kontrol';
  }

  function deltaNumber(left, right) {
    const a = Number(left);
    const b = Number(right);
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
  }

  function maxAbs(values) {
    const clean = (values || []).map(Number).filter(Number.isFinite).map(Math.abs);
    return clean.length ? Math.max(...clean) : null;
  }

  function renderFilterNotice(rows) {
    const total = allRows().length;
    el.filterNotice.hidden = !(total > 0 && rows.length === 0);
    if (!el.filterNotice.hidden) {
      el.filterNotice.textContent = `${total} satir yuklendi, mevcut filtrelerden sonra 0 satir kaldi. Tarih, veri tipi veya bara secimini kontrol edin.`;
    }
  }

  function renderStats(rows) {
    const busbars = new Set(rows.map((row) => row.busbarId).filter((value) => value !== null && value !== undefined));
    el.statSource.textContent = sourceLabel();
    el.statRows.textContent = String(rows.length);
    el.statBusbars.textContent = String(busbars.size);
    el.statMismatch.textContent = String(mismatchCount());
    const extensionCount = state.errors.reduce((sum, item) => sum + (item.count || 1), 0) + state.fetchLogs.length;
    if (el.extensionLogCount) el.extensionLogCount.textContent = String(extensionCount);
    if (el.yksLogCount) el.yksLogCount.textContent = String(state.yksLogs.length);
  }

  function sourceLabel() {
    const parts = [];
    if (state.apiRows.length) parts.push('API');
    if (state.domRows.length) parts.push('DOM');
    if (state.ekcRows.length) parts.push('EK-C');
    if (state.catalogRows.length) parts.push('KATALOG');
    return parts.join(' + ') || '-';
  }

  function mismatchCount() {
    if (Array.isArray(state.comparison?.rows)) {
      return state.comparison.rows.filter((row) => row.joinState !== 'both' || (row.ekcResult && row.platformResult && row.ekcResult !== row.platformResult)).length;
    }
    return (state.comparison?.matches || []).filter((item) => item.fieldDiffs.length).length;
  }

  function hasAuxiliarySourceMarker(row) {
    if (!row) return false;
    if (isTruthyFlag(row.hasAuxiliarySource) || isTruthyFlag(row.hybridAuxiliary)) return true;
    if (Array.isArray(row.auxiliaryUnits) && row.auxiliaryUnits.length) return true;
    const hasAuxiliaryMetric = ['auxiliaryMw', 'auxiliaryMvar', 'auxiliaryDiMvarLimit', 'auxiliaryAiMvarLimit', 'auxiliaryApprovalStatus']
      .some((field) => row[field] !== null && row[field] !== undefined && row[field] !== '');
    if (hasAuxiliaryMetric) return true;
    const busbarId = String(row.busbarId ?? '').trim();
    const busbarName = normalizeText(row.busbarName || row.plantName || '');
    return getCatalogBusbarSummaries().some((summary) => {
      if (!summary.hasAuxiliarySource) return false;
      if (busbarId && String(summary.busbarId ?? '').trim() === busbarId) return true;
      return busbarName && normalizeText(`${summary.busbarName || ''} ${summary.plantName || ''}`).includes(busbarName);
    });
  }

  function resolveFetchJobTimeoutMs(sourceType, selectedBusbar) {
    return String(sourceType || '').toUpperCase() === 'WIND' && hasAuxiliarySourceMarker(selectedBusbar)
      ? RGDH_HYBRID_JOB_TIMEOUT_MS
      : RGDH_STANDARD_JOB_TIMEOUT_MS;
  }

  function renderHybridNameHtml(value, row) {
    const label = escapeHtml(value || '-');
    if (!hasAuxiliarySourceMarker(row)) return label;
    return `<span class="rgdh-name-with-marker">${label}<span class="rgdh-hybrid-dot" title="Yardimci kaynak" aria-label="Yardimci kaynak"></span></span>`;
  }

  function formatHybridOptionLabel(label, row) {
    return hasAuxiliarySourceMarker(row) ? `${label} [Yardimci kaynak]` : label;
  }

  function renderRawTable(rows) {
    const headers = [
      { text: 'Kaynak', cls: '' },
      { text: 'Tarih-Saat', cls: '' },
      { text: 'Tip', cls: '' },
      { text: 'YTM', cls: '' },
      { text: 'Santral', cls: '' },
      { text: 'Bara ID', cls: '' },
      { text: 'Bara Adi', cls: '' },
      { text: 'Ic ID', cls: '' },
      { text: 'TPYS Set', cls: '' },
      { text: 'TPYS GD', cls: '' },
      { text: 'Canli Bara', cls: '' },
      { text: 'Pgen MW', cls: '' },
      { text: 'Qgen MVAr', cls: '' },
      { text: 'Yrd. MW', cls: '' },
      { text: 'Yrd. MVAr', cls: '' },
      { text: 'Yrd. D.I.', cls: '' },
      { text: 'Yrd. A.I.', cls: '' },
      { text: 'D.I.', cls: '' },
      { text: 'A.I.', cls: '' },
      { text: 'Devre Durumu', cls: '' },
      { text: 'Yukumluluk Durumu', cls: '' },
      { text: 'D.I MVAR ONAY', cls: '' },
      { text: 'A.I MVAR ONAY', cls: '' },
      { text: 'Onay Durum', cls: '' },
      { text: 'Kalite', cls: '' }
    ];
    el.rawTable.innerHTML = `<thead><tr>${headers.map((h) => `<th class="${h.cls}">${h.text}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    rows.slice(0, 2000).forEach((row) => {
      const tr = document.createElement('tr');
      const status = rowStatus(row);
      const cols = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      tr.innerHTML = [
        badge(row.sourceOrigin),
        escapeHtml(row.measurementDateLocal || '-'),
        escapeHtml(row.sourceType || '-'),
        escapeHtml(row.ytm || '-'),
        renderHybridNameHtml(row.plantName || '-', row),
        escapeHtml(row.busbarId ?? '-'),
        renderHybridNameHtml(row.busbarName || '-', row),
        escapeHtml(row.busbarInternalId ?? '-'),
        formatNumber(row.tpysVoltageSet),
        formatNumber(row.tpysVoltageDrop),
        formatNumber(row.liveBusbarVoltage),
        formatNumber(row.pgenMw),
        formatNumber(row.qgenMvar),
        formatNumber(row.auxiliaryMw),
        formatNumber(row.auxiliaryMvar),
        formatNumber(row.auxiliaryDiMvarLimit),
        formatNumber(row.auxiliaryAiMvarLimit),
        formatNumber(row.diMvarLimit),
        formatNumber(row.aiMvarLimit),
        formatStatusFlag(row.offBoardStatus, { invert: true }),
        formatObligationStatus(row.noObligationStatus),
        formatStatusFlag(row.diMvarApprove),
        formatStatusFlag(row.aiMvarApprove),
        formatStatusFlag(row.approvalStatus ?? row.auxiliaryApprovalStatus),
        `${badge(status)} ${rowMismatchBadge(row)}`
      ].map((value, index) => `<td class="${cols[index]}">${value}</td>`).join('');
      tbody.appendChild(tr);
    });
    el.rawTable.appendChild(tbody);
  }

  function renderDailyTable(pivotRows) {
    const hourHeaders = Array.from({ length: 24 }, (_, hour) => `<th>${String(hour).padStart(2, '0')}</th>`).join('');
    el.dailyTable.innerHTML = `<thead><tr><th>Tarih</th><th>Bara</th><th>Tip</th><th>Kontrol</th>${hourHeaders}</tr></thead>`;
    const tbody = document.createElement('tbody');
    pivotRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="rgdh-date-drilldown">${escapeHtml(row.localDate || '-')}</td><td>${renderHybridNameHtml(row.busbarName || row.busbarId || '-', row)}</td><td>${escapeHtml(row.sourceType)}</td><td>${escapeHtml(row.controlType)}</td>`;
      tr.querySelector('.rgdh-date-drilldown')?.addEventListener('click', () => {
        state.chartSelection = { busbarId: row.busbarId, hour: null, date: row.localDate || null };
        switchTab('charts');
      });
      row.hours.forEach((hour) => {
        const td = document.createElement('td');
        td.className = RGDH_PIVOT.participationClass(hour);
        const resultLabel = reactiveLabel(hour.hourResult || hour.status);
        td.textContent = formatHourCellText(hour);
        td.title = [
          `${String(hour.hour).padStart(2, '0')}:00`,
          `Sonuc ${resultLabel}`,
          `Katilim ${formatPercent(hour.participationPct)}`,
          `Set ${formatNumber(hour.setAvg)}`,
          `Gerilim ${formatNumber(hour.voltageAvg)}`,
          `P ${formatNumber(hour.pgenAvg)}`,
          `Q ${formatNumber(hour.qgenAvg)}`,
          `Gecti ${hour.passCount ?? hour.successMinuteCount}/${hour.expectedMinuteCount}`,
          `Kaldi ${hour.failCount ?? 0}`,
          `DD ${hour.ddCount ?? 0} | YY ${hour.yyCount ?? 0} | KY ${hour.kyCount ?? 0}`
        ].join(' | ');
        td.addEventListener('click', () => {
          state.chartSelection = { busbarId: row.busbarId, hour: hour.hour, date: row.localDate || null };
          switchTab('charts');
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    el.dailyTable.appendChild(tbody);
  }

  function toggleDailyMetricTable() {
    if (!el.dailyMetricWrap) return;
    el.dailyMetricWrap.hidden = !el.dailyMetricWrap.hidden;
    if (el.btnToggleDailyMetricTable) {
      el.btnToggleDailyMetricTable.textContent = el.dailyMetricWrap.hidden ? 'Detayli Metrik Goster' : 'Detayli Metrik Gizle';
    }
  }

  function renderDailyMetricTable(pivotRows) {
    if (!el.dailyMetricTable || !RGDH_CHARTS?.buildHourMetricRows) return;
    const headers = [
      'Tarih', 'Saat', 'Bara', 'Tip', 'Sonuc', 'Sagladi', 'Saglamadi', 'DD', 'YY', 'KY',
      'Katilim', 'Pnom', 'Pnom %10', 'Pnom %50', 'MKUD', 'Ort P', 'Ort Q', 'Ort V Set', 'Ort V'
    ];
    el.dailyMetricTable.innerHTML = `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    RGDH_CHARTS.buildHourMetricRows(pivotRows).forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = [
        escapeHtml(row.localDate || '-'),
        escapeHtml(`${String(row.hour).padStart(2, '0')}:00`),
        escapeHtml(row.busbarName || '-'),
        escapeHtml(row.sourceType || '-'),
        escapeHtml(row.hourResult || '-'),
        formatNumber(row.passCount),
        formatNumber(row.failCount),
        formatNumber(row.ddCount),
        formatNumber(row.yyCount),
        formatNumber(row.kyCount),
        formatPercent(row.participationPct),
        formatNumber(row.pnomAvg),
        formatNumber(row.pnomPct10),
        formatNumber(row.pnomPct50),
        formatNumber(row.pmkudAvg),
        formatNumber(row.pgenAvg),
        formatNumber(row.qgenAvg),
        formatNumber(row.setAvg),
        formatNumber(row.voltageAvg)
      ].map((value) => `<td>${value}</td>`).join('');
      tbody.appendChild(tr);
    });
    el.dailyMetricTable.appendChild(tbody);
  }

  function formatHourCellText(hour) {
    if (RGDH_CHARTS?.formatHeatmapCellText) return RGDH_CHARTS.formatHeatmapCellText(hour);
    const result = normalizeReactiveResult(hour?.hourResult || hour?.status);
    if (result === 'DD' || result === 'YY' || result === 'KY') return result;
    return formatPercent(hour?.participationPct ?? hour?.passRatio);
  }

  function renderCharts(rows, pivotRows) {
    if (state.activeTab !== 'charts') return;
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    const first = rows.find((row) => row.busbarId !== null && row.busbarId !== undefined);
    const busbarId = state.chartSelection.busbarId ?? first?.busbarId ?? selectedBusbar?.busbarId;
    const selection = {
      busbarId,
      hour: state.chartSelection.hour,
      date: resolveChartDate(rows, busbarId, state.chartSelection.date || filters.date),
      showVoltage: state.showVoltage,
      onHourSelect: ({ busbarId: selectedBusbarId, date, hour }) => {
        state.chartSelection = { busbarId: selectedBusbarId, hour, date: date || null };
        renderCharts(getFilteredRows(), state.pivot.rows);
      }
    };
    const labelRow = rows.find((row) => String(row.busbarId) === String(selection.busbarId)) || selectedBusbar;
    if (el.chartContextLabel) {
      const datePart = selection.date ? `${selection.date} - ` : '';
      const name = renderHybridNameHtml(labelRow?.busbarName || selection.busbarId || 'Bara', labelRow);
      const suffix = selection.hour === null || selection.hour === undefined
        ? `${datePart}tum gun`
        : `${datePart}${String(selection.hour).padStart(2, '0')}:00`;
      el.chartContextLabel.innerHTML = `${name} - ${escapeHtml(suffix)}`;
    }
    RGDH_CHARTS.renderReport(el.chartsRoot, rows, pivotRows, selection);
    applyVoltageVisibility();
  }

  function renderCompareView(platformRows) {
    if (state.activeTab !== 'compare') return;
    const comparison = buildEkcPlatformComparison(platformRows || getFilteredRows(), getFilteredEkcRows());
    state.comparison = comparison;
    state.compareSelection = normalizeCompareSelection(comparison.rows || [], state.compareSelection);
    const compareDay = state.compareSelection.date;
    const dayHourRows = (comparison.hourRows || []).filter((row) => !compareDay || row.localDate === compareDay);
    const summary = comparison.summary || {};
    if (el.compareContextLabel) {
      const diagnosis = comparison.diagnosis ? ` ${comparison.diagnosis}.` : '';
      const datePart = compareDay ? `${compareDay} - ` : '';
      el.compareContextLabel.textContent = `${datePart}${summary.both || 0} ortak dakika, ${summary.ekcOnly || 0} yalniz EK-C, ${summary.platformOnly || 0} yalniz YKS SCADA, ${summary.resultMismatch || 0} sonuc farki.${diagnosis}`;
    }
    if (RGDH_CHARTS.renderComparison) {
      RGDH_CHARTS.renderComparison(el.compareChartsRoot, comparison.rows, {
        showVoltage: state.showVoltage,
        selection: state.compareSelection,
        onFilterApply: (selection) => {
          state.compareSelection = { ...state.compareSelection, ...selection };
          renderCompareView(platformRows || getFilteredRows());
        }
      });
    }
    renderCompareTable(dayHourRows);
  }

  function renderCompareTable(hourRows) {
    if (!el.compareTable) return;
    const headers = [
      'Tarih', 'Saat', 'Eşleşen DK', 'Ek-C Değerlendirme', 'YKS Değerlendirme',
      'YKS V', 'EK-C V', 'Ort dV', 'Max dV',
      'YKS P', 'EK-C P', 'Ort dP', 'Max dP',
      'YKS Q', 'EK-C Q', 'Ort dQ', 'Max dQ'
    ];
    const compareHeaders = [
      { html: 'Tarih', cls: 'date' },
      { html: 'Saat', cls: 'hour' },
      { html: 'Eslesen<br>DK', cls: 'minutes' },
      { html: 'Ek-C<br>Deg.', cls: 'eval' },
      { html: 'YKS<br>Deg.', cls: 'eval' },
      { html: 'Ek-C<br>K.Y (%)', cls: 'percent' },
      { html: 'YKS<br>K.Y (%)', cls: 'percent' },
      { html: 'YKS<br>V Ort', cls: 'metric' },
      { html: 'EK-C<br>V Ort', cls: 'metric' },
      { html: 'Fark<br>dV', cls: 'metric' },
      { html: 'Max<br>dV', cls: 'metric' },
      { html: 'YKS<br>P Ort', cls: 'metric' },
      { html: 'EK-C<br>P Ort', cls: 'metric' },
      { html: 'Fark<br>dP', cls: 'metric' },
      { html: 'Max<br>dP', cls: 'metric' },
      { html: 'YKS<br>Q Ort', cls: 'metric' },
      { html: 'EK-C<br>Q Ort', cls: 'metric' },
      { html: 'Fark<br>dQ', cls: 'metric' },
      { html: 'Max<br>dQ', cls: 'metric' },
      { html: 'YKS<br>Hibrit P', cls: 'metric' },
      { html: 'EK-C<br>Hibrit P', cls: 'metric' },
      { html: 'Fark<br>dHP', cls: 'metric' },
      { html: 'Max<br>dHP', cls: 'metric' }
    ];
    el.compareTable.innerHTML = [
      `<colgroup>${compareHeaders.map((header) => `<col class="rgdh-compare-col-${escapeHtml(header.cls)}">`).join('')}</colgroup>`,
      `<thead><tr>${compareHeaders.map((header) => `<th>${header.html}</th>`).join('')}</tr></thead>`
    ].join('');
    const tbody = document.createElement('tbody');
    if (state.comparison?.diagnosis && !(state.comparison.summary?.both)) {
      const tr = document.createElement('tr');
      tr.className = 'rgdh-diagnostic-row';
      tr.innerHTML = `<td colspan="${compareHeaders.length}">${escapeHtml(state.comparison.diagnosis)}</td>`;
      tbody.appendChild(tr);
    }
    const visibleRows = hourRows.slice(0, 500);
    const pDataBarMax = maxAbs(visibleRows.flatMap((row) => [
      row.avgYksP,
      row.avgEkcP,
      row.avgYksHybridP,
      row.avgEkcHybridP
    ]));
    visibleRows.forEach((row) => {
      const tr = document.createElement('tr');
      const hourLabel = `${String(row.hour).padStart(2, '0')}:00`;
      tr.innerHTML = [
        escapeHtml(row.localDate || '-'),
        `<button class="rgdh-table-link" type="button" data-compare-date="${escapeHtml(row.localDate || '')}" data-compare-hour="${escapeHtml(row.hour)}">${escapeHtml(hourLabel)}</button>`,
        formatNumber(row.commonMinutes),
        formatComparisonEvaluation(row.ekcStat),
        formatComparisonEvaluation(row.platformStat),
        formatCompareParticipationCell(row.ekcStat),
        formatCompareParticipationCell(row.platformStat),
        formatFixedNumber(row.avgYksV),
        formatFixedNumber(row.avgEkcV),
        formatCompareDeltaCell(row.avgDeltaV, 'dV', 'avg'),
        formatCompareDeltaCell(row.maxDeltaV, 'dV', 'max'),
        formatCompareDataBarCell(row.avgYksP, pDataBarMax),
        formatCompareDataBarCell(row.avgEkcP, pDataBarMax),
        formatCompareDeltaCell(row.avgDeltaP, 'dP', 'avg'),
        formatCompareDeltaCell(row.maxDeltaP, 'dP', 'max'),
        formatFixedNumber(row.avgYksQ),
        formatFixedNumber(row.avgEkcQ),
        formatCompareDeltaCell(row.avgDeltaQ, 'dQ', 'avg'),
        formatCompareDeltaCell(row.maxDeltaQ, 'dQ', 'max'),
        formatCompareDataBarCell(row.avgYksHybridP, pDataBarMax),
        formatCompareDataBarCell(row.avgEkcHybridP, pDataBarMax),
        formatFixedNumber(row.avgDeltaHybridP),
        formatFixedNumber(row.maxDeltaHybridP)
      ].map(compareCellHtml).join('');
      const hourButton = tr.querySelector('[data-compare-hour]');
      hourButton?.addEventListener('click', () => selectCompareHour(row));
      hourButton?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectCompareHour(row);
        }
      });
      tbody.appendChild(tr);
    });
    if (!hourRows.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${compareHeaders.length}">Karsilastirma icin YKS SCADA verisi ve EK-C CSV bekleniyor.</td>`;
      tbody.appendChild(tr);
    }
    el.compareTable.appendChild(tbody);
  }

  function normalizeCompareSelection(rows, selection = {}) {
    const dates = [...new Set((rows || []).map((row) => row.localDate).filter(Boolean))].sort();
    const filters = readFilters();
    const preferredDate = selection.date || filters.date;
    const date = preferredDate && dates.includes(preferredDate) ? preferredDate : (dates[0] || preferredDate || '');
    const hourMode = selection.hourMode || (selection.hour !== null && selection.hour !== undefined ? 'hours' : 'all');
    const hourStart = hourMode === 'hours' ? Number(selection.hourStart ?? selection.hour ?? 0) : null;
    const hourEnd = hourMode === 'hours' ? Number(selection.hourEnd ?? selection.hour ?? hourStart ?? 0) : null;
    return {
      busbarId: selection.busbarId || '',
      ytm: selection.ytm || '',
      date,
      hourMode,
      hourStart,
      hourEnd,
      hour: hourMode === 'hours' && hourStart === hourEnd ? hourStart : null
    };
  }

  function selectCompareHour(row) {
    const hour = Number(row?.hour);
    if (!Number.isFinite(hour)) return;
    state.compareSelection = {
      ...state.compareSelection,
      date: row.localDate || state.compareSelection.date || null,
      hourMode: 'hours',
      hourStart: hour,
      hourEnd: hour,
      hour
    };
    renderCompareView(getFilteredRows());
  }

  function resolveChartDate(rows, busbarId, preferredDate) {
    const candidates = (rows || [])
      .filter((row) => busbarId === undefined || busbarId === null || busbarId === '' || String(row.busbarId) === String(busbarId))
      .filter((row) => row.localDate)
      .sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    if (preferredDate && candidates.some((row) => row.localDate === preferredDate)) return preferredDate;
    return candidates[0]?.localDate || preferredDate || null;
  }

  function renderTestsTable() {
    if (!el.testsTable) return;
    const filters = readTestFilters();
    const summaries = getFilteredTestSummaries(filters);

    const selectedKey = filters.busbar || state.selectedTestBusbarKey;
    const selectedSummary = summaries.find((row) => catalogBusbarKey(row) === selectedKey) || summaries[0] || null;
    state.selectedTestBusbarKey = selectedSummary ? catalogBusbarKey(selectedSummary) : '';

    const headers = ['Bara Tipi', 'Bara ID', 'Bara Adı', 'RGK Tipi', 'Bara Gerilim Seviyesi', 'BYTM', 'TPYS Santral ID', 'TPYS Santral İsmi', 'Bara 1 TA', 'Bara 1 Setnum', 'Bara 2 TA', 'Bara 2 Setnum', 'Bara 3 TA'];
    el.testsTable.innerHTML = `<thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    summaries.slice(0, 2000).forEach((catalogRow) => {
      const tr = document.createElement('tr');
      const rowKey = catalogBusbarKey(catalogRow);
      tr.className = rowKey === state.selectedTestBusbarKey ? 'selected' : '';
      tr.addEventListener('click', () => {
        state.selectedTestBusbarKey = rowKey;
        renderTestsTable();
      });
      tr.innerHTML = [
        escapeHtml(catalogRow.busbarType || '-'),
        escapeHtml(catalogRow.busbarId ?? '-'),
        renderHybridNameHtml(catalogRow.busbarName || catalogRow.busbarId || '-', catalogRow),
        escapeHtml(catalogRow.rgkType || '-'),
        formatNumber(catalogRow.voltageLevel),
        escapeHtml(catalogRow.ytm || '-'),
        escapeHtml(catalogRow.plantId ?? '-'),
        renderHybridNameHtml(catalogRow.plantName || '-', catalogRow),
        escapeHtml(catalogRow.busbar1Ta || '-'),
        escapeHtml(catalogRow.busbar1Setnum || '-'),
        escapeHtml(catalogRow.busbar2Ta || '-'),
        escapeHtml(catalogRow.busbar2Setnum || '-'),
        escapeHtml(catalogRow.busbar3Ta || '-')
      ].map((value) => `<td>${value}</td>`).join('');
      tbody.appendChild(tr);
    });
    if (!summaries.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${headers.length}">Katalog yukleniyor veya test filtrelerini genisletin.</td>`;
      tbody.appendChild(tr);
    }
    el.testsTable.appendChild(tbody);
    renderTestUnitDetails(selectedSummary);
  }

  function renderTestUnitDetails(summary) {
    if (!el.testUnitDetailsTable) return;
    const headers = ['Ünite Adı', 'UEVCB Adı', 'TPYS UEVCB ID', 'Kaynak Tipi', 'Aktif Güç TA', 'Aktif Güç Setnum', 'Reaktif Güç TA', 'Reaktif Güç Setnum', 'Ünite Nominal Güç', 'Ünite PMKUD', 'Nominal İkaz (Düşük)', 'Nominal İkaz (Aşırı)'];
    el.testUnitDetailsTable.innerHTML = `<thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    const units = summary?.units || [];
    units.forEach((unit) => {
      const tr = document.createElement('tr');
      tr.innerHTML = [
        escapeHtml(unit.unitName || '-'),
        escapeHtml(unit.uevcbName || '-'),
        escapeHtml(unit.unitId ?? '-'),
        escapeHtml(unit.sourceKind || '-'),
        escapeHtml(unit.activePowerTa || '-'),
        escapeHtml(unit.activePowerSetnum || '-'),
        escapeHtml(unit.reactivePowerTa || '-'),
        escapeHtml(unit.reactivePowerSetnum || '-'),
        formatNumber(unit.unitPnomMw),
        formatNumber(unit.unitPmkudMw),
        formatNumber(unit.nominalLowExcitation),
        formatNumber(unit.nominalHighExcitation)
      ].map((value) => `<td>${value}</td>`).join('');
      tbody.appendChild(tr);
    });
    if (!units.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${headers.length}">Secili bara icin unite detayi yok.</td>`;
      tbody.appendChild(tr);
    }
    el.testUnitDetailsTable.appendChild(tbody);
  }

  function getFilteredTestSummaries(filters = readTestFilters()) {
    const search = normalizeText(filters.search);
    return RGDH_NORMALIZER.buildCatalogBusbarSummaries(state.catalogRows).filter((row) => {
      if (search) {
        const text = normalizeText(`${row.plantName || ''} ${row.busbarName || ''} ${row.busbarId || ''}`);
        if (!text.includes(search)) return false;
      }
      if (filters.busbarType && normalizeText(row.busbarType) !== normalizeText(filters.busbarType)) return false;
      if (filters.busbar && catalogBusbarKey(row) !== filters.busbar) return false;
      if (filters.hybridOnly && !row.hasAuxiliarySource) return false;
      return true;
    });
  }

  function getTestBusbarOptions(filters = readTestFilters()) {
    return RGDH_NORMALIZER.buildCatalogBusbarSummaries(state.catalogRows).filter((row) => {
      if (filters.busbarType && normalizeText(row.busbarType) !== normalizeText(filters.busbarType)) return false;
      if (filters.hybridOnly && !row.hasAuxiliarySource) return false;
      return true;
    });
  }

  function renderErrors() {
    if (!el.extensionLogList) return;
    const errorRows = state.errors.map((item) => `<div class="rgdh-error-item"><strong>${escapeHtml(item.source)}${item.count > 1 ? ` x${item.count}` : ''}</strong><br>${escapeHtml(item.message)}${formatLogDetail(item.detail)}<small>${escapeHtml(item.time)}</small></div>`);
    const fetchRows = aggregateLogs(state.fetchLogs).map((item) => `<div class="rgdh-log-item ${escapeHtml(item.level)}"><strong>${escapeHtml(item.phase)}${item.count > 1 ? ` x${item.count}` : ''}</strong><br>${escapeHtml(item.message)}${formatLogDetail(item.detail)}<small>${escapeHtml(item.time)}</small></div>`);
    el.extensionLogList.innerHTML = errorRows.length || fetchRows.length
      ? [...errorRows, ...fetchRows].join('')
      : '<div class="rgdh-error-item">Eklenti logu yok.</div>';
    renderYksLogs();
  }

  function renderYksLogs() {
    if (!el.yksLogList) return;
    const rows = state.yksLogs.slice(0, 300);
    el.yksLogList.innerHTML = rows.length
      ? rows.map((item) => `<div class="rgdh-log-item ${escapeHtml(item.level)}"><strong>${escapeHtml(item.category || 'diagnostic')} / ${escapeHtml(item.route || '-')}</strong><br>${escapeHtml(item.message || '')}${formatDiagnosticDetail(item)}<small>${escapeHtml(formatDiagnosticTime(item.time))}</small></div>`).join('')
      : '<div class="rgdh-log-item">YKS network/console kaydi yok. YKS sayfasi acikken ilgili route uzerinde islem yapin.</div>';
  }

  function renderFetchLogs() {
    const logs = aggregateLogs(state.fetchLogs);
    el.fetchLogList.innerHTML = logs.length
      ? logs.map((item) => `<div class="rgdh-log-item ${escapeHtml(item.level)}"><strong>${escapeHtml(item.phase)}${item.count > 1 ? ` x${item.count}` : ''}</strong><br>${escapeHtml(item.message)}${formatLogDetail(item.detail)}<small>${escapeHtml(item.time)}</small></div>`).join('')
      : '<div class="rgdh-log-item">YKS cekimi icin henuz log yok.</div>';
  }

  function syncDynamicOptions() {
    const filters = readFilters();
    const catalogSummaries = getCatalogBusbarSummaries();
    setOptions(el.filterSearch, catalogSummaries.map((row) => ({
      value: catalogBusbarKey(row),
      label: formatHybridOptionLabel(`${row.busbarName || row.busbarId || 'Bara'} (${row.busbarId}) - ${formatSourceType(inferCatalogSourceType(row))}`, row)
    })), 'Bara secin (tekli YKS cekimi)', filters.search);

    const testFilters = readTestFilters();
    setOptions(el.testBusbarTypeSelect, catalogSummaries.map((row) => ({ value: row.busbarType, label: row.busbarType })), 'Tumu', testFilters.busbarType);
    setOptions(el.testBusbarSelect, getTestBusbarOptions(testFilters).map((row) => ({ value: catalogBusbarKey(row), label: formatHybridOptionLabel(`${row.busbarName || row.busbarId} (${row.busbarId})`, row) })), 'Tumu', testFilters.busbar);
  }

  function setOptions(select, options, placeholder, selectedValue) {
    const unique = new Map();
    (options || []).forEach((item) => {
      const value = String(item.value ?? '').trim();
      const label = String(item.label ?? value).trim();
      if (!value || unique.has(value)) return;
      unique.set(value, label || value);
    });
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${[...unique.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'tr'))
      .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
      .join('')}`;
    if (selectedValue && unique.has(String(selectedValue))) select.value = String(selectedValue);
  }

  function rebuildEnrichment() {
    state.apiRows = enrichRows(state.apiRows);
    state.domRows = enrichRows(state.domRows);
  }

  function enrichRows(rows) {
    return RGDH_NORMALIZER.enrichRowsWithCatalog(rows, state.catalogRows);
  }

  function mergeCatalogRows(rows) {
    const map = new Map();
    rows.forEach((row) => {
      const key = catalogRowMergeKey(row);
      if (key.trim()) map.set(key, row);
    });
    return [...map.values()];
  }

  function replaceCatalogRowsWithPrimary(primaryRows) {
    const primaryKeys = new Set((primaryRows || []).map(catalogRowMergeKey).filter(Boolean));
    const fallbackRows = state.catalogRows.filter((row) => {
      if (String(row?.sourceOrigin || '').toUpperCase() !== 'CATALOG_AUXILIARY') return false;
      return !primaryKeys.has(catalogRowMergeKey(row));
    });
    state.catalogRows = mergeCatalogRows([...fallbackRows, ...primaryRows]);
  }

  function catalogRowMergeKey(row) {
    if (!row) return '';
    return [
      row.busbarId || '',
      normalizeText(row.unitName || ''),
      row.unitId ?? '',
      normalizeText(row.sourceKind || ''),
      row.activePowerSetnum || row.activePowerTa || '',
      row.reactivePowerSetnum || row.reactivePowerTa || ''
    ].join(':');
  }

  function getCatalogBusbarSummaries() {
    return RGDH_NORMALIZER.buildCatalogBusbarSummaries(state.catalogRows);
  }

  function resolveSelectedInternalIds(filters, selectedBusbar = null) {
    if (selectedBusbar?.busbarInternalId) return [String(selectedBusbar.busbarInternalId)];
    return [];
  }

  function resolveSelectedBusbar(filters) {
    const selected = getCatalogBusbarSummaries().find((row) => catalogBusbarKey(row) === filters.search);
    if (!selected) return null;
    const hasAuxiliarySource = hasAuxiliarySourceMarker(selected);
    return {
      busbarId: String(selected.busbarId || '').trim(),
      busbarName: selected.busbarName || '',
      sourceType: inferCatalogSourceType(selected),
      ytm: selected.ytm || '',
      plantName: selected.plantName || '',
      hasAuxiliarySource
    };
  }

  function resolveFetchSourceType(selectedSourceType, selectedBusbar) {
    const sourceType = normalizeSelectedSourceType(selectedSourceType || 'ALL');
    if (sourceType !== 'ALL') return sourceType;
    return selectedBusbar?.sourceType || 'CONVENTIONAL';
  }

  function inferCatalogSourceType(row) {
    const primaryText = normalizeText([
      row?.sourceType,
      row?.busbarType,
      row?.rgkType
    ].filter(Boolean).join(' '));
    if (/conventional|konv/.test(primaryText)) return 'CONVENTIONAL';
    if (/\bwind\b|\bres\b|ruzgar|solar|\bges\b/.test(primaryText)) return 'WIND';
    const text = normalizeText([
      row?.sourceType,
      row?.busbarType,
      row?.rgkType,
      row?.sourceKind,
      ...(row?.units || []).map((unit) => unit.sourceKind)
    ].filter(Boolean).join(' '));
    if (/\bwind\b|\bres\b|\bges\b|ruzgar|solar/.test(text)) return 'WIND';
    return 'CONVENTIONAL';
  }

  function formatSourceType(sourceType) {
    const value = String(sourceType || '').toUpperCase();
    if (value === 'WIND') return 'RES/GES';
    if (value === 'HYBRID') return 'Yardimci Kaynak';
    if (value === 'CONVENTIONAL') return 'Konvansiyonel';
    return value || 'Bilinmiyor';
  }

  function rowStatus(row) {
    if (!row) return 'KY';
    return RGDH_PIVOT.derivePlatformMinuteResult(row).result || 'KY';
  }

  function sourceTypeMatches(rowSourceType, selectedSourceType) {
    const rowType = String(rowSourceType || '').toUpperCase();
    const selected = normalizeSelectedSourceType(selectedSourceType || 'ALL');
    if (selected === 'ALL') return true;
    if (selected === 'WIND') return rowType === 'WIND' || rowType === 'SOLAR' || rowType === 'HYBRID';
    return rowType === selected;
  }

  function normalizeSelectedSourceType(value) {
    const selected = String(value || 'ALL').toUpperCase();
    if (selected === 'CONVENTIONAL' || selected === 'WIND') return selected;
    return 'ALL';
  }

  function rowMismatchBadge(row) {
    if (!state.comparison) return '';
    const key = RGDH_NORMALIZER.createCompareKey(row);
    const hit = state.comparison.matches.find((item) => item.key === key && item.fieldDiffs.length);
    return hit ? badge('MISMATCH') : '';
  }

  function summarizeMeasurements(rows) {
    return {
      count: rows.length,
      avgP: average(rows.map((row) => row.pgenMw)),
      avgQ: average(rows.map((row) => row.qgenMvar))
    };
  }

  function computeTestStatus(catalogRow, summary) {
    if (catalogRow.unitActive === false) return 'OFF';
    if (!summary.count) return 'NO_DATA';
    const q = Number(summary.avgQ);
    if (!Number.isFinite(q)) return 'WARN';
    const low = Number(catalogRow.lowExcitationTest);
    const high = Number(catalogRow.highExcitationTest);
    if (Number.isFinite(low) && q < low) return 'WARN';
    if (Number.isFinite(high) && q > high) return 'WARN';
    return 'OK';
  }

  function computeCatalogSummaryStatus(catalogRow, summary) {
    if (catalogRow.unitCount && catalogRow.activeUnitCount === 0) return 'OFF';
    if (!summary.count) return 'NO_DATA';
    const statuses = (catalogRow.units || []).map((unit) => computeTestStatus(unit, summary));
    if (statuses.includes('WARN')) return 'WARN';
    if (statuses.includes('FAIL')) return 'FAIL';
    return 'OK';
  }

  function readTestFilters() {
    return {
      search: el.testCatalogSearchInput?.value || '',
      busbarType: el.testBusbarTypeSelect?.value || '',
      busbar: el.testBusbarSelect?.value || '',
      hybridOnly: Boolean(el.testHybridOnlyCheckbox?.checked)
    };
  }

  function resetFetchLogs() {
    state.fetchLogs = [];
    renderFetchLogs();
  }

  function appendFetchLogs(logs) {
    (logs || []).forEach((item) => pushFetchLog(item.level || 'info', item.phase || item.source || 'YKS', item.message || '', item.detail || item));
  }

  function pushFetchLog(level, phase, message, detail) {
    state.fetchLogs.unshift({
      time: new Date().toLocaleString('tr-TR'),
      level: String(level || 'info'),
      phase: String(phase || 'YKS').slice(0, 80),
      message: sanitizeLogMessage(message),
      detail: sanitizeLogDetail(detail)
    });
    state.fetchLogs = state.fetchLogs.slice(0, 150);
    renderFetchLogs();
    renderErrors();
  }

  function pushError(source, message, detail) {
    const cleanMessage = sanitizeLogMessage(message);
    const existing = state.errors.find((item) => item.source === source && item.message === cleanMessage);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.time = new Date().toLocaleString('tr-TR');
      return;
    }
    state.errors.unshift({
      time: new Date().toLocaleString('tr-TR'),
      source,
      message: cleanMessage,
      detail: sanitizeLogDetail(detail),
      count: 1
    });
    state.errors = state.errors.slice(0, 50);
    renderErrors();
  }

  function aggregateLogs(logs) {
    const grouped = new Map();
    (logs || []).forEach((item) => {
      const key = `${item.level}:${item.phase}:${item.message}:${JSON.stringify(item.detail || {})}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key);
        existing.count += 1;
        return;
      }
      grouped.set(key, { ...item, count: 1 });
    });
    return [...grouped.values()];
  }

  function sanitizeLogMessage(message) {
    return String(message || 'Bilinmeyen durum')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
      .replace(/authorization["':=\s]+[A-Za-z0-9._-]+/gi, 'authorization [redacted]')
      .slice(0, 500);
  }

  function sanitizeLogDetail(detail) {
    if (!detail || typeof detail !== 'object') return {};
    const allowed = {};
    [
      'endpoint', 'params', 'httpStatus', 'errorType', 'errorClass', 'source', 'busbarId', 'busbarName',
      'selectedBusbar', 'busbarInternalIds', 'internalBusbarId', 'displayBusbarId', 'localDate',
      'sourceType', 'hour', 'hourStart', 'hourEnd', 'hourRange', 'chunkStart', 'chunkEnd', 'rowCount', 'rowCounts', 'pageCount',
      'resolverMethod', 'resolverPageCount', 'transport', 'apiRows', 'domRows', 'partialErrors',
      'metricSummary', 'rawFieldKeys', 'metricEmptyRows', 'failedHours', 'attemptedHours',
      'failedChunks', 'attemptedChunks', 'requestUrl', 'pageTimeoutMs', 'concurrency',
      'waitBudgetMs',
      'jobId', 'jobTimeoutMs', 'continuationJobId', 'parentJobId', 'isHybridContinuation',
      'missingWindows', 'responseTotalCount', 'responseLink', 'fallbackPhase',
      'preferCsvFallback', 'csvFallbackRows', 'responseContentType', 'probedWindows'
    ].forEach((key) => {
      if (detail[key] !== undefined) allowed[key] = detail[key];
    });
    return allowed;
  }

  function formatLogDetail(detail) {
    const safe = sanitizeLogDetail(detail);
    if (!Object.keys(safe).length) return '';
    return `<small>${escapeHtml(JSON.stringify(safe))}</small>`;
  }

  function formatDiagnosticDetail(item) {
    const detail = {
      method: item.method || '',
      url: item.url || '',
      status: item.status,
      durationMs: item.durationMs,
      requestHeaders: item.requestHeaders || {},
      responseHeaders: item.responseHeaders || {},
      responsePreview: item.responsePreview || '',
      responseRowCount: item.responseRowCount ?? '',
      responseKeys: item.responseKeys || [],
      detail: item.detail || {}
    };
    return `<small>${escapeHtml(JSON.stringify(detail))}</small>`;
  }

  function formatDiagnosticTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    return date.toLocaleString('tr-TR');
  }

  async function refreshYksLogs() {
    if (!RGDH_DOM_BRIDGE.listYksLogs) return;
    try {
      if (RGDH_DOM_BRIDGE.attachYksLogs) await RGDH_DOM_BRIDGE.attachYksLogs().catch(() => {});
      const response = await RGDH_DOM_BRIDGE.listYksLogs(500);
      if (response?.ok) {
        state.yksLogs = response.events || [];
        renderStats(getFilteredRows());
        renderYksLogs();
      }
    } catch {}
  }

  async function exportExtensionLogCsv() {
    const response = RGDH_DOM_BRIDGE.exportDiagnosticsCsv
      ? await RGDH_DOM_BRIDGE.exportDiagnosticsCsv()
      : null;
    const localEvents = [
      ...state.errors.map((item) => ({
        time: item.time,
        level: 'error',
        category: item.source,
        route: 'rgdh-monitor',
        message: item.message,
        detail: item.detail
      })),
      ...state.fetchLogs.map((item) => ({
        time: item.time,
        level: item.level,
        category: item.phase,
        route: 'rgdh-monitor',
        message: item.message,
        detail: item.detail
      }))
    ];
    const diagnosticsCsv = response?.ok ? response.csv : '';
    const localCsv = RGDH_DIAGNOSTICS?.diagnosticEventsToCsv
      ? RGDH_DIAGNOSTICS.diagnosticEventsToCsv(localEvents)
      : '';
    const merged = mergeCsvTexts(diagnosticsCsv, localCsv);
    downloadText(response?.filename || `RGDH_EKLENTI_LOGLARI_${readFilters().date}.csv`, merged || '\uFEFFZaman;Seviye;Kategori;Route;Metot;URL;HTTP;Süre(ms);Mesaj\n', 'text/csv;charset=utf-8');
  }

  async function exportYksLogCsv() {
    const response = RGDH_DOM_BRIDGE.exportYksLogCsv
      ? await RGDH_DOM_BRIDGE.exportYksLogCsv()
      : null;
    const localCsv = RGDH_DIAGNOSTICS?.diagnosticEventsToCsv
      ? RGDH_DIAGNOSTICS.diagnosticEventsToCsv(state.yksLogs)
      : '';
    downloadText(response?.filename || `RGDH_YKS_LOGLARI_${readFilters().date}.csv`, response?.ok ? response.csv : localCsv, 'text/csv;charset=utf-8');
  }

  async function clearErrorLogs() {
    state.errors = [];
    state.fetchLogs = [];
    if (RGDH_DOM_BRIDGE.clearDiagnostics) await RGDH_DOM_BRIDGE.clearDiagnostics().catch(() => {});
    renderAll();
  }

  async function clearYksLogs() {
    state.yksLogs = [];
    if (RGDH_DOM_BRIDGE.clearYksLogs) await RGDH_DOM_BRIDGE.clearYksLogs().catch(() => {});
    renderAll();
  }

  function mergeCsvTexts(...texts) {
    const rows = [];
    texts.filter(Boolean).forEach((text) => {
      String(text).replace(/^\uFEFF/, '').split(/\r?\n/).forEach((line, index) => {
        if (!line) return;
        if (index === 0 && rows.length) return;
        rows.push(line);
      });
    });
    return `\uFEFF${rows.join('\n')}`;
  }

  function toError(response) {
    const error = new Error(response?.error || response?.message || response?.reason || 'Islem basarisiz.');
    error.errorType = response?.errorType;
    error.httpStatus = response?.httpStatus;
    return error;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function exportCsv() {
    const rows = getFilteredRows();
    const text = RGDH_CSV.buildExportCsv(rows);
    downloadText(`RGDH_HAM_DATA_${readFilters().date}.csv`, text, 'text/csv;charset=utf-8');
  }

  function exportTestsCsv() {
    const text = RGDH_CSV.buildCatalogExportCsv(state.catalogRows);
    downloadText('rgdh_unite_tanimi_.csv', text, 'text/csv;charset=utf-8');
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function badge(text) {
    return `<span class="badge ${escapeHtml(text)}">${escapeHtml(text)}</span>`;
  }

  function setStatus(text) {
    el.statStatus.textContent = text;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '-';
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : '-';
  }

  function formatFixedNumber(value) {
    if (value === null || value === undefined || value === '') return '-';
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? numeric.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-';
  }

  function formatFixedPercent(value) {
    if (value === null || value === undefined || value === '') return '-';
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? `${numeric.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
      : '-';
  }

  function formatStatusFlag(value, options = {}) {
    const normalized = normalizeStatusFlag(value);
    if (normalized === null) return '-';
    const active = options.invert ? !normalized : normalized;
    return active ? '&#10003;' : '&#10005;';
  }

  function formatObligationStatus(value) {
    return formatStatusFlag(value, { invert: true });
  }

  function normalizeStatusFlag(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    const text = String(value).trim().toLowerCase();
    if (!text) return null;
    if (['1', 'true', 'evet', 'var', 'aktif', 'ok', 'onay', 'approved'].includes(text)) return true;
    if (['0', 'false', 'hayir', 'yok', 'pasif', 'red', 'reject', 'rejected'].includes(text)) return false;
    const numeric = Number(text.replace(',', '.'));
    if (Number.isFinite(numeric)) return numeric !== 0;
    return null;
  }

  function formatPercent(value) {
    return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%` : '-';
  }

  function average(values) {
    const numbers = values.map(Number).filter(Number.isFinite);
    if (!numbers.length) return null;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  function catalogBusbarKey(row) {
    return `${row.busbarId || ''}|${row.busbarName || ''}`;
  }

  function uniqueStrings(values) {
    return [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
  }

  function isTruthyFlag(value) {
    if (value === true) return true;
    const text = String(value ?? '').trim().toLowerCase();
    return text === 'true' || text === '1' || text === 'yes' || text === 'evet';
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıI]/g, 'i')
      .replace(/İ/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('rgdh-theme', next); } catch {}
    renderAll();
    if (el.btnToggleTheme) el.btnToggleTheme.textContent = next === 'dark' ? '☀️' : '🌙';
  }

  function restoreTheme() {
    try {
      const saved = localStorage.getItem('rgdh-theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      if (el.btnToggleTheme) el.btnToggleTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
    } catch {}
  }

  function toggleVoltageColumns() {
    state.showVoltage = !state.showVoltage;
    applyVoltageVisibility();
    renderCharts(getFilteredRows(), state.pivot.rows);
  }

  function applyVoltageVisibility() {
    const text = state.showVoltage ? 'Gerilim Kaynaklarini Gizle' : 'Gerilim Kaynaklarini Goster';
    if (el.btnToggleVoltage) el.btnToggleVoltage.textContent = text;
    document.querySelectorAll('.rgdh-voltage-col').forEach((cell) => {
      cell.classList.toggle('hidden-voltage', !state.showVoltage);
    });
    const charts = typeof Chart !== 'undefined'
      ? Array.from(document.querySelectorAll('#chartsRoot canvas, #compareChartsRoot canvas')).map((canvas) => Chart.getChart(canvas)).filter(Boolean)
      : [];
    charts.forEach((chart) => {
      chart.data.datasets.forEach((dataset, index) => {
        const label = dataset.label || '';
        if (isToggleableVoltageDataset(label)) {
          chart.setDatasetVisibility(index, state.showVoltage);
        }
      });
      chart.update();
    });
  }

  function isToggleableVoltageDataset(label) {
    return /Bara [123] kV/i.test(String(label || ''));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }
})();
