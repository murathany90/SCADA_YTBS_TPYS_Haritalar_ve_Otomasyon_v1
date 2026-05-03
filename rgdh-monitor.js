(function () {
  const state = {
    apiRows: [],
    domRows: [],
    conventionalUnitRows: [],
    ekcRows: [],
    ekcGroups: [],
    ekcLoaded: false,
    ekcBindingTarget: null,
    catalogRows: [],
    discoveredBusbarInternalIds: [],
    comparison: null,
    pivot: { rows: [] },
    activeTab: 'raw',
    calculationMode: 'YKS',
    chartSelection: { busbarId: null, hour: null, date: null },
    compareSelection: { busbarId: '', ytm: '', hourMode: 'all', hourStart: null, hourEnd: null, hour: null, date: null },
    dailyFilters: { busbarId: '', ytm: '', date: '', controlSource: '' },
    dailyDisplayMode: 'percent',
    dailyMetricSort: { key: '', direction: 'asc' },
    compareHourRows: [],
    rawPageKey: null,
    rawUnitSelection: null,
    selectedTestBusbarKey: '',
    testTableSort: { key: '', direction: 'asc' },
    errors: [],
    fetchLogs: [],
    yksLogs: [],
    activeFetchJobId: '',
    showVoltage: false,
    uploadFeedback: { active: false, total: 0, processed: 0 }
  };

  const el = {};
  const RGDH_STANDARD_JOB_TIMEOUT_MS = 180000;
  const RGDH_HYBRID_JOB_TIMEOUT_MS = 300000;
  const RGDH_HYBRID_CONTINUATION_TIMEOUT_MS = 900000;
  const RGDH_HYBRID_CONTINUATION_POLL_GRACE_MS = 60000;
  const COMPARE_KY_THRESHOLD_PCT = 80;
  const COMPARE_AVG_DELTA_LIMITS = { dV: 0.5, dP: 1, dQ: 1 };
  const COMPARE_MAX_DELTA_LIMITS = { dV: 3, dP: 10, dQ: 5 };
  const CONVENTIONAL_UNIT_SOURCE_TYPE = 'CONVENTIONAL_UNIT';

  const TEST_TABLE_COLUMNS = [
    { key: 'busbarType', label: 'Bara Tipi' },
    { key: 'busbarId', label: 'Bara ID' },
    { key: 'busbarName', label: 'Bara Adı', html: (row) => renderHybridNameHtml(row.busbarName || row.busbarId || '-', row) },
    { key: 'rgkType', label: 'RGK Tipi' },
    { key: 'voltageLevel', label: 'Bara Gerilim Seviyesi', html: (row) => formatNumber(row.voltageLevel) },
    { key: 'ytm', label: 'BYTM' },
    { key: 'plantId', label: 'TPYS Santral ID' },
    { key: 'plantName', label: 'TPYS Santral İsmi', html: (row) => renderHybridNameHtml(row.plantName || '-', row) },
    { key: 'busbar1Ta', label: 'Bara 1 TA' },
    { key: 'busbar1Setnum', label: 'Bara 1 Setnum' },
    { key: 'busbar2Ta', label: 'Bara 2 TA' },
    { key: 'busbar2Setnum', label: 'Bara 2 Setnum' },
    { key: 'busbar3Ta', label: 'Bara 3 TA' }
  ];

  const DAILY_METRIC_COLUMNS = [
    { key: 'localDate', label: 'Tarih', html: (row) => escapeHtml(row.localDate || '-') },
    { key: 'hour', label: 'Saat', html: (row) => escapeHtml(`${String(row.hour).padStart(2, '0')}:00`) },
    { key: 'busbarName', label: 'Bara', html: (row) => renderHybridNameHtml(row.busbarName || '-', row, { showSk: true }) },
    { key: 'sourceType', label: 'Tip', html: (row) => escapeHtml(row.sourceType || '-') },
    { key: 'controlSource', label: 'Kaynak Tipi', html: (row) => renderDailySourceBadge(row) },
    { key: 'hourResult', label: 'Sonuc', html: (row) => `${escapeHtml(row.hourResult || '-')}${renderSkBadge(row, { requireActive: true, showCount: true })}` },
    { key: 'passCount', label: 'Sagladi', html: (row) => formatNumber(row.passCount) },
    { key: 'failCount', label: 'Saglamadi', html: (row) => formatNumber(row.failCount) },
    { key: 'ddCount', label: 'DD', html: (row) => formatNumber(row.ddCount) },
    { key: 'yyCount', label: 'YY', html: (row) => formatNumber(row.yyCount) },
    { key: 'kyCount', label: 'KY', html: (row) => formatNumber(row.kyCount) },
    { key: 'participationPct', label: 'Katilim', html: (row) => formatPercent(row.participationPct) },
    { key: 'droopPctAvg', label: 'Ort Droop %', html: (row) => formatNumber(row.droopPctAvg) },
    { key: 'pnomAvg', label: 'Pnom', html: (row) => formatNumber(row.pnomAvg) },
    { key: 'pnomPct10', label: 'Pnom %10', html: (row) => formatNumber(row.pnomPct10) },
    { key: 'pnomPct50', label: 'Pnom %50', html: (row) => formatNumber(row.pnomPct50) },
    { key: 'pmkudAvg', label: 'MKUD', html: (row) => formatNumber(row.pmkudAvg) },
    { key: 'pgenAvg', label: 'Ort P', html: (row) => formatNumber(row.pgenAvg) },
    { key: 'qgenAvg', label: 'Ort Q', html: (row) => formatNumber(row.qgenAvg) },
    { key: 'setAvg', label: 'Ort V Set', html: (row) => formatNumber(row.setAvg) },
    { key: 'voltageAvg', label: 'Ort V', html: (row) => formatNumber(row.voltageAvg) }
  ];

  document.addEventListener('DOMContentLoaded', init);

  const CATALOG_SHORT_TO_LONG = {
    bt: 'busbarType', bid: 'busbarId', bn: 'busbarName', rt: 'rgkType', vl: 'voltageLevel',
    ytm: 'ytm', pid: 'plantId', pn: 'plantName',
    b1t: 'busbar1Ta', b1s: 'busbar1Setnum', b2t: 'busbar2Ta', b2s: 'busbar2Setnum',
    b3t: 'busbar3Ta', b3s: 'busbar3Setnum',
    un: 'unitName', ue: 'uevcbName', uid: 'unitId', sk: 'sourceKind',
    apt: 'activePowerTa', aps: 'activePowerSetnum', rpt: 'reactivePowerTa', rps: 'reactivePowerSetnum',
    pnom: 'unitPnomMw', pmkud: 'unitPmkudMw',
    lowTest: 'lowExcitationTest', highTest: 'highExcitationTest',
    nomLow: 'nominalLowExcitation', nomHigh: 'nominalHighExcitation',
    sd: 'speedDrop', pf: 'powerFactor', tv: 'terminalVoltage', ua: 'unitActive',
    ypn: 'ytbsPlantName', ysid: 'ytbsSubstationId', ysn: 'ytbsSubstationName',
    lat: 'latitude', lon: 'longitude', ysrc: 'ytbsSourceType', secsrc: 'secondarySources',
    city: 'city', ybt: 'ytbsBusbarType', sync: 'hasSynchronousCondenser',
    euas: 'hasEuasProtocol', prgk: 'platformRgkType', rgkdesc: 'rgkTypeDescription',
    db: 'isBalancingUnit', tum: 'tpysUnitMkud', tpm: 'tpysPlantMkud'
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
    'yks_izleme_modul/yks_docs/rgdh_unite_tanimi_v2.csv',
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
    syncDailyFiltersFromTopFilters();
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
      'filterDate', 'filterEndDate', 'filterSourceType', 'filterSearch', 'filterNotice', 'uploadNotice',
      'btnFetchYks', 'btnCancelFetch', 'btnPickCsv', 'csvInput', 'btnLoadLocalEkc', 'localEkcDirectoryInput',
      'btnExportCsv', 'btnToggleTheme', 'btnToggleVoltage',
      'statSource', 'statRows', 'statBusbars',
      'statMismatch', 'statStatus', 'rawTable', 'rawPager', 'rawPageInfo', 'btnRawFirst', 'btnRawPrev', 'btnRawNext', 'btnRawLast', 'rawUnitDetail', 'rawUnitTitle', 'rawUnitTable', 'dailyFilterBar', 'dailyFilterBusbar', 'dailyFilterYtm', 'dailyFilterDate', 'dailyFilterControlSource', 'btnClearDailyFilters', 'btnToggleDailyDisplayMode', 'btnExportDailyCsv', 'dailyTable', 'btnToggleDailyMetricTable', 'dailyMetricWrap', 'dailyMetricTable', 'chartContextLabel', 'chartsRoot', 'compareContextLabel', 'compareChartsRoot', 'compareTable', 'testsTable', 'testUnitDetailsTable', 'testOtherDetailsTable',
      'testCatalogSearchInput', 'testBusbarTypeSelect', 'testBusbarSelect', 'testHybridOnlyCheckbox', 'btnExportTestsCsv',
      'btnErrorDetails', 'extensionLogCount', 'extensionLogPanel', 'btnCloseErrors', 'btnExportExtensionLogCsv', 'btnClearErrorLogs', 'extensionLogList',
      'btnYksLogs', 'yksLogCount', 'yksLogPanel', 'btnRefreshYksLogs', 'btnExportYksLogCsv', 'btnClearYksLogs', 'btnCloseYksLogs', 'yksLogList',
      'fetchLogPanel', 'btnCloseFetchLog', 'fetchLogList',
      'uploadModal', 'uploadModalTitle', 'uploadModalMessage', 'uploadProgressBar', 'uploadProgressText', 'btnCloseUploadModal'
    ].forEach((id) => { el[id] = document.getElementById(id); });
    el.tabs = Array.from(document.querySelectorAll('[data-tab]'));
    el.panels = Array.from(document.querySelectorAll('[data-panel]'));
  }

  function bindEvents() {
    el.tabs.forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    [el.filterDate, el.filterEndDate, el.filterSourceType, el.filterSearch]
      .forEach((input) => input.addEventListener('input', () => {
        syncDailyFiltersFromTopFilters();
        persistFilters();
        renderAll();
      }));
    [el.dailyFilterBusbar, el.dailyFilterYtm, el.dailyFilterDate, el.dailyFilterControlSource]
      .forEach((input) => input?.addEventListener('input', handleDailyFilterChange));
    el.btnClearDailyFilters?.addEventListener('click', clearDailyFilters);
    el.btnToggleDailyDisplayMode?.addEventListener('click', toggleDailyDisplayMode);
    el.btnExportDailyCsv?.addEventListener('click', exportDailyCsv);
    [el.testCatalogSearchInput, el.testBusbarTypeSelect, el.testBusbarSelect, el.testHybridOnlyCheckbox]
      .forEach((input) => input.addEventListener('input', () => {
        syncDynamicOptions();
        renderTestsTable();
      }));
    el.testsTable?.addEventListener('click', (event) => {
      const button = event.target?.closest?.('[data-test-sort-key]');
      if (!button) return;
      event.preventDefault();
      setTestTableSort(button.dataset.testSortKey);
      renderTestsTable();
    });
    el.btnFetchYks.addEventListener('click', fetchYksData);
    el.btnCancelFetch?.addEventListener('click', cancelYksFetch);
    el.btnPickCsv.addEventListener('click', () => el.csvInput.click());
    el.csvInput.addEventListener('change', handleCsvFiles);
    el.btnLoadLocalEkc?.addEventListener('click', handleLocalEkcLoad);
    el.localEkcDirectoryInput?.addEventListener('change', handleLocalEkcDirectoryFallbackFiles);
    el.btnToggleDailyMetricTable?.addEventListener('click', toggleDailyMetricTable);
    el.dailyMetricTable?.addEventListener('click', (event) => {
      const button = event.target?.closest?.('[data-daily-metric-sort-key]');
      if (!button) return;
      event.preventDefault();
      setDailyMetricSort(button.dataset.dailyMetricSortKey);
      renderAll();
    });
    [
      [el.btnRawFirst, 'first'],
      [el.btnRawPrev, 'prev'],
      [el.btnRawNext, 'next'],
      [el.btnRawLast, 'last']
    ].forEach(([button, action]) => button?.addEventListener('click', () => moveRawPage(action)));
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
    el.btnCloseUploadModal?.addEventListener('click', hideUploadFeedback);
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
    for (const kind of ['conventionalRows', 'conventionalUnitRows', 'windRows', 'domRows']) {
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
    const conventionalUnits = (response.conventionalUnitRows || []).map(RGDH_NORMALIZER.normalizeConventionalUnitApiRow);
    const wind = (response.windRows || []).map(RGDH_NORMALIZER.normalizeWindApiRow);
    const dom = (response.domRows || [])
      .map((row) => RGDH_NORMALIZER.finalizeRow({ ...row, sourceOrigin: 'DOM' }))
      .filter((row) => !RGDH_NORMALIZER.isZeroDomMeasurementRow(row));
    state.apiRows = enrichRows([...conventional, ...wind]);
    state.conventionalUnitRows = conventionalUnits;
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
    try {
      await loadEkcFiles(files, { source: 'manual' });
    } finally {
      event.target.value = '';
    }
  }

  async function handleLocalEkcLoad() {
    const loader = getLocalEkcLoader();
    if (!loader) {
      const message = 'Local Ek-C yukleyici modulu bulunamadi.';
      pushError('Local EK-C', message, {});
      pushFetchLog('error', 'Local EK-C', message, {});
      setStatus(message);
      return;
    }

    if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
      startLocalEkcFallbackDirectoryPick();
      return;
    }

    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    el.btnLoadLocalEkc.disabled = true;
    setStatus('Local EK-C klasoru seciliyor...');
    pushFetchLog('info', 'Local EK-C', 'Local EK-C klasor secimi baslatildi.', { filters, selectedBusbar });

    try {
      const directoryResult = await loader.getLocalEkcDirectoryHandle();
      const directoryHandle = directoryResult.directoryHandle;
      setStatus('Local EK-C klasoru taraniyor...');
      const collection = await loader.collectLocalEkcFilesFromDirectory(directoryHandle, {
        filters,
        selectedBusbar,
        onProgress: handleLocalEkcProgress
      });
      pushFetchLog('info', 'Local EK-C', `Local EK-C klasoru tarandi: ${directoryHandle?.name || '-'}.`, {
        directoryName: directoryHandle?.name || '',
        handleSource: directoryResult.source,
        scannedFiles: collection.scannedFiles,
        filteredOutFiles: collection.filteredOutFiles,
        duplicateFiles: collection.duplicateFiles,
        readErrorFiles: collection.readErrorFiles || []
      });
      await loadEkcFiles(collection.files, {
        source: 'local',
        filters,
        selectedBusbar,
        localSummary: {
          ...collection,
          directoryName: directoryHandle?.name || '',
          handleSource: directoryResult.source
        }
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('Local EK-C klasor secimi iptal edildi.');
        pushFetchLog('warn', 'Local EK-C', 'Local EK-C klasor secimi iptal edildi.', {});
        return;
      }
      const message = error?.message || String(error);
      pushError('Local EK-C', message, error);
      pushFetchLog('error', 'Local EK-C', message, error);
      setStatus('Local EK-C yukleme basarisiz');
    } finally {
      el.btnLoadLocalEkc.disabled = false;
    }
  }

  async function handleLocalEkcDirectoryFallbackFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const loader = getLocalEkcLoader();
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    try {
      const collection = await loader.collectLocalEkcFilesFromFileList(files, {
        filters,
        selectedBusbar,
        onProgress: handleLocalEkcProgress
      });
      pushFetchLog('info', 'Local EK-C', 'Local EK-C fallback klasor secimi tarandi.', {
        scannedFiles: collection.scannedFiles,
        filteredOutFiles: collection.filteredOutFiles,
        duplicateFiles: collection.duplicateFiles,
        readErrorFiles: collection.readErrorFiles || []
      });
      await loadEkcFiles(collection.files, {
        source: 'local',
        filters,
        selectedBusbar,
        localSummary: {
          ...collection,
          directoryName: 'webkitdirectory',
          handleSource: 'fallback'
        }
      });
    } catch (error) {
      const message = error?.message || String(error);
      pushError('Local EK-C', message, error);
      pushFetchLog('error', 'Local EK-C', message, error);
      setStatus('Local EK-C yukleme basarisiz');
    } finally {
      event.target.value = '';
    }
  }

  async function loadEkcFiles(files, options = {}) {
    const sourceLabel = options.source === 'local' ? 'Local EK-C' : 'EK-C';
    const isLocal = options.source === 'local';
    const loader = isLocal ? getLocalEkcLoader() : null;
    const localSummary = options.localSummary || {};
    const localParseFilters = options.filters || readFilters();
    const selectedBusbar = options.selectedBusbar || null;
    let localFilteredOutFiles = 0;

    if (!files.length) {
      const emptySummary = buildEkcLoadSummary([], { acceptedGroups: [], duplicateGroups: [], rows: [] }, [], {
        ...localSummary,
        sourceLabel
      });
      finishUploadFeedback(emptySummary, uploadFeedbackTone(emptySummary));
      setStatus(formatEkcLoadSummary(emptySummary));
      pushFetchLog(uploadFeedbackLogLevel(emptySummary), sourceLabel, formatEkcLoadSummary(emptySummary), emptySummary);
      return emptySummary;
    }

    showUploadFeedback(files.length, { sourceLabel });
    const fileGroups = [];
    const parseErrors = [];
    const catalogSummaries = getCatalogBusbarSummaries();
    const fallbackTarget = isLocal ? null : files.length === 1 ? resolveEkcBindingTarget() : null;

    for (const [index, file] of files.entries()) {
      if (isLocal && index > 0 && index % 8 === 0) await yieldToBrowser();
      const fileName = file.localEkcPath || file.webkitRelativePath || file.name;
      updateUploadFeedback(index, files.length, `Isleniyor: ${fileName}`);
      try {
        const text = await file.text();
        const parsed = RGDH_CSV.parseEkcCsvText(text, { filename: file.name });
        let parsedRows = parsed.rows || [];
        if (isLocal && loader?.filterParsedEkcRows) {
          parsedRows = loader.filterParsedEkcRows(parsedRows, { filters: localParseFilters });
          if (!parsedRows.length) {
            localFilteredOutFiles += 1;
            continue;
          }
        }
        let binding = RGDH_COMPARISON.bindEkcRowsToCatalog(parsedRows, catalogSummaries, {
          fallbackTarget,
          fileName: file.name
        });
        if (isLocal && loader?.filterParsedEkcRows) {
          const filteredBoundRows = loader.filterParsedEkcRows(binding.rows || [], {
            filters: localParseFilters,
            selectedBusbar
          });
          if (!filteredBoundRows.length) {
            localFilteredOutFiles += 1;
            continue;
          }
          binding = { ...binding, rows: filteredBoundRows };
        }
        fileGroups.push({
          fileName,
          rows: binding.rows || [],
          parsedGroups: parsed.groups || [],
          binding,
          localEkcPath: file.localEkcPath || '',
          localEkcHash: file.localEkcHash || ''
        });
      } catch (error) {
        parseErrors.push({ fileName, message: error.message || String(error) });
        pushError(sourceLabel, error.message || String(error), { file: fileName });
      } finally {
        updateUploadFeedback(index + 1, files.length, `Islendi: ${fileName}`);
      }
    }

    const deduped = RGDH_COMPARISON.dedupeEkcFileLoadGroups(fileGroups);
    if (deduped.rows.length) {
      state.ekcRows = buildEkcCalculationRows(deduped.rows);
      state.ekcGroups = deduped.acceptedGroups.flatMap((group) => group.parsedGroups || []);
      state.ekcLoaded = true;
      state.ekcBindingTarget = resolveSingleEkcBindingTarget(deduped.acceptedGroups);
      syncFiltersToEkcDates(state.ekcRows);
    } else {
      state.ekcLoaded = state.ekcLoaded || fileGroups.length > 0;
    }
    rebuildEnrichment();
    syncDynamicOptions();
    const loadSummary = buildEkcLoadSummary(fileGroups, deduped, parseErrors, {
      ...localSummary,
      sourceLabel,
      filteredOutFiles: (localSummary.filteredOutFiles || 0) + localFilteredOutFiles
    });
    finishUploadFeedback(loadSummary, uploadFeedbackTone(loadSummary));
    setStatus(formatEkcLoadSummary(loadSummary));
    pushFetchLog(uploadFeedbackLogLevel(loadSummary), sourceLabel, formatEkcLoadSummary(loadSummary), loadSummary);
    if (state.ekcRows.length) {
      autoCompareAfterEkcLoad();
    } else {
      renderAll();
    }
    return loadSummary;
  }

  function handleLocalEkcProgress(progress) {
    const scanned = Number(progress?.scannedFiles || 0);
    const skipped = Number(progress?.skippedByPath || 0);
    const read = Number(progress?.readFiles || 0);
    const duplicate = Number(progress?.duplicateFiles || 0);
    const message = `Local EK-C taraniyor: ${scanned} dosya, ${skipped} filtre disi, ${read} okundu${duplicate ? `, ${duplicate} tekrar` : ''}.`;
    setStatus(message);
    setUploadNotice(message, '');
  }

  function startLocalEkcFallbackDirectoryPick() {
    if (!el.localEkcDirectoryInput) {
      const message = 'Local EK-C fallback klasor secici bulunamadi.';
      pushError('Local EK-C', message, {});
      pushFetchLog('error', 'Local EK-C', message, {});
      setStatus(message);
      return;
    }
    el.localEkcDirectoryInput.value = '';
    pushFetchLog('warn', 'Local EK-C', 'showDirectoryPicker desteklenmiyor; klasor input fallback kullaniliyor.', {});
    setStatus('Local EK-C klasoru secin...');
    el.localEkcDirectoryInput.click();
  }

  function getLocalEkcLoader() {
    return typeof RGDH_LOCAL_EKC_LOADER !== 'undefined' ? RGDH_LOCAL_EKC_LOADER : null;
  }

  function bindEkcRowsToSelectedBusbar(rows, target = resolveEkcBindingTarget()) {
    return RGDH_COMPARISON.bindEkcRowsToSelectedBusbar(rows, target);
  }

  function resolveSingleEkcBindingTarget(groups) {
    const targets = new Map();
    (groups || []).forEach((group) => {
      const target = group.binding?.target;
      if (!target?.busbarId) return;
      targets.set(String(target.busbarId), target);
    });
    return targets.size === 1 ? [...targets.values()][0] : null;
  }

  function buildEkcLoadSummary(fileGroups, deduped, parseErrors, extra = {}) {
    const acceptedGroups = deduped.acceptedGroups || [];
    return {
      sourceLabel: extra.sourceLabel || 'EK-C',
      fileCount: fileGroups.length + parseErrors.length,
      acceptedFiles: acceptedGroups.length,
      duplicateFiles: (deduped.duplicateGroups || []).length,
      localDuplicateFiles: Number(extra.duplicateFiles || 0),
      scannedFiles: Number(extra.scannedFiles || 0),
      filteredOutFiles: Number(extra.filteredOutFiles || 0),
      readErrorFiles: (extra.readErrorFiles || []).length || Number(extra.readErrorFileCount || 0),
      directoryName: extra.directoryName || '',
      matchedFiles: countEkcBindingStatus(acceptedGroups, 'matched'),
      fallbackFiles: countEkcBindingStatus(acceptedGroups, 'fallback_selected'),
      unmatchedFiles: countEkcBindingStatus(acceptedGroups, 'no_match'),
      ambiguousFiles: countEkcBindingStatus(acceptedGroups, 'ambiguous'),
      parseErrorFiles: parseErrors.length,
      rowCount: (deduped.rows || []).length
    };
  }

  function countEkcBindingStatus(groups, status) {
    return (groups || []).filter((group) => group.binding?.status === status).length;
  }

  function formatEkcLoadSummary(summary) {
    const sourceLabel = summary.sourceLabel || 'EK-C';
    const parts = [
      `${sourceLabel} CSV yuklendi: ${summary.rowCount || 0} dakika`,
      `${summary.acceptedFiles || 0}/${summary.fileCount || 0} dosya kabul`
    ];
    if (summary.scannedFiles) parts.push(`${summary.scannedFiles} local dosya tarandi`);
    if (summary.filteredOutFiles) parts.push(`${summary.filteredOutFiles} filtre disi`);
    if (summary.localDuplicateFiles) parts.push(`${summary.localDuplicateFiles} local tekrar atlandi`);
    if (summary.readErrorFiles) parts.push(`${summary.readErrorFiles} local okuma hatasi`);
    if (summary.matchedFiles) parts.push(`${summary.matchedFiles} katalog eslesmesi`);
    if (summary.fallbackFiles) parts.push(`${summary.fallbackFiles} secili bara fallback`);
    if (summary.duplicateFiles) parts.push(`${summary.duplicateFiles} tekrar reddedildi`);
    if (summary.unmatchedFiles) parts.push(`${summary.unmatchedFiles} eslesmedi`);
    if (summary.ambiguousFiles) parts.push(`${summary.ambiguousFiles} belirsiz`);
    if (summary.parseErrorFiles) parts.push(`${summary.parseErrorFiles} parse hatasi`);
    return parts.join(', ') + '.';
  }

  function showUploadFeedback(totalFiles, options = {}) {
    const sourceLabel = options.sourceLabel || 'EK-C';
    state.uploadFeedback = { active: true, total: totalFiles || 0, processed: 0, sourceLabel };
    setUploadNotice(`${sourceLabel} CSV yukleniyor: 0/${totalFiles || 0} dosya.`, '');
    if (el.uploadModal) el.uploadModal.hidden = false;
    if (el.uploadModalTitle) el.uploadModalTitle.textContent = `${sourceLabel} CSV yukleniyor`;
    if (el.uploadModalMessage) el.uploadModalMessage.textContent = 'Dosyalar sirayla okunuyor ve katalogla eslestiriliyor.';
    if (el.btnCloseUploadModal) el.btnCloseUploadModal.hidden = true;
    setUploadProgress(0, totalFiles || 0);
  }

  function updateUploadFeedback(processedFiles, totalFiles, message) {
    const processed = Math.max(0, Number(processedFiles) || 0);
    const total = Math.max(0, Number(totalFiles) || 0);
    const sourceLabel = state.uploadFeedback.sourceLabel || 'EK-C';
    state.uploadFeedback = { active: true, processed, total, sourceLabel };
    const progressText = `${sourceLabel} CSV yukleniyor: ${processed}/${total} dosya.`;
    setUploadNotice(progressText, '');
    if (el.uploadModalTitle) el.uploadModalTitle.textContent = `${sourceLabel} CSV yukleniyor`;
    if (el.uploadModalMessage) el.uploadModalMessage.textContent = message || progressText;
    setUploadProgress(processed, total);
  }

  function finishUploadFeedback(loadSummary, tone = 'success') {
    const sourceLabel = loadSummary.sourceLabel || state.uploadFeedback.sourceLabel || 'EK-C';
    state.uploadFeedback = { active: false, processed: loadSummary.fileCount || 0, total: loadSummary.fileCount || 0, sourceLabel };
    const message = formatEkcLoadSummary(loadSummary);
    setUploadNotice(message, tone);
    if (el.uploadModal) el.uploadModal.hidden = false;
    if (el.uploadModalTitle) el.uploadModalTitle.textContent = uploadFeedbackTitle(tone, sourceLabel);
    if (el.uploadModalMessage) el.uploadModalMessage.textContent = message;
    if (el.btnCloseUploadModal) el.btnCloseUploadModal.hidden = false;
    setUploadProgress(loadSummary.fileCount || 0, loadSummary.fileCount || 0);
  }

  function hideUploadFeedback() {
    if (el.uploadModal) el.uploadModal.hidden = true;
  }

  function uploadFeedbackTone(summary) {
    const hardErrors = Number(summary.parseErrorFiles || 0) + Number(summary.readErrorFiles || 0);
    if (hardErrors && !summary.acceptedFiles) return 'error';
    const duplicateOnlyWarning = Boolean(
      (summary.duplicateFiles || summary.localDuplicateFiles || summary.filteredOutFiles)
      && !hardErrors
      && !summary.unmatchedFiles
      && !summary.ambiguousFiles
    );
    if (duplicateOnlyWarning) return 'success';
    if (hardErrors || summary.unmatchedFiles || summary.ambiguousFiles) return 'warn';
    return 'success';
  }

  function uploadFeedbackLogLevel(summary) {
    const tone = uploadFeedbackTone(summary);
    return tone === 'error' ? 'error' : tone === 'warn' ? 'warn' : 'success';
  }

  function uploadFeedbackTitle(tone, sourceLabel = 'EK-C') {
    if (tone === 'error') return `${sourceLabel} CSV yukleme hatasi`;
    if (tone === 'warn') return `${sourceLabel} CSV yuklendi - uyarilar var`;
    return `${sourceLabel} CSV yuklendi`;
  }

  function setUploadNotice(message, tone) {
    if (!el.uploadNotice) return;
    el.uploadNotice.hidden = false;
    el.uploadNotice.className = ['rgdh-upload-notice', tone].filter(Boolean).join(' ');
    el.uploadNotice.textContent = message;
  }

  function setUploadProgress(processedFiles, totalFiles) {
    const total = Math.max(0, Number(totalFiles) || 0);
    const processed = Math.max(0, Number(processedFiles) || 0);
    const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
    if (el.uploadProgressBar) el.uploadProgressBar.style.width = `${percent}%`;
    if (el.uploadProgressText) el.uploadProgressText.textContent = `${processed}/${total} dosya`;
  }

  function yieldToBrowser() {
    if (typeof requestAnimationFrame === 'function') {
      return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function buildEkcCalculationRows(rows) {
    if (!RGDH_REACTIVE_ENGINE?.buildEkcCalculationRows) return rows || [];
    return RGDH_REACTIVE_ENGINE.buildEkcCalculationRows(rows || [], buildEkcCatalogContextIndex());
  }

  function buildEkcCatalogContextIndex() {
    const map = new Map();
    RGDH_NORMALIZER.buildCatalogBusbarSummaries(state.catalogRows).forEach((summary) => {
      const keys = [
        summary.busbarId,
        summary.busbarName,
        summary.plantName,
        summary.ytbsPlantName
      ].map((value) => String(value ?? '').trim()).filter(Boolean);
      keys.forEach((key) => {
        if (!map.has(key)) map.set(key, summary);
      });
    });
    return map;
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
    syncDailyFiltersFromTopFilters();
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
    switchTab('daily');
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
    const ekcRows = getFilteredEkcRows();
    const dailyPivotRows = buildDailyControlPivotRows(rows, ekcRows);
    const filteredDailyPivotRows = filterDailyPivotRows(dailyPivotRows, state.dailyFilters);
    state.pivot = RGDH_PIVOT.buildDailyPivot(rows);
    renderFilterNotice(rows);
    renderStats(rows, ekcRows);
    syncRawUnitSelectionWithRows(rows);
    renderRawTable(rows);
    renderRawUnitDetail();
    renderDailyFilters(dailyPivotRows);
    updateDailyDisplayModeButton();
    renderDailyTable(filteredDailyPivotRows);
    renderDailyMetricTable(filteredDailyPivotRows);
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
      bindingTargetMissing: state.ekcLoaded && !hasBoundEkcRows(ekcRows),
      missingBindingDiagnosis: 'Ortak dakika bulunamadi: secili YKS SCADA barasi yok veya EK-C icin otomatik bara eslesmesi yapilamadi'
    });
  }

  function hasBoundEkcRows(rows = state.ekcRows) {
    return (rows || []).some((row) => row?.busbarId !== null && row?.busbarId !== undefined && row.busbarId !== '');
  }

  function buildDailyControlPivotRows(platformRows, ekcRows) {
    const sourceRows = [
      ...markDailyControlRows(platformRows, 'YKS'),
      ...markDailyControlRows(ekcRows, 'EKC')
    ];
    return RGDH_PIVOT.buildDailyPivot(sourceRows).rows.sort(compareDailyControlRows);
  }

  function markDailyControlRows(rows, controlSource) {
    if (controlSource === 'EKC') {
      return (rows || []).map((row) => ({
        ...row,
        controlSource: 'EKC',
        controlType: 'EK-C Kontrol'
      }));
    }
    return (rows || []).map((row) => ({
      ...row,
      controlSource: 'YKS',
      controlType: 'YKS Kontrol'
    }));
  }

  function compareDailyControlRows(a, b) {
    const dateCompare = String(a.localDate || '').localeCompare(String(b.localDate || ''));
    if (dateCompare) return dateCompare;
    const busbarA = String(a.busbarName || a.busbarId || '');
    const busbarB = String(b.busbarName || b.busbarId || '');
    const busbarCompare = busbarA.localeCompare(busbarB);
    if (busbarCompare) return busbarCompare;
    const sourceOrder = { YKS: 0, EKC: 1 };
    return (sourceOrder[a.controlSource] ?? 9) - (sourceOrder[b.controlSource] ?? 9);
  }

  function dailyCalculationMode(row) {
    return row?.controlSource === 'EKC' ? 'EKC' : 'YKS';
  }

  function emptyDailyFilters() {
    return { busbarId: '', ytm: '', date: '', controlSource: '' };
  }

  function readDailyFilters() {
    return {
      busbarId: el.dailyFilterBusbar?.value || '',
      ytm: el.dailyFilterYtm?.value || '',
      date: el.dailyFilterDate?.value || '',
      controlSource: el.dailyFilterControlSource?.value || ''
    };
  }

  function handleDailyFilterChange() {
    state.dailyFilters = readDailyFilters();
    applyDailyFiltersToTopFilters(state.dailyFilters);
    renderAll();
  }

  function clearDailyFilters() {
    state.dailyFilters = emptyDailyFilters();
    applyDailyFiltersToTopFilters(state.dailyFilters);
    renderAll();
  }

  function toggleDailyDisplayMode() {
    state.dailyDisplayMode = state.dailyDisplayMode === 'percent' ? 'result' : 'percent';
    updateDailyDisplayModeButton();
    renderAll();
  }

  function updateDailyDisplayModeButton() {
    if (!el.btnToggleDailyDisplayMode) return;
    el.btnToggleDailyDisplayMode.textContent = state.dailyDisplayMode === 'percent' ? 'Sonuç Göster' : 'Yüzde Göster';
  }

  function syncDailyFiltersFromTopFilters() {
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    state.dailyFilters = {
      ...state.dailyFilters,
      busbarId: selectedBusbar?.busbarId || '',
      date: filters.date || ''
    };
  }

  function applyDailyFiltersToTopFilters(filters = state.dailyFilters) {
    const target = resolveCatalogBusbarForDailyFilter(filters.busbarId);
    if (el.filterDate) el.filterDate.value = filters.date || '';
    if (el.filterEndDate) el.filterEndDate.value = '';
    if (el.filterSearch) el.filterSearch.value = target ? catalogBusbarKey(target) : '';
    if (el.filterSourceType) {
      el.filterSourceType.value = target
        ? normalizeSelectedSourceType(target.sourceType || inferCatalogSourceType(target))
        : 'ALL';
    }
    persistFilters();
  }

  function resolveCatalogBusbarForDailyFilter(busbarId) {
    const value = String(busbarId || '').trim();
    if (!value) return null;
    return getCatalogBusbarSummaries().find((summary) => String(summary.busbarId || '').trim() === value) || null;
  }

  function setDailyFiltersFromRow(row) {
    const target = resolveCatalogBusbarForRow(row);
    state.dailyFilters = {
      busbarId: dailyFilterBusbarValue(row),
      ytm: row?.ytm || target?.ytm || '',
      date: row?.localDate || '',
      controlSource: row?.controlSource === 'EKC' ? 'EKC' : row?.controlSource === 'YKS' ? 'YKS' : ''
    };
  }

  function renderDailyFilters(pivotRows) {
    if (!el.dailyFilterBar) return;
    const rows = pivotRows || [];
    const filters = state.dailyFilters || emptyDailyFilters();
    setOptions(el.dailyFilterBusbar, rows.map((row) => ({
      value: dailyFilterBusbarValue(row),
      label: dailyFilterBusbarLabel(row)
    })), 'Tumu', filters.busbarId);
    setOptions(el.dailyFilterYtm, rows.map((row) => ({
      value: row.ytm || '',
      label: row.ytm || ''
    })), 'Tumu', filters.ytm);
    setOptions(el.dailyFilterDate, rows.map((row) => ({
      value: row.localDate || '',
      label: row.localDate || ''
    })), 'Tumu', filters.date);
    setOptions(el.dailyFilterControlSource, [
      { value: 'YKS', label: 'YKS Kontrol' },
      { value: 'EKC', label: 'EK-C Kontrol' }
    ], 'Tumu', filters.controlSource);
  }

  function filterDailyPivotRows(rows, filters = state.dailyFilters) {
    const dailyFilters = filters || emptyDailyFilters();
    return (rows || []).filter((row) => {
      if (dailyFilters.busbarId && dailyFilterBusbarValue(row) !== dailyFilters.busbarId) return false;
      if (dailyFilters.ytm && String(row.ytm || '') !== dailyFilters.ytm) return false;
      if (dailyFilters.date && String(row.localDate || '') !== dailyFilters.date) return false;
      if (dailyFilters.controlSource && String(row.controlSource || '') !== dailyFilters.controlSource) return false;
      return true;
    });
  }

  function dailyFilterBusbarValue(row) {
    return String(row?.busbarId || row?.ekcEntityKey || row?.busbarName || '').trim();
  }

  function dailyFilterBusbarLabel(row) {
    const name = row?.busbarName || row?.ekcOriginalName || row?.ekcSourceFileName || row?.fileName || row?.busbarId || 'Bara';
    const id = row?.busbarId ? ` (${row.busbarId})` : '';
    const source = row?.controlSource === 'EKC' ? 'EK-C Kontrol' : row?.controlSource === 'YKS' ? 'YKS Kontrol' : '';
    const label = [String(name || 'Bara') + id, source].filter(Boolean).join(' - ');
    return formatHybridOptionLabel(label, row);
  }

  function selectDailyChart(row, hour = null) {
    state.calculationMode = dailyCalculationMode(row);
    state.chartSelection = { busbarId: row.busbarId, hour, date: row.localDate || null };
    setDailyFiltersFromRow(row);
    syncFiltersToDailyControlRow(row);
    setCompareSelectionFromDailyRow(row);
    switchTab('charts');
  }

  function syncFiltersToDailyControlRow(row) {
    if (row?.controlSource !== 'EKC') return;
    const target = resolveCatalogBusbarForRow(row);
    if (el.filterDate) el.filterDate.value = row.localDate || '';
    if (el.filterEndDate) el.filterEndDate.value = '';
    if (el.filterSourceType) {
      el.filterSourceType.value = normalizeSelectedSourceType(row.sourceType || target?.sourceType || 'ALL');
    }
    if (el.filterSearch && target) el.filterSearch.value = catalogBusbarKey(target);
    persistFilters();
  }

  function setCompareSelectionFromDailyRow(row) {
    if (row?.controlSource !== 'EKC') return;
    const target = resolveCatalogBusbarForRow(row);
    state.compareSelection = {
      ...state.compareSelection,
      busbarId: String(row.busbarId || target?.busbarId || ''),
      ytm: row.ytm || target?.ytm || '',
      date: row.localDate || '',
      hourMode: 'all',
      hourStart: null,
      hourEnd: null,
      hour: null
    };
  }

  function renderDailySourceBadge(row) {
    const controlSource = row?.controlSource === 'EKC' ? 'EKC' : row?.controlSource === 'YKS' ? 'YKS' : '';
    if (!controlSource) return escapeHtml(row?.controlType || '-');
    const className = controlSource === 'EKC' ? 'rgdh-source-ekc' : 'rgdh-source-yks';
    const label = controlSource === 'EKC' ? 'EK-C Kontrol' : 'YKS Kontrol';
    return `<span class="rgdh-source-badge ${className}">${escapeHtml(label)}</span>`;
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
    const skBadge = renderSkBadge(stat, { requireActive: true, showCount: true });
    if (result === 'DD' || result === 'YY' || result === 'KY') {
      return { html: `${escapeHtml(result)}${skBadge}`, className: `compare-ky-neutral participation-${result.toLowerCase()}` };
    }
    const ratio = Number(stat?.passRatio ?? stat?.participationPct);
    if (!Number.isFinite(ratio)) return '-';
    return {
      html: `${formatFixedPercent(ratio)}${skBadge}`,
      className: ratio >= COMPARE_KY_THRESHOLD_PCT ? 'compare-ky-ok' : 'compare-ky-fail'
    };
  }

  function renderSkBadge(context = {}, options = {}) {
    const active = isTruthyFlag(context?.synchronousCondenserActive);
    const candidate = active
      || isTruthyFlag(context?.synchronousCondenserCandidate)
      || hasSynchronousCondenserMarker(context);
    if (options.requireActive && !active) return '';
    if (!candidate) return '';
    const result = normalizeReactiveResult(context?.synchronousCondenserResult || context?.hourResult || context?.status || context?.reactiveResult || context?.result);
    const className = active
      ? (result === 'SAGLAMADI'
        ? 'rgdh-sk-fail'
        : (result === 'SAGLADI' ? 'rgdh-sk-ok' : 'rgdh-sk-neutral'))
      : 'rgdh-sk-candidate';
    const minuteCount = Number(context?.synchronousCondenserMinuteCount || 0);
    const title = active
      ? `Senkron kompansator aktif (${formatNumber(minuteCount)} dk, basarili ${formatNumber(context?.synchronousCondenserSuccessMinuteCount)})`
      : 'Senkron kompansator adayi';
    const label = active && options.showCount !== false
      ? `SK(${formatNumber(context?.synchronousCondenserSuccessMinuteCount)})`
      : 'SK';
    return `<span class="rgdh-sk-badge ${className}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
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

  function formatCompareDeltaBarCell(cell, value, maxValue) {
    if (!cell || typeof cell !== 'object' || !String(cell.className || '').includes('compare-delta-blue')) {
      return cell;
    }
    const numeric = Number(value);
    const maxNumeric = Number(maxValue);
    if (!Number.isFinite(numeric) || !Number.isFinite(maxNumeric) || maxNumeric <= 0) return cell;
    const pct = Math.max(0, Math.min(100, (Math.abs(numeric) / maxNumeric) * 100));
    return {
      html: `<span class="compare-delta-bar" style="--bar-pct: ${pct.toFixed(2)}%;"><span class="compare-data-bar-value">${cell.html}</span></span>`,
      className: `${cell.className} compare-delta-bar-cell`
    };
  }

  function compareCellHtml(cell, column = {}) {
    const columnClass = compareColumnClass(column);
    if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'html')) {
      const classes = [columnClass, cell.className].filter(Boolean).join(' ');
      const className = classes ? ` class="${escapeHtml(classes)}"` : '';
      return `<td${className}>${cell.html}</td>`;
    }
    const className = columnClass ? ` class="${escapeHtml(columnClass)}"` : '';
    return `<td${className}>${cell}</td>`;
  }

  function compareColumnClass(column = {}) {
    return [
      column.groupStart ? 'rgdh-compare-group-start' : '',
      column.groupEnd ? 'rgdh-compare-group-end' : '',
      column.cls ? `rgdh-compare-cell-${column.cls}` : ''
    ].filter(Boolean).join(' ');
  }

  function buildCompareHeaderHtml(columns) {
    const groupCells = [];
    let index = 0;
    while (index < columns.length) {
      const groupName = columns[index].group || '';
      let span = 1;
      while (index + span < columns.length && (columns[index + span].group || '') === groupName) span += 1;
      const groupColumn = {
        groupStart: columns[index].groupStart,
        groupEnd: columns[index + span - 1].groupEnd
      };
      groupCells.push(`<th colspan="${span}" class="${escapeHtml(compareColumnClass(groupColumn))}">${escapeHtml(groupName)}</th>`);
      index += span;
    }
    return [
      `<thead><tr class="rgdh-compare-title-row">${groupCells.join('')}</tr>`,
      `<tr>${columns.map((column) => `<th class="${escapeHtml(compareColumnClass(column))}">${column.html}</th>`).join('')}</tr></thead>`
    ].join('');
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

  function renderStats(rows, ekcRows = getFilteredEkcRows()) {
    const combinedRows = [...(rows || []), ...(ekcRows || [])];
    const busbars = new Set(combinedRows.map(statBusbarKey).filter(Boolean));
    el.statSource.textContent = sourceLabel();
    el.statRows.textContent = String(combinedRows.length);
    el.statBusbars.textContent = String(busbars.size);
    el.statMismatch.textContent = String(mismatchCount());
    const extensionCount = state.errors.reduce((sum, item) => sum + (item.count || 1), 0) + state.fetchLogs.length;
    if (el.extensionLogCount) el.extensionLogCount.textContent = String(extensionCount);
    if (el.yksLogCount) el.yksLogCount.textContent = String(state.yksLogs.length);
  }

  function statBusbarKey(row) {
    if (row?.busbarId !== null && row?.busbarId !== undefined && row.busbarId !== '') return `busbar:${row.busbarId}`;
    if (String(row?.sourceOrigin || row?.calculationSource || '').toUpperCase() === 'EKC') {
      return `ekc:${row.ekcEntityKey || row.busbarName || row.plantName || row.fileName || row.ekcSourceFileName || ''}`;
    }
    return '';
  }

  function sourceLabel() {
    const parts = [];
    if (state.apiRows.length) parts.push('API');
    if (state.domRows.length) parts.push('DOM');
    if (state.ekcRows.length) parts.push('EK-C');
    if (state.catalogRows.length) parts.push('RGDH Test Tanımları');
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

  function hasSynchronousCondenserMarker(row) {
    if (!row) return false;
    if (isTruthyFlag(row.hasSynchronousCondenser) || isTruthyFlag(row.synchronousCondenserCandidate)) return true;
    if (isTruthyFlag(row.catalog?.hasSynchronousCondenser)) return true;
    const busbarId = String(row.busbarId ?? '').trim();
    const busbarName = normalizeText(row.busbarName || row.plantName || '');
    return getCatalogBusbarSummaries().some((summary) => {
      if (!isTruthyFlag(summary.hasSynchronousCondenser)) return false;
      if (busbarId && String(summary.busbarId ?? '').trim() === busbarId) return true;
      return busbarName && normalizeText(`${summary.busbarName || ''} ${summary.plantName || ''}`).includes(busbarName);
    });
  }

  function resolveFetchJobTimeoutMs(sourceType, selectedBusbar) {
    return String(sourceType || '').toUpperCase() === 'WIND' && hasAuxiliarySourceMarker(selectedBusbar)
      ? RGDH_HYBRID_JOB_TIMEOUT_MS
      : RGDH_STANDARD_JOB_TIMEOUT_MS;
  }

  function renderHybridNameHtml(value, row, options = {}) {
    const { showSk = true } = options;
    const label = escapeHtml(value || '-');
    const markers = [];
    if (hasAuxiliarySourceMarker(row)) {
      markers.push('<span class="rgdh-hybrid-dot" title="Yardimci kaynak" aria-label="Yardimci kaynak"></span>');
    }
    if (showSk && hasSynchronousCondenserMarker(row)) {
      markers.push(renderSkBadge({ synchronousCondenserCandidate: true }, { showCount: false }));
    }
    if (!markers.length) return label;
    return `<span class="rgdh-name-with-marker">${label}${markers.join('')}</span>`;
  }

  function formatHybridOptionLabel(label, row) {
    const suffixes = [];
    if (hasAuxiliarySourceMarker(row)) suffixes.push('Yardimci kaynak');
    if (hasSynchronousCondenserMarker(row)) suffixes.push('SK');
    return suffixes.length ? `${label} [${suffixes.join(', ')}]` : label;
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
      { text: 'Droop %', cls: '' },
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
    const rawRows = Array.isArray(rows) ? rows : [];
    const pages = RGDH_RAW_PAGINATION.buildRawDatePages(rawRows);
    const preferredKey = state.rawPageKey || readFilters().date || '';
    const currentPage = RGDH_RAW_PAGINATION.resolveRawPage(pages, preferredKey);
    state.rawPageKey = currentPage?.key || null;
    const visibleRows = currentPage?.rows || [];
    syncRawUnitSelectionWithRows(visibleRows);
    renderRawPager(pages, currentPage, rawRows.length);
    el.rawTable.innerHTML = `<thead><tr>${headers.map((h) => `<th class="${h.cls}">${h.text}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    visibleRows.forEach((row) => {
      const tr = document.createElement('tr');
      const status = rowStatus(row);
      const rawSelection = buildRawUnitSelection(row);
      if (rawSelection) {
        tr.classList.add('raw-unit-selectable');
        tr.title = 'Bu dakikanin konvansiyonel unite detaylarini goster';
      }
      if (rawSelection && rawUnitSelectionEquals(state.rawUnitSelection, rawSelection)) {
        tr.classList.add('selected');
      }
      const cols = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      tr.innerHTML = [
        badge(row.sourceOrigin),
        escapeHtml(row.measurementDateLocal || '-'),
        escapeHtml(row.sourceType || '-'),
        escapeHtml(row.ytm || '-'),
        renderHybridNameHtml(row.plantName || '-', row, { showSk: false }),
        escapeHtml(row.busbarId ?? '-'),
        renderHybridNameHtml(row.busbarName || '-', row, { showSk: false }),
        escapeHtml(row.busbarInternalId ?? '-'),
        formatNumber(row.tpysVoltageSet),
        formatNumber(row.tpysVoltageDrop),
        formatNumber(row.droopPct),
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
      tr.addEventListener('click', () => selectRawUnitMinute(row));
      tbody.appendChild(tr);
    });
    el.rawTable.appendChild(tbody);
  }

  function renderRawPager(pages, currentPage, totalRows) {
    if (!el.rawPageInfo) return;
    const list = Array.isArray(pages) ? pages : [];
    const currentIndex = currentPage ? list.findIndex((page) => page.key === currentPage.key) : -1;
    const currentNumber = currentIndex >= 0 ? currentIndex + 1 : 0;
    const totalPages = list.length;
    if (!totalPages) {
      el.rawPageInfo.textContent = 'Sayfa 0/0 - veri yok';
    } else {
      el.rawPageInfo.textContent = `Sayfa ${currentNumber}/${totalPages} - ${currentPage.label} - ${currentPage.rowCount} satir / toplam ${totalRows}`;
    }
    setRawPagerButtonState(currentIndex, totalPages);
  }

  function setRawPagerButtonState(currentIndex, totalPages) {
    const hasPages = totalPages > 0;
    const atFirst = !hasPages || currentIndex <= 0;
    const atLast = !hasPages || currentIndex >= totalPages - 1;
    if (el.btnRawFirst) el.btnRawFirst.disabled = atFirst;
    if (el.btnRawPrev) el.btnRawPrev.disabled = atFirst;
    if (el.btnRawNext) el.btnRawNext.disabled = atLast;
    if (el.btnRawLast) el.btnRawLast.disabled = atLast;
  }

  function moveRawPage(action) {
    const rows = getFilteredRows();
    const pages = RGDH_RAW_PAGINATION.buildRawDatePages(rows);
    state.rawPageKey = RGDH_RAW_PAGINATION.moveRawPage(pages, state.rawPageKey, action);
    renderRawTable(rows);
    renderRawUnitDetail();
  }

  function selectRawUnitMinute(row) {
    const selection = buildRawUnitSelection(row);
    state.rawUnitSelection = selection;
    renderRawTable(getFilteredRows());
    renderRawUnitDetail();
  }

  function syncRawUnitSelectionWithRows(rows) {
    if (!state.rawUnitSelection) return;
    const stillVisible = (rows || []).some((row) => {
      const selection = buildRawUnitSelection(row);
      return selection && rawUnitSelectionEquals(selection, state.rawUnitSelection);
    });
    if (!stillVisible) state.rawUnitSelection = null;
  }

  function buildRawUnitSelection(row) {
    if (!row || String(row.sourceOrigin || '').toUpperCase() !== 'API') return null;
    if (String(row.sourceType || '').toUpperCase() !== 'CONVENTIONAL') return null;
    const minuteKey = String(row.measurementDateLocal || row.measurementDateUtc || '').slice(0, 16);
    if (!minuteKey) return null;
    return {
      busbarInternalId: row.busbarInternalId ?? null,
      busbarId: row.busbarId ?? null,
      measurementMinute: minuteKey,
      measurementDateLocal: row.measurementDateLocal || '',
      label: `${row.busbarName || row.busbarId || '-'} ${minuteKey.replace('T', ' ')}`
    };
  }

  function rawUnitSelectionEquals(left, right) {
    if (!left || !right) return false;
    return String(left.measurementMinute || '') === String(right.measurementMinute || '')
      && String(left.busbarInternalId ?? '') === String(right.busbarInternalId ?? '')
      && String(left.busbarId ?? '') === String(right.busbarId ?? '');
  }

  function renderRawUnitDetail() {
    if (!el.rawUnitDetail || !el.rawUnitTable) return;
    const selection = state.rawUnitSelection;
    const rows = selection ? filterConventionalUnitRowsForSelection(selection) : [];
    if (!selection || !rows.length) {
      el.rawUnitDetail.hidden = true;
      el.rawUnitTable.innerHTML = '';
      return;
    }
    el.rawUnitDetail.hidden = false;
    if (el.rawUnitTitle) {
      el.rawUnitTitle.textContent = `Konvansiyonel Unite Dakika Detayi - ${selection.label}`;
    }
    const headers = [
      'YTM',
      'Olcum Zamani',
      'Bara ID',
      'Bara Adi',
      'Unite ID',
      'Unite Adi',
      'Hourly MKUD',
      'Min MKUD',
      'Unite Pgen Aktif',
      'Kalite',
      'Unite Qgen Reaktif',
      'Kalite',
      'D.I. MVAr Limit',
      'A.I. MVAr Limit'
    ];
    const bodyRows = rows.map((row) => [
      escapeHtml(row.ytm || '-'),
      escapeHtml(row.measurementDateLocal || row.measurementDateUtc || '-'),
      escapeHtml(row.busbarId ?? '-'),
      escapeHtml(row.busbarName || '-'),
      escapeHtml(row.unitId ?? '-'),
      escapeHtml(row.unitName || '-'),
      formatNumber(row.hourlyMkudMw),
      formatNumber(row.minMkudMw),
      formatNumber(row.pgenMw),
      escapeHtml(row.activePowerQuality || '-'),
      formatNumber(row.qgenMvar),
      escapeHtml(row.reactivePowerQuality || '-'),
      formatNumber(row.diMvarLimit),
      formatNumber(row.aiMvarLimit)
    ]);
    el.rawUnitTable.innerHTML = [
      `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>`,
      `<tbody>${bodyRows.map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`
    ].join('');
  }

  function filterConventionalUnitRowsForSelection(selection) {
    return (state.conventionalUnitRows || []).filter((row) => {
      const rowMinute = String(row.measurementDateLocal || row.measurementDateUtc || '').slice(0, 16);
      if (rowMinute !== selection.measurementMinute) return false;
      const sameInternal = selection.busbarInternalId !== null && selection.busbarInternalId !== undefined
        && row.busbarInternalId !== null && row.busbarInternalId !== undefined
        && String(row.busbarInternalId) === String(selection.busbarInternalId);
      const sameDisplay = selection.busbarId !== null && selection.busbarId !== undefined
        && row.busbarId !== null && row.busbarId !== undefined
        && String(row.busbarId) === String(selection.busbarId);
      return sameInternal || sameDisplay;
    });
  }

  function renderDailyTable(pivotRows) {
    const hourHeaders = Array.from({ length: 24 }, (_, hour) => `<th>${String(hour).padStart(2, '0')}</th>`).join('');
    el.dailyTable.innerHTML = `<thead><tr><th>Tarih</th><th>Bara</th><th>Tip</th><th>Kaynak Tipi</th>${hourHeaders}</tr></thead>`;
    const tbody = document.createElement('tbody');
    pivotRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="rgdh-date-drilldown"><button class="rgdh-table-link rgdh-daily-date-link" type="button">${escapeHtml(row.localDate || '-')}</button></td><td>${renderHybridNameHtml(row.busbarName || row.busbarId || '-', row, { showSk: true })}</td><td>${escapeHtml(row.sourceType)}</td><td>${renderDailySourceBadge(row)}</td>`;
      tr.querySelector('.rgdh-daily-date-link')?.addEventListener('click', () => selectDailyChart(row));
      row.hours.forEach((hour) => {
        const td = document.createElement('td');
        td.className = RGDH_PIVOT.participationClass(hour);
        const resultLabel = reactiveLabel(hour.hourResult || hour.status);
        td.innerHTML = `<button class="rgdh-daily-hour-link" type="button">${escapeHtml(formatDailyHourCellText(hour, state.dailyDisplayMode))}</button>${renderSkBadge(hour, { requireActive: true, showCount: true })}`;
        td.title = [
          `${String(hour.hour).padStart(2, '0')}:00`,
          `Sonuc ${resultLabel}`,
          `Katilim ${formatPercent(hour.participationPct)}`,
          `SK aktif ${hour.synchronousCondenserMinuteCount ?? 0} dk`,
          `SK basarili ${hour.synchronousCondenserSuccessMinuteCount ?? 0} dk`,
          `Set ${formatNumber(hour.setAvg)}`,
          `Droop ${formatNumber(hour.droopPctAvg)}`,
          `Gerilim ${formatNumber(hour.voltageAvg)}`,
          `P ${formatNumber(hour.pgenAvg)}`,
          `Q ${formatNumber(hour.qgenAvg)}`,
          `Gecti ${hour.passCount ?? hour.successMinuteCount}/${hour.expectedMinuteCount}`,
          `Kaldi ${hour.failCount ?? 0}`,
          `DD ${hour.ddCount ?? 0} | YY ${hour.yyCount ?? 0} | KY ${hour.kyCount ?? 0}`
        ].join(' | ');
        td.querySelector('.rgdh-daily-hour-link')?.addEventListener('click', () => selectDailyChart(row, hour.hour));
        td.addEventListener('click', (event) => {
          if (event.target.closest('button')) return;
          selectDailyChart(row, hour.hour);
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
    el.dailyMetricTable.innerHTML = `<thead><tr>${DAILY_METRIC_COLUMNS.map(renderDailyMetricSortHeader).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    const metricRows = sortDailyMetricRows(RGDH_CHARTS.buildHourMetricRows(pivotRows));
    metricRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = DAILY_METRIC_COLUMNS.map((column) => `<td>${renderDailyMetricTableCell(row, column)}</td>`).join('');
      tbody.appendChild(tr);
    });
    el.dailyMetricTable.appendChild(tbody);
  }

  function renderDailyMetricSortHeader(column) {
    const sort = state.dailyMetricSort || {};
    const active = sort.key === column.key;
    const direction = active && sort.direction === 'desc' ? 'desc' : 'asc';
    const ariaSort = active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none';
    const indicator = active ? (direction === 'desc' ? 'v' : '^') : '';
    return `<th aria-sort="${ariaSort}"><button type="button" class="rgdh-sort-button ${active ? 'active' : ''}" data-daily-metric-sort-key="${escapeHtml(column.key)}">${escapeHtml(column.label)}<span class="rgdh-sort-indicator" aria-hidden="true">${indicator}</span></button></th>`;
  }

  function renderDailyMetricTableCell(row, column) {
    if (typeof column.html === 'function') return column.html(row);
    const value = row?.[column.key];
    return escapeHtml(value === null || value === undefined || value === '' ? '-' : value);
  }

  function setDailyMetricSort(key) {
    if (!DAILY_METRIC_COLUMNS.some((column) => column.key === key)) return;
    const current = state.dailyMetricSort || { key: '', direction: 'asc' };
    state.dailyMetricSort = {
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    };
  }

  function sortDailyMetricRows(rows) {
    const sort = state.dailyMetricSort || {};
    const column = DAILY_METRIC_COLUMNS.find((candidate) => candidate.key === sort.key);
    if (!column) return rows || [];
    const direction = sort.direction === 'desc' ? -1 : 1;
    return [...(rows || [])].map((row, index) => ({ row, index })).sort((a, b) => {
      const primary = compareSortValues(dailyMetricSortValue(a.row, column), dailyMetricSortValue(b.row, column));
      if (primary) return primary * direction;
      const fallback = compareDailyMetricDefault(a.row, b.row);
      return fallback || a.index - b.index;
    }).map((item) => item.row);
  }

  function dailyMetricSortValue(row, column) {
    if (typeof column.sortValue === 'function') return column.sortValue(row);
    return row?.[column.key];
  }

  function compareDailyMetricDefault(a, b) {
    return compareSortValues(a?.localDate, b?.localDate)
      || compareSortValues(a?.hour, b?.hour)
      || compareSortValues(a?.busbarName, b?.busbarName)
      || compareSortValues(a?.controlSource, b?.controlSource);
  }

  function formatHourCellText(hour) {
    const result = normalizeReactiveResult(hour?.hourResult || hour?.status);
    if (result === 'DD' || result === 'YY' || result === 'KY') return result;
    return formatPercent(hour?.participationPct ?? hour?.passRatio);
  }

  function formatDailyHourCellText(hour, displayMode = state.dailyDisplayMode) {
    if (displayMode === 'result') return dailyHourResultCode(hour);
    return formatHourCellText(hour);
  }

  function dailyHourResultCode(hour) {
    const result = normalizeReactiveResult(hour?.hourResult || hour?.status);
    if (result === 'SAGLADI') return 'OK';
    if (result === 'SAGLAMADI') return 'X';
    if (result === 'DD' || result === 'YY' || result === 'KY') return result;
    return result || '-';
  }

  function renderCharts(rows, pivotRows) {
    if (state.activeTab !== 'charts') return;
    const filters = readFilters();
    const selectedBusbar = resolveSelectedBusbar(filters);
    const chartData = getChartCalculationRows(rows, pivotRows);
    const chartRows = chartData.rows;
    const chartPivotRows = chartData.pivotRows;
    const first = chartRows.find((row) => row.busbarId !== null && row.busbarId !== undefined);
    const busbarId = state.chartSelection.busbarId ?? first?.busbarId ?? selectedBusbar?.busbarId;
    const selection = {
      busbarId,
      hour: state.chartSelection.hour,
      date: resolveChartDate(chartRows, busbarId, state.chartSelection.date || filters.date),
      showVoltage: state.showVoltage,
      calculationMode: state.calculationMode,
      hasEkcCalculation: state.ekcRows.length > 0,
      onCalculationModeChange: (mode) => {
        state.calculationMode = mode === 'EKC' ? 'EKC' : 'YKS';
        state.chartSelection = { ...state.chartSelection, hour: null };
        renderCharts(getFilteredRows(), state.pivot.rows);
      },
      onHourSelect: ({ busbarId: selectedBusbarId, date, hour }) => {
        state.chartSelection = { busbarId: selectedBusbarId, hour, date: date || null };
        renderCharts(getFilteredRows(), state.pivot.rows);
      }
    };
    const labelRow = chartRows.find((row) => String(row.busbarId) === String(selection.busbarId)) || selectedBusbar;
    if (el.chartContextLabel) {
      const datePart = selection.date ? `${selection.date} - ` : '';
      const name = renderHybridNameHtml(labelRow?.busbarName || selection.busbarId || 'Bara', labelRow);
      const suffix = selection.hour === null || selection.hour === undefined
        ? `${datePart}tum gun`
        : `${datePart}${String(selection.hour).padStart(2, '0')}:00`;
      const modeLabel = state.calculationMode === 'EKC' ? 'Ek-C Hesaplama' : 'YKS Hesaplama';
      const emptyEkc = chartData.fallbackToYks ? ' - Ek-C hesaplama icin EK-C CSV yukleyin.' : '';
      el.chartContextLabel.innerHTML = `${escapeHtml(modeLabel)} - ${name} - ${escapeHtml(suffix)}${escapeHtml(emptyEkc)}`;
    }
    RGDH_CHARTS.renderReport(el.chartsRoot, chartRows, chartPivotRows, selection);
    applyVoltageVisibility();
  }

  function getChartCalculationRows(platformRows, platformPivotRows) {
    if (state.calculationMode !== 'EKC') {
      return { rows: platformRows || [], pivotRows: platformPivotRows || [], mode: 'YKS' };
    }
    const ekcRows = getFilteredEkcRows();
    if (!ekcRows.length) {
      return {
        rows: platformRows || [],
        pivotRows: platformPivotRows || [],
        mode: 'YKS',
        fallbackToYks: true
      };
    }
    return {
      rows: ekcRows,
      pivotRows: RGDH_PIVOT.buildDailyPivot(ekcRows).rows,
      mode: 'EKC'
    };
  }

  function resolveCompareScope(platformRows, ekcRows) {
    const selectedScope = {
      busbarId: String(state.compareSelection?.busbarId || ''),
      ytm: state.compareSelection?.ytm || '',
      date: state.compareSelection?.date || '',
      hourMode: state.compareSelection?.hourMode || 'all',
      hourStart: state.compareSelection?.hourStart ?? null,
      hourEnd: state.compareSelection?.hourEnd ?? null,
      hour: state.compareSelection?.hour ?? null
    };
    if (selectedScope.busbarId && selectedScope.date && hasRowsForCompareScope(ekcRows, selectedScope)) {
      return selectedScope;
    }

    const firstEkcRow = resolveFirstEkcDailyControlRow(ekcRows);
    if (firstEkcRow) {
      return {
        busbarId: String(firstEkcRow.busbarId || ''),
        ytm: firstEkcRow.ytm || '',
        date: firstEkcRow.localDate || '',
        hourMode: 'all',
        hourStart: null,
        hourEnd: null,
        hour: null
      };
    }

    return normalizeCompareSelection([...(platformRows || []), ...(ekcRows || [])], state.compareSelection);
  }

  function resolveFirstEkcDailyControlRow(ekcRows) {
    const rows = RGDH_PIVOT.buildDailyPivot(markDailyControlRows(ekcRows || [], 'EKC')).rows
      .sort(compareDailyControlRows);
    return rows.find((row) => row.localDate && row.busbarId) || rows.find((row) => row.localDate) || null;
  }

  function filterRowsForCompareScope(rows, scope) {
    const sourceRows = rows || [];
    if (!scope?.date && !scope?.busbarId) return sourceRows;
    return sourceRows.filter((row) => rowMatchesCompareScope(row, scope));
  }

  function hasRowsForCompareScope(rows, scope) {
    return (rows || []).some((row) => rowMatchesCompareScope(row, scope));
  }

  function rowMatchesCompareScope(row, scope) {
    if (!row || !scope) return false;
    if (scope.date && row.localDate !== scope.date) return false;
    if (scope.busbarId && String(row.busbarId || '') !== String(scope.busbarId)) return false;
    return true;
  }

  function renderCompareView(platformRows) {
    if (state.activeTab !== 'compare') return;
    const compareScope = resolveCompareScope(platformRows || getFilteredRows(), getFilteredEkcRows());
    const scopedPlatformRows = filterRowsForCompareScope(platformRows || getFilteredRows(), compareScope);
    const scopedEkcRows = filterRowsForCompareScope(getFilteredEkcRows(), compareScope);
    const comparison = buildEkcPlatformComparison(scopedPlatformRows, scopedEkcRows);
    state.comparison = comparison;
    state.compareSelection = normalizeCompareSelection(comparison.rows || [], {
      ...state.compareSelection,
      busbarId: compareScope.busbarId,
      ytm: compareScope.ytm || state.compareSelection.ytm || '',
      date: compareScope.date
    });
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
    state.compareHourRows = dayHourRows;
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
      { html: 'Tarih', cls: 'date', group: 'Kimlik / Sonuc', groupStart: true },
      { html: 'Saat', cls: 'hour', group: 'Kimlik / Sonuc' },
      { html: 'Eslesen<br>DK', cls: 'minutes', group: 'Kimlik / Sonuc' },
      { html: 'Ek-C<br>Deg.', cls: 'eval', group: 'Kimlik / Sonuc' },
      { html: 'YKS<br>Deg.', cls: 'eval', group: 'Kimlik / Sonuc', groupEnd: true },
      { html: 'Ek-C<br>K.Y (%)', cls: 'percent', group: 'Katilim', groupStart: true },
      { html: 'YKS<br>K.Y (%)', cls: 'percent', group: 'Katilim', groupEnd: true },
      { html: 'YKS Droop %', cls: 'metric', group: 'Droop', groupStart: true },
      { html: 'EK-C Droop %', cls: 'metric', group: 'Droop', groupEnd: true },
      { html: 'YKS<br>V Ort', cls: 'metric', group: 'Gerilim Karsilastirma', groupStart: true },
      { html: 'EK-C<br>V Ort', cls: 'metric', group: 'Gerilim Karsilastirma' },
      { html: 'Fark<br>dV', cls: 'metric', group: 'Gerilim Karsilastirma' },
      { html: 'Max<br>dV', cls: 'metric', group: 'Gerilim Karsilastirma', groupEnd: true },
      { html: 'YKS<br>P Ort', cls: 'metric', group: 'Aktif Guc Karsilastirma', groupStart: true },
      { html: 'EK-C<br>P Ort', cls: 'metric', group: 'Aktif Guc Karsilastirma' },
      { html: 'Fark<br>dP', cls: 'metric', group: 'Aktif Guc Karsilastirma' },
      { html: 'Max<br>dP', cls: 'metric', group: 'Aktif Guc Karsilastirma', groupEnd: true },
      { html: 'YKS<br>Q Ort', cls: 'metric', group: 'Reaktif Guc Karsilastirma', groupStart: true },
      { html: 'EK-C<br>Q Ort', cls: 'metric', group: 'Reaktif Guc Karsilastirma' },
      { html: 'Fark<br>dQ', cls: 'metric', group: 'Reaktif Guc Karsilastirma' },
      { html: 'Max<br>dQ', cls: 'metric', group: 'Reaktif Guc Karsilastirma', groupEnd: true },
      { html: 'YKS<br>Hibrit P', cls: 'metric', group: 'Hibrit P Karsilastirma', groupStart: true },
      { html: 'EK-C<br>Hibrit P', cls: 'metric', group: 'Hibrit P Karsilastirma' },
      { html: 'Fark<br>dHP', cls: 'metric', group: 'Hibrit P Karsilastirma' },
      { html: 'Max<br>dHP', cls: 'metric', group: 'Hibrit P Karsilastirma', groupEnd: true }
    ];
    el.compareTable.innerHTML = [
      `<colgroup>${compareHeaders.map((header) => `<col class="rgdh-compare-col-${escapeHtml(header.cls)}">`).join('')}</colgroup>`,
      buildCompareHeaderHtml(compareHeaders)
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
    const deltaBarMax = {
      avg: {
        dV: maxAbs(visibleRows.map((row) => row.avgDeltaV)),
        dP: maxAbs(visibleRows.map((row) => row.avgDeltaP)),
        dQ: maxAbs(visibleRows.map((row) => row.avgDeltaQ))
      },
      max: {
        dV: maxAbs(visibleRows.map((row) => row.maxDeltaV)),
        dP: maxAbs(visibleRows.map((row) => row.maxDeltaP)),
        dQ: maxAbs(visibleRows.map((row) => row.maxDeltaQ))
      }
    };
    visibleRows.forEach((row) => {
      const tr = document.createElement('tr');
      const hourLabel = `${String(row.hour).padStart(2, '0')}:00`;
      const avgDeltaVCell = formatCompareDeltaCell(row.avgDeltaV, 'dV', 'avg');
      const maxDeltaVCell = formatCompareDeltaCell(row.maxDeltaV, 'dV', 'max');
      const avgDeltaPCell = formatCompareDeltaCell(row.avgDeltaP, 'dP', 'avg');
      const maxDeltaPCell = formatCompareDeltaCell(row.maxDeltaP, 'dP', 'max');
      const avgDeltaQCell = formatCompareDeltaCell(row.avgDeltaQ, 'dQ', 'avg');
      const maxDeltaQCell = formatCompareDeltaCell(row.maxDeltaQ, 'dQ', 'max');
      tr.innerHTML = [
        escapeHtml(row.localDate || '-'),
        `<button class="rgdh-table-link" type="button" data-compare-date="${escapeHtml(row.localDate || '')}" data-compare-hour="${escapeHtml(row.hour)}">${escapeHtml(hourLabel)}</button>`,
        formatNumber(row.commonMinutes),
        formatComparisonEvaluation(row.ekcStat),
        formatComparisonEvaluation(row.platformStat),
        formatCompareParticipationCell(row.ekcStat),
        formatCompareParticipationCell(row.platformStat),
        formatFixedNumber(row.avgYksDroopPct),
        formatFixedNumber(row.avgEkcDroopPct),
        formatFixedNumber(row.avgYksV),
        formatFixedNumber(row.avgEkcV),
        formatCompareDeltaBarCell(avgDeltaVCell, row.avgDeltaV, deltaBarMax.avg.dV),
        formatCompareDeltaBarCell(maxDeltaVCell, row.maxDeltaV, deltaBarMax.max.dV),
        formatCompareDataBarCell(row.avgYksP, pDataBarMax),
        formatCompareDataBarCell(row.avgEkcP, pDataBarMax),
        formatCompareDeltaBarCell(avgDeltaPCell, row.avgDeltaP, deltaBarMax.avg.dP),
        formatCompareDeltaBarCell(maxDeltaPCell, row.maxDeltaP, deltaBarMax.max.dP),
        formatFixedNumber(row.avgYksQ),
        formatFixedNumber(row.avgEkcQ),
        formatCompareDeltaBarCell(avgDeltaQCell, row.avgDeltaQ, deltaBarMax.avg.dQ),
        formatCompareDeltaBarCell(maxDeltaQCell, row.maxDeltaQ, deltaBarMax.max.dQ),
        formatCompareDataBarCell(row.avgYksHybridP, pDataBarMax),
        formatCompareDataBarCell(row.avgEkcHybridP, pDataBarMax),
        formatFixedNumber(row.avgDeltaHybridP),
        formatFixedNumber(row.maxDeltaHybridP)
      ].map((cell, index) => compareCellHtml(cell, compareHeaders[index])).join('');
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
    renderCompareTableActions(visibleRows);
  }

  function renderCompareTableActions(rows) {
    const wrap = el.compareTable?.closest('.rgdh-table-wrap');
    if (!wrap) return;
    let actions = wrap.querySelector('.rgdh-compare-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'rgdh-compare-actions';
      const button = document.createElement('button');
      button.id = 'btnExportCompareCsv';
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = 'CSV Indir';
      actions.appendChild(button);
      wrap.appendChild(actions);
    }
    const button = actions.querySelector('#btnExportCompareCsv');
    if (!button) return;
    const exportRows = rows?.length ? rows : (state.compareHourRows || []);
    button.disabled = !exportRows.length;
    button.onclick = () => exportCompareCsv(exportRows);
  }

  function exportCompareCsv(rows = state.compareHourRows || []) {
    if (!RGDH_CSV.buildCompareExportCsv) {
      setStatus('Karsilastirma CSV cikti yardimcisi bulunamadi.');
      return;
    }
    const text = RGDH_CSV.buildCompareExportCsv(rows || []);
    const datePart = (rows || []).find((row) => row?.localDate)?.localDate || readFilters().date || 'karsilastirma';
    downloadCsv(`EKC_YKS_KARSILASTIRMA_${datePart}.csv`, text);
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

    el.testsTable.innerHTML = `<thead><tr>${TEST_TABLE_COLUMNS.map(renderTestSortHeader).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    summaries.slice(0, 2000).forEach((catalogRow) => {
      const tr = document.createElement('tr');
      const rowKey = catalogBusbarKey(catalogRow);
      tr.className = rowKey === state.selectedTestBusbarKey ? 'selected' : '';
      tr.addEventListener('click', () => {
        state.selectedTestBusbarKey = rowKey;
        renderTestsTable();
      });
      tr.innerHTML = TEST_TABLE_COLUMNS
        .map((column) => `<td>${renderTestTableCell(catalogRow, column)}</td>`)
        .join('');
      tbody.appendChild(tr);
    });
    if (!summaries.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${TEST_TABLE_COLUMNS.length}">Katalog yukleniyor veya test filtrelerini genisletin.</td>`;
      tbody.appendChild(tr);
    }
    el.testsTable.appendChild(tbody);
    renderTestUnitDetails(selectedSummary);
    renderTestOtherDetails(selectedSummary);
  }

  function renderTestSortHeader(column) {
    const sort = state.testTableSort || {};
    const active = sort.key === column.key;
    const direction = active && sort.direction === 'desc' ? 'desc' : 'asc';
    const ariaSort = active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none';
    const indicator = active ? (direction === 'desc' ? '▼' : '▲') : '';
    return `<th aria-sort="${ariaSort}"><button type="button" class="rgdh-sort-button ${active ? 'active' : ''}" data-test-sort-key="${escapeHtml(column.key)}">${escapeHtml(column.label)}<span class="rgdh-sort-indicator" aria-hidden="true">${indicator}</span></button></th>`;
  }

  function renderTestTableCell(row, column) {
    if (typeof column.html === 'function') return column.html(row);
    const value = row?.[column.key];
    return escapeHtml(value === null || value === undefined || value === '' ? '-' : value);
  }

  function setTestTableSort(key) {
    if (!TEST_TABLE_COLUMNS.some((column) => column.key === key)) return;
    const current = state.testTableSort || { key: '', direction: 'asc' };
    state.testTableSort = {
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    };
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

  function renderTestOtherDetails(summary) {
    if (!el.testOtherDetailsTable) return;
    const headers = [
      'Ünite Adı', 'YTBS Santral Adı', 'YTBS TM ID', 'YTBS TM Adı', 'Enlem', 'Boylam',
      'KAYNAK TÜRÜ', 'İkincil Kaynakları', 'İli', 'YTBS Bara Tipi',
      'Senkron Kompansatör', 'EÜAŞ Protokol', 'Platform RGK Tipi', 'RGK TİPİ Açıklama',
      'Dengeleme Birimi', 'TPYS Ünite MKÜD', 'TPYS Santral MKÜD'
    ];
    el.testOtherDetailsTable.innerHTML = `<thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    const units = summary?.units || [];
    units.forEach((unit) => {
      const tr = document.createElement('tr');
      tr.innerHTML = [
        escapeHtml(unit.unitName || '-'),
        escapeHtml(unit.ytbsPlantName || summary?.ytbsPlantName || '-'),
        escapeHtml(unit.ytbsSubstationId ?? summary?.ytbsSubstationId ?? '-'),
        escapeHtml(unit.ytbsSubstationName || summary?.ytbsSubstationName || '-'),
        formatNumber(unit.latitude ?? summary?.latitude),
        formatNumber(unit.longitude ?? summary?.longitude),
        escapeHtml(unit.ytbsSourceType || summary?.ytbsSourceType || '-'),
        escapeHtml(unit.secondarySources || summary?.secondarySources || '-'),
        escapeHtml(unit.city || summary?.city || '-'),
        escapeHtml(unit.ytbsBusbarType || summary?.ytbsBusbarType || '-'),
        escapeHtml(formatBooleanDetail(unit.hasSynchronousCondenser ?? summary?.hasSynchronousCondenser)),
        escapeHtml(formatBooleanDetail(unit.hasEuasProtocol ?? summary?.hasEuasProtocol)),
        escapeHtml(unit.platformRgkType || summary?.platformRgkType || '-'),
        escapeHtml(unit.rgkTypeDescription || summary?.rgkTypeDescription || '-'),
        escapeHtml(formatBooleanDetail(unit.isBalancingUnit ?? summary?.isBalancingUnit)),
        formatNumber(unit.tpysUnitMkud),
        formatNumber(unit.tpysPlantMkud ?? summary?.tpysPlantMkud)
      ].map((value) => `<td>${value}</td>`).join('');
      tbody.appendChild(tr);
    });
    if (!units.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${headers.length}">Secili bara icin diger detay yok.</td>`;
      tbody.appendChild(tr);
    }
    el.testOtherDetailsTable.appendChild(tbody);
  }

  function formatBooleanDetail(value) {
    if (value === true) return 'Evet';
    if (value === false) return 'Hayır';
    return '-';
  }

  function getFilteredTestSummaries(filters = readTestFilters()) {
    const search = normalizeText(filters.search);
    const rows = RGDH_NORMALIZER.buildCatalogBusbarSummaries(state.catalogRows).filter((row) => {
      if (search) {
        const text = normalizeText(`${row.plantName || ''} ${row.busbarName || ''} ${row.busbarId || ''}`);
        if (!text.includes(search)) return false;
      }
      if (filters.busbarType && normalizeText(row.busbarType) !== normalizeText(filters.busbarType)) return false;
      if (filters.busbar && catalogBusbarKey(row) !== filters.busbar) return false;
      if (filters.hybridOnly && !row.hasAuxiliarySource) return false;
      return true;
    });
    return sortCatalogSummaries(rows);
  }

  function sortCatalogSummaries(rows) {
    const sort = state.testTableSort || {};
    const key = TEST_TABLE_COLUMNS.some((column) => column.key === sort.key) ? sort.key : '';
    const direction = sort.direction === 'desc' ? -1 : 1;
    return [...(rows || [])].sort((a, b) => {
      if (!key) return compareCatalogDefault(a, b);
      const primary = compareSortValues(a?.[key], b?.[key]);
      return primary ? primary * direction : compareCatalogDefault(a, b);
    });
  }

  function compareCatalogDefault(a, b) {
    const byBusbarName = String(a?.busbarName || '').localeCompare(String(b?.busbarName || ''), 'tr', { sensitivity: 'base', numeric: true });
    if (byBusbarName) return byBusbarName;
    const byBusbarType = String(a?.busbarType || '').localeCompare(String(b?.busbarType || ''), 'tr', { sensitivity: 'base', numeric: true });
    if (byBusbarType) return byBusbarType;
    return compareSortValues(a?.busbarId, b?.busbarId);
  }

  function compareSortValues(a, b) {
    const aNumber = Number(a);
    const bNumber = Number(b);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
    return String(a ?? '').localeCompare(String(b ?? ''), 'tr', { sensitivity: 'base', numeric: true });
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
    if (!select) return;
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
    if (state.ekcRows.length) state.ekcRows = buildEkcCalculationRows(state.ekcRows);
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

  function resolveCatalogBusbarForRow(row) {
    const busbarId = String(row?.busbarId || '').trim();
    const busbarName = normalizeText(row?.busbarName || '');
    return getCatalogBusbarSummaries().find((summary) => {
      if (busbarId && String(summary.busbarId || '').trim() === busbarId) return true;
      return busbarName && normalizeText(summary.busbarName || '') === busbarName;
    }) || null;
  }

  function resolveSelectedBusbar(filters) {
    const selected = getCatalogBusbarSummaries().find((row) => catalogBusbarKey(row) === filters.search);
    if (!selected) return null;
    const hasAuxiliarySource = hasAuxiliarySourceMarker(selected);
    const hasSynchronousCondenser = hasSynchronousCondenserMarker(selected);
    return {
      busbarId: String(selected.busbarId || '').trim(),
      busbarName: selected.busbarName || '',
      sourceType: inferCatalogSourceType(selected),
      ytm: selected.ytm || '',
      plantName: selected.plantName || '',
      hasAuxiliarySource,
      hasSynchronousCondenser
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
      'preferCsvFallback', 'csvFallbackRows', 'responseContentType', 'probedWindows',
      'fileCount', 'acceptedFiles', 'duplicateFiles', 'matchedFiles', 'fallbackFiles', 'unmatchedFiles', 'ambiguousFiles', 'parseErrorFiles', 'bindingStatus'
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
    downloadCsv(response?.filename || `RGDH_EKLENTI_LOGLARI_${readFilters().date}.csv`, merged || '\uFEFFZaman;Seviye;Kategori;Route;Metot;URL;HTTP;Süre(ms);Mesaj\n');
  }

  async function exportYksLogCsv() {
    const response = RGDH_DOM_BRIDGE.exportYksLogCsv
      ? await RGDH_DOM_BRIDGE.exportYksLogCsv()
      : null;
    const localCsv = RGDH_DIAGNOSTICS?.diagnosticEventsToCsv
      ? RGDH_DIAGNOSTICS.diagnosticEventsToCsv(state.yksLogs)
      : '';
    downloadCsv(response?.filename || `RGDH_YKS_LOGLARI_${readFilters().date}.csv`, response?.ok ? response.csv : localCsv);
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
    downloadCsv(`RGDH_HAM_DATA_${readFilters().date}.csv`, text);
  }

  function exportDailyCsv() {
    const rows = getFilteredRows();
    const ekcRows = getFilteredEkcRows();
    const dailyPivotRows = buildDailyControlPivotRows(rows, ekcRows);
    const filteredDailyPivotRows = filterDailyPivotRows(dailyPivotRows, state.dailyFilters);
    const text = RGDH_CSV.buildDailyPivotExportCsv(filteredDailyPivotRows, { displayMode: state.dailyDisplayMode });
    downloadCsv(dailyCsvFilename(), text);
  }

  function dailyCsvFilename() {
    const filters = readFilters();
    const date = state.dailyFilters?.date || (!filters.endDate ? filters.date : '');
    return date ? `RGDH_GUNLUK_${date}.csv` : 'RGDH_GUNLUK.csv';
  }

  function exportTestsCsv() {
    const text = RGDH_CSV.buildCatalogExportCsv(state.catalogRows);
    downloadCsv('rgdh_unite_tanimi_v2.csv', text);
  }

  function downloadCsv(filename, text) {
    const prepared = RGDH_CSV.prepareCsvDownloadText
      ? RGDH_CSV.prepareCsvDownloadText(text)
      : { text: String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').join('\r\n'), usedAsciiFallback: false };
    const bytes = RGDH_CSV.encodeCsvForExcel
      ? RGDH_CSV.encodeCsvForExcel(prepared.text)
      : prepared.text;
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-16le' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (prepared.usedAsciiFallback) {
      setStatus('CSV dosyasında karakter bozulması algılandı; ASCII yedek çıktı indirildi.');
    }
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
    if (value === false || value === null || value === undefined || value === '') return false;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric !== 0;
    const text = String(value ?? '').trim().toLowerCase();
    return ['true', '1', 'yes', 'evet', 'on', 'aktif', 'var'].includes(text);
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
