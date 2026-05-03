(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TPYS_CSV_STANDARDIZER = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const DATE_FALLBACK_USED = 'DATE_FALLBACK_USED';
  const PLANT_FALLBACK_USED = 'PLANT_FALLBACK_USED';
  const HASH_UNAVAILABLE = 'HASH_UNAVAILABLE';

  function normalizeTpysDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (match) return buildDateParts(Number(match[1]), Number(match[2]), Number(match[3]));

    match = raw.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
    if (match) {
      const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
      return buildDateParts(year, Number(match[2]), Number(match[1]));
    }

    match = raw.match(/\b(\d{1,2})\s+([A-Za-z\u00c0-\u017f]+)\s+(\d{4})/);
    if (match) {
      const month = turkishMonthNumber(match[2]);
      if (month) return buildDateParts(Number(match[3]), month, Number(match[1]));
    }

    return null;
  }

  function buildDateParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    const yyyy = String(year).padStart(4, '0');
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yy = yyyy.slice(-2);
    return {
      year: yyyy,
      month: mm,
      day: dd,
      yy,
      isoDate: `${yyyy}-${mm}-${dd}`,
      displayDate: `${dd}.${mm}.${yyyy}`,
      monthYearFolderSuffix: `${mm}_${yy}`,
      dayFolderSuffix: `${dd}_${mm}_${yy}`
    };
  }

  function turkishMonthNumber(value) {
    const key = normalizeKey(value);
    const months = {
      oca: 1, ocak: 1,
      sub: 2, subat: 2,
      mar: 3, mart: 3,
      nis: 4, nisan: 4,
      may: 5, mayis: 5,
      haz: 6, haziran: 6,
      tem: 7, temmuz: 7,
      agu: 8, agustos: 8,
      eyl: 9, eylul: 9,
      eki: 10, ekim: 10,
      kas: 11, kasim: 11,
      ara: 12, aralik: 12
    };
    return months[key] || null;
  }

  async function standardizeTpysCsv(options = {}) {
    const csvText = String(options.csvText || '');
    const rows = parseDelimitedRows(csvText);
    const warnings = [];

    let plantName = extractPlantName(rows);
    if (!plantName) {
      plantName = String(options.baraName || options.filenameHint || 'TPYS_CSV').trim() || 'TPYS_CSV';
      warnings.push(PLANT_FALLBACK_USED);
    }

    let dateParts = extractDateParts(rows);
    if (!dateParts) {
      dateParts = normalizeTpysDate(options.localDate) || normalizeTpysDate(options.pageDate);
      warnings.push(DATE_FALLBACK_USED);
    }
    if (!dateParts) {
      dateParts = normalizeTpysDate(new Date().toISOString().slice(0, 10));
      warnings.push(DATE_FALLBACK_USED);
    }

    const safePlantName = sanitizePathSegment(plantName, { asciiNormalize: options.asciiNormalize });
    let sha256 = '';
    if (csvText) {
      sha256 = await sha256Hex(csvText);
    }
    if (!sha256) warnings.push(HASH_UNAVAILABLE);

    return {
      plantName,
      safePlantName,
      isoDate: dateParts.isoDate,
      displayDate: dateParts.displayDate,
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      yy: dateParts.yy,
      monthYearFolderSuffix: dateParts.monthYearFolderSuffix,
      dayFolderSuffix: dateParts.dayFolderSuffix,
      sha256,
      warnings
    };
  }

  function extractPlantName(rows) {
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 40); rowIndex += 1) {
      const row = rows[rowIndex] || [];
      for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
        const key = normalizeKey(row[cellIndex]);
        if (!isPlantHeader(key)) continue;

        const sameRowValue = firstNonEmpty(row.slice(cellIndex + 1));
        if (sameRowValue && !looksLikeHeader(sameRowValue)) return sameRowValue;

        for (let nextIndex = rowIndex + 1; nextIndex < Math.min(rows.length, rowIndex + 8); nextIndex += 1) {
          const candidate = cleanCell((rows[nextIndex] || [])[cellIndex]);
          if (candidate && !looksLikeHeader(candidate)) return candidate;
        }
      }
    }
    return '';
  }

  function extractDateParts(rows) {
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 80); rowIndex += 1) {
      const row = rows[rowIndex] || [];
      for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
        const key = normalizeKey(row[cellIndex]);
        if (isDateHeader(key)) {
          const sameRowValue = firstNonEmpty(row.slice(cellIndex + 1));
          const sameRowDate = normalizeTpysDate(sameRowValue);
          if (sameRowDate) return sameRowDate;
          for (let nextIndex = rowIndex + 1; nextIndex < Math.min(rows.length, rowIndex + 8); nextIndex += 1) {
            const parsed = normalizeTpysDate((rows[nextIndex] || [])[cellIndex]);
            if (parsed) return parsed;
          }
        }
        const parsed = normalizeTpysDate(row[cellIndex]);
        if (parsed) return parsed;
      }
    }
    return null;
  }

  function parseDelimitedRows(text) {
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const firstLine = normalized.split('\n').find((line) => line.trim()) || '';
    const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized[index];
      const next = normalized[index + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
        continue;
      }
      if (char === delimiter && !quoted) {
        row.push(cleanCell(cell));
        cell = '';
        continue;
      }
      if (char === '\n' && !quoted) {
        row.push(cleanCell(cell));
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = '';
        continue;
      }
      cell += char;
    }
    if (cell || row.length) {
      row.push(cleanCell(cell));
      if (row.some(Boolean)) rows.push(row);
    }
    if (rows.length && /^sep\s*=/i.test(rows[0][0] || '')) rows.shift();
    return rows;
  }

  function cleanCell(value) {
    return String(value ?? '').replace(/^\uFEFF/, '').trim();
  }

  function firstNonEmpty(values) {
    return (values || []).map(cleanCell).find(Boolean) || '';
  }

  function looksLikeHeader(value) {
    const key = normalizeKey(value);
    return isPlantHeader(key) || isDateHeader(key);
  }

  function isPlantHeader(key) {
    return key.includes('santral') && (key.includes('adi') || key.includes('ismi') || key.includes('name'));
  }

  function isDateHeader(key) {
    return key === 'tarih' || key.includes('olcum zamani') || key.includes('gecerlilik') || key.includes('date');
  }

  function sanitizePathSegment(value, options = {}) {
    const asciiNormalize = Boolean(options.asciiNormalize);
    let text = String(value || '').trim();
    if (asciiNormalize) text = toAscii(text);
    text = text
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/[\u0000-\u001f]+/g, ' ')
      .replace(/['`]+/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\p{L}\p{N}._-]+/gu, '_')
      .replace(/_+/g, '_')
      .replace(/^[_.-]+|[_.-]+$/g, '');
    text = text || 'TPYS_CSV';
    return (asciiNormalize ? text.toUpperCase() : text.toLocaleUpperCase('tr-TR')).slice(0, 120);
  }

  function toAscii(value) {
    return String(value || '')
      .replace(/[çÇ]/g, 'c')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's')
      .replace(/[üÜ]/g, 'u')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeKey(value) {
    return toAscii(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function withConflictSuffix(filename, index) {
    const raw = String(filename || 'TPYS_CSV.csv');
    const suffix = `__${Number(index) || 1}`;
    const dotIndex = raw.toLowerCase().endsWith('.csv') ? raw.length - 4 : -1;
    return dotIndex >= 0 ? `${raw.slice(0, dotIndex)}${suffix}.csv` : `${raw}${suffix}`;
  }

  async function sha256Hex(value) {
    const text = String(value ?? '');
    if (!text) return '';
    if (root.crypto?.subtle && typeof root.TextEncoder !== 'undefined') {
      const encoded = new root.TextEncoder().encode(text);
      const digest = await root.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') {
      return require('node:crypto').createHash('sha256').update(text, 'utf8').digest('hex');
    }
    return '';
  }

  return {
    DATE_FALLBACK_USED,
    PLANT_FALLBACK_USED,
    HASH_UNAVAILABLE,
    normalizeTpysDate,
    standardizeTpysCsv,
    sanitizePathSegment,
    withConflictSuffix,
    parseDelimitedRows,
    sha256Hex
  };
});
