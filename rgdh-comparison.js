(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_COMPARISON = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  const RESULT_PASS = 'SAGLADI';
  const RESULT_FAIL = 'SAGLAMADI';
  const RESULT_DD = 'DD';
  const RESULT_YY = 'YY';
  const RESULT_KY = 'KY';

  function bindEkcRowsToSelectedBusbar(rows, target) {
    if (!target?.busbarId) return rows || [];
    return (rows || []).map((row) => {
      const ekcOriginalName = row.ekcOriginalName || row.busbarName || row.plantName || row.fileName || '';
      return {
        ...row,
        ekcOriginalName,
        ekcOriginalBusbarName: row.ekcOriginalBusbarName || row.busbarName || '',
        ekcOriginalPlantName: row.ekcOriginalPlantName || row.plantName || '',
        ekcBoundToYks: true,
        busbarId: String(target.busbarId),
        busbarInternalId: target.busbarInternalId ?? row.busbarInternalId ?? null,
        busbarName: target.busbarName || row.busbarName || '',
        plantName: target.plantName || row.plantName || '',
        sourceType: target.sourceType || row.sourceType || '',
        ytm: target.ytm || row.ytm || ''
      };
    });
  }

  function getEkcDateFilterUpdate(rows, filters = {}) {
    const dates = [...new Set((rows || []).map((row) => row.localDate).filter(Boolean))].sort();
    if (!dates.length) return { changed: false, dates: [] };
    if (dateRangeCovers(filters, dates)) return { changed: false, dates };
    return {
      changed: true,
      dates,
      date: dates[0],
      endDate: dates.length > 1 ? addLocalDays(dates[dates.length - 1], 1) : ''
    };
  }

  function dateRangeCovers(filters, dates) {
    if (!filters?.date) return false;
    const start = filters.date;
    const end = filters.endDate || addLocalDays(start, 1);
    return (dates || []).every((date) => date >= start && date < end);
  }

  function addLocalDays(localDate, days) {
    const parts = String(localDate || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return '';
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function buildEkcPlatformComparison(platformRows, ekcRows, options = {}) {
    const pivot = options.pivot || root.RGDH_PIVOT || {};
    const platformIndex = indexRowsForComparison(platformRows, 'platform');
    const usedPlatform = new Set();
    const rows = [];
    (ekcRows || []).forEach((ekc) => {
      const keys = comparisonKeys(ekc, 'ekc');
      const key = keys.find((candidate) => platformIndex.has(candidate));
      const platform = key ? platformIndex.get(key) : null;
      if (platform) usedPlatform.add(platform);
      rows.push(buildCompareMinuteRow(key || keys[0] || '', ekc, platform, pivot));
    });
    (platformRows || []).forEach((platform) => {
      if (usedPlatform.has(platform)) return;
      rows.push(buildCompareMinuteRow(comparisonKeys(platform, 'platform')[0] || '', null, platform, pivot));
    });
    rows.sort((a, b) => String(a.measurementDateLocal).localeCompare(String(b.measurementDateLocal)));
    const summary = {
      both: rows.filter((row) => row.joinState === 'both').length,
      ekcOnly: rows.filter((row) => row.joinState === 'ekc_only').length,
      platformOnly: rows.filter((row) => row.joinState === 'platform_only').length,
      resultMismatch: rows.filter((row) => row.joinState === 'both' && row.ekcResult && row.platformResult && row.ekcResult !== row.platformResult).length
    };
    return {
      rows,
      hourRows: buildCompareHourRows(rows, pivot),
      summary,
      diagnosis: buildComparisonDiagnosis(platformRows, ekcRows, summary, options),
      matches: []
    };
  }

  function buildComparisonDiagnosis(platformRows, ekcRows, summary = {}, options = {}) {
    if ((summary.both || 0) > 0) return '';
    const platform = Array.isArray(platformRows) ? platformRows : [];
    const ekc = Array.isArray(ekcRows) ? ekcRows : [];
    if (ekc.length && !platform.length) return 'Ortak dakika bulunamadi: EK-C tarihi icin YKS SCADA verisi yok';
    if (!ekc.length && platform.length) return 'Ortak dakika bulunamadi: aktif filtrelerde EK-C verisi yok';
    if (!ekc.length && !platform.length) return 'Ortak dakika bulunamadi: aktif filtrelerde EK-C ve YKS SCADA verisi yok';

    const platformDates = new Set(platform.map((row) => row.localDate).filter(Boolean));
    const ekcDates = new Set(ekc.map((row) => row.localDate).filter(Boolean));
    const hasDateOverlap = [...ekcDates].some((date) => platformDates.has(date));
    if (!hasDateOverlap) return 'Ortak dakika bulunamadi: EK-C ve YKS SCADA tarihleri uyusmuyor';

    if (options.bindingTargetMissing) {
      return options.missingBindingDiagnosis || 'Ortak dakika bulunamadi: secili YKS SCADA barasi yok veya EK-C icin otomatik bara eslesmesi yapilamadi';
    }

    const missingEkcFields = ekc.some((row) => !isFiniteCell(row.vBara) || !isFiniteCell(row.pTotal) || !isFiniteCell(row.qMeas));
    if (missingEkcFields) return 'Ortak dakika bulunamadi: EK-C V/P/Q alanlari eksik veya okunamadi';

    return 'Ortak dakika bulunamadi: secili YKS SCADA barasi ile EK-C dakika anahtarlari eslesmedi';
  }

  function indexRowsForComparison(rows, kind) {
    const map = new Map();
    (rows || []).forEach((row) => {
      comparisonKeys(row, kind).forEach((key) => {
        if (key && !map.has(key)) map.set(key, row);
      });
    });
    return map;
  }

  function buildCompareMinuteRow(key, ekc, platform, pivot) {
    const joinState = ekc && platform ? 'both' : (ekc ? 'ekc_only' : 'platform_only');
    const platformVerdict = platform ? derivePlatformMinuteResult(platform, pivot) : null;
    const ekcResult = normalizeReactiveResult(ekc?.minuteStat?.result, pivot);
    const platformResult = normalizeReactiveResult(platformVerdict?.result, pivot);
    const platformEquivalentLimit = platform ? platformEquivalentQLimit(platform) : null;
    const ekcLimitComparable = ekc ? ekcComparableLimit(ekc) : null;
    const measurementDateLocal = ekc?.measurementDateLocal || platform?.measurementDateLocal || '';
    return {
      key,
      joinState,
      ekc,
      platform,
      measurementDateLocal,
      localDate: ekc?.localDate || platform?.localDate || '',
      hour: Number(ekc?.hour ?? ekc?.localHour ?? platform?.localHour ?? 0),
      minuteIndex: Number(ekc?.dakikaIndex ?? platformMinuteIndex(platform)),
      ekcResult,
      platformResult,
      ekcLimitComparable,
      platformEquivalentLimit,
      deltaV: deltaNumber(ekc?.vBara, platform?.liveBusbarVoltage),
      deltaP: deltaNumber(ekc?.pTotal, platform?.pgenMw),
      deltaQ: deltaNumber(ekc?.qMeas, platform?.qgenMvar),
      deltaHybridP: deltaNumber(ekcHybridPower(ekc), platform?.auxiliaryMw),
      ekcHybridDutyFlag: ekc?.minuteStat?.hybridDutyFlag || '',
      platformProvidedBy: platform?.auxiliaryApprovalStatus === 1 ? 'AUX' : 'MAIN',
      hybridConsistency: compareHybridDuty(ekc, platform)
    };
  }

  function comparisonKeys(row, kind) {
    if (!row) return [];
    const date = row.localDate || '';
    const minute = kind === 'ekc' ? Number(row.dakikaIndex) : platformMinuteIndex(row);
    if (!date || !Number.isFinite(minute)) return [];
    return comparisonEntityKeys(row).map((entity) => `${entity}|${date}|${minute}`).filter(Boolean);
  }

  function comparisonEntityKey(row) {
    return comparisonEntityKeys(row)[0] || '';
  }

  function comparisonEntityKeys(row) {
    const keys = [];
    if (row?.catalog?.busbarId) keys.push(`catalog:${row.catalog.busbarId}`);
    if (row?.busbarInternalId) keys.push(`internal:${row.busbarInternalId}`);
    if (row?.busbarId) keys.push(`busbar:${row.busbarId}`);
    const name = normalizeText(row?.busbarName || row?.plantName || row?.fileName || '');
    if (name) keys.push(`name:${name}`);
    return [...new Set(keys)];
  }

  function platformMinuteIndex(row) {
    if (!row) return null;
    const explicit = Number(row.minuteIndex ?? row.dakikaIndex);
    if (Number.isFinite(explicit)) return explicit;
    const hour = Number(row.localHour);
    const minute = Number(row.localMinute);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
  }

  function platformEquivalentQLimit(row) {
    const q = Number(row?.qgenMvar);
    const di = Number(row?.diMvarLimit);
    const ai = Number(row?.aiMvarLimit);
    if (Number.isFinite(q) && q < 0 && Number.isFinite(di)) return di;
    if (Number.isFinite(q) && q > 0 && Number.isFinite(ai)) return ai;
    if (Number.isFinite(di) && !Number.isFinite(ai)) return di;
    if (Number.isFinite(ai) && !Number.isFinite(di)) return ai;
    if (Number.isFinite(q) && Number.isFinite(di) && Number.isFinite(ai)) {
      return Math.abs(q - di) <= Math.abs(q - ai) ? di : ai;
    }
    return null;
  }

  function ekcComparableLimit(row) {
    const stat = row?.minuteStat || {};
    const q = Number(row?.qMeas);
    if (Number.isFinite(stat.limitValue)) return stat.limitValue;
    if (Number.isFinite(q) && q < 0 && Number.isFinite(stat.limitHigh)) return stat.limitHigh;
    if (Number.isFinite(q) && q > 0 && Number.isFinite(stat.limitLow)) return stat.limitLow;
    if (Number.isFinite(stat.limitLow) && !Number.isFinite(stat.limitHigh)) return stat.limitLow;
    if (Number.isFinite(stat.limitHigh) && !Number.isFinite(stat.limitLow)) return stat.limitHigh;
    return null;
  }

  function buildCompareHourRows(compareRows, pivot) {
    const grouped = new Map();
    (compareRows || []).forEach((row) => {
      const entity = comparisonEntityKey(row.ekc || row.platform);
      const key = `${entity}|${row.localDate}|${row.hour}`;
      if (!grouped.has(key)) grouped.set(key, { key, entity, localDate: row.localDate, hour: row.hour, rows: [] });
      grouped.get(key).rows.push(row);
    });
    return [...grouped.values()].map((group) => {
      const bothRows = group.rows.filter((row) => row.joinState === 'both');
      const ekcSourceRows = group.rows.filter((row) => row.joinState !== 'platform_only');
      const platformSourceRows = group.rows.filter((row) => row.joinState !== 'ekc_only');
      const ekcStat = ekcSourceRows.length ? buildHourStatFromResultRows(ekcSourceRows, 'ekcResult', pivot) : null;
      const platformStat = platformSourceRows.length ? buildHourStatFromResultRows(platformSourceRows, 'platformResult', pivot) : null;
      return {
        ...group,
        ekcStat,
        platformStat,
        commonMinutes: bothRows.length,
        ekcOnlyMinutes: group.rows.filter((row) => row.joinState === 'ekc_only').length,
        platformOnlyMinutes: group.rows.filter((row) => row.joinState === 'platform_only').length,
        ddCount: countResult(group.rows, RESULT_DD),
        yyCount: countResult(group.rows, RESULT_YY),
        kyCount: countResult(group.rows, RESULT_KY),
        passCount: countResult(group.rows, RESULT_PASS),
        failCount: countResult(group.rows, RESULT_FAIL),
        avgYksV: average(group.rows.map((row) => row.platform?.liveBusbarVoltage)),
        avgEkcV: average(group.rows.map((row) => row.ekc?.vBara)),
        avgYksP: average(group.rows.map((row) => row.platform?.pgenMw)),
        avgEkcP: average(group.rows.map((row) => row.ekc?.pTotal)),
        avgYksQ: average(group.rows.map((row) => row.platform?.qgenMvar)),
        avgEkcQ: average(group.rows.map((row) => row.ekc?.qMeas)),
        avgYksHybridP: average(group.rows.map((row) => row.platform?.auxiliaryMw)),
        avgEkcHybridP: average(group.rows.map((row) => ekcHybridPower(row.ekc))),
        avgDeltaV: averageAbs(bothRows.map((row) => row.deltaV)),
        avgDeltaP: averageAbs(bothRows.map((row) => row.deltaP)),
        avgDeltaQ: averageAbs(bothRows.map((row) => row.deltaQ)),
        avgDeltaHybridP: averageAbs(bothRows.map((row) => row.deltaHybridP)),
        maxDeltaV: maxAbs(bothRows.map((row) => row.deltaV)),
        maxDeltaP: maxAbs(bothRows.map((row) => row.deltaP)),
        maxDeltaQ: maxAbs(bothRows.map((row) => row.deltaQ)),
        maxDeltaHybridP: maxAbs(bothRows.map((row) => row.deltaHybridP)),
        hybridConsistency: uniqueStrings(bothRows.map((row) => row.hybridConsistency).filter(Boolean)).join(', ')
      };
    }).sort(compareHourRows);
  }

  function compareHourRows(a, b) {
    const dateCompare = String(a?.localDate || '').localeCompare(String(b?.localDate || ''));
    if (dateCompare !== 0) return dateCompare;
    const leftHour = Number(a?.hour);
    const rightHour = Number(b?.hour);
    if (Number.isFinite(leftHour) && Number.isFinite(rightHour) && leftHour !== rightHour) {
      return leftHour - rightHour;
    }
    return String(a?.key || '').localeCompare(String(b?.key || ''));
  }

  function buildHourStatFromResultRows(rows, field, pivot) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    const summary = pivot?.reactiveHourSummary || fallbackReactiveHourSummary;
    if (!sourceRows.length) {
      return summary({
        passCount: 0,
        failCount: 0,
        kyCount: 1,
        ddCount: 0,
        yyCount: 0,
        missingCount: 1,
        activeLiabilityMinutes: 0
      }, {
        expectedMinuteCount: 1,
        failMinuteThreshold: 0,
        minActiveLiabilityMinutes: 1,
        dominantOfflineThreshold: 0,
        kyMinuteThreshold: 1
      });
    }
    const counts = { passCount: 0, failCount: 0, kyCount: 0, ddCount: 0, yyCount: 0 };
    sourceRows.forEach((row) => {
      const result = normalizeReactiveResult(row[field], pivot);
      if (result === RESULT_PASS) counts.passCount += 1;
      else if (result === RESULT_FAIL) counts.failCount += 1;
      else if (result === RESULT_KY) counts.kyCount += 1;
      else if (result === RESULT_DD) counts.ddCount += 1;
      else if (result === RESULT_YY) counts.yyCount += 1;
    });
    const expectedMinuteCount = sourceRows.length;
    return summary({
      ...counts,
      missingCount: 0,
      activeLiabilityMinutes: counts.passCount + counts.failCount + counts.ddCount + counts.yyCount
    }, {
      expectedMinuteCount,
      failMinuteThreshold: Math.floor(expectedMinuteCount * 0.2),
      minActiveLiabilityMinutes: 1,
      dominantOfflineThreshold: Math.max(0, expectedMinuteCount - 1),
      kyMinuteThreshold: expectedMinuteCount
    });
  }

  function derivePlatformMinuteResult(row, pivot) {
    if (pivot?.derivePlatformMinuteResult) return pivot.derivePlatformMinuteResult(row);
    if (!row) return { result: RESULT_KY, reason: 'missing_row' };
    if (Number(row.approvalStatus) === 1 || Number(row.auxiliaryApprovalStatus) === 1) {
      return { result: RESULT_PASS, reason: 'approval_or_aux_approval' };
    }
    if (row.approvalStatus !== undefined || row.auxiliaryApprovalStatus !== undefined) {
      return { result: RESULT_FAIL, reason: 'approval_missing' };
    }
    return { result: RESULT_KY, reason: 'unknown' };
  }

  function normalizeReactiveResult(value, pivot) {
    if (pivot?.normalizeReactiveResultCode) return pivot.normalizeReactiveResultCode(value);
    return normalizeReactiveResultCode(value);
  }

  function normalizeReactiveResultCode(value) {
    if (value === null || value === undefined) return '';
    const code = String(value)
      .trim()
      .toUpperCase()
      .replace(/Ğ/g, 'G')
      .replace(/İ/g, 'I')
      .replace(/Ş/g, 'S')
      .replace(/Ü/g, 'U')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C');
    if (!code) return '';
    if (code === 'OK' || code === 'PASS' || code === RESULT_PASS || code === 'SAGLADI') return RESULT_PASS;
    if (code === 'WARN' || code === 'WARNING' || code === 'FAIL' || code === RESULT_FAIL || code === 'SAGLAMADI') return RESULT_FAIL;
    if (code === 'OFF' || code === RESULT_DD) return RESULT_DD;
    if (code === 'NO_DATA' || code === 'NODATA' || code === RESULT_KY) return RESULT_KY;
    if (code === RESULT_YY) return RESULT_YY;
    return code;
  }

  function fallbackReactiveHourSummary(counts, cfg) {
    const expected = Number(cfg?.expectedMinuteCount) || 1;
    const passCount = Number(counts?.passCount) || 0;
    const failCount = Number(counts?.failCount) || 0;
    const kyCount = Number(counts?.kyCount) || 0;
    const ddCount = Number(counts?.ddCount) || 0;
    const yyCount = Number(counts?.yyCount) || 0;
    let hourResult = RESULT_PASS;
    if (kyCount >= expected) hourResult = RESULT_KY;
    else if (ddCount >= expected) hourResult = RESULT_DD;
    else if (yyCount >= expected) hourResult = RESULT_YY;
    else if (failCount > Math.floor(expected * 0.2)) hourResult = RESULT_FAIL;
    return {
      ...counts,
      passCount,
      failCount,
      kyCount,
      ddCount,
      yyCount,
      hourResult,
      passRatio: hourResult === RESULT_PASS || hourResult === RESULT_FAIL ? (passCount / expected) * 100 : null
    };
  }

  function compareHybridDuty(ekc, platform) {
    const ekcFlag = ekc?.minuteStat?.hybridDutyFlag || '';
    if (!ekcFlag) return '';
    const platformBy = platform?.auxiliaryApprovalStatus === 1 ? 'AUX' : 'MAIN';
    return ekcFlag === platformBy ? 'uyumlu' : 'kontrol';
  }

  function countResult(rows, result) {
    return (rows || []).filter((row) => row.ekcResult === result || row.platformResult === result).length;
  }

  function deltaNumber(left, right) {
    const a = Number(left);
    const b = Number(right);
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
  }

  function ekcHybridPower(row) {
    const primary = Number(row?.pAux);
    if (Number.isFinite(primary)) return primary;
    const fallback = Number(row?.auxiliaryMw);
    return Number.isFinite(fallback) ? fallback : null;
  }

  function average(values) {
    const numbers = (values || []).map(Number).filter(Number.isFinite);
    if (!numbers.length) return null;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  function averageAbs(values) {
    const numbers = (values || []).map(Number).filter(Number.isFinite).map(Math.abs);
    if (!numbers.length) return null;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  function maxAbs(values) {
    const clean = (values || []).map(Number).filter(Number.isFinite).map(Math.abs);
    return clean.length ? Math.max(...clean) : null;
  }

  function isFiniteCell(value) {
    if (value === null || value === undefined || value === '') return false;
    return Number.isFinite(Number(value));
  }

  function uniqueStrings(values) {
    return [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[Ä±Iı]/g, 'i')
      .replace(/[Ä°İ]/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  return {
    bindEkcRowsToSelectedBusbar,
    getEkcDateFilterUpdate,
    dateRangeCovers,
    addLocalDays,
    buildEkcPlatformComparison,
    buildComparisonDiagnosis,
    comparisonKeys,
    comparisonEntityKeys,
    platformMinuteIndex,
    normalizeReactiveResultCode
  };
});
