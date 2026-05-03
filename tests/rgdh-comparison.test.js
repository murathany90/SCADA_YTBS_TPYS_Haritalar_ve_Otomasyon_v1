const test = require('node:test');
const assert = require('node:assert/strict');

const comparison = require('../rgdh-comparison.js');
const pivot = require('../rgdh-pivot.js');
const engine = require('../rgdh-reactive-engine.js');

test('bindEkcRowsToSelectedBusbar preserves EK-C identity and attaches selected YKS busbar', () => {
  const rows = comparison.bindEkcRowsToSelectedBusbar([{
    fileName: 'KURTKAYASI_2026-04-28.csv',
    plantName: 'KURTKAYASI_RES',
    busbarName: 'KURTKAYASI_RES',
    sourceType: 'WIND',
    localDate: '2026-04-28'
  }], {
    busbarId: '4772',
    busbarInternalId: '10933818954',
    busbarName: 'KURTKAYASI RES',
    plantName: 'KURTKAYASI RES',
    sourceType: 'WIND',
    ytm: 'OA_YTM'
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].busbarId, '4772');
  assert.equal(rows[0].busbarInternalId, '10933818954');
  assert.equal(rows[0].busbarName, 'KURTKAYASI RES');
  assert.equal(rows[0].plantName, 'KURTKAYASI RES');
  assert.equal(rows[0].sourceType, 'WIND');
  assert.equal(rows[0].ytm, 'OA_YTM');
  assert.equal(rows[0].ekcOriginalName, 'KURTKAYASI_RES');
  assert.equal(rows[0].ekcOriginalBusbarName, 'KURTKAYASI_RES');
  assert.equal(rows[0].ekcOriginalPlantName, 'KURTKAYASI_RES');
  assert.equal(rows[0].ekcBoundToYks, true);
});

test('bindEkcRowsToCatalog attaches EK-C rows to a unique normalized catalog busbar', () => {
  const result = comparison.bindEkcRowsToCatalog([{
    fileName: 'BAYMINA.csv',
    plantName: 'BAYMINA_154',
    busbarName: 'BAYMINA_154',
    sourceType: 'CONVENTIONAL',
    localDate: '2026-03-27'
  }], [{
    busbarId: 2111,
    busbarInternalId: 10933818988,
    busbarName: 'BAYMİNA 154',
    plantName: 'BAYMİNA 154',
    busbarType: 'CONVENTIONAL',
    sourceType: 'CONVENTIONAL',
    ytm: 'OA_YTM'
  }]);

  assert.equal(result.status, 'matched');
  assert.equal(result.target.busbarId, 2111);
  assert.equal(result.rows[0].busbarId, '2111');
  assert.equal(result.rows[0].busbarInternalId, 10933818988);
  assert.equal(result.rows[0].busbarName, 'BAYMİNA 154');
  assert.equal(result.rows[0].plantName, 'BAYMİNA 154');
  assert.equal(result.rows[0].ekcOriginalName, 'BAYMINA_154');
  assert.equal(result.rows[0].ekcEntityKey, 'catalog:2111');
  assert.equal(result.rows[0].ekcBindingStatus, 'matched');
});

test('bindEkcRowsToCatalog avoids unsafe substring matches and reports ambiguous candidates', () => {
  const rows = [{
    fileName: 'YAHYALI.csv',
    plantName: 'YAHYALI_RES',
    busbarName: 'YAHYALI_RES',
    sourceType: 'WIND',
    localDate: '2026-03-27'
  }];
  const catalog = [
    { busbarId: 4572, busbarName: 'YAHYALI RES', plantName: 'YAHYALI RES (SE)', busbarType: 'WIND' },
    { busbarId: 5192, busbarName: 'YAHYALI-2 RES', plantName: 'YAHYALI RES(BAK)', busbarType: 'WIND' }
  ];

  const result = comparison.bindEkcRowsToCatalog(rows, catalog);

  assert.equal(result.status, 'matched');
  assert.equal(result.target.busbarId, 4572);
  assert.equal(result.rows[0].busbarId, '4572');

  const ambiguous = comparison.bindEkcRowsToCatalog([{
    fileName: 'KARAPINAR.csv',
    plantName: 'KARAPINAR_YEKA-1_GES',
    busbarName: 'KARAPINAR_YEKA-1_GES',
    sourceType: 'WIND',
    localDate: '2026-03-27'
  }], [
    { busbarId: 6084, busbarName: 'KARAPINAR YEKA-1 GES 154', plantName: 'KARAPINAR YEKA-1 GES', busbarType: 'WIND' },
    { busbarId: 6085, busbarName: 'KARAPINAR YEKA-1 GES 400', plantName: 'KARAPINAR YEKA-1 GES', busbarType: 'WIND' }
  ]);

  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.rows[0].busbarId, null);
  assert.equal(ambiguous.rows[0].ekcBindingStatus, 'ambiguous');
  assert.match(ambiguous.reason, /Birden fazla/);
});

