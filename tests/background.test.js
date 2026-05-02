const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const backgroundPath = path.join(__dirname, '..', 'background.js');
const backgroundCode = fs.readFileSync(backgroundPath, 'utf8');
const rgdhApiClientPath = path.join(__dirname, '..', 'rgdh-api-client.js');
const rgdhApiClientCode = fs.readFileSync(rgdhApiClientPath, 'utf8');
const rgdhCsvPath = path.join(__dirname, '..', 'rgdh-csv.js');
const rgdhCsvCode = fs.readFileSync(rgdhCsvPath, 'utf8');
const diagnosticsPath = path.join(__dirname, '..', 'rgdh-diagnostics.js');
const diagnosticsCode = fs.existsSync(diagnosticsPath) ? fs.readFileSync(diagnosticsPath, 'utf8') : '';

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
  vm.runInContext(rgdhApiClientCode, context);
  vm.runInContext(rgdhCsvCode, context);
  if (diagnosticsCode) vm.runInContext(diagnosticsCode, context);
  vm.runInContext(backgroundCode, context);
  return context;
}

function makeStorage(values) {
  const entries = { ...values };
  return {
    get length() {
      return Object.keys(entries).length;
    },
    key(index) {
      return Object.keys(entries)[index] || null;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(entries, key) ? entries[key] : null;
    }
  };
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

test('rgdhPageFetchMainWorld sends YKS page token and never exposes it in the result', async () => {
  const token = 'secret-yks-token';
  let capturedHeaders = {};
  const context = loadBackground({
    fetch: async (url, options = {}) => {
      assert.equal(new URL(url).pathname, '/api/busbars');
      capturedHeaders = options.headers || {};
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ([{ id: 10933818957, busbarType: 'WIND', busbarId: 5052 }])
      };
    }
  });
  context.localStorage = makeStorage({ 'jhi-authenticationToken': JSON.stringify(token) });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/busbars',
    params: { 'busbarType.equals': 'WIND', size: 20 }
  });

  assert.equal(capturedHeaders.Authorization, `Bearer ${token}`);
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 1);
  assert.equal(JSON.stringify(result).includes(token), false);
});

test('rgdhPageFetchMainWorld allows slow YKS responses up to 60 seconds', async () => {
  let timeoutMs = 0;
  const context = loadBackground({
    setTimeout: (fn, ms) => {
      timeoutMs = ms;
      return 77;
    },
    clearTimeout: () => {},
    fetch: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => []
    })
  });
  context.localStorage = makeStorage({ authenticationToken: 'slow-yks-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-conventional-busbar-data',
    params: { size: 1 }
  });

  assert.equal(result.ok, true);
  assert.equal(timeoutMs, 60000);
});

test('rgdhPageFetchMainWorld allows hybrid CSV fallback responses up to fifteen minutes', async () => {
  let timeoutMs = 0;
  const context = loadBackground({
    setTimeout: (_fn, ms) => {
      timeoutMs = ms;
      return 78;
    },
    clearTimeout: () => {},
    fetch: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json;charset=UTF-8' },
      json: async () => []
    })
  });
  context.localStorage = makeStorage({ authenticationToken: 'slow-hybrid-csv-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-wind-busbar-data-csv',
    params: {
      'measurementDate.greaterOrEqualThan': '2026-03-31T21:00:00Z',
      'measurementDate.lessThan': '2026-04-01T21:00:00Z',
      'busbarId.equals': '10933818954',
      sort: 'measurementDate,asc'
    },
    timeoutMs: 900000
  });

  assert.equal(result.ok, true);
  assert.equal(timeoutMs, 900000);
});

test('rgdhPageFetchMainWorld omits page query when caller does not provide page', async () => {
  let capturedUrl = '';
  const context = loadBackground({
    fetch: async (url) => {
      capturedUrl = String(url);
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => []
      };
    }
  });
  context.localStorage = makeStorage({ authenticationToken: 'page-less-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: {
      'measurementDate.greaterOrEqualThan': '2026-04-30T21:00:00Z',
      'measurementDate.lessThan': '2026-05-01T21:00:00Z',
      'busbarId.equals': '9490732369',
      size: 60
    }
  });

  const url = new URL(capturedUrl);
  assert.equal(result.ok, true);
  assert.equal(url.searchParams.has('page'), false);
  assert.equal(url.searchParams.get('size'), '60');
});

test('rgdhPageFetchMainWorld keeps page zero when caller provides page zero', async () => {
  let capturedUrl = '';
  const context = loadBackground({
    fetch: async (url) => {
      capturedUrl = String(url);
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => []
      };
    }
  });
  context.localStorage = makeStorage({ authenticationToken: 'page-zero-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: { size: 60, page: 0 }
  });

  const url = new URL(capturedUrl);
  assert.equal(result.ok, true);
  assert.equal(url.searchParams.get('page'), '0');
  assert.equal(url.searchParams.get('size'), '60');
});

test('rgdhPageFetchMainWorld keeps auth failures classified as AUTH_REQUIRED', async () => {
  const context = loadBackground({
    fetch: async () => ({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({})
    })
  });
  context.localStorage = makeStorage({ 'authenticationToken': 'expired-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-conventional-busbar-data',
    params: { size: 1 }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, 'AUTH_REQUIRED');
  assert.equal(result.httpStatus, 401);
  assert.equal(JSON.stringify(result).includes('expired-token'), false);
});

test('YKS log handlers keep network diagnostics separate from extension diagnostics', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });

  await context.handleRgdhDiagnosticEvent({
    level: 'error',
    category: 'fetch-job',
    message: 'extension side failed'
  });
  await context.handleRgdhYksLogEvent({
    level: 'info',
    category: 'network',
    route: 'rgdh-wind-busbar-data',
    method: 'GET',
    url: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?token=secret-token',
    requestHeaders: { Authorization: 'Bearer secret-token' },
    responsePreview: '{"token":"secret-token","rows":[1]}',
    responseRowCount: 1
  });

  const extensionLogs = await context.handleRgdhDiagnosticList({ limit: 10 });
  const yksLogs = await context.handleRgdhYksLogList({ limit: 10 });

  assert.equal(extensionLogs.events.length, 1);
  assert.equal(yksLogs.events.length, 1);
  assert.equal(yksLogs.events[0].category, 'network');
  assert.equal(yksLogs.events[0].requestHeaders.Authorization, '[redacted]');
  assert.equal(JSON.stringify(yksLogs).includes('secret-token'), false);

  await context.handleRgdhYksLogClear();
  assert.equal((await context.handleRgdhYksLogList({ limit: 10 })).events.length, 0);
  assert.equal((await context.handleRgdhDiagnosticList({ limit: 10 })).events.length, 1);
});

