(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TPYS_CSV_PLANNER = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const ROOT_DIR = 'TPYS_CSV_Standartlastirilmis';

  function createTpysCsvPlanner(options = {}) {
    const previousIndex = { ...(options.previousIndex || {}) };
    const reservedIndex = { ...previousIndex };
    const standardizer = root.TPYS_CSV_STANDARDIZER || tryRequireStandardizer();

    function planTargets(standard, planOptions = {}) {
      const skipDuplicateContent = planOptions.skipDuplicateContent !== false;
      const safePlantName = String(standard.safePlantName || 'TPYS_CSV');
      const displayDate = String(standard.displayDate || '01.01.1970');
      const baseFilename = `${safePlantName}_${displayDate}.csv`;
      const desired = [
        {
          kind: 'station-month',
          path: `${ROOT_DIR}/${safePlantName}_${standard.monthYearFolderSuffix}/${baseFilename}`
        },
        {
          kind: 'rgdh-day',
          path: `${ROOT_DIR}/RGDH_GUN_${standard.dayFolderSuffix}/${baseFilename}`
        }
      ];

      const targets = desired.map((target) => {
        const planned = resolveTargetPath(target.path, standard.sha256 || '', skipDuplicateContent);
        return {
          ...target,
          ...planned,
          sha256: standard.sha256 || '',
          warnings: Array.isArray(standard.warnings) ? [...standard.warnings] : []
        };
      });

      return { targets };
    }

    function resolveTargetPath(path, hash, skipDuplicateContent) {
      const existingHash = reservedIndex[path];
      if (hash && existingHash && existingHash === hash && skipDuplicateContent) {
        return { path, action: 'duplicate', duplicateOf: path };
      }
      if (!existingHash || (hash && existingHash === hash && !skipDuplicateContent)) {
        reservedIndex[path] = hash || `planned:${Date.now()}`;
        return { path, action: 'download' };
      }

      const parts = splitPath(path);
      for (let index = 1; index < 1000; index += 1) {
        const filename = standardizer.withConflictSuffix(parts.filename, index);
        const candidate = `${parts.dir}/${filename}`;
        const candidateHash = reservedIndex[candidate];
        if (hash && candidateHash && candidateHash === hash && skipDuplicateContent) {
          return { path: candidate, action: 'duplicate', duplicateOf: candidate };
        }
        if (!candidateHash) {
          reservedIndex[candidate] = hash || `planned:${Date.now()}:${index}`;
          return { path: candidate, action: 'download', conflictSuffix: index };
        }
      }
      return { path, action: 'error', reason: 'CONFLICT_SUFFIX_EXHAUSTED' };
    }

    function recordSuccess(path, hash) {
      if (path && hash) {
        reservedIndex[path] = hash;
        previousIndex[path] = hash;
      }
    }

    function getIndex() {
      return { ...previousIndex };
    }

    return { planTargets, recordSuccess, getIndex };
  }

  function splitPath(path) {
    const index = String(path || '').lastIndexOf('/');
    if (index < 0) return { dir: '', filename: path };
    return { dir: path.slice(0, index), filename: path.slice(index + 1) };
  }

  function tryRequireStandardizer() {
    if (typeof require === 'function') return require('./tpys-csv-standardizer.js');
    return { withConflictSuffix: (filename, index) => `${filename}__${index}` };
  }

  return {
    ROOT_DIR,
    createTpysCsvPlanner
  };
});
