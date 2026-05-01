const test = require('node:test');
const assert = require('node:assert/strict');

const api = require('../rgdh-api-client.js');

test('buildUtcDayRangeForIstanbul converts local day to UTC boundaries', () => {
  assert.deepEqual(api.buildUtcDayRangeForIstanbul('2026-04-01'), {
    startUtc: '2026-03-31T21:00:00Z',
    endUtc: '2026-04-01T21:00:00Z'
  });
});

test('buildLocalDateRange uses exclusive end date without UTC day drift', () => {
  assert.deepEqual(api.buildLocalDateRange('2026-04-01', ''), ['2026-04-01']);
  assert.deepEqual(api.buildLocalDateRange('2026-04-01', '2026-04-02'), ['2026-04-01']);
  assert.deepEqual(api.buildLocalDateRange('2026-04-01', '2026-04-03'), ['2026-04-01', '2026-04-02']);
  assert.equal(api.buildLocalDateRange('2026-04-01', '2026-04-02').includes('2026-03-31'), false);
});

test('buildRgdhUrl creates allowed endpoint URLs with query params', () => {
  const url = api.buildRgdhUrl('/api/rgdh-wind-busbar-data', {
    'measurementDate.greaterOrEqualThan': '2026-03-31T21:00:00Z',
    'busbarId.equals': 10933818954,
    size: 60,
    sort: 'measurementDate,asc'
  });

  assert.equal(url.origin, 'https://yks.teias.gov.tr');
  assert.equal(url.pathname, '/api/rgdh-wind-busbar-data');
  assert.equal(url.searchParams.get('busbarId.equals'), '10933818954');
});

test('buildRgdhUrl allows the YKS wind CSV range endpoint', () => {
  const url = api.buildRgdhUrl('/api/rgdh-wind-busbar-data-csv', {
    'measurementDate.greaterOrEqualThan': '2026-04-30T21:00:00Z',
    'measurementDate.lessThan': '2026-05-01T17:00:00Z',
    'busbarId.equals': 9490732369,
    sort: 'measurementDate,asc'
  });

  assert.equal(api.RGDH_ENDPOINTS.windCsv, '/api/rgdh-wind-busbar-data-csv');
  assert.equal(url.pathname, '/api/rgdh-wind-busbar-data-csv');
  assert.equal(url.searchParams.get('busbarId.equals'), '9490732369');
  assert.equal(url.searchParams.has('size'), false);
  assert.equal(url.searchParams.has('page'), false);
});

test('buildConventionalDayParams maps selected YKS internal busbar id to busbarId.equals', () => {
  const params = api.buildConventionalDayParams('2026-04-30', {
    busbarInternalId: 10933818977,
    size: 1440
  });

  assert.equal(params['busbarId.equals'], 10933818977);
  assert.equal(params.busbarInternalId, undefined);
  assert.equal(params.size, 1440);
});

test('buildConventionalHourParams scopes selected conventional busbar to one Istanbul-local hour', () => {
  const params = api.buildConventionalHourParams('2026-04-01', 10933818993, 0);

  assert.equal(params['measurementDate.greaterOrEqualThan'], '2026-03-31T21:00:00Z');
  assert.equal(params['measurementDate.lessThan'], '2026-03-31T22:00:00Z');
  assert.equal(params['busbarId.equals'], 10933818993);
  assert.equal(params.size, 60);
  assert.equal(params.sort, 'measurementDate,asc');
});

test('buildWindHourParams scopes selected RES/GES busbar to one Istanbul-local hour', () => {
  const params = api.buildWindHourParams('2026-04-30', 9490732369, 2);

  assert.equal(params['measurementDate.greaterOrEqualThan'], '2026-04-29T23:00:00Z');
  assert.equal(params['measurementDate.lessThan'], '2026-04-30T00:00:00Z');
  assert.equal(params['busbarId.equals'], 9490732369);
  assert.equal(params.size, 60);
  assert.equal(params.page, 0);
});

test('buildWindRangeParams mirrors YKS table request without page parameter', () => {
  const params = api.buildWindRangeParams('2026-04-30T21:00:00Z', '2026-05-01T11:00:00Z', 9490732369, { size: 60 });

  assert.equal(params['measurementDate.greaterOrEqualThan'], '2026-04-30T21:00:00Z');
  assert.equal(params['measurementDate.lessThan'], '2026-05-01T11:00:00Z');
  assert.equal(params['busbarId.equals'], 9490732369);
  assert.equal(params.size, 60);
  assert.equal(params.sort, 'measurementDate,asc');
  assert.equal(Object.hasOwn(params, 'page'), false);
});

test('buildWindChunkParams scopes RES/GES busbar to a two-hour Istanbul-local chunk', () => {
  const params = api.buildWindChunkParams('2026-04-01', 10933818957, 0, 2);

  assert.equal(params['measurementDate.greaterOrEqualThan'], '2026-03-31T21:00:00Z');
  assert.equal(params['measurementDate.lessThan'], '2026-03-31T23:00:00Z');
  assert.equal(params['busbarId.equals'], 10933818957);
  assert.equal(params.size, 60);
  assert.equal(params.sort, 'measurementDate,asc');
  assert.equal(params.spanHours, undefined);
});

test('buildRgdhUrl allows the YKS busbar catalog endpoint for RES/GES discovery', () => {
  const url = api.buildRgdhUrl('/api/busbars', {
    'busbarType.in': 'WIND,SOLAR,HYBRID',
    size: 2000,
    sort: 'busbarName,asc'
  });

  assert.equal(api.RGDH_ENDPOINTS.busbars, '/api/busbars');
  assert.equal(url.pathname, '/api/busbars');
  assert.equal(url.searchParams.get('busbarType.in'), 'WIND,SOLAR,HYBRID');
});

test('buildBusbarCatalogParams scopes RES/GES catalog rows for internal id discovery', () => {
  assert.deepEqual(api.buildBusbarCatalogParams('WIND'), {
    'busbarType.in': 'WIND,SOLAR,HYBRID',
    size: 2000,
    sort: 'busbarName,asc'
  });
});

test('parseLastPageFromLinkHeader extracts the last page number', () => {
  const header = '</rgdh-wind-busbar-data?page=1&size=60>; rel="next",</rgdh-wind-busbar-data?page=23&size=60>; rel="last"';
  assert.equal(api.parseLastPageFromLinkHeader(header), 23);
  assert.equal(api.parseLastPageFromLinkHeader(''), null);
});

test('fetchAllPages follows link pagination and x-total-count fallback', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const page = Number(new URL(url).searchParams.get('page') || 0);
    return {
      ok: true,
      status: 200,
      headers: {
        get(name) {
          if (name.toLowerCase() === 'link' && page === 0) return '</api/rgdh-conventional-busbar-data?page=1&size=2>; rel="last"';
          if (name.toLowerCase() === 'x-total-count') return '4';
          return null;
        }
      },
      json: async () => page === 0 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }, { id: 4 }]
    };
  };

  const rows = await api.fetchAllPages('/api/rgdh-conventional-busbar-data', { size: 2 }, { fetchImpl });

  assert.equal(calls.length, 2);
  assert.deepEqual(rows, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
});

test('classifyHttpError maps auth and upstream statuses without leaking headers', () => {
  assert.equal(api.classifyHttpError(401).errorType, 'AUTH_REQUIRED');
  assert.equal(api.classifyHttpError(403).errorType, 'AUTH_REQUIRED');
  assert.equal(api.classifyHttpError(500).errorType, 'UPSTREAM_ERROR');
});
