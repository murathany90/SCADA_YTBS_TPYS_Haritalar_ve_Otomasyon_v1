const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const clientPath = path.join(__dirname, '..', 'scada-client.js');
const clientCode = fs.readFileSync(clientPath, 'utf8');

function loadClient() {
  const context = {
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Map,
    Set,
    Promise,
    clearInterval: () => {},
    state: {
      scada: {
        logs: [],
        history: new Map(),
        rowsBySinsid: new Map(),
        measurementRowsById: new Map([['p-v2', { measurementId: 'p-v2' }]]),
        currentScope: { entities: [{ id: 'hat-1' }] },
        lineFlowByLineId: new Map(),
        hatsBySinsid: new Map(),
        duplicateMappings: new Map(),
        capacitySeason: 'winter'
      },
      filters: {},
      network: { hatLines: [] },
      ui: {}
    },
    currentGeoBounds: () => ({}),
    getVisibleHats: () => [],
    intersects: () => true,
    requestRender: () => {},
    updateScadaCardUI: () => {},
    refreshRankingTable: () => {},
    setScadaStatusMessage: () => {},
    SCADA_COMMON: undefined,
    chrome: { storage: { local: { get: async () => ({}), set: async () => {} } }, runtime: { sendMessage: async () => ({ ok: false }) } }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(clientCode, context);
  return context;
}

test('legacy applyScadaSnapshot does not mutate V2 line flow map while V2 runtime is active', () => {
  const context = loadClient();
  const v2Rows = context.state.scada.measurementRowsById;
  const v2Flow = {
    direction: 'reverse',
    directionResolvedBy: 'terminal-exit-model',
    directionValue: -25
  };
  context.state.scada.v2RuntimeActive = true;
  context.state.scada.rowsBySinsid = v2Rows;
  context.state.scada.lineFlowByLineId.set('hat-1', v2Flow);
  context.state.scada.hatsBySinsid.set('p-legacy', [{
    id: 'hat-1',
    name: 'Test Hat',
    winterCapacityMva: 100,
    summerCapacityMva: 100
  }]);

  const legacyRows = new Map([[
    'p-legacy',
    {
      activePowerMw: 50,
      timestamp: new Date(),
      tmName: 'TM-A',
      remoteName: 'TM-B'
    }
  ]]);

  context.applyScadaSnapshot(legacyRows);

  assert.equal(context.state.scada.rowsBySinsid, v2Rows);
  assert.equal(context.state.scada.lineFlowByLineId.get('hat-1'), v2Flow);
  assert.equal(context.state.scada.lineFlowByLineId.get('hat-1').direction, 'reverse');
});
