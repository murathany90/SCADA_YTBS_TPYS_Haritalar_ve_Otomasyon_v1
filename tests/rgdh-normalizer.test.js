const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const csv = require('../rgdh-csv.js');
const normalizer = require('../rgdh-normalizer.js');

test('normalizeConventionalApiRow maps API fields to the shared model', () => {
  const row = normalizer.normalizeConventionalApiRow({
    measurementDate: '2026-03-31T21:00:00Z',
    busbar: {
      id: 9333006401,
      busbarId: 5532,
      busbarName: 'ACWA KIRIKKALE DGKC',
      plantName: 'ACWA KIRIKKALE',
      busbarType: 'CONVENTIONAL',
      city: 'KIRIKKALE',
      distributionCenter: 'OA_YTM',
      voltageLevel: 400
    },
    mainBusbarVoltage: 409.51,
    tpysNomBusVolt: 404,
    pnom: 927.4,
    sumPmukd: 460,
    minMkud: 217,
    sumPgenActive: 0.42,
    sumPgenReactive: -0.51,
    sumDIMvarLimit: -1.25,
    sumAIMvarLimit: 2.5,
    rgdhOffBoardStatus: 0,
    noObligationStatus: 0,
    busTa1Volt: 409.51,
    busTa1VoltQ0Txt: 'Actual',
    busTa2Volt: 408.75,
    busTa2VoltQ0Txt: 'Calcul',
    busTa3Volt: 407.25,
    busTa3VoltQ0Txt: 'Actual',
    busbarSetToleranceApprove: 1,
    diMvarApprove: 1,
    aiMvarApprove: 0,
    approvalStatus: 1
  });

  assert.equal(row.id, 'CONVENTIONAL:5532:2026-04-01T00:00:00+03:00');
  assert.equal(row.sourceOrigin, 'API');
  assert.equal(row.sourceType, 'CONVENTIONAL');
  assert.equal(row.localDate, '2026-04-01');
  assert.equal(row.localHour, 0);
  assert.equal(row.busbarId, 5532);
  assert.equal(row.liveBusbarVoltage, 409.51);
  assert.equal(row.tpysVoltageSet, 404);
  assert.equal(row.busbar1Voltage, 409.51);
  assert.equal(row.busbar1Quality, 'Actual');
  assert.equal(row.busbar2Voltage, 408.75);
  assert.equal(row.busbar2Quality, 'Calcul');
  assert.equal(row.busbar3Voltage, 407.25);
  assert.equal(row.busbar3Quality, 'Actual');
  assert.equal(row.pgenMw, 0.42);
  assert.equal(row.qgenMvar, -0.51);
  assert.equal(row.diMvarLimit, -1.25);
  assert.equal(row.aiMvarLimit, 2.5);
  assert.equal(row.offBoardStatus, 0);
  assert.equal(row.noObligationStatus, 0);
  assert.equal(row.diMvarApprove, 1);
  assert.equal(row.aiMvarApprove, 0);
  assert.equal(row.approvalStatus, 1);
  assert.equal(row.flags.voltageOutOfBand, false);
});

