const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const popupHtmlPath = path.join(__dirname, '..', 'popup.html');
const popupJsPath = path.join(__dirname, '..', 'popup.js');
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const mapModernHtmlPath = path.join(__dirname, '..', 'map-modern.html');

test('popup.html loads shared helpers before popup.js', () => {
  const html = fs.readFileSync(popupHtmlPath, 'utf8');

  assert.match(
    html,
    /<script src="map-common\.js"><\/script>\s*<script src="tpys-periodic-rgdh-planner\.js"><\/script>\s*<script src="popup\.js"><\/script>/i
  );
});

test('popup.js resolves text normalization through MAP_COMMON helper', () => {
  const code = fs.readFileSync(popupJsPath, 'utf8');

  assert.match(code, /MAP_COMMON\.normalizeText/);
  assert.doesNotMatch(code, /function normalizeText\(/);
});

test('extension shell uses YKS naming in visible titles', () => {
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  const mapModernHtml = fs.readFileSync(mapModernHtmlPath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.name, 'SCADA/YTBS/TPYS/YKS Haritalar ve Otomasyon');
  assert.equal(manifest.action.default_title, 'SCADA/YTBS/TPYS/YKS Haritalar ve Otomasyon');
  assert.match(popupHtml, /<title>SCADA\/YTBS\/TPYS\/YKS Haritalar ve Otomasyon<\/title>/);
  assert.match(popupHtml, /<h1>SCADA\/YTBS\/TPYS\/YKS Haritalar ve Otomasyon<\/h1>/);
  assert.match(popupHtml, /<h2>RGDH Uzlaştırma Otomasyon<\/h2>/);
  assert.match(mapModernHtml, />SCADA\/YTBS\/TPYS\/YKS Haritalar<\/h2>/);
});

test('popup combines RGDH automation actions and removes ERP commit', () => {
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  const popupJs = fs.readFileSync(popupJsPath, 'utf8');

  assert.equal((popupHtml.match(/RGDH Uzlaştırma Otomasyon/g) || []).length, 1);
  assert.doesNotMatch(popupHtml, /Reaktif eşleştirme RGDH Sonuç Otomasyon/i);
  assert.match(popupHtml, /id="btnPickCsv"[^>]*>Uzlaştırma CSV Yükle<\/button>/);
  assert.match(popupHtml, /id="btnApply"[^>]*>CSV TPYS Eşleştirme<\/button>/);
  assert.match(popupHtml, /id="btnToggleSimplify"[^>]*>TPYS Sayfa Sadeleştir<\/button>/);
  assert.doesNotMatch(popupHtml, /btnCommit|ERP Commit/);
  assert.doesNotMatch(popupJs, /btnCommit|commitCurrentTab|CLICK_COMMIT|ERP Commit/);
});

test('popup exposes periodic TPYS match summary fields', () => {
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  const popupJs = fs.readFileSync(popupJsPath, 'utf8');

  assert.match(popupHtml, /id="matchedBaraName"/);
  assert.match(popupHtml, /id="matchedDateCount"/);
  assert.match(popupHtml, /id="matchedHourCount"/);
  assert.match(popupHtml, /id="sameHourCount"/);
  assert.match(popupHtml, /id="differentHourCount"/);
  assert.match(popupHtml, /id="changedHourCount"/);
  assert.match(popupJs, /matchedBaraName/);
  assert.match(popupJs, /matchedDateCount/);
  assert.match(popupJs, /matchedHourCount/);
  assert.match(popupJs, /sameHourCount/);
  assert.match(popupJs, /differentHourCount/);
  assert.match(popupJs, /changedHourCount/);
  assert.match(popupJs, /updateStatusComparisonSummary/);
});

test('RGDH popup does not expose or send approval automation for CSV TPYS matching', () => {
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  const popupJs = fs.readFileSync(popupJsPath, 'utf8');

  assert.doesNotMatch(popupHtml, /id="checkApproval"/);
  assert.doesNotMatch(popupHtml, /onay h[üu]cresini de i[şs]aretlemeyi dene/i);
  assert.match(popupJs, /checkApproval:\s*false/);
  assert.match(popupJs, /settings:\s*\{\s*\.\.\.state\.settings,\s*checkApproval:\s*false/);
});

test('TPYS CSV download card exposes date range, standard options and report action', () => {
  const html = fs.readFileSync(popupHtmlPath, 'utf8');

  assert.match(html, /id="downloadStartDate"[^>]+type="date"/);
  assert.match(html, /id="downloadEndDate"[^>]+type="date"/);
  assert.match(html, /id="downloadAsciiNormalize"[^>]+type="checkbox"/);
  assert.match(html, /id="downloadSkipDuplicateContent"[^>]+type="checkbox"[^>]+checked/);
  assert.match(html, /id="btnDownloadAllCsvs"[^>]*>Standart CSV indir<\/button>/);
  assert.match(html, /id="btnDownloadCsvReport"/);
  assert.doesNotMatch(html, />42 CSV indir<\/button>/);
});

test('popup.js sends TPYS CSV date-range payload and handles progress/report messages', () => {
  const code = fs.readFileSync(popupJsPath, 'utf8');

  assert.match(code, /downloadStartDate/);
  assert.match(code, /downloadEndDate/);
  assert.match(code, /asciiNormalize:\s*el\.downloadAsciiNormalize\.checked/);
  assert.match(code, /skipDuplicateContent:\s*el\.downloadSkipDuplicateContent\.checked/);
  assert.match(code, /TPYS_CSV_PROGRESS/);
  assert.match(code, /TPYS_CSV_REPORT_DOWNLOAD/);
});

test('popup.js injects TPYS ExtJS apply helper in MAIN world before DOM fallback', () => {
  const code = fs.readFileSync(popupJsPath, 'utf8');

  assert.match(code, /tpys-extjs-main-apply\.js/);
  assert.match(code, /world:\s*['"]MAIN['"]/);
  assert.match(code, /applyPlanViaMainWorld/);
  assert.match(code, /modeUsed:\s*['"]ext-main-batch['"]/);
  assert.match(code, /shouldUseDomFallback/);
  assert.match(code, /mappingDiagnostics/);
  assert.match(code, /resolvedStatusMap/);
});

test('manifest loads TPYS CSV automation core before content-script', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const generalScript = manifest.content_scripts.find((entry) => entry.js?.includes('content-script.js'));

  assert.ok(generalScript);
  assert.deepEqual(
    generalScript.js.slice(-2),
    ['tpys-csv-automation-core.js', 'content-script.js']
  );
});
