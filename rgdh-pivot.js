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

  function buildHourlyStatus(rowsForHour, rules = RGDH_HOURLY_RULES) {
    const rows = Array.isArray(rowsForHour) ? rowsForHour : [];
    const valid = rows.length;
    if (valid === 0) return 'NO_DATA';
    if (allOff(rows)) return 'OFF';

    const fail = rows.filter((row) => assessRowStatus(row) === 'FAIL').length;
    const warn = rows.filter((row) => assessRowStatus(row) === 'WARN').length;
    if (fail / valid > rules.failRatioForFail) return 'FAIL';
    if (fail > 0 || warn > 0) return 'WARN';
    if (valid / rules.expectedMinuteCount < rules.minAvailabilityForOk) return 'WARN';
    return 'OK';
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
          status: buildHourlyStatus(hourRows, rules),
          ...buildHourlyMetrics(hourRows, rules)
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
    const expectedRecordCount = 24 * RGDH_HOURLY_RULES.expectedMinuteCount;
    const receivedRecordCount = rows.length;
    const availabilityPct = expectedRecordCount ? (receivedRecordCount / expectedRecordCount) * 100 : 0;
    const okHours = byStatus.OK || 0;
    const warnHours = byStatus.WARN || 0;
    const failHours = byStatus.FAIL || 0;
    const noDataHours = byStatus.NO_DATA || 0;
    const offHours = byStatus.OFF || 0;
    const problematic = hours.find((item) => item.status === 'FAIL')
      || hours.find((item) => item.status === 'WARN')
      || hours.find((item) => item.status === 'NO_DATA')
      || null;
    return {
      expectedRecordCount,
      receivedRecordCount,
      availabilityPct,
      okHours,
      warnHours,
      failHours,
      noDataHours,
      offHours,
      worstHour: problematic ? problematic.hour : null,
      dailyCompliancePct: (okHours / 24) * 100
    };
  }

  function countStatuses(hours) {
    return (hours || []).reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }

  function buildHourlyMetrics(rowsForHour, rules = RGDH_HOURLY_RULES) {
    const rows = Array.isArray(rowsForHour) ? rowsForHour : [];
    const successMinuteCount = rows.filter(isSuccessfulMinute).length;
    return {
      expectedMinuteCount: rules.expectedMinuteCount,
      minuteCount: rows.length,
      successMinuteCount,
      participationPct: roundMetric((successMinuteCount / rules.expectedMinuteCount) * 100),
      setAvg: average(rows.map((row) => row.tpysVoltageSet)),
      voltageAvg: average(rows.map((row) => row.liveBusbarVoltage)),
      pgenAvg: average(rows.map((row) => row.pgenMw)),
      qgenAvg: average(rows.map((row) => row.qgenMvar)),
      auxiliaryMwAvg: average(rows.map((row) => row.auxiliaryMw)),
      auxiliaryMvarAvg: average(rows.map((row) => row.auxiliaryMvar))
    };
  }

  function participationClass(hour) {
    if (!hour || !Number(hour.minuteCount) || !Number.isFinite(Number(hour.participationPct))) {
      return 'participation-empty';
    }
    return Number(hour.participationPct) >= 80 ? 'participation-ok' : 'participation-fail';
  }

  function isSuccessfulMinute(row) {
    if (row?.approvalStatus !== null && row?.approvalStatus !== undefined) {
      return Number(row.approvalStatus) === 1;
    }
    return assessRowStatus(row) === 'OK';
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
    buildHourlyStatus,
    assessRowStatus,
    allOff,
    buildDailyPivot,
    buildDailySummary,
    buildHourlyMetrics,
    participationClass
  };
});
