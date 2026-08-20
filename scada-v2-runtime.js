(function () {
  const METRIC_MODES = {
    'hat-active': { key: 'hat-active', label: 'Hat (MW)', domain: 'hat', primaryMetric: 'active', elementNames: ['P', 'Q'] },
    'hat-reactive': { key: 'hat-reactive', label: 'Hat (MVar)', domain: 'hat', primaryMetric: 'reactive', elementNames: ['P', 'Q'] },
    'trafo-active': { key: 'trafo-active', label: 'Trafo (MW)', domain: 'trafo', primaryMetric: 'active', elementNames: ['P', 'Q'] },
    'trafo-reactive': { key: 'trafo-reactive', label: 'Trafo (MVar)', domain: 'trafo', primaryMetric: 'reactive', elementNames: ['P', 'Q'] },
    'voltage': { key: 'voltage', label: 'Gerilim (kV)', domain: 'bara', primaryMetric: 'voltage', elementNames: ['U'] }
  };
  const STATUS_TEXT = {
    live: 'Canli',
    warn: 'Gecikmeli',
    dead: 'Bayat',
    ambiguous: 'Belirsiz'
  };
  const ENTITY_LABELS = {
    hat: 'Hatlar',
    'trafo-dist': 'Trafo (Dagitim)',
    'trafo-trans': 'Trafo (Iletim)',
    voltage: 'Gerilim (kV)'
  };
  const MVAR_RATIO_THRESHOLDS = [
    { max: 10, color: '#22c55e', label: '0-10%' },
    { max: 20, color: '#eab308', label: '10-20%' },
    { max: 30, color: '#f97316', label: '20-30%' },
    { max: 40, color: '#ef4444', label: '30-40%' },
    { max: 60, color: '#dc2626', label: '40-60%' },
    { max: 80, color: '#7c3aed', label: '60-80%' },
    { max: Infinity, color: '#7c3aed', label: '80%+' }
  ];
  const INVALID_DISPLAY_THRESHOLD = 300;
  const HAT_VALUE_CAPACITY_MULTIPLIER = 1.5;
  const HAT_UNCERTAINTY_TEXT = {
    'backup-terminal': {
      label: 'Yedek uc',
      short: 'Yedek uc olcumu kullanildi.',
      detail: 'Yedek uc olcumu kullanildi'
    },
    'candidate-conflict': {
      label: 'Aday uyusmazligi',
      short: 'Iki uc olcumu uyusmuyor.',
      detail: 'Iki uc olcumu arasinda deger uyumsuzlugu var'
    },
    'source-side-unknown': {
      label: 'Terminal belirsiz',
      short: 'Baslangic/bitis terminali dogrulanamadi.',
      detail: 'Baslangic/Bitis terminal eslesmesi dogrulanamadi'
    },
    'polarization-mismatch': {
      label: 'Polarizasyon uyusmaz',
      short: 'Formul polarizasyonu terminal tarafi ile uyusmuyor.',
      detail: 'Formul polarizasyon isareti terminal tarafiyle uyusmuyor'
    },
    'invalid-pct': {
      label: 'Gecersiz oran',
      short: 'Oran %300 uzerinde oldugu icin gecersiz kabul edildi.',
      detail: 'Oran %300 uzeri oldugu icin gecersiz kabul edildi'
    },
    'invalid-value': {
      label: 'Gecersiz deger',
      short: 'Olcum degeri kapasite sinirini asti.',
      detail: 'Olcum degeri 1.5x kapasite sinirini gectigi icin gecersiz kabul edildi'
    },
    'orientation-unknown': {
      label: 'Yon belirsiz',
      short: 'Yon belirlenemedi.',
      detail: 'Akis yonu guvenilir sekilde belirlenemedi'
    },
    'resolved-terminal-mismatch': {
      label: 'Terminal yorumlu cozum',
      short: 'Formul polarizasyonu uyusmadi; yon terminal isaretinden cozuldu.',
      detail: 'Formul polarizasyonu terminal beklentisiyle uyusmadi; akis yonu terminalin cikis/giris isaretine gore cozuldu'
    },
    'ambiguous-live': {
      label: 'Belirsiz canli',
      short: 'Canli adaylar birbiriyle celisiyor.',
      detail: 'Birden fazla canli aday kayit tutarsiz durumda'
    }
  };

  if (typeof state === 'undefined' || typeof SCADA_CONFIG === 'undefined') return;

  const rankingState = {
    search: '',
    sortCol: 'score',
    sortDir: -1,
    activeKey: '',
    entityFilter: state.filters?.scadaListEntity || 'hat',
    page: state.scadaPanel?.page || 1,
    fontScale: state.scadaPanel?.fontScale || 'normal'
  };

  state.scada.entityMetricsByKey = state.scada.entityMetricsByKey || new Map();
  state.scada.measurementRowsById = state.scada.measurementRowsById || new Map();
  state.scada.currentScope = state.scada.currentScope || null;
  state.scada.v2RuntimeActive = true;
  globalThis.__TPYS_SCADA_V2_RUNTIME_ACTIVE__ = true;
  const SCADA_DASHBOARD_SNAPSHOT_KEY = 'scadaDashboardSnapshot';
  const SCADA_BACKGROUND_REFRESH_STATE_KEY = 'scadaBackgroundRefreshState';
  state.scada.visibleSummary = state.scada.visibleSummary || {
    total: 0,
    matched: 0,
    delayed: 0,
    dead: 0,
    stale: 0,
    unmatched: 0,
    ambiguousLive: 0,
    orientationUnknown: 0,
    updatedAt: null,
    filterKey: '',
    metricMode: state.filters?.scadaMetric || 'hat-active'
  };
  state.scada.history = state.scada.history || new Map();
  state.scada.pollState = state.scada.pollState || {
    timerId: null,
    nextDueAt: null,
    lastAutoRunAt: null,
    pendingAutoRefresh: false,
    lastVisibilityResumeAt: null
  };
  state.filters.scadaMetric = state.filters.scadaMetric || 'hat-active';
  state.filters.scadaListEntity = state.filters.scadaListEntity || 'hat';
  state.filters.scadaMapDisplayMode = state.filters.scadaMapDisplayMode || 'flow';
  state.scadaPanel = state.scadaPanel || { page: 1, pageSize: 50, fontScale: 'normal' };

  function getModeConfig(mode) {
    return METRIC_MODES[mode || state.filters.scadaMetric] || METRIC_MODES['hat-active'];
  }

  function getScadaMapDisplayOptions(modeConfig) {
    if (modeConfig.domain === 'hat') return ['flow', 'heatmap', 'current'];
    return ['box', 'point-label', 'point', 'heatmap'];
  }

  function normalizeScadaMapDisplayMode(modeConfig, requested) {
    const allowed = getScadaMapDisplayOptions(modeConfig);
    if (allowed.includes(requested)) return requested;
    return modeConfig.domain === 'hat' ? 'flow' : 'box';
  }

  function getScadaMapDisplayLabel(mode) {
    return {
      flow: 'Akis',
      heatmap: 'Isi Haritasi',
      current: 'Mevcut',
      point: 'Nokta (Adsiz)',
      'point-label': 'Nokta (Ad)',
      box: 'Kutu',
    }[mode] || mode;
  }

  function iconMarkup(name, srLabel = '') {
    if (typeof renderIcon !== 'function') return srLabel ? `<span>${escapeHtml(srLabel)}</span>` : '';
    return `${renderIcon(name)}${srLabel ? `<span class="sr-only">${escapeHtml(srLabel)}</span>` : ''}`;
  }

  function setScadaPanelPage(page) {
    const next = Math.max(1, Number(page) || 1);
    rankingState.page = next;
    state.scadaPanel.page = next;
  }

  function setScadaPanelFontScale(scale) {
    const next = ['compact', 'normal', 'large'].includes(scale) ? scale : 'normal';
    rankingState.fontScale = next;
    state.scadaPanel.fontScale = next;
  }

  function getPanelPageSize() {
    const pageSize = Number(state.scadaPanel?.pageSize || 50);
    return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50;
  }

  function parseColorChannels(colorValue) {
    const raw = String(colorValue || '').trim().toLowerCase();
    if (!raw) return null;
    const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1].length === 3
        ? hexMatch[1].split('').map((char) => char + char).join('')
        : hexMatch[1];
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/);
    if (!rgbMatch) return null;
    const parts = rgbMatch[1].split(',').map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.slice(0, 3).some((value) => !Number.isFinite(value))) return null;
    return { r: parts[0], g: parts[1], b: parts[2] };
  }

  function getReadableTextColor(backgroundColor) {
    const channels = parseColorChannels(backgroundColor);
    if (!channels) return '#f8fafc';
    const [r, g, b] = [channels.r, channels.g, channels.b].map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    return luminance > 0.52 ? 'var(--chip-text-dark)' : '#f8fafc';
  }

  function getStalePriorityWeight(staleState) {
    if (staleState === 'live') return 3000000;
    if (staleState === 'warn') return 2000000;
    if (staleState === 'dead') return 1000000;
    return 0;
  }

  function getTimestampPriority(record) {
    return Number(record?.primaryTimestamp?.getTime?.() || 0) / 1000;
  }

  function buildVisualPriorityScore(record, severityValue, nominalKv = 0) {
    const severity = Number.isFinite(Number(severityValue)) ? Number(severityValue) : 0;
    const nominal = Number.isFinite(Number(nominalKv)) ? Number(nominalKv) : 0;
    return getStalePriorityWeight(record?.primaryStaleState) + (severity * 1000) + getTimestampPriority(record) + nominal;
  }

  function getThresholdColor(value, thresholds) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return SCADA_CONFIG.UNMATCHED_HAT_COLOR || '#4b5563';
    const bucket = (thresholds || []).find((entry) => numeric <= entry.max);
    return bucket?.color || (thresholds?.[thresholds.length - 1]?.color ?? SCADA_CONFIG.UNMATCHED_HAT_COLOR ?? '#4b5563');
  }

  function getReactiveRatioColor(ratioPct) {
    return getThresholdColor(ratioPct, MVAR_RATIO_THRESHOLDS);
  }

  function getDisplayColor(record, options = {}) {
    if (!record) return SCADA_CONFIG.UNMATCHED_HAT_COLOR || '#4b5563';
    if (record.invalidPct || record.valueInvalid || record.primaryStaleState === 'dead') {
      return SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af';
    }
    if (options.respectStale !== false && record.primaryStaleState === 'warn') {
      // Gecikmeli veriler threshold rengini korur.
    }
    if (Number.isFinite(record.displayPct)) {
      return record.displayPctMode === 'reactive-ratio'
        ? getReactiveRatioColor(record.displayPct)
        : getFlowColor(record.displayPct);
    }
    if ((record.primaryMetric === 'active' || record.primaryMetric === 'reactive') && Number.isFinite(record.primaryValue)) {
      return SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af';
    }
    if (record.primaryMetric === 'voltage' && Number.isFinite(record.primaryValue) && typeof getVoltagePuColor === 'function') {
      const nominal = Number(record.entity?.gerilimKv || record.entity?.kvBucket || 0) || 0;
      const pu = nominal > 0 ? record.primaryValue / nominal : null;
      return Number.isFinite(pu) ? getVoltagePuColor(pu) : (SCADA_CONFIG.UNMATCHED_HAT_COLOR || '#4b5563');
    }
    return SCADA_CONFIG.UNMATCHED_HAT_COLOR || '#4b5563';
  }

  function hasHatUncertainty(record, options = {}) {
    if (!record) return false;
    if (record.entityType && record.entityType !== 'hat') return false;
    if (!record.entityType && !options.assumeHat) return false;
    const hasBlockingUncertainty = Boolean(record.uncertaintyReason && record.uncertaintyReason !== 'resolved-terminal-mismatch');
    return Boolean(record.sourceAmbiguous
      || record.unresolved
      || record.candidateConflict
      || record.backupUsed
      || hasBlockingUncertainty
      || record.valueInvalid);
  }

  function getHatResolutionClass(record) {
    if (!record) return 'missing';
    if (record.sourceAmbiguous || record.unresolved || ['orientation-unknown', 'source-side-unknown', 'polarization-mismatch'].includes(record.unresolvedReason)) return 'unresolved';
    if (record.candidateConflict || record.backupUsed || record.valueInvalid || record.invalidPct) return 'conflict';
    if (record.resolvedTerminalMismatch) return 'resolved-with-warning';
    if (!Number.isFinite(record.primaryValue)) return 'missing';
    return 'resolved';
  }

  function getHatResolutionLabel(record) {
    switch (getHatResolutionClass(record)) {
      case 'resolved-with-warning':
        return 'Terminal yorumlu';
      case 'unresolved':
        return 'Yon belirsiz';
      case 'conflict':
        return 'Uyarili';
      case 'missing':
        return 'Eksik';
      default:
        return 'Cozulmus';
    }
  }

  function getHatFlowDirection(record) {
    if (!record || record.entityType !== 'hat') return 'unknown';
    const directionValue = Number.isFinite(record.directionValue) ? record.directionValue : record.primaryValue;
    if (!Number.isFinite(directionValue)) return 'unknown';
    if (record.sourceAmbiguous || record.unresolved || record.candidateConflict || record.backupUsed || record.valueInvalid || record.invalidPct) return 'unknown';
    return directionValue >= 0 ? 'forward' : 'reverse';
  }

  function buildHatUncertaintyMeta(record) {
    const reasons = [];
    if (!record) {
      return {
        reasons,
        label: '',
        shortTooltip: '',
        detailLines: []
      };
    }
    if (record.backupUsed) reasons.push('backup-terminal');
    if (record.candidateConflict) reasons.push('candidate-conflict');
    if (record.unresolvedReason === 'source-side-unknown') reasons.push('source-side-unknown');
    else if (record.unresolvedReason === 'polarization-mismatch') reasons.push('polarization-mismatch');
    else if (record.unresolvedReason === 'orientation-unknown') reasons.push('orientation-unknown');
    else if (record.unresolvedReason === 'ambiguous-live' || record.sourceAmbiguous) reasons.push('ambiguous-live');
    if (record.resolvedTerminalMismatch) reasons.push('resolved-terminal-mismatch');
    if (record.valueInvalid) reasons.push('invalid-value');
    if (record.invalidPct) reasons.push('invalid-pct');

    const uniqueReasons = [...new Set(reasons)];
    const labels = uniqueReasons
      .map((reason) => HAT_UNCERTAINTY_TEXT[reason])
      .filter(Boolean);
    return {
      reasons: uniqueReasons,
      label: labels.map((entry) => entry.label).join(' + '),
      shortTooltip: labels.map((entry) => entry.short).join(' '),
      detailLines: labels.map((entry) => entry.detail)
    };
  }

  function getMetricUnit(metricType) {
    if (metricType === 'active') return 'MW';
    if (metricType === 'reactive') return 'MVar';
    return 'kV';
  }

  function getCapacityLimit(entityType, entity) {
    const capacity = getCapacityMva(entityType, entity);
    if (!Number.isFinite(capacity) || capacity <= 0) return null;
    return capacity * HAT_VALUE_CAPACITY_MULTIPLIER;
  }

  function isTimeStateDead(state) {
    return state === 'dead';
  }

  function getPrimaryMetricType(mode) {
    return getModeConfig(mode).primaryMetric;
  }

  function pickPositiveCapacity(...values) {
    for (const value of values) {
      const numeric = Number(value || 0);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
    return null;
  }

  function getFetchMetricTypes(modeConfig) {
    return modeConfig.domain === 'bara' ? ['voltage'] : ['active', 'reactive'];
  }

  function getVisibleEntitiesForMode(modeConfig) {
    if (modeConfig.domain === 'hat') return typeof getVisibleHats === 'function' ? getVisibleHats() : [];
    if (modeConfig.domain === 'trafo') return typeof getVisibleTrafoEntities === 'function' ? getVisibleTrafoEntities() : [];
    const visibleBaras = typeof getVisibleBaras === 'function' ? getVisibleBaras() : [];
    return visibleBaras.filter((bara) => ['154', '400'].includes(String(bara.kvBucket || bara.gerilimKv || '')));
  }

  function getCurrentScadaScope() {
    const modeConfig = getModeConfig();
    const entities = getVisibleEntitiesForMode(modeConfig);
    const measurementIds = new Set();
    getFetchMetricTypes(modeConfig).forEach((metricType) => {
      entities.forEach((entity) => {
        const ids = entity?.scada?.[metricType]?.ids || [];
        ids.forEach((id) => measurementIds.add(String(id)));
      });
    });
    return {
      mode: modeConfig.key,
      modeLabel: modeConfig.label,
      domain: modeConfig.domain,
      primaryMetric: modeConfig.primaryMetric,
      elementNames: modeConfig.elementNames.slice(),
      entities,
      measurementIds: [...measurementIds],
      filterKey: typeof getScadaVisibilityFilterKey === 'function'
        ? `${getScadaVisibilityFilterKey()}|mode:${modeConfig.key}`
        : `mode:${modeConfig.key}`
    };
  }

  function syncScadaMetricButtons() {
    const buttons = Array.from(document.querySelectorAll('[data-scada-metric]'));
    buttons.forEach((button) => {
      button.classList.toggle('active', button.dataset.scadaMetric === state.filters.scadaMetric);
    });
  }

  function syncScadaMapDisplayButtons() {
    const modeConfig = getModeConfig();
    const activeMode = normalizeScadaMapDisplayMode(modeConfig, state.filters.scadaMapDisplayMode);
    state.filters.scadaMapDisplayMode = activeMode;
    const buttons = Array.from(document.querySelectorAll('[data-scada-map-display]'));
    buttons.forEach((button) => {
      const buttonMode = button.dataset.scadaMapDisplay || '';
      const buttonDomain = button.dataset.domain === 'hat' ? 'hat' : 'entity';
      const isVisible = modeConfig.domain === 'hat' ? buttonDomain === 'hat' : buttonDomain === 'entity';
      button.classList.toggle('is-hidden', !isVisible);
      button.classList.toggle('active', isVisible && buttonMode === activeMode);
    });
    Array.from(document.querySelectorAll('[data-scada-display-group]')).forEach((group) => {
      const groupDomain = group.dataset.scadaDisplayGroup === 'hat' ? 'hat' : 'entity';
      group.classList.toggle('is-hidden', modeConfig.domain === 'hat' ? groupDomain !== 'hat' : groupDomain !== 'entity');
    });
    const label = document.getElementById('scadaDisplayModeLabel');
    if (label) label.textContent = getScadaMapDisplayLabel(activeMode);
  }

  function setScadaMapDisplayMode(mode) {
    const modeConfig = getModeConfig();
    const next = normalizeScadaMapDisplayMode(modeConfig, mode);
    if (state.filters.scadaMapDisplayMode === next) {
      syncScadaMapDisplayButtons();
      return;
    }
    state.filters.scadaMapDisplayMode = next;
    if (typeof persistMapPrefs === 'function') persistMapPrefs();
    syncScadaMapDisplayButtons();
    if (typeof requestRender === 'function') requestRender();
  }

  function setScadaMetric(mode, options = {}) {
    if (!METRIC_MODES[mode]) return;
    state.filters.scadaMetric = mode;
    if (mode.startsWith('hat')) state.filters.scadaListEntity = 'hat';
    if (mode.startsWith('trafo')) state.filters.scadaListEntity = state.filters.scadaListEntity === 'trafo-trans' ? 'trafo-trans' : 'trafo-dist';
    if (mode === 'voltage') state.filters.scadaListEntity = 'voltage';
    state.filters.scadaMapDisplayMode = normalizeScadaMapDisplayMode(getModeConfig(mode), state.filters.scadaMapDisplayMode);
    rankingState.entityFilter = state.filters.scadaListEntity;
    setScadaPanelPage(1);
    syncScadaMetricButtons();
    syncScadaMapDisplayButtons();
    if (state.scada.enabled && options.fetch !== false) scadaDoFetch({ trigger: 'mode-change' });
    if (typeof requestScadaOverlayRender === 'function') requestScadaOverlayRender();
    else {
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      if (typeof requestRender === 'function') requestRender();
    }
    if (typeof refreshRankingTable === 'function') refreshRankingTable();
  }

  function setRankingEntityFilter(filter) {
    if (!ENTITY_LABELS[filter]) return;
    rankingState.entityFilter = filter;
    state.filters.scadaListEntity = filter;
    if (filter === 'hat' && !state.filters.scadaMetric.startsWith('hat')) {
      setScadaMetric('hat-active');
      return;
    }
    if ((filter === 'trafo-dist' || filter === 'trafo-trans') && !state.filters.scadaMetric.startsWith('trafo')) {
      setScadaMetric('trafo-active');
      state.filters.scadaListEntity = filter;
      rankingState.entityFilter = filter;
      return;
    }
    if (filter === 'voltage' && state.filters.scadaMetric !== 'voltage') {
      setScadaMetric('voltage');
      return;
    }
    setScadaPanelPage(1);
    if (typeof refreshRankingTable === 'function') refreshRankingTable();
  }

  function getScadaTriggerLabel(triggerType) {
    switch (triggerType) {
      case 'manual': return 'Manuel';
      case 'auto': return 'Otomatik';
      case 'layer-enable': return 'Katman';
      case 'mode-change': return 'Mod';
      case 'filter-change': return 'Filtre';
      default: return 'Sistem';
    }
  }

  function getCapacityMva(entityType, entity) {
    if (entityType === 'hat') {
      const season = state.scada.capacitySeason === 'summer' ? 'summer' : 'winter';
      const winter = Number(entity.winterCapacityMva || 0);
      const summer = Number(entity.summerCapacityMva || 0);
      return season === 'summer'
        ? pickPositiveCapacity(summer, winter)
        : pickPositiveCapacity(winter, summer);
    }
    if (entityType === 'trafo') {
      return pickPositiveCapacity(entity.ofafMva, entity.onafMva, entity.onanMva, entity.bazGucuMva);
    }
    return null;
  }

  function getStaleState(timestamp) {
    if (!timestamp) return 'dead';
    const ageSec = (Date.now() - timestamp.getTime()) / 1000;
    if (ageSec > SCADA_CONFIG.STALE_DEAD_SEC) return 'dead';
    if (ageSec > SCADA_CONFIG.STALE_WARN_SEC) return 'warn';
    return 'live';
  }

  function getAgeLabel(timestamp) {
    if (!timestamp) return '';
    const ageSec = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));
    if (ageSec < 60) return `${ageSec} sn`;
    const ageMin = Math.floor(ageSec / 60);
    if (ageMin < 60) return `${ageMin} dk`;
    const ageHour = Math.floor(ageMin / 60);
    const restMin = ageMin % 60;
    return restMin ? `${ageHour} sa ${restMin} dk` : `${ageHour} sa`;
  }

  function sameTimestamp(left, right) {
    return Number(left?.timestamp?.getTime?.() || 0) === Number(right?.timestamp?.getTime?.() || 0);
  }

  function roundMetricValue(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function getHatResolutionTolerance(entity) {
    const absoluteTolerance = Number(SCADA_CONFIG.HAT_AMBIGUOUS_ABS_TOLERANCE_MW || 12);
    const relativeTolerance = Number(SCADA_CONFIG.HAT_AMBIGUOUS_REL_TOLERANCE || 0.08);
    const capacityMva = getCapacityMva('hat', entity);
    const capacityTolerance = Number.isFinite(capacityMva) && capacityMva > 0
      ? capacityMva * relativeTolerance
      : 0;
    return Math.max(
      Number.isFinite(absoluteTolerance) && absoluteTolerance > 0 ? absoluteTolerance : 12,
      capacityTolerance
    );
  }

  function sameMetricDirection(values) {
    const directionSet = new Set(values
      .filter((value) => Number.isFinite(value) && Math.abs(value) > 1)
      .map((value) => (value >= 0 ? 'forward' : 'reverse')));
    return directionSet.size <= 1;
  }

  function compactAlias(value) {
    return String(normalizeText(value || '') || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function aliasTokenVariants(value) {
    const variants = new Set();
    const compact = compactAlias(value);
    if (compact) variants.add(compact);
    const rawParts = String(value || '').split(/[^0-9A-Za-zÃ§ÄŸÄ±Ã¶ÅŸÃ¼Ã‡ÄÄ°Ã–ÅÃœ]+/);
    const normalizedParts = String(normalizeText(value || '') || '').split(/[^0-9a-zA-Z]+/);
    [...rawParts, ...normalizedParts].forEach((part) => {
      const token = compactAlias(part);
      if (!token) return;
      variants.add(token);
      const noLineSuffix = token.replace(/(?:h|g|tr)?\d+$/i, '');
      if (noLineSuffix.length >= 3) variants.add(noLineSuffix);
      const noDigits = token.replace(/\d+$/i, '');
      if (noDigits.length >= 3) variants.add(noDigits);
    });
    return [...variants].filter((variant) => variant.length >= 2);
  }

  function stripAliasSuffix(value) {
    let next = compactAlias(value);
    const suffixes = [
      'trafomerkezi',
      'merkezi',
      'merkez',
      'santrali',
      'santral',
      'dagitim',
      'iletim',
      'havza',
      'tes',
      'hes',
      'gis',
      'osb',
      'tm'
    ];
    let changed = true;
    while (changed) {
      changed = false;
      for (const suffix of suffixes) {
        if (next.endsWith(suffix) && next.length > suffix.length + 2) {
          next = next.slice(0, -suffix.length);
          changed = true;
        }
      }
    }
    return next;
  }

  function stripAliasVowels(value) {
    return compactAlias(value).replace(/[aeiouy]/g, '');
  }

  function addAliasVariant(bucket, rawValue, basis) {
    const compact = compactAlias(rawValue);
    if (!compact) return;
    if (!bucket.has(compact)) bucket.set(compact, basis);
    const trimmed = stripAliasSuffix(compact);
    if (trimmed && trimmed !== compact && !bucket.has(trimmed)) bucket.set(trimmed, `${basis}:trim`);
    [compact, trimmed].filter(Boolean).forEach((candidate) => {
      if (candidate.length >= 6) {
        const prefix = candidate.slice(0, 6);
        if (!bucket.has(prefix)) bucket.set(prefix, `${basis}:prefix6`);
      }
      [4, 5, 6].forEach((tailLength) => {
        if (candidate.length > tailLength + 1) {
          const abbreviated = `${candidate[0]}${candidate.slice(-tailLength)}`;
          if (!bucket.has(abbreviated)) bucket.set(abbreviated, `${basis}:abbr${tailLength}`);
        }
      });
      const noVowels = stripAliasVowels(candidate);
      if (noVowels.length >= 4 && !bucket.has(noVowels)) bucket.set(noVowels, `${basis}:novowel`);
    });
  }

  function buildTmAliasEntries(tmRef, fallbackName = '') {
    const bucket = new Map();
    addAliasVariant(bucket, tmRef?.name || fallbackName, 'tm-name');
    addAliasVariant(bucket, tmRef?.ucteKodu || '', 'ucte');
    addAliasVariant(bucket, tmRef?.psseAdi || '', 'psse');
    return [...bucket.entries()].map(([value, basis]) => ({
      value,
      basis,
      noVowels: stripAliasVowels(value)
    }));
  }

  function scoreAliasToken(token, aliasEntries) {
    const variants = aliasTokenVariants(token);
    if (!variants.length || !Array.isArray(aliasEntries) || !aliasEntries.length) return null;
    let best = null;
    variants.forEach((compact) => {
      const tokenNoVowels = stripAliasVowels(stripAliasSuffix(compact));
      aliasEntries.forEach((entry) => {
        const alias = entry.value;
        let score = 0;
        let relation = '';
        if (compact === alias) {
          score = 100;
          relation = 'exact';
        } else if (alias.startsWith(compact) && compact.length >= 4) {
          score = 94;
          relation = 'token-prefix';
        } else if (compact.startsWith(alias) && alias.length >= 4) {
          score = 93;
          relation = 'alias-prefix';
        } else if (alias.includes(compact) && compact.length >= 5) {
          score = 86;
          relation = 'token-substring';
        } else if (compact.includes(alias) && alias.length >= 5) {
          score = 85;
          relation = 'alias-substring';
        } else if (entry.noVowels && tokenNoVowels) {
          if (tokenNoVowels === entry.noVowels) {
            score = 78;
            relation = 'novowel-exact';
          } else if (entry.noVowels.startsWith(tokenNoVowels) && tokenNoVowels.length >= 4) {
            score = 74;
            relation = 'novowel-token-prefix';
          } else if (tokenNoVowels.startsWith(entry.noVowels) && entry.noVowels.length >= 4) {
            score = 73;
            relation = 'novowel-alias-prefix';
          }
        }
        if (!score) return;
        const candidate = {
          score,
          relation,
          basis: entry.basis,
          token: compact,
          alias
        };
        if (!best
          || candidate.score > best.score
          || (candidate.score === best.score && String(candidate.alias || '').length < String(best.alias || '').length)) {
          best = candidate;
        }
      });
    });
    return best;
  }

  function scoreAliasSide(token, startAliases, endAliases) {
    const toStart = scoreAliasToken(token, startAliases);
    const toEnd = scoreAliasToken(token, endAliases);
    if (!toStart && !toEnd) return null;
    if (toStart && (!toEnd || toStart.score >= toEnd.score + 2)) {
      return { side: 'start', match: toStart };
    }
    if (toEnd && (!toStart || toEnd.score >= toStart.score + 2)) {
      return { side: 'end', match: toEnd };
    }
    return { side: 'unknown', match: null, conflict: true };
  }

  function resolveOrientationByCandidateSides(candidate) {
    const sourceSide = candidate?.sourceSide || 'unknown';
    const targetSide = candidate?.targetSide || 'unknown';
    if (sourceSide === 'start') {
      return {
        orientation: 1,
        orientationMatch: 'forward',
        directionResolvedBy: 'candidate-side',
        aliasMatchBasis: `sourceSide:start; targetSide:${targetSide || 'unknown'}; slot:${candidate?.candidateSlot || ''}`,
        orientationRule: 'source-side'
      };
    }
    if (sourceSide === 'end') {
      return {
        orientation: -1,
        orientationMatch: 'reverse',
        directionResolvedBy: 'candidate-side',
        aliasMatchBasis: `sourceSide:end; targetSide:${targetSide || 'unknown'}; slot:${candidate?.candidateSlot || ''}`,
        orientationRule: 'source-side'
      };
    }
    if (targetSide === 'end') {
      return {
        orientation: 1,
        orientationMatch: 'forward',
        directionResolvedBy: 'candidate-side',
        aliasMatchBasis: `sourceSide:${sourceSide || 'unknown'}; targetSide:end; slot:${candidate?.candidateSlot || ''}`,
        orientationRule: 'target-side'
      };
    }
    if (targetSide === 'start') {
      return {
        orientation: -1,
        orientationMatch: 'reverse',
        directionResolvedBy: 'candidate-side',
        aliasMatchBasis: `sourceSide:${sourceSide || 'unknown'}; targetSide:start; slot:${candidate?.candidateSlot || ''}`,
        orientationRule: 'target-side'
      };
    }
    return null;
  }

  function resolveOrientationByAlias(sourceToken, targetToken, startAliases, endAliases, resolvedBy) {
    const sourceToStart = scoreAliasToken(sourceToken, startAliases);
    const targetToEnd = scoreAliasToken(targetToken, endAliases);
    const sourceToEnd = scoreAliasToken(sourceToken, endAliases);
    const targetToStart = scoreAliasToken(targetToken, startAliases);
    const forwardScore = sourceToStart && targetToEnd
      ? Math.min(sourceToStart.score, targetToEnd.score)
      : 0;
    const reverseScore = sourceToEnd && targetToStart
      ? Math.min(sourceToEnd.score, targetToStart.score)
      : 0;
    if (forwardScore && (!reverseScore || forwardScore >= reverseScore + 2)) {
      return {
        orientation: 1,
        orientationMatch: 'forward',
        directionResolvedBy: resolvedBy,
        aliasMatchBasis: `source:${sourceToStart.basis}/${sourceToStart.relation}; target:${targetToEnd.basis}/${targetToEnd.relation}`,
        orientationRule: 'dual-alias'
      };
    }
    if (reverseScore && (!forwardScore || reverseScore >= forwardScore + 2)) {
      return {
        orientation: -1,
        orientationMatch: 'reverse',
        directionResolvedBy: resolvedBy,
        aliasMatchBasis: `source:${sourceToEnd.basis}/${sourceToEnd.relation}; target:${targetToStart.basis}/${targetToStart.relation}`,
        orientationRule: 'dual-alias'
      };
    }
    if (forwardScore || reverseScore) {
      return {
        orientation: null,
        orientationMatch: 'unknown',
        directionResolvedBy: resolvedBy,
        aliasMatchBasis: 'conflicting-dual-alias-match',
        orientationRule: 'dual-alias-conflict'
      };
    }

    const sideMatches = [];
    const sourceSide = scoreAliasSide(sourceToken, startAliases, endAliases);
    const targetSide = scoreAliasSide(targetToken, startAliases, endAliases);
    if (sourceSide?.side === 'start') {
      sideMatches.push({
        orientation: 1,
        orientationMatch: 'forward',
        basis: `source:${sourceSide.match.basis}/${sourceSide.match.relation}`,
        rule: 'single-source'
      });
    } else if (sourceSide?.side === 'end') {
      sideMatches.push({
        orientation: -1,
        orientationMatch: 'reverse',
        basis: `source:${sourceSide.match.basis}/${sourceSide.match.relation}`,
        rule: 'single-source'
      });
    }
    if (targetSide?.side === 'end') {
      sideMatches.push({
        orientation: 1,
        orientationMatch: 'forward',
        basis: `target:${targetSide.match.basis}/${targetSide.match.relation}`,
        rule: 'single-target'
      });
    } else if (targetSide?.side === 'start') {
      sideMatches.push({
        orientation: -1,
        orientationMatch: 'reverse',
        basis: `target:${targetSide.match.basis}/${targetSide.match.relation}`,
        rule: 'single-target'
      });
    }
    if (!sideMatches.length) return null;
    const first = sideMatches[0];
    if (sideMatches.every((match) => match.orientation === first.orientation)) {
      return {
        orientation: first.orientation,
        orientationMatch: first.orientationMatch,
        directionResolvedBy: `${resolvedBy}-${[...new Set(sideMatches.map((match) => match.rule))].join('+')}`,
        aliasMatchBasis: sideMatches.map((match) => match.basis).join('; '),
        orientationRule: [...new Set(sideMatches.map((match) => match.rule))].join('+')
      };
    }
    return {
      orientation: null,
      orientationMatch: 'unknown',
      directionResolvedBy: resolvedBy,
      aliasMatchBasis: 'conflicting-single-side-alias-match',
      orientationRule: 'single-side-conflict'
    };
  }

  function resolveMeasuredTerminalSide(row, candidate, startAliases, endAliases) {
    const rowTm = String(row?.tmName || '').trim();
    const rowSide = rowTm ? scoreAliasSide(rowTm, startAliases, endAliases) : null;
    if (rowSide?.side === 'start' || rowSide?.side === 'end') {
      return {
        terminalSide: rowSide.side,
        terminalMatchBasis: `row-tm:${rowSide.match?.basis || 'alias'}/${rowSide.match?.relation || 'match'}`,
        terminalSource: 'row-tm'
      };
    }
    return {
      terminalSide: String(candidate?.terminalSide || candidate?.sourceSide || '').trim(),
      terminalMatchBasis: String(candidate?.terminalMatchBasis || '').trim(),
      terminalSource: 'candidate-meta'
    };
  }

  function collectMeasurementIds(entries) {
    return entries
      .map((entry) => String(entry?.measurementId || entry?.candidate?.measurementId || '').trim())
      .filter(Boolean);
  }

  function candidateSlotRank(entry) {
    const slot = entry?.candidateSlot || entry?.candidate?.candidateSlot || '';
    if (slot === 'primary') return 0;
    if (slot === 'secondary') return 1;
    if (slot === 'extra') return 2;
    return 3;
  }

  function finalizeResolvedHatEntry(entry, options = {}) {
    if (!entry) return null;
    const entries = Array.isArray(options.entries) && options.entries.length ? options.entries : [entry];
    const measurementIds = collectMeasurementIds(entries);
    const selectedMeasurementId = String(entry.measurementId || entry?.candidate?.measurementId || '').trim();
    const selectedSlot = entry.candidateSlot || entry?.candidate?.candidateSlot || '';
    const hadPrimaryCandidate = entries.some((item) => (item.candidateSlot || item?.candidate?.candidateSlot) === 'primary');
    return {
      ...entry,
      value: entry.normalizedValue,
      sourceValue: entry.rawValue,
      flowValue: entry.normalizedValue,
      measurementId: measurementIds.join(',') || String(entry.measurementId || entry?.candidate?.measurementId || '').trim(),
      supportingMeasurementIds: measurementIds,
      sourceAmbiguous: Boolean(options.sourceAmbiguous),
      unresolved: Boolean(options.unresolved),
      unresolvedReason: options.unresolvedReason || '',
      resolvedFromMultiple: Boolean(options.resolvedFromMultiple),
      resolutionMethod: options.resolutionMethod || entry.resolutionMethod || '',
      candidateConflict: Boolean(options.candidateConflict || entry.candidateConflict),
      selectedCandidate: options.selectedCandidate || selectedMeasurementId,
      selectedCandidateReason: options.selectedCandidateReason || entry.selectedCandidateReason || '',
      backupUsed: Boolean(options.backupUsed ?? entry.backupUsed ?? (selectedSlot === 'secondary' && hadPrimaryCandidate)),
      candidateSlot: selectedSlot,
      sourceSide: entry.sourceSide || entry?.candidate?.sourceSide || '',
      targetSide: entry.targetSide || entry?.candidate?.targetSide || '',
      terminalSide: entry.terminalSide || entry?.candidate?.terminalSide || entry.sourceSide || entry?.candidate?.sourceSide || '',
      terminalMatchBasis: entry.terminalMatchBasis || entry?.candidate?.terminalMatchBasis || '',
      polarizationSign: Number.isFinite(Number(entry.polarizationSign ?? entry?.candidate?.polarizationSign))
        ? Number(entry.polarizationSign ?? entry?.candidate?.polarizationSign)
        : null,
      polarizationConsistent: typeof (entry.polarizationConsistent ?? entry?.candidate?.polarizationConsistent) === 'boolean'
        ? Boolean(entry.polarizationConsistent ?? entry?.candidate?.polarizationConsistent)
        : null,
      resolvedTerminalMismatch: Boolean(options.resolvedTerminalMismatch ?? entry.resolvedTerminalMismatch),
      formulaSignApplied: Number.isFinite(Number(entry.formulaSign)) ? Number(entry.formulaSign) : null,
      orientationRule: options.orientationRule || entry.orientationRule || entry.directionResolvedBy || '',
      valueInvalid: Boolean(options.valueInvalid ?? entry.valueInvalid),
      capacityLimit: Number.isFinite(Number(options.capacityLimit ?? entry.capacityLimit)) ? Number(options.capacityLimit ?? entry.capacityLimit) : null,
      capacityFilterPassed: typeof (options.capacityFilterPassed ?? entry.capacityFilterPassed) === 'boolean'
        ? Boolean(options.capacityFilterPassed ?? entry.capacityFilterPassed)
        : null,
      candidateOutcomes: Array.isArray(options.candidateOutcomes) ? options.candidateOutcomes : (Array.isArray(entry.candidateOutcomes) ? entry.candidateOutcomes : [])
    };
  }

  function getLoadingHintValue(entry) {
    if (!entry) return null;
    if (Number.isFinite(Number(entry.loadingHintValue))) return Math.abs(Number(entry.loadingHintValue));
    if (Number.isFinite(Number(entry.normalizedValue))) return Math.abs(Number(entry.normalizedValue));
    return null;
  }

  function getMaxLoadingHint(entries) {
    const hints = (entries || [])
      .map((entry) => getLoadingHintValue(entry))
      .filter((value) => Number.isFinite(value));
    return hints.length ? Math.max(...hints) : null;
  }

  function computeLoadingMagnitude(entityType, resolved) {
    if (entityType === 'hat') {
      const activeMagnitude = getLoadingHintValue(resolved.active);
      const reactiveMagnitude = getLoadingHintValue(resolved.reactive);
      if (Number.isFinite(activeMagnitude)) {
        const reactiveForLoading = Number.isFinite(reactiveMagnitude) ? reactiveMagnitude : 0;
        return Math.sqrt((activeMagnitude ** 2) + (reactiveForLoading ** 2));
      }
      if (Number.isFinite(reactiveMagnitude)) return reactiveMagnitude;
      return null;
    }
    const primaryMetric = resolved.active || resolved.reactive || resolved.voltage || null;
    return getLoadingHintValue(primaryMetric);
  }

  function computeReactiveRatioPct(resolved) {
    const reactiveMagnitude = getLoadingHintValue(resolved?.reactive);
    if (!Number.isFinite(reactiveMagnitude)) return null;
    const activeMagnitude = getLoadingHintValue(resolved?.active);
    if (!Number.isFinite(activeMagnitude) || activeMagnitude < 1) return Infinity;
    return (Math.abs(reactiveMagnitude) / Math.max(Math.abs(activeMagnitude), 1)) * 100;
  }

  function isHatMetricValueInvalid(entity, metricType, normalizedValue) {
    const capacityLimit = getCapacityLimit('hat', entity);
    if (!Number.isFinite(capacityLimit) || !Number.isFinite(normalizedValue)) return false;
    if (metricType !== 'active' && metricType !== 'reactive') return false;
    return Math.abs(normalizedValue) > capacityLimit;
  }

  function buildHatCandidateOutcome(entry, selectedIds = new Set()) {
    const measurementId = String(entry?.candidate?.measurementId || entry?.measurementId || '').trim();
    return {
      measurementId,
      formulaRaw: entry?.candidate?.formulaRaw || '',
      rawValue: Number.isFinite(Number(entry?.rawValue)) ? Number(entry.rawValue) : null,
      normalizedValue: Number.isFinite(Number(entry?.normalizedValue)) ? Number(entry.normalizedValue) : null,
      timestamp: entry?.timestamp || null,
      terminalSide: entry?.terminalSide || entry?.sourceSide || '',
      terminalMatchBasis: entry?.terminalMatchBasis || '',
      candidateSlot: entry?.candidateSlot || '',
      selected: selectedIds.has(measurementId),
      valueInvalid: Boolean(entry?.valueInvalid),
      capacityLimit: Number.isFinite(Number(entry?.capacityLimit)) ? Number(entry.capacityLimit) : null,
      capacityFilterPassed: typeof entry?.capacityFilterPassed === 'boolean' ? Boolean(entry.capacityFilterPassed) : null,
      resolvedTerminalMismatch: Boolean(entry?.resolvedTerminalMismatch)
    };
  }

  function buildHatCandidateOutcomeList(entries, selectedMeasurementId) {
    const selectedIds = new Set(String(selectedMeasurementId || '').split(',').map((id) => id.trim()).filter(Boolean));
    return (entries || []).map((entry) => buildHatCandidateOutcome(entry, selectedIds));
  }

  function getHatSelectionReason(key, context = {}) {
    const capacityFiltered = Boolean(context.capacityFiltered);
    switch (key) {
      case 'single-candidate':
        return capacityFiltered ? 'Kapasite filtresini gecen tek aday oldugu icin secildi.' : 'Tek gecerli aday oldugu icin secildi.';
      case 'latest-terminal':
        return capacityFiltered ? 'Kapasite filtresini gecen en yeni aday secildi.' : 'En yeni aday secildi.';
      case 'same-value':
        return 'Adaylar ayni degeri verdigi icin secildi.';
      case 'tolerance-primary':
        return 'Adaylar tolerans icinde oldugu icin primary aday secildi.';
      case 'primary-conflict':
        return 'Adaylar tolerans disi oldugu icin primary/start adayi tercih edildi.';
      case 'invalid-value':
        return 'Tum adaylar 1.5x kapasite sinirini gectigi icin secim yapilmadi.';
      case 'orientation-unknown':
        return 'Adaylar icin guvenilir yon normalize edilemedi.';
      default:
        return '';
    }
  }

  function computeHatDisplayMetrics(modeConfig, resolved, loadingPct) {
    if (modeConfig.primaryMetric === 'reactive') {
      const ratioPct = computeReactiveRatioPct(resolved);
      if (!Number.isFinite(ratioPct)) {
        return {
          displayPct: null,
          displayPctRaw: ratioPct,
          displayPctMode: 'reactive-ratio',
          invalidPct: true
        };
      }
      return {
        displayPct: ratioPct,
        displayPctRaw: ratioPct,
        displayPctMode: 'reactive-ratio',
        invalidPct: ratioPct > INVALID_DISPLAY_THRESHOLD
      };
    }
    return {
      displayPct: Number.isFinite(loadingPct) ? loadingPct : null,
      displayPctRaw: Number.isFinite(loadingPct) ? loadingPct : null,
      displayPctMode: 'loading',
      invalidPct: Number.isFinite(loadingPct) && loadingPct > INVALID_DISPLAY_THRESHOLD
    };
  }

  function resolveHatMetricByTolerance(entity, entries) {
    const values = entries
      .map((entry) => Number(entry.normalizedValue))
      .filter((value) => Number.isFinite(value));
    if (!values.length || !sameMetricDirection(values)) return null;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    if ((maxValue - minValue) > getHatResolutionTolerance(entity)) return null;
    const candidateMean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const primary = entries.slice().sort((left, right) => {
      const slotDiff = candidateSlotRank(left) - candidateSlotRank(right);
      if (slotDiff !== 0) return slotDiff;
      const timeDiff = Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0);
      if (timeDiff !== 0) return timeDiff;
      const idLeft = String(left.measurementId || '');
      const idRight = String(right.measurementId || '');
      return idLeft.localeCompare(idRight);
    })[0];
    return finalizeResolvedHatEntry({
      ...primary,
      normalizedValue: primary.normalizedValue,
      directionValue: primary.directionValue != null ? primary.directionValue : primary.normalizedValue,
      loadingHintValue: Math.abs(primary.normalizedValue),
      candidateMean
    }, {
      entries,
      sourceAmbiguous: false,
      unresolved: false,
      resolvedFromMultiple: entries.length > 1,
      resolutionMethod: 'tolerance-primary',
      selectedCandidateReason: getHatSelectionReason('tolerance-primary')
    });
  }

  function pickHatUnresolvedReason(entries) {
    const priority = ['polarization-mismatch', 'source-side-unknown', 'orientation-unknown', 'ambiguous-live'];
    for (const reason of priority) {
      if ((entries || []).some((entry) => entry?.unresolvedReason === reason)) return reason;
    }
    return 'orientation-unknown';
  }

  function resolveHatMetric(entity, metricType, candidates) {
    const startAliases = buildTmAliasEntries(entity.startTmRef, entity.startTm || '');
    const endAliases = buildTmAliasEntries(entity.endTmRef, entity.endTm || '');
    const oriented = candidates.map(({ candidate, row }) => {
      const formula = Array.isArray(candidate.formulaParts) ? candidate.formulaParts.find((part) => part?.parsed) : null;
      const sign = Number(formula?.sign ?? candidate?.formulaSign);
      const rawValue = Number(row.value);
      const measuredTerminal = resolveMeasuredTerminalSide(row, candidate, startAliases, endAliases);
      const terminalSide = measuredTerminal.terminalSide;
      const terminalMatchBasis = measuredTerminal.terminalMatchBasis;
      const candidatePolarizationSign = terminalSide === 'start'
        ? 1
        : terminalSide === 'end'
          ? -1
          : null;
      const explicitConsistency = typeof candidate?.polarizationConsistent === 'boolean'
        ? Boolean(candidate.polarizationConsistent)
        : null;
      const hasTerminalMetadata = Boolean(terminalSide || terminalMatchBasis || Number.isFinite(candidatePolarizationSign));
      let normalizedValue = null;
      let directionValue = null;
      let directionResolvedBy = '';
      let orientationMatch = 'unknown';
      let aliasMatchBasis = terminalMatchBasis || '';
      let orientationRule = '';
      let unresolvedReason = '';
      let resolvedTerminalMismatch = false;

      if (Number.isFinite(rawValue) && hasTerminalMetadata) {
        if (terminalSide !== 'start' && terminalSide !== 'end') {
          unresolvedReason = 'source-side-unknown';
        } else {
          const polarizationConsistent = explicitConsistency === false
            ? false
            : explicitConsistency === true
              ? true
              : Number.isFinite(candidatePolarizationSign) && Number.isFinite(sign)
                ? sign === candidatePolarizationSign
                : true;
          if (Number.isFinite(candidatePolarizationSign)) {
            normalizedValue = rawValue * candidatePolarizationSign;
            directionValue = normalizedValue;
            directionResolvedBy = 'terminal-exit-model';
            orientationMatch = normalizedValue >= 0 ? 'forward' : 'reverse';
            orientationRule = 'terminal-exit-model';
            resolvedTerminalMismatch = polarizationConsistent === false;
          } else {
            unresolvedReason = 'source-side-unknown';
          }
        }
      }

      if (Number.isFinite(rawValue) && !Number.isFinite(normalizedValue) && !hasTerminalMetadata) {
        const candidateSideOrientation = resolveOrientationByCandidateSides(candidate);
        const formulaOrientation = (formula?.stationCode || formula?.targetCode)
          ? resolveOrientationByAlias(
            formula?.stationCode || '',
            formula?.targetCode || '',
            startAliases,
            endAliases,
            'formula-alias'
          )
          : null;
        const rowOrientation = resolveOrientationByAlias(
          row.tmName || '',
          row.remoteName || '',
          startAliases,
          endAliases,
          'row-alias'
        );
        const chosenOrientation = formulaOrientation?.orientation
          ? formulaOrientation
          : candidateSideOrientation?.orientation
            ? candidateSideOrientation
            : rowOrientation?.orientation
              ? rowOrientation
              : formulaOrientation || candidateSideOrientation || rowOrientation || {
                orientation: null,
                orientationMatch: 'unknown',
                directionResolvedBy: '',
                aliasMatchBasis: '',
                orientationRule: ''
              };
        const orientationSign = chosenOrientation.orientation === -1 || chosenOrientation.orientation === 1
          ? chosenOrientation.orientation
          : null;
        if (orientationSign != null) {
          normalizedValue = rawValue * (Number.isFinite(sign) ? sign : 1) * orientationSign;
          directionValue = normalizedValue;
          directionResolvedBy = chosenOrientation.directionResolvedBy || '';
          orientationMatch = chosenOrientation.orientationMatch || 'unknown';
          aliasMatchBasis = chosenOrientation.aliasMatchBasis || '';
          orientationRule = chosenOrientation.orientationRule || chosenOrientation.directionResolvedBy || '';
        } else if (!unresolvedReason) {
          unresolvedReason = 'orientation-unknown';
        }
      } else if (!Number.isFinite(rawValue) && !unresolvedReason) {
        unresolvedReason = 'missing-source-row';
      }

      const loadingHintValue = Number.isFinite(rawValue)
        ? Math.abs(rawValue * (Number.isFinite(sign) ? sign : 1))
        : null;
      const capacityLimit = getCapacityLimit('hat', entity);
      const valueInvalid = isHatMetricValueInvalid(entity, metricType, normalizedValue);
      return {
        candidate,
        row,
        metricType,
        timestamp: row.timestamp,
        rawValue,
        normalizedValue,
        loadingHintValue,
        directionValue,
        formulaSign: Number.isFinite(sign) ? sign : null,
        candidateSlot: candidate?.candidateSlot || '',
        sourceSide: candidate?.sourceSide || '',
        targetSide: candidate?.targetSide || '',
        terminalSide,
        terminalMatchBasis,
        polarizationSign: Number.isFinite(candidatePolarizationSign) ? candidatePolarizationSign : null,
        polarizationConsistent: explicitConsistency,
        selectedCandidate: String(candidate?.measurementId || ''),
        formulaSignApplied: Number.isFinite(sign) ? sign : null,
        directionResolvedBy,
        orientationMatch,
        aliasMatchBasis,
        orientationRule,
        unresolvedReason,
        orientationUnknown: !Number.isFinite(normalizedValue),
        resolvedTerminalMismatch,
        valueInvalid,
        capacityLimit,
        capacityFilterPassed: metricType === 'active' ? !valueInvalid : null
      };
    }).sort((left, right) => Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0));

    if (!oriented.length) return null;
    const directionResolved = oriented.filter((entry) => Number.isFinite(entry.normalizedValue));
    if (!directionResolved.length) {
      const unresolved = finalizeResolvedHatEntry({
        ...oriented[0],
        normalizedValue: null,
        directionValue: null,
        loadingHintValue: getMaxLoadingHint(oriented)
      }, {
        entries: oriented,
        sourceAmbiguous: false,
        unresolved: true,
        unresolvedReason: pickHatUnresolvedReason(oriented),
        resolvedFromMultiple: oriented.length > 1,
        resolutionMethod: pickHatUnresolvedReason(oriented),
        selectedCandidateReason: getHatSelectionReason('orientation-unknown')
      });
      unresolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, unresolved.selectedCandidate);
      return unresolved;
    }

    const capacityFiltered = metricType === 'active'
      ? directionResolved.filter((entry) => entry.capacityFilterPassed !== false)
      : directionResolved.slice();
    const filteredOutByCapacity = metricType === 'active'
      ? directionResolved.filter((entry) => entry.capacityFilterPassed === false)
      : [];
    const selectable = capacityFiltered.length ? capacityFiltered : directionResolved;

    if (metricType === 'active' && !capacityFiltered.length) {
      const newestInvalid = selectable[0];
      const invalidResolved = finalizeResolvedHatEntry(newestInvalid, {
        entries: oriented,
        sourceAmbiguous: false,
        unresolved: false,
        resolvedFromMultiple: oriented.length > 1,
        resolutionMethod: 'invalid-value',
        selectedCandidateReason: getHatSelectionReason('invalid-value'),
        valueInvalid: true,
        capacityLimit: newestInvalid.capacityLimit,
        capacityFilterPassed: false,
        orientationRule: newestInvalid.orientationRule || newestInvalid.directionResolvedBy || '',
        resolvedTerminalMismatch: newestInvalid.resolvedTerminalMismatch
      });
      invalidResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, invalidResolved.selectedCandidate);
      return invalidResolved;
    }

    if (selectable.length === 1) {
      const singleResolved = finalizeResolvedHatEntry(selectable[0], {
        entries: oriented,
        sourceAmbiguous: false,
        unresolved: false,
        resolvedFromMultiple: oriented.length > 1,
        resolutionMethod: oriented.length > 1 ? 'latest-terminal' : 'single-candidate',
        selectedCandidateReason: getHatSelectionReason(oriented.length > 1 ? 'latest-terminal' : 'single-candidate', {
          capacityFiltered: filteredOutByCapacity.length > 0
        }),
        resolvedTerminalMismatch: selectable[0].resolvedTerminalMismatch
      });
      singleResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, singleResolved.selectedCandidate);
      return singleResolved;
    }

    const newest = selectable.filter((entry) => sameTimestamp(entry, selectable[0]));
    if (newest.length === 1) {
      const latestResolved = finalizeResolvedHatEntry(newest[0], {
        entries: oriented,
        sourceAmbiguous: false,
        unresolved: false,
        resolvedFromMultiple: selectable.length > 1,
        resolutionMethod: selectable.length > 1 ? 'latest-terminal' : 'single-candidate',
        selectedCandidateReason: getHatSelectionReason(selectable.length > 1 ? 'latest-terminal' : 'single-candidate', {
          capacityFiltered: filteredOutByCapacity.length > 0
        }),
        resolvedTerminalMismatch: newest[0].resolvedTerminalMismatch
      });
      latestResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, latestResolved.selectedCandidate);
      return latestResolved;
    }

    const distinctValues = new Set(newest.map((entry) => String(roundMetricValue(entry.normalizedValue))));
    if (distinctValues.size === 1) {
      const sameValueResolved = finalizeResolvedHatEntry(newest[0], {
        entries: newest,
        sourceAmbiguous: false,
        unresolved: false,
        resolvedFromMultiple: newest.length > 1,
        resolutionMethod: 'same-value',
        selectedCandidateReason: getHatSelectionReason('same-value'),
        resolvedTerminalMismatch: newest[0].resolvedTerminalMismatch
      });
      sameValueResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, sameValueResolved.selectedCandidate);
      return sameValueResolved;
    }
    const toleranceResolved = resolveHatMetricByTolerance(entity, newest);
    if (toleranceResolved) {
      toleranceResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, toleranceResolved.selectedCandidate);
      return toleranceResolved;
    }
    if (newest.some((entry) => candidateSlotRank(entry) < 3)) {
      const selected = newest.slice().sort((left, right) => {
        const slotDiff = candidateSlotRank(left) - candidateSlotRank(right);
        if (slotDiff !== 0) return slotDiff;
        return Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0);
      })[0];
      const conflictResolved = finalizeResolvedHatEntry(selected, {
        entries: newest,
        sourceAmbiguous: false,
        unresolved: false,
        resolvedFromMultiple: newest.length > 1,
        resolutionMethod: 'primary-conflict',
        candidateConflict: true,
        backupUsed: candidateSlotRank(selected) > 0 && newest.some((entry) => candidateSlotRank(entry) === 0),
        orientationRule: selected.orientationRule || selected.directionResolvedBy || '',
        selectedCandidateReason: getHatSelectionReason('primary-conflict'),
        resolvedTerminalMismatch: selected.resolvedTerminalMismatch
      });
      conflictResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, conflictResolved.selectedCandidate);
      return conflictResolved;
    }
    const ambiguousResolved = finalizeResolvedHatEntry({
      ...newest[0],
      normalizedValue: null,
      directionValue: null,
      loadingHintValue: getMaxLoadingHint(newest)
    }, {
      entries: newest,
      sourceAmbiguous: true,
      unresolved: true,
      unresolvedReason: 'ambiguous-live',
      resolvedFromMultiple: newest.length > 1,
      resolutionMethod: 'ambiguous-live',
      selectedCandidateReason: 'Adaylar birbiriyle celistigi icin guvenilir secim yapilamadi.'
    });
    ambiguousResolved.candidateOutcomes = buildHatCandidateOutcomeList(oriented, ambiguousResolved.selectedCandidate);
    return ambiguousResolved;
  }

  function resolveNodeMetric(candidates) {
    const sorted = candidates.map(({ candidate, row }) => ({
      candidate,
      row,
      timestamp: row.timestamp,
      normalizedValue: Number(row.value),
      value: Number(row.value),
      rawValue: Number(row.value),
      sourceValue: Number(row.value),
      flowValue: Number(row.value),
      measurementId: String(candidate?.measurementId || '')
    })).sort((left, right) => {
      const tsDiff = Number(right.timestamp?.getTime?.() || 0) - Number(left.timestamp?.getTime?.() || 0);
      if (tsDiff !== 0) return tsDiff;
      return Math.abs(right.normalizedValue) - Math.abs(left.normalizedValue);
    });
    if (!sorted.length) return null;
    return { ...sorted[0], sourceAmbiguous: sorted.length > 1 };
  }

  function resolveMetricCandidate(entityType, entity, metricType, measurementRowsById) {
    const rows = Array.isArray(entity?.scada?.[metricType]?.rows) ? entity.scada[metricType].rows : [];
    const elementName = metricType === 'active' ? 'P' : (metricType === 'reactive' ? 'Q' : 'U');
    const present = rows.map((candidate) => {
      const id = String(candidate.measurementId || '');
      return {
        candidate,
        row: measurementRowsById.get(`${id}|${elementName}`) || measurementRowsById.get(id)
      };
    }).filter((entry) => entry.row);
    if (!present.length) return null;
    return entityType === 'hat'
      ? resolveHatMetric(entity, metricType, present)
      : resolveNodeMetric(present);
  }

  function getResolvedMeasurementId(resolved) {
    if (!resolved) return '';
    const explicitId = String(resolved.measurementId || '').trim();
    if (explicitId) return explicitId;
    return String(resolved?.candidate?.measurementId || '').trim();
  }

  function getMetricDebugFields(resolved) {
    if (!resolved) return {};
    return {
      candidateSlot: resolved.candidateSlot || resolved?.candidate?.candidateSlot || '',
      sourceSide: resolved.sourceSide || resolved?.candidate?.sourceSide || '',
      targetSide: resolved.targetSide || resolved?.candidate?.targetSide || '',
      terminalSide: resolved.terminalSide || resolved?.candidate?.terminalSide || resolved.sourceSide || resolved?.candidate?.sourceSide || '',
      terminalMatchBasis: resolved.terminalMatchBasis || resolved?.candidate?.terminalMatchBasis || '',
      polarizationSign: Number.isFinite(Number(resolved.polarizationSign ?? resolved?.candidate?.polarizationSign))
        ? Number(resolved.polarizationSign ?? resolved?.candidate?.polarizationSign)
        : null,
      polarizationConsistent: typeof (resolved.polarizationConsistent ?? resolved?.candidate?.polarizationConsistent) === 'boolean'
        ? Boolean(resolved.polarizationConsistent ?? resolved?.candidate?.polarizationConsistent)
        : null,
      selectedCandidate: resolved.selectedCandidate || String(resolved?.candidate?.measurementId || ''),
      selectedCandidateReason: resolved.selectedCandidateReason || '',
      backupUsed: Boolean(resolved.backupUsed),
      formulaSignApplied: Number.isFinite(Number(resolved.formulaSignApplied))
        ? Number(resolved.formulaSignApplied)
        : Number.isFinite(Number(resolved.formulaSign))
          ? Number(resolved.formulaSign)
          : null,
      orientationRule: resolved.orientationRule || resolved.directionResolvedBy || '',
      candidateConflict: Boolean(resolved.candidateConflict),
      resolvedTerminalMismatch: Boolean(resolved.resolvedTerminalMismatch),
      valueInvalid: Boolean(resolved.valueInvalid),
      capacityLimit: Number.isFinite(Number(resolved.capacityLimit)) ? Number(resolved.capacityLimit) : null,
      capacityFilterPassed: typeof resolved.capacityFilterPassed === 'boolean' ? Boolean(resolved.capacityFilterPassed) : null,
      candidateOutcomes: Array.isArray(resolved.candidateOutcomes) ? resolved.candidateOutcomes : []
    };
  }

  function buildMetricCandidateDetails(entity, metricType, measurementRowsById, resolvedMetric) {
    const rows = Array.isArray(entity?.scada?.[metricType]?.rows) ? entity.scada[metricType].rows : [];
    const selectedIds = new Set(String(resolvedMetric?.selectedCandidate || '').split(',').map((id) => id.trim()).filter(Boolean));
    const seenKeys = new Set();
    return rows.reduce((list, candidate) => {
      const measurementId = String(candidate?.measurementId || '').trim();
      const key = `${measurementId}|${metricType}`;
      if (!measurementId || seenKeys.has(key)) return list;
      seenKeys.add(key);
      const sourceRow = measurementRowsById.get(measurementId);
      const outcome = Array.isArray(resolvedMetric?.candidateOutcomes)
        ? resolvedMetric.candidateOutcomes.find((entry) => String(entry.measurementId || '').trim() === measurementId)
        : null;
      list.push({
        metricType,
        measurementId,
        formulaRaw: candidate?.formulaRaw || '',
        rawValue: Number.isFinite(Number(sourceRow?.value)) ? Number(sourceRow.value) : null,
        normalizedValue: Number.isFinite(Number(outcome?.normalizedValue)) ? Number(outcome.normalizedValue) : null,
        timestamp: sourceRow?.timestamp || null,
        terminalSide: outcome?.terminalSide || candidate?.terminalSide || candidate?.sourceSide || '',
        selected: selectedIds.has(measurementId),
        capacityLimit: Number.isFinite(Number(outcome?.capacityLimit)) ? Number(outcome.capacityLimit) : null,
        capacityFilterPassed: typeof outcome?.capacityFilterPassed === 'boolean' ? Boolean(outcome.capacityFilterPassed) : null,
        valueInvalid: Boolean(outcome?.valueInvalid)
      });
      return list;
    }, []);
  }

  function buildEntityMetricRecord(entityType, entity, modeConfig, measurementRowsById) {
    const resolved = {
      active: entityType !== 'bara' ? resolveMetricCandidate(entityType, entity, 'active', measurementRowsById) : null,
      reactive: entityType !== 'bara' ? resolveMetricCandidate(entityType, entity, 'reactive', measurementRowsById) : null,
      voltage: entityType === 'bara' ? resolveMetricCandidate(entityType, entity, 'voltage', measurementRowsById) : null
    };
    const primaryMetric = resolved[modeConfig.primaryMetric];
    const primaryTimestamp = primaryMetric?.timestamp || resolved.active?.timestamp || resolved.reactive?.timestamp || resolved.voltage?.timestamp || null;
    const primaryStaleState = getStaleState(primaryTimestamp);
    const capacityMva = getCapacityMva(entityType, entity);
    const primaryValue = primaryMetric?.normalizedValue;
    const loadingMagnitude = capacityMva
      ? computeLoadingMagnitude(entityType, resolved)
      : null;
    const loadingPct = capacityMva && Number.isFinite(loadingMagnitude)
      ? (loadingMagnitude / capacityMva) * 100
      : null;
    const displayMetrics = entityType === 'hat'
      ? computeHatDisplayMetrics(modeConfig, resolved, loadingPct)
      : {
        displayPct: Number.isFinite(loadingPct) ? loadingPct : null,
        displayPctRaw: Number.isFinite(loadingPct) ? loadingPct : null,
        displayPctMode: 'loading',
        invalidPct: Number.isFinite(loadingPct) && loadingPct > INVALID_DISPLAY_THRESHOLD
      };
    const statusKey = primaryMetric?.sourceAmbiguous
      ? 'ambiguous'
      : primaryStaleState;
    const record = {
      entityType,
      entityId: entity.id,
      entityKey: `${entityType}:${entity.id}`,
      entity,
      active: resolved.active ? {
        value: resolved.active.normalizedValue,
        rawValue: Number.isFinite(Number(resolved.active.rawValue)) ? Number(resolved.active.rawValue) : null,
        measurementId: getResolvedMeasurementId(resolved.active),
        timestamp: resolved.active.timestamp,
        sourceTm: resolved.active.row.tmName,
        sourceRemote: resolved.active.row.remoteName,
        sourceAmbiguous: Boolean(resolved.active.sourceAmbiguous),
        resolvedFromMultiple: Boolean(resolved.active.resolvedFromMultiple),
        resolutionMethod: resolved.active.resolutionMethod || '',
        unresolvedReason: resolved.active.unresolvedReason || '',
        directionResolvedBy: resolved.active.directionResolvedBy || '',
        orientationMatch: resolved.active.orientationMatch || 'unknown',
        aliasMatchBasis: resolved.active.aliasMatchBasis || '',
        formulaSign: Number.isFinite(Number(resolved.active.formulaSign)) ? Number(resolved.active.formulaSign) : null,
        loadingHintValue: getLoadingHintValue(resolved.active),
        valueInvalid: Boolean(resolved.active.valueInvalid),
        ...getMetricDebugFields(resolved.active)
      } : null,
      reactive: resolved.reactive ? {
        value: resolved.reactive.normalizedValue,
        rawValue: Number.isFinite(Number(resolved.reactive.rawValue)) ? Number(resolved.reactive.rawValue) : null,
        measurementId: getResolvedMeasurementId(resolved.reactive),
        timestamp: resolved.reactive.timestamp,
        sourceTm: resolved.reactive.row.tmName,
        sourceRemote: resolved.reactive.row.remoteName,
        sourceAmbiguous: Boolean(resolved.reactive.sourceAmbiguous),
        resolvedFromMultiple: Boolean(resolved.reactive.resolvedFromMultiple),
        resolutionMethod: resolved.reactive.resolutionMethod || '',
        unresolvedReason: resolved.reactive.unresolvedReason || '',
        directionResolvedBy: resolved.reactive.directionResolvedBy || '',
        orientationMatch: resolved.reactive.orientationMatch || 'unknown',
        aliasMatchBasis: resolved.reactive.aliasMatchBasis || '',
        formulaSign: Number.isFinite(Number(resolved.reactive.formulaSign)) ? Number(resolved.reactive.formulaSign) : null,
        loadingHintValue: getLoadingHintValue(resolved.reactive),
        valueInvalid: Boolean(resolved.reactive.valueInvalid),
        ...getMetricDebugFields(resolved.reactive)
      } : null,
      voltage: resolved.voltage ? {
        value: resolved.voltage.normalizedValue,
        measurementId: getResolvedMeasurementId(resolved.voltage),
        timestamp: resolved.voltage.timestamp,
        sourceTm: resolved.voltage.row.tmName,
        sourceRemote: resolved.voltage.row.remoteName,
        sourceAmbiguous: Boolean(resolved.voltage.sourceAmbiguous),
        resolutionMethod: resolved.voltage.resolutionMethod || '',
        unresolvedReason: resolved.voltage.unresolvedReason || '',
        directionResolvedBy: resolved.voltage.directionResolvedBy || '',
        orientationMatch: resolved.voltage.orientationMatch || 'unknown',
        aliasMatchBasis: resolved.voltage.aliasMatchBasis || '',
        formulaSign: Number.isFinite(Number(resolved.voltage.formulaSign)) ? Number(resolved.voltage.formulaSign) : null,
        loadingHintValue: getLoadingHintValue(resolved.voltage),
        ...getMetricDebugFields(resolved.voltage)
      } : null,
      primaryMetric: modeConfig.primaryMetric,
      primaryValue,
      primaryMeasurementId: getResolvedMeasurementId(primaryMetric),
      primaryTimestamp,
      primaryStaleState,
      primaryStatusText: STATUS_TEXT[statusKey] || STATUS_TEXT.live,
      sourceAmbiguous: Boolean(primaryMetric?.sourceAmbiguous),
      unresolved: Boolean(primaryMetric?.unresolved),
      unresolvedReason: primaryMetric?.unresolvedReason || '',
      resolvedFromMultiple: Boolean(primaryMetric?.resolvedFromMultiple),
      resolutionMethod: primaryMetric?.resolutionMethod || '',
      directionMetric: modeConfig.primaryMetric,
      directionModel: entityType === 'hat' ? (primaryMetric?.directionResolvedBy === 'terminal-exit-model' ? 'terminal-exit-model' : primaryMetric?.directionResolvedBy === 'terminal-polarity' ? 'terminal-polarity' : 'legacy-alias') : '',
      directionValue: Number.isFinite(primaryMetric?.directionValue) ? primaryMetric.directionValue : primaryValue,
      directionResolvedBy: primaryMetric?.directionResolvedBy || '',
      orientationMatch: primaryMetric?.orientationMatch || 'unknown',
      aliasMatchBasis: primaryMetric?.aliasMatchBasis || '',
      formulaSign: Number.isFinite(Number(primaryMetric?.formulaSign)) ? Number(primaryMetric.formulaSign) : null,
      ...getMetricDebugFields(primaryMetric),
      capacityMva,
      loadingMagnitude,
      loadingPct,
      displayPct: displayMetrics.displayPct,
      displayPctRaw: displayMetrics.displayPctRaw,
      displayPctMode: displayMetrics.displayPctMode,
      invalidPct: Boolean(displayMetrics.invalidPct),
      timeState: primaryStaleState,
      timeStateLabel: STATUS_TEXT[primaryStaleState] || STATUS_TEXT.live,
      ageLabel: getAgeLabel(primaryTimestamp)
    };
    const uncertaintyMeta = entityType === 'hat' ? buildHatUncertaintyMeta(record) : { label: '', shortTooltip: '', detailLines: [], reasons: [] };
    record.uncertaintyReason = uncertaintyMeta.reasons[0] || '';
    record.uncertaintyLabel = uncertaintyMeta.label;
    record.uncertaintyTooltip = uncertaintyMeta.shortTooltip;
    record.uncertaintyDetails = uncertaintyMeta.detailLines;
    record.resolutionClass = entityType === 'hat' ? getHatResolutionClass(record) : '';
    record.displayColor = getDisplayColor(record);
    record.valueInvalid = Boolean(primaryMetric?.valueInvalid);
    record.capacityLimit = Number.isFinite(Number(primaryMetric?.capacityLimit)) ? Number(primaryMetric.capacityLimit) : getCapacityLimit(entityType, entity);
    record.capacityFilterPassed = typeof primaryMetric?.capacityFilterPassed === 'boolean' ? Boolean(primaryMetric.capacityFilterPassed) : null;
    if (record.active) record.active.candidateDetails = buildMetricCandidateDetails(entity, 'active', measurementRowsById, resolved.active);
    if (record.reactive) record.reactive.candidateDetails = buildMetricCandidateDetails(entity, 'reactive', measurementRowsById, resolved.reactive);
    return record;
  }

  function pushMetricHistory(entityKey, record) {
    if (!record.primaryTimestamp) return;
    const history = state.scada.history.get(entityKey) || [];
    history.push({
      ts: record.primaryTimestamp,
      active: record.active?.value ?? null,
      reactive: record.reactive?.value ?? null,
      voltage: record.voltage?.value ?? null,
      pct: Number.isFinite(record.loadingPct) ? record.loadingPct : null
    });
    while (history.length > SCADA_CONFIG.HISTORY_MAX) history.shift();
    state.scada.history.set(entityKey, history);
  }

  function rebuildLineFlowMap(modeConfig, metricMap) {
    const next = new Map();
    if (modeConfig.domain !== 'hat') {
      state.scada.lineFlowByLineId = next;
      return next;
    }
    metricMap.forEach((record) => {
      if (record.entityType !== 'hat') return;
      if (!Number.isFinite(record.primaryValue)) return;
      if (record.primaryStaleState === 'dead') return;
      if (record.sourceAmbiguous || record.unresolved || record.candidateConflict || record.backupUsed) return;
      const direction = getHatFlowDirection(record);
      if (direction === 'unknown') return;
      const value = record.primaryValue;
      const displayPct = Number.isFinite(record.displayPct) ? record.displayPct : null;
      const loadingPct = Number.isFinite(record.loadingPct) ? record.loadingPct : null;
      next.set(record.entityId, {
        mw: Number.isFinite(record.active?.value) ? record.active.value : 0,
        mvar: Number.isFinite(record.reactive?.value) ? record.reactive.value : 0,
        primaryValue: value,
        primaryUnit: getMetricUnit(modeConfig.primaryMetric),
        loadingPct,
        displayPct,
        displayPctMode: record.displayPctMode || 'loading',
        invalidPct: Boolean(record.invalidPct),
        capacityMva: Number.isFinite(record.capacityMva) ? record.capacityMva : null,
        direction,
        directionMetric: record.directionMetric || modeConfig.primaryMetric,
        directionValue: Number.isFinite(record.directionValue) ? record.directionValue : value,
        directionResolvedBy: record.directionResolvedBy || '',
        orientationMatch: record.orientationMatch || 'unknown',
        aliasMatchBasis: record.aliasMatchBasis || '',
        terminalSide: record.terminalSide || '',
        terminalMatchBasis: record.terminalMatchBasis || '',
        polarizationSign: Number.isFinite(Number(record.polarizationSign)) ? Number(record.polarizationSign) : null,
        resolvedTerminalMismatch: Boolean(record.resolvedTerminalMismatch),
        resolutionClass: record.resolutionClass || getHatResolutionClass(record),
        candidateConflict: Boolean(record.candidateConflict),
        backupUsed: Boolean(record.backupUsed),
        orientationRule: record.orientationRule || '',
        staleState: record.primaryStaleState,
        color: getDisplayColor(record),
        width: getFlowWidth(Number.isFinite(displayPct) ? displayPct : 0),
        timestamp: record.primaryTimestamp,
        hatName: record.entity.name || '',
        hatKv: record.entity.kvBucket || record.entity.kv || '',
        hatLengthKm: record.entity.lengthKm || 0,
        hatId: record.entity.id,
        sinsid: record.primaryMeasurementId,
        isMock: SCADA_CONFIG.MOCK_ENABLED,
        unavailable: false
      });
    });
    state.scada.lineFlowByLineId = next;
    return next;
  }

  function buildVisibleSummary(scope, metricMap) {
    const summary = {
      total: scope.entities.length,
      matched: 0,
      stale: 0,
      delayed: 0,
      dead: 0,
      unmatched: 0,
      ambiguousLive: 0,
      orientationUnknown: 0,
      resolvedWithWarning: 0,
      updatedAt: state.scada.lastDataTimestamp,
      filterKey: scope.filterKey,
      metricMode: scope.mode
    };
    scope.entities.forEach((entity) => {
      const record = metricMap.get(`${scope.domain === 'bara' ? 'bara' : scope.domain}:${entity.id}`);
      if (!record) {
        summary.unmatched += 1;
        return;
      }
      if (hasHatUncertainty(record, { assumeHat: scope.domain === 'hat' }) || record.invalidPct) {
        summary.ambiguousLive += 1;
        if (record.unresolvedReason === 'orientation-unknown'
          || record.unresolvedReason === 'source-side-unknown'
          || record.unresolvedReason === 'polarization-mismatch') {
          summary.orientationUnknown += 1;
        }
        return;
      }
      if (record.resolvedTerminalMismatch) {
        summary.resolvedWithWarning += 1;
      }
      if (!Number.isFinite(record.primaryValue)) {
        summary.unmatched += 1;
        return;
      }
      if (record.primaryStaleState === 'dead') {
        summary.stale += 1;
        summary.dead += 1;
        return;
      }
      if (record.primaryStaleState === 'warn') {
        summary.stale += 1;
        summary.delayed += 1;
        return;
      }
      summary.matched += 1;
    });
    state.scada.visibleSummary = summary;
    return summary;
  }

  function applyGenericScadaSnapshot(measurementRowsById, scope) {
    const modeConfig = getModeConfig(scope.mode);
    const metricMap = new Map();
    let newestTimestamp = null;
    scope.entities.forEach((entity) => {
      const entityType = modeConfig.domain === 'bara' ? 'bara' : modeConfig.domain;
      const record = buildEntityMetricRecord(entityType, entity, modeConfig, measurementRowsById);
      metricMap.set(record.entityKey, record);
      pushMetricHistory(record.entityKey, record);
      if (record.primaryTimestamp && (!newestTimestamp || record.primaryTimestamp > newestTimestamp)) {
        newestTimestamp = record.primaryTimestamp;
      }
    });

    state.scada.entityMetricsByKey = metricMap;
    state.scada.measurementRowsById = measurementRowsById;
    state.scada.rowsBySinsid = measurementRowsById;
    state.scada.totalRows = measurementRowsById.size;
    state.scada.lastDataTimestamp = newestTimestamp;
    state.scada.currentScope = scope;
    rebuildLineFlowMap(modeConfig, metricMap);
    const visibleSummary = buildVisibleSummary(scope, metricMap);
    state.scada.matchedLines = visibleSummary.matched;
    state.scada.unmatchedRows = visibleSummary.unmatched;
    state.scada.staleCount = visibleSummary.stale;
    state.scada.ambiguousRows = [...metricMap.values()].filter((record) => hasHatUncertainty(record) || record.invalidPct).map((record) => ({
      type: record.valueInvalid ? 'invalid-value' : (record.candidateConflict || record.backupUsed ? 'ambiguous-warning' : (record.unresolvedReason || record.uncertaintyReason || 'ambiguous-live')),
      entityKey: record.entityKey,
      entityName: record.entity?.name || record.entityId
    }));
    state.scada.dataQualitySummary = {
      total: visibleSummary.total,
      matched: visibleSummary.matched,
      unmatched: visibleSummary.unmatched,
      stale: visibleSummary.stale,
      duplicates: visibleSummary.ambiguousLive
    };
    return visibleSummary;
  }

  refreshScadaVisibleSummary = function () {
    const scope = state.scada.currentScope || getCurrentScadaScope();
    return buildVisibleSummary(scope, state.scada.entityMetricsByKey || new Map());
  };

  buildChartPayload = function () {
    const scope = getCurrentScadaScope();
    return SCADA_COMMON.buildChartPayload({
      chartSliceId: SCADA_CONFIG.CHART_SLICE_ID,
      datasourceId: SCADA_CONFIG.DATASOURCE_ID,
      timeRange: SCADA_CONFIG.QUERY_TIME_RANGE,
      kvFilters: [],
      tearFilters: [],
      elementNames: scope.elementNames,
      measurementIds: scope.measurementIds,
      rowLimit: Math.max(SCADA_CONFIG.QUERY_ROW_LIMIT, scope.measurementIds.length * 3 || 5000)
    });
  };

  function serializeDateLike(value) {
    if (value instanceof Date) return value.toISOString();
    if (value == null) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : value;
  }

  function reviveDateLike(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function serializeScadaDashboardSnapshot(options = {}) {
    const rows = state.scada.measurementRowsById instanceof Map
      ? Array.from(state.scada.measurementRowsById.entries()).map(([key, row]) => [
        String(key),
        {
          ...row,
          timestamp: serializeDateLike(row?.timestamp)
        }
      ])
      : [];
    return {
      schemaVersion: 1,
      source: options.source || 'map',
      at: Number(options.at || Date.now()),
      scope: state.scada.currentScope || getCurrentScadaScope(),
      fetchMeta: {
        ...(state.scada.fetchMeta || {}),
        startedAt: serializeDateLike(state.scada.fetchMeta?.startedAt),
        finishedAt: serializeDateLike(state.scada.fetchMeta?.finishedAt)
      },
      lastTransport: state.scada.lastTransport || null,
      measurementRows: rows
    };
  }

  function restoreScadaDashboardSnapshot(snapshot, options = {}) {
    if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.measurementRows)) {
      return { ok: false, reason: 'invalid-snapshot' };
    }
    const rows = new Map(snapshot.measurementRows.map(([key, row]) => [
      String(key),
      {
        ...row,
        timestamp: reviveDateLike(row?.timestamp)
      }
    ]));
    state.scada.measurementRowsById = rows;
    state.scada.rowsBySinsid = rows;
    state.scada.totalRows = rows.size;
    state.scada.currentScope = snapshot.scope || state.scada.currentScope || getCurrentScadaScope();
    state.scada.lastTransport = snapshot.lastTransport || state.scada.lastTransport || null;
    state.scada.fetchMeta = {
      ...(snapshot.fetchMeta || {}),
      startedAt: reviveDateLike(snapshot.fetchMeta?.startedAt),
      finishedAt: reviveDateLike(snapshot.fetchMeta?.finishedAt),
      status: snapshot.fetchMeta?.status || 'success',
      phaseLabel: 'Onbellek',
      phaseMessage: 'SCADA verisi onbellekten yuklendi; canli yenileme deneniyor.'
    };
    if (options.apply !== false && rows.size && state.scada.currentScope?.entities?.length) {
      applyGenericScadaSnapshot(rows, state.scada.currentScope);
    }
    if (typeof requestScadaOverlayRender === 'function') requestScadaOverlayRender();
    else {
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      if (typeof requestRender === 'function') requestRender();
    }
    if (typeof refreshRankingTable === 'function') refreshRankingTable();
    return { ok: true, rows: rows.size };
  }

  let lastSnapshotTime = 0;
  async function persistScadaDashboardSnapshot(options = {}) {
    try {
      const now = Date.now();
      if (!options.force && now - lastSnapshotTime < (globalThis.SCADA_COMMON?.CONFIG?.SNAPSHOT_INTERVAL_MS || 300000)) {
        return { ok: false, skipped: true, reason: 'throttled' };
      }
      lastSnapshotTime = now;
      if (typeof chrome === 'undefined' || !chrome.storage?.local?.set) return { ok: false, skipped: true };
      const scope = state.scada.currentScope || getCurrentScadaScope();
      const snapshot = serializeScadaDashboardSnapshot(options);
      await chrome.storage.local.set({ [SCADA_DASHBOARD_SNAPSHOT_KEY]: snapshot });
      await chrome.storage.local.set({
        [SCADA_BACKGROUND_REFRESH_STATE_KEY]: {
          enabled: true,
          updatedAt: Date.now(),
          scope,
          payload: {
            baseUrl: SCADA_CONFIG.SUPERSET_ORIGIN,
            dashboardId: SCADA_CONFIG.DASHBOARD_ID,
            chartSliceId: SCADA_CONFIG.CHART_SLICE_ID,
            datasourceId: SCADA_CONFIG.DATASOURCE_ID,
            timeRange: SCADA_CONFIG.QUERY_TIME_RANGE,
            kvFilters: [],
            tearFilters: [],
            elementNames: scope.elementNames,
            measurementIds: scope.measurementIds,
            rowLimit: Math.max(SCADA_CONFIG.QUERY_ROW_LIMIT, scope.measurementIds.length * 3 || 5000)
          }
        }
      });
      return { ok: true, snapshot };
    } catch (error) {
      scadaLog('warn', 'SCADA dashboard snapshot yazilamadi.', error?.message || String(error));
      return { ok: false, error: error?.message || String(error) };
    }
  }

  async function restoreScadaDashboardSnapshotFromStorage() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local?.get) return { ok: false, skipped: true };
      const stored = await chrome.storage.local.get(SCADA_DASHBOARD_SNAPSHOT_KEY);
      const snapshot = stored?.[SCADA_DASHBOARD_SNAPSHOT_KEY];
      const restored = restoreScadaDashboardSnapshot(snapshot);
      if (restored.ok) {
        setScadaStatusMessage('SCADA son dashboard snapshot onbellekten yuklendi.', 'warn');
      }
      return restored;
    } catch (error) {
      scadaLog('warn', 'SCADA dashboard snapshot okunamadi.', error?.message || String(error));
      return { ok: false, error: error?.message || String(error) };
    }
  }

  function handleDashboardMapSlotActive(payload = {}) {
    if (!state.scada.enabled || !state.scada.autoRefresh) {
      return { ok: true, skipped: true, reason: 'scada-disabled' };
    }
    if (!state.scada.pollState) state.scada.pollState = {};
    setScadaStatusMessage('Dashboard harita slotu aktif; SCADA yenileme kontrol ediliyor.', 'info');
    if (state.scada.fetchInProgress) {
      state.scada.pollState.pendingAutoRefresh = true;
      return { ok: true, queued: true, at: payload.at || Date.now() };
    }
    const pollState = state.scada.pollState;
    if (!pollState.nextDueAt || pollState.nextDueAt.getTime() > Date.now()) {
      pollState.nextDueAt = new Date(Date.now() - 1);
    }
    resumeScadaAutoSchedulerIfOverdue('dashboard');
    return { ok: true, triggered: true, at: payload.at || Date.now() };
  }

  scadaBuildIndex = function () {
    buildNetworkIndexes();
    state.scada.entityMetricsByKey = new Map();
    state.scada.measurementRowsById = new Map();
    state.scada.lineFlowByLineId = new Map();
    state.scada.currentScope = getCurrentScadaScope();
    state.scada.duplicateMappings = new Map();
    state.scada.duplicateHatIds = new Set();
    state.scada.ambiguousRows = [];
    refreshScadaVisibleSummary();
    restoreScadaDashboardSnapshotFromStorage();
    scadaLog('info', `SCADA V2 modulu hazir. ${state.network.hatLines.length} hat, ${state.network.trafos.length} trafo, ${state.network.baraNodes.length} bara yuklendi.`);
  };

  function clearScadaAutoTimer() {
    const pollState = state.scada.pollState;
    if (!pollState?.timerId) return;
    clearTimeout(pollState.timerId);
    pollState.timerId = null;
  }

  function getDocumentVisibilityState() {
    return typeof document?.visibilityState === 'string' ? document.visibilityState : 'visible';
  }

  function isDocumentHidden() {
    return getDocumentVisibilityState() === 'hidden';
  }

  function scheduleNextScadaAutoTick(delayMs = SCADA_CONFIG.POLL_INTERVAL_MS) {
    const pollState = state.scada.pollState;
    clearScadaAutoTimer();
    if (!state.scada.enabled || !state.scada.autoRefresh) {
      pollState.nextDueAt = null;
      return;
    }
    const safeDelay = Math.max(0, Number(delayMs) || 0);
    pollState.nextDueAt = new Date(Date.now() + safeDelay);
    pollState.timerId = setTimeout(() => {
      pollState.timerId = null;
      if (!state.scada.enabled || !state.scada.autoRefresh) return;
      if (isDocumentHidden()) {
        scadaLog('info', 'SCADA otomatik yenileme sekme arka planda oldugu icin beklemeye alindi.');
        return;
      }
      pollState.lastAutoRunAt = new Date();
      pollState.nextDueAt = null;
      if (state.scada.fetchInProgress) {
        pollState.pendingAutoRefresh = true;
        scadaLog('warn', 'SCADA otomatik yenileme tetigi beklemeye alindi; aktif sorgu tamamlaninca yeniden denenecek.');
        return;
      }
      scadaDoFetch({ trigger: 'auto' });
    }, safeDelay);
  }

  function stopScadaAutoScheduler() {
    const pollState = state.scada.pollState;
    clearScadaAutoTimer();
    pollState.nextDueAt = null;
    pollState.pendingAutoRefresh = false;
    scadaLog('info', 'SCADA otomatik yenileme zamanlayicisi durduruldu.');
  }

  function startScadaAutoScheduler() {
    const pollState = state.scada.pollState;
    clearScadaAutoTimer();
    pollState.pendingAutoRefresh = false;
    if (!state.scada.enabled || !state.scada.autoRefresh) {
      pollState.nextDueAt = null;
      return;
    }
    scheduleNextScadaAutoTick(SCADA_CONFIG.POLL_INTERVAL_MS);
    scadaLog('info', `SCADA otomatik yenileme zamanlayicisi baslatildi (${SCADA_CONFIG.POLL_INTERVAL_MS / 1000} sn).`);
  }

  function resumeScadaAutoSchedulerIfOverdue(reason = 'resume') {
    const pollState = state.scada.pollState;
    if (!state.scada.enabled || !state.scada.autoRefresh) return;
    if (isDocumentHidden()) return;
    pollState.lastVisibilityResumeAt = new Date();
    if (!pollState.nextDueAt) {
      scheduleNextScadaAutoTick(SCADA_CONFIG.POLL_INTERVAL_MS);
      return;
    }
    const remainingMs = pollState.nextDueAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      scadaLog('info', `SCADA otomatik yenileme ${reason} sonrasi overdue tespit etti; hemen yenileme deneniyor.`);
      if (state.scada.fetchInProgress) {
        pollState.pendingAutoRefresh = true;
        return;
      }
      pollState.lastAutoRunAt = new Date();
      pollState.nextDueAt = null;
      scadaDoFetch({ trigger: 'auto' });
      return;
    }
    scheduleNextScadaAutoTick(remainingMs);
  }

  markScadaFlowsUnavailable = function (reason, errorType) {
    state.scada.error = reason || 'SCADA verisi alinamadi.';
    state.scada.errorType = errorType || SCADA_ERROR.TRANSPORT_ERROR;

    const nextMetrics = new Map();
    state.scada.entityMetricsByKey.forEach((record, key) => {
      nextMetrics.set(key, {
        ...record,
        primaryStaleState: 'dead',
        primaryStatusText: STATUS_TEXT.dead,
        transportUnavailable: true
      });
    });
    state.scada.entityMetricsByKey = nextMetrics;

    const nextFlows = new Map();
    state.scada.lineFlowByLineId.forEach((flow, hatId) => {
      nextFlows.set(hatId, {
        ...flow,
        staleState: 'dead',
        color: SCADA_CONFIG.STALE_COLOR,
        unavailable: true
      });
    });
    state.scada.lineFlowByLineId = nextFlows;
    state.scada.staleCount = nextFlows.size;
    refreshScadaVisibleSummary();
    setScadaStatusMessage(state.scada.error, errorType === SCADA_ERROR.AUTH_REQUIRED ? 'warn' : 'error');
  };

  scadaDoFetch = async function (options = {}) {
    const triggerType = options?.trigger || 'manual';
    const triggerLabel = getScadaTriggerLabel(triggerType);
    if (state.scada.fetchInProgress) {
      if (triggerType === 'auto' && state.scada.pollState) {
        state.scada.pollState.pendingAutoRefresh = true;
      }
      scadaLog('warn', `SCADA ${triggerLabel.toLowerCase()} yenileme istegi atlandi; mevcut sorgu suruyor.`);
      if (triggerType === 'manual') setScadaStatusMessage('SCADA sorgusu zaten suruyor.', 'warn');
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      return;
    }

    if (triggerType === 'manual' && isDocumentHidden()) {
      const hiddenMessage = 'SCADA manuel yenileme sekme arka plandayken ertelendi. Sekmeye donup tekrar deneyin.';
      updateScadaFetchMeta({
        status: 'idle',
        stage: 'idle',
        progressPct: 0,
        triggerType,
        triggerLabel,
        phaseLabel: 'Beklemede',
        phaseMessage: hiddenMessage
      });
      setScadaStatusMessage(hiddenMessage, 'warn');
      scadaLog('warn', hiddenMessage);
      if (typeof refreshRankingTable === 'function') refreshRankingTable();
      return;
    }

    const scope = getCurrentScadaScope();
    if (!scope.measurementIds.length) {
      state.scada.entityMetricsByKey = new Map();
      state.scada.measurementRowsById = new Map();
      state.scada.lineFlowByLineId = new Map();
      state.scada.currentScope = scope;
      state.scada.visibleSummary = {
        total: scope.entities.length,
        matched: 0,
        stale: 0,
        unmatched: scope.entities.length,
        ambiguousLive: 0,
        orientationUnknown: 0,
        updatedAt: null,
        filterKey: scope.filterKey,
        metricMode: scope.mode
      };
      updateScadaFetchMeta({
        status: 'idle',
        stage: 'idle',
        progressPct: 0,
        triggerType,
        triggerLabel,
        phaseLabel: 'Hazir',
        phaseMessage: 'Secili filtre ve mod icin olcum ID bulunamadi.',
        rawRows: 0,
        normalizedRows: 0,
        visibleTotal: scope.entities.length,
        visibleMatched: 0,
        visibleDelayed: 0,
        visibleDead: 0,
        visibleStale: 0,
        visibleUnmatched: scope.entities.length
      });
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      if (typeof refreshRankingTable === 'function') refreshRankingTable();
      if (typeof requestRender === 'function') requestRender();
      return;
    }

    const startedAt = new Date();
    state.scada.fetchInProgress = true;
    state.scada.error = null;
    state.scada.errorType = null;

    updateScadaFetchMeta({
      status: 'loading',
      stage: 'queued',
      progressPct: 8,
      triggerType,
      triggerLabel,
      phaseLabel: 'Sorgu',
      phaseMessage: `${triggerLabel} yenileme ${startedAt.toLocaleTimeString('tr-TR')} icin baslatildi.`,
      startedAt,
      finishedAt: null,
      durationMs: null,
      rawRows: 0,
      normalizedRows: 0,
      visibleTotal: scope.entities.length,
      visibleMatched: 0,
      visibleDelayed: 0,
      visibleDead: 0,
      visibleStale: 0,
      visibleUnmatched: scope.entities.length,
      authMode: state.scada.lastTransport?.authMode || '-',
      usedFallback: false,
      httpStatus: null,
      error: null
    });

    scadaLog('info', `SCADA ${triggerLabel.toLowerCase()} yenileme tetiklendi.`, `${scope.modeLabel} | ${scope.measurementIds.length} olcum ID`);
    setScadaStatusMessage(
      triggerType === 'manual'
        ? 'SCADA sorgusu gonderildi, veri bekleniyor.'
        : `SCADA ${triggerLabel.toLowerCase()} yenileme basladi.`,
      'info'
    );

    try {
      updateScadaFetchMeta({
        stage: 'auth',
        progressPct: 24,
        phaseLabel: 'Auth',
        phaseMessage: `${triggerLabel} sorgu icin oturum kontrol ediliyor.`
      });

      const scope = getCurrentScadaScope();
      const result = SCADA_CONFIG.MOCK_ENABLED
        ? await scadaFetchMock()
        : await chrome.runtime.sendMessage({
          type: 'SCADA_FETCH',
          payload: {
            baseUrl: SCADA_CONFIG.SUPERSET_ORIGIN,
            dashboardId: SCADA_CONFIG.DASHBOARD_ID,
            chartSliceId: SCADA_CONFIG.CHART_SLICE_ID,
            datasourceId: SCADA_CONFIG.DATASOURCE_ID,
            timeRange: 'DATEADD(DATETIME("now"), -10, minute) : now',
            kvFilters: [],
            tearFilters: [],
            elementNames: scope.elementNames,
            measurementIds: scope.measurementIds
          }
        });

      updateScadaTransportState(result);
      updateScadaFetchMeta({
        authMode: result?.authMode || 'session',
        usedFallback: Boolean(result?.usedFallback),
        httpStatus: result?.httpStatus ?? null
      });

      if (!result?.ok) {
        const finishedAt = new Date();
        const errorMessage = result?.error || 'SCADA fetch basarisiz.';
        updateScadaFetchMeta({
          status: 'error',
          stage: 'error',
          progressPct: 100,
          phaseLabel: 'Hata',
          phaseMessage: errorMessage,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          error: errorMessage
        });
        markScadaFlowsUnavailable(errorMessage, result?.errorType || SCADA_ERROR.NETWORK_ERROR);
        scadaLog('error', 'SCADA fetch hatasi', result?.error || result?.errorType || 'bilinmeyen hata');
        return;
      }

      const rawRows = typeof countScadaTransportRows === 'function' ? countScadaTransportRows(result.data) : 0;
      updateScadaFetchMeta({
        stage: 'fetch',
        progressPct: 64,
        phaseLabel: 'Veri',
        phaseMessage: `${rawRows} ham satir alindi, normalizasyon basliyor.`,
        rawRows
      });

      const rowsByMeasurementId = SCADA_COMMON.normalizeMetricRows(result.data, { elementNames: scope.elementNames });
      if (!rowsByMeasurementId.size) {
        const finishedAt = new Date();
        const errorMessage = 'Superset yanitinda veri bulunamadi.';
        updateScadaFetchMeta({
          status: 'error',
          stage: 'error',
          progressPct: 100,
          phaseLabel: 'Bos Veri',
          phaseMessage: errorMessage,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          rawRows,
          normalizedRows: 0,
          error: errorMessage
        });
        markScadaFlowsUnavailable(errorMessage, SCADA_ERROR.EMPTY_DATA);
        scadaLog('warn', 'SCADA verisi bos dondu.');
        return;
      }

      updateScadaFetchMeta({
        stage: 'process',
        progressPct: 86,
        phaseLabel: 'Esleme',
        phaseMessage: `${rowsByMeasurementId.size} tekil olcum satiri esleniyor.`,
        rawRows,
        normalizedRows: rowsByMeasurementId.size
      });

      const visibleSummary = applyGenericScadaSnapshot(rowsByMeasurementId, scope);
      state.scada.lastFetchAt = new Date();
      state.scada.sourceKind = 'live';
      state.scada.snapshotAt = null;
      const finishedAt = new Date();
      updateScadaFetchMeta({
        status: 'success',
        stage: 'done',
        progressPct: 100,
        phaseLabel: 'Tamamlandi',
        phaseMessage: `${triggerLabel} yenileme tamamlandi. ${rowsByMeasurementId.size} tekil olcum islendi.`,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        rawRows,
        normalizedRows: rowsByMeasurementId.size,
        visibleTotal: visibleSummary.total || 0,
        visibleMatched: visibleSummary.matched || 0,
        visibleDelayed: visibleSummary.delayed || 0,
        visibleDead: visibleSummary.dead || 0,
        visibleStale: visibleSummary.stale || 0,
        visibleUnmatched: (visibleSummary.unmatched || 0) + (visibleSummary.ambiguousLive || 0),
        error: null
      });

      const unresolvedCount = (visibleSummary.ambiguousLive || 0) + (visibleSummary.unmatched || 0) + (visibleSummary.dead || 0);
      const ambiguousText = unresolvedCount > 0
        ? ` Çözümlenemeyen kayıt: ${unresolvedCount} (Aday çakışması: ${visibleSummary.ambiguousLive || 0}, Yön belirsiz: ${visibleSummary.orientationUnknown || 0}, Kaynak eksik: ${visibleSummary.unmatched || 0}, Geçersiz/eski veri: ${visibleSummary.dead || 0})`
        : '';
      setScadaStatusMessage(
        `SCADA verisi guncellendi (${scope.modeLabel}).${ambiguousText}`,
        visibleSummary.ambiguousLive || result.usedFallback ? 'warn' : 'info'
      );
      scadaLog(
        'info',
        `SCADA ${triggerLabel.toLowerCase()} yenileme tamamlandi: ${rawRows} ham, ${rowsByMeasurementId.size} tekil, gorunen ${visibleSummary.matched || 0}/${visibleSummary.total || 0} cozuldu.`,
        `${result.authMode}${result.usedFallback ? ' fallback' : ''}`
      );
      await persistScadaDashboardSnapshot({ source: triggerType === 'background' ? 'background' : 'map' });
    } catch (error) {
      const finishedAt = new Date();
      const errorMessage = error.message || String(error);
      updateScadaFetchMeta({
        status: 'error',
        stage: 'error',
        progressPct: 100,
        phaseLabel: 'Hata',
        phaseMessage: errorMessage,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        error: errorMessage
      });
      markScadaFlowsUnavailable(errorMessage, SCADA_ERROR.NETWORK_ERROR);
      scadaLog('error', 'SCADA fetch istisnasi', errorMessage);
    } finally {
      state.scada.fetchInProgress = false;
      if (state.scada.autoRefresh && state.scada.enabled) {
        const pollState = state.scada.pollState;
        if (pollState?.pendingAutoRefresh && !isDocumentHidden()) {
          pollState.pendingAutoRefresh = false;
          pollState.lastAutoRunAt = new Date();
          pollState.nextDueAt = null;
          scadaLog('info', 'Bekleyen otomatik yenileme aktif sorgu sonrasinda hemen calistiriliyor.');
          setTimeout(() => {
            if (state.scada.enabled && state.scada.autoRefresh && !state.scada.fetchInProgress) {
              scadaDoFetch({ trigger: 'auto' });
            }
          }, 0);
        } else {
          scheduleNextScadaAutoTick(SCADA_CONFIG.POLL_INTERVAL_MS);
        }
      }
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      if (typeof refreshRankingTable === 'function') refreshRankingTable();
    }
  };

  function getMetricLegendCounts(modeConfig) {
    if (modeConfig.domain === 'bara') {
      const counts = [
        { label: '0.00-0.80', color: '#6b7280', count: 0 },
        { label: '0.80-0.95', color: '#7c3aed', count: 0 },
        { label: '0.95-0.97', color: '#1d4ed8', count: 0 },
        { label: '0.97-0.99', color: '#7dd3fc', count: 0 },
        { label: '0.99-1.01', color: '#22c55e', count: 0 },
        { label: '1.01-1.03', color: '#fb923c', count: 0 },
        { label: '1.03-1.05', color: '#ea580c', count: 0 },
        { label: '1.05-1.20', color: '#7c3aed', count: 0 },
        { label: '1.20+', color: '#6b7280', count: 0 }
      ];
      state.scada.entityMetricsByKey.forEach((record) => {
        if (record.entityType !== 'bara' || !Number.isFinite(record.primaryValue) || record.sourceAmbiguous) return;
        const nominal = Number(record.entity.gerilimKv || 0) || 1;
        const pu = nominal > 0 ? record.primaryValue / nominal : null;
        if (!Number.isFinite(pu)) return;
        if (pu < 0.80) counts[0].count += 1;
        else if (pu < 0.95) counts[1].count += 1;
        else if (pu < 0.97) counts[2].count += 1;
        else if (pu < 0.99) counts[3].count += 1;
        else if (pu <= 1.01) counts[4].count += 1;
        else if (pu <= 1.03) counts[5].count += 1;
        else if (pu <= 1.05) counts[6].count += 1;
        else if (pu <= 1.20) counts[7].count += 1;
        else counts[8].count += 1;
      });
      return counts;
    }
    const thresholds = modeConfig.primaryMetric === 'reactive' ? MVAR_RATIO_THRESHOLDS : SCADA_CONFIG.LOADING_THRESHOLDS;
    const counts = thresholds.map((threshold) => ({
      label: threshold.label,
      color: threshold.color,
      count: 0
    }));
    state.scada.entityMetricsByKey.forEach((record) => {
      if (record.entityType === 'bara') return;
      if (!Number.isFinite(record.displayPct) || record.invalidPct || hasHatUncertainty(record) || record.primaryStaleState === 'dead') return;
      const bucket = counts.find((entry, index) => record.displayPct <= thresholds[index].max);
      if (bucket) bucket.count += 1;
    });
    return counts;
  }

  function syncScadaFetchUi() {
    const fetchMeta = state.scada.fetchMeta || {};
    const elFetchBadge = document.getElementById('scadaFetchBadge');
    const elFetchMessage = document.getElementById('scadaFetchMessage');
    const elFetchTrigger = document.getElementById('scadaFetchTrigger');
    const elFetchStart = document.getElementById('scadaFetchStart');
    const elFetchEnd = document.getElementById('scadaFetchEnd');
    const elFetchDuration = document.getElementById('scadaFetchDuration');
    const elFetchRawRows = document.getElementById('scadaFetchRawRows');
    const elFetchNormalizedRows = document.getElementById('scadaFetchNormalizedRows');
    const elFetchVisibleRows = document.getElementById('scadaFetchVisibleRows');
    const elFetchTransport = document.getElementById('scadaFetchTransport');
    const btnRefresh = document.querySelector('[data-scada-btn="refresh"]');
    const btnRefreshLabel = document.getElementById('scadaRefreshBtnLabel');

    const formatClock = (value) => {
      if (!value) return '-';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDuration = (ms) => {
      if (!Number.isFinite(ms) || ms <= 0) return '-';
      if (ms < 1000) return `${Math.round(ms)} ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} sn`;
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return `${minutes} dk ${seconds} sn`;
    };

    const fetchStatusClass = fetchMeta.status === 'loading'
      ? 'is-loading'
      : fetchMeta.status === 'error'
        ? 'is-error'
        : fetchMeta.status === 'success'
          ? 'is-success'
          : 'is-idle';

    if (elFetchBadge) {
      elFetchBadge.className = `scada-fetch-badge ${fetchStatusClass}`;
      elFetchBadge.textContent = fetchMeta.status === 'loading'
        ? `${fetchMeta.phaseLabel || 'Sorgu'} ${Math.max(1, Number(fetchMeta.progressPct) || 0)}%`
        : fetchMeta.status === 'error'
          ? 'Hata'
          : fetchMeta.status === 'success'
            ? 'Tamam'
            : 'Hazir';
    }
    if (elFetchMessage) elFetchMessage.textContent = fetchMeta.phaseMessage || 'Henuz sorgu yapilmadi.';
    if (elFetchTrigger) elFetchTrigger.textContent = fetchMeta.triggerLabel || '-';
    if (elFetchStart) elFetchStart.textContent = formatClock(fetchMeta.startedAt);
    if (elFetchEnd) elFetchEnd.textContent = formatClock(fetchMeta.finishedAt);
    if (elFetchDuration) elFetchDuration.textContent = formatDuration(fetchMeta.durationMs);
    if (elFetchRawRows) elFetchRawRows.textContent = String(fetchMeta.rawRows || 0);
    if (elFetchNormalizedRows) elFetchNormalizedRows.textContent = String(fetchMeta.normalizedRows || 0);
    if (elFetchVisibleRows) {
      elFetchVisibleRows.textContent = `${fetchMeta.visibleMatched || 0}/${fetchMeta.visibleTotal || 0}`;
      elFetchVisibleRows.title = `Gecikmeli: ${fetchMeta.visibleDelayed || 0} | Bayat: ${fetchMeta.visibleDead || 0} | Eslesmeyen: ${fetchMeta.visibleUnmatched || 0}`;
    }
    if (elFetchTransport) {
      const transportParts = [
        fetchMeta.authMode || '-',
        fetchMeta.usedFallback ? 'fallback' : null,
        Number.isFinite(fetchMeta.httpStatus) ? String(fetchMeta.httpStatus) : null
      ].filter(Boolean);
      elFetchTransport.textContent = transportParts.join(' / ') || '-';
    }

    if (btnRefresh) {
      btnRefresh.disabled = Boolean(state.scada.fetchInProgress);
      btnRefresh.classList.toggle('is-loading', Boolean(state.scada.fetchInProgress));
      btnRefresh.classList.toggle('is-success', !state.scada.fetchInProgress && fetchMeta.status === 'success');
      btnRefresh.classList.toggle('is-error', !state.scada.fetchInProgress && fetchMeta.status === 'error');
      btnRefresh.title = state.scada.fetchInProgress
        ? `SCADA sorgusu suruyor: ${fetchMeta.phaseLabel || 'Sorgu'}`
        : 'Manuel Yenile';
    }
    if (btnRefreshLabel) {
      btnRefreshLabel.textContent = state.scada.fetchInProgress
        ? `${Math.max(1, Number(fetchMeta.progressPct) || 0)}%`
        : fetchMeta.status === 'error'
          ? 'Hata'
          : 'Yenile';
    }
  }

  function buildScadaQualityChips(summary) {
    const chips = [
      { label: 'Canli', value: summary.matched || 0, tone: 'is-live' },
      { label: 'Gecikmeli', value: summary.delayed || 0, tone: 'is-warn' },
      { label: 'Bayat', value: summary.dead || 0, tone: 'is-dead' },
      { label: 'Yon belirsiz', value: summary.orientationUnknown || 0, tone: 'is-unknown', filter: 'orientation-unknown' },
      { label: 'Terminal yorumlu', value: summary.resolvedWithWarning || 0, tone: 'is-resolved-warning', filter: 'resolved-with-warning' },
      { label: 'Eksik', value: summary.unmatched || 0, tone: 'is-missing', filter: 'missing' }
    ];
    return chips.map((chip) => {
      const body = `${escapeHtml(chip.label)} <strong>${chip.value}</strong>`;
      if (chip.filter) {
        return `<button type="button" class="scada-quality-chip ${chip.tone}" title="${escapeHtml(chip.label)}" data-scada-audit-filter="${escapeHtml(chip.filter)}">${body}</button>`;
      }
      return `<span class="scada-quality-chip ${chip.tone}" title="${escapeHtml(chip.label)}">${body}</span>`;
    }).join('');
  }

  updateScadaCardUI = function () {
    const modeConfig = getModeConfig();
    const summary = state.scada.visibleSummary || refreshScadaVisibleSummary();
    const elSonVeri = document.getElementById('scadaSonVeri');
    const elToplam = document.getElementById('scadaToplam');
    const elEslesen = document.getElementById('scadaEslesen');
    const elEslesmeyen = document.getElementById('scadaEslesmeyen');
    const elStale = document.getElementById('scadaStale');
    const elHata = document.getElementById('scadaHata');
    const elLejant = document.getElementById('scadaLejant');
    const elQualityChips = document.getElementById('scadaQualityChips');
    const elKalite = document.getElementById('scadaKalite');
    const btnBolt = document.getElementById('btnScadaRanking');

    if (elSonVeri) {
      elSonVeri.textContent = state.scada.lastDataTimestamp
        ? state.scada.lastDataTimestamp.toLocaleTimeString('tr-TR')
        : '-';
    }
    if (elToplam) elToplam.textContent = String(summary.total || 0);
    if (elEslesen) elEslesen.textContent = String(summary.matched || 0);
    if (elEslesmeyen) elEslesmeyen.textContent = String((summary.unmatched || 0) + (summary.ambiguousLive || 0));
    if (elStale) elStale.textContent = String(summary.dead || 0);
    if (elHata) elHata.textContent = state.scada.error || '-';

    if (elLejant) {
      const legendCounts = getMetricLegendCounts(modeConfig);
      elLejant.innerHTML = legendCounts.map((entry) => (
        `<span style="color:${entry.color}" title="${entry.label}">&#9679;${entry.count}</span>`
      )).join(' ');
    }

    if (elQualityChips) {
      elQualityChips.innerHTML = buildScadaQualityChips(summary);
      Array.from(elQualityChips.querySelectorAll('[data-scada-audit-filter]')).forEach((button) => {
        button.addEventListener('click', () => {
          if (typeof showScadaMismatchReportModal === 'function') {
            showScadaMismatchReportModal(button.dataset.scadaAuditFilter || '');
          }
        });
      });
    }

    if (elKalite) {
      const transport = state.scada.lastTransport;
      const parts = [
        `Mod: ${modeConfig.label}`,
        `Auth: ${state.scada.authState || 'idle'}`,
        transport?.authMode ? `Tasima: ${transport.authMode}${transport.usedFallback ? ' (fallback)' : ''}` : null,
        `Gorunen kalite: ${summary.matched || 0}/${summary.total || 0}`,
        summary.delayed ? `Gecikmeli: ${summary.delayed}` : null,
        summary.dead ? `Bayat: ${summary.dead}` : null,
        summary.resolvedWithWarning ? `Terminal yorumlu: ${summary.resolvedWithWarning}` : null,
        `Belirsiz: ${summary.ambiguousLive || 0}`,
        summary.orientationUnknown ? `Yon belirsiz: ${summary.orientationUnknown}` : null,
        `Ham satir kalite: ${state.scada.measurementRowsById?.size || 0}/${state.scada.totalRows || 0}`
      ].filter(Boolean);
      elKalite.textContent = parts.join(' | ');
    }

    if (btnBolt) {
      btnBolt.classList.toggle('hidden', !state.scada.enabled || !state.scada.entityMetricsByKey.size);
    }

    syncScadaFetchUi();
    syncScadaMetricButtons();
    syncScadaMapDisplayButtons();
    if (typeof requestRender === 'function') requestRender();
  };

  function getPrimaryStatusClass(record) {
    if (!record || !Number.isFinite(record.primaryValue)) return 'is-ambiguous';
    if (record.sourceAmbiguous || record.unresolved || record.candidateConflict || record.backupUsed || record.uncertaintyReason) return 'is-ambiguous';
    if (record.primaryStaleState === 'dead') return 'is-dead';
    if (record.primaryStaleState === 'warn') return 'is-warn';
    return 'is-live';
  }

  function buildEntityMetricVisual(entityType, entity) {
    const modeConfig = getModeConfig();
    if (!state.scada.enabled) return null;
    if ((modeConfig.domain === 'hat' && entityType !== 'hat')
      || (modeConfig.domain === 'trafo' && entityType !== 'trafo')
      || (modeConfig.domain === 'bara' && entityType !== 'bara')) {
      return null;
    }
    const record = state.scada.entityMetricsByKey.get(`${entityType}:${entity.id}`);
    if (!record || !Number.isFinite(record.primaryValue)) return null;
    const displayMode = normalizeScadaMapDisplayMode(modeConfig, state.filters.scadaMapDisplayMode);
    const showValueBox = entityType === 'hat'
      ? false
      : displayMode === 'box';
    const showRing = entityType === 'hat'
      ? false
      : displayMode === 'point' || displayMode === 'point-label';

    if (entityType === 'bara') {
      const nominal = Number(entity.gerilimKv || 0) || 1;
      const pu = record.primaryValue / nominal;
      const color = typeof getVoltagePuColor === 'function' ? getVoltagePuColor(pu) : '#2563eb';
      const tmLabel = String(entity.tmName || entity.tm?.name || entity.name || '-').trim();
      const rawValueText = record.primaryValue.toFixed(1);
      const severityValue = Number.isFinite(pu) ? Math.abs(pu - 1) : 0;
      return {
        fillColor: color,
        ringColor: showRing ? (record.sourceAmbiguous ? '#ef4444' : color) : '',
        valueText: showValueBox ? rawValueText : '',
        valueTitle: `${tmLabel} | ${record.primaryValue.toFixed(1)} kV | ${pu.toFixed(3)} p.u.`,
        labelText: tmLabel,
        labelTitle: `${tmLabel} (${entity.gerilimKv || entity.kvBucket || '-'})`,
        rawValueText,
        puValue: pu,
        heatValue: severityValue,
        priorityScore: buildVisualPriorityScore(record, severityValue, entity.gerilimKv || entity.kvBucket || 0),
        groupKey: `tm:${entity.tmId || entity.tm?.id || entity.id}|kv:${entity.kvBucket || entity.gerilimKv || ''}`,
        nominalKv: Number(entity.gerilimKv || entity.kvBucket || 0) || 0,
        statusClass: getPrimaryStatusClass(record)
      };
    }

    const color = record.primaryStaleState === 'dead'
      ? (SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af')
      : getDisplayColor(record);
    const primaryUnit = getMetricUnit(record.primaryMetric);
    const rawValueText = `${record.primaryValue >= 0 ? '+' : ''}${record.primaryValue.toFixed(1)}`;
    const severityValue = Number.isFinite(record.displayPct) ? record.displayPct : Math.abs(record.primaryValue || 0);
    return {
      fillColor: entityType === 'trafo'
        ? (entity.type === 'transmission' ? '#0ea5e9' : '#22c55e')
        : color,
      ringColor: showRing ? (record.sourceAmbiguous ? '#ef4444' : color) : '',
      valueText: showValueBox ? `${rawValueText} ${primaryUnit}` : '',
      valueTitle: `${entity.displayName || entity.name || '-'} | ${rawValueText} ${primaryUnit}${Number.isFinite(record.displayPct) ? ` | ${record.displayPct.toFixed(1)}%` : ''}`,
      labelText: entityType === 'trafo' ? String(entity.name || entity.displayName || '-').trim() : '',
      labelTitle: entity.displayName || entity.name || '-',
      rawValueText,
      heatValue: severityValue,
      priorityScore: buildVisualPriorityScore(record, severityValue, entity.primaryKv || entity.kvBucket || 0),
      groupKey: `tm:${entity.tmId || entity.tm?.id || entity.id}|${entityType}`,
      nominalKv: Number(entity.primaryKv || entity.kvBucket || 0) || 0,
      statusClass: getPrimaryStatusClass(record)
    };
  }

  getScadaPopupFields = function (hatRow) {
    const record = state.scada.entityMetricsByKey.get(`hat:${hatRow.id}`);
    if (!state.scada.enabled || !record) return [['SCADA Durumu', 'Eslesmedi']];
    if (!Number.isFinite(record.primaryValue)) {
      return [['SCADA Durumu', ['orientation-unknown', 'source-side-unknown', 'polarization-mismatch'].includes(record.unresolvedReason) ? 'Yon belirsiz' : 'Eslesmedi']];
    }
    const fields = [];
    if (record.active?.valueInvalid) fields.push(['Aktif Guc (MW)', '!']);
    else if (Number.isFinite(record.active?.value)) fields.push(['Aktif Guc (MW)', `${record.active.value >= 0 ? '+' : ''}${record.active.value.toFixed(1)}`]);
    if (record.reactive?.valueInvalid) fields.push(['Reaktif Guc (MVar)', '!']);
    else if (Number.isFinite(record.reactive?.value)) fields.push(['Reaktif Guc (MVar)', `${record.reactive.value >= 0 ? '+' : ''}${record.reactive.value.toFixed(1)}`]);
    if (record.invalidPct) fields.push([record.displayPctMode === 'reactive-ratio' ? 'MVar/MW Orani' : 'Yuklenme', '!']);
    else if (Number.isFinite(record.displayPct)) {
      fields.push([
        record.displayPctMode === 'reactive-ratio' ? 'MVar/MW Orani' : 'Yuklenme',
        `${record.displayPct.toFixed(1)}%${record.displayPctMode === 'loading' ? ` (${formatNumber(record.capacityMva, ' MVA')})` : ''}`
      ]);
    }
    if (record.primaryTimestamp) fields.push(['Olcum Zamani', `${record.primaryTimestamp.toLocaleDateString('tr-TR')} ${record.primaryTimestamp.toLocaleTimeString('tr-TR')}`]);
    fields.push(['Veri Durumu', record.primaryStatusText || '-']);
    if (record.ageLabel) fields.push(['Veri Yasi', record.ageLabel]);
    if (record.primaryMeasurementId) fields.push(['Olcum ID', record.primaryMeasurementId]);
    return fields;
  };

  function buildHatDirectionText(hat, record) {
    if (!record) return 'Belirsiz';
    if (!Number.isFinite(record.directionValue) || hasHatUncertainty(record)) {
      return ['orientation-unknown', 'source-side-unknown', 'polarization-mismatch'].includes(record.unresolvedReason)
        ? 'Yon belirsiz'
        : 'Belirsiz';
    }
    return record.directionValue >= 0
      ? `${hat.startTm || '?'} -> ${hat.endTm || '?'}`
      : `${hat.endTm || '?'} -> ${hat.startTm || '?'}`;
  }

  function renderHatUncertaintyCard(record) {
    const meta = buildHatUncertaintyMeta(record);
    if (!meta.detailLines.length) return '';
    const measurementLabel = record.selectedCandidate || record.primaryMeasurementId || '-';
    const polarizationLabel = Number.isFinite(record.polarizationSign)
      ? `${record.polarizationSign > 0 ? '+' : ''}${record.polarizationSign}`
      : '-';
    const consistencyLabel = record.polarizationConsistent == null
      ? '-'
      : (record.polarizationConsistent ? 'Uyumlu' : 'Uyumsuz');
    return `
      <div class="technical-note-card">
        <div class="technical-note-title">Belirsizlik / Teknik Durum</div>
        <ul class="technical-note-list">
          ${meta.detailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ul>
        <div class="technical-note-grid">
          <div class="technical-note-item"><span>Secilen Olcum</span><strong>${escapeHtml(measurementLabel)}</strong></div>
          <div class="technical-note-item"><span>Yedek Kullanimi</span><strong>${record.backupUsed ? 'Evet' : 'Hayir'}</strong></div>
          <div class="technical-note-item"><span>Terminal Tarafi</span><strong>${escapeHtml(record.terminalSide || '-')}</strong></div>
          <div class="technical-note-item"><span>Terminal Eslesmesi</span><strong>${escapeHtml(record.terminalMatchBasis || '-')}</strong></div>
          <div class="technical-note-item"><span>Polarizasyon</span><strong>${escapeHtml(polarizationLabel)}</strong></div>
          <div class="technical-note-item"><span>Polarizasyon Tutarliligi</span><strong>${escapeHtml(consistencyLabel)}</strong></div>
          <div class="technical-note-item"><span>Cozum Yontemi</span><strong>${escapeHtml(record.resolutionMethod || '-')}</strong></div>
          <div class="technical-note-item"><span>Yon Modeli</span><strong>${escapeHtml(record.directionModel || '-')}</strong></div>
        </div>
      </div>
    `;
  }
  function renderHatMeasurementCard(record) {
    if (!record) return '';
    const sections = [];
    const renderRows = (title, metricRecord, unit) => {
      const rows = Array.isArray(metricRecord?.candidateDetails) ? metricRecord.candidateDetails : [];
      if (!rows.length) return '';
      const selectedValue = metricRecord?.valueInvalid
        ? '!'
        : Number.isFinite(metricRecord?.value)
          ? `${metricRecord.value >= 0 ? '+' : ''}${metricRecord.value.toFixed(2)} ${unit}`
          : '-';
      return `
        <div class="technical-note-card">
          <div class="technical-note-title">${escapeHtml(title)}</div>
          <div class="technical-note-grid">
            <div class="technical-note-item"><span>Secilen Olcum</span><strong>${escapeHtml(metricRecord?.measurementId || '-')}</strong></div>
            <div class="technical-note-item"><span>Secilen Deger</span><strong>${escapeHtml(selectedValue)}</strong></div>
            <div class="technical-note-item technical-note-item-wide"><span>Secim Nedeni</span><strong>${escapeHtml(metricRecord?.selectedCandidateReason || record.selectedCandidateReason || '-')}</strong></div>
          </div>
          <div class="technical-note-measurements">
            ${rows.map((row) => {
              const timeText = row.timestamp
                ? `${row.timestamp.toLocaleDateString('tr-TR')} ${row.timestamp.toLocaleTimeString('tr-TR')}`
                : '-';
              const rawText = row.valueInvalid
                ? '!'
                : Number.isFinite(row.rawValue)
                  ? `${row.rawValue >= 0 ? '+' : ''}${row.rawValue.toFixed(2)}`
                  : '-';
              const normalizedText = row.valueInvalid
                ? '!'
                : Number.isFinite(row.normalizedValue)
                  ? `${row.normalizedValue >= 0 ? '+' : ''}${row.normalizedValue.toFixed(2)} ${unit}`
                  : '-';
              return `
                <div class="technical-note-measurement-row${row.selected ? ' is-selected' : ''}">
                  <div><span>Ölçüm Adresi</span><strong>${escapeHtml(row.measurementId || '-')}</strong></div>
                  <div><span>Formül</span><strong>${escapeHtml(row.formulaRaw || '-')}</strong></div>
                  <div><span>Superset Kaynak Değeri</span><strong>${escapeHtml(rawText)}</strong></div>
                  <div><span>Harita Akış Değeri</span><strong>${escapeHtml(normalizedText)}</strong></div>
                  <div><span>Superset Veri Zamanı</span><strong>${escapeHtml(timeText)}</strong></div>
                  <div><span>Terminal Tarafı</span><strong>${escapeHtml(row.terminalSide || '-')}</strong></div>
                  <div><span>Seçim Nedeni</span><strong>${escapeHtml(row.selectedCandidateReason || '-')}</strong></div>
                  <div><span>Seçildi mi</span><strong>${row.selected ? 'Evet' : 'Hayır'}</strong></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };
    sections.push(renderRows('Aktif Güç Ölçümleri', record.active, 'MW'));
    sections.push(renderRows('Reaktif Güç Ölçümleri', record.reactive, 'MVar'));
    return sections.filter(Boolean).join('');
  }

  function buildHatPopupModel(hat) {
    const record = state.scada.entityMetricsByKey.get(`hat:${hat.id}`);
    const directionText = buildHatDirectionText(hat, record);
    const pctLabel = record?.displayPctMode === 'reactive-ratio' ? 'MVar/MW Orani' : 'Yuklenme';
    const pctValue = record?.invalidPct
      ? '!'
      : Number.isFinite(record?.displayPct)
        ? `${record.displayPct.toFixed(1)}%`
        : '-';
    const compactFields = [
      ['Uzunluk', formatNumber(hat.lengthKm, ' km')],
      ['Kapasite', formatNumber(getCapacityMva('hat', hat), ' MVA')],
      ['Aktif Guc (MW)', record?.active?.valueInvalid ? '!' : Number.isFinite(record?.active?.value) ? `${record.active.value >= 0 ? '+' : ''}${record.active.value.toFixed(1)}` : '-'],
      ['Reaktif Guc (MVar)', record?.reactive?.valueInvalid ? '!' : Number.isFinite(record?.reactive?.value) ? `${record.reactive.value >= 0 ? '+' : ''}${record.reactive.value.toFixed(1)}` : '-'],
      [pctLabel, pctValue],
      ['Akis Yonu', directionText],
      ['Olcum Zamani', record?.primaryTimestamp ? record.primaryTimestamp.toLocaleTimeString('tr-TR') : '-']
    ];
    const detailFields = [
      ['Hat ID', hat.kmlDescriptionId || '-'],
      ['YTM', (hat.ytmNames || []).join(' / ') || '-'],
      ['Hat Kesit', formatKesit(hat.characteristic || '-')],
      ['Aktif Olcum ID', record?.active?.measurementId || '-'],
      ['Reaktif Olcum ID', record?.reactive?.measurementId || '-'],
      ['Veri Durumu', record?.primaryStatusText || '-'],
      ['Yon Cozumleme', record?.directionResolvedBy || '-'],
      ['Alias Eslesme', record?.aliasMatchBasis || '-'],
      ['Formula Sign', Number.isFinite(Number(record?.formulaSign)) ? String(record.formulaSign) : '-'],
      ['Cozum Yontemi', record?.resolutionMethod || '-'],
      ['Secim Nedeni', record?.selectedCandidateReason || '-'],
      ['Terminal Tarafi', record?.terminalSide || '-'],
      ['Polarizasyon', Number.isFinite(record?.polarizationSign) ? `${record.polarizationSign > 0 ? '+' : ''}${record.polarizationSign}` : '-'],
      ['Polarizasyon Tutarliligi', record?.polarizationConsistent == null ? '-' : (record.polarizationConsistent ? 'Uyumlu' : 'Uyumsuz')],
      ['Veri Durumu', record?.timeStateLabel || record?.primaryStatusText || '-'],
      ['Veri Yasi', record?.ageLabel || '-']
    ];
    return {
      title: hat.name,
      subtitle: hat.kv ? `${hat.kv} kV Hat` : 'Hat',
      tags: [(hat.ytmNames || []).join(' / ') || '-'],
      compactFields,
      detailFields,
      detailExtraHtml: `${renderHatMeasurementCard(record)}${renderHatUncertaintyCard(record)}`
    };
  }

  openScadaHatDetails = function (hat, options = {}) {
    if (!hat) return;
    state.selection = { kind: 'hat', id: hat.id, measureSourceId: '', measureTargetIds: [] };
    const model = buildHatPopupModel(hat);
    const anchorCoord = options.anchorCoord || getHatAnchorCoord(hat);
    const expanded = typeof options.expanded === 'boolean'
      ? options.expanded
      : Boolean(state.ui.activeEntityPopup?.expanded && state.ui.activeEntityPopup?.entityId === hat.id);

    showInfo({
      title: model.title,
      subtitle: model.subtitle,
      tags: model.tags,
      compactFields: model.compactFields,
      detailFields: model.detailFields,
      detailExtraHtml: model.detailExtraHtml,
      actions: [{ id: 'btnShowScadaChart', label: 'Grafik Göster' }],
      anchor: { hatId: hat.id, coord: anchorCoord },
      expanded,
      classes: ['hat-popup']
    });

    state.ui.activeEntityPopup = {
      entityType: 'hat',
      entityId: hat.id,
      anchorCoord,
      expanded,
      screenPosition: null
    };

    const chartBtn = document.getElementById('btnShowScadaChart');
    if (chartBtn) chartBtn.addEventListener('click', () => openScada24hHistory(`hat:${hat.id}`));
    const toggleBtn = document.getElementById('btnToggleInfoDetails');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        openScadaHatDetails(hat, {
          anchorCoord,
          expanded: !expanded,
          forceTiles: false
        });
      });
    }

    requestRender({ forceTiles: Boolean(options.forceTiles) });
  };


  function closeScadaChartModal() {
    const backdrop = document.getElementById('scadaChartModalBackdrop');
    if (backdrop) backdrop.remove();
  }

  async function openScada24hHistory(entityKey) {
    closeScadaChartModal();
    const isHat = entityKey.startsWith('hat:');
    const entityId = entityKey.split(':')[1];
    const hat = isHat ? (state.network?.hatById?.get(String(entityId)) || state.network?.hatLines?.find((entry) => String(entry.id) === String(entityId))) : null;
    const name = hat?.name || entityId;

    const backdrop = document.createElement('div');
    backdrop.id = 'scadaChartModalBackdrop';
    backdrop.className = 'scada-chart-backdrop';
    backdrop.innerHTML = `
      <div class="scada-chart-modal" role="dialog" aria-modal="true" aria-label="SCADA 24 Saat Grafik">
        <div class="scada-chart-header">
          <div>
            <p class="info-kicker">Son 24 Saat</p>
            <h3>${escapeHtml(name)}</h3>
          </div>
          <button id="btnCloseScadaChart" class="info-close" title="Kapat">X</button>
        </div>
        <div class="scada-chart-body" id="scadaChartModalBody">
          <div class="scada-chart-empty">Geçmiş veri yükleniyor...</div>
        </div>
      </div>
    `;
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeScadaChartModal();
    });
    const mapShell = document.querySelector('.map-shell');
    if (mapShell) mapShell.appendChild(backdrop);
    const closeBtn = document.getElementById('btnCloseScadaChart');
    if (closeBtn) closeBtn.addEventListener('click', closeScadaChartModal);

    const activeRows = Array.isArray(hat?.scada?.active?.rows) ? hat.scada.active.rows : [];
    const measurementIds = [...new Set(
      activeRows
        .map(row => String(row.measurementId || '').trim())
        .filter(Boolean)
    )];

    if (measurementIds.length === 0) {
      _renderHistoryError(entityKey);
      return;
    }

    const cacheKey = measurementIds.slice().sort().join(',') + '|P|24h';
    if (!state.scada.history24hCache) state.scada.history24hCache = new Map();
    const cached = state.scada.history24hCache.get(cacheKey);
    const nowMs = Date.now();
    
    // Check if we bypassed cache intentionally via retry button
    const isBypassCache = window._scadaBypassCacheFor === entityKey;
    if (isBypassCache) {
       window._scadaBypassCacheFor = null;
    } else if (cached && (nowMs - cached.fetchedAt < 5 * 60 * 1000)) {
       _renderHistoryData(cached.rows, measurementIds, hat, entityKey, cached.wasTruncated);
       return;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'SCADA_HISTORY_FETCH',
        payload: {
          baseUrl: SCADA_CONFIG.SUPERSET_ORIGIN,
          dashboardId: SCADA_CONFIG.DASHBOARD_ID,
          chartSliceId: SCADA_CONFIG.CHART_SLICE_ID,
          datasourceId: SCADA_CONFIG.DATASOURCE_ID,
          elementNames: ['P'],
          measurementIds
        }
      });

      if (!result.ok || !result.data || !result.data.result || !result.data.result[0].data) {
        throw new Error('Veri alınamadı');
      }

      const rows = result.data.result[0].data;
      const rowLimit = (typeof SCADA_COMMON !== 'undefined' && SCADA_COMMON.CONFIG?.HISTORY_ROW_LIMIT) || 50000;
      const wasTruncated = rows.length >= rowLimit;

      state.scada.history24hCache.set(cacheKey, { fetchedAt: nowMs, rows, wasTruncated });
      _renderHistoryData(rows, measurementIds, hat, entityKey, wasTruncated);
    } catch (err) {
      _renderHistoryError(entityKey);
    }
  }

  function _renderHistoryData(rows, measurementIds, hat, entityKey, wasTruncated) {
      const term1Rows = [];
      const term2Rows = [];
      const mId1 = measurementIds[0];
      const mId2 = measurementIds.length > 1 ? measurementIds[1] : null;

      rows.forEach(row => {
        const mw = Number(row.maxValue);
        if (!Number.isFinite(mw)) return;
        const t = (typeof SCADA_COMMON !== 'undefined' && SCADA_COMMON.normalizeTimestamp)
          ? SCADA_COMMON.normalizeTimestamp(row.__time)
          : new Date(String(row.__time).replace(/Z$/, ''));
        if (!t || Number.isNaN(t.getTime())) return;
        const point = { ts: t, mw };
        if (String(row.sinsid) === String(mId1)) {
          term1Rows.push(point);
        } else if (mId2 && String(row.sinsid) === String(mId2)) {
          term2Rows.push(point);
        }
      });

      term1Rows.sort((a, b) => a.ts - b.ts);
      term2Rows.sort((a, b) => a.ts - b.ts);

      let html = buildSuperset24hChart(term1Rows, term2Rows, hat);
      if (wasTruncated) {
         html += '<div class="scada-chart-warning" style="color: #f59e0b; text-align: center; font-size: 11px; margin-top: 8px;">Veri satır sınırına ulaştı; 24 saat grafiği eksik olabilir.</div>';
      }
      document.getElementById('scadaChartModalBody').innerHTML = html;
  }

  function _renderHistoryError(entityKey) {
    const body = document.getElementById('scadaChartModalBody');
    if (!body) return;
    body.innerHTML = '<div class="scada-chart-empty">Veri alınamadı <button id="btnRetryScadaHistory">Yenile</button></div>';
    const retryBtn = document.getElementById('btnRetryScadaHistory');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
         window._scadaBypassCacheFor = entityKey;
         openScada24hHistory(entityKey);
      });
    }
  }

  function buildSuperset24hChart(term1, term2, hat) {
    if (!term1.length && !term2.length) return '<div class="scada-chart-empty">Grafik için yeterli geçmiş veri yok.</div>';
    const width = 960;
    const height = 360;
    const padL = 62;
    const padR = 24;
    const padT = 22;
    const padB = 42;
    const values = [...term1.map(p => p.mw), ...term2.map(p => p.mw)].filter((value) => Number.isFinite(value));
    const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);
    const minY = -maxAbs;
    const maxY = maxAbs;
    const allTs = [...term1.map(p => p.ts.getTime()), ...term2.map(p => p.ts.getTime())];
    const minTime = Math.min(...allTs);
    const maxTime = Math.max(...allTs);
    const timeSpan = maxTime - minTime || 1;
    const toX = (timeMs) => padL + ((timeMs - minTime) / timeSpan) * (width - padL - padR);
    const toY = (value) => padT + ((maxY - value) / (maxY - minY)) * (height - padT - padB);
    const makePoints = (arr) => arr
      .filter((point) => Number.isFinite(point.mw))
      .map((point) => `${toX(point.ts.getTime()).toFixed(1)},${toY(point.mw).toFixed(1)}`)
      .join(' ');

    const t1Pts = makePoints(term1);
    const t2Pts = makePoints(term2);
    const zeroY = toY(0).toFixed(1);
    const capacity = getCapacityMva('hat', hat);
    const capY = Number.isFinite(capacity) ? toY(Math.min(capacity, maxY)).toFixed(1) : null;
    const startLabel = _formatHistoryAxisLabel(minTime);
    const endLabel = _formatHistoryAxisLabel(maxTime);

    return `
      <div class="scada-history-chart scada-history-chart-large">
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="scada-hat-grafigi">
          <line x1="${padL}" y1="${zeroY}" x2="${width - padR}" y2="${zeroY}" stroke="var(--chart-grid)" stroke-width="1.2" />
          ${capY != null ? `<line x1="${padL}" y1="${capY}" x2="${width - padR}" y2="${capY}" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.75" />` : ''}
          ${t1Pts ? `<polyline points="${t1Pts}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />` : ''}
          ${t2Pts ? `<polyline points="${t2Pts}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity="0.8" />` : ''}
          <text x="${padL}" y="${height - 12}" fill="var(--muted)" font-size="11">${startLabel}</text>
          <text x="${width - padR}" y="${height - 12}" fill="var(--muted)" font-size="11" text-anchor="end">${endLabel}</text>
          <text x="${padL - 8}" y="${zeroY - 6}" fill="var(--muted)" font-size="11" text-anchor="end">0</text>
          <text x="${padL - 8}" y="${padT + 6}" fill="var(--muted)" font-size="11" text-anchor="end">${formatAxisNumber(maxAbs)}</text>
          <text x="${padL - 8}" y="${height - padB + 6}" fill="var(--muted)" font-size="11" text-anchor="end">-${formatAxisNumber(maxAbs)}</text>
        </svg>
        <div class="scada-history-chart-legend">
          ${term1.length ? `<span class="legend-active">Terminal 1 (MW)</span>` : ''}
          ${term2.length ? `<span class="legend-reactive" style="color: #ef4444;">Terminal 2 (MW)</span>` : ''}
        </div>
      </div>
    `;
  }

  
  if (typeof document !== 'undefined' && document.head && !document.getElementById('scada-history-compact-styles')) {
    const style = document.createElement('style');
    style.id = 'scada-history-compact-styles';
    style.textContent = `
      .col-hist { width: 34px; min-width: 34px; max-width: 34px; padding-left: 2px; padding-right: 2px; text-align: center; }
      .btn-history { width: 26px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
    `;
    document.head.appendChild(style);
  }

  function buildPanelRows() {
    const filter = rankingState.entityFilter;
    const rows = [];
    const getStatusDotMeta = (record) => {
      if (!record || !Number.isFinite(record.primaryValue)) {
        return {
          tone: 'is-missing',
          tooltip: 'Eslesme veya kullanilabilir veri yok'
        };
      }
      if (record.unresolved
        || record.candidateConflict
        || record.backupUsed
        || record.uncertaintyReason
        || record.uncertaintyTooltip
        || record.valueInvalid
        || record.invalidPct) {
        return {
          tone: 'is-warning',
          tooltip: record.uncertaintyTooltip
            || record.uncertaintyLabel
            || (record.valueInvalid || record.invalidPct
              ? 'Olcum verisinde teknik uyari var'
              : 'Eslesme uyarisi var')
        };
      }
      return {
        tone: 'is-ok',
        tooltip: 'Eslesme sorunu yok'
      };
    };
    const addStatusFields = (row, record) => ({
      ...(() => {
        const meta = getStatusDotMeta(record);
        return {
          statusDotTone: meta.tone,
          statusDotTooltip: meta.tooltip
        };
      })(),
      ...row,
      staleState: record?.primaryStaleState || '',
      timeState: record?.timeState || record?.primaryStaleState || '',
      timeStateLabel: record?.timeStateLabel || record?.primaryStatusText || STATUS_TEXT.dead,
      status: record ? getPrimaryStatusClass(record) : 'is-ambiguous',
      statusLabel: record?.primaryStatusText || 'Eslesmedi',
      ageLabel: getAgeLabel(record?.primaryTimestamp || null),
      resolutionMethod: record?.resolutionMethod || '',
      candidateConflict: Boolean(record?.candidateConflict),
      backupUsed: Boolean(record?.backupUsed),
      invalidPct: Boolean(record?.invalidPct),
      valueInvalid: Boolean(record?.valueInvalid),
      mwInvalid: Boolean(record?.active?.valueInvalid),
      mvarInvalid: Boolean(record?.reactive?.valueInvalid),
      displayPctMode: record?.displayPctMode || 'loading',
      uncertaintyLabel: record?.uncertaintyLabel || '',
      uncertaintyTooltip: record?.uncertaintyTooltip || '',
      uncertaintyDetails: record?.uncertaintyDetails || []
    });
    if (filter === 'hat') {
      (typeof getVisibleHats === 'function' ? getVisibleHats() : []).forEach((hat) => {
        const record = state.scada.entityMetricsByKey.get(`hat:${hat.id}`);
        rows.push(addStatusFields({
          entityKey: `hat:${hat.id}`,
          entityType: 'hat',
          name: hat.name,
          km: hat.lengthKm || 0,
          tmName: `${hat.startTm || '-'} -> ${hat.endTm || '-'}`,
          timestamp: record?.primaryTimestamp || null,
          mw: record?.active?.value,
          mvar: record?.reactive?.value,
          pct: record?.displayPct,
          pctRaw: record?.displayPctRaw,
          invalidPct: Boolean(record?.invalidPct)
        }, record));
      });
    } else if (filter === 'trafo-dist' || filter === 'trafo-trans') {
      const source = filter === 'trafo-dist'
        ? (typeof getVisibleTrafoDist === 'function' ? getVisibleTrafoDist() : [])
        : (typeof getVisibleTrafoTransmission === 'function' ? getVisibleTrafoTransmission() : []);
      source.forEach((trafo) => {
        const record = state.scada.entityMetricsByKey.get(`trafo:${trafo.id}`);
        const capacityMva = getCapacityMva('trafo', trafo);
        const capacityLabel = Number.isFinite(capacityMva) && capacityMva > 0
          ? `${Math.abs(capacityMva - Math.round(capacityMva)) < 0.01
            ? String(Math.round(capacityMva))
            : capacityMva.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MVA`
          : '';
        rows.push(addStatusFields({
          entityKey: `trafo:${trafo.id}`,
          entityType: 'trafo',
          rawName: trafo.name,
          name: trafo.displayName || (capacityLabel ? `${trafo.name} (${capacityLabel})` : trafo.name),
          tmName: trafo.tmName || '-',
          typeLabel: trafo.gerilimTuru || '-',
          timestamp: record?.primaryTimestamp || null,
          mw: record?.active?.value,
          mvar: record?.reactive?.value,
          pct: record?.loadingPct
        }, record));
      });
    } else {
      (typeof getVisibleBaras === 'function' ? getVisibleBaras() : [])
        .filter((bara) => ['154', '400'].includes(String(bara.kvBucket || bara.gerilimKv || '')))
        .forEach((bara) => {
          const record = state.scada.entityMetricsByKey.get(`bara:${bara.id}`);
          const nominal = Number(bara.gerilimKv || bara.kvBucket || 0) || 0;
          rows.push(addStatusFields({
            entityKey: `bara:${bara.id}`,
            entityType: 'bara',
            name: bara.gerilimSeviyesi || bara.name,
            tmName: bara.tmName || '-',
            kvText: bara.gerilimKv || '-',
            timestamp: record?.primaryTimestamp || null,
            kvValue: record?.voltage?.value,
            puValue: nominal > 0 && Number.isFinite(record?.voltage?.value)
              ? record.voltage.value / nominal
              : null
          }, record));
        });
    }

    const search = normalizeText(rankingState.search);
    const filtered = rows.filter((row) => {
      if (!search) return true;
      return normalizeText([row.name, row.tmName, row.typeLabel || '', row.kvText || ''].join(' ')).includes(search);
    });

    filtered.sort((left, right) => {
      let leftValue;
      let rightValue;
      switch (rankingState.sortCol) {
        case 'name':
          leftValue = String(left.name || '').toLowerCase();
          rightValue = String(right.name || '').toLowerCase();
          break;
        case 'timestamp':
          leftValue = Number(left.timestamp?.getTime?.() || 0);
          rightValue = Number(right.timestamp?.getTime?.() || 0);
          break;
        case 'mvar':
          leftValue = Math.abs(Number(left.mvar || 0));
          rightValue = Math.abs(Number(right.mvar || 0));
          break;
        case 'mw':
          leftValue = Math.abs(Number(left.mw || 0));
          rightValue = Math.abs(Number(right.mw || 0));
          break;
        case 'kv':
          leftValue = Number(left.kvValue || left.kvText || 0);
          rightValue = Number(right.kvValue || right.kvText || 0);
          break;
        case 'pu':
          leftValue = Number(left.puValue || 0);
          rightValue = Number(right.puValue || 0);
          break;
        case 'tm':
          leftValue = String(left.tmName || '').toLowerCase();
          rightValue = String(right.tmName || '').toLowerCase();
          break;
        case 'score':
        default:
          leftValue = left.invalidPct ? -1 : Number(left.pct || left.kvValue || left.mw || 0);
          rightValue = right.invalidPct ? -1 : Number(right.pct || right.kvValue || right.mw || 0);
          break;
      }
      if (leftValue < rightValue) return -1 * rankingState.sortDir;
      if (leftValue > rightValue) return 1 * rankingState.sortDir;
      return 0;
    });
    return filtered;
  }

  function getRankingKvSelectionValue() {
    const values = [...state.filters.kv].sort();
    if (values.length === 3) return '';
    if (values.length === 1) return values[0];
    return 'custom';
  }

  function syncRankingKvFilterControl() {
    const select = document.getElementById('rankingKvFilter');
    if (!select) return;
    const value = getRankingKvSelectionValue();
    select.value = value === 'custom' ? 'custom' : value;
  }

  function applyRankingKvPreset(value) {
    if (value === 'custom') return;
    setScadaPanelPage(1);
    if (!value) {
      setKvFilterSelection(['66', '154', '400']);
      return;
    }
    setKvFilterSelection([value]);
  }

  function renderRankingHeader() {
    const filter = rankingState.entityFilter;
    if (filter === 'hat') {
      return `
        <thead><tr>
          <th class="col-idx">#</th>
          <th class="col-name" data-sort="name">Hat Adi</th>
          <th class="col-km" data-sort="score">km</th>
          <th class="col-ts" data-sort="timestamp">Zaman</th>
          <th class="col-mw" data-sort="mw">MW</th>
          <th class="col-mvar" data-sort="mvar">MVAR</th>
          <th class="col-pct" data-sort="score">%</th>
          <th class="col-hist" title="Son 24 saat grafiğini göster"></th>
        </tr></thead>
      `;
    }
    if (filter === 'trafo-dist' || filter === 'trafo-trans') {
      return `
        <thead><tr>
          <th class="col-idx">#</th>
          <th class="col-tm" data-sort="tm">TM</th>
          <th class="col-name" data-sort="name">Trafo</th>
          <th class="col-ts" data-sort="timestamp">Zaman</th>
          <th class="col-mw" data-sort="mw">MW</th>
          <th class="col-mvar" data-sort="mvar">MVAR</th>
          <th class="col-pct" data-sort="score">%</th>
        </tr></thead>
      `;
    }
    return `
      <thead><tr>
        <th class="col-idx">#</th>
        <th class="col-tm" data-sort="tm">TM</th>
        <th class="col-name" data-sort="name">Gerilim</th>
        <th class="col-ts" data-sort="timestamp">Zaman</th>
        <th class="col-kv-value" data-sort="kv">kV</th>
        <th class="col-pu" data-sort="pu">p.u.</th>
        <th class="col-status">Durum</th>
      </tr></thead>
    `;
  }

  function formatPanelTimestampShort(timestamp) {
    if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) return '';
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(timestamp.getDate())}.${pad(timestamp.getMonth() + 1)}.${String(timestamp.getFullYear()).slice(-2)} ${pad(timestamp.getHours())}:${pad(timestamp.getMinutes())}`;
  }

  function getPanelTimeToneClass(row) {
    if (!row?.timestamp) return 'is-missing';
    if (row.timeState === 'dead') return 'is-dead';
    if (row.timeState === 'warn') return 'is-warn';
    const ageMs = Date.now() - row.timestamp.getTime();
    if (!Number.isFinite(ageMs) || ageMs < 0) return 'is-live-fresh';
    const ageSec = ageMs / 1000;
    if (ageSec <= 120) return 'is-live-fresh';
    if (ageSec <= 300) return 'is-live-steady';
    return 'is-live-soft';
  }

  function renderPanelTimeCell(row) {
    const label = row.timeStateLabel || (row.staleState === 'warn' ? 'Gecikmeli' : row.staleState === 'dead' ? 'Bayat' : 'Canli');
    const tooltip = row.timestamp
      ? `${label}${row.ageLabel ? ` - ${row.ageLabel}` : ''}`
      : (row.statusLabel || 'Veri yok');
    const toneClass = getPanelTimeToneClass(row);
    if (!row.timestamp) {
      return `
        <div class="ranking-time-cell" title="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">
          <span class="ranking-time-main ${toneClass}">&mdash;</span>
          <span class="ranking-time-status ${toneClass}">${escapeHtml(label)}</span>
        </div>
      `;
    }
    return `
      <div class="ranking-time-cell" title="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">
        <span class="ranking-time-main ${toneClass}">${escapeHtml(formatPanelTimestampShort(row.timestamp))}</span>
        <span class="ranking-time-status ${toneClass}">${escapeHtml(label)}</span>
      </div>
    `;
  }

  function paginateRankingRows(rows) {
    const pageSize = getPanelPageSize();
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(rankingState.page, totalPages);
    setScadaPanelPage(page);
    const start = (page - 1) * pageSize;
    return {
      totalPages,
      page,
      start,
      pageSize,
      rows: rows.slice(start, start + pageSize)
    };
  }

  function renderRankingRows(rows, pageStart = 0) {
    const filter = rankingState.entityFilter;
    if (!rows.length) {
      const colSpan = 8;
      return `<tr class="ranking-empty-row"><td colspan="${colSpan}">Secili filtrede kayit bulunamadi.</td></tr>`;
    }
    return rows.map((row, index) => {
      const activeClass = row.entityKey === rankingState.activeKey ? 'ranking-active' : '';
      const timeClass = row.timeState === 'dead' ? ' ranking-dead-row' : row.timeState === 'warn' ? ' ranking-warn-row' : '';
      const rowNo = pageStart + index + 1;
      if (filter === 'hat') {
        const pctColor = row.timeState === 'dead'
          ? (SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af')
          : row.invalidPct
          ? (SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af')
          : row.displayPctMode === 'reactive-ratio'
            ? getReactiveRatioColor(Number.isFinite(row.pct) ? row.pct : 0)
            : (Number.isFinite(row.pct) ? getFlowColor(row.pct) : '#4b5563');
        const pctTextColor = getReadableTextColor(pctColor);
        const statusDot = `<span class="status-dot ${escapeHtml(row.statusDotTone || 'is-missing')}" title="${escapeHtml(row.statusDotTooltip || 'Durum bilgisi yok')}" aria-label="${escapeHtml(row.statusDotTooltip || 'Durum bilgisi yok')}">&#9679;</span>`;
        const pctText = row.invalidPct ? '!' : Number.isFinite(row.pct) ? row.pct.toFixed(1) : '&mdash;';
        return `
          <tr class="${activeClass}${timeClass}" data-entity-key="${row.entityKey}">
            <td class="col-idx">${rowNo}</td>
            <td class="col-name" title="${escapeHtml(row.name)}"><span class="ranking-name-cell">${statusDot}<span class="ranking-name-text">${escapeHtml(row.name || '-')}</span></span></td>
            <td class="col-km">${Number.isFinite(row.km) ? row.km.toFixed(0) : '&mdash;'}</td>
            <td class="col-ts">${renderPanelTimeCell(row)}</td>
            <td class="col-mw">${row.mwInvalid ? '!' : Number.isFinite(row.mw) ? `${row.mw >= 0 ? '+' : ''}${row.mw.toFixed(1)}` : '&mdash;'}</td>
            <td class="col-mvar">${row.mvarInvalid ? '!' : Number.isFinite(row.mvar) ? `${row.mvar >= 0 ? '+' : ''}${row.mvar.toFixed(1)}` : '-'}</td>
            <td class="col-pct"><span class="ranking-pct-cell${row.invalidPct ? ' is-invalid' : ''}" style="background:${pctColor};color:${pctTextColor}">${pctText}</span></td>
            <td class="col-hist"><button type="button" class="btn-history" data-history-entity="${row.entityKey}" title="Son 24 saat grafiğini göster" aria-label="Son 24 saat grafiğini göster">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </button></td>
          </tr>
        `;
      }
      if (filter === 'trafo-dist' || filter === 'trafo-trans') {
        const pctColor = row.timeState === 'dead'
          ? (SCADA_CONFIG.NO_MATCH_COLOR || '#9ca3af')
          : (Number.isFinite(row.pct) ? getFlowColor(row.pct) : '#4b5563');
        const pctTextColor = getReadableTextColor(pctColor);
        return `
          <tr class="${activeClass}${timeClass}" data-entity-key="${row.entityKey}">
            <td class="col-idx">${rowNo}</td>
            <td class="col-tm">${escapeHtml(row.tmName || '-')}</td>
            <td class="col-name" title="${escapeHtml(row.name)}"><span class="ranking-name-text">${escapeHtml(row.name || '-')}</span></td>
            <td class="col-ts">${renderPanelTimeCell(row)}</td>
            <td class="col-mw">${row.mwInvalid ? '!' : Number.isFinite(row.mw) ? `${row.mw >= 0 ? '+' : ''}${row.mw.toFixed(1)}` : '&mdash;'}</td>
            <td class="col-mvar">${row.mvarInvalid ? '!' : Number.isFinite(row.mvar) ? `${row.mvar >= 0 ? '+' : ''}${row.mvar.toFixed(1)}` : '-'}</td>
            <td class="col-pct"><span class="ranking-pct-cell" style="background:${pctColor};color:${pctTextColor}">${Number.isFinite(row.pct) ? row.pct.toFixed(1) : '&mdash;'}</span></td>
          </tr>
        `;
      }
      return `
        <tr class="${activeClass}${timeClass}" data-entity-key="${row.entityKey}">
          <td class="col-idx">${rowNo}</td>
          <td class="col-tm">${escapeHtml(row.tmName || '-')}</td>
          <td class="col-name" title="${escapeHtml(row.name)}"><span class="ranking-name-text">${escapeHtml(row.name || '-')}</span></td>
          <td class="col-ts">${renderPanelTimeCell(row)}</td>
          <td class="col-kv-value">${Number.isFinite(row.kvValue) ? row.kvValue.toFixed(1) : '&mdash;'}</td>
          <td class="col-pu">${Number.isFinite(row.puValue) ? row.puValue.toFixed(3) : '&mdash;'}</td>
          <td class="col-status"><span class="ranking-status-pill ${row.status}">${escapeHtml(row.statusLabel || '-')}</span></td>
        </tr>
      `;
    }).join('');
  }

  toggleRankingPanel = function () {
    let panel = document.getElementById('rankingPanel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        if (rankingState.dirty !== false) refreshRankingTable();
      }
      return;
    }
    panel = document.createElement('div');
    panel.id = 'rankingPanel';
    panel.className = 'ranking-panel';
    if (state.map.theme === 'light') panel.classList.add('light-mode');
    panel.innerHTML = `
      <div class="ranking-header">
        <div class="ranking-header-left">
          <span>SCADA Paneli</span>
        </div>
        <button id="btnRankingClose">Ã—</button>
      </div>
      <div class="ranking-entity-tabs">
        <button type="button" data-entity-filter="hat">Hatlar</button>
        <button type="button" data-entity-filter="trafo-dist">Trafo (Dagitim)</button>
        <button type="button" data-entity-filter="trafo-trans">Trafo (Iletim)</button>
        <button type="button" data-entity-filter="voltage">Gerilim (kV)</button>
      </div>
      <div class="ranking-filters">
        <input type="text" id="rankingSearch" placeholder="SCADA oge ara...">
        <select id="rankingKvFilter">
          <option value="">Tumu</option>
          <option value="400">400 kV</option>
          <option value="154">154 kV</option>
          <option value="66">66 kV</option>
          <option value="custom" disabled>Ozel</option>
        </select>
      </div>
      <div class="ranking-body">
        <table class="ranking-table" id="rankingTable"></table>
      </div>
      <div class="ranking-footer">
        <span id="rankingCount"></span>
        <div class="ranking-footer-pager">
          <button id="btnRankingPrev" type="button" title="Onceki sayfa">&larr;</button>
          <span id="rankingPageState" class="ranking-page-state">1 / 1</span>
          <button id="btnRankingNext" type="button" title="Sonraki sayfa">&rarr;</button>
        </div>
        <div class="ranking-footer-actions">
          <button id="btnRankingFontDown" type="button" title="Yaziyi kucult">${iconMarkup('fontMinus', 'A-')}</button>
          <button id="btnRankingFontReset" type="button" title="Yaziyi sifirla">${iconMarkup('fontReset', 'A0')}</button>
          <button id="btnRankingFontUp" type="button" title="Yaziyi buyut">${iconMarkup('fontPlus', 'A+')}</button>
          <button id="btnRankingCsv" type="button" title="CSV indir">${iconMarkup('download', 'CSV Indir')}</button>
        </div>
      </div>
    `;
    const mapShell = document.querySelector('.map-shell');
    if (mapShell) mapShell.appendChild(panel);

    const closeButton = document.getElementById('btnRankingClose');
    if (closeButton) {
      closeButton.innerHTML = '&times;';
      closeButton.title = 'Kapat';
    }
    document.getElementById('btnRankingClose').addEventListener('click', closeRankingPanel);
    document.getElementById('btnRankingCsv').addEventListener('click', exportRankingCsv);
    document.getElementById('rankingSearch').addEventListener('input', (event) => {
      rankingState.search = event.target.value;
      setScadaPanelPage(1);
      refreshRankingTable();
    });
    document.getElementById('rankingKvFilter').addEventListener('change', (event) => {
      applyRankingKvPreset(event.target.value);
    });
    document.getElementById('btnRankingPrev').addEventListener('click', () => {
      setScadaPanelPage(rankingState.page - 1);
      refreshRankingTable();
    });
    document.getElementById('btnRankingNext').addEventListener('click', () => {
      setScadaPanelPage(rankingState.page + 1);
      refreshRankingTable();
    });
    document.getElementById('btnRankingFontDown').addEventListener('click', () => {
      setScadaPanelFontScale(rankingState.fontScale === 'large' ? 'normal' : 'compact');
      refreshRankingTable();
    });
    document.getElementById('btnRankingFontReset').addEventListener('click', () => {
      setScadaPanelFontScale('normal');
      refreshRankingTable();
    });
    document.getElementById('btnRankingFontUp').addEventListener('click', () => {
      setScadaPanelFontScale(rankingState.fontScale === 'compact' ? 'normal' : 'large');
      refreshRankingTable();
    });
    panel.querySelector('.ranking-entity-tabs').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-entity-filter]');
      if (!button) return;
      setRankingEntityFilter(button.dataset.entityFilter);
    });
    panel.querySelector('.ranking-body').addEventListener('click', (event) => {
      const btnHist = event.target.closest('.btn-history');
      if (btnHist) {
        event.preventDefault();
        event.stopPropagation();
        openScada24hHistory(btnHist.dataset.historyEntity);
        return;
      }
      const row = event.target.closest('tr[data-entity-key]');
      if (!row) return;
      openPanelEntity(row.dataset.entityKey);
    });
    panel.querySelector('.ranking-body').addEventListener('click', (event) => {
      const th = event.target.closest('th[data-sort]');
      if (!th) return;
      const col = th.dataset.sort;
      if (rankingState.sortCol === col) rankingState.sortDir *= -1;
      else {
        rankingState.sortCol = col;
        rankingState.sortDir = col === 'name' ? 1 : -1;
      }
      refreshRankingTable();
    }, true);

    syncRankingKvFilterControl();
    refreshRankingTable();
  };

  closeRankingPanel = function () {
    const panel = document.getElementById('rankingPanel');
    if (panel) panel.classList.add('hidden');
    rankingState.search = '';
    rankingState.activeKey = '';
    const searchInput = document.getElementById('rankingSearch');
    if (searchInput) searchInput.value = '';
    requestRender();
  };

  function openPanelEntity(entityKey) {
    rankingState.activeKey = entityKey;
    const [entityType, entityId] = String(entityKey || '').split(':');
    if (entityType === 'hat') {
      const hat = state.network.hatById?.get(String(entityId)) || state.network.hatLines.find((entry) => String(entry.id) === String(entityId));
      if (!hat) return;
      const anchor = getHatAnchorCoord(hat);
      state.map.centerLon = anchor.lon;
      state.map.centerLat = anchor.lat;
      state.map.tileState.rangeKey = '';
      openScadaHatDetails(hat, { anchorCoord: anchor, forceTiles: true });
    } else if (entityType === 'trafo') {
      const trafo = state.network.trafos.find((entry) => String(entry.id) === String(entityId));
      const tm = trafo?.tm || getEntityTm(trafo);
      if (!trafo || !tm) return;
      state.map.centerLon = Number(tm.lon);
      state.map.centerLat = Number(tm.lat);
      state.map.tileState.rangeKey = '';
      openTrafoDetails(trafo, { lon: Number(tm.lon), lat: Number(tm.lat) });
      requestRender({ forceTiles: true });
    } else if (entityType === 'bara') {
      const bara = state.network.baraNodes.find((entry) => String(entry.id) === String(entityId));
      const tm = bara?.tm || getEntityTm(bara);
      if (!bara || !tm) return;
      state.map.centerLon = Number(tm.lon);
      state.map.centerLat = Number(tm.lat);
      state.map.tileState.rangeKey = '';
      openBaraNodeDetails(bara, { lon: Number(tm.lon), lat: Number(tm.lat) });
      requestRender({ forceTiles: true });
    }
    refreshRankingTable();
  }

  refreshRankingTable = function () {
    const panel = document.getElementById('rankingPanel');
    const table = document.getElementById('rankingTable');
    if (!table || !panel) return;
    if (panel.classList.contains('hidden')) {
      rankingState.dirty = true;
      return;
    }
    rankingState.dirty = false;
    panel.classList.toggle('light-mode', state.map?.theme === 'light');
    syncRankingKvFilterControl();
    panel.classList.remove('font-compact', 'font-large');
    if (rankingState.fontScale === 'compact') panel.classList.add('font-compact');
    if (rankingState.fontScale === 'large') panel.classList.add('font-large');
    const allRows = buildPanelRows();
    const pageState = paginateRankingRows(allRows);
    const filterButtons = Array.from(document.querySelectorAll('.ranking-entity-tabs button[data-entity-filter]'));
    filterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.entityFilter === rankingState.entityFilter);
    });
    table.innerHTML = `${renderRankingHeader()}<tbody id="rankingTbody">${renderRankingRows(pageState.rows, pageState.start)}</tbody>`;
    const countEl = document.getElementById('rankingCount');
    if (countEl) countEl.textContent = `${pageState.rows.length} / ${allRows.length} ${ENTITY_LABELS[rankingState.entityFilter] || 'oge'}`;
    const pageLabel = document.getElementById('rankingPageState');
    if (pageLabel) pageLabel.textContent = `${pageState.page} / ${pageState.totalPages}`;
    const prevButton = document.getElementById('btnRankingPrev');
    if (prevButton) prevButton.disabled = pageState.page <= 1;
    const nextButton = document.getElementById('btnRankingNext');
    if (nextButton) nextButton.disabled = pageState.page >= pageState.totalPages;
  };

  function formatPanelTimestampCsv(row) {
    if (!row.timestamp) return '';
    const base = `${row.timestamp.toLocaleDateString('tr-TR')} ${row.timestamp.toLocaleTimeString('tr-TR')}`;
    if (row.staleState === 'live') return base;
    return `${base} - ${row.statusLabel || 'Bayat'}${row.ageLabel ? ` (${row.ageLabel})` : ''}`;
  }

  function buildCsvRows(rows) {
    const filter = rankingState.entityFilter;
    if (filter === 'hat') {
      return {
        header: ['Sira', 'Hat Adi', 'km', 'Zaman', 'Durum', 'Veri Yasi', 'MW', 'MVAR', 'Gosterim Orani (%)', 'Resolution Method', 'Candidate Conflict', 'Backup Used', 'Belirsizlik', 'Oran Modu', 'Gecersiz Oran'],
        rows: rows.map((row, index) => [
          index + 1,
          row.name,
          Number.isFinite(row.km) ? row.km.toFixed(1).replace('.', ',') : '',
          formatPanelTimestampCsv(row),
          row.statusLabel || '',
          row.ageLabel || '',
          row.mwInvalid ? '!' : Number.isFinite(row.mw) ? row.mw.toFixed(2).replace('.', ',') : '',
          row.mvarInvalid ? '!' : Number.isFinite(row.mvar) ? row.mvar.toFixed(2).replace('.', ',') : '-',
          row.invalidPct ? '!' : Number.isFinite(row.pct) ? row.pct.toFixed(2).replace('.', ',') : '',
          row.resolutionMethod || '',
          row.candidateConflict ? 'yes' : '',
          row.backupUsed ? 'yes' : '',
          row.uncertaintyLabel || '',
          row.displayPctMode || '',
          row.invalidPct ? 'yes' : ''
        ])
      };
    }
    if (filter === 'trafo-dist' || filter === 'trafo-trans') {
      return {
        header: ['Sira', 'Trafo', 'TM', 'Tip', 'Zaman', 'Durum', 'Veri Yasi', 'MW', 'MVAR', 'Yuklenme (%)', 'Resolution Method'],
        rows: rows.map((row, index) => [
          index + 1,
          row.name,
          row.tmName,
          row.typeLabel,
          formatPanelTimestampCsv(row),
          row.statusLabel || '',
          row.ageLabel || '',
          row.mwInvalid ? '!' : Number.isFinite(row.mw) ? row.mw.toFixed(2).replace('.', ',') : '',
          row.mvarInvalid ? '!' : Number.isFinite(row.mvar) ? row.mvar.toFixed(2).replace('.', ',') : '-',
          Number.isFinite(row.pct) ? row.pct.toFixed(2).replace('.', ',') : '',
          row.resolutionMethod || ''
        ])
      };
    }
    return {
        header: ['Sira', 'TM', 'Gerilim', 'Zaman', 'Durum', 'Veri Yasi', 'Gerilim (kV)', 'p.u.'],
        rows: rows.map((row, index) => [
          index + 1,
          row.tmName,
          row.name,
          formatPanelTimestampCsv(row),
          row.statusLabel || '',
          row.ageLabel || '',
          Number.isFinite(row.kvValue) ? row.kvValue.toFixed(2).replace('.', ',') : '',
          Number.isFinite(row.puValue) ? row.puValue.toFixed(3).replace('.', ',') : ''
        ])
      };
  }

  exportRankingCsv = function () {
    const rows = buildPanelRows();
    if (!rows.length) return;
    const csv = buildCsvRows(rows);
    const filename = `scada_panel_${rankingState.entityFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    if (typeof downloadScadaCsvFile === 'function') {
      downloadScadaCsvFile(filename, csv.header, csv.rows);
    }
    scadaLog('info', `SCADA panel CSV indirildi: ${rows.length} satir.`);
  };

  function buildScadaAuditReport() {
    const scope = state.scada.currentScope || getCurrentScadaScope();
    const incrementTimeBucket = (timeState) => {
      if (timeState === 'dead') summary.dead += 1;
      else if (timeState === 'warn') summary.delayed += 1;
      else summary.live += 1;
    };
    const summary = {
      visibleTotal: scope.entities.length,
      rawRows: state.scada.totalRows || 0,
      normalizedRows: state.scada.measurementRowsById?.size || 0,
      live: 0,
      delayed: 0,
      dead: 0,
      stale: 0,
      structuralMatches: 0,
      missingConfigId: 0,
      missingSourceRow: 0,
      ambiguousLive: 0,
      ambiguousWarning: 0,
      orientationUnknown: 0,
      resolvedTerminalMismatch: 0,
      resolvedWithWarning: 0,
      transportUnavailable: 0,
      unmatchedTotal: 0,
      filterKey: scope.filterKey,
      queryContract: {
        timeRange: SCADA_CONFIG.QUERY_TIME_RANGE,
        kvFilters: [],
        tearFilters: [],
        rowLimit: Math.max(SCADA_CONFIG.QUERY_ROW_LIMIT, scope.measurementIds.length * 3 || 5000)
      },
      dataTimestamp: state.scada.lastDataTimestamp,
      transportMode: state.scada.lastTransport?.authMode || '-',
      metricMode: scope.modeLabel
    };

    const rows = scope.entities.map((entity) => {
      const entityType = scope.domain === 'bara' ? 'bara' : scope.domain;
      const record = state.scada.entityMetricsByKey.get(`${entityType}:${entity.id}`);
      const ids = entityType === 'bara'
        ? (entity.scada?.voltage?.ids || [])
        : (entity.scada?.[scope.primaryMetric]?.ids || []);
      let status = 'missing-config-id';
      let reason = 'Entity icin ilgili SCADA olcum ID tanimli degil.';
      const primaryMetricRecord = scope.domain === 'bara'
        ? record?.voltage
        : scope.primaryMetric === 'reactive'
          ? record?.reactive
          : record?.active;
      const candidateDetails = Array.isArray(primaryMetricRecord?.candidateDetails)
        ? primaryMetricRecord.candidateDetails
        : [];
      const candidateA = candidateDetails[0] || null;
      const candidateB = candidateDetails[1] || null;
      const resolutionClass = getHatResolutionClass(record);
      if (!ids.length) {
        summary.missingConfigId += 1;
        summary.unmatchedTotal += 1;
      } else if (!record) {
        status = 'missing-source-row';
        reason = 'Olcum ID kaynak sorguda bulunamadi.';
        summary.missingSourceRow += 1;
        summary.unmatchedTotal += 1;
      } else if (['orientation-unknown', 'source-side-unknown', 'polarization-mismatch'].includes(record.unresolvedReason)) {
        status = 'orientation-unknown';
        reason = record.unresolvedReason === 'polarization-mismatch'
          ? 'Terminal tarafi bulundu ancak formul polarizasyonu ile uyusmadi.'
          : record.unresolvedReason === 'source-side-unknown'
            ? 'Baslangic / bitis terminal tarafi dogrulanamadi.'
            : 'Canli aday bulundu ancak hat yonu cozulmedi.';
        summary.structuralMatches += 1;
        summary.orientationUnknown += 1;
        summary.ambiguousLive += 1;
      } else if (record.candidateConflict || record.backupUsed) {
        status = 'ambiguous-warning';
        reason = record.backupUsed
          ? 'Ana aday kullanilamadi veya celisti; yedek adayla cozuldu.'
          : 'Coklu aday tolerans disi; ana aday gosteriliyor ve kayit uyarili isaretlendi.';
        summary.structuralMatches += 1;
        summary.ambiguousWarning += 1;
        incrementTimeBucket(record.primaryStaleState);
      } else if (record.invalidPct || record.uncertaintyReason === 'invalid-pct') {
        status = 'ambiguous-warning';
        reason = 'Oran %300 uzeri oldugu icin gecersiz kabul edildi.';
        summary.structuralMatches += 1;
        summary.ambiguousWarning += 1;
        incrementTimeBucket(record.primaryStaleState);
      } else if (record.valueInvalid) {
        status = 'ambiguous-warning';
        reason = 'Olcum degeri 1.5x kapasite sinirini gectigi icin secim gecersiz kabul edildi.';
        summary.structuralMatches += 1;
        summary.ambiguousWarning += 1;
        incrementTimeBucket(record.primaryStaleState);
      } else if (record.sourceAmbiguous || record.unresolved) {
        status = 'ambiguous-live';
        reason = 'Birden fazla canli aday kayit tutarsiz durumda.';
        summary.structuralMatches += 1;
        summary.ambiguousLive += 1;
      } else if (!Number.isFinite(record.primaryValue)) {
        status = 'missing-source-row';
        reason = 'Olcum ID kaynak sorguda bulunamadi.';
        summary.missingSourceRow += 1;
        summary.unmatchedTotal += 1;
      } else if (record.resolvedTerminalMismatch) {
        status = record.primaryStaleState === 'dead'
          ? 'matched-dead'
          : record.primaryStaleState === 'warn'
            ? 'matched-delayed'
            : 'matched-live';
        reason = 'Formul polarizasyonu farkli; akis yonu terminal-exit modeliyle cozuldu.';
        summary.structuralMatches += 1;
        summary.resolvedTerminalMismatch += 1;
        summary.resolvedWithWarning += 1;
        incrementTimeBucket(record.primaryStaleState);
      } else if (record.primaryStaleState === 'dead') {
        status = 'matched-dead';
        reason = record.resolvedFromMultiple
          ? 'Kaynak satir toleransli coklu olcum birlestirmesiyle secildi ancak veri bayat durumda.'
          : 'Kaynak satir bulundu ancak veri bayat durumda.';
        summary.structuralMatches += 1;
        summary.dead += 1;
      } else if (record.primaryStaleState === 'warn') {
        status = 'matched-delayed';
        reason = record.resolvedFromMultiple
          ? 'Kaynak satir toleransli coklu olcum birlestirmesiyle secildi ancak veri gecikmeli durumda.'
          : 'Kaynak satir bulundu ancak veri gecikmeli durumda.';
        summary.structuralMatches += 1;
        summary.delayed += 1;
      } else {
        status = 'matched-live';
        reason = record.resolvedFromMultiple
          ? 'Kaynak satir toleransli coklu olcum birlestirmesiyle secildi.'
          : 'Kaynak satir tekil olarak eslesti.';
        summary.structuralMatches += 1;
        summary.live += 1;
      }
      return {
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        tmName: entity.tmName || entity.startTm || '-',
        kv: entity.kvBucket || entity.kv || entity.gerilimKv || entity.primaryKv || '-',
        scadaId: record?.primaryMeasurementId || ids.join(','),
        status,
        reason,
        sourceTimestamp: record?.primaryTimestamp || null,
        primaryValue: record?.primaryValue,
        secondaryValue: scope.domain !== 'bara'
          ? (scope.primaryMetric === 'active' ? record?.reactive?.value : record?.active?.value)
          : null,
        loadingPct: record?.loadingPct ?? null,
        staleState: record?.primaryStaleState || '',
        timeState: record?.timeState || record?.primaryStaleState || '',
        timeStateLabel: record?.timeStateLabel || record?.primaryStatusText || '',
        ageLabel: record?.ageLabel || '',
        sourceTm: record?.active?.sourceTm || record?.reactive?.sourceTm || record?.voltage?.sourceTm || '',
        sourceRemote: record?.active?.sourceRemote || record?.reactive?.sourceRemote || record?.voltage?.sourceRemote || '',
        directionMetric: record?.directionMetric || scope.primaryMetric || '',
        directionModel: record?.directionModel || '',
        directionValue: record?.directionValue ?? null,
        directionResolvedBy: record?.directionResolvedBy || '',
        formulaSign: Number.isFinite(Number(record?.formulaSign)) ? Number(record.formulaSign) : null,
        orientationMatch: record?.orientationMatch || '',
        aliasMatchBasis: record?.aliasMatchBasis || '',
        terminalSide: record?.terminalSide || '',
        terminalMatchBasis: record?.terminalMatchBasis || '',
        polarizationSign: Number.isFinite(Number(record?.polarizationSign)) ? Number(record.polarizationSign) : null,
        polarizationConsistent: record?.polarizationConsistent == null ? null : Boolean(record.polarizationConsistent),
        resolutionMethod: record?.resolutionMethod || '',
        uncertaintyReason: record?.uncertaintyReason || '',
        uncertaintyLabel: record?.uncertaintyLabel || '',
        candidateSlot: record?.candidateSlot || '',
        sourceSide: record?.sourceSide || '',
        targetSide: record?.targetSide || '',
        selectedCandidate: record?.selectedCandidate || '',
        selectedCandidateReason: record?.selectedCandidateReason || '',
        backupUsed: Boolean(record?.backupUsed),
        formulaSignApplied: Number.isFinite(Number(record?.formulaSignApplied)) ? Number(record.formulaSignApplied) : null,
        orientationRule: record?.orientationRule || '',
        resolutionClass,
        resolvedTerminalMismatch: Boolean(record?.resolvedTerminalMismatch),
        candidateConflict: Boolean(record?.candidateConflict),
        displayPct: record?.displayPct ?? null,
        displayPctMode: record?.displayPctMode || '',
        invalidPct: Boolean(record?.invalidPct),
        valueInvalid: Boolean(record?.valueInvalid),
        capacityLimit: Number.isFinite(Number(record?.capacityLimit)) ? Number(record.capacityLimit) : null,
        capacityFilterPassed: typeof record?.capacityFilterPassed === 'boolean' ? Boolean(record.capacityFilterPassed) : null,
        candidateARawValue: Number.isFinite(candidateA?.rawValue) ? Number(candidateA.rawValue) : null,
        candidateATimestamp: candidateA?.timestamp || null,
        candidateAFormula: candidateA?.formulaRaw || '',
        candidateATerminal: candidateA?.terminalSide || '',
        candidateBRawValue: Number.isFinite(candidateB?.rawValue) ? Number(candidateB.rawValue) : null,
        candidateBTimestamp: candidateB?.timestamp || null,
        candidateBFormula: candidateB?.formulaRaw || '',
        candidateBTerminal: candidateB?.terminalSide || ''
      };
    });

    summary.stale = summary.delayed + summary.dead;

    return {
      summary,
      rows,
      mismatches: rows.filter((row) => !String(row.status || '').startsWith('matched-')),
      resolvedWarnings: rows.filter((row) => row.resolvedTerminalMismatch || row.resolutionClass === 'resolved-with-warning')
    };
  }

  exportScadaAuditCsv = function () {
    const report = buildScadaAuditReport();
    if (!report.rows.length) return;
    const header = [
      'Tur',
      'ID',
      'Ad',
      'TM',
      'kV',
      'SCADA ID',
      'Durum',
      'Neden',
      'Kaynak Zaman',
      'Birincil',
      'Ikincil',
      'Gosterim Orani (%)',
      'Oran Modu',
      'Gecersiz Oran',
      'Time State',
      'Time State Label',
      'Time Age Label',
      'Direction Metric',
      'Direction Model',
      'Direction Value',
      'Direction Source',
      'Formula Sign',
      'Orientation Match',
      'Alias Match Basis',
      'Resolution Method',
      'Resolution Class',
      'Uncertainty Reason',
      'Uncertainty Label',
      'Candidate Slot',
      'Source Side',
      'Target Side',
      'Terminal Side',
      'Terminal Match Basis',
      'Polarization Sign',
      'Polarization Consistent',
      'Selected Candidate',
      'Selected Candidate Reason',
      'Backup Used',
      'Resolved Terminal Mismatch',
      'Formula Sign Applied',
      'Orientation Rule',
      'Candidate Conflict',
      'Capacity Limit',
      'Capacity Filter Passed',
      'Value Invalid',
      'Candidate A Raw Value',
      'Candidate A Timestamp',
      'Candidate A Formula',
      'Candidate A Terminal',
      'Candidate B Raw Value',
      'Candidate B Timestamp',
      'Candidate B Formula',
      'Candidate B Terminal'
    ];
    const rows = report.rows.map((row) => [
      row.entityType,
      row.entityId,
      row.entityName,
      row.tmName,
      row.kv,
      row.scadaId,
      row.status,
      row.reason,
      row.sourceTimestamp ? `${row.sourceTimestamp.toLocaleDateString('tr-TR')} ${row.sourceTimestamp.toLocaleTimeString('tr-TR')}` : '',
      Number.isFinite(row.primaryValue) ? row.primaryValue.toFixed(2).replace('.', ',') : '',
      Number.isFinite(row.secondaryValue) ? row.secondaryValue.toFixed(2).replace('.', ',') : '',
      row.invalidPct ? '!' : Number.isFinite(row.displayPct) ? row.displayPct.toFixed(2).replace('.', ',') : '',
      row.displayPctMode,
      row.invalidPct ? 'yes' : '',
      row.timeState,
      row.timeStateLabel,
      row.ageLabel,
      row.directionMetric,
      row.directionModel,
      Number.isFinite(row.directionValue) ? row.directionValue.toFixed(2).replace('.', ',') : '',
      row.directionResolvedBy,
      Number.isFinite(row.formulaSign) ? String(row.formulaSign) : '',
      row.orientationMatch,
      row.aliasMatchBasis,
      row.resolutionMethod,
      row.resolutionClass,
      row.uncertaintyReason,
      row.uncertaintyLabel,
      row.candidateSlot,
      row.sourceSide,
      row.targetSide,
      row.terminalSide,
      row.terminalMatchBasis,
      Number.isFinite(row.polarizationSign) ? String(row.polarizationSign) : '',
      row.polarizationConsistent == null ? '' : (row.polarizationConsistent ? 'yes' : 'no'),
      row.selectedCandidate,
      row.selectedCandidateReason,
      row.backupUsed ? 'yes' : '',
      row.resolvedTerminalMismatch ? 'yes' : '',
      Number.isFinite(row.formulaSignApplied) ? String(row.formulaSignApplied) : '',
      row.orientationRule,
      row.candidateConflict ? 'yes' : '',
      Number.isFinite(row.capacityLimit) ? row.capacityLimit.toFixed(2).replace('.', ',') : '',
      row.capacityFilterPassed == null ? '' : (row.capacityFilterPassed ? 'yes' : 'no'),
      row.valueInvalid ? 'yes' : '',
      Number.isFinite(row.candidateARawValue) ? row.candidateARawValue.toFixed(2).replace('.', ',') : '',
      row.candidateATimestamp ? `${row.candidateATimestamp.toLocaleDateString('tr-TR')} ${row.candidateATimestamp.toLocaleTimeString('tr-TR')}` : '',
      row.candidateAFormula,
      row.candidateATerminal,
      Number.isFinite(row.candidateBRawValue) ? row.candidateBRawValue.toFixed(2).replace('.', ',') : '',
      row.candidateBTimestamp ? `${row.candidateBTimestamp.toLocaleDateString('tr-TR')} ${row.candidateBTimestamp.toLocaleTimeString('tr-TR')}` : '',
      row.candidateBFormula,
      row.candidateBTerminal
    ]);
    if (typeof downloadScadaCsvFile === 'function') {
      downloadScadaCsvFile(`scada_eslesme_denetim_${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    }
    setScadaStatusMessage(`Denetim CSV indirildi: ${report.rows.length} oge.`, report.mismatches.length ? 'warn' : 'info');
    scadaLog('info', `Denetim CSV indirildi: ${report.rows.length} oge, ${report.mismatches.length} mismatch.`);
  };

  function getScadaAuditModalRows(report, filter) {
    if (filter === 'resolved-with-warning') return report.resolvedWarnings || [];
    if (filter === 'orientation-unknown') return report.rows.filter((row) => row.status === 'orientation-unknown');
    if (filter === 'missing') return report.rows.filter((row) => ['missing-config-id', 'missing-source-row'].includes(row.status));
    return report.mismatches || [];
  }

  function getScadaAuditModalListTitle(filter) {
    if (filter === 'resolved-with-warning') return 'Terminal yorumlu cozumler';
    if (filter === 'orientation-unknown') return 'Yon belirsiz kayitlar';
    if (filter === 'missing') return 'Eksik kayitlar';
    return 'Ornek problemli kayitlar';
  }

  showScadaMismatchReportModal = function (filter = '') {
    const report = buildScadaAuditReport();
    if (!report.rows.length) {
      setScadaStatusMessage('Mismatch raporu icin henuz SCADA verisi bulunmuyor.', 'warn');
      return;
    }
    const existing = document.getElementById('scadaAuditModalBackdrop');
    if (existing) existing.remove();
    const modalRows = getScadaAuditModalRows(report, filter);
    const listTitle = getScadaAuditModalListTitle(filter);
    const mismatchItems = modalRows.slice(0, 16).map((row) => `
      <div class="scada-audit-item">
        <strong>${escapeHtml(row.entityName || row.entityId || '-')}</strong>
        <span>${escapeHtml(row.status || '-')} | ${escapeHtml(row.reason || '-')}</span>
        <span>${escapeHtml(row.tmName || '-')}</span>
        <span>SCADA ID: ${escapeHtml(row.scadaId || '-')}</span>
      </div>
    `).join('');
    const backdrop = document.createElement('div');
    backdrop.id = 'scadaAuditModalBackdrop';
    backdrop.className = 'scada-chart-backdrop';
    backdrop.innerHTML = `
      <div class="scada-audit-modal" role="dialog" aria-modal="true" aria-label="SCADA mismatch raporu">
        <div class="scada-chart-header">
          <div>
            <p class="info-kicker">SCADA Mismatch Raporu</p>
            <h3>${escapeHtml(report.summary.metricMode || 'SCADA')}</h3>
          </div>
          <div class="info-actions">
            <button id="btnExportAuditFromModal" class="secondary">Denetim CSV</button>
            <button id="btnCloseScadaAudit" class="info-close" title="Kapat">Ã—</button>
          </div>
        </div>
        <div class="scada-audit-summary">
          <div class="scada-audit-stat"><span>Gorunen</span><strong>${report.summary.visibleTotal || 0}</strong></div>
          <div class="scada-audit-stat"><span>Canli / Gecikmeli / Bayat</span><strong>${report.summary.live || 0} / ${report.summary.delayed || 0} / ${report.summary.dead || 0}</strong></div>
          <div class="scada-audit-stat"><span>Uyarili cozum</span><strong>${report.summary.ambiguousWarning || 0}</strong></div>
          <div class="scada-audit-stat"><span>Belirsiz</span><strong>${report.summary.ambiguousLive || 0}</strong></div>
          <div class="scada-audit-stat"><span>Yon Belirsiz</span><strong>${report.summary.orientationUnknown || 0}</strong></div>
          <div class="scada-audit-stat"><span>Terminal yorumlu</span><strong>${report.summary.resolvedWithWarning || 0}</strong></div>
          <div class="scada-audit-stat"><span>Eksik</span><strong>${report.summary.unmatchedTotal || 0}</strong></div>
        </div>
        <div class="scada-chart-body">
          <div class="scada-audit-section">
            <h4>Kaynak ve Sorgu Kontrati</h4>
            <div class="scada-audit-grid">
              <div><span>Ham kaynak satiri</span><strong>${report.summary.rawRows || 0}</strong></div>
              <div><span>Tekil olcum</span><strong>${report.summary.normalizedRows || 0}</strong></div>
              <div><span>Son veri zamani</span><strong>${escapeHtml(report.summary.dataTimestamp ? `${report.summary.dataTimestamp.toLocaleDateString('tr-TR')} ${report.summary.dataTimestamp.toLocaleTimeString('tr-TR')}` : '-')}</strong></div>
              <div><span>Tasima</span><strong>${escapeHtml(report.summary.transportMode || '-')}</strong></div>
              <div><span>Zaman araligi</span><strong>${escapeHtml(report.summary.queryContract?.timeRange || '-')}</strong></div>
              <div><span>Row limit</span><strong>${report.summary.queryContract?.rowLimit || 0}</strong></div>
            </div>
          </div>
          <div class="scada-audit-section">
            <h4>Mismatch Dagilimi</h4>
            <div class="scada-audit-grid">
              <div><span>Config ID yok</span><strong>${report.summary.missingConfigId || 0}</strong></div>
              <div><span>Kaynakta yok</span><strong>${report.summary.missingSourceRow || 0}</strong></div>
              <div><span>Belirsiz canli</span><strong>${report.summary.ambiguousLive || 0}</strong></div>
              <div><span>Uyarili cozum</span><strong>${report.summary.ambiguousWarning || 0}</strong></div>
              <div><span>Terminal yorumlu</span><strong>${report.summary.resolvedWithWarning || 0}</strong></div>
              <div><span>Yon belirsiz</span><strong>${report.summary.orientationUnknown || 0}</strong></div>
              <div><span>Gecikmeli</span><strong>${report.summary.delayed || 0}</strong></div>
              <div><span>Bayat</span><strong>${report.summary.dead || 0}</strong></div>
            </div>
          </div>
          <div class="scada-audit-section">
            <h4>${escapeHtml(listTitle)}</h4>
            <div class="scada-audit-list">
              ${mismatchItems || '<div class="scada-audit-item"><strong>Kayit yok</strong><span>Secili sinifta kayit bulunmadi.</span></div>'}
            </div>
          </div>
        </div>
      </div>
    `;
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) backdrop.remove();
    });
    const mapShell = document.querySelector('.map-shell');
    if (mapShell) mapShell.appendChild(backdrop);
    document.getElementById('btnCloseScadaAudit')?.addEventListener('click', () => backdrop.remove());
    document.getElementById('btnExportAuditFromModal')?.addEventListener('click', exportScadaAuditCsv);
  };

  function getFlowRenderNodeCache() {
    if (!(state.scada.flowRenderNodes instanceof Map)) {
      state.scada.flowRenderNodes = new Map();
    }
    return state.scada.flowRenderNodes;
  }

  function clearRenderedFlowLayer(flowLayer) {
    if (flowLayer) flowLayer.innerHTML = '';
    getFlowRenderNodeCache().clear();
  }

  function buildRenderedFlowPath(row, flow) {
    if (state.filters.hatDisplayMode === 'sade' || state.filters.hatDisplayMode === 'sade-ayrik') {
      const startTm = state.network.tmMap.get(row.startTm);
      const endTm = state.network.tmMap.get(row.endTm);
      const firstCoord = row.coords[0];
      const lastCoord = row.coords[row.coords.length - 1];
      const startPt = startTm ? screenPoint(startTm.lon, startTm.lat) : screenPoint(firstCoord[0], firstCoord[1]);
      const endPt = endTm ? screenPoint(endTm.lon, endTm.lat) : screenPoint(lastCoord[0], lastCoord[1]);
      let fromPt = startPt;
      let toPt = endPt;
      if (state.filters.hatDisplayMode === 'sade-ayrik') {
        const groupKey = [row.startTm || '', row.endTm || ''].sort().join('|||');
        const allHats = getVisibleHats().filter((hat) => [hat.startTm || '', hat.endTm || ''].sort().join('|||') === groupKey);
        const index = Math.max(0, allHats.findIndex((hat) => String(hat.id) === String(row.id)));
        const spacing = 4;
        const offset = -((allHats.length - 1) * spacing) / 2 + index * spacing;
        const shifted = offsetLine(startPt, endPt, offset);
        fromPt = { x: shifted.sx, y: shifted.sy };
        toPt = { x: shifted.ex, y: shifted.ey };
      }
      if (flow.direction === 'reverse') {
        const tmp = fromPt;
        fromPt = toPt;
        toPt = tmp;
      }
      return `M ${round1(fromPt.x)} ${round1(fromPt.y)} L ${round1(toPt.x)} ${round1(toPt.y)}`;
    }
    const coords = flow.direction === 'reverse' ? [...row.coords].reverse() : row.coords;
    return coords.map((coord, index) => {
      const point = screenPoint(coord[0], coord[1]);
      return `${index ? 'L' : 'M'} ${round1(point.x)} ${round1(point.y)}`;
    }).join(' ');
  }

  function createRenderedFlowNode(row) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const motionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');

    group.setAttribute('data-flow-id', String(row.id));
    motionPath.setAttribute('data-role', 'motion-path');
    motionPath.setAttribute('fill', 'none');
    motionPath.setAttribute('stroke', 'none');
    arrowGroup.setAttribute('data-role', 'arrow-group');
    arrowGroup.style.pointerEvents = 'auto';
    arrowGroup.addEventListener('click', (event) => {
      event.stopPropagation();
      openScadaHatDetails(row, { forceTiles: false });
    });
    attachHoverTooltip(arrowGroup, () => typeof buildHatHoverTooltipHtml === 'function'
      ? buildHatHoverTooltipHtml(row)
      : `<strong>${escapeHtml(row.name || '-')}</strong>`, { owner: `hat:${row.id}` });

    arrow.setAttribute('data-role', 'arrow');
    arrow.setAttribute('points', '0,-4 9,0 0,4');
    anim.setAttribute('data-role', 'arrow-motion');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('rotate', 'auto');
    mpath.setAttribute('data-role', 'arrow-motion-path');

    anim.appendChild(mpath);
    arrowGroup.appendChild(arrow);
    arrowGroup.appendChild(anim);
    group.appendChild(motionPath);
    group.appendChild(arrowGroup);
    return group;
  }

  function patchRenderedFlowNode(node, row, flow, pathData) {
    const pathId = `fp-${row.id}`;
    const arrowColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#111827' : '#f8fafc';
    const duration = `${getArrowSpeed(Number.isFinite(flow.displayPct) ? flow.displayPct : (Number.isFinite(flow.loadingPct) ? flow.loadingPct : 0))}s`;
    const motionPath = node.querySelector('[data-role="motion-path"]');
    const arrow = node.querySelector('[data-role="arrow"]');
    const anim = node.querySelector('[data-role="arrow-motion"]');
    const mpath = node.querySelector('[data-role="arrow-motion-path"]');
    if (!motionPath || !arrow || !anim || !mpath) return;

    motionPath.setAttribute('id', pathId);
    motionPath.setAttribute('d', pathData);
    arrow.setAttribute('fill', arrowColor);
    anim.setAttribute('dur', duration);
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);
    mpath.setAttribute('href', `#${pathId}`);
    node.dataset.renderKey = `${pathData}|${arrowColor}|${duration}`;
  }

  renderFlowLayer = function () {
    const flowLayer = document.getElementById('flowLayer');
    if (!flowLayer) return;
    const modeConfig = getModeConfig();
    if (!state.scada.enabled || modeConfig.domain !== 'hat' || !state.scada.lineFlowByLineId.size) {
      clearRenderedFlowLayer(flowLayer);
      return;
    }
    if (normalizeScadaMapDisplayMode(modeConfig, state.filters.scadaMapDisplayMode) !== 'flow') {
      clearRenderedFlowLayer(flowLayer);
      return;
    }
    if (!state.filters.showHat) {
      clearRenderedFlowLayer(flowLayer);
      return;
    }

    const bounds = currentGeoBounds();
    const visibleHats = getVisibleHats().filter((row) => intersects(row.bbox, bounds));
    const activeIds = new Set();
    const cache = getFlowRenderNodeCache();

    visibleHats.forEach((row) => {
      const flow = state.scada.lineFlowByLineId.get(row.id);
      if (!flow) return;
      const flowId = String(row.id);
      const pathData = buildRenderedFlowPath(row, flow);
      let node = cache.get(flowId);
      if (!node || !node.isConnected) {
        node = createRenderedFlowNode(row);
        cache.set(flowId, node);
      }
      patchRenderedFlowNode(node, row, flow, pathData);
      flowLayer.appendChild(node);
      activeIds.add(flowId);
    });

    cache.forEach((node, flowId) => {
      if (activeIds.has(flowId)) return;
      if (node?.remove) node.remove();
      cache.delete(flowId);
    });
  };

  scadaStartPolling = function () {
    startScadaAutoScheduler();
  };

  scadaStopPolling = function () {
    stopScadaAutoScheduler();
  };

  const baseSetCapacitySeason = setCapacitySeason;
  setCapacitySeason = function (season, activeBtn, inactiveBtn) {
    state.scada.capacitySeason = season;
    if (activeBtn?.classList) activeBtn.classList.add('active');
    if (inactiveBtn?.classList) inactiveBtn.classList.remove('active');

    const measurementRowsById = state.scada.measurementRowsById instanceof Map
      ? state.scada.measurementRowsById
      : new Map();
    const scope = state.scada.currentScope;
    if (measurementRowsById.size && scope?.entities?.length) {
      applyGenericScadaSnapshot(measurementRowsById, scope);
      if (typeof updateScadaCardUI === 'function') updateScadaCardUI();
      if (typeof refreshRankingTable === 'function') refreshRankingTable();
      if (typeof requestRender === 'function') requestRender();
    } else if (typeof baseSetCapacitySeason === 'function') {
      baseSetCapacitySeason(season, activeBtn, inactiveBtn);
      return;
    }

    scadaLog('info', `Kapasite modu: ${season === 'summer' ? 'Yaz' : 'Kis'}`);
  };

  if (!window.__TPYS_SCADA_AUTO_RESUME_BOUND__) {
    window.__TPYS_SCADA_AUTO_RESUME_BOUND__ = true;
    if (typeof document?.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (getDocumentVisibilityState() === 'visible') resumeScadaAutoSchedulerIfOverdue('visibility');
      });
    }
    if (typeof window?.addEventListener === 'function') {
      window.addEventListener('focus', () => resumeScadaAutoSchedulerIfOverdue('focus'));
      window.addEventListener('pageshow', () => resumeScadaAutoSchedulerIfOverdue('pageshow'));
    }
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.onMessage?.addListener === 'function') {
      chrome.runtime.onMessage.addListener((message) => {
        if (message?.type === 'DASHBOARD_MAP_SLOT_ACTIVE') {
          handleDashboardMapSlotActive(message.payload || {});
        } else if (message?.type === 'SCADA_DASHBOARD_SNAPSHOT_UPDATED') {
          restoreScadaDashboardSnapshotFromStorage();
        }
      });
    }
  }

  const baseInitScadaCard = initScadaCard;
  initScadaCard = function () {
    baseInitScadaCard();
    const buttons = Array.from(document.querySelectorAll('[data-scada-metric]'));
    buttons.forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = '1';
      button.addEventListener('click', () => setScadaMetric(button.dataset.scadaMetric));
    });
    const displayButtons = Array.from(document.querySelectorAll('[data-scada-map-display]'));
    displayButtons.forEach((button) => {
      if (button.dataset.boundDisplay) return;
      button.dataset.boundDisplay = '1';
      button.addEventListener('click', () => setScadaMapDisplayMode(button.dataset.scadaMapDisplay));
    });
    syncScadaMetricButtons();
    syncScadaMapDisplayButtons();
    if (state.scada.enabled && state.scada.autoRefresh) startScadaAutoScheduler();
    updateScadaCardUI();
  };

  globalThis.syncScadaMetricButtons = syncScadaMetricButtons;
  globalThis.syncScadaMapDisplayButtons = syncScadaMapDisplayButtons;
  globalThis.setScadaMetric = setScadaMetric;
  globalThis.setScadaMapDisplayMode = setScadaMapDisplayMode;
  globalThis.syncRankingKvFilterControl = syncRankingKvFilterControl;
  globalThis.applyRankingKvPreset = applyRankingKvPreset;
  globalThis.buildEntityMetricVisual = buildEntityMetricVisual;
  globalThis.buildScadaAuditReport = buildScadaAuditReport;
  if (globalThis.__SCADA_V2_TEST_HOOKS__) {
    Object.assign(globalThis.__SCADA_V2_TEST_HOOKS__, {
      resolveHatMetric,
      buildEntityMetricRecord,
      rebuildLineFlowMap,
      buildVisibleSummary,
      buildScadaAuditReport,
      buildRenderedFlowPath,
      buildScadaQualityChips,
      getHatFlowDirection,
      getHatResolutionClass,
      getReadableTextColor,
      handleDashboardMapSlotActive,
      serializeScadaDashboardSnapshot,
      restoreScadaDashboardSnapshot,
      applyScreenDeclutter: typeof applyScreenDeclutter === 'function' ? applyScreenDeclutter : undefined,
      selectActiveVoltagePerTmLevel: typeof selectActiveVoltagePerTmLevel === 'function' ? selectActiveVoltagePerTmLevel : undefined
    });
  }
})();