test('handleRgdhDiagnosticEvent stores sanitized YKS diagnostics and exports CSV', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });

  const stored = await context.handleRgdhDiagnosticEvent({
    level: 'error',
    category: 'network',
    route: 'rgdh-wind-busbar-data',
    url: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?token=secret',
    requestHeaders: { Authorization: 'Bearer secret-token' },
    message: 'Bearer secret-token failed'
  });
  const list = await context.handleRgdhDiagnosticList({ limit: 10 });
  const csv = await context.handleRgdhDiagnosticCsv();

  assert.equal(stored.ok, true);
  assert.equal(list.ok, true);
  assert.equal(list.events.length, 1);
  assert.equal(list.events[0].requestHeaders.Authorization, '[redacted]');
  assert.equal(JSON.stringify(list).includes('secret-token'), false);
  assert.match(csv.csv, /^﻿Zaman;Seviye;Kategori;Route/m);
});

test('RGDH_YKS_LOG_ATTACH injects bridge and instrumentation into open YKS tabs', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const executeCalls = [];
  context.chrome.tabs.query = async () => [
    { id: 11, url: 'https://yks.teias.gov.tr/#/rgdh-wind-busbar-data' },
    { id: 12, url: 'https://example.test/' },
    { id: 13, url: 'https://yks.teias.gov.tr/#/rgdh-busbar-participant' }
  ];
  context.chrome.scripting.executeScript = async (payload) => {
    executeCalls.push(payload);
    return [{ result: undefined }];
  };

  const result = await context.handleRgdhYksLogAttach();

  assert.equal(result.ok, true);
  assert.deepEqual(result.tabIds, [11, 13]);
  assert.equal(executeCalls.length, 4);
  assert.deepEqual(Array.from(executeCalls[0].files), ['rgdh-diagnostics.js', 'yks-rgdh-diagnostic-bridge.js']);
  assert.equal(executeCalls[1].world, 'MAIN');
  assert.deepEqual(Array.from(executeCalls[1].files), ['yks-rgdh-instrumentation.js']);
  assert.deepEqual(Array.from(executeCalls[2].files), ['rgdh-diagnostics.js', 'yks-rgdh-diagnostic-bridge.js']);
  assert.equal(executeCalls[3].world, 'MAIN');
});

test('sanitizeRgdhBackgroundError classifies message-size failures for diagnostics', () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });

  const error = context.sanitizeRgdhBackgroundError(new Error('Message exceeded maximum allowed size of 64MiB.'));

  assert.equal(error.errorType, 'MESSAGE_TOO_LARGE');
});

test('handleRgdhFetch requires one selected YKS busbar before network fetch', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  let pageFetchCalls = 0;
  context.runRgdhPageFetchInYksTab = async () => {
    pageFetchCalls += 1;
    return { ok: true, rows: [], lastPage: 0, totalCount: 0 };
  };

  await assert.rejects(
    () => context.handleRgdhFetch({ localDate: '2026-04-30', sourceType: 'WIND' }),
    /Önce katalogdan bara seçin|Once katalogdan bara secin/
  );
  assert.equal(pageFetchCalls, 0);
});

test('handleRgdhFetch chunks selected conventional busbar by hourly exclusive date ranges', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: true, rows: [{ measurementDate: payload.params['measurementDate.greaterOrEqualThan'] }], lastPage: 0, totalCount: 1 };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-04-01',
    endDate: '2026-04-02',
    sourceType: 'CONVENTIONAL',
    busbarInternalIds: ['10933818993']
  });

  assert.equal(result.ok, true);
  assert.equal(result.conventionalRows.length, 24);
  assert.equal(calls.length, 24);
  assert.equal(calls[0].endpoint, '/api/rgdh-conventional-busbar-data');
  assert.equal(calls[0].params['measurementDate.greaterOrEqualThan'], '2026-03-31T21:00:00Z');
  assert.equal(calls[0].params['measurementDate.lessThan'], '2026-03-31T22:00:00Z');
  assert.equal(calls[0].params['busbarId.equals'], '10933818993');
  assert.equal(calls[0].params.size, 60);
  assert.equal(calls[0].params.sort, 'measurementDate,asc');
  assert.equal(calls[23].params['measurementDate.greaterOrEqualThan'], '2026-04-01T20:00:00Z');
  assert.equal(calls[23].params['measurementDate.lessThan'], '2026-04-01T21:00:00Z');
  assert.equal(calls.some((call) => call.params.size === 1440), false);
  assert.equal(result.logs.some((log) => /2026-04-01 00:00-01:00/.test(log.message)), true);
  assert.equal(result.logs.some((log) => /Saatlik toplam 24 kayit alindi/.test(log.message)), true);
});

test('handleRgdhFetch chunks selected RES/GES busbar by hourly page-zero date ranges', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: true, rows: [], lastPage: 0, totalCount: 0 };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-04-30',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369']
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 24);
  assert.equal(calls[0].endpoint, '/api/rgdh-wind-busbar-data');
  assert.equal(calls[0].params['measurementDate.greaterOrEqualThan'], '2026-04-29T21:00:00Z');
  assert.equal(calls[0].params['measurementDate.lessThan'], '2026-04-29T22:00:00Z');
  assert.equal(calls[0].params['busbarId.equals'], '9490732369');
  assert.equal(calls[0].params.size, 60);
  assert.equal(calls[0].params.page, 0);
  assert.equal(calls[0].timeoutMs <= 15000, true);
  assert.equal(calls.every((call) => call.timeoutMs <= 15000), true);
  assert.equal(calls[23].params['measurementDate.greaterOrEqualThan'], '2026-04-30T20:00:00Z');
  assert.equal(calls[23].params['measurementDate.lessThan'], '2026-04-30T21:00:00Z');
  assert.equal(calls.some((call) => call.params['measurementDate.lessThan'] === '2026-04-30T21:00:00Z' && call.params.page === 1), false);
});

