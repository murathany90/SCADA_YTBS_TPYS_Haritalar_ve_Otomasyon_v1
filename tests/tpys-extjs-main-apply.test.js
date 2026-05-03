const assert = require('node:assert/strict');
const test = require('node:test');

const mainApply = require('../tpys-extjs-main-apply.js');

function makeRecord(data) {
  return {
    data: { ...data },
    dirty: false,
    beginEditCount: 0,
    endEditCount: 0,
    get(field) {
      return this.data[field];
    },
    set(field, value) {
      this.data[field] = value;
    },
    beginEdit() {
      this.beginEditCount += 1;
    },
    endEdit() {
      this.endEditCount += 1;
    }
  };
}

function makeStore(records) {
  return {
    data: { items: records },
    getCount() {
      return records.length;
    },
    getAt(index) {
      return records[index] || null;
    },
    getRange() {
      return records.slice();
    }
  };
}

function makeColumnModel(columns) {
  return {
    config: columns,
    getColumnCount() {
      return columns.length;
    },
    getDataIndex(index) {
      return columns[index]?.dataIndex || '';
    },
    getCellEditor(index) {
      return columns[index]?.editor || null;
    }
  };
}

function installMockExt(grid) {
  let suspended = 0;
  let resumed = 0;
  global.Ext = {
    ComponentMgr: {
      all: {
        each(fn) {
          fn(grid);
        }
      }
    },
    suspendLayouts() {
      suspended += 1;
    },
    resumeLayouts() {
      resumed += 1;
    },
    getStats() {
      return { suspended, resumed };
    }
  };
}

test('MAIN-world ExtJS apply writes only status values and syncs companion labels from editor store', () => {
  const comboStore = makeStore([
    makeRecord({ id: 11, dsc: 'Onay Bekliyor' }),
    makeRecord({ id: 9, dsc: 'Sa\u011flad\u0131' }),
    makeRecord({ id: 8, dsc: 'Y\u00fck\u00fcml\u00fcl\u00fc\u011f\u00fc Yok' })
  ]);
  const row = makeRecord({
    gecerlilik_dt: '01/04/2026',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 11,
    lkp_reaktif_yerine_getirme0_qw_: 'Onay Bekliyor',
    onay_durum_flag0: 0
  });
  let refreshCount = 0;
  const grid = {
    store: makeStore([row]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: comboStore, displayField: 'dsc', valueField: 'id' } }
      },
      { dataIndex: 'onay_durum_flag0' }
    ]),
    view: {
      refresh() {
        refreshCount += 1;
      }
    }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: true,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, true);
  assert.equal(result.modeUsed, 'ext-main-batch');
  assert.equal(row.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0_qw_, 'Sa\u011flad\u0131');
  assert.notEqual(row.data.lkp_reaktif_yerine_getirme0, 'Sa\u011flad\u0131');
  assert.equal(row.data.onay_durum_flag0, 0);
  assert.equal(row.dirty, true);
  assert.equal(refreshCount, 1);
  assert.deepEqual(global.Ext.getStats(), { suspended: 1, resumed: 1 });
  assert.equal(result.summary.statusWritesOk, 1);
  assert.equal(result.summary.approvalWritesOk, 0);
});

test('MAIN-world ExtJS apply reports a clear error when combo label is not in store or confirmed fallback', () => {
  const comboStore = makeStore([
    makeRecord({ value: 11, text: 'Onay Bekliyor' })
  ]);
  const row = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: 'BAYRAMHACILI 154',
    lkp_reaktif_yerine_getirme0: 11
  });
  const grid = {
    store: makeStore([row]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: comboStore, displayField: 'text', valueField: 'value' } }
      }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: 'BAYRAMHACILI 154',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Bilinmeyen Durum' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: 'BAYRAMHACILI 154', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /deger cozulemedi/i);
  assert.deepEqual(result.unresolvedLabels, ['Bilinmeyen Durum']);
  assert.ok(result.candidateDiagnostics);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0, 11);
});

