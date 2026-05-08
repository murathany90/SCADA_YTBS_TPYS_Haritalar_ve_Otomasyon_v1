const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const controllerPath = path.join(__dirname, '..', 'dashboard-controller.js');

function loadController(options = {}) {
  const code = fs.readFileSync(controllerPath, 'utf8');
  const storage = { ...(options.storage || {}) };
  const calls = {
    alarms: [],
    alarmClears: [],
    keepAwake: [],
    releaseKeepAwake: 0,
    windowUpdates: [],
    tabUpdates: [],
    tabCreates: [],
    tabMessages: [],
    runtimeMessages: []
  };
  const windows = new Map(options.windows || [[7, { id: 7, state: 'normal', focused: true }]]);
  const tabs = new Map(options.tabs || [[11, { id: 11, windowId: 7, active: true, url: 'https://example.test/' }]]);
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
    URL,
    Promise,
    setTimeout,
    clearTimeout,
    chrome: {
      runtime: {
        getURL: (targetPath) => `chrome-extension://unit-test/${targetPath}`,
        sendMessage: async (message) => {
          calls.runtimeMessages.push(message);
          return { ok: true };
        }
      },
      storage: {
        local: {
          get: async (keys) => {
            if (!keys) return { ...storage };
            if (typeof keys === 'string') return { [keys]: storage[keys] };
            if (Array.isArray(keys)) {
              return keys.reduce((out, key) => {
                out[key] = storage[key];
                return out;
              }, {});
            }
            return Object.keys(keys).reduce((out, key) => {
              out[key] = Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : keys[key];
              return out;
            }, {});
          },
          set: async (values) => {
            Object.assign(storage, values || {});
          },
          remove: async (keys) => {
            const list = Array.isArray(keys) ? keys : [keys];
            list.forEach((key) => delete storage[key]);
          }
        }
      },
      windows: {
        getLastFocused: async () => options.focusedWindow || windows.get(7),
        get: async (windowId) => windows.get(windowId),
        update: async (windowId, updateInfo) => {
          calls.windowUpdates.push({ windowId, updateInfo });
          const current = windows.get(windowId) || { id: windowId };
          const next = { ...current, ...updateInfo };
          windows.set(windowId, next);
          return next;
        }
      },
      tabs: {
        query: async (queryInfo = {}) => {
          let list = Array.from(tabs.values());
          if (queryInfo.windowId !== undefined) list = list.filter((tab) => tab.windowId === queryInfo.windowId);
          if (queryInfo.active !== undefined) list = list.filter((tab) => Boolean(tab.active) === Boolean(queryInfo.active));
          return list;
        },
        get: async (tabId) => {
          if (!tabs.has(tabId)) throw new Error('No tab');
          return tabs.get(tabId);
        },
        create: async (payload) => {
          const id = 100 + calls.tabCreates.length;
          const tab = { id, windowId: payload.windowId || 7, active: Boolean(payload.active), url: payload.url };
          tabs.set(id, tab);
          calls.tabCreates.push(payload);
          return tab;
        },
        update: async (tabId, updateInfo) => {
          calls.tabUpdates.push({ tabId, updateInfo });
          const tab = tabs.get(tabId) || { id: tabId, windowId: 7 };
          const next = { ...tab, ...updateInfo };
          tabs.set(tabId, next);
          return next;
        },
        reload: async () => {},
        sendMessage: async (tabId, message) => {
          calls.tabMessages.push({ tabId, message });
          return { ok: true };
        }
      },
      alarms: {
        create: async (name, info) => {
          calls.alarms.push({ name, info });
        },
        clear: async (name) => {
          calls.alarmClears.push(name);
          return true;
        }
      },
      power: {
        requestKeepAwake: (level) => calls.keepAwake.push(level),
        releaseKeepAwake: () => {
          calls.releaseKeepAwake += 1;
        }
      },
      scripting: {
        executeScript: async () => [{ result: true }]
      }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context);
  return { api: context.DASHBOARD_CONTROLLER, storage, calls, windows, tabs };
}

test('dashboard defaults expose one map slot and five external slots', () => {
  const { api } = loadController();
  const settings = api.getDefaultDashboardSettings();

  assert.equal(settings.keepAwakeLevel, 'display');
  assert.equal(settings.autoResumeAfterBrowserRestart, false);
  assert.equal(settings.slots.length, 6);
  assert.equal(settings.slots[0].type, 'extension-map');
  assert.equal(settings.slots[0].enabled, true);
  assert.equal(settings.slots.filter((slot) => slot.type === 'external').length, 5);
  assert.equal(settings.slots.find((slot) => slot.id === 'windy').url, 'https://www.windy.com/');
});

