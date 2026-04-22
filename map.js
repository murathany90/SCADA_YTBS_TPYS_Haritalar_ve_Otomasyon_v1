const HAT_TM_COLORS = { '400': '#dc2626', '154': '#111827', '66': '#7c3aed', '': '#64748b' };
const BARA_COLORS = { '400': '#2563eb', '154': '#f97316', '66': '#f97316', '': '#6b7280' };
const TILE_URLS = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
];
const BARA_YTM_CODE_MAP = {
  'OA_YTM': 'Orta Anadolu YTM',
  'BA_YTM': 'Batı Anadolu YTM',
  'BKA_YTM': 'Batı Akdeniz YTM',
  'DA_YTM': 'Doğu Anadolu YTM',
  'DAK_YTM': 'Doğu Akdeniz YTM',
  'GDA_YTM': 'Güney Doğu Anadolu YTM',
  'KBA_YTM': 'Kuzey Batı Anadolu YTM',
  'OKA_YTM': 'Orta Karadeniz YTM',
  'TRA_YTM': 'Trakya YTM',
  'MILLI_YTM': 'Milli YTM'
};

const state = {
  mappingRows: [],
  mappingIndex: { byAlias: new Map(), byId: new Map() },
  network: { tmPoints: [], hatLines: [], ytmNames: [], defaultYtm: 'Orta Anadolu YTM' },
  filters: {
    showBaras: true,
    showTm: true,
    showHat: true,
    showBaraSet: false,
    kv: new Set(['66', '154', '400']),
    networkYtm: new Set()
  },
  baraSet: {
    loaded: false,
    dateText: '',
    rows: [],
    hour: 0,
    displayMode: 'kv',
    unmatchedNames: []
  },
  selection: { kind: '', id: '', measureSourceId: '', measureTargetIds: [] },
  map: { centerLon: 35.2, centerLat: 39.0, zoom: 6, drag: null }
};

const el = {
  showBaras: document.getElementById('showBaras'),
  showTm: document.getElementById('showTm'),
  showHat: document.getElementById('showHat'),
  showBaraSet: document.getElementById('showBaraSet'),
  kvFilters: Array.from(document.querySelectorAll('.kv-filter')),
  ytmFilters: document.getElementById('ytmFilters'),
  btnLoadBaraSet: document.getElementById('btnLoadBaraSet'),
  baraSetFileInput: document.getElementById('baraSetFileInput'),
  baraSetInfo: document.getElementById('baraSetInfo'),
  hourSlider: document.getElementById('hourSlider'),
  hourLabel: document.getElementById('hourLabel'),
  btnHourMinus: document.getElementById('btnHourMinus'),
  btnHourPlus: document.getElementById('btnHourPlus'),
  btnModeKv: document.getElementById('btnModeKv'),
  btnModePu: document.getElementById('btnModePu'),
  valueModeGroup: document.getElementById('valueModeGroup'),
  searchInput: document.getElementById('searchInput'),
  btnSearch: document.getElementById('btnSearch'),
  btnResetView: document.getElementById('btnResetView'),
  baraCount: document.getElementById('baraCount'),
  tmCount: document.getElementById('tmCount'),
  hatCount: document.getElementById('hatCount'),
  mapStatus: document.getElementById('mapStatus'),
  mapViewport: document.getElementById('mapViewport'),
  tileLayer: document.getElementById('tileLayer'),
  hatLayer: document.getElementById('hatLayer'),
  measureLayer: document.getElementById('measureLayer'),
  tmLayer: document.getElementById('tmLayer'),
  baraLayer: document.getElementById('baraLayer'),
  baraSetLayer: document.getElementById('baraSetLayer'),
  infoCard: document.getElementById('infoCard'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const [mappingRows, network, savedBaraSet] = await Promise.all([
      fetchJson('data/mapping.json'),
      fetchJson('data/kml_layers.json'),
      chrome.storage.local.get('tpysBaraSetCache')
    ]);

    state.mappingRows = (mappingRows || []).filter((row) => Number.isFinite(Number(row.enlem)) && Number.isFinite(Number(row.boylam)));
    state.mappingRows.forEach((row) => { row.fullYtm = resolveBaraYtm(row); });
    state.mappingIndex = buildMappingIndex(state.mappingRows);
    state.network = network || { tmPoints: [], hatLines: [], ytmNames: [], defaultYtm: 'Orta Anadolu YTM' };

    initializeFilters();
    if (savedBaraSet?.tpysBaraSetCache?.rows?.length) restoreBaraSet(savedBaraSet.tpysBaraSetCache);
    bindEvents();
    resetView();
    renderAll();
    updateBaraSetInfoText();
    el.mapStatus.textContent = `${state.network.defaultYtm || 'Orta Anadolu YTM'} varsayılan açık.`;
  } catch (error) {
    console.error(error);
    el.mapStatus.textContent = `Harita yüklenemedi: ${error.message}`;
  }
}

async function fetchJson(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  if (!response.ok) throw new Error(`${path} yüklenemedi`);
  return response.json();
}

function buildMappingIndex(rows) {
  const byAlias = new Map();
  const byId = new Map();
  rows.forEach((row) => {
    byId.set(String(row.tpysBaraId), row);
    const aliases = new Set([...(row.aliases || []), row.tpysBaraAdi, row.yksBaraAdi, row.oysBaraId]);
    aliases.forEach((alias) => {
      const key = normalizeText(alias);
      if (key) byAlias.set(key, row);
    });
  });
  return { byAlias, byId };
}

function resolveBaraYtm(row) {
  const raw = String(row.bytm || '').trim().toUpperCase();
  if (!raw) return '';
  return BARA_YTM_CODE_MAP[raw] || raw.replace(/_/g, ' ');
}

