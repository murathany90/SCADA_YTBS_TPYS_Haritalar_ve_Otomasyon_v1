const SETTINGS_FIELDS = [
  'keepAwakeEnabled',
  'stopOnEsc',
  'stopOnFullscreenExit',
  'openMissingTabs',
  'restorePreviousWindowStateOnStop',
  'restorePreviousActiveTabOnStop',
  'reloadTabOnShow',
  'scadaBackgroundRefreshEnabled',
  'scadaBackgroundRefreshSeconds',
  'mouseJiggleEnabled',
  'mouseJiggleIntervalMinutes'
];

const el = {
  slots: document.getElementById('dashboardSlots'),
  status: document.getElementById('dashboardSettingsStatus'),
  save: document.getElementById('btnDashboardSettingsSave'),
  reset: document.getElementById('btnDashboardSettingsReset'),
  validate: document.getElementById('btnDashboardSettingsValidate')
};

const state = {
  settings: null
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  await loadSettings();
}

function bindEvents() {
  el.save.addEventListener('click', saveSettings);
  el.reset.addEventListener('click', resetSettings);
  el.validate.addEventListener('click', validateSettings);
}

async function loadSettings() {
  try {
    const response = await sendRuntimeMessage({ type: 'DASHBOARD_GET_SETTINGS' });
    if (!response?.ok) throw new Error(response?.error || 'Ayarlar alinamadi.');
    state.settings = response.settings;
    renderSettings();
    logStatus('Ayarlar yüklendi.');
  } catch (error) {
    logStatus(`Ayarlar yüklenemedi: ${error.message}`);
  }
}

function renderSettings() {
  const settings = state.settings || {};
  SETTINGS_FIELDS.forEach((field) => {
    const input = document.getElementById(field);
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(settings[field]);
    else input.value = settings[field] ?? '';
  });
  renderSlots(settings.slots || []);
}

function renderSlots(slots) {
  el.slots.innerHTML = '';
  slots.forEach((slot, index) => {
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.dataset.index = String(index);
    const isMap = slot.type === 'extension-map';
    row.innerHTML = `
      <label><input data-slot-field="enabled" type="checkbox" ${slot.enabled ? 'checked' : ''}> Aktif</label>
      <span class="slot-type">${isMap ? 'Harita' : 'Dış sekme'}</span>
      <input data-slot-field="label" type="text" value="${escapeAttr(slot.label || '')}" aria-label="Slot etiketi">
      <input data-slot-field="url" type="url" value="${escapeAttr(slot.url || '')}" ${isMap ? 'disabled' : ''} aria-label="Slot URL">
      <input data-slot-field="matchPattern" type="text" value="${escapeAttr(slot.matchPattern || '')}" ${isMap ? 'disabled' : ''} aria-label="Match pattern">
      <input data-slot-field="waitSeconds" type="number" min="0" max="600" value="${Number(slot.waitSeconds || 0)}" aria-label="Bekleme saniyesi">
      <label><input data-slot-field="reloadOnShow" type="checkbox" ${slot.reloadOnShow ? 'checked' : ''}> Yenile</label>
    `;
    el.slots.appendChild(row);
  });
}

function readSettingsFromForm() {
  const current = state.settings || {};
  const next = {
    ...current,
    keepAwakeEnabled: document.getElementById('keepAwakeEnabled').checked,
    stopOnEsc: document.getElementById('stopOnEsc').checked,
    stopOnFullscreenExit: document.getElementById('stopOnFullscreenExit').checked,
    openMissingTabs: document.getElementById('openMissingTabs').checked,
    restorePreviousWindowStateOnStop: document.getElementById('restorePreviousWindowStateOnStop').checked,
    restorePreviousActiveTabOnStop: document.getElementById('restorePreviousActiveTabOnStop').checked,
    reloadTabOnShow: document.getElementById('reloadTabOnShow').checked,
    scadaBackgroundRefreshEnabled: document.getElementById('scadaBackgroundRefreshEnabled').checked,
    scadaBackgroundRefreshSeconds: Number(document.getElementById('scadaBackgroundRefreshSeconds').value),
    mouseJiggleEnabled: document.getElementById('mouseJiggleEnabled').checked,
    mouseJiggleIntervalMinutes: Number(document.getElementById('mouseJiggleIntervalMinutes').value),
    slots: readSlotsFromForm()
  };
  return next;
}

function readSlotsFromForm() {
  return Array.from(el.slots.querySelectorAll('.slot-row')).map((row, index) => {
    const current = state.settings.slots[index] || {};
    const readField = (field) => row.querySelector(`[data-slot-field="${field}"]`);
    return {
      ...current,
      enabled: readField('enabled').checked,
      label: readField('label').value.trim(),
      url: current.type === 'extension-map' ? '' : readField('url').value.trim(),
      matchPattern: current.type === 'extension-map' ? current.matchPattern : readField('matchPattern').value.trim(),
      waitSeconds: Number(readField('waitSeconds').value),
      reloadOnShow: readField('reloadOnShow').checked
    };
  });
}

async function saveSettings() {
  const settings = readSettingsFromForm();
  const response = await sendRuntimeMessage({ type: 'DASHBOARD_SAVE_SETTINGS', payload: settings });
  if (!response?.ok) {
    logValidation(response);
    return;
  }
  state.settings = response.settings;
  renderSettings();
  logStatus('Ayarlar kaydedildi.');
}

async function validateSettings() {
  const response = await sendRuntimeMessage({ type: 'DASHBOARD_VALIDATE_SETTINGS', payload: readSettingsFromForm() });
  logValidation(response);
}

async function resetSettings() {
  const response = await sendRuntimeMessage({ type: 'DASHBOARD_GET_SETTINGS' });
  if (!response?.ok) {
    logStatus(response?.error || 'Varsayilanlar alinamadi.');
    return;
  }
  state.settings = {
    ...response.settings,
    slots: response.settings.slots.map((slot, index) => {
      if (index < 3) return { ...slot, enabled: true, waitSeconds: 120 };
      return { ...slot, enabled: false, url: '', matchPattern: '', waitSeconds: 120 };
    })
  };
  renderSettings();
  logStatus('Form varsayılan dashboard slotlarına döndürüldü. Kaydetmek için Kaydet düğmesini kullanın.');
}

function logValidation(response) {
  if (!response) {
    logStatus('Validasyon yaniti alinamadi.');
    return;
  }
  const lines = [];
  if (response.ok) lines.push('Ayarlar geçerli.');
  (response.errors || []).forEach((item) => lines.push(`HATA ${item.code}: ${item.message}`));
  (response.warnings || []).forEach((item) => lines.push(`UYARI ${item.code}: ${item.message}`));
  logStatus(lines.join('\n') || 'Validasyon tamamlandi.');
}

function logStatus(message) {
  el.status.textContent = message || '';
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
