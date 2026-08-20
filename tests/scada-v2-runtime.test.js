const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const runtimePath = path.join(__dirname, '..', 'scada-v2-runtime.js');
const runtimeCode = fs.readFileSync(runtimePath, 'utf8');
const scadaCommon = require('../scada-common.js');

function loadRuntime() {
  const context = {
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Map,
    Set,
    Promise,
    __SCADA_V2_TEST_HOOKS__: {},
    SCADA_COMMON: scadaCommon,
    state: {
      scada: {
        logs: [],
        history: new Map(),
        entityMetricsByKey: new Map(),
        measurementRowsById: new Map(),
        lineFlowByLineId: new Map(),
        fetchInProgress: false
      },
      filters: { scadaMetric: 'hat-active', scadaListEntity: 'hat', showHat: true },
      network: { hatLines: [], trafos: [], baraNodes: [] },
      ui: {}
    },
    SCADA_CONFIG: {
      STALE_WARN_SEC: 600,
      STALE_DEAD_SEC: 3600,
      HAT_AMBIGUOUS_ABS_TOLERANCE_MW: 12,
      HAT_AMBIGUOUS_REL_TOLERANCE: 0.08,
      HISTORY_MAX: 20,
      STALE_COLOR: '#f59e0b',
      QUERY_TIME_RANGE: 'DATEADD(DATETIME("now"), -24, hour) : now',
      QUERY_ROW_LIMIT: 50000,
      LOADING_THRESHOLDS: [
        { max: 30, color: '#22c55e', label: '0-30%' },
        { max: 55, color: '#eab308', label: '30-55%' },
        { max: 65, color: '#f97316', label: '55-65%' },
        { max: 80, color: '#ef4444', label: '65-80%' },
        { max: 90, color: '#dc2626', label: '80-90%' },
        { max: Infinity, color: '#7c3aed', label: '90%+' }
      ],
      NO_MATCH_COLOR: '#9ca3af',
      UNMATCHED_HAT_COLOR: '#4b5563',
      FLOW_MIN_WIDTH: 1.5,
      FLOW_MAX_WIDTH: 6,
      FLOW_PCT_SCALE: 100,
      MOCK_ENABLED: false
    },
    SCADA_ERROR: {
      AUTH_REQUIRED: 'AUTH_REQUIRED',
      NETWORK_ERROR: 'NETWORK_ERROR',
      EMPTY_DATA: 'EMPTY_DATA',
      PARSE_ERROR: 'PARSE_ERROR',
      NO_MATCH_FOUND: 'NO_MATCH_FOUND',
      STALE_DATA: 'STALE_DATA',
      DUPLICATE_MAPPING: 'DUPLICATE_MAPPING',
      TRANSPORT_ERROR: 'TRANSPORT_ERROR',
      EXTENSION_UNAVAILABLE: 'EXTENSION_UNAVAILABLE'
    },
    normalizeText(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
    },
    getVisibleHats: () => [],
    getVisibleTrafoEntities: () => [],
    getVisibleBaras: () => [],
    getScadaVisibilityFilterKey: () => 'test-filter',
    requestRender: () => {},
    updateScadaCardUI: () => {},
    refreshRankingTable: () => {},
    buildNetworkIndexes: () => {},
    scadaLog: () => {},
    setScadaStatusMessage: () => {},
    updateScadaFetchMeta: () => {},
    countScadaTransportRows: () => 0,
    updateScadaTransportState: () => {},
    scadaFetchMock: async () => ({ ok: true, data: {} }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    chrome: { runtime: { sendMessage: async () => ({ ok: false }) } },
    getFlowColor: (value) => value > 80 ? '#7c3aed' : value > 55 ? '#f97316' : '#22c55e',
    getFlowWidth: () => 2,
    currentGeoBounds: () => ({}),
    intersects: () => true,
    projectPoint: () => ({ x: 0, y: 0 }),
    attachHoverTooltip: () => {},
    openScadaHatDetails: () => {},
    escapeHtml: (value) => String(value || ''),
    setCapacitySeason: () => {},
    document: {
      querySelectorAll: () => [],
      getElementById: () => null,
      querySelector: () => null,
      createDocumentFragment: () => ({ appendChild() {} }),
      createElement: () => ({
        setAttribute() {},
        setAttributeNS() {},
        appendChild() {},
        addEventListener() {},
        remove() {},
        style: {}
      })
    },
    initScadaCard: () => {}
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(runtimeCode, context);
  return context;
}

function buildTerminalEntity(overrides = {}) {
  return {
    id: 'hat-1',
    name: 'Test Hat',
    startTm: 'TM-A',
    endTm: 'TM-B',
    startTmRef: { name: 'TM-A', ucteKodu: 'TMA', psseAdi: 'TMA' },
    endTmRef: { name: 'TM-B', ucteKodu: 'TMB', psseAdi: 'TMB' },
    winterCapacityMva: 200,
    summerCapacityMva: 180,
    ...overrides
  };
}

function buildTerminalCandidate(measurementId, side, sign, overrides = {}) {
  const terminalSign = side === 'start' ? 1 : side === 'end' ? -1 : null;
  return {
    measurementId,
    candidateSlot: side === 'start' ? 'primary' : side === 'end' ? 'secondary' : 'extra',
    sourceSide: side === 'start' || side === 'end' ? side : 'unknown',
    targetSide: side === 'start' ? 'end' : side === 'end' ? 'start' : 'unknown',
    terminalSide: side,
    terminalMatchBasis: side === 'unknown' ? '' : 'tm-name-exact',
    polarizationSign: terminalSign,
    polarizationConsistent: terminalSign == null ? null : terminalSign === sign,
    formulaParts: [{ parsed: true, sign }],
    ...overrides
  };
}

test('resolveHatMetric tolerates close same-timestamp dual terminal values', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity();

  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-1', 'start', 1),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 100 }
    },
    {
      candidate: buildTerminalCandidate('m-2', 'end', -1),
      row: { tmName: 'TM-B', remoteName: 'TM-A', timestamp, value: -108 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.sourceAmbiguous, false);
  assert.equal(resolved.resolvedFromMultiple, true);
  assert.equal(resolved.measurementId, 'm-1,m-2');
  // After tolerance-primary fix: primary candidate value is kept, not mean
  assert.equal(resolved.normalizedValue, 100);
  assert.ok(Number.isFinite(resolved.candidateMean), 'candidateMean should be set as diagnostic');
  assert.equal(Math.round(resolved.candidateMean * 10) / 10, 104);
  assert.equal(resolved.directionResolvedBy, 'terminal-exit-model');
  assert.equal(resolved.orientationMatch, 'forward');
});

test('resolveHatMetric resolves terminal polarity for all four sign/side combinations', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity();
  const cases = [
    { side: 'start', sign: 1, value: 55, normalized: 55, match: 'forward' },
    { side: 'start', sign: 1, value: -55, normalized: -55, match: 'reverse' },
    { side: 'end', sign: -1, value: 40, normalized: -40, match: 'reverse' },
    { side: 'end', sign: -1, value: -40, normalized: 40, match: 'forward' }
  ];

  cases.forEach((testCase, index) => {
    const resolved = resolveHatMetric(entity, 'active', [
      {
        candidate: buildTerminalCandidate(`m-${index}`, testCase.side, testCase.sign),
        row: { tmName: testCase.side === 'start' ? 'TM-A' : 'TM-B', remoteName: testCase.side === 'start' ? 'TM-B' : 'TM-A', timestamp, value: testCase.value }
      }
    ]);
    assert.equal(resolved.normalizedValue, testCase.normalized);
    assert.equal(resolved.orientationMatch, testCase.match);
    assert.equal(resolved.directionResolvedBy, 'terminal-exit-model');
  });
});

