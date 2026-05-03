const test = require('node:test');
const assert = require('node:assert/strict');

const pivot = require('../rgdh-pivot.js');

function makeRow(minute, overrides = {}) {
  return {
    sourceType: 'CONVENTIONAL',
    busbarId: 5532,
    busbarName: 'ACWA',
    measurementDateLocal: `2026-04-01T00:${String(minute).padStart(2, '0')}:00+03:00`,
    localDate: '2026-04-01',
    localHour: 0,
    localMinute: minute,
    serviceActive: true,
    offBoardStatus: 0,
    noObligationStatus: 0,
    flags: {
      voltageOutOfBand: false,
      qOutOfLimit: false,
      missingCriticalValue: false,
      platformMismatch: false,
      partialSource: false
    },
    ...overrides
  };
}

test('buildHourlyStatus returns SAGLADI for a complete clean hour', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute));
  assert.equal(pivot.buildHourlyStatus(rows), 'SAGLADI');
});

test('buildHourlyStatus tolerates up to 12 failed minutes and fails above the YKS threshold', () => {
  const partialRows = Array.from({ length: 55 }, (_, minute) => makeRow(minute));
  assert.equal(pivot.buildHourlyStatus(partialRows), 'SAGLADI');

  const failedRows = Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
    flags: { voltageOutOfBand: minute < 13, qOutOfLimit: false, missingCriticalValue: false, platformMismatch: false, partialSource: false }
  }));
  assert.equal(pivot.buildHourlyStatus(failedRows), 'SAGLAMADI');
});

test('buildDailyPivot creates 24 hour columns and summary counts per busbar', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute));
  const result = pivot.buildDailyPivot(rows, '2026-04-01');

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].hours.length, 24);
  assert.equal(result.rows[0].hours[0].status, 'SAGLADI');
  assert.equal(result.rows[0].hours[1].status, 'KY');
  assert.equal(result.rows[0].summary.okHours, 1);
  assert.equal(result.rows[0].summary.noDataHours, 23);
});

test('buildPlatformHourStat treats a completely empty hour as KY', () => {
  const stat = pivot.buildPlatformHourStat([]);

  assert.equal(stat.minuteCount, 0);
  assert.equal(stat.kyCount, 60);
  assert.equal(stat.missingCount, 60);
  assert.equal(stat.failCount, 0);
  assert.equal(stat.hourResult, 'KY');
  assert.equal(stat.passRatio, null);
});

test('buildDailyPivot keeps separate rows per local date for multi-day reports', () => {
  const rows = [
    makeRow(0),
    {
      ...makeRow(0),
      measurementDateLocal: '2026-04-02T00:00:00+03:00',
      localDate: '2026-04-02'
    }
  ];
  const result = pivot.buildDailyPivot(rows);

  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map((row) => row.localDate), ['2026-04-01', '2026-04-02']);
  assert.equal(result.rows.every((row) => row.hours.length === 24), true);
});

test('buildDailyPivot keeps YKS and EK-C control rows separate for the same busbar day', () => {
  const rows = [
    ...Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
      controlSource: 'YKS',
      controlType: 'YKS Kontrol'
    })),
    ...Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
      controlSource: 'EKC',
      controlType: 'EK-C Kontrol'
    }))
  ];
  const result = pivot.buildDailyPivot(rows, '2026-04-01');

  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map((row) => row.controlSource), ['YKS', 'EKC']);
  assert.deepEqual(result.rows.map((row) => row.controlType), ['YKS Kontrol', 'EK-C Kontrol']);
  assert.equal(result.rows.every((row) => row.hours[0].status === 'SAGLADI'), true);
});

