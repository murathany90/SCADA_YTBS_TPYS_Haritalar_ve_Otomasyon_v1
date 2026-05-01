(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_STORAGE = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const KEYS = {
    filters: 'rgdhLastFilters',
    summary: 'rgdhLastSummary',
    preferences: 'rgdhUserPreferences'
  };

  const memory = {};

  async function get(key, fallback = null) {
    const storage = root.chrome?.storage?.local;
    if (!storage?.get) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
    const result = await storage.get(key);
    return Object.prototype.hasOwnProperty.call(result, key) ? result[key] : fallback;
  }

  async function set(key, value) {
    const storage = root.chrome?.storage?.local;
    if (!storage?.set) {
      memory[key] = value;
      return;
    }
    await storage.set({ [key]: value });
  }

  function loadFilters() {
    return get(KEYS.filters, {});
  }

  function saveFilters(filters) {
    return set(KEYS.filters, sanitizePlainObject(filters || {}));
  }

  function loadPreferences() {
    return get(KEYS.preferences, {
      theme: 'dark',
      pageSize: 100,
      defaultDateMode: 'today'
    });
  }

  function saveSummary(summary) {
    return set(KEYS.summary, sanitizePlainObject(summary || {}));
  }

  function sanitizePlainObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  return {
    KEYS,
    get,
    set,
    loadFilters,
    saveFilters,
    loadPreferences,
    saveSummary
  };
});
