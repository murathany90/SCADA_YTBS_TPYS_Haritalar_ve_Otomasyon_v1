const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT, 'dist', 'chrome-extension');
const NETWORK_V2_PATH = path.join(ROOT, 'data', 'kml_layers_v2.json');

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message);
    if (details !== undefined) error.details = details;
    throw error;
  }
}

function detectChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const hit = candidates.find((candidate) => fs.existsSync(candidate));
  assert(hit, 'Chrome veya Edge executable bulunamadi.');
  return hit;
}

function isIgnorableRequestFailure(request) {
  const url = String(request?.url?.() || '');
  return /tile\.openstreetmap\.org|basemaps\.cartocdn\.com/i.test(url);
}

function isIgnorableConsoleError(text) {
  return /superset yanitinda veri bulunamadi/i.test(String(text || ''));
}

async function waitStep(label, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`[${label}] ${error?.message || error}`);
  }
}

function attachDiagnostics(page, bucket) {
  page.on('console', (message) => {
    const type = message.type();
    const text = message.text();
    bucket.console.push({ type, text });
    if (type === 'error' && !isIgnorableConsoleError(text)) bucket.consoleErrors.push(text);
  });
  page.on('pageerror', (error) => {
    bucket.pageErrors.push(String(error?.message || error));
  });
  page.on('requestfailed', (request) => {
    const failure = {
      url: request.url(),
      method: request.method(),
      errorText: request.failure()?.errorText || 'unknown'
    };
    if (isIgnorableRequestFailure(request)) bucket.requestWarnings.push(failure);
    else bucket.requestFailures.push(failure);
  });
}

async function getExtensionId(browser) {
  const target = await waitStep('extension-service-worker', () => browser.waitForTarget(
    (item) => item.type() === 'service_worker' && item.url().startsWith('chrome-extension://'),
    { timeout: 30000 }
  ));
  return new URL(target.url()).host;
}