test('resolveHatMetric keeps far-apart same-timestamp dual terminal values as warning on primary slot', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity({ id: 'hat-2' });

  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-1', 'start', 1),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 100 }
    },
    {
      candidate: buildTerminalCandidate('m-2', 'end', -1),
      row: { tmName: 'TM-B', remoteName: 'TM-A', timestamp, value: -140 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.candidateConflict, true);
  assert.equal(resolved.resolutionMethod, 'primary-conflict');
  assert.equal(resolved.selectedCandidate, 'm-1');
  assert.equal(resolved.normalizedValue, 100);
});

test('resolveHatMetric marks unknown terminal side as unresolved', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity({ id: 'hat-source-unknown' });

  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-1', 'unknown', 1, {
        candidateSlot: 'extra',
        polarizationSign: null,
        polarizationConsistent: null
      }),
      row: { tmName: 'SCADA-X', remoteName: 'SCADA-Y', timestamp, value: 100 }
    }
  ]);

  assert.equal(resolved.unresolved, true);
  assert.equal(resolved.unresolvedReason, 'source-side-unknown');
  assert.equal(resolved.normalizedValue, null);
});

test('resolveHatMetric resolves terminal mismatch from terminal exit model and keeps debug warning', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity({ id: 'hat-polarity-mismatch' });

  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-1', 'start', -1, { polarizationConsistent: false }),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 55 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.unresolvedReason, '');
  assert.equal(resolved.normalizedValue, 55);
  assert.equal(resolved.resolvedTerminalMismatch, true);
  assert.equal(resolved.directionResolvedBy, 'terminal-exit-model');
});

test('resolveHatMetric gives priority to row source TM over candidate terminal metadata', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const entity = buildTerminalEntity({ id: 'hat-row-source-priority' });

  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-row-priority', 'end', -1, {
        sourceSide: 'end',
        terminalSide: 'end',
        terminalMatchBasis: 'candidate-meta'
      }),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: -60 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.terminalSide, 'start');
  assert.equal(resolved.terminalMatchBasis.includes('row-tm'), true);
  assert.equal(resolved.normalizedValue, -60);
  assert.equal(resolved.orientationMatch, 'reverse');
});

test('resolveHatMetric filters invalid active candidates by 1.5x capacity before latest timestamp choice', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-capacity-filter',
    winterCapacityMva: 200,
    summerCapacityMva: 200
  });

  const older = new Date('2026-04-20T08:07:00.000Z');
  const newer = new Date('2026-04-20T08:08:00.000Z');
  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-valid', 'start', 1),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp: older, value: 180 }
    },
    {
      candidate: buildTerminalCandidate('m-invalid', 'end', -1),
      row: { tmName: 'TM-B', remoteName: 'TM-A', timestamp: newer, value: -340 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.selectedCandidate, 'm-valid');
  assert.equal(resolved.valueInvalid, false);
  assert.equal(resolved.selectedCandidateReason.includes('Kapasite'), true);
});

test('resolveHatMetric marks active value invalid when all candidates exceed 1.5x capacity', () => {
  const context = loadRuntime();
  const { resolveHatMetric } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-capacity-invalid',
    winterCapacityMva: 100,
    summerCapacityMva: 100
  });
  const timestamp = new Date('2026-04-20T08:07:00.000Z');
  const resolved = resolveHatMetric(entity, 'active', [
    {
      candidate: buildTerminalCandidate('m-invalid-a', 'start', 1),
      row: { tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 180 }
    },
    {
      candidate: buildTerminalCandidate('m-invalid-b', 'end', -1),
      row: { tmName: 'TM-B', remoteName: 'TM-A', timestamp, value: -170 }
    }
  ]);

  assert.equal(resolved.unresolved, false);
  assert.equal(resolved.resolutionMethod, 'invalid-value');
  assert.equal(resolved.valueInvalid, true);
  assert.equal(resolved.capacityFilterPassed, false);
});

test('buildVisibleSummary counts warning and unresolved records as ambiguous instead of matched', () => {
  const context = loadRuntime();
  const { buildVisibleSummary } = context.__SCADA_V2_TEST_HOOKS__;
  context.state.scada.lastDataTimestamp = new Date('2026-04-20T08:07:00.000Z');

  const summary = buildVisibleSummary(
    {
      entities: [{ id: 'hat-1' }, { id: 'hat-2' }],
      domain: 'hat',
      mode: 'hat-active',
      filterKey: 'kv:400'
    },
    new Map([
      ['hat:hat-1', { primaryValue: 100, candidateConflict: true, uncertaintyReason: 'candidate-conflict', primaryStaleState: 'live' }],
      ['hat:hat-2', { primaryValue: null, unresolved: true, unresolvedReason: 'source-side-unknown' }]
    ])
  );

  assert.equal(summary.total, 2);
  assert.equal(summary.ambiguousLive, 2);
  assert.equal(summary.matched, 0);
  assert.equal(summary.unmatched, 0);
});

test('buildScadaAuditReport classifies unresolved live candidates as ambiguous-live', () => {
  const context = loadRuntime();
  const { buildScadaAuditReport } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = {
    id: 'hat-1',
    name: '400kV Test Hat',
    startTm: 'TM-A',
    endTm: 'TM-B',
    kvBucket: '400',
    scada: {
      active: { ids: ['m-1', 'm-2'] },
      reactive: { ids: ['q-1', 'q-2'] }
    }
  };
  context.state.scada.currentScope = {
    domain: 'hat',
    modeLabel: 'Hat (MW)',
    primaryMetric: 'active',
    entities: [entity],
    measurementIds: ['m-1', 'm-2'],
    filterKey: 'kv:400'
  };
  context.state.scada.entityMetricsByKey = new Map([
    ['hat:hat-1', {
      entityType: 'hat',
      entityId: 'hat-1',
      primaryValue: null,
      primaryMeasurementId: 'm-1,m-2',
      primaryTimestamp: null,
      primaryStaleState: 'live',
      sourceAmbiguous: true,
      unresolved: true,
      unresolvedReason: 'ambiguous-live',
      active: { value: null, sourceTm: 'TM-A', sourceRemote: 'TM-B' },
      reactive: { value: 12.4, sourceTm: 'TM-A', sourceRemote: 'TM-B' }
    }]
  ]);
  context.state.scada.measurementRowsById = new Map();
  context.state.scada.totalRows = 2;

  const report = buildScadaAuditReport();

  assert.equal(report.summary.ambiguousLive, 1);
  assert.equal(report.summary.missingSourceRow, 0);
  assert.equal(report.rows[0].status, 'ambiguous-live');
});

