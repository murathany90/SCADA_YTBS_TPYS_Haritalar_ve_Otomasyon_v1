const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const csv = require('../rgdh-csv.js');

test('parseSemicolonCsv handles BOM, quotes, semicolons and blank rows', () => {
  const text = '\uFEFFAd;Aciklama;Deger\r\n"ACWA; KIRIKKALE";"quoted ""value""";"409,51"\r\n;;\r\n';
  const parsed = csv.parseSemicolonCsv(text);

  assert.deepEqual(parsed.headers, ['Ad', 'Aciklama', 'Deger']);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].Ad, 'ACWA; KIRIKKALE');
  assert.equal(parsed.rows[0].Aciklama, 'quoted "value"');
  assert.equal(parsed.rows[0].Deger, '409,51');
});

test('parseTurkishNumber supports decimal comma and null-like values', () => {
  assert.equal(csv.parseTurkishNumber('409,51'), 409.51);
  assert.equal(csv.parseTurkishNumber('-0,95'), -0.95);
  assert.equal(csv.parseTurkishNumber('1.234,50'), 1234.5);
  assert.equal(csv.parseTurkishNumber(''), null);
  assert.equal(csv.parseTurkishNumber('-'), null);
  assert.equal(csv.parseTurkishNumber('null'), null);
});

test('parseTurkishBoolean supports Turkish AKTIF/PASIF catalog values', () => {
  assert.equal(csv.parseTurkishBoolean('AKTİF'), true);
  assert.equal(csv.parseTurkishBoolean('Aktif'), true);
  assert.equal(csv.parseTurkishBoolean('PASİF'), false);
  assert.equal(csv.parseTurkishBoolean('Pasif'), false);
});

test('parseTurkishDateTime converts Turkish month names to Istanbul local ISO and UTC', () => {
  const parsed = csv.parseTurkishDateTime('1 Nis 2026 10:59:00');

  assert.equal(parsed.localDate, '2026-04-01');
  assert.equal(parsed.localHour, 10);
  assert.equal(parsed.localMinute, 59);
  assert.equal(parsed.measurementDateLocal, '2026-04-01T10:59:00+03:00');
  assert.equal(parsed.measurementDateUtc, '2026-04-01T07:59:00Z');
});

test('detectRgdhCsvType identifies conventional and wind exports', () => {
  const conventional = csv.parseSemicolonCsv([
    'BYTM Adi;Olcum Zamani;Bara ID;Bara Adi;TPYS Set;Canli Bara;Bara Set Onay Durumu',
    '"OA_YTM";"1 Nis 2026 00:00:00";5532;"ACWA";"404,00";"409,51";"1"'
  ].join('\n'));
  const wind = csv.parseSemicolonCsv([
    'Olcum Zamani;Bara Adi;Bara ID;TPYS Bara Gerilim Set;TPYS Bara Gerilim Dusumu;Canli Bara;D.I. MVAR Onay Durumu',
    '"1 Nis 2026 10:59:00";"KURTKAYASI RES";4772;"160,00";"7,00";"160,44";"0"'
  ].join('\n'));

  assert.equal(csv.detectRgdhCsvType(conventional.headers, conventional.rows), 'CONVENTIONAL');
  assert.equal(csv.detectRgdhCsvType(wind.headers, wind.rows), 'WIND');
});

test('normalizeWindCsvRow parses Bara 1/2/3 voltage source columns separately from TPYS Set', () => {
  const parsed = csv.parseSemicolonCsv([
    'Olcum Zamani;Bara Adi;Bara ID;TPYS Bara Gerilim Set;Bara 1(kV);Bara 1 Kalite;Bara 2(kV);Bara 2 Kalite;Bara 3(kV);Bara 3 Kalite;Canli Bara;D.I. MVAR Onay Durumu',
    '"1 May 2026 11:00:00";"GEYCEK RES";5052;"158,00";"159,93";"Actual";"";"";"";"";"159,93";"0"'
  ].join('\n'));

  const row = csv.normalizeWindCsvRow(parsed.rows[0]);

  assert.equal(row.tpysVoltageSet, 158);
  assert.equal(row.busbar1Voltage, 159.93);
  assert.equal(row.busbar1Quality, 'Actual');
  assert.equal(row.busbar2Voltage, null);
  assert.equal(row.busbar2Quality, '');
  assert.equal(row.busbar3Voltage, null);
  assert.equal(row.busbar3Quality, '');
});

