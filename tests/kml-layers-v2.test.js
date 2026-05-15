const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modelPath = path.join(__dirname, '..', 'data', 'kml_layers_v2.json');

function readModel() {
  return JSON.parse(fs.readFileSync(modelPath, 'utf8'));
}

test('kml_layers_v2 has required top-level schema and expected counts', () => {
  const model = readModel();

  assert.equal(model.meta.schemaVersion, 2);
  assert.ok(Array.isArray(model.ytmNames));
  assert.ok(Array.isArray(model.tmPoints));
  assert.ok(Array.isArray(model.hatLines));
  assert.ok(Array.isArray(model.trafos));
  assert.ok(Array.isArray(model.baraNodes));
  assert.equal(typeof model.hierarchy, 'object');

  assert.equal(model.tmPoints.length, 1583);
  assert.equal(model.hatLines.length, 2341);
  assert.equal(model.trafos.length, 3001);
  assert.equal(model.baraNodes.length, 5960);
});

test('kml_layers_v2 validation metadata matches expected source coverage', () => {
  const model = readModel();
  const validation = model.meta.validation;

  assert.equal(validation.tmIdMatches, 1583);
  assert.equal(validation.kmlTmCount, 1583);
  assert.equal(validation.hatIdMatches, 2341);
  assert.equal(validation.kmlHatCount, 2341);

  assert.equal(validation.trafoParentMatches, 3001);
  assert.equal(validation.excelTrafoCount, 3001);
  assert.equal(validation.baraParentMatches, 5960);
  assert.equal(validation.excelBaraCount, 5960);

  assert.deepEqual(validation.scadaCoverage, {
    hatActive: 2290,
    hatReactive: 2290,
    trafoActive: 2762,
    trafoReactive: 2764,
    baraVoltageAll: 2108,
    baraVoltage154400: 1811
  });

  assert.equal(validation.voltageExactSourceMatched, 1842);
  assert.equal(validation.voltageOverlayMatched, 266);
  assert.equal(validation.voltageAliasMatched, 0);
  assert.equal(validation.voltageAliasAmbiguous, 0);
  assert.equal(validation.voltageStillMissing, 1492);
  assert.equal(validation.formulaTerminalSignMismatch, 4117);
  assert.equal(validation.terminalExitResolvable, 8515);
  assert.equal(validation.terminalExitUnresolvable, 0);

  assert.deepEqual(validation.missingTmExcelRows, [
    { id: '2674', name: 'TARSUS OSB' }
  ]);
});

test('kml_layers_v2 child references and render modes are internally consistent', () => {
  const model = readModel();
  const tmIds = new Set(model.tmPoints.map((item) => item.id));
  const hatIds = new Set(model.hatLines.map((item) => item.id));
  const trafoIds = new Set(model.trafos.map((item) => item.id));
  const baraIds = new Set(model.baraNodes.map((item) => item.id));

  model.tmPoints.forEach((tm) => {
    tm.childHatIds.forEach((hatId) => assert.ok(hatIds.has(hatId), `missing hat child ${hatId}`));
    tm.childTrafoIds.forEach((trafoId) => assert.ok(trafoIds.has(trafoId), `missing trafo child ${trafoId}`));
    tm.childBaraIds.forEach((baraId) => assert.ok(baraIds.has(baraId), `missing bara child ${baraId}`));
  });

  model.hatLines.forEach((hat) => {
    assert.ok(tmIds.has(hat.startTmId), `missing startTmId ${hat.startTmId}`);
    assert.ok(tmIds.has(hat.endTmId), `missing endTmId ${hat.endTmId}`);
  });

  model.trafos.forEach((trafo) => {
    assert.equal(trafo.renderMode, 'details-only');
    assert.ok(tmIds.has(trafo.tmId), `missing trafo tmId ${trafo.tmId}`);
  });

  model.baraNodes.forEach((bara) => {
    assert.equal(bara.renderMode, 'details-only');
    assert.ok(tmIds.has(bara.tmId), `missing bara tmId ${bara.tmId}`);
  });
});