test('resolveSelectedRgdhBusbarInternalIds tries targeted catalog lookup before broad paging', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.endpoint === '/api/busbars' && payload.params['busbarId.equals'] === '6002') {
      return {
        ok: true,
        rows: [{ id: 10933818956, busbarId: '6002', busbarName: 'AKYEL-1 RES', busbarType: 'WIND' }],
        lastPage: 0,
        totalCount: 1
      };
    }
    return { ok: true, rows: [], lastPage: 0, totalCount: 0 };
  };

  const ids = await context.resolveSelectedRgdhBusbarInternalIds({}, {
    busbarId: '6002',
    busbarName: 'AKYEL-1 RES',
    sourceType: 'WIND'
  }, 'WIND');

  assert.equal(ids.length, 1);
  assert.equal(ids[0], '10933818956');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].params['busbarId.equals'], '6002');
  assert.equal(calls[0].params.size, 50);
});

test('resolveSelectedRgdhBusbarInternalIds bounds broad catalog paging when selected busbar is not found', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return {
      ok: true,
      rows: [{ id: `not-${payload.params.page || 0}`, busbarId: '0000', busbarName: 'BASKA BARA', busbarType: 'WIND' }],
      lastPage: null,
      totalCount: null
    };
  };

  await assert.rejects(
    () => context.resolveSelectedRgdhBusbarInternalIds({}, {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND'
    }, 'WIND'),
    /YKS ic ID bulunamadi\. "https:\/\/yks\.teias\.gov\.tr\/#\/ adresinden giriş yapın"/
  );

  assert.ok(calls.length <= 7, `expected bounded catalog calls, got ${calls.length}`);
  assert.equal(Math.max(...calls.map((call) => Number(call.params.page || 0))) <= 4, true);
});

test('handleRgdhFetch keeps successful RES/GES hourly rows when one hour times out', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const start = payload.params['measurementDate.greaterOrEqualThan'];
    if (start === '2026-04-30T21:00:00Z') {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return { ok: true, rows: [{ measurementDate: start }], lastPage: 0, totalCount: 1 };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818956']
  });

  assert.equal(calls.length, 24);
  assert.equal(calls[0].params['measurementDate.greaterOrEqualThan'], '2026-04-30T21:00:00Z');
  assert.equal(calls[0].params['measurementDate.lessThan'], '2026-04-30T22:00:00Z');
  assert.equal(result.windRows.length, 23);
  assert.equal(result.partialErrors.length, 1);
  assert.equal(result.partialErrors[0].errorType, 'YKS_HOURLY_TIMEOUT');
  assert.equal(result.partialErrors[0].failedHours, 1);
  assert.match(result.partialErrors[0].message, /1 RES\/GES saatlik YKS istegi zaman asimina ugradi/i);
});

test('handleRgdhFetch reports one RES/GES hourly timeout summary when all hours fail', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818956']
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 24);
  assert.equal(calls.some((call) => call.params['measurementDate.lessThan'] === '2026-05-01T21:00:00Z' && call.params.page === 1), false);
  assert.equal(result.windRows.length, 0);
  assert.equal(result.partialErrors.length, 1);
  assert.equal(result.partialErrors[0].errorType, 'YKS_HOURLY_TIMEOUT');
  assert.equal(result.partialErrors[0].failedHours, 24);
  assert.match(result.partialErrors[0].message, /24 RES\/GES saatlik YKS istegi zaman asimina ugradi/i);
});

