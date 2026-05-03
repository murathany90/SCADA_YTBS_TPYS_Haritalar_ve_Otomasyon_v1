const test = require('node:test');
const assert = require('node:assert/strict');

const standardizer = require('../tpys-csv-standardizer.js');

test('standardizeTpysCsv extracts plant name, normalizes date and hashes content', async () => {
  const csvText = [
    'TPYS Santral Ismi;Tarih;Deger',
    'GEYCEK RES;2.4.2026;1'
  ].join('\n');

  const result = await standardizer.standardizeTpysCsv({
    csvText,
    baraName: 'Fallback Bara',
    localDate: '2026-04-02',
    asciiNormalize: false
  });

  assert.equal(result.plantName, 'GEYCEK RES');
  assert.equal(result.safePlantName, 'GEYCEK_RES');
  assert.equal(result.isoDate, '2026-04-02');
  assert.equal(result.displayDate, '02.04.2026');
  assert.equal(result.monthYearFolderSuffix, '04_26');
  assert.equal(result.dayFolderSuffix, '02_04_26');
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.warnings, []);
});

test('standardizeTpysCsv uses fallback metadata and ASCII normalization when CSV metadata is missing', async () => {
  const result = await standardizer.standardizeTpysCsv({
    csvText: 'A;B\n1;2',
    baraName: 'Camlica RES',
    localDate: '2026-05-03',
    asciiNormalize: true
  });

  assert.equal(result.plantName, 'Camlica RES');
  assert.equal(result.safePlantName, 'CAMLICA_RES');
  assert.equal(result.displayDate, '03.05.2026');
  assert.equal(result.warnings.includes('PLANT_FALLBACK_USED'), true);
  assert.equal(result.warnings.includes('DATE_FALLBACK_USED'), true);
});

test('sanitizePathSegment strips unsafe path characters and supports conflict suffix bases', () => {
  assert.equal(
    standardizer.sanitizePathSegment(' RES / A:B*? " <x> ', { asciiNormalize: true }),
    'RES_A_B_X'
  );
  assert.equal(standardizer.withConflictSuffix('GEYCEK_RES_02.04.2026.csv', 2), 'GEYCEK_RES_02.04.2026__2.csv');
});
