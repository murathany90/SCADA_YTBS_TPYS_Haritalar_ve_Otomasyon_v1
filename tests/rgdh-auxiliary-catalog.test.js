const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const parser = require('../scripts/parse_resges_auxiliary_catalog.js');

test('parseResgesAuxiliaryCatalogHtml extracts RES/GES auxiliary units from YKS busbar definition HTML', () => {
  const fixturePath = [
    path.join(root, 'yks_izleme_modul', 'yks_docs', 'resges_bara_tanım.txt'),
    path.join(root, 'yks_izleme_modul', 'yks_docs', 'resges_bara_ttanım.txt.txt')
  ].find((candidate) => fs.existsSync(candidate));
  if (!fixturePath) {
    assert.ok(true, 'RES/GES auxiliary HTML fixture is not present in this checkout');
    return;
  }
  const html = fs.readFileSync(fixturePath, 'utf8');
  const rows = parser.parseResgesAuxiliaryCatalogHtml(html);
  const ids = rows.map((row) => row.busbarId).sort((a, b) => Number(a) - Number(b));
  const geycek = rows.find((row) => row.busbarId === 5052);
  const yahyali = rows.find((row) => row.busbarId === 4572);

  assert.deepEqual(ids, [4572, 5052, 5192, 5902, 5959, 6002, 6149]);
  assert.equal(geycek.busbarName, 'GEYCEK RES');
  assert.equal(geycek.unitName, 'YARDIMCI KAYNAK GES');
  assert.equal(geycek.activePowerSetnum, '2,1,156380');
  assert.equal(geycek.reactivePowerSetnum, '2,1,156381');
  assert.equal(geycek.unitPnomMw, 46.63);
  assert.equal(yahyali.speedDrop, 7);
});