function initializeFilters() {
  state.filters.showBaras = true;
  state.filters.showTm = true;
  state.filters.showHat = true;
  state.filters.showBaraSet = false;
  state.filters.kv = new Set(['66', '154', '400']);

  const allYtms = (state.network.ytmNames || []).filter(Boolean);
  const defaultYtm = allYtms.includes('Orta Anadolu YTM') ? 'Orta Anadolu YTM' : (state.network.defaultYtm || allYtms[0] || '');
  state.filters.networkYtm = new Set(defaultYtm ? [defaultYtm] : []);

  el.ytmFilters.innerHTML = '';
  allYtms.forEach((ytm) => {
    const id = `ytm-${ytm.replace(/[^a-z0-9]+/ig, '-')}`;
    const checked = state.filters.networkYtm.has(ytm) ? 'checked' : '';
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" id="${id}" data-ytm="${escapeHtml(ytm)}" ${checked}> ${escapeHtml(ytm)}`;
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      if (input.checked) state.filters.networkYtm.add(ytm);
      else state.filters.networkYtm.delete(ytm);
      renderAll();
    });
    el.ytmFilters.appendChild(label);
  });
}

function bindEvents() {
  el.showBaras.addEventListener('change', () => { state.filters.showBaras = el.showBaras.checked; renderAll(); });
  el.showTm.addEventListener('change', () => { state.filters.showTm = el.showTm.checked; renderAll(); });
  el.showHat.addEventListener('change', () => { state.filters.showHat = el.showHat.checked; renderAll(); });
  el.showBaraSet.addEventListener('change', () => { state.filters.showBaraSet = el.showBaraSet.checked; renderAll(); });
  el.kvFilters.forEach((input) => input.addEventListener('change', () => {
    if (input.checked) state.filters.kv.add(input.value); else state.filters.kv.delete(input.value);
    renderAll();
  }));
  el.btnLoadBaraSet.addEventListener('click', () => el.baraSetFileInput.click());
  el.baraSetFileInput.addEventListener('change', onBaraSetFileChange);
  el.hourSlider.addEventListener('input', () => setHour(Number(el.hourSlider.value || 0)));
  el.btnHourMinus.addEventListener('click', () => setHour(Math.max(0, state.baraSet.hour - 1)));
  el.btnHourPlus.addEventListener('click', () => setHour(Math.min(23, state.baraSet.hour + 1)));
  el.btnModeKv.addEventListener('click', () => setDisplayMode('kv'));
  el.btnModePu.addEventListener('click', () => setDisplayMode('pu'));
  el.btnSearch.addEventListener('click', doSearch);
  el.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  el.btnResetView.addEventListener('click', () => {
    hideInfo();
    resetView();
    renderAll();
  });
  el.zoomInBtn.addEventListener('click', () => changeZoom(1));
  el.zoomOutBtn.addEventListener('click', () => changeZoom(-1));
  el.mapViewport.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
  el.mapViewport.addEventListener('mouseleave', endDrag);
  el.mapViewport.addEventListener('wheel', onWheel, { passive: false });
  el.mapViewport.addEventListener('click', (e) => {
    if (e.target === el.mapViewport) hideInfo(false);
  });
  window.addEventListener('resize', renderAll);
}

function restoreBaraSet(cache) {
  const rows = Array.isArray(cache.rows) ? cache.rows.map((row) => {
    const mapping = state.mappingIndex.byId.get(String(row.tpysBaraId || '')) || state.mappingIndex.byAlias.get(normalizeText(row.tpysBaraAdi || row.sourceName));
    if (!mapping) return null;
    return {
      ...row,
      tpysBaraId: mapping.tpysBaraId,
      tpysBaraAdi: mapping.tpysBaraAdi,
      gerilim: String(mapping.gerilim || row.gerilim || '').trim(),
      ytm: mapping.fullYtm || row.ytm || '',
      enlem: Number(mapping.enlem),
      boylam: Number(mapping.boylam),
      mapping
    };
  }).filter(Boolean) : [];

  if (!rows.length) return;
  state.baraSet.loaded = true;
  state.baraSet.dateText = cache.dateText || '';
  state.baraSet.rows = rows;
  state.baraSet.hour = Number.isFinite(Number(cache.hour)) ? Number(cache.hour) : 0;
  state.baraSet.displayMode = cache.displayMode === 'pu' ? 'pu' : 'kv';
  state.baraSet.unmatchedNames = cache.unmatchedNames || [];
  state.filters.showBaraSet = true;
  el.showBaraSet.checked = true;
  el.hourSlider.value = String(state.baraSet.hour);
  syncHourLabel();
  syncModeButtons();
}

