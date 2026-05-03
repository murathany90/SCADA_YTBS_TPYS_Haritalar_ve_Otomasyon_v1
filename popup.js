const DEFAULT_SETTINGS = {
  statusLabels: {
    DD: 'Devre Dışı',
    OK: 'Sağladı',
    YY: 'Yükümlülüğü Yok',
    X: 'Sağlamadı',
    KY: 'Kontrol Yapılamadı'
  },
  checkApproval: false,
  strictDateCheck: false,
  fastExtMode: true,
  onlyChangedCells: true
};

const CSV_CACHE_SOFT_LIMIT_BYTES = 3 * 1024 * 1024;
const TPYS_EXTJS_MAIN_APPLY_FILE = 'tpys-extjs-main-apply.js';
const TPYS_EXTJS_MAIN_EXPECTED = { modeUsed: 'ext-main-batch' };

const state = {
  mappingRows: [],
  mappingIndex: null,
  monthlyFileName: '',
  monthlyHeaders: [],
  monthlyRows: [],
  csvCacheMode: 'none',
  tpysCsvLastRunId: '',
  settings: structuredClone(DEFAULT_SETTINGS)
};

const el = {
  btnPickCsv: document.getElementById('btnPickCsv'),
  fileInput: document.getElementById('fileInput'),
  fileName: document.getElementById('fileName'),
  mappingCount: document.getElementById('mappingCount'),
  csvRowCount: document.getElementById('csvRowCount'),
  csvDateCount: document.getElementById('csvDateCount'),
  btnAnalyze: document.getElementById('btnAnalyze'),
  btnApply: document.getElementById('btnApply'),
  btnOpenMap: document.getElementById('btnOpenMap'),
  btnOpenRgdhMonitor: document.getElementById('btnOpenRgdhMonitor'),
  btnToggleSimplify: document.getElementById('btnToggleSimplify'),
  pageDate: document.getElementById('pageDate'),
  pageBaraCount: document.getElementById('pageBaraCount'),
  matchedCount: document.getElementById('matchedCount'),
  matchedBaraName: document.getElementById('matchedBaraName'),
  matchedDateCount: document.getElementById('matchedDateCount'),
  matchedHourCount: document.getElementById('matchedHourCount'),
  sameHourCount: document.getElementById('sameHourCount'),
  differentHourCount: document.getElementById('differentHourCount'),
  changedHourCount: document.getElementById('changedHourCount'),
  btnAnalyzeDownloadPage: document.getElementById('btnAnalyzeDownloadPage'),
  btnDownloadAllCsvs: document.getElementById('btnDownloadAllCsvs'),
  btnDownloadCsvReport: document.getElementById('btnDownloadCsvReport'),
  downloadStartDate: document.getElementById('downloadStartDate'),
  downloadEndDate: document.getElementById('downloadEndDate'),
  downloadAsciiNormalize: document.getElementById('downloadAsciiNormalize'),
  downloadSkipDuplicateContent: document.getElementById('downloadSkipDuplicateContent'),
  downloadPageDate: document.getElementById('downloadPageDate'),
  downloadBaraCount: document.getElementById('downloadBaraCount'),
  downloadPageStatus: document.getElementById('downloadPageStatus'),
  log: document.getElementById('log'),
  labelDD: document.getElementById('labelDD'),
  labelOK: document.getElementById('labelOK'),
  labelYY: document.getElementById('labelYY'),
  labelX: document.getElementById('labelX'),
  labelKY: document.getElementById('labelKY'),
  strictDateCheck: document.getElementById('strictDateCheck'),
  fastExtMode: document.getElementById('fastExtMode'),
  onlyChangedCells: document.getElementById('onlyChangedCells'),
  btnSaveSettings: document.getElementById('btnSaveSettings')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await loadSettings();
    await loadMapping();
    await loadLastCsv();
    bindEvents();
    initializeDownloadDateDefaults();
    log('Hazır. İsterseniz aylık özet CSV seçin, isterseniz doğrudan CSV indirme sayfasını analiz edin.');
  } catch (error) {
    log(`Başlatma hatası: ${error.message}`);
    console.error(error);
  }
}

function bindEvents() {
  el.btnPickCsv.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', handleFilePick);
  el.btnAnalyze.addEventListener('click', analyzeCurrentTab);
  el.btnApply.addEventListener('click', applyToCurrentTab);
  el.btnOpenMap.addEventListener('click', openMapPage);
  if (el.btnOpenRgdhMonitor) {
    el.btnOpenRgdhMonitor.addEventListener('click', openRgdhMonitorPage);
  } else {
    console.warn('[RGDH] Popup RGDH Izleme butonu bulunamadi.');
  }
  el.btnToggleSimplify.addEventListener('click', toggleApprovalSimplifyOnCurrentTab);
  el.btnAnalyzeDownloadPage.addEventListener('click', analyzeDownloadPage);
  el.btnDownloadAllCsvs.addEventListener('click', downloadAllCsvs);
  el.btnDownloadCsvReport.addEventListener('click', downloadTpysCsvReport);
  el.btnSaveSettings.addEventListener('click', saveSettings);
  bindTpysCsvProgressListener();
}

