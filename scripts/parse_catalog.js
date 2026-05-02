const fs = require('fs');
const path = require('path');

const csv = require('../rgdh-csv.js');

const csvPath = path.join(__dirname, '..', 'yks_izleme_modul', 'yks_docs', 'rgdh_unite_tanimi_v2.csv');
const outPath = path.join(__dirname, '..', 'rgdh-catalog-data.js');

const shortNames = {
  busbarType: 'bt',
  busbarId: 'bid',
  busbarName: 'bn',
  rgkType: 'rt',
  voltageLevel: 'vl',
  ytm: 'ytm',
  plantId: 'pid',
  plantName: 'pn',
  busbar1Ta: 'b1t',
  busbar1Setnum: 'b1s',
  busbar2Ta: 'b2t',
  busbar2Setnum: 'b2s',
  busbar3Ta: 'b3t',
  busbar3Setnum: 'b3s',
  unitName: 'un',
  uevcbName: 'ue',
  unitId: 'uid',
  sourceKind: 'sk',
  activePowerTa: 'apt',
  activePowerSetnum: 'aps',
  reactivePowerTa: 'rpt',
  reactivePowerSetnum: 'rps',
  unitPnomMw: 'pnom',
  unitPmkudMw: 'pmkud',
  lowExcitationTest: 'lowTest',
  highExcitationTest: 'highTest',
  nominalLowExcitation: 'nomLow',
  nominalHighExcitation: 'nomHigh',
  speedDrop: 'sd',
  powerFactor: 'pf',
  terminalVoltage: 'tv',
  unitActive: 'ua',
  ytbsPlantName: 'ypn',
  ytbsSubstationId: 'ysid',
  ytbsSubstationName: 'ysn',
  latitude: 'lat',
  longitude: 'lon',
  ytbsSourceType: 'ysrc',
  secondarySources: 'secsrc',
  city: 'city',
  ytbsBusbarType: 'ybt',
  hasSynchronousCondenser: 'sync',
  hasEuasProtocol: 'euas',
  platformRgkType: 'prgk',
  rgkTypeDescription: 'rgkdesc',
  isBalancingUnit: 'db',
  tpysUnitMkud: 'tum',
  tpysPlantMkud: 'tpm'
};

function compactCatalogRow(row) {
  const compact = {};
  Object.entries(shortNames).forEach(([longKey, shortKey]) => {
    compact[shortKey] = longKey === 'unitActive' ? formatActive(row[longKey]) : row[longKey];
  });
  return compact;
}

function formatActive(value) {
  if (value === true) return 'AKTİF';
  if (value === false) return 'PASİF';
  return null;
}

function writeCatalogData(inputPath = csvPath, outputPath = outPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = csv.parseRgdhCsvText(raw, { filename: path.basename(inputPath) });
  if (parsed.type !== 'BUSBAR_UNIT_CATALOG') {
    throw new Error(`Unexpected catalog CSV type: ${parsed.type}`);
  }
  const compact = parsed.rows.map(compactCatalogRow);
  const json = JSON.stringify(compact);
  const source = path.relative(path.join(__dirname, '..'), inputPath).replace(/\\/g, '/');
  const js = `// AUTO-GENERATED - DO NOT EDIT\n// Source: ${source}\n(function(root){root.RGDH_CATALOG_DATA=${json};})(typeof self!=='undefined'?self:globalThis);\n`;
  fs.writeFileSync(outputPath, js, 'utf8');
  return compact;
}

if (require.main === module) {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : csvPath;
  const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : outPath;
  const rows = writeCatalogData(inputPath, outputPath);
  console.log(`Written ${rows.length} rows to ${outputPath}`);
}

module.exports = {
  compactCatalogRow,
  writeCatalogData
};
