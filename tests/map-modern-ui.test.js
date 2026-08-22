const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'map-modern.js');
const sourceCode = fs.readFileSync(sourcePath, 'utf8');

function loadMapModern() {
  const documentStub = {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener() {},
    documentElement: {
      setAttribute() {},
      removeAttribute() {}
    }
  };
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
    setTimeout,
    clearTimeout,
    __MAP_MODERN_TEST_HOOKS__: {},
    SCADA_CONFIG: { NO_MATCH_COLOR: '#9ca3af' },
    getFlowColor(value) {
      if (!Number.isFinite(value)) return '#9ca3af';
      if (value <= 55) return '#22c55e';
      if (value <= 65) return '#eab308';
      if (value <= 75) return '#f97316';
      if (value <= 80) return '#ef4444';
      if (value <= 90) return '#dc2626';
      return '#7c3aed';
    },
    document: documentStub,
    window: {
      chrome: {
        storage: {
          local: {
            get: async () => ({}),
            set: async () => {}
          }
        },
        runtime: {
          getURL: (value) => value
        }
      }
    }
  };
  context.globalThis = context;
  context.window.window = context.window;
  context.window.document = documentStub;
  vm.createContext(context);
  vm.runInContext(sourceCode, context);
  return context.__MAP_MODERN_TEST_HOOKS__;
}

test('getVoltagePuColor follows configured threshold bands', () => {
  const hooks = loadMapModern();
  assert.equal(hooks.getVoltagePuColor(0.75), '#6b7280');
  assert.equal(hooks.getVoltagePuColor(0.82), '#7c3aed');
  assert.equal(hooks.getVoltagePuColor(0.96), '#1d4ed8');
  assert.equal(hooks.getVoltagePuColor(0.985), '#7dd3fc');
  assert.equal(hooks.getVoltagePuColor(1.0), '#22c55e');
  assert.equal(hooks.getVoltagePuColor(1.02), '#fb923c');
  assert.equal(hooks.getVoltagePuColor(1.04), '#ea580c');
  assert.equal(hooks.getVoltagePuColor(1.11), '#7c3aed');
  assert.equal(hooks.getVoltagePuColor(1.25), '#6b7280');
});

test('isBlankMapClickTarget ignores UI chrome and feature nodes', () => {
  const hooks = loadMapModern();
  const sidebarTarget = {
    closest(selector) {
      return selector.includes('.sidebar') ? { id: 'sidebar' } : null;
    }
  };
  const featureTarget = {
    closest(selector) {
      return selector.includes('path.hat-line') ? { tagName: 'path' } : null;
    }
  };
  const blankTarget = {
    closest() {
      return null;
    }
  };

  assert.equal(hooks.isBlankMapClickTarget(sidebarTarget), false);
  assert.equal(hooks.isBlankMapClickTarget(featureTarget), false);
  assert.equal(hooks.isBlankMapClickTarget(blankTarget), true);
  assert.equal(hooks.isBlankMapClickTarget(null), true);
});

test('map modern binds ESC to dashboard stop message', () => {
  assert.match(sourceCode, /document\.addEventListener\('keydown',\s*handleDashboardEscapeKey,\s*true\)/);
  assert.match(sourceCode, /DASHBOARD_STOP/);
  assert.match(sourceCode, /reason:\s*'esc-map'/);
});

test('visible entity cache reuses a filter result and invalidates explicitly', () => {
  const hooks = loadMapModern();
  let computations = 0;
  const compute = () => {
    computations += 1;
    return ['hat-a'];
  };

  assert.deepEqual(Array.from(hooks.getVisibleEntityList('hats', compute)), ['hat-a']);
  assert.deepEqual(Array.from(hooks.getVisibleEntityList('hats', compute)), ['hat-a']);
  assert.equal(computations, 1, 'unchanged filters do not repeat the full entity filter');

  hooks.invalidateVisibleEntityCache();
  assert.deepEqual(Array.from(hooks.getVisibleEntityList('hats', compute)), ['hat-a']);
  assert.equal(computations, 2, 'KV/YTM/search/topology invalidation recomputes the result');
});

test('hover tooltip resolves content once and only repositions on mousemove', () => {
  const hooks = loadMapModern();
  const elements = hooks.getMapElements();
  const classes = new Set(['hidden']);
  elements.hoverTooltip = {
    innerHTML: '',
    offsetWidth: 100,
    offsetHeight: 40,
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name)
    }
  };
  const listeners = {};
  const element = {
    id: 'hat-a',
    dataset: {},
    addEventListener: (name, handler) => { listeners[name] = handler; }
  };
  let resolverCalls = 0;
  hooks.attachHoverTooltip(element, () => {
    resolverCalls += 1;
    return '&lt;b&gt;safe&lt;/b&gt;';
  });

  listeners.mouseenter({ clientX: 10, clientY: 20 });
  for (let index = 0; index < 10; index += 1) listeners.mousemove({ clientX: 20 + index, clientY: 30 });
  assert.equal(resolverCalls, 1);
  assert.equal(elements.hoverTooltip.innerHTML, '&lt;b&gt;safe&lt;/b&gt;');
  assert.equal(classes.has('hidden'), false);

  listeners.mouseleave();
  assert.equal(classes.has('hidden'), false, 'existing delayed hide behavior remains scheduled');
});

test('selected hat partition preserves input order and draws selected hats last', () => {
  const hooks = loadMapModern();
  const state = hooks.getMapState();
  const hats = [{ id: 'parallel-a' }, { id: 'selected' }, { id: 'parallel-b' }];

  assert.deepEqual(Array.from(hooks.partitionSelectedHats(hats).map((hat) => hat.id)), ['parallel-a', 'selected', 'parallel-b']);
  state.selection = { kind: 'hat', id: 'selected', measureSourceId: '', measureTargetIds: [] };
  assert.deepEqual(Array.from(hooks.partitionSelectedHats(hats).map((hat) => hat.id)), ['parallel-a', 'parallel-b', 'selected']);
});

test('hat SCADA stroke never falls back to the 154 kV base color during refresh', () => {
  const hooks = loadMapModern();
  const state = hooks.getMapState();
  const hat = { id: 'hat-154', kv: '154' };
  state.scada.enabled = true;
  state.filters.scadaMetric = 'hat-active';
  state.filters.scadaMapDisplayMode = 'flow';
  state.scada.currentScope = { mode: 'hat-active' };
  state.scada.entityMetricsByKey = new Map();
  state.scada.lineFlowByLineId = new Map();

  assert.equal(hooks.getHatStrokeStyle(hat).color, '#9ca3af', 'bos gecis aninda turuncu baz renk kullanilmaz');

  state.scada.lineFlowByLineId.set('hat-154', {
    displayPct: 5,
    displayPctMode: 'loading',
    invalidPct: false,
    unavailable: false,
    width: 2,
    color: '#22c55e'
  });
  assert.equal(hooks.getHatStrokeStyle(hat).color, '#22c55e', 'gecerli eski snapshot rengi korunur');
});