test('normalizeConventionalUnitApiRow maps unit endpoint fields and direct limits', () => {
  const row = normalizer.normalizeConventionalUnitApiRow({
    id: 15236472311,
    measurementDate: '2026-05-01T21:00:00Z',
    unitB1B2Name: 'CAYIRHAN/15',
    unitB3Name: 'Gen 1',
    rgdhBusId: 2112,
    rgdhConvUnitId: 3204406,
    activePower: 122.13,
    minMkud: 90,
    hourlyMkud: 450,
    activePowerQ0Txt: 'Actual',
    reactivePower: 22.71,
    reactivePowerQ0Txt: 'Actual',
    sumDIMvarLimit: -26,
    sumAIMvarLimit: 34,
    busbar: {
      id: 10933818991,
      busbarType: 'CONVENTIONAL',
      busbarId: 2112,
      busbarName: 'ÇAYIRHAN TES 380',
      plantName: 'ÇAYIRHAN TES',
      distributionCenter: 'OA_YTM'
    }
  });

  assert.equal(row.sourceOrigin, 'API_UNIT');
  assert.equal(row.sourceType, 'CONVENTIONAL_UNIT');
  assert.equal(row.localDate, '2026-05-02');
  assert.equal(row.localHour, 0);
  assert.equal(row.localMinute, 0);
  assert.equal(row.busbarInternalId, 10933818991);
  assert.equal(row.busbarId, 2112);
  assert.equal(row.busbarName, 'ÇAYIRHAN TES 380');
  assert.equal(row.plantName, 'ÇAYIRHAN TES');
  assert.equal(row.unitId, 3204406);
  assert.equal(row.unitName, 'Gen 1');
  assert.equal(row.unitB1B2Name, 'CAYIRHAN/15');
  assert.equal(row.hourlyMkudMw, 450);
  assert.equal(row.minMkudMw, 90);
  assert.equal(row.pgenMw, 122.13);
  assert.equal(row.qgenMvar, 22.71);
  assert.equal(row.activePowerQuality, 'Actual');
  assert.equal(row.reactivePowerQuality, 'Actual');
  assert.equal(row.diMvarLimit, -26);
  assert.equal(row.aiMvarLimit, 34);
});

test('normalizeConventionalUnitApiRow falls back to matched busbar unit excitation limits', () => {
  const row = normalizer.normalizeConventionalUnitApiRow({
    measurementDate: '2026-05-01T21:05:00Z',
    unitB3Name: 'Gen 4',
    rgdhConvUnitId: 3204406,
    activePower: 120,
    reactivePower: 21,
    busbar: {
      id: 10933818991,
      busbarType: 'CONVENTIONAL',
      busbarId: 2112,
      busbarName: 'ÇAYIRHAN TES 380',
      conventionalUnitList: [{
        name: 'ÜNİTE-4',
        uevcbId: 3204406,
        underExcite: -27.5,
        overExcite: 35.5
      }]
    }
  });

  assert.equal(row.diMvarLimit, -27.5);
  assert.equal(row.aiMvarLimit, 35.5);
});

test('normalizeWindApiRow keeps RES/GES as main type and separates auxiliary source fields', () => {
  const row = normalizer.normalizeWindApiRow({
    measurementDate: '2026-04-01T07:59:00Z',
    busbar: {
      id: 10933818954,
      busbarId: 4772,
      busbarName: 'KURTKAYASI RES',
      busbarType: 'WIND',
      auxiliaryWindUnitList: [{
        name: 'YARDIMCI KAYNAK GES',
        uevcbName: 'KURTKAYASI RES',
        uevcbId: 3194585,
        resourceType: 'GES',
        taMw: 'KURTKAYA/34.5/GES-HAT/P',
        setNumMw: '2,1,150132',
        taMvar: 'KURTKAYA/34.5/GES-HAT/Q',
        setNumMvar: '2,1,150133',
        pnomUnit: 5.5,
        speedDrop: 4,
        underExcite: -2.6,
        overExcite: 2.6,
        underExcite2: -2.6,
        overExcite2: 2.6,
        unitActive: true
      }],
      voltageLevel: 154
    },
    tpysBusVoltSet: 160,
    tpysBusVoltDrop: 7,
    mainBusbarVoltage: 160.44,
    busTa1Volt: 160.44,
    busTa1VoltQ0Txt: 'Actual',
    busTa2Volt: 159.8,
    busTa2VoltQ0Txt: 'Actual',
    busTa3Volt: 158.1,
    busTa3VoltQ0Txt: 'Calcul',
    auxiliarySource: 2.5,
    auxiliarySourceReactive: -0.75,
    sumAuxiliaryDIMvarLimit: -1.2,
    sumAuxiliaryAIMvarLimit: 1.3,
    auxiliarySourceApprovalStatus: 1,
    sumPgenActive: 41.93,
    sumPgenReactive: 0.39,
    sumDIMvarLimit: -0.59,
    sumAIMvarLimit: 0.91,
    rgdhOffBoardStatus: 0,
    noObligationStatus: 1,
    diMvarApprove: 1,
    aiMvarApprove: 0,
    approvalStatus: 0
  });

  assert.equal(row.sourceType, 'WIND');
  assert.equal(row.measurementDateLocal, '2026-04-01T10:59:00+03:00');
  assert.equal(row.tpysVoltageDrop, 7);
  assert.equal(row.tpysVoltageSet, 160);
  assert.equal(row.busbar1Voltage, 160.44);
  assert.equal(row.busbar1Quality, 'Actual');
  assert.equal(row.busbar2Voltage, 159.8);
  assert.equal(row.busbar2Quality, 'Actual');
  assert.equal(row.busbar3Voltage, 158.1);
  assert.equal(row.busbar3Quality, 'Calcul');
  assert.equal(row.pgenMw, 41.93);
  assert.equal(row.qgenMvar, 0.39);
  assert.equal(row.diMvarLimit, -0.59);
  assert.equal(row.aiMvarLimit, 0.91);
  assert.equal(row.offBoardStatus, 0);
  assert.equal(row.noObligationStatus, 1);
  assert.equal(row.diMvarApprove, 1);
  assert.equal(row.aiMvarApprove, 0);
  assert.equal(row.approvalStatus, 0);
  assert.equal(row.auxiliaryMw, 2.5);
  assert.equal(row.auxiliaryMvar, -0.75);
  assert.equal(row.auxiliaryDiMvarLimit, -1.2);
  assert.equal(row.auxiliaryAiMvarLimit, 1.3);
  assert.equal(row.auxiliaryApprovalStatus, 1);
  assert.equal(row.hasAuxiliarySource, true);
  assert.equal(row.auxiliaryUnits.length, 1);
  assert.equal(row.auxiliaryUnits[0].unitName, 'YARDIMCI KAYNAK GES');
  assert.equal(row.auxiliaryUnits[0].sourceKind, 'GES');
});

