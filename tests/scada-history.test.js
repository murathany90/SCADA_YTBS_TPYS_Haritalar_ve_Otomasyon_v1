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
