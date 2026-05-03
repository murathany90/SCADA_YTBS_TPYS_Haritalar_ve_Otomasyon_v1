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
  const exportedParsed = csv.parseSemicolonCsv(exported.replace(/^\uFEFFsep=;\r?\n/, ''));

  assert.ok(exported.startsWith('\uFEFFsep=;\r\n'));
  assert.doesNotMatch(exported, /Ã|Ä|Å/);
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
  const exportedParsed = csv.parseSemicolonCsv(exported.replace(/^\uFEFFsep=;\r?\n/, ''));
  const exportedAkyel = exportedParsed.rows.find((row) => row['Bara ID'] === '6002' && row['Ünite Adı'] === 'Ünite 1-12');

  assert.doesNotMatch(exported, /Ã|Ä|Å/);
  assert.deepEqual(exportedParsed.headers, sourceHeaders);
  assert.equal(exportedAkyel['Bara Tipi'], 'WIND');
  assert.equal(exportedAkyel['Bara Tipi__2'], 'Hibrit- RES/GES');
  assert.equal(exportedAkyel['YTBS Santral Adı'], 'AKYEL 1 RES');
  assert.equal(exportedAkyel['Enlem'], '36,961');
  assert.equal(exportedAkyel['TPYS Santral MKÜD'], '0');
});

test('rgdh_unite_tanimi_v2 catalog carries updated conventional nominal excitation values', () => {
  const catalogPath = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_v2.csv');
  const parsed = csv.parseRgdhCsvText(fs.readFileSync(catalogPath, 'utf8'), {
    filename: path.basename(catalogPath)
  });

  const conventionalRows = parsed.rows.filter((row) => row.busbarType === 'CONVENTIONAL');
  const acwaGt2 = conventionalRows.find((row) => row.busbarId === 5532 && row.unitName === 'GT-2');

  assert.ok(conventionalRows.length > 0, 'v2 catalog should include conventional rows');
  assert.ok(acwaGt2, 'updated v2 catalog should include ACWA GT-2');
  assert.equal(acwaGt2.nominalLowExcitation, -97.19);
  assert.equal(acwaGt2.nominalHighExcitation, 183.26);
  assert.equal(
    conventionalRows.filter((row) => row.nominalLowExcitation !== null && row.nominalHighExcitation !== null).length,
    conventionalRows.length
  );
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

test('parseEkcCsvText extracts conventional EK-C busbar name from BARANIN ADI metadata', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;BAYMINA_154',
    'ILGILI BIRIMIN UNITELERININ NOMINAL AKTIF GUCU(Pnom):;255,6;255,6;322',
    'ILGILI BIRIMIN UNITELERININ ASIRI VE DUSUK ZORUNLU MVAR DEGERLERI (MVAR):;158,41;-84,01;158,41;-84,01;199,56;-105,84',
    'TARIH;SAAT;SIRA_NO;BARA_GER_kV;BARA_GER_SET_DEG_kV;TOP_REAKT_CIK_GUCU_MVAr;UEVCB_1_BIRIM_MKUD_MW;UNI_1_GEN_TER_AKT_CIK_GUCU_MW',
    '27.03.2026;00:00:00;1;154,521;160;1,568;440;-0,351'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: '_2026-03-27.1774647163546.csv' });
  const row = parsed.rows[0];

  assert.equal(parsed.meta.plantName, 'BAYMINA_154');
  assert.equal(parsed.meta.busbarName, 'BAYMINA_154');
  assert.equal(row.plantName, 'BAYMINA_154');
  assert.equal(row.busbarName, 'BAYMINA_154');
});

test('parseEkcCsvText extracts EK-C RGK mode input fields without deciding final result', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;HIBRIT_BARA',
    'ANA KAYNAK KURULU GUCU:;100',
    'YARDIMCI KAYNAK KURULU GUCU:;50',
    'NOMINAL GERILIM:;154',
    'GERILIM DUSUMU:;4',
    'TARIH;SAAT;SIRA_NO;BARA_GER_KV;BARA_GER_SET_DEG_KV;TOP_AKT_CIK_GUCU_MW;TOP_REAKT_CIK_GUCU_MVAr;TOP_ANAKAYNAK_AKT_CIK_GUCU_MW;TOP_YRDKAYNAK_AKT_CIK_GUCU_MW;GUC_FKTR_SET_COSFI;REAKT_GUC_SET_DEG_MVAr;SENKRON_KOMP_SET_MVAR;UEVCB_1_BIRIM_MKUD_MW;UNI_1_GEN_TER_AKT_CIK_GUCU_MW',
    '28.04.2026;00:00:00;1;158;155;30;-13;5;25;-0,95;10;8;50;51'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: 'rgk-inputs.csv' });
  const row = parsed.rows[0];

  assert.equal(parsed.meta.pnomMainMw, 100);
  assert.equal(parsed.meta.pnomAuxMw, 50);
  assert.equal(parsed.meta.nominalVoltageKv, 154);
  assert.equal(parsed.meta.droopPct, 4);
  assert.equal(row.pMain, 5);
  assert.equal(row.pAux, 25);
  assert.equal(row.pfSet, -0.95);
  assert.equal(row.qSet, 10);
  assert.equal(row.qSyncReqMvar, 8);
  assert.deepEqual(row.ekcUnits, [{ index: 1, slotIndex: 1, sourceUnitNo: 1, pActiveMw: 51 }]);
  assert.equal(row.minuteStat.result, 'KY');
  assert.match(row.minuteStat.warnings.join(' '), /RGK modu/);
});

