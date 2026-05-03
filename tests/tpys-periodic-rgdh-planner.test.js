const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const planner = require('../tpys-periodic-rgdh-planner.js');

function makeDailyCsv(rows) {
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  return [
    'sep=;',
    ['Tarih', 'Bara', 'Tip', 'Kaynak Tipi', ...hours].join(';'),
    ...rows.map((row) => [
      row.date,
      row.bara,
      row.tip || 'CONVENTIONAL',
      row.source || 'EK-C Kontrol',
      ...(row.hours || Array.from({ length: 24 }, () => 'OK'))
    ].join(';'))
  ].join('\n');
}

test('parseRgdhDailyResultCsv parses sep-prefixed daily result CSV and builds 24-hour periodic plan', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    { date: '2026-04-01', bara: 'BAYRAMHACILI 154' }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [{ rowIndex: 0, baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }],
    mappingIndex: { byTpysId: new Map(), byAlias: new Map() }
  });

  assert.equal(parsed.rows.length, 1);
  assert.equal(plan.csvDayCount, 1);
  assert.equal(plan.pageRowCount, 1);
  assert.equal(plan.operations.length, 1);
  assert.equal(plan.operations[0].localDate, '2026-04-01');
  assert.equal(plan.operations[0].tpysBaraAdi, 'BAYRAMHACILI 154');
  assert.equal(Object.keys(plan.operations[0].statusByHour).length, 24);
  assert.equal(plan.operations[0].statusByHour[0], 'OK');
});

test('sample RGDH_GUNLUK.csv plans all rows for its active bara by date', () => {
  const csvPath = path.join(__dirname, '..', 'yks_izleme_modul', 'RGDH_GUNLUK.csv');
  const text = planner.decodeCsvTextFromBuffer(fs.readFileSync(csvPath));
  const parsed = planner.parseRgdhDailyResultCsv(text);
  const csvBara = parsed.rows[0]?.Bara;
  const pageRows = parsed.rows.map((row, index) => ({
    rowIndex: index,
    baraName: csvBara,
    localDate: row.Tarih
  }));

  const plan = planner.buildPeriodicPlanForPage({ csvRows: parsed.rows, pageRows });

  assert.ok(parsed.rows.length >= 29);
  assert.equal(plan.pageBaras.length, 1);
  assert.equal(plan.pageBaras[0], csvBara);
  assert.equal(plan.csvDayCount, parsed.rows.length);
  assert.equal(plan.operations.length, parsed.rows.length);
  assert.equal(plan.missingPageRows.length, 0);
});

test('buildPeriodicPlanForPage reports bara mismatch without operations', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    { date: '2026-04-01', bara: 'BAYRAMHACILI 154' },
    { date: '2026-04-02', bara: 'BAYRAMHACILI 154' }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [
      { rowIndex: 0, baraName: 'ÇAYIRHAN TES 380', localDate: '2026-04-01' },
      { rowIndex: 1, baraName: 'ÇAYIRHAN TES 380', localDate: '2026-04-02' }
    ]
  });

  assert.deepEqual(plan.csvBaras, ['BAYRAMHACILI 154']);
  assert.deepEqual(plan.tpysBaras, ['ÇAYIRHAN TES 380']);
  assert.equal(plan.operations.length, 0);
  assert.equal(plan.filteredOutCsvRows.length, 2);
  assert.equal(plan.matchedBaraName, '-');
  assert.equal(plan.matchedDateCount, 0);
  assert.equal(plan.matchedHourCount, 0);
  assert.match(plan.warning, /CSV barasi TPYS sayfasindaki bara ile eslesmedi/i);
});

test('buildPeriodicPlanForPage rejects percentage daily CSV cells before applying', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    {
      date: '2026-04-01',
      bara: 'BAYRAMHACILI 154',
      hours: ['93,3%', ...Array.from({ length: 23 }, () => 'OK')]
    }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [{ rowIndex: 0, baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }]
  });

  assert.equal(plan.operations.length, 0);
  assert.equal(plan.blockingErrors.length, 1);
  assert.match(plan.blockingErrors[0], /yuzde|percentage/i);
});

test('buildPeriodicPlanForPage filters multi-bara CSV to the active TPYS bara', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    { date: '2026-04-01', bara: 'BAYRAMHACILI 154' },
    { date: '2026-04-01', bara: 'OTHER BARA' }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [{ rowIndex: 0, baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }]
  });

  assert.equal(plan.operations.length, 1);
  assert.equal(plan.operations[0].sourceBara, 'BAYRAMHACILI 154');
  assert.equal(plan.filteredOutCsvRows.length, 1);
  assert.equal(plan.filteredOutCsvRows[0].sourceBara, 'OTHER BARA');
});

test('buildPeriodicPlanForPage prefers EK-C Kontrol duplicate for the same date and bara', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    {
      date: '2026-04-01',
      bara: 'BAYRAMHACILI 154',
      source: 'YKS Kontrol',
      hours: Array.from({ length: 24 }, () => 'X')
    },
    {
      date: '2026-04-01',
      bara: 'BAYRAMHACILI 154',
      source: 'EK-C Kontrol',
      hours: Array.from({ length: 24 }, () => 'OK')
    }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [{ rowIndex: 0, baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }]
  });

  assert.equal(plan.operations.length, 1);
  assert.equal(plan.operations[0].sourceType, 'EK-C Kontrol');
  assert.equal(plan.operations[0].statusByHour[0], 'OK');
});

test('buildPeriodicPlanForPage skips unresolved duplicate rows as ambiguous', () => {
  const parsed = planner.parseRgdhDailyResultCsv(makeDailyCsv([
    { date: '2026-04-01', bara: 'BAYRAMHACILI 154', source: 'EK-C Kontrol' },
    { date: '2026-04-01', bara: 'BAYRAMHACILI 154', source: 'EK-C Kontrol' }
  ]));

  const plan = planner.buildPeriodicPlanForPage({
    csvRows: parsed.rows,
    pageRows: [{ rowIndex: 0, baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }]
  });

  assert.equal(plan.operations.length, 0);
  assert.equal(plan.ambiguousRows.length, 1);
  assert.match(plan.ambiguousRows[0].key, /BAYRAMHACILI/);
});
