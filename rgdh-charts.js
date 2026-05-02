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
    OFF: '#94a3b8',
    SAGLADI: '#22c55e',
    SAGLAMADI: '#ef4444',
    DD: '#94a3b8',
    YY: '#f59e0b',
    KY: '#64748b'
  };
  const TPYS_SET_LEGEND_GROUP = 'tpys-set-voltage';
  const PARTICIPATION_OK_THRESHOLD_PCT = 80;

  function renderReport(root, rows, pivotRows, options = {}) {
    if (!root) return;
    root.innerHTML = '';
    const effectiveOptions = { ...options, date: resolveReportDate(rows, options) };

    const toolbar = createChartToolbarV2(rows, pivotRows, effectiveOptions, root);
    root.appendChild(toolbar);

    const selectedRows = selectRowsForReport(rows, effectiveOptions);
    const topCanvas = appendChartCanvas(root, 'Gerilim ve Aktif Guc', 'rgdh-top-chart', 320);
    const reactiveCanvas = appendChartCanvas(root, 'Reaktif Guc ve Limitler', 'rgdh-reactive-chart', 320);
    renderVoltageActiveChart(topCanvas, selectedRows, effectiveOptions);
    renderReactiveChart(reactiveCanvas, selectedRows, effectiveOptions);

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

    const heatmapRows = selectPivotRowsForReport(pivotRows || [], effectiveOptions);
    const heatmapPanel = createChartPanel('24 saat Sonuçlar', renderHeatmap(heatmapRows, effectiveOptions), 'rgdh-heatmap-panel');
    const metricToggle = document.createElement('button');
    metricToggle.type = 'button';
    metricToggle.textContent = 'Detayli Metrik Goster';
    const metricTable = createHourMetricTable(heatmapRows);
    metricTable.hidden = true;
    metricToggle.addEventListener('click', () => {
      metricTable.hidden = !metricTable.hidden;
      metricToggle.textContent = metricTable.hidden ? 'Detayli Metrik Goster' : 'Detayli Metrik Gizle';
    });
    const metricActions = document.createElement('div');
    metricActions.className = 'rgdh-detail-toggle-row';
    metricActions.appendChild(metricToggle);
    heatmapPanel.appendChild(metricActions);
    heatmapPanel.appendChild(metricTable);
    root.appendChild(heatmapPanel);
  }

  function appendChartCanvas(root, title, className, height = 320, options = {}) {
    const panel = document.createElement('section');
    panel.className = 'rgdh-chart-card';
    const head = document.createElement('div');
    head.className = 'rgdh-chart-card-head';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const actions = document.createElement('div');
    actions.className = 'rgdh-chart-actions';
    actions.innerHTML = [
      options.diffToggle ? '<button class="rgdh-chart-action" type="button" data-chart-action="diff" aria-pressed="false" title="Fark cizgisi modunu ac/kapat">Fark</button>' : '',
      '<button class="rgdh-chart-action" type="button" data-chart-action="download-png" title="Grafik PNG disari aktar">PNG</button>',
      '<button class="rgdh-chart-action" type="button" data-chart-action="fullscreen" title="Grafik kartini tam ekran yap">Tam</button>'
    ].join('');
    const chartWrap = document.createElement('div');
    chartWrap.className = 'rgdh-chart-wrap';
    chartWrap.style.position = 'relative';
    chartWrap.style.height = `${height}px`;
    chartWrap.style.marginBottom = '0';
    const canvas = document.createElement('canvas');
    canvas.className = className;
    chartWrap.appendChild(canvas);
    actions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chart-action]');
      if (!button) return;
      const action = button.dataset.chartAction;
      if (action === 'fullscreen') {
        if (panel.requestFullscreen) panel.requestFullscreen();
      } else if (action === 'download-png') {
        downloadChartPng(canvas, title);
      } else if (action === 'diff') {
        toggleChartDiffMode(canvas, button);
      }
    });
    head.appendChild(heading);
    head.appendChild(actions);
    panel.appendChild(head);
    panel.appendChild(chartWrap);
    root.appendChild(panel);
    return canvas;
  }

  function downloadChartPng(canvas, title) {
    if (!canvas?.toDataURL || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.download = `${sanitizeFilename(title || 'grafik')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function sanitizeFilename(value) {
    const normalized = String(value || 'grafik')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_');
    return normalized || 'grafik';
  }

  function toggleChartDiffMode(canvas, button) {
    if (typeof Chart === 'undefined' || !canvas) return;
    const chart = Chart.getChart(canvas);
    if (!chart) return;
    const datasets = chart.data?.datasets || [];
    const diffIndexes = [];
    const sourceIndexes = [];
    datasets.forEach((dataset, index) => {
      if (dataset.rgdhDiffDataset) diffIndexes.push(index);
      if (dataset.rgdhDiffSource) sourceIndexes.push(index);
    });
    if (!diffIndexes.length) return;
    const enableDiff = !diffIndexes.some((index) => chart.isDatasetVisible(index));
    diffIndexes.forEach((index) => chart.setDatasetVisibility(index, enableDiff));
    sourceIndexes.forEach((index) => chart.setDatasetVisibility(index, !enableDiff));
    if (button) {
      button.classList.toggle('active', enableDiff);
      button.setAttribute('aria-pressed', String(enableDiff));
    }
    chart.update();
  }

  function createChartToolbarV2(rows, pivotRows, options, root) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rgdh-chart-toolbar yks-card';

    const busbarIds = [...new Set((rows || []).map((r) => r.busbarId).filter((v) => v !== null && v !== undefined))];
    const busbarOptions = busbarIds.map((id) => {
      const row = rows.find((r) => String(r.busbarId) === String(id));
      return { value: String(id), label: row?.busbarName || String(id) };
    });
    const ytmValues = [...new Set((rows || []).map((r) => r.ytm).filter(Boolean))];
    const hourOptions = Array.from({ length: 24 }, (_, hour) => `<option value="${hour}">${String(hour).padStart(2, '0')}</option>`).join('');
    const calculationMode = normalizeCalculationMode(options.calculationMode);
    const ekcDisabled = options.hasEkcCalculation === false ? ' disabled' : '';

    toolbar.innerHTML = `
      <label class="rgdh-chart-field rgdh-chart-field-busbar">Bara <select id="chartBusbarSelect" class="rgdh-select"><option value="">Tumu</option>${busbarOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-ytm">BYTM <select id="chartYtmSelect" class="rgdh-select"><option value="">Tumu</option>${ytmValues.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-date">Tarih <input id="chartDate" type="date" class="rgdh-input"></label>
      <label class="rgdh-chart-field rgdh-chart-field-calc">Hesaplama <select id="chartCalculationMode" class="rgdh-select"><option value="YKS">YKS Hesaplama</option><option value="EKC"${ekcDisabled}>Ek-C Hesaplama</option></select></label>
      <label class="rgdh-chart-field rgdh-chart-field-mode">Saat Modu <select id="chartHourMode" class="rgdh-select"><option value="all">Tum gun</option><option value="hours">Saatler</option></select></label>
      <label class="rgdh-chart-field rgdh-chart-field-hour">Baslangic Saat <select id="chartHourStart" class="rgdh-select">${hourOptions}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-hour">Bitis Saat <select id="chartHourEnd" class="rgdh-select">${hourOptions}</select></label>
      <label class="rgdh-chart-field rgdh-chart-range-control">Saat Kaydir <span class="rgdh-hour-slider-row"><button id="chartHourDown" type="button" title="Saat araligini geri al">-</button><input id="chartHourSlider" type="range" min="0" max="23" value="0"><button id="chartHourUp" type="button" title="Saat araligini ileri al">+</button></span></label>
      <button id="btnChartQuery" class="primary" type="button">Sorgula</button>
    `;

    const selectBusbar = toolbar.querySelector('#chartBusbarSelect');
    const selectYtm = toolbar.querySelector('#chartYtmSelect');
    const inputDate = toolbar.querySelector('#chartDate');
    const selectCalculationMode = toolbar.querySelector('#chartCalculationMode');
    const hourMode = toolbar.querySelector('#chartHourMode');
    const hourSlider = toolbar.querySelector('#chartHourSlider');
    const hourStart = toolbar.querySelector('#chartHourStart');
    const hourEnd = toolbar.querySelector('#chartHourEnd');
    const hourDown = toolbar.querySelector('#chartHourDown');
    const hourUp = toolbar.querySelector('#chartHourUp');
    const btnQuery = toolbar.querySelector('#btnChartQuery');

    if (options.busbarId) selectBusbar.value = String(options.busbarId);
    if (options.date) inputDate.value = options.date;
    if (selectCalculationMode) selectCalculationMode.value = calculationMode;
    const writeHourControls = (input) => {
      const normalized = normalizeHourRangeFilter(input);
      const start = normalized.hourStart ?? 0;
      const end = normalized.hourEnd ?? 23;
      const width = Math.max(0, end - start);
      hourMode.value = normalized.mode;
      hourStart.value = String(start);
      hourEnd.value = String(end);
      hourSlider.min = '0';
      hourSlider.max = String(Math.max(0, 23 - width));
      hourSlider.value = String(Math.min(start, Number(hourSlider.max)));
      const disabled = normalized.mode === 'all';
      [hourStart, hourEnd, hourSlider, hourDown, hourUp].forEach((control) => {
        control.disabled = disabled;
      });
      return normalized;
    };

    writeHourControls({
      mode: options.hourMode || (hasHourRangeSelection(options) ? 'hours' : 'all'),
      hour: options.hour,
      hourStart: options.hourStart,
      hourEnd: options.hourEnd
    });

    hourMode.addEventListener('change', () => {
      writeHourControls({ mode: hourMode.value, hourStart: hourStart.value, hourEnd: hourEnd.value });
    });
    hourStart.addEventListener('change', () => {
      const start = clampHour(hourStart.value);
      const end = Math.max(start, clampHour(hourEnd.value));
      writeHourControls({ mode: 'hours', hourStart: start, hourEnd: end });
    });
    hourEnd.addEventListener('change', () => {
      const end = clampHour(hourEnd.value);
      const start = Math.min(clampHour(hourStart.value), end);
      writeHourControls({ mode: 'hours', hourStart: start, hourEnd: end });
    });
    hourSlider.addEventListener('input', () => {
      const current = normalizeHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value });
      const width = current.hourEnd - current.hourStart;
      const nextStart = Math.max(0, Math.min(23 - width, clampHour(hourSlider.value)));
      writeHourControls({ mode: 'hours', hourStart: nextStart, hourEnd: nextStart + width });
    });
    hourDown.addEventListener('click', () => {
      writeHourControls(shiftHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value }, -1));
    });
    hourUp.addEventListener('click', () => {
      writeHourControls(shiftHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value }, 1));
    });
    selectCalculationMode?.addEventListener('change', () => {
      const nextMode = normalizeCalculationMode(selectCalculationMode.value);
      if (typeof options.onCalculationModeChange === 'function') {
        options.onCalculationModeChange(nextMode);
      }
    });

    const applyFilters = () => {
      const busbarId = selectBusbar.value;
      const ytm = selectYtm.value;
      const date = inputDate.value;
      const nextCalculationMode = normalizeCalculationMode(selectCalculationMode?.value || calculationMode);
      const hourFilter = normalizeHourRangeFilter({ mode: hourMode.value, hourStart: hourStart.value, hourEnd: hourEnd.value });

      let filtered = rows;
      if (busbarId) filtered = filtered.filter((r) => String(r.busbarId) === busbarId);
      if (ytm) filtered = filtered.filter((r) => r.ytm === ytm);
      if (date) filtered = filtered.filter((r) => r.localDate === date);
      if (!date) {
        const fallbackDate = resolveReportDate(filtered, options);
        if (fallbackDate) filtered = filtered.filter((r) => r.localDate === fallbackDate);
      }
      if (hourFilter.mode === 'hours') {
        filtered = filtered.filter((r) => Number(r.localHour) >= hourFilter.hourStart && Number(r.localHour) <= hourFilter.hourEnd);
      }

      const nextOptions = { ...options, busbarId, date, calculationMode: nextCalculationMode, hourMode: hourFilter.mode, hourStart: hourFilter.hourStart, hourEnd: hourFilter.hourEnd, hour: hourFilter.hour };
      root.querySelectorAll('canvas').forEach((canvas) => {
        const chart = Chart.getChart(canvas);
        if (chart) chart.destroy();
      });
      const topCanvas = root.querySelector('.rgdh-top-chart');
      const reactiveCanvas = root.querySelector('.rgdh-reactive-chart');
      if (topCanvas) renderVoltageActiveChart(topCanvas, filtered, nextOptions);
      if (reactiveCanvas) renderReactiveChart(reactiveCanvas, filtered, nextOptions);
      const oldTable = root.querySelector('.rgdh-detail-table');
      if (oldTable) {
        const wasVisible = !oldTable.hidden;
        const replacement = createDetailTable(filtered);
        replacement.hidden = !wasVisible;
        oldTable.replaceWith(replacement);
        applyVoltageVisibility(root, nextOptions.showVoltage !== false);
      }
      const oldHeatmap = root.querySelector('.rgdh-heatmap-panel') || [...root.querySelectorAll('.rgdh-chart-card')].pop();
      if (oldHeatmap) {
        oldHeatmap.replaceWith(createHeatmapPanel(selectPivotRowsForReport(pivotRows || [], nextOptions), nextOptions));
      }
    };

    btnQuery.addEventListener('click', applyFilters);

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
    const hourFilter = normalizeHourRangeFilter({
      mode: options.hourMode || options.mode,
      hour: options.hour,
      hourStart: options.hourStart,
      hourEnd: options.hourEnd
    });
    if (hourFilter.mode === 'hours') {
      selected = selected.filter((row) => {
        const hour = Number(row.localHour);
        return hour >= hourFilter.hourStart && hour <= hourFilter.hourEnd;
      });
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
    renderMixedChart(canvas, rows, buildChartDatasets(rows, options, chartTheme(canvas)), options, 'MW / MVAr', true);
  }

  function renderVoltageActiveChart(canvas, rows, options = {}) {
    const theme = chartTheme(canvas);
    renderMixedChart(canvas, rows, buildVoltageActiveDatasets(rows, options, theme), options, 'MW', true);
  }

  function renderReactiveChart(canvas, rows, options = {}) {
    const theme = chartTheme(canvas);
    renderMixedChart(canvas, rows, buildReactiveDatasets(rows, options, theme), options, 'MVAr', false);
  }

  function renderMixedChart(canvas, rows, datasets, options = {}, leftTitle = 'MW / MVAr', allowVoltageAxis = true) {
    if (!canvas || !rows.length) return;
    const ctx = canvas.getContext('2d');
    const theme = chartTheme(canvas);

    const hasMultipleDates = new Set(rows.map((r) => r.localDate).filter(Boolean)).size > 1;
    const labels = rows.map((r) => {
      const local = r.measurementDateLocal || '';
      return hasMultipleDates ? local.slice(0, 16).replace('T', ' ') : (local.slice(11, 16) || local);
    });

    const showVoltageAxis = allowVoltageAxis && datasets.some((dataset) => dataset.yAxisID === 'y1');

    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: theme.text,
              filter: (legendItem, chartData) => !chartData.datasets?.[legendItem.datasetIndex]?.rgdhLegendHidden
            },
            onClick: function (event, legendItem, legend) {
              const chart = legend.chart;
              const dataset = chart.data.datasets[legendItem.datasetIndex];
              if (dataset?.rgdhLegendGroup) {
                const indexes = chart.data.datasets
                  .map((item, index) => item?.rgdhLegendGroup === dataset.rgdhLegendGroup ? index : -1)
                  .filter((index) => index >= 0);
                const nextVisible = !indexes.some((index) => chart.isDatasetVisible(index));
                indexes.forEach((index) => chart.setDatasetVisibility(index, nextVisible));
                chart.update();
                return;
              }
              if (typeof Chart !== 'undefined' && typeof Chart.defaults?.plugins?.legend?.onClick === 'function') {
                Chart.defaults.plugins.legend.onClick.call(this, event, legendItem, legend);
                return;
              }
              chart.setDatasetVisibility(legendItem.datasetIndex, !chart.isDatasetVisible(legendItem.datasetIndex));
              chart.update();
            }
          },
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
          y: integerLinearScale(leftTitle, theme.muted, theme.grid, {
            title: { color: theme.text }
          }),
          y1: integerLinearScale('kV', theme.voltageAxis, theme.grid, {
            display: showVoltageAxis,
            position: 'right',
            title: { display: showVoltageAxis },
            grid: { drawOnChartArea: false }
          })
        }
      }
    });
  }

  function integerLinearScale(titleText, tickColor, gridColor, overrides = {}) {
    const base = {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: titleText, color: tickColor },
      ticks: {
        color: tickColor,
        precision: 0,
        callback: integerTickLabel
      },
      grid: {
        color: integerGridColor(gridColor)
      }
    };
    return {
      ...base,
      ...overrides,
      title: { ...base.title, ...(overrides.title || {}) },
      ticks: { ...base.ticks, ...(overrides.ticks || {}) },
      grid: { ...base.grid, ...(overrides.grid || {}) }
    };
  }

  function integerTickLabel(value) {
    const numeric = Number(value);
    return Number.isInteger(numeric) ? numeric.toLocaleString('tr-TR') : '';
  }

  function integerGridColor(gridColor) {
    return (context) => {
      const value = Number(context?.tick?.value);
      return Number.isInteger(value) ? gridColor : 'rgba(0,0,0,0)';
    };
  }

  function buildVoltageActiveDatasets(rows, options = {}, colors = {}) {
    const sourceRows = rows || [];
    const showVoltage = options.showVoltage !== false;
    const palette = {
      activePower: colors.activePower || '#111827',
      auxiliaryMw: colors.auxiliaryMw || '#eab308',
      pnom: '#334155',
      mkud: '#7c3aed',
      minMkud: '#0891b2',
      voltage1: colors.voltage1 || '#2563eb',
      voltage2: colors.voltage2 || '#60a5fa',
      voltage3: colors.voltage3 || '#93c5fd',
      voltageSet: colors.voltageSet || '#7dd3fc',
      voltageBand: colors.voltageBand || '#38bdf8',
      liveVoltage: colors.liveVoltage || '#1e40af',
      upperLimit: colors.upperLimit || '#7f1d1d',
      lowerLimit: colors.lowerLimit || '#15803d'
    };
    const datasets = [
      lineDataset('P Aktif Guc (MW)', sourceRows.map((r) => r.pgenMw), palette.activePower, 'y'),
      lineDataset('Yardimci Kaynak MW', sourceRows.map((r) => r.auxiliaryMw), palette.auxiliaryMw, 'y'),
      lineDataset('Pnom', sourceRows.map((r) => r.pnomMw), palette.pnom, 'y', { borderDash: [6, 4], pointRadius: 0 }),
      lineDataset('MKUD', sourceRows.map((r) => r.pmkudMw), palette.mkud, 'y', { borderDash: [4, 4], pointRadius: 0 }),
      lineDataset('Min MKUD', sourceRows.map((r) => r.minMkudMw), palette.minMkud, 'y', { borderDash: [3, 4], pointRadius: 0 }),
      lineDataset('TPYS Set Gerilim', sourceRows.map((r) => r.tpysVoltageSet), palette.voltageSet, 'y1', { pointRadius: 0, borderWidth: 2, rgdhLegendGroup: TPYS_SET_LEGEND_GROUP, rgdhLegendLeader: true }),
      lineDataset('Canli Bara', sourceRows.map((r) => r.liveBusbarVoltage), palette.liveVoltage, 'y1', { pointRadius: 1, borderWidth: 2 }),
      lineDataset('Bara Set Ust Limiti', sourceRows.map((r) => r.busbarUpperLimit), palette.upperLimit, 'y1', { borderDash: [2, 2], pointRadius: 0 }),
      lineDataset('Bara Set Alt Limiti', sourceRows.map((r) => r.busbarLowerLimit), palette.lowerLimit, 'y1', { borderDash: [2, 2], pointRadius: 0 })
    ];
    if (sourceRows.some(isConventionalRow)) {
      datasets.push(
        lineDataset('TPYS Set +%1,5', sourceRows.map((r) => calculateVoltageBand(r.tpysVoltageSet, 1.015)), palette.voltageBand, 'y1', { borderDash: [4, 4], pointRadius: 0, borderWidth: 1, rgdhLegendGroup: TPYS_SET_LEGEND_GROUP, rgdhLegendHidden: true }),
        lineDataset('TPYS Set -%1,5', sourceRows.map((r) => calculateVoltageBand(r.tpysVoltageSet, 0.985)), palette.voltageBand, 'y1', { borderDash: [4, 4], pointRadius: 0, borderWidth: 1, rgdhLegendGroup: TPYS_SET_LEGEND_GROUP, rgdhLegendHidden: true })
      );
    }
    if (showVoltage) {
      datasets.push(
        lineDataset('Bara 1 kV', sourceRows.map((r) => r.busbar1Voltage), palette.voltage1, 'y1'),
        lineDataset('Bara 2 kV', sourceRows.map((r) => r.busbar2Voltage), palette.voltage2, 'y1'),
        lineDataset('Bara 3 kV', sourceRows.map((r) => r.busbar3Voltage), palette.voltage3, 'y1')
      );
    }
    return datasets.filter(hasDatasetValues);
  }

  function buildReactiveDatasets(rows, options = {}, colors = {}) {
    const sourceRows = rows || [];
    return [
      lineDataset('Q Olc (MVAr)', sourceRows.map((r) => r.qgenMvar ?? r.qMeas), colors.reactivePower || '#facc15', 'y'),
      lineDataset('D.I. MVAr Limit', sourceRows.map((r) => r.diMvarLimit), colors.mvarLimitDi || '#14b8a6', 'y', { borderDash: [4, 3], pointRadius: 0 }),
      lineDataset('A.I. MVAr Limit', sourceRows.map((r) => r.aiMvarLimit), colors.mvarLimitAi || '#f97316', 'y', { borderDash: [4, 3], pointRadius: 0 }),
      lineDataset('Yardimci Kaynak MVAr', sourceRows.map((r) => r.auxiliaryMvar), colors.auxiliaryMvar || '#a855f7', 'y'),
      lineDataset('Yardimci D.I. Limit', sourceRows.map((r) => r.auxiliaryDiMvarLimit), colors.auxiliaryLimitDi || '#06b6d4', 'y', { borderDash: [3, 3], pointRadius: 0 }),
      lineDataset('Yardimci A.I. Limit', sourceRows.map((r) => r.auxiliaryAiMvarLimit), colors.auxiliaryLimitAi || '#ec4899', 'y', { borderDash: [3, 3], pointRadius: 0 }),
      lineDataset('EK-C Q hedef', sourceRows.map((r) => r.minuteStat?.qTarget), '#2563eb', 'y', { borderDash: [7, 3], pointRadius: 0 }),
      lineDataset('EK-C limit alt', sourceRows.map((r) => r.minuteStat?.limitLow), '#64748b', 'y', { borderDash: [2, 2], pointRadius: 0 }),
      lineDataset('EK-C limit ust', sourceRows.map((r) => r.minuteStat?.limitHigh), '#64748b', 'y', { borderDash: [2, 2], pointRadius: 0 }),
      lineDataset('EK-C limit', sourceRows.map((r) => r.minuteStat?.limitValue), '#475569', 'y', { borderDash: [5, 3], pointRadius: 0 })
    ].filter(hasDatasetValues);
  }

  function lineDataset(label, data, color, yAxisID = 'y', extra = {}) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      yAxisID,
      tension: 0.25,
      pointRadius: 1,
      ...extra
    };
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
      voltageSet: colors.voltageSet || '#7dd3fc',
      voltageBand: colors.voltageBand || '#38bdf8',
      liveVoltage: colors.liveVoltage || '#1e40af',
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

  function createHeatmapPanel(heatmapRows, options = {}) {
    const heatmapPanel = createChartPanel('24 saat Sonuçlar', renderHeatmap(heatmapRows, options), 'rgdh-heatmap-panel');
    const metricToggle = document.createElement('button');
    metricToggle.type = 'button';
    metricToggle.textContent = 'Detayli Metrik Goster';
    const metricTable = createHourMetricTable(heatmapRows);
    metricTable.hidden = true;
    metricToggle.addEventListener('click', () => {
      metricTable.hidden = !metricTable.hidden;
      metricToggle.textContent = metricTable.hidden ? 'Detayli Metrik Goster' : 'Detayli Metrik Gizle';
    });
    const metricActions = document.createElement('div');
    metricActions.className = 'rgdh-detail-toggle-row';
    metricActions.appendChild(metricToggle);
    heatmapPanel.appendChild(metricActions);
    heatmapPanel.appendChild(metricTable);
    return heatmapPanel;
  }

  function createHourMetricTable(pivotRows) {
    const container = document.createElement('div');
    container.className = 'rgdh-detail-table';
    const headers = [
      'Tarih', 'Saat', 'Bara', 'Tip', 'Sonuc', 'Sagladi', 'Saglamadi', 'DD', 'YY', 'KY',
      'Katilim', 'Pnom', 'Pnom %10', 'Pnom %50', 'MKUD', 'Ort P', 'Ort Q', 'Ort V Set', 'Ort V'
    ];
    const table = document.createElement('table');
    table.className = 'rgdh-table compact';
    table.innerHTML = `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement('tbody');
    buildHourMetricRows(pivotRows).forEach((row) => {
      const tr = document.createElement('tr');
      const values = [
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
      ];
      tr.innerHTML = values.map((value, index) => {
        const className = index === 10 ? participationClass(row) : '';
        return `<td class="${className}">${value}</td>`;
      }).join('');
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  function buildHourMetricRows(pivotRows) {
    const rows = [];
    (pivotRows || []).forEach((pivotRow) => {
      (pivotRow.hours || []).forEach((hour) => {
        const pnomAvg = finiteOrNull(hour.pnomAvg);
        const isWind = /WIND|RES|GES/i.test(String(pivotRow.sourceType || ''));
        rows.push({
          localDate: pivotRow.localDate || '',
          busbarName: pivotRow.busbarName || pivotRow.busbarId || '',
          sourceType: pivotRow.sourceType || '',
          hour: hour.hour,
          hourResult: normalizeReactiveResultCode(hour.hourResult || hour.status),
          passCount: hour.passCount ?? hour.successMinuteCount ?? 0,
          failCount: hour.failCount ?? 0,
          ddCount: hour.ddCount ?? hour.dhCount ?? 0,
          yyCount: hour.yyCount ?? 0,
          kyCount: hour.kyCount ?? 0,
          participationPct: hour.participationPct ?? hour.passRatio ?? null,
          pnomAvg,
          pnomPct10: Number.isFinite(pnomAvg) ? roundMetric(pnomAvg * 0.10) : null,
          pnomPct50: isWind && Number.isFinite(pnomAvg) ? roundMetric(pnomAvg * 0.50) : null,
          pmkudAvg: finiteOrNull(hour.pmkudAvg),
          pgenAvg: finiteOrNull(hour.pgenAvg),
          qgenAvg: finiteOrNull(hour.qgenAvg),
          setAvg: finiteOrNull(hour.setAvg),
          voltageAvg: finiteOrNull(hour.voltageAvg)
        });
      });
    });
    return rows;
  }

  function createChartPanel(title, content, extraClass = '') {
    const panel = document.createElement('section');
    panel.className = ['rgdh-chart-card', extraClass].filter(Boolean).join(' ');
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
        const resultLabel = reactiveDisplayLabel(hour.hourResult || hour.status);
        td.textContent = formatHeatmapCellText(hour);
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
    const result = normalizeReactiveResultCode(hour?.hourResult || hour?.status);
    if (!hour || !result) {
      return 'participation-empty';
    }
    if (result === 'DD') return 'participation-dd';
    if (result === 'YY') return 'participation-yy';
    if (result === 'KY') return 'participation-ky';
    const pct = Number(hour.participationPct ?? hour.passRatio);
    if (!Number.isFinite(pct)) return 'participation-empty';
    return pct >= PARTICIPATION_OK_THRESHOLD_PCT ? 'participation-ok' : 'participation-fail';
  }

  function formatHeatmapCellText(hour) {
    const result = normalizeReactiveResultCode(hour?.hourResult || hour?.status);
    if (result === 'DD' || result === 'YY' || result === 'KY') return result;
    const pct = hour?.participationPct ?? hour?.passRatio;
    return Number.isFinite(Number(pct)) ? formatPercent(pct) : (result || '-');
  }

  function normalizeReactiveResultCode(value) {
    if (typeof RGDH_PIVOT !== 'undefined' && RGDH_PIVOT.normalizeReactiveResultCode) {
      return RGDH_PIVOT.normalizeReactiveResultCode(value);
    }
    if (value === null || value === undefined) return '';
    const code = String(value).trim().toUpperCase()
      .replace(/Ğ/g, 'G')
      .replace(/İ/g, 'I')
      .replace(/Ş/g, 'S')
      .replace(/Ü/g, 'U')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C');
    if (code === 'OK' || code === 'PASS') return 'SAGLADI';
    if (code === 'WARN' || code === 'WARNING' || code === 'FAIL') return 'SAGLAMADI';
    if (code === 'OFF') return 'DD';
    if (code === 'NO_DATA' || code === 'NODATA') return 'KY';
    return code;
  }

  function reactiveDisplayLabel(value) {
    if (typeof RGDH_PIVOT !== 'undefined' && RGDH_PIVOT.reactiveDisplayLabel) {
      return RGDH_PIVOT.reactiveDisplayLabel(value);
    }
    const code = normalizeReactiveResultCode(value);
    if (code === 'SAGLADI') return 'SAĞLADI';
    if (code === 'SAGLAMADI') return 'SAĞLAMADI';
    return code || '-';
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
      voltageSet: read('--chart-voltage-set', '#7dd3fc'),
      voltageBand: read('--chart-voltage-band', '#38bdf8'),
      liveVoltage: read('--chart-live-voltage', '#1e40af'),
      voltageAxis: read('--chart-voltage-axis', '#1e40af'),
      upperLimit: read('--chart-upper-limit', '#7f1d1d'),
      lowerLimit: read('--chart-lower-limit', '#15803d')
    };
  }

  function applyVoltageVisibility(root, showVoltage) {
    root.querySelectorAll('.rgdh-voltage-col').forEach((cell) => {
      cell.classList.toggle('hidden-voltage', !showVoltage);
    });
  }

  function renderComparison(root, compareRows, options = {}) {
    if (!root) return;
    root.innerHTML = '';
    const rows = (compareRows || []).slice().sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'rgdh-empty-state';
      empty.textContent = 'Karsilastirma verisi yok. Once API verisi cekin ve EK-C CSV yukleyin.';
      root.appendChild(empty);
      return;
    }
    const selection = normalizeComparisonSelection(rows, options.selection || options);
    const toolbar = createComparisonChartToolbar(rows, selection, root, options);
    root.appendChild(toolbar);
    const selectedRows = selectComparisonRowsForCharts(rows, selection);
    const topCanvas = appendChartCanvas(root, 'EK-C / YKS SCADA Gerilim ve Aktif Guc', 'rgdh-compare-top-chart', 300, { diffToggle: true });
    const reactiveCanvas = appendChartCanvas(root, 'EK-C / YKS SCADA Reaktif Guc ve Limit', 'rgdh-compare-reactive-chart', 300, { diffToggle: true });
    const theme = chartTheme(topCanvas);
    renderMixedChart(topCanvas, selectedRows, buildComparisonTopDatasets(selectedRows, theme), options, 'MW', true);
    renderMixedChart(reactiveCanvas, selectedRows, buildComparisonReactiveDatasets(selectedRows, theme), options, 'MVAr', false);
  }

  function createComparisonChartToolbar(rows, selection, root, options = {}) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rgdh-chart-toolbar yks-card';
    const busbarOptions = comparisonOptions(rows, 'busbarId', 'busbarName');
    const ytmValues = comparisonOptions(rows, 'ytm', 'ytm').map((item) => item.value);
    const hourOptions = Array.from({ length: 24 }, (_, hour) => `<option value="${hour}">${String(hour).padStart(2, '0')}</option>`).join('');
    toolbar.innerHTML = `
      <label class="rgdh-chart-field rgdh-chart-field-busbar">Bara <select id="chartBusbarSelect" class="rgdh-select"><option value="">Tumu</option>${busbarOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-ytm">BYTM <select id="chartYtmSelect" class="rgdh-select"><option value="">Tumu</option>${ytmValues.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-date">Tarih <input id="chartDate" type="date" class="rgdh-input"></label>
      <label class="rgdh-chart-field rgdh-chart-field-mode">Saat Modu <select id="chartHourMode" class="rgdh-select"><option value="all">Tum gun</option><option value="hours">Saatler</option></select></label>
      <label class="rgdh-chart-field rgdh-chart-field-hour">Baslangic Saat <select id="chartHourStart" class="rgdh-select">${hourOptions}</select></label>
      <label class="rgdh-chart-field rgdh-chart-field-hour">Bitis Saat <select id="chartHourEnd" class="rgdh-select">${hourOptions}</select></label>
      <label class="rgdh-chart-field rgdh-chart-range-control">Saat Kaydir <span class="rgdh-hour-slider-row"><button id="chartHourDown" type="button" title="Saat araligini geri al">-</button><input id="chartHourSlider" type="range" min="0" max="23" value="0"><button id="chartHourUp" type="button" title="Saat araligini ileri al">+</button></span></label>
      <button id="btnChartQuery" class="primary" type="button">Sorgula</button>
    `;
    const selectBusbar = toolbar.querySelector('#chartBusbarSelect');
    const selectYtm = toolbar.querySelector('#chartYtmSelect');
    const inputDate = toolbar.querySelector('#chartDate');
    const hourMode = toolbar.querySelector('#chartHourMode');
    const hourSlider = toolbar.querySelector('#chartHourSlider');
    const hourStart = toolbar.querySelector('#chartHourStart');
    const hourEnd = toolbar.querySelector('#chartHourEnd');
    const hourDown = toolbar.querySelector('#chartHourDown');
    const hourUp = toolbar.querySelector('#chartHourUp');
    const btnQuery = toolbar.querySelector('#btnChartQuery');

    if (selection.busbarId) selectBusbar.value = String(selection.busbarId);
    if (selection.ytm) selectYtm.value = String(selection.ytm);
    if (selection.date) inputDate.value = selection.date;

    const writeHourControls = (input) => {
      const normalized = normalizeHourRangeFilter(input);
      const start = normalized.hourStart ?? 0;
      const end = normalized.hourEnd ?? 23;
      const width = Math.max(0, end - start);
      hourMode.value = normalized.mode;
      hourStart.value = String(start);
      hourEnd.value = String(end);
      hourSlider.min = '0';
      hourSlider.max = String(Math.max(0, 23 - width));
      hourSlider.value = String(Math.min(start, Number(hourSlider.max)));
      const disabled = normalized.mode === 'all';
      [hourStart, hourEnd, hourSlider, hourDown, hourUp].forEach((control) => {
        control.disabled = disabled;
      });
      return normalized;
    };

    writeHourControls(selection);
    const readSelection = () => normalizeComparisonSelection(rows, {
      busbarId: selectBusbar.value,
      ytm: selectYtm.value,
      date: inputDate.value,
      mode: hourMode.value,
      hourStart: hourStart.value,
      hourEnd: hourEnd.value
    });
    const applySelection = () => {
      const nextSelection = readSelection();
      if (typeof options.onFilterApply === 'function') {
        options.onFilterApply(nextSelection);
        return;
      }
      renderComparison(root, rows, { ...options, selection: nextSelection });
    };

    hourMode.addEventListener('change', () => {
      writeHourControls({ mode: hourMode.value, hourStart: hourStart.value, hourEnd: hourEnd.value });
    });
    hourStart.addEventListener('change', () => {
      const start = clampHour(hourStart.value);
      const end = Math.max(start, clampHour(hourEnd.value));
      writeHourControls({ mode: 'hours', hourStart: start, hourEnd: end });
    });
    hourEnd.addEventListener('change', () => {
      const end = clampHour(hourEnd.value);
      const start = Math.min(clampHour(hourStart.value), end);
      writeHourControls({ mode: 'hours', hourStart: start, hourEnd: end });
    });
    hourSlider.addEventListener('input', () => {
      const current = normalizeHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value });
      const width = current.hourEnd - current.hourStart;
      const nextStart = Math.max(0, Math.min(23 - width, clampHour(hourSlider.value)));
      writeHourControls({ mode: 'hours', hourStart: nextStart, hourEnd: nextStart + width });
      applySelection();
    });
    hourDown.addEventListener('click', () => {
      writeHourControls(shiftHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value }, -1));
      applySelection();
    });
    hourUp.addEventListener('click', () => {
      writeHourControls(shiftHourRangeFilter({ mode: 'hours', hourStart: hourStart.value, hourEnd: hourEnd.value }, 1));
      applySelection();
    });
    btnQuery.addEventListener('click', applySelection);
    return toolbar;
  }

  function buildComparisonTopDatasets(rows, colors = {}) {
    const yksVoltage = colors.liveVoltage || '#1e40af';
    const yksActive = colors.activePower || '#111827';
    const ekcVoltage = colors.ekcVoltage || colors.voltage2 || comparisonEkcColor(yksVoltage, '#3b82f6');
    const ekcActive = colors.ekcActivePower || comparisonEkcColor(yksActive, '#4b5563');
    return [
      lineDataset('YKS SCADA V', rows.map((r) => r.platform?.liveBusbarVoltage), yksVoltage, 'y1', { borderWidth: 3, borderDash: [], tension: 0, pointRadius: 0, pointHoverRadius: 0, hitRadius: 0, rgdhDiffSource: true }),
      lineDataset('EK-C V', rows.map((r) => r.ekc?.vBara), ekcVoltage, 'y1', { borderWidth: 3.5, pointRadius: 0, tension: 0, rgdhDiffSource: true }),
      lineDataset('Fark V', absDeltaSeries(rows, (r) => r.platform?.liveBusbarVoltage, (r) => r.ekc?.vBara), '#0891b2', 'y1', { hidden: true, borderWidth: 2.5, borderDash: [5, 3], pointRadius: 0, tension: 0, rgdhDiffDataset: true }),
      lineDataset('YKS SCADA P', rows.map((r) => r.platform?.pgenMw), yksActive, 'y', { borderWidth: 3, borderDash: [], tension: 0, pointRadius: 0, pointHoverRadius: 0, hitRadius: 0, rgdhDiffSource: true }),
      lineDataset('EK-C P', rows.map((r) => r.ekc?.pTotal), ekcActive, 'y', { borderWidth: 3.5, pointRadius: 0, tension: 0, rgdhDiffSource: true }),
      lineDataset('Fark P', absDeltaSeries(rows, (r) => r.platform?.pgenMw, (r) => r.ekc?.pTotal), '#64748b', 'y', { hidden: true, borderWidth: 2.5, borderDash: [5, 3], pointRadius: 0, tension: 0, rgdhDiffDataset: true })
    ].filter(hasDatasetValues);
  }

  function buildComparisonReactiveDatasets(rows, colors = {}) {
    const yksReactive = colors.reactivePower || '#facc15';
    const ekcReactive = colors.ekcReactivePower || comparisonEkcColor(yksReactive, '#f59e0b');
    return [
      lineDataset('YKS SCADA Q', rows.map((r) => r.platform?.qgenMvar), yksReactive, 'y', { borderWidth: 3, borderDash: [], tension: 0, pointRadius: 0, pointHoverRadius: 0, hitRadius: 0, rgdhDiffSource: true }),
      lineDataset('EK-C Q', rows.map((r) => r.ekc?.qMeas), ekcReactive, 'y', { borderWidth: 3.5, pointRadius: 0, tension: 0, rgdhDiffSource: true }),
      lineDataset('Fark Q', absDeltaSeries(rows, (r) => r.platform?.qgenMvar, (r) => r.ekc?.qMeas), '#ca8a04', 'y', { hidden: true, borderWidth: 2.5, borderDash: [5, 3], pointRadius: 0, tension: 0, rgdhDiffDataset: true })
    ].filter(hasDatasetValues);
  }

  function absDeltaSeries(rows, leftSelector, rightSelector) {
    return (rows || []).map((row) => {
      const rawLeft = leftSelector(row);
      const rawRight = rightSelector(row);
      if (rawLeft === null || rawLeft === undefined || rawLeft === '' || rawRight === null || rawRight === undefined || rawRight === '') {
        return null;
      }
      const left = Number(rawLeft);
      const right = Number(rawRight);
      if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
      return Number(Math.abs(left - right).toFixed(6));
    });
  }

  function comparisonEkcColor(sourceColor, fallbackColor) {
    const normalized = String(sourceColor || '').toLowerCase();
    const known = {
      '#1e40af': '#3b82f6',
      '#111827': '#4b5563',
      '#facc15': '#f59e0b'
    };
    return known[normalized] || fallbackColor;
  }

  function formatNumber(value) {
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : '-';
  }

  function formatPercent(value) {
    return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%` : '-';
  }

  function selectComparisonRowsForCharts(rows, selection = {}) {
    const sourceRows = (rows || []).slice().sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    const normalized = normalizeComparisonSelection(sourceRows, selection);
    return sourceRows.filter((row) => {
      if (normalized.date && row.localDate !== normalized.date) return false;
      if (normalized.busbarId && !comparisonRowMatches(row, 'busbarId', normalized.busbarId)) return false;
      if (normalized.ytm && !comparisonRowMatches(row, 'ytm', normalized.ytm)) return false;
      if (normalized.hourMode === 'hours') {
        const hour = comparisonRowHour(row);
        if (hour < normalized.hourStart || hour > normalized.hourEnd) return false;
      }
      return true;
    });
  }

  function normalizeComparisonSelection(rows, selection = {}) {
    const date = resolveComparisonDate(rows, selection.date);
    const hourFilter = normalizeHourRangeFilter({
      mode: selection.hourMode || selection.mode,
      hour: selection.hour,
      hourStart: selection.hourStart,
      hourEnd: selection.hourEnd
    });
    return {
      busbarId: selection.busbarId || '',
      ytm: selection.ytm || '',
      date,
      hourMode: hourFilter.mode,
      hourStart: hourFilter.hourStart,
      hourEnd: hourFilter.hourEnd,
      hour: hourFilter.hour
    };
  }

  function resolveComparisonDate(rows, preferredDate) {
    const dates = [...new Set((rows || []).map((row) => row.localDate).filter(Boolean))].sort();
    if (preferredDate && dates.includes(preferredDate)) return preferredDate;
    return dates[0] || preferredDate || '';
  }

  function comparisonOptions(rows, valueField, labelField) {
    const options = new Map();
    (rows || []).forEach((row) => {
      [row.ekc, row.platform].forEach((source) => {
        const value = source?.[valueField] ?? row?.[valueField];
        if (value === undefined || value === null || value === '') return;
        const key = String(value);
        if (!options.has(key)) {
          options.set(key, { value: key, label: source?.[labelField] || source?.busbarName || key });
        }
      });
    });
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }

  function comparisonRowMatches(row, field, value) {
    const expected = String(value);
    return [row?.[field], row?.ekc?.[field], row?.platform?.[field]].some((candidate) => String(candidate ?? '') === expected);
  }

  function comparisonRowHour(row) {
    const value = row?.hour ?? row?.ekc?.hour ?? row?.ekc?.localHour ?? row?.platform?.localHour;
    const hour = Number(value);
    return Number.isFinite(hour) ? hour : -1;
  }

  function normalizeHourFilter(input = {}) {
    const mode = input.mode === 'hour' ? 'hour' : 'all';
    if (mode === 'all') return { mode: 'all', hour: null };
    const numeric = Number(input.hour);
    const hour = Number.isFinite(numeric) ? Math.max(0, Math.min(23, Math.trunc(numeric))) : 0;
    return { mode: 'hour', hour };
  }

  function normalizeHourRangeFilter(input = {}) {
    const hasRange = input.hourStart !== undefined || input.hourEnd !== undefined;
    const hasHour = input.hour !== undefined && input.hour !== null && input.hour !== '';
    const rawMode = input.hourMode || input.mode;
    const mode = rawMode === 'hours' || rawMode === 'hour' || (!rawMode && (hasRange || hasHour)) ? 'hours' : 'all';
    if (mode === 'all') {
      return { mode: 'all', hourStart: null, hourEnd: null, hour: null };
    }
    const start = clampHour(hasRange ? input.hourStart : input.hour);
    let end = clampHour(hasRange ? input.hourEnd : input.hour);
    if (end < start) end = start;
    return { mode: 'hours', hourStart: start, hourEnd: end, hour: start === end ? start : null };
  }

  function normalizeCalculationMode(value) {
    return String(value || '').toUpperCase() === 'EKC' ? 'EKC' : 'YKS';
  }

  function shiftHourRangeFilter(input = {}, delta = 0) {
    const current = normalizeHourRangeFilter(input);
    if (current.mode === 'all') return current;
    const width = current.hourEnd - current.hourStart;
    const offset = Number.isFinite(Number(delta)) ? Math.trunc(Number(delta)) : 0;
    const nextStart = Math.max(0, Math.min(23 - width, current.hourStart + offset));
    return normalizeHourRangeFilter({ mode: 'hours', hourStart: nextStart, hourEnd: nextStart + width });
  }

  function hasHourRangeSelection(input = {}) {
    return [input.hour, input.hourStart, input.hourEnd].some((value) => value !== undefined && value !== null && value !== '');
  }

  function clampHour(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(23, Math.trunc(numeric))) : 0;
  }

  function finiteOrNull(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function roundMetric(value) {
    return Number.isFinite(Number(value)) ? Math.round(Number(value) * 1000) / 1000 : null;
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
    buildVoltageActiveDatasets,
    buildReactiveDatasets,
    buildComparisonTopDatasets,
    buildComparisonReactiveDatasets,
    buildHourMetricRows,
    formatHeatmapCellText,
    selectComparisonRowsForCharts,
    integerLinearScale,
    normalizeHourFilter,
    normalizeHourRangeFilter,
    shiftHourRangeFilter,
    participationClass,
    renderReport,
    renderComparison,
    selectRowsForReport,
    renderHeatmap
  };
});
