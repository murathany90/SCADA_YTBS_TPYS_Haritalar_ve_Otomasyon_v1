(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_DOM_BRIDGE = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const ALLOWED_RGDH_PATHS = [
    '/api/rgdh-conventional-busbar-data',
    '/api/rgdh-wind-busbar-data',
    '/api/general-parameter-by-name',
    '/api/busbars'
  ];

  function isAllowedRgdhPath(pathname) {
    return ALLOWED_RGDH_PATHS.includes(String(pathname || ''));
  }

  function sanitizeRgdhError(error) {
    return {
      message: String(error?.message || error || 'Bilinmeyen hata').slice(0, 500),
      errorType: String(error?.errorType || 'UNKNOWN').slice(0, 80),
      httpStatus: Number.isFinite(Number(error?.httpStatus)) ? Number(error.httpStatus) : null
    };
  }

  function sendRuntimeMessage(message, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error('Chrome runtime message API bulunamadi.'));
        return;
      }
      const timer = setTimeout(() => {
        reject(new Error(`YKS veri cekme islemi zaman asimina ugradi (${Math.round(timeoutMs / 1000)} sn).`));
      }, timeoutMs);
      globalThis.chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer);
        const err = globalThis.chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function requestRgdhFetch(payload) {
    return sendRuntimeMessage({ type: 'RGDH_FETCH', payload });
  }

  function startRgdhFetchJob(payload) {
    return sendRuntimeMessage({ type: 'RGDH_FETCH_START', payload }, 15000);
  }

  function getRgdhFetchJobStatus(jobId) {
    return sendRuntimeMessage({ type: 'RGDH_FETCH_STATUS', payload: { jobId } }, 15000);
  }

  function getRgdhFetchRows(jobId, kind, offset = 0, limit = 1000) {
    return sendRuntimeMessage({ type: 'RGDH_FETCH_ROWS', payload: { jobId, kind, offset, limit } }, 30000);
  }

  function cancelRgdhFetchJob(jobId) {
    return sendRuntimeMessage({ type: 'RGDH_FETCH_CANCEL', payload: { jobId } }, 15000);
  }

  function requestDomScrape(payload) {
    return sendRuntimeMessage({ type: 'RGDH_DOM_SCRAPE', payload });
  }

  function listDiagnostics(limit) {
    return sendRuntimeMessage({ type: 'RGDH_DIAG_LIST', payload: { limit } }, 15000);
  }

  function clearDiagnostics() {
    return sendRuntimeMessage({ type: 'RGDH_DIAG_CLEAR', payload: {} }, 15000);
  }

  function exportDiagnosticsCsv() {
    return sendRuntimeMessage({ type: 'RGDH_DIAG_CSV', payload: {} }, 15000);
  }

  function attachYksLogs() {
    return sendRuntimeMessage({ type: 'RGDH_YKS_LOG_ATTACH', payload: {} }, 30000);
  }

  function listYksLogs(limit) {
    return sendRuntimeMessage({ type: 'RGDH_YKS_LOG_LIST', payload: { limit } }, 15000);
  }

  function clearYksLogs() {
    return sendRuntimeMessage({ type: 'RGDH_YKS_LOG_CLEAR', payload: {} }, 15000);
  }

  function exportYksLogCsv() {
    return sendRuntimeMessage({ type: 'RGDH_YKS_LOG_CSV', payload: {} }, 15000);
  }

  return {
    ALLOWED_RGDH_PATHS,
    isAllowedRgdhPath,
    sanitizeRgdhError,
    requestRgdhFetch,
    startRgdhFetchJob,
    getRgdhFetchJobStatus,
    getRgdhFetchRows,
    cancelRgdhFetchJob,
    requestDomScrape,
    listDiagnostics,
    clearDiagnostics,
    exportDiagnosticsCsv,
    attachYksLogs,
    listYksLogs,
    clearYksLogs,
    exportYksLogCsv,
    sendRuntimeMessage
  };
});
