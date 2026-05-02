const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('popup contains RGDH monitor button and popup.js opens the monitor page', () => {
  const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');

  assert.match(html, /id="btnOpenRgdhMonitor"/);
  assert.match(js, /rgdh-monitor\.html/);
});

test('rgdh-monitor page wires scripts after RGDH dependencies and contains four tabs', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');

  assert.match(html, /YKS RGDH Izleme ve Dogrulama Sistemi/);
  assert.doesNotMatch(html, /YAN HIZMETLER KONTROL SISTEMI/);
  assert.doesNotMatch(html, /<small>RGDH Izleme<\/small>/);
  assert.doesNotMatch(html, /class="rgdh-page-title"/);
  assert.match(html, /data-tab="raw"/);
  assert.match(html, /data-tab="daily"/);
  assert.match(html, /data-tab="charts"/);
  assert.match(html, /data-tab="compare"[\s\S]*EK-C \/ YKS SCADA Karsilastirma/);
  assert.match(html, /data-tab="tests"/);
  assert.match(html, /Bitis Tarihi \(haric\)|Bitiş Tarihi \(hariç\)/);
  assert.match(html, /<label>Bara Ara[\s\S]*<select id="filterSearch"/);
  assert.doesNotMatch(html, /id="filterBusbarInternalId"/);
  assert.doesNotMatch(html, /YKS Ic Bara ID/);
  assert.doesNotMatch(html, /id="filterYtm"/);
  assert.doesNotMatch(html, /id="filterVoltage"/);
  assert.doesNotMatch(html, /id="filterStatus"/);
  assert.doesNotMatch(html, /id="btnExportJson"/);
  assert.match(html, /id="btnExportCsv"/);
  assert.match(html, /id="testCatalogSearchInput"/);
  assert.match(html, /id="testBusbarTypeSelect"/);
  assert.match(html, /id="testBusbarSelect"/);
  assert.match(html, /id="testHybridOnlyCheckbox"/);
  assert.match(html, /id="btnExportTestsCsv"/);
  assert.doesNotMatch(html, /id="testPlantSelect"/);
  assert.doesNotMatch(html, /id="testUnitSelect"/);
  assert.doesNotMatch(html, /id="testSourceKindSelect"/);
  assert.match(html, /id="testUnitDetailsTable"/);
  assert.match(html, /id="chartContextLabel"/);
  assert.match(html, /id="fetchLogPanel"/);
  assert.doesNotMatch(html, /<option value="HYBRID">Hibrit<\/option>/);
  assert.match(html, /id="btnToggleVoltage"[\s\S]*Gerilim Kaynaklarini Goster/);
  assert.doesNotMatch(html, /id="btnCompare"/);
  assert.doesNotMatch(html, />Karsilastir</);
  assert.match(
    html,
    /<script src="rgdh-catalog-data\.js"><\/script>[\s\S]*<script src="rgdh-auxiliary-catalog\.js"><\/script>[\s\S]*<script src="rgdh-csv\.js"><\/script>[\s\S]*<script src="rgdh-normalizer\.js"><\/script>[\s\S]*<script src="rgdh-pivot\.js"><\/script>[\s\S]*<script src="rgdh-comparison\.js"><\/script>[\s\S]*<script src="rgdh-charts\.js"><\/script>[\s\S]*<script src="rgdh-monitor\.js"><\/script>/
  );
});

test('EK-C upload automatically compares against YKS SCADA data', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /function autoCompareAfterEkcLoad/);
  assert.match(js, /autoCompareAfterEkcLoad\(\)/);
  assert.match(js, /EK-C \/ YKS SCADA/);
  assert.doesNotMatch(js, /el\.btnCompare\.addEventListener/);
});

