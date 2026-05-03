(function attachTpysExtjsMainApply(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.TPYS_EXTJS_MAIN_APPLY = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function createTpysExtjsMainApply(root) {
  function applyPlan(payload = {}) {
    try {
      const Ext = payload.Ext || root.Ext || globalThis.Ext;
      if (!Ext) return { ok: false, reason: 'ExtJS bulunamadi.' };

      const operations = Array.isArray(payload.operations) ? payload.operations : [];
      const settings = payload.settings || {};
      const pageRows = Array.isArray(payload.pageRows) ? payload.pageRows : [];
      const grid = findTargetGrid(Ext, pageRows);
      if (!grid) return { ok: false, reason: 'Uygun Ext grid bulunamadi.' };

      const cm = getColumnModel(grid);
      if (!cm) return { ok: false, reason: 'Column model bulunamadi.' };

      const store = getStore(grid);
      if (!store || !getStoreCount(store)) return { ok: false, reason: 'Grid store bulunamadi.' };

      const fieldMeta = buildGridFieldMeta(grid, cm, store, pageRows);
      if (!fieldMeta.baraField) return { ok: false, reason: 'Bara alani bulunamadi.' };
      if (!fieldMeta.dateField && operations.some((operation) => operation.localDate || operation.sourceDate)) {
        return { ok: false, reason: 'Gecerlilik tarihi alani bulunamadi.' };
      }

      const statusValueByHourAndLabel = resolveStatusValues(grid, cm, store, fieldMeta, operations, settings);
      if (!statusValueByHourAndLabel.ok) return statusValueByHourAndLabel;

      const prepared = prepareWrites(store, fieldMeta, operations, settings, statusValueByHourAndLabel.values);
      if (!prepared.ok) return prepared;

      executeWrites(Ext, grid, store, prepared.writes);

      return {
        ok: true,
        modeUsed: 'ext-main-batch',
        summary: prepared.summary,
        errors: prepared.errors,
        mappingSources: statusValueByHourAndLabel.mappingSources,
        resolvedStatusMap: statusValueByHourAndLabel.resolvedStatusMap,
        mappingDiagnostics: statusValueByHourAndLabel.mappingDiagnostics,
        candidateDiagnostics: statusValueByHourAndLabel.candidateDiagnostics
      };
    } catch (error) {
      return { ok: false, reason: error?.message || String(error) };
    }
  }

  const STATUS_COMPANION_SUFFIXES = ['_qw_', '_txt', '_text', '_dsc', '_ad', '_adi'];
  const KNOWN_STATUS_LABELS = [
    'Sağladı',
    'Sağlamadı',
    'Yükümlülüğü Yok',
    'Devre Dışı',
    'Devrede Değil',
    'Muaf',
    'Onay Bekliyor',
    'Mücbir Sebep',
    'EŞY Madde 36-5'
  ];
  const CONFIRMED_STATUS_VALUES_BY_LABEL = new Map([
    ['Sağlamadı', 0],
    ['Sağladı', 9],
    ['Mücbir Sebep', 7],
    ['EŞY Madde 36-5', 6],
    ['Yükümlülüğü Yok', 8],
    ['Devre Dışı', 10],
    ['Muaf', 12],
    ['Onay Bekliyor', 11]
  ].map(([label, value]) => [normalizeText(label), { label, value }]));

  function resolveStatusValues(grid, cm, store, fieldMeta, operations, settings) {
    const labelsByHour = new Map();
    for (const operation of operations) {
      for (let hour = 0; hour < 24; hour += 1) {
        const code = operation.statusByHour?.[hour];
        if (!code) continue;
        if (!labelsByHour.has(hour)) labelsByHour.set(hour, new Set());
        labelsByHour.get(hour).add(settings.statusLabels?.[code] || code);
      }
    }

    const discovery = discoverStatusValueMap(grid, cm, store, fieldMeta, settings);
    const values = new Map();
    const resolvedDetails = {};
    const unresolvedLabels = [];

    for (const [hour, labels] of labelsByHour.entries()) {
      const dataIndex = fieldMeta.statusByHour.get(hour);
      if (!dataIndex) continue;
      for (const label of labels) {
        const resolution = getDiscoveredStatusValue(discovery, hour, label);
        if (!resolution.ok) {
          const sample = getFirstValueType(store, dataIndex);
          if (!discovery.hasStructuredCandidates && (sample === 'string' || sample === 'undefined' || sample === 'null')) {
            setNestedMap(values, hour, label, label);
            setResolvedDetail(resolvedDetails, hour, label, label, 'literal-label');
            continue;
          }
          unresolvedLabels.push(label);
          return {
            ok: false,
            reason: `Hizli mod icin deger cozulemedi: saat ${hour}, etiket ${label}`,
            unresolvedLabels: [...new Set(unresolvedLabels)],
            mappingDiagnostics: discovery.mappingDiagnostics,
            candidateDiagnostics: discovery.candidateDiagnostics,
            resolvedStatusMap: resolvedDetails,
            mappingSources: discovery.mappingSources
          };
        }
        setNestedMap(values, hour, label, resolution.value);
        setResolvedDetail(resolvedDetails, hour, label, resolution.value, resolution.source);
        registerResolutionSource(discovery, resolution.source);
      }
    }

    return {
      ok: true,
      values,
      resolvedStatusMap: resolvedDetails,
      mappingSources: discovery.mappingSources,
      mappingDiagnostics: discovery.mappingDiagnostics,
      candidateDiagnostics: discovery.candidateDiagnostics
    };
  }

  function discoverStatusValueMap(grid, cm, store, fieldMeta, settings) {
    const candidates = new Map();
    const sourceCounts = {};
    const sourceOrder = [];
    const conflicts = [];
    const candidateDiagnostics = {
      sourceCounts,
      confirmedValues: confirmedStatusValuesObject(),
      conflicts,
      companionSuffixes: STATUS_COMPANION_SUFFIXES
    };

    const addCandidate = (hour, label, value, source) => {
      const normalizedLabel = normalizeText(stripRenderedText(label));
      if (!normalizedLabel || !hasResolvedValue(value)) return;
      const confirmed = CONFIRMED_STATUS_VALUES_BY_LABEL.get(normalizedLabel);
      if (confirmed && !statusValuesEqual(value, confirmed.value)) {
        conflicts.push({
          hour,
          label: stripRenderedText(label),
          discoveredValue: value,
          confirmedValue: confirmed.value,
          source
        });
        return;
      }
      if (!candidates.has(hour)) candidates.set(hour, new Map());
      const hourCandidates = candidates.get(hour);
      if (!hourCandidates.has(normalizedLabel)) {
        hourCandidates.set(normalizedLabel, { label: stripRenderedText(label), value, source });
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        if (!sourceOrder.includes(source)) sourceOrder.push(source);
      }
    };

    discoverEditorStoreMappings(cm, fieldMeta, addCandidate);
    discoverStoreRangeCompanionMappings(store, fieldMeta, addCandidate);
    discoverStoreRangeRendererMappings(cm, store, fieldMeta, addCandidate);
    discoverVisibleGridMappings(grid, store, fieldMeta, addCandidate);
    discoverGlobalLookupMappings(fieldMeta, settings, addCandidate);

    const mappingDiagnostics = {
      sourceCounts: { ...sourceCounts },
      confirmedValues: confirmedStatusValuesObject(),
      conflicts
    };

    return {
      candidates,
      hasStructuredCandidates: sourceOrder.length > 0,
      mappingSources: sourceOrder,
      mappingDiagnostics,
      candidateDiagnostics
    };
  }

  function discoverEditorStoreMappings(cm, fieldMeta, addCandidate) {
    for (const [hour, dataIndex] of fieldMeta.statusByHour.entries()) {
      const columnIndex = fieldMeta.columnIndexByDataIndex.get(dataIndex);
      const options = readEditorOptions(cm, columnIndex);
      options.forEach((option) => addCandidate(hour, option.label, option.value, 'editor-store'));
    }
  }

  function discoverStoreRangeCompanionMappings(store, fieldMeta, addCandidate) {
    const records = getStoreRecords(store);
    for (const [hour, dataIndex] of fieldMeta.statusByHour.entries()) {
      records.forEach((record) => {
        const rawValue = getRecordValue(record, dataIndex);
        const label = getCompanionStatusLabel(record, dataIndex);
        if (isMeaningfulStatusLabel(label, rawValue)) {
          addCandidate(hour, label, rawValue, 'store-range-companion');
        }
      });
    }
  }

  function discoverStoreRangeRendererMappings(cm, store, fieldMeta, addCandidate) {
    const records = getStoreRecords(store);
    for (const [hour, dataIndex] of fieldMeta.statusByHour.entries()) {
      const columnIndex = fieldMeta.columnIndexByDataIndex.get(dataIndex);
      const renderer = getColumnRenderer(cm, columnIndex);
      if (typeof renderer !== 'function') continue;
      records.forEach((record, rowIndex) => {
        const rawValue = getRecordValue(record, dataIndex);
        try {
          const label = renderer(rawValue, {}, record, rowIndex, columnIndex, store);
          if (isMeaningfulStatusLabel(label, rawValue)) {
            addCandidate(hour, label, rawValue, 'store-range-renderer');
          }
        } catch {
          // Ignore renderer failures; other discovery sources may still resolve the value.
        }
      });
    }
  }

  function discoverVisibleGridMappings(grid, store, fieldMeta, addCandidate) {
    const rows = getVisibleGridRows(grid);
    if (!rows.length) return;
    for (const [hour, dataIndex] of fieldMeta.statusByHour.entries()) {
      rows.forEach((row, rowIndex) => {
        const record = getStoreRecord(store, rowIndex);
        if (!record || typeof row?.querySelector !== 'function') return;
        const rawValue = getRecordValue(record, dataIndex);
        const cell = row.querySelector(`.x-grid3-col-${dataIndex}`) || row.querySelector(`[class*="x-grid3-col-${dataIndex}"]`);
        const label = getNodeText(cell);
        if (isMeaningfulStatusLabel(label, rawValue)) {
          addCandidate(hour, label, rawValue, 'visible-grid');
        }
      });
    }
  }

  function discoverGlobalLookupMappings(fieldMeta, settings, addCandidate) {
    const lookupEntries = collectGlobalLookupEntries(settings);
    if (!lookupEntries.length) return;
    for (const [hour] of fieldMeta.statusByHour.entries()) {
      lookupEntries.forEach((entry) => addCandidate(hour, entry.label, entry.value, 'global-lookup'));
    }
  }

  function getDiscoveredStatusValue(discovery, hour, label) {
    const candidate = discovery.candidates.get(hour)?.get(normalizeText(label));
    if (!candidate) {
      const confirmed = CONFIRMED_STATUS_VALUES_BY_LABEL.get(normalizeText(label));
      if (confirmed) return { ok: true, value: confirmed.value, source: 'confirmed-fallback' };
      return { ok: false };
    }
    return { ok: true, value: candidate.value, source: candidate.source };
  }

  function registerResolutionSource(discovery, source) {
    if (!source) return;
    const counts = discovery.mappingDiagnostics?.sourceCounts;
    if (counts && !counts[source]) counts[source] = 1;
    if (Array.isArray(discovery.mappingSources) && !discovery.mappingSources.includes(source)) {
      discovery.mappingSources.push(source);
    }
  }

  function confirmedStatusValuesObject() {
    const result = {};
    CONFIRMED_STATUS_VALUES_BY_LABEL.forEach(({ label, value }) => {
      result[label] = value;
    });
    return result;
  }

  function hasResolvedValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function statusValuesEqual(left, right) {
    return normalizeText(String(left ?? '')) === normalizeText(String(right ?? ''));
  }

  function setResolvedDetail(target, hour, label, value, source) {
    const hourKey = String(hour);
    if (!target[hourKey]) target[hourKey] = {};
    target[hourKey][label] = { value, source };
  }

  function prepareWrites(store, fieldMeta, operations, settings, statusValueByHourAndLabel) {
    const recordIndexByKey = new Map();
    const recordIndexByName = new Map();
    const recordCount = getStoreCount(store);
    for (let i = 0; i < recordCount; i += 1) {
      const record = getStoreRecord(store, i);
      const baraName = getRecordValue(record, fieldMeta.baraField);
      const localDate = normalizePeriodDate(getRecordValue(record, fieldMeta.dateField));
      const periodKey = makePeriodKey(baraName, localDate);
      if (periodKey && !recordIndexByKey.has(periodKey)) recordIndexByKey.set(periodKey, i);
      if (baraName) recordIndexByName.set(normalizeText(baraName), i);
    }

    const writes = [];
    const errors = [];
    const summary = {
      totalBarasInPlan: operations.length,
      matchedBarasOnPage: 0,
      statusWritesOk: 0,
      approvalWritesOk: 0,
      statusSameBefore: 0,
      statusDifferentBefore: 0,
      statusChangedDifferent: 0,
      unchanged: 0,
      failures: 0
    };

    for (const operation of operations) {
      if (operation.unmatched) {
        errors.push(`Statik tabloda eslesmeyen bara: ${operation.sourceBara}`);
        summary.failures += 1;
        continue;
      }

      const operationKey = makePeriodKey(operation.tpysBaraAdi, operation.localDate || operation.sourceDate);
      const recordIndex = operationKey
        ? recordIndexByKey.get(operationKey)
        : recordIndexByName.get(normalizeText(operation.tpysBaraAdi));

      if (recordIndex === undefined) {
        errors.push(`ERP store icinde bulunamadi: ${operation.tpysBaraAdi} ${operation.localDate || operation.sourceDate || ''}`);
        summary.failures += 1;
        continue;
      }

      summary.matchedBarasOnPage += 1;
      const record = getStoreRecord(store, recordIndex);

      for (let hour = 0; hour < 24; hour += 1) {
        const code = operation.statusByHour?.[hour];
        if (!code) continue;

        const desiredLabel = settings.statusLabels?.[code] || code;
        const statusDataIndex = fieldMeta.statusByHour.get(hour);
        if (!statusDataIndex) {
          errors.push(`${operation.tpysBaraAdi} | ${hour}: Durum dataIndex bulunamadi.`);
          summary.failures += 1;
          continue;
        }

        const desiredValue = getNestedMap(statusValueByHourAndLabel, hour, desiredLabel);
        const currentValue = getRecordValue(record, statusDataIndex);
        const sameStatusBefore = valuesEqual(currentValue, desiredValue);
        if (sameStatusBefore) summary.statusSameBefore += 1;
        else summary.statusDifferentBefore += 1;

        if (settings.onlyChangedCells && sameStatusBefore) {
          summary.unchanged += 1;
        } else {
          writes.push({ recordIndex, dataIndex: statusDataIndex, value: desiredValue, kind: 'status' });
          summary.statusWritesOk += 1;
          if (!sameStatusBefore) summary.statusChangedDifferent += 1;
        }

        collectCompanionStatusWrites(record, recordIndex, statusDataIndex, desiredLabel, writes);
      }
    }

    return { ok: true, writes, summary, errors };
  }

  function collectCompanionStatusWrites(record, recordIndex, statusDataIndex, desiredLabel, writes) {
    for (const suffix of STATUS_COMPANION_SUFFIXES) {
      const dataIndex = `${statusDataIndex}${suffix}`;
      if (!recordHasField(record, dataIndex)) continue;
      const currentLabel = getRecordValue(record, dataIndex);
      if (normalizeText(currentLabel) === normalizeText(desiredLabel)) continue;
      writes.push({ recordIndex, dataIndex, value: desiredLabel, kind: 'status-companion' });
    }
  }

  function executeWrites(Ext, grid, store, writes) {
    let layoutsSuspended = false;
    try {
      if (typeof Ext.suspendLayouts === 'function') {
        Ext.suspendLayouts();
        layoutsSuspended = true;
      }

      const writesByRecord = new Map();
      writes.forEach((write) => {
        if (!writesByRecord.has(write.recordIndex)) writesByRecord.set(write.recordIndex, []);
        writesByRecord.get(write.recordIndex).push(write);
      });

      for (const [recordIndex, rowWrites] of writesByRecord.entries()) {
        const record = getStoreRecord(store, recordIndex);
        if (!record) continue;
        let hasDirtyWrite = false;
        if (typeof record.beginEdit === 'function') record.beginEdit();
        for (const write of rowWrites) {
          if (write.kind === 'status-companion') {
            setRecordDataDirect(record, write.dataIndex, write.value);
          } else {
            hasDirtyWrite = true;
            if (typeof record.set === 'function') record.set(write.dataIndex, write.value);
            else setRecordDataDirect(record, write.dataIndex, write.value);
          }
        }
        if (typeof record.endEdit === 'function') record.endEdit();
        if (hasDirtyWrite && typeof record.dirty !== 'undefined') record.dirty = true;
      }

      const view = getGridView(grid);
      if (view && typeof view.refresh === 'function') view.refresh();
    } finally {
      if (layoutsSuspended && typeof Ext.resumeLayouts === 'function') Ext.resumeLayouts(true);
    }
  }

  function findTargetGrid(Ext, pageRows) {
    const components = collectExtComponents(Ext);
    const visibleNames = new Set(pageRows.map((row) => normalizeText(row.baraName)).filter(Boolean));
    const visibleDates = new Set(pageRows.map((row) => normalizePeriodDate(row.localDate || row.pageDate)).filter(Boolean));

    let best = null;
    let bestScore = -1;
    components.forEach((component) => {
      const store = getStore(component);
      const cm = getColumnModel(component);
      if (!store || !cm || !getStoreCount(store)) return;

      const fields = getCandidateFieldNamesFromStore(store);
      if (!fields.length) return;

      let nameOverlap = 0;
      let dateOverlap = 0;
      fields.forEach((field) => {
        nameOverlap = Math.max(nameOverlap, countMatchesForField(store, field, visibleNames));
        dateOverlap = Math.max(dateOverlap, countDateMatchesForField(store, field, visibleDates));
      });

      const hasStatusField = fields.some((field) => /^lkp_reaktif_yerine_getirme0$/i.test(String(field)));
      const hasApprovalField = fields.some((field) => /^onay_durum_flag0$/i.test(String(field)));
      const hasDateField = fields.some((field) => /^gecerlilik_dt$/i.test(String(field)));
      const hasBaraAdField = fields.some((field) => /^bara_ad$/i.test(String(field)));
      const score = nameOverlap * 10
        + dateOverlap * 8
        + (hasStatusField ? 5 : 0)
        + (hasApprovalField ? 2 : 0)
        + (hasDateField ? 4 : 0)
        + (hasBaraAdField ? 2 : 0)
        + Math.min(getStoreCount(store), 50) / 50;

      if (score > bestScore) {
        bestScore = score;
        best = component;
      }
    });

    return bestScore > 0 ? best : null;
  }

  function buildGridFieldMeta(grid, cm, store, pageRows) {
    const candidateFields = getCandidateFieldNamesFromStore(store);
    const visibleNames = new Set(pageRows.map((row) => normalizeText(row.baraName)).filter(Boolean));
    const visibleDates = new Set(pageRows.map((row) => normalizePeriodDate(row.localDate || row.pageDate)).filter(Boolean));

    let baraField = candidateFields.find((field) => /^bara_ad$/i.test(String(field))) || '';
    if (!baraField) {
      let baraScore = -1;
      candidateFields.forEach((field) => {
        const score = countMatchesForField(store, field, visibleNames);
        if (score > baraScore) {
          baraScore = score;
          baraField = field;
        }
      });
      if (baraScore <= 0) baraField = '';
    }

    let dateField = candidateFields.find((field) => /^gecerlilik_dt$/i.test(String(field))) || '';
    if (!dateField) {
      let dateScore = -1;
      candidateFields.forEach((field) => {
        const score = countDateMatchesForField(store, field, visibleDates);
        if (score > dateScore) {
          dateScore = score;
          dateField = field;
        }
      });
      if (dateScore <= 0) dateField = '';
    }

    const statusByHour = new Map();
    const approvalByHour = new Map();
    const columnIndexByDataIndex = new Map();

    const columnCount = getColumnCount(cm);
    for (let index = 0; index < columnCount; index += 1) {
      const dataIndex = getDataIndex(cm, index);
      if (!dataIndex) continue;
      columnIndexByDataIndex.set(dataIndex, index);

      const statusMatch = String(dataIndex).match(/^lkp_reaktif_yerine_getirme(\d{1,2})$/i);
      const approvalMatch = String(dataIndex).match(/^onay_durum_flag(\d{1,2})$/i);
      if (statusMatch) statusByHour.set(Number(statusMatch[1]), dataIndex);
      if (approvalMatch) approvalByHour.set(Number(approvalMatch[1]), dataIndex);
    }

    return { baraField, dateField, statusByHour, approvalByHour, columnIndexByDataIndex };
  }

  function readEditorOptions(cm, columnIndex) {
    try {
      let editor = null;
      if (typeof cm.getCellEditor === 'function') editor = cm.getCellEditor(columnIndex, 0);
      if (!editor && cm.config?.[columnIndex]?.editor) editor = cm.config[columnIndex].editor;
      const field = editor?.field || editor;
      const comboStore = field?.store;
      if (!comboStore) return [];

      const displayField = field.displayField || 'text';
      const valueField = field.valueField || 'value';
      return getStoreRecords(comboStore)
        .map((record) => ({
          label: getRecordValue(record, displayField),
          value: getRecordValue(record, valueField)
        }))
        .filter((option) => option.label !== undefined && option.label !== null && option.label !== '');
    } catch {
      return [];
    }
  }

  function getStoreRecords(store) {
    if (typeof store?.getRange === 'function') {
      const records = store.getRange();
      if (Array.isArray(records)) return records;
    }
    const records = [];
    const count = getStoreCount(store);
    for (let i = 0; i < count; i += 1) {
      const record = getStoreRecord(store, i);
      if (record) records.push(record);
    }
    return records;
  }

  function getCompanionStatusLabel(record, dataIndex) {
    for (const suffix of STATUS_COMPANION_SUFFIXES) {
      const value = getRecordValue(record, `${dataIndex}${suffix}`);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  }

  function getColumnRenderer(cm, columnIndex) {
    if (typeof cm?.getRenderer === 'function') return cm.getRenderer(columnIndex);
    return cm?.config?.[columnIndex]?.renderer || null;
  }

  function getVisibleGridRows(grid) {
    const candidates = [
      grid?.getEl?.()?.dom,
      grid?.el?.dom,
      grid?.view?.mainBody?.dom,
      grid?.view?.scroller?.dom,
      root?.document
    ];
    for (const candidate of candidates) {
      if (candidate && typeof candidate.querySelectorAll === 'function') {
        const rows = Array.from(candidate.querySelectorAll('.x-grid3-row') || []);
        if (rows.length) return rows;
      }
    }
    return [];
  }

  function getNodeText(node) {
    if (!node) return '';
    return node.innerText || node.textContent || '';
  }

  function isMeaningfulStatusLabel(label, rawValue) {
    const text = stripRenderedText(label);
    if (!text) return false;
    if (/^\d+$/.test(text)) return false;
    if (normalizeText(text) === normalizeText(rawValue)) return false;
    return true;
  }

  function stripRenderedText(value) {
    return String(value ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#305;/g, 'ı')
      .replace(/&#304;/g, 'İ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function collectGlobalLookupEntries(settings) {
    const expectedLabels = buildKnownStatusLabelSet(settings);
    const accepted = [];
    const roots = collectGlobalLookupRoots();
    const seen = new Set();

    roots.forEach((entry) => {
      collectLookupCandidates(entry.value, entry.name, 0, seen).forEach((candidateSet) => {
        const knownCount = countKnownLookupLabels(candidateSet, expectedLabels);
        if (knownCount < 2) return;
        candidateSet.forEach((candidate) => accepted.push(candidate));
      });
    });

    const deduped = new Map();
    accepted.forEach((candidate) => {
      const key = `${normalizeText(candidate.label)}|${String(candidate.value)}`;
      if (!deduped.has(key)) deduped.set(key, candidate);
    });
    return Array.from(deduped.values());
  }

  function collectGlobalLookupRoots() {
    const roots = [];
    const knownNames = ['_lookups', 'lookups', 'LOOKUPS', '_lookup', 'lookup', 'lookupStore', 'lookupStores'];
    knownNames.forEach((name) => {
      try {
        if (root && root[name]) roots.push({ name, value: root[name] });
      } catch {
        // Ignore guarded globals.
      }
    });

    try {
      Object.keys(root || {}).forEach((name) => {
        if (roots.length > 30) return;
        if (!/lookups?|_lkp|lookupStore/i.test(name)) return;
        if (knownNames.includes(name)) return;
        const value = root[name];
        if (isPlainObject(value) || Array.isArray(value)) roots.push({ name, value });
      });
    } catch {
      // Window enumeration can be blocked by extensions or host objects.
    }
    return roots;
  }

  function collectLookupCandidates(value, path, depth, seen) {
    if (depth > 4 || !value || typeof value !== 'object') return [];
    if (seen.has(value)) return [];
    seen.add(value);

    const candidateSets = [];
    const directSet = extractLookupCandidateSet(value);
    if (directSet.length) candidateSets.push(directSet.map((candidate) => ({ ...candidate, path })));

    if (Array.isArray(value)) {
      value.slice(0, 200).forEach((item, index) => {
        candidateSets.push(...collectLookupCandidates(item, `${path}[${index}]`, depth + 1, seen));
      });
      return candidateSets;
    }

    if (isPlainObject(value)) {
      Object.keys(value).slice(0, 200).forEach((key) => {
        candidateSets.push(...collectLookupCandidates(value[key], `${path}.${key}`, depth + 1, seen));
      });
    }
    return candidateSets;
  }

  function extractLookupCandidateSet(value) {
    if (Array.isArray(value)) return extractLookupCandidatesFromArray(value);
    if (isPlainObject(value)) return extractLookupCandidatesFromObject(value);
    return [];
  }

  function extractLookupCandidatesFromArray(items) {
    const candidates = [];
    items.slice(0, 200).forEach((item) => {
      if (!isPlainObject(item)) return;
      const labelField = findFirstExistingField(item, ['text', 'dsc', 'label', 'name', 'ad', 'adi', 'aciklama', 'description']);
      const valueField = findFirstExistingField(item, ['id', 'value', 'kod', 'code', 'key']);
      if (!labelField || !valueField) return;
      const label = item[labelField];
      const rawValue = item[valueField];
      if (isMeaningfulStatusLabel(label, rawValue)) candidates.push({ label: stripRenderedText(label), value: rawValue });
    });
    return candidates;
  }

  function extractLookupCandidatesFromObject(object) {
    const candidates = [];
    Object.entries(object).slice(0, 200).forEach(([key, value]) => {
      if (isScalar(value) && isMeaningfulStatusLabel(value, key)) {
        candidates.push({ label: stripRenderedText(value), value: key });
        return;
      }
      if (isPlainObject(value)) {
        const labelField = findFirstExistingField(value, ['text', 'dsc', 'label', 'name', 'ad', 'adi', 'aciklama', 'description']);
        const valueField = findFirstExistingField(value, ['id', 'value', 'kod', 'code', 'key']);
        if (labelField) {
          const label = value[labelField];
          const rawValue = valueField ? value[valueField] : key;
          if (isMeaningfulStatusLabel(label, rawValue)) candidates.push({ label: stripRenderedText(label), value: rawValue });
        }
      }
    });
    return candidates;
  }

  function buildKnownStatusLabelSet(settings) {
    const labels = new Set(KNOWN_STATUS_LABELS.map((label) => normalizeText(label)));
    Object.values(settings?.statusLabels || {}).forEach((label) => labels.add(normalizeText(label)));
    return labels;
  }

  function countKnownLookupLabels(candidates, expectedLabels) {
    const labels = new Set();
    candidates.forEach((candidate) => {
      const normalized = normalizeText(candidate.label);
      if (expectedLabels.has(normalized)) labels.add(normalized);
    });
    return labels.size;
  }

  function findFirstExistingField(object, fields) {
    return fields.find((field) => Object.prototype.hasOwnProperty.call(object, field));
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function isScalar(value) {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  function collectExtComponents(Ext) {
    const list = [];
    const mgr = Ext.ComponentMgr || Ext.ComponentManager;
    if (!mgr || !mgr.all) return list;
    if (typeof mgr.all.each === 'function') {
      mgr.all.each((component) => list.push(component));
      return list;
    }
    if (Array.isArray(mgr.all.items)) return mgr.all.items.slice();
    if (mgr.all.map) return Object.values(mgr.all.map);
    return list;
  }

  function getStore(component) {
    return component?.getStore?.() || component?.store || null;
  }

  function getGridView(component) {
    return component?.getView?.() || component?.view || null;
  }

  function getColumnModel(component) {
    return component?.getColumnModel?.() || component?.colModel || null;
  }

  function getStoreCount(store) {
    if (typeof store?.getCount === 'function') return store.getCount();
    if (Array.isArray(store?.data?.items)) return store.data.items.length;
    if (Array.isArray(store?.data)) return store.data.length;
    return 0;
  }

  function getStoreRecord(store, index) {
    if (typeof store?.getAt === 'function') return store.getAt(index);
    if (Array.isArray(store?.data?.items)) return store.data.items[index] || null;
    if (Array.isArray(store?.data)) return store.data[index] || null;
    return null;
  }

  function getRecordValue(record, field) {
    if (!record || !field) return undefined;
    if (typeof record.get === 'function') return record.get(field);
    if (record.data && Object.prototype.hasOwnProperty.call(record.data, field)) return record.data[field];
    return record[field];
  }

  function setRecordDataDirect(record, field, value) {
    if (record?.data) record.data[field] = value;
    else if (record) record[field] = value;
  }

  function recordHasField(record, field) {
    if (!record || !field) return false;
    if (record.data && Object.prototype.hasOwnProperty.call(record.data, field)) return true;
    if (Array.isArray(record.fields?.items) && record.fields.items.some((item) => item?.name === field)) return true;
    return Object.prototype.hasOwnProperty.call(record, field);
  }

  function getCandidateFieldNamesFromStore(store) {
    const record = getStoreRecord(store, 0);
    if (!record) return [];
    if (record.fields?.items) return record.fields.items.map((item) => item.name);
    if (record.data) return Object.keys(record.data);
    return Object.keys(record);
  }

  function getColumnCount(cm) {
    if (typeof cm?.getColumnCount === 'function') return cm.getColumnCount();
    if (Array.isArray(cm?.config)) return cm.config.length;
    return 0;
  }

  function getDataIndex(cm, columnIndex) {
    if (typeof cm?.getDataIndex === 'function') return cm.getDataIndex(columnIndex);
    return cm?.config?.[columnIndex]?.dataIndex || '';
  }

  function countMatchesForField(store, field, visibleNames) {
    if (!visibleNames.size) return 0;
    let count = 0;
    const limit = Math.min(getStoreCount(store), 200);
    for (let i = 0; i < limit; i += 1) {
      const value = getRecordValue(getStoreRecord(store, i), field);
      if (visibleNames.has(normalizeText(value))) count += 1;
    }
    return count;
  }

  function countDateMatchesForField(store, field, visibleDates) {
    if (!visibleDates.size) return 0;
    let count = 0;
    const limit = Math.min(getStoreCount(store), 200);
    for (let i = 0; i < limit; i += 1) {
      const value = normalizePeriodDate(getRecordValue(getStoreRecord(store, i), field));
      if (visibleDates.has(value)) count += 1;
    }
    return count;
  }

  function getFirstValueType(store, field) {
    const value = getRecordValue(getStoreRecord(store, 0), field);
    if (value === null) return 'null';
    return typeof value;
  }

  function coerceApprovalValue(currentValue, desiredChecked) {
    if (typeof currentValue === 'boolean') return desiredChecked;
    if (typeof currentValue === 'number') return desiredChecked ? 1 : 0;
    if (typeof currentValue === 'string') {
      if (/^(true|false)$/i.test(currentValue)) return desiredChecked ? 'true' : 'false';
      if (/^(0|1)$/i.test(currentValue)) return desiredChecked ? '1' : '0';
      return desiredChecked ? currentValue || '1' : currentValue || '0';
    }
    return desiredChecked ? 1 : 0;
  }

  function approvalsEqual(currentValue, desiredValue) {
    if (typeof currentValue === 'boolean') return currentValue === desiredValue;
    return normalizeText(String(currentValue ?? '')) === normalizeText(String(desiredValue ?? ''));
  }

  function valuesEqual(left, right) {
    return normalizeText(String(left ?? '')) === normalizeText(String(right ?? ''));
  }

  function setNestedMap(map, key1, key2, value) {
    if (!map.has(key1)) map.set(key1, new Map());
    map.get(key1).set(key2, value);
  }

  function getNestedMap(map, key1, key2) {
    return map.get(key1)?.get(key2);
  }

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .toLocaleUpperCase('tr-TR')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizePeriodDate(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    const text = String(value || '').trim();
    if (!text) return '';
    let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
    if (!match) return '';
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
  }

  function makePeriodKey(baraName, localDate) {
    const nameKey = normalizeText(baraName);
    const dateKey = normalizePeriodDate(localDate);
    return nameKey && dateKey ? `${nameKey}|${dateKey}` : '';
  }

  return { applyPlan };
});