function initializeDownloadDateDefaults() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (el.downloadStartDate && !el.downloadStartDate.value) el.downloadStartDate.value = iso;
  if (el.downloadEndDate && !el.downloadEndDate.value) el.downloadEndDate.value = iso;
  if (el.downloadPageDate) el.downloadPageDate.textContent = iso;
}

function bindTpysCsvProgressListener() {
  if (!chrome.runtime?.onMessage?.addListener) return;
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== 'TPYS_CSV_PROGRESS') return;
    handleTpysCsvProgress(message.payload || {});
  });
}

async function loadSettings() {
  const stored = await chrome.storage.local.get('tpysReactiveSettings');
  if (stored.tpysReactiveSettings) {
    state.settings = {
      ...structuredClone(DEFAULT_SETTINGS),
      ...stored.tpysReactiveSettings,
      statusLabels: {
        ...structuredClone(DEFAULT_SETTINGS.statusLabels),
        ...(stored.tpysReactiveSettings.statusLabels || {})
      },
      checkApproval: false
    };
  }
  syncSettingsToForm();
}

async function saveSettings() {
  state.settings = {
    statusLabels: {
      DD: el.labelDD.value.trim() || DEFAULT_SETTINGS.statusLabels.DD,
      OK: el.labelOK.value.trim() || DEFAULT_SETTINGS.statusLabels.OK,
      YY: el.labelYY.value.trim() || DEFAULT_SETTINGS.statusLabels.YY,
      X: el.labelX.value.trim() || DEFAULT_SETTINGS.statusLabels.X,
      KY: el.labelKY.value.trim() || DEFAULT_SETTINGS.statusLabels.KY
    },
    checkApproval: false,
    strictDateCheck: el.strictDateCheck.checked,
    fastExtMode: el.fastExtMode.checked,
    onlyChangedCells: el.onlyChangedCells.checked
  };
  await chrome.storage.local.set({ tpysReactiveSettings: state.settings });
  log('Ayarlar kaydedildi.');
}

function syncSettingsToForm() {
  el.labelDD.value = state.settings.statusLabels.DD;
  el.labelOK.value = state.settings.statusLabels.OK;
  el.labelYY.value = state.settings.statusLabels.YY;
  el.labelX.value = state.settings.statusLabels.X;
  el.labelKY.value = state.settings.statusLabels.KY;
  el.strictDateCheck.checked = state.settings.strictDateCheck;
  el.fastExtMode.checked = state.settings.fastExtMode;
  el.onlyChangedCells.checked = state.settings.onlyChangedCells;
}

async function loadMapping() {
  const response = await fetch(chrome.runtime.getURL('data/mapping.json'));
  state.mappingRows = await response.json();
  state.mappingIndex = buildMappingIndex(state.mappingRows);
  el.mappingCount.textContent = String(state.mappingRows.length);
  log(`Statik kayıt tablosu yüklendi: ${state.mappingRows.length} benzersiz bara.`);
}

async function loadLastCsv() {
  const stored = await chrome.storage.local.get('tpysReactiveLastCsv');
  const last = stored.tpysReactiveLastCsv;
  if (!last) return;
  state.monthlyFileName = last.fileName || 'Son yüklenen CSV';
  state.monthlyHeaders = last.headers || [];
  state.monthlyRows = Array.isArray(last.rows) ? last.rows : [];
  state.csvCacheMode = last.cacheMode || (state.monthlyRows.length ? 'full' : 'metadata');
  el.fileName.textContent = state.monthlyFileName;
  el.csvRowCount.textContent = String(last.rowCount || state.monthlyRows.length || 0);
  el.csvDateCount.textContent = String(last.dateCount || countUniqueDates(state.monthlyRows));
  if (state.csvCacheMode !== 'full') {
    log('Son CSV yalnizca metadata olarak saklandi. Bu oturumda yeniden secmeden uygulanamaz.');
  }
}

async function handleFilePick(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await readCsvFileText(file);
  const parsed = parseSemicolonCsv(text);
  state.monthlyFileName = file.name;
  state.monthlyHeaders = parsed.headers;
  state.monthlyRows = parsed.rows;
  state.csvCacheMode = 'full';

  el.fileName.textContent = file.name;
  el.csvRowCount.textContent = String(state.monthlyRows.length);
  el.csvDateCount.textContent = String(countUniqueDates(state.monthlyRows));

  const persistence = await persistLastCsvSnapshot(file.name, parsed);
  state.csvCacheMode = persistence.cacheMode;
  if (persistence.warning) log(persistence.warning);

  log(`CSV yüklendi: ${file.name}`);
  log(`Başlıklar: ${parsed.headers.join(', ')}`);
  log(`Satır sayısı: ${state.monthlyRows.length}`);
}

