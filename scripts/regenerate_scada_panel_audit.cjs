const fs = require('fs');
const path = require('path');

const { normalizeText } = require('../map-common.js');

const ROOT = process.cwd();
const PANEL_CSV_PATH = path.join(ROOT, 'docs', 'scada_panel_hat_2026-04-20.csv');
const NETWORK_TABLE_PATH = path.join(ROOT, 'docs', 'network_table.md');
const MODEL_PATH = path.join(ROOT, 'data', 'kml_layers_v2.json');
const OUTPUT_CSV_PATH = path.join(ROOT, 'docs', 'tarama', 'scada_panel_hat_2026-04-20_audit_regen.csv');
const OUTPUT_MD_PATH = path.join(ROOT, 'docs', 'tarama', 'scada_panel_hat_2026-04-20_audit_summary.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parsePanelCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split('";"').map((part, index, array) => {
      let value = part;
      if (index === 0) value = value.replace(/^"/, '');
      if (index === array.length - 1) value = value.replace(/"$/, '');
      return value;
    });
    rows.push({
      sira: parts[0],
      name: parts[1],
      km: parts[2],
      zaman: parts[3],
      mw: parts[4],
      mvar: parts[5],
      pct: parts[6]
    });
  }
  return rows;
}

function parseNetworkTable(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const marker = '\r\n\r\n{\r\n    "result": {';
  const markerIndex = raw.indexOf(marker);
  const firstDocument = markerIndex > 0 ? raw.slice(0, markerIndex) : raw;
  const json = JSON.parse(firstDocument);
  return json.result?.[0]?.data || [];
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function writeCsv(filePath, header, rows) {
  const lines = [
    header.map(csvEscape).join(';'),
    ...rows.map((row) => row.map(csvEscape).join(';'))
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function compactText(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function simplifyAlias(value) {
  return compactText(value).replace(/(tes|hes|gis|tm|dgkcs|dgkc|osb|havza|sanayi|merkezi)+$/g, '');
}

function aliasMatch(left, right) {
  const a = simplifyAlias(left);
  const b = simplifyAlias(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 5 && b.startsWith(a)) return true;
  if (b.length >= 5 && a.startsWith(b)) return true;
  if (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6)) return true;
  return false;
}

function sameTimestamp(left, right) {
  return Number(left?.timestamp?.getTime?.() || 0) === Number(right?.timestamp?.getTime?.() || 0);
}

function roundMetricValue(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sameMetricDirection(values) {
  const directionSet = new Set(values
    .filter((value) => Number.isFinite(value) && Math.abs(value) > 1)
    .map((value) => (value >= 0 ? 'forward' : 'reverse')));
  return directionSet.size <= 1;
}

function getCapacityMva(hat) {
  const winter = Number(hat.winterCapacityMva || 0);
  const summer = Number(hat.summerCapacityMva || 0);
  return winter || summer || 1;
}

function getHatTolerance(hat) {
  return Math.max(12, getCapacityMva(hat) * 0.08);
}

function buildCurrentOrientationEntries(hat, presentCandidates) {
  const startName = normalizeText(hat.startTm || '');
  const endName = normalizeText(hat.endTm || '');
  return presentCandidates.map(({ candidate, row }) => {
    const formula = Array.isArray(candidate.formulaParts)
      ? candidate.formulaParts.find((part) => part?.parsed)
      : null;
    const sign = Number(formula?.sign || 1);
    const rowStart = normalizeText(row.tmName || '');
    const rowEnd = normalizeText(row.remoteName || '');
    let orientation = 1;
    if (rowStart && rowEnd) {
      if (rowStart === startName && rowEnd === endName) orientation = 1;
      else if (rowStart === endName && rowEnd === startName) orientation = -1;
    }
    return {
      candidate,
      row,
      timestamp: row.timestamp,
      normalizedValue: Number(row.value) * sign * orientation,
      rowStart,
      rowEnd,
      exactForward: rowStart === startName && rowEnd === endName,
      exactReverse: rowStart === endName && rowEnd === startName
    };
  }).sort((left, right) => Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0));
}

function classifyCurrentStatus(hat, presentCandidates) {
  const oriented = buildCurrentOrientationEntries(hat, presentCandidates);
  if (!oriented.length) {
    return {
      status: 'missing-source-row',
      reason: 'Aktif SCADA ID kaynak tabloda yok.'
    };
  }
  if (oriented.length === 1) {
    return {
      status: 'matched-single',
      reason: 'Tek aktif aday kaynakta bulundu.',
      newest: oriented
    };
  }
  const newest = oriented.filter((entry) => sameTimestamp(entry, oriented[0]));
  if (newest.length === 1) {
    return {
      status: 'matched-single',
      reason: 'En yeni aktif aday tekil secildi.',
      newest
    };
  }
  const distinctValues = new Set(newest.map((entry) => String(roundMetricValue(entry.normalizedValue))));
  if (distinctValues.size === 1) {
    return {
      status: 'matched-single',
      reason: 'Ayni zamanli aktif adaylar ayni degerde.',
      newest
    };
  }
  const values = newest.map((entry) => Number(entry.normalizedValue)).filter((value) => Number.isFinite(value));
  if (values.length && sameMetricDirection(values)) {
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const delta = maxValue - minValue;
    if (delta <= getHatTolerance(hat)) {
      return {
        status: 'matched-tolerance',
        reason: `Ayni yonlu coklu aday tolerans icinde (${delta.toFixed(2)} MW).`,
        newest,
        delta
      };
    }
  }
  const exactOrientationHit = newest.some((entry) => entry.exactForward || entry.exactReverse);
  return {
    status: 'ambiguous-live',
    reason: exactOrientationHit
      ? 'Coklu aday var ancak ayni anda tutarsiz deger uretiyor.'
      : 'Coklu aday var; kaynak terminal adlari TM adlariyla exact eslesmedigi icin yon normalize edilemiyor.',
    newest,
    exactOrientationHit
  };
}

function classifyHeuristicPotential(hat, presentCandidates) {
  const newest = presentCandidates.map(({ candidate, row }) => {
    const formula = Array.isArray(candidate.formulaParts)
      ? candidate.formulaParts.find((part) => part?.parsed)
      : null;
    const sign = Number(formula?.sign || 1);
    const sourceA = formula?.stationCode || row.tmName || '';
    const sourceB = formula?.targetCode || row.remoteName || '';
    const forward = aliasMatch(sourceA, hat.startTm || '') && aliasMatch(sourceB, hat.endTm || '');
    const reverse = aliasMatch(sourceA, hat.endTm || '') && aliasMatch(sourceB, hat.startTm || '');
    const orientation = reverse ? -1 : 1;
    return {
      candidate,
      row,
      sourceA,
      sourceB,
      forward,
      reverse,
      timestamp: row.timestamp,
      normalizedValue: Number(row.value) * sign * orientation
    };
  }).sort((left, right) => Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0));

  if (!newest.length) return { potential: 'none' };
  const sameTime = newest.filter((entry) => sameTimestamp(entry, newest[0]));
  const values = sameTime.map((entry) => Number(entry.normalizedValue)).filter((value) => Number.isFinite(value));
  const distinctValues = new Set(sameTime.map((entry) => String(roundMetricValue(entry.normalizedValue))));
  if (sameTime.length <= 1 || distinctValues.size === 1) {
    return {
      potential: 'would-resolve',
      reason: 'Alias-aware yon eslestirme ile tekil secim korunur.'
    };
  }
  if (values.length && sameMetricDirection(values)) {
    const delta = Math.max(...values) - Math.min(...values);
    if (delta <= getHatTolerance(hat)) {
      return {
        potential: 'would-resolve',
        reason: `Alias-aware yon eslestirme ile tolerans icinde birlesir (${delta.toFixed(2)} MW).`
      };
    }
  }
  const aliasHit = sameTime.some((entry) => entry.forward || entry.reverse);
  return {
    potential: aliasHit ? 'still-ambiguous' : 'needs-better-alias',
    reason: aliasHit
      ? 'Alias eslestirme olsa bile uc degerler ayrisik kaliyor.'
      : 'Alias katmani olmadan terminal yonu belirlenemiyor.'
  };
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(2);
}

function main() {
  const model = readJson(MODEL_PATH);
  const panelRows = parsePanelCsv(PANEL_CSV_PATH);
  const networkRows = parseNetworkTable(NETWORK_TABLE_PATH);
  const hatsByName = new Map((model.hatLines || []).map((hat) => [hat.name, hat]));
  const sourceById = new Map(networkRows.map((row) => [String(row.sinsid || '').trim(), {
    measurementId: String(row.sinsid || '').trim(),
    tmName: row.b1Name || '',
    remoteName: row.b3Name || '',
    timestamp: new Date(row['MAX(__time)']),
    value: Number(row['AVG(maxValue)'])
  }]));

  const summary = {
    visibleTotal: panelRows.length,
    mappedHats: 0,
    nameMisses: 0,
    missingConfigId: 0,
    missingSourceRow: 0,
    ambiguousLive: 0,
    matchedSingle: 0,
    matchedTolerance: 0,
    panelMwPresent: 0,
    panelMwBlank: 0,
    panelBlankWithMvar: 0,
    panelBlankWithoutMvar: 0,
    panelBlankButBroadSourceMatched: 0,
    ambiguousNeedsAliasLayer: 0,
    ambiguousCouldResolveWithAlias: 0,
    ambiguousStillAmbiguousAfterAlias: 0
  };

  const auditRows = [];
  const missingSourceExamples = [];
  const ambiguousExamples = [];
  const missingConfigExamples = [];

  for (const panelRow of panelRows) {
    const hat = hatsByName.get(panelRow.name);
    if (!hat) {
      summary.nameMisses += 1;
      auditRows.push([
        panelRow.sira,
        panelRow.name,
        '',
        'name-miss',
        'KML V2 modelinde hat bulunamadi.',
        '',
        '',
        panelRow.mw,
        panelRow.mvar,
        panelRow.pct,
        '',
        '',
        '',
        '',
        ''
      ]);
      continue;
    }

    summary.mappedHats += 1;
    const mwBlank = !String(panelRow.mw || '').trim();
    const mvarBlank = !String(panelRow.mvar || '').trim();
    if (mwBlank) {
      summary.panelMwBlank += 1;
      if (mvarBlank) summary.panelBlankWithoutMvar += 1;
      else summary.panelBlankWithMvar += 1;
    } else {
      summary.panelMwPresent += 1;
    }

    const activeIds = hat.scada?.active?.ids || [];
    const activeRows = hat.scada?.active?.rows || [];
    const reactiveIds = hat.scada?.reactive?.ids || [];
    const presentCandidates = activeRows
      .map((candidate) => ({ candidate, row: sourceById.get(String(candidate.measurementId || '').trim()) }))
      .filter((entry) => entry.row);

    let status;
    let reason;
    let heuristicPotential = '';
    let heuristicReason = '';
    let newestValues = '';
    let newestPairs = '';

    if (!activeIds.length) {
      status = 'missing-config-id';
      reason = 'Aktif SCADA ID tanimi yok.';
      summary.missingConfigId += 1;
      missingConfigExamples.push(hat.name);
    } else if (!presentCandidates.length) {
      status = 'missing-source-row';
      reason = 'Aktif SCADA ID kaynak tabloda bulunamadi.';
      summary.missingSourceRow += 1;
      missingSourceExamples.push(hat.name);
    } else {
      const classification = classifyCurrentStatus(hat, presentCandidates);
      status = classification.status;
      reason = classification.reason;
      const heuristic = classifyHeuristicPotential(hat, presentCandidates);
      heuristicPotential = heuristic.potential;
      heuristicReason = heuristic.reason || '';
      newestValues = (classification.newest || [])
        .map((entry) => formatNumber(entry.normalizedValue))
        .filter(Boolean)
        .join(' | ');
      newestPairs = (classification.newest || [])
        .map((entry) => `${entry.row.tmName}->${entry.row.remoteName}`)
        .join(' | ');

      if (status === 'ambiguous-live') {
        summary.ambiguousLive += 1;
        if (heuristicPotential === 'needs-better-alias') summary.ambiguousNeedsAliasLayer += 1;
        if (heuristicPotential === 'would-resolve') summary.ambiguousCouldResolveWithAlias += 1;
        if (heuristicPotential === 'still-ambiguous') summary.ambiguousStillAmbiguousAfterAlias += 1;
        ambiguousExamples.push(hat.name);
      } else if (status === 'matched-single') {
        summary.matchedSingle += 1;
      } else if (status === 'matched-tolerance') {
        summary.matchedTolerance += 1;
      }
    }

    if (mwBlank && (status === 'matched-single' || status === 'matched-tolerance')) {
      summary.panelBlankButBroadSourceMatched += 1;
    }

    auditRows.push([
      panelRow.sira,
      hat.name,
      hat.kvBucket || hat.kv || '',
      status,
      reason,
      activeIds.length,
      presentCandidates.length,
      panelRow.mw,
      panelRow.mvar,
      panelRow.pct,
      activeIds.join(' | '),
      reactiveIds.join(' | '),
      heuristicPotential,
      heuristicReason,
      newestValues || newestPairs
    ]);
  }

  writeCsv(OUTPUT_CSV_PATH, [
    'Sira',
    'Hat Adi',
    'kV',
    'Durum',
    'Neden',
    'Aktif ID Adedi',
    'Kaynakta Bulunan Aktif ID',
    'Panel MW',
    'Panel MVAR',
    'Panel Yuklenme (%)',
    'Aktif SCADA IDler',
    'Reaktif SCADA IDler',
    'Alias Potansiyeli',
    'Alias Notu',
    'Kaynak Deger Ozet'
  ], auditRows);

  const markdown = [
    '# SCADA Panel Audit Yeniden Uretim Ozeti',
    '',
    `Tarih: \`${new Date().toISOString()}\``,
    '',
    'Incelenen dosyalar:',
    `- \`${path.relative(ROOT, PANEL_CSV_PATH)}\``,
    `- \`${path.relative(ROOT, NETWORK_TABLE_PATH)}\``,
    `- \`${path.relative(ROOT, MODEL_PATH)}\``,
    '',
    '## Ozet',
    '',
    `- Gorunen panel satiri: \`${summary.visibleTotal}\``,
    `- V2 modele eslesen hat: \`${summary.mappedHats}\``,
    `- \`missing-config-id\`: \`${summary.missingConfigId}\``,
    `- \`missing-source-row\`: \`${summary.missingSourceRow}\``,
    `- \`ambiguous-live\`: \`${summary.ambiguousLive}\``,
    `- \`matched-single\`: \`${summary.matchedSingle}\``,
    `- \`matched-tolerance\`: \`${summary.matchedTolerance}\``,
    '',
    '## Panel Bos MW Dagilimi',
    '',
    `- MW dolu satir: \`${summary.panelMwPresent}\``,
    `- MW bos satir: \`${summary.panelMwBlank}\``,
    `- MW bos + MVAR dolu: \`${summary.panelBlankWithMvar}\``,
    `- MW bos + MVAR bos: \`${summary.panelBlankWithoutMvar}\``,
    `- Panelde MW bos gorunmesine ragmen broad kaynakta eslesebilen satir: \`${summary.panelBlankButBroadSourceMatched}\``,
    '',
    '## Neden Istenen Iyilesme Gorunmedi',
    '',
    `- Gercek \`missing-source-row\` sayisi bu broad P kaynaginda yalnizca \`${summary.missingSourceRow}\`. Ana kayip artik kaynak yoklugundan degil, \`${summary.ambiguousLive}\` adet aktif coklu adaydan geliyor.`,
    `- Ambiguous satirlarin \`${summary.ambiguousCouldResolveWithAlias}\` adedi, terminal kodlari icin alias-aware yon normalizasyonu olsaydi cozulmeye aday. \`${summary.ambiguousNeedsAliasLayer}\` adette sorun dogrudan alias/exact-name uyumsuzlugundan kaynaklaniyor.`,
    `- Panel exportu audit exportu degil. Bu nedenle panelde MW bos kalan \`${summary.panelBlankButBroadSourceMatched}\` satir, broad Superset kaynaginda aslinda eslesebilir gorunuyor.`,
    '',
    '## Ornekler',
    '',
    `- missing-config-id: ${missingConfigExamples.slice(0, 5).join(' | ') || '-'}`,
    `- missing-source-row: ${missingSourceExamples.slice(0, 7).join(' | ') || '-'}`,
    `- ambiguous-live: ${ambiguousExamples.slice(0, 8).join(' | ') || '-'}`,
    ''
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD_PATH, `${markdown}\n`, 'utf8');

  const consoleSummary = {
    csv: path.relative(ROOT, OUTPUT_CSV_PATH),
    markdown: path.relative(ROOT, OUTPUT_MD_PATH),
    summary
  };
  console.log(JSON.stringify(consoleSummary, null, 2));
}

main();
