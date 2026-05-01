const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const defaultInputPath = path.join(rootDir, 'yks_izleme_modul', 'yks_docs', 'resges_bara_tanım.txt');
const defaultOutputPath = path.join(rootDir, 'rgdh-auxiliary-catalog.js');

const CONVENTIONAL_AUXILIARY_ROWS = [
  {
    sourceOrigin: 'CATALOG_AUXILIARY',
    sourceType: 'CONVENTIONAL',
    busbarType: 'CONVENTIONAL',
    busbarId: 6137,
    busbarName: 'KARAMAN BES',
    rgkType: 'CONVENTIONAL_AUXILIARY_GES',
    voltageLevel: 154,
    ytm: 'OA_YTM',
    plantId: null,
    plantName: 'KARAMAN BES',
    unitName: 'YARDIMCI KAYNAK GES',
    uevcbName: 'KARAMAN BES',
    unitId: 3214971,
    sourceKind: 'GES (Gunes Enerji Santrali)',
    activePowerTa: 'KARMNBES/1/GESHAT-1/P',
    activePowerSetnum: '2,1,160513',
    reactivePowerTa: 'KARMNBES/1/GESHAT-1/Q',
    reactivePowerSetnum: '2,1,160514',
    unitPnomMw: 5.99,
    unitPmkudMw: null,
    lowExcitationTest: -2.901,
    highExcitationTest: 2.901,
    nominalLowExcitation: -2.901,
    nominalHighExcitation: 2.901,
    speedDrop: 4,
    unitActive: true
  }
];

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanCell(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  const text = String(value ?? '').trim();
  if (!text || text === '-') return null;
  const normalized = text.includes(',') && !text.includes('.')
    ? text.replace(',', '.')
    : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseActive(value) {
  const text = String(value || '').toLocaleUpperCase('tr-TR');
  if (text.includes('EVET') || text.includes('AKTIF') || text.includes('AKTİF')) return true;
  if (text.includes('HAYIR') || text.includes('PASIF') || text.includes('PASİF')) return false;
  return null;
}

function extractCells(rowHtml) {
  return [...String(rowHtml || '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((match) => cleanCell(match[1]));
}

function parseResgesAuxiliaryCatalogHtml(html) {
  const rows = [];
  let currentBusbar = null;
  const rowParts = String(html || '').split(/<tr\b[^>]*>/i).slice(1);

  rowParts.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length >= 17 && /RÜZGAR\/GÜNEŞ/i.test(cells[0])) {
      currentBusbar = {
        sourceOrigin: 'CATALOG_AUXILIARY',
        sourceType: 'WIND',
        busbarType: 'WIND',
        busbarId: parseNumber(cells[1]),
        busbarName: cells[2],
        rgkType: cells[3],
        voltageLevel: parseNumber(cells[4]),
        ytm: cells[5],
        plantId: parseNumber(cells[7]),
        plantName: cells[8]
      };
      return;
    }

    if (!currentBusbar || cells.length < 17 || !/YARDIMCI KAYNAK/i.test(cells[0])) return;
    rows.push({
      ...currentBusbar,
      rgkType: 'WIND_AUXILIARY_GES',
      unitName: cells[0],
      uevcbName: cells[1],
      unitId: parseNumber(cells[2]),
      sourceKind: 'GES (Gunes Enerji Santrali)',
      activePowerTa: cells[4],
      activePowerSetnum: cells[5],
      reactivePowerTa: cells[6],
      reactivePowerSetnum: cells[7],
      unitPnomMw: parseNumber(cells[8]),
      unitPmkudMw: null,
      lowExcitationTest: parseNumber(cells[9]),
      nominalLowExcitation: parseNumber(cells[10]),
      highExcitationTest: parseNumber(cells[11]),
      nominalHighExcitation: parseNumber(cells[12]),
      powerFactor: parseNumber(cells[13]),
      terminalVoltage: parseNumber(cells[14]),
      speedDrop: parseNumber(cells[15]),
      unitActive: parseActive(cells[16])
    });
  });

  return rows;
}

function buildAuxiliaryCatalogData(html) {
  return [
    ...CONVENTIONAL_AUXILIARY_ROWS,
    ...parseResgesAuxiliaryCatalogHtml(html)
  ];
}

function renderAuxiliaryCatalogJs(rows) {
  const json = JSON.stringify(rows, null, 2);
  return `// AUTO-GENERATED - DO NOT EDIT\n// Source: yks_izleme_modul/yks_docs/resges_bara_tanım.txt + KARAMAN BES auxiliary definition\n(function (root) {\n  root.RGDH_AUXILIARY_CATALOG_DATA=${json};\n})(typeof self !== 'undefined' ? self : globalThis);\n`;
}

function writeAuxiliaryCatalog(inputPath = defaultInputPath, outputPath = defaultOutputPath) {
  const html = fs.readFileSync(inputPath, 'utf8');
  const rows = buildAuxiliaryCatalogData(html);
  fs.writeFileSync(outputPath, renderAuxiliaryCatalogJs(rows), 'utf8');
  return rows;
}

if (require.main === module) {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInputPath;
  const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutputPath;
  const rows = writeAuxiliaryCatalog(inputPath, outputPath);
  console.log(`Written ${rows.length} auxiliary rows to ${outputPath}`);
}

module.exports = {
  parseResgesAuxiliaryCatalogHtml,
  buildAuxiliaryCatalogData,
  renderAuxiliaryCatalogJs,
  writeAuxiliaryCatalog
};