test('MAIN-world ExtJS apply resolves raw values from store range companion labels', () => {
  const comboStore = makeStore([]);
  const targetRow = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 11,
    lkp_reaktif_yerine_getirme0_qw_: 'Onay Bekliyor'
  });
  const discoveryRow = makeRecord({
    gecerlilik_dt: '2026-04-02',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 9,
    lkp_reaktif_yerine_getirme0_qw_: 'Sa\u011flad\u0131'
  });
  const grid = {
    store: makeStore([targetRow, discoveryRow]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: comboStore, displayField: 'text', valueField: 'value' } }
      }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, true);
  assert.equal(targetRow.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flad\u0131'].value, 9);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flad\u0131'].source, 'store-range-companion');
});

test('MAIN-world ExtJS apply resolves raw values from column renderer without visible label cells', () => {
  const labelsByRaw = new Map([
    [9, 'Sa\u011flad\u0131'],
    [11, 'Onay Bekliyor']
  ]);
  const targetRow = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 11
  });
  const discoveryRow = makeRecord({
    gecerlilik_dt: '2026-04-02',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 9
  });
  const grid = {
    store: makeStore([targetRow, discoveryRow]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: makeStore([]), displayField: 'text', valueField: 'value' } },
        renderer(value) {
          return `<span>${labelsByRaw.get(value) || value}</span>`;
        }
      }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, true);
  assert.equal(targetRow.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flad\u0131'].source, 'store-range-renderer');
});

test('MAIN-world ExtJS apply resolves raw values from visible grid cells', () => {
  const targetRow = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 11
  });
  const discoveryRow = makeRecord({
    gecerlilik_dt: '2026-04-02',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 9
  });
  const rows = [
    { querySelector: () => ({ textContent: 'Onay Bekliyor', innerText: 'Onay Bekliyor' }) },
    { querySelector: () => ({ textContent: 'Sa\u011flad\u0131', innerText: 'Sa\u011flad\u0131' }) }
  ];
  const grid = {
    store: makeStore([targetRow, discoveryRow]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: makeStore([]), displayField: 'text', valueField: 'value' } }
      }
    ]),
    el: {
      dom: {
        querySelectorAll(selector) {
          return selector === '.x-grid3-row' ? rows : [];
        }
      }
    },
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, true);
  assert.equal(targetRow.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flad\u0131'].source, 'visible-grid');
});

test('MAIN-world ExtJS apply accepts only multi-label global lookup maps', () => {
  const targetRow = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 11
  });
  const grid = {
    store: makeStore([targetRow]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      {
        dataIndex: 'lkp_reaktif_yerine_getirme0',
        editor: { field: { store: makeStore([]), displayField: 'text', valueField: 'value' } }
      }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);
  global._lookups = {
    unrelated: [{ id: 9, text: 'Sa\u011flad\u0131' }],
    statusLookup: [
      { id: 9, text: 'Sa\u011flad\u0131' },
      { id: 11, text: 'Sa\u011flamad\u0131' },
      { id: 13, text: 'Y\u00fck\u00fcml\u00fcl\u00fc\u011f\u00fc Yok' }
    ]
  };

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  delete global._lookups;

  assert.equal(result.ok, true);
  assert.equal(targetRow.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flad\u0131'].source, 'global-lookup');
});