test('handleRgdhFetch starts CSV-first continuation instead of display id retry when hybrid internal probes time out', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const id = String(payload.params['busbarId.equals']);
    const start = payload.params['measurementDate.greaterOrEqualThan'];
    if (id === '10933818957') {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    if (id === '5052') {
      return { ok: true, rows: [{ measurementDate: start, busbarId: { busbarId: '5052', busbarName: 'GEYCEK RES' } }], lastPage: 0, totalCount: 1 };
    }
    return { ok: false, error: `unexpected id ${id}`, errorType: 'PAGE_FETCH_ERROR' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-04-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  const windCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  const internalCalls = windCalls.filter((call) => String(call.params['busbarId.equals']) === '10933818957');
  const displayCalls = windCalls.filter((call) => String(call.params['busbarId.equals']) === '5052');

  assert.equal(displayCalls.length, 0);
  assert.equal(internalCalls[0].params.page, undefined);
  assert.equal(internalCalls[0].params.size, 60);
  assert.equal(internalCalls.length <= 3, true);
  assert.equal(result.windRows.length, 0);
  assert.equal(result.continuationPayload?.busbarId, '10933818957');
  assert.equal(result.continuationPayload?.preferCsvFallback, true);
  assert.equal(result.partialErrors.some((error) => error.candidateBusbarId === '10933818957'), true);
  assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-fast-probe'), true);
});

test('handleRgdhFetch uses hybrid defaults and tries page-less windows before hourly/probe fallbacks', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const id = String(payload.params['busbarId.equals']);
    if (id === '10933818957') {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    if (id === '5052') {
      return { ok: true, rows: [{ measurementDate: payload.params['measurementDate.greaterOrEqualThan'], busbar: { busbarId: 5052, busbarName: 'GEYCEK RES' } }], lastPage: 0, totalCount: 1 };
    }
    return { ok: false, error: `unexpected id ${id}`, errorType: 'PAGE_FETCH_ERROR' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  const windCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  const internalCalls = windCalls.filter((call) => String(call.params['busbarId.equals']) === '10933818957');
  const internalWindowCalls = internalCalls.filter((call) => call.params.page === undefined && call.params.size === 60);
  const internalHourlyCalls = internalCalls.filter((call) => call.params.page === 0 && !(
    call.params['measurementDate.greaterOrEqualThan'] === '2026-04-30T21:00:00Z'
    && call.params['measurementDate.lessThan'] === '2026-05-01T21:00:00Z'
  ));
  const displayCalls = windCalls.filter((call) => String(call.params['busbarId.equals']) === '5052');

  assert.equal(result.ok, true);
  assert.equal(internalWindowCalls.length >= 1, true);
  assert.equal(internalCalls[0].params.page, undefined);
  assert.equal(internalCalls[0].params.size, 60);
  assert.equal(internalCalls[0].timeoutMs, 15000);
  assert.equal(result.logs.some((log) => log.detail?.candidateBusbarId === '10933818957' && log.detail?.fallbackPhase === 'hybrid-yks-fast-probe'), true);
  assert.equal(displayCalls.length, 0);
  assert.equal(result.continuationPayload?.preferCsvFallback, true);
});

test('handleRgdhFetch skips slow full-day fallback when hybrid fast probes produce no rows', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const id = String(payload.params['busbarId.equals']);
    if (id !== '10933818957') {
      return { ok: false, error: `display fallback should not be reached: ${id}`, errorType: 'PAGE_FETCH_ERROR' };
    }
    const isFullDay = payload.params['measurementDate.greaterOrEqualThan'] === '2026-04-30T21:00:00Z'
      && payload.params['measurementDate.lessThan'] === '2026-05-01T21:00:00Z';
    if (isFullDay) {
      return { ok: true, rows: [{ measurementDate: '2026-05-01T08:00:00Z', busbar: { busbarId: 5052, busbarName: 'GEYCEK RES' } }], lastPage: 0, totalCount: 1 };
    }
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  assert.equal(result.windRows.length, 0);
  assert.equal(calls.some((call) => String(call.params['busbarId.equals']) === '5052'), false);
  assert.equal(calls.some((call) => {
    return call.params['measurementDate.greaterOrEqualThan'] === '2026-04-30T21:00:00Z'
      && call.params['measurementDate.lessThan'] === '2026-05-01T21:00:00Z';
  }), false);
  assert.equal(result.continuationPayload?.preferCsvFallback, true);
});

test('handleRgdhFetch summarizes hybrid fast-probe failure and creates continuation when all probes time out', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-04-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  assert.equal(result.windRows.length, 0);
  assert.equal(calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data').length <= 3, true);
  assert.equal(result.partialErrors.some((error) => error.errorType === 'INCOMPLETE_HYBRID_FETCH'), true);
  assert.equal(result.continuationPayload?.preferCsvFallback, true);
  assert.deepEqual(Array.from(result.continuationPayload?.baseRows || []), []);
  assert.equal(result.logs.some((log) => log.detail?.displayBusbarId === '5052' && log.detail?.hybridAuxiliary === true), true);
  assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-fast-probe'), true);
});

test('handleRgdhFetch treats string hasAuxiliarySource as hybrid auxiliary', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND',
      hasAuxiliarySource: 'true'
    }
  });

  const windCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  assert.equal(windCalls.some((call) => String(call.params['busbarId.equals']) === '9490732369'), true);
  assert.equal(windCalls.some((call) => call.params.page === undefined), true);
});

test('handleRgdhFetch uses page-less hourly windows for auxiliary RES/GES before hourly timeout fails the job', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.params.page !== undefined) {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return {
      ok: true,
      rows: [
        { measurementDate: '2026-04-30T21:00:00Z', busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES' } },
        { measurementDate: '2026-04-30T21:01:00Z', busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES' } }
      ],
      lastPage: null,
      totalCount: null
    };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  assert.equal(calls[0].endpoint, '/api/rgdh-wind-busbar-data');
  assert.equal(calls[0].params.page, undefined);
  assert.equal(calls[0].params.size, 60);
  const rangeCall = calls.find((call) => call.endpoint === '/api/rgdh-wind-busbar-data'
    && call.params.page === undefined
    && call.params['measurementDate.greaterOrEqualThan'] === '2026-04-30T21:00:00Z');
  assert.ok(rangeCall);
  assert.equal(rangeCall.params['measurementDate.greaterOrEqualThan'], '2026-04-30T21:00:00Z');
  assert.equal(rangeCall.params['measurementDate.lessThan'], '2026-04-30T22:00:00Z');
  assert.equal(rangeCall.params['busbarId.equals'], '9490732369');
  assert.equal(result.windRows.length >= 2, true);
  assert.equal(result.partialErrors.length, 0);
  assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-ui-window'), true);
  assert.equal(result.logs.some((log) => log.detail?.requestUrl && !String(log.detail.requestUrl).includes('&page=')), true);
});

test('hybrid timeout fallback treats all attempted hours as complete failure even below 24 hours', () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });

  assert.equal(context.isFullDayHourlyTimeout([{
    errorType: 'YKS_HOURLY_TIMEOUT',
    failedHours: 18,
    attemptedHours: 18
  }]), true);
  assert.equal(context.isFullDayHourlyTimeout([{
    errorType: 'YKS_HOURLY_TIMEOUT',
    failedHours: 18,
    attemptedHours: 24
  }]), false);
});

test('hybrid page-less range cursor advances from last measurement when page is full', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (calls.filter((call) => call.params.page === undefined).length === 1) {
      return {
        ok: true,
        rows: Array.from({ length: 60 }, (_value, index) => ({
          measurementDate: `2026-04-30T21:${String(index).padStart(2, '0')}:00Z`
        }))
      };
    }
    return {
      ok: true,
      rows: [{ measurementDate: '2026-04-30T22:00:00Z' }]
    };
  };

  const result = await context.fetchRgdhWindBusbarByYksUiRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    payload: { windRangeEndUtc: '2026-04-30T23:00:00Z', windRangeSize: 60, jobTimeoutMs: 180000 },
    deadlineAt: Date.now() + 180000
  });

  const rangeCalls = calls.filter((call) => call.params.page === undefined);
  assert.equal(rangeCalls.length, 2);
  assert.equal(rangeCalls[1].params['measurementDate.greaterOrEqualThan'], '2026-04-30T22:00:00Z');
  assert.equal(result.rows.length, 61);
});

