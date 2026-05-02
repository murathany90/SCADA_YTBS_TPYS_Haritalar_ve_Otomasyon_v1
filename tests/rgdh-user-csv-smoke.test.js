const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const csv = require('../rgdh-csv.js');
const normalizer = require('../rgdh-normalizer.js');
const pivot = require('../rgdh-pivot.js');

const docsDir = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs');

function listDocCsvFiles(dir = docsDir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDocCsvFiles(entryPath);
    return entry.name.toLowerCase().endsWith('.csv') ? [entryPath] : [];
  });
}

function findDocFileOrFixture(prefixes, fixtureName) {
  const candidates = listDocCsvFiles();
  const file = candidates.find((candidate) => prefixes.some((prefix) => path.basename(candidate).startsWith(prefix)));
  if (file) return file;
  return path.join(__dirname, '..', 'fixtures', 'rgdh', fixtureName);
}

test('requested YKS CSV exports normalize and produce hourly participation metrics', () => {
  const windFile = findDocFileOrFixture(['9498932425_2026-04-01', '10933818957_2026-04-29'], 'resges_bara_sample.csv');
  const conventionalFile = findDocFileOrFixture(['_RGDH_2026-04-01', '_RGDH_2026-04-29'], 'konvansiyonel_bara_sample.csv');
  const windParsed = csv.parseRgdhCsvText(fs.readFileSync(windFile, 'utf8'), {
    filename: path.basename(windFile)
  });
  const conventionalParsed = csv.parseRgdhCsvText(fs.readFileSync(conventionalFile, 'utf8'), {
    filename: path.basename(conventionalFile)
  });

  const rows = [
    ...normalizer.normalizeCsvParseResult(windParsed),
    ...normalizer.normalizeCsvParseResult(conventionalParsed)
  ];
  const reportDate = rows.find((row) => row.localDate)?.localDate;
  const report = pivot.buildDailyPivot(rows, reportDate);
  const wind = report.rows.find((row) => row.busbarId === windParsed.rows[0].busbarId);
  const conventional = report.rows.find((row) => row.busbarId === conventionalParsed.rows[0].busbarId);

  assert.ok(windParsed.rows.length > 0);
  assert.ok(conventionalParsed.rows.length > 0);
  assert.equal(rows.length, windParsed.rows.length + conventionalParsed.rows.length);
  assert.ok(wind);
  assert.ok(conventional);
  const filenameInternalId = csv.extractWindInternalIdFromFilename(path.basename(windFile));
  if (filenameInternalId) {
    assert.equal(wind.rows.every((row) => row.busbarInternalId === Number(filenameInternalId)), true);
  }
  assert.ok(wind.hours.some((hour) => hour.minuteCount > 0 && typeof hour.participationPct === 'number'));
  assert.ok(conventional.hours.some((hour) => hour.minuteCount > 0 && typeof hour.setAvg === 'number'));
});
