(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RGDH_REACTIVE_ENGINE = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const RESULT_PASS = 'SAGLADI';
  const RESULT_FAIL = 'SAGLAMADI';
  const RESULT_DD = 'DD';
  const RESULT_YY = 'YY';
  const RESULT_KY = 'KY';

  const DEFAULTS = {
    lowProductionPct: 0.01,
    noObligationPct: 0.10,
    highProductionPct: 0.50,
    directionalSupportPct: 0.90,
    zeroTargetBandMvar: 0.5,
    voltageBandPct: 0.015,
    mkudFactor: 1
  };

  function resolveRgkMode(row, catalogContext = {}, options = {}) {
    const explicit = normalizeMode(firstDefined(
      options.rgkMode,
      row?.rgkMode,
      row?.platformRgkType,
      row?.catalog?.platformRgkType,
      catalogContext?.platformRgkType,
      catalogContext?.rgkType
    ));
    if (explicit) return explicit;

    const template = normalizeToken(row?.templateFamily || '');
    const context = normalizeToken([
      row?.fileName,
      row?.plantName,
      row?.busbarName,
      catalogContext?.ytbsSourceType,
      catalogContext?.secondarySources
    ].filter(Boolean).join(' '));
    if (template.includes('RGDH_HIB_KONV')) return 'HIB_KONV_GB';
    if (template.includes('RGDH_HIB_RESGES')) return 'HIB_RESGES_GK';
    if (template.includes('RGDH_GES') || /\bGES\b|GUNES/.test(context)) return 'GES_GK_2020S';
    if (template.includes('RGDH_RES')) {
      if (isFiniteNumber(row?.pfSet)) return 'RES_GF_2008_2013';
      if (isFiniteNumber(row?.qSet) && Math.abs(Number(row.qSet)) <= 140) return 'RES_SRG_2008O';
      return 'RES_GK_2013S';
    }
    if (template.includes('RGDH_KONV')) return 'KON_GB_2003S';
    return '';
  }

  function evaluateEkcMinute(row, catalogContext = {}, options = {}) {
    const settings = { ...DEFAULTS, ...(options || {}) };
    const rgkMode = resolveRgkMode(row, catalogContext, options);
    if (!rgkMode) {
      return stat(RESULT_KY, 'unknown_rgk_mode', { rgkMode: '', warnings: ['RGK modu belirlenemedi.'] });
    }
    if (rgkMode === 'GES_GK_2020S') return evaluateResGes(row, catalogContext, settings, rgkMode, 'GES');
    if (rgkMode === 'RES_GK_2013S') return evaluateResGes(row, catalogContext, settings, rgkMode, 'RES');
    if (rgkMode === 'RES_GK_2008_2013') return evaluateLegacyResKv(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'RES_GF_2008_2013') return evaluateResCosPhi(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'RES_SRG_2008O') return evaluateFixedQ(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'KON_GB_1996O' || rgkMode === 'KON_GB_2003S') return evaluateConventional(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'HIB_RESGES_GK') return evaluateHybridResGes(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'HIB_KONV_GB') return evaluateHybridConventional(row, catalogContext, settings, rgkMode);
    if (rgkMode === 'SENKOM') return evaluateSenkom(row, settings, rgkMode);
    return stat(RESULT_KY, 'unsupported_rgk_mode', { rgkMode, warnings: [`Desteklenmeyen RGK modu: ${rgkMode}`] });
  }

  function buildEkcCalculationRows(ekcRows, catalogIndex, options = {}) {
    return (ekcRows || []).map((row) => {
      const catalogContext = resolveCatalogContext(row, catalogIndex);
      const computedMinuteStat = evaluateEkcMinute(row, catalogContext, options);
      const approval = computedMinuteStat.result === RESULT_PASS ? 1
        : computedMinuteStat.result === RESULT_FAIL ? 0
          : null;
      return {
        ...row,
        calculationSource: 'EKC',
        rgkMode: computedMinuteStat.rgkMode,
        computedMinuteStat,
        minuteStat: computedMinuteStat,
        sourceOrigin: row.sourceOrigin || 'EKC',
        sourceType: row.sourceType || inferSourceType(computedMinuteStat.rgkMode),
        ytm: row.ytm || catalogContext?.ytm || '',
        plantName: row.plantName || catalogContext?.plantName || '',
        busbarName: row.busbarName || catalogContext?.busbarName || '',
        voltageLevel: finiteOrNull(row.voltageLevel) ?? finiteOrNull(catalogContext?.voltageLevel),
        liveBusbarVoltage: finiteOrNull(row.liveBusbarVoltage) ?? finiteOrNull(row.vBara),
        tpysVoltageSet: finiteOrNull(row.tpysVoltageSet) ?? finiteOrNull(row.vSet),
        pgenMw: finiteOrNull(row.pgenMw) ?? finiteOrNull(row.pTotal),
        qgenMvar: finiteOrNull(row.qgenMvar) ?? finiteOrNull(row.qMeas),
        pnomMw: finiteOrNull(row.pnomMw) ?? finiteOrNull(catalogContext?.totalPnomMw),
        approvalStatus: approval,
        reactiveResult: computedMinuteStat.result,
        platformResult: computedMinuteStat.result
      };
    });
  }

  function evaluateResGes(row, context, settings, rgkMode, family, overrides = {}) {
    const p = finiteOrNull(overrides.p ?? row?.pTotal ?? row?.pgenMw);
    const pnom = positiveNumber(overrides.pnom ?? row?.pnomMw ?? context?.totalPnomMw);
    const level = productionLevel(p, pnom, settings);
    if (level.result) return stat(level.result, level.reason, { rgkMode, dutySource: level.dutySource, yyDdSource: level.reason });

    const qTarget = calculateDroopTarget(row, context, settings, family, p, pnom, overrides);
    if (!qTarget.ok) return stat(RESULT_KY, qTarget.reason, { rgkMode, warnings: qTarget.warnings || [] });
    return targetStat(row, qTarget.value, settings, rgkMode, {
      dutySource: overrides.dutySource || level.dutySource,
      qTarget: qTarget.value
    });
  }

  function evaluateLegacyResKv(row, context, settings, rgkMode) {
    const p = finiteOrNull(row?.pTotal ?? row?.pgenMw);
    const pnom = positiveNumber(row?.pnomMw ?? context?.totalPnomMw);
    const level = productionLevel(p, pnom, settings);
    if (level.result) return stat(level.result, level.reason, { rgkMode, dutySource: level.dutySource, yyDdSource: level.reason });
    const vSet = finiteOrNull(row?.vSet ?? row?.tpysVoltageSet);
    const vBara = finiteOrNull(row?.vBara ?? row?.liveBusbarVoltage);
    if (!Number.isFinite(vSet) || !Number.isFinite(vBara)) return stat(RESULT_KY, 'missing_voltage', { rgkMode, warnings: ['Gerilim set veya bara degeri eksik.'] });
    const nominal = nominalLimits(row, context);
    let qTarget = 0;
    if (vSet < vBara) qTarget = Number.isFinite(nominal.low) ? -Math.abs(nominal.low) : null;
    else if (vSet > vBara) qTarget = Number.isFinite(nominal.high) ? Math.abs(nominal.high) : null;
    if (!Number.isFinite(qTarget)) return stat(RESULT_KY, 'missing_nominal_excitation', { rgkMode, warnings: ['Nominal ikaz degeri eksik.'] });
    return targetStat(row, qTarget, settings, rgkMode, { qTarget, dutySource: level.dutySource });
  }

  function evaluateResCosPhi(row, context, settings, rgkMode) {
    const p = finiteOrNull(row?.pTotal ?? row?.pgenMw);
    const pnom = positiveNumber(row?.pnomMw ?? context?.totalPnomMw);
    const level = productionLevel(p, pnom, settings);
    if (level.result) return stat(level.result, level.reason, { rgkMode, dutySource: level.dutySource, yyDdSource: level.reason });
    const pfSet = finiteOrNull(row?.pfSet);
    if (!Number.isFinite(pfSet) || Math.abs(pfSet) > 1 || Math.abs(pfSet) < 1e-9) {
      return stat(RESULT_KY, 'invalid_cos_phi_set', { rgkMode, warnings: ['Guc faktoru set degeri gecersiz.'] });
    }
    const pBase = Math.min(Math.abs(p), pnom);
    const qTarget = Math.sign(pfSet) * pBase * Math.tan(Math.acos(Math.abs(pfSet)));
    return targetStat(row, qTarget, settings, rgkMode, { qTarget, dutySource: level.dutySource });
  }

  function evaluateFixedQ(row, context, settings, rgkMode) {
    const p = finiteOrNull(row?.pTotal ?? row?.pgenMw);
    const pnom = positiveNumber(row?.pnomMw ?? context?.totalPnomMw);
    const level = productionLevel(p, pnom, settings);
    if (level.result) return stat(level.result, level.reason, { rgkMode, dutySource: level.dutySource, yyDdSource: level.reason });
    const qTarget = finiteOrNull(row?.qSet);
    if (!Number.isFinite(qTarget)) return stat(RESULT_KY, 'missing_q_set', { rgkMode, warnings: ['Reaktif guc set degeri eksik.'] });
    return targetStat(row, qTarget, settings, rgkMode, { qTarget, dutySource: level.dutySource });
  }

  function evaluateConventional(row, context, settings, rgkMode, inputUnits) {
    const pTotal = finiteOrNull(row?.pTotal ?? row?.pgenMw);
    const pnom = positiveNumber(row?.pnomMw ?? context?.totalPnomMw);
    if (Number.isFinite(pTotal) && Number.isFinite(pnom) && pTotal < pnom * settings.lowProductionPct) {
      return stat(RESULT_DD, 'total_production_below_one_percent', { rgkMode, yyDdSource: 'TOTAL_P_LT_1' });
    }
    const units = inputUnits || mergeUnitMeasurements(row, context);
    const obligated = obligatedUnits(units, settings);
    if (!obligated.length) return stat(RESULT_YY, 'no_obligated_unit', { rgkMode, yyDdSource: 'NO_OBLIGATED_UNIT' });

    const vSet = finiteOrNull(row?.vSet ?? row?.tpysVoltageSet);
    const vBara = finiteOrNull(row?.vBara ?? row?.liveBusbarVoltage);
    const unom = positiveNumber(row?.nominalVoltageKv ?? row?.voltageLevel ?? context?.voltageLevel ?? vSet ?? vBara);
    if (!Number.isFinite(vSet) || !Number.isFinite(vBara) || !Number.isFinite(unom)) {
      return stat(RESULT_KY, 'missing_voltage', { rgkMode, warnings: ['Konvansiyonel gerilim degeri eksik.'] });
    }
    const band = unom * settings.voltageBandPct;
    if (vBara >= vSet - band && vBara <= vSet + band) {
      return stat(RESULT_PASS, 'inside_voltage_band', { rgkMode, dutySource: 'MAIN', yyDdSource: 'OBLIGATED_UNIT' });
    }
    const positiveDirection = vSet > vBara;
    let limitCount = 0;
    let qThreshold = obligated.reduce((sum, unit) => {
      const value = positiveDirection
        ? firstFinite(unit.nominalHighExcitation, unit.highExcitationTest, unit.highExcitationTest2)
        : firstFinite(unit.nominalLowExcitation, unit.lowExcitationTest, unit.lowExcitationTest2);
      if (!Number.isFinite(value)) return sum;
      limitCount += 1;
      return sum + Math.abs(value);
    }, 0);
    if ((!(qThreshold > 0) || limitCount !== obligated.length) && obligated.length === units.length && units.length > 0) {
      qThreshold = Math.abs(positiveDirection ? finiteOrNull(row?.qNomHigh) : finiteOrNull(row?.qNomLow));
      limitCount = qThreshold > 0 ? obligated.length : limitCount;
    }
    if (!(qThreshold > 0) || limitCount !== obligated.length) return stat(RESULT_KY, 'missing_unit_excitation', { rgkMode, warnings: ['Yukumlulukteki unite icin nominal ikaz degeri eksik.'] });
    const qTarget = positiveDirection ? qThreshold : -qThreshold;
    return targetStat(row, qTarget, settings, rgkMode, {
      qTarget,
      qThreshold,
      dutySource: 'MAIN',
      yyDdSource: 'OBLIGATED_UNIT'
    });
  }

  function evaluateHybridResGes(row, context, settings, rgkMode) {
    const pMain = finiteOrNull(row?.pMain ?? row?.pTotal);
    const pAux = finiteOrNull(row?.pAux ?? row?.auxiliaryMw);
    const pnomMain = positiveNumber(row?.pnomMainMw ?? context?.pnomMainMw ?? row?.pnomMw ?? context?.totalPnomMw);
    const pnomAux = positiveNumber(row?.pnomAuxMw ?? context?.pnomAuxMw);
    const mainFamily = sourceFamily(context?.ytbsSourceType || row?.sourceKind || row?.sourceType);
    const auxFamily = sourceFamily(context?.secondarySources || 'GES');
    if (Number.isFinite(pMain) && Number.isFinite(pnomMain) && pMain >= pnomMain * settings.highProductionPct) {
      return evaluateResGes(row, context, settings, rgkMode, mainFamily, { p: pMain, pnom: pnomMain, dutySource: 'MAIN_50' });
    }
    if (Number.isFinite(pMain) && Number.isFinite(pnomMain) && pMain >= pnomMain * settings.noObligationPct) {
      return evaluateResGes(row, context, settings, rgkMode, mainFamily, { p: pMain, pnom: pnomMain, dutySource: 'MAIN_10' });
    }
    if (Number.isFinite(pAux) && Number.isFinite(pnomAux) && pAux >= pnomAux * settings.highProductionPct) {
      return evaluateResGes(row, context, settings, rgkMode, auxFamily, { p: pAux, pnom: pnomAux, dutySource: 'AUX_50' });
    }
    if (Number.isFinite(pAux) && Number.isFinite(pnomAux) && pAux >= pnomAux * settings.noObligationPct) {
      return evaluateResGes(row, context, settings, rgkMode, auxFamily, { p: pAux, pnom: pnomAux, dutySource: 'AUX_10' });
    }
    return stat(RESULT_DD, 'hybrid_no_source_on_duty', { rgkMode, dutySource: 'NONE', yyDdSource: 'HYBRID_ALL_BELOW_10' });
  }

  function evaluateHybridConventional(row, context, settings, rgkMode) {
    const units = mergeUnitMeasurements(row, context);
    const obligated = obligatedUnits(units, settings);
    if (obligated.length) return evaluateConventional(row, context, settings, rgkMode, units);
    const pAux = finiteOrNull(row?.pAux ?? row?.auxiliaryMw);
    const pnomAux = positiveNumber(row?.pnomAuxMw ?? context?.pnomAuxMw);
    const auxFamily = sourceFamily(context?.secondarySources || 'GES');
    const level = productionLevel(pAux, pnomAux, settings, 'AUX');
    if (level.result) return stat(level.result, level.reason, { rgkMode, dutySource: level.dutySource, yyDdSource: level.reason });
    return evaluateResGes(row, context, settings, rgkMode, auxFamily, { p: pAux, pnom: pnomAux, dutySource: level.dutySource || 'AUX_10' });
  }

  function evaluateSenkom(row, settings, rgkMode) {
    const qTarget = finiteOrNull(firstDefined(row?.qSyncReqMvar, row?.senkronKompSetMvar, row?.qSet));
    if (!Number.isFinite(qTarget)) return stat(RESULT_KY, 'missing_senkom_q_set', { rgkMode, warnings: ['SENKOM Q seti eksik.'] });
    return targetStat(row, qTarget, settings, rgkMode, { qTarget, dutySource: 'SENKOM' });
  }

  function calculateDroopTarget(row, context, settings, family, p, pnom, overrides = {}) {
    const vSet = finiteOrNull(row?.vSet ?? row?.tpysVoltageSet);
    const vBara = finiteOrNull(row?.vBara ?? row?.liveBusbarVoltage);
    const droopPct = positiveNumber(row?.droopPct ?? context?.droopPct);
    const unom = positiveNumber(row?.nominalVoltageKv ?? row?.voltageLevel ?? context?.voltageLevel ?? vSet ?? vBara);
    if (!Number.isFinite(vSet) || !Number.isFinite(vBara)) return { ok: false, reason: 'missing_voltage', warnings: ['Gerilim set veya bara degeri eksik.'] };
    if (!Number.isFinite(droopPct) || !Number.isFinite(unom)) return { ok: false, reason: 'missing_droop_or_unom', warnings: ['Droop veya nominal gerilim eksik.'] };
    const qBaz = calculateQBase(family, p, pnom, settings);
    if (!Number.isFinite(qBaz)) return { ok: false, reason: 'missing_q_base', warnings: ['Qbaz hesaplanamadi.'] };
    const dV = vSet - vBara;
    const rawTarget = (dV * qBaz * 100) / (droopPct * unom);
    return { ok: true, value: clamp(rawTarget, -Math.abs(qBaz), Math.abs(qBaz)), qBaz, dutySource: overrides.dutySource };
  }

  function calculateQBase(family, p, pnom, settings) {
    if (!Number.isFinite(p) || !Number.isFinite(pnom)) return null;
    const isGes = family === 'GES';
    const highCos = isGes ? 0.90 : 0.95;
    const lowCos = isGes ? 0.718 : 0.835;
    if (p >= pnom * settings.highProductionPct) return pnom * Math.tan(Math.acos(highCos));
    if (p >= pnom * settings.noObligationPct) return Math.abs(p) * Math.tan(Math.acos(lowCos));
    return 0;
  }

  function productionLevel(p, pnom, settings, source = 'MAIN') {
    if (!Number.isFinite(p) || !Number.isFinite(pnom)) {
      return { result: RESULT_KY, reason: 'missing_active_power_or_pnom', dutySource: source };
    }
    if (p < pnom * settings.lowProductionPct) return { result: RESULT_DD, reason: `${source}_P_LT_1`, dutySource: `${source}_DD` };
    if (p < pnom * settings.noObligationPct) return { result: RESULT_YY, reason: `${source}_P_LT_10`, dutySource: `${source}_YY` };
    return { result: '', reason: '', dutySource: p >= pnom * settings.highProductionPct ? `${source}_50` : `${source}_10` };
  }

  function targetStat(row, qTarget, settings, rgkMode, extra = {}) {
    const q = finiteOrNull(row?.qMeas ?? row?.qgenMvar);
    if (!Number.isFinite(q)) return stat(RESULT_KY, 'missing_reactive_power', { rgkMode, qTarget, warnings: ['Reaktif guc degeri eksik.'], ...extra });
    const pass = directionalSupport(q, qTarget, settings);
    return stat(pass ? RESULT_PASS : RESULT_FAIL, pass ? 'directional_support_ok' : 'directional_support_fail', {
      rgkMode,
      qTarget,
      ...targetLimits(qTarget, settings),
      ...extra
    });
  }

  function directionalSupport(q, qTarget, settings) {
    if (!Number.isFinite(qTarget)) return false;
    if (Math.abs(qTarget) < 1e-9) return Math.abs(q) <= settings.zeroTargetBandMvar;
    if (qTarget > 0) return q >= qTarget * settings.directionalSupportPct;
    return q <= qTarget * settings.directionalSupportPct;
  }

  function targetLimits(qTarget, settings) {
    if (!Number.isFinite(qTarget)) return { limitLow: null, limitHigh: null };
    if (Math.abs(qTarget) < 1e-9) return { limitLow: -settings.zeroTargetBandMvar, limitHigh: settings.zeroTargetBandMvar };
    if (qTarget > 0) return { limitLow: qTarget * settings.directionalSupportPct, limitHigh: null };
    return { limitLow: null, limitHigh: qTarget * settings.directionalSupportPct };
  }

  function mergeUnitMeasurements(row, context) {
    const catalogUnits = Array.isArray(context?.units) ? context.units : [];
    const ekcUnits = Array.isArray(row?.ekcUnits) ? row.ekcUnits : [];
    const sourceUnits = catalogUnits.length ? catalogUnits : ekcUnits;
    return sourceUnits.map((unit, index) => {
      const measurement = ekcUnits.find((item) => {
        if (item.unitId && unit.unitId && String(item.unitId) === String(unit.unitId)) return true;
        if (item.unitName && unit.unitName && normalizeText(item.unitName) === normalizeText(unit.unitName)) return true;
        return Number(item.index) === index + 1;
      }) || {};
      return {
        ...unit,
        pActiveMw: finiteOrNull(firstDefined(measurement.pActiveMw, measurement.activePower, unit.pActiveMw)),
        mkudMw: finiteOrNull(firstDefined(measurement.mkudMw, unit.tpysUnitMkud, unit.unitPmkudMw)),
        lowExcitationTest: finiteOrNull(firstDefined(measurement.lowExcitationTest, unit.lowExcitationTest)),
        highExcitationTest: finiteOrNull(firstDefined(measurement.highExcitationTest, unit.highExcitationTest)),
        lowExcitationTest2: finiteOrNull(firstDefined(measurement.lowExcitationTest2, unit.lowExcitationTest2)),
        highExcitationTest2: finiteOrNull(firstDefined(measurement.highExcitationTest2, unit.highExcitationTest2)),
        nominalLowExcitation: finiteOrNull(firstDefined(measurement.nominalLowExcitation, unit.nominalLowExcitation)),
        nominalHighExcitation: finiteOrNull(firstDefined(measurement.nominalHighExcitation, unit.nominalHighExcitation))
      };
    });
  }

  function obligatedUnits(units, settings) {
    return (units || []).filter((unit) => {
      const p = finiteOrNull(unit?.pActiveMw);
      const thresholdBase = unit?.isBalancingUnit === true
        ? firstFinite(unit?.tpysUnitMkud, unit?.mkudMw, unit?.unitPmkudMw)
        : firstFinite(unit?.unitPmkudMw, unit?.mkudMw, unit?.tpysUnitMkud);
      const threshold = Number.isFinite(thresholdBase) ? thresholdBase * settings.mkudFactor : null;
      return Number.isFinite(p) && Number.isFinite(threshold) && p > threshold;
    });
  }

  function nominalLimits(row, context) {
    const units = Array.isArray(context?.units) ? context.units : [];
    const low = firstFinite(row?.qNomLow, context?.nominalLowExcitation, sumSigned(units, ['nominalLowExcitation', 'lowExcitationTest', 'lowExcitationTest2'], -1));
    const high = firstFinite(row?.qNomHigh, context?.nominalHighExcitation, sumSigned(units, ['nominalHighExcitation', 'highExcitationTest', 'highExcitationTest2'], 1));
    return { low, high };
  }

  function sumSigned(units, keys, sign) {
    const values = (units || []).map((unit) => {
      for (const key of keys) {
        const value = finiteOrNull(unit?.[key]);
        if (Number.isFinite(value)) return Math.abs(value) * sign;
      }
      return null;
    }).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  }

  function resolveCatalogContext(row, catalogIndex) {
    if (!catalogIndex) return row?.catalog || {};
    if (catalogIndex instanceof Map) {
      const keys = [row?.busbarId, row?.busbarInternalId, row?.busbarName].map((value) => String(value ?? '')).filter(Boolean);
      for (const key of keys) {
        if (catalogIndex.has(key)) return catalogIndex.get(key) || {};
      }
      return {};
    }
    if (typeof catalogIndex === 'object') {
      const byBusbarId = catalogIndex.byBusbarId?.get?.(String(row?.busbarId));
      if (Array.isArray(byBusbarId)) return { ...(byBusbarId[0] || {}), units: byBusbarId };
      return catalogIndex[String(row?.busbarId)] || catalogIndex[String(row?.busbarInternalId)] || row?.catalog || {};
    }
    return row?.catalog || {};
  }

  function stat(result, reason, extra = {}) {
    return {
      result,
      reason,
      rgkMode: extra.rgkMode || '',
      qTarget: finiteOrNull(extra.qTarget),
      qThreshold: finiteOrNull(extra.qThreshold ?? extra.qTarget),
      limitLow: finiteOrNull(extra.limitLow),
      limitHigh: finiteOrNull(extra.limitHigh),
      dutySource: extra.dutySource || '',
      yyDdSource: extra.yyDdSource || '',
      warnings: extra.warnings || []
    };
  }

  function normalizeMode(value) {
    const token = normalizeToken(value);
    if (!token) return '';
    const aliases = {
      HIBRIT_RESGES_GK: 'HIB_RESGES_GK',
      HIBRIT_KONV_GB: 'HIB_KONV_GB',
      KONV_GB_2003S: 'KON_GB_2003S',
      KONV_GB_1996O: 'KON_GB_1996O'
    };
    return aliases[token] || token;
  }

  function inferSourceType(mode) {
    return /^KON_|^HIB_KONV/.test(String(mode || '')) ? 'CONVENTIONAL' : 'WIND';
  }

  function sourceFamily(value) {
    const text = normalizeToken(value);
    return /GES|GUNES|SUN/.test(text) ? 'GES' : 'RES';
  }

  function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
  }

  function firstFinite(...values) {
    for (const value of values) {
      const numeric = finiteOrNull(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  }

  function positiveNumber(value) {
    const numeric = finiteOrNull(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  function finiteOrNull(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeToken(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  return {
    resolveRgkMode,
    evaluateEkcMinute,
    buildEkcCalculationRows
  };
});
