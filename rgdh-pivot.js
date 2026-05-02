(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_PIVOT = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const RGDH_HOURLY_RULES = {
    expectedMinuteCount: 60,
    failRatioForFail: 0.10,
    minAvailabilityForOk: 0.98
  };

  const RGDH_REACTIVE_SETTINGS = {
    expectedMinuteCount: 60,
    approvalThresholdPct: 90,
    dhProductionPct: 1,
    yyResGesPct: 10,
    yyConvMkudFactor: 1,
    minActiveLiabilityMinutes: 13,
    dominantOfflineThreshold: 47,
    failMinuteThreshold: 12,
    kyMinuteThreshold: 60
  };

  const RESULT_PASS = 'SAGLADI';
  const RESULT_FAIL = 'SAGLAMADI';
  const RESULT_DD = 'DD';
  const RESULT_YY = 'YY';
  const RESULT_KY = 'KY';

  function buildHourlyStatus(rowsForHour, rules = RGDH_HOURLY_RULES) {
    return buildPlatformHourStat(rowsForHour, rules).hourResult;
  }

  function assessRowStatus(row) {
    if (!row || row.flags?.missingCriticalValue) return 'FAIL';
    if (row.flags?.voltageOutOfBand || row.flags?.qOutOfLimit || row.flags?.platformMismatch) return 'FAIL';
    if (row.flags?.partialSource) return 'WARN';
    return 'OK';
  }

  function allOff(rows) {
    return rows.length > 0 && rows.every((row) => row.serviceActive === false || Number(row.offBoardStatus) === 1);
  }

  function buildDailyPivot(rows, localDate, rules = RGDH_HOURLY_RULES) {
    const settings = mergeReactiveSettings(rules);
    const grouped = new Map();
    (rows || [])
      .filter((row) => !localDate || row.localDate === localDate)
      .forEach((row) => {
        const key = `${row.sourceType || ''}:${row.busbarId ?? ''}:${row.localDate || ''}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            sourceType: row.sourceType || '',
            busbarId: row.busbarId,
            busbarName: row.busbarName || '',
            localDate: row.localDate || '',
            ytm: row.ytm || '',
            controlType: 'Nihai RGDH Onay Durumu',
            rows: []
          });
        }
        grouped.get(key).rows.push(row);
      });

    const pivotRows = [...grouped.values()].map((group) => {
      const hours = Array.from({ length: 24 }, (_, hour) => {
        const hourRows = group.rows.filter((row) => Number(row.localHour) === hour);
        return {
          hour,
          ...buildPlatformHourStat(hourRows, settings)
        };
      });
      return {
        ...group,
        hours,
        summary: buildDailySummary(group.rows, hours)
      };
    });

    return { localDate, rows: pivotRows };
  }

  function buildDailySummary(rows, hours) {
    const byStatus = countStatuses(hours);
    const expectedRecordCount = 24 * RGDH_REACTIVE_SETTINGS.expectedMinuteCount;
    const receivedRecordCount = rows.length;
    const availabilityPct = expectedRecordCount ? (receivedRecordCount / expectedRecordCount) * 100 : 0;
    const passHours = byStatus[RESULT_PASS] || 0;
    const failHours = byStatus[RESULT_FAIL] || 0;
    const kyHours = byStatus[RESULT_KY] || 0;
    const ddHours = byStatus[RESULT_DD] || 0;
    const yyHours = byStatus[RESULT_YY] || 0;
    const problematic = hours.find((item) => normalizeReactiveResultCode(item.hourResult || item.status) === RESULT_FAIL)
      || null;
    const dailyCompliancePct = ((24 - failHours) / 24) * 100;
    return {
      expectedRecordCount,
      receivedRecordCount,
      availabilityPct,
      passHours,
      failHours,
      kyHours,
      ddHours,
      dhHours: ddHours,
      yyHours,
      okHours: passHours,
      warnHours: 0,
      noDataHours: kyHours,
      offHours: ddHours,
      worstHour: problematic ? problematic.hour : null,
      dailyCompliancePct: roundMetric(dailyCompliancePct),
      dayResult: dailyCompliancePct >= RGDH_REACTIVE_SETTINGS.approvalThresholdPct ? RESULT_PASS : RESULT_FAIL
    };
  }

  function countStatuses(hours) {
    return (hours || []).reduce((acc, item) => {
      const status = normalizeReactiveResultCode(item?.hourResult || item?.status);
      if (status) acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  function buildHourlyMetrics(rowsForHour, rules = RGDH_HOURLY_RULES) {
    return buildPlatformHourStat(rowsForHour, rules);
  }

  function buildRawHourlyMetrics(rowsForHour, settings) {
    const rows = Array.isArray(rowsForHour) ? rowsForHour : [];
    const successMinuteCount = rows.filter(isSuccessfulMinute).length;
    return {
      expectedMinuteCount: settings.expectedMinuteCount,
      minuteCount: rows.length,
      successMinuteCount,
      setAvg: average(rows.map((row) => row.tpysVoltageSet)),
      voltageAvg: average(rows.map((row) => row.liveBusbarVoltage)),
      pgenAvg: average(rows.map((row) => row.pgenMw)),
      qgenAvg: average(rows.map((row) => row.qgenMvar)),
      pnomAvg: average(rows.map((row) => row.pnomMw)),
      pmkudAvg: average(rows.map((row) => row.pmkudMw)),
      minMkudAvg: average(rows.map((row) => row.minMkudMw)),
      auxiliaryMwAvg: average(rows.map((row) => row.auxiliaryMw)),
      auxiliaryMvarAvg: average(rows.map((row) => row.auxiliaryMvar))
    };
  }

  function participationClass(hour) {
    const result = normalizeReactiveResultCode(hour?.hourResult || hour?.status);
    if (!hour || !result) {
      return 'participation-empty';
    }
    if (result === RESULT_DD) return 'participation-dd';
    if (result === RESULT_YY) return 'participation-yy';
    if (result === RESULT_KY) return 'participation-ky';
    if (!Number.isFinite(Number(hour.passRatio ?? hour.participationPct))) return 'participation-empty';
    return result === RESULT_PASS ? 'participation-ok' : 'participation-fail';
  }

  function isSuccessfulMinute(row) {
    return normalizeReactiveResultCode(derivePlatformMinuteResult(row).result) === RESULT_PASS;
  }

  function derivePlatformMinuteResult(row) {
    if (!row) return { result: RESULT_KY, reason: 'missing_row' };

    const devreDurumu = firstDefined(row, ['devreDurumu', 'serviceStatus', 'inServiceStatus']);
    if (devreDurumu !== undefined && numericFlag(devreDurumu) !== 1) {
      return { result: RESULT_DD, reason: 'devreDurumu_not_active' };
    }

    if (row.serviceActive === false || numericFlag(row.offBoardStatus) === 1 || numericFlag(row.offBoard) === 1) {
      return { result: RESULT_DD, reason: 'off_board_status' };
    }

    const yukumlulukDurumu = firstDefined(row, ['yukumlulukDurumu', 'liabilityStatus', 'obligationStatus']);
    if (yukumlulukDurumu !== undefined && numericFlag(yukumlulukDurumu) !== 1) {
      return { result: RESULT_YY, reason: 'yukumlulukDurumu_no_obligation' };
    }

    if (numericFlag(row.noObligationStatus) === 1 || numericFlag(row.noObligation) === 1) {
      return { result: RESULT_YY, reason: 'no_obligation_status' };
    }

    const explicitResult = normalizeReactiveResultCode(row.minuteStat?.result || row.reactiveResult || row.platformResult);
    if (explicitResult && explicitResult !== 'OK' && explicitResult !== 'WARN' && explicitResult !== 'FAIL') {
      return { result: explicitResult, reason: 'explicit_minute_result' };
    }

    const mainApproved = firstDefined(row, ['mainApproved', 'approvalStatus', 'mainApprovalStatus', 'rgdhApprovalStatus']);
    const auxApproved = firstDefined(row, ['auxApproved', 'auxiliaryApprovalStatus', 'auxApprovalStatus']);
    const hasApprovalValue = mainApproved !== undefined || auxApproved !== undefined;
    if (numericFlag(mainApproved) === 1 || numericFlag(auxApproved) === 1) {
      return { result: RESULT_PASS, reason: 'approval_or_aux_approval' };
    }
    if (hasApprovalValue) {
      return { result: RESULT_FAIL, reason: 'approval_missing' };
    }

    if (row.flags?.missingCriticalValue) return { result: RESULT_KY, reason: 'missing_critical_value' };

    const assessed = assessRowStatus(row);
    if (assessed === 'OK') return { result: RESULT_PASS, reason: 'quality_ok' };
    if (assessed === 'OFF') return { result: RESULT_DD, reason: 'legacy_off' };
    if (assessed === 'NO_DATA') return { result: RESULT_KY, reason: 'legacy_no_data' };
    return { result: RESULT_FAIL, reason: assessed === 'WARN' ? 'quality_warning' : 'quality_fail' };
  }

  function buildPlatformHourStat(rowsForHour, settingsInput = RGDH_REACTIVE_SETTINGS) {
    const settings = mergeReactiveSettings(settingsInput);
    const rows = uniqueRowsForHour(Array.isArray(rowsForHour) ? rowsForHour.filter(Boolean) : [], settings.expectedMinuteCount);
    if (!rows.length) {
      const counts = {
        passCount: 0,
        failCount: 0,
        kyCount: settings.expectedMinuteCount,
        ddCount: 0,
        yyCount: 0,
        missingCount: settings.expectedMinuteCount,
        usableCount: 0,
        activeLiabilityMinutes: 0
      };
      const hourSummary = reactiveHourSummary(counts, settings);
      const metrics = buildRawHourlyMetrics(rows, settings);
      return {
        ...metrics,
        ...hourSummary,
        minuteResults: [],
        measuredFailCount: 0,
        status: hourSummary.hourResult,
        participationPct: hourSummary.passRatio,
        successMinuteCount: hourSummary.passCount
      };
    }
    const counts = {
      passCount: 0,
      failCount: 0,
      kyCount: 0,
      ddCount: 0,
      yyCount: 0
    };
    const minuteResults = rows.map((row) => {
      const verdict = derivePlatformMinuteResult(row);
      const result = normalizeReactiveResultCode(verdict.result);
      if (result === RESULT_PASS) counts.passCount += 1;
      else if (result === RESULT_FAIL) counts.failCount += 1;
      else if (result === RESULT_KY) counts.kyCount += 1;
      else if (result === RESULT_DD) counts.ddCount += 1;
      else if (result === RESULT_YY) counts.yyCount += 1;
      else counts.failCount += 1;
      return { row, ...verdict, result };
    });
    const measuredFailCount = counts.failCount;
    const missingCount = Math.max(0, settings.expectedMinuteCount - rows.length);
    counts.kyCount += missingCount;

    const hourSummary = reactiveHourSummary({
      ...counts,
      missingCount,
      usableCount: counts.passCount + measuredFailCount,
      activeLiabilityMinutes: counts.passCount + measuredFailCount
    }, settings);
    const metrics = buildRawHourlyMetrics(rows, settings);
    return {
      ...metrics,
      ...hourSummary,
      minuteResults,
      measuredFailCount,
      status: hourSummary.hourResult,
      participationPct: hourSummary.passRatio,
      successMinuteCount: hourSummary.passCount
    };
  }

  function reactiveHourSummary(rawCounts, cfg) {
    const settings = mergeReactiveSettings(cfg);
    const counts = rawCounts || {};
    const passCount = finiteOrZero(counts.passCount);
    const failCount = finiteOrZero(counts.failCount);
    const kyCount = finiteOrZero(counts.kyCount);
    const ddCount = Number.isFinite(Number(counts.ddCount))
      ? Number(counts.ddCount)
      : finiteOrZero(counts.dhCount);
    const yyCount = finiteOrZero(counts.yyCount);
    const missingCount = finiteOrZero(counts.missingCount);
    const usableCount = Number.isFinite(Number(counts.usableCount))
      ? Number(counts.usableCount)
      : passCount + failCount;
    const activeLiabilityMinutes = Number.isFinite(Number(counts.activeLiabilityMinutes))
      ? Number(counts.activeLiabilityMinutes)
      : passCount + failCount;
    const dominantOfflineCount = yyCount + ddCount;
    let hourResult = RESULT_KY;
    let pctSuppressed = true;
    if (kyCount >= settings.kyMinuteThreshold) hourResult = RESULT_KY;
    else if (ddCount === settings.expectedMinuteCount) hourResult = RESULT_DD;
    else if (yyCount === settings.expectedMinuteCount) hourResult = RESULT_YY;
    else if (dominantOfflineCount > settings.dominantOfflineThreshold) hourResult = yyCount >= ddCount ? RESULT_YY : RESULT_DD;
    else if (activeLiabilityMinutes < settings.minActiveLiabilityMinutes) hourResult = RESULT_YY;
    else {
      hourResult = failCount <= settings.failMinuteThreshold ? RESULT_PASS : RESULT_FAIL;
      pctSuppressed = false;
    }
    return {
      passCount,
      failCount,
      kyCount,
      ddCount,
      dhCount: ddCount,
      yyCount,
      missingCount,
      usableCount,
      activeLiabilityMinutes,
      dominantOfflineCount,
      pctSuppressed,
      hourResult,
      passRatio: pctSuppressed ? null : reactiveHourPct(passCount, ddCount, yyCount, hourResult, settings.expectedMinuteCount)
    };
  }

  function reactiveHourPct(passCount, ddCount, yyCount, result, expectedMinuteCount = RGDH_REACTIVE_SETTINGS.expectedMinuteCount) {
    const pass = Number.isFinite(Number(passCount)) ? Number(passCount) : null;
    const dd = Number.isFinite(Number(ddCount)) ? Number(ddCount) : 0;
    const yy = Number.isFinite(Number(yyCount)) ? Number(yyCount) : 0;
    const expected = positiveNumber(expectedMinuteCount, RGDH_REACTIVE_SETTINGS.expectedMinuteCount);
    if (isReactiveNeutralResult(result)) return null;
    return pass !== null ? roundMetric(((pass + dd + yy) / expected) * 100) : null;
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

  function reactiveDisplayLabel(result) {
    const code = normalizeReactiveResultCode(result);
    if (code === RESULT_PASS) return 'SAĞLADI';
    if (code === RESULT_FAIL) return 'SAĞLAMADI';
    if (code === RESULT_DD) return RESULT_DD;
    if (code === RESULT_YY) return RESULT_YY;
    if (code === RESULT_KY) return RESULT_KY;
    return code || '-';
  }

  function isReactiveNeutralResult(result) {
    const code = normalizeReactiveResultCode(result);
    return code === RESULT_DD || code === RESULT_YY || code === RESULT_KY;
  }

  function mergeReactiveSettings(settingsInput) {
    const settings = {
      ...RGDH_REACTIVE_SETTINGS,
      ...(settingsInput || {})
    };
    settings.expectedMinuteCount = positiveNumber(settings.expectedMinuteCount, RGDH_REACTIVE_SETTINGS.expectedMinuteCount);
    settings.kyMinuteThreshold = positiveNumber(settings.kyMinuteThreshold, RGDH_REACTIVE_SETTINGS.kyMinuteThreshold);
    settings.minActiveLiabilityMinutes = positiveNumber(settings.minActiveLiabilityMinutes, RGDH_REACTIVE_SETTINGS.minActiveLiabilityMinutes);
    settings.dominantOfflineThreshold = positiveNumber(settings.dominantOfflineThreshold, RGDH_REACTIVE_SETTINGS.dominantOfflineThreshold);
    settings.failMinuteThreshold = positiveNumber(settings.failMinuteThreshold, RGDH_REACTIVE_SETTINGS.failMinuteThreshold);
    return settings;
  }

  function firstDefined(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return undefined;
  }

  function numericFlag(value) {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true) return 1;
    if (value === false) return 0;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const text = String(value).trim().toLowerCase();
    if (['true', 'evet', 'yes', 'on', 'aktif', 'devrede'].includes(text)) return 1;
    if (['false', 'hayir', 'hayır', 'no', 'off', 'pasif', 'devre disi', 'devre dışı'].includes(text)) return 0;
    return undefined;
  }

  function uniqueRowsForHour(rows, expectedMinuteCount) {
    const byMinute = new Map();
    const unkeyed = [];
    rows.forEach((row) => {
      const minute = minuteIndexOf(row);
      if (Number.isInteger(minute) && minute >= 0 && minute < expectedMinuteCount) {
        byMinute.set(minute, row);
      } else {
        unkeyed.push(row);
      }
    });
    const values = byMinute.size ? [...byMinute.values(), ...unkeyed] : [...rows];
    return values.slice(0, expectedMinuteCount);
  }

  function minuteIndexOf(row) {
    const value = firstDefined(row || {}, ['minuteIndex', 'localMinute', 'minute', 'dakikaIndex']);
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
  }

  function finiteOrZero(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function positiveNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
  }

  function average(values) {
    const clean = (values || []).map(Number).filter(Number.isFinite);
    if (!clean.length) return null;
    return roundMetric(clean.reduce((sum, value) => sum + value, 0) / clean.length);
  }

  function roundMetric(value) {
    return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
  }

  return {
    RGDH_HOURLY_RULES,
    RGDH_REACTIVE_SETTINGS,
    buildHourlyStatus,
    assessRowStatus,
    allOff,
    buildDailyPivot,
    buildDailySummary,
    buildHourlyMetrics,
    buildPlatformHourStat,
    derivePlatformMinuteResult,
    reactiveHourSummary,
    reactiveHourPct,
    normalizeReactiveResultCode,
    reactiveDisplayLabel,
    isReactiveNeutralResult,
    participationClass
  };
});
