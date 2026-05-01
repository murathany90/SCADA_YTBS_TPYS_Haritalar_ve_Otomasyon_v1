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
