(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TPYS_CSV_AUTOMATION_CORE = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  function parseIsoDate(value) {
    const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (date.getUTCFullYear() !== Number(match[1])) return null;
    if (date.getUTCMonth() !== Number(match[2]) - 1) return null;
    if (date.getUTCDate() !== Number(match[3])) return null;
    return date;
  }

  function enumerateInclusiveDateRange(startDate, endDate) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate || startDate);
    if (!start || !end) return [];
    const low = start <= end ? start : end;
    const high = start <= end ? end : start;
    const dates = [];
    for (let current = new Date(low.getTime()); current <= high; current.setUTCDate(current.getUTCDate() + 1)) {
      dates.push(toIsoDate(current));
    }
    return dates;
  }

  function toIsoDate(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function formatIsoDateForTpys(value) {
    const date = parseIsoDate(value);
    if (!date) return '';
    return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${date.getUTCFullYear()}`;
  }

  function summarizeTpysCsvRun(items = []) {
    return items.reduce((summary, item) => {
      const targets = Array.isArray(item?.targets) ? item.targets : [];
      const targetFailures = targets.filter((target) => target.status === 'error').length;
      const targetSuccesses = targets.filter((target) => target.status === 'downloaded').length;
      const duplicates = targets.filter((target) => target.status === 'duplicate').length;
      summary.targetSuccessCount += targetSuccesses;
      summary.targetFailureCount += targetFailures;
      summary.duplicateCount += duplicates;
      if (item?.ok && targetFailures === 0 && (targetSuccesses > 0 || duplicates > 0)) summary.successCount += 1;
      else summary.failureCount += 1;
      return summary;
    }, {
      successCount: 0,
      failureCount: 0,
      duplicateCount: 0,
      targetSuccessCount: 0,
      targetFailureCount: 0
    });
  }

  return {
    enumerateInclusiveDateRange,
    formatIsoDateForTpys,
    summarizeTpysCsvRun
  };
});