test('parseEkcCsvText carries conventional EK-C excitation limits from header to row units', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;BAYRAMHACILI_154',
    'ILGILI BIRIMIN UNITELERININ NOMINAL AKTIF GUCU(Pnom):;23,5;23,5',
    'ILGILI BIRIMIN UNITELERININ ASIRI VE DUSUK ZORUNLU MVAR DEGERLERI (MVAR):;14,56;-7,72;14,56;-7,72',
    'TARIH;SAAT;SIRA_NO;BARA_GER_kV;BARA_GER_SET_DEG_kV;TOP_REAKT_CIK_GUCU_MVAr;UNI_1_BIRIM_MKUD;UNI_2_BIRIM_MKUD;UNI_1_GEN_TER_AKT_CIK_GUCU_MW;UNI_2_GEN_TER_AKT_CIK_GUCU_MW',
    '01.05.2026;03:00:00;181;158,491;156,000;-14,332;14,100;14,100;21,005;21,405'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: 'bayramhacili-ekc.csv' });
  const row = parsed.rows[0];

  assert.equal(parsed.meta.qNomHigh, 29.12);
  assert.equal(parsed.meta.qNomLow, -15.44);
  assert.deepEqual(parsed.meta.unitExcitationLimits, [
    { index: 1, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 },
    { index: 2, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 }
  ]);
  assert.equal(row.qNomHigh, 29.12);
  assert.equal(row.qNomLow, -15.44);
  assert.deepEqual(row.ekcUnits, [
    {
      index: 1,
      slotIndex: 1,
      sourceUnitNo: 1,
      pActiveMw: 21.005,
      pnomMw: 23.5,
      nominalHighExcitation: 14.56,
      nominalLowExcitation: -7.72,
      highExcitationTest: 14.56,
      lowExcitationTest: -7.72
    },
    {
      index: 2,
      slotIndex: 2,
      sourceUnitNo: 2,
      pActiveMw: 21.405,
      pnomMw: 23.5,
      nominalHighExcitation: 14.56,
      nominalLowExcitation: -7.72,
      highExcitationTest: 14.56,
      lowExcitationTest: -7.72
    }
  ]);
});

test('parseEkcCsvText maps ACWA-style conventional unit slots by active power column order and ignores UEVÇB MKUD', () => {
  const text = [
    'GERILIM REFERANS DEGERI ILETILEN BARANIN ADI:;ACWA_KIRIKKALE_DGKC',
    'ILGILI BIRIMIN UNITELERININ NOMINAL AKTIF GUCU(Pnom):;295,7;295,7;336',
    'ILGILI BIRIMIN UNITELERININ ASIRI VE DUSUK ZORUNLU MVAR DEGERLERI (MVAR):;183,258;-97,192;183,258;-97,192;208,234;-110,438',
    'TARIH;SAAT;SIRA_NO;BARA_GER_kV;BARA_GER_SET_DEG_kV;TOP_REAKT_CIK_GUCU_MVAr;UEVCB_1_BIRIM_MKUD_MW;UNI_11_GEN_TER_AKT_CIK_GUCU_MW;UNI_12_GEN_TER_AKT_CIK_GUCU_MW;UNI_10_GEN_TER_AKT_CIK_GUCU_MW',
    '13.04.2026;18:00:00;1081;410,759;412;11,989;445;208,810;128,631;127,224'
  ].join('\n');

  const parsed = csv.parseEkcCsvText(text, { filename: 'ACWA_KIRIKKALE_DGKC_13.04.2026.csv' });
  const row = parsed.rows[0];

  assert.deepEqual(row.ekcUnits, [
    {
      index: 1,
      slotIndex: 1,
      sourceUnitNo: 11,
      pActiveMw: 208.81,
      pnomMw: 295.7,
      nominalHighExcitation: 183.258,
      nominalLowExcitation: -97.192,
      highExcitationTest: 183.258,
      lowExcitationTest: -97.192
    },
    {
      index: 2,
      slotIndex: 2,
      sourceUnitNo: 12,
      pActiveMw: 128.631,
      pnomMw: 295.7,
      nominalHighExcitation: 183.258,
      nominalLowExcitation: -97.192,
      highExcitationTest: 183.258,
      lowExcitationTest: -97.192
    },
    {
      index: 3,
      slotIndex: 3,
      sourceUnitNo: 10,
      pActiveMw: 127.224,
      pnomMw: 336,
      nominalHighExcitation: 208.234,
      nominalLowExcitation: -110.438,
      highExcitationTest: 208.234,
      lowExcitationTest: -110.438
    }
  ]);
  assert.equal(row.ekcUnits.some((unit) => Object.prototype.hasOwnProperty.call(unit, 'mkudMw')), false);
  assert.equal(row.effectiveMkudMw, null);
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

  assert.ok(text.startsWith('\uFEFFsep=;\r\n'));
  assert.match(text, /Ölçüm Zamanı/);
  assert.match(text, /YKS İç Bara ID/);
  assert.match(text, /GEYCEK RES \u00c7\u0130\u011eDEM/);
  assert.match(text, /"=""2026-04-01T00:00:00\+03:00"""/);
  assert.match(text, /"=""10933818957"""/);
  assert.match(text, /12,5/);
  assert.match(text, /-3,25/);
  assert.doesNotMatch(text, /Ã|Ä|Å/);
});

