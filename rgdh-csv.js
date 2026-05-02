(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_CSV = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const TURKISH_MONTHS = new Map([
    ['oca', 1],
    ['ocak', 1],
    ['sub', 2],
    ['subat', 2],
    ['şub', 2],
    ['şubat', 2],
    ['mar', 3],
    ['mart', 3],
    ['nis', 4],
    ['nisan', 4],
    ['may', 5],
    ['mayis', 5],
    ['mayıs', 5],
    ['haz', 6],
    ['haziran', 6],
    ['tem', 7],
    ['temmuz', 7],
    ['agu', 8],
    ['agustos', 8],
    ['ağu', 8],
    ['ağustos', 8],
    ['eyl', 9],
    ['eylul', 9],
    ['eylül', 9],
    ['eki', 10],
    ['ekim', 10],
    ['kas', 11],
    ['kasim', 11],
    ['kasım', 11],
    ['ara', 12],
    ['aralik', 12],
    ['aralık', 12]
  ]);

  function parseSemicolonCsv(text) {
    const lines = [];
    let cell = '';
    let row = [];
    let insideQuotes = false;
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalized.length; i += 1) {
      const char = normalized[i];
      const next = normalized[i + 1];
      if (char === '"') {
        if (insideQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }
      if (char === ';' && !insideQuotes) {
        row.push(cell);
        cell = '';
        continue;
      }
      if (char === '\n' && !insideQuotes) {
        row.push(cell);
        lines.push(row);
        row = [];
        cell = '';
        continue;
      }
      cell += char;
    }

    if (cell.length || row.length) {
      row.push(cell);
      lines.push(row);
    }

    if (lines.length && /^sep\s*=/i.test(cleanCell(lines[0][0]))) {
      lines.shift();
    }

    const headers = (lines.shift() || []).map((value) => cleanCell(value).replace(/^\uFEFF/, ''));
    const headerKeys = makeUniqueHeaderKeys(headers);
    const rows = lines
      .filter((line) => line.some((value) => cleanCell(value) !== ''))
      .map((line) => {
        const object = {};
        headers.forEach((header, index) => {
          const key = headerKeys[index] || header;
          object[key] = cleanCell(line[index]);
        });
        return object;
      });

    return { headers, rows };
  }

  function makeUniqueHeaderKeys(headers) {
    const seen = new Map();
    return (headers || []).map((header, index) => {
      const base = header || `Column ${index + 1}`;
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return count === 1 ? base : `${base}__${count}`;
    });
  }

  function cleanCell(value) {
    const raw = String(value ?? '').replace(/^\uFEFF/, '').trim();
    const excelText = raw.match(/^=\s*"([\s\S]*)"$/);
    if (excelText) {
      const inner = excelText[1].trim();
      return inner.startsWith("'") ? inner.slice(1) : inner;
    }
    if (/^=[^=]/.test(raw)) {
      const inner = raw.slice(1).trim();
      return inner.startsWith("'") ? inner.slice(1) : inner;
    }
    return raw;
  }

  function normalizeCsvHeader(header) {
    return String(header || '')
      .replace(/^\uFEFF/, '')
      .replace(/[İIı]/g, 'i')
      .replace(/[Ğğ]/g, 'g')
      .replace(/[Üü]/g, 'u')
      .replace(/[Şş]/g, 's')
      .replace(/[Öö]/g, 'o')
      .replace(/[Çç]/g, 'c')
      .replace(/\uFFFD/g, 'i')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıI]/g, 'i')
      .replace(/İ/g, 'i')
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function buildNormalizedRow(row) {
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      normalized[normalizeCsvHeader(key)] = value;
    });
    return normalized;
  }

  function pick(row, names) {
    const normalized = buildNormalizedRow(row);
    for (const name of names) {
      const key = normalizeCsvHeader(name);
      if (Object.prototype.hasOwnProperty.call(normalized, key)) return normalized[key];
    }
    return '';
  }

  function parseTurkishNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const raw = cleanCell(value).replace(/^"|"$/g, '');
    if (!raw || raw === '-' || /^null$/i.test(raw)) return null;
    const canonical = raw.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
    const numeric = Number(canonical);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function parseTurkishDateTime(value) {
    const raw = cleanCell(value).replace(/^"|"$/g, '');
    if (!raw || /^null$/i.test(raw)) return emptyDateInfo(raw);

    const isoUtc = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z$/);
    if (isoUtc) {
      const date = new Date(raw);
      return buildInfoFromUtc(date, raw);
    }

    const isoLocal = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?\+03:00$/);
    if (isoLocal) {
      return buildInfoFromLocalParts(
        Number(isoLocal[1]),
        Number(isoLocal[2]),
        Number(isoLocal[3]),
        Number(isoLocal[4]),
        Number(isoLocal[5]),
        Number(isoLocal[6] || 0)
      );
    }

    const numericDate = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (numericDate) {
      return buildInfoFromLocalParts(
        Number(numericDate[3]),
        Number(numericDate[2]),
        Number(numericDate[1]),
        Number(numericDate[4] || 0),
        Number(numericDate[5] || 0),
        Number(numericDate[6] || 0)
      );
    }

    const turkish = raw.match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (turkish) {
      const monthName = normalizeMonthName(turkish[2]);
      const month = TURKISH_MONTHS.get(monthName);
      if (month) {
        return buildInfoFromLocalParts(
          Number(turkish[3]),
          month,
          Number(turkish[1]),
          Number(turkish[4] || 0),
          Number(turkish[5] || 0),
          Number(turkish[6] || 0)
        );
      }
    }

    return emptyDateInfo(raw);
  }

  function normalizeMonthName(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .toLowerCase();
  }

  function buildInfoFromUtc(date, raw) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return emptyDateInfo(raw);
    const local = new Date(date.getTime() + (3 * 60 * 60 * 1000));
    return {
      measurementDateUtc: toIsoNoMs(date),
      measurementDateLocal: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+03:00`,
      localDate: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
      localHour: local.getUTCHours(),
      localMinute: local.getUTCMinutes()
    };
  }

  function buildInfoFromLocalParts(year, month, day, hour, minute, second) {
    const utc = new Date(Date.UTC(year, month - 1, day, hour - 3, minute, second));
    const localDate = `${year}-${pad(month)}-${pad(day)}`;
    return {
      measurementDateUtc: toIsoNoMs(utc),
      measurementDateLocal: `${localDate}T${pad(hour)}:${pad(minute)}:${pad(second)}+03:00`,
      localDate,
      localHour: hour,
      localMinute: minute
    };
  }

  function emptyDateInfo(raw) {
    return {
      measurementDateUtc: '',
      measurementDateLocal: '',
      localDate: '',
      localHour: null,
      localMinute: null,
      rawDate: raw || ''
    };
  }

  function toIsoNoMs(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function detectRgdhCsvType(headers, rows) {
    const headerText = (headers || []).map(normalizeCsvHeader).join(' | ');
    if (/bara tipi/.test(headerText) && /tpys santral id/.test(headerText) && /unite adi/.test(headerText)) {
      return 'BUSBAR_UNIT_CATALOG';
    }
    if (/dusuk ikaz test|asiri ikaz test|unite aktif mi/.test(headerText) && /kaynak tipi/.test(headerText)) {
      return 'BUSBAR_UNIT_CATALOG';
    }
    if (/tpys bara gerilim set|tpys bara gerilim dusumu|di mvar onay durumu|ai mvar onay durumu/.test(headerText)) {
      return 'WIND';
    }
    if (/bytm adi|tpys set|bara set onay durumu/.test(headerText)) {
      return 'CONVENTIONAL';
    }
    const first = rows?.[0] || {};
    const rowText = Object.keys(first).map(normalizeCsvHeader).join(' | ');
    if (/gerilim dusumu/.test(rowText)) return 'WIND';
    return 'UNKNOWN';
  }

  function normalizeConventionalCsvRow(row) {
    return {
      sourceOrigin: 'CSV',
      sourceType: 'CONVENTIONAL',
      ...parseTurkishDateTime(pick(row, ['Olcum Zamani', 'Ölçüm Zamanı'])),
      ytm: pick(row, ['BYTM Adi', 'BYTM Adı']),
      busbarId: parseInteger(pick(row, ['Bara ID'])),
      busbarName: pick(row, ['Bara Adi', 'Bara Adı']),
      tpysVoltageSet: parseTurkishNumber(pick(row, ['TPYS Set'])),
      busbar1Voltage: parseTurkishNumber(pick(row, ['Bara 1(kV)', 'Bara 1 (kV)'])),
      busbar1Quality: pick(row, ['Bara 1 Kalite']),
      busbar2Voltage: parseTurkishNumber(pick(row, ['Bara 2(kV)', 'Bara 2 (kV)'])),
      busbar2Quality: pick(row, ['Bara 2 Kalite']),
      busbar3Voltage: parseTurkishNumber(pick(row, ['Bara 3(kV)', 'Bara 3 (kV)'])),
      busbar3Quality: pick(row, ['Bara 3 Kalite']),
      liveBusbarVoltage: parseTurkishNumber(pick(row, ['Canli Bara', 'Canlı Bara'])),
      busbarUpperLimit: parseTurkishNumber(pick(row, ['Bara Set Ust Limit', 'Bara Set Üst Limit'])),
      busbarLowerLimit: parseTurkishNumber(pick(row, ['Bara Set Alt Limit'])),
      pnomMw: parseTurkishNumber(pick(row, ['Kurulu Guc', 'Kurulu Güç'])),
      pmkudMw: parseTurkishNumber(pick(row, ['Pmkud'])),
      minMkudMw: parseTurkishNumber(pick(row, ['MinMkud'])),
      pgenMw: parseTurkishNumber(pick(row, ['Toplam Unite Pgen Aktif (MW)', 'Toplam Ünite Pgen Aktif (MW)'])),
      qgenMvar: parseTurkishNumber(pick(row, ['Toplam Unite Qgen Reaktif (MVAr)', 'Toplam Ünite Qgen Reaktif (MVAr)'])),
      auxiliaryMw: parseTurkishNumber(pick(row, ['Yardimci Kaynak (MW)', 'Yardımcı Kaynak (MW)'])),
      auxiliaryMvar: parseTurkishNumber(pick(row, ['Yardimci Kaynak (MVAr)', 'Yardımcı Kaynak (MVAr)'])),
      diMvarLimit: parseTurkishNumber(pick(row, ['Toplam DI MVar Limit', 'Toplam D.I. MVar Limit', 'Toplam D.İ. MVar Limit'])),
      aiMvarLimit: parseTurkishNumber(pick(row, ['Toplam AI MVar Limit', 'Toplam A.I. MVar Limit', 'Toplam A.İ. MVar Limit'])),
      offBoardStatus: parseInteger(pick(row, ['Devre Durumu'])),
      noObligationStatus: parseInteger(pick(row, ['Yukumluluk Durumu', 'Yükümlülük Durumu'])),
      voltageApprove: normalizeApproval(pick(row, ['Bara Set Onay Durumu'])),
      diMvarApprove: normalizeApproval(pick(row, ['DI MVAR Onay', 'D.I. MVAR Onay', 'D.İ. MVAR Onay'])),
      aiMvarApprove: normalizeApproval(pick(row, ['AI MVAR Onay', 'A.I. MVAR Onay', 'A.İ. MVAR Onay'])),
      approvalStatus: normalizeApproval(pick(row, ['Onay Durum'])),
      raw: row
    };
  }

  function normalizeWindCsvRow(row) {
    return {
      sourceOrigin: 'CSV',
      sourceType: 'WIND',
      ...parseTurkishDateTime(pick(row, ['Olcum Zamani', 'Ölçüm Zamanı'])),
      busbarId: parseInteger(pick(row, ['Bara ID'])),
      busbarName: pick(row, ['Bara Adi', 'Bara Adı']),
      busbarInternalId: parseInteger(pick(row, ['Busbar Internal ID', 'YKS Ic Bara ID', 'YKS İç Bara ID'])),
      tpysVoltageSet: parseTurkishNumber(pick(row, ['TPYS Bara Gerilim Set'])),
      busbar1Voltage: parseTurkishNumber(pick(row, ['Bara 1(kV)', 'Bara 1 (kV)'])),
      busbar1Quality: pick(row, ['Bara 1 Kalite']),
      busbar2Voltage: parseTurkishNumber(pick(row, ['Bara 2(kV)', 'Bara 2 (kV)'])),
      busbar2Quality: pick(row, ['Bara 2 Kalite']),
      busbar3Voltage: parseTurkishNumber(pick(row, ['Bara 3(kV)', 'Bara 3 (kV)'])),
      busbar3Quality: pick(row, ['Bara 3 Kalite']),
      tpysVoltageDrop: parseTurkishNumber(pick(row, ['TPYS Bara Gerilim Dusumu', 'TPYS Bara Gerilim Düşümü'])),
      liveBusbarVoltage: parseTurkishNumber(pick(row, ['Canli Bara', 'Canlı Bara'])),
      pnomMw: parseTurkishNumber(pick(row, ['Kurulu Guc', 'Kurulu Güç'])),
      pmkudMw: parseTurkishNumber(pick(row, ['Pmkud'])),
      pgenMw: parseTurkishNumber(pick(row, ['Toplam Unite Pgen Aktif (MW)', 'Toplam Ünite Pgen Aktif (MW)'])),
      qgenMvar: parseTurkishNumber(pick(row, ['Toplam Unite Qgen Reaktif (MVAr)', 'Toplam Ünite Qgen Reaktif (MVAr)'])),
      diMvarLimit: parseTurkishNumber(pick(row, ['Toplam DI MVar Limit', 'Toplam D.I. MVar Limit', 'Toplam D.İ. MVar Limit'])),
      aiMvarLimit: parseTurkishNumber(pick(row, ['Toplam AI MVar Limit', 'Toplam A.I. MVar Limit', 'Toplam A.İ. MVar Limit'])),
      offBoardStatus: parseInteger(pick(row, ['Devre Durumu'])),
      noObligationStatus: parseInteger(pick(row, ['Yukumluluk Durumu', 'Yükümlülük Durumu'])),
      diMvarApprove: normalizeApproval(pick(row, ['DI MVAR Onay Durumu', 'D.I. MVAR Onay Durumu', 'D.İ. MVAR Onay Durumu'])),
      aiMvarApprove: normalizeApproval(pick(row, ['AI MVAR Onay Durumu', 'A.I. MVAR Onay Durumu', 'A.İ. MVAR Onay Durumu'])),
      approvalStatus: normalizeApproval(pick(row, ['Onay Durum'])),
      raw: row
    };
  }

  function normalizeCatalogCsvRow(row) {
    return {
      sourceOrigin: 'CATALOG',
      type: 'BUSBAR_UNIT_CATALOG',
      busbarType: pick(row, ['Bara Tipi']),
      busbarId: parseInteger(pick(row, ['Bara ID'])),
      busbarName: pick(row, ['Bara Adi', 'Bara Adı']),
      rgkType: pick(row, ['RGK Tipi']),
      voltageLevel: parseTurkishNumber(pick(row, ['Bara Gerilim Seviyesi'])),
      ytm: pick(row, ['BYTM', 'YTM']),
      plantId: parseInteger(pick(row, ['TPYS Santral ID'])),
      plantName: pick(row, ['TPYS Santral Ismi', 'TPYS Santral İsmi']),
      busbar1Ta: pick(row, ['Bara 1 TA']),
      busbar1Setnum: pick(row, ['Bara 1 Setnum']),
      busbar2Ta: pick(row, ['Bara 2 TA']),
      busbar2Setnum: pick(row, ['Bara 2 Setnum']),
      busbar3Ta: pick(row, ['Bara 3 TA']),
      busbar3Setnum: pick(row, ['Bara 3 Setnum']),
      unitName: pick(row, ['Unite Adi', 'Ünite Adı']),
      uevcbName: pick(row, ['UEVCB Adi', 'UEVCB Adı']),
      unitId: parseInteger(pick(row, ['TPYS UEVCB ID'])),
      sourceKind: pick(row, ['Kaynak Tipi']),
      activePowerTa: pick(row, ['Aktif Guc TA', 'Aktif Güç TA']),
      activePowerSetnum: pick(row, ['Aktif Guc Setnum', 'Aktif Güç Setnum']),
      reactivePowerTa: pick(row, ['Reaktif Guc TA', 'Reaktif Güç TA']),
      reactivePowerSetnum: pick(row, ['Reaktif Guc Setnum', 'Reaktif Güç Setnum']),
      unitPnomMw: parseTurkishNumber(pick(row, ['Unite Nominal Guc', 'Ünite Nominal Güç'])),
      unitPmkudMw: parseTurkishNumber(pick(row, ['Unite PMKUD', 'Ünite PMKUD'])),
      lowExcitationTest: parseTurkishNumber(pick(row, ['Dusuk Ikaz(TEST)', 'Düşük İkaz(TEST)'])),
      highExcitationTest: parseTurkishNumber(pick(row, ['Asiri Ikaz(TEST)', 'Aşırı İkaz(TEST)'])),
      nominalLowExcitation: parseTurkishNumber(pick(row, ['Nominal Ikaz (Dusuk)', 'Nominal İkaz (Düşük)'])),
      nominalHighExcitation: parseTurkishNumber(pick(row, ['Nominal Ikaz (Asiri)', 'Nominal İkaz (Aşırı)'])),
      powerFactor: parseTurkishNumber(pick(row, ['Guc Faktoru', 'Güç Faktörü'])),
      terminalVoltage: parseTurkishNumber(pick(row, ['Terminal Gerilimi'])),
      unitActive: parseTurkishBoolean(pick(row, ['Unite Aktif mi ?', 'Ünite Aktif mi ?'])),
      ytbsPlantName: pick(row, ['YTBS Santral Adi', 'YTBS Santral Adı']),
      ytbsSubstationId: parseInteger(pick(row, ['YTBS Trafo Merkezi ID'])),
      ytbsSubstationName: pick(row, ['YTBS Trafo Merkezi Adi', 'YTBS Trafo Merkezi Adı']),
      latitude: parseTurkishNumber(pick(row, ['Enlem'])),
      longitude: parseTurkishNumber(pick(row, ['Boylam'])),
      ytbsSourceType: pick(row, ['KAYNAK TURU', 'KAYNAK TÜRÜ']),
      secondarySources: pick(row, ['Ikincil Kaynaklari', 'İkincil Kaynakları']),
      city: pick(row, ['Ili', 'İli']),
      ytbsBusbarType: pick(row, ['Bara Tipi__2', 'Bara Tipi 2']),
      hasSynchronousCondenser: parseTurkishBoolean(pick(row, ['Senkron Kompansator Var mI?', 'Senkron Kompansatör Var mI?', 'Senkron Kompansator Var Mi?', 'Senkron Kompansatör Var Mı?'])),
      hasEuasProtocol: parseTurkishBoolean(pick(row, ['EUAS Protokol Var Mi?', 'EÜAŞ Protokol Var Mı?'])),
      platformRgkType: pick(row, ['Yan Hizmetler Analiz Platformu RGK Tipi']),
      rgkTypeDescription: pick(row, ['RGK TIPI Aciklama', 'RGK TİPİ Açıklama']),
      isBalancingUnit: parseTurkishBoolean(pick(row, ['Dengeleme Birimi mi?', 'Dengeleme Birimi Mi?'])),
      tpysUnitMkud: parseTurkishNumber(pick(row, ['TPYS Unite MKUD', 'TPYS Ünite MKÜD'])),
      tpysPlantMkud: parseTurkishNumber(pick(row, ['TPYS Santral MKUD', 'TPYS Santral MKÜD'])),
      lowExcitationTest2: parseTurkishNumber(pick(row, ['Dusuk Ikaz 2', 'Dusuk Ikaz(TEST) 2'])),
      highExcitationTest2: parseTurkishNumber(pick(row, ['Asiri Ikaz 2', 'Asiri Ikaz(TEST) 2'])),
      speedDrop: parseTurkishNumber(pick(row, ['Speed Drop', 'SpeedDrop'])),
      raw: row
    };
  }

  function parseInteger(value) {
    const numeric = parseTurkishNumber(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
  }

  function normalizeApproval(value) {
    const raw = cleanCell(value);
    if (!raw || raw === '-' || /^null$/i.test(raw)) return null;
    if (/^(true|evet|yes|ok|saglad|sağlad)/i.test(raw)) return 1;
    if (/^(false|hayir|hayır|no|x|saglamad|sağlamad)/i.test(raw)) return 0;
    return parseInteger(raw);
  }

  function parseTurkishBoolean(value) {
    const raw = cleanCell(value);
    if (!raw || raw === '-' || /^null$/i.test(raw)) return null;
    const token = normalizeTurkishToken(raw);
    if (['true', 'evet', 'yes', 'aktif', '1'].includes(token)) return true;
    if (['false', 'hayir', 'no', 'pasif', '0'].includes(token)) return false;
    return null;
  }

  function normalizeTurkishToken(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[Ä±ıİI]/g, 'i')
      .replace(/Ä°/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function extractWindInternalIdFromFilename(filename) {
    const match = String(filename || '').trim().match(/^(\d{6,})_/);
    return match ? match[1] : '';
  }

  function parseEkcCsvText(text, options = {}) {
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').filter((line) => cleanCell(line) !== '');
    const headerInfo = findEkcHeaderLine(lines);
    if (!headerInfo) throw new Error(`${options.filename || 'EK-C'}: EK-C TARIH/SAAT basligi bulunamadi.`);

    const meta = parseEkcMeta(lines.slice(0, headerInfo.index), options);
    const repairedText = [headerInfo.headers.join(';'), ...lines.slice(headerInfo.index + 1)].join('\n');
    const parsed = parseSemicolonCsv(repairedText);
    meta.headerWarnings = headerInfo.warnings;
    meta.columnMap = resolveEkcColumnMap(parsed.headers);
    const templateFamily = detectEkcTemplateFamily(parsed.headers, meta, options);
    const rows = parsed.rows
      .map((row, index) => normalizeEkcCsvRow(row, meta, templateFamily, options, index))
      .filter((row) => row.localDate && Number.isFinite(Number(row.dakikaIndex)));
    return {
      type: 'EKC',
      headers: parsed.headers,
      rawRows: parsed.rows,
      rows,
      groups: buildEkcGroups(rows),
      meta: { ...meta, templateFamily },
      templateFamily,
      fileName: options.filename || options.fileName || ''
    };
  }

  function findEkcHeaderLine(lines) {
    for (let index = 0; index < (lines || []).length; index += 1) {
      const cells = splitSemicolonLine(lines[index]);
      const nextCells = splitSemicolonLine(lines[index + 1] || '');
      const repaired = repairEkcHeaders(cells, nextCells);
      if (repaired) return { index, ...repaired };
    }
    return null;
  }

  function repairEkcHeaders(cells, nextCells = []) {
    const normalized = (cells || []).map(normalizeCsvHeader);
    const hasDate = normalized.includes('tarih');
    if (!hasDate) return null;

    const warnings = [];
    const meaningfulHeaders = normalized.filter(Boolean);
    const nextLooksLikeData = looksLikeEkcDate(nextCells[0]) && looksLikeEkcTime(nextCells[1]);
    if (meaningfulHeaders.length <= 1 && nextLooksLikeData) {
      warnings.push('EK-C basligi yalniz TARIH iceriyor; sentetik kolon basliklari kullanildi.');
      return {
        headers: buildSyntheticEkcHeaders(Math.max(cells.length, nextCells.length)),
        warnings
      };
    }

    const headers = (cells || []).map((cell) => cleanCell(cell));
    if (!normalized.includes('saat') && nextLooksLikeData && !normalizeCsvHeader(headers[1])) {
      headers[1] = 'SAAT';
      warnings.push('Eksik SAAT basligi ikinci kolondan onarildi.');
    }
    if (!headers.map(normalizeCsvHeader).includes('saat')) return null;
    return { headers: ensureUniqueEkcHeaders(headers), warnings };
  }

  function buildSyntheticEkcHeaders(columnCount) {
    const base = [
      'TARIH',
      'SAAT',
      'SIRA_NO',
      'BARA_GER_KV',
      'BARA_GER_SET_DEG_KV',
      'TOP_AKT_CIK_GUCU_MW',
      'TOP_REAKT_CIK_GUCU_MVAR'
    ];
    const count = Math.max(columnCount || 0, base.length);
    return Array.from({ length: count }, (_, index) => base[index] || `EKC_EXTRA_${index + 1}`);
  }

  function ensureUniqueEkcHeaders(headers) {
    const seen = new Map();
    return (headers || []).map((header, index) => {
      const base = cleanCell(header) || `EKC_EXTRA_${index + 1}`;
      const key = normalizeCsvHeader(base) || `ekc extra ${index + 1}`;
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);
      return count ? `${base}_${count + 1}` : base;
    });
  }

  function looksLikeEkcDate(value) {
    return /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(cleanCell(value));
  }

  function looksLikeEkcTime(value) {
    return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(cleanCell(value));
  }

  function splitSemicolonLine(line) {
    const result = [];
    let cell = '';
    let insideQuotes = false;
    const raw = String(line || '');
    for (let i = 0; i < raw.length; i += 1) {
      const char = raw[i];
      const next = raw[i + 1];
      if (char === '"') {
        if (insideQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }
      if (char === ';' && !insideQuotes) {
        result.push(cleanCell(cell));
        cell = '';
        continue;
      }
      cell += char;
    }
    result.push(cleanCell(cell));
    return result;
  }

  function parseEkcMeta(lines, options = {}) {
    const meta = {
      fileName: options.filename || options.fileName || '',
      plantName: '',
      busbarName: '',
      pnomMw: null,
      pnomMainMw: null,
      pnomAuxMw: null,
      qNomHigh: null,
      qNomLow: null,
      qNomMainHigh: null,
      qNomMainLow: null,
      qNomAuxHigh: null,
      qNomAuxLow: null,
      unitExcitationLimits: [],
      nominalVoltageKv: null,
      droopPct: null,
      mode: null
    };
    lines.forEach((line) => {
      const cells = splitSemicolonLine(line);
      const label = normalizeCsvHeader(cells[0] || '');
      const first = parseTurkishNumber(cells[1]);
      const second = parseTurkishNumber(cells[2]);
      const nums = cells.slice(1).map(parseTurkishNumber).filter(Number.isFinite);
      if (!meta.plantName && /birimin adi|birim adi|santral/.test(label)) {
        meta.plantName = cleanCell(cells[1]);
        meta.busbarName = meta.plantName;
      }
      if (/ana kaynak kurulu gucu/.test(label)) meta.pnomMainMw = first;
      else if (/yardimci kaynak.*kurulu gucu/.test(label)) meta.pnomAuxMw = first;
      else if (/unitelerinin nominal aktif gucu/.test(label)) meta.pnomMw = sumFinite(nums);
      else if (/kurulu gucu|ptotal/.test(label)) meta.pnomMw = first;
      if (/ana kaynak.*asiri.*dusuk.*mvar/.test(label)) {
        meta.qNomMainHigh = sumPositiveOrFirst(nums, first);
        meta.qNomMainLow = sumNegativeOrSecond(nums, second);
      } else if (/yardimci kaynak.*asiri.*dusuk.*mvar/.test(label)) {
        meta.qNomAuxHigh = sumPositiveOrFirst(nums, first);
        meta.qNomAuxLow = sumNegativeOrSecond(nums, second);
      } else if (/asiri.*dusuk.*mvar/.test(label)) {
        meta.qNomHigh = sumPositiveOrFirst(nums, first);
        meta.qNomLow = sumNegativeOrSecond(nums, second);
        meta.unitExcitationLimits = buildEkcUnitExcitationLimits(nums);
      }
      if (/nominal gerilim/.test(label)) meta.nominalVoltageKv = first;
      if (/gerilim dusumu|droop/.test(label)) meta.droopPct = first;
      if (/calisma modu/.test(label)) meta.mode = parseInteger(cells[1]);
    });
    if (!meta.plantName) {
      meta.plantName = String(meta.fileName || '').replace(/\.csv$/i, '').replace(/[_.]+/g, ' ').trim();
      meta.busbarName = meta.plantName;
    }
    return meta;
  }

  function detectEkcTemplateFamily(headers, meta, options = {}) {
    const headerText = (headers || []).map(normalizeCsvHeader).join(' ');
    const context = normalizeCsvHeader(`${meta.plantName || ''} ${meta.fileName || ''} ${options.filename || ''}`);
    if (/top anakaynak aktif|top yrdkaynak aktif|yardimci kaynak/.test(headerText) || /brd cok kynk|yardimci kaynak/.test(context)) {
      return /uni |unite|konv/.test(headerText + context) ? 'RGDH_HIB_KONV' : 'RGDH_HIB_RESGES';
    }
    if (/\bges\b|gunes|solar/.test(context)) return 'RGDH_GES_2021';
    if (/\bres\b|ruzgar|wind/.test(context)) return 'RGDH_RES_2021';
    return 'RGDH_KONV_2026';
  }

  function sumFinite(values) {
    const clean = (values || []).filter(Number.isFinite);
    return clean.length ? clean.reduce((sum, value) => sum + value, 0) : null;
  }

  function sumPositiveOrFirst(values, fallback) {
    const positives = (values || []).filter((value) => Number.isFinite(value) && value > 0);
    return positives.length ? positives.reduce((sum, value) => sum + value, 0) : fallback;
  }

  function sumNegativeOrSecond(values, fallback) {
    const negatives = (values || []).filter((value) => Number.isFinite(value) && value < 0);
    return negatives.length ? negatives.reduce((sum, value) => sum + value, 0) : fallback;
  }

  const EKC_COLUMN_SPECS = {
    tarih: { aliases: ['TARIH', 'Tarih', 'TARİH'] },
    saat: { aliases: ['SAAT', 'Saat'] },
    siraNo: { aliases: ['SIRA_NO', 'Sira No', 'SIRA'] },
    vBara: {
      aliases: ['BARA_GER_kV', 'BARA_GER_KV', 'BARA_GERILIMI_KV', 'BARA_GERILIMI_kV', 'HAT_GER_kV', 'HAT_GER_KV', 'HAT_GERILIMI_KV'],
      patterns: [/^bara ger(?:ilim i)? kv$/, /^hat ger(?:ilim i)? kv$/]
    },
    vSet: {
      aliases: ['BARA_GER_SET_DEG_kV', 'BARA_GER_SET_DEG_KV', 'HAT_GER_SET_DEG_kV', 'REAKT_GUC_SET_DEG_MVAr'],
      patterns: [/^(bara|hat) ger set deg kv$/]
    },
    pTotal: {
      aliases: ['TOP_AKT_CIK_GUCU_MW', 'TOP_AKT_CIKIS_GUCU_MW', 'TOP_AKT_CIKIC_GUCU_MW', 'TOPLAM_AKTIF_GUC_MW'],
      patterns: [/^top akt (cik|cikis|cikic) gucu mw$/, /^toplam aktif guc mw$/]
    },
    pMain: {
      aliases: ['TOP_ANAKAYNAK_AKT_CIK_GUCU_MW', 'TOP_ANA_KAYNAK_AKT_CIK_GUCU_MW'],
      patterns: [/^top ana ?kaynak akt (cik|cikis|cikic) gucu mw$/]
    },
    pAux: {
      aliases: ['TOP_YRDKAYNAK_AKT_CIK_GUCU_MW', 'TOP_YARDIMCI_KAYNAK_AKT_CIK_GUCU_MW'],
      patterns: [/^top (yrd|yardimci) ?kaynak akt (cik|cikis|cikic) gucu mw$/]
    },
    qMeas: {
      aliases: [
        'TOP_REAKT_CIK_GUCU_MVAr',
        'TOP_REAKT_CIKIS_GUCU_MVAr',
        'TOP_REAKT_CIKIC_GUCU_MVAr',
        'TOP_REAKT_CIK_GUCU_MVAR',
        'TOP_REAKT_CIKIS_GUCU_MVAR',
        'TOP_REAKT_CIKIC_GUCU_MVAR',
        'TOP_REAKTIF_CIK_GUCU_MVAr',
        'TOP_REAKTIF_CIKIS_GUCU_MVAr',
        'TOP_REAKTIF_CIKIC_GUCU_MVAr'
      ],
      patterns: [/^top reakt(?:if)? (cik|cikis|cikic) gucu mvar$/]
    },
    qSet: {
      aliases: ['REAKT_GUC_SET_DEG_MVAr', 'REAKTIF_GUC_SET_DEG_MVAr'],
      patterns: [/^reakt(?:if)? guc set deg mvar$/]
    },
    pfSet: {
      aliases: ['GUC_FKTR_SET_COSFI', 'GUC_FAKTORU_SET_COSFI'],
      patterns: [/^guc (fktr|faktoru) set cosfi$/]
    },
    qSyncReqMvar: {
      aliases: ['SENKRON_KOMP_SET_MVAR', 'SENKRON_KOMP_SET_MVAr', 'Q_SYNC_REQ_MVAR', 'Q_SYNC_REQ_MVAr'],
      patterns: [/^(senkron komp set|q sync req) mvar$/]
    }
  };

  function resolveEkcColumnMap(headers) {
    const map = {};
    Object.entries(EKC_COLUMN_SPECS).forEach(([field, spec]) => {
      const header = resolveEkcColumnName(headers, spec);
      if (header) map[field] = header;
    });
    return map;
  }

  function resolveEkcColumnName(headers, spec = {}) {
    const normalizedHeaders = (headers || [])
      .map((header) => ({ header, normalized: normalizeCsvHeader(header), compact: normalizeHeaderCompact(header) }))
      .filter((entry) => entry.normalized);
    const aliases = spec.aliases || [];
    const normalizedAliases = aliases.map(normalizeCsvHeader);
    const compactAliases = aliases.map(normalizeHeaderCompact);

    for (const alias of normalizedAliases) {
      const exact = normalizedHeaders.find((entry) => entry.normalized === alias);
      if (exact) return exact.header;
    }
    for (const pattern of spec.patterns || []) {
      const matched = normalizedHeaders.find((entry) => pattern.test(entry.normalized));
      if (matched) return matched.header;
    }
    let best = null;
    normalizedHeaders.forEach((entry) => {
      compactAliases.forEach((alias) => {
        if (!alias || Math.min(alias.length, entry.compact.length) < 8) return;
        const distance = levenshteinDistance(entry.compact, alias);
        const ratio = distance / Math.max(entry.compact.length, alias.length);
        if (ratio <= 0.12 && (!best || ratio < best.ratio)) {
          best = { header: entry.header, ratio };
        }
      });
    });
    return best?.header || '';
  }

  function normalizeHeaderCompact(value) {
    return normalizeCsvHeader(value).replace(/[^a-z0-9]+/g, '');
  }

  function levenshteinDistance(a, b) {
    const left = String(a || '');
    const right = String(b || '');
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 0; i < left.length; i += 1) {
      let last = i;
      previous[0] = i + 1;
      for (let j = 0; j < right.length; j += 1) {
        const old = previous[j + 1];
        previous[j + 1] = left[i] === right[j]
          ? last
          : Math.min(last + 1, previous[j] + 1, previous[j + 1] + 1);
        last = old;
      }
    }
    return previous[right.length];
  }

  function normalizeEkcCsvRow(row, meta, templateFamily, options, index) {
    const tarih = pickEkc(row, meta, 'tarih', ['TARIH', 'Tarih']);
    const saat = pickEkc(row, meta, 'saat', ['SAAT', 'Saat']);
    const dateInfo = parseTurkishDateTime(`${tarih} ${saat}`.trim());
    const pTotal = firstNumberEkc(row, meta, 'pTotal', ['TOP_AKT_CIK_GUCU_MW', 'TOP_AKT_CIKIS_GUCU_MW', 'TOP_AKT_CIKIC_GUCU_MW', 'TOPLAM_AKTIF_GUC_MW']) ?? sumByHeaderPattern(row, /akt.*(cik|cikis|cikic).*mw|_mw$/i);
    const pMain = firstNumberEkc(row, meta, 'pMain', ['TOP_ANAKAYNAK_AKT_CIK_GUCU_MW', 'TOP_ANA_KAYNAK_AKT_CIK_GUCU_MW']);
    const pAux = firstNumberEkc(row, meta, 'pAux', ['TOP_YRDKAYNAK_AKT_CIK_GUCU_MW', 'TOP_YARDIMCI_KAYNAK_AKT_CIK_GUCU_MW']);
    const qMeas = firstNumberEkc(row, meta, 'qMeas', [
      'TOP_REAKT_CIK_GUCU_MVAr',
      'TOP_REAKT_CIKIS_GUCU_MVAr',
      'TOP_REAKT_CIKIC_GUCU_MVAr',
      'TOP_REAKT_CIK_GUCU_MVAR',
      'TOP_REAKT_CIKIS_GUCU_MVAR',
      'TOP_REAKT_CIKIC_GUCU_MVAR',
      'TOP_REAKTIF_CIK_GUCU_MVAr',
      'TOP_REAKTIF_CIKIS_GUCU_MVAr'
    ]);
    const base = {
      sourceOrigin: 'EKC',
      sourceType: templateFamily.includes('KONV') ? 'CONVENTIONAL' : 'WIND',
      templateFamily,
      fileName: options.filename || options.fileName || '',
      plantName: meta.plantName,
      busbarName: meta.busbarName || meta.plantName,
      busbarId: null,
      busbarInternalId: null,
      tarih,
      saat,
      ...dateInfo,
      dakikaIndex: Number(dateInfo.localHour) * 60 + Number(dateInfo.localMinute),
      hour: Number(dateInfo.localHour),
      siraNo: parseInteger(pickEkc(row, meta, 'siraNo', ['SIRA_NO', 'Sira No', 'SIRA'])),
      vBara: firstNumberEkc(row, meta, 'vBara', ['BARA_GER_kV', 'BARA_GER_KV', 'BARA_GERILIMI_KV', 'BARA_GERILIMI_kV', 'HAT_GER_kV', 'HAT_GER_KV', 'HAT_GERILIMI_KV']),
      vSet: firstNumberEkc(row, meta, 'vSet', ['BARA_GER_SET_DEG_kV', 'BARA_GER_SET_DEG_KV', 'HAT_GER_SET_DEG_kV', 'REAKT_GUC_SET_DEG_MVAr']),
      pTotal,
      pMain,
      pAux,
      qMeas,
      qSet: firstNumberEkc(row, meta, 'qSet', ['REAKT_GUC_SET_DEG_MVAr', 'REAKTIF_GUC_SET_DEG_MVAr']),
      pfSet: firstNumberEkc(row, meta, 'pfSet', ['GUC_FKTR_SET_COSFI', 'GUC_FAKTORU_SET_COSFI']),
      qSyncReqMvar: firstNumberEkc(row, meta, 'qSyncReqMvar', ['SENKRON_KOMP_SET_MVAR', 'SENKRON_KOMP_SET_MVAr', 'Q_SYNC_REQ_MVAR', 'Q_SYNC_REQ_MVAr']),
      qNomHigh: meta.qNomHigh,
      qNomLow: meta.qNomLow,
      pnomMw: meta.pnomMw ?? ((meta.pnomMainMw || 0) + (meta.pnomAuxMw || 0) || null),
      pnomMainMw: meta.pnomMainMw,
      pnomAuxMw: meta.pnomAuxMw,
      nominalVoltageKv: meta.nominalVoltageKv,
      droopPct: meta.droopPct,
      ekcUnits: mergeEkcUnitExcitationLimits(extractEkcUnitMeasurements(row), meta.unitExcitationLimits),
      raw: row
    };
    base.tpysVoltageSet = base.vSet;
    base.liveBusbarVoltage = base.vBara;
    base.pgenMw = base.pTotal;
    base.qgenMvar = base.qMeas;
    base.auxiliaryMw = base.pAux;
    base.measurementDateLocal = base.measurementDateLocal || `${tarih} ${saat}`;
    base.localMinute = Number(dateInfo.localMinute);
    base.minuteStat = baseMinuteStat('KY', ['RGK modu hesap motorunda belirlenecek.']);
    return base;
  }

  function extractEkcUnitMeasurements(row) {
    const units = new Map();
    Object.entries(row || {}).forEach(([header, value]) => {
      const normalized = normalizeCsvHeader(header);
      const numeric = parseTurkishNumber(value);
      if (!Number.isFinite(numeric)) return;
      const mkudIndex = extractEkcUnitIndex(normalized, /(?:uevcb|uecvb|birim).*?(\d+).*mkud|(\d+).*birim.*mkud/);
      if (mkudIndex) {
        if (!units.has(mkudIndex)) units.set(mkudIndex, { index: mkudIndex });
        units.get(mkudIndex).mkudMw = numeric;
        return;
      }
      const activeIndex = extractEkcUnitIndex(normalized, /(?:uni|unit).*?(\d+).*?(?:akt|aktif|gen ter)|(\d+).*gen ter.*akt/);
      if (activeIndex) {
        if (!units.has(activeIndex)) units.set(activeIndex, { index: activeIndex });
        units.get(activeIndex).pActiveMw = numeric;
      }
    });
    return [...units.values()].sort((a, b) => a.index - b.index);
  }

  function extractEkcUnitIndex(normalizedHeader, pattern) {
    const match = String(normalizedHeader || '').match(pattern);
    if (!match) return null;
    const value = Number(match[1] || match[2]);
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }

  function buildEkcUnitExcitationLimits(values) {
    const nums = (values || []).filter(Number.isFinite);
    const limits = [];
    for (let i = 0; i < nums.length; i += 2) {
      const high = nums[i];
      const low = nums[i + 1];
      if (!Number.isFinite(high) && !Number.isFinite(low)) continue;
      const item = { index: limits.length + 1 };
      if (Number.isFinite(high)) item.nominalHighExcitation = Math.abs(high);
      if (Number.isFinite(low)) item.nominalLowExcitation = -Math.abs(low);
      limits.push(item);
    }
    return limits;
  }

  function mergeEkcUnitExcitationLimits(units, limits) {
    const byIndex = new Map((limits || []).map((item) => [Number(item.index), item]));
    const unitIndexes = new Set((units || []).map((unit) => Number(unit.index)).filter(Number.isFinite));
    (limits || []).forEach((limit) => {
      const index = Number(limit.index);
      if (Number.isFinite(index) && !unitIndexes.has(index)) unitIndexes.add(index);
    });
    return [...unitIndexes].sort((a, b) => a - b).map((index) => {
      const unit = (units || []).find((item) => Number(item.index) === index) || { index };
      const limit = byIndex.get(index) || {};
      const merged = { ...unit };
      if (Number.isFinite(limit.nominalHighExcitation)) {
        merged.nominalHighExcitation = limit.nominalHighExcitation;
        merged.highExcitationTest = limit.nominalHighExcitation;
      }
      if (Number.isFinite(limit.nominalLowExcitation)) {
        merged.nominalLowExcitation = limit.nominalLowExcitation;
        merged.lowExcitationTest = limit.nominalLowExcitation;
      }
      return merged;
    });
  }

  function pickEkc(row, meta, field, names) {
    const mapped = meta?.columnMap?.[field];
    if (mapped && Object.prototype.hasOwnProperty.call(row || {}, mapped)) return row[mapped];
    return pick(row, names);
  }

  function firstNumberEkc(row, meta, field, names) {
    const value = parseTurkishNumber(pickEkc(row, meta, field, names));
    if (Number.isFinite(value)) return value;
    return firstNumber(row, names);
  }

  function firstNumber(row, names) {
    for (const name of names) {
      const value = parseTurkishNumber(pick(row, [name]));
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  function sumByHeaderPattern(row, pattern) {
    const values = Object.entries(row || {})
      .filter(([key]) => pattern.test(key) && !/reakt|mvar|set|mkud|pmkud/i.test(key))
      .map(([, value]) => parseTurkishNumber(value))
      .filter(Number.isFinite);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0);
  }

  function deriveEkcMinuteStat(row, meta, index) {
    const warnings = [];
    const pnom = row.pnomMw;
    const p = Number(row.pTotal);
    const q = Number(row.qMeas);
    if (!row.localDate || !Number.isFinite(row.localHour)) {
      return baseMinuteStat('KY', warnings.concat('Zaman bilgisi okunamadi.'));
    }
    if (!Number.isFinite(p)) return baseMinuteStat('KY', warnings.concat('Aktif guc okunamadi.'));
    if (Number.isFinite(pnom) && p < pnom * 0.01) return baseMinuteStat('DD', warnings);
    if (Number.isFinite(pnom) && p < pnom * 0.10) return baseMinuteStat('YY', warnings);
    if (!Number.isFinite(q)) return baseMinuteStat('SAGLAMADI', warnings.concat('Reaktif guc okunamadi.'));

    const qTarget = deriveEkcQTarget(row, meta);
    if (!Number.isFinite(qTarget)) {
      return {
        ...baseMinuteStat('SAGLADI', warnings.concat('Q hedefi hesaplanamadi; dakika sadece veri var/yok kuralindan gecti.')),
        hybridDutyFlag: deriveHybridDuty(row, meta),
        hybridDutySource: deriveHybridDuty(row, meta)
      };
    }
    const absTarget = Math.abs(qTarget);
    let limitLow = null;
    let limitHigh = null;
    let result = 'SAGLADI';
    if (absTarget < 1e-9) {
      limitLow = -0.5;
      limitHigh = 0.5;
      result = q >= limitLow && q <= limitHigh ? 'SAGLADI' : 'SAGLAMADI';
    } else if (qTarget > 0) {
      limitLow = qTarget * 0.9;
      result = q >= limitLow ? 'SAGLADI' : 'SAGLAMADI';
    } else {
      limitHigh = qTarget * 0.9;
      result = q <= limitHigh ? 'SAGLADI' : 'SAGLAMADI';
    }
    return {
      result,
      qTarget,
      qThreshold: absTarget < 1e-9 ? 0.5 : absTarget * 0.1,
      limitValue: Number.isFinite(limitLow) ? limitLow : limitHigh,
      limitLow,
      limitHigh,
      hybridDutyFlag: deriveHybridDuty(row, meta),
      hybridDutySource: deriveHybridDuty(row, meta),
      warnings
    };
  }

  function baseMinuteStat(result, warnings) {
    return {
      result,
      qTarget: null,
      qThreshold: null,
      limitValue: null,
      limitLow: null,
      limitHigh: null,
      hybridDutyFlag: '',
      hybridDutySource: '',
      warnings: warnings || []
    };
  }

  function deriveEkcQTarget(row, meta) {
    if (Number.isFinite(row.qSet)) return row.qSet;
    if (Number.isFinite(row.pfSet) && Math.abs(row.pfSet) <= 1 && Math.abs(row.pfSet) > 0) {
      const pBase = Number.isFinite(row.pnomMw) ? Math.min(Math.abs(row.pTotal), row.pnomMw) : Math.abs(row.pTotal);
      const sign = row.pfSet < 0 ? -1 : 1;
      return sign * pBase * Math.tan(Math.acos(Math.abs(row.pfSet)));
    }
    if (Number.isFinite(row.vSet) && Number.isFinite(row.vBara) && Math.abs(row.vSet) > 2) {
      const delta = row.vSet - row.vBara;
      if (Math.abs(delta) < 1e-6) return 0;
      const high = firstFinite(meta.qNomHigh, meta.qNomMainHigh, meta.qNomAuxHigh);
      const low = firstFinite(meta.qNomLow, meta.qNomMainLow, meta.qNomAuxLow);
      if (delta > 0 && Number.isFinite(high)) return Math.abs(high);
      if (delta < 0 && Number.isFinite(low)) return -Math.abs(low);
    }
    return null;
  }

  function deriveHybridDuty(row, meta) {
    if (!Number.isFinite(row.pMain) && !Number.isFinite(row.pAux)) return '';
    const mainActive = Number.isFinite(row.pMain) && Number.isFinite(meta.pnomMainMw) && row.pMain >= meta.pnomMainMw * 0.10;
    const auxActive = Number.isFinite(row.pAux) && Number.isFinite(meta.pnomAuxMw) && row.pAux >= meta.pnomAuxMw * 0.10;
    if (mainActive) return 'MAIN';
    if (auxActive) return 'AUX';
    return 'NONE';
  }

  function firstFinite(...values) {
    return values.find((value) => Number.isFinite(value));
  }

  function buildEkcGroups(rows) {
    const map = new Map();
    (rows || []).forEach((row) => {
      const key = `${normalizeCsvHeader(row.busbarName || row.plantName || row.fileName)}|${row.localDate}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          busbarName: row.busbarName || row.plantName || '',
          plantName: row.plantName || '',
          localDate: row.localDate,
          templateFamily: row.templateFamily,
          rows: []
        });
      }
      map.get(key).rows.push(row);
    });
    return [...map.values()];
  }

  function parseRgdhCsvText(text, options = {}) {
    const parsed = parseSemicolonCsv(text);
    const type = detectRgdhCsvType(parsed.headers, parsed.rows);
    const filenameInternalId = extractWindInternalIdFromFilename(options.filename || options.fileName || '');
    const rows = parsed.rows.map((row) => {
      if (type === 'BUSBAR_UNIT_CATALOG') return normalizeCatalogCsvRow(row);
      if (type === 'WIND') {
        const normalized = normalizeWindCsvRow(row);
        if (filenameInternalId && normalized.busbarInternalId === null) {
          normalized.busbarInternalId = parseInteger(filenameInternalId);
        }
        return normalized;
      }
      return type === 'CONVENTIONAL' ? normalizeConventionalCsvRow(row) : row;
    });
    return { ...parsed, type, rows };
  }

  const RGDH_EXPORT_COLUMNS = [
    { key: 'sourceOrigin', header: 'Kaynak', type: 'text' },
    { key: 'sourceType', header: 'Veri Tipi', type: 'text' },
    { key: 'measurementDateLocal', header: '\u00d6l\u00e7\u00fcm Zaman\u0131', type: 'text' },
    { key: 'ytm', header: 'YTM', type: 'text' },
    { key: 'plantName', header: 'Santral', type: 'text' },
    { key: 'busbarInternalId', header: 'YKS \u0130\u00e7 Bara ID', type: 'text' },
    { key: 'busbarId', header: 'Bara ID', type: 'text' },
    { key: 'busbarName', header: 'Bara Ad\u0131', type: 'text' },
    { key: 'tpysVoltageSet', header: 'TPYS Set', type: 'number' },
    { key: 'liveBusbarVoltage', header: 'Canl\u0131 Bara', type: 'number' },
    { key: 'pgenMw', header: 'Pgen MW', type: 'number' },
    { key: 'qgenMvar', header: 'Qgen MVAr', type: 'number' },
    { key: 'auxiliaryMw', header: 'Yard\u0131mc\u0131 Kaynak MW', type: 'number' },
    { key: 'auxiliaryMvar', header: 'Yard\u0131mc\u0131 Kaynak MVAr', type: 'number' },
    { key: 'auxiliaryDiMvarLimit', header: 'Yard\u0131mc\u0131 D.\u0130. Limit', type: 'number' },
    { key: 'auxiliaryAiMvarLimit', header: 'Yard\u0131mc\u0131 A.\u0130. Limit', type: 'number' },
    { key: 'diMvarLimit', header: 'D.\u0130. Limit', type: 'number' },
    { key: 'aiMvarLimit', header: 'A.\u0130. Limit', type: 'number' },
    { key: 'approvalStatus', header: 'Ana Onay', type: 'text' },
    { key: 'auxiliaryApprovalStatus', header: 'Yard\u0131mc\u0131 Onay', type: 'text' }
  ];

  const RGDH_CATALOG_EXPORT_COLUMNS = [
    { key: 'busbarType', header: 'Bara Tipi', type: 'text' },
    { key: 'busbarId', header: 'Bara ID', type: 'number' },
    { key: 'busbarName', header: 'Bara Adı', type: 'text' },
    { key: 'rgkType', header: 'RGK Tipi', type: 'text' },
    { key: 'voltageLevel', header: 'Bara Gerilim Seviyesi', type: 'number' },
    { key: 'ytm', header: 'BYTM', type: 'text' },
    { key: 'plantId', header: 'TPYS Santral ID', type: 'number' },
    { key: 'plantName', header: 'TPYS Santral İsmi', type: 'text' },
    { key: 'busbar1Ta', header: 'Bara 1 TA', type: 'text' },
    { key: 'busbar1Setnum', header: 'Bara 1 Setnum', type: 'text' },
    { key: 'busbar2Ta', header: 'Bara 2 TA', type: 'text' },
    { key: 'busbar2Setnum', header: 'Bara 2 Setnum', type: 'text' },
    { key: 'busbar3Ta', header: 'Bara 3 TA', type: 'text' },
    { key: 'busbar3Setnum', header: 'Bara 3 Setnum', type: 'text' },
    { key: 'unitName', header: 'Ünite Adı', type: 'text' },
    { key: 'uevcbName', header: 'UEVCB Adı', type: 'text' },
    { key: 'unitId', header: 'TPYS UEVCB ID', type: 'number' },
    { key: 'sourceKind', header: 'Kaynak Tipi', type: 'text' },
    { key: 'activePowerTa', header: 'Aktif Güç TA', type: 'text' },
    { key: 'activePowerSetnum', header: 'Aktif Güç Setnum', type: 'text' },
    { key: 'reactivePowerTa', header: 'Reaktif Güç TA', type: 'text' },
    { key: 'reactivePowerSetnum', header: 'Reaktif Güç Setnum', type: 'text' },
    { key: 'unitPnomMw', header: 'Ünite Nominal Güç', type: 'number' },
    { key: 'unitPmkudMw', header: 'Ünite PMKUD', type: 'number' },
    { key: 'nominalLowExcitation', header: 'Nominal İkaz (Düşük)', type: 'number' },
    { key: 'nominalHighExcitation', header: 'Nominal İkaz (Aşırı)', type: 'number' },
    { key: 'unitActive', header: 'Ünite Aktif mi ?', type: 'active' },
    { key: 'ytbsPlantName', header: 'YTBS Santral Adı', type: 'text' },
    { key: 'ytbsSubstationId', header: 'YTBS Trafo Merkezi ID', type: 'number' },
    { key: 'ytbsSubstationName', header: 'YTBS Trafo Merkezi Adı', type: 'text' },
    { key: 'latitude', header: 'Enlem', type: 'number' },
    { key: 'longitude', header: 'Boylam', type: 'number' },
    { key: 'ytbsSourceType', header: 'KAYNAK TÜRÜ', type: 'text' },
    { key: 'secondarySources', header: 'İkincil Kaynakları', type: 'text' },
    { key: 'city', header: 'İli', type: 'text' },
    { key: 'ytbsBusbarType', header: 'Bara Tipi', rawHeader: 'Bara Tipi__2', type: 'text' },
    { key: 'hasSynchronousCondenser', header: 'Senkron Kompansatör Var mI?', type: 'boolean01' },
    { key: 'hasEuasProtocol', header: 'EÜAŞ Protokol Var Mı?', type: 'boolean01' },
    { key: 'platformRgkType', header: 'Yan Hizmetler Analiz Platformu RGK Tipi', type: 'text' },
    { key: 'rgkTypeDescription', header: 'RGK TİPİ Açıklama', type: 'text' },
    { key: 'isBalancingUnit', header: 'Dengeleme Birimi mi?', type: 'boolean01' },
    { key: 'tpysUnitMkud', header: 'TPYS Ünite MKÜD', type: 'number' },
    { key: 'tpysPlantMkud', header: 'TPYS Santral MKÜD', type: 'number' }
  ];

  function buildExportCsv(rows, options = {}) {
    const columns = options.columns || RGDH_EXPORT_COLUMNS;
    const lines = [
      '\uFEFFsep=;',
      columns.map((column) => quoteCsv(column.header)).join(';')
    ];
    (rows || []).forEach((row) => {
      lines.push(columns.map((column) => formatExportCell(row?.[column.key], column)).join(';'));
    });
    return lines.join('\n');
  }

  const COMPARE_EXPORT_COLUMNS = [
    { key: 'localDate', header: 'Tarih', type: 'text' },
    { key: 'hour', header: 'Saat', type: 'hour' },
    { key: 'commonMinutes', header: 'Eşleşen DK', type: 'integer' },
    { key: 'ekcStat', header: 'Ek-C Değerlendirme', type: 'stat' },
    { key: 'platformStat', header: 'YKS Değerlendirme', type: 'stat' },
    { key: 'ekcStat', header: 'Ek-C K.Y (%)', type: 'ratio' },
    { key: 'platformStat', header: 'YKS K.Y (%)', type: 'ratio' },
    { key: 'avgYksV', header: 'Gerilim Karşılaştırma - YKS V Ort', type: 'number2' },
    { key: 'avgEkcV', header: 'Gerilim Karşılaştırma - EK-C V Ort', type: 'number2' },
    { key: 'avgDeltaV', header: 'Gerilim Karşılaştırma - Fark dV', type: 'number2' },
    { key: 'maxDeltaV', header: 'Gerilim Karşılaştırma - Max dV', type: 'number2' },
    { key: 'avgYksP', header: 'Aktif Güç Karşılaştırma - YKS P Ort', type: 'number2' },
    { key: 'avgEkcP', header: 'Aktif Güç Karşılaştırma - EK-C P Ort', type: 'number2' },
    { key: 'avgDeltaP', header: 'Aktif Güç Karşılaştırma - Fark dP', type: 'number2' },
    { key: 'maxDeltaP', header: 'Aktif Güç Karşılaştırma - Max dP', type: 'number2' },
    { key: 'avgYksQ', header: 'Reaktif Güç Karşılaştırma - YKS Q Ort', type: 'number2' },
    { key: 'avgEkcQ', header: 'Reaktif Güç Karşılaştırma - EK-C Q Ort', type: 'number2' },
    { key: 'avgDeltaQ', header: 'Reaktif Güç Karşılaştırma - Fark dQ', type: 'number2' },
    { key: 'maxDeltaQ', header: 'Reaktif Güç Karşılaştırma - Max dQ', type: 'number2' },
    { key: 'avgYksHybridP', header: 'Hibrit P Karşılaştırma - YKS Hibrit P', type: 'number2' },
    { key: 'avgEkcHybridP', header: 'Hibrit P Karşılaştırma - EK-C Hibrit P', type: 'number2' },
    { key: 'avgDeltaHybridP', header: 'Hibrit P Karşılaştırma - Fark dHP', type: 'number2' },
    { key: 'maxDeltaHybridP', header: 'Hibrit P Karşılaştırma - Max dHP', type: 'number2' }
  ];

  function buildCompareExportCsv(rows, options = {}) {
    const columns = options.columns || COMPARE_EXPORT_COLUMNS;
    const lines = [
      '\uFEFFsep=;',
      columns.map((column) => quoteCsv(column.header)).join(';')
    ];
    (rows || []).forEach((row) => {
      lines.push(columns.map((column) => formatCompareExportCell(row, column)).join(';'));
    });
    return lines.join('\n');
  }

  function buildCatalogExportCsv(rows, options = {}) {
    const columns = options.columns || RGDH_CATALOG_EXPORT_COLUMNS;
    const lines = [
      '\uFEFFsep=;',
      columns.map((column) => quoteCsv(column.header)).join(';')
    ];
    (rows || []).forEach((row) => {
      lines.push(columns.map((column) => formatCatalogExportCell(row, column)).join(';'));
    });
    return lines.join('\n');
  }

  function formatCatalogExportCell(row, column = {}) {
    const rawHeader = column.rawHeader || column.header;
    if (row?.raw && Object.prototype.hasOwnProperty.call(row.raw, rawHeader)) {
      return quoteCsv(row.raw[rawHeader]);
    }
    const value = row?.[column.key];
    if (value === null || value === undefined || value === '') return '';
    if (column.type === 'active') {
      if (value === true) return quoteCsv('AKTİF');
      if (value === false) return quoteCsv('PASİF');
    }
    if (column.type === 'boolean01') {
      if (value === true) return quoteCsv('1');
      if (value === false) return quoteCsv('0');
    }
    if (column.type === 'number') return quoteCsv(formatTurkishMetric(value));
    return quoteCsv(value);
  }

  function formatCompareExportCell(row, column = {}) {
    const value = row?.[column.key];
    if (column.type === 'hour') {
      const hour = Number(value);
      return Number.isFinite(hour) ? `${String(hour).padStart(2, '0')}:00` : '';
    }
    if (column.type === 'integer') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? String(Math.round(numeric)) : '';
    }
    if (column.type === 'number2') return formatTurkishFixed(value, 2);
    if (column.type === 'ratio') return formatCompareRatio(value);
    if (column.type === 'stat') return quoteCsv(formatCompareStat(value));
    if (value === null || value === undefined || value === '') return '';
    return quoteCsv(value);
  }

  function formatCompareStat(stat) {
    if (!stat) return '';
    const result = String(stat.hourResult || stat.status || '').toUpperCase();
    const pass = Number(stat.passCount || stat.successMinuteCount || 0);
    const fail = Number(stat.failCount || 0);
    const dd = Number(stat.ddCount || 0);
    const yy = Number(stat.yyCount || 0);
    const ky = Number(stat.kyCount || 0);
    return [result, `OK ${pass}`, `FAIL ${fail}`, `DD ${dd}`, `YY ${yy}`, `KY ${ky}`].filter(Boolean).join(' / ');
  }

  function formatCompareRatio(stat) {
    const result = String(stat?.hourResult || stat?.status || '').toUpperCase();
    if (result === 'DD' || result === 'YY' || result === 'KY') return result;
    const ratio = Number(stat?.passRatio ?? stat?.participationPct);
    return Number.isFinite(ratio) ? `${formatTurkishFixed(ratio, 2)}%` : '';
  }

  function formatTurkishFixed(value, digits) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '';
    return numeric.toLocaleString('tr-TR', {
      useGrouping: false,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatExportCell(value, column = {}) {
    if (value === null || value === undefined || value === '') return '';
    if (column.type === 'number') return formatTurkishMetric(value);
    return excelTextCell(value);
  }

  function formatTurkishMetric(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return excelTextCell(value);
    return numeric.toLocaleString('tr-TR', {
      useGrouping: false,
      maximumFractionDigits: 6
    });
  }

  function excelTextCell(value) {
    const raw = String(value ?? '');
    if (!raw) return '';
    const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return quoteCsv(`="${safe.replace(/"/g, '""')}"`);
  }

  function quoteCsv(value) {
    const raw = String(value ?? '');
    return /[;"\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  }

  return {
    parseSemicolonCsv,
    parseTurkishNumber,
    parseTurkishDateTime,
    normalizeCsvHeader,
    detectRgdhCsvType,
    normalizeConventionalCsvRow,
    normalizeWindCsvRow,
    normalizeCatalogCsvRow,
    parseTurkishBoolean,
    extractWindInternalIdFromFilename,
    parseEkcCsvText,
    parseRgdhCsvText,
    buildExportCsv,
    buildCompareExportCsv,
    buildCatalogExportCsv,
    formatExportCell,
    RGDH_EXPORT_COLUMNS,
    RGDH_CATALOG_EXPORT_COLUMNS
  };
});
