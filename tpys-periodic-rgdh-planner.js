(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TPYS_PERIODIC_RGDH_PLANNER = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const VALID_STATUS_CODES = new Set(['OK', 'X', 'DD', 'YY', 'KY']);
  const HOUR_KEYS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

  function parseRgdhDailyResultCsv(text) {
    const parsed = parseDelimitedText(text, ';');
    return {
      headers: parsed.headers,
      rows: parsed.rows
    };
  }

  function decodeCsvTextFromBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array
      ? buffer
      : new Uint8Array(buffer || []);
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return decodeBytes(bytes, 'utf-16le');
    }
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return decodeBytes(bytes, 'utf-16be');
    }
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return decodeBytes(bytes, 'utf-8');
    }
    return decodeBytes(bytes, 'utf-8');
  }

  function buildPeriodicPlanForPage(input = {}) {
    const csvRows = Array.isArray(input.csvRows) ? input.csvRows : [];
    const pageRows = normalizePageRows(input.pageRows || []);
    const mappingIndex = input.mappingIndex || {};
    const normalizedCsv = normalizeDailyResultRows(csvRows, { mappingIndex });
    const warnings = [...normalizedCsv.warnings];
    const blockingErrors = [...normalizedCsv.blockingErrors];

    const csvBaras = uniqueBy(normalizedCsv.rows.map((row) => row.sourceBara).filter(Boolean), normalizeText);
    const pageBaraKeys = new Set(pageRows.map((row) => row.baraKey).filter(Boolean));
    const pageDateKeys = new Set(pageRows.map((row) => row.localDate).filter(Boolean));
    const pageBaras = uniqueBy(pageRows.map((row) => row.baraName).filter(Boolean), normalizeText);
    if (pageBaras.length > 1) {
      warnings.push(`Donemlik sayfada birden fazla bara bulundu: ${pageBaras.join(', ')}`);
    }

    const grouped = new Map();
    for (const row of normalizedCsv.rows) {
      if (!row.valid) continue;
      if (!grouped.has(row.csvKey)) grouped.set(row.csvKey, []);
      grouped.get(row.csvKey).push(row);
    }

    const dedupedRows = [];
    const ambiguousRows = [];
    for (const [key, group] of grouped.entries()) {
      if (group.length === 1) {
        dedupedRows.push(group[0]);
        continue;
      }
      const preferred = group.filter((row) => isEkcControl(row.sourceType));
      if (preferred.length === 1) {
        dedupedRows.push(preferred[0]);
        continue;
      }
      ambiguousRows.push({
        key: `${group[0].sourceBara}|${group[0].localDate}`,
        count: group.length,
        rows: group
      });
    }

    const pageMap = new Map();
    for (const row of pageRows) {
      if (!row.periodKey) continue;
      if (!pageMap.has(row.periodKey)) pageMap.set(row.periodKey, row);
    }

    const operations = [];
    const matchedPageKeys = new Set();
    const filteredOutCsvRows = [];
    const missingPageRows = [];

    for (const row of dedupedRows) {
      const matchBaraName = row.matchBaraName || row.sourceBara;
      const matchBaraKey = normalizeText(matchBaraName);
      const sourceBaraKey = normalizeText(row.sourceBara);
      if (pageBaraKeys.size && !pageBaraKeys.has(matchBaraKey) && !pageBaraKeys.has(sourceBaraKey)) {
        filteredOutCsvRows.push(row);
        continue;
      }

      const periodKey = makePeriodKey(matchBaraName, row.localDate);
      const sourcePeriodKey = makePeriodKey(row.sourceBara, row.localDate);
      const pageRow = pageMap.get(periodKey) || pageMap.get(sourcePeriodKey);
      if (!pageRow) {
        missingPageRows.push(row);
        continue;
      }

      const operation = {
        operationKey: pageRow.periodKey,
        sourceDate: row.localDate,
        localDate: row.localDate,
        sourceBara: row.sourceBara,
        sourceType: row.sourceType,
        tpysBaraAdi: pageRow.baraName || matchBaraName,
        tpysBaraId: row.tpysBaraId || '',
        statusByHour: { ...row.statusByHour },
        unmatched: false
      };
      operations.push(operation);
      matchedPageKeys.add(pageRow.periodKey);
    }

    const matchedBaraNames = uniqueBy(operations.map((operation) => operation.tpysBaraAdi).filter(Boolean), normalizeText);
    const matchedDates = uniqueSorted(operations.map((operation) => operation.localDate).filter(Boolean));
    const matchedHourCount = operations.reduce((sum, operation) => {
      return sum + Object.keys(operation.statusByHour || {}).length;
    }, 0);
    if (!operations.length && filteredOutCsvRows.length && csvBaras.length && pageBaras.length) {
      warnings.push(`CSV barasi TPYS sayfasindaki bara ile eslesmedi. CSV: ${csvBaras.join(', ')} | TPYS: ${pageBaras.join(', ')}`);
    }

    const missingCsvRows = pageRows.filter((row) => row.periodKey && !matchedPageKeys.has(row.periodKey));
    const availableDates = uniqueSorted(normalizedCsv.rows.map((row) => row.localDate).filter(Boolean));
    const targetDate = availableDates.length === 1
      ? availableDates[0]
      : availableDates.length > 1
        ? `${availableDates[0]}..${availableDates[availableDates.length - 1]}`
        : normalizeDateToIso(input.pageDate || '');

    return {
      mode: 'periodic-daily',
      targetDate,
      availableDates,
      csvDayCount: availableDates.length,
      csvRowCount: csvRows.length,
      pageRowCount: pageRows.length,
      csvBaras,
      tpysBaras: pageBaras,
      pageBaras,
      pageDates: uniqueSorted([...pageDateKeys]),
      matchedBaraName: matchedBaraNames.length ? matchedBaraNames.join(', ') : '-',
      matchedDateCount: matchedDates.length,
      matchedHourCount,
      operations,
      filteredOutCsvRows,
      missingPageRows,
      missingCsvRows,
      ambiguousRows,
      invalidRows: normalizedCsv.invalidRows,
      warning: warnings.join(' | '),
      warnings,
      blockingErrors,
      requiresConfirmation: Boolean(warnings.length && operations.length),
      pageDateNormalized: normalizeDateToIso(input.pageDate || '')
    };
  }

  function normalizeDailyResultRows(rows = [], options = {}) {
    const mappingIndex = options.mappingIndex || {};
    const normalized = [];
    const invalidRows = [];
    const warnings = [];
    const blockingErrors = [];

    rows.forEach((row, index) => {
      const localDate = normalizeDateToIso(getRowValue(row, ['Tarih', 'Date', 'Gun', 'Gün']));
      const sourceBara = getRowValue(row, ['Bara', 'Bara Adi', 'Bara Adı', 'Busbar']) || '';
      const sourceType = getRowValue(row, ['Kaynak Tipi', 'Kaynak', 'Source Type']) || '';
      const mapping = resolveMapping(row, mappingIndex);
      const matchBaraName = mapping?.tpysBaraAdi || sourceBara;
      const statusResult = buildStatusByHour(row);
      const errors = [];

      if (!localDate) errors.push(`Satir ${index + 1}: tarih okunamadi.`);
      if (!sourceBara) errors.push(`Satir ${index + 1}: bara okunamadi.`);
      errors.push(...statusResult.errors.map((message) => `Satir ${index + 1}: ${message}`));

      const item = {
        index,
        raw: row,
        localDate,
        sourceDate: localDate,
        sourceBara,
        sourceType,
        matchBaraName,
        tpysBaraId: mapping?.tpysBaraId || '',
        statusByHour: statusResult.statusByHour,
        valid: errors.length === 0,
        errors,
        csvKey: makePeriodKey(sourceBara, localDate)
      };

      normalized.push(item);
      if (errors.length) {
        invalidRows.push(item);
        blockingErrors.push(...errors);
      }
    });

    return { rows: normalized, invalidRows, warnings, blockingErrors };
  }

  function comparePeriodicPlanWithPage(plan, pageRows = []) {
    const normalizedPageRows = normalizePageRows(pageRows);
    const pageMap = new Map(normalizedPageRows.map((row) => [row.periodKey, row]));
    const matchedRows = [];
    const unmatchedPlanRows = [];

    for (const operation of plan.operations || []) {
      const key = operation.operationKey || makePeriodKey(operation.tpysBaraAdi, operation.localDate || operation.sourceDate);
      const pageRow = pageMap.get(key);
      if (pageRow) matchedRows.push({ operation, pageRow });
      else unmatchedPlanRows.push(operation);
    }

    const matchedKeys = new Set(matchedRows.map((row) => row.pageRow.periodKey));
    const unmatchedPageRows = normalizedPageRows.filter((row) => row.periodKey && !matchedKeys.has(row.periodKey));
    return {
      pageRowCount: normalizedPageRows.length,
      matchedRows,
      unmatchedPlanRows,
      unmatchedPageRows
    };
  }

  function buildStatusByHour(row) {
    const statusByHour = {};
    const errors = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const value = getRowValue(row, [HOUR_KEYS[hour], String(hour)]).trim();
      if (!value) {
        errors.push(`${HOUR_KEYS[hour]} durum bos.`);
        continue;
      }
      const code = value.toUpperCase();
      if (/%/.test(code)) {
        errors.push(`${HOUR_KEYS[hour]} yuzde/percentage degeri TPYS sonuc girisi icin gecersiz: ${value}`);
        continue;
      }
      if (!VALID_STATUS_CODES.has(code)) {
        errors.push(`${HOUR_KEYS[hour]} gecersiz sonuc kodu: ${value}`);
        continue;
      }
      statusByHour[hour] = code;
    }
    return { statusByHour, errors };
  }

  function normalizePageRows(rows = []) {
    return rows.map((row, index) => {
      const localDate = normalizeDateToIso(row?.localDate || row?.gecerlilikDt || row?.pageDate || row?.date || row?.gecerlilik_dt || '');
      const baraName = String(row?.baraName || row?.bara_ad || row?.bara || '').trim();
      return {
        ...row,
        rowIndex: row?.rowIndex ?? index,
        baraName,
        localDate,
        baraKey: normalizeText(baraName),
        periodKey: makePeriodKey(baraName, localDate)
      };
    });
  }

  function resolveMapping(row, mappingIndex) {
    if (!mappingIndex) return null;
    const possibleIdHeaders = ['TPYS Bara ID', 'TPYS Bara Id', 'Bara ID', 'Bara Id', 'TPYS_BARA_ID'];
    for (const key of possibleIdHeaders) {
      const value = getRowValue(row, [key]);
      if (!value || !mappingIndex.byTpysId) continue;
      const hit = mappingIndex.byTpysId.get(normalizeText(value));
      if (hit) return hit;
    }
    const sourceBara = getRowValue(row, ['Bara', 'Bara Adi', 'Bara Adı', 'Busbar']);
    return mappingIndex.byAlias?.get?.(normalizeText(sourceBara)) || null;
  }

  function parseDelimitedText(text, delimiter) {
    const rows = [];
    let current = '';
    let row = [];
    let insideQuotes = false;
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalized.length; i += 1) {
      const char = normalized[i];
      const next = normalized[i + 1];
      if (char === '"') {
        if (insideQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }
      if (char === delimiter && !insideQuotes) {
        row.push(current);
        current = '';
        continue;
      }
      if (char === '\n' && !insideQuotes) {
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
        continue;
      }
      current += char;
    }
    if (current.length || row.length) {
      row.push(current);
      rows.push(row);
    }

    while (rows.length && !rows[0].some((cell) => String(cell || '').trim())) rows.shift();
    if (rows.length && /^sep\s*=/i.test(String(rows[0][0] || '').replace(/^\uFEFF/, '').trim())) rows.shift();

    const headers = (rows.shift() || []).map((value, index) => {
      const cleaned = String(value || '').replace(/^\uFEFF/, '').trim();
      return index === 0 ? cleaned.replace(/^\uFEFF/, '') : cleaned;
    });

    const objects = rows
      .filter((line) => line.some((cell) => String(cell || '').trim() !== ''))
      .map((line) => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = String(line[index] || '').trim();
        });
        return item;
      });

    return { headers, rows: objects };
  }

  function decodeBytes(bytes, encoding) {
    if (typeof root.TextDecoder !== 'undefined') {
      return new root.TextDecoder(encoding).decode(bytes);
    }
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder(encoding).decode(bytes);
    }
    if (typeof require === 'function') {
      const { TextDecoder } = require('node:util');
      return new TextDecoder(encoding).decode(bytes);
    }
    throw new Error('TextDecoder bulunamadi.');
  }

  function getRowValue(row, candidates) {
    if (!row) return '';
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(row, key)) return String(row[key] ?? '').trim();
    }
    const normalizedCandidates = new Set(candidates.map(normalizeHeader));
    const entry = Object.entries(row).find(([key]) => normalizedCandidates.has(normalizeHeader(key)));
    return entry ? String(entry[1] ?? '').trim() : '';
  }

  function normalizeHeader(value) {
    return normalizeText(value).replace(/\s+/g, '');
  }

  function normalizeDateToIso(value) {
    const raw = String(value || '').replace(/^\uFEFF/, '').trim();
    if (!raw) return '';
    let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
    if (!match) return '';
    const day = String(match[1]).padStart(2, '0');
    const month = String(match[2]).padStart(2, '0');
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${month}-${day}`;
  }

  function makePeriodKey(baraName, localDate) {
    const baraKey = normalizeText(baraName);
    const dateKey = normalizeDateToIso(localDate);
    return baraKey && dateKey ? `${baraKey}|${dateKey}` : '';
  }

  function isEkcControl(value) {
    const normalized = normalizeText(value);
    return normalized.includes('ek c') || normalized.includes('ekc');
  }

  function normalizeText(value) {
    if (root.MAP_COMMON?.normalizeText) return root.MAP_COMMON.normalizeText(value);
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıİ]/g, 'i')
      .replace(/[çÇ]/g, 'c')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's')
      .replace(/[üÜ]/g, 'u')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort();
  }

  function uniqueBy(values, keyFn) {
    const result = [];
    const seen = new Set();
    values.forEach((value) => {
      const key = keyFn(value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(value);
    });
    return result;
  }

  return {
    VALID_STATUS_CODES,
    decodeCsvTextFromBuffer,
    parseRgdhDailyResultCsv,
    normalizeDailyResultRows,
    buildPeriodicPlanForPage,
    comparePeriodicPlanWithPage,
    normalizeDateToIso,
    makePeriodKey,
    buildStatusByHour
  };
});