async function onBaraSetFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = parseBaraSetWorkbook(arrayBuffer);
    const rows = parsed.rows.map((row) => {
      const mapping = state.mappingIndex.byAlias.get(normalizeText(row.sourceName)) || state.mappingIndex.byId.get(String(row.tpysBaraId || ''));
      if (!mapping) return null;
      return {
        sourceName: row.sourceName,
        tpysBaraId: mapping.tpysBaraId,
        tpysBaraAdi: mapping.tpysBaraAdi,
        gerilim: String(mapping.gerilim || row.gerilim || '').trim(),
        ytm: mapping.fullYtm || '',
        il: mapping.il || row.il || '',
        enlem: Number(mapping.enlem),
        boylam: Number(mapping.boylam),
        values: row.values,
        drops: row.drops,
        mapping
      };
    }).filter(Boolean);

    state.baraSet.loaded = rows.length > 0;
    state.baraSet.dateText = parsed.dateText;
    state.baraSet.rows = rows;
    state.baraSet.unmatchedNames = parsed.rows.filter((row) => !state.mappingIndex.byAlias.get(normalizeText(row.sourceName))).map((row) => row.sourceName);
    state.filters.showBaraSet = rows.length > 0;
    el.showBaraSet.checked = rows.length > 0;
    syncHourLabel();
    syncModeButtons();
    updateBaraSetInfoText();
    renderAll();

    await chrome.storage.local.set({
      tpysBaraSetCache: {
        dateText: state.baraSet.dateText,
        rows: rows.map((row) => ({
          sourceName: row.sourceName,
          tpysBaraId: row.tpysBaraId,
          tpysBaraAdi: row.tpysBaraAdi,
          gerilim: row.gerilim,
          ytm: row.ytm,
          il: row.il,
          values: row.values,
          drops: row.drops
        })),
        unmatchedNames: state.baraSet.unmatchedNames,
        hour: state.baraSet.hour,
        displayMode: state.baraSet.displayMode,
        loadedAt: new Date().toISOString()
      }
    });

    el.mapStatus.textContent = `Bara Set yüklendi. Eşleşen: ${rows.length}, eşleşmeyen: ${state.baraSet.unmatchedNames.length}.`;
  } catch (error) {
    console.error(error);
    el.mapStatus.textContent = `Bara Set yüklenemedi: ${error.message}`;
  } finally {
    event.target.value = '';
  }
}

function parseBaraSetWorkbook(arrayBuffer) {
  if (typeof XLSX === 'undefined') throw new Error('XLSX kütüphanesi yüklenemedi.');
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  const dateText = String(rows?.[0]?.[0] || '').trim();
  const dataRows = [];
  for (let i = 2; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const sourceName = String(row[0] || '').trim();
    if (!sourceName) continue;
    const values = [];
    const drops = [];
    for (let h = 0; h < 24; h += 1) {
      values.push(parseMaybeNumber(row[4 + h]));
      drops.push(parseMaybeNumber(row[28 + h]));
    }
    dataRows.push({
      sourceName,
      gerilim: String(row[1] || '').trim(),
      bytm: String(row[2] || '').trim(),
      il: String(row[3] || '').trim(),
      values,
      drops
    });
  }
  return { dateText, rows: dataRows };
}

function setHour(hour) {
  state.baraSet.hour = Math.max(0, Math.min(23, hour));
  el.hourSlider.value = String(state.baraSet.hour);
  syncHourLabel();
  renderAll();
}

function setDisplayMode(mode) {
  state.baraSet.displayMode = mode === 'pu' ? 'pu' : 'kv';
  syncModeButtons();
  renderAll();
}

function syncModeButtons() {
  el.btnModeKv.classList.toggle('active', state.baraSet.displayMode === 'kv');
  el.btnModePu.classList.toggle('active', state.baraSet.displayMode === 'pu');
}

function syncHourLabel() {
  el.hourLabel.textContent = hourLabel(state.baraSet.hour);
}

function updateBaraSetInfoText() {
  if (!state.baraSet.loaded) {
    el.baraSetInfo.textContent = 'Henüz yüklenmedi.';
    return;
  }
  const text = `${state.baraSet.dateText || 'Bara Set'} | Eşleşen: ${state.baraSet.rows.length}${state.baraSet.unmatchedNames.length ? ` | Eşleşmeyen: ${state.baraSet.unmatchedNames.length}` : ''}`;
  el.baraSetInfo.textContent = text;
}

function resetView() {
  const points = [];
  state.mappingRows.forEach((row) => points.push([Number(row.boylam), Number(row.enlem)]));
  state.network.tmPoints.forEach((row) => points.push([Number(row.lon), Number(row.lat)]));
  state.network.hatLines.forEach((row) => { if (row.bbox?.length === 4) points.push([row.bbox[0], row.bbox[1]], [row.bbox[2], row.bbox[3]]); });
  if (!points.length) return;
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  state.map.centerLon = (minLon + maxLon) / 2;
  state.map.centerLat = (minLat + maxLat) / 2;
  state.map.zoom = fitZoom(minLon, minLat, maxLon, maxLat);
}

function fitZoom(minLon, minLat, maxLon, maxLat) {
  const width = el.mapViewport.clientWidth || 1200;
  const height = el.mapViewport.clientHeight || 800;
  for (let z = 11; z >= 5; z -= 1) {
    const a = project(minLon, maxLat, z);
    const b = project(maxLon, minLat, z);
    if (Math.abs(b.x - a.x) <= width * 0.88 && Math.abs(b.y - a.y) <= height * 0.82) return z;
  }
  return 6;
}

function changeZoom(delta) {
  state.map.zoom = Math.max(5, Math.min(13, state.map.zoom + delta));
  renderAll();
}

function startDrag(event) {
  if (event.button !== 0) return;
  state.map.drag = {
    startX: event.clientX,
    startY: event.clientY,
    startCenter: project(state.map.centerLon, state.map.centerLat, state.map.zoom)
  };
  el.mapViewport.classList.add('dragging');
}
function onDrag(event) {
  if (!state.map.drag) return;
  const dx = event.clientX - state.map.drag.startX;
  const dy = event.clientY - state.map.drag.startY;
  const world = { x: state.map.drag.startCenter.x - dx, y: state.map.drag.startCenter.y - dy };
  const p = unproject(world.x, world.y, state.map.zoom);
  state.map.centerLon = p.lon;
  state.map.centerLat = p.lat;
  renderAll();
}
function endDrag() { state.map.drag = null; el.mapViewport.classList.remove('dragging'); }
function onWheel(event) { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1 : -1); }

function renderAll() {
  renderTiles();
  renderHatLayer();
  renderTmLayer();
  renderBaraLayer();
  renderBaraSetLayer();
  updateSummary();
}

