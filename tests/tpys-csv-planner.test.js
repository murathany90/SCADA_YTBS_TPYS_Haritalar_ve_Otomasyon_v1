const test = require('node:test');
const assert = require('node:assert/strict');

const plannerApi = require('../tpys-csv-planner.js');

function sampleStandard(overrides = {}) {
  return {
    safePlantName: 'GEYCEK_RES',
    displayDate: '02.04.2026',
    monthYearFolderSuffix: '04_26',
    dayFolderSuffix: '02_04_26',
    sha256: 'a'.repeat(64),
    warnings: [],
    ...overrides
  };
}

test('planner creates station-month and day targets under Chrome Downloads relative root', () => {
  const planner = plannerApi.createTpysCsvPlanner();
  const result = planner.planTargets(sampleStandard(), { skipDuplicateContent: true });

  assert.deepEqual(result.targets.map((target) => target.path), [
    'TPYS_CSV_Standartlastirilmis/GEYCEK_RES_04_26/GEYCEK_RES_02.04.2026.csv',
    'TPYS_CSV_Standartlastirilmis/RGDH_GUN_02_04_26/GEYCEK_RES_02.04.2026.csv'
  ]);
  assert.equal(result.targets.every((target) => target.action === 'download'), true);
});

test('planner skips duplicate content for the same target path', () => {
  const planner = plannerApi.createTpysCsvPlanner({
    previousIndex: {
      'TPYS_CSV_Standartlastirilmis/GEYCEK_RES_04_26/GEYCEK_RES_02.04.2026.csv': 'a'.repeat(64)
    }
  });

  const result = planner.planTargets(sampleStandard(), { skipDuplicateContent: true });

  assert.equal(result.targets[0].action, 'duplicate');
  assert.equal(result.targets[0].duplicateOf, 'TPYS_CSV_Standartlastirilmis/GEYCEK_RES_04_26/GEYCEK_RES_02.04.2026.csv');
  assert.equal(result.targets[1].action, 'download');
});

test('planner adds __1 suffix when same target path has different content hash', () => {
  const planner = plannerApi.createTpysCsvPlanner({
    previousIndex: {
      'TPYS_CSV_Standartlastirilmis/GEYCEK_RES_04_26/GEYCEK_RES_02.04.2026.csv': 'a'.repeat(64)
    }
  });

  const result = planner.planTargets(sampleStandard({ sha256: 'b'.repeat(64) }), { skipDuplicateContent: true });

  assert.equal(
    result.targets[0].path,
    'TPYS_CSV_Standartlastirilmis/GEYCEK_RES_04_26/GEYCEK_RES_02.04.2026__1.csv'
  );
  assert.equal(result.targets[0].action, 'download');
});