test('EK-C upload binds selected YKS busbar, syncs date and explains missing matches', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const comparisonJs = fs.readFileSync(path.join(root, 'rgdh-comparison.js'), 'utf8');
  const combined = `${js}\n${comparisonJs}`;

  assert.match(js, /function bindEkcRowsToSelectedBusbar/);
  assert.match(js, /function resolveEkcBindingTarget/);
  assert.match(js, /function syncFiltersToEkcDates/);
  assert.match(js, /RGDH_COMPARISON\.buildEkcPlatformComparison/);
  assert.match(combined, /ekcOriginalName/);
  assert.match(combined, /Ortak dakika bulunamadi: EK-C tarihi icin YKS SCADA verisi yok/);
  assert.match(combined, /secili YKS SCADA barasi yok veya EK-C icin otomatik bara eslesmesi yapilamadi/);
  assert.match(js, /function compareStatusBadge/);
  assert.match(js, /Eslesmedi/);
});

test('EK-C comparison uses chart filters and compact result columns', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const charts = fs.readFileSync(path.join(root, 'rgdh-charts.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(charts, /renderComparison/);
  assert.match(charts, /chartHourStart/);
  assert.match(charts, /chartHourEnd/);
  assert.match(js, /compareSelection/);
  assert.match(js, /data-compare-hour/);
  assert.match(js, /Ek-C<br>K\.Y \(%\)/);
  assert.match(js, /YKS<br>K\.Y \(%\)/);
  assert.match(js, /YKS<br>Hibrit P/);
  assert.match(js, /EK-C<br>Hibrit P/);
  assert.match(js, /Fark<br>dHP/);
  assert.match(js, /Max<br>dHP/);
  assert.match(js, /function formatCompareParticipationCell/);
  assert.match(js, /compare-ky-ok/);
  assert.match(js, /compare-ky-fail/);
  assert.match(js, /COMPARE_AVG_DELTA_LIMITS\s*=\s*\{[^}]*dV:\s*0\.5[^}]*dP:\s*1[^}]*dQ:\s*1[^}]*\}/);
  assert.match(js, /COMPARE_MAX_DELTA_LIMITS\s*=\s*\{[^}]*dV:\s*3[^}]*dP:\s*10[^}]*dQ:\s*5[^}]*\}/);
  assert.match(js, /function formatCompareDeltaCell/);
  assert.match(js, /formatCompareDeltaCell\(row\.avgDeltaV,\s*'dV',\s*'avg'\)/);
  assert.match(js, /formatCompareDeltaCell\(row\.maxDeltaV,\s*'dV',\s*'max'\)/);
  assert.match(js, /formatCompareDeltaCell\(row\.avgDeltaP,\s*'dP',\s*'avg'\)/);
  assert.match(js, /formatCompareDeltaCell\(row\.maxDeltaP,\s*'dP',\s*'max'\)/);
  assert.match(js, /formatCompareDeltaCell\(row\.avgDeltaQ,\s*'dQ',\s*'avg'\)/);
  assert.match(js, /formatCompareDeltaCell\(row\.maxDeltaQ,\s*'dQ',\s*'max'\)/);
  assert.match(js, /function formatCompareDataBarCell/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgYksP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgEkcP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgYksHybridP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgEkcHybridP,\s*pDataBarMax\)/);
  assert.match(css, /\.compare-ky-ok/);
  assert.match(css, /\.compare-ky-fail/);
  assert.match(css, /\.compare-delta-blue/);
  assert.match(css, /\.compare-data-bar/);
  assert.match(css, /#compareTable\s*\{[\s\S]*table-layout:\s*fixed/);
  assert.match(css, /#compareTable th[\s\S]*white-space:\s*normal/);
  assert.match(js, /Eşleşen DK|Eslesen DK/);
  assert.match(js, /Ek-C Değerlendirme|Ek-C Degerlendirme/);
  assert.match(js, /YKS Değerlendirme|YKS Degerlendirme/);
  assert.doesNotMatch(js, /'Tarih', 'Saat', 'Varlik'/);
  assert.doesNotMatch(js, /'Yalniz EK-C', 'Yalniz YKS SCADA'/);
  assert.doesNotMatch(js, /'DD\/YY\/KY', 'Gecti\/Kaldi'/);
  assert.doesNotMatch(js, /'YKS Q', 'EK-C Q', 'Ort dQ', 'Max dQ', 'Hibrit'/);
});

