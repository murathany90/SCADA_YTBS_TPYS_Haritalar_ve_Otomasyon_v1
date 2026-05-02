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

test('parseSemicolonCsv preserves duplicate headers with ordinal suffixes', () => {
  const parsed = csv.parseSemicolonCsv('Bara Tipi;Bara ID;Bara Tipi\nWIND;6002;Hibrit- RES/GES');

  assert.deepEqual(parsed.headers, ['Bara Tipi', 'Bara ID', 'Bara Tipi']);
  assert.equal(parsed.rows[0]['Bara Tipi'], 'WIND');
  assert.equal(parsed.rows[0]['Bara Tipi__2'], 'Hibrit- RES/GES');
});

test('parseTurkishNumber supports decimal comma and null-like values', () => {
  assert.equal(csv.parseTurkishNumber('409,51'), 409.51);
  assert.equal(csv.parseTurkishNumber('-0,95'), -0.95);
  assert.equal(csv.parseTurkishNumber('1.234,50'), 1234.5);
  assert.equal(csv.parseTurkishNumber(''), null);
  assert.equal(csv.parseTurkishNumber('-'), null);
  assert.equal(csv.parseTurkishNumber('null'), null);
});

test('parsers unwrap Excel text formula cells before date and number normalization', () => {
  assert.equal(csv.parseTurkishNumber('="10928268862"'), 10928268862);
  assert.equal(csv.parseTurkishNumber('="158,91"'), 158.91);

  const parsed = csv.parseTurkishDateTime('="2026-04-27T00:00:00+03:00"');
  assert.equal(parsed.localDate, '2026-04-27');
  assert.equal(parsed.localHour, 0);
  assert.equal(parsed.localMinute, 0);
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

test('rgdh_unite_tanimi catalog loads 81 rows and exports in v2 format', () => {
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
    'Ünite Aktif mi ?',
    'YTBS Santral Adı',
    'YTBS Trafo Merkezi ID',
    'YTBS Trafo Merkezi Adı',
    'Enlem',
    'Boylam',
    'KAYNAK TÜRÜ',
    'İkincil Kaynakları',
    'İli',
    'Bara Tipi',
    'Senkron Kompansatör Var mI?',
    'EÜAŞ Protokol Var Mı?',
    'Yan Hizmetler Analiz Platformu RGK Tipi',
    'RGK TİPİ Açıklama',
    'Dengeleme Birimi mi?',
    'TPYS Ünite MKÜD',
    'TPYS Santral MKÜD'
  ]);
  assert.equal(exportedParsed.rows.length, 81);
  assert.equal(exportedParsed.rows.find((row) => row['Bara ID'] === '6002' && row['Ünite Adı'] === 'YARDIMCI KAYNAK GES')['Ünite Nominal Güç'], '39,990');
});

test('rgdh_unite_tanimi_v2 catalog parses new YTBS detail columns and exports in v2 order', () => {
  const catalogPath = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_v2.csv');
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const sourceHeaders = csv.parseSemicolonCsv(raw).headers;
  const parsed = csv.parseRgdhCsvText(raw, { filename: path.basename(catalogPath) });
  const akyel = parsed.rows.find((row) => row.busbarId === 6002 && row.unitName === 'Ünite 1-12');

  assert.equal(parsed.type, 'BUSBAR_UNIT_CATALOG');
  assert.equal(parsed.rows.length, 81);
  assert.equal(akyel.busbarType, 'WIND');
  assert.equal(akyel.ytbsBusbarType, 'Hibrit- RES/GES');
  assert.equal(akyel.ytbsPlantName, 'AKYEL 1 RES');
  assert.equal(akyel.ytbsSubstationId, 1735);
  assert.equal(akyel.ytbsSubstationName, 'AKYEL 1 RES');
  assert.equal(akyel.latitude, 36.961);
  assert.equal(akyel.longitude, 33.469);
  assert.equal(akyel.ytbsSourceType, 'Rüzgar');
  assert.equal(akyel.secondarySources, 'Güneş');
  assert.equal(akyel.city, 'Karaman');
  assert.equal(akyel.hasSynchronousCondenser, false);
  assert.equal(akyel.hasEuasProtocol, false);
  assert.equal(akyel.platformRgkType, 'HIB_RESGES_GK');
  assert.equal(akyel.rgkTypeDescription, 'RES-1>> 03.01.2013 ve sonrası');
  assert.equal(akyel.isBalancingUnit, false);
  assert.equal(akyel.tpysUnitMkud, 0);
  assert.equal(akyel.tpysPlantMkud, 0);

  const exported = csv.buildCatalogExportCsv(parsed.rows);
  const exportedParsed = csv.parseSemicolonCsv(exported.replace(/^\uFEFFsep=;\n/, ''));
  const exportedAkyel = exportedParsed.rows.find((row) => row['Bara ID'] === '6002' && row['Ünite Adı'] === 'Ünite 1-12');

  assert.deepEqual(exportedParsed.headers, sourceHeaders);
  assert.equal(exportedAkyel['Bara Tipi'], 'WIND');
  assert.equal(exportedAkyel['Bara Tipi__2'], 'Hibrit- RES/GES');
  assert.equal(exportedAkyel['YTBS Santral Adı'], 'AKYEL 1 RES');
  assert.equal(exportedAkyel['Enlem'], '36,961');
  assert.equal(exportedAkyel['TPYS Santral MKÜD'], '0');
});

