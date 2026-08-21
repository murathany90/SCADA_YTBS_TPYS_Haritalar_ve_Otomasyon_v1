const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scadaCommon = require('../scada-common.js');
const scadaHooks = require('../scada-v2-runtime.js').__SCADA_V2_TEST_HOOKS__;

test('parseSupersetScadaTimestamp handles epoch seconds and milliseconds with naive-local wall clock', () => {
  const secs = 1724134500; // UTC fields: 2024-08-20 06:15:00
  const ms = secs * 1000;
  const fromSecs = scadaCommon.normalizeTimestamp(secs);
  const fromMs = scadaCommon.normalizeTimestamp(ms);
  assert.ok(fromSecs instanceof Date);
  assert.ok(fromMs instanceof Date);
  // The numeric epoch reuses its UTC fields as the naive local wall clock, so
  // both forms agree in any host timezone - and never shift +3h on a +03:00 host.
  assert.equal(fromSecs.getHours(), fromMs.getHours());
  assert.equal(fromSecs.getMinutes(), fromMs.getMinutes());
  assert.equal(fromSecs.getFullYear(), fromMs.getFullYear());
  assert.equal(fromMs.getHours(), 6, 'wall clock 06:15, asla 09:15 (yani +3h kayma) degil');
  const fromIso = scadaCommon.normalizeTimestamp('2024-08-20T06:15:00Z');
  assert.equal(fromIso.getHours(), fromMs.getHours(), 'ISO-Z ve numeric ayni duvar saatini verir');
  assert.equal(fromIso.getMinutes(), fromMs.getMinutes());
});

test('parseSupersetScadaTimestamp handles ISO strings with and without Z, and space separator', () => {
  const iso = scadaCommon.normalizeTimestamp('2026-08-20T11:15:00Z');
  assert.ok(iso instanceof Date);
  assert.equal(iso.getHours(), 11);
  const noZone = scadaCommon.normalizeTimestamp('2026-08-20T11:15:00');
  assert.ok(noZone instanceof Date);
  assert.equal(noZone.getHours(), 11);
  const withSpace = scadaCommon.normalizeTimestamp('2026-08-20 11:15:00');
  assert.ok(withSpace instanceof Date);
  assert.equal(withSpace.getHours(), 11);
  assert.equal(scadaCommon.normalizeTimestamp('not-a-time'), null);
  assert.equal(scadaCommon.normalizeTimestamp(null), null);
  assert.equal(scadaCommon.normalizeTimestamp(undefined), null);
  assert.equal(scadaCommon.normalizeTimestamp(''), null);
});

test('resolveHistoryTimestamp reads __timestamp first, then legacy keys', () => {
  assert.equal(
    scadaCommon.resolveHistoryTimestamp({ __timestamp: '2026-08-20T11:15:00' }).getTime(),
    new Date('2026-08-20T11:15:00').getTime()
  );
  assert.equal(
    scadaCommon.resolveHistoryTimestamp({ __time: '2026-08-20T11:16:00' }).getTime(),
    new Date('2026-08-20T11:16:00').getTime()
  );
  assert.ok(scadaCommon.resolveHistoryTimestamp({ 'MAX(__time)': 1724134500 }) instanceof Date);
  assert.ok(scadaCommon.resolveHistoryTimestamp({ maxTime: 1724134500 }) instanceof Date);
  assert.equal(scadaCommon.resolveHistoryTimestamp({}), null);
});

test('resolveHistoryValue reads maxValue, AVG(maxValue) and avgMaxValue', () => {
  assert.equal(scadaCommon.resolveHistoryValue({ maxValue: 120.5 }), 120.5);
  assert.equal(scadaCommon.resolveHistoryValue({ 'AVG(maxValue)': 118.7 }), 118.7);
  assert.equal(scadaCommon.resolveHistoryValue({ avgMaxValue: '119.1' }), 119.1);
  assert.equal(scadaCommon.resolveHistoryValue({ foo: 5 }), null);
  assert.equal(scadaCommon.resolveHistoryValue({ maxValue: 'abc' }), null);
});

