const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const backgroundPath = path.join(__dirname, '..', 'background.js');
const backgroundCode = fs.readFileSync(backgroundPath, 'utf8');
const rgdhApiClientPath = path.join(__dirname, '..', 'rgdh-api-client.js');
const rgdhApiClientCode = fs.readFileSync(rgdhApiClientPath, 'utf8');
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
    /YKS ic ID bulunamadi/
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

test('handleRgdhFetch retries auxiliary RES/GES with display busbar id when resolved internal id times out', async () => {
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

  assert.equal(internalCalls.length, 25);
  assert.equal(displayCalls.length, 25);
  assert.equal(internalCalls.some((call) => call.params['measurementDate.greaterOrEqualThan'] === '2026-03-31T21:00:00Z' && call.params['measurementDate.lessThan'] === '2026-04-01T21:00:00Z'), true);
  assert.equal(result.windRows.length, 24);
  assert.deepEqual(Array.from(result.busbarInternalIds), ['5052']);
  assert.equal(result.partialErrors.length, 1);
  assert.equal(result.partialErrors[0].errorType, 'YKS_HOURLY_TIMEOUT');
  assert.equal(result.partialErrors[0].candidateBusbarId, '10933818957');
  assert.equal(result.logs.some((log) => log.detail?.candidateBusbarId === '5052' && log.detail?.hybridAuxiliary === true), true);
});

test('handleRgdhFetch uses hybrid defaults on the first auxiliary RES/GES candidate and probes data-bearing hours first', async () => {
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
  const internalHourlyCalls = internalCalls.filter((call) => !(
    call.params['measurementDate.greaterOrEqualThan'] === '2026-04-30T21:00:00Z'
    && call.params['measurementDate.lessThan'] === '2026-05-01T21:00:00Z'
  ));
  const displayCalls = windCalls.filter((call) => String(call.params['busbarId.equals']) === '5052');

  assert.equal(result.ok, true);
  assert.equal(internalCalls.length, 25);
  assert.equal(internalHourlyCalls.length, 24);
  assert.equal(internalHourlyCalls.every((call) => call.timeoutMs === 20000), true);
  assert.equal(result.logs.some((log) => log.detail?.candidateBusbarId === '10933818957' && log.detail?.concurrency === 2), true);
  assert.equal(displayCalls[0].params['measurementDate.greaterOrEqualThan'], '2026-05-01T08:00:00Z');
  assert.equal(displayCalls[0].timeoutMs, 20000);
});

test('handleRgdhFetch tries full-day fallback for an auxiliary RES/GES internal id before display id fallback', async () => {
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

  assert.equal(result.windRows.length, 1);
  assert.equal(calls.some((call) => String(call.params['busbarId.equals']) === '5052'), false);
  assert.equal(result.logs.some((log) => /tam gun sayfali fallback/i.test(log.message)), true);
});

test('handleRgdhFetch summarizes failed candidate ids for auxiliary RES/GES when all candidates time out', async () => {
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
  assert.equal(calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data').length, 28);
  assert.equal(result.partialErrors.length, 1);
  assert.equal(result.partialErrors[0].errorType, 'YKS_HOURLY_TIMEOUT');
  assert.deepEqual(Array.from(result.partialErrors[0].candidateBusbarIds), ['10933818957', '5052']);
  assert.match(result.partialErrors[0].message, /tum aday RES\/GES busbar id degerleri basarisiz/i);
  assert.equal(result.logs.some((log) => log.detail?.displayBusbarId === '5052' && log.detail?.hybridAuxiliary === true), true);
});

test('runRgdhPageFetchInYksTab injects YKS instrumentation and records page-fetch diagnostics', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const executeCalls = [];
  context.chrome.tabs.query = async () => [{ id: 77, url: 'https://yks.teias.gov.tr/#/rgdh-wind-busbar-data' }];
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
  const diagnostics = await context.handleRgdhDiagnosticList({ limit: 5 });

  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(executeCalls[0].files), ['yks-rgdh-instrumentation.js']);
  assert.equal(executeCalls[0].world, 'MAIN');
  assert.equal(typeof executeCalls[1].func, 'function');
  assert.equal(diagnostics.events[0].category, 'network');
  assert.equal(diagnostics.events[0].route, 'rgdh-wind-busbar-data');
  assert.equal(diagnostics.events[0].status, 200);
  assert.equal(diagnostics.events[0].detail.rowCount, '1');
  assert.match(diagnostics.events[0].detail.requestUrl, /rgdh-wind-busbar-data/);
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

test('handleRgdhFetchStart extends the YKS job budget for auxiliary RES/GES busbars', async () => {
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
  assert.equal(capturedPayload.jobTimeoutMs, 180000);
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
