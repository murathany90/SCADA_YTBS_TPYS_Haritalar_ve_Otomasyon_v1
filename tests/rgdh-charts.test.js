const test = require('node:test');
const assert = require('node:assert/strict');

const charts = require('../rgdh-charts.js');

function makeRow(busbarId, hour, minute) {
  return {
    busbarId,
    sourceType: 'CONVENTIONAL',
    measurementDateLocal: `2026-04-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`,
    localDate: '2026-04-01',
    localHour: hour,
    localMinute: minute,
    tpysVoltageSet: 160,
    liveBusbarVoltage: 160 + minute,
    busbar1Voltage: 160 + minute,
    busbar1Quality: 'Actual',
    busbar2Voltage: 159 + minute,
    busbar2Quality: 'Calcul',
    busbar3Voltage: 158 + minute,
    busbar3Quality: 'Actual',
    pgenMw: 10 + minute,
    qgenMvar: -2 - minute
  };
}

test('selectRowsForReport filters by busbar and hour for hourly graph drilldown', () => {
  const rows = [
    makeRow(5532, 0, 0),
    makeRow(5532, 0, 1),
    makeRow(5532, 1, 0),
    makeRow(2114, 0, 0)
  ];

  const selected = charts.selectRowsForReport(rows, { busbarId: 5532, hour: 0 });

  assert.equal(selected.length, 2);
  assert.deepEqual(selected.map((row) => row.measurementDateLocal), [
    '2026-04-01T00:00:00+03:00',
    '2026-04-01T00:01:00+03:00'
  ]);
});

test('selectRowsForReport keeps full-day busbar data when hour is not selected', () => {
  const rows = [
    makeRow(5532, 0, 0),
    makeRow(5532, 1, 0),
    makeRow(2114, 0, 0)
  ];

  const selected = charts.selectRowsForReport(rows, { busbarId: 5532 });

  assert.equal(selected.length, 2);
  assert.deepEqual(selected.map((row) => row.localHour), [0, 1]);
});

test('selectRowsForReport filters by inclusive hour range', () => {
  const rows = [
    makeRow(5532, 7, 0),
    makeRow(5532, 8, 0),
    makeRow(5532, 9, 0),
    makeRow(5532, 10, 0),
    makeRow(5532, 11, 0),
    makeRow(2114, 9, 0)
  ];

  const selected = charts.selectRowsForReport(rows, { busbarId: 5532, hourMode: 'hours', hourStart: 8, hourEnd: 10 });

  assert.deepEqual(selected.map((row) => row.localHour), [8, 9, 10]);
});

test('selectRowsForReport keeps legacy single-hour behavior through hour range options', () => {
  const rows = [
    makeRow(5532, 4, 0),
    makeRow(5532, 5, 0),
    makeRow(5532, 5, 1),
    makeRow(5532, 6, 0)
  ];

  const legacy = charts.selectRowsForReport(rows, { busbarId: 5532, hour: 5 });
  const ranged = charts.selectRowsForReport(rows, { busbarId: 5532, hourMode: 'hours', hourStart: 5, hourEnd: 5 });

  assert.deepEqual(legacy.map((row) => row.measurementDateLocal), ranged.map((row) => row.measurementDateLocal));
});

test('selectRowsForReport filters by date for full-day daily-table drilldown', () => {
  const rows = [
    makeRow(5532, 0, 0),
    {
      ...makeRow(5532, 0, 0),
      measurementDateLocal: '2026-04-02T00:00:00+03:00',
      localDate: '2026-04-02'
    },
    makeRow(2114, 0, 0)
  ];

  const selected = charts.selectRowsForReport(rows, { busbarId: 5532, date: '2026-04-02' });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].localDate, '2026-04-02');
});

test('selectRowsForReport limits unscoped multi-day graph selection to one local date', () => {
  const rows = [
    makeRow(5532, 0, 0),
    makeRow(5532, 1, 0),
    {
      ...makeRow(5532, 0, 0),
      measurementDateLocal: '2026-04-02T00:00:00+03:00',
      localDate: '2026-04-02'
    },
    {
      ...makeRow(5532, 1, 0),
      measurementDateLocal: '2026-04-02T01:00:00+03:00',
      localDate: '2026-04-02'
    }
  ];

  const selected = charts.selectRowsForReport(rows, { busbarId: 5532 });

  assert.equal(selected.length, 2);
  assert.deepEqual([...new Set(selected.map((row) => row.localDate))], ['2026-04-01']);
});