test('resolveHistoryMeasurementId reads sinsid or measurementId', () => {
  assert.equal(scadaCommon.resolveHistoryMeasurementId({ sinsid: 'ABC-123' }), 'ABC-123');
  assert.equal(scadaCommon.resolveHistoryMeasurementId({ measurementId: 'XYZ-9' }), 'XYZ-9');
  assert.equal(scadaCommon.resolveHistoryMeasurementId({ sinsid: '  ' }), null);
  assert.equal(scadaCommon.resolveHistoryMeasurementId({}), null);
});

test('resolveHistoryMetricByEntity maps modes to P/Q/U metrics', () => {
  const hatActive = { scada: { active: { rows: [{ measurementId: 'a1' }, { measurementId: 'a2' }] } } };
  assert.deepEqual(
    scadaCommon.resolveHistoryMetricByEntity('hat-active', 'hat', hatActive),
    { metricType: 'active', elementName: 'P', unit: 'MW', measurementIds: ['a1', 'a2'] }
  );

  const trafoReactive = { scada: { reactive: { rows: [{ measurementId: 'q1' }] } } };
  assert.deepEqual(
    scadaCommon.resolveHistoryMetricByEntity('trafo-reactive', 'trafo', trafoReactive),
    { metricType: 'reactive', elementName: 'Q', unit: 'MVar', measurementIds: ['q1'] }
  );

  const bara = { scada: { voltage: { rows: [{ measurementId: 'u1' }] } } };
  assert.deepEqual(
    scadaCommon.resolveHistoryMetricByEntity('voltage', 'bara', bara),
    { metricType: 'voltage', elementName: 'U', unit: 'kV', measurementIds: ['u1'] }
  );

  const idsFallback = { scada: { reactive: { rows: [], ids: ['r9'] } } };
  assert.deepEqual(
    scadaCommon.resolveHistoryMetricByEntity('hat-reactive', 'hat', idsFallback),
    { metricType: 'reactive', elementName: 'Q', unit: 'MVar', measurementIds: ['r9'] }
  );

  const missing = { scada: { active: { rows: [], ids: [] } } };
  assert.deepEqual(
    scadaCommon.resolveHistoryMetricByEntity('hat-active', 'hat', missing),
    { metricType: 'active', elementName: 'P', unit: 'MW', measurementIds: [] }
  );
});

test('collectHistoryRowsByMid parses 2586-like raw rows with __timestamp', () => {
  const rows = [];
  const midA = '353deb9a-be6c-4437-9c17-f555cab193ea';
  const midB = 'afadf5a2-364a-459e-8f9e-94bc2d1ae274';
  const base = new Date(2026, 7, 20, 0, 0, 0).getTime();
  for (let minute = 0; minute < 1500; minute += 1) {
    const ts = new Date(base + minute * 60000).toISOString();
    rows.push({ __timestamp: ts, sinsid: minute % 2 === 0 ? midA : midB, elementName: 'P', maxValue: 100 + minute });
  }
  const parsed = scadaCommon.collectHistoryRowsByMid(rows, [midA, midB]);
  assert.equal(parsed.stats.total, 1500);
  assert.equal(parsed.stats.parsed, 1500);
  assert.ok(parsed.maxPoints >= 2, 'maxPoints must be >= 2 for distinct timestamps');
  assert.equal(parsed.byMid.get(midA).length, 750);
  assert.equal(parsed.byMid.get(midB).length, 750);
  assert.ok(parsed.perMidStats.get(midA).uniqueTimes >= 2);
});