test('normalizeWindApiRow keeps TPYS Set separate from Bara 2 voltage', () => {
  const row = normalizer.normalizeWindApiRow({
    measurementDate: '2026-05-01T08:00:00Z',
    busbar: {
      id: 10933818957,
      busbarId: 5052,
      busbarName: 'GEYCEK RES',
      busbarType: 'WIND'
    },
    tpysBusVoltSet: 158,
    mainBusbarVoltage: 159.93,
    busTa1Volt: 159.93,
    busTa1VoltQ0Txt: 'Actual',
    busTa2Volt: null,
    busTa2VoltQ0Txt: null,
    busTa3Volt: null,
    busTa3VoltQ0Txt: null
  });

  assert.equal(row.tpysVoltageSet, 158);
  assert.equal(row.busbar1Voltage, 159.93);
  assert.equal(row.busbar2Voltage, null);
  assert.equal(row.busbar3Voltage, null);
});

test('normalizeConventionalApiRow keeps source-empty metric rows and marks them for diagnostics', () => {
  const row = normalizer.normalizeConventionalApiRow({
    measurementDate: '2026-03-31T21:00:00Z',
    busbar: {
      id: 10933818993,
      busbarId: 6137,
      busbarName: 'KARAMAN BES',
      plantName: 'KARAMAN BES',
      busbarType: 'CONVENTIONAL',
      distributionCenter: 'OA_YTM'
    },
    tpysNomBusVolt: 158,
    mainBusbarVoltage: 159.89,
    pnom: 40,
    sumPmukd: 10.75,
    sumPgenActive: '',
    sumPgenReactive: '',
    sumDIMvarLimit: '',
    sumAIMvarLimit: '',
    approvalStatus: ''
  });

  assert.equal(row.measurementDateLocal, '2026-04-01T00:00:00+03:00');
  assert.equal(row.busbarId, 6137);
  assert.equal(row.liveBusbarVoltage, 159.89);
  assert.equal(row.pgenMw, null);
  assert.equal(row.qgenMvar, null);
  assert.equal(row.diMvarLimit, null);
  assert.equal(row.aiMvarLimit, null);
  assert.equal(row.approvalStatus, null);
  assert.equal(row.flags.missingCriticalValue, false);
  assert.equal(row.flags.metricFieldsEmptySource, true);
  assert.equal(row.flags.metricDiagnosticCode, 'METRIC_FIELDS_EMPTY_SOURCE');
});

