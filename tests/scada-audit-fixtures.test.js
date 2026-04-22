const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const clean = (value) => String(value || '').replace(/^"|"$/g, '').replace(/""/g, '"');
  const headers = headerLine.split(';').map(clean);
  return lines.map((line) => {
    const cells = line.split(';').map(clean);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
  });
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key] || ''] = (acc[row[key] || ''] || 0) + 1;
    return acc;
  }, {});
}

test('hat audit fixture reaches 300+ usable records with no orientation unknown', () => {
  const rows = readCsv(path.join(__dirname, '..', 'docs', 'scada_eslesme_denetim_2026-04-20 (4).csv'));
  const counts = countBy(rows, 'Durum');
  const usable = (counts['matched-live'] || 0) + (counts['matched-stale'] || 0) + (counts['ambiguous-warning'] || 0);

  assert.equal(rows.length, 312);
  assert.equal(counts['orientation-unknown'] || 0, 0);
  assert.equal(counts['ambiguous-warning'] || 0, 7);
  assert.equal((counts['missing-config-id'] || 0) + (counts['missing-source-row'] || 0), 5);
  assert.ok(usable >= 307, `usable count ${usable} is below expected`);
});
