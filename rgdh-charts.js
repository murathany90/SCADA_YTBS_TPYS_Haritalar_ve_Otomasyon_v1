(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_CHARTS = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const STATUS_COLORS = {
    OK: '#22c55e',
    WARN: '#f59e0b',
    FAIL: '#ef4444',
    NO_DATA: '#64748b',
    OFF: '#94a3b8'
  };

  function renderReport(root, rows, pivotRows, options = {}) {
    if (!root) return;
    root.innerHTML = '';
    const effectiveOptions = { ...options, date: resolveReportDate(rows, options) };

    const toolbar = createChartToolbar(rows, pivotRows, effectiveOptions, root);
    root.appendChild(toolbar);

    const chartWrap = document.createElement('div');
    chartWrap.className = 'rgdh-chart-wrap';
    chartWrap.style.position = 'relative';
    chartWrap.style.height = '420px';
    chartWrap.style.marginBottom = '1rem';

    const canvas = document.createElement('canvas');
    chartWrap.appendChild(canvas);
    root.appendChild(chartWrap);

    const selectedRows = selectRowsForReport(rows, effectiveOptions);
    renderMainChart(canvas, selectedRows, effectiveOptions);

    const detailToggle = document.createElement('button');
    detailToggle.id = 'btnToggleChartDetailTable';
    detailToggle.type = 'button';
    detailToggle.textContent = 'Tablo Goster';
    root.appendChild(detailToggle);
    const detailTable = createDetailTable(selectedRows);
    detailTable.hidden = true;
    detailToggle.addEventListener('click', () => {
      const currentTable = root.querySelector('.rgdh-detail-table');
      if (!currentTable) return;
      currentTable.hidden = !currentTable.hidden;
      detailToggle.textContent = currentTable.hidden ? 'Tablo Goster' : 'Tablo Gizle';
    });
    root.appendChild(detailTable);
    applyVoltageVisibility(root, effectiveOptions.showVoltage !== false);

    const heatmapPanel = createChartPanel('24 saat Sonuçlar', renderHeatmap(selectPivotRowsForReport(pivotRows || [], effectiveOptions), effectiveOptions));
    root.appendChild(heatmapPanel);
  }

  function createChartToolbar(rows, pivotRows, options, root) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rgdh-chart-toolbar yks-card';

    const busbarIds = [...new Set((rows || []).map((r) => r.busbarId).filter((v) => v !== null && v !== undefined))];
    const busbarOptions = busbarIds.map((id) => {
      const row = rows.find((r) => String(r.busbarId) === String(id));
      return { value: String(id), label: row?.busbarName || String(id) };
    });

    const ytmValues = [...new Set((rows || []).map((r) => r.ytm).filter(Boolean))];

    toolbar.innerHTML = `
      <label>Bara <select id="chartBusbarSelect" class="rgdh-select"><option value="">Tümü</option>${busbarOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select></label>
      <label>BYTM <select id="chartYtmSelect" class="rgdh-select"><option value="">Tümü</option>${ytmValues.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
      <label>Tarih <input id="chartDate" type="date" class="rgdh-input"></label>
      <label>Başlangıç <input id="chartStartHour" type="number" min="0" max="23" value="0" style="width:48px">:<input id="chartStartMinute" type="number" min="0" max="59" value="0" style="width:48px"></label>
      <label>Bitiş <input id="chartEndHour" type="number" min="0" max="23" value="23" style="width:48px">:<input id="chartEndMinute" type="number" min="0" max="59" value="59" style="width:48px"></label>
      <button id="btnChartQuery" class="primary" type="button">Sorgula</button>
      <button id="btnChartFullscreen" type="button">Tam Ekran</button>
    `;

    const selectBusbar = toolbar.querySelector('#chartBusbarSelect');
    const selectYtm = toolbar.querySelector('#chartYtmSelect');
    const inputDate = toolbar.querySelector('#chartDate');
    const startHour = toolbar.querySelector('#chartStartHour');
    const startMinute = toolbar.querySelector('#chartStartMinute');
    const endHour = toolbar.querySelector('#chartEndHour');
    const endMinute = toolbar.querySelector('#chartEndMinute');
    const btnQuery = toolbar.querySelector('#btnChartQuery');
    const btnFs = toolbar.querySelector('#btnChartFullscreen');

    if (options.busbarId) selectBusbar.value = String(options.busbarId);
    if (options.date) inputDate.value = options.date;

    const applyFilters = () => {
      const busbarId = selectBusbar.value;
      const ytm = selectYtm.value;
      const date = inputDate.value;
      const startH = Number(startHour.value) || 0;
      const startM = Number(startMinute.value) || 0;
      const endH = Number(endHour.value) || 23;
      const endM = Number(endMinute.value) || 59;

      let filtered = rows;
      if (busbarId) filtered = filtered.filter((r) => String(r.busbarId) === busbarId);
      if (ytm) filtered = filtered.filter((r) => r.ytm === ytm);
      if (date) filtered = filtered.filter((r) => r.localDate === date);
      if (!date) {
        const fallbackDate = resolveReportDate(filtered, options);
        if (fallbackDate) filtered = filtered.filter((r) => r.localDate === fallbackDate);
      }
      filtered = filtered.filter((r) => {
        const h = Number(r.localHour) ?? -1;
        const m = Number(r.localMinute) ?? -1;
        const t = h * 60 + m;
        const startT = startH * 60 + startM;
        const endT = endH * 60 + endM;
        return t >= startT && t <= endT;
      });

      const nextOptions = { ...options, busbarId, date };
      const canvas = root.querySelector('canvas');
      if (canvas) {
        const chart = Chart.getChart(canvas);
        if (chart) chart.destroy();
        renderMainChart(canvas, filtered, nextOptions);
      }
      const oldTable = root.querySelector('.rgdh-detail-table');
      if (oldTable) {
        const wasVisible = !oldTable.hidden;
        const replacement = createDetailTable(filtered);
        replacement.hidden = !wasVisible;
        oldTable.replaceWith(replacement);
        applyVoltageVisibility(root, nextOptions.showVoltage !== false);
      }
      const oldHeatmap = root.querySelector('.rgdh-chart-card');
      if (oldHeatmap) {
        oldHeatmap.replaceWith(createChartPanel('24 saat Sonuçlar', renderHeatmap(selectPivotRowsForReport(pivotRows || [], nextOptions), nextOptions)));
      }
    };

    btnQuery.addEventListener('click', applyFilters);
    btnFs.addEventListener('click', () => {
      const wrap = root.querySelector('.rgdh-chart-wrap');
      if (wrap?.requestFullscreen) wrap.requestFullscreen();
    });

    return toolbar;
  }

  function selectRowsForReport(rows, options = {}) {
    const sorted = (rows || []).slice().sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    const busbarId = options.busbarId;
    let selected = sorted;
    if (busbarId !== undefined && busbarId !== null && busbarId !== '') {
      selected = selected.filter((row) => String(row.busbarId) === String(busbarId));
    } else {
      const first = sorted.find((row) => row.busbarId !== null && row.busbarId !== undefined);
      selected = first ? sorted.filter((row) => String(row.busbarId) === String(first.busbarId)) : sorted;
    }
    const selectedDate = resolveReportDate(selected, options);
    if (selectedDate) selected = selected.filter((row) => row.localDate === selectedDate);
    if (options.hour !== undefined && options.hour !== null && options.hour !== '') {
      selected = selected.filter((row) => Number(row.localHour) === Number(options.hour));
    }
    return selected;
  }

  function resolveReportDate(rows, options = {}) {
    const sorted = (rows || []).slice().sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    if (options.date && sorted.some((row) => row.localDate === options.date)) return options.date;
    return sorted.find((row) => row.localDate)?.localDate || options.date || '';
  }

  function selectPivotRowsForReport(pivotRows, options = {}) {
    let selected = (pivotRows || []).slice().sort((a, b) => String(a.localDate).localeCompare(String(b.localDate)));
    if (options.busbarId !== undefined && options.busbarId !== null && options.busbarId !== '') {
      selected = selected.filter((row) => String(row.busbarId) === String(options.busbarId));
    }
    const date = options.date || selected.find((row) => row.localDate)?.localDate || '';
    if (date) selected = selected.filter((row) => row.localDate === date);
    return selected;
  }

  function renderMainChart(canvas, rows, options = {}) {
    if (!canvas || !rows.length) return;
    const ctx = canvas.getContext('2d');
    const theme = chartTheme(canvas);

    const hasMultipleDates = new Set(rows.map((r) => r.localDate).filter(Boolean)).size > 1;
    const labels = rows.map((r) => {
      const local = r.measurementDateLocal || '';
      return hasMultipleDates ? local.slice(0, 16).replace('T', ' ') : (local.slice(11, 16) || local);
    });

    const datasets = buildChartDatasets(rows, options, theme);
    const showVoltageAxis = datasets.some((dataset) => dataset.yAxisID === 'y1');

    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: theme.text } },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.text,
            bodyColor: theme.text,
            borderColor: theme.grid,
            borderWidth: 1
          }
        },
        scales: {
          x: { ticks: { color: theme.muted }, grid: { color: theme.grid } },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'MW / MVAr', color: theme.text }, ticks: { color: theme.muted }, grid: { color: theme.grid } },
          y1: { type: 'linear', display: showVoltageAxis, position: 'right', title: { display: showVoltageAxis, text: 'kV', color: theme.text }, ticks: { color: theme.muted }, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  function buildChartDatasets(rows, options = {}, colors = {}) {
    const sourceRows = rows || [];
    const showVoltage = options.showVoltage !== false;
    const palette = {
      activePower: colors.activePower || '#111827',
      reactivePower: colors.reactivePower || '#facc15',
      mvarLimitDi: colors.mvarLimitDi || '#14b8a6',
      mvarLimitAi: colors.mvarLimitAi || '#f97316',
      auxiliaryMw: colors.auxiliaryMw || '#eab308',
      auxiliaryMvar: colors.auxiliaryMvar || '#a855f7',
      auxiliaryLimitDi: colors.auxiliaryLimitDi || '#06b6d4',
      auxiliaryLimitAi: colors.auxiliaryLimitAi || '#ec4899',
      voltage1: colors.voltage1 || '#2563eb',
      voltage2: colors.voltage2 || '#60a5fa',
      voltage3: colors.voltage3 || '#93c5fd',
      voltageSet: colors.voltageSet || '#1d4ed8',
      voltageBand: colors.voltageBand || '#38bdf8',
      liveVoltage: colors.liveVoltage || '#ef4444',
      upperLimit: colors.upperLimit || '#7f1d1d',
      lowerLimit: colors.lowerLimit || '#15803d'
    };

    const datasets = [
      { label: 'Q Reaktif Güç (MVAr)', data: sourceRows.map((r) => r.qgenMvar), borderColor: palette.reactivePower, backgroundColor: palette.reactivePower, yAxisID: 'y', tension: 0.3, pointRadius: 1 },
      { label: 'D.I. MVAr Limit', data: sourceRows.map((r) => r.diMvarLimit), borderColor: palette.mvarLimitDi, backgroundColor: palette.mvarLimitDi, yAxisID: 'y', tension: 0.2, pointRadius: 0, borderDash: [4, 3] },
      { label: 'A.I. MVAr Limit', data: sourceRows.map((r) => r.aiMvarLimit), borderColor: palette.mvarLimitAi, backgroundColor: palette.mvarLimitAi, yAxisID: 'y', tension: 0.2, pointRadius: 0, borderDash: [4, 3] },
      { label: 'Yardimci Kaynak MW', data: sourceRows.map((r) => r.auxiliaryMw), borderColor: palette.auxiliaryMw, backgroundColor: palette.auxiliaryMw, yAxisID: 'y', tension: 0.3, pointRadius: 1 },
      { label: 'Yardimci Kaynak MVAr', data: sourceRows.map((r) => r.auxiliaryMvar), borderColor: palette.auxiliaryMvar, backgroundColor: palette.auxiliaryMvar, yAxisID: 'y', tension: 0.3, pointRadius: 1 },
      { label: 'Yardimci Kaynak D.I. Limit', data: sourceRows.map((r) => r.auxiliaryDiMvarLimit), borderColor: palette.auxiliaryLimitDi, backgroundColor: palette.auxiliaryLimitDi, yAxisID: 'y', tension: 0.2, pointRadius: 0, borderDash: [3, 3] },
      { label: 'Yardimci Kaynak A.I. Limit', data: sourceRows.map((r) => r.auxiliaryAiMvarLimit), borderColor: palette.auxiliaryLimitAi, backgroundColor: palette.auxiliaryLimitAi, yAxisID: 'y', tension: 0.2, pointRadius: 0, borderDash: [3, 3] },
      { label: 'P Aktif Güç (MW)', data: sourceRows.map((r) => r.pgenMw), borderColor: palette.activePower, backgroundColor: palette.activePower, yAxisID: 'y', tension: 0.3, pointRadius: 1 },
      { label: 'TPYS Set Gerilim (kV)', data: sourceRows.map((r) => r.tpysVoltageSet), borderColor: palette.voltageSet, backgroundColor: palette.voltageSet, yAxisID: 'y1', tension: 0.25, pointRadius: 0, borderDash: [6, 4], hidden: true },
      { label: 'Canlı Bara', data: sourceRows.map((r) => r.liveBusbarVoltage), borderColor: palette.liveVoltage, backgroundColor: palette.liveVoltage, yAxisID: 'y1', tension: 0.3, pointRadius: 1, borderDash: [5, 5] },
      { label: 'Bara Set Üst Limiti', data: sourceRows.map((r) => r.busbarUpperLimit), borderColor: palette.upperLimit, backgroundColor: palette.upperLimit, yAxisID: 'y1', tension: 0.3, pointRadius: 1, borderDash: [2, 2] },
      { label: 'Bara Set Alt Limiti', data: sourceRows.map((r) => r.busbarLowerLimit), borderColor: palette.lowerLimit, backgroundColor: palette.lowerLimit, yAxisID: 'y1', tension: 0.3, pointRadius: 1, borderDash: [2, 2] }
    ];

    if (showVoltage) {
      datasets.push(
        { label: 'Bara 1 kV', data: sourceRows.map((r) => r.busbar1Voltage), borderColor: palette.voltage1, backgroundColor: palette.voltage1, yAxisID: 'y1', tension: 0.3, pointRadius: 1 },
        { label: 'Bara 2 kV', data: sourceRows.map((r) => r.busbar2Voltage), borderColor: palette.voltage2, backgroundColor: palette.voltage2, yAxisID: 'y1', tension: 0.3, pointRadius: 1 },
        { label: 'Bara 3 kV', data: sourceRows.map((r) => r.busbar3Voltage), borderColor: palette.voltage3, backgroundColor: palette.voltage3, yAxisID: 'y1', tension: 0.3, pointRadius: 1 }
      );
    }

    if (sourceRows.some(isConventionalRow)) {
      datasets.push(
        { label: 'TPYS Set +%1,5', data: sourceRows.map((r) => calculateVoltageBand(r.tpysVoltageSet, 1.015)), borderColor: palette.voltageBand, backgroundColor: palette.voltageBand, yAxisID: 'y1', tension: 0.1, pointRadius: 0, borderDash: [4, 4], hidden: true },
        { label: 'TPYS Set -%1,5', data: sourceRows.map((r) => calculateVoltageBand(r.tpysVoltageSet, 0.985)), borderColor: palette.voltageBand, backgroundColor: palette.voltageBand, yAxisID: 'y1', tension: 0.1, pointRadius: 0, borderDash: [4, 4], hidden: true }
      );
    }

    return datasets.filter(hasDatasetValues);
  }

  function hasDatasetValues(dataset) {
    return (dataset.data || []).some((value) => value !== null && value !== undefined && value !== '');
  }

  function isConventionalRow(row) {
    const type = String(row?.sourceType || row?.busbarType || '').toUpperCase();
    return type !== 'WIND' && type !== 'RESGES' && type !== 'RES/GES';
  }

  function calculateVoltageBand(value, factor) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Number((numeric * factor).toFixed(6)) : null;
  }

  function createDetailTable(rows) {
    const container = document.createElement('div');
    container.className = 'rgdh-detail-table';
    const headers = [
      { text: 'Tarih', cls: '' },
      { text: 'Ölçüm Zamanı', cls: '' },
      { text: 'Pmkud', cls: '' },
      { text: 'TPYS Set', cls: '' },
      { text: 'Canlı Bara', cls: '' },
      { text: 'Bara 1(kV)', cls: 'rgdh-voltage-col' },
      { text: 'Bara 1 Kalite', cls: 'rgdh-voltage-col' },
      { text: 'Bara 2(kV)', cls: 'rgdh-voltage-col' },
      { text: 'Bara 2 Kalite', cls: 'rgdh-voltage-col' },
      { text: 'Bara 3(kV)', cls: 'rgdh-voltage-col' },
      { text: 'Bara 3 Kalite', cls: 'rgdh-voltage-col' },
      { text: 'Toplam Pgen Aktif (MW)', cls: '' },
      { text: 'Toplam Qgen Reaktif (MVAr)', cls: '' },
      { text: 'Yardimci Kaynak MW', cls: '' },
      { text: 'Yardimci Kaynak MVAr', cls: '' },
      { text: 'Yardimci D.I. MVAr Limit', cls: '' },
      { text: 'Yardimci A.I. MVAr Limit', cls: '' },
      { text: 'Total D.I. MVAr Limit', cls: '' },
      { text: 'Total A.I. MVAr Limit', cls: '' },
      { text: 'Devre Durumu', cls: '' },
      { text: 'Yükümlülük Durumu', cls: '' },
      { text: 'Ana Kaynak Onay Durumu', cls: '' }
    ];
    const table = document.createElement('table');
    table.className = 'rgdh-table compact';
    table.innerHTML = `<thead><tr>${headers.map((h) => `<th class="${h.cls}">${h.text}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    const cols = ['', '', '', '', '', 'rgdh-voltage-col', 'rgdh-voltage-col', 'rgdh-voltage-col', 'rgdh-voltage-col', 'rgdh-voltage-col', 'rgdh-voltage-col', '', '', '', '', '', '', '', '', '', '', ''];
    rows.slice(0, 500).forEach((row) => {
      const tr = document.createElement('tr');
      const values = [
        escapeHtml(row.localDate || '-'),
        escapeHtml(row.measurementDateLocal || '-'),
        formatNumber(row.pmkudMw),
        formatNumber(row.tpysVoltageSet),
        formatNumber(row.liveBusbarVoltage),
        formatNumber(row.busbar1Voltage),
        escapeHtml(row.busbar1Quality || '-'),
        formatNumber(row.busbar2Voltage),
        escapeHtml(row.busbar2Quality || '-'),
        formatNumber(row.busbar3Voltage),
        escapeHtml(row.busbar3Quality || '-'),
        formatNumber(row.pgenMw),
        formatNumber(row.qgenMvar),
        formatNumber(row.auxiliaryMw),
        formatNumber(row.auxiliaryMvar),
        formatNumber(row.auxiliaryDiMvarLimit),
        formatNumber(row.auxiliaryAiMvarLimit),
        formatNumber(row.diMvarLimit),
        formatNumber(row.aiMvarLimit),
        escapeHtml(row.offBoardStatus ?? '-'),
        escapeHtml(row.noObligationStatus ?? '-'),
        badge(row.approvalStatus === 1 ? 'OK' : (row.approvalStatus === 0 ? 'FAIL' : 'NO_DATA'))
      ];
      tr.innerHTML = values.map((v, i) => `<td class="${cols[i]}">${v}</td>`).join('');
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  function createChartPanel(title, content) {
    const panel = document.createElement('section');
    panel.className = 'rgdh-chart-card';
    const heading = document.createElement('h3');
    heading.textContent = title;
    panel.appendChild(heading);
    panel.appendChild(content);
    return panel;
  }

  function renderHeatmap(pivotRows, options = {}) {
    const shell = document.createElement('div');
    shell.className = 'rgdh-heatmap';
    if (!pivotRows.length) {
      shell.textContent = 'Veri yok';
      return shell;
    }
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Tarih</th><th>Bara</th>${Array.from({ length: 24 }, (_, hour) => `<th>${String(hour).padStart(2, '0')}</th>`).join('')}</tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    pivotRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th>${escapeHtml(row.localDate || '-')}</th><td>${escapeHtml(row.busbarName || row.busbarId || '-')}</td>`;
      row.hours.forEach((hour) => {
        const td = document.createElement('td');
        td.className = participationClass(hour);
        td.dataset.busbarId = row.busbarId || '';
        td.dataset.date = row.localDate || '';
        td.dataset.hour = String(hour.hour);
        td.tabIndex = 0;
        td.textContent = hour.minuteCount ? formatPercent(hour.participationPct) : '-';
        td.title = [
          `${String(hour.hour).padStart(2, '0')}:00`,
          `Katılım ${formatPercent(hour.participationPct)}`,
          `Set ${formatNumber(hour.setAvg)}`,
          `Gerilim ${formatNumber(hour.voltageAvg)}`,
          `P ${formatNumber(hour.pgenAvg)}`,
          `Q ${formatNumber(hour.qgenAvg)}`,
          `${hour.successMinuteCount}/${hour.expectedMinuteCount} basarili`
        ].join(' | ');
        const selectHour = () => {
          if (typeof options.onHourSelect === 'function') {
            options.onHourSelect({ busbarId: row.busbarId, date: row.localDate || '', hour: hour.hour });
          }
        };
        td.addEventListener('click', selectHour);
        td.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectHour();
          }
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    shell.appendChild(table);
    return shell;
  }

  function isToggleableVoltageDataset(label) {
    return /Bara [123] kV/i.test(String(label || ''));
  }

  function participationClass(hour) {
    if (!hour || !Number(hour.minuteCount) || !Number.isFinite(Number(hour.participationPct))) {
      return 'participation-empty';
    }
    return Number(hour.participationPct) >= 80 ? 'participation-ok' : 'participation-fail';
  }

  function chartTheme(node) {
    const styles = node?.ownerDocument?.defaultView?.getComputedStyle
      ? node.ownerDocument.defaultView.getComputedStyle(node.ownerDocument.documentElement)
      : null;
    const read = (name, fallback) => String(styles?.getPropertyValue(name) || fallback).trim();
    return {
      text: read('--chart-text', '#1f2937'),
      muted: read('--chart-muted', '#64748b'),
      grid: read('--chart-grid', '#d8dee6'),
      tooltipBg: read('--chart-tooltip-bg', '#111827'),
      activePower: read('--chart-active-power', '#111827'),
      reactivePower: read('--chart-reactive-power', '#facc15'),
      mvarLimitDi: read('--chart-mvar-limit-di', '#14b8a6'),
      mvarLimitAi: read('--chart-mvar-limit-ai', '#f97316'),
      auxiliaryMw: read('--chart-aux-mw', '#eab308'),
      auxiliaryMvar: read('--chart-aux-mvar', '#a855f7'),
      auxiliaryLimitDi: read('--chart-aux-limit-di', '#06b6d4'),
      auxiliaryLimitAi: read('--chart-aux-limit-ai', '#ec4899'),
      voltage1: read('--chart-voltage-1', '#2563eb'),
      voltage2: read('--chart-voltage-2', '#60a5fa'),
      voltage3: read('--chart-voltage-3', '#93c5fd'),
      voltageSet: read('--chart-voltage-set', '#1d4ed8'),
      voltageBand: read('--chart-voltage-band', '#38bdf8'),
      liveVoltage: read('--chart-live-voltage', '#ef4444'),
      upperLimit: read('--chart-upper-limit', '#7f1d1d'),
      lowerLimit: read('--chart-lower-limit', '#15803d')
    };
  }

  function applyVoltageVisibility(root, showVoltage) {
    root.querySelectorAll('.rgdh-voltage-col').forEach((cell) => {
      cell.classList.toggle('hidden-voltage', !showVoltage);
    });
  }

  function formatNumber(value) {
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : '-';
  }

  function formatPercent(value) {
    return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%` : '-';
  }

  function badge(text) {
    return `<span class="badge ${escapeHtml(text)}">${escapeHtml(text)}</span>`;
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

  return {
    STATUS_COLORS,
    buildChartDatasets,
    renderReport,
    selectRowsForReport,
    renderHeatmap
  };
});