test('MAIN-world ExtJS apply uses confirmed fallback values including zero and reports status comparison summary', () => {
  const row = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 9,
    lkp_reaktif_yerine_getirme1: 11
  });
  const grid = {
    store: makeStore([row]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      { dataIndex: 'lkp_reaktif_yerine_getirme0' },
      { dataIndex: 'lkp_reaktif_yerine_getirme1' }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'X', 1: 'WAIT' }
    }],
    settings: {
      statusLabels: {
        X: 'Sa\u011flamad\u0131',
        WAIT: 'Onay Bekliyor'
      },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{
      baraName: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusLabelByHour: { 0: 'Sa\u011flad\u0131', 1: 'Onay Bekliyor' }
    }]
  });

  assert.equal(result.ok, true);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0, 0);
  assert.equal(row.data.lkp_reaktif_yerine_getirme1, 11);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flamad\u0131'].value, 0);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flamad\u0131'].source, 'confirmed-fallback');
  assert.equal(result.resolvedStatusMap['1']['Onay Bekliyor'].value, 11);
  assert.equal(result.resolvedStatusMap['1']['Onay Bekliyor'].source, 'confirmed-fallback');
  assert.equal(result.summary.statusSameBefore, 1);
  assert.equal(result.summary.statusDifferentBefore, 1);
  assert.equal(result.summary.statusChangedDifferent, 1);
  assert.equal(result.summary.statusWritesOk, 1);
});

test('MAIN-world ExtJS apply ignores live status candidates that conflict with confirmed values', () => {
  const row = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 5,
    lkp_reaktif_yerine_getirme0_qw_: 'Sa\u011flamad\u0131'
  });
  const grid = {
    store: makeStore([row]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      { dataIndex: 'lkp_reaktif_yerine_getirme0' }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'X' }
    }],
    settings: {
      statusLabels: { X: 'Sa\u011flamad\u0131' },
      checkApproval: false,
      onlyChangedCells: true
    },
    pageRows: [{
      baraName: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusLabelByHour: { 0: 'Onay Bekliyor' }
    }]
  });

  assert.equal(result.ok, true);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0, 0);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flamad\u0131'].value, 0);
  assert.equal(result.resolvedStatusMap['0']['Sa\u011flamad\u0131'].source, 'confirmed-fallback');
  assert.equal(result.mappingDiagnostics.conflicts.length, 1);
  assert.equal(result.mappingDiagnostics.conflicts[0].discoveredValue, 5);
  assert.equal(result.mappingDiagnostics.conflicts[0].confirmedValue, 0);
});

test('MAIN-world ExtJS apply syncs stale companion labels without counting a status change', () => {
  const row = makeRecord({
    gecerlilik_dt: '2026-04-01',
    bara_ad: '\u00c7AYIRHAN TES 380',
    lkp_reaktif_yerine_getirme0: 9,
    lkp_reaktif_yerine_getirme0_qw_: 'Onay Bekliyor',
    onay_durum_flag0: 0
  });
  const grid = {
    store: makeStore([row]),
    colModel: makeColumnModel([
      { dataIndex: 'gecerlilik_dt' },
      { dataIndex: 'bara_ad' },
      { dataIndex: 'lkp_reaktif_yerine_getirme0' },
      { dataIndex: 'onay_durum_flag0' }
    ]),
    view: { refresh() {} }
  };
  installMockExt(grid);

  const result = mainApply.applyPlan({
    operations: [{
      tpysBaraAdi: '\u00c7AYIRHAN TES 380',
      localDate: '2026-04-01',
      statusByHour: { 0: 'OK' }
    }],
    settings: {
      statusLabels: { OK: 'Sa\u011flad\u0131' },
      checkApproval: true,
      onlyChangedCells: true
    },
    pageRows: [{ baraName: '\u00c7AYIRHAN TES 380', localDate: '2026-04-01' }]
  });

  assert.equal(result.ok, true);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0, 9);
  assert.equal(row.data.lkp_reaktif_yerine_getirme0_qw_, 'Sa\u011flad\u0131');
  assert.equal(row.data.onay_durum_flag0, 0);
  assert.equal(result.summary.statusSameBefore, 1);
  assert.equal(result.summary.statusDifferentBefore, 0);
  assert.equal(result.summary.statusChangedDifferent, 0);
  assert.equal(result.summary.statusWritesOk, 0);
  assert.equal(result.summary.approvalWritesOk, 0);
});