test('hybrid page-less range retries timeout once with size 60', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.params.size === 500) {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return {
      ok: true,
      rows: [{ measurementDate: '2026-03-31T21:00:00Z', busbar: { busbarId: 5052, busbarName: 'GEYCEK RES' } }]
    };
  };

  const result = await context.fetchRgdhWindBusbarByYksUiRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-04-01',
    busbarId: '10933818957',
    payload: {
      windRangeEndUtc: '2026-04-01T21:00:00Z',
      windRangeSize: 500,
      jobTimeoutMs: 300000
    },
    deadlineAt: Date.now() + 300000
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].params.size, 500);
  assert.equal(calls[1].params.size, 60);
  assert.equal(calls.every((call) => call.params.page === undefined), true);
  assert.equal(result.rows.length, 1);
});

test('hybrid page-less range continues after size 60 retry returns a full page', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.params.size === 500) {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    if (calls.filter((call) => call.params.size === 60).length === 1) {
      return {
        ok: true,
        rows: Array.from({ length: 60 }, (_value, index) => ({
          measurementDate: `2026-04-30T21:${String(index).padStart(2, '0')}:00Z`
        })),
        totalCount: 120
      };
    }
    return {
      ok: true,
      rows: [{ measurementDate: '2026-04-30T22:00:00Z' }],
      totalCount: 120
    };
  };

  const result = await context.fetchRgdhWindBusbarByYksUiRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    payload: { windRangeEndUtc: '2026-04-30T23:00:00Z', windRangeSize: 500, jobTimeoutMs: 300000 },
    deadlineAt: Date.now() + 300000
  });

  const smallCalls = calls.filter((call) => call.params.size === 60);
  assert.equal(smallCalls.length, 2);
  assert.equal(smallCalls[1].params['measurementDate.greaterOrEqualThan'], '2026-04-30T22:00:00Z');
  assert.equal(result.rows.length, 61);
});

test('hybrid page-less range reports incomplete when total count exceeds fetched rows', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  context.runRgdhPageFetchInYksTab = async () => ({
    ok: true,
    rows: Array.from({ length: 60 }, (_value, index) => ({
      measurementDate: `2026-04-30T21:${String(index).padStart(2, '0')}:00Z`
    })),
    totalCount: 1200,
    lastPage: 19
  });

  const result = await context.fetchRgdhWindBusbarByYksUiRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    payload: { windRangeEndUtc: '2026-04-30T22:00:00Z', windRangeSize: 60, jobTimeoutMs: 300000 },
    deadlineAt: Date.now() + 300000
  });

  assert.equal(result.isComplete, false);
  assert.equal(result.fetchedRows, 60);
  assert.equal(result.responseTotalCount, 1200);
  assert.equal(result.partialErrors.some((error) => error.errorType === 'INCOMPLETE_HYBRID_FETCH'), true);
});

test('hybrid page-less hourly windows collect twenty hours without page parameter', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const start = payload.params['measurementDate.greaterOrEqualThan'];
    return {
      ok: true,
      rows: Array.from({ length: 60 }, (_value, index) => ({
        id: `${start}-${index}`,
        measurementDate: context.addOneMinuteUtc(new Date(new Date(start).getTime() + (index - 1) * 60000).toISOString().replace(/\.\d{3}Z$/, 'Z')),
        busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES' }
      })),
      totalCount: 60
    };
  };

  const result = await context.fetchRgdhWindBusbarByYksUiHourlyWindows({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    payload: { windRangeEndUtc: '2026-05-01T17:00:00Z', jobTimeoutMs: 300000 },
    deadlineAt: Date.now() + 300000
  });

  assert.equal(calls.length, 20);
  assert.equal(calls.every((call) => call.params.page === undefined), true);
  assert.equal(calls.every((call) => call.params.size === 60), true);
  assert.equal(result.rows.length, 1200);
  assert.equal(result.expectedRows, 1200);
  assert.equal(result.isComplete, true);
});

test('handleRgdhFetch tries page-less range chunks before hourly page-zero for auxiliary RES/GES', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    const start = payload.params['measurementDate.greaterOrEqualThan'];
    const end = payload.params['measurementDate.lessThan'];
    const fullDay = start === '2026-03-31T21:00:00Z' && end === '2026-04-01T21:00:00Z';
    if (payload.params.page !== undefined) {
      return { ok: false, error: 'hourly page-zero should not run before page-less chunks', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    if (fullDay) {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return {
      ok: true,
      rows: [{ measurementDate: start, busbar: { busbarId: 5052, busbarName: 'GEYCEK RES' } }]
    };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-04-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    },
    jobTimeoutMs: 300000
  });

  const windCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  const pageZeroCalls = windCalls.filter((call) => call.params.page === 0);
  const pageLessChunkCalls = windCalls.filter((call) => {
    return call.params.page === undefined
      && call.params['measurementDate.greaterOrEqualThan'] === '2026-03-31T21:00:00Z'
      && call.params['measurementDate.lessThan'] !== '2026-04-01T21:00:00Z';
  });

  assert.equal(result.windRows.length >= 1, true);
  assert.equal(pageZeroCalls.length, 0);
  assert.equal(pageLessChunkCalls.length >= 1, true);
  assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-ui-window'), true);
});