test('bindEkcRowsToCatalog falls back to selected busbar for a single unmatched EK-C file', () => {
  const result = comparison.bindEkcRowsToCatalog([{
    fileName: 'unknown.csv',
    plantName: 'BILINMEYEN',
    busbarName: 'BILINMEYEN',
    sourceType: 'WIND',
    localDate: '2026-03-27'
  }], [], {
    fallbackTarget: {
      busbarId: '4772',
      busbarName: 'KURTKAYASI RES',
      plantName: 'KURTKAYASI RES',
      sourceType: 'WIND'
    }
  });

  assert.equal(result.status, 'fallback_selected');
  assert.equal(result.rows[0].busbarId, '4772');
  assert.equal(result.rows[0].ekcBindingStatus, 'fallback_selected');
});

test('dedupeEkcFileLoadGroups rejects repeated source and entity dates after first file', () => {
  const result = comparison.dedupeEkcFileLoadGroups([
    {
      fileName: 'first.csv',
      rows: [{ sourceType: 'WIND', busbarId: '4772', ekcEntityKey: 'catalog:4772', localDate: '2026-03-27' }]
    },
    {
      fileName: 'repeat.csv',
      rows: [{ sourceType: 'WIND', busbarId: '4772', ekcEntityKey: 'catalog:4772', localDate: '2026-03-27' }]
    },
    {
      fileName: 'other.csv',
      rows: [{ sourceType: 'WIND', busbarId: '5052', ekcEntityKey: 'catalog:5052', localDate: '2026-03-27' }]
    }
  ]);

  assert.deepEqual(result.acceptedGroups.map((group) => group.fileName), ['first.csv', 'other.csv']);
  assert.deepEqual(result.duplicateGroups.map((group) => group.fileName), ['repeat.csv']);
  assert.equal(result.rows.length, 2);
});

test('getEkcDateFilterUpdate switches filters to a single EK-C date or an exclusive multi-day range', () => {
  const single = comparison.getEkcDateFilterUpdate([
    { localDate: '2026-04-28' },
    { localDate: '2026-04-28' }
  ], { date: '2026-04-27', endDate: '' });

  assert.deepEqual(single, {
    changed: true,
    dates: ['2026-04-28'],
    date: '2026-04-28',
    endDate: ''
  });

  const multi = comparison.getEkcDateFilterUpdate([
    { localDate: '2026-04-28' },
    { localDate: '2026-04-30' },
    { localDate: '2026-04-29' }
  ], { date: '2026-04-27', endDate: '' });

  assert.deepEqual(multi, {
    changed: true,
    dates: ['2026-04-28', '2026-04-29', '2026-04-30'],
    date: '2026-04-28',
    endDate: '2026-05-01'
  });

  assert.deepEqual(
    comparison.getEkcDateFilterUpdate([{ localDate: '2026-04-28' }], { date: '2026-04-28', endDate: '2026-04-29' }),
    { changed: false, dates: ['2026-04-28'] }
  );
});