test('buildDailyPivotExportCsv exports hourly percentages in percent mode', () => {
  const text = csv.buildDailyPivotExportCsv([{
    localDate: '2026-04-20',
    busbarName: 'ÇAYIRHAN TES 380',
    sourceType: 'CONVENTIONAL',
    controlSource: 'EKC',
    hours: [
      { hour: 0, participationPct: 93.3, hourResult: 'SAGLADI' },
      { hour: 1, participationPct: 61.666, hourResult: 'SAGLAMADI' },
      { hour: 2, hourResult: 'DD' }
    ]
  }], { displayMode: 'percent' });

  assert.ok(text.startsWith('\uFEFFsep=;\r\n'));
  assert.match(text, /Tarih;Bara;Tip;Kaynak Tipi;00;01;02/);
  assert.match(text, /2026-04-20;ÇAYIRHAN TES 380;CONVENTIONAL;EK-C Kontrol;93,30%;61,67%;DD/);
  assert.doesNotMatch(text, /Ãƒ|Ã„|Ã…/);
});

test('buildDailyPivotExportCsv exports hourly result codes in result mode', () => {
  const text = csv.buildDailyPivotExportCsv([{
    localDate: '2026-04-20',
    busbarName: 'AKSU ÇAMLICA RES',
    sourceType: 'WIND',
    controlSource: 'YKS',
    hours: [
      { hour: 0, participationPct: 100, hourResult: 'SAGLADI' },
      { hour: 1, participationPct: 40, hourResult: 'SAGLAMADI' },
      { hour: 2, hourResult: 'DD' },
      { hour: 3, hourResult: 'YY' },
      { hour: 4, hourResult: 'KY' }
    ]
  }], { displayMode: 'result' });

  assert.ok(text.startsWith('\uFEFFsep=;\r\n'));
  assert.match(text, /2026-04-20;AKSU ÇAMLICA RES;WIND;YKS Kontrol;OK;X;DD;YY;KY/);
  assert.doesNotMatch(text, /Ãƒ|Ã„|Ã…/);
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

  assert.ok(text.startsWith('\uFEFFsep=;\r\n'));
  assert.match(text, /Tarih;Saat;Eşleşen DK/);
  assert.match(text, /Ek-C Değerlendirme/);
  assert.match(text, /Gerilim Karşılaştırma - YKS V Ort/);
  assert.match(text, /Aktif Güç Karşılaştırma - Fark dP/);
  assert.match(text, /2026-04-27;08:00;60/);
  assert.match(text, /406,66/);
  assert.match(text, /174,31/);
  assert.doesNotMatch(text, /Ã|Ä|Å/);
});

test('CSV download helpers normalize CRLF and create UTF-16LE bytes with BOM', () => {
  const text = csv.normalizeCsvLineEndings('\uFEFFsep=;\nÖlçüm Zamanı;Değer\n2026-04-01;12,5');
  const bytes = csv.encodeCsvForExcel(text);

  assert.equal(text, '\uFEFFsep=;\r\nÖlçüm Zamanı;Değer\r\n2026-04-01;12,5');
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xfe);
  assert.equal(Buffer.from(bytes.slice(2, 10)).toString('hex'), Buffer.from('sep=', 'utf16le').toString('hex'));
});

test('CSV fallback detects mojibake and strips Turkish characters for ASCII fallback', () => {
  const broken = 'YKS Ä°Ã§ Bara ID;Ã–lÃ§Ã¼m ZamanÄ±;DeÄŸer\r\n"Ä‡Ä±kÄ±ÅŸ";12,5';
  const fallback = csv.prepareCsvDownloadText(broken);

  assert.equal(csv.hasCsvMojibake(broken), true);
  assert.equal(fallback.usedAsciiFallback, true);
  assert.match(fallback.text, /YKS Ic Bara ID;Olcum Zamani;Deger/);
  assert.match(fallback.text, /"cikis";12,5/);
  assert.doesNotMatch(fallback.text, /[^\x00-\x7F]/);
});