test('runRgdhPageFetchInYksTab injects YKS instrumentation and records page-fetch diagnostics', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const executeCalls = [];
  let createCalls = 0;
  context.chrome.tabs.query = async () => [{ id: 77, url: 'https://yks.teias.gov.tr/#/rgdh-wind-busbar-data' }];
  context.chrome.tabs.create = async () => {
    createCalls += 1;
    return { id: 88, url: 'https://yks.teias.gov.tr/#/' };
  };
  context.chrome.scripting.executeScript = async (payload) => {
    executeCalls.push(payload);
    if (payload.files) return [{ result: undefined }];
    return [{ result: { ok: true, rows: [{ id: 1 }], httpStatus: 200, transport: 'page-context' } }];
  };

  const result = await context.runRgdhPageFetchInYksTab({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: {
      'measurementDate.greaterOrEqualThan': '2026-04-30T21:00:00Z',
      'measurementDate.lessThan': '2026-04-30T22:00:00Z',
      'busbarId.equals': '10933818956',
      size: 60,
      page: 0
    },
    timeoutMs: 15000
  });
  const diagnostics = await context.handleRgdhYksLogList({ limit: 5 });

  assert.equal(result.ok, true);
  assert.equal(createCalls, 0);
  assert.deepEqual(Array.from(executeCalls[0].files), ['rgdh-diagnostics.js', 'yks-rgdh-diagnostic-bridge.js']);
  assert.deepEqual(Array.from(executeCalls[1].files), ['yks-rgdh-instrumentation.js']);
  assert.equal(executeCalls[1].world, 'MAIN');
  assert.equal(typeof executeCalls[2].func, 'function');
  assert.equal(diagnostics.events[0].category, 'network');
  assert.equal(diagnostics.events[0].route, 'rgdh-wind-busbar-data');
  assert.equal(diagnostics.events[0].status, 200);
  assert.equal(diagnostics.events[0].detail.rowCount, '1');
  assert.match(diagnostics.events[0].detail.requestUrl, /rgdh-wind-busbar-data/);
});

test('runRgdhPageFetchInYksTab opens an inactive YKS tab when none is already open', async () => {
  const context = loadBackground({
    fetch: async () => ({ ok: true, json: async () => [] }),
    setTimeout: (fn) => {
      Promise.resolve().then(fn);
      return 123;
    },
    clearTimeout: () => {}
  });
  const createCalls = [];
  const removedTabs = [];
  const executeCalls = [];
  context.chrome.tabs.query = async () => [];
  context.chrome.tabs.create = async (payload) => {
    createCalls.push(payload);
    return { id: 91, url: payload.url, status: 'loading' };
  };
  context.chrome.tabs.get = async (tabId) => ({ id: tabId, url: 'https://yks.teias.gov.tr/#/', status: 'complete' });
  context.chrome.tabs.remove = async (tabId) => {
    removedTabs.push(tabId);
  };
  context.chrome.scripting.executeScript = async (payload) => {
    executeCalls.push(payload);
    if (payload.files) return [{ result: undefined }];
    return [{ result: { ok: true, rows: [], httpStatus: 200, transport: 'page-context' } }];
  };

  const result = await context.runRgdhPageFetchInYksTab({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: { 'busbarId.equals': '10933818956', size: 1, page: 0 },
    timeoutMs: 15000
  });

  assert.equal(result.ok, true);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].url, 'https://yks.teias.gov.tr/#/');
  assert.equal(createCalls[0].active, false);
  assert.equal(executeCalls.every((call) => call.target?.tabId === 91), true);
  assert.deepEqual(removedTabs, [91]);
});

test('runRgdhPageFetchInYksTab closes the temporary YKS tab when auth is missing', async () => {
  const context = loadBackground({
    fetch: async () => ({ ok: true, json: async () => [] }),
    setTimeout: (fn) => {
      Promise.resolve().then(fn);
      return 124;
    },
    clearTimeout: () => {}
  });
  const createCalls = [];
  const removedTabs = [];
  context.chrome.tabs.query = async () => [];
  context.chrome.tabs.create = async (payload) => {
    createCalls.push(payload);
    return { id: 92, url: payload.url, status: 'complete' };
  };
  context.chrome.tabs.get = async (tabId) => ({ id: tabId, url: 'https://yks.teias.gov.tr/#/', status: 'complete' });
  context.chrome.tabs.remove = async (tabId) => {
    removedTabs.push(tabId);
  };
  context.chrome.scripting.executeScript = async (payload) => {
    if (payload.files) return [{ result: undefined }];
    return [{ result: { ok: false, error: 'Unauthorized', errorType: 'AUTH_REQUIRED', httpStatus: 401, transport: 'page-context' } }];
  };

  const result = await context.runRgdhPageFetchInYksTab({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: { 'busbarId.equals': '10933818956', size: 1, page: 0 },
    timeoutMs: 15000
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, 'AUTH_REQUIRED');
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].url, 'https://yks.teias.gov.tr/#/');
  assert.equal(createCalls[0].active, false);
  assert.deepEqual(removedTabs, [92]);
});

test('runRgdhPageFetchInYksTab shares one temporary YKS tab across concurrent fetches', async () => {
  const context = loadBackground({
    fetch: async () => ({ ok: true, json: async () => [] }),
    setTimeout: (fn) => {
      Promise.resolve().then(fn);
      return 125;
    },
    clearTimeout: () => {}
  });
  const createCalls = [];
  const removedTabs = [];
  const executeCalls = [];
  context.chrome.tabs.query = async () => [];
  context.chrome.tabs.create = async (payload) => {
    createCalls.push(payload);
    return { id: 93, url: payload.url, status: 'loading' };
  };
  context.chrome.tabs.get = async (tabId) => ({ id: tabId, url: 'https://yks.teias.gov.tr/#/', status: 'complete' });
  context.chrome.tabs.remove = async (tabId) => {
    removedTabs.push(tabId);
  };
  context.chrome.scripting.executeScript = async (payload) => {
    executeCalls.push(payload);
    if (payload.files) return [{ result: undefined }];
    await new Promise((resolve) => setTimeout(resolve, 5));
    return [{ result: { ok: true, rows: [], httpStatus: 200, transport: 'page-context' } }];
  };

  const [first, second] = await Promise.all([
    context.runRgdhPageFetchInYksTab({
      endpoint: '/api/rgdh-wind-busbar-data',
      params: { 'busbarId.equals': '10933818956', size: 1, page: 0 },
      timeoutMs: 15000
    }),
    context.runRgdhPageFetchInYksTab({
      endpoint: '/api/rgdh-wind-busbar-data',
      params: { 'busbarId.equals': '10933818957', size: 1, page: 0 },
      timeoutMs: 15000
    })
  ]);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(createCalls.length, 1);
  assert.equal(executeCalls.every((call) => call.target?.tabId === 93), true);
  assert.deepEqual(removedTabs, [93]);
});