test('collectHistoryRowsByMid ignores non-requested measurement ids', () => {
  const rows = [
    { __timestamp: '2026-08-20T11:00:00', sinsid: 'kullanici-istemedi', maxValue: 10 },
    { __timestamp: '2026-08-20T11:01:00', sinsid: 'kullanici-istemedi', maxValue: 11 },
    { __timestamp: '2026-08-20T11:02:00', sinsid: 'kullanici-istemedi', maxValue: 12 }
  ];
  const parsed = scadaCommon.collectHistoryRowsByMid(rows, ['kullanici-istedi']);
  assert.equal(parsed.stats.nonRequested, 3);
  assert.equal(parsed.stats.parsed, 0);
  assert.equal(parsed.maxPoints, 0);
});

test('collectHistoryRowsByMid reports missing time field and invalid timestamps', () => {
  const rows = [
    { __time: '2026-08-20T11:00:00', sinsid: 'm1', maxValue: 10 },
    { __time: '2026-08-20T11:01:00', sinsid: 'm1', maxValue: 11 },
    { __time: 'bos-satir', sinsid: 'm1', maxValue: 0 }
  ];
  const parsed = scadaCommon.collectHistoryRowsByMid(rows, ['m1']);
  assert.equal(parsed.stats.invalidTimestamp, 1);
  assert.ok(parsed.maxPoints >= 2);
});

test('formatHistoryAxisLabel renders day.month hour:minute', () => {
  const date = new Date(2026, 7, 20, 11, 15);
  assert.equal(scadaCommon.formatHistoryAxisLabel(date.getTime()), '20.08 11:15');
  assert.equal(scadaCommon.formatHistoryAxisLabel(new Date(2026, 0, 3, 9, 5).getTime()), '03.01 09:05');
  assert.equal(scadaCommon.formatHistoryAxisLabel('junk'), '');
});