test('EK-C fixtures parse V P Q fields for all minute rows', () => {
  const fixtureDir = path.join(__dirname, '..', 'yks_izleme_modul', 'ek-c_test_csv_datalar');
  const files = fs.readdirSync(fixtureDir).filter((file) => file.toLowerCase().endsWith('.csv'));

  assert.ok(files.length > 0);
  files.forEach((file) => {
    const parsed = csv.parseEkcCsvText(fs.readFileSync(path.join(fixtureDir, file), 'utf8'), { filename: file });
    const rows = parsed.rows || [];
    const finiteCount = (field) => rows.filter((row) => typeof row[field] === 'number' && Number.isFinite(row[field])).length;

    assert.equal(rows.length, 1440, `${file} should include one full day of minute rows`);
    assert.equal(finiteCount('vBara'), rows.length, `${file} should parse EK-C busbar voltage`);
    assert.equal(finiteCount('pTotal'), rows.length, `${file} should parse EK-C active power`);
    assert.equal(finiteCount('qMeas'), rows.length, `${file} should parse EK-C reactive power`);
  });
});

test('parseEkcCsvText repairs blank SAAT header and variant EK-C metric names', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;TEST_BARA',
    'ILGILI BIRIMIN KURULU GUCU (Ptotal):;200',
    'TARIH; ;SIRA_NO;BARA_GERILIMI_KV;BARA_GER_SET_DEG_kV;TOP_AKT_CIKIS_GUCU_MW;TOP_REAKT_CIKIC_GUCU_MVAr',
    '28.04.2026;00:00:00;1;158,485;159;5,271;0,424'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: 'variant-ekc.csv' });
  const row = parsed.rows[0];

  assert.equal(parsed.headers[1], 'SAAT');
  assert.equal(row.localDate, '2026-04-28');
  assert.equal(row.localHour, 0);
  assert.equal(row.localMinute, 0);
  assert.equal(row.vBara, 158.485);
  assert.equal(row.pTotal, 5.271);
  assert.equal(row.qMeas, 0.424);
  assert.ok(parsed.meta.headerWarnings.some((warning) => /SAAT/.test(warning)));
});

test('parseEkcCsvText creates synthetic headers for legacy TARIH-only EK-C templates', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;ESKI_BARA',
    'ILGILI BIRIMIN UNITELERININ NOMINAL AKTIF GUCU(Pnom) VE MINIMUM KARARLI URETIM DUZEYI (MKUD) (MW):;255,6;150',
    'TARIH;;;;;;;;',
    '19.02.2026;00:00:00;1;160,870;160,000;1,209;0,000;1,209;-0,316'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: 'legacy-ekc.csv' });
  const row = parsed.rows[0];

  assert.deepEqual(parsed.headers.slice(0, 7), [
    'TARIH',
    'SAAT',
    'SIRA_NO',
    'BARA_GER_KV',
    'BARA_GER_SET_DEG_KV',
    'TOP_AKT_CIK_GUCU_MW',
    'TOP_REAKT_CIK_GUCU_MVAR'
  ]);
  assert.equal(row.localDate, '2026-02-19');
  assert.equal(row.vBara, 160.87);
  assert.equal(row.pTotal, 1.209);
  assert.equal(row.qMeas, 0);
  assert.ok(parsed.meta.headerWarnings.some((warning) => /sentetik/.test(warning)));
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

test('buildCompareExportCsv emits Turkish Excel compatible comparison rows', () => {
  const text = csv.buildCompareExportCsv([{
    localDate: '2026-04-27',
    hour: 8,
    commonMinutes: 60,
    avgYksV: 406.66,
    avgEkcV: 406.64,
    avgDeltaV: 0.15,
    maxDeltaV: 0.42,
    avgYksP: 578.4,
    avgEkcP: 751.63,
    avgDeltaP: 174.31,
    maxDeltaP: 605.38,
    avgYksQ: -102.46,
    avgEkcQ: -74.21,
    avgDeltaQ: 29.88,
    maxDeltaQ: 111.62,
    avgYksHybridP: 0,
    avgEkcHybridP: 0,
    avgDeltaHybridP: 0,
    maxDeltaHybridP: 0,
    ekcStat: { hourResult: 'SAGLAMADI', passRatio: 0 },
    platformStat: { hourResult: 'SAGLADI', passRatio: 100 }
  }]);

  assert.ok(text.startsWith('\uFEFFsep=;\n'));
  assert.match(text, /Tarih;Saat;Eşleşen DK/);
  assert.match(text, /Gerilim Karşılaştırma - YKS V Ort/);
  assert.match(text, /Aktif Güç Karşılaştırma - Fark dP/);
  assert.match(text, /2026-04-27;08:00;60/);
  assert.match(text, /406,66/);
  assert.match(text, /174,31/);
});
