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

test('rgdh-monitor page wires scripts after RGDH dependencies and contains RGDH tabs', () => {
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
  assert.match(html, /Diğer Detaylar|Diger Detaylar/);
  assert.match(html, /id="testOtherDetailsTable"/);
  assert.match(html, /id="chartContextLabel"/);
  assert.match(html, /id="fetchLogPanel"/);
  assert.doesNotMatch(html, /<option value="HYBRID">Hibrit<\/option>/);
  assert.match(html, /id="btnToggleVoltage"[\s\S]*Gerilim Kaynaklarini Goster/);
  assert.doesNotMatch(html, /id="btnCompare"/);
  assert.doesNotMatch(html, />Karsilastir</);
  assert.match(
    html,
    /<script src="rgdh-catalog-data\.js"><\/script>[\s\S]*<script src="rgdh-auxiliary-catalog\.js"><\/script>[\s\S]*<script src="rgdh-csv\.js"><\/script>[\s\S]*<script src="rgdh-normalizer\.js"><\/script>[\s\S]*<script src="rgdh-pivot\.js"><\/script>[\s\S]*<script src="rgdh-reactive-engine\.js"><\/script>[\s\S]*<script src="rgdh-comparison\.js"><\/script>[\s\S]*<script src="rgdh-charts\.js"><\/script>[\s\S]*<script src="rgdh-monitor\.js"><\/script>/
  );
});

test('RGDH chart report exposes YKS and EK-C calculation mode toggle', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const charts = fs.readFileSync(path.join(root, 'rgdh-charts.js'), 'utf8');

  assert.match(html, /rgdh-reactive-engine\.js/);
  assert.match(js, /calculationMode:\s*'YKS'/);
  assert.match(js, /buildEkcCalculationRows/);
  assert.match(js, /getChartCalculationRows/);
  assert.match(js, /Ek-C hesaplama icin EK-C CSV yukleyin/);
  assert.match(charts, /YKS Hesaplama/);
  assert.match(charts, /Ek-C Hesaplama/);
  assert.match(charts, /chartCalculationMode/);
  assert.match(charts, /onCalculationModeChange/);
});

test('RGDH tests table uses updated catalog details and sortable headers', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(js, /testTableSort:\s*\{\s*key:\s*''/);
  assert.match(js, /TEST_TABLE_COLUMNS/);
  assert.match(js, /function sortCatalogSummaries/);
  assert.match(js, /busbarName[\s\S]*localeCompare[\s\S]*busbarType/);
  assert.match(js, /data-test-sort-key/);
  assert.match(js, /aria-sort/);
  assert.match(js, /Nominal İkaz \(Düşük\)/);
  assert.match(js, /Nominal İkaz \(Aşırı\)/);
  assert.match(css, /\.rgdh-sort-button/);
});

