(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_RAW_PAGINATION = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const NO_DATE_KEY = '__NO_DATE__';
  const NO_DATE_LABEL = 'Tarihsiz';

  function buildRawDatePages(rows) {
    const grouped = new Map();
    (rows || []).forEach((row) => {
      const key = rawDateKey(row);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: key === NO_DATE_KEY ? NO_DATE_LABEL : key,
          rows: []
        });
      }
      grouped.get(key).rows.push(row);
    });
    return [...grouped.values()]
      .sort(comparePages)
      .map((page, index) => ({
        ...page,
        index,
        rowCount: page.rows.length
      }));
  }

  function resolveRawPage(pages, preferredKey) {
    const list = Array.isArray(pages) ? pages : [];
    if (!list.length) return null;
    return list.find((page) => page.key === preferredKey) || list[0];
  }

  function moveRawPage(pages, currentKey, action) {
    const list = Array.isArray(pages) ? pages : [];
    if (!list.length) return null;
    const current = resolveRawPage(list, currentKey);
    const currentIndex = Math.max(0, list.findIndex((page) => page.key === current?.key));
    const lastIndex = list.length - 1;
    const nextIndex = {
      first: 0,
      prev: Math.max(0, currentIndex - 1),
      next: Math.min(lastIndex, currentIndex + 1),
      last: lastIndex
    }[action] ?? currentIndex;
    return list[nextIndex]?.key || current?.key || null;
  }

  function rawDateKey(row) {
    const candidates = [
      row?.localDate,
      row?.measurementDateLocal,
      row?.measurementDateUtc
    ];
    for (const candidate of candidates) {
      const match = String(candidate || '').match(/^\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    return NO_DATE_KEY;
  }

  function comparePages(a, b) {
    if (a.key === NO_DATE_KEY && b.key !== NO_DATE_KEY) return 1;
    if (b.key === NO_DATE_KEY && a.key !== NO_DATE_KEY) return -1;
    return String(a.key).localeCompare(String(b.key));
  }

  return {
    NO_DATE_KEY,
    buildRawDatePages,
    resolveRawPage,
    moveRawPage,
    rawDateKey
  };
});
