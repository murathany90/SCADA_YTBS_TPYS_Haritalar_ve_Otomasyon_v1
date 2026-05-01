const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const diagnosticsCode = fs.readFileSync(path.join(__dirname, '..', 'rgdh-diagnostics.js'), 'utf8');
const bridgeCode = fs.readFileSync(path.join(__dirname, '..', 'yks-rgdh-diagnostic-bridge.js'), 'utf8');

test('YKS diagnostic bridge forwards sanitized events to background YKS log API', () => {
  const listeners = new Map();
  const runtimeMessages = [];
  const postedMessages = [];
  const window = {
    location: { origin: 'https://yks.teias.gov.tr' },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    postMessage(message, origin) {
      postedMessages.push({ message, origin });
    },
    dispatchMessage(data) {
      for (const handler of listeners.get('message') || []) {
        handler({ source: window, data });
      }
    }
  };
  const context = {
    window,
    self: window,
    globalThis: window,
    URL,
    Date,
    Math,
    JSON,
    String,
    Number,
    Array,
    Object,
    console,
    chrome: {
      runtime: {
        sendMessage(message, callback) {
          runtimeMessages.push(message);
          callback?.({ ok: true });
        },
        lastError: null
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(diagnosticsCode, context);
  vm.runInContext(bridgeCode, context);

  assert.equal(postedMessages.some((item) => item.message?.source === 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY'), true);

  window.dispatchMessage({
    source: 'RGDH_YKS_DIAGNOSTIC',
    event: {
      level: 'info',
      category: 'network',
      url: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?token=secret-token',
      requestHeaders: { Authorization: 'Bearer secret-token' },
      responsePreview: '{"token":"secret-token"}'
    }
  });

  assert.equal(runtimeMessages.length, 1);
  assert.equal(runtimeMessages[0].type, 'RGDH_YKS_LOG_EVENT');
  assert.equal(runtimeMessages[0].payload.requestHeaders.Authorization, '[redacted]');
  assert.equal(JSON.stringify(runtimeMessages[0]).includes('secret-token'), false);
});