async function analyzeCurrentTab() {
  try {
    assertCsvLoaded();
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const context = await sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });
    if (!context?.ok) throw new Error(context?.error || context?.reason || 'Sayfa bilgisi alınamadı.');
    updatePageContext(context);

    const plan = buildPlanForPage(context.pageDate, state.monthlyRows, state.mappingIndex, context.pageRows);
    if (plan.warning) {
      log(`Uyari: ${plan.warning}`);
      if (plan.availableDates.length) log(`CSV tarihleri: ${plan.availableDates.join(', ')}`);
    }
    if (plan.blockingErrors?.length) {
      log(`Validasyon hatasi: ${plan.blockingErrors.slice(0, 5).join(' | ')}`);
    }
    const comparison = comparePlanWithPage(plan, context.pageRows);
    el.matchedCount.textContent = String(comparison.matchedRows.length);
    updateMatchSummary(plan, comparison);
    updateStatusComparisonSummary(plan, comparison);
    printComparison(plan, comparison, false);
  } catch (error) {
    log(`Analiz hatası: ${error.message}`);
    console.error(error);
  }
}

async function applyToCurrentTab() {
  try {
    assertCsvLoaded();
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const context = await sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });
    if (!context?.ok) throw new Error(context?.error || context?.reason || 'Sayfa bilgisi alınamadı.');
    updatePageContext(context);

    const plan = buildPlanForPage(context.pageDate, state.monthlyRows, state.mappingIndex, context.pageRows);
    if (plan.blockingErrors?.length) {
      throw new Error(`CSV sonuc modu validasyon hatasi: ${plan.blockingErrors.slice(0, 3).join(' | ')}`);
    }

    const comparison = comparePlanWithPage(plan, context.pageRows);
    el.matchedCount.textContent = String(comparison.matchedRows.length);
    updateMatchSummary(plan, comparison);
    updateStatusComparisonSummary(plan, comparison);
    printComparison(plan, comparison, true);
    if (!plan.operations.length) {
      logNoOperationsForPage(plan);
      return;
    }

    if (plan.warning) {
      if (state.settings.strictDateCheck) {
        throw new Error(plan.warning);
      }
      const confirmed = await confirmPlanContinuation(plan, context.pageDate);
      if (!confirmed) {
        log('Uygulama iptal edildi. Tarih uyarisina onay verilmedi.');
        return;
      }
    }

    if (plan.mode !== 'periodic-daily' && state.settings.strictDateCheck && context.pageDate && plan.targetDate && normalizeDate(context.pageDate) !== normalizeDate(plan.targetDate)) {
      throw new Error(`Sayfa tarihi (${context.pageDate}) ile plan tarihi (${plan.targetDate}) uyuşmuyor.`);
    }

    let result = await applyPlanViaMainWorld(tab.id, plan, context);
    if (!result?.ok && shouldUseDomFallback(result)) {
      result = await applyPlanViaDomFallback(tab.id, plan);
    }
    logMainWorldMappingDiagnostics(result);
    if (!result?.ok) throw new Error(result?.error || result?.reason || 'Uygulama başarısız.');
    updateStatusComparisonSummary(plan, comparison, result.summary);

    log(`Uygulama modu: ${result.modeUsed || 'bilinmiyor'}`);
    log(`Özet: ${JSON.stringify(result.summary, null, 2)}`);
    if (result.errors?.length) {
      log('İlk hatalar:');
      result.errors.slice(0, 25).forEach((item) => log(`- ${item}`));
    }
  } catch (error) {
    log(`Uygulama hatası: ${error.message}`);
    console.error(error);
  }
}

async function applyPlanViaMainWorld(tabId, plan, context) {
  if (!state.settings.fastExtMode) return null;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [TPYS_EXTJS_MAIN_APPLY_FILE],
      world: 'MAIN'
    });

    const [response] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (payload) => {
        try {
          const api = window.TPYS_EXTJS_MAIN_APPLY;
          if (!api?.applyPlan) return { ok: false, reason: 'TPYS ExtJS MAIN helper yuklenemedi.' };
          return api.applyPlan(payload);
        } catch (error) {
          return { ok: false, reason: error?.message || String(error) };
        }
      },
      args: [{
        operations: plan.operations,
        settings: { ...state.settings, checkApproval: false },
        pageRows: context.pageRows || [],
        expected: TPYS_EXTJS_MAIN_EXPECTED
      }]
    });

    const result = response?.result;
    if (result?.ok && result.modeUsed === TPYS_EXTJS_MAIN_EXPECTED.modeUsed) return result;
    if (result?.reason || result?.error) {
      log(`MAIN-world ExtJS hızlı mod kullanılamadı: ${result.reason || result.error}`);
    }
    return result || null;
  } catch (error) {
    log(`MAIN-world ExtJS hızlı mod başlatılamadı: ${error.message}`);
    return null;
  }
}

function shouldUseDomFallback(result) {
  if (result === null || result === undefined) return true;
  if (result.mappingDiagnostics || result.candidateDiagnostics) return false;
  if (Array.isArray(result.unresolvedLabels) && result.unresolvedLabels.length) return false;
  const reason = String(result.reason || result.error || '');
  if (/deger cozulemedi/i.test(reason)) return false;
  return true;
}