test('normalizeWindApiRow can recover metrics from nested unit data when top-level sums are absent', () => {
  const row = normalizer.normalizeWindApiRow({
    measurementDate: '2026-03-31T21:00:00Z',
    busbar: {
      id: 10933818957,
      busbarId: 5052,
      busbarName: 'GEYCEK RES',
      busbarType: 'WIND',
      windUnitList: [{
        rgdhWindUnitDataList: [{
          measurementDate: '2026-03-31T21:00:00Z',
          sumPgenActive: 12.3,
          sumPgenReactive: -4.5,
          sumDIMvarLimit: -6.7,
          sumAIMvarLimit: 8.9,
          approvalStatus: 1
        }]
      }]
    },
    mainBusbarVoltage: 157.95
  });

  assert.equal(row.pgenMw, 12.3);
  assert.equal(row.qgenMvar, -4.5);
  assert.equal(row.diMvarLimit, -6.7);
  assert.equal(row.aiMvarLimit, 8.9);
  assert.equal(row.approvalStatus, 1);
  assert.equal(row.flags.metricFieldsEmptySource, false);
});

test('compareNormalizedRows reports field-level mismatches with tolerances', () => {
  const apiRow = normalizer.normalizeConventionalApiRow({
    measurementDate: '2026-03-31T21:00:00Z',
    busbar: { busbarId: 5532, busbarName: 'ACWA', busbarType: 'CONVENTIONAL' },
    mainBusbarVoltage: 409.51,
    tpysNomBusVolt: 404,
    sumPgenActive: 0.42,
    sumPgenReactive: -0.51,
    approvalStatus: 1
  });
  const csvRow = { ...apiRow, sourceOrigin: 'CSV', liveBusbarVoltage: 409.7, approvalStatus: 0 };
  const result = normalizer.compareNormalizedRows([apiRow], [csvRow]);

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].fieldDiffs.length, 2);
  assert.deepEqual(result.matches[0].fieldDiffs.map((item) => item.field), ['liveBusbarVoltage', 'approvalStatus']);
});

test('catalog enrichment fills YTM, plant and internal id for wind CSV rows', () => {
  const csvRow = normalizer.normalizeCsvRow({
    sourceOrigin: 'CSV',
    sourceType: 'WIND',
    measurementDateUtc: '2026-04-29T07:00:00Z',
    measurementDateLocal: '2026-04-29T10:00:00+03:00',
    localDate: '2026-04-29',
    localHour: 10,
    localMinute: 0,
    busbarId: 5052,
    busbarName: 'GEYCEK RES',
    pgenMw: 12.5,
    qgenMvar: 5.5,
    busbarInternalId: '10933818957'
  }, 'WIND');
  const catalogRows = [{
    busbarType: 'RES/GES',
    busbarId: 5052,
    busbarName: 'GEYCEK RES',
    rgkType: 'RGDH',
    voltageLevel: 154,
    ytm: 'OA_YTM',
    plantId: 123,
    plantName: 'GEYCEK',
    unitName: 'GEYCEK-1',
    sourceKind: 'RES',
    lowExcitationTest: 5.1,
    highExcitationTest: 6.2,
    nominalLowExcitation: 7.3,
    nominalHighExcitation: 8.4,
    powerFactor: 0.95,
    terminalVoltage: 31.5,
    unitActive: true
  }];

  const enriched = normalizer.enrichRowsWithCatalog([csvRow], catalogRows);

  assert.equal(enriched[0].ytm, 'OA_YTM');
  assert.equal(enriched[0].plantName, 'GEYCEK');
  assert.equal(enriched[0].voltageLevel, 154);
  assert.equal(enriched[0].busbarInternalId, 10933818957);
  assert.equal(enriched[0].catalog.unitName, 'GEYCEK-1');
});