test('buildEkcPlatformComparison matches by busbar date minute and fills deltas', () => {
  const ekcRows = [{
    busbarId: '4772',
    busbarName: 'KURTKAYASI RES',
    sourceType: 'WIND',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    hour: 0,
    dakikaIndex: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    vBara: 158.5,
    vSet: 159,
    pTotal: 5.5,
    qMeas: 1.25,
    minuteStat: { result: 'SAGLADI', limitLow: 1, limitHigh: 2 }
  }];
  const platformRows = [{
    busbarId: '4772',
    busbarName: 'KURTKAYASI RES',
    sourceType: 'WIND',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    liveBusbarVoltage: 158,
    tpysVoltageSet: 159,
    pgenMw: 5,
    qgenMvar: 1,
    approvalStatus: 1
  }];

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });

  assert.equal(result.summary.both, 1);
  assert.equal(result.summary.ekcOnly, 0);
  assert.equal(result.summary.platformOnly, 0);
  assert.equal(result.diagnosis, '');
  assert.equal(result.rows[0].joinState, 'both');
  assert.equal(result.rows[0].deltaV, 0.5);
  assert.equal(result.rows[0].deltaP, 0.5);
  assert.equal(result.rows[0].deltaQ, 0.25);
  assert.equal(result.hourRows[0].commonMinutes, 1);
  assert.equal(result.hourRows[0].ekcStat.hourResult, 'YY');
  assert.equal(result.hourRows[0].platformStat.hourResult, 'YY');
});

test('buildEkcPlatformComparison hour rows expose separate EK-C and YKS result counts for table summaries', () => {
  const ekcRows = [
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 1, measurementDateLocal: '2026-04-28T00:01:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLADI' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 2, measurementDateLocal: '2026-04-28T00:02:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLAMADI' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 3, measurementDateLocal: '2026-04-28T00:03:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'DD' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 4, measurementDateLocal: '2026-04-28T00:04:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'YY' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 5, measurementDateLocal: '2026-04-28T00:05:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'KY' } }
  ];
  const platformRows = [
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 1, measurementDateLocal: '2026-04-28T00:01:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 2, measurementDateLocal: '2026-04-28T00:02:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 0 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 3, measurementDateLocal: '2026-04-28T00:03:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, offBoardStatus: 1, noObligationStatus: 0, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 4, measurementDateLocal: '2026-04-28T00:04:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, offBoardStatus: 0, noObligationStatus: 1, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 5, measurementDateLocal: '2026-04-28T00:05:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, platformResult: 'KY' }
  ];

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });
  const hourRow = result.hourRows[0];

  assert.deepEqual({
    passCount: hourRow.ekcStat.passCount,
    failCount: hourRow.ekcStat.failCount,
    ddCount: hourRow.ekcStat.ddCount,
    yyCount: hourRow.ekcStat.yyCount,
    kyCount: hourRow.ekcStat.kyCount
  }, { passCount: 1, failCount: 1, ddCount: 1, yyCount: 1, kyCount: 56 });
  assert.deepEqual({
    passCount: hourRow.platformStat.passCount,
    failCount: hourRow.platformStat.failCount,
    ddCount: hourRow.platformStat.ddCount,
    yyCount: hourRow.platformStat.yyCount,
    kyCount: hourRow.platformStat.kyCount
  }, { passCount: 1, failCount: 1, ddCount: 1, yyCount: 1, kyCount: 56 });
});

test('buildEkcPlatformComparison carries SK and droop hour metadata', () => {
  const ekcRows = Array.from({ length: 5 }, (_, minute) => ({
    busbarId: '2110',
    localDate: '2026-05-01',
    localHour: 4,
    localMinute: minute,
    dakikaIndex: 240 + minute,
    measurementDateLocal: `2026-05-01T04:${String(minute).padStart(2, '0')}:00+03:00`,
    pTotal: 2,
    qMeas: 19,
    droopPct: 3,
    hasSynchronousCondenser: true,
    nominalHighExcitation: 20,
    nominalLowExcitation: -20,
    minuteStat: { result: 'SAGLADI' }
  }));
  const platformRows = Array.from({ length: 5 }, (_, minute) => ({
    busbarId: '2110',
    localDate: '2026-05-01',
    localHour: 4,
    localMinute: minute,
    measurementDateLocal: `2026-05-01T04:${String(minute).padStart(2, '0')}:00+03:00`,
    pgenMw: 2,
    qgenMvar: -19,
    droopPct: 4,
    hasSynchronousCondenser: true,
    nominalHighExcitation: 20,
    nominalLowExcitation: -20,
    approvalStatus: 1
  }));

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });
  const hourRow = result.hourRows[0];

  assert.equal(hourRow.avgYksDroopPct, 4);
  assert.equal(hourRow.avgEkcDroopPct, 3);
  assert.equal(hourRow.platformStat.synchronousCondenserActive, true);
  assert.equal(hourRow.ekcStat.synchronousCondenserActive, true);
  assert.equal(hourRow.synchronousCondenserActive, true);
  assert.equal(hourRow.platformStat.synchronousCondenserSuccessMinuteCount, 5);
  assert.equal(hourRow.ekcStat.synchronousCondenserSuccessMinuteCount, 5);
});

