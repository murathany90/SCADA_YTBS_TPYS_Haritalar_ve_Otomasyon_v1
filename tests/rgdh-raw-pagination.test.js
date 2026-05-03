const test = require('node:test');
const assert = require('node:assert/strict');

const pagination = require('../rgdh-raw-pagination.js');

function row(id, overrides = {}) {
  return {
    id,
    localDate: '2026-05-01',
    measurementDateLocal: `2026-05-01T00:${String(id).padStart(2, '0')}:00+03:00`,
    ...overrides
  };
}

test('buildRawDatePages creates one sorted page per local date', () => {
  const pages = pagination.buildRawDatePages([
    row(2, { localDate: '2026-05-02', measurementDateLocal: '2026-05-02T00:00:00+03:00' }),
    row(1, { localDate: '2026-05-01', measurementDateLocal: '2026-05-01T00:00:00+03:00' }),
    row(3, { localDate: '2026-05-03', measurementDateLocal: '2026-05-03T00:00:00+03:00' })
  ]);

  assert.deepEqual(pages.map((page) => page.key), ['2026-05-01', '2026-05-02', '2026-05-03']);
  assert.deepEqual(pages.map((page) => page.rowCount), [1, 1, 1]);
});

test('buildRawDatePages keeps only the rows for each day in that day page', () => {
  const rows = [
    row(1, { localDate: '2026-05-01', measurementDateLocal: '2026-05-01T00:00:00+03:00' }),
    row(2, { localDate: '2026-05-01', measurementDateLocal: '2026-05-01T00:01:00+03:00' }),
    row(3, { localDate: '2026-05-02', measurementDateLocal: '2026-05-02T00:00:00+03:00' })
  ];
  const pages = pagination.buildRawDatePages(rows);

  assert.deepEqual(pages[0].rows.map((item) => item.id), [1, 2]);
  assert.deepEqual(pages[1].rows.map((item) => item.id), [3]);
});

test('resolveRawPage preserves an existing selected date and falls back to the first day', () => {
  const pages = pagination.buildRawDatePages([
    row(1, { localDate: '2026-05-01' }),
    row(2, { localDate: '2026-05-02' })
  ]);

  assert.equal(pagination.resolveRawPage(pages, '2026-05-02').key, '2026-05-02');
  assert.equal(pagination.resolveRawPage(pages, '2026-05-09').key, '2026-05-01');
  assert.equal(pagination.resolveRawPage([], '2026-05-02'), null);
});

test('buildRawDatePages places rows without a date on a final undated page', () => {
  const pages = pagination.buildRawDatePages([
    row(1, { localDate: '', measurementDateLocal: '', measurementDateUtc: '' }),
    row(2, { localDate: '2026-05-01', measurementDateLocal: '2026-05-01T00:00:00+03:00' })
  ]);

  assert.deepEqual(pages.map((page) => page.key), ['2026-05-01', '__NO_DATE__']);
  assert.equal(pages[1].label, 'Tarihsiz');
  assert.deepEqual(pages[1].rows.map((item) => item.id), [1]);
});

test('moveRawPage moves to first previous next and last page keys', () => {
  const pages = pagination.buildRawDatePages([
    row(1, { localDate: '2026-05-01' }),
    row(2, { localDate: '2026-05-02' }),
    row(3, { localDate: '2026-05-03' })
  ]);

  assert.equal(pagination.moveRawPage(pages, '2026-05-02', 'first'), '2026-05-01');
  assert.equal(pagination.moveRawPage(pages, '2026-05-02', 'prev'), '2026-05-01');
  assert.equal(pagination.moveRawPage(pages, '2026-05-02', 'next'), '2026-05-03');
  assert.equal(pagination.moveRawPage(pages, '2026-05-02', 'last'), '2026-05-03');
  assert.equal(pagination.moveRawPage(pages, '2026-05-03', 'next'), '2026-05-03');
});