test('EK-C upload prepares comparison data and opens daily RGDH monitoring', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /function autoCompareAfterEkcLoad/);
  assert.match(js, /autoCompareAfterEkcLoad\(\)/);
  assert.match(js, /EK-C \/ YKS SCADA/);
  assert.match(js, /switchTab\('daily'\)/);
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
  assert.match(charts, /rgdh-chart-card-head/);
  assert.match(charts, /data-chart-action="fullscreen"/);
  assert.match(charts, /data-chart-action="download-png"/);
  assert.match(charts, /data-chart-action="diff"/);
  assert.match(charts, /function downloadChartPng/);
  assert.match(charts, /function toggleChartDiffMode/);
  assert.match(charts, /appendChartCanvas\(root, 'EK-C \/ YKS SCADA Gerilim ve Aktif Guc', 'rgdh-compare-top-chart', 300, \{ diffToggle: true \}\)/);
  assert.match(charts, /appendChartCanvas\(root, 'EK-C \/ YKS SCADA Reaktif Guc ve Limit', 'rgdh-compare-reactive-chart', 300, \{ diffToggle: true \}\)/);
  assert.doesNotMatch(charts, /id="btnChartFullscreen"/);
  assert.doesNotMatch(charts, /querySelector\('#btnChartFullscreen'\)/);
  assert.match(js, /compareSelection/);
  assert.match(js, /data-compare-hour/);
  assert.match(js, /Ek-C<br>K\.Y \(%\)/);
  assert.match(js, /YKS<br>K\.Y \(%\)/);
  assert.match(js, /Kimlik \/ Sonuc/);
  assert.match(js, /Katilim/);
  assert.match(js, /Gerilim Karsilastirma/);
  assert.match(js, /Aktif Guc Karsilastirma/);
  assert.match(js, /Reaktif Guc Karsilastirma/);
  assert.match(js, /Hibrit P Karsilastirma/);
  assert.match(js, /btnExportCompareCsv/);
  assert.match(js, /exportCompareCsv/);
  assert.match(js, /RGDH_CSV\.buildCompareExportCsv/);
  assert.match(js, /function downloadCsv/);
  assert.match(js, /RGDH_CSV\.prepareCsvDownloadText/);
  assert.match(js, /RGDH_CSV\.encodeCsvForExcel/);
  assert.match(js, /downloadCsv\(`EKC_YKS_KARSILASTIRMA_/);
  assert.match(js, /downloadCsv\(`RGDH_HAM_DATA_/);
  assert.match(js, /downloadCsv\('rgdh_unite_tanimi_v2\.csv'/);
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
  assert.match(js, /function formatCompareDeltaBarCell/);
  assert.match(js, /deltaBarMax/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgYksP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgEkcP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgYksHybridP,\s*pDataBarMax\)/);
  assert.match(js, /formatCompareDataBarCell\(row\.avgEkcHybridP,\s*pDataBarMax\)/);
  assert.match(css, /\.compare-ky-ok/);
  assert.match(css, /\.compare-ky-fail/);
  assert.match(css, /\.compare-delta-blue/);
  assert.match(css, /\.compare-data-bar/);
  assert.match(css, /\.compare-delta-bar/);
  assert.match(css, /\.rgdh-compare-group-start/);
  assert.match(css, /\.rgdh-compare-group-end/);
  assert.match(css, /\.rgdh-compare-title-row/);
  assert.match(css, /\.rgdh-compare-actions/);
  assert.match(css, /rgdh-compare-col-date\s*\{ width:\s*4\.4%/);
  assert.match(css, /rgdh-compare-col-hour\s*\{ width:\s*3%/);
  assert.match(css, /rgdh-compare-col-eval\s*\{ width:\s*9\.9%/);
  assert.match(css, /\.rgdh-chart-card-head/);
  assert.match(css, /\.rgdh-chart-actions/);
  assert.match(css, /\.rgdh-chart-action/);
  assert.match(css, /#compareTable\s*\{[\s\S]*table-layout:\s*fixed/);
  assert.match(css, /#compareTable th[\s\S]*white-space:\s*normal/);
  assert.match(css, /#compareTable tbody tr:nth-child\(even\) td\s*\{[\s\S]*background:\s*transparent/);
  assert.match(css, /#compareTable \.participation-ok\s*\{[\s\S]*background:\s*#e6f4ea/);
  assert.match(css, /#compareTable \.compare-delta-blue\s*\{[\s\S]*background:\s*#dbeafe/);
  assert.match(css, /#compareTable \.compare-data-bar-cell\s*\{[\s\S]*background:\s*transparent/);
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
  const directYksMatch = 'https://yks.teias.gov.tr/*';
  const portalYksMatch = 'https://portal.teias.gov.tr/f5-w-68747470733a2f2f796b732e74656961732e676f762e7472$$/*';
  const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  const diagnosticsIndex = scripts.indexOf('rgdh-diagnostics.js');
  const bridgeIndex = scripts.indexOf('yks-rgdh-diagnostic-bridge.js');
  const contentIndex = scripts.indexOf('content-script.js');
  const mainWorldEntry = manifest.content_scripts.find((entry) => entry.world === 'MAIN');
  const yksBridgeEntry = manifest.content_scripts.find((entry) => {
    return entry.run_at === 'document_start'
      && entry.world !== 'MAIN'
      && (entry.matches || []).includes(directYksMatch)
      && (entry.matches || []).includes(portalYksMatch)
      && (entry.js || []).includes('yks-rgdh-diagnostic-bridge.js');
  });

  assert.ok(diagnosticsIndex >= 0, 'rgdh-diagnostics.js should be injected into the isolated content-script world');
  assert.ok(bridgeIndex >= 0, 'YKS diagnostic bridge should be injected');
  assert.ok(contentIndex >= 0, 'content-script.js should still be injected');
  assert.ok(diagnosticsIndex < bridgeIndex, 'diagnostics helper should load before YKS bridge');
  assert.ok(yksBridgeEntry, 'YKS isolated bridge content script should load at document_start');
  assert.deepEqual(yksBridgeEntry.js, ['rgdh-diagnostics.js', 'yks-rgdh-diagnostic-bridge.js']);
  assert.ok(mainWorldEntry, 'YKS MAIN-world instrumentation content script should exist');
  assert.ok(mainWorldEntry.matches.includes(directYksMatch), 'YKS MAIN-world instrumentation should keep direct YKS match');
  assert.ok(mainWorldEntry.matches.includes(portalYksMatch), 'YKS MAIN-world instrumentation should include portal YKS match');
  assert.ok(mainWorldEntry.js.includes('yks-rgdh-instrumentation.js'));
  assert.equal(mainWorldEntry.run_at, 'document_start');
});

test('background and YKS instrumentation include portal context support without replacing direct YKS', () => {
  const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
  const instrumentation = fs.readFileSync(path.join(root, 'yks-rgdh-instrumentation.js'), 'utf8');

  assert.match(background, /RGDH_YKS_ORIGIN\s*=\s*'https:\/\/yks\.teias\.gov\.tr'/);
  assert.match(background, /RGDH_YKS_PORTAL_PREFIX\s*=\s*'https:\/\/portal\.teias\.gov\.tr\/f5-w-68747470733a2f2f796b732e74656961732e676f762e7472\$\$'/);
  assert.match(background, /contextKind/);
  assert.match(background, /requestBaseUrl/);
  assert.match(instrumentation, /portal\.teias\.gov\.tr/);
  assert.match(instrumentation, /contextKind/);
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

test('rgdh monitor labels catalog source as RGDH test definitions in the UI', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /RGDH Test Tanımları/);
  assert.doesNotMatch(js, /parts\.push\('KATALOG'\)/);
});

test('rgdh monitor raw data table exposes original YKS status and approval columns', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  ['TPYS GD', 'Droop %', 'Devre Durumu', 'Yukumluluk Durumu', 'D.I MVAR ONAY', 'A.I MVAR ONAY', 'Onay Durum'].forEach((header) => {
    assert.match(js, new RegExp(header.replace('.', '\\.')));
  });
  assert.match(js, /formatStatusFlag/);
  assert.match(js, /formatObligationStatus/);
  assert.match(html, /id="rawUnitDetail"/);
  assert.match(html, /id="rawUnitTable"/);
  assert.match(html, /rgdh-raw-pagination\.js/);
  assert.match(js, /conventionalUnitRows/);
  assert.match(js, /rawUnitSelection/);
  assert.match(js, /function renderRawUnitDetail/);
  assert.match(js, /function selectRawUnitMinute/);
  assert.match(js, /CONVENTIONAL_UNIT/);
  assert.match(js, /Unite Pgen Aktif/);
  assert.match(js, /Unite Qgen Reaktif/);
  assert.match(css, /\.rgdh-raw-unit-detail/);
});

test('rgdh monitor raw data table renders one date page with pager controls', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(html, /id="rawPager"/);
  assert.match(html, /id="btnRawFirst"/);
  assert.match(html, /id="btnRawPrev"/);
  assert.match(html, /id="btnRawNext"/);
  assert.match(html, /id="btnRawLast"/);
  assert.match(html, /id="rawPageInfo"/);
  assert.match(js, /rawPageKey:\s*null/);
  assert.match(js, /RGDH_RAW_PAGINATION\.buildRawDatePages/);
  assert.match(js, /function renderRawPager/);
  assert.doesNotMatch(js, /rows\.slice\(0,\s*2000\)\.forEach/);
  assert.match(css, /rgdh-raw-pager/);
});

test('rgdh monitor uses 180 second standard budget and caps auxiliary RES/GES polling at five minutes', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /const RGDH_STANDARD_JOB_TIMEOUT_MS = 180000;/);
  assert.match(js, /const RGDH_HYBRID_JOB_TIMEOUT_MS = 300000;/);
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

test('extension build includes RGDH helper scripts loaded by monitor page', () => {
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');

  assert.match(buildScript, /rgdh-comparison\.js/);
  assert.match(buildScript, /rgdh-raw-pagination\.js/);
});

test('extension build includes TPYS CSV automation helper scripts referenced by manifest and background', () => {
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');

  assert.match(buildScript, /tpys-csv-automation-core\.js/);
  assert.match(buildScript, /tpys-csv-standardizer\.js/);
  assert.match(buildScript, /tpys-csv-planner\.js/);
});

test('rgdh monitor daily table is date-first without summary and voltage toggle excludes TPYS/live busbar', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const charts = fs.readFileSync(path.join(root, 'rgdh-charts.js'), 'utf8');
  const css = cssSafeRead();

  assert.match(js, /<th>Tarih<\/th><th>Bara<\/th><th>Tip<\/th><th>Kaynak Tipi<\/th>/);
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
  assert.match(charts, /Ort Droop %/);
  assert.match(css, /participation-yy/);
  assert.match(css, /participation-dd/);
});

test('rgdh monitor daily table distinguishes YKS and EK-C control sources with drilldown links', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const css = cssSafeRead();

  assert.match(js, /YKS Kontrol/);
  assert.match(js, /EK-C Kontrol/);
  assert.match(js, /controlSource:\s*'YKS'/);
  assert.match(js, /controlSource:\s*'EKC'/);
  assert.match(js, /state\.calculationMode = dailyCalculationMode\(row\)/);
  assert.match(js, /switchTab\('daily'\)/);
  assert.match(js, /rgdh-daily-date-link/);
  assert.match(js, /rgdh-daily-hour-link/);
  assert.match(css, /rgdh-source-yks/);
  assert.match(css, /rgdh-source-ekc/);
  assert.match(css, /rgdh-daily-hour-link[\s\S]*color:\s*inherit/);
});

test('rgdh monitor daily tab exposes synced local filters for busbar, BYTM, date and control source', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const css = cssSafeRead();

  assert.match(html, /id="dailyFilterBar"/);
  assert.match(html, /<label>Bara[\s\S]*<select id="dailyFilterBusbar"/);
  assert.match(html, /<label>BYTM[\s\S]*<select id="dailyFilterYtm"/);
  assert.match(html, /<label>Tarih[\s\S]*<select id="dailyFilterDate"/);
  assert.match(html, /<label>Kaynak Tipi[\s\S]*<select id="dailyFilterControlSource"/);
  assert.match(html, /id="btnClearDailyFilters"[\s\S]*Filtreleri Temizle/);
  assert.match(js, /dailyFilters:\s*\{\s*busbarId:\s*''/);
  assert.match(js, /function renderDailyFilters/);
  assert.match(js, /function readDailyFilters/);
  assert.match(js, /function applyDailyFiltersToTopFilters/);
  assert.match(js, /function filterDailyPivotRows/);
  assert.match(js, /function clearDailyFilters/);
  assert.match(js, /const filteredDailyPivotRows = filterDailyPivotRows\(dailyPivotRows,\s*state\.dailyFilters\)/);
  assert.match(js, /renderDailyFilters\(dailyPivotRows\)/);
  assert.match(js, /renderDailyTable\(filteredDailyPivotRows\)/);
  assert.match(js, /renderDailyMetricTable\(filteredDailyPivotRows\)/);
  assert.match(js, /dailyFilterControlSource[\s\S]*YKS Kontrol[\s\S]*EK-C Kontrol/);
  assert.match(js, /el\.filterSearch\.value = catalogBusbarKey\(target\)/);
  assert.match(js, /el\.filterDate\.value = filters\.date \|\| ''/);
  assert.match(js, /persistFilters\(\)/);
  assert.match(css, /\.rgdh-daily-filter-bar/);
});

test('rgdh monitor EK-C daily drilldown syncs top filters and comparison scope without fetching', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const selectDailyChartBlock = js.match(/function selectDailyChart[\s\S]*?function renderDailySourceBadge/)?.[0] || '';

  assert.match(js, /function syncFiltersToDailyControlRow/);
  assert.match(js, /function setCompareSelectionFromDailyRow/);
  assert.match(selectDailyChartBlock, /syncFiltersToDailyControlRow\(row\)/);
  assert.match(selectDailyChartBlock, /setCompareSelectionFromDailyRow\(row\)/);
  assert.match(selectDailyChartBlock, /state\.chartSelection = \{ busbarId: row\.busbarId, hour, date: row\.localDate \|\| null \}/);
  assert.match(js, /el\.filterDate\.value = row\.localDate \|\| ''/);
  assert.match(js, /el\.filterEndDate\.value = ''/);
  assert.match(js, /el\.filterSearch\.value = catalogBusbarKey\(target\)/);
  assert.match(js, /hourMode:\s*'all'/);
  assert.doesNotMatch(selectDailyChartBlock, /fetchYksData\(/);
});

test('rgdh monitor scopes EK-C comparison rendering to one busbar and one date', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /function resolveCompareScope/);
  assert.match(js, /function filterRowsForCompareScope/);
  assert.match(js, /function resolveFirstEkcDailyControlRow/);
  assert.match(js, /const compareScope = resolveCompareScope\(platformRows \|\| getFilteredRows\(\), getFilteredEkcRows\(\)\)/);
  assert.match(js, /const scopedPlatformRows = filterRowsForCompareScope\(platformRows \|\| getFilteredRows\(\), compareScope\)/);
  assert.match(js, /const scopedEkcRows = filterRowsForCompareScope\(getFilteredEkcRows\(\), compareScope\)/);
  assert.match(js, /buildEkcPlatformComparison\(scopedPlatformRows,\s*scopedEkcRows\)/);
  assert.match(js, /busbarId: compareScope\.busbarId/);
  assert.match(js, /date: compareScope\.date/);
});

test('rgdh monitor EK-C upload uses file-based catalog binding and duplicate rejection', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');

  assert.match(js, /RGDH_COMPARISON\.bindEkcRowsToCatalog/);
  assert.match(js, /RGDH_COMPARISON\.dedupeEkcFileLoadGroups/);
  assert.match(js, /formatEkcLoadSummary/);
  assert.match(js, /renderStats\(rows,\s*ekcRows\)/);
  assert.match(js, /hasBoundEkcRows/);
});

test('rgdh monitor shows EK-C bulk upload progress popup and page notice', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(html, /id="uploadNotice"/);
  assert.match(html, /id="uploadModal"/);
  assert.match(html, /id="uploadModalTitle"/);
  assert.match(html, /id="uploadModalMessage"/);
  assert.match(html, /id="uploadProgressBar"/);
  assert.match(html, /id="uploadProgressText"/);
  assert.match(html, /id="btnCloseUploadModal"/);
  assert.match(js, /function showUploadFeedback/);
  assert.match(js, /function updateUploadFeedback/);
  assert.match(js, /function finishUploadFeedback/);
  assert.match(js, /function hideUploadFeedback/);
  assert.match(js, /showUploadFeedback\(files\.length,\s*\{ sourceLabel \}\)/);
  assert.match(js, /updateUploadFeedback\(/);
  assert.match(js, /finishUploadFeedback\(loadSummary/);
  assert.match(css, /\.rgdh-upload-notice/);
  assert.match(css, /\.rgdh-upload-modal/);
  assert.match(css, /\.rgdh-upload-progress-bar/);
});

test('rgdh monitor supports Localden Ek-C Cek next to manual EK-C upload', () => {
  const html = fs.readFileSync(path.join(root, 'rgdh-monitor.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const build = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');

  assert.match(html, /id="btnPickCsv"[\s\S]*id="btnLoadLocalEkc"/);
  assert.match(html, /Localden Ek-C Cek/);
  assert.match(html, /id="localEkcDirectoryInput"[\s\S]*webkitdirectory[\s\S]*multiple/);
  assert.match(html, /<script src="rgdh-local-ekc-loader\.js"><\/script>[\s\S]*<script src="rgdh-monitor\.js"><\/script>/);
  assert.match(js, /btnLoadLocalEkc/);
  assert.match(js, /handleLocalEkcLoad/);
  assert.match(js, /readFilters\(\)/);
  assert.match(js, /getLocalEkcLoader/);
  assert.match(js, /getLocalEkcDirectoryHandle/);
  assert.match(js, /collectLocalEkcFilesFromDirectory\(directoryHandle,\s*\{[\s\S]*filters[\s\S]*selectedBusbar[\s\S]*onProgress/);
  assert.match(js, /collectLocalEkcFilesFromFileList\(files,\s*\{[\s\S]*filters[\s\S]*selectedBusbar[\s\S]*onProgress/);
  assert.match(js, /filterParsedEkcRows/);
  assert.match(js, /function handleLocalEkcProgress/);
  assert.match(js, /function yieldToBrowser/);
  assert.match(js, /await yieldToBrowser\(\)/);
  assert.match(js, /const duplicateOnlyWarning/);
  assert.doesNotMatch(js, /Localden Ek-C[\s\S]{0,500}Toplu YKS cekimi yerine tek bara secimi zorunludur/);
  assert.match(build, /'rgdh-local-ekc-loader\.js'/);
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
  assert.ok(data[0].ypn, 'First row should have YTBS plant name');
  assert.ok(Object.prototype.hasOwnProperty.call(data[0], 'ybt'), 'First row should carry second Bara Tipi as YTBS busbar type');
  assert.ok(data.some(row => row.sk === 'WIND'), 'Should have WIND rows');
  assert.ok(data.some(row => row.sk !== 'WIND'), 'Should have CONVENTIONAL rows');
});

test('extension build and manifest include the auxiliary catalog overlay and v2 catalog', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const buildScript = fs.readFileSync(path.join(root, 'build-extension.ps1'), 'utf8');
  const webResources = manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);

  assert.ok(webResources.includes('rgdh-auxiliary-catalog.js'));
  assert.ok(webResources.includes('yks_izleme_modul/yks_docs/rgdh_unite_tanimi_v2.csv'));
  assert.ok(webResources.includes('yks_izleme_modul/yks_docs/rgdh_unite_tanimi_.csv'));
  assert.match(buildScript, /rgdh-auxiliary-catalog\.js/);
  assert.match(buildScript, /yks_izleme_modul[\\\/]yks_docs[\\\/]rgdh_unite_tanimi_v2\.csv/);
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

test('rgdh monitor renders synchronous condenser SK badges and droop comparison columns', () => {
  const js = fs.readFileSync(path.join(root, 'rgdh-monitor.js'), 'utf8');
  const charts = fs.readFileSync(path.join(root, 'rgdh-charts.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(js, /renderSkBadge/);
  assert.match(js, /hasSynchronousCondenser/);
  assert.match(js, /synchronousCondenserSuccessMinuteCount/);
  assert.match(js, /renderSkBadge\(hour,\s*\{\s*requireActive:\s*true,\s*showCount:\s*true\s*\}\)/);
  assert.match(js, /renderHybridNameHtml\(row\.busbarName \|\| row\.busbarId \|\| '-', row,\s*\{\s*showSk:\s*true\s*\}\)/);
  assert.doesNotMatch(js, /renderSkBadge\(row\) \|\| '-'/);
  assert.match(js, /YKS Droop %/);
  assert.match(js, /EK-C Droop %/);
  assert.match(charts, /synchronousCondenserActive/);
  assert.doesNotMatch(charts, /'Katilim', 'SK', 'Ort Droop %'/);
  assert.match(css, /\.rgdh-sk-badge/);
  assert.match(css, /\.rgdh-sk-candidate/);
  assert.match(css, /\.rgdh-sk-ok/);
  assert.match(css, /\.rgdh-sk-fail/);
  assert.match(css, /\.rgdh-sk-neutral/);
});

test('rgdh monitor dark theme has explicit readable selected and sticky table colors', () => {
  const css = fs.readFileSync(path.join(root, 'rgdh-monitor.css'), 'utf8');

  assert.match(css, /\[data-theme="dark"\]\s+\.rgdh-table tbody tr\.selected td/);
  assert.match(css, /\[data-theme="dark"\]\s+\.rgdh-table td:first-child/);
  assert.match(css, /--chart-text/);
  assert.match(css, /--table-selected-bg/);
});
