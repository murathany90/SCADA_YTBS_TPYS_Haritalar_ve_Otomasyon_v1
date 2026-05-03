const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../tpys-csv-automation-core.js');

test('enumerateInclusiveDateRange returns ascending inclusive dates even when inputs are reversed', () => {
  assert.deepEqual(core.enumerateInclusiveDateRange('2026-05-03', '2026-05-01'), [
    '2026-05-01',
    '2026-05-02',
    '2026-05-03'
  ]);
});

test('formatIsoDateForTpys returns DD.MM.YYYY for TPYS date field', () => {
  assert.equal(core.formatIsoDateForTpys('2026-04-02'), '02.04.2026');
});

test('summarizeTpysCsvRun counts per-bara failures without stopping the batch', () => {
  const summary = core.summarizeTpysCsvRun([
    { ok: true, targets: [{ status: 'downloaded' }, { status: 'downloaded' }] },
    { ok: false, reason: 'CSV link yok' },
    { ok: true, targets: [{ status: 'duplicate' }, { status: 'error' }] }
  ]);

  assert.deepEqual(summary, {
    successCount: 1,
    failureCount: 2,
    duplicateCount: 1,
    targetSuccessCount: 2,
    targetFailureCount: 1
  });
});

test('summarizeTpysCsvRun treats duplicate-only items as non-error outcomes', () => {
  const summary = core.summarizeTpysCsvRun([
    { ok: true, targets: [{ status: 'duplicate' }, { status: 'duplicate' }] }
  ]);

  assert.equal(summary.successCount, 1);
  assert.equal(summary.failureCount, 0);
  assert.equal(summary.duplicateCount, 2);
});