async function main() {
  assert(fs.existsSync(EXTENSION_DIR), `Extension klasoru bulunamadi: ${EXTENSION_DIR}`);
  assert(fs.existsSync(NETWORK_V2_PATH), `V2 veri modeli bulunamadi: ${NETWORK_V2_PATH}`);

  const chromePath = detectChromeExecutable();
  const networkV2 = JSON.parse(fs.readFileSync(NETWORK_V2_PATH, 'utf8'));
  const smokeHat = (networkV2.hatLines || []).find((hat) => Array.isArray(hat.ytmNames) && hat.ytmNames.includes('Orta Anadolu YTM'));
  assert(smokeHat, 'Smoke test icin Orta Anadolu YTM altinda hat bulunamadi.');
  const smokeHatQuery = String(smokeHat.kmlDescriptionId || smokeHat.id || '').trim();
  assert(smokeHatQuery, 'Smoke test icin hat arama anahtari uretilmedi.', smokeHat);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tpys-ext-smoke-'));
  const diagnostics = {
    popup: { console: [], consoleErrors: [], pageErrors: [], requestFailures: [], requestWarnings: [] },
    map: { console: [], consoleErrors: [], pageErrors: [], requestFailures: [], requestWarnings: [] }
  };
  const checks = [];
  let browser;

  const record = async (name, fn) => {
    try {
      const details = await fn();
      checks.push({ name, ok: true, details });
    } catch (error) {
      checks.push({
        name,
        ok: false,
        error: String(error?.message || error),
        details: error?.details
      });
      throw error;
    }
  };

  try {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: chromePath,
      pipe: true,
      userDataDir,
      defaultViewport: { width: 1600, height: 1000 },
      enableExtensions: [EXTENSION_DIR],
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps'
      ]
    });

    const extensionId = await getExtensionId(browser);
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const mapUrl = `chrome-extension://${extensionId}/map-modern.html`;

    const popupPage = await browser.newPage();
    attachDiagnostics(popupPage, diagnostics.popup);
    await popupPage.goto(popupUrl, { waitUntil: 'domcontentloaded' });
    console.log('[smoke] popup aciliyor');
    await waitStep('popup-mapping-count', () => popupPage.waitForFunction(
      () => Number(document.querySelector('#mappingCount')?.textContent || 0) > 0,
      { timeout: 30000 }
    ));

    await record('Popup load', async () => {
      const popupState = await popupPage.evaluate(() => ({
        title: document.title,
        mappingCount: Number(document.querySelector('#mappingCount')?.textContent || 0),
        hasAnalyze: Boolean(document.querySelector('#btnAnalyze')),
        hasApply: Boolean(document.querySelector('#btnApply')),
        hasMap: Boolean(document.querySelector('#btnOpenMap'))
      }));
      assert(popupState.mappingCount > 0, 'Popup mapping sayaci sifir.', popupState);
      assert(popupState.hasAnalyze && popupState.hasApply && popupState.hasMap, 'Popup aksiyon butonlari eksik.', popupState);
      return popupState;
    });

    const mapPage = await browser.newPage();
    attachDiagnostics(mapPage, diagnostics.map);
    await mapPage.goto(mapUrl, { waitUntil: 'domcontentloaded' });
    console.log('[smoke] harita aciliyor');
    await waitStep('map-status-selector', () => mapPage.waitForSelector('#mapStatus', { timeout: 30000 }));
    await waitStep('map-counts-and-hat-paths', () => mapPage.waitForFunction(() => {
      const hatCount = Number(document.querySelector('#hatCount')?.textContent || 0);
      const tmCount = Number(document.querySelector('#tmCount')?.textContent || 0);
      const hatPaths = document.querySelectorAll('#hatLayer path').length;
      return hatCount > 0 && tmCount > 0 && hatPaths > 0;
    }, { timeout: 30000 }));

    await record('Map V2 load', async () => {
      const snapshot = await mapPage.evaluate(() => ({
        mapStatus: document.querySelector('#mapStatus')?.textContent?.trim() || '',
        hatCount: Number(document.querySelector('#hatCount')?.textContent || 0),
        tmCount: Number(document.querySelector('#tmCount')?.textContent || 0),
        baraCount: Number(document.querySelector('#baraCount')?.textContent || 0),
        hatPathCount: document.querySelectorAll('#hatLayer path').length,
        metricButtonCount: document.querySelectorAll('[data-scada-metric]').length,
        hasTrafoDistToggle: Boolean(document.querySelector('#showTrafoDist')),
        hasTrafoTransmissionToggle: Boolean(document.querySelector('#showTrafoTransmission')),
        hasBaraToggle: Boolean(document.querySelector('#showBaras'))
      }));
      assert(!/yuklenemedi/i.test(snapshot.mapStatus), 'Harita status error veriyor.', snapshot);
      assert(snapshot.hatCount > 0 && snapshot.tmCount > 0 && snapshot.hatPathCount > 0, 'Harita V2 verisi cizilmedi.', snapshot);
      assert(snapshot.metricButtonCount === 5, 'SCADA metric buton sayisi 5 degil.', snapshot);
      assert(snapshot.hasTrafoDistToggle && snapshot.hasTrafoTransmissionToggle && snapshot.hasBaraToggle, 'V2 katman togglelari eksik.', snapshot);
      return snapshot;
    });

    await mapPage.click('#showBaras');
    await mapPage.click('#showTrafoDist');
    await mapPage.click('#showTrafoTransmission');
    console.log('[smoke] v2 katmanlari aciliyor');
    await waitStep('v2-layer-markers', () => mapPage.waitForFunction(() => {
      const baraMarkers = document.querySelectorAll('#baraLayer .bara-node-marker').length;
      const trafoMarkers = document.querySelectorAll('#trafoLayer .trafo-marker').length;
      const trafoCircles = document.querySelectorAll('#trafoLayer circle').length;
      const trafoPolygons = document.querySelectorAll('#trafoLayer polygon').length;
      return baraMarkers > 0 && trafoMarkers > 0 && trafoCircles > 0 && trafoPolygons > 0;
    }, { timeout: 30000 }));

    await record('V2 layer markers', async () => {
      const layerState = await mapPage.evaluate(() => ({
        baraMarkers: document.querySelectorAll('#baraLayer .bara-node-marker').length,
        trafoMarkers: document.querySelectorAll('#trafoLayer .trafo-marker').length,
        trafoCircleShapes: document.querySelectorAll('#trafoLayer circle').length,
        trafoPolygonShapes: document.querySelectorAll('#trafoLayer polygon').length
      }));
      assert(layerState.baraMarkers > 0, 'Bara markerlari render edilmedi.', layerState);
      assert(layerState.trafoMarkers > 0, 'Trafo markerlari render edilmedi.', layerState);
      assert(layerState.trafoCircleShapes > 0 && layerState.trafoPolygonShapes > 0, 'Dagitim ve iletim trafo isaretleri birlikte gorunmuyor.', layerState);
      return layerState;
    });

    await mapPage.click('#searchInput', { clickCount: 3 });
    await mapPage.keyboard.press('Backspace');
    await mapPage.type('#searchInput', smokeHatQuery);
    await mapPage.click('#btnSearch');
    console.log('[smoke] hat popup arama ile aciliyor');
    await waitStep('hat-popup-search-open', () => mapPage.waitForFunction(() => {
      const card = document.querySelector('#infoCard');
      const kicker = card?.querySelector('.info-kicker')?.textContent || '';
      return Boolean(card && !card.classList.contains('hidden') && card.textContent.includes('Grafik Goster') && /Hat/i.test(kicker));
    }, { timeout: 15000 }));

    await record('Anchored popup + chart modal', async () => {
      const popupState = await mapPage.evaluate(() => {
        const card = document.querySelector('#infoCard');
        const anchorCoord = window.__TPYS_STATE?.ui?.activeHatPopup?.anchorCoord || null;
        const anchorPoint = anchorCoord && typeof window.screenPoint === 'function'
          ? window.screenPoint(anchorCoord.lon, anchorCoord.lat)
          : null;
        const rect = card?.getBoundingClientRect?.();
        const gap = 16;
        const margin = 12;
        const viewportWidth = document.querySelector('#mapViewport')?.clientWidth || window.innerWidth || 0;
        return {
          visible: Boolean(card && !card.classList.contains('hidden')),
          anchored: Boolean(card && card.classList.contains('info-card-anchored')),
          title: card?.querySelector('h3')?.textContent?.trim() || '',
          hasChartButton: Boolean(document.querySelector('#btnShowScadaChart')),
          anchorPoint,
          popupLeft: rect?.left || 0,
          rightFits: Boolean(anchorPoint && rect) && (anchorPoint.x + gap + rect.width <= viewportWidth - margin)
        };
      });
      assert(popupState.visible && popupState.anchored && popupState.hasChartButton, 'Hat popup acilmadi veya anchored degil.', popupState);
      if (popupState.rightFits) {
        assert(popupState.popupLeft > popupState.anchorPoint.x, 'Popup saga sigmasina ragmen sagda acilmadi.', popupState);
      }
      await mapPage.click('#btnShowScadaChart');
      await waitStep('scada-chart-modal-open', () => mapPage.waitForSelector('#scadaChartModalBackdrop', { timeout: 15000 }));
      const modalState = await mapPage.evaluate(() => ({
        visible: Boolean(document.querySelector('#scadaChartModalBackdrop')),
        title: document.querySelector('#scadaChartModalBackdrop h3')?.textContent?.trim() || ''
      }));
      assert(modalState.visible, 'Grafik modal acilmadi.', modalState);
      await mapPage.click('#btnCloseScadaChart');
      await waitStep('scada-chart-modal-close', () => mapPage.waitForFunction(() => !document.querySelector('#scadaChartModalBackdrop'), { timeout: 15000 }));
      return { popup: popupState, modal: modalState };
    });

    await mapPage.click('[data-scada-btn="mock"]');
    await mapPage.click('[data-scada-switch="enabled"]');
    console.log('[smoke] mock scada fetch bekleniyor');
    await waitStep('scada-fetch-badge', () => mapPage.waitForFunction(() => {
      const badge = document.querySelector('#scadaFetchBadge')?.textContent?.trim() || '';
      return /Tamam/i.test(badge) || /Hata/i.test(badge);
    }, { timeout: 30000 }));

    await record('SCADA mock fetch', async () => {
      const scadaState = await mapPage.evaluate(() => ({
        badge: document.querySelector('#scadaFetchBadge')?.textContent?.trim() || '',
        message: document.querySelector('#scadaFetchMessage')?.textContent?.trim() || '',
        transport: document.querySelector('#scadaFetchTransport')?.textContent?.trim() || '',
        total: Number(document.querySelector('#scadaToplam')?.textContent || 0),
        matched: Number(document.querySelector('#scadaEslesen')?.textContent || 0),
        unmatched: Number(document.querySelector('#scadaEslesmeyen')?.textContent || 0),
        stale: Number(document.querySelector('#scadaStale')?.textContent || 0),
        visibleRows: document.querySelector('#scadaFetchVisibleRows')?.textContent?.trim() || '',
        boltVisible: !document.querySelector('#btnScadaRanking')?.classList.contains('hidden'),
        flowCount: window.__TPYS_STATE?.scada?.lineFlowByLineId?.size || 0,
        flowArrowCount: document.querySelectorAll('#flowLayer polygon').length,
        dashedHatCount: document.querySelectorAll('#hatLayer path[stroke-dasharray]').length,
        sampleLineId: (() => {
          const ids = Array.from(window.__TPYS_STATE?.scada?.lineFlowByLineId?.keys?.() || []);
          return ids[0] || '';
        })(),
        sampleLineStroke: (() => {
          const ids = Array.from(window.__TPYS_STATE?.scada?.lineFlowByLineId?.keys?.() || []);
          const sampleId = ids[0];
          const path = sampleId ? document.querySelector(`#hatLayer path[data-hat-id="${sampleId}"]`) : null;
          return path?.getAttribute('stroke') || '';
        })(),
        sampleExpectedColor: (() => {
          const ids = Array.from(window.__TPYS_STATE?.scada?.lineFlowByLineId?.keys?.() || []);
          const sampleId = ids[0];
          return sampleId ? window.__TPYS_STATE?.scada?.lineFlowByLineId?.get(sampleId)?.color || '' : '';
        })()
      }));
      assert(/Tamam/i.test(scadaState.badge), 'SCADA fetch success ile tamamlanmadi.', scadaState);
      assert(scadaState.total > 0, 'SCADA gorunen toplam sifir.', scadaState);
      assert(/tekil olcum islendi/i.test(scadaState.message), 'SCADA fetch bilgi karti guncellenmedi.', scadaState);
      assert(scadaState.boltVisible, 'SCADA panel butonu gorunur olmadi.', scadaState);
      assert(scadaState.flowCount > 0 && scadaState.flowArrowCount > 0, 'SCADA flow/ok katmani uretilmedi.', scadaState);
      assert(scadaState.dashedHatCount === 0, 'Hatlarda kesikli stroke kaldi.', scadaState);
      assert(
        String(scadaState.sampleLineStroke || '').toLowerCase() === String(scadaState.sampleExpectedColor || '').toLowerCase(),
        'Hat stroke rengi flow renginden sapti.',
        scadaState
      );
      return scadaState;
    });

    await record('SCADA reactive mode render', async () => {
      await mapPage.click('[data-scada-metric="hat-reactive"]');
      await waitStep('hat-reactive-mode', () => mapPage.waitForFunction(() => {
        return window.__TPYS_STATE?.filters?.scadaMetric === 'hat-reactive';
      }, { timeout: 15000 }));
      await waitStep('hat-reactive-fetch', () => mapPage.waitForFunction(() => {
        const badge = document.querySelector('#scadaFetchBadge')?.textContent?.trim() || '';
        return /Tamam/i.test(badge) || /Hata/i.test(badge);
      }, { timeout: 30000 }));
      const reactiveState = await mapPage.evaluate(() => ({
        activeMetric: window.__TPYS_STATE?.filters?.scadaMetric || '',
        badge: document.querySelector('#scadaFetchBadge')?.textContent?.trim() || '',
        flowCount: window.__TPYS_STATE?.scada?.lineFlowByLineId?.size || 0,
        flowArrowCount: document.querySelectorAll('#flowLayer polygon').length,
        dashedHatCount: document.querySelectorAll('#hatLayer path[stroke-dasharray]').length,
        deadCount: Number(document.querySelector('#scadaStale')?.textContent || 0)
      }));
      assert(reactiveState.activeMetric === 'hat-reactive', 'Hat (MVar) modu aktif olmadi.', reactiveState);
      assert(/Tamam/i.test(reactiveState.badge), 'Hat (MVar) mode-change fetch tamamlanmadi.', reactiveState);
      assert(reactiveState.dashedHatCount === 0, 'Hat (MVar) modunda kesikli cizgi kaldi.', reactiveState);
      return reactiveState;
    });

    await mapPage.click('#btnScadaRanking');
    console.log('[smoke] scada paneli aciliyor');
    await waitStep('ranking-panel-open', () => mapPage.waitForSelector('#rankingPanel', { timeout: 15000 }));

    await record('SCADA panel', async () => {
      const panelState = await mapPage.evaluate(() => ({
        title: document.querySelector('#rankingPanel .ranking-header span')?.textContent?.trim() || '',
        entityTabs: Array.from(document.querySelectorAll('#rankingPanel [data-entity-filter]')).map((button) => button.textContent.trim()),
        headers: Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim()),
        rowCount: document.querySelectorAll('#rankingTable tbody tr').length,
        panelRightGap: Math.round((window.innerWidth || document.documentElement.clientWidth || 0) - (document.querySelector('#rankingPanel')?.getBoundingClientRect?.().right || 0)),
        firstHatDot: Boolean(document.querySelector('#rankingTable tbody tr:first-child td.col-name .status-dot')),
        firstHatDotFirst: Boolean(document.querySelector('#rankingTable tbody tr:first-child td.col-name .ranking-name-cell > .status-dot:first-child')),
        horizontalOverflow: (() => {
          const body = document.querySelector('#rankingPanel .ranking-body');
          return body ? Math.max(0, body.scrollWidth - body.clientWidth) : 0;
        })()
      }));
      assert(/SCADA Paneli/i.test(panelState.title), 'SCADA panel basligi beklenen degil.', panelState);
      assert(panelState.entityTabs.length === 4, 'SCADA panel entity filtreleri eksik.', panelState);
      assert(panelState.headers.some((value) => /MVAR/i.test(value)), 'Hat panelinde MVAR kolonu gorunmuyor.', panelState);
      assert(panelState.rowCount > 0, 'SCADA panel satir uretmedi.', panelState);
      assert(panelState.panelRightGap <= 1, 'SCADA panel saga flush yerlesmedi.', panelState);
      assert(panelState.firstHatDot && panelState.firstHatDotFirst, 'Hat satirinda beklenen durum noktasi isim basinda degil.', panelState);
      assert(panelState.horizontalOverflow <= 2, 'SCADA panelde yatay tasma kaldi.', panelState);
      return panelState;
    });

    await mapPage.click('[data-entity-filter="trafo-dist"]');
    await waitStep('ranking-trafo-mode', () => mapPage.waitForFunction(() => {
      const headers = Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim());
      return headers[1] === 'TM' && headers[2] === 'Trafo';
    }, { timeout: 15000 }));

    await record('SCADA panel trafo headers', async () => {
      const trafoHeaders = await mapPage.evaluate(() => (
        Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim())
      ));
      assert(trafoHeaders[1] === 'TM' && trafoHeaders[2] === 'Trafo', 'Trafo panelinde TM ve Trafo kolonlari yer degistirmedi.', trafoHeaders);
      return { headers: trafoHeaders };
    });

    await record('SCADA panel pagination + font controls', async () => {
      const initial = await mapPage.evaluate(() => ({
        pageState: document.querySelector('#rankingPageState')?.textContent?.trim() || '',
        hasPrev: Boolean(document.querySelector('#btnRankingPrev')),
        hasNext: Boolean(document.querySelector('#btnRankingNext')),
        hasFontDown: Boolean(document.querySelector('#btnRankingFontDown')),
        hasFontReset: Boolean(document.querySelector('#btnRankingFontReset')),
        hasFontUp: Boolean(document.querySelector('#btnRankingFontUp')),
        panelHeight: Math.round(document.querySelector('#rankingPanel')?.getBoundingClientRect?.().height || 0)
      }));
      assert(initial.hasPrev && initial.hasNext, 'SCADA panel sayfalama kontrolleri eksik.', initial);
      assert(initial.hasFontDown && initial.hasFontReset && initial.hasFontUp, 'SCADA panel font kontrolleri eksik.', initial);

      await mapPage.click('#btnRankingNext');
      await waitStep('ranking-next-page', () => mapPage.waitForFunction((prevState) => {
        const current = document.querySelector('#rankingPageState')?.textContent?.trim() || '';
        return current && current !== prevState;
      }, { timeout: 15000 }, initial.pageState));

      await mapPage.click('#btnRankingFontUp');
      await waitStep('ranking-font-large', () => mapPage.waitForFunction(() => {
        return document.querySelector('#rankingPanel')?.classList.contains('font-large');
      }, { timeout: 15000 }));

      await mapPage.click('#btnRankingFontReset');
      await waitStep('ranking-font-reset', () => mapPage.waitForFunction(() => {
        const panel = document.querySelector('#rankingPanel');
        return panel && !panel.classList.contains('font-large') && !panel.classList.contains('font-compact');
      }, { timeout: 15000 }));

      const finalState = await mapPage.evaluate(() => ({
        pageState: document.querySelector('#rankingPageState')?.textContent?.trim() || '',
        panelHeight: Math.round(document.querySelector('#rankingPanel')?.getBoundingClientRect?.().height || 0)
      }));
      assert(finalState.pageState !== initial.pageState, 'SCADA panel sayfasi degismedi.', { initial, finalState });
      assert(finalState.panelHeight === initial.panelHeight, 'SCADA panel yuksekligi sayfalama/font islemi sirasinda degisti.', { initial, finalState });
      return { initial, finalState };
    });

    await mapPage.click('[data-entity-filter="voltage"]');
    await waitStep('ranking-voltage-mode', () => mapPage.waitForFunction(() => {
      const headers = Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim());
      return headers.includes('p.u.') && headers.includes('Durum');
    }, { timeout: 15000 }));

    await record('SCADA panel voltage headers', async () => {
      const voltageState = await mapPage.evaluate(() => ({
        headers: Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim()),
        firstRow: Array.from(document.querySelectorAll('#rankingTable tbody tr:first-child td')).map((cell) => cell.textContent.trim())
      }));
      assert(voltageState.headers.includes('p.u.') && voltageState.headers.includes('Durum'), 'Gerilim panel basliklari eksik.', voltageState);
      return voltageState;
    });

    await mapPage.evaluate(() => {
      const hatButton = document.querySelector('[data-entity-filter="hat"]');
      if (hatButton) hatButton.click();
      if (window.__TPYS_STATE?.filters) {
        window.__TPYS_STATE.filters.scadaListEntity = 'hat';
      }
      if (window.__TPYS_STATE?.scadaPanel) {
        window.__TPYS_STATE.scadaPanel.page = 1;
      }
      if (typeof window.refreshRankingTable === 'function') {
        window.refreshRankingTable();
      }
    });
    await waitStep('ranking-hat-mode-return', () => mapPage.waitForFunction(() => {
      const headers = Array.from(document.querySelectorAll('#rankingTable th')).map((cell) => cell.textContent.trim());
      return headers.includes('MVAR') && headers.includes('%');
    }, { timeout: 15000 }));

    await mapPage.click('#rankingTable tbody tr');

    await record('Selected hat glow', async () => {
      const glowState = await mapPage.evaluate(() => {
        const selected = document.querySelector('#hatLayer path.feature-selected-hat');
        const computed = selected ? window.getComputedStyle(selected) : null;
        return {
          hasSelectedHat: Boolean(selected),
          selectedClass: selected?.getAttribute('class') || '',
          filter: computed?.filter || ''
        };
      });
      assert(glowState.hasSelectedHat, 'Panel seciminden sonra hat glow sinifi eklenmedi.', glowState);
      assert(/feature-selected-hat/.test(glowState.selectedClass), 'Secili hat beklenen sinifi tasimiyor.', glowState);
      assert(glowState.filter && glowState.filter !== 'none', 'Secili hat glow filtresi uygulanmadi.', glowState);
      return glowState;
    });

    await record('Blank map click clears selection', async () => {
      const blankPoint = await mapPage.evaluate(() => {
        const viewport = document.querySelector('#mapViewport')?.getBoundingClientRect?.();
        if (!viewport) return null;
        const candidates = [
          [40, 40], [90, 50], [140, 80], [220, 70], [300, 60], [80, 160]
        ];
        const isBlank = (target) => {
          if (!target) return true;
          if (target.closest('.sidebar, #infoCard, #rankingPanel, .hover-tooltip, #scadaChartModalBackdrop, .scada-audit-modal, .floating-bolt')) return false;
          if (target.closest('path.hat-line, #flowLayer g, .tm-point, .bara-point, .bara-set-group, .trafo-marker, .bara-node-marker')) return false;
          return true;
        };
        for (const [dx, dy] of candidates) {
          const x = Math.round(viewport.left + dx);
          const y = Math.round(viewport.top + dy);
          const target = document.elementFromPoint(x, y);
          if (isBlank(target)) return { x, y, tag: target?.tagName || '' };
        }
        return null;
      });
      assert(blankPoint, 'Bos harita tik noktasi bulunamadi.');
      await mapPage.mouse.click(blankPoint.x, blankPoint.y);
      await waitStep('blank-map-selection-clear', () => mapPage.waitForFunction(() => {
        return !document.querySelector('#hatLayer path.feature-selected-hat')
          && document.querySelector('#infoCard')?.classList.contains('hidden');
      }, { timeout: 15000 }));

      const clearedState = await mapPage.evaluate(() => ({
        selectionKind: window.__TPYS_STATE?.selection?.kind || '',
        infoHidden: document.querySelector('#infoCard')?.classList.contains('hidden') || false,
        hasSelectedHat: Boolean(document.querySelector('#hatLayer path.feature-selected-hat'))
      }));
      assert(!clearedState.selectionKind && clearedState.infoHidden && !clearedState.hasSelectedHat, 'Bos harita tiklamasi secimi temizlemedi.', clearedState);
      return { blankPoint, clearedState };
    });

    const fatalDiagnostics = {
      popupPageErrors: diagnostics.popup.pageErrors,
      popupConsoleErrors: diagnostics.popup.consoleErrors,
      popupRequestFailures: diagnostics.popup.requestFailures,
      mapPageErrors: diagnostics.map.pageErrors,
      mapConsoleErrors: diagnostics.map.consoleErrors,
      mapRequestFailures: diagnostics.map.requestFailures
    };
    assert(
      Object.values(fatalDiagnostics).every((items) => !items.length),
      'Smoke test sirasinda fatal browser hatalari yakalandi.',
      fatalDiagnostics
    );

    const summary = {
      ok: true,
      extensionId,
      chromePath,
      checks,
      warnings: {
        popupRequestWarnings: diagnostics.popup.requestWarnings,
        mapRequestWarnings: diagnostics.map.requestWarnings
      }
    };
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    if (browser) await browser.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const payload = {
    ok: false,
    error: String(error?.message || error),
    details: error?.details
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exitCode = 1;
});