function renderTiles() {
  const width = el.mapViewport.clientWidth || 1200;
  const height = el.mapViewport.clientHeight || 800;
  const zoom = state.map.zoom;
  const center = project(state.map.centerLon, state.map.centerLat, zoom);
  const topLeftX = center.x - width / 2;
  const topLeftY = center.y - height / 2;
  const tileMinX = Math.floor(topLeftX / 256);
  const tileMinY = Math.floor(topLeftY / 256);
  const tileMaxX = Math.floor((center.x + width / 2) / 256);
  const tileMaxY = Math.floor((center.y + height / 2) / 256);
  const limit = 2 ** zoom;
  el.tileLayer.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let tx = tileMinX; tx <= tileMaxX; tx += 1) {
    for (let ty = tileMinY; ty <= tileMaxY; ty += 1) {
      if (ty < 0 || ty >= limit) continue;
      const wrappedX = ((tx % limit) + limit) % limit;
      const img = document.createElement('img');
      const template = TILE_URLS[(wrappedX + ty) % TILE_URLS.length];
      img.src = template.replace('{z}', zoom).replace('{x}', wrappedX).replace('{y}', ty);
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.crossOrigin = 'anonymous';
      img.onerror = () => { img.style.display = 'none'; };
      img.style.left = `${tx * 256 - topLeftX}px`;
      img.style.top = `${ty * 256 - topLeftY}px`;
      frag.appendChild(img);
    }
  }
  el.tileLayer.appendChild(frag);
}

function screenPoint(lon, lat) {
  const width = el.mapViewport.clientWidth || 1200;
  const height = el.mapViewport.clientHeight || 800;
  const center = project(state.map.centerLon, state.map.centerLat, state.map.zoom);
  const world = project(lon, lat, state.map.zoom);
  return { x: world.x - center.x + width / 2, y: world.y - center.y + height / 2 };
}

function currentGeoBounds() {
  const width = el.mapViewport.clientWidth || 1200;
  const height = el.mapViewport.clientHeight || 800;
  const center = project(state.map.centerLon, state.map.centerLat, state.map.zoom);
  const tl = unproject(center.x - width / 2, center.y - height / 2, state.map.zoom);
  const br = unproject(center.x + width / 2, center.y + height / 2, state.map.zoom);
  return { minLon: tl.lon, maxLon: br.lon, minLat: br.lat, maxLat: tl.lat };
}

function matchesYtm(value) {
  const v = String(value || '').trim();
  if (!v) return false;
  if (!state.filters.networkYtm.size) return true;
  return state.filters.networkYtm.has(v);
}
function matchesAnyYtm(values) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!list.length) return false;
  if (!state.filters.networkYtm.size) return true;
  return list.some((v) => state.filters.networkYtm.has(v));
}

function getVisibleBaras() {
  return state.mappingRows.filter((row) =>
    state.filters.kv.has(String(row.gerilim || '')) &&
    matchesYtm(row.fullYtm)
  );
}
function getVisibleTms() {
  return state.network.tmPoints.filter((row) =>
    state.filters.kv.has(String(row.kv || '')) &&
    matchesYtm(row.ytm)
  );
}
function getVisibleHats() {
  return state.network.hatLines.filter((row) =>
    state.filters.kv.has(String(row.kv || '')) &&
    matchesAnyYtm(row.ytmNames)
  );
}

function renderHatLayer() {
  el.hatLayer.innerHTML = '';
  if (!state.filters.showHat) return;
  const bounds = currentGeoBounds();
  const frag = document.createDocumentFragment();
  getVisibleHats().filter((row) => intersects(row.bbox, bounds)).forEach((row) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = row.coords.map((coord, idx) => {
      const p = screenPoint(coord[0], coord[1]);
      return `${idx ? 'L' : 'M'} ${round1(p.x)} ${round1(p.y)}`;
    }).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('stroke', HAT_TM_COLORS[row.kv] || HAT_TM_COLORS['']);
    path.setAttribute('stroke-width', row.kv === '400' ? '2.8' : row.kv === '154' ? '2.1' : '1.7');
    path.setAttribute('class', `hat-line${isSelected('hat', row.id) ? ' feature-selected' : ''}`);
    path.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selection = { kind: 'hat', id: row.id, measureSourceId: '', measureTargetIds: [] };
      const fields = [
        ['Hat ID', row.kmlDescriptionId || '-'],
        ['Başlangıç TM', row.startTm || '-'],
        ['Bitiş TM', row.endTm || '-'],
        ['Uzunluk', formatNumber(row.lengthKm, ' km')],
        ['YTM', (row.ytmNames || []).join(' / ') || '-'],
        ['Kış Kapasitesi', formatNumber(row.winterCapacityMva, ' MVA')],
        ['Yaz Kapasitesi', formatNumber(row.summerCapacityMva, ' MVA')],
        ['Hat Kesit', row.characteristic || '-']
      ];
      if (row.olcumNoktasiIdAktif) fields.push(['Ölçüm Noktası (Aktif)', row.olcumNoktasiIdAktif]);
      if (row.olcumNoktasiIdReaktif) fields.push(['Ölçüm Noktası (Reaktif)', row.olcumNoktasiIdReaktif]);

      showInfo({
        title: row.name,
        tags: [row.kv ? `${row.kv} kV Hat` : 'Hat', (row.ytmNames || []).join(' / ') || '-'],
        fields: fields
      });
      renderAll();
    });
    frag.appendChild(path);
  });
  el.hatLayer.appendChild(frag);
}

