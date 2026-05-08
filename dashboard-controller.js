(function (root, factory) {
  const api = factory(root);
  root.DASHBOARD_CONTROLLER = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const DASHBOARD_SETTINGS_KEY = 'dashboardSettings';
  const DASHBOARD_RUNTIME_KEY = 'dashboardRuntime';
  const DASHBOARD_LOGS_KEY = 'dashboardLogs';
  const DASHBOARD_SWITCH_ALARM = 'dashboard.switch';
  const DASHBOARD_MOUSE_JIGGLE_ALARM = 'dashboard.mouseJiggle';
  const DASHBOARD_FULLSCREEN_CHECK_ALARM = 'dashboard.fullscreenCheck';
  const SCADA_BACKGROUND_REFRESH_ALARM = 'scada.backgroundRefresh';
  const MAX_LOGS = 100;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getChrome() {
    if (!root.chrome) throw new Error('Chrome extension API bulunamadi.');
    return root.chrome;
  }

  function getDefaultDashboardSettings() {
    return {
      schemaVersion: 1,
      enabled: false,
      fullscreenMode: 'browserWindow',
      keepAwakeEnabled: true,
      keepAwakeLevel: 'display',
      mouseJiggleEnabled: false,
      mouseJiggleIntervalMinutes: 10,
      stopOnEsc: true,
      stopOnFullscreenExit: true,
      openMissingTabs: true,
      reloadTabOnShow: false,
      restorePreviousWindowStateOnStop: true,
      restorePreviousActiveTabOnStop: true,
      autoResumeAfterBrowserRestart: false,
      scadaBackgroundRefreshEnabled: true,
      scadaBackgroundRefreshSeconds: 120,
      slots: [
        {
          id: 'map',
          label: 'SCADA Harita',
          type: 'extension-map',
          url: '',
          path: 'map-modern.html',
          matchPattern: 'map-modern.html',
          waitSeconds: 120,
          enabled: true,
          reloadOnShow: false
        },
        {
          id: 'windy',
          label: 'Windy',
          type: 'external',
          url: 'https://www.windy.com/',
          matchPattern: 'https://www.windy.com/*',
          waitSeconds: 120,
          enabled: true,
          reloadOnShow: false
        },
        {
          id: 'testritm',
          label: 'TEIAS Test RITM',
          type: 'external',
          url: 'https://testritm.teias.gov.tr/',
          matchPattern: 'https://testritm.teias.gov.tr/*',
          waitSeconds: 120,
          enabled: true,
          reloadOnShow: false
        },
        {
          id: 'slot4',
          label: 'Dashboard 4',
          type: 'external',
          url: '',
          matchPattern: '',
          waitSeconds: 120,
          enabled: false,
          reloadOnShow: false
        },
        {
          id: 'slot5',
          label: 'Dashboard 5',
          type: 'external',
          url: '',
          matchPattern: '',
          waitSeconds: 120,
          enabled: false,
          reloadOnShow: false
        },
        {
          id: 'slot6',
          label: 'Dashboard 6',
          type: 'external',
          url: '',
          matchPattern: '',
          waitSeconds: 120,
          enabled: false,
          reloadOnShow: false
        }
      ]
    };
  }

  function getDefaultDashboardRuntime() {
    return {
      schemaVersion: 1,
      running: false,
      status: 'stopped',
      startedAt: null,
      stoppedAt: null,
      stopReason: '',
      windowId: null,
      previousWindowState: null,
      previousActiveTabId: null,
      currentSlotIndex: 0,
      currentSlotId: '',
      currentSlotLabel: '',
      nextSwitchAt: null,
      resolvedTabs: {},
      skippedSlots: {},
      keepAwakeRequested: false,
      mouseJiggleActive: false,
      lastError: null,
      lastActivityAt: null,
      recoveredAt: null,
      cycleCount: 0
    };
  }

  function asBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function normalizeSlot(input, fallback) {
    const slot = { ...fallback, ...(input && typeof input === 'object' ? input : {}) };
    const normalized = {
      id: String(slot.id || fallback.id),
      label: String(slot.label || fallback.label),
      type: slot.type === 'extension-map' ? 'extension-map' : 'external',
      url: String(slot.url || '').trim(),
      path: String(slot.path || fallback.path || ''),
      matchPattern: String(slot.matchPattern || '').trim(),
      waitSeconds: Number(slot.waitSeconds),
      enabled: asBoolean(slot.enabled, fallback.enabled),
      reloadOnShow: asBoolean(slot.reloadOnShow, fallback.reloadOnShow)
    };
    if (!Number.isFinite(normalized.waitSeconds)) normalized.waitSeconds = fallback.waitSeconds;
    if (normalized.type === 'external' && !normalized.url) normalized.enabled = false;
    if (normalized.type === 'extension-map') {
      normalized.url = '';
      normalized.path = normalized.path || 'map-modern.html';
    }
    return normalized;
  }

  function normalizeDashboardSettings(settings) {
    const defaults = getDefaultDashboardSettings();
    const input = settings && typeof settings === 'object' ? settings : {};
    const normalized = {
      ...defaults,
      ...input,
      schemaVersion: 1,
      enabled: asBoolean(input.enabled, defaults.enabled),
      keepAwakeEnabled: asBoolean(input.keepAwakeEnabled, defaults.keepAwakeEnabled),
      keepAwakeLevel: input.keepAwakeLevel === 'system' ? 'system' : 'display',
      mouseJiggleEnabled: asBoolean(input.mouseJiggleEnabled, defaults.mouseJiggleEnabled),
      mouseJiggleIntervalMinutes: Number(input.mouseJiggleIntervalMinutes ?? defaults.mouseJiggleIntervalMinutes),
      stopOnEsc: asBoolean(input.stopOnEsc, defaults.stopOnEsc),
      stopOnFullscreenExit: asBoolean(input.stopOnFullscreenExit, defaults.stopOnFullscreenExit),
      openMissingTabs: asBoolean(input.openMissingTabs, defaults.openMissingTabs),
      reloadTabOnShow: asBoolean(input.reloadTabOnShow, defaults.reloadTabOnShow),
      restorePreviousWindowStateOnStop: asBoolean(input.restorePreviousWindowStateOnStop, defaults.restorePreviousWindowStateOnStop),
      restorePreviousActiveTabOnStop: asBoolean(input.restorePreviousActiveTabOnStop, defaults.restorePreviousActiveTabOnStop),
      autoResumeAfterBrowserRestart: asBoolean(input.autoResumeAfterBrowserRestart, defaults.autoResumeAfterBrowserRestart),
      scadaBackgroundRefreshEnabled: asBoolean(input.scadaBackgroundRefreshEnabled, defaults.scadaBackgroundRefreshEnabled),
      scadaBackgroundRefreshSeconds: Number(input.scadaBackgroundRefreshSeconds ?? defaults.scadaBackgroundRefreshSeconds)
    };
    const providedSlots = Array.isArray(input.slots) ? input.slots : [];
    normalized.slots = defaults.slots.map((slot, index) => normalizeSlot(providedSlots[index], slot));
    return normalized;
  }

  function pushError(errors, code, message, detail) {
    errors.push({ code, message, detail: detail || {} });
  }

  function validateExternalUrl(slot, errors) {
    if (!slot.url) return;
    let parsed;
    try {
      parsed = new URL(slot.url);
    } catch {
      pushError(errors, 'INVALID_URL', `${slot.label} URL gecersiz.`, { slotId: slot.id });
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      pushError(errors, 'UNSUPPORTED_URL_SCHEME', `${slot.label} icin yalniz http/https URL kullanilabilir.`, {
        slotId: slot.id,
        protocol: parsed.protocol
      });
    }
  }

  function validateDashboardSettings(settings) {
    const normalized = normalizeDashboardSettings(settings);
    const errors = [];
    const warnings = [];
    if (!Number.isFinite(normalized.mouseJiggleIntervalMinutes)
      || normalized.mouseJiggleIntervalMinutes < 3
      || normalized.mouseJiggleIntervalMinutes > 15) {
      pushError(errors, 'MOUSE_INTERVAL_RANGE', 'Fare hareketi araligi 3-15 dakika arasinda olmali.');
    }
    if (!Number.isFinite(normalized.scadaBackgroundRefreshSeconds)
      || normalized.scadaBackgroundRefreshSeconds < 30
      || normalized.scadaBackgroundRefreshSeconds > 600) {
      pushError(errors, 'SCADA_REFRESH_RANGE', 'SCADA arka plan yenileme suresi 30-600 saniye arasinda olmali.');
    }
    normalized.slots.forEach((slot) => {
      if (!Number.isFinite(slot.waitSeconds) || slot.waitSeconds < 0 || slot.waitSeconds > 600) {
        pushError(errors, 'WAIT_SECONDS_RANGE', `${slot.label} bekleme suresi 0-600 saniye arasinda olmali.`, { slotId: slot.id });
      }
      if (slot.waitSeconds > 0 && slot.waitSeconds < 30) {
        warnings.push({
          code: 'BEST_EFFORT_ALARM',
          message: `${slot.label} 30 saniye altinda best-effort calisir.`,
          detail: { slotId: slot.id }
        });
      }
      if (slot.type === 'external') validateExternalUrl(slot, errors);
    });
    if (!normalized.slots.some((slot) => slot.enabled && slot.waitSeconds > 0)) {
      pushError(errors, 'NO_ENABLED_SLOTS', 'Dashboard icin en az bir aktif slot gerekli.');
    }
    return { ok: errors.length === 0, settings: normalized, errors, warnings };
  }

  async function loadDashboardSettings() {
    const chromeApi = getChrome();
    const stored = await chromeApi.storage.local.get(DASHBOARD_SETTINGS_KEY);
    return normalizeDashboardSettings(stored?.[DASHBOARD_SETTINGS_KEY]);
  }

  async function saveDashboardSettings(settings) {
    const validation = validateDashboardSettings(settings);
    if (!validation.ok) return validation;
    await getChrome().storage.local.set({ [DASHBOARD_SETTINGS_KEY]: validation.settings });
    await appendDashboardLog({ level: 'info', event: 'settings-saved', message: 'Dashboard ayarlari kaydedildi.' });
    return validation;
  }

  function normalizeDashboardRuntime(runtime) {
    return {
      ...getDefaultDashboardRuntime(),
      ...(runtime && typeof runtime === 'object' ? runtime : {}),
      schemaVersion: 1
    };
  }

  async function loadDashboardRuntime() {
    const stored = await getChrome().storage.local.get(DASHBOARD_RUNTIME_KEY);
    return normalizeDashboardRuntime(stored?.[DASHBOARD_RUNTIME_KEY]);
  }

  async function saveDashboardRuntime(runtimePatch) {
    const current = await loadDashboardRuntime();
    const next = normalizeDashboardRuntime({ ...current, ...(runtimePatch || {}) });
    await getChrome().storage.local.set({ [DASHBOARD_RUNTIME_KEY]: next });
    return next;
  }

  function redactValue(value) {
    if (value == null) return value;
    const text = String(value);
    return text
      .replace(/(authorization\s*[:=]\s*)bearer\s+[^&\s"]+/ig, '$1[redacted]')
      .replace(/([?&](?:token|access_token|auth|password)=)[^&\s"]+/ig, '$1[redacted]');
  }

  function sanitizeDetail(detail) {
    if (!detail || typeof detail !== 'object') return detail || {};
    const output = Array.isArray(detail) ? [] : {};
    Object.entries(detail).forEach(([key, value]) => {
      if (/token|cookie|authorization|password/i.test(key)) {
        output[key] = '[redacted]';
      } else if (value && typeof value === 'object') {
        output[key] = sanitizeDetail(value);
      } else if (typeof value === 'string') {
        output[key] = redactValue(value);
      } else {
        output[key] = value;
      }
    });
    return output;
  }

  async function appendDashboardLog(event) {
    try {
      const chromeApi = getChrome();
      const stored = await chromeApi.storage.local.get(DASHBOARD_LOGS_KEY);
      const logs = Array.isArray(stored?.[DASHBOARD_LOGS_KEY]) ? stored[DASHBOARD_LOGS_KEY].slice() : [];
      logs.push({
        at: Number(event?.at || Date.now()),
        level: event?.level || 'info',
        event: event?.event || 'dashboard',
        message: redactValue(event?.message || ''),
        detail: sanitizeDetail(event?.detail || {})
      });
      while (logs.length > MAX_LOGS) logs.shift();
      await chromeApi.storage.local.set({ [DASHBOARD_LOGS_KEY]: logs });
      return { ok: true };
    } catch (error) {
      console.warn('[Dashboard] Log yazilamadi.', error?.message || error);
      return { ok: false, error: error?.message || String(error) };
    }
  }

  function isSlotRunnable(slot) {
    return Boolean(slot?.enabled && Number(slot.waitSeconds) > 0);
  }

  function findNextEnabledSlot(settings, currentIndex) {
    const normalized = normalizeDashboardSettings(settings);
    const slots = normalized.slots;
    if (!slots.length) return -1;
    const start = Number.isFinite(Number(currentIndex)) ? Number(currentIndex) : -1;
    for (let offset = 1; offset <= slots.length; offset += 1) {
      const index = (start + offset + slots.length) % slots.length;
      if (isSlotRunnable(slots[index])) return index;
    }
    return -1;
  }

  function resolveDashboardSlotUrl(slot) {
    const normalized = normalizeSlot(slot, slot?.type === 'extension-map' ? getDefaultDashboardSettings().slots[0] : getDefaultDashboardSettings().slots[1]);
    if (normalized.type === 'extension-map') {
      return getChrome().runtime.getURL(normalized.path || 'map-modern.html');
    }
    return normalized.url;
  }

  function matchPatternToRegExp(pattern) {
    const escaped = String(pattern || '')
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  }

  function tabMatchesSlot(tab, slot) {
    const url = String(tab?.url || '');
    if (!url) return false;
    const targetUrl = resolveDashboardSlotUrl(slot);
    if (slot.type === 'extension-map') return url.split(/[?#]/)[0] === targetUrl.split(/[?#]/)[0];
    if (slot.matchPattern) {
      try {
        if (matchPatternToRegExp(slot.matchPattern).test(url)) return true;
      } catch {
      }
    }
    try {
      const target = new URL(targetUrl);
      const current = new URL(url);
      return target.origin === current.origin;
    } catch {
      return url === targetUrl;
    }
  }

  async function resolveMapSlotTab(windowId) {
    const slot = getDefaultDashboardSettings().slots[0];
    const chromeApi = getChrome();
    const tabs = await chromeApi.tabs.query({ windowId });
    const found = (tabs || []).find((tab) => tabMatchesSlot(tab, slot));
    if (found?.id) return found;
    return chromeApi.tabs.create({ windowId, url: resolveDashboardSlotUrl(slot), active: false });
  }

  async function resolveExternalSlotTab(slot, windowId, settings) {
    const chromeApi = getChrome();
    const tabs = await chromeApi.tabs.query({ windowId });
    const found = (tabs || []).find((tab) => tabMatchesSlot(tab, slot));
    if (found?.id) return found;
    if (!settings.openMissingTabs) return null;
    return chromeApi.tabs.create({ windowId, url: resolveDashboardSlotUrl(slot), active: false });
  }

  async function resolveDashboardTabs(settings, runtime) {
    const resolvedTabs = { ...(runtime.resolvedTabs || {}) };
    const skippedSlots = { ...(runtime.skippedSlots || {}) };
    for (const slot of settings.slots) {
      if (!isSlotRunnable(slot)) continue;
      try {
        const tab = slot.type === 'extension-map'
          ? await resolveMapSlotTab(runtime.windowId)
          : await resolveExternalSlotTab(slot, runtime.windowId, settings);
        if (tab?.id) {
          resolvedTabs[slot.id] = { tabId: tab.id, url: tab.url || resolveDashboardSlotUrl(slot), slotId: slot.id };
          delete skippedSlots[slot.id];
        } else {
          skippedSlots[slot.id] = 'Sekme bulunamadi ve otomatik acma kapali.';
        }
      } catch (error) {
        skippedSlots[slot.id] = error?.message || String(error);
        await appendDashboardLog({
          level: 'warn',
          event: 'slot-resolve-failed',
          message: `${slot.label} sekmesi cozumlenemedi.`,
          detail: { slotId: slot.id, error: skippedSlots[slot.id] }
        });
      }
    }
    return { resolvedTabs, skippedSlots };
  }

  async function ensureDashboardWindowFullscreen(runtime) {
    if (!runtime?.windowId) throw new Error('Dashboard penceresi bilinmiyor.');
    const chromeApi = getChrome();
    await chromeApi.windows.update(runtime.windowId, { state: 'fullscreen', focused: true });
    return chromeApi.windows.get(runtime.windowId);
  }

  async function startKeepAwake(settings) {
    if (!settings.keepAwakeEnabled) return false;
    const chromeApi = getChrome();
    if (!chromeApi.power?.requestKeepAwake) return false;
    chromeApi.power.requestKeepAwake(settings.keepAwakeLevel || 'display');
    return true;
  }

  async function stopKeepAwake() {
    const chromeApi = getChrome();
    if (chromeApi.power?.releaseKeepAwake) chromeApi.power.releaseKeepAwake();
    return true;
  }

  async function startMouseJiggleFallback(settings) {
    if (!settings.mouseJiggleEnabled) return false;
    const minutes = Math.min(15, Math.max(3, Number(settings.mouseJiggleIntervalMinutes || 10)));
    await getChrome().alarms?.create?.(DASHBOARD_MOUSE_JIGGLE_ALARM, { periodInMinutes: minutes });
    return true;
  }

  async function stopMouseJiggleFallback() {
    await getChrome().alarms?.clear?.(DASHBOARD_MOUSE_JIGGLE_ALARM);
  }

  async function scheduleFullscreenCheck() {
    await getChrome().alarms?.create?.(DASHBOARD_FULLSCREEN_CHECK_ALARM, { periodInMinutes: 0.5 });
  }

  async function scheduleScadaBackgroundRefresh(settings) {
    if (!settings.scadaBackgroundRefreshEnabled) return;
    const seconds = Math.min(600, Math.max(30, Number(settings.scadaBackgroundRefreshSeconds || 120)));
    await getChrome().alarms?.create?.(SCADA_BACKGROUND_REFRESH_ALARM, { periodInMinutes: seconds / 60 });
  }

  async function scheduleNextSwitch(runtime, settings) {
    const slot = settings.slots[runtime.currentSlotIndex];
    if (!slot || !isSlotRunnable(slot)) return runtime;
    const waitSeconds = Math.max(0, Number(slot.waitSeconds || 0));
    const nextSwitchAt = Date.now() + waitSeconds * 1000;
    const nextRuntime = await saveDashboardRuntime({ nextSwitchAt });
    if (waitSeconds > 0) {
      await getChrome().alarms?.create?.(DASHBOARD_SWITCH_ALARM, { delayInMinutes: waitSeconds / 60 });
    }
    return nextRuntime;
  }

  async function notifyDashboardStateChanged(runtime) {
    try {
      await getChrome().runtime?.sendMessage?.({ type: 'DASHBOARD_STATE_CHANGED', payload: runtime });
    } catch {
    }
  }

  async function sendMapSlotActive(tabId) {
    try {
      await getChrome().tabs.sendMessage(tabId, { type: 'DASHBOARD_MAP_SLOT_ACTIVE', payload: { at: Date.now() } });
    } catch (error) {
      await appendDashboardLog({
        level: 'warn',
        event: 'map-slot-message-failed',
        message: 'Harita dashboard gorunur mesaji gonderilemedi.',
        detail: { tabId, error: error?.message || String(error) }
      });
    }
  }

  async function installExternalEscListener(tabId) {
    const chromeApi = getChrome();
    if (!chromeApi.scripting?.executeScript) return;
    try {
      await chromeApi.scripting.executeScript({
        target: { tabId },
        func: () => {
          if (window.__TPYS_DASHBOARD_ESC_BOUND__) return true;
          window.__TPYS_DASHBOARD_ESC_BOUND__ = true;
          window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
              chrome.runtime.sendMessage({ type: 'DASHBOARD_STOP', reason: 'esc-external' });
            }
          }, true);
          return true;
        }
      });
    } catch (error) {
      await appendDashboardLog({
        level: 'warn',
        event: 'esc-inject-failed',
        message: 'Dis sekme ESC dinleyicisi eklenemedi.',
        detail: { tabId, error: error?.message || String(error) }
      });
    }
  }

  async function switchToSlot(slotIndexOrId) {
    const settings = await loadDashboardSettings();
    let runtime = await loadDashboardRuntime();
    if (!runtime.running) return { ok: false, error: 'Dashboard calismiyor.', runtime };
    let slotIndex = Number.isFinite(Number(slotIndexOrId)) ? Number(slotIndexOrId) : settings.slots.findIndex((slot) => slot.id === slotIndexOrId);
    if (slotIndex < 0 || !isSlotRunnable(settings.slots[slotIndex])) {
      slotIndex = findNextEnabledSlot(settings, runtime.currentSlotIndex);
    }
    if (slotIndex < 0) return stopDashboard('no-enabled-slots');
    const slot = settings.slots[slotIndex];
    const fullscreenCheck = await handleFullscreenExitCheck({ stopIfExited: true });
    if (fullscreenCheck?.stopped) return fullscreenCheck;

    let resolved = runtime.resolvedTabs?.[slot.id];
    try {
      if (!resolved?.tabId) {
        const tabs = await resolveDashboardTabs(settings, runtime);
        runtime = await saveDashboardRuntime(tabs);
        resolved = runtime.resolvedTabs?.[slot.id];
      } else {
        await getChrome().tabs.get(resolved.tabId);
      }
    } catch {
      const tabs = await resolveDashboardTabs(settings, runtime);
      runtime = await saveDashboardRuntime(tabs);
      resolved = runtime.resolvedTabs?.[slot.id];
    }
    if (!resolved?.tabId) {
      await appendDashboardLog({ level: 'warn', event: 'slot-skipped', message: `${slot.label} atlandi.`, detail: { slotId: slot.id } });
      return switchToSlot(findNextEnabledSlot(settings, slotIndex));
    }

    await getChrome().windows.update(runtime.windowId, { focused: true });
    await getChrome().tabs.update(resolved.tabId, { active: true });
    if (slot.reloadOnShow || settings.reloadTabOnShow) {
      try {
        await getChrome().tabs.reload(resolved.tabId);
      } catch {
      }
    }
    if (slot.type === 'extension-map') await sendMapSlotActive(resolved.tabId);
    else await installExternalEscListener(resolved.tabId);

    runtime = await saveDashboardRuntime({
      currentSlotIndex: slotIndex,
      currentSlotId: slot.id,
      currentSlotLabel: slot.label,
      lastActivityAt: Date.now(),
      cycleCount: Number(runtime.cycleCount || 0) + 1,
      lastError: null
    });
    runtime = await scheduleNextSwitch(runtime, settings);
    await appendDashboardLog({ level: 'info', event: 'slot-switched', message: `${slot.label} slot aktif edildi.`, detail: { slotId: slot.id } });
    await notifyDashboardStateChanged(runtime);
    return { ok: true, runtime };
  }

  async function getTargetWindow() {
    const chromeApi = getChrome();
    const focused = await chromeApi.windows.getLastFocused?.({ populate: true });
    if (focused?.id) return focused;
    const activeTabs = await chromeApi.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = activeTabs?.[0];
    if (tab?.windowId) return chromeApi.windows.get(tab.windowId);
    throw new Error('Aktif Chrome penceresi bulunamadi.');
  }

  async function startDashboard(options = {}) {
    const settings = await loadDashboardSettings();
    const validation = validateDashboardSettings(settings);
    if (!validation.ok) return { ok: false, error: validation.errors[0]?.message || 'Dashboard ayarlari gecersiz.', validation };
    if (!validation.settings.slots.some(isSlotRunnable)) return { ok: false, error: 'Dashboard icin aktif slot yok.', validation };
    const windowInfo = options.windowId ? await getChrome().windows.get(options.windowId) : await getTargetWindow();
    const activeTabs = await getChrome().tabs.query({ active: true, windowId: windowInfo.id });
    const activeTab = activeTabs?.[0] || null;
    let runtime = await saveDashboardRuntime({
      ...getDefaultDashboardRuntime(),
      running: true,
      status: 'running',
      startedAt: Date.now(),
      stoppedAt: null,
      stopReason: '',
      windowId: windowInfo.id,
      previousWindowState: windowInfo.state || null,
      previousActiveTabId: activeTab?.id || null,
      lastActivityAt: Date.now()
    });

    try {
      const tabs = await resolveDashboardTabs(validation.settings, runtime);
      runtime = await saveDashboardRuntime(tabs);
      await ensureDashboardWindowFullscreen(runtime, validation.settings);
      const keepAwakeRequested = await startKeepAwake(validation.settings).catch(async (error) => {
        await appendDashboardLog({
          level: 'warn',
          event: 'keep-awake-failed',
          message: 'Chrome power API istegi basarisiz oldu; dashboard devam ediyor.',
          detail: { error: error?.message || String(error) }
        });
        return false;
      });
      const mouseJiggleActive = await startMouseJiggleFallback(validation.settings);
      await scheduleFullscreenCheck();
      await scheduleScadaBackgroundRefresh(validation.settings);
      runtime = await saveDashboardRuntime({ keepAwakeRequested, mouseJiggleActive });
      const firstIndex = findNextEnabledSlot(validation.settings, -1);
      const switched = await switchToSlot(firstIndex);
      await appendDashboardLog({ level: 'info', event: 'dashboard-started', message: 'Dashboard baslatildi.', detail: { windowId: windowInfo.id } });
      return { ok: true, runtime: switched.runtime || await loadDashboardRuntime(), validation };
    } catch (error) {
      await saveDashboardRuntime({ lastError: error?.message || String(error) });
      await stopDashboard('start-error');
      return { ok: false, error: error?.message || String(error), validation };
    }
  }

  async function clearDashboardAlarms() {
    await Promise.all([
      getChrome().alarms?.clear?.(DASHBOARD_SWITCH_ALARM),
      getChrome().alarms?.clear?.(DASHBOARD_MOUSE_JIGGLE_ALARM),
      getChrome().alarms?.clear?.(DASHBOARD_FULLSCREEN_CHECK_ALARM),
      getChrome().alarms?.clear?.(SCADA_BACKGROUND_REFRESH_ALARM)
    ]);
  }

  async function stopDashboard(reason = 'stopped') {
    let runtime = await loadDashboardRuntime();
    const settings = await loadDashboardSettings();
    await clearDashboardAlarms();
    if (runtime.keepAwakeRequested) {
      try {
        await stopKeepAwake();
      } catch {
      }
    }
    await stopMouseJiggleFallback();

    if (settings.restorePreviousActiveTabOnStop && runtime.previousActiveTabId) {
      try {
        await getChrome().tabs.update(runtime.previousActiveTabId, { active: true });
      } catch {
      }
    }
    if (settings.restorePreviousWindowStateOnStop && runtime.windowId && runtime.previousWindowState) {
      try {
        await getChrome().windows.update(runtime.windowId, { state: runtime.previousWindowState });
      } catch {
      }
    }

    runtime = await saveDashboardRuntime({
      running: false,
      status: 'stopped',
      stoppedAt: Date.now(),
      stopReason: reason,
      nextSwitchAt: null,
      keepAwakeRequested: false,
      mouseJiggleActive: false,
      lastActivityAt: Date.now()
    });
    await appendDashboardLog({ level: 'info', event: 'dashboard-stopped', message: `Dashboard durduruldu: ${reason}`, detail: { reason } });
    await notifyDashboardStateChanged(runtime);
    return { ok: true, runtime };
  }

  async function recoverRuntimeStateOnStartup() {
    const runtime = await loadDashboardRuntime();
    if (!runtime.running) return { ok: true, runtime };
    const stopped = await stopDashboard('service-worker-recovered');
    const recovered = await saveDashboardRuntime({ recoveredAt: Date.now(), stopReason: 'service-worker-recovered' });
    await appendDashboardLog({ level: 'warn', event: 'runtime-recovered', message: 'Eski dashboard calisma durumu guvenli sekilde temizlendi.' });
    return { ok: true, runtime: recovered, stopped };
  }

  async function handleFullscreenExitCheck(options = {}) {
    const runtime = await loadDashboardRuntime();
    if (!runtime.running || !runtime.windowId) return { ok: true, runtime };
    const settings = await loadDashboardSettings();
    let windowInfo = null;
    try {
      windowInfo = await getChrome().windows.get(runtime.windowId);
    } catch (error) {
      return stopDashboard(`window-lost:${error?.message || 'unknown'}`);
    }
    if (windowInfo?.state === 'fullscreen') return { ok: true, runtime, windowInfo };
    if (settings.stopOnFullscreenExit !== false || options.stopIfExited) {
      const stopped = await stopDashboard('fullscreen-exit');
      return { ...stopped, stopped: true };
    }
    await ensureDashboardWindowFullscreen(runtime, settings);
    return { ok: true, runtime };
  }

  async function handleDashboardAlarm(alarm) {
    if (alarm?.name === DASHBOARD_SWITCH_ALARM) {
      const runtime = await loadDashboardRuntime();
      if (!runtime.running) return { ok: true, skipped: true };
      const settings = await loadDashboardSettings();
      if (runtime.nextSwitchAt && Date.now() < Number(runtime.nextSwitchAt)) {
        await getChrome().alarms?.create?.(DASHBOARD_SWITCH_ALARM, { delayInMinutes: Math.max(0.01, (Number(runtime.nextSwitchAt) - Date.now()) / 60000) });
        return { ok: true, rescheduled: true };
      }
      return switchToSlot(findNextEnabledSlot(settings, runtime.currentSlotIndex));
    }
    if (alarm?.name === DASHBOARD_FULLSCREEN_CHECK_ALARM) return handleFullscreenExitCheck();
    if (alarm?.name === DASHBOARD_MOUSE_JIGGLE_ALARM) return runMouseJiggleFallback();
    return { ok: true, ignored: true };
  }

  async function runMouseJiggleFallback() {
    const runtime = await loadDashboardRuntime();
    if (!runtime.running || !runtime.currentSlotId) return { ok: true, skipped: true };
    const tabId = runtime.resolvedTabs?.[runtime.currentSlotId]?.tabId;
    if (!tabId) return { ok: true, skipped: true };
    try {
      await getChrome().scripting?.executeScript?.({
        target: { tabId },
        func: () => {
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 1 }));
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 2, clientY: 2 }));
        }
      });
      await appendDashboardLog({ level: 'info', event: 'mouse-jiggle', message: 'Mouse fallback sentetik hareket denedi.', detail: { tabId } });
      return { ok: true };
    } catch (error) {
      await appendDashboardLog({ level: 'warn', event: 'mouse-jiggle-failed', message: 'Mouse fallback basarisiz oldu.', detail: { tabId, error: error?.message || String(error) } });
      return { ok: false, error: error?.message || String(error) };
    }
  }

  async function handleEscStop(source) {
    return stopDashboard(source || 'esc');
  }

  async function handleRuntimeMessage(message) {
    if (message?.type === 'DASHBOARD_START') return startDashboard(message.payload || {});
    if (message?.type === 'DASHBOARD_STOP') return stopDashboard(message.reason || message.payload?.reason || 'popup-stop');
    if (message?.type === 'DASHBOARD_GET_STATE') {
      return { ok: true, runtime: await loadDashboardRuntime(), settings: await loadDashboardSettings() };
    }
    if (message?.type === 'DASHBOARD_GET_SETTINGS') return { ok: true, settings: await loadDashboardSettings(), runtime: await loadDashboardRuntime() };
    if (message?.type === 'DASHBOARD_SAVE_SETTINGS') return saveDashboardSettings(message.payload || {});
    if (message?.type === 'DASHBOARD_VALIDATE_SETTINGS') return validateDashboardSettings(message.payload || {});
    return null;
  }

  return {
    DASHBOARD_SETTINGS_KEY,
    DASHBOARD_RUNTIME_KEY,
    DASHBOARD_LOGS_KEY,
    DASHBOARD_SWITCH_ALARM,
    DASHBOARD_MOUSE_JIGGLE_ALARM,
    DASHBOARD_FULLSCREEN_CHECK_ALARM,
    SCADA_BACKGROUND_REFRESH_ALARM,
    getDefaultDashboardSettings,
    getDefaultDashboardRuntime,
    normalizeDashboardSettings,
    validateDashboardSettings,
    loadDashboardSettings,
    saveDashboardSettings,
    loadDashboardRuntime,
    saveDashboardRuntime,
    appendDashboardLog,
    startDashboard,
    stopDashboard,
    recoverRuntimeStateOnStartup,
    resolveDashboardTabs,
    resolveMapSlotTab,
    resolveExternalSlotTab,
    resolveDashboardSlotUrl,
    ensureDashboardWindowFullscreen,
    switchToSlot,
    findNextEnabledSlot,
    scheduleNextSwitch,
    handleDashboardAlarm,
    startKeepAwake,
    stopKeepAwake,
    startMouseJiggleFallback,
    stopMouseJiggleFallback,
    handleEscStop,
    handleFullscreenExitCheck,
    notifyDashboardStateChanged,
    handleRuntimeMessage
  };
});