function logMainWorldMappingDiagnostics(result) {
  if (!result || (result.modeUsed !== TPYS_EXTJS_MAIN_EXPECTED.modeUsed && !result.mappingDiagnostics && !result.candidateDiagnostics)) return;

  if (result.resolvedStatusMap && Object.keys(result.resolvedStatusMap).length) {
    const parts = [];
    for (const [hour, labels] of Object.entries(result.resolvedStatusMap)) {
      for (const [label, detail] of Object.entries(labels || {})) {
        parts.push(`${hour}:${label}=${detail.value} (${detail.source})`);
      }
    }
    if (parts.length) log(`Durum mapping: ${parts.slice(0, 12).join(', ')}${parts.length > 12 ? ' ...' : ''}`);
  }

  if (Array.isArray(result.unresolvedLabels) && result.unresolvedLabels.length) {
    log(`Çözülemeyen durum etiketleri: ${result.unresolvedLabels.join(', ')}`);
  }

  const sourceCounts = result.mappingDiagnostics?.sourceCounts || result.candidateDiagnostics?.sourceCounts;
  if (sourceCounts && Object.keys(sourceCounts).length) {
    log(`Mapping kaynakları: ${Object.entries(sourceCounts).map(([source, count]) => `${source}=${count}`).join(', ')}`);
  }
}

async function applyPlanViaDomFallback(tabId, plan) {
  return sendMessage(tabId, {
      type: 'APPLY_PLAN',
      payload: { operations: plan.operations, settings: { ...state.settings, checkApproval: false, fastExtMode: false } }
    });
}

async function analyzeDownloadPage() {
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, { type: 'GET_DOWNLOAD_CONTEXT' });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'CSV indirme ekranı bulunamadı.');
    const pageIsoDate = normalizePopupDateToIso(result.pageDate);
    if (pageIsoDate) {
      el.downloadStartDate.value = pageIsoDate;
      el.downloadEndDate.value = pageIsoDate;
    }
    el.downloadPageDate.textContent = buildDownloadRangeLabel();
    el.downloadBaraCount.textContent = String(result.baraCount || 0);
    el.downloadPageStatus.textContent = 'Hazır';
    log(`CSV indirme sayfası bulundu. Tarih: ${result.pageDate || '-'} | Bara: ${result.baraCount || 0}`);
  } catch (error) {
    el.downloadPageStatus.textContent = 'Bulunamadı';
    log(`CSV sayfa analiz hatası: ${error.message}`);
  }
}

async function downloadAllCsvs() {
  try {
    const dateRange = readDownloadDateRange();
    const runId = `tpys-csv-${Date.now()}`;
    state.tpysCsvLastRunId = runId;
    el.btnDownloadCsvReport.disabled = true;
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, {
      type: 'DOWNLOAD_ALL_CSVS',
      payload: {
        runId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        delayMs: 1800,
        asciiNormalize: el.downloadAsciiNormalize.checked,
        skipDuplicateContent: el.downloadSkipDuplicateContent.checked
      }
    });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'Toplu CSV indirme başlatılamadı.');
    state.tpysCsvLastRunId = result.runId || runId;
    el.downloadPageDate.textContent = `${dateRange.startDate} - ${dateRange.endDate}`;
    el.downloadBaraCount.textContent = String(result.total || 0);
    el.downloadPageStatus.textContent = 'Çalıştı';
    el.btnDownloadCsvReport.disabled = false;
    log(`Toplu CSV indirme tamamlandı. Sayfa sırası: ${result.total || 0}, Başarılı: ${result.successCount || 0}, Hata: ${result.failureCount || 0}, Duplicate: ${result.duplicateCount || 0}`);
    if (result.errors?.length) {
      result.errors.slice(0, 20).forEach((item) => log(`- ${item}`));
    }
  } catch (error) {
    log(`Toplu indirme hatası: ${error.message}`);
    console.error(error);
  }
}

async function downloadTpysCsvReport() {
  try {
    const response = await sendRuntimeMessage({
      type: 'TPYS_CSV_REPORT_DOWNLOAD',
      payload: { runId: state.tpysCsvLastRunId }
    });
    if (!response?.ok) throw new Error(response?.reason || response?.error || 'Rapor indirilemedi.');
    log(`TPYS CSV raporu indirildi: ${response.filename || response.finalFilename || '-'}`);
  } catch (error) {
    log(`Rapor indirme hatası: ${error.message}`);
  }
}

function handleTpysCsvProgress(payload) {
  if (!payload?.runId || (state.tpysCsvLastRunId && payload.runId !== state.tpysCsvLastRunId)) return;
  state.tpysCsvLastRunId = payload.runId;
  el.downloadPageStatus.textContent = `${payload.successCount || 0} başarılı / ${payload.failureCount || 0} hata`;
  if (payload.totalItems) el.downloadBaraCount.textContent = String(payload.totalItems);
  if (payload.localDate) el.downloadPageDate.textContent = payload.localDate;
  if (payload.lastResult?.targets?.length) {
    const targetSummary = payload.lastResult.targets.map((target) => `${target.targetKind || target.kind}: ${target.status}`).join(', ');
    log(`TPYS CSV: ${payload.localDate || '-'} | ${payload.baraName || '-'} | ${targetSummary}`);
    el.btnDownloadCsvReport.disabled = false;
  }
}