test('manifest injects YKS diagnostics helpers before the main content script', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  const diagnosticsIndex = scripts.indexOf('rgdh-diagnostics.js');
  const bridgeIndex = scripts.indexOf('yks-rgdh-diagnostic-bridge.js');
  const contentIndex = scripts.indexOf('content-script.js');
  const mainWorldEntry = manifest.content_scripts.find((entry) => entry.world === 'MAIN');
  const yksBridgeEntry = manifest.content_scripts.find((entry) => {
    return entry.run_at === 'document_start'
      && entry.world !== 'MAIN'
      && (entry.matches || []).includes('https://yks.teias.gov.tr/*')
      && (entry.js || []).includes('yks-rgdh-diagnostic-bridge.js');
  });

  assert.ok(diagnosticsIndex >= 0, 'rgdh-diagnostics.js should be injected into the isolated content-script world');
  assert.ok(bridgeIndex >= 0, 'YKS diagnostic bridge should be injected');
  assert.ok(contentIndex >= 0, 'content-script.js should still be injected');
  assert.ok(diagnosticsIndex < bridgeIndex, 'diagnostics helper should load before YKS bridge');
  assert.ok(yksBridgeEntry, 'YKS isolated bridge content script should load at document_start');
  assert.deepEqual(yksBridgeEntry.js, ['rgdh-diagnostics.js', 'yks-rgdh-diagnostic-bridge.js']);
  assert.ok(mainWorldEntry, 'YKS MAIN-world instrumentation content script should exist');
  assert.deepEqual(mainWorldEntry.matches, ['https://yks.teias.gov.tr/*']);
  assert.ok(mainWorldEntry.js.includes('yks-rgdh-instrumentation.js'));
  assert.equal(mainWorldEntry.run_at, 'document_start');
});

test('rgdh monitor exposes separate extension and YKS log panels', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');

  assert.doesNotMatch(html, />Hata Detaylari\s*</);
  assert.match(html, /id="btnErrorDetails"[\s\S]*Eklenti Loglari/);
  assert.match(html, /id="extensionLogCount"/);
  assert.match(html, /id="btnYksLogs"[\s\S]*YKS Loglari/);
  assert.match(html, /id="yksLogCount"/);
  assert.match(html, /id="extensionLogPanel"/);
  assert.match(html, /id="yksLogPanel"/);
  assert.match(html, /id="extensionLogList"/);
  assert.match(html, /id="yksLogList"/);
  assert.match(html, /id="btnExportExtensionLogCsv"/);
  assert.match(html, /id="btnExportYksLogCsv"/);
  assert.match(html, /id="btnClearErrorLogs"/);
  assert.match(html, /id="btnClearYksLogs"/);
  assert.match(html, /id="btnCancelFetch"/);
});

test('rgdh monitor raw data table exposes original YKS status and approval columns', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  ['TPYS GD', 'Devre Durumu', 'Yukumluluk Durumu', 'D.I MVAR ONAY', 'A.I MVAR ONAY', 'Onay Durum'].forEach((header) => {
    assert.match(js, new RegExp(header.replace('.', '\\.')));
  });
  assert.match(js, /formatStatusFlag/);
  assert.match(js, /formatObligationStatus/);
});

test('rgdh monitor caps auxiliary RES/GES polling budget at five minutes', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /300000/);
  assert.doesNotMatch(js, /Math\.min\(180000/);
});

test('rgdh monitor waits for hybrid continuation before reporting no normalized rows', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /waitForContinuationFetchJob/);
  assert.match(js, /NO_NORMALIZED_ROWS_AFTER_CONTINUATION/);
  assert.match(js, /continuationJobId/);
  assert.match(js, /RGDH_HYBRID_CONTINUATION_TIMEOUT_MS/);
});

test('extension build includes YKS diagnostic bridge file', () => {
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');

  assert.match(buildScript, /yks-rgdh-diagnostic-bridge\.js/);
});

test('extension build includes RGDH comparison helper loaded by monitor page', () => {
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');

  assert.match(buildScript, /rgdh-comparison\.js/);
});