test('settings validation rejects unsupported external URL schemes and out-of-range timing', () => {
  const { api } = loadController();
  const settings = api.getDefaultDashboardSettings();
  settings.mouseJiggleIntervalMinutes = 2;
  settings.slots[1].url = 'javascript:alert(1)';
  settings.slots[1].waitSeconds = 601;

  const result = api.validateDashboardSettings(settings);

  assert.equal(result.ok, false);
  assert(result.errors.some((item) => item.code === 'UNSUPPORTED_URL_SCHEME'));
  assert(result.errors.some((item) => item.code === 'WAIT_SECONDS_RANGE'));
  assert(result.errors.some((item) => item.code === 'MOUSE_INTERVAL_RANGE'));
});

test('slot selection skips disabled and zero-second slots', () => {
  const { api } = loadController();
  const settings = api.getDefaultDashboardSettings();
  settings.slots[0].waitSeconds = 0;
  settings.slots[1].enabled = false;
  settings.slots[2].enabled = true;
  settings.slots[2].waitSeconds = 120;

  assert.equal(api.findNextEnabledSlot(settings, 0), 2);
});

test('resolveDashboardSlotUrl builds map URL from runtime instead of storage URL', () => {
  const { api } = loadController();
  const settings = api.getDefaultDashboardSettings();
  settings.slots[0].url = 'chrome-extension://stale-id/map-modern.html';

  assert.equal(api.resolveDashboardSlotUrl(settings.slots[0]), 'chrome-extension://unit-test/map-modern.html');
});

test('start and stop dashboard use fullscreen, active tab switching, alarms and power cleanup', async () => {
  const { api, storage, calls } = loadController({
    tabs: [
      [11, { id: 11, windowId: 7, active: true, url: 'https://operator.local/' }],
      [12, { id: 12, windowId: 7, active: false, url: 'chrome-extension://unit-test/map-modern.html' }],
      [13, { id: 13, windowId: 7, active: false, url: 'https://www.windy.com/' }],
      [14, { id: 14, windowId: 7, active: false, url: 'https://testritm.teias.gov.tr/' }]
    ]
  });

  const started = await api.startDashboard();
  assert.equal(started.ok, true);
  assert.equal(storage.dashboardRuntime.running, true);
  assert.deepEqual(calls.keepAwake, ['display']);
  assert(calls.windowUpdates.some((call) => call.updateInfo.state === 'fullscreen'));
  assert(calls.tabUpdates.some((call) => call.tabId === 12 && call.updateInfo.active === true));
  assert(calls.alarms.some((call) => call.name === api.DASHBOARD_SWITCH_ALARM));
  assert(calls.alarms.some((call) => call.name === api.DASHBOARD_FULLSCREEN_CHECK_ALARM));
  assert(calls.tabMessages.some((call) => call.message.type === 'DASHBOARD_MAP_SLOT_ACTIVE'));

  const stopped = await api.stopDashboard('test-stop');
  assert.equal(stopped.ok, true);
  assert.equal(storage.dashboardRuntime.running, false);
  assert.equal(storage.dashboardRuntime.stopReason, 'test-stop');
  assert.equal(calls.releaseKeepAwake, 1);
  assert(calls.alarmClears.includes(api.DASHBOARD_SWITCH_ALARM));
  assert(calls.alarmClears.includes(api.DASHBOARD_FULLSCREEN_CHECK_ALARM));
});

test('recoverRuntimeStateOnStartup safely cleans old running state and releases keep awake', async () => {
  const { api, storage, calls } = loadController({
    storage: {
      dashboardRuntime: {
        ...loadController().api.getDefaultDashboardRuntime(),
        running: true,
        status: 'running',
        windowId: 7,
        keepAwakeRequested: true
      }
    }
  });

  const recovered = await api.recoverRuntimeStateOnStartup();

  assert.equal(recovered.ok, true);
  assert.equal(storage.dashboardRuntime.running, false);
  assert.equal(storage.dashboardRuntime.stopReason, 'service-worker-recovered');
  assert.equal(calls.releaseKeepAwake, 1);
});