async function openMapPage() {
  await chrome.tabs.create({ url: chrome.runtime.getURL('map-modern.html') });
}

async function openRgdhMonitorPage() {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL('rgdh-monitor.html') });
  } catch (error) {
    log(`RGDH Izleme acilamadi: ${error.message}`);
  }
}


async function toggleApprovalSimplifyOnCurrentTab() {
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, { type: 'TOGGLE_APPROVAL_SIMPLIFY' });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'TPYS sayfa sadeleştirme çalıştırılamadı.');
    log(`TPYS sayfa sadeleştir: ${result.hidden ? 'aktif' : 'kapalı'}`);
  } catch (error) {
    log(`TPYS sayfa sadeleştir hatası: ${error.message}`);
    console.error(error);
  }
}

function updatePageContext(context) {
  el.pageDate.textContent = context.pageDate || '-';
  el.pageBaraCount.textContent = String((context.pageRows || []).length);
}

function updateMatchSummary(plan, comparison) {
  const matchedBaraName = plan?.matchedBaraName || deriveMatchedBaraName(comparison);
  const matchedDateCount = Number.isFinite(Number(plan?.matchedDateCount))
    ? Number(plan.matchedDateCount)
    : countUniqueMatchedDates(comparison);
  const matchedHourCount = Number.isFinite(Number(plan?.matchedHourCount))
    ? Number(plan.matchedHourCount)
    : countMatchedHours(comparison);
  if (el.matchedBaraName) el.matchedBaraName.textContent = matchedBaraName || '-';
  if (el.matchedDateCount) el.matchedDateCount.textContent = String(matchedDateCount || 0);
  if (el.matchedHourCount) el.matchedHourCount.textContent = String(matchedHourCount || 0);
}

function updateStatusComparisonSummary(plan, comparison, applySummary = null) {
  const metrics = calculateStatusComparison(plan, comparison);
  const changed = Number.isFinite(Number(applySummary?.statusChangedDifferent))
    ? Number(applySummary.statusChangedDifferent)
    : 0;
  if (el.sameHourCount) el.sameHourCount.textContent = String(metrics.same);
  if (el.differentHourCount) el.differentHourCount.textContent = String(metrics.different);
  if (el.changedHourCount) el.changedHourCount.textContent = String(changed);
}

function calculateStatusComparison(plan, comparison) {
  const metrics = { same: 0, different: 0 };
  const rows = Array.isArray(comparison?.matchedRows) ? comparison.matchedRows : [];
  rows.forEach(({ operation, pageRow }) => {
    const statusByHour = operation?.statusByHour || {};
    for (const [hour, code] of Object.entries(statusByHour)) {
      const currentLabel = getPageStatusLabel(pageRow, hour);
      if (!currentLabel) continue;
      const desiredLabel = state.settings.statusLabels?.[code] || code;
      if (MAP_COMMON.normalizeText(currentLabel) === MAP_COMMON.normalizeText(desiredLabel)) metrics.same += 1;
      else metrics.different += 1;
    }
  });
  return metrics;
}

function getPageStatusLabel(pageRow, hour) {
  const labels = pageRow?.statusLabelByHour || {};
  return String(labels[hour] ?? labels[String(hour)] ?? '').trim();
}

function printComparison(plan, comparison, verbose) {
  if (plan?.mode === 'periodic-daily') {
    log(`Donemlik plan: CSV gun ${plan.csvDayCount || 0} | Sayfa satiri ${plan.pageRowCount || comparison.pageRowCount || 0} | Eslesen gun ${comparison.matchedRows.length}`);
    log(`Eslesme ozeti: bara ${plan.matchedBaraName || '-'} | tarih ${plan.matchedDateCount || 0} | saat ${plan.matchedHourCount || 0}`);
    log(`Plan kaydi: ${plan.operations.length} | CSV filtre disi: ${plan.filteredOutCsvRows?.length || 0} | Ambiguous: ${plan.ambiguousRows?.length || 0}`);
    if (plan.blockingErrors?.length) {
      log(`Validasyon hatalari (${plan.blockingErrors.length}): ${plan.blockingErrors.slice(0, 25).join(' | ')}`);
    }
    if (plan.missingPageRows?.length) {
      log(`Sayfada olmayan CSV gunleri (${plan.missingPageRows.length}): ${plan.missingPageRows.map((row) => `${row.localDate} ${row.sourceBara}`).join(', ')}`);
    }
    if (verbose && plan.missingCsvRows?.length) {
      log(`CSV'de olmayan TPYS gunleri (${plan.missingCsvRows.length}): ${plan.missingCsvRows.map((row) => `${row.localDate} ${row.baraName}`).join(', ')}`);
    }
    if (plan.warnings?.length) {
      log(`Uyarilar: ${plan.warnings.join(' | ')}`);
    }
    return;
  }

  log(`Plan tarihi: ${plan.targetDate || '-'} | Plan bara: ${plan.operations.length}`);
  log(`Sayfa bara: ${comparison.pageRowCount} | Eşleşen: ${comparison.matchedRows.length}`);
  if (comparison.unmatchedPlanRows.length) {
    log(`Sayfada bulunamayan baralar (${comparison.unmatchedPlanRows.length}): ${comparison.unmatchedPlanRows.map((x) => x.tpysBaraAdi || x.sourceBara).join(', ')}`);
  }
  if (verbose && comparison.unmatchedPageRows.length) {
    log(`CSV'de olmayan sayfa baraları (${comparison.unmatchedPageRows.length}): ${comparison.unmatchedPageRows.map((x) => x.baraName).join(', ')}`);
  }
}