function renderTmLayer() {
  el.tmLayer.innerHTML = '';
  if (!state.filters.showTm) return;
  const bounds = currentGeoBounds();
  const frag = document.createDocumentFragment();
  getVisibleTms().filter((row) => insideBounds(row.lon, row.lat, bounds)).forEach((row) => {
    const p = screenPoint(row.lon, row.lat);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', round1(p.x));
    circle.setAttribute('cy', round1(p.y));
    circle.setAttribute('r', row.kv === '400' ? '5.6' : row.kv === '154' ? '4.7' : '4.1');
    circle.setAttribute('fill', HAT_TM_COLORS[row.kv] || HAT_TM_COLORS['']);
    circle.setAttribute('class', `tm-point${isSelected('tm', row.id) ? ' feature-selected' : ''}`);
    circle.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selection = { kind: 'tm', id: row.id, measureSourceId: '', measureTargetIds: [] };
      showInfo({
        title: row.name,
        tags: [row.kv ? `${row.kv} kV TM` : 'TM', row.ytm || '-'],
        fields: [
          ['TM ID', row.kmlDescriptionId || '-'],
          ['YTM', row.ytm || '-'],
          ['İl', row.il || '-'],
          ['BM', row.bm || row.bolgeMudurlugu || '-'],
          ['TM Tipi', row.ozelTeiasTm || row.mulk || '-'],
          ['Şalt Türü', row.saltTuru || '-']
        ]
      });
      renderAll();
    });
    frag.appendChild(circle);
  });
  el.tmLayer.appendChild(frag);
}

function renderBaraLayer() {
  el.baraLayer.innerHTML = '';
  if (!state.filters.showBaras) return;
  const bounds = currentGeoBounds();
  const frag = document.createDocumentFragment();
  getVisibleBaras().filter((row) => insideBounds(Number(row.boylam), Number(row.enlem), bounds)).forEach((row) => {
    const p = screenPoint(Number(row.boylam), Number(row.enlem));
    const size = String(row.gerilim) === '400' ? 9 : 7.4;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', round1(p.x - size / 2));
    rect.setAttribute('y', round1(p.y - size / 2));
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', BARA_COLORS[row.gerilim] || BARA_COLORS['']);
    rect.setAttribute('class', `bara-point${isSelected('bara', row.tpysBaraId) ? ' feature-selected' : ''}${isMeasureTarget(row.tpysBaraId) ? ' measure-target' : ''}`);
    rect.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selection = { kind: 'bara', id: row.tpysBaraId, measureSourceId: '', measureTargetIds: [] };
      showBaraInfo(row, false);
      renderAll();
    });
    frag.appendChild(rect);
  });
  el.baraLayer.appendChild(frag);
  renderMeasureLayer();
}

function renderBaraSetLayer() {
  el.baraSetLayer.innerHTML = '';
  if (!state.filters.showBaraSet || !state.baraSet.loaded) return;
  const bounds = currentGeoBounds();
  const frag = document.createDocumentFragment();
  state.baraSet.rows.filter((row) =>
    state.filters.kv.has(String(row.gerilim || '')) &&
    matchesYtm(row.ytm) &&
    insideBounds(Number(row.boylam), Number(row.enlem), bounds)
  ).forEach((row) => {
    const current = getBaraSetDisplay(row);
    const p = screenPoint(Number(row.boylam), Number(row.enlem));
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', isSelected('baraset', row.tpysBaraId) ? 'feature-selected' : '');

    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', round1(p.x));
    point.setAttribute('cy', round1(p.y));
    point.setAttribute('r', '4.2');
    point.setAttribute('fill', current.color);
    point.setAttribute('class', 'bara-set-point');
    g.appendChild(point);

    if (state.map.zoom >= 7) {
      const labelWidth = Math.max(42, Math.min(78, 24 + current.text.length * 6.2));
      const labelX = p.x + 7;
      const labelY = p.y - 18;
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      box.setAttribute('x', round1(labelX));
      box.setAttribute('y', round1(labelY));
      box.setAttribute('width', round1(labelWidth));
      box.setAttribute('height', '18');
      box.setAttribute('rx', '8');
      box.setAttribute('class', 'bara-set-label-box');
      g.appendChild(box);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', round1(labelX + 7));
      text.setAttribute('y', round1(labelY + 12));
      text.textContent = current.text;
      g.appendChild(text);
    }

    g.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selection = { kind: 'baraset', id: row.tpysBaraId, measureSourceId: '', measureTargetIds: [] };
      showBaraSetInfo(row, false);
      renderAll();
    });

    frag.appendChild(g);
  });
  el.baraSetLayer.appendChild(frag);
}

function renderMeasureLayer() {
  el.measureLayer.innerHTML = '';
  if (!state.selection.measureSourceId || !state.selection.measureTargetIds.length) return;
  const source = state.mappingIndex.byId.get(String(state.selection.measureSourceId));
  if (!source) return;
  const frag = document.createDocumentFragment();
  const from = screenPoint(Number(source.boylam), Number(source.enlem));
  state.selection.measureTargetIds.forEach((id) => {
    const target = state.mappingIndex.byId.get(String(id));
    if (!target) return;
    const to = screenPoint(Number(target.boylam), Number(target.enlem));
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', round1(from.x));
    line.setAttribute('y1', round1(from.y));
    line.setAttribute('x2', round1(to.x));
    line.setAttribute('y2', round1(to.y));
    line.setAttribute('class', 'measure-line');
    frag.appendChild(line);
  });
  el.measureLayer.appendChild(frag);
}

function updateSummary() {
  el.baraCount.textContent = String(getVisibleBaras().length);
  el.tmCount.textContent = String(getVisibleTms().length);
  el.hatCount.textContent = String(getVisibleHats().length);
}