test('detectRgdhCsvType identifies busbar unit catalog exports', () => {
  const catalog = csv.parseSemicolonCsv([
    'Bara Tipi;Bara ID;Bara Adi;RGK Tipi;Bara Gerilim Seviyesi;BYTM;TPYS Santral ID;TPYS Santral Ismi;Unite Adi;Kaynak Tipi;Dusuk Ikaz(TEST);Asiri Ikaz(TEST);Nominal Ikaz (Dusuk);Nominal Ikaz (Asiri);Guc Faktoru;Terminal Gerilimi;Unite Aktif mi ?',
    'RES/GES;5052;GEYCEK RES;RGDH;154;OA_YTM;123;GEYCEK;GEYCEK-1;RES;5,1;6,2;7,3;8,4;0,95;31,5;Evet'
  ].join('\n'));

  assert.equal(csv.detectRgdhCsvType(catalog.headers, catalog.rows), 'BUSBAR_UNIT_CATALOG');
  const parsed = csv.parseRgdhCsvText(catalog.headers.join(';') + '\n' + Object.values(catalog.rows[0]).join(';'));
  assert.equal(parsed.type, 'BUSBAR_UNIT_CATALOG');
  assert.equal(parsed.rows[0].busbarId, 5052);
  assert.equal(parsed.rows[0].busbarName, 'GEYCEK RES');
  assert.equal(parsed.rows[0].plantName, 'GEYCEK');
  assert.equal(parsed.rows[0].unitName, 'GEYCEK-1');
  assert.equal(parsed.rows[0].lowExcitationTest, 5.1);
  assert.equal(parsed.rows[0].unitActive, true);
});

test('rgdh_unite_tanimi catalog loads 81 rows and exports in source format', () => {
  const catalogPath = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_.csv');
  const parsed = csv.parseRgdhCsvText(fs.readFileSync(catalogPath, 'utf8'), {
    filename: path.basename(catalogPath)
  });
  const busbars = new Set(parsed.rows.map((row) => `${row.busbarId}|${row.busbarName}`));
  const akyelAux = parsed.rows.find((row) => row.busbarId === 6002 && row.unitName === 'YARDIMCI KAYNAK GES');

  assert.equal(parsed.type, 'BUSBAR_UNIT_CATALOG');
  assert.equal(parsed.rows.length, 81);
  assert.equal(busbars.size, 42);
  assert.equal(akyelAux.unitPnomMw, 39.99);
  assert.equal(akyelAux.nominalLowExcitation, -19.367);

  const exported = csv.buildCatalogExportCsv(parsed.rows);
  const exportedParsed = csv.parseSemicolonCsv(exported.replace(/^\uFEFFsep=;\n/, ''));

  assert.ok(exported.startsWith('\uFEFFsep=;\n'));
  assert.deepEqual(exportedParsed.headers, [
    'Bara Tipi',
    'Bara ID',
    'Bara Adı',
    'RGK Tipi',
    'Bara Gerilim Seviyesi',
    'BYTM',
    'TPYS Santral ID',
    'TPYS Santral İsmi',
    'Bara 1 TA',
    'Bara 1 Setnum',
    'Bara 2 TA',
    'Bara 2 Setnum',
    'Bara 3 TA',
    'Bara 3 Setnum',
    'Ünite Adı',
    'UEVCB Adı',
    'TPYS UEVCB ID',
    'Kaynak Tipi',
    'Aktif Güç TA',
    'Aktif Güç Setnum',
    'Reaktif Güç TA',
    'Reaktif Güç Setnum',
    'Ünite Nominal Güç',
    'Ünite PMKUD',
    'Nominal İkaz (Düşük)',
    'Nominal İkaz (Aşırı)',
    'Ünite Aktif mi ?'
  ]);
  assert.equal(exportedParsed.rows.length, 81);
  assert.equal(exportedParsed.rows.find((row) => row['Bara ID'] === '6002' && row['Ünite Adı'] === 'YARDIMCI KAYNAK GES')['Ünite Nominal Güç'], '39,990');
});

test('extractWindInternalIdFromFilename reads YKS internal busbar id prefix', () => {
  assert.equal(
    csv.extractWindInternalIdFromFilename('10933818957_2026-04-29T00_00_00ZRUZGAR_BARA_VERI.csv'),
    '10933818957'
  );
  assert.equal(csv.extractWindInternalIdFromFilename('_RGDH_2026-04-29T00_00_00ZKONVANSIYONEL_BARA_VERI.csv'), '');
});

test('buildExportCsv emits Excel/TR compatible semicolon CSV', () => {
  const text = csv.buildExportCsv([{
    sourceOrigin: 'API',
    sourceType: 'WIND',
    measurementDateLocal: '2026-04-01T00:00:00+03:00',
    ytm: 'OA_YTM',
    plantName: 'GEYCEK RES \u00c7\u0130\u011eDEM',
    busbarInternalId: 10933818957,
    busbarId: 5052,
    busbarName: 'GEYCEK RES \u00c7\u0130\u011eDEM',
    tpysVoltageSet: 158,
    liveBusbarVoltage: 160.53,
    pgenMw: 12.5,
    qgenMvar: -3.25,
    auxiliaryMw: 1.125,
    approvalStatus: 1
  }]);

  assert.ok(text.startsWith('\uFEFFsep=;\n'));
  assert.match(text, /Ölçüm Zamanı|Ã–lÃ§Ã¼m ZamanÄ±/);
  assert.match(text, /GEYCEK RES \u00c7\u0130\u011eDEM/);
  assert.match(text, /"=""2026-04-01T00:00:00\+03:00"""/);
  assert.match(text, /"=""10933818957"""/);
  assert.match(text, /12,5/);
  assert.match(text, /-3,25/);
});
