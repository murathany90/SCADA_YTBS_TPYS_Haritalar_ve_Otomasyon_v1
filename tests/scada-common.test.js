const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scadaCommon = require('../scada-common.js');

const fixtureAPath = path.join(__dirname, '..', 'docs', '20260419_191935.csv');
const fixtureBPath = path.join(__dirname, '..', 'docs', '20260419_192257.csv');

function readFixture(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function selectNewestRows(rows, nowMs) {
  const selected = new Map();
  rows.forEach((row) => {
    if (String(row.elementName || '').trim() !== 'P') return;
    const sinsid = String(row.sinsid || '').trim();
    if (!sinsid) return;
    const ts = scadaCommon.normalizeTimestamp(row['MAX(__time)'], nowMs);
    if (!ts) return;
    const current = selected.get(sinsid);
    if (!current || current.timestamp < ts) selected.set(sinsid, { row, timestamp: ts });
  });
  return selected;
}

test('CSV fixtures parse with expected row counts and schema', () => {
  const rowsA = scadaCommon.parseScadaCsvSnapshot(readFixture(fixtureAPath));
  const rowsB = scadaCommon.parseScadaCsvSnapshot(readFixture(fixtureBPath));

  assert.equal(rowsA.length, 806);
  assert.equal(rowsB.length, 802);

  const keys = Object.keys(rowsA[0]);
  assert.deepEqual(keys, [
    'sinsid',
    'TM (b1Name)',
    'b2Name',
    'b3Name',
    'elementName',
    'MAX(__time)',
    'AVG(maxValue)'
  ]);
});

test('normalizeScadaCsvSnapshot keeps only P rows and selects newest timestamp by sinsid', () => {
  const parsedA = scadaCommon.parseScadaCsvSnapshot(readFixture(fixtureAPath));
  const parsedB = scadaCommon.parseScadaCsvSnapshot(readFixture(fixtureBPath));
  const combined = parsedA.concat(parsedB);
  const nowMs = new Date('2026-04-19T20:30:00.000Z').getTime();

  const expected = selectNewestRows(combined, nowMs);
  const normalized = scadaCommon.normalizeScadaEntries(combined, { nowMs });

  assert.ok(normalized.size > 0);
  assert.equal(normalized.size, expected.size);

  for (const [sinsid, expectedRow] of expected.entries()) {
    const actual = normalized.get(sinsid);
    assert.ok(actual, `normalized map should contain ${sinsid}`);
    assert.equal(actual.elementName, 'P');
    assert.equal(actual.timestamp.toISOString(), expectedRow.timestamp.toISOString());
  }
});

test('fixture-level normalization works directly from CSV text', () => {
  const normalizedA = scadaCommon.normalizeScadaCsvSnapshot(readFixture(fixtureAPath));
  const normalizedB = scadaCommon.normalizeScadaCsvSnapshot(readFixture(fixtureBPath));

  assert.ok(normalizedA.size > 0);
  assert.ok(normalizedB.size > 0);
});

test('computeVisibleSummary counts visible hats by matched, stale and unmatched states', () => {
  const visibleHats = [
    { id: 'hat-live' },
    { id: 'hat-stale' },
    { id: 'hat-dup' },
    { id: 'hat-none' }
  ];
  const lineFlowByLineId = new Map([
    ['hat-live', { staleState: 'live', unavailable: false }],
    ['hat-stale', { staleState: 'dead', unavailable: false }],
    ['hat-dup', { staleState: 'live', unavailable: false }]
  ]);
  const duplicateHatIds = new Set(['hat-dup']);

  const summary = scadaCommon.computeVisibleSummary({
    visibleHats,
    lineFlowByLineId,
    duplicateHatIds,
    updatedAt: new Date('2026-04-19T20:15:00.000Z'),
    filterKey: 'kv:154|ytm:Orta Anadolu YTM'
  });

  assert.deepEqual(summary, {
    total: 4,
    matched: 1,
    unmatched: 2,
    stale: 1,
    duplicateMapped: 1,
    updatedAt: new Date('2026-04-19T20:15:00.000Z'),
    filterKey: 'kv:154|ytm:Orta Anadolu YTM'
  });
});

test('buildChartPayload carries network contract filters and 10-minute window', () => {
  const payload = scadaCommon.buildChartPayload({
    chartSliceId: 454,
    datasourceId: 3
  });

  assert.equal(payload.form_data.time_range, 'DATEADD(DATETIME("now"), -10, minute) : now');
  assert.equal(payload.form_data.row_limit, 50000);
  assert.deepEqual(payload.queries[0].filters, [
    { col: 'elementName', op: '==', val: 'P' },
    { col: 'b2Name', op: 'IN', val: ['400', '380', '420', '154'] },
    { col: 'tear', op: 'IN', val: ['Golbasi_YTM'] }
  ]);
});

test('buildChartPayload supports multiple element filters and measurement id scope', () => {
  const payload = scadaCommon.buildChartPayload({
    chartSliceId: 454,
    datasourceId: 3,
    kvFilters: [],
    tearFilters: [],
    elementNames: ['P', 'Q'],
    measurementIds: ['id-1', 'id-2']
  });

  assert.deepEqual(payload.queries[0].filters, [
    { col: 'elementName', op: 'IN', val: ['P', 'Q'] },
    { col: 'sinsid', op: 'IN', val: ['id-1', 'id-2'] }
  ]);
  assert.deepEqual(payload.form_data.adhoc_filters, [
    {
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'elementName',
      operator: 'IN',
      comparator: ['P', 'Q']
    },
    {
      clause: 'WHERE',
      expressionType: 'SIMPLE',
      subject: 'sinsid',
      operator: 'IN',
      comparator: ['id-1', 'id-2']
    }
  ]);
});

test('normalizeMetricRows keeps requested element names and newest timestamp per measurement id', () => {
  const rawJson = {
    result: [
      {
        data: [
          {
            sinsid: 'm-1',
            b1Name: 'TM-A',
            b2Name: '154',
            b3Name: 'TM-B',
            elementName: 'P',
            'MAX(__time)': '2026-04-20T10:00:00.000Z',
            'AVG(maxValue)': '12.3'
          },
          {
            sinsid: 'm-1',
            b1Name: 'TM-A',
            b2Name: '154',
            b3Name: 'TM-B',
            elementName: 'P',
            'MAX(__time)': '2026-04-20T10:05:00.000Z',
            'AVG(maxValue)': '13.1'
          },
          {
            sinsid: 'm-2',
            b1Name: 'TM-A',
            b2Name: '154',
            b3Name: 'TM-B',
            elementName: 'Q',
            'MAX(__time)': '2026-04-20T10:06:00.000Z',
            'AVG(maxValue)': '-4.6'
          },
          {
            sinsid: 'm-3',
            b1Name: 'TM-A',
            b2Name: '154',
            b3Name: 'TM-B',
            elementName: 'U',
            'MAX(__time)': '2026-04-20T10:07:00.000Z',
            'AVG(maxValue)': '153.2'
          }
        ]
      }
    ]
  };

  const rows = scadaCommon.normalizeMetricRows(rawJson, { elementNames: ['P', 'Q'] });

  assert.equal(rows.size, 4); // each unique row creates 2 keys for compatibility
  assert.equal(rows.get('m-1').value, 13.1);
  assert.equal(rows.get('m-1').elementName, 'P');
  assert.equal(rows.get('m-2').value, -4.6);
  assert.equal(rows.has('m-3'), false);
});

test('computeAuditReport classifies visible hats by mismatch reason', () => {
  const visibleHats = [
    { id: 'live', name: 'Live Hat', kv: '154', ytmNames: ['OA'], startTm: 'A', endTm: 'B', olcumNoktasiIdAktif: 'live-id' },
    { id: 'stale', name: 'Stale Hat', kv: '154', ytmNames: ['OA'], startTm: 'B', endTm: 'C', olcumNoktasiIdAktif: 'stale-id' },
    { id: 'dup', name: 'Dup Hat', kv: '400', ytmNames: ['OA'], startTm: 'C', endTm: 'D', olcumNoktasiIdAktif: 'dup-id' },
    { id: 'missing-id', name: 'Missing Id Hat', kv: '154', ytmNames: ['OA'], startTm: 'D', endTm: 'E', olcumNoktasiIdAktif: '' },
    { id: 'missing-source', name: 'Missing Source Hat', kv: '154', ytmNames: ['OA'], startTm: 'E', endTm: 'F', olcumNoktasiIdAktif: 'ghost-id' }
  ];
  const rowsBySinsid = new Map([
    ['live-id', { timestamp: new Date('2026-04-20T00:00:00.000Z'), activePowerMw: 12, tmName: 'A', remoteName: 'B' }],
    ['stale-id', { timestamp: new Date('2026-04-19T23:40:00.000Z'), activePowerMw: 20, tmName: 'B', remoteName: 'C' }]
  ]);
  const lineFlowByLineId = new Map([
    ['live', { staleState: 'live', unavailable: false, mw: 12, loadingPct: 10, capacityMva: 120 }],
    ['stale', { staleState: 'dead', unavailable: false, mw: 20, loadingPct: 30, capacityMva: 100 }]
  ]);
  const report = scadaCommon.computeAuditReport({
    visibleHats,
    rowsBySinsid,
    lineFlowByLineId,
    duplicateHatIds: new Set(['dup']),
    rawRows: 852,
    filterKey: 'kv:154,400|ytm:OA'
  });

  assert.deepEqual(report.summary, {
    visibleTotal: 5,
    rawRows: 852,
    normalizedRows: 2,
    live: 1,
    stale: 1,
    structuralMatches: 2,
    missingActiveId: 1,
    missingSourceRow: 1,
    duplicateMapping: 1,
    transportUnavailable: 0,
    unmatchedTotal: 3,
    filterKey: 'kv:154,400|ytm:OA',
    queryContract: null
  });
  assert.equal(report.mismatches.length, 3);
  assert.equal(report.rows.find((row) => row.hatId === 'dup').status, 'duplicate-mapping');
  assert.equal(report.rows.find((row) => row.hatId === 'missing-id').status, 'missing-active-id');
  assert.equal(report.rows.find((row) => row.hatId === 'missing-source').status, 'missing-source-row');
});

test('buildChartPayload with empty kvFilters and tearFilters retains empty arrays and does not use defaults', () => {
  const payload = scadaCommon.buildChartPayload({
    chartSliceId: 454,
    datasourceId: 3,
    kvFilters: [],
    tearFilters: [],
    elementNames: ['P'],
    measurementIds: ['123', '456']
  });

  const filters = payload.queries[0].filters;
  const adhocFilters = payload.form_data.adhoc_filters;

  // Should not contain b2Name (kv) or tear filters
  assert.equal(filters.some(f => f.col === 'b2Name'), false);
  assert.equal(filters.some(f => f.col === 'tear'), false);

  assert.equal(adhocFilters.some(f => f.subject === 'b2Name'), false);
  assert.equal(adhocFilters.some(f => f.subject === 'tear'), false);
});

test('buildHistoryPayload for timeseries contains time_grain_sqla and is_timeseries', () => {
  const payload = scadaCommon.buildHistoryPayload({
    elementNames: ['P'],
    measurementIds: ['111', '222'],
    queryMode: 'timeseries'
  });

  const query = payload.queries[0];
  assert.equal(query.time_grain_sqla, 'PT1M');
  assert.equal(query.is_timeseries, true);
  assert.ok(query.columns.includes('sinsid'), 'columns includes sinsid');
  assert.equal(query.time_grain, undefined, 'should NOT have time_grain');
});
