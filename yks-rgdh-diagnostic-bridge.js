(function () {
  function postReady() {
    try {
      window.postMessage({ source: 'RGDH_YKS_DIAGNOSTIC_BRIDGE_READY' }, window.location.origin || '*');
    } catch {}
  }

  if (window.__rgdhYksDiagnosticBridgeLoaded) {
    postReady();
    return;
  }
  window.__rgdhYksDiagnosticBridgeLoaded = true;

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== 'RGDH_YKS_DIAGNOSTIC') return;
    const diagnostics = window.RGDH_DIAGNOSTICS;
    const payload = diagnostics?.sanitizeDiagnosticEvent
      ? diagnostics.sanitizeDiagnosticEvent(event.data.event || {})
      : (event.data.event || {});
    const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : window.chrome?.runtime;
    if (!runtime?.sendMessage) return;
    runtime.sendMessage({ type: 'RGDH_YKS_LOG_EVENT', payload }, () => {
      // Intentionally drain chrome.runtime.lastError; bridge logging must not affect YKS.
      try { void runtime.lastError; } catch {}
    });
  }, true);

  postReady();
})();
