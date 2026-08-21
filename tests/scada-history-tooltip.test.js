const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

const code = fs.readFileSync('scada-v2-runtime.js', 'utf8');

function setupEnv() {
  const window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    __SCADA_V2_TEST_HOOKS__: {},
    requestAnimationFrame: (cb) => cb()
  };
  const context = {
    state: { filters: {}, scada: { capacitySeason: "summer", entityMetricsByKey: new Map(), history: new Map(), timeMode: "live" } },
    SCADA_CONFIG: {},
    document: {
      createElementNS: (ns, name) => {
        const el = {
          tagName: name,
          _listeners: {},
          style: {},
          children: [],
          isConnected: false, addEventListener: (e,h)=>_l[e]=h, removeEventListener: (e,h)=>{if(_l[e]===h)delete _l[e];},
          addEventListener: (event, handler) => { if (!el._listeners[event]) el._listeners[event] = new Set(); el._listeners[event].add(handler); },
          removeEventListener: (event, handler) => {
            if (el._listeners[event] === handler) delete el._listeners[event];
          },
          setAttribute: () => {},
          appendChild: (child) => {
            el.children.push(child);
            child.isConnected = true;
          },
          removeChild: (child) => {
            const idx = el.children.indexOf(child);
            if (idx !== -1) {
              el.children.splice(idx, 1);
              child.isConnected = false;
            }
          },
          getBoundingClientRect: () => ({ width: 920, height: 1100, left: 10, top: 10 }),
          remove: () => { el.isConnected = false; }
        };
        return el;
      },
      createElement: () => ({
        style: {},
        addEventListener: () => {},
        setAttribute: () => {},
        appendChild: () => {},
      }),
      createDocumentFragment: () => ({ appendChild: () => {}, append: () => {} }),
    },
    window,
    console,
    setCapacitySeason: () => {},
    escapeHtml: (s) => String(s),
    initScadaCard: () => {},
    SCADA_COMMON: { resolveHistoryMetricsByEntity: () => ({}) }
  };
  context.globalThis = context;
  context.global = context;
  vm.createContext(context);
  vm.runInContext(code, context);
  return { context, window };
}

test('P0-1 — async voltage remount cleans up old SVG', () => {
  const { context, window } = setupEnv();
  const canvasEl = {
    children: [],
    appendChild: (el) => { canvasEl.children.push(el); el.isConnected = true; },
    replaceChildren: () => { canvasEl.children.forEach(c => { c.isConnected = false; }); canvasEl.children = []; },
    parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
  };
  const tooltipEl = { style: {}, offsetParent: null, offsetWidth: 100, offsetHeight: 50 };

  const config1 = {
    entityType: 'hat',
    entity: { id: 'test' },
    series: [{ points: [{ ts: new Date(), value: 10 }], metricType: 'active' }]
  };

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config1);
  
  assert.strictEqual(canvasEl.children.length, 1);
  const oldSvg = canvasEl.children[0];
  assert.ok(oldSvg.isConnected);

  const config2 = {
    entityType: 'hat',
    entity: { id: 'test' },
    series: [{ points: [{ ts: new Date(), value: 10 }], metricType: 'active' }],
    _voltageFetchData: { series: [{ points: [{ ts: new Date(), value: 154 }] }] }
  };

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config2);

  assert.strictEqual(canvasEl.children.length, 1);
  assert.ok(!oldSvg.isConnected);
  const newSvg = canvasEl.children[0];
  assert.notStrictEqual(oldSvg, newSvg);
});

test('P0-1 — listener cleanup on remount', () => {
  const { context } = setupEnv();
  
  let windowListeners = new Map();
  context.window.addEventListener = (evt, h) => { if (!windowListeners.has(evt)) windowListeners.set(evt, new Set()); windowListeners.get(evt).add(h); };
  context.window.removeEventListener = (evt, h) => { windowListeners.get(evt)?.delete(h); };

  const canvasEl = {
    children: [],
    isConnected: true,
    appendChild: (el) => { canvasEl.children.push(el); el.isConnected = true; },
    replaceChildren: () => { canvasEl.children.forEach(c => { c.isConnected = false; }); canvasEl.children = []; },
  };
  const tooltipEl = { style: {} };

  const config = {
    entityType: 'hat',
    entity: { id: 'test' },
    series: [{ points: [{ ts: new Date(), value: 10 }], metricType: 'active' }]
  };

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  const initialMove = Array.from(windowListeners.get('mousemove'))[0];
  assert.ok(initialMove);

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  assert.ok(!windowListeners.get('mousemove').has(initialMove));

  // Old listener should be dead. Since it returns early:
  let noThrow = true;
  try {
     initialMove({ clientX: 10, clientY: 10 });
  } catch(e) {
     noThrow = false;
  }
  assert.ok(noThrow);
});