test('buildDailyPivot computes hourly averages and participation percentage over 60 minutes', () => {
  const rows = Array.from({ length: 30 }, (_, minute) => makeRow(minute, {
    tpysVoltageSet: 160,
    liveBusbarVoltage: minute % 2 ? 158 : 162,
    pgenMw: 10 + minute,
    qgenMvar: -5,
    approvalStatus: 1
  }));
  const result = pivot.buildDailyPivot(rows, '2026-04-01');
  const hour = result.rows[0].hours[0];

  assert.equal(hour.expectedMinuteCount, 60);
  assert.equal(hour.minuteCount, 30);
  assert.equal(hour.successMinuteCount, 30);
  assert.equal(hour.participationPct, 50);
  assert.equal(hour.setAvg, 160);
  assert.equal(hour.voltageAvg, 160);
  assert.equal(hour.pgenAvg, 24.5);
  assert.equal(hour.qgenAvg, -5);
});

test('buildPlatformHourStat classifies missing minutes as KY without adding them to failed minutes', () => {
  const rows = [
    ...Array.from({ length: 45 }, (_, minute) => makeRow(minute, { approvalStatus: 1 })),
    ...Array.from({ length: 10 }, (_, minute) => makeRow(45 + minute, { noObligationStatus: 1, approvalStatus: 0 })),
    ...Array.from({ length: 3 }, (_, minute) => makeRow(55 + minute, { offBoardStatus: 1, approvalStatus: 0 })),
    makeRow(58, { approvalStatus: 0, auxiliaryApprovalStatus: 1 })
  ];

  const stat = pivot.buildPlatformHourStat(rows);

  assert.equal(stat.minuteCount, 59);
  assert.equal(stat.passCount, 46);
  assert.equal(stat.yyCount, 10);
  assert.equal(stat.ddCount, 3);
  assert.equal(stat.kyCount, 1);
  assert.equal(stat.missingCount, 1);
  assert.equal(stat.failCount, 0);
  assert.equal(stat.hourResult, 'SAGLADI');
  assert.equal(stat.participationPct, 98.333);
});

test('buildDailyPivot gives approvalStatus priority when counting successful minutes', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
    approvalStatus: minute < 45 ? 1 : 0,
    flags: {
      voltageOutOfBand: false,
      qOutOfLimit: true,
      missingCriticalValue: false,
      platformMismatch: false,
      partialSource: false
    }
  }));
  const hour = pivot.buildDailyPivot(rows, '2026-04-01').rows[0].hours[0];

  assert.equal(hour.successMinuteCount, 45);
  assert.equal(hour.participationPct, 75);
});

test('buildDailyPivot does not mark SK active for DD hours with zero active power', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
    busbarId: '2108',
    busbarName: 'SARIYAR 154',
    hasSynchronousCondenser: true,
    offBoardStatus: 1,
    approvalStatus: 1,
    pgenMw: 0,
    qgenMvar: -59.151,
    pnomMw: 160,
    nominalHighExcitation: 60,
    nominalLowExcitation: -60
  }));
  const hour = pivot.buildDailyPivot(rows, '2026-04-01').rows[0].hours[0];

  assert.equal(hour.hourResult, 'DD');
  assert.equal(hour.ddCount, 60);
  assert.equal(hour.pgenAvg, 0);
  assert.equal(hour.synchronousCondenserCandidate, true);
  assert.equal(hour.synchronousCondenserActive, false);
  assert.equal(hour.synchronousCondenserMinuteCount, 0);
  assert.equal(hour.synchronousCondenserSuccessMinuteCount, 0);
  assert.equal(hour.synchronousCondenserResult, '');
});

test('participationClass follows reactive hour verdicts and distinguishes neutral decisions', () => {
  assert.equal(pivot.participationClass({ hourResult: 'SAGLAMADI', passRatio: 79.9 }), 'participation-fail');
  assert.equal(pivot.participationClass({ hourResult: 'SAGLADI', passRatio: 80 }), 'participation-ok');
  assert.equal(pivot.participationClass({ hourResult: 'DD', passRatio: null }), 'participation-dd');
  assert.equal(pivot.participationClass({ hourResult: 'YY', passRatio: null }), 'participation-yy');
  assert.equal(pivot.participationClass({ hourResult: 'KY', passRatio: null }), 'participation-ky');
  assert.equal(pivot.participationClass(null), 'participation-empty');
});
