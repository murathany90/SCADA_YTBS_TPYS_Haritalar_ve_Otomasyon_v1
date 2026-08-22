const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const runtimeCode = fs.readFileSync(path.join(__dirname, '..', 'map-v2-runtime.js'), 'utf8');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function loadVoltageSelection() {
  const state = {
    scada: { entityMetricsByKey: new Map() },
    network: {},
    filters: {},
    ui: {}
  };
  const context = vm.createContext({
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
    state,
    el: {},
    document: { getElementById: () => null },
    normalizeText,
    fetchJson: async () => ({}),
    initializeFilters: () => {},
    syncLayerFilterInputs: () => {},
    bindEvents: () => {},
    handleVisibilityFiltersChanged: () => {},
    hideInfo: () => {},
    __MAP_V2_TEST_HOOKS__: {}
  });
  vm.runInContext(runtimeCode, context, { filename: 'map-v2-runtime.js' });
  return { state, hooks: context.__MAP_V2_TEST_HOOKS__ };
}

function bara(id, name, level, extra = {}) {
  return { id, name, kvBucket: String(level), gerilimKv: Number(level), ...extra };
}

function metric(value, staleState = 'live', timestamp = '2026-08-22T10:00:00Z') {
  return { primaryValue: value, primaryStaleState: staleState, primaryTimestamp: new Date(timestamp) };
}

function select(items, records) {
  const runtime = loadVoltageSelection();
  records.forEach(([id, record]) => runtime.state.scada.entityMetricsByKey.set(`bara:${id}`, record));
  return runtime.hooks.selectActiveVoltagePerTmLevel(items);
}

test('voltage overlay selects the only normal bus with SCADA data', () => {
  const b1 = bara('b1', '154 B1', 154);
  const b2 = bara('b2', '154 B2', 154);
  const bt = bara('bt', '154 BT', 154);
  const selected = select([b1, b2, bt], [['b1', metric(154)]]);

  assert.deepEqual(Array.from(selected, (entry) => entry.bara.id), ['b1']);
});

test('voltage overlay keeps one freshest normal bus without using p.u. abnormality', () => {
  const b1 = bara('b1', '154 B1', 154);
  const b2 = bara('b2', '154 B2', 154);
  const selected = select([b1, b2], [
    ['b1', metric(153, 'live', '2026-08-22T10:00:00Z')],
    ['b2', metric(300, 'live', '2026-08-22T10:01:00Z')]
  ]);

  assert.deepEqual(Array.from(selected, (entry) => entry.bara.id), ['b2']);
});

test('voltage overlay excludes transfer bus data when a normal bus is available', () => {
  const b1 = bara('b1', '154 B1', 154);
  const bt = bara('bt', '154 TRANSFER BARA', 154, { kullanim: 'Transfer Barası' });
  const selected = select([bt, b1], [
    ['bt', metric(154, 'live', '2026-08-22T10:02:00Z')],
    ['b1', metric(153, 'live', '2026-08-22T10:00:00Z')]
  ]);

  assert.deepEqual(Array.from(selected, (entry) => entry.bara.id), ['b1']);
});

test('voltage overlay remains empty when only a transfer bus has SCADA data', () => {
  const bt = bara('bt', '154 BT', 154);
  const selected = select([bt], [['bt', metric(154)]]);

  assert.equal(selected.length, 0);
});

test('voltage overlay selects at most one representative per TM voltage level', () => {
  const selected = select([
    bara('154-b1', '154 B1', 154),
    bara('154-b2', '154 B2', 154),
    bara('400-b1', '400 B1', 400),
    bara('400-b2', '400 B2', 400)
  ], [
    ['154-b1', metric(153, 'live', '2026-08-22T10:00:00Z')],
    ['154-b2', metric(154, 'live', '2026-08-22T10:01:00Z')],
    ['400-b1', metric(399, 'warn', '2026-08-22T10:03:00Z')],
    ['400-b2', metric(400, 'live', '2026-08-22T10:00:00Z')]
  ]);

  assert.deepEqual(Array.from(selected, (entry) => entry.bara.id), ['400-b2', '154-b2']);
});