test('buildChartDatasets keeps TPYS Set separate from Bara 2 source voltage', () => {
  const rows = [makeRow(5532, 0, 0), makeRow(5532, 0, 1)];
  const datasets = charts.buildChartDatasets(rows, {
    showVoltage: true
  }, {
    activePower: '#111111',
    reactivePower: '#facc15',
    voltage1: '#2563eb',
    voltage2: '#60a5fa',
    voltage3: '#93c5fd',
    voltageSet: '#1d4ed8',
    voltageBand: '#38bdf8'
  });

  const byLabel = new Map(datasets.map((dataset) => [dataset.label, dataset]));

  assert.deepEqual(byLabel.get('Bara 2 kV').data, [159, 160]);
  assert.deepEqual(byLabel.get('TPYS Set Gerilim (kV)').data, [160, 160]);
  assert.equal(byLabel.get('TPYS Set Gerilim (kV)').hidden, true);
  assert.equal(byLabel.get('P Aktif Güç (MW)').borderColor, '#111111');
  assert.equal(byLabel.get('Q Reaktif Güç (MVAr)').borderColor, '#facc15');
});

test('buildChartDatasets hides voltage-source series while keeping default-hidden TPYS Set', () => {
  const datasets = charts.buildChartDatasets([makeRow(5532, 0, 0)], { showVoltage: false });
  const labels = datasets.map((dataset) => dataset.label);

  assert.equal(labels.includes('Bara 1 kV'), false);
  assert.equal(labels.includes('Bara 2 kV'), false);
  assert.equal(labels.includes('Bara 3 kV'), false);
  assert.equal(labels.includes('TPYS Set Gerilim (kV)'), true);
  assert.equal(datasets.find((dataset) => dataset.label === 'TPYS Set Gerilim (kV)').hidden, true);
});

test('buildChartDatasets adds default-hidden conventional TPYS voltage tolerance bands', () => {
  const datasets = charts.buildChartDatasets([makeRow(5532, 0, 0), makeRow(5532, 0, 1)], { showVoltage: true });
  const upper = datasets.find((dataset) => dataset.label === 'TPYS Set +%1,5');
  const lower = datasets.find((dataset) => dataset.label === 'TPYS Set -%1,5');

  assert.deepEqual(upper.data, [162.4, 162.4]);
  assert.deepEqual(lower.data, [157.6, 157.6]);
  assert.equal(upper.hidden, true);
  assert.equal(lower.hidden, true);
  assert.deepEqual(upper.borderDash, [4, 4]);
  assert.deepEqual(lower.borderDash, [4, 4]);
});

test('buildVoltageActiveDatasets groups TPYS set and tolerance bands under one legend layer', () => {
  const datasets = charts.buildVoltageActiveDatasets([makeRow(5532, 0, 0), makeRow(5532, 0, 1)], { showVoltage: true }, {
    voltageSet: '#7dd3fc',
    voltageBand: '#38bdf8',
    liveVoltage: '#1e40af'
  });
  const set = datasets.find((dataset) => dataset.label === 'TPYS Set Gerilim');
  const upper = datasets.find((dataset) => dataset.label === 'TPYS Set +%1,5');
  const lower = datasets.find((dataset) => dataset.label === 'TPYS Set -%1,5');
  const live = datasets.find((dataset) => dataset.label === 'Canli Bara');

  assert.equal(set.rgdhLegendGroup, 'tpys-set-voltage');
  assert.equal(upper.rgdhLegendGroup, 'tpys-set-voltage');
  assert.equal(lower.rgdhLegendGroup, 'tpys-set-voltage');
  assert.equal(set.rgdhLegendLeader, true);
  assert.equal(upper.rgdhLegendHidden, true);
  assert.equal(lower.rgdhLegendHidden, true);
  assert.equal(set.borderColor, '#7dd3fc');
  assert.equal(live.borderColor, '#1e40af');
  assert.deepEqual(set.borderDash || [], []);
  assert.deepEqual(upper.borderDash, [4, 4]);
  assert.equal(upper.borderWidth, set.borderWidth / 2);
  assert.equal(lower.borderWidth, set.borderWidth / 2);
});

test('formatHeatmapCellText hides SAGLADI SAGLAMADI labels and keeps neutral codes', () => {
  assert.equal(charts.formatHeatmapCellText({ hourResult: 'SAGLADI', participationPct: 95, pctSuppressed: false }), '95%');
  assert.equal(charts.formatHeatmapCellText({ hourResult: 'SAGLAMADI', participationPct: 72.5, pctSuppressed: false }), '72,5%');
  assert.equal(charts.formatHeatmapCellText({ hourResult: 'DD', participationPct: null, pctSuppressed: true }), 'DD');
  assert.equal(charts.formatHeatmapCellText({ hourResult: 'YY', participationPct: null, pctSuppressed: true }), 'YY');
  assert.equal(charts.formatHeatmapCellText({ hourResult: 'KY', participationPct: null, pctSuppressed: true }), 'KY');
});

