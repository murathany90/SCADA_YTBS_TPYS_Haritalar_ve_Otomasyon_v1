const assert = require('node:assert/strict');
const pivot = require('../rgdh-pivot.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('derivePlatformMinuteResult follows YKS verdict precedence', () => {
  assert.equal(pivot.derivePlatformMinuteResult(null).result, 'KY');
  assert.equal(pivot.derivePlatformMinuteResult({ devreDurumu: 0, yukumlulukDurumu: 1, mainApproved: 1 }).result, 'DD');
  assert.equal(pivot.derivePlatformMinuteResult({ devreDurumu: 1, yukumlulukDurumu: 0, mainApproved: 1 }).result, 'YY');
  assert.equal(pivot.derivePlatformMinuteResult({ devreDurumu: 1, yukumlulukDurumu: 1, mainApproved: 1 }).result, 'SAGLADI');
  assert.equal(pivot.derivePlatformMinuteResult({ devreDurumu: 1, yukumlulukDurumu: 1, mainApproved: 0, auxApproved: 1 }).result, 'SAGLADI');
  assert.equal(pivot.derivePlatformMinuteResult({ devreDurumu: 1, yukumlulukDurumu: 1, mainApproved: 0, auxApproved: 0 }).result, 'SAGLAMADI');
});

test('derivePlatformMinuteResult supports normalized extension field names', () => {
  assert.equal(pivot.derivePlatformMinuteResult({ offBoardStatus: 1, noObligationStatus: 0, approvalStatus: 1 }).result, 'DD');
  assert.equal(pivot.derivePlatformMinuteResult({ offBoardStatus: 0, noObligationStatus: 1, approvalStatus: 1 }).result, 'YY');
  assert.equal(pivot.derivePlatformMinuteResult({ offBoardStatus: 0, noObligationStatus: 0, approvalStatus: 0, auxiliaryApprovalStatus: 1 }).result, 'SAGLADI');
});

test('reactiveHourSummary matches reference hour decision order', () => {
  assert.equal(pivot.reactiveHourSummary({ kyCount: 60 }).hourResult, 'KY');
  assert.equal(pivot.reactiveHourSummary({ ddCount: 60 }).hourResult, 'DD');
  assert.equal(pivot.reactiveHourSummary({ yyCount: 60 }).hourResult, 'YY');
  assert.equal(pivot.reactiveHourSummary({ yyCount: 20, ddCount: 28, passCount: 12 }).hourResult, 'DD');
  assert.equal(pivot.reactiveHourSummary({ yyCount: 24, ddCount: 24, passCount: 12 }).hourResult, 'YY');
  assert.equal(pivot.reactiveHourSummary({ passCount: 12, failCount: 0 }).hourResult, 'YY');
  assert.equal(pivot.reactiveHourSummary({ passCount: 48, failCount: 12 }).hourResult, 'SAGLADI');
  assert.equal(pivot.reactiveHourSummary({ passCount: 47, failCount: 13 }).hourResult, 'SAGLAMADI');
});

test('reactiveHourSummary suppresses percentage for DD YY KY decisions', () => {
  const neutral = pivot.reactiveHourSummary({ yyCount: 60 });
  assert.equal(neutral.passRatio, null);
  assert.equal(neutral.pctSuppressed, true);

  const normal = pivot.reactiveHourSummary({ passCount: 45, yyCount: 5, ddCount: 5, failCount: 5 });
  assert.equal(normal.hourResult, 'SAGLADI');
  assert.equal(normal.passRatio, 91.667);
  assert.equal(normal.pctSuppressed, false);
});

test('buildPlatformHourStat treats missing minutes and auxiliary approval correctly', () => {
  const rows = [
    ...Array.from({ length: 45 }, () => ({ offBoardStatus: 0, noObligationStatus: 0, approvalStatus: 1 })),
    ...Array.from({ length: 10 }, () => ({ offBoardStatus: 0, noObligationStatus: 1, approvalStatus: 0 })),
    ...Array.from({ length: 3 }, () => ({ offBoardStatus: 1, noObligationStatus: 0, approvalStatus: 0 })),
    { offBoardStatus: 0, noObligationStatus: 0, approvalStatus: 0, auxiliaryApprovalStatus: 1 }
  ];

  const stat = pivot.buildPlatformHourStat(rows);
  assert.equal(stat.passCount, 46);
  assert.equal(stat.yyCount, 10);
  assert.equal(stat.ddCount, 3);
  assert.equal(stat.missingCount, 1);
  assert.equal(stat.failCount, 1);
  assert.equal(stat.hourResult, 'SAGLADI');
  assert.equal(stat.passRatio, 98.333);
});

test('buildPlatformHourStat keeps completely empty hours as KY instead of failed', () => {
  const stat = pivot.buildPlatformHourStat([]);
  assert.equal(stat.kyCount, 60);
  assert.equal(stat.failCount, 0);
  assert.equal(stat.hourResult, 'KY');
  assert.equal(stat.passRatio, null);
});