function doSearch() {
  const q = normalizeText(el.searchInput.value);
  if (!q) return;
  const bara = state.mappingRows.find((row) => normalizeText([row.tpysBaraAdi, row.yksBaraAdi, row.tpysBaraId].join(' ')).includes(q));
  if (bara) {
    focusOn(Number(bara.boylam), Number(bara.enlem), String(bara.gerilim) === '400' ? 8 : 9);
    state.selection = { kind: 'bara', id: bara.tpysBaraId, measureSourceId: '', measureTargetIds: [] };
    const baraSetRow = state.baraSet.rows.find((row) => row.tpysBaraId === bara.tpysBaraId);
    if (baraSetRow && state.filters.showBaraSet) showBaraSetInfo(baraSetRow, false);
    else showBaraInfo(bara, false);
    el.mapStatus.textContent = `${bara.tpysBaraAdi} vurgulandı.`;
    renderAll();
    return;
  }
  const tm = state.network.tmPoints.find((row) => normalizeText([row.name, row.ytm, row.il, row.kmlDescriptionId].join(' ')).includes(q));
  if (tm) {
    focusOn(Number(tm.lon), Number(tm.lat), tm.kv === '400' ? 8 : 9);
    state.selection = { kind: 'tm', id: tm.id, measureSourceId: '', measureTargetIds: [] };
    showInfo({
      title: tm.name,
      tags: [tm.kv ? `${tm.kv} kV TM` : 'TM', tm.ytm || '-'],
      fields: [['TM ID', tm.kmlDescriptionId || '-'], ['YTM', tm.ytm || '-'], ['İl', tm.il || '-'], ['BM', tm.bm || '-'], ['TM Tipi', tm.ozelTeiasTm || tm.mulk || '-'], ['Şalt Türü', tm.saltTuru || '-']]
    });
    el.mapStatus.textContent = `${tm.name} vurgulandı.`;
    renderAll();
    return;
  }
  const hat = state.network.hatLines.find((row) => normalizeText([row.name, row.kmlDescriptionId, row.startTm, row.endTm, (row.ytmNames || []).join(' ')].join(' ')).includes(q));
  if (hat) {
    focusOn((hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2, hat.kv === '400' ? 7 : 8);
    state.selection = { kind: 'hat', id: hat.id, measureSourceId: '', measureTargetIds: [] };
    showInfo({
      title: hat.name,
      tags: [hat.kv ? `${hat.kv} kV Hat` : 'Hat', (hat.ytmNames || []).join(' / ') || '-'],
      fields: [['Hat ID', hat.kmlDescriptionId || '-'], ['Başlangıç TM', hat.startTm || '-'], ['Bitiş TM', hat.endTm || '-'], ['Uzunluk', formatNumber(hat.lengthKm, ' km')], ['YTM', (hat.ytmNames || []).join(' / ') || '-'], ['Kış Kapasitesi', formatNumber(hat.winterCapacityMva, ' MVA')], ['Yaz Kapasitesi', formatNumber(hat.summerCapacityMva, ' MVA')], ['Hat Kesit', hat.characteristic || '-']]
    });
    el.mapStatus.textContent = `${hat.name} vurgulandı.`;
    renderAll();
    return;
  }
  el.mapStatus.textContent = 'Arama sonucu bulunamadı.';
}

function focusOn(lon, lat, zoom = state.map.zoom) {
  state.map.centerLon = lon;
  state.map.centerLat = lat;
  state.map.zoom = Math.max(5, Math.min(13, zoom));
}

function showBaraInfo(row, withDistances) {
  const tags = [row.gerilim ? `${row.gerilim} kV Bara` : 'Bara', row.baraTipi || '-', row.fullYtm || '-'];
  const fields = [
    ['Bara Adı', row.tpysBaraAdi || '-'],
    ['RGK Tipi', row.rgkTipiAciklama || row.rgkTipiKod || '-'],
    ['Pnom Toplam', formatNumber(row.pNomToplamMw, ' MW')],
    ['Aşırı Düşük İkaz', formatNumber(row.nominalIkazDusukToplam, ' Mvar')],
    ['Aşırı Yüksek İkaz', formatNumber(row.nominalIkazAsiriToplam, ' Mvar')],
    ['TPYS Santral MKÜD', formatNumber(row.tpysSantralMkudMw, ' MW')]
  ];
  let distanceHtml = '';
  if (withDistances) {
    const nearest = computeNearestBaras(row);
    state.selection.measureSourceId = row.tpysBaraId;
    state.selection.measureTargetIds = nearest.map((item) => item.row.tpysBaraId);
    distanceHtml = `<div class="distance-list"><strong>En yakın 5 bara (kuş uçuşu)</strong>${nearest.map((item) => `<div class="distance-row"><span>${escapeHtml(item.row.tpysBaraAdi)} (${escapeHtml(item.row.gerilim)} kV)</span><strong>${item.km.toFixed(2)} km</strong></div>`).join('')}</div>`;
    el.mapStatus.textContent = `${row.tpysBaraAdi} için en yakın 5 bara çizildi.`;
  } else {
    state.selection.measureSourceId = '';
    state.selection.measureTargetIds = [];
  }
  const showDistanceButton = String(row.gerilim) === '154' || String(row.gerilim) === '400';
  showInfo({
    title: row.tpysBaraAdi,
    tags,
    fields,
    actions: showDistanceButton ? [{ id: 'btnNearest5', label: withDistances ? 'Mesafeleri yenile' : 'En yakın 5 bara' }] : [],
    extraHtml: `${distanceHtml}${renderUnitTable(row.unitDetails || [])}`
  });
  if (showDistanceButton) {
    const btn = document.getElementById('btnNearest5');
    if (btn) btn.addEventListener('click', () => { showBaraInfo(row, true); renderAll(); });
  }
}

function showBaraSetInfo(item, withDistances) {
  const mapping = item.mapping || state.mappingIndex.byId.get(String(item.tpysBaraId));
  const current = getBaraSetDisplay(item);
  const tags = [item.gerilim ? `${item.gerilim} kV Bara` : 'Bara', mapping?.baraTipi || '-', item.ytm || '-'];
  const fields = [
    ['Bara Adı', item.tpysBaraAdi || item.sourceName || '-'],
    ['RGK Tipi', mapping?.rgkTipiAciklama || mapping?.rgkTipiKod || '-'],
    ['Saat', hourLabel(state.baraSet.hour)],
    ['Bara Set', current.text],
    ['Gerilim Düşümü', formatNumber(item.drops?.[state.baraSet.hour], '')],
    ['Pnom Toplam', formatNumber(mapping?.pNomToplamMw, ' MW')],
    ['TPYS Santral MKÜD', formatNumber(mapping?.tpysSantralMkudMw, ' MW')],
    ['Aşırı Düşük İkaz', formatNumber(mapping?.nominalIkazDusukToplam, ' Mvar')],
    ['Aşırı Yüksek İkaz', formatNumber(mapping?.nominalIkazAsiriToplam, ' Mvar')]
  ];

  let distanceHtml = '';
  if (withDistances && mapping) {
    const nearest = computeNearestBaras(mapping);
    state.selection.measureSourceId = mapping.tpysBaraId;
    state.selection.measureTargetIds = nearest.map((x) => x.row.tpysBaraId);
    distanceHtml = `<div class="distance-list"><strong>En yakın 5 bara (kuş uçuşu)</strong>${nearest.map((item2) => `<div class="distance-row"><span>${escapeHtml(item2.row.tpysBaraAdi)} (${escapeHtml(item2.row.gerilim)} kV)</span><strong>${item2.km.toFixed(2)} km</strong></div>`).join('')}</div>`;
    el.mapStatus.textContent = `${item.tpysBaraAdi} için en yakın 5 bara çizildi.`;
  } else {
    state.selection.measureSourceId = '';
    state.selection.measureTargetIds = [];
  }

  const chartsHtml = renderBaraSetCharts(item, mapping);
  showInfo({
    title: item.tpysBaraAdi || item.sourceName,
    tags,
    fields,
    actions: (String(item.gerilim) === '154' || String(item.gerilim) === '400') ? [{ id: 'btnNearest5', label: withDistances ? 'Mesafeleri yenile' : 'En yakın 5 bara' }] : [],
    extraHtml: `${chartsHtml}${distanceHtml}${renderUnitTable(mapping?.unitDetails || [])}`
  });
  const btn = document.getElementById('btnNearest5');
  if (btn) btn.addEventListener('click', () => { showBaraSetInfo(item, true); renderAll(); });
}

function renderBaraSetCharts(item, mapping) {
  const nominal = Number(item.gerilim) || Number(mapping?.gerilim) || null;
  const chartValues = state.baraSet.displayMode === 'pu' && nominal ? item.values.map((v) => (Number.isFinite(v) ? v / nominal : null)) : item.values;
  const valueUnit = state.baraSet.displayMode === 'pu' ? 'p.u.' : 'kV';
  const valueTitle = state.baraSet.displayMode === 'pu' ? '24 Saatlik Bara Seti (p.u.)' : '24 Saatlik Bara Seti (kV)';
  const mainChart = buildLineChartSvg(chartValues, '#2563eb', valueUnit);
  const dropChart = buildLineChartSvg(item.drops, '#f97316', 'Gerilim Düşümü');
  const chips = [`Dosya tarihi: ${escapeHtml(state.baraSet.dateText || '-')}`, `Nominal: ${escapeHtml(String(nominal || '-'))} kV`];
  return `
    <div class="info-section">
      <div class="chart-wrap">
        <strong>${escapeHtml(valueTitle)}</strong>
        ${mainChart}
        <div class="chart-legend"><span class="chart-main">Bara set değeri</span></div>
      </div>
      <div class="chart-wrap top-gap">
        <strong>24 Saatlik Gerilim Düşümü</strong>
        ${dropChart}
        <div class="chart-legend"><span class="chart-drop">Gerilim düşümü</span></div>
      </div>
      <div class="value-chip-row">${chips.map((x) => `<span class="value-chip">${x}</span>`).join('')}</div>
    </div>
  `;
}

function buildLineChartSvg(values, color, unitText) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) return '<div class="muted small top-gap">Grafik verisi yok.</div>';
  const width = 430, height = 210, padL = 38, padR = 12, padT = 16, padB = 28;
  let min = Math.min(...valid), max = Math.max(...valid);
  if (Math.abs(max - min) < 1e-9) { max += 1; min -= 1; }
  const xFor = (i) => padL + (i / 23) * (width - padL - padR);
  const yFor = (v) => padT + ((max - v) / (max - min)) * (height - padT - padB);
  const poly = values.map((v, i) => Number.isFinite(v) ? `${round1(xFor(i))},${round1(yFor(v))}` : '').filter(Boolean).join(' ');
  const hours = [0, 6, 12, 18, 23];
  const grid = hours.map((h) => `<line x1="${round1(xFor(h))}" y1="${padT}" x2="${round1(xFor(h))}" y2="${height - padB}" stroke="#e5e7eb" stroke-width="1"/>`).join('');
  const labels = hours.map((h) => `<text x="${round1(xFor(h))}" y="${height - 8}" font-size="10" text-anchor="middle" fill="#64748b">${hourShortLabel(h)}</text>`).join('');
  const yLines = [min, (min + max) / 2, max].map((v) => `<g><line x1="${padL}" y1="${round1(yFor(v))}" x2="${width - padR}" y2="${round1(yFor(v))}" stroke="#eef2f7" stroke-width="1"/><text x="${padL - 6}" y="${round1(yFor(v) + 4)}" font-size="10" text-anchor="end" fill="#64748b">${formatAxisNumber(v)}${unitText === 'p.u.' ? '' : ''}</text></g>`).join('');
  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="grafik">
      ${grid}
      ${yLines}
      <polyline fill="none" stroke="${color}" stroke-width="2.4" points="${poly}"/>
      ${values.map((v, i) => Number.isFinite(v) ? `<circle cx="${round1(xFor(i))}" cy="${round1(yFor(v))}" r="2.5" fill="${color}"/>` : '').join('')}
      ${labels}
    </svg>
  `;
}

function renderUnitTable(unitDetails) {
  const rows = (unitDetails || []).filter((row) => row && row.unitName);
  if (!rows.length) return '';
  return `
    <div class="info-section">
      <strong>Ünite bazlı reaktif güç kontrol verileri</strong>
      <table class="unit-table">
        <thead>
          <tr>
            <th>Ünite</th>
            <th>Nominal</th>
            <th>MKÜD</th>
            <th>PMKUD</th>
            <th>Düşük</th>
            <th>Aşırı</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.unitName || '-')}</td>
              <td>${escapeHtml(formatNumber(row.unitNominalGucMw, ''))}</td>
              <td>${escapeHtml(formatNumber(row.tpysUniteMkudMw ?? row.tpysSantralMkudMw, ''))}</td>
              <td>${escapeHtml(formatNumber(row.unitPmkudMw, ''))}</td>
              <td>${escapeHtml(formatNumber(row.nominalIkazDusuk, ''))}</td>
              <td>${escapeHtml(formatNumber(row.nominalIkazAsiri, ''))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showInfo({ title, tags = [], fields = [], actions = [], extraHtml = '' }) {
  el.infoCard.innerHTML = `
    <div class="info-head">
      <h3>${escapeHtml(title || '-')}</h3>
      <button id="btnInfoClose" class="info-close" title="Kapat">×</button>
    </div>
    <div class="info-tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
    <div class="info-grid">${fields.map(([label, value]) => `<div class="info-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? '-'))}</strong></div>`).join('')}</div>
    <div class="info-actions">${actions.map((action) => `<button id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`).join('')}</div>
    ${extraHtml}
  `;
  el.infoCard.classList.remove('hidden');
  const closeBtn = document.getElementById('btnInfoClose');
  if (closeBtn) closeBtn.addEventListener('click', () => hideInfo(false));
}

function hideInfo(clearSelection = true) {
  el.infoCard.classList.add('hidden');
  el.infoCard.innerHTML = '';
  if (clearSelection) state.selection = { kind: '', id: '', measureSourceId: '', measureTargetIds: [] };
  else state.selection.measureSourceId = '';
  state.selection.measureTargetIds = [];
  renderAll();
}

function getBaraSetDisplay(item) {
  const hour = state.baraSet.hour;
  const value = Number(item.values?.[hour]);
  const drop = Number(item.drops?.[hour]);
  const nominal = Number(item.gerilim) || null;
  const pu = nominal && Number.isFinite(value) ? value / nominal : null;
  if (state.baraSet.displayMode === 'pu' && Number.isFinite(pu)) {
    return { text: pu.toFixed(3), color: colorForPu(pu), value, pu, drop };
  }
  return { text: Number.isFinite(value) ? formatShortNumber(value) : '-', color: BARA_COLORS[item.gerilim] || BARA_COLORS[''], value, pu, drop };
}

function colorForPu(pu) {
  if (!Number.isFinite(pu)) return '#94a3b8';
  if (pu < 0.96) return '#b91c1c';
  if (pu < 0.98) return '#f97316';
  if (pu < 0.995) return '#eab308';
  if (pu <= 1.005) return '#16a34a';
  if (pu <= 1.02) return '#0ea5e9';
  return '#1d4ed8';
}

function computeNearestBaras(source) {
  const eligible = state.mappingRows.filter((row) =>
    row.tpysBaraId !== source.tpysBaraId &&
    (String(row.gerilim) === '154' || String(row.gerilim) === '400') &&
    Number.isFinite(Number(row.enlem)) &&
    Number.isFinite(Number(row.boylam))
  );
  return eligible.map((row) => ({
    row,
    km: haversineKm(Number(source.enlem), Number(source.boylam), Number(row.enlem), Number(row.boylam))
  })).sort((a, b) => a.km - b.km).slice(0, 5);
}

function project(lon, lat, zoom) {
  const scale = 256 * 2 ** zoom;
  const x = (lon + 180) / 360 * scale;
  const sin = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}
function unproject(x, y, zoom) {
  const scale = 256 * 2 ** zoom;
  const lon = x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / scale;
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lon, lat };
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function insideBounds(lon, lat, bounds) {
  return lon >= bounds.minLon && lon <= bounds.maxLon && lat >= bounds.minLat && lat <= bounds.maxLat;
}
function intersects(bbox, bounds) {
  if (!bbox || bbox.length !== 4) return true;
  return !(bbox[0] > bounds.maxLon || bbox[2] < bounds.minLon || bbox[1] > bounds.maxLat || bbox[3] < bounds.minLat);
}
function isSelected(kind, id) { return state.selection.kind === kind && String(state.selection.id) === String(id); }
function isMeasureTarget(id) { return state.selection.measureTargetIds.includes(id); }
function round1(value) { return Math.round(Number(value) * 10) / 10; }
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
function parseMaybeNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '-') return null;
  const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}
function formatNumber(value, suffix = '') {
  if (!Number.isFinite(Number(value))) return '-';
  return `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}${suffix}`;
}
function formatShortNumber(value) {
  if (!Number.isFinite(Number(value))) return '-';
  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}
function formatAxisNumber(value) {
  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}
function hourLabel(hour) {
  const h1 = String(hour).padStart(2, '0');
  const h2 = String((hour + 1) % 24).padStart(2, '0');
  return `${h1}-${h2}`;
}
function hourShortLabel(hour) {
  return String(hour).padStart(2, '0');
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