test('participationClass differentiates DD YY KY neutral result colors', () => {
  assert.equal(charts.participationClass({ hourResult: 'DD', participationPct: null }), 'participation-dd');
  assert.equal(charts.participationClass({ hourResult: 'YY', participationPct: null }), 'participation-yy');
  assert.equal(charts.participationClass({ hourResult: 'KY', participationPct: null }), 'participation-ky');
});

test('buildHourMetricRows exposes hourly detail metrics for conventional and wind rows', () => {
  const metricRows = charts.buildHourMetricRows([
    {
      localDate: '2026-04-01',
      busbarName: 'ACWA',
      sourceType: 'CONVENTIONAL',
      hours: [{
        hour: 0,
        hourResult: 'SAGLADI',
        passCount: 50,
        failCount: 10,
        ddCount: 0,
        yyCount: 0,
        kyCount: 0,
        participationPct: 83.333,
        pnomAvg: 927.4,
        pmkudAvg: 460,
        pgenAvg: 24.5,
        qgenAvg: -5,
        setAvg: 160,
        voltageAvg: 159.5
      }]
    },
    {
      localDate: '2026-04-01',
      busbarName: 'RES',
      sourceType: 'WIND',
      hours: [{
        hour: 1,
        hourResult: 'YY',
        passCount: 0,
        failCount: 0,
        ddCount: 0,
        yyCount: 60,
        kyCount: 0,
        participationPct: null,
        pnomAvg: 48.6,
        pmkudAvg: 4.86,
        pgenAvg: 3,
        qgenAvg: 1,
        setAvg: 154,
        voltageAvg: 153
      }]
    }
  ]);

  assert.equal(metricRows[0].pnomPct10, 92.74);
  assert.equal(metricRows[0].pnomPct50, null);
  assert.equal(metricRows[0].pmkudAvg, 460);
  assert.equal(metricRows[1].pnomPct10, 4.86);
  assert.equal(metricRows[1].pnomPct50, 24.3);
});

test('comparison dataset builders include EK-C and YKS SCADA values', () => {
  const compareRows = [{
    ekc: { vBara: 159, vSet: 160, pTotal: 42, pAux: 2, qMeas: -3, minuteStat: { limitLow: -5, limitHigh: 5 } },
    platform: { liveBusbarVoltage: 158, tpysVoltageSet: 160, pgenMw: 40, qgenMvar: -4 },
    platformEquivalentLimit: -6,
    ekcLimitComparable: -5
  }];

  const topLabels = charts.buildComparisonTopDatasets(compareRows).map((dataset) => dataset.label);
  const reactiveLabels = charts.buildComparisonReactiveDatasets(compareRows).map((dataset) => dataset.label);

  assert.deepEqual(topLabels, ['YKS SCADA V', 'EK-C V', 'YKS SCADA P', 'EK-C P']);
  assert.deepEqual(reactiveLabels, ['YKS SCADA Q', 'EK-C Q']);
});

test('comparison dataset builders style EK-C series as solid prominent lines', () => {
  const compareRows = [{
    ekc: { vBara: 159, pTotal: 42, qMeas: -3 },
    platform: { liveBusbarVoltage: 158, pgenMw: 40, qgenMvar: -4 }
  }];

  const topDatasets = charts.buildComparisonTopDatasets(compareRows, {
    liveVoltage: '#1e40af',
    activePower: '#111827'
  });
  const reactiveDatasets = charts.buildComparisonReactiveDatasets(compareRows, {
    reactivePower: '#facc15'
  });
  const yksV = topDatasets.find((dataset) => dataset.label === 'YKS SCADA V');
  const ekcV = topDatasets.find((dataset) => dataset.label === 'EK-C V');
  const yksP = topDatasets.find((dataset) => dataset.label === 'YKS SCADA P');
  const ekcP = topDatasets.find((dataset) => dataset.label === 'EK-C P');
  const yksQ = reactiveDatasets.find((dataset) => dataset.label === 'YKS SCADA Q');
  const ekcQ = reactiveDatasets.find((dataset) => dataset.label === 'EK-C Q');

  assert.deepEqual(yksV.borderDash || [], []);
  assert.deepEqual(yksP.borderDash || [], []);
  assert.deepEqual(yksQ.borderDash || [], []);
  assert.equal(yksV.pointRadius, 0);
  assert.equal(yksP.pointRadius, 0);
  assert.equal(yksQ.pointRadius, 0);
  assert.equal(yksV.pointHoverRadius, 0);
  assert.equal(yksP.pointHoverRadius, 0);
  assert.equal(yksQ.pointHoverRadius, 0);
  assert.deepEqual(ekcV.borderDash || [], []);
  assert.deepEqual(ekcP.borderDash || [], []);
  assert.deepEqual(ekcQ.borderDash || [], []);
  assert.equal(yksV.borderColor, '#1e40af');
  assert.equal(yksP.borderColor, '#111827');
  assert.equal(yksQ.borderColor, '#facc15');
  assert.notEqual(ekcV.borderColor, yksV.borderColor);
  assert.notEqual(ekcP.borderColor, yksP.borderColor);
  assert.notEqual(ekcQ.borderColor, yksQ.borderColor);
  assert.ok(ekcV.borderWidth >= yksV.borderWidth);
  assert.ok(ekcP.borderWidth >= yksP.borderWidth);
  assert.ok(ekcQ.borderWidth >= yksQ.borderWidth);
});