test('rgdhPageFetchMainWorld classifies aborted requests as PAGE_FETCH_TIMEOUT', async () => {
  const abortError = new Error('signal is aborted without reason');
  abortError.name = 'AbortError';
  const context = loadBackground({
    fetch: async () => {
      throw abortError;
    }
  });
  context.localStorage = makeStorage({ authenticationToken: 'slow-yks-token' });
  context.sessionStorage = makeStorage({});

  const result = await context.rgdhPageFetchMainWorld({
    endpoint: '/api/rgdh-wind-busbar-data',
    params: { size: 60 }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, 'PAGE_FETCH_TIMEOUT');
});

test('handleRgdhFetchStart stores a 60 second YKS job budget in the fetch payload', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  let capturedPayload = null;
  context.handleRgdhFetch = async (payload) => {
    capturedPayload = payload;
    return { ok: true, conventionalRows: [], windRows: [], domRows: [], partialErrors: [], logs: [] };
  };

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-04-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957']
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(started.ok, true);
  assert.equal(capturedPayload.jobTimeoutMs, 60000);
});

test('handleRgdhFetchStart caps the YKS job budget at five minutes for auxiliary RES/GES busbars', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  let capturedPayload = null;
  context.handleRgdhFetch = async (payload) => {
    capturedPayload = payload;
    return { ok: true, conventionalRows: [], windRows: [], domRows: [], partialErrors: [], logs: [] };
  };

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818957'],
    selectedBusbar: {
      busbarId: '5052',
      busbarName: 'GEYCEK RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(started.ok, true);
  assert.equal(capturedPayload.jobTimeoutMs, 300000);
});

test('handleRgdhFetchStart creates a continuation job for partial hybrid results', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  context.handleRgdhFetch = async () => ({
    ok: true,
    conventionalRows: [],
    windRows: [{ id: 1, measurementDate: '2026-04-30T21:00:00Z' }],
    domRows: [],
    partialErrors: [{ errorType: 'INCOMPLETE_HYBRID_FETCH', message: '1 hibrit pencere eksik.' }],
    logs: [],
    continuationPayload: {
      sourceType: 'WIND',
      localDate: '2026-05-01',
      endpoint: '/api/rgdh-wind-busbar-data',
      busbarId: '9490732369',
      baseRows: [{ id: 1, measurementDate: '2026-04-30T21:00:00Z' }],
      missingWindows: [{ startUtc: '2026-04-30T22:00:00Z', endUtc: '2026-04-30T23:00:00Z' }]
    }
  });
  context.runRgdhHybridContinuationJob = async (payload) => ({
    ok: true,
    conventionalRows: [],
    windRows: [...payload.baseRows, { id: 2, measurementDate: '2026-04-30T22:00:00Z' }],
    domRows: [],
    partialErrors: [],
    logs: []
  });

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: { busbarId: '6002', busbarName: 'AKYEL-1 RES', sourceType: 'WIND', hasAuxiliarySource: true }
  });
  await new Promise((resolve) => setImmediate(resolve));
  const completed = await context.handleRgdhFetchStatus({ jobId: started.jobId });
  const continuationId = completed.result.continuationJobId;
  await new Promise((resolve) => setImmediate(resolve));
  const continuation = await context.handleRgdhFetchStatus({ jobId: continuationId });

  assert.match(continuationId, /^rgdh-cont-/);
  assert.equal(continuation.status, 'completed');
  assert.equal(continuation.result.rowCounts.windRows, 2);
});

test('handleRgdhFetchStart creates CSV-first continuation when hybrid fast probes return zero rows', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  const calls = [];
  let continuationPayload = null;
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };
  context.runRgdhHybridContinuationJob = async (payload) => {
    continuationPayload = payload;
    return { ok: true, conventionalRows: [], windRows: [], domRows: [], partialErrors: [], logs: [] };
  };

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: { busbarId: '6002', busbarName: 'AKYEL-1 RES', sourceType: 'WIND', hasAuxiliarySource: true },
    windRangeEndUtc: '2026-05-01T06:00:00Z',
    jobTimeoutMs: 300000
  });
  await new Promise((resolve) => setImmediate(resolve));
  const completed = await context.handleRgdhFetchStatus({ jobId: started.jobId });

  assert.match(completed.result.continuationJobId, /^rgdh-cont-/);
  assert.equal(continuationPayload.busbarId, '9490732369');
  assert.equal(continuationPayload.preferCsvFallback, true);
  assert.equal(Array.isArray(continuationPayload.baseRows), true);
  assert.equal(continuationPayload.baseRows.length, 0);
  assert.equal(continuationPayload.missingWindows.length, 9);
  assert.equal(continuationPayload.missingWindows[0].startUtc, '2026-04-30T21:00:00Z');
  assert.equal(continuationPayload.missingWindows.at(-1).endUtc, '2026-05-01T06:00:00Z');

  const windApiCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  assert.equal(windApiCalls.length <= 3, true);
  assert.equal(windApiCalls.every((call) => call.params.page === undefined), true);
  assert.equal(windApiCalls.every((call) => call.timeoutMs <= 15000), true);
});

test('handleRgdhFetchStart exposes continuation progress logs while CSV fallback is still running', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  context.handleRgdhFetch = async () => ({
    ok: true,
    conventionalRows: [],
    windRows: [],
    domRows: [],
    partialErrors: [{ errorType: 'INCOMPLETE_HYBRID_FETCH', message: '24 hibrit pencere eksik.' }],
    logs: [],
    continuationPayload: {
      sourceType: 'WIND',
      localDate: '2026-04-01',
      endpoint: '/api/rgdh-wind-busbar-data',
      busbarId: '10933818954',
      baseRows: [],
      preferCsvFallback: true,
      missingWindows: [{ startUtc: '2026-03-31T21:00:00Z', endUtc: '2026-04-01T21:00:00Z' }]
    }
  });
  context.runRgdhHybridContinuationJob = async () => new Promise(() => {});

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-04-01',
    sourceType: 'WIND',
    busbarInternalIds: ['10933818954'],
    selectedBusbar: { busbarId: '5902', busbarName: 'BAĞLAR RES', sourceType: 'WIND', hasAuxiliarySource: true }
  });
  await new Promise((resolve) => setImmediate(resolve));
  const completed = await context.handleRgdhFetchStatus({ jobId: started.jobId });
  const continuationId = completed.result.continuationJobId;
  const continuation = await context.handleRgdhFetchStatus({ jobId: continuationId });

  assert.equal(continuation.status, 'running');
  assert.equal(continuation.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-csv-fallback'), true);
  assert.equal(continuation.logs.some((log) => log.detail?.preferCsvFallback === true), true);
});