function logNoOperationsForPage(plan) {
  if (plan?.mode === 'periodic-daily') {
    log('CSV TPYS eşleşmesi bulunamadı; hücre yazımı yapılmadı.');
    log(`CSV bara: ${formatList(plan.csvBaras)} | TPYS bara: ${formatList(plan.tpysBaras || plan.pageBaras)}`);
    log(`CSV filtre dışı satır: ${plan.filteredOutCsvRows?.length || 0} | Sayfada olmayan CSV günü: ${plan.missingPageRows?.length || 0}`);
    return;
  }
  log('CSV TPYS eşleşmesi bulunamadı; hücre yazımı yapılmadı.');
}

function deriveMatchedBaraName(comparison) {
  const names = new Set();
  (comparison?.matchedRows || []).forEach((row) => {
    const name = row.operation?.tpysBaraAdi || row.pageRow?.baraName || '';
    if (name) names.add(name);
  });
  return names.size ? [...names].join(', ') : '-';
}

function countUniqueMatchedDates(comparison) {
  const dates = new Set();
  (comparison?.matchedRows || []).forEach((row) => {
    const date = row.operation?.localDate || row.operation?.sourceDate || row.pageRow?.localDate || '';
    if (date) dates.add(date);
  });
  return dates.size;
}

function countMatchedHours(comparison) {
  return (comparison?.matchedRows || []).reduce((sum, row) => {
    return sum + Object.keys(row.operation?.statusByHour || {}).length;
  }, 0);
}

function formatList(values) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  return list.length ? list.join(', ') : '-';
}

function assertCsvLoaded() {
  if (state.csvCacheMode === 'metadata' && state.monthlyFileName && !state.monthlyRows.length) {
    throw new Error('Son kayit yalnizca metadata olarak saklandi. Lutfen CSV dosyasini yeniden secin.');
  }
  if (!state.monthlyRows.length) throw new Error('Önce aylık özet CSV dosyasını yükleyin.');
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length || !tabs[0].id) throw new Error('Aktif sekme bulunamadı.');
  return tabs[0];
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['tpys-csv-automation-core.js', 'content-script.js'] });
  } catch (error) {
    const msg = String(error?.message || error || '');
    if (!/Cannot access contents of url|The extensions gallery cannot be scripted|chrome:\/\//i.test(msg)) throw error;
  }
}

function sendMessage(tabId, message) {
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

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

function readDownloadDateRange() {
  const startDate = el.downloadStartDate.value;
  const endDate = el.downloadEndDate.value || startDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('Başlangıç tarihi seçilmelidir.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error('Bitiş tarihi seçilmelidir.');
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

function buildDownloadRangeLabel() {
  try {
    const range = readDownloadDateRange();
    return `${range.startDate} - ${range.endDate}`;
  } catch {
    return '-';
  }
}

function normalizePopupDateToIso(value) {
  const text = String(value || '').trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return text;
  match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
}

async function readCsvFileText(file) {
  if (file?.arrayBuffer && window.TPYS_PERIODIC_RGDH_PLANNER?.decodeCsvTextFromBuffer) {
    const buffer = await file.arrayBuffer();
    return window.TPYS_PERIODIC_RGDH_PLANNER.decodeCsvTextFromBuffer(buffer);
  }
  return file.text();
}

function parseSemicolonCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let insideQuotes = false;
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === '"') {
      if (insideQuotes && next === '"') { current += '"'; i += 1; }
      else insideQuotes = !insideQuotes;
      continue;
    }
    if (char === ';' && !insideQuotes) { row.push(current); current = ''; continue; }
    if (char === '\n' && !insideQuotes) { row.push(current); rows.push(row); row = []; current = ''; continue; }
    current += char;
  }
  if (current.length || row.length) { row.push(current); rows.push(row); }

  while (rows.length && !rows[0].some((cell) => String(cell || '').trim())) rows.shift();
  if (rows.length && /^sep\s*=/i.test(String(rows[0][0] || '').replace(/^\uFEFF/, '').trim())) rows.shift();

  const headers = (rows.shift() || []).map((value, index) => {
    const cleaned = String(value || '').replace(/^\uFEFF/, '').trim();
    return index === 0 ? cleaned.replace(/^\uFEFF/, '') : cleaned;
  });
  const objects = rows.filter((line) => line.some((cell) => String(cell || '').trim() !== '')).map((line) => {
    const item = {};
    headers.forEach((header, index) => { item[header] = String(line[index] || '').trim(); });
    return item;
  });
  return { headers, rows: objects };
}

