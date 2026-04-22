const DEFAULT_SETTINGS = {
  statusLabels: {
    DD: 'Devre Dışı',
    OK: 'Sağladı',
    YY: 'Yükümlülüğü Yok',
    X: 'Sağlamadı',
    KY: 'Kontrol Yapılamadı'
  },
  checkApproval: true,
  strictDateCheck: false,
  fastExtMode: true,
  onlyChangedCells: true
};

const CSV_CACHE_SOFT_LIMIT_BYTES = 3 * 1024 * 1024;

const state = {
  mappingRows: [],
  mappingIndex: null,
  monthlyFileName: '',
  monthlyHeaders: [],
  monthlyRows: [],
  csvCacheMode: 'none',
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
  btnCommit: document.getElementById('btnCommit'),
  btnOpenMap: document.getElementById('btnOpenMap'),
  btnToggleSimplify: document.getElementById('btnToggleSimplify'),
  pageDate: document.getElementById('pageDate'),
  pageBaraCount: document.getElementById('pageBaraCount'),
  matchedCount: document.getElementById('matchedCount'),
  btnAnalyzeDownloadPage: document.getElementById('btnAnalyzeDownloadPage'),
  btnDownloadAllCsvs: document.getElementById('btnDownloadAllCsvs'),
  downloadPageDate: document.getElementById('downloadPageDate'),
  downloadBaraCount: document.getElementById('downloadBaraCount'),
  downloadPageStatus: document.getElementById('downloadPageStatus'),
  log: document.getElementById('log'),
  labelDD: document.getElementById('labelDD'),
  labelOK: document.getElementById('labelOK'),
  labelYY: document.getElementById('labelYY'),
  labelX: document.getElementById('labelX'),
  labelKY: document.getElementById('labelKY'),
  checkApproval: document.getElementById('checkApproval'),
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
  el.btnCommit.addEventListener('click', commitCurrentTab);
  el.btnOpenMap.addEventListener('click', openMapPage);
  el.btnToggleSimplify.addEventListener('click', toggleApprovalSimplifyOnCurrentTab);
  el.btnAnalyzeDownloadPage.addEventListener('click', analyzeDownloadPage);
  el.btnDownloadAllCsvs.addEventListener('click', downloadAllCsvs);
  el.btnSaveSettings.addEventListener('click', saveSettings);
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
      }
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
    checkApproval: el.checkApproval.checked,
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
  el.checkApproval.checked = state.settings.checkApproval;
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
  const text = await file.text();
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

    const plan = buildPlanForPage(context.pageDate, state.monthlyRows, state.mappingIndex);
    if (plan.warning) {
      log(`Uyari: ${plan.warning}`);
      if (plan.availableDates.length) log(`CSV tarihleri: ${plan.availableDates.join(', ')}`);
    }
    const comparison = comparePlanWithPage(plan, context.pageRows);
    el.matchedCount.textContent = String(comparison.matchedRows.length);
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

    const plan = buildPlanForPage(context.pageDate, state.monthlyRows, state.mappingIndex);
    if (!plan.operations.length) throw new Error('ERP sayfasındaki tarih için uygulanacak kayıt bulunamadı.');

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

    if (state.settings.strictDateCheck && context.pageDate && plan.targetDate && normalizeDate(context.pageDate) !== normalizeDate(plan.targetDate)) {
      throw new Error(`Sayfa tarihi (${context.pageDate}) ile plan tarihi (${plan.targetDate}) uyuşmuyor.`);
    }

    const comparison = comparePlanWithPage(plan, context.pageRows);
    el.matchedCount.textContent = String(comparison.matchedRows.length);
    printComparison(plan, comparison, true);

    const result = await sendMessage(tab.id, {
      type: 'APPLY_PLAN',
      payload: { operations: plan.operations, settings: state.settings }
    });
    if (!result?.ok) throw new Error(result?.error || result?.reason || 'Uygulama başarısız.');

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

async function commitCurrentTab() {
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, { type: 'CLICK_COMMIT' });
    if (result?.ok) log('ERP Commit tetiklendi.');
    else log(`ERP Commit bulunamadı: ${result?.reason || 'bilinmiyor'}`);
  } catch (error) {
    log(`Commit hatası: ${error.message}`);
    console.error(error);
  }
}