test('integer chart scale helpers suppress non-integer ticks and grid lines', () => {
  const scale = charts.integerLinearScale('MW', '#263238', '#d8dee6');

  assert.equal(scale.ticks.callback(200), '200');
  assert.equal(scale.ticks.callback(200.5), '');
  assert.equal(scale.grid.color({ tick: { value: 200 } }), '#d8dee6');
  assert.equal(scale.grid.color({ tick: { value: 200.5 } }), 'rgba(0,0,0,0)');
});

test('selectComparisonRowsForCharts filters compare minute rows by one day and hour range', () => {
  const rows = [
    { localDate: '2026-04-01', hour: 7, measurementDateLocal: '2026-04-01T07:00:00+03:00', ekc: { busbarId: '4772' }, platform: { busbarId: '4772' } },
    { localDate: '2026-04-01', hour: 8, measurementDateLocal: '2026-04-01T08:00:00+03:00', ekc: { busbarId: '4772' }, platform: { busbarId: '4772' } },
    { localDate: '2026-04-01', hour: 10, measurementDateLocal: '2026-04-01T10:00:00+03:00', ekc: { busbarId: '4772' }, platform: { busbarId: '4772' } },
    { localDate: '2026-04-01', hour: 11, measurementDateLocal: '2026-04-01T11:00:00+03:00', ekc: { busbarId: '4772' }, platform: { busbarId: '4772' } },
    { localDate: '2026-04-02', hour: 8, measurementDateLocal: '2026-04-02T08:00:00+03:00', ekc: { busbarId: '4772' }, platform: { busbarId: '4772' } }
  ];

  const selected = charts.selectComparisonRowsForCharts(rows, {
    date: '2026-04-01',
    hourMode: 'hours',
    hourStart: 8,
    hourEnd: 10
  });

  assert.deepEqual(selected.map((row) => `${row.localDate} ${row.hour}`), ['2026-04-01 8', '2026-04-01 10']);
});

test('normalizeHourFilter supports full day and clamps exact hourly mode', () => {
  assert.deepEqual(charts.normalizeHourFilter({ mode: 'all', hour: 18 }), { mode: 'all', hour: null });
  assert.deepEqual(charts.normalizeHourFilter({ mode: 'hour', hour: -3 }), { mode: 'hour', hour: 0 });
  assert.deepEqual(charts.normalizeHourFilter({ mode: 'hour', hour: 25 }), { mode: 'hour', hour: 23 });
});

test('normalizeHourRangeFilter supports full day, clamps bounds, and preserves start before end', () => {
  assert.deepEqual(charts.normalizeHourRangeFilter({ mode: 'all', hourStart: 8, hourEnd: 10 }), {
    mode: 'all',
    hourStart: null,
    hourEnd: null,
    hour: null
  });
  assert.deepEqual(charts.normalizeHourRangeFilter({ mode: 'hours', hourStart: -3, hourEnd: 30 }), {
    mode: 'hours',
    hourStart: 0,
    hourEnd: 23,
    hour: null
  });
  assert.deepEqual(charts.normalizeHourRangeFilter({ mode: 'hours', hourStart: 18, hourEnd: 12 }), {
    mode: 'hours',
    hourStart: 18,
    hourEnd: 18,
    hour: 18
  });
});

test('shiftHourRangeFilter moves the selected range without crossing day bounds', () => {
  assert.deepEqual(charts.shiftHourRangeFilter({ mode: 'hours', hourStart: 8, hourEnd: 17 }, 1), {
    mode: 'hours',
    hourStart: 9,
    hourEnd: 18,
    hour: null
  });
  assert.deepEqual(charts.shiftHourRangeFilter({ mode: 'hours', hourStart: 8, hourEnd: 17 }, 20), {
    mode: 'hours',
    hourStart: 14,
    hourEnd: 23,
    hour: null
  });
  assert.deepEqual(charts.shiftHourRangeFilter({ mode: 'hours', hourStart: 3, hourEnd: 6 }, -10), {
    mode: 'hours',
    hourStart: 0,
    hourEnd: 3,
    hour: null
  });
});