async function persistLastCsvSnapshot(fileName, parsed) {
  const basePayload = {
    fileName,
    headers: parsed.headers,
    rowCount: parsed.rows.length,
    dateCount: countUniqueDates(parsed.rows),
    loadedAt: new Date().toISOString()
  };

  const fullPayload = { ...basePayload, rows: parsed.rows, cacheMode: 'full' };
  if (estimateJsonBytes(fullPayload) <= CSV_CACHE_SOFT_LIMIT_BYTES) {
    try {
      await chrome.storage.local.set({ tpysReactiveLastCsv: fullPayload });
      return { cacheMode: 'full', warning: '' };
    } catch (error) {
      log(`Kalici CSV cache yazimi basarisiz oldu: ${error.message}`);
    }
  }

  const metadataPayload = { ...basePayload, cacheMode: 'metadata' };
  try {
    await chrome.storage.local.set({ tpysReactiveLastCsv: metadataPayload });
    return {
      cacheMode: 'metadata',
      warning: 'CSV buyuk oldugu icin tam icerik kalici saklanmadi. Bu popup acik kaldigi surece kullanabilirsiniz.'
    };
  } catch (error) {
    try {
      await chrome.storage.local.remove('tpysReactiveLastCsv');
    } catch {}
    return {
      cacheMode: 'session-only',
      warning: `CSV bu oturum icin yuklendi ancak kalici cache yazilamadi: ${error.message}`
    };
  }
}

function estimateJsonBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function countUniqueDates(rows) {
  return new Set((rows || []).map((row) => normalizeDate(row?.Tarih)).filter(Boolean)).size;
}

function buildMappingIndex(mappingRows) {
  const byTpysId = new Map();
  const byAlias = new Map();
  for (const row of mappingRows) {
    if (row.tpysBaraId) byTpysId.set(MAP_COMMON.normalizeText(row.tpysBaraId), row);
    const aliases = new Set([...(row.aliases || []), row.tpysBaraId, row.tpysBaraAdi, row.yksBaraAdi, row.oysBaraId]);
    aliases.forEach((alias) => {
      const key = MAP_COMMON.normalizeText(alias);
      if (key) byAlias.set(key, row);
    });
  }
  return { byTpysId, byAlias };
}

function buildPlanForPage(pageDate, monthlyRows, mappingIndex, pageRows = []) {
  const planner = window.TPYS_PERIODIC_RGDH_PLANNER;
  if (planner?.buildPeriodicPlanForPage) {
    return TPYS_PERIODIC_RGDH_PLANNER.buildPeriodicPlanForPage({
      pageDate,
      csvRows: monthlyRows,
      mappingIndex,
      pageRows
    });
  }
  return buildLegacyPlanForPage(pageDate, monthlyRows, mappingIndex);
}

function buildLegacyPlanForPage(pageDate, monthlyRows, mappingIndex) {
  const groupedByDate = new Map();
  for (const row of monthlyRows) {
    const date = normalizeDate(row.Tarih);
    if (!date) continue;
    if (!groupedByDate.has(date)) groupedByDate.set(date, []);
    groupedByDate.get(date).push(row);
  }

  const availableDates = [...groupedByDate.keys()].sort(compareNormalizedDates);
  const normalizedPageDate = normalizeDate(pageDate);
  const pageDateParseable = isNormalizedDate(normalizedPageDate);

  let targetDate = '';
  let warning = '';
  let selectionMode = 'none';

  if (normalizedPageDate && groupedByDate.has(normalizedPageDate)) {
    targetDate = normalizedPageDate;
    selectionMode = 'page-match';
  } else if (availableDates.length === 1) {
    targetDate = availableDates[0];
    selectionMode = 'single-csv-date';
    if (!normalizedPageDate) warning = `Sayfa tarihi okunamadi. Tek CSV tarihi (${targetDate}) secildi.`;
    else if (!pageDateParseable) warning = `Sayfa tarihi (${pageDate}) parse edilemedi. Tek CSV tarihi (${targetDate}) secildi.`;
    else warning = `Sayfa tarihi (${normalizedPageDate}) CSV'de yok. Tek CSV tarihi (${targetDate}) secildi.`;
  } else if (availableDates.length > 1) {
    targetDate = availableDates[availableDates.length - 1];
    selectionMode = 'latest-csv-date';
    if (!normalizedPageDate) warning = `Sayfa tarihi okunamadi. En guncel CSV tarihi (${targetDate}) secildi.`;
    else if (!pageDateParseable) warning = `Sayfa tarihi (${pageDate}) parse edilemedi. En guncel CSV tarihi (${targetDate}) secildi.`;
    else warning = `Sayfa tarihi (${normalizedPageDate}) CSV'de yok. En guncel CSV tarihi (${targetDate}) secildi.`;
  }

  const selectedRows = groupedByDate.get(targetDate) || [];
  const operations = [];
  for (const row of selectedRows) {
    const mapping = resolveMapping(row, mappingIndex);
    const op = {
      sourceDate: targetDate,
      sourceBara: row.Bara || '',
      rgk: row.RGK || '',
      statusByHour: buildStatusByHour(row)
    };

    if (!mapping) {
      operations.push({ ...op, tpysBaraAdi: row.Bara || '', unmatched: true });
      continue;
    }

    operations.push({
      ...op,
      unmatched: false,
      tpysBaraId: mapping.tpysBaraId,
      tpysBaraAdi: mapping.tpysBaraAdi,
      yksBaraAdi: mapping.yksBaraAdi,
      aliases: mapping.aliases || [],
      gerilim: mapping.gerilim || ''
    });
  }
  return {
    targetDate,
    operations,
    availableDates,
    selectionMode,
    warning,
    requiresConfirmation: Boolean(warning && operations.length),
    pageDateNormalized: normalizedPageDate
  };
}