test('buildEkcPlatformComparison fallback SK rule requires absolute active power above 1 MW', () => {
  const platformRows = [
    ...Array.from({ length: 5 }, (_, minute) => ({
      busbarId: '2110',
      localDate: '2026-05-01',
      localHour: 4,
      localMinute: minute,
      measurementDateLocal: `2026-05-01T04:${String(minute).padStart(2, '0')}:00+03:00`,
      pgenMw: 1,
      qgenMvar: 19,
      hasSynchronousCondenser: true,
      nominalHighExcitation: 20,
      nominalLowExcitation: -20,
      approvalStatus: 1
    })),
    ...Array.from({ length: 5 }, (_, minute) => ({
      busbarId: '2110',
      localDate: '2026-05-01',
      localHour: 5,
      localMinute: minute,
      measurementDateLocal: `2026-05-01T05:${String(minute).padStart(2, '0')}:00+03:00`,
      pgenMw: -2,
      qgenMvar: 19,
      hasSynchronousCondenser: true,
      nominalHighExcitation: 20,
      nominalLowExcitation: -20,
      approvalStatus: 1
    }))
  ];

  const result = comparison.buildEkcPlatformComparison(platformRows, []);

  assert.equal(result.hourRows[0].platformStat.synchronousCondenserActive, false);
  assert.equal(result.hourRows[0].platformStat.synchronousCondenserMinuteCount, 0);
  assert.equal(result.hourRows[1].platformStat.synchronousCondenserActive, true);
  assert.equal(result.hourRows[1].platformStat.synchronousCondenserMinuteCount, 5);
});

test('buildEkcPlatformComparison does not count DD YY KY as active liability minutes', () => {
  const ekcRows = [
    ...Array.from({ length: 10 }, (_, minute) => ({
      busbarId: '4772',
      localDate: '2026-04-28',
      localHour: 5,
      localMinute: minute,
      dakikaIndex: 300 + minute,
      measurementDateLocal: `2026-04-28T05:${String(minute).padStart(2, '0')}:00+03:00`,
      pTotal: 5,
      qMeas: 1,
      minuteStat: { result: 'SAGLADI' }
    })),
    ...Array.from({ length: 45 }, (_, idx) => {
      const minute = idx + 10;
      return {
        busbarId: '4772',
        localDate: '2026-04-28',
        localHour: 5,
        localMinute: minute,
        dakikaIndex: 300 + minute,
        measurementDateLocal: `2026-04-28T05:${String(minute).padStart(2, '0')}:00+03:00`,
        pTotal: 0,
        qMeas: 0,
        minuteStat: { result: 'DD' }
      };
    })
  ];

  const result = comparison.buildEkcPlatformComparison([], ekcRows, { pivot });

  assert.equal(result.hourRows[0].ekcStat.activeLiabilityMinutes, 10);
  assert.equal(result.hourRows[0].ekcStat.hourResult, 'YY');
});

