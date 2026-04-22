const test = require('node:test');
const assert = require('node:assert/strict');

const mapCommon = require('../map-common.js');

test('resolveBaraSetMatch prefers tpysBaraId over ambiguous alias collisions', () => {
  const rows = [
    {
      tpysBaraId: '6084',
      tpysBaraAdi: 'KARAPINAR YEKA-1 GES 154',
      yksBaraAdi: 'KARAPINAR YEKA-1 GES 154',
      aliases: ['KARAPINAR YEKA-1 GES']
    },
    {
      tpysBaraId: '6085',
      tpysBaraAdi: 'KARAPINAR YEKA-1 GES 400',
      yksBaraAdi: 'KARAPINAR YEKA-1 GES 400',
      aliases: ['KARAPINAR YEKA-1 GES']
    }
  ];

  const index = mapCommon.buildMappingIndex(rows);

  const ambiguous = mapCommon.resolveBaraSetMatch({ sourceName: 'KARAPINAR YEKA-1 GES' }, index);
  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.reason, 'alias');
  assert.equal(ambiguous.candidates.length, 2);

  const exactId = mapCommon.resolveBaraSetMatch(
    { tpysBaraId: '6084', sourceName: 'KARAPINAR YEKA-1 GES' },
    index
  );
  assert.equal(exactId.status, 'matched');
  assert.equal(exactId.reason, 'tpysBaraId');
  assert.equal(exactId.row.tpysBaraId, '6084');

  const exactName = mapCommon.resolveBaraSetMatch({ sourceName: 'KARAPINAR YEKA-1 GES 154' }, index);
  assert.equal(exactName.status, 'matched');
  assert.equal(exactName.reason, 'tpysBaraAdi');
  assert.equal(exactName.row.tpysBaraId, '6084');
});

test('splitZoom separates integer tile zoom from overlay scale', () => {
  const result = mapCommon.splitZoom(6.35);
  assert.equal(result.tileZoom, 6);
  assert.ok(Math.abs(result.scale - Math.pow(2, 0.35)) < 1e-12);
});