test('rgdh monitor daily table is date-first without summary and voltage toggle excludes TPYS/live busbar', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const charts = fs.readFileSync(path.join(root, 'rgdh-charts.js'), 'utf8');

  assert.match(js, /<th>Tarih<\/th><th>Bara<\/th><th>Tip<\/th><th>Kontrol<\/th>/);
  assert.doesNotMatch(js, /<th>Ozet<\/th>/);
  assert.doesNotMatch(js, /OK \$\{row\.summary\.okHours\} \/ WARN/);
  assert.doesNotMatch(js, /TPYS Set', cls: 'rgdh-voltage-col'/);
  assert.doesNotMatch(js, /Canli Bara', cls: 'rgdh-voltage-col'/);
  assert.doesNotMatch(charts, /text: 'TPYS Set', cls: 'rgdh-voltage-col'/);
  assert.doesNotMatch(charts, /text: 'Canl. Bara', cls: 'rgdh-voltage-col'/);
  assert.match(charts, /Tablo Goster|Tablo GÃ¶ster/);
  assert.match(js, /Bara \[123\] kV/);
  assert.match(charts, /Bara \[123\] kV/);
  assert.doesNotMatch(js, /Bara \[13\] kV\|Bara Set/);
  assert.doesNotMatch(charts, /Bara \[13\] kV\|Bara Set/);
  assert.match(charts, /TPYS Set Gerilim \(kV\)/);
  assert.match(charts, /onHourSelect/);
  assert.match(js, /Detayli Metrik Goster/);
  assert.match(charts, /Detayli Metrik Goster/);
  assert.match(cssSafeRead(), /participation-yy/);
  assert.match(cssSafeRead(), /participation-dd/);
});

function cssSafeRead() {
  return fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');
}

test('rgdh-catalog-data.js is valid JSON with 81 busbar-unit rows', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-catalog-data.js'), 'utf8');
  const jsonMatch = js.match(/RGDH_CATALOG_DATA=(\[[\s\S]*\]);/);
  assert.ok(jsonMatch, 'RGDH_CATALOG_DATA assignment not found');
  const data = JSON.parse(jsonMatch[1]);
  const busbars = new Set(data.map((row) => `${row.bid}|${row.bn}`));
  assert.equal(data.length, 81, `Expected 81 rows, got ${data.length}`);
  assert.equal(busbars.size, 42);
  assert.ok(data[0].bid, 'First row should have busbarId');
  assert.ok(data[0].bn, 'First row should have busbarName');
  assert.ok(data[0].sk, 'First row should have sourceKind');
  assert.ok(data.some(row => row.sk === 'WIND'), 'Should have WIND rows');
  assert.ok(data.some(row => row.sk !== 'WIND'), 'Should have CONVENTIONAL rows');
});

test('extension build and manifest include the auxiliary catalog overlay', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');
  const webResources = manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);

  assert.ok(webResources.includes('rgdh-auxiliary-catalog.js'));
  assert.ok(webResources.includes('yks_izleme_modul/yks_docs/rgdh_unite_tanimi_.csv'));
  assert.match(buildScript, /rgdh-auxiliary-catalog\.js/);
  assert.match(buildScript, /yks_izleme_modul[\\\/]yks_docs[\\\/]rgdh_unite_tanimi_\.csv/);
});

test('rgdh monitor renders hybrid auxiliary source markers in labels and tables', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(js, /function renderHybridNameHtml/);
  assert.match(js, /function formatHybridOptionLabel/);
  assert.match(js, /Yardimci kaynak/);
  assert.match(css, /\.rgdh-hybrid-dot/);
  assert.match(css, /--rgdh-hybrid/);
});

test('rgdh monitor dark theme has explicit readable selected and sticky table colors', () => {
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(css, /\[data-theme="dark"\]\s+\.rgdh-table tbody tr\.selected td/);
  assert.match(css, /\[data-theme="dark"\]\s+\.rgdh-table td:first-child/);
  assert.match(css, /--chart-text/);
  assert.match(css, /--table-selected-bg/);
});
