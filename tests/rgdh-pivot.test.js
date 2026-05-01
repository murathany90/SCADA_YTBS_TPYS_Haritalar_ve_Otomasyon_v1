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

test('buildHourlyStatus returns OK for a complete clean hour', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute));
  assert.equal(pivot.buildHourlyStatus(rows), 'OK');
});

test('buildHourlyStatus returns WARN for missing minutes and FAIL for fail ratio above threshold', () => {
  const partialRows = Array.from({ length: 55 }, (_, minute) => makeRow(minute));
  assert.equal(pivot.buildHourlyStatus(partialRows), 'WARN');

  const failedRows = Array.from({ length: 60 }, (_, minute) => makeRow(minute, {
    flags: { voltageOutOfBand: minute < 7, qOutOfLimit: false, missingCriticalValue: false, platformMismatch: false, partialSource: false }
  }));
  assert.equal(pivot.buildHourlyStatus(failedRows), 'FAIL');
});

test('buildDailyPivot creates 24 hour columns and summary counts per busbar', () => {
  const rows = Array.from({ length: 60 }, (_, minute) => makeRow(minute));
  const result = pivot.buildDailyPivot(rows, '2026-04-01');

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].hours.length, 24);
  assert.equal(result.rows[0].hours[0].status, 'OK');
  assert.equal(result.rows[0].hours[1].status, 'NO_DATA');
  assert.equal(result.rows[0].summary.okHours, 1);
  assert.equal(result.rows[0].summary.noDataHours, 23);
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

test('participationClass marks below 80 red, 80 and above green, missing neutral', () => {
  assert.equal(pivot.participationClass({ minuteCount: 60, participationPct: 79.9 }), 'participation-fail');
  assert.equal(pivot.participationClass({ minuteCount: 60, participationPct: 80 }), 'participation-ok');
  assert.equal(pivot.participationClass({ minuteCount: 0, participationPct: 0 }), 'participation-empty');
  assert.equal(pivot.participationClass(null), 'participation-empty');
});