test('P0-2 — tooltip no exception and shows correct units', () => {
  const { context } = setupEnv();
  
  let windowListeners = new Map();
  context.window.addEventListener = (evt, h) => { if (!windowListeners.has(evt)) windowListeners.set(evt, new Set()); windowListeners.get(evt).add(h); };
  context.window.removeEventListener = (evt, h) => { windowListeners.get(evt)?.delete(h); };

  const canvasEl = {
    children: [],
    isConnected: true,
    appendChild: (el) => { canvasEl.children.push(el); el.isConnected = true; },
    replaceChildren: () => { canvasEl.children.forEach(c => { c.isConnected = false; }); canvasEl.children = []; },
    parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
  };
  const tooltipEl = { style: {}, offsetWidth: 100, offsetHeight: 100 };

  const now = new Date('2026-08-20T12:00:00Z').getTime();
  
  const config = {
    entityType: 'hat',
    entity: { id: 'test', kv: 154 },
    series: [
       { elementName: 'P', terminalSide: 'start', points: [{ ts: new Date(now), value: 50 }], metricType: 'active' },
       { elementName: 'Q', terminalSide: 'start', points: [{ ts: new Date(now), value: 20 }], metricType: 'reactive' }
    ],
    _voltageFetchData: { series: [{ _voltageSide: 'start', points: [{ ts: new Date(now), value: 153 }] }] }
  };

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  
  // Fake mouse move at different Y coordinates
  const move = Array.from(windowListeners.get('mousemove'))[0];
  
  const simulateY = (y, expectedSubstr) => {
     tooltipEl.hidden = true;
     tooltipEl.innerHTML = '';
     move({ clientX: 300, clientY: y });
     console.log("Y=", y, tooltipEl.innerHTML);
     assert.strictEqual(tooltipEl.hidden, false, `Tooltip hidden for Y=${y}`);
     assert.ok(tooltipEl.style.left && tooltipEl.style.left.endsWith('px'), `Left missing/invalid for Y=${y}`);
     assert.ok(tooltipEl.style.top && tooltipEl.style.top.endsWith('px'), `Top missing/invalid for Y=${y}`);
     assert.ok(tooltipEl.innerHTML.includes(expectedSubstr), `Missing '${expectedSubstr}' in tooltip for Y=${y}`);
  };

  // The padT=16, height=180, gap=16
  // Pane 0 (MW): 16 -> 196
  simulateY(100, 'MW');
  // Pane 1 (MVar): 212 -> 392
  simulateY(300, 'MVar');
  // Pane 2 (MVA): 408 -> 588
  simulateY(500, 'MVA');
  // Pane 3 (A): 604 -> 784
  simulateY(700, ' A<');
  // Pane 4 (kV): 800 -> 980
  simulateY(900, ' kV<');
});

test('P0-4 — no stale canvas vars in updateTooltip', () => {
   const code = fs.readFileSync('scada-v2-runtime.js', 'utf8');
      const startIdx = code.indexOf('function updateTooltip(event) {');
   const endIdx = code.indexOf('function clampView', startIdx);
   const fnStr = code.substring(startIdx, endIdx);
   assert.ok(startIdx > 0);
;
   
   
   assert.ok(!fnStr.includes('isHovering'));
   assert.ok(!fnStr.includes('_AXIS_WIDTH'));
   assert.ok(!fnStr.includes('_PADDING_TOP'));
   assert.ok(!fnStr.includes('range.startMs'));
   assert.ok(!fnStr.includes('hoverTs'));
   assert.ok(!fnStr.includes('canvasRect'));
   assert.ok(!fnStr.includes('p._rect'));
});

test('P0-3 — current mixed provenance', () => {
  const { context, windowListeners } = setupEnv();
  
  const canvasEl = {
    children: [],
    isConnected: true,
    appendChild: (el) => { canvasEl.children.push(el); el.isConnected = true; },
    replaceChildren: () => { canvasEl.children.forEach(c => { c.isConnected = false; }); canvasEl.children = []; },
  };
  const tooltipEl = { style: {} };

  const now = new Date('2026-08-20T12:00:00Z').getTime();
  
  const config = {
    entityType: 'hat',
    entity: { id: 'test', kv: 154 },
    series: [
       { elementName: 'P', pairing: 'h:start', terminalSide: 'start', points: [{ ts: new Date(now), value: 50 }, { ts: new Date(now + 60000), value: 50 }, { ts: new Date(now + 180000), value: 50 }], metricType: 'active' },
       { elementName: 'Q', pairing: 'h:start', terminalSide: 'start', points: [{ ts: new Date(now), value: 20 }, { ts: new Date(now + 60000), value: 20 }, { ts: new Date(now + 180000), value: 20 }], metricType: 'reactive' }
    ],
    _voltageFetchData: { series: [{ _voltageSide: 'start', points: [{ ts: new Date(now), value: 153 }, { ts: new Date(now + 60000), value: 153 }] }] } // Only 2 U points, one is missing
  };

  context.window.__SCADA_V2_TEST_HOOKS__.mountInteractiveHistoryChart(canvasEl, null, tooltipEl, config);
  
  const panes = context.window.__SCADA_V2_TEST_HOOKS__.lastPanes;
  const currentPane = panes.find(p => p.key === 'current');
  console.log("TITLE IS:", currentPane.title); assert.ok(currentPane.title.includes('karma gerilim kaynagi'));
  assert.ok(currentPane.title.includes('Gercek U 2 / 3'));
  assert.ok(currentPane.title.includes('Nominal fallback 1 / 3'));
  
  const s = currentPane.seriesGroup[0];
  assert.strictEqual(s._actualCount, 2);
  assert.strictEqual(s._nominalCount, 1);
});
