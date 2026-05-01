const test = require('node:test');
const assert = require('node:assert/strict');

const diagnostics = require('../rgdh-diagnostics.js');

test('sanitizeDiagnosticEvent redacts auth headers and token-like values', () => {
  const event = diagnostics.sanitizeDiagnosticEvent({
    level: 'error',
    category: 'network',
    route: 'rgdh-conventional-busbar-data',
    url: 'https://yks.teias.gov.tr/api/rgdh-conventional-busbar-data?access_token=secret-token&size=1',
    method: 'GET',
    status: 401,
    requestHeaders: {
      Authorization: 'Bearer secret-yks-token',
      Cookie: 'SESSION=secret-cookie',
      Accept: 'application/json'
    },
    responseHeaders: {
      'x-total-count': '1440',
      authorization: 'Bearer response-token',
      link: '</api/rgdh-conventional-busbar-data?page=1>; rel="last"'
    },
    message: 'Authorization: Bearer secret-yks-token failed'
  });

  const serialized = JSON.stringify(event);
  assert.equal(event.requestHeaders.Authorization, '[redacted]');
  assert.equal(event.requestHeaders.Cookie, '[redacted]');
  assert.equal(event.requestHeaders.Accept, 'application/json');
  assert.equal(event.responseHeaders.authorization, '[redacted]');
  assert.match(event.url, /access_token=\[redacted\]/);
  assert.equal(serialized.includes('secret-yks-token'), false);
  assert.equal(serialized.includes('secret-cookie'), false);
  assert.equal(serialized.includes('response-token'), false);
});

test('diagnostic events are bounded, route-aware, and exportable as Turkish CSV', () => {
  const events = Array.from({ length: 3 }, (_, index) => diagnostics.sanitizeDiagnosticEvent({
    time: `2026-04-30T18:0${index}:00.000Z`,
    level: index === 2 ? 'error' : 'info',
    category: 'console',
    route: diagnostics.routeFromUrl(`https://yks.teias.gov.tr/#/${index === 2 ? 'analogchart-busbar-data' : 'rgdh-wind-busbar-data'}`),
    message: `Satir ${index}; "detay"`
  }));

  const bounded = diagnostics.pushBoundedEvent(events.slice(0, 2), events[2], 2);
  const csv = diagnostics.diagnosticEventsToCsv(bounded);

  assert.deepEqual(bounded.map((event) => event.route), ['analogchart-busbar-data', 'rgdh-wind-busbar-data']);
  assert.match(csv, /^\uFEFFZaman;Seviye;Kategori;Route;Metot;URL;HTTP;Süre\(ms\);Mesaj;Detay/m);
  assert.match(csv, /"Satir 2; ""detay"""/);
  assert.equal(csv.includes('Bearer'), false);
});

test('diagnostic CSV exposes fetch job fields as separate columns', () => {
  const csv = diagnostics.diagnosticEventsToCsv([
    diagnostics.sanitizeDiagnosticEvent({
      time: '2026-05-01T06:28:00.000Z',
      level: 'error',
      category: 'fetch-job',
      route: 'rgdh-monitor',
      message: 'YKS on kontrol zaman asimi',
      detail: {
        jobId: 'rgdh-job-1',
        sourceType: 'WIND',
        displayBusbarId: '6002',
        internalBusbarId: '10933818956',
        hourStart: '2026-04-30T21:00:00Z',
        hourEnd: '2026-04-30T22:00:00Z',
        errorClass: 'PAGE_FETCH_TIMEOUT',
        requestUrl: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?busbarId.equals=10933818956'
      }
    })
  ]);

  assert.match(csv, /Job ID;Kaynak Tipi;Secili Bara ID;YKS Ic Bara ID;Saat Baslangic;Saat Bitis;Chunk Baslangic;Chunk Bitis;Hata Sinifi;Istek URL;API Satir;Metrik Bos Satir/);
  assert.match(csv, /rgdh-job-1;WIND;6002;10933818956;2026-04-30T21:00:00Z;2026-04-30T22:00:00Z;;;PAGE_FETCH_TIMEOUT;/);
});

test('diagnostic CSV exposes background page-fetch route status duration and row count', () => {
  const csv = diagnostics.diagnosticEventsToCsv([
    diagnostics.sanitizeDiagnosticEvent({
      time: '2026-05-01T07:53:22.000Z',
      level: 'success',
      category: 'network',
      route: 'rgdh-wind-busbar-data',
      method: 'GET',
      url: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?busbarId.equals=10933818957&page=0',
      status: 200,
      durationMs: 842,
      message: 'GET /api/rgdh-wind-busbar-data -> 200',
      detail: {
        source: 'WIND',
        internalBusbarId: '10933818957',
        requestUrl: 'https://yks.teias.gov.tr/api/rgdh-wind-busbar-data?busbarId.equals=10933818957&page=0',
        rowCount: 60
      }
    })
  ]);

  assert.match(csv, /network;rgdh-wind-busbar-data;GET;https:\/\/yks\.teias\.gov\.tr\/api\/rgdh-wind-busbar-data\?busbarId\.equals=10933818957&page=0;200;842/);
  assert.match(csv, /;WIND;;10933818957;;;;;;https:\/\/yks\.teias\.gov\.tr\/api\/rgdh-wind-busbar-data\?busbarId\.equals=10933818957&page=0;60;/);
});