test('buildScadaAuditReport exposes terminal and polarization debug fields for resolved terminal mismatch warnings', () => {
  const context = loadRuntime();
  const { buildScadaAuditReport } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = {
    id: 'hat-2',
    name: '400kV Polarization Test Hat',
    startTm: 'TM-A',
    endTm: 'TM-B',
    kvBucket: '400',
    scada: {
      active: { ids: ['m-3'] },
      reactive: { ids: [] }
    }
  };
  context.state.scada.currentScope = {
    domain: 'hat',
    modeLabel: 'Hat (MW)',
    primaryMetric: 'active',
    entities: [entity],
    measurementIds: ['m-3'],
    filterKey: 'kv:400'
  };
  context.state.scada.entityMetricsByKey = new Map([
    ['hat:hat-2', {
      entityType: 'hat',
      entityId: 'hat-2',
      primaryValue: 82,
      primaryMeasurementId: 'm-3',
      primaryTimestamp: new Date('2026-04-20T08:07:00.000Z'),
      primaryStaleState: 'live',
      sourceAmbiguous: false,
      unresolved: false,
      unresolvedReason: '',
      terminalSide: 'start',
      terminalMatchBasis: 'tm-name-exact',
      polarizationSign: 1,
      polarizationConsistent: false,
      directionMetric: 'active',
      directionValue: 82,
      directionResolvedBy: 'terminal-exit-model',
      directionModel: 'terminal-exit-model',
      orientationMatch: 'forward',
      aliasMatchBasis: '',
      resolutionMethod: 'single-candidate',
      resolvedTerminalMismatch: true,
      selectedCandidateReason: 'Zamani daha yeni oldugu icin secildi.',
      active: { value: 82, sourceTm: 'ALFA', sourceRemote: 'BETA', resolutionMethod: 'single-candidate' },
      reactive: null
    }]
  ]);

  const report = buildScadaAuditReport();

  assert.equal(report.summary.orientationUnknown, 0);
  assert.equal(report.rows[0].status, 'matched-live');
  assert.equal(report.rows[0].terminalSide, 'start');
  assert.equal(report.rows[0].polarizationConsistent, false);
  assert.equal(report.rows[0].directionModel, 'terminal-exit-model');
  assert.equal(report.summary.resolvedWithWarning, 1);
  assert.equal(report.resolvedWarnings.length, 1);
  assert.equal(report.resolvedWarnings[0].resolutionClass, 'resolved-with-warning');
});

test('buildScadaAuditReport separates delayed and dead matched records', () => {
  const context = loadRuntime();
  const { buildScadaAuditReport } = context.__SCADA_V2_TEST_HOOKS__;
  context.state.scada.currentScope = {
    domain: 'hat',
    modeLabel: 'Hat (MW)',
    primaryMetric: 'active',
    entities: [
      { id: 'hat-dead', name: 'Dead Hat', startTm: 'TM-A', endTm: 'TM-B', kvBucket: '400', scada: { active: { ids: ['m-dead'] } } },
      { id: 'hat-warn', name: 'Warn Hat', startTm: 'TM-A', endTm: 'TM-B', kvBucket: '400', scada: { active: { ids: ['m-warn'] } } }
    ],
    measurementIds: ['m-dead', 'm-warn'],
    filterKey: 'kv:400'
  };
  context.state.scada.entityMetricsByKey = new Map([
    ['hat:hat-dead', { entityType: 'hat', entityId: 'hat-dead', primaryValue: 50, primaryMeasurementId: 'm-dead', primaryTimestamp: new Date('2026-04-20T06:00:00.000Z'), primaryStaleState: 'dead', timeState: 'dead', timeStateLabel: 'Bayat', ageLabel: '2 sa 7 dk', active: { value: 50, sourceTm: 'TM-A', sourceRemote: 'TM-B', candidateDetails: [] } }],
    ['hat:hat-warn', { entityType: 'hat', entityId: 'hat-warn', primaryValue: 40, primaryMeasurementId: 'm-warn', primaryTimestamp: new Date('2026-04-20T07:30:00.000Z'), primaryStaleState: 'warn', timeState: 'warn', timeStateLabel: 'Gecikmeli', ageLabel: '37 dk', active: { value: 40, sourceTm: 'TM-A', sourceRemote: 'TM-B', candidateDetails: [] } }]
  ]);

  const report = buildScadaAuditReport();

  assert.equal(report.summary.dead, 1);
  assert.equal(report.summary.delayed, 1);
  assert.equal(report.summary.stale, 2);
  assert.equal(report.rows[0].status, 'matched-dead');
  assert.equal(report.rows[1].status, 'matched-delayed');
});

test('buildScadaAuditReport exposes ambiguous warning debug fields', () => {
  const context = loadRuntime();
  const { buildScadaAuditReport } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = {
    id: 'hat-3',
    name: '400kV Candidate Conflict Hat',
    startTm: 'TM-A',
    endTm: 'TM-B',
    kvBucket: '400',
    scada: {
      active: { ids: ['m-primary', 'm-secondary'] },
      reactive: { ids: [] }
    }
  };
  context.state.scada.currentScope = {
    domain: 'hat',
    modeLabel: 'Hat (MW)',
    primaryMetric: 'active',
    entities: [entity],
    measurementIds: ['m-primary', 'm-secondary'],
    filterKey: 'kv:400'
  };
  context.state.scada.entityMetricsByKey = new Map([
    ['hat:hat-3', {
      entityType: 'hat',
      entityId: 'hat-3',
      primaryValue: 100,
      primaryMeasurementId: 'm-primary,m-secondary',
      primaryTimestamp: new Date('2026-04-20T08:07:00.000Z'),
      primaryStaleState: 'live',
      sourceAmbiguous: false,
      unresolved: false,
      candidateConflict: true,
      uncertaintyReason: 'candidate-conflict',
      candidateSlot: 'primary',
      sourceSide: 'start',
      targetSide: 'end',
      terminalSide: 'start',
      terminalMatchBasis: 'tm-name-exact',
      polarizationSign: 1,
      polarizationConsistent: true,
      selectedCandidate: 'm-primary',
      backupUsed: false,
      formulaSignApplied: 1,
      orientationRule: 'terminal-polarity',
      resolutionMethod: 'primary-conflict',
      active: { value: 100, sourceTm: 'TM-A', sourceRemote: 'TM-B' },
      reactive: null
    }]
  ]);

  const report = buildScadaAuditReport();

  assert.equal(report.summary.ambiguousWarning, 1);
  assert.equal(report.rows[0].status, 'ambiguous-warning');
  assert.equal(report.rows[0].candidateSlot, 'primary');
  assert.equal(report.rows[0].selectedCandidate, 'm-primary');
  assert.equal(report.rows[0].candidateConflict, true);
});

test('rebuildLineFlowMap uses selected reactive metric direction for arrows', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord, rebuildLineFlowMap } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-6',
    scada: {
      active: { ids: ['p-1'], rows: [buildTerminalCandidate('p-1', 'start', 1)] },
      reactive: { ids: ['q-1'], rows: [buildTerminalCandidate('q-1', 'end', -1)] }
    }
  });
  const timestamp = new Date();
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 80 }],
    ['q-1', { measurementId: 'q-1', tmName: 'TM-B', remoteName: 'TM-A', timestamp, value: 15 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-reactive',
    label: 'Hat (MVar)',
    domain: 'hat',
    primaryMetric: 'reactive'
  }, measurementRows);
  const flowMap = rebuildLineFlowMap({
    key: 'hat-reactive',
    label: 'Hat (MVar)',
    domain: 'hat',
    primaryMetric: 'reactive'
  }, new Map([[record.entityKey, record]]));

  assert.equal(record.directionMetric, 'reactive');
  assert.equal(record.directionValue, -15);
  assert.equal(record.displayPctMode, 'reactive-ratio');
  assert.equal(Math.round(record.displayPct * 100) / 100, 18.75);
  assert.equal(flowMap.get('hat-6').direction, 'reverse');
});

