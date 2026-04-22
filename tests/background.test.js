const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const backgroundPath = path.join(__dirname, '..', 'background.js');
const backgroundCode = fs.readFileSync(backgroundPath, 'utf8');

function loadBackground(options = {}) {
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
    Promise,
    URL,
    URLSearchParams,
    AbortController,
    fetch: options.fetch,
    setTimeout: options.setTimeout || setTimeout,
    clearTimeout: options.clearTimeout || clearTimeout,
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        getURL: (targetPath) => targetPath
      },
      tabs: {
        create: async () => ({ id: 1 }),
        remove: async () => {},
        get: async () => ({ id: 1, url: 'https://example.test' }),
        onUpdated: { addListener() {}, removeListener() {} }
      },
      scripting: {
        executeScript: async () => [{ result: { ok: true } }]
      },
      downloads: {
        download: async () => 1,
        search: async () => [],
        onChanged: { addListener() {}, removeListener() {} }
      }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(backgroundCode, context);
  return context;
}

test('fetchChartData aborts long-running SCADA requests and reports TIMEOUT', async () => {
  let clearedTimerId = null;
  const context = loadBackground({
    setTimeout: (fn) => {
      fn();
      return 99;
    },
    clearTimeout: (timerId) => {
      clearedTimerId = timerId;
    },
    fetch: async (url, options = {}) => {
      if (String(url).includes('/csrf_token/')) {
        return {
          ok: true,
          json: async () => ({ result: 'csrf-timeout-token' })
        };
      }
      return new Promise((resolve, reject) => {
        if (options.signal?.aborted) {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
          return;
        }
        options.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      });
    }
  });

  const result = await context.fetchChartData({
    baseUrl: 'https://example.test',
    dashboardId: 1,
    chartSliceId: 2,
    datasourceId: 3,
    chartPayload: {}
  }, 'session', false);

  assert.equal(result.ok, false);
  assert.equal(result.errorType, 'TIMEOUT');
  assert.match(result.error, /zaman asimina ugradi/i);
  assert.equal(clearedTimerId, 99);
});

test('getSupersetCsrfToken caches token and invalidates cache after auth retry response', async () => {
  let csrfCallCount = 0;
  let chartCallCount = 0;
  const context = loadBackground({
    fetch: async (url) => {
      if (String(url).includes('/csrf_token/')) {
        csrfCallCount += 1;
        return {
          ok: true,
          json: async () => ({ result: `csrf-${csrfCallCount}` })
        };
      }
      chartCallCount += 1;
      return {
        ok: false,
        status: 403,
        json: async () => ({}),
        text: async () => ''
      };
    }
  });

  const baseUrl = 'https://example.test';
  const token1 = await context.getSupersetCsrfToken(baseUrl);
  const token2 = await context.getSupersetCsrfToken(baseUrl);
  const result = await context.fetchChartData({
    baseUrl,
    dashboardId: 1,
    chartSliceId: 2,
    datasourceId: 3,
    chartPayload: {}
  }, 'session', false);
  const token3 = await context.getSupersetCsrfToken(baseUrl);

  assert.equal(token1, 'csrf-1');
  assert.equal(token2, 'csrf-1');
  assert.equal(result.ok, false);
  assert.equal(result.errorType, 'AUTH_REQUIRED');
  assert.equal(token3, 'csrf-2');
  assert.equal(csrfCallCount, 2);
  assert.equal(chartCallCount, 1);
});
