(() => {
  const byId = (id) => document.getElementById(id);
  const state = { entities: [], filtered: [], queryRows: [] };
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[ch]);
  const kvOf = (entity) => String(entity.kvBucket || entity.kv || entity.primaryKv || entity.gerilimKv || '').replace(/\.0$/, '');
  const tmOf = (entity) => entity.tmName || entity.tm || entity.startTm || entity.name || '-';
  const nameOf = (entity) => entity.displayName || entity.name || entity.id || '-';

  function switchTab(tab) {
    document.querySelectorAll('.webscada-tab').forEach((button) => button.classList.toggle('active', button.dataset.webscadaTab === tab));
    document.querySelectorAll('.webscada-view').forEach((view) => view.classList.toggle('active', view.id === `webscada${tab[0].toUpperCase()}${tab.slice(1)}`));
    if (tab === 'map') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  function updateStatus() {
    const map = window.__TPYS_STATE;
    const text = map?.scada?.fetchMeta?.phaseMessage || map?.map?.status?.text || 'Hazir';
    byId('webscadaStatus').textContent = text;
  }
  function filterData() {
    const query = byId('dataSearch').value.trim().toLocaleLowerCase('tr-TR'); const type = byId('dataType').value; const kv = byId('dataKv').value;
    state.filtered = state.entities.filter((entity) => (!type || entity.kind === type) && (!kv || kvOf(entity) === kv) && (!query || `${nameOf(entity)} ${tmOf(entity)} ${entity.id || ''}`.toLocaleLowerCase('tr-TR').includes(query)));
    byId('dataCount').textContent = `${state.filtered.length.toLocaleString('tr-TR')} varlik`;
    byId('dataRows').innerHTML = state.filtered.slice(0, 2000).map((entity, index) => `<tr><td>${esc(entity.kind)}</td><td>${esc(nameOf(entity))}</td><td>${esc(tmOf(entity))}</td><td>${esc(kvOf(entity))}</td><td><button class="row-action" data-entity-index="${index}">Sec / haritada ac</button></td></tr>`).join('') || '<tr><td colspan="5">Eslesen veri yok.</td></tr>';
  }
  function selectEntity(entity, navigate) {
    window.WebSCADASelection.select(entity);
    byId('querySelection').textContent = `${entity.kind}: ${nameOf(entity)} secili.`;
    if (navigate) {
      switchTab('map');
      const input = byId('searchInput'); input.value = nameOf(entity); byId('btnSearch').click();
    }
  }
  function downloadCsv(filename, rows) {
    const headers = Object.keys(rows[0] || {}); if (!headers.length) return;
    const body = [headers.join(';'), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }
  function localTime(ms) { const date = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`; }
  function measurementIds(entity) {
    const candidates = [entity?.sinsid, entity?.measurementId, entity?.scadaMeasurementId, entity?.scada?.sinsid, entity?.id];
    return candidates.filter((value) => value !== undefined && value !== null && String(value).trim()).map(String).slice(0, 1);
  }
  function valueOf(row) { return row?.['AVG(maxValue)'] ?? row?.maxValue ?? row?.value ?? row?.valueAvg ?? ''; }
  function timeOf(row) { return row?.['MAX(__time)'] ?? row?.__time ?? row?.timestamp ?? ''; }
  function drawChart(rows) {
    const values = rows.map((row) => Number(valueOf(row))).filter(Number.isFinite); const chart = byId('queryChart');
    if (!values.length) { chart.innerHTML = '<div class="empty">Grafik icin sayisal veri yok.</div>'; return; }
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const path = values.map((value, index) => `${index ? 'L' : 'M'} ${(index / Math.max(1, values.length - 1) * 960 + 20).toFixed(1)} ${(130 - (value - min) / range * 105).toFixed(1)}`).join(' ');
    chart.innerHTML = `<svg viewBox="0 0 1000 150" role="img" aria-label="Sorgu zaman serisi"><path d="M20 130H980" stroke="#cbd5e1"/><path d="${path}" fill="none" stroke="#0e7490" stroke-width="3"/><text x="20" y="146" fill="#526273" font-size="12">${esc(min.toFixed(2))}</text><text x="925" y="20" fill="#526273" font-size="12">${esc(max.toFixed(2))}</text></svg>`;
  }
  async function runQuery() {
    const entity = window.WebSCADASelection.get();
    if (!entity) { byId('queryStatus').textContent = 'Once Datalar sekmesinden bir varlik secin.'; return; }
    const ids = measurementIds(entity); if (!ids.length) { byId('queryStatus').textContent = 'Secili varlik icin olcum kimligi yok.'; return; }
    const button = byId('runQuery'); button.disabled = true; button.textContent = 'Yukleniyor...'; byId('queryStatus').textContent = 'Superset sorgusu calisiyor...';
    try {
      const metric = byId('queryMetric').value; const start = new Date(byId('queryStart').value).toISOString(); const end = new Date(byId('queryEnd').value).toISOString();
      const response = await chrome.runtime.sendMessage({ type: 'WEBSCADA_QUERY', payload: { measurementIds: ids, elementNames: [metric], timeRange: `${start} : ${end}` } });
      if (!response?.ok) throw new Error(response?.error || 'Sorgu basarisiz.');
      state.queryRows = (response.data?.result || []).flatMap((item) => item.data || []); drawChart(state.queryRows);
      byId('queryRows').innerHTML = state.queryRows.slice(0, 1000).map((row) => `<tr><td>${esc(timeOf(row))}</td><td>${esc(row.elementName || metric)}</td><td>${esc(valueOf(row))}</td><td>${esc(nameOf(entity))}</td></tr>`).join('') || '<tr><td colspan="4">Veri yok.</td></tr>';
      byId('queryStatus').textContent = `${state.queryRows.length} satir alindi.`;
    } catch (error) { byId('queryStatus').textContent = `Sorgu hatasi: ${error.message}`; }
    finally { button.disabled = false; button.textContent = 'Sorguyu calistir'; }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const now = Date.now(); byId('queryStart').value = localTime(now - 24 * 3600 * 1000); byId('queryEnd').value = localTime(now);
    document.querySelectorAll('.webscada-tab').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.webscadaTab)));
    ['dataSearch', 'dataType', 'dataKv'].forEach((id) => byId(id).addEventListener(id === 'dataSearch' ? 'input' : 'change', filterData));
    byId('dataRows').addEventListener('click', (event) => { const index = event.target.dataset.entityIndex; if (index !== undefined) selectEntity(state.filtered[Number(index)], true); });
    byId('dataCsv').addEventListener('click', () => downloadCsv('webscada-topology.csv', state.filtered.map((entity) => ({ type: entity.kind, ad: nameOf(entity), tm: tmOf(entity), kv: kvOf(entity), id: entity.id || '' }))));
    byId('runQuery').addEventListener('click', runQuery); byId('queryCsv').addEventListener('click', () => downloadCsv('webscada-query.csv', state.queryRows));
    try { const { network } = await window.WebSCADATopology.loadAll(); state.entities = window.WebSCADATopology.listEntities(network); filterData(); } catch (error) { byId('dataCount').textContent = `Topology yuklenemedi: ${error.message}`; }
    setInterval(updateStatus, 500); updateStatus();
  });
})();