test('buildEntityMetricRecord computes loadingPct when MW exists and MVar is missing', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-7',
    winterCapacityMva: 100,
    summerCapacityMva: 100,
    scada: {
      active: { ids: ['p-1'], rows: [buildTerminalCandidate('p-1', 'start', 1)] },
      reactive: { ids: [], rows: [] }
    }
  });
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp: new Date('2026-04-20T08:07:00.000Z'), value: 80 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, measurementRows);

  assert.equal(record.active.value, 80);
  assert.equal(record.reactive, null);
  assert(Number.isFinite(record.loadingPct));
  assert.equal(record.invalidPct, false);
  assert.equal(Math.round(record.loadingPct * 100) / 100, 80);
});

test('buildEntityMetricRecord keeps loadingPct for source-side-unknown hats via loading hint', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-8',
    winterCapacityMva: 100,
    summerCapacityMva: 100,
    scada: {
      active: {
        ids: ['p-1'],
        rows: [buildTerminalCandidate('p-1', 'unknown', 1, {
          candidateSlot: 'extra',
          polarizationSign: null,
          polarizationConsistent: null
        })]
      },
      reactive: { ids: [], rows: [] }
    }
  });
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'ALFA', remoteName: 'BETA', timestamp: new Date('2026-04-20T08:07:00.000Z'), value: 55 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, measurementRows);

  assert.equal(record.unresolvedReason, 'source-side-unknown');
  assert.equal(record.primaryValue, null);
  assert(Number.isFinite(record.loadingPct));
  assert.equal(Math.round(record.loadingPct * 100) / 100, 55);
});

test('resolved terminal mismatch remains flow-eligible as resolved warning', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord, rebuildLineFlowMap } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-terminal-warning',
    winterCapacityMva: 100,
    summerCapacityMva: 100,
    scada: {
      active: { ids: ['p-1'], rows: [buildTerminalCandidate('p-1', 'end', 1, { polarizationConsistent: false })] },
      reactive: { ids: [], rows: [] }
    }
  });
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'TM-B', remoteName: 'TM-A', timestamp: new Date(), value: 25 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, measurementRows);
  const flowMap = rebuildLineFlowMap({
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, new Map([[record.entityKey, record]]));

  assert.equal(record.resolvedTerminalMismatch, true);
  assert.equal(record.resolutionClass, 'resolved-with-warning');
  assert.equal(flowMap.get('hat-terminal-warning').direction, 'reverse');
  assert.equal(flowMap.get('hat-terminal-warning').resolutionClass, 'resolved-with-warning');
});

test('buildRenderedFlowPath reverses sade mode path for reverse flow', () => {
  const context = loadRuntime();
  const { buildRenderedFlowPath } = context.__SCADA_V2_TEST_HOOKS__;
  context.state.filters.hatDisplayMode = 'sade';
  context.state.network.tmMap = new Map([
    ['TM-A', { lon: 10, lat: 20 }],
    ['TM-B', { lon: 30, lat: 40 }]
  ]);
  context.screenPoint = (lon, lat) => ({ x: lon, y: lat });
  context.round1 = (value) => Math.round(Number(value) * 10) / 10;

  const pathData = buildRenderedFlowPath({
    id: 'hat-path',
    startTm: 'TM-A',
    endTm: 'TM-B',
    coords: [[10, 20], [30, 40]]
  }, { direction: 'reverse' });

  assert.equal(pathData, 'M 30 40 L 10 20');
});

test('buildEntityMetricRecord flags %300 ustu oranlari gecersiz olarak isaretler', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord, rebuildLineFlowMap } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-invalid-ratio',
    winterCapacityMva: 120,
    summerCapacityMva: 120,
    scada: {
      active: { ids: ['p-1'], rows: [buildTerminalCandidate('p-1', 'start', 1)] },
      reactive: { ids: ['q-1'], rows: [buildTerminalCandidate('q-1', 'start', 1)] }
    }
  });
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp: new Date('2026-04-20T08:07:00.000Z'), value: 10 }],
    ['q-1', { measurementId: 'q-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp: new Date('2026-04-20T08:07:00.000Z'), value: 50 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-reactive',
    label: 'Hat (MVar)',
    domain: 'hat',
    primaryMetric: 'reactive'
  }, measurementRows);
  const flowMap = rebuildLineFlowMap({
    key: 'hat-reactive',
    label: 'Hat (MVar)',
    domain: 'hat',
    primaryMetric: 'reactive'
  }, new Map([[record.entityKey, record]]));

  assert.equal(record.invalidPct, true);
  assert.equal(record.uncertaintyReason, 'invalid-pct');
  assert.equal(flowMap.has('hat-invalid-ratio'), false);
});

test('getReadableTextColor returns dark text for bright chips and white for dark chips', () => {
  const context = loadRuntime();
  const { getReadableTextColor } = context.__SCADA_V2_TEST_HOOKS__;

  assert.equal(getReadableTextColor('#facc15'), 'var(--chip-text-dark)');
  assert.equal(getReadableTextColor('#7dd3fc'), 'var(--chip-text-dark)');
  assert.equal(getReadableTextColor('#6b7280'), '#f8fafc');
  assert.equal(getReadableTextColor('#38bdf8'), '#f8fafc');
});

test('buildScadaQualityChips marks terminal warning chip as an audit filter action', () => {
  const context = loadRuntime();
  const { buildScadaQualityChips } = context.__SCADA_V2_TEST_HOOKS__;

  const html = buildScadaQualityChips({
    matched: 4,
    delayed: 1,
    dead: 0,
    orientationUnknown: 2,
    resolvedWithWarning: 3,
    unmatched: 5
  });

  assert.match(html, /data-scada-audit-filter="resolved-with-warning"/);
  assert.match(html, />Terminal yorumlu <strong>3<\/strong>/);
  assert.match(html, /data-scada-audit-filter="orientation-unknown"/);
});