async function confirmPlanContinuation(plan, pageDate) {
  const message = [
    'Tarih uyari var.',
    `Sayfa tarihi: ${pageDate || '-'}`,
    `Secilen CSV tarihi: ${plan.targetDate || '-'}`,
    `Etkilenecek bara sayisi: ${plan.operations.length}`,
    '',
    plan.warning,
    '',
    'Devam etmek istiyor musunuz?'
  ].join('\n');

  return window.confirm(message);
}

function resolveMapping(row, mappingIndex) {
  const possibleIdHeaders = ['TPYS Bara ID', 'TPYS Bara Id', 'Bara ID', 'Bara Id', 'TPYS_BARA_ID'];
  for (const key of possibleIdHeaders) {
    if (row[key]) {
      const hit = mappingIndex.byTpysId.get(MAP_COMMON.normalizeText(row[key]));
      if (hit) return hit;
    }
  }
  return mappingIndex.byAlias.get(MAP_COMMON.normalizeText(row.Bara));
}

function buildStatusByHour(row) {
  const result = {};
  for (let hour = 0; hour < 24; hour += 1) {
    const candidates = [String(hour), String(hour).padStart(2, '0')];
    let raw = '';
    for (const key of candidates) {
      const value = String(row[key] || '').trim().toUpperCase();
      if (value) { raw = value; break; }
    }
    if (raw) result[hour] = raw;
  }
  return result;
}

function comparePlanWithPage(plan, pageRows) {
  const planner = window.TPYS_PERIODIC_RGDH_PLANNER;
  if (plan?.mode === 'periodic-daily' && planner?.comparePeriodicPlanWithPage) {
    return planner.comparePeriodicPlanWithPage(plan, pageRows);
  }

  const pageMap = new Map(pageRows.map((row) => [MAP_COMMON.normalizeText(row.baraName), row]));
  const matchedRows = [];
  const unmatchedPlanRows = [];

  for (const operation of plan.operations) {
    if (operation.unmatched) { unmatchedPlanRows.push(operation); continue; }
    const hit = pageMap.get(MAP_COMMON.normalizeText(operation.tpysBaraAdi));
    if (hit) matchedRows.push({ operation, pageRow: hit });
    else unmatchedPlanRows.push(operation);
  }

  const planNames = new Set(plan.operations.filter((x) => !x.unmatched).map((x) => MAP_COMMON.normalizeText(x.tpysBaraAdi)));
  const unmatchedPageRows = pageRows.filter((row) => !planNames.has(MAP_COMMON.normalizeText(row.baraName)));

  return { pageRowCount: pageRows.length, matchedRows, unmatchedPlanRows, unmatchedPageRows };
}

function legacyNormalizeText(value) {
  return MAP_COMMON.normalizeText(value);
  /*
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  */
}

function normalizeDate(value) {
  const raw = String(value || '').replace(/^\uFEFF/, '').trim();
  if (!raw) return '';
  const match = raw.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (!match) return raw;
  const day = String(match[1]).padStart(2, '0');
  const month = String(match[2]).padStart(2, '0');
  let year = String(match[3]);
  if (year.length === 2) year = `20${year}`;
  return `${day}.${month}.${year}`;
}

function isNormalizedDate(value) {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(String(value || ''));
}

function compareNormalizedDates(a, b) {
  const aKey = normalizedDateSortKey(a);
  const bKey = normalizedDateSortKey(b);
  if (aKey && bKey && aKey !== bKey) return aKey.localeCompare(bKey);
  return String(a || '').localeCompare(String(b || ''), 'tr');
}

function normalizedDateSortKey(value) {
  const match = String(value || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return '';
  return `${match[3]}${match[2]}${match[1]}`;
}

function log(message) {
  const line = `[${new Date().toLocaleTimeString('tr-TR')}] ${message}`;
  el.log.textContent += `${line}\n`;
  el.log.scrollTop = el.log.scrollHeight;
}
