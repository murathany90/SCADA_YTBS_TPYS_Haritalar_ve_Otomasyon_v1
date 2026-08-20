const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scadaCommon = require('../scada-common.js');

test('parseSupersetScadaTimestamp handles epoch seconds and milliseconds', () => {
  const secs = 1724134500;
  const ms = secs * 1000;
  const fromSecs = scadaCommon.normalizeTimestamp(secs);
  const fromMs = scadaCommon.normalizeTimestamp(ms);
  assert.ok(fromSecs instanceof Date);
  assert.ok(fromMs instanceof Date);
  assert.equal(fromSecs.getTime(), ms);
  assert.equal(fromMs.getTime(), ms);
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