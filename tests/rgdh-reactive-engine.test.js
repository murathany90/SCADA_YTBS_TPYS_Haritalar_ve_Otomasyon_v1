const test = require('node:test');
const assert = require('node:assert/strict');

const engine = require('../rgdh-reactive-engine.js');

const baseEkc = {
  sourceOrigin: 'EKC',
  sourceType: 'WIND',
  localDate: '2026-04-28',
  localHour: 0,
  localMinute: 0,
  dakikaIndex: 0,
  measurementDateLocal: '2026-04-28T00:00:00+03:00',
  vBara: 158,
  vSet: 155,
  pTotal: 30,
  qMeas: -13,
  pnomMw: 100,
  nominalVoltageKv: 154,
  droopPct: 4
};

test('GES_GK_2020S uses v4 low-production GES curve and directional support', () => {
  const stat = engine.evaluateEkcMinute(baseEkc, { platformRgkType: 'GES_GK_2020S' });

  assert.equal(stat.result, 'SAGLADI');
  assert.equal(stat.rgkMode, 'GES_GK_2020S');
  assert.equal(Number(stat.qTarget.toFixed(2)), -14.16);
  assert.equal(Number(stat.limitHigh.toFixed(2)), -12.75);
  assert.equal(stat.dutySource, 'MAIN_10');
});

test('RES modes support droop, legacy kV, cos phi and fixed MVAR set rules', () => {
  const droop = engine.evaluateEkcMinute({
    ...baseEkc,
    pTotal: 60,
    qMeas: -18,
    vBara: 158,
    vSet: 155
  }, { platformRgkType: 'RES_GK_2013S' });
  assert.equal(droop.result, 'SAGLADI');
  assert.equal(Number(droop.qTarget.toFixed(2)), -16.01);

  const legacyKv = engine.evaluateEkcMinute({
    ...baseEkc,
    pTotal: 20,
    qMeas: -19,
    vBara: 160,
    vSet: 159
  }, {
    platformRgkType: 'RES_GK_2008_2013',
    nominalLowExcitation: -20,
    nominalHighExcitation: 20
  });
  assert.equal(legacyKv.result, 'SAGLADI');
  assert.equal(legacyKv.qTarget, -20);

  const cosPhi = engine.evaluateEkcMinute({
    ...baseEkc,
    pTotal: 60,
    qMeas: -18,
    pfSet: -0.95
  }, { platformRgkType: 'RES_GF_2008_2013' });
  assert.equal(cosPhi.result, 'SAGLADI');
  assert.equal(Number(cosPhi.qTarget.toFixed(2)), -19.72);

  const fixedQ = engine.evaluateEkcMinute({
    ...baseEkc,
    pTotal: 20,
    qMeas: 9.2,
    qSet: 10
  }, { platformRgkType: 'RES_SRG_2008O' });
  assert.equal(fixedQ.result, 'SAGLADI');
  assert.equal(fixedQ.qTarget, 10);
});

test('conventional modes use OAYTM MKUD source and unit excitation totals', () => {
  const context = {
    platformRgkType: 'KON_GB_2003S',
    voltageLevel: 400,
    units: [
      { unitName: 'GT-1', isBalancingUnit: true, tpysUnitMkud: 50, unitPmkudMw: 30, nominalHighExcitation: 20, nominalLowExcitation: -18 },
      { unitName: 'GT-2', isBalancingUnit: false, tpysUnitMkud: 50, unitPmkudMw: 30, nominalHighExcitation: 30, nominalLowExcitation: -25 }
    ]
  };
  const stat = engine.evaluateEkcMinute({
    sourceOrigin: 'EKC',
    sourceType: 'CONVENTIONAL',
    vBara: 393,
    vSet: 403,
    qMeas: 46,
    pTotal: 140,
    pnomMw: 300,
    ekcUnits: [
      { unitName: 'GT-1', pActiveMw: 51 },
      { unitName: 'GT-2', pActiveMw: 29 }
    ]
  }, context);

  assert.equal(stat.result, 'SAGLADI');
  assert.equal(stat.yyDdSource, 'OBLIGATED_UNIT');
  assert.equal(stat.qThreshold, 20);
  assert.equal(stat.limitLow, 18);

  const noObligation = engine.evaluateEkcMinute({
    sourceOrigin: 'EKC',
    sourceType: 'CONVENTIONAL',
    vBara: 393,
    vSet: 403,
    qMeas: 46,
    pTotal: 80,
    pnomMw: 300,
    ekcUnits: [
      { unitName: 'GT-1', pActiveMw: 20 },
      { unitName: 'GT-2', pActiveMw: 29 }
    ]
  }, context);
  assert.equal(noObligation.result, 'YY');
});

test('conventional modes prefer EK-C unit excitation limits when catalog limits are empty', () => {
  const context = {
    platformRgkType: 'KON_GB_2003S',
    voltageLevel: 154,
    units: [
      { unitName: 'Unite-1', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 },
      { unitName: 'Unite-2', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 }
    ]
  };
  const row = {
    sourceOrigin: 'EKC',
    sourceType: 'CONVENTIONAL',
    vBara: 158.491,
    vSet: 156,
    qMeas: -14.332,
    pTotal: 42.41,
    pnomMw: 47,
    ekcUnits: [
      { index: 1, mkudMw: 14.1, pActiveMw: 21.005, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 },
      { index: 2, mkudMw: 14.1, pActiveMw: 21.405, nominalHighExcitation: 14.56, nominalLowExcitation: -7.72 }
    ]
  };

  const stat = engine.evaluateEkcMinute(row, context);
  assert.equal(stat.result, 'SAGLADI');
  assert.equal(stat.qTarget, -15.44);
  assert.equal(Number(stat.limitHigh.toFixed(3)), -13.896);
  assert.equal(stat.reason, 'directional_support_ok');

  const fail = engine.evaluateEkcMinute({ ...row, qMeas: -13.5 }, context);
  assert.equal(fail.result, 'SAGLAMADI');
  assert.equal(fail.reason, 'directional_support_fail');

  const missingLimits = engine.evaluateEkcMinute({
    ...row,
    ekcUnits: row.ekcUnits.map(({ index, mkudMw, pActiveMw }) => ({ index, mkudMw, pActiveMw }))
  }, context);
  assert.equal(missingLimits.result, 'KY');
  assert.equal(missingLimits.reason, 'missing_unit_excitation');
});

test('conventional modes can fall back to EK-C total excitation when all obligated units are covered', () => {
  const stat = engine.evaluateEkcMinute({
    sourceOrigin: 'EKC',
    sourceType: 'CONVENTIONAL',
    vBara: 158.491,
    vSet: 156,
    qMeas: -14.332,
    pTotal: 42.41,
    pnomMw: 47,
    qNomHigh: 29.12,
    qNomLow: -15.44,
    ekcUnits: [
      { index: 1, mkudMw: 14.1, pActiveMw: 21.005 },
      { index: 2, mkudMw: 14.1, pActiveMw: 21.405 }
    ]
  }, {
    platformRgkType: 'KON_GB_2003S',
    voltageLevel: 154,
    units: [
      { unitName: 'Unite-1', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 },
      { unitName: 'Unite-2', isBalancingUnit: true, tpysUnitMkud: 14.1, unitPmkudMw: 14.1 }
    ]
  });

  assert.equal(stat.result, 'SAGLADI');
  assert.equal(stat.qTarget, -15.44);
  assert.equal(stat.qThreshold, 15.44);
});

test('hybrid and SENKOM modes follow duty handoff and set availability rules', () => {
  const hibResGes = engine.evaluateEkcMinute({
    ...baseEkc,
    pMain: 5,
    pAux: 25,
    pnomMainMw: 100,
    pnomAuxMw: 50,
    qMeas: -13
  }, {
    platformRgkType: 'HIB_RESGES_GK',
    ytbsSourceType: 'Ruzgar',
    secondarySources: 'Gunes'
  });
  assert.equal(hibResGes.result, 'SAGLADI');
  assert.equal(hibResGes.dutySource, 'AUX_50');

  const hibKonv = engine.evaluateEkcMinute({
    sourceOrigin: 'EKC',
    sourceType: 'CONVENTIONAL',
    vBara: 154,
    vSet: 155,
    pTotal: 30,
    pAux: 30,
    pnomMw: 200,
    pnomAuxMw: 60,
    qMeas: 12,
    nominalVoltageKv: 154,
    droopPct: 4,
    ekcUnits: [{ unitName: 'GT-1', pActiveMw: 10 }]
  }, {
    platformRgkType: 'HIB_KONV_GB',
    secondarySources: 'Gunes',
    units: [{ unitName: 'GT-1', isBalancingUnit: true, tpysUnitMkud: 50, nominalHighExcitation: 20, nominalLowExcitation: -20 }]
  });
  assert.equal(hibKonv.dutySource, 'AUX_50');
  assert.equal(hibKonv.result, 'SAGLADI');

  const missingSenkom = engine.evaluateEkcMinute({ qMeas: 5 }, { platformRgkType: 'SENKOM' });
  assert.equal(missingSenkom.result, 'KY');

  const senkom = engine.evaluateEkcMinute({ qMeas: 9.2, qSyncReqMvar: 10 }, { platformRgkType: 'SENKOM' });
  assert.equal(senkom.result, 'SAGLADI');
});

test('buildEkcCalculationRows enriches EK-C rows with computed minute statistics', () => {
  const rows = engine.buildEkcCalculationRows([{
    ...baseEkc,
    busbarId: '6083',
    busbarName: 'TEKSIN GES'
  }], new Map([['6083', { busbarId: '6083', platformRgkType: 'GES_GK_2020S', voltageLevel: 154 }]]));

  assert.equal(rows.length, 1);
  assert.equal(rows[0].calculationSource, 'EKC');
  assert.equal(rows[0].rgkMode, 'GES_GK_2020S');
  assert.equal(rows[0].computedMinuteStat.result, 'SAGLADI');
  assert.equal(rows[0].minuteStat, rows[0].computedMinuteStat);
  assert.equal(rows[0].approvalStatus, 1);
});
