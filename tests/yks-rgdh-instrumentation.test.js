const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const instrumentationCode = fs.readFileSync(path.join(__dirname, '..', 'yks-rgdh-instrumentation.js'), 'utf8');

function createContext(options = {}) {
  const listeners = new Map();
  const posted = [];
  const location = {
    href: options.href || 'https://yks.teias.gov.tr/#/rgdh-wind-busbar-data',
    origin: 'https://yks.teias.gov.tr'
  };
  const window = {
    location,
    fetch: options.fetch,
    XMLHttpRequest: options.XMLHttpRequest || null,
    postMessage(message, origin) {
      posted.push({ message, origin });
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    dispatchMessage(data) {
      for (const handler of listeners.get('message') || []) {
        handler({ type: 'message', source: window, data });
      }
    }
  };
  const context = {
    window,
    location,
    console: {
      debug() {},
      info() {},
      log() {},
      warn() {},
      error() {}
    },
    Date,
    URL,
    JSON,
    String,
    Number,
    Array,
    Object,
    Promise,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  return { context, window, posted };
}

function runInstrumentation(context) {
  vm.runInContext(instrumentationCode, context);
}

test('YKS instrumentation buffers early events until bridge is ready', () => {
  const { context, window, posted } = createContext();

  runInstrumentation(context);

  assert.ok(Array.isArray(window.__rgdhYksDiagnosticBuffer));
  assert.equal(window.__rgdhYksDiagnosticBuffer.length > 0, true);
  assert.equal(posted.length, 0);

  window.dispatchMessage({ source: 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY' });

  assert.equal(window.__rgdhYksDiagnosticBuffer.length, 0);
  assert.equal(posted.some((item) => item.message?.source === 'RGDH_YKS_DIAGNOSTIC'), true);
});

test('YKS instrumentation fetch diagnostics include sanitized response preview', async () => {
  const { context, window, posted } = createContext({
    fetch: async () => ({
      ok: true,
      status: 200,
      headers: { entries: () => [['x-total-count', '1'], ['authorization', 'Bearer response-secret']] },
      clone() {
        return {
          json: async () => [{ id: 1, token: 'secret-token' }],
          text: async () => '[{"id":1,"token":"secret-token"}]'
        };
      }
    })
  });
  runInstrumentation(context);
  window.dispatchMessage({ source: 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY' });
  posted.length = 0;

  await window.fetch('https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?access_token=query-secret', {
    method: 'GET',
    headers: { Authorization: 'Bearer request-secret' }
  });

  const event = posted.map((item) => item.message.event).find((item) => item?.category === 'network');
  assert.equal(event.responseRowCount, 1);
  assert.match(event.responsePreview, /\[redacted\]/);
  assert.equal(JSON.stringify(event).includes('secret-token'), false);
  assert.equal(JSON.stringify(event).includes('request-secret'), false);
  assert.equal(JSON.stringify(event).includes('response-secret'), false);
  assert.equal(JSON.stringify(event).includes('query-secret'), false);
});

test('YKS instrumentation logs all API calls on teias conv unit route and keeps total count headers', async () => {
  const { context, window, posted } = createContext({
    href: 'https://yks.teias.gov.tr/#/teias-rgdh-conv-unit-data',
    fetch: async () => ({
      ok: true,
      status: 200,
      headers: {
        entries: () => [
          ['x-total-count', '1080'],
          ['link', '</teias-rgdh-conv-unit-data?page=17&size=60>; rel="last"']
        ]
      },
      clone() {
        return {
          json: async () => { throw new Error('body unavailable'); },
          text: async () => ''
        };
      }
    })
  });
  runInstrumentation(context);
  window.dispatchMessage({ source: 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY' });
  posted.length = 0;

  await window.fetch('https://yks.teias.gov.tr/api/teias-rgdh-conv-unit-data?size=60');

  const event = posted.map((item) => item.message.event).find((item) => item?.category === 'network');
  assert.ok(event, 'network event should be emitted for conv unit route API traffic');
  assert.equal(event.route, 'teias-rgdh-conv-unit-data');
  assert.equal(event.responseRowCount, null);
  assert.equal(event.responseTotalCount, 1080);
  assert.match(event.responseLink, /rel="last"/);
});

test('YKS instrumentation XHR diagnostics include sanitized responseText preview', () => {
  class FakeXhr {
    constructor() {
      this.listeners = {};
      this.status = 200;
      this.responseText = '{"jwt":"secret-jwt","rows":[{"id":1}]}';
    }

    open(method, url) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader(key, value) {
      this.headers = { ...(this.headers || {}), [key]: value };
    }

    addEventListener(type, handler) {
      this.listeners[type] = handler;
    }

    getAllResponseHeaders() {
      return 'x-total-count: 1\r\nauthorization: Bearer response-secret\r\n';
    }

    send() {
      this.listeners.loadend?.();
    }
  }

  const { context, window, posted } = createContext({ XMLHttpRequest: FakeXhr });
  runInstrumentation(context);
  window.dispatchMessage({ source: 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY' });
  posted.length = 0;

  const xhr = new window.XMLHttpRequest();
  xhr.open('GET', 'https://yks.teias.gov.tr/api/rgdh-busbar-participant?token=query-secret');
  xhr.setRequestHeader('Authorization', 'Bearer request-secret');
  xhr.send();

  const event = posted.map((item) => item.message.event).find((item) => item?.category === 'network');
  assert.equal(event.responseRowCount, 1);
  assert.match(event.responsePreview, /\[redacted\]/);
  assert.equal(JSON.stringify(event).includes('secret-jwt'), false);
  assert.equal(JSON.stringify(event).includes('request-secret'), false);
  assert.equal(JSON.stringify(event).includes('response-secret'), false);
  assert.equal(JSON.stringify(event).includes('query-secret'), false);
});