async function analyzeDownloadPage() {
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, { type: 'GET_DOWNLOAD_CONTEXT' });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'CSV indirme ekranı bulunamadı.');
    el.downloadPageDate.textContent = result.pageDate || '-';
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
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, {
      type: 'DOWNLOAD_ALL_CSVS',
      payload: { delayMs: 1800 }
    });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'Toplu CSV indirme başlatılamadı.');
    el.downloadPageDate.textContent = result.pageDate || '-';
    el.downloadBaraCount.textContent = String(result.total || 0);
    el.downloadPageStatus.textContent = 'Çalıştı';
    log(`Toplu CSV indirme tamamlandı. Sayfa sırası: ${result.total || 0}, Başarılı: ${result.successCount || 0}, Hata: ${result.failureCount || 0}`);
    if (result.errors?.length) {
      result.errors.slice(0, 20).forEach((item) => log(`- ${item}`));
    }
  } catch (error) {
    log(`Toplu indirme hatası: ${error.message}`);
    console.error(error);
  }
}

async function openMapPage() {
  await chrome.tabs.create({ url: chrome.runtime.getURL('map-modern.html') });
}


async function toggleApprovalSimplifyOnCurrentTab() {
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const result = await sendMessage(tab.id, { type: 'TOGGLE_APPROVAL_SIMPLIFY' });
    if (!result?.ok) throw new Error(result?.reason || result?.error || 'Onay sadeleştirme çalıştırılamadı.');
    log(`Onay sadeleştir: ${result.hidden ? 'aktif' : 'kapalı'}`);
  } catch (error) {
    log(`Onay sadeleştir hatası: ${error.message}`);
    console.error(error);
  }
}

function updatePageContext(context) {
  el.pageDate.textContent = context.pageDate || '-';
  el.pageBaraCount.textContent = String((context.pageRows || []).length);
}

function printComparison(plan, comparison, verbose) {
  log(`Plan tarihi: ${plan.targetDate || '-'} | Plan bara: ${plan.operations.length}`);
  log(`Sayfa bara: ${comparison.pageRowCount} | Eşleşen: ${comparison.matchedRows.length}`);
  if (comparison.unmatchedPlanRows.length) {
    log(`Sayfada bulunamayan baralar (${comparison.unmatchedPlanRows.length}): ${comparison.unmatchedPlanRows.map((x) => x.tpysBaraAdi || x.sourceBara).join(', ')}`);
  }
  if (verbose && comparison.unmatchedPageRows.length) {
    log(`CSV'de olmayan sayfa baraları (${comparison.unmatchedPageRows.length}): ${comparison.unmatchedPageRows.map((x) => x.baraName).join(', ')}`);
  }
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
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content-script.js'] });
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
    if (row.tpysBaraId) byTpysId.set(normalizeText(row.tpysBaraId), row);
    const aliases = new Set([...(row.aliases || []), row.tpysBaraId, row.tpysBaraAdi, row.yksBaraAdi, row.oysBaraId]);
    aliases.forEach((alias) => {
      const key = normalizeText(alias);
      if (key) byAlias.set(key, row);
    });
  }
  return { byTpysId, byAlias };
}

function buildPlanForPage(pageDate, monthlyRows, mappingIndex) {
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
      const hit = mappingIndex.byTpysId.get(normalizeText(row[key]));
      if (hit) return hit;
    }
  }
  return mappingIndex.byAlias.get(normalizeText(row.Bara));
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
  const pageMap = new Map(pageRows.map((row) => [normalizeText(row.baraName), row]));
  const matchedRows = [];
  const unmatchedPlanRows = [];

  for (const operation of plan.operations) {
    if (operation.unmatched) { unmatchedPlanRows.push(operation); continue; }
    const hit = pageMap.get(normalizeText(operation.tpysBaraAdi));
    if (hit) matchedRows.push({ operation, pageRow: hit });
    else unmatchedPlanRows.push(operation);
  }

  const planNames = new Set(plan.operations.filter((x) => !x.unmatched).map((x) => normalizeText(x.tpysBaraAdi)));
  const unmatchedPageRows = pageRows.filter((row) => !planNames.has(normalizeText(row.baraName)));

  return { pageRowCount: pageRows.length, matchedRows, unmatchedPlanRows, unmatchedPageRows };
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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
