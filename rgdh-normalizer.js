(function (root, factory) {
  const csv = typeof require === 'function' ? require('./rgdh-csv.js') : root.RGDH_CSV;
  const api = factory(csv);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_NORMALIZER = api;
})(typeof self !== 'undefined' ? self : globalThis, function (csv) {
  const RGDH_COMPARE_TOLERANCE = {
    voltageKv: 0.01,
    mw: 0.01,
    mvar: 0.01,
    ratio: 0.0001
  };

  const COMPARE_FIELDS = [
    ['liveBusbarVoltage', 'voltageKv'],
    ['tpysVoltageSet', 'voltageKv'],
    ['pgenMw', 'mw'],
    ['qgenMvar', 'mvar'],
    ['diMvarLimit', 'mvar'],
    ['aiMvarLimit', 'mvar'],
    ['voltageApprove', 'exact'],
    ['diMvarApprove', 'exact'],
    ['aiMvarApprove', 'exact'],
    ['approvalStatus', 'exact']
  ];

  function normalizeConventionalApiRow(raw) {
    const busbar = raw?.busbar || {};
    return finalizeRow({
      sourceOrigin: 'API',
      sourceType: normalizeSourceType(busbar.busbarType || 'CONVENTIONAL'),
      ...parseDate(raw?.measurementDate),
      ytm: stringValue(busbar.distributionCenter),
      city: stringValue(busbar.city),
      busbarInternalId: toNumber(busbar.id),
      busbarId: toNumber(busbar.busbarId),
      busbarName: stringValue(busbar.busbarName),
      plantName: stringValue(busbar.plantName),
      voltageLevel: toNumber(busbar.voltageLevel),
      tpysVoltageSet: toNumber(raw?.tpysNomBusVolt),
      tpysVoltageDrop: toNumber(raw?.tpysBusVoltDrop),
      liveBusbarVoltage: toNumber(raw?.mainBusbarVoltage),
      busbar1Voltage: toNumber(firstDefined(raw?.busTa1Volt, raw?.busbar1Voltage, raw?.mainBusbarVoltage)),
      busbar1Quality: stringValue(firstDefined(raw?.busTa1VoltQ0Txt, raw?.busbar1Quality)),
      busbar2Voltage: toNumber(firstDefined(raw?.busTa2Volt, raw?.busbar2Voltage)),
      busbar2Quality: stringValue(firstDefined(raw?.busTa2VoltQ0Txt, raw?.busbar2Quality)),
      busbar3Voltage: toNumber(firstDefined(raw?.busTa3Volt, raw?.busbar3Voltage)),
      busbar3Quality: stringValue(firstDefined(raw?.busTa3VoltQ0Txt, raw?.busbar3Quality)),
      busbarUpperLimit: toNumber(firstDefined(raw?.busbarUpperLimit, raw?.busbarSetUpperLimit, raw?.upperLimit)),
      busbarLowerLimit: toNumber(firstDefined(raw?.busbarLowerLimit, raw?.busbarSetLowerLimit, raw?.lowerLimit)),
      pnomMw: toNumber(raw?.pnom),
      pmkudMw: toNumber(raw?.sumPmukd),
      minMkudMw: toNumber(raw?.minMkud),
      pgenMw: metricNumberFromAliases(raw, ['sumPgenActive', 'pgenMw', 'pgenActive', 'totalPgenActive']),
      qgenMvar: metricNumberFromAliases(raw, ['sumPgenReactive', 'qgenMvar', 'pgenReactive', 'totalPgenReactive']),
      auxiliaryMw: numberFromAliases(raw, ['auxiliarySource', 'auxiliaryMw']),
      auxiliaryMvar: numberFromAliases(raw, ['auxiliarySourceReactive', 'auxiliaryMvar']),
      auxiliaryDiMvarLimit: numberFromAliases(raw, ['sumAuxiliaryDIMvarLimit', 'auxiliaryDiMvarLimit']),
      auxiliaryAiMvarLimit: numberFromAliases(raw, ['sumAuxiliaryAIMvarLimit', 'auxiliaryAiMvarLimit']),
      diMvarLimit: metricNumberFromAliases(raw, ['sumDIMvarLimit', 'diMvarLimit']),
      aiMvarLimit: metricNumberFromAliases(raw, ['sumAIMvarLimit', 'aiMvarLimit']),
      serviceActive: toBooleanOrNull(raw?.typsService),
      offBoardStatus: toNumber(raw?.rgdhOffBoardStatus),
      noObligationStatus: toNumber(raw?.noObligationStatus),
      voltageApprove: normalizeApproval(raw?.busbarSetToleranceApprove),
      diMvarApprove: normalizeApproval(raw?.diMvarApprove),
      aiMvarApprove: normalizeApproval(raw?.aiMvarApprove),
      approvalStatus: metricApprovalFromAliases(raw, ['approvalStatus']),
      auxiliaryApprovalStatus: normalizeApproval(firstAlias(raw, ['approvalStatusAuxiliary', 'auxiliarySourceApprovalStatus'])),
      auxiliaryUnits: normalizeAuxiliaryUnits(raw, busbar),
      raw
    });
  }

  function normalizeWindApiRow(raw) {
    const busbar = raw?.busbar || {};
    const sourceType = normalizeWindMainSourceType(busbar.busbarType || 'WIND');
    return finalizeRow({
      sourceOrigin: 'API',
      sourceType,
      ...parseDate(raw?.measurementDate),
      ytm: stringValue(busbar.distributionCenter),
      city: stringValue(busbar.city),
      busbarInternalId: toNumber(busbar.id),
      busbarId: toNumber(busbar.busbarId),
      busbarName: stringValue(busbar.busbarName),
      plantName: stringValue(busbar.plantName),
      voltageLevel: toNumber(busbar.voltageLevel),
      tpysVoltageSet: toNumber(raw?.tpysBusVoltSet),
      tpysVoltageDrop: toNumber(raw?.tpysBusVoltDrop),
      liveBusbarVoltage: toNumber(raw?.mainBusbarVoltage),
      busbar1Voltage: toNumber(firstDefined(raw?.busTa1Volt, raw?.busbar1Voltage, raw?.mainBusbarVoltage)),
      busbar1Quality: stringValue(firstDefined(raw?.busTa1VoltQ0Txt, raw?.busbar1Quality)),
      busbar2Voltage: toNumber(firstDefined(raw?.busTa2Volt, raw?.busbar2Voltage)),
      busbar2Quality: stringValue(firstDefined(raw?.busTa2VoltQ0Txt, raw?.busbar2Quality)),
      busbar3Voltage: toNumber(firstDefined(raw?.busTa3Volt, raw?.busbar3Voltage)),
      busbar3Quality: stringValue(firstDefined(raw?.busTa3VoltQ0Txt, raw?.busbar3Quality)),
      pnomMw: toNumber(raw?.pnom),
      pmkudMw: toNumber(raw?.sumPmukd),
      minMkudMw: toNumber(raw?.minMkud),
      pgenMw: metricNumberFromAliases(raw, ['sumPgenActive', 'pgenMw', 'pgenActive', 'totalPgenActive']),
      qgenMvar: metricNumberFromAliases(raw, ['sumPgenReactive', 'qgenMvar', 'pgenReactive', 'totalPgenReactive']),
      auxiliaryMw: numberFromAliases(raw, ['auxiliarySource', 'auxiliaryMw']),
      auxiliaryMvar: numberFromAliases(raw, ['auxiliarySourceReactive', 'auxiliaryMvar']),
      auxiliaryDiMvarLimit: numberFromAliases(raw, ['sumAuxiliaryDIMvarLimit', 'auxiliaryDiMvarLimit']),
      auxiliaryAiMvarLimit: numberFromAliases(raw, ['sumAuxiliaryAIMvarLimit', 'auxiliaryAiMvarLimit']),
      diMvarLimit: metricNumberFromAliases(raw, ['sumDIMvarLimit', 'diMvarLimit']),
      aiMvarLimit: metricNumberFromAliases(raw, ['sumAIMvarLimit', 'aiMvarLimit']),
      serviceActive: toBooleanOrNull(raw?.typsService),
      offBoardStatus: toNumber(raw?.rgdhOffBoardStatus),
      noObligationStatus: toNumber(raw?.noObligationStatus),
      voltageApprove: normalizeApproval(raw?.busbarSetToleranceApprove),
      diMvarApprove: normalizeApproval(raw?.diMvarApprove),
      aiMvarApprove: normalizeApproval(raw?.aiMvarApprove),
      approvalStatus: metricApprovalFromAliases(raw, ['approvalStatus']),
      auxiliaryApprovalStatus: normalizeApproval(firstAlias(raw, ['approvalStatusAuxiliary', 'auxiliarySourceApprovalStatus'])),
      auxiliaryUnits: normalizeAuxiliaryUnits(raw, busbar),
      raw
    });
  }

  function normalizeCsvRow(row, explicitType) {
    const canonical = row?.measurementDateLocal
      ? row
      : (explicitType === 'WIND' ? csv.normalizeWindCsvRow(row) : csv.normalizeConventionalCsvRow(row));
    return finalizeRow({ ...canonical, sourceOrigin: canonical.sourceOrigin || 'CSV' });
  }

  function normalizeCsvParseResult(parseResult) {
    const type = parseResult?.type || csv.detectRgdhCsvType(parseResult?.headers || [], parseResult?.rows || []);
    if (type === 'BUSBAR_UNIT_CATALOG') return [];
    return (parseResult?.rows || []).map((row) => normalizeCsvRow(row, type));
  }

  function finalizeRow(input) {
    const row = {
      id: '',
      sourceOrigin: input.sourceOrigin || 'API',
      sourceType: normalizeSourceType(input.sourceType || 'CONVENTIONAL'),
      measurementDateUtc: stringValue(input.measurementDateUtc),
      measurementDateLocal: stringValue(input.measurementDateLocal),
      localDate: stringValue(input.localDate),
      localHour: input.localHour ?? null,
      localMinute: input.localMinute ?? null,
      ytm: stringValue(input.ytm),
      city: stringValue(input.city),
      busbarInternalId: nullableNumber(input.busbarInternalId),
      busbarId: nullableNumber(input.busbarId),
      busbarName: stringValue(input.busbarName),
      plantId: nullableNumber(input.plantId),
      plantName: stringValue(input.plantName),
      voltageLevel: nullableNumber(input.voltageLevel),
      unitName: stringValue(input.unitName),
      sourceKind: stringValue(input.sourceKind),
      tpysVoltageSet: nullableNumber(input.tpysVoltageSet),
      tpysVoltageDrop: nullableNumber(input.tpysVoltageDrop),
      liveBusbarVoltage: nullableNumber(input.liveBusbarVoltage),
      busbar1Voltage: nullableNumber(input.busbar1Voltage),
      busbar1Quality: stringValue(input.busbar1Quality),
      busbar2Voltage: nullableNumber(input.busbar2Voltage),
      busbar2Quality: stringValue(input.busbar2Quality),
      busbar3Voltage: nullableNumber(input.busbar3Voltage),
      busbar3Quality: stringValue(input.busbar3Quality),
      busbarUpperLimit: nullableNumber(input.busbarUpperLimit),
      busbarLowerLimit: nullableNumber(input.busbarLowerLimit),
      pnomMw: nullableNumber(input.pnomMw),
      pmkudMw: nullableNumber(input.pmkudMw),
      minMkudMw: nullableNumber(input.minMkudMw),
      pgenMw: nullableNumber(input.pgenMw),
      qgenMvar: nullableNumber(input.qgenMvar),
      auxiliaryMw: nullableNumber(input.auxiliaryMw),
      auxiliaryMvar: nullableNumber(input.auxiliaryMvar),
      auxiliaryDiMvarLimit: nullableNumber(input.auxiliaryDiMvarLimit),
      auxiliaryAiMvarLimit: nullableNumber(input.auxiliaryAiMvarLimit),
      auxiliaryApprovalStatus: normalizeApproval(input.auxiliaryApprovalStatus),
      hasAuxiliarySource: Boolean(
        input.hasAuxiliarySource
        || input.auxiliaryMw !== null && input.auxiliaryMw !== undefined
        || input.auxiliaryMvar !== null && input.auxiliaryMvar !== undefined
        || input.auxiliaryDiMvarLimit !== null && input.auxiliaryDiMvarLimit !== undefined
        || input.auxiliaryAiMvarLimit !== null && input.auxiliaryAiMvarLimit !== undefined
        || (Array.isArray(input.auxiliaryUnits) && input.auxiliaryUnits.length)
      ),
      auxiliaryUnits: Array.isArray(input.auxiliaryUnits) ? input.auxiliaryUnits : [],
      diMvarLimit: nullableNumber(input.diMvarLimit),
      aiMvarLimit: nullableNumber(input.aiMvarLimit),
      serviceActive: input.serviceActive === null || input.serviceActive === undefined ? true : Boolean(input.serviceActive),
      offBoardStatus: nullableNumber(input.offBoardStatus),
      noObligationStatus: nullableNumber(input.noObligationStatus),
      voltageApprove: normalizeApproval(input.voltageApprove),
      diMvarApprove: normalizeApproval(input.diMvarApprove),
      aiMvarApprove: normalizeApproval(input.aiMvarApprove),
      approvalStatus: normalizeApproval(input.approvalStatus),
      catalog: input.catalog || null,
      flags: {
        voltageOutOfBand: false,
        qOutOfLimit: false,
        missingCriticalValue: false,
        platformMismatch: false,
        partialSource: input.sourceOrigin === 'DOM',
        ...(input.flags || {})
      },
      raw: input.raw || {}
    };
    row.flags.voltageOutOfBand = row.flags.voltageOutOfBand || computeVoltageOutOfBand(row);
    row.flags.qOutOfLimit = row.flags.qOutOfLimit || computeQOutOfLimit(row);
    row.flags.missingCriticalValue = row.flags.missingCriticalValue || !row.measurementDateLocal || row.busbarId === null;
    row.flags.metricFieldsEmptySource = row.flags.metricFieldsEmptySource || computeMetricFieldsEmptySource(row);
    row.flags.metricDiagnosticCode = row.flags.metricDiagnosticCode || (row.flags.metricFieldsEmptySource ? 'METRIC_FIELDS_EMPTY_SOURCE' : '');
    row.flags.platformMismatch = row.flags.platformMismatch || computePlatformMismatch(row);
    row.id = `${row.sourceType}:${row.busbarId ?? 'UNKNOWN'}:${row.measurementDateLocal || row.measurementDateUtc || 'NO_DATE'}`;
    return row;
  }

  function parseDate(value) {
    return csv.parseTurkishDateTime(value);
  }

  function normalizeSourceType(value) {
    const text = String(value || '').toUpperCase();
    if (text.includes('HYBRID') || text.includes('HIBRIT')) return 'HYBRID';
    if (text.includes('SOLAR') || text.includes('GES')) return 'SOLAR';
    if (text.includes('WIND') || text.includes('RES') || text.includes('RUZGAR') || text.includes('RÜZGAR')) return 'WIND';
    return 'CONVENTIONAL';
  }

  function normalizeWindMainSourceType(value) {
    const normalized = normalizeSourceType(value || 'WIND');
    return normalized === 'HYBRID' ? 'WIND' : normalized;
  }

  function normalizeAuxiliaryUnits(raw, busbar) {
    const candidates = [
      raw?.teiasAuxiliaryRgdhConvUnitData,
      busbar?.teiasAuxiliaryRgdhConvUnitData,
      ...(Array.isArray(raw?.auxiliaryWindUnitList) ? raw.auxiliaryWindUnitList : []),
      ...(Array.isArray(raw?.auxiliaryConventionalUnitList) ? raw.auxiliaryConventionalUnitList : []),
      ...(Array.isArray(busbar?.auxiliaryWindUnitList) ? busbar.auxiliaryWindUnitList : []),
      ...(Array.isArray(busbar?.auxiliaryConventionalUnitList) ? busbar.auxiliaryConventionalUnitList : [])
    ].flat().filter(Boolean);
    return candidates.map((unit) => ({
      unitName: stringValue(firstDefined(unit.name, unit.unitName)),
      uevcbName: stringValue(unit.uevcbName),
      unitId: nullableNumber(firstDefined(unit.uevcbId, unit.unitId, unit.id)),
      sourceKind: stringValue(firstDefined(unit.resourceType, unit.sourceKind)),
      activePowerTa: stringValue(unit.taMw),
      activePowerSetnum: stringValue(unit.setNumMw),
      reactivePowerTa: stringValue(unit.taMvar),
      reactivePowerSetnum: stringValue(unit.setNumMvar),
      unitPnomMw: nullableNumber(firstDefined(unit.pnomUnit, unit.unitPnomMw, unit.pnomMw)),
      unitPmkudMw: nullableNumber(firstDefined(unit.pmkudUnit, unit.unitPmkudMw, unit.pmkudMw)),
      lowExcitationTest: nullableNumber(firstDefined(unit.underExcite, unit.lowExcitationTest)),
      highExcitationTest: nullableNumber(firstDefined(unit.overExcite, unit.highExcitationTest)),
      lowExcitationTest2: nullableNumber(unit.underExcite2),
      highExcitationTest2: nullableNumber(unit.overExcite2),
      nominalLowExcitation: nullableNumber(firstDefined(unit.underExcite2, unit.nominalLowExcitation)),
      nominalHighExcitation: nullableNumber(firstDefined(unit.overExcite2, unit.nominalHighExcitation)),
      speedDrop: nullableNumber(unit.speedDrop),
      powerFactor: nullableNumber(unit.powerFactor),
      terminalVoltage: nullableNumber(unit.terminalVoltage),
      unitActive: toBooleanOrNull(firstDefined(unit.unitActive, unit.isUnitActive)),
      raw: unit
    }));
  }

  function computeVoltageOutOfBand(row) {
    if (row.liveBusbarVoltage === null) return false;
    if (row.busbarUpperLimit !== null && row.liveBusbarVoltage > row.busbarUpperLimit) return true;
    if (row.busbarLowerLimit !== null && row.liveBusbarVoltage < row.busbarLowerLimit) return true;
    return false;
  }

  function computeQOutOfLimit(row) {
    if (row.qgenMvar === null) return false;
    if (row.diMvarLimit !== null && row.qgenMvar < row.diMvarLimit) return true;
    if (row.aiMvarLimit !== null && row.qgenMvar > row.aiMvarLimit) return true;
    return false;
  }

  function computeRgdhStatus(row) {
    if (!row || row.flags?.missingCriticalValue) return null;
    if (row.flags?.voltageOutOfBand || row.flags?.qOutOfLimit) return 0;
    return 1;
  }

  function computePlatformMismatch(row) {
    const computed = computeRgdhStatus({ ...row, flags: { ...row.flags, platformMismatch: false } });
    if (computed === null || row.approvalStatus === null) return false;
    return Number(computed) !== Number(row.approvalStatus);
  }

  function createCompareKey(row) {
    return [
      row?.sourceType || '',
      row?.busbarId ?? '',
      String(row?.measurementDateLocal || '').slice(0, 16)
    ].join(':');
  }

  function compareNormalizedRows(apiRows, csvRows) {
    const apiMap = new Map((apiRows || []).map((row) => [createCompareKey(row), row]));
    const csvMap = new Map((csvRows || []).map((row) => [createCompareKey(row), row]));
    const matches = [];
    const onlyApi = [];
    const onlyCsv = [];

    apiMap.forEach((apiRow, key) => {
      const csvRow = csvMap.get(key);
      if (!csvRow) {
        onlyApi.push(apiRow);
        return;
      }
      const fieldDiffs = diffFields(apiRow, csvRow);
      matches.push({ key, apiRow, csvRow, fieldDiffs });
    });
    csvMap.forEach((csvRow, key) => {
      if (!apiMap.has(key)) onlyCsv.push(csvRow);
    });

    return { matches, onlyApi, onlyCsv };
  }

  function buildCatalogIndex(catalogRows) {
    const rows = (catalogRows || []).filter((row) => row && row.busbarId !== null && row.busbarId !== undefined);
    const byBusbarId = new Map();
    const byBusbarName = new Map();
    const byPlantId = new Map();
    const byPlantName = new Map();

    rows.forEach((row) => {
      addToMap(byBusbarId, String(row.busbarId), row);
      addToMap(byBusbarName, normalizeText(row.busbarName), row);
      if (row.plantId !== null && row.plantId !== undefined) addToMap(byPlantId, String(row.plantId), row);
      addToMap(byPlantName, normalizeText(row.plantName), row);
    });

    return { rows, byBusbarId, byBusbarName, byPlantId, byPlantName };
  }

  function enrichRowsWithCatalog(rows, catalogRows) {
    const index = buildCatalogIndex(catalogRows);
    return (rows || []).map((row) => enrichRowWithCatalog(row, index));
  }

  function enrichRowWithCatalog(row, indexOrRows) {
    const index = indexOrRows?.byBusbarId ? indexOrRows : buildCatalogIndex(indexOrRows);
    const matches = findCatalogMatches(row, index);
    if (!matches.length) return row;
    const first = matches[0];
    const units = matches.map((item) => ({
      unitName: item.unitName || '',
      uevcbName: item.uevcbName || '',
      unitId: item.unitId ?? null,
      sourceKind: item.sourceKind || '',
      unitPnomMw: item.unitPnomMw ?? null,
      unitPmkudMw: item.unitPmkudMw ?? null,
      lowExcitationTest: item.lowExcitationTest ?? null,
      highExcitationTest: item.highExcitationTest ?? null,
      lowExcitationTest2: item.lowExcitationTest2 ?? null,
      highExcitationTest2: item.highExcitationTest2 ?? null,
      nominalLowExcitation: item.nominalLowExcitation ?? null,
      nominalHighExcitation: item.nominalHighExcitation ?? null,
      speedDrop: item.speedDrop ?? null,
      powerFactor: item.powerFactor ?? null,
      terminalVoltage: item.terminalVoltage ?? null,
      unitActive: item.unitActive ?? null
    }));

    return finalizeRow({
      ...row,
      ytm: row.ytm || first.ytm,
      plantId: row.plantId ?? first.plantId,
      plantName: row.plantName || first.plantName,
      voltageLevel: row.voltageLevel ?? first.voltageLevel,
      unitName: row.unitName || first.unitName,
      sourceKind: row.sourceKind || first.sourceKind,
      pnomMw: row.pnomMw ?? sumNumeric(matches, 'unitPnomMw'),
      pmkudMw: row.pmkudMw ?? sumNumeric(matches, 'unitPmkudMw'),
      catalog: {
        busbarType: first.busbarType || '',
        rgkType: first.rgkType || '',
        ytm: first.ytm || '',
        plantId: first.plantId ?? null,
        plantName: first.plantName || '',
        unitName: first.unitName || '',
        sourceKind: first.sourceKind || '',
        units
      },
      raw: row.raw
    });
  }

  function findCatalogMatches(row, index) {
    const byId = row?.busbarId !== null && row?.busbarId !== undefined
      ? index.byBusbarId.get(String(row.busbarId))
      : null;
    if (byId?.length) return byId;
    const byName = index.byBusbarName.get(normalizeText(row?.busbarName));
    return byName || [];
  }

  function buildCatalogBusbarSummaries(catalogRows) {
    const groups = new Map();
    (catalogRows || []).forEach((row) => {
      if (!row || row.busbarId === null || row.busbarId === undefined) return;
      const key = String(row.busbarId);
      if (!groups.has(key)) {
        groups.set(key, {
          sourceOrigin: 'CATALOG',
          type: 'BUSBAR_UNIT_CATALOG_SUMMARY',
          busbarType: row.busbarType || '',
          busbarId: row.busbarId,
          busbarName: row.busbarName || '',
          rgkType: row.rgkType || '',
          voltageLevel: row.voltageLevel ?? null,
          ytm: row.ytm || '',
          plantId: row.plantId ?? null,
          plantName: row.plantName || '',
          busbar1Ta: row.busbar1Ta || '',
          busbar1Setnum: row.busbar1Setnum || '',
          busbar2Ta: row.busbar2Ta || '',
          busbar2Setnum: row.busbar2Setnum || '',
          busbar3Ta: row.busbar3Ta || '',
          busbar3Setnum: row.busbar3Setnum || '',
          units: []
        });
      }
      groups.get(key).units.push(buildCatalogUnit(row));
    });

    return [...groups.values()].map((summary) => ({
      ...summary,
      unitCount: summary.units.length,
      activeUnitCount: summary.units.filter((unit) => unit.unitActive === true).length,
      totalPnomMw: roundMetric(sumNumeric(summary.units, 'unitPnomMw')),
      totalPmkudMw: roundMetric(sumNumeric(summary.units, 'unitPmkudMw')),
      hasAuxiliarySource: summary.units.some(isAuxiliaryCatalogUnit)
    }));
  }

  function buildCatalogUnit(row) {
    return {
      unitName: row.unitName || '',
      uevcbName: row.uevcbName || '',
      unitId: row.unitId ?? null,
      sourceKind: row.sourceKind || '',
      activePowerTa: row.activePowerTa || '',
      activePowerSetnum: row.activePowerSetnum || '',
      reactivePowerTa: row.reactivePowerTa || '',
      reactivePowerSetnum: row.reactivePowerSetnum || '',
      unitPnomMw: row.unitPnomMw ?? null,
      unitPmkudMw: row.unitPmkudMw ?? null,
      lowExcitationTest: row.lowExcitationTest ?? null,
      highExcitationTest: row.highExcitationTest ?? null,
      lowExcitationTest2: row.lowExcitationTest2 ?? null,
      highExcitationTest2: row.highExcitationTest2 ?? null,
      nominalLowExcitation: row.nominalLowExcitation ?? null,
      nominalHighExcitation: row.nominalHighExcitation ?? null,
      speedDrop: row.speedDrop ?? null,
      powerFactor: row.powerFactor ?? null,
      terminalVoltage: row.terminalVoltage ?? null,
      unitActive: row.unitActive ?? null
    };
  }

  function isAuxiliaryCatalogUnit(unit) {
    const text = normalizeText([
      unit?.unitName,
      unit?.sourceKind,
      unit?.sourceOrigin,
      unit?.rgkType
    ].filter(Boolean).join(' '));
    return /yardimci|auxiliary/.test(text);
  }

  function isZeroDomMeasurementRow(row) {
    if (String(row?.sourceOrigin || '').toUpperCase() !== 'DOM') return false;
    if (row.measurementDateLocal || row.measurementDateUtc) return false;
    if ((row.busbarId !== null && row.busbarId !== undefined) || row.busbarName) {
      const fields = ['tpysVoltageSet', 'liveBusbarVoltage', 'pgenMw', 'qgenMvar', 'diMvarLimit', 'aiMvarLimit'];
      const hasAnyValue = fields.some((field) => {
        const value = row?.[field];
        return value !== null && value !== undefined && Number(value) !== 0;
      });
      if (hasAnyValue) return false;
    }
    const fields = ['tpysVoltageSet', 'liveBusbarVoltage', 'pgenMw', 'qgenMvar', 'diMvarLimit', 'aiMvarLimit'];
    return fields.every((field) => Number(row?.[field]) === 0);
  }

  function diffFields(left, right) {
    return COMPARE_FIELDS.flatMap(([field, toleranceKey]) => {
      const leftValue = left?.[field] ?? null;
      const rightValue = right?.[field] ?? null;
      if (leftValue === null && rightValue === null) return [];
      if (toleranceKey === 'exact') {
        return String(leftValue) === String(rightValue) ? [] : [{ field, api: leftValue, csv: rightValue }];
      }
      const tolerance = RGDH_COMPARE_TOLERANCE[toleranceKey] || 0;
      if (leftValue === null || rightValue === null) return [{ field, api: leftValue, csv: rightValue }];
      return Math.abs(Number(leftValue) - Number(rightValue)) <= tolerance
        ? []
        : [{ field, api: leftValue, csv: rightValue, delta: Number(leftValue) - Number(rightValue) }];
    });
  }

  function toNumber(value) {
    return csv.parseTurkishNumber(value);
  }

  function nullableNumber(value) {
    const numeric = toNumber(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function normalizeApproval(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    const numeric = toNumber(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
  }

  function toBooleanOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    const numeric = toNumber(value);
    if (Number.isFinite(numeric)) return numeric !== 0;
    if (/^(true|evet|yes|aktif)$/i.test(String(value))) return true;
    if (/^(false|hayir|hayır|no|pasif)$/i.test(String(value))) return false;
    return null;
  }

  function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
  }

  function firstAlias(object, keys) {
    for (const key of keys || []) {
      if (object && object[key] !== undefined && object[key] !== null && object[key] !== '') return object[key];
    }
    return null;
  }

  function numberFromAliases(object, keys) {
    return toNumber(firstAlias(object, keys));
  }

  function metricNumberFromAliases(raw, keys) {
    const direct = numberFromAliases(raw, keys);
    if (Number.isFinite(direct)) return direct;
    return numberFromNestedMetricRows(raw, keys);
  }

  function metricApprovalFromAliases(raw, keys) {
    const direct = normalizeApproval(firstAlias(raw, keys));
    if (direct !== null) return direct;
    const nested = firstAliasFromNestedMetricRows(raw, keys);
    return normalizeApproval(nested);
  }

  function numberFromNestedMetricRows(raw, keys) {
    const nested = firstAliasFromNestedMetricRows(raw, keys);
    const numeric = toNumber(nested);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function firstAliasFromNestedMetricRows(raw, keys) {
    const targetDate = stringValue(raw?.measurementDate);
    const rows = collectNestedMetricRows(raw);
    for (const row of rows) {
      if (targetDate && stringValue(row?.measurementDate) && stringValue(row.measurementDate) !== targetDate) continue;
      const value = firstAlias(row, keys);
      if (value !== null) return value;
    }
    return null;
  }

  function collectNestedMetricRows(raw) {
    const busbar = raw?.busbar || {};
    const units = [
      ...(Array.isArray(raw?.conventionalUnitList) ? raw.conventionalUnitList : []),
      ...(Array.isArray(raw?.windUnitList) ? raw.windUnitList : []),
      ...(Array.isArray(raw?.auxiliaryConventionalUnitList) ? raw.auxiliaryConventionalUnitList : []),
      ...(Array.isArray(raw?.auxiliaryWindUnitList) ? raw.auxiliaryWindUnitList : []),
      ...(Array.isArray(busbar?.conventionalUnitList) ? busbar.conventionalUnitList : []),
      ...(Array.isArray(busbar?.windUnitList) ? busbar.windUnitList : []),
      ...(Array.isArray(busbar?.auxiliaryConventionalUnitList) ? busbar.auxiliaryConventionalUnitList : []),
      ...(Array.isArray(busbar?.auxiliaryWindUnitList) ? busbar.auxiliaryWindUnitList : [])
    ];
    return units.flatMap((unit) => [
      ...(Array.isArray(unit?.rgdhConvUnitDataList) ? unit.rgdhConvUnitDataList : []),
      ...(Array.isArray(unit?.rgdhWindUnitDataList) ? unit.rgdhWindUnitDataList : [])
    ]).filter(Boolean);
  }

  function computeMetricFieldsEmptySource(row) {
    if (String(row?.sourceOrigin || '').toUpperCase() !== 'API') return false;
    if (!row.measurementDateLocal || row.busbarId === null) return false;
    const metricFields = [
      'pgenMw',
      'qgenMvar',
      'diMvarLimit',
      'aiMvarLimit',
      'approvalStatus',
      'auxiliaryMw',
      'auxiliaryMvar',
      'auxiliaryDiMvarLimit',
      'auxiliaryAiMvarLimit',
      'auxiliaryApprovalStatus'
    ];
    const hasMetric = metricFields.some((field) => row[field] !== null && row[field] !== undefined && row[field] !== '');
    if (hasMetric) return false;
    return row.liveBusbarVoltage !== null
      || row.tpysVoltageSet !== null
      || row.pnomMw !== null
      || row.pmkudMw !== null
      || Object.keys(row.raw || {}).length > 0;
  }

  function stringValue(value) {
    return String(value ?? '').trim();
  }

  function addToMap(map, key, row) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıI]/g, 'i')
      .replace(/İ/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function sumNumeric(rows, key) {
    const values = (rows || []).map((row) => Number(row?.[key])).filter(Number.isFinite);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0);
  }

  function roundMetric(value) {
    return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
  }

  return {
    RGDH_COMPARE_TOLERANCE,
    COMPARE_FIELDS,
    normalizeConventionalApiRow,
    normalizeWindApiRow,
    normalizeCsvRow,
    normalizeCsvParseResult,
    finalizeRow,
    normalizeSourceType,
    buildCatalogIndex,
    buildCatalogBusbarSummaries,
    enrichRowsWithCatalog,
    enrichRowWithCatalog,
    isZeroDomMeasurementRow,
    computeRgdhStatus,
    createCompareKey,
    compareNormalizedRows,
    diffFields
  };
});