test('scada-v2-runtime alias regex is fixed (no mojibake)', () => {
  const filePath = path.join(__dirname, '..', 'scada-v2-runtime.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const rawPartsLine = source.split('\n').find((line) => line.includes('split(/[^0-9A-Za-z'));
  assert.ok(rawPartsLine, 'alias variant split line must exist');
  assert.ok(rawPartsLine.includes('çğıöşüÇĞİÖŞÜ'), 'regex must contain correct Turkish letters');
  assert.ok(!rawPartsLine.includes('(Ã') && !rawPartsLine.includes('\\u009E'), 'regex must not contain mojibake');
});

test('scada-v2-runtime ranking close buttons are not mojibake before', () => {
  const filePath = path.join(__dirname, '..', 'scada-v2-runtime.js');
  const source = fs.readFileSync(filePath, 'utf8');
  assert.ok(source.includes('id="btnRankingClose">&times;</button>'), 'ranking close uses &times;');
  assert.ok(source.includes('id="btnCloseScadaAudit" class="info-close" title="Kapat">&times;</button>'), 'audit close uses &times;');
});

test('formatScadaTerminalLabel formatting logic', () => {
  const { formatScadaTerminalLabel } = scadaHooks;

  assert.equal(formatScadaTerminalLabel({ terminals: ['A', 'B', 'C'] }), 'A(B)>>C');
  assert.equal(formatScadaTerminalLabel({ terminals: ['A', '', 'C'] }), 'A>>C');
  assert.equal(formatScadaTerminalLabel({ terminals: ['A', 'B'] }), 'A(B)');
  assert.equal(formatScadaTerminalLabel({ terminals: ['A'] }), 'A');
  assert.equal(formatScadaTerminalLabel({ label: 'Fallback' }), 'Fallback');
});

test('getSeasonalCapacityMva extracts limits for hat', () => {
  const getSeasonalCapacityMva = (entityType, entity) => {
    if (entityType === 'hat') {
      const winter = Number(entity?.winterCapacityMva || 0);
      const summer = Number(entity?.summerCapacityMva || 0);
      return {
        summer: Number.isFinite(summer) && summer > 0 ? summer : null,
        winter: Number.isFinite(winter) && winter > 0 ? winter : null
      };
    }
    return { summer: null, winter: null };
  };

  assert.deepEqual(getSeasonalCapacityMva('hat', { summerCapacityMva: 150, winterCapacityMva: 180 }), { summer: 150, winter: 180 });
  assert.deepEqual(getSeasonalCapacityMva('hat', { summerCapacityMva: 0, winterCapacityMva: null }), { summer: null, winter: null });
  assert.deepEqual(getSeasonalCapacityMva('trafo', { summerCapacityMva: 150 }), { summer: null, winter: null });
});

test('buildHatCurrentLimitLines calculates correctly', () => {
  const { buildHatCurrentLimitLines } = scadaHooks;

  const lines = buildHatCurrentLimitLines({ summer: 100, winter: 150 }, 154);
  assert.equal(lines.length, 2);
  assert.equal(Math.round(lines[0].value), Math.round((1000 * 100) / (Math.sqrt(3) * 154)));
  assert.equal(Math.round(lines[1].value), Math.round((1000 * 150) / (Math.sqrt(3) * 154)));
});

test('_nearestVoltageValue matches within tolerance', () => {
  const { _nearestVoltageValue } = scadaHooks;

  const map = new Map([[1000, 154], [2000, 155]]);
  assert.equal(_nearestVoltageValue(map, 1100, 500), 154);
  assert.equal(_nearestVoltageValue(map, 1900, 500), 155);
  assert.equal(_nearestVoltageValue(map, 3000, 500), null); // Out of tolerance
});

test('buildHatCurrentSeries computes I correctly using nominal fallback with exact matching', () => {
  const { buildHatCurrentSeries } = scadaHooks;
  const chartSeries = [
    {
      seriesId: 'p_end', measurementId: 101, elementName: 'P', metricType: 'active',
      pairing: 'h:A>>B', terminalSide: 'end', terminals: ['A', 'x', 'B'],
      points: [{ ts: new Date(1000), value: 30 }]
    },
    {
      seriesId: 'q_end', measurementId: 102, elementName: 'Q', metricType: 'reactive',
      pairing: 'h:A>>B', terminalSide: 'end', terminals: ['A', 'x', 'B'],
      points: [{ ts: new Date(1000), value: 40 }] // 50 MVA
    }
  ];

  const voltageSeriesData = [
    {
      _voltageSide: 'start',
      _voltageQuality: 'Gerçek — terminal/bara eşleşmesi',
      points: [{ ts: new Date(1000), value: 160 }] // 160 kV at start
    },
    {
      _voltageSide: 'end',
      _voltageQuality: 'Gerçek — TM+kV eşleşmesi',
      points: [{ ts: new Date(1000), value: 153.2 }] // 153.2 kV at end
    }
  ];

  const entity = { startTm: 'A', endTm: 'B', kv: '154' };

  const result = buildHatCurrentSeries(chartSeries, voltageSeriesData, entity);
  assert.equal(result.length, 1);
  const currentSeries = result[0];
  assert.equal(currentSeries.terminalSide, 'end');

  // S = 50. Actual U = 153.2. I = (1000 * 50) / (sqrt(3) * 153.2) = 188.42
  const pt = currentSeries.points[0];
  assert.ok(pt.value > 188 && pt.value < 189);
  assert.equal(pt._usedVoltageKv, 153.2);
  assert.equal(pt._voltageSource, 'actual');
  assert.equal(pt._baraMatchQuality, 'Gerçek — TM+kV eşleşmesi');
  assert.notEqual(pt._baraMatchQuality, 'Nominal fallback');
});
test('resolveTerminalSide formatting logic', () => {
  const { resolveTerminalSide } = scadaHooks;
  assert.equal(resolveTerminalSide({ terminals: ['A', 'B', 'C'] }, { startTm: 'A', endTm: 'C' }), 'start');
  assert.equal(resolveTerminalSide({ terminals: ['A', 'B', 'C'] }, { startTm: 'C', endTm: 'A' }), 'end');
  assert.equal(resolveTerminalSide({ terminals: ['C', 'B', 'A'] }, { startTm: 'C', endTm: 'A' }), 'start'); // Inverse b3 matches start
});

test('transformReactiveSeries inverts end terminals for hats', () => {
  const { transformReactiveSeries } = scadaHooks;
  const series = [
    { elementName: 'Q', terminalSide: 'start', points: [{ value: 10 }] },
    { elementName: 'Q', terminalSide: 'end', points: [{ value: 15 }] },
    { elementName: 'Q', terminalSide: 'unknown', points: [{ value: 20 }] }
  ];
  const transformed = transformReactiveSeries(series, true);

  assert.equal(transformed[0]._displayLabel, 'Bas. +Q');
  assert.equal(transformed[0].points[0].value, 10);

  assert.equal(transformed[1]._displayLabel, 'Bit. -Q');
  assert.equal(transformed[1].points[0].value, -15);

  assert.equal(transformed[2]._displayLabel, '+Q');
  assert.equal(transformed[2].points[0].value, 20);
});

test('fetchHatVoltageHistory cache avoids duplicate Superset calls', async () => {
  const { fetchHatVoltageHistory } = scadaHooks;

  // Fake SCADA_COMMON mock
  global.SCADA_COMMON = {
    resolveHistoryMetricsByEntity: (type, entity) => {
      if (entity.id === 'b1') return { voltage: { measurementIds: [100] } };
      if (entity.id === 'b2') return { voltage: { measurementIds: [200] } };
      return null;
    },
    resolveHistoryValue: () => 154, resolveHistoryTimestamp: () => new Date(1000), resolveHistoryMeasurementId: (d) => d.sinsid, historySeriesId: () => 'id', findDataArray: (data) => data.map(d => ({ __timestamp: 1000, sinsid: d.sinsid, maxValue: 154 }))
  };

  // Mock global context (state) and chrome for this test
  global.state = {
    scada: { hatVoltageHistoryCache: new Map(), hatVoltageHistoryPromises: new Map() },
    network: {
      baraNodes: [
        { id: 'b1', tmName: 'TM1', gerilimKv: '154' },
        { id: 'b2', tmName: 'TM2', gerilimKv: '154' }
      ]
    }
  };

  let sendMessageCount = 0;
  global.SCADA_CONFIG = { SUPERSET_ORIGIN: 'mock', DASHBOARD_ID: 1, CHART_SLICE_ID: 1, DATASOURCE_ID: 1 };
  global.chrome = {
    runtime: {
      sendMessage: async (msg) => {
        sendMessageCount++;
        return { ok: true, data: [{sinsid: 100}, {sinsid: 200}] };
      }
    }
  };

  const entity = { id: 'hat1', kv: '154', startTm: 'TM1', endTm: 'TM2', startBaraId: 'b1', endBaraId: 'b2' };
  const range = { startMs: 0, endMs: 1000 };
  const strategy = { queryMode: 'raw', timeGrain: 'PT1H' };

  // Call 1
  const res1 = await fetchHatVoltageHistory(entity, range, strategy);
  assert.equal(sendMessageCount, 1);
  assert.equal(res1.nominal, false);

  // Call 2 (cached)
  const res2 = await fetchHatVoltageHistory(entity, range, strategy);
  assert.equal(sendMessageCount, 1); // No new call!
  assert.equal(res2.nominal, false);
});

test('fetchHatVoltageHistory cache distinguishes reversed start/end terminals', async () => {
  const { fetchHatVoltageHistory } = scadaHooks;

  global.state.scada.hatVoltageHistoryCache = new Map();
  global.state.scada.hatVoltageHistoryPromises = new Map();

  let sendMessageCount = 0;
  global.chrome.runtime.sendMessage = async () => {
    sendMessageCount++;
    return { ok: true, data: [{sinsid: 100}, {sinsid: 200}] };
  };

  const entity1 = { id: 'hat1', kv: '154', startTm: 'TM1', endTm: 'TM2', startBaraId: 'b1', endBaraId: 'b2' };
  const entity2 = { id: 'hat2', kv: '154', startTm: 'TM2', endTm: 'TM1', startBaraId: 'b2', endBaraId: 'b1' };
  const range = { startMs: 0, endMs: 1000 };
  const strategy = { queryMode: 'raw', timeGrain: 'PT1H' };

  await fetchHatVoltageHistory(entity1, range, strategy);
  assert.equal(sendMessageCount, 1);

  // Call with reversed terminals
  await fetchHatVoltageHistory(entity2, range, strategy);
  assert.equal(sendMessageCount, 2); // MUST call again because cache key is different!
});

test('YIBITAS-YERKOY E2E regression: parseHistorySeriesByElement extracts metadata from entity when aggregate response lacks B-names', () => {
  const entity = {
    id: 'hat-yib',
    startTm: 'yibitas',
    endTm: 'yerkoy',
    scada: {
      active: {
        rows: [
          { measurementId: 'P1', b1Name: 'YIBITAS', b2Name: '154', b3Name: 'YERKOY', terminalSide: 'start', candidateSlot: 'primary' },
          { measurementId: 'P2', b1Name: 'YERKOY', b2Name: '154', b3Name: 'YIBITAS', terminalSide: 'end', candidateSlot: 'primary' }
        ]
      },
      reactive: {
        rows: [
          { measurementId: 'Q1', b1Name: 'YIBITAS', b2Name: '154', b3Name: 'YERKOY', terminalSide: 'start', candidateSlot: 'primary' },
          { measurementId: 'Q2', b1Name: 'YERKOY', b2Name: '154', b3Name: 'YIBITAS', terminalSide: 'end', candidateSlot: 'primary' }
        ]
      }
    }
  };

  const metricList = [
    { elementName: 'P', metricType: 'active', measurementIds: ['P1', 'P2'] },
    { elementName: 'Q', metricType: 'reactive', measurementIds: ['Q1', 'Q2'] }
  ];

  const rows = [
    { sinsid: 'P1', timestamp: 1000, 'AVG(maxValue)': 100 },
    { sinsid: 'P2', timestamp: 1000, 'AVG(maxValue)': -100 },
    { sinsid: 'Q1', timestamp: 1000, 'AVG(maxValue)': 20 },
    { sinsid: 'Q2', timestamp: 1000, 'AVG(maxValue)': -20 }
  ];

  global.SCADA_COMMON = require('../scada-common.js');
  const parsed = scadaHooks.parseHistorySeriesByElement(rows, metricList);
  scadaHooks.enrichHatHistorySeriesMetadata(parsed.series, entity);

  assert.strictEqual(parsed.series.length, 4);
  const p1 = parsed.series.find(s => s.measurementId === 'P1');
  assert.strictEqual(p1.terminalSide, 'start');
  assert.strictEqual(p1.label, 'YIBITAS(154)>>YERKOY');

  // Verify Current series ignores missing voltage and uses nominal
    const chartSeries = parsed.series.map(s => {
    s.pairing = 'h:' + s.terminalSide;
    return s;
  });
  const currentSeries = scadaHooks.buildHatCurrentSeries(chartSeries, [], { kv: 154 });
  assert.strictEqual(currentSeries.length, 2);
  assert.strictEqual(currentSeries[0].points[0]._voltageSource, 'nominal');
  assert.strictEqual(parsed.series.filter(s => s.metricType === 'active').length, 2);
  assert.strictEqual(parsed.series.filter(s => s.metricType === 'reactive').length, 2);
  const sSeries = scadaHooks.buildHistoryCapacitySeries(chartSeries, { timeGrain: 'PT1M' });
  assert.strictEqual(sSeries.length, 2);
  const badLabels = parsed.series.filter(s => s.label.startsWith('Olcum'));
  assert.strictEqual(badLabels.length, 0);
});

test('YIBITAS-YERKOY MVA pane always shows even if data is missing', () => {
  // Pass empty chartSeries
  const sSeries = scadaHooks.buildHistoryCapacitySeries([], { timeGrain: 'PT1M' });
  assert.strictEqual(sSeries.length, 0);
});

test('resolveHatTerminalVoltageBara chooses deterministic voltage bara if matches > 1', () => {
  global.state = {
    network: {
      baraNodes: [
        { id: 'b1', tmName: 'YIBITAS', gerilimKv: '154' },
        { id: 'b2', tmName: 'YIBITAS', gerilimKv: '154' },
        { id: 'b3', tmName: 'YERKOY', gerilimKv: '154' }
      ]
    }
  };
  global.SCADA_COMMON.resolveHistoryMetricsByEntity = (type, entity) => {
    if (entity.id === 'b2') return { voltage: { measurementIds: ['U1'] } };
    return { voltage: { measurementIds: [] } };
  };

  const entity = { kv: '154', startTm: 'YIBITAS', endTm: 'YERKOY' };
  const res = scadaHooks.resolveHatTerminalVoltageBara(entity);
  assert.strictEqual(res.startMatch.quality, 'tm-kv');
  assert.strictEqual(res.startMatch.bara.id, 'b2'); // b2 has U measurement ID!
});

test('YIBITAS-YERKOY integration: mountInteractiveHistoryChart renders 5 panes with correct lengths and pairing', () => {
  const entity = {
    id: 'hat-yib',
    startTm: 'yibitas',
    endTm: 'yerkoy',
    kv: '154',
    scada: {
      active: {
        rows: [
          { measurementId: 'P1', b1Name: 'YIBITAS', b2Name: '154', b3Name: 'YERKOY', terminalSide: 'start', candidateSlot: 'primary' },
          { measurementId: 'P2', b1Name: 'YERKOY', b2Name: '154', b3Name: 'YIBITAS', terminalSide: 'end', candidateSlot: 'primary' }
        ]
      },
      reactive: {
        rows: [
          { measurementId: 'Q1', b1Name: 'YIBITAS', b2Name: '154', b3Name: 'YERKOY', terminalSide: 'start', candidateSlot: 'primary' },
          { measurementId: 'Q2', b1Name: 'YERKOY', b2Name: '154', b3Name: 'YIBITAS', terminalSide: 'end', candidateSlot: 'primary' }
        ]
      }
    }
  };

  const metricList = [
    { elementName: 'P', metricType: 'active', measurementIds: ['P1', 'P2'] },
    { elementName: 'Q', metricType: 'reactive', measurementIds: ['Q1', 'Q2'] }
  ];

  // PT1M regression check
  const rows = [
    { sinsid: 'P1', timestamp: new Date('2026-08-20T13:10:00Z').getTime(), 'AVG(maxValue)': 100 },
    { sinsid: 'P2', timestamp: new Date('2026-08-20T13:10:00Z').getTime(), 'AVG(maxValue)': -100 },
    // Q is at 13:14:00 (4 minutes apart) -> PT1M strategy is 60s max tolerance
    { sinsid: 'Q1', timestamp: new Date('2026-08-20T13:14:00Z').getTime(), 'AVG(maxValue)': 20 },
    { sinsid: 'Q2', timestamp: new Date('2026-08-20T13:14:00Z').getTime(), 'AVG(maxValue)': -20 }
  ];

  global.SCADA_COMMON = require('../scada-common.js');
  const parsed = scadaHooks.parseHistorySeriesByElement(rows, metricList);
  scadaHooks.enrichHatHistorySeriesMetadata(parsed.series, entity);

  const canvasEl = { replaceChildren: () => {}, innerHTML: '', appendChild: () => {}, querySelector: () => null };
  const tooltipEl = { style: {} };
  const config = {
    entityType: 'hat',
    entity,
    series: parsed.series,
    _voltageFetchData: { series: [] },
    strategy: { timeGrain: 'PT1M' }
  };

  global.window = { __SCADA_V2_TEST_HOOKS__: {} };

  const context = { state: { filters: {}, scada: { capacitySeason: "summer", entityMetricsByKey: new Map(), getNetworkModelMap: () => new Map(), history: new Map(), history24hCache: new Map(), hatVoltageHistoryCache: new Map(), timeMode: "live" } }, SCADA_CONFIG: {}, document: { createElementNS: () => ({ addEventListener: () => {},  setAttribute: () => {}, appendChild: () => {}, append: () => {}, classList: { add: () => {} }, style: {}, getBoundingClientRect: () => ({ width: 920, height: 600 }), remove: () => {} }), createElement: () => ({ addEventListener: () => {},  setAttribute: () => {}, appendChild: () => {}, append: () => {}, classList: { add: () => {} }, style: {}, getBoundingClientRect: () => ({ width: 920, height: 600 }), remove: () => {} }), createDocumentFragment: () => ({ appendChild: () => {}, append: () => {} }), addEventListener: () => {} }, window: { __SCADA_V2_TEST_HOOKS__: {}, addEventListener: () => {}, removeEventListener: () => {} }, SCADA_COMMON: global.SCADA_COMMON, console, setCapacitySeason: () => {}, initScadaCard: () => {} };
  context.globalThis = context; context.global = context; require('node:vm').createContext(context);
  const code = require('fs').readFileSync('scada-v2-runtime.js', 'utf8');
  require('node:vm').runInContext(code, context);
  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  const panes = context.window.__SCADA_V2_TEST_HOOKS__.lastPanes;
  
  assert.ok(panes);
  assert.strictEqual(panes.length, 5);

  const keys = panes.map(p => p.key);
  assert.strictEqual(keys.join(','), "active,reactive,capacity,current,hat-voltage");

  const activePane = panes.find(p => p.key === 'active');
  const reactivePane = panes.find(p => p.key === 'reactive');
  const capacityPane = panes.find(p => p.key === 'capacity');
  const currentPane = panes.find(p => p.key === 'current');
  const voltagePane = panes.find(p => p.key === 'hat-voltage');

  assert.strictEqual(activePane.seriesGroup.length, 2);
  assert.strictEqual(reactivePane.seriesGroup.length, 2);
  assert.strictEqual(capacityPane.seriesGroup.length, 2);
  assert.strictEqual(currentPane.seriesGroup.length, 2);
  assert.strictEqual(voltagePane.seriesGroup.length, 0);

  // Even though there are 2 series, their points array is empty because PT1M tolerance doesn't match 4 mins
  assert.strictEqual(capacityPane.seriesGroup[0].points.length, 0);
  assert.strictEqual(currentPane.seriesGroup[0].points.length, 0);

  // But if we simulate matching Q by making it within 60s
  config.series[2].points[0].ts = new Date(config.series[0].points[0].ts.getTime() + 30000);
  config.series[3].points[0].ts = new Date(config.series[1].points[0].ts.getTime() + 30000);
  
  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  const matchedPanes = context.window.__SCADA_V2_TEST_HOOKS__.lastPanes;
  const matchedCurrentPane = matchedPanes.find(p => p.key === 'current');
  
  console.log(JSON.stringify(matchedCurrentPane.seriesGroup, null, 2)); assert.strictEqual(matchedCurrentPane.seriesGroup[0].points.length, 1);
  assert.strictEqual(matchedCurrentPane.seriesGroup[0].points[0]._usedVoltageKv, 154);
  assert.strictEqual(matchedCurrentPane.seriesGroup[0].points[0]._voltageSource, 'nominal');

  // Verify no Olcum label
  let badLabels = 0;
  panes.forEach(pane => {
      pane.seriesGroup.forEach(s => {
          if (/Olcum|Ölçüm/.test(s.label)) badLabels++;
      });
  });
  assert.strictEqual(badLabels, 0);
});