test('buildEntityMetricRecord keeps loading and display pct null when capacity is unknown', () => {
  const context = loadRuntime();
  const { buildEntityMetricRecord, rebuildLineFlowMap } = context.__SCADA_V2_TEST_HOOKS__;
  const entity = buildTerminalEntity({
    id: 'hat-no-capacity',
    winterCapacityMva: null,
    summerCapacityMva: null,
    scada: {
      active: { ids: ['p-1'], rows: [buildTerminalCandidate('p-1', 'start', 1)] },
      reactive: { ids: [], rows: [] }
    }
  });
  const measurementRows = new Map([
    ['p-1', { measurementId: 'p-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp: new Date(), value: 95 }]
  ]);

  const record = buildEntityMetricRecord('hat', entity, {
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, measurementRows);
  const flowMap = rebuildLineFlowMap({
    key: 'hat-active',
    label: 'Hat (MW)',
    domain: 'hat',
    primaryMetric: 'active'
  }, new Map([[record.entityKey, record]]));
  const flow = flowMap.get('hat-no-capacity');

  assert.equal(record.capacityMva, null);
  assert.equal(record.loadingPct, null);
  assert.equal(record.displayPct, null);
  assert.equal(record.displayColor, '#9ca3af');
  assert.equal(flow.capacityMva, null);
  assert.equal(flow.loadingPct, null);
  assert.equal(flow.displayPct, null);
  assert.equal(flow.color, '#9ca3af');
});

test('scadaDoFetch defers manual fetch while document is hidden', async () => {
  const context = loadRuntime();
  const metaUpdates = [];
  const statusMessages = [];
  let sendCount = 0;
  let rankingRefreshCount = 0;

  context.document.visibilityState = 'hidden';
  context.updateScadaFetchMeta = (meta) => metaUpdates.push(meta);
  context.setScadaStatusMessage = (message, tone) => statusMessages.push({ message, tone });
  context.refreshRankingTable = () => { rankingRefreshCount += 1; };
  context.chrome.runtime.sendMessage = async () => {
    sendCount += 1;
    return { ok: true, data: {} };
  };

  await context.scadaDoFetch({ trigger: 'manual' });

  assert.equal(sendCount, 0);
  assert.equal(metaUpdates.at(-1)?.status, 'idle');
  assert.equal(metaUpdates.at(-1)?.phaseLabel, 'Beklemede');
  assert.match(metaUpdates.at(-1)?.phaseMessage || '', /arka plandayken ertelendi/i);
  assert.equal(statusMessages.at(-1)?.tone, 'warn');
  assert.match(statusMessages.at(-1)?.message || '', /arka plandayken ertelendi/i);
  assert.equal(rankingRefreshCount, 1);
  assert.equal(context.state.scada.fetchInProgress, false);
});

test('dashboard map slot message marks pending auto refresh when fetch is already running', () => {
  const context = loadRuntime();
  const { handleDashboardMapSlotActive } = context.__SCADA_V2_TEST_HOOKS__;

  context.state.scada.enabled = true;
  context.state.scada.autoRefresh = true;
  context.state.scada.fetchInProgress = true;
  context.state.scada.pollState = {
    pendingAutoRefresh: false,
    nextDueAt: new Date(Date.now() - 1000)
  };

  const result = handleDashboardMapSlotActive({ at: Date.now() });

  assert.equal(result.ok, true);
  assert.equal(result.queued, true);
  assert.equal(context.state.scada.pollState.pendingAutoRefresh, true);
});

test('SCADA dashboard snapshot serializes and restores measurement rows as maps', () => {
  const context = loadRuntime();
  const { serializeScadaDashboardSnapshot, restoreScadaDashboardSnapshot } = context.__SCADA_V2_TEST_HOOKS__;
  const timestamp = new Date('2026-05-01T08:00:00.000Z');

  context.state.scada.measurementRowsById = new Map([
    ['m-1', { measurementId: 'm-1', tmName: 'TM-A', remoteName: 'TM-B', timestamp, value: 42 }]
  ]);
  context.state.scada.currentScope = { mode: 'hat-active', domain: 'hat', entities: [], measurementIds: ['m-1'], elementNames: ['P'], filterKey: 'kv:400' };
  context.state.scada.fetchMeta = { status: 'success', phaseMessage: 'Tamamlandi' };
  context.state.scada.lastTransport = { authMode: 'session' };

  const snapshot = serializeScadaDashboardSnapshot({ source: 'unit-test' });
  context.state.scada.measurementRowsById = new Map();
  const restored = restoreScadaDashboardSnapshot(snapshot, { apply: false });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.measurementRows[0][0], 'm-1');
  assert.equal(snapshot.measurementRows[0][1].measurementId, 'm-1');
  assert.equal(snapshot.measurementRows[0][1].tmName, 'TM-A');
  assert.equal(snapshot.measurementRows[0][1].remoteName, 'TM-B');
  assert.equal(snapshot.measurementRows[0][1].timestamp, '2026-05-01T08:00:00.000Z');
  assert.equal(snapshot.measurementRows[0][1].value, 42);
  assert.equal(restored.ok, true);
  assert.equal(context.state.scada.measurementRowsById instanceof Map, true);
  assert.equal(context.state.scada.measurementRowsById.get('m-1').timestamp.getTime(), timestamp.getTime());
  assert.match(context.state.scada.fetchMeta.phaseMessage, /onbellek|önbellek/i);
});

test('history parser ignores missing sinsid without creating undefined key', () => {
  const rows = [
    { maxValue: 10, __time: '2026-05-01T08:00:00Z', sinsid: '123' },
    { maxValue: 15, __time: '2026-05-01T08:01:00Z' } // missing sinsid
  ];
  const parsedRowsByMid = new Map();
  let missingMeasurementIdField = false;

  rows.forEach(row => {
    const mwRaw = row.maxValue ?? row['AVG(maxValue)'] ?? row.avgMaxValue;
    const timeRaw = row.__time ?? row['MAX(__time)'] ?? row.maxTime;
    const sinsidRaw = row.sinsid ?? row.measurementId;
    
    if (sinsidRaw == null) {
        missingMeasurementIdField = true;
        return;
    }
    
    const mw = Number(mwRaw);
    const mId = String(sinsidRaw);
    if (!parsedRowsByMid.has(mId)) parsedRowsByMid.set(mId, []);
    parsedRowsByMid.get(mId).push({ ts: timeRaw, mw });
  });

  assert.equal(missingMeasurementIdField, true);
  assert.equal(parsedRowsByMid.has('undefined'), false);
  assert.equal(parsedRowsByMid.get('123').length, 1);
});

test('history parser duplicate timestamp is not counted as 2 points', () => {
  const parsedRowsByMid = new Map();
  const time = new Date('2026-05-01T08:00:00Z');
  parsedRowsByMid.set('123', [
    { ts: time, mw: 10 },
    { ts: time, mw: 12 } // duplicate time
  ]);
  
  let maxPoints = 0;
  for (const pts of parsedRowsByMid.values()) {
    const uniqueTimes = new Set(pts.map(p => p.ts.getTime())).size;
    if (uniqueTimes > maxPoints) maxPoints = uniqueTimes;
  }
  
  assert.equal(maxPoints, 1);
});

test('buildHistoryCapacitySeries pairs P and Q series into |S| apparent power', () => {
  const context = loadRuntime();
  const { buildHistoryCapacitySeries } = context.__SCADA_V2_TEST_HOOKS__;
  const base = Date.UTC(2026, 4, 1, 8, 0, 0);
  const makeSeries = (pairing, elementName, values) => ({
    seriesId: `s:${pairing}`,
    pairing,
    elementName,
    points: values.map((value, index) => ({ ts: new Date(base + index * 60000), value }))
  });

  const series = [
    makeSeries('h:TM-A>>TM-B', 'P', [3, 4, 0]),
    makeSeries('h:TM-A>>TM-B', 'Q', [4, 0, 2]),
    makeSeries('h:TM-C>>TM-D', 'P', [1])
  ];

  const output = buildHistoryCapacitySeries(series);
  assert.equal(output.length, 1, 'yalniz P+Q ikilisi olan eslesme |S| serisi uretir');
  const s = output[0];
  assert.equal(s.metricType, 'capacity');
  assert.equal(s.elementName, 'S');
  assert.equal(s.points.length, 3);
  assert.equal(s.points[0].value, 5, 'sqrt(3^2+4^2)=5');
  assert.equal(s.points[1].value, 4, 'single nonzero leg yields |value|');
  assert.equal(s.points[2].value, 2, 'single nonzero leg yields |value|');
});

test('voltage reference lines derive from level: 400 -> 380/420, 154 -> 140/170, others none', () => {
  const context = loadRuntime();
  const { buildVoltageReferenceLines } = context.__SCADA_V2_TEST_HOOKS__;
  assert.deepEqual(Array.from(buildVoltageReferenceLines(400).map((ref) => ref.value)), [380, 420]);
  assert.deepEqual(Array.from(buildVoltageReferenceLines(380).map((ref) => ref.value)), [380, 420]);
  assert.deepEqual(Array.from(buildVoltageReferenceLines(154).map((ref) => ref.value)), [140, 170]);
  assert.deepEqual(Array.from(buildVoltageReferenceLines(170).map((ref) => ref.value)), [140, 170]);
  assert.equal(buildVoltageReferenceLines(66).length, 0);
  assert.equal(buildVoltageReferenceLines(0).length, 0);
  buildVoltageReferenceLines(400).forEach((ref) => {
    assert.equal(ref.enabled, true, 'referanslar varsayilan olarak acik gelir');
    assert.ok(ref.refKey);
  });
});

test('positive voltage axis never negative and never forced to 0', () => {
  const context = loadRuntime();
  const { buildPositiveAxisScale } = context.__SCADA_V2_TEST_HOOKS__;
  const scale = buildPositiveAxisScale(390, 415);
  assert.equal(scale.minY, 388, 'max((415-390)*0.08, 1) = 2 birim alt marj');
  assert.equal(scale.maxY, 417);
  assert.ok(scale.minY >= 0, 'negatif alt sinir yok');
  assert.ok(scale.maxY > scale.minY);
  const flat = buildPositiveAxisScale(400, 400);
  assert.equal(flat.minY, 399);
  assert.equal(flat.maxY, 401);
  const empty = buildPositiveAxisScale(NaN, NaN);
  assert.equal(empty.minY, 0);
  assert.equal(empty.maxY, 1);
});

test('resolveHistoricalRangeBounds clamps future end and falls back to a 7-day window', () => {
  const context = loadRuntime();
  const { resolveHistoricalRangeBounds } = context.__SCADA_V2_TEST_HOOKS__;
  const now = Date.UTC(2026, 4, 1, 8, 0, 0);

  const missing = resolveHistoricalRangeBounds('', '', now);
  assert.equal(missing.endMs, now);
  assert.equal(missing.startMs, now - 7 * 24 * 3600 * 1000);

  const futureEnd = resolveHistoricalRangeBounds(
    '2026-04-20T08:00',
    '2026-06-01T08:00',
    now
  );
  assert.equal(futureEnd.endMs, now, 'gelecekteki bitis simdiki ana sabitlenir');
  assert.equal(futureEnd.startMs, new Date('2026-04-20T08:00').getTime());
});

test('Canliya don restores last live snapshot instantly and triggers one live fetch', async () => {
  const context = loadRuntime();
  const { setScadaTimeMode } = context.__SCADA_V2_TEST_HOOKS__;
  const statuses = [];
  let liveFetchTrigger = null;

  context.setScadaStatusMessage = (message, tone) => statuses.push({ message, tone });
  context.scadaDoFetch = async (options = {}) => {
    liveFetchTrigger = options.trigger;
    return { ok: true };
  };

  context.state.scada.enabled = true;
  context.state.scada.autoRefresh = true;
  context.state.scada.measurementRowsById = new Map([['m-1', { measurementId: 'm-1', value: 42 }]]);
  context.state.scada.lastLiveSnapshot = new Map([['m-1', { measurementId: 'm-1', value: 42 }]]);
  context.state.scada.timeMode = 'historical';
  context.state.scada.historicalAt = Date.now() - 3600000;

  await setScadaTimeMode('live');

  assert.equal(context.state.scada.timeMode, 'live');
  assert.equal(context.state.scada.historicalAt, null);
  assert.equal(context.state.scada.lastLiveSnapshot, null, 'canli anlik goruntusun sonrasi serbest birakilir');
  assert.equal(context.state.scada.measurementRowsById.get('m-1').value, 42, 'son canli veri aninda geri yuklenir');
  assert.equal(context.state.scada.sourceKind, 'live');
  assert.equal(liveFetchTrigger, 'live-return', 'donus aninda tek canli sorgu tetiklenir');
  assert.equal(context.state.scada.pollState.nextDueAt instanceof Date, true, 'polling zamanlayicisi yeniden baslatilir');
  assert.equal(context.state.scada.pollState.pendingAutoRefresh, false);
  assert.equal(statuses.at(-1)?.tone, 'info');
});

test('live scope sends only the primary metric: hat-active P, trafo-reactive Q, history keeps P+Q', () => {
  const context = loadRuntime();
  const hooks = context.__SCADA_V2_TEST_HOOKS__;
  const hatEntity = { id: 'hat-1', scada: { active: { ids: ['m-h-p-1'] }, reactive: { ids: ['m-h-q-1'] } } };
  const trafoEntity = { id: 'tr-1', scada: { active: { ids: ['m-t-p-1'] }, reactive: { ids: ['m-t-q-1'] } } };

  context.state.filters.scadaMetric = 'hat-active';
  context.getVisibleHats = () => [hatEntity];
  let liveScope = hooks.getCurrentScadaScope({ history: false });
  assert.deepEqual(Array.from(liveScope.metricTypes), ['active']);
  assert.deepEqual(Array.from(liveScope.elementNames), ['P'], 'canli hat-aktif yalniz P ister');
  assert.deepEqual(Array.from(liveScope.measurementIds), ['m-h-p-1']);
  let historyScope = hooks.getCurrentScadaScope({ history: true });
  assert.deepEqual(Array.from(historyScope.metricTypes), ['active', 'reactive']);
  assert.deepEqual(Array.from(historyScope.elementNames), ['P', 'Q'], 'gecmis hat P+Q ister');
  assert.deepEqual(Array.from(historyScope.measurementIds).sort(), ['m-h-p-1', 'm-h-q-1'].sort());

  context.state.filters.scadaMetric = 'trafo-reactive';
  context.getVisibleTrafoEntities = () => [trafoEntity];
  liveScope = hooks.getCurrentScadaScope({ history: false });
  assert.deepEqual(Array.from(liveScope.metricTypes), ['reactive']);
  assert.deepEqual(Array.from(liveScope.elementNames), ['Q'], 'canli trafo-reaktif yalniz Q ister');
  assert.deepEqual(Array.from(liveScope.measurementIds), ['m-t-q-1']);
  historyScope = hooks.getCurrentScadaScope({ history: true });
  assert.deepEqual(Array.from(historyScope.metricTypes), ['active', 'reactive']);
  assert.deepEqual(Array.from(historyScope.elementNames), ['P', 'Q']);

  context.state.filters.scadaMetric = 'voltage';
  context.getVisibleBaras = () => [{ id: 'b-1', kvBucket: '400', scada: { voltage: { ids: ['m-b-u-1'] } } }];
  liveScope = hooks.getCurrentScadaScope({ history: false });
  assert.deepEqual(Array.from(liveScope.metricTypes), ['voltage']);
  assert.deepEqual(Array.from(liveScope.elementNames), ['U']);
});

test('failed or empty historical fetch rolls back to live and re-triggers a live fetch', async () => {
  for (const scenario of ['fail-request', 'empty-data']) {
    const context = loadRuntime();
    const { setScadaTimeMode } = context.__SCADA_V2_TEST_HOOKS__;
    const statuses = [];
    let fallbackTrigger = null;

    context.setScadaStatusMessage = (message, tone) => statuses.push({ message, tone });
    context.scadaDoFetch = async (options = {}) => {
      fallbackTrigger = options.trigger;
      return { ok: true };
    };
    context.chrome.runtime.sendMessage = async (message) => {
      if (message?.type === 'SCADA_HISTORICAL_SNAPSHOT_FETCH') {
        return scenario === 'fail-request'
          ? { ok: false, error: 'Test engeli' }
          : { ok: true, data: {} };
      }
      return { ok: true, data: {} };
    };

    context.state.scada.enabled = true;
    context.state.scada.autoRefresh = true;
    context.state.scada.measurementRowsById = new Map([['m-1', { measurementId: 'm-1', value: 42 }]]);
    context.state.scada.lastLiveSnapshot = new Map([['m-1', { measurementId: 'm-1', value: 42 }]]);
    context.state.scada.timeMode = 'live';

    const targetMs = Date.now() - 3600000;
    await setScadaTimeMode('historical', targetMs);

    assert.equal(context.state.scada.timeMode, 'live', `(${scenario}) gecmis moduna kilitlenmez`);
    assert.equal(context.state.scada.historicalAt, null, `(${scenario}) historicalAt temizlenir`);
    assert.equal(context.state.scada.lastLiveSnapshot, null, `(${scenario}) anlik goruntu serbest birakilir`);
    assert.equal(context.state.scada.sourceKind, 'live');
    assert.equal(context.state.scada.measurementRowsById.get('m-1').value, 42, `(${scenario}) son canli veri geri yuklenir`);
    assert.equal(fallbackTrigger, 'historical-fallback-live', `(${scenario}) canli sorgu yeniden tetiklenir`);
    assert.match(statuses.at(-1)?.message || '', /Canli mod korundu/);
    assert.equal(statuses.at(-1)?.tone, 'warn');
    assert.ok(context.state.scada.pollState.nextDueAt instanceof Date, `(${scenario}) polling zamanlayicisi calisiyor`);
    assert.equal(context.state.scada.pendingHistoricalFetch, null);
  }
});

test('live 10-min empty response triggers wide-window fallback and recovers all ids', async () => {
  const context = loadRuntime();
  const statuses = [];
  const metaUpdates = [];
  const posts = [];
  context.setScadaStatusMessage = (message, tone) => statuses.push({ message, tone });
  context.updateScadaFetchMeta = (meta) => {
    metaUpdates.push(meta);
    context.state.scada.fetchMeta = { ...(context.state.scada.fetchMeta || {}), ...meta };
  };
  const entity = {
    ...buildTerminalEntity({ id: 'hat-1' }),
    scada: {
      active: { ids: ['m-1'], rows: [buildTerminalCandidate('m-1', 'start', 1)] },
      reactive: { ids: [], rows: [] }
    }
  };
  context.getVisibleHats = () => [entity];
  context.chrome.runtime.sendMessage = async (message) => {
    posts.push(message);
    if (message?.type === 'SCADA_FETCH') {
      if (posts.filter((post) => post?.type === 'SCADA_FETCH').length === 1) {
        return { ok: true, data: {} };
      }
      return {
        ok: true,
        data: {
          result: [{
            data: [{ sinsid: 'm-1', elementName: 'P', maxValue: 80, __timestamp: '2026-04-20T08:07:00.000Z' }]
          }]
        }
      };
    }
    return { ok: false };
  };

  await context.scadaDoFetch({ trigger: 'manual' });

  assert.equal(context.state.scada.error, 'Superset yanitinda veri bulunamadi.');
  assert.equal(context.state.scada.errorType, 'EMPTY_DATA');
  assert.equal(metaUpdates.at(-1)?.status, 'error');
  assert.equal(posts.length, 2, 'bos 10-dk yanitindan sonra genis pencere fallback sorgusu atilir');
  const fallback = posts[1];
  assert.equal(fallback.type, 'SCADA_FETCH');
  assert.deepEqual(Array.from(fallback.payload.measurementIds), ['m-1'], 'tum scope idleri fallbacke verilir');
  assert.deepEqual(Array.from(fallback.payload.elementNames), ['P']);
  assert.equal(fallback.payload.timeRange, context.SCADA_CONFIG.QUERY_TIME_RANGE, 'genis pencere sorgusu kullanilir');

  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(context.state.scada.measurementRowsById.get('m-1')?.value, 80, 'kurtarilan satir uygulanir');
  const record = context.state.scada.entityMetricsByKey.get('hat:hat-1');
  assert.equal(record?.primaryValue, 80, 'kurtarma sonrasi canli snapshot/map uygulanir');
  assert.equal(context.state.scada.error, null, 'bos-veri hatasi kaldirilir');
  assert.equal(context.state.scada.errorType, null);
  assert.equal(context.state.scada.sourceKind, 'live');
  assert.equal(context.state.scada.snapshotAt, null);
  assert.equal(metaUpdates.at(-1)?.status, 'success');
  assert.match(statuses.at(-1)?.message || '', /Eksik olcum kurtarmasi/);
});

test('mode switch during in-flight fallback discards the stale response', async () => {
  const context = loadRuntime();
  const statuses = [];
  const posts = [];
  let resolveFallback = null;
  context.setScadaStatusMessage = (message, tone) => statuses.push({ message, tone });
  context.updateScadaFetchMeta = (meta) => {
    context.state.scada.fetchMeta = { ...(context.state.scada.fetchMeta || {}), ...meta };
  };
  const entity = {
    ...buildTerminalEntity({ id: 'hat-1' }),
    scada: {
      active: { ids: ['m-1'], rows: [buildTerminalCandidate('m-1', 'start', 1)] },
      reactive: { ids: [], rows: [] }
    }
  };
  context.getVisibleHats = () => [entity];
  context.chrome.runtime.sendMessage = async (message) => {
    posts.push(message);
    if (message?.type === 'SCADA_FETCH') {
      if (posts.filter((post) => post?.type === 'SCADA_FETCH').length === 1) {
        return { ok: true, data: {} };
      }
      return new Promise((resolve) => {
        resolveFallback = resolve;
      });
    }
    return { ok: false };
  };

  await context.scadaDoFetch({ trigger: 'manual' });
  assert.equal(posts.length, 2, 'fallback sorgusu beklemeye alindi');
  assert.equal(context.state.scada.error, 'Superset yanitinda veri bulunamadi.');

  context.state.filters.scadaMetric = 'voltage';
  context.getVisibleBaras = () => [{ id: 'b-1', kvBucket: '400', scada: { voltage: { ids: ['m-u-1'] } } }];
  context.getVisibleHats = () => [];

  resolveFallback({
    ok: true,
    data: {
      result: [{
        data: [{ sinsid: 'm-1', elementName: 'P', maxValue: 80, __timestamp: '2026-04-20T08:07:00.000Z' }]
      }]
    }
  });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(context.state.scada.measurementRowsById.size, 0, 'eski fallback yaniti yeni scope karmasir');
  assert.equal(context.state.scada.entityMetricsByKey.size, 0);
  assert.equal(context.state.scada.error, 'Superset yanitinda veri bulunamadi.', 'bos-veri durumu korunur');
  assert.equal(context.state.scada.errorType, 'EMPTY_DATA');
  assert.equal(statuses.at(-1)?.message, 'Superset yanitinda veri bulunamadi.');
  assert.doesNotMatch(statuses.at(-1)?.message || '', /Eksik olcum kurtarmasi/);
});

test('historical freshness ages against the selected instant; live view stays dead', () => {
  const context = loadRuntime();
  const { getStaleState, getDisplayColor } = context.__SCADA_V2_TEST_HOOKS__;
  const selectedMs = Date.UTC(2026, 7, 16, 7, 5, 0);
  const rowTime = new Date(selectedMs - 60 * 1000); // 07:04, 60 saniye once

  context.state.scada.timeMode = 'historical';
  context.state.scada.historicalAt = selectedMs;
  assert.equal(getStaleState(rowTime), 'live', 'secili andan 60 sn once gelen kayit gecmiste gecerlidir');
  assert.equal(getStaleState(new Date(selectedMs - 2 * 3600 * 1000)), 'dead', 'secili andan 2 saat once gelen kayit gecmiste Eskidir');
  assert.equal(
    getDisplayColor({ primaryStaleState: 'dead', primaryValue: 80, displayPct: 40, displayPctMode: 'loading', primaryMetric: 'active' }),
    '#22c55e',
    'historical dead kayit threshold rengini korur, griye dusmez'
  );

  context.state.scada.timeMode = 'live';
  context.state.scada.historicalAt = null;
  assert.equal(getStaleState(rowTime), 'dead', 'aynı kayit canli gorunumde bayattir');
  assert.equal(
    getDisplayColor({ primaryStaleState: 'dead', primaryValue: 80, displayPct: 40, displayPctMode: 'loading', primaryMetric: 'active' }),
    context.SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af',
    'canli dead kayit gri renge cekilir'
  );
});

test('historical dead hat keeps its flow entry with warning; live drops it', () => {
  const context = loadRuntime();
  const { rebuildLineFlowMap } = context.__SCADA_V2_TEST_HOOKS__;
  const modeConfig = { domain: 'hat', primaryMetric: 'active' };
  const record = {
    entityType: 'hat',
    entityId: 'hat-1',
    entityKey: 'hat:hat-1',
    entity: buildTerminalEntity({ id: 'hat-1' }),
    active: { value: 80 },
    reactive: { value: 0 },
    primaryMetric: 'active',
    primaryValue: 80,
    primaryMeasurementId: 'm-1',
    primaryTimestamp: new Date(Date.UTC(2026, 7, 16, 7, 4, 0)),
    primaryStaleState: 'dead',
    sourceAmbiguous: false,
    unresolved: false,
    unresolvedReason: '',
    candidateConflict: false,
    backupUsed: false,
    valueInvalid: false,
    invalidPct: false,
    displayPct: 40,
    displayPctMode: 'loading',
    capacityMva: 200,
    loadingPct: 40,
    directionValue: 80,
    directionResolvedBy: 'terminal-exit-model',
    resolvedTerminalMismatch: false,
    resolutionClass: 'resolved'
  };

  context.state.scada.timeMode = 'historical';
  context.state.scada.historicalAt = Date.UTC(2026, 7, 16, 7, 5, 0);
  const flow = rebuildLineFlowMap(modeConfig, new Map([['hat:hat-1', record]]));
  assert.ok(flow.has('hat-1'), 'historical dead hat akis haritasindan dusurulmez');
  assert.equal(flow.get('hat-1').primaryValue, 80, 'ak yonu ve MW degeri korunur');
  assert.equal(flow.get('hat-1').direction, 'forward', 'yuk akis oku cizilir');
  assert.equal(flow.get('hat-1').historicalStale, true, 'historical-stale uyari bayragi tasinir');
  assert.equal(flow.get('hat-1').color, '#22c55e', 'threshold rengi korunur, gri olmaz');

  context.state.scada.timeMode = 'live';
  const liveFlow = rebuildLineFlowMap(modeConfig, new Map([['hat:hat-1', record]]));
  assert.equal(liveFlow.size, 0, 'canli gorunumde dead hat akistan dusurulur');
});

test('summary available feeds the historical badge count', () => {
  const context = loadRuntime();
  const hooks = context.__SCADA_V2_TEST_HOOKS__;
  let badgeText = '';
  let badgeHidden = null;
  const badgeEl = {
    classList: {
      add: (className) => { if (className === 'hidden') badgeHidden = true; },
      remove: (className) => { if (className === 'hidden') badgeHidden = false; }
    }
  };
  Object.defineProperty(badgeEl, 'textContent', {
    set(value) { badgeText = value; },
    get() { return badgeText; }
  });
  context.document.getElementById = (id) => (id === 'scadaTimeBadge' ? badgeEl : null);

  const entity = buildTerminalEntity({ id: 'hat-1' });
  const rowTime = new Date(Date.UTC(2026, 7, 16, 7, 4, 0));
  const record = {
    entityType: 'hat',
    entityId: 'hat-1',
    entityKey: 'hat:hat-1',
    entity,
    primaryMetric: 'active',
    primaryValue: 80,
    primaryMeasurementId: 'm-1',
    primaryTimestamp: rowTime,
    primaryStaleState: 'live',
    sourceAmbiguous: false,
    unresolved: false,
    invalidPct: false,
    valueInvalid: false,
    resolvedTerminalMismatch: false
  };

  context.state.scada.timeMode = 'historical';
  context.state.scada.historicalAt = rowTime.getTime() + 60 * 1000;
  const summary = hooks.buildVisibleSummary(
    { entities: [entity], domain: 'hat', filterKey: 'test-filter', mode: 'hat-active' },
    new Map([['hat:hat-1', record]])
  );
  assert.equal(summary.available, 1, 'secili an icin gecerli kayit available sayilir');
  assert.equal(summary.matched, 1, 'tazelik sorunu olmayan kayit matched sayilir');
  assert.equal(summary.missing, 0);

  hooks.updateScadaTimeBadge();
  assert.equal(badgeHidden, false, 'historical badge gorunur');
  assert.match(badgeText, /^GECMIS VERI - .+ \| 1\/1 veri$/, 'rozet available/total sayisini gosterir');
});

test('freshKeys guard lets recovery replace an old row but never a fresh one', async () => {
  const context = loadRuntime();
  const { enrichMissingScadaIds } = context.__SCADA_V2_TEST_HOOKS__;
  context.getScadaVisibilityFilterKey = () => 'test-filter';
  context.chrome.runtime.sendMessage = async () => ({
    ok: true,
    data: {
      result: [{
        data: [{ sinsid: 'm-1', elementName: 'P', maxValue: 80, __timestamp: '2026-08-16T07:04:00.000Z' }]
      }]
    }
  });

  const arm = { filterKey: 'test-filter|mode:hat-active', mode: 'hat-active', fetchSeq: 1 };
  const staleRow = { measurementId: 'm-1', elementName: 'P', value: 50, timestamp: new Date(Date.UTC(2026, 7, 15, 10, 0, 0)) };

  context.state.scada.timeMode = 'live';
  context.state.scada.fetchSeq = 1;
  context.state.scada.measurementRowsById = new Map([['m-1|P', staleRow], ['m-1', staleRow]]);
  context.state.scada.missingIdFallbackByScope = {};

  await enrichMissingScadaIds({
    measurementIds: ['m-1'],
    elementNames: ['P'],
    ...arm,
    freshKeys: new Set(),
    throttleKey: 'freshkeys-test-slot1'
  });
  assert.equal(context.state.scada.measurementRowsById.get('m-1|P').value, 80, 'bos ana sorgu: kurtarma eski bayat satirin yerine gecer');

  context.state.scada.measurementRowsById = new Map([['m-1|P', staleRow], ['m-1', staleRow]]);
  context.state.scada.missingIdFallbackByScope = {};

  await enrichMissingScadaIds({
    measurementIds: ['m-1'],
    elementNames: ['P'],
    ...arm,
    freshKeys: new Set(['m-1|P', 'm-1']),
    throttleKey: 'freshkeys-test-slot2'
  });
  assert.equal(context.state.scada.measurementRowsById.get('m-1|P').value, 50, 'ana sorguda gelen taze satir genis-pencere sonucuyla ezilmez');
});