test('hybrid continuation job merges missing rows without duplicates', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  context.runRgdhPageFetchInYksTab = async () => ({
    ok: true,
    rows: [
      { id: 1, measurementDate: '2026-04-30T21:00:00Z' },
      { id: 2, measurementDate: '2026-04-30T22:00:00Z' }
    ],
    totalCount: 2
  });

  const result = await context.runRgdhHybridContinuationJob({
    sourceType: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    baseRows: [{ id: 1, measurementDate: '2026-04-30T21:00:00Z' }],
    missingWindows: [{ startUtc: '2026-04-30T22:00:00Z', endUtc: '2026-04-30T23:00:00Z' }],
    jobTimeoutMs: 420000
  });

  assert.deepEqual(Array.from(result.windRows.map((row) => row.id)), [1, 2]);
  assert.equal(result.partialErrors.length, 0);
});

test('hybrid continuation job with empty base rows prefers CSV fallback without page or size', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.endpoint !== '/api/rgdh-wind-busbar-data-csv') {
      return { ok: false, error: 'hourly continuation should not run before CSV', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return {
      ok: true,
      rows: [{
        id: 15233560268,
        measurementDate: '2026-05-01T05:00:00Z',
        busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES', busbarType: 'WIND' },
        sumPgenActive: 38.51,
        sumPgenReactive: 0.99
      }],
      totalCount: 1
    };
  };

  const result = await context.runRgdhHybridContinuationJob({
    sourceType: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    baseRows: [],
    missingWindows: [
      { startUtc: '2026-04-30T21:00:00Z', endUtc: '2026-04-30T22:00:00Z' },
      { startUtc: '2026-04-30T22:00:00Z', endUtc: '2026-04-30T23:00:00Z' }
    ],
    preferCsvFallback: true,
    allowCsvFallback: true,
    jobTimeoutMs: 420000
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].endpoint, '/api/rgdh-wind-busbar-data-csv');
  assert.equal(calls[0].params['busbarId.equals'], '9490732369');
  assert.equal(calls[0].params.page, undefined);
  assert.equal(calls[0].params.size, undefined);
  assert.equal(result.windRows.length, 1);
  assert.equal(result.partialErrors.length, 0);
  assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-csv-fallback'), true);
});

test('wind CSV fallback parses text/csv responses into wind rows', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  context.runRgdhPageFetchInYksTab = async () => ({
    ok: true,
    rows: [],
    responseContentType: 'text/csv;charset=UTF-8',
    responseText: [
        'Olcum Zamani;Bara Adi;Bara ID;YKS Ic Bara ID;TPYS Bara Gerilim Set;TPYS Bara Gerilim Dusumu;Toplam Unite Pgen Aktif (MW);Toplam Unite Qgen Reaktif (MVAr);DI MVAR Onay Durumu;AI MVAR Onay Durumu',
        '"1 May 2026 08:00:00";"AKYEL-1 RES";6002;9490732369;"158,00";"4,00";"12,50";"1,25";"0";"1"'
      ].join('\n')
  });

  const fetched = await context.fetchRgdhWindBusbarCsvRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    startUtc: '2026-04-30T21:00:00Z',
    endUtc: '2026-05-01T06:00:00Z',
    timeoutMs: 420000,
    deadlineAt: Date.now() + 420000
  });

  assert.equal(fetched.rows.length, 1);
  assert.equal(fetched.rows[0].measurementDate, '2026-05-01T05:00:00Z');
  assert.equal(fetched.rows[0].busbar.id, 9490732369);
  assert.equal(fetched.rows[0].sumPgenActive, 12.5);
  assert.equal(fetched.partialErrors.length, 0);
});

test('RGDH fetch jobs expose status snapshots and keep logs without blocking the popup', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  let resolveFetch;
  context.handleRgdhFetch = async () => {
    await new Promise((resolve) => { resolveFetch = resolve; });
    return { ok: true, conventionalRows: [{ id: 1 }], windRows: [], domRows: [], partialErrors: [], logs: [] };
  };

  const started = await context.handleRgdhFetchStart({ localDate: '2026-04-30', sourceType: 'CONVENTIONAL' });
  const running = await context.handleRgdhFetchStatus({ jobId: started.jobId });
  resolveFetch();
  await new Promise((resolve) => setImmediate(resolve));
  const completed = await context.handleRgdhFetchStatus({ jobId: started.jobId });

  assert.equal(started.ok, true);
  assert.match(started.jobId, /^rgdh-job-/);
  assert.equal(running.status, 'running');
  assert.equal(completed.status, 'completed');
  assert.equal(completed.result.rowCounts.conventionalRows, 1);
});

test('RGDH fetch jobs keep row payloads out of status and expose chunks separately', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => ({}) }) });
  context.handleRgdhFetch = async () => ({
    ok: true,
    conventionalRows: [{ id: 1 }, { id: 2 }],
    windRows: [{ id: 3 }],
    domRows: [],
    partialErrors: [],
    logs: []
  });

  const started = await context.handleRgdhFetchStart({
    localDate: '2026-04-30',
    sourceType: 'CONVENTIONAL',
    busbarInternalIds: ['10933818977']
  });
  await new Promise((resolve) => setImmediate(resolve));
  const completed = await context.handleRgdhFetchStatus({ jobId: started.jobId });
  const chunk = await context.handleRgdhFetchRows({ jobId: started.jobId, kind: 'conventionalRows', offset: 1, limit: 1 });

  assert.equal(completed.status, 'completed');
  assert.equal(completed.result.conventionalRows, undefined);
  assert.equal(completed.result.rowCounts.conventionalRows, 2);
  assert.deepEqual(chunk.rows, [{ id: 2 }]);
  assert.equal(chunk.total, 2);
});
