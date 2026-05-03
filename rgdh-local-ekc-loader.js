(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_LOCAL_EKC_LOADER = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const DB_NAME = 'rgdhLocalEkcDirectoryDb';
  const STORE_NAME = 'handles';
  const DIRECTORY_HANDLE_KEY = 'rgdhLocalEkcDirectoryHandle';

  async function getLocalEkcDirectoryHandle(options = {}) {
    const env = options.root || root;
    const storedHandle = await readStoredDirectoryHandle(env);
    if (storedHandle && await verifyDirectoryPermission(storedHandle, false)) {
      return { directoryHandle: storedHandle, source: 'stored' };
    }
    if (typeof env.showDirectoryPicker !== 'function') {
      const error = new Error('Local klasor secimi bu tarayicida desteklenmiyor.');
      error.code = 'DIRECTORY_PICKER_UNSUPPORTED';
      throw error;
    }
    const directoryHandle = await env.showDirectoryPicker({
      id: 'rgdh-local-ekc',
      mode: 'read',
      startIn: 'downloads'
    });
    if (!await verifyDirectoryPermission(directoryHandle, false)) {
      const error = new Error('Local Ek-C klasoru icin okuma izni verilmedi.');
      error.code = 'DIRECTORY_PERMISSION_DENIED';
      throw error;
    }
    await writeStoredDirectoryHandle(directoryHandle, env);
    return { directoryHandle, source: 'picker' };
  }

  async function collectLocalEkcFilesFromDirectory(directoryHandle, options = {}) {
    const entries = [];
    const rootName = directoryHandle?.name || 'TPYS_CSV_Standartlastirilmis';
    await walkDirectory(directoryHandle, rootName, entries);
    return collectLocalEkcEntries(entries, options);
  }

  async function collectLocalEkcFilesFromFileList(fileList, options = {}) {
    const entries = Array.from(fileList || []).map((file) => ({
      name: file?.name || '',
      path: normalizePath(file?.webkitRelativePath || file?.name || ''),
      getFile: async () => file
    }));
    return collectLocalEkcEntries(entries, options);
  }

  async function collectLocalEkcEntries(entries, options = {}) {
    const filters = options.filters || {};
    const selectedBusbar = options.selectedBusbar || null;
    const batchSize = Math.max(1, Number(options.batchSize || 25));
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
    const byLightKey = new Map();
    let scannedFiles = 0;
    let filteredOutFiles = 0;
    let skippedByPath = 0;
    let readFiles = 0;
    let duplicateFiles = 0;
    const readErrorFiles = [];

    for (const entry of entries || []) {
      if (!isCsvName(entry?.name || entry?.path)) continue;
      scannedFiles += 1;
      const path = normalizePath(entry.path || entry.name || '');
      const pathDate = extractIsoDateFromPath(path);
      if (shouldSkipLocalEkcPath(path, pathDate, filters, selectedBusbar)) {
        filteredOutFiles += 1;
        skippedByPath += 1;
        if (scannedFiles % batchSize === 0) {
          emitProgress(onProgress, { phase: 'scan', scannedFiles, skippedByPath, readFiles, duplicateFiles });
          await yieldToBrowser();
        }
        continue;
      }

      try {
        const sourceFile = await entry.getFile();
        const candidate = {
          rank: localEkcPathRank(path),
          lightKey: buildLightDuplicateKey(path, pathDate, sourceFile),
          path,
          sourceFile
        };
        const current = byLightKey.get(candidate.lightKey);
        if (current) {
          duplicateFiles += 1;
          if (candidate.rank < current.rank || (candidate.rank === current.rank && candidate.path.localeCompare(current.path) < 0)) {
            byLightKey.set(candidate.lightKey, candidate);
          }
        } else {
          byLightKey.set(candidate.lightKey, candidate);
        }
        if (scannedFiles % batchSize === 0) {
          emitProgress(onProgress, { phase: 'scan', scannedFiles, skippedByPath, readFiles, duplicateFiles });
          await yieldToBrowser();
        }
      } catch (error) {
        readErrorFiles.push({ path, message: error?.message || String(error) });
      }
    }

    const files = [];
    const candidates = [...byLightKey.values()]
      .sort((a, b) => (a.rank - b.rank) || a.path.localeCompare(b.path));

    for (const [index, candidate] of candidates.entries()) {
      try {
        const text = await candidate.sourceFile.text();
        readFiles += 1;
        const sha256 = await sha256Text(text);
        files.push(makeLocalEkcFile(candidate.sourceFile, text, candidate.path, sha256));
      } catch (error) {
        readErrorFiles.push({ path: candidate.path, message: error?.message || String(error) });
      }
      if ((index + 1) % batchSize === 0) {
        emitProgress(onProgress, { phase: 'read', scannedFiles, skippedByPath, readFiles, duplicateFiles });
        await yieldToBrowser();
      }
    }

    emitProgress(onProgress, { phase: 'done', scannedFiles, skippedByPath, readFiles, duplicateFiles });

    return {
      files,
      scannedFiles,
      filteredOutFiles,
      skippedByPath,
      readFiles,
      duplicateFiles,
      readErrorFiles
    };
  }

  async function walkDirectory(directoryHandle, basePath, entries) {
    if (!directoryHandle?.values) return;
    for await (const entry of directoryHandle.values()) {
      const entryPath = joinPath(basePath, entry.name || '');
      if (entry.kind === 'directory') {
        await walkDirectory(entry, entryPath, entries);
      } else if (entry.kind === 'file') {
        entries.push({
          name: entry.name || '',
          path: entryPath,
          getFile: () => entry.getFile()
        });
      }
    }
  }

  function filterParsedEkcRows(rows, options = {}) {
    const filters = options.filters || {};
    const selectedBusbar = options.selectedBusbar || null;
    const sourceType = normalizeSourceType(filters.sourceType);
    return (rows || []).filter((row) => {
      if (!isIsoDateInFilter(row?.localDate || '', filters)) return false;
      if (sourceType !== 'ALL' && normalizeSourceType(row?.sourceType || row?.busbarType) !== sourceType) return false;
      if (selectedBusbar && !rowMatchesSelectedBusbar(row, selectedBusbar)) return false;
      return true;
    });
  }

  function rowMatchesSelectedBusbar(row, selectedBusbar) {
    if (!selectedBusbar) return true;
    const rowBusbarId = normalizeId(row?.busbarId);
    const selectedBusbarId = normalizeId(selectedBusbar?.busbarId);
    if (rowBusbarId && selectedBusbarId && rowBusbarId === selectedBusbarId) return true;

    const rowInternalId = normalizeId(row?.busbarInternalId);
    const selectedInternalId = normalizeId(selectedBusbar?.busbarInternalId);
    if (rowInternalId && selectedInternalId && rowInternalId === selectedInternalId) return true;

    const rowNames = [
      row?.busbarName,
      row?.plantName,
      row?.ekcOriginalBusbarName,
      row?.ekcOriginalPlantName,
      row?.ekcOriginalName,
      row?.fileName
    ].map(normalizeText).filter(Boolean);
    const selectedNames = [
      selectedBusbar?.busbarName,
      selectedBusbar?.plantName
    ].map(normalizeText).filter(Boolean);
    return selectedNames.some((selected) => rowNames.some((name) => name === selected || name.includes(selected) || selected.includes(name)));
  }

  function makeLocalEkcFile(sourceFile, text, path, sha256) {
    return {
      name: sourceFile?.name || path.split('/').pop() || 'local-ekc.csv',
      size: sourceFile?.size ?? text.length,
      type: sourceFile?.type || 'text/csv',
      lastModified: sourceFile?.lastModified || 0,
      webkitRelativePath: path,
      localEkcPath: path,
      localEkcHash: sha256,
      async text() {
        return text;
      }
    };
  }

  function extractIsoDateFromPath(path) {
    const normalized = normalizePath(path);
    const dotted = normalized.match(/(^|[^\d])(\d{1,2})\.(\d{1,2})\.(\d{4})(?=[^\d]|$)/);
    if (dotted) return toIsoDate(dotted[4], dotted[3], dotted[2]);
    const dayFolder = normalized.match(/RGDH_GUN_(\d{1,2})_(\d{1,2})_(\d{2,4})(?=\/|$)/i);
    if (dayFolder) return toIsoDate(expandYear(dayFolder[3]), dayFolder[2], dayFolder[1]);
    return '';
  }

  function isIsoDateInFilter(isoDate, filters = {}) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) return !filters.date;
    const start = filters.date || '';
    if (!start) return true;
    const end = filters.endDate || addLocalDays(start, 1);
    return isoDate >= start && isoDate < end;
  }

  function addLocalDays(isoDate, days) {
    const parts = String(isoDate || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return '';
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function toIsoDate(year, month, day) {
    const y = String(year || '').padStart(4, '0');
    const m = String(month || '').padStart(2, '0');
    const d = String(day || '').padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function expandYear(value) {
    const raw = String(value || '').trim();
    if (raw.length === 2) return `20${raw}`;
    return raw;
  }

  function localEkcPathRank(path) {
    return /(^|\/)RGDH_GUN_\d{1,2}_\d{1,2}_\d{2,4}(\/|$)/i.test(normalizePath(path)) ? 0 : 1;
  }

  function shouldSkipLocalEkcPath(path, pathDate, filters = {}, selectedBusbar = null) {
    if (filters?.date && !pathDate) return true;
    if (pathDate && !isIsoDateInFilter(pathDate, filters)) return true;
    if (selectedBusbar && !pathMatchesSelectedBusbar(path, selectedBusbar)) return true;
    return false;
  }

  function pathMatchesSelectedBusbar(path, selectedBusbar) {
    const pathText = normalizeText(path);
    if (!pathText) return false;
    const names = [
      selectedBusbar?.busbarName,
      selectedBusbar?.plantName
    ].map(normalizeText).filter(Boolean);
    return !names.length || names.some((name) => pathText.includes(name) || name.includes(pathText));
  }

  function buildLightDuplicateKey(path, pathDate, sourceFile) {
    const normalizedPath = normalizePath(path);
    const baseName = normalizedPath.split('/').pop() || normalizedPath;
    const baseKey = normalizeText(baseName.replace(/\.csv$/i, ''));
    return [
      pathDate || extractIsoDateFromPath(normalizedPath) || '',
      baseKey,
      sourceFile?.size ?? '',
      sourceFile?.lastModified ?? ''
    ].join('|');
  }

  function emitProgress(onProgress, event) {
    if (!onProgress) return;
    try {
      onProgress(event);
    } catch (_) {
      // Progress reporting must never interrupt local file loading.
    }
  }

  function yieldToBrowser() {
    if (typeof root.requestAnimationFrame === 'function') {
      return new Promise((resolve) => root.requestAnimationFrame(() => resolve()));
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function isCsvName(value) {
    return /\.csv$/i.test(String(value || '').trim());
  }

  function normalizePath(path) {
    return String(path || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
  }

  function joinPath(parent, child) {
    return [normalizePath(parent), normalizePath(child)].filter(Boolean).join('/');
  }

  function normalizeSourceType(value) {
    const raw = String(value || 'ALL').trim().toUpperCase();
    if (!raw || raw === 'TUMU' || raw === 'TÜMÜ') return 'ALL';
    return raw;
  }

  function normalizeId(value) {
    const text = String(value ?? '').trim();
    return text && text !== 'null' && text !== 'undefined' ? text : '';
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıİ]/g, 'i')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  async function sha256Text(text) {
    const value = String(text || '');
    if (root.crypto?.subtle && typeof root.TextEncoder !== 'undefined') {
      const encoded = new root.TextEncoder().encode(value);
      const digest = await root.crypto.subtle.digest('SHA-256', encoded);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') {
      return require('node:crypto').createHash('sha256').update(value, 'utf8').digest('hex');
    }
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return `fallback-${Math.abs(hash)}`;
  }

  async function verifyDirectoryPermission(directoryHandle, readWrite = false) {
    if (!directoryHandle?.queryPermission && !directoryHandle?.requestPermission) return true;
    const options = readWrite ? { mode: 'readwrite' } : { mode: 'read' };
    if (directoryHandle.queryPermission && await directoryHandle.queryPermission(options) === 'granted') return true;
    return Boolean(directoryHandle.requestPermission && await directoryHandle.requestPermission(options) === 'granted');
  }

  async function readStoredDirectoryHandle(env = root) {
    try {
      const db = await openDirectoryDb(env);
      if (!db) return null;
      return await idbRequest(db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(DIRECTORY_HANDLE_KEY));
    } catch (_) {
      return null;
    }
  }

  async function writeStoredDirectoryHandle(directoryHandle, env = root) {
    try {
      const db = await openDirectoryDb(env);
      if (!db) return;
      await idbRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(directoryHandle, DIRECTORY_HANDLE_KEY));
    } catch (_) {
      // Directory handle persistence is best-effort; the picker fallback still works.
    }
  }

  function openDirectoryDb(env = root) {
    if (!env.indexedDB?.open) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = env.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function idbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    DIRECTORY_HANDLE_KEY,
    getLocalEkcDirectoryHandle,
    collectLocalEkcFilesFromDirectory,
    collectLocalEkcFilesFromFileList,
    filterParsedEkcRows,
    extractIsoDateFromPath,
    isIsoDateInFilter,
    verifyDirectoryPermission
  };
});
