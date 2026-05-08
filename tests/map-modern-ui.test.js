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
    __MAP_MODERN_TEST_HOOKS__: {},
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