test('buildCatalogBusbarSummaries groups YKS catalog into 42 busbars with unit certificates', () => {
  const catalogFile = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_.csv');
  const parsed = csv.parseRgdhCsvText(fs.readFileSync(catalogFile, 'utf8'), {
    filename: path.basename(catalogFile)
  });

  const summaries = normalizer.buildCatalogBusbarSummaries(parsed.rows);
  const acwa = summaries.find((row) => row.busbarId === 5532);
  const akyel = summaries.find((row) => row.busbarId === 6002);
  const auxiliarySummaries = summaries.filter((row) => row.hasAuxiliarySource);

  assert.equal(parsed.rows.length, 81);
  assert.equal(summaries.length, 42);
  assert.equal(acwa.plantName, 'ACWA KIRIKKALE');
  assert.equal(acwa.unitCount, 3);
  assert.equal(acwa.activeUnitCount, 3);
  assert.equal(acwa.totalPnomMw, 927.4);
  assert.equal(acwa.totalPmkudMw, 374);
  assert.equal(acwa.units.length, 3);
  assert.equal(acwa.busbar1Ta, 'KIRIKDG/380/BB-1/U');
  assert.equal(acwa.busbar1Setnum, '2,1,5628');
  assert.equal(acwa.units[0].unitPnomMw, 295.7);
  assert.equal(acwa.units[0].unitPmkudMw, 127);
  assert.equal(acwa.units[0].unitActive, true);
  assert.equal(akyel.units.some((unit) => unit.unitName === 'YARDIMCI KAYNAK GES' && unit.nominalHighExcitation === 19.367), true);
  assert.equal(auxiliarySummaries.length, 8);
});

test('buildCatalogBusbarSummaries carries v2 YTBS details to summary and units', () => {
  const catalogFile = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_v2.csv');
  const parsed = csv.parseRgdhCsvText(fs.readFileSync(catalogFile, 'utf8'), {
    filename: path.basename(catalogFile)
  });

  const summaries = normalizer.buildCatalogBusbarSummaries(parsed.rows);
  const akyel = summaries.find((row) => row.busbarId === 6002);
  const mainUnit = akyel.units.find((unit) => unit.unitName === 'Ünite 1-12');

  assert.equal(akyel.busbarType, 'WIND');
  assert.equal(akyel.ytbsPlantName, 'AKYEL 1 RES');
  assert.equal(akyel.ytbsSubstationId, 1735);
  assert.equal(akyel.ytbsSubstationName, 'AKYEL 1 RES');
  assert.equal(akyel.latitude, 36.961);
  assert.equal(akyel.longitude, 33.469);
  assert.equal(akyel.ytbsSourceType, 'Rüzgar');
  assert.equal(akyel.secondarySources, 'Güneş');
  assert.equal(akyel.city, 'Karaman');
  assert.equal(akyel.ytbsBusbarType, 'Hibrit- RES/GES');
  assert.equal(akyel.hasSynchronousCondenser, false);
  assert.equal(akyel.hasEuasProtocol, false);
  assert.equal(akyel.platformRgkType, 'HIB_RESGES_GK');
  assert.equal(akyel.rgkTypeDescription, 'RES-1>> 03.01.2013 ve sonrası');
  assert.equal(akyel.isBalancingUnit, false);
  assert.equal(akyel.tpysPlantMkud, 0);
  assert.equal(mainUnit.ytbsPlantName, 'AKYEL 1 RES');
  assert.equal(mainUnit.ytbsBusbarType, 'Hibrit- RES/GES');
  assert.equal(mainUnit.tpysUnitMkud, 0);
});