test('Bayramhacili EK-C comparison hour uses header excitation limits instead of KY', () => {
  const catalogContext = {
    platformRgkType: 'KON_GB_2003S',
    voltageLevel: 154,
    units: [
      { unitName: 'Unite-1', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 },
      { unitName: 'Unite-2', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 }
    ]
  };
  const ekcRows = Array.from({ length: 60 }, (_, minute) => {
    const qMeas = minute < 55 ? -14.332 : -13.5;
    const row = {
      busbarId: '2110',
      busbarName: 'BAYRAMHACILI 154',
      sourceType: 'CONVENTIONAL',
      localDate: '2026-05-01',
      localHour: 3,
      localMinute: minute,
      dakikaIndex: 180 + minute,
      measurementDateLocal: `2026-05-01T03:${String(minute).padStart(2, '0')}:00+03:00`,
      vBara: 158.491,
      vSet: 156,
      pTotal: 42.41,
      qMeas,
      pnomMw: 47,
      ekcUnits: [
        { index: 1, mkudMw: 14.1, pActiveMw: 21.005, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 },
        { index: 2, mkudMw: 14.1, pActiveMw: 21.405, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 }
      ]
    };
    return {
      ...row,
      minuteStat: engine.evaluateEkcMinute(row, catalogContext)
    };
  });
  const platformRows = Array.from({ length: 60 }, (_, minute) => ({
    busbarId: '2110',
    busbarName: 'BAYRAMHACILI 154',
    sourceType: 'CONVENTIONAL',
    localDate: '2026-05-01',
    localHour: 3,
    localMinute: minute,
    measurementDateLocal: `2026-05-01T03:${String(minute).padStart(2, '0')}:00+03:00`,
    liveBusbarVoltage: 158.4,
    pgenMw: 42,
    qgenMvar: -14.5,
    approvalStatus: minute < 55 ? 1 : 0
  }));

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });
  const hourRow = result.hourRows[0];

  assert.equal(hourRow.commonMinutes, 60);
  assert.equal(hourRow.ekcStat.hourResult, 'SAGLADI');
  assert.equal(hourRow.ekcStat.passCount, 55);
  assert.equal(hourRow.ekcStat.failCount, 5);
  assert.equal(hourRow.ekcStat.kyCount, 0);
  assert.equal(hourRow.ekcStat.passRatio, 91.667);
});

test('buildEkcPlatformComparison sorts hour rows by date and numeric hour', () => {
  const ekcRows = [
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, dakikaIndex: 0, measurementDateLocal: '2026-04-28T00:00:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLADI' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 10, dakikaIndex: 600, measurementDateLocal: '2026-04-28T10:00:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLADI' } },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 2, dakikaIndex: 120, measurementDateLocal: '2026-04-28T02:00:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLADI' } },
    { busbarId: '4772', localDate: '2026-04-29', localHour: 1, dakikaIndex: 60, measurementDateLocal: '2026-04-29T01:00:00+03:00', vBara: 158, pTotal: 5, qMeas: 1, minuteStat: { result: 'SAGLADI' } }
  ];
  const platformRows = [
    { busbarId: '4772', localDate: '2026-04-28', localHour: 0, localMinute: 0, measurementDateLocal: '2026-04-28T00:00:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 10, localMinute: 0, measurementDateLocal: '2026-04-28T10:00:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-28', localHour: 2, localMinute: 0, measurementDateLocal: '2026-04-28T02:00:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 1 },
    { busbarId: '4772', localDate: '2026-04-29', localHour: 1, localMinute: 0, measurementDateLocal: '2026-04-29T01:00:00+03:00', liveBusbarVoltage: 158, pgenMw: 5, qgenMvar: 1, approvalStatus: 1 }
  ];

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });

  assert.deepEqual(
    result.hourRows.map((row) => `${row.localDate} ${String(row.hour).padStart(2, '0')}`),
    ['2026-04-28 00', '2026-04-28 02', '2026-04-28 10', '2026-04-29 01']
  );
});

test('buildEkcPlatformComparison hour rows use absolute average deltas and expose K.Y percentages', () => {
  const ekcRows = [
    {
      busbarId: '4772',
      localDate: '2026-04-28',
      localHour: 0,
      dakikaIndex: 0,
      measurementDateLocal: '2026-04-28T00:00:00+03:00',
      vBara: 105,
      pTotal: 11,
      qMeas: -5,
      pAux: 1,
      minuteStat: { result: 'SAGLADI' }
    },
    {
      busbarId: '4772',
      localDate: '2026-04-28',
      localHour: 0,
      dakikaIndex: 1,
      measurementDateLocal: '2026-04-28T00:01:00+03:00',
      vBara: 95,
      pTotal: 8,
      qMeas: 3,
      auxiliaryMw: 10,
      minuteStat: { result: 'SAGLAMADI' }
    }
  ];
  const platformRows = [
    {
      busbarId: '4772',
      localDate: '2026-04-28',
      localHour: 0,
      localMinute: 0,
      measurementDateLocal: '2026-04-28T00:00:00+03:00',
      liveBusbarVoltage: 100,
      pgenMw: 10,
      qgenMvar: -1,
      auxiliaryMw: 3,
      approvalStatus: 1
    },
    {
      busbarId: '4772',
      localDate: '2026-04-28',
      localHour: 0,
      localMinute: 1,
      measurementDateLocal: '2026-04-28T00:01:00+03:00',
      liveBusbarVoltage: 100,
      pgenMw: 10,
      qgenMvar: 1,
      auxiliaryMw: 7,
      approvalStatus: 0
    }
  ];

  const result = comparison.buildEkcPlatformComparison(platformRows, ekcRows, { pivot });
  const hourRow = result.hourRows[0];

  assert.equal(hourRow.avgDeltaV, 5);
  assert.equal(hourRow.avgDeltaP, 1.5);
  assert.equal(hourRow.avgDeltaQ, 3);
  assert.equal(hourRow.maxDeltaV, 5);
  assert.equal(hourRow.maxDeltaP, 2);
  assert.equal(hourRow.maxDeltaQ, 4);
  assert.equal(hourRow.avgYksHybridP, 5);
  assert.equal(hourRow.avgEkcHybridP, 5.5);
  assert.equal(hourRow.avgDeltaHybridP, 2.5);
  assert.equal(hourRow.maxDeltaHybridP, 3);
  assert.equal(hourRow.ekcStat.hourResult, 'YY');
  assert.equal(hourRow.platformStat.hourResult, 'YY');
  assert.equal(hourRow.ekcStat.passRatio, null);
  assert.equal(hourRow.platformStat.passRatio, null);
});

test('buildEkcPlatformComparison reports no YKS data without turning missing side into KY', () => {
  const result = comparison.buildEkcPlatformComparison([], [{
    busbarId: '4772',
    busbarName: 'KURTKAYASI RES',
    sourceType: 'WIND',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    hour: 0,
    dakikaIndex: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    vBara: 158.5,
    pTotal: 5.5,
    qMeas: 1.25,
    minuteStat: { result: 'SAGLADI' }
  }], { pivot });

  assert.equal(result.summary.both, 0);
  assert.equal(result.summary.ekcOnly, 1);
  assert.equal(result.diagnosis, 'Ortak dakika bulunamadi: EK-C tarihi icin YKS SCADA verisi yok');
  assert.equal(result.hourRows[0].ekcStat.hourResult, 'YY');
  assert.equal(result.hourRows[0].platformStat, null);
});

test('buildEkcPlatformComparison separates missing selected busbar from parser field problems', () => {
  const noBinding = comparison.buildEkcPlatformComparison([{
    busbarId: '4772',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    liveBusbarVoltage: 158,
    pgenMw: 5,
    qgenMvar: 1,
    approvalStatus: 1
  }], [{
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    dakikaIndex: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    vBara: 158,
    pTotal: 5,
    qMeas: 1,
    minuteStat: { result: 'SAGLADI' }
  }], { pivot, bindingTargetMissing: true });

  assert.equal(noBinding.diagnosis, 'Ortak dakika bulunamadi: secili YKS SCADA barasi yok veya EK-C icin otomatik bara eslesmesi yapilamadi');

  const parserMissing = comparison.buildEkcPlatformComparison([{
    busbarId: '4772',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 1,
    measurementDateLocal: '2026-04-28T00:01:00+03:00',
    liveBusbarVoltage: 158,
    pgenMw: 5,
    qgenMvar: 1,
    approvalStatus: 1
  }], [{
    busbarId: '4772',
    localDate: '2026-04-28',
    localHour: 0,
    localMinute: 2,
    dakikaIndex: 2,
    measurementDateLocal: '2026-04-28T00:02:00+03:00',
    vBara: null,
    pTotal: 5,
    qMeas: 1,
    minuteStat: { result: 'SAGLADI' }
  }], { pivot });

  assert.equal(parserMissing.diagnosis, 'Ortak dakika bulunamadi: EK-C V/P/Q alanlari eksik veya okunamadi');
});