test('auxiliary catalog overlay adds Karaman and RES/GES helper GES units from YKS definitions', () => {
  const auxPath = path.join(__dirname, '..', 'rgdh-auxiliary-catalog.js');
  const js = fs.readFileSync(auxPath, 'utf8');
  const jsonMatch = js.match(/RGDH_AUXILIARY_CATALOG_DATA=(\[[\s\S]*\]);/);
  assert.ok(jsonMatch, 'RGDH_AUXILIARY_CATALOG_DATA assignment not found');
  const rows = JSON.parse(jsonMatch[1]);
  const summaries = normalizer.buildCatalogBusbarSummaries(rows);
  const auxBusbarIds = [...new Set(rows.map((row) => row.busbarId))].sort((a, b) => Number(a) - Number(b));

  const karaman = summaries.find((row) => row.busbarId === 6137);
  const akyel = summaries.find((row) => row.busbarId === 6002);
  const geycek = summaries.find((row) => row.busbarId === 5052);
  const baglar = summaries.find((row) => row.busbarId === 5902);
  const erciyes = summaries.find((row) => row.busbarId === 6149);
  const mutlu = summaries.find((row) => row.busbarId === 5959);
  const yahyali = summaries.find((row) => row.busbarId === 4572);
  const yahyali2 = summaries.find((row) => row.busbarId === 5192);

  assert.deepEqual(auxBusbarIds, [4572, 5052, 5192, 5902, 5959, 6002, 6137, 6149]);
  assert.equal(karaman.units.some((unit) => unit.unitName === 'YARDIMCI KAYNAK GES' && unit.sourceKind.includes('GES')), true);
  assert.equal(akyel.units.some((unit) => unit.unitName === 'YARDIMCI KAYNAK GES' && unit.unitPnomMw === 39.99), true);
  assert.equal(akyel.hasAuxiliarySource, true);
  assert.equal(geycek.units.some((unit) => unit.unitName === 'YARDIMCI KAYNAK GES' && unit.nominalHighExcitation === 22.585), true);
  assert.equal(geycek.units.some((unit) => unit.activePowerSetnum === '2,1,156380'), true);
  assert.equal(geycek.hasAuxiliarySource, true);
  assert.equal(baglar.units.some((unit) => unit.unitPnomMw === 25.98516), true);
  assert.equal(erciyes.units.some((unit) => unit.activePowerTa === 'ERCIYESR/33/GES-HAT/P'), true);
  assert.equal(mutlu.units.some((unit) => unit.reactivePowerSetnum === '2,1,159417'), true);
  assert.equal(yahyali.units.some((unit) => unit.speedDrop === 7), true);
  assert.equal(yahyali2.units.some((unit) => unit.unitPnomMw === 71.4168), true);
});

test('isZeroDomMeasurementRow identifies synthetic DOM rows that should not enter normalized data', () => {
  assert.equal(normalizer.isZeroDomMeasurementRow({
    sourceOrigin: 'DOM',
    measurementDateLocal: '',
    busbarId: 5532,
    tpysVoltageSet: 0,
    liveBusbarVoltage: 0,
    pgenMw: 0,
    qgenMvar: 0,
    diMvarLimit: 0,
    aiMvarLimit: 0
  }), true);
  assert.equal(normalizer.isZeroDomMeasurementRow({
    sourceOrigin: 'DOM',
    measurementDateLocal: '2026-04-29T00:00:00+03:00',
    busbarId: 5532,
    liveBusbarVoltage: 159.61
  }), false);
});

test('isZeroDomMeasurementRow keeps DOM rows with busbarId and any non-zero value', () => {
  assert.equal(normalizer.isZeroDomMeasurementRow({
    sourceOrigin: 'DOM',
    measurementDateLocal: '',
    busbarId: 5532,
    busbarName: 'ACWA',
    tpysVoltageSet: 0,
    liveBusbarVoltage: 409.51,
    pgenMw: 0,
    qgenMvar: 0,
    diMvarLimit: 0,
    aiMvarLimit: 0
  }), false);
  assert.equal(normalizer.isZeroDomMeasurementRow({
    sourceOrigin: 'DOM',
    measurementDateLocal: '',
    busbarId: null,
    busbarName: '',
    tpysVoltageSet: 0,
    liveBusbarVoltage: 0,
    pgenMw: 0,
    qgenMvar: 0,
    diMvarLimit: 0,
    aiMvarLimit: 0
  }), true);
});
