(() => {
  if (window.__tpysReactiveExtensionLoadedV3) return;
  window.__tpysReactiveExtensionLoadedV3 = true;

  initializeExtensionEnhancements();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        if (message.type === 'GET_PAGE_CONTEXT') {
          sendResponse(await getPageContext());
          return;
        }
        if (message.type === 'APPLY_PLAN') {
          sendResponse(await applyPlan(message.payload.operations, message.payload.settings));
          return;
        }
        if (message.type === 'CLICK_COMMIT') {
          sendResponse(await clickCommitButton());
          return;
        }
        if (message.type === 'GET_DOWNLOAD_CONTEXT') {
          sendResponse(await getDownloadContext());
          return;
        }
        if (message.type === 'TOGGLE_APPROVAL_SIMPLIFY') {
          sendResponse(await toggleApprovalSimplify());
          return;
        }
        if (message.type === 'DOWNLOAD_ALL_CSVS') {
          sendResponse(await runBulkCsvDownloads(message.payload || {}));
          return;
        }
        if (message.type === 'RGDH_DOM_SCRAPE') {
          sendResponse(await scrapeRgdhDom(message.payload || {}));
          return;
        }
        if (message.type === 'RGDH_PAGE_FETCH') {
          sendResponse(await fetchRgdhFromContentContext(message.payload || {}));
          return;
        }
        sendResponse({ ok: false, reason: 'UNKNOWN_MESSAGE' });
      } catch (error) {
        console.error('[TPYS Reactive Extension]', error);
        sendResponse({ ok: false, error: error.message, stack: error.stack });
      }
    })();
    return true;
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    if (event.data?.source !== 'RGDH_YKS_DIAGNOSTIC') return;
    if (window.__rgdhYksDiagnosticBridgeLoaded) return;
    const diagnostics = window.RGDH_DIAGNOSTICS;
    const payload = diagnostics?.sanitizeDiagnosticEvent
      ? diagnostics.sanitizeDiagnosticEvent(event.data.event || {})
      : (event.data.event || {});
    try {
      chrome.runtime.sendMessage({ type: 'RGDH_YKS_LOG_EVENT', payload }, () => {
        void chrome.runtime.lastError;
      });
    } catch {}
  }, true);

  async function getPageContext() {
    return {
      ok: true,
      pageDate: getPageDate(),
      pageRows: collectPageRows()
    };
  }

  function getPageDate() {
    const input = document.querySelector('input[name="xgecerlilik_dt"], #ext-comp-1095');
    return (input?.value || '').trim();
  }

  function collectPageRows() {
    const lockedRows = Array.from(document.querySelectorAll('.x-grid3-locked .x-grid3-body .x-grid3-row'));
    const unlockedRows = Array.from(document.querySelectorAll('.x-grid3-viewport .x-grid3-body .x-grid3-row'));
    const count = Math.min(lockedRows.length, unlockedRows.length);
    const rows = [];

    for (let i = 0; i < count; i += 1) {
      const lockedRow = lockedRows[i];
      const unlockedRow = unlockedRows[i];
      const baraCell = lockedRow.querySelector('.x-grid3-td-bara_ad .x-grid3-cell-inner');
      const baraName = (baraCell?.textContent || '').trim();
      if (!baraName) continue;
      rows.push({
        rowIndex: i,
        baraName,
        lockedRowHtmlId: lockedRow.id || '',
        unlockedRowHtmlId: unlockedRow.id || ''
      });
    }

    return rows;
  }

  async function applyPlan(operations, settings) {
    const pageRows = collectPageRows();
    if (settings.fastExtMode) {
      const extResult = prepareExtBatchApply(operations, settings, pageRows);
      if (extResult.ok) {
        const applied = executeExtBatchApply(extResult.payload);
        if (applied.ok) return applied;
      }
    }
    return applyPlanViaDom(operations, settings, pageRows);
  }

  function prepareExtBatchApply(operations, settings, pageRows) {
    const Ext = window.Ext;
    if (!Ext) return { ok: false, reason: 'ExtJS bulunamadı.' };

    const grid = findTargetGrid(pageRows);
    if (!grid) return { ok: false, reason: 'Uygun Ext grid bulunamadı.' };

    const cm = getColumnModel(grid);
    if (!cm) return { ok: false, reason: 'Column model bulunamadı.' };

    const store = getStore(grid);
    if (!store || !getStoreCount(store)) return { ok: false, reason: 'Grid store bulunamadı.' };

    const fieldMeta = buildGridFieldMeta(grid, cm, store, pageRows);
    if (!fieldMeta.baraField) return { ok: false, reason: 'Bara alanı çözümlenemedi.' };

    const distinctStatusLabels = new Set();
    for (const operation of operations) {
      for (let hour = 0; hour < 24; hour += 1) {
        const code = operation.statusByHour[hour];
        if (!code) continue;
        const label = settings.statusLabels[code] || code;
        distinctStatusLabels.add(label);
      }
    }

    const statusValueByHourAndLabel = new Map();
    for (let hour = 0; hour < 24; hour += 1) {
      const dataIndex = fieldMeta.statusByHour.get(hour);
      if (!dataIndex) continue;
      const columnIndex = fieldMeta.columnIndexByDataIndex.get(dataIndex);
      for (const label of distinctStatusLabels) {
        const resolution = resolveEditorValue(cm, store, columnIndex, label);
        if (!resolution.ok) {
          const sample = getFirstValueType(store, dataIndex);
          if (sample === 'string' || sample === 'undefined' || sample === 'null') {
            setNestedMap(statusValueByHourAndLabel, hour, label, label);
            continue;
          }
          return { ok: false, reason: `Hızlı mod için değer çözümlenemedi: saat ${hour}, etiket ${label}` };
        }
        setNestedMap(statusValueByHourAndLabel, hour, label, resolution.value);
      }
    }

    const recordIndexByName = new Map();
    const recordCount = getStoreCount(store);
    for (let i = 0; i < recordCount; i += 1) {
      const record = getStoreRecord(store, i);
      const baraName = getRecordValue(record, fieldMeta.baraField);
      if (baraName) {
        recordIndexByName.set(normalizeText(baraName), i);
      }
    }

    const writes = [];
    const summary = {
      totalBarasInPlan: operations.length,
      matchedBarasOnPage: 0,
      statusWritesOk: 0,
      approvalWritesOk: 0,
      unchanged: 0,
      failures: 0
    };
    const errors = [];

    for (const operation of operations) {
      if (operation.unmatched) {
        errors.push(`Statik tabloda eşleşmeyen bara: ${operation.sourceBara}`);
        summary.failures += 1;
        continue;
      }
      const recordIndex = recordIndexByName.get(normalizeText(operation.tpysBaraAdi));
      if (recordIndex === undefined) {
        errors.push(`ERP store içinde bulunamadı: ${operation.tpysBaraAdi}`);
        summary.failures += 1;
        continue;
      }
      summary.matchedBarasOnPage += 1;

      const record = getStoreRecord(store, recordIndex);
      for (let hour = 0; hour < 24; hour += 1) {
        const code = operation.statusByHour[hour];
        if (!code) continue;

        const desiredLabel = settings.statusLabels[code] || code;
        const statusDataIndex = fieldMeta.statusByHour.get(hour);
        const approvalDataIndex = fieldMeta.approvalByHour.get(hour);

        if (!statusDataIndex) {
          errors.push(`${operation.tpysBaraAdi} | ${hour}: Durum dataIndex bulunamadı.`);
          summary.failures += 1;
          continue;
        }

        const desiredValue = getNestedMap(statusValueByHourAndLabel, hour, desiredLabel);
        const currentValue = getRecordValue(record, statusDataIndex);

        if (settings.onlyChangedCells && normalizeText(String(currentValue ?? '')) === normalizeText(String(desiredValue ?? ''))) {
          summary.unchanged += 1;
        } else {
          writes.push({ recordIndex, dataIndex: statusDataIndex, value: desiredValue, kind: 'status' });
          summary.statusWritesOk += 1;
        }

        if (settings.checkApproval && approvalDataIndex) {
          const currentApproval = getRecordValue(record, approvalDataIndex);
          const desiredApproval = coerceApprovalValue(currentApproval, true);
          if (settings.onlyChangedCells && approvalsEqual(currentApproval, desiredApproval)) {
            summary.unchanged += 1;
          } else {
            writes.push({ recordIndex, dataIndex: approvalDataIndex, value: desiredApproval, kind: 'approval' });
            summary.approvalWritesOk += 1;
          }
        }
      }
    }

    return {
      ok: true,
      payload: {
        Ext,
        grid,
        store,
        writes,
        summary,
        errors
      }
    };
  }

  function executeExtBatchApply(payload) {
    const { Ext, grid, store, writes, summary, errors } = payload;
    try {
      if (typeof Ext.suspendLayouts === 'function') Ext.suspendLayouts();
      const writesByRecord = new Map();
      writes.forEach((write) => {
        if (!writesByRecord.has(write.recordIndex)) writesByRecord.set(write.recordIndex, []);
        writesByRecord.get(write.recordIndex).push(write);
      });

      for (const [recordIndex, rowWrites] of writesByRecord.entries()) {
        const record = getStoreRecord(store, recordIndex);
        if (!record) continue;
        if (typeof record.beginEdit === 'function') record.beginEdit();
        for (const write of rowWrites) {
          if (typeof record.set === 'function') record.set(write.dataIndex, write.value);
          else if (record.data) record.data[write.dataIndex] = write.value;
        }
        if (typeof record.endEdit === 'function') record.endEdit();
        if (typeof record.dirty !== 'undefined') record.dirty = true;
      }

      const view = getGridView(grid);
      if (view && typeof view.refresh === 'function') view.refresh();
      if (typeof Ext.resumeLayouts === 'function') Ext.resumeLayouts(true);

      return {
        ok: true,
        modeUsed: 'ext-batch',
        summary,
        errors
      };
    } catch (error) {
      console.warn('[TPYS Reactive Extension] Ext batch apply failed, DOM fallback kullanılacak.', error);
      return { ok: false, reason: error.message };
    }
  }

  async function applyPlanViaDom(operations, settings, pageRows) {
    const pageMap = new Map(pageRows.map((row) => [normalizeText(row.baraName), row.rowIndex]));
    const unlockedRows = Array.from(document.querySelectorAll('.x-grid3-viewport .x-grid3-body .x-grid3-row'));

    const summary = {
      totalBarasInPlan: operations.length,
      matchedBarasOnPage: 0,
      statusWritesOk: 0,
      approvalWritesOk: 0,
      unchanged: 0,
      failures: 0
    };
    const errors = [];

    for (const operation of operations) {
      if (operation.unmatched) {
        errors.push(`Statik tabloda eşleşmeyen bara: ${operation.sourceBara}`);
        summary.failures += 1;
        continue;
      }

      const rowIndex = pageMap.get(normalizeText(operation.tpysBaraAdi));
      if (rowIndex === undefined) {
        errors.push(`ERP sayfasında bulunamadı: ${operation.tpysBaraAdi}`);
        summary.failures += 1;
        continue;
      }

      summary.matchedBarasOnPage += 1;
      const rowEl = unlockedRows[rowIndex];
      if (!rowEl) {
        errors.push(`Satır DOM bulunamadı: ${operation.tpysBaraAdi}`);
        summary.failures += 1;
        continue;
      }

      rowEl.scrollIntoView({ block: 'center', inline: 'nearest' });
      await nextFrame();

      for (let hour = 0; hour < 24; hour += 1) {
        const statusCode = operation.statusByHour[hour];
        if (!statusCode) continue;

        const desiredLabel = settings.statusLabels[statusCode] || statusCode;
        const statusCell = rowEl.querySelector(`.x-grid3-td-lkp_reaktif_yerine_getirme${hour}`);
        const approvalCell = rowEl.querySelector(`.x-grid3-td-onay_durum_flag${hour}`);

        if (!statusCell) {
          errors.push(`${operation.tpysBaraAdi} | ${hour}: Durum hücresi bulunamadı.`);
          summary.failures += 1;
          continue;
        }

        const statusResult = await writeStatus(statusCell, desiredLabel, settings);
        if (statusResult.ok) {
          if (statusResult.changed) summary.statusWritesOk += 1;
          else summary.unchanged += 1;
        } else {
          errors.push(`${operation.tpysBaraAdi} | ${hour}: ${statusResult.reason}`);
          summary.failures += 1;
          continue;
        }

        if (settings.checkApproval && approvalCell) {
          const approvalResult = await setApproval(approvalCell, true);
          if (approvalResult.ok) {
            if (approvalResult.changed) summary.approvalWritesOk += 1;
            else summary.unchanged += 1;
          } else {
            errors.push(`${operation.tpysBaraAdi} | ${hour}: ${approvalResult.reason}`);
            summary.failures += 1;
          }
        }
      }
    }

    return { ok: true, modeUsed: 'dom-fallback', summary, errors };
  }

  async function writeStatus(cell, desiredLabel, settings) {
    const inner = cell.querySelector('.x-grid3-cell-inner');
    const current = (inner?.textContent || '').trim();
    if (settings.onlyChangedCells && normalizeText(current) === normalizeText(desiredLabel)) {
      markCell(cell, 'same');
      return { ok: true, changed: false };
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      activateCell(cell);
      await sleep(35);

      const pickerItem = findVisibleComboItem(desiredLabel);
      if (pickerItem) {
        clickElement(pickerItem);
        await sleep(35);
        if (normalizeText((cell.querySelector('.x-grid3-cell-inner')?.textContent || '').trim()) === normalizeText(desiredLabel)) {
          markCell(cell, 'ok');
          return { ok: true, changed: true };
        }
      }

      const input = findVisibleInput();
      if (input) {
        focusAndReplaceInputValue(input, desiredLabel);
        await sleep(35);
        const pickerAgain = findVisibleComboItem(desiredLabel);
        if (pickerAgain) clickElement(pickerAgain);
        else pressKey(input, 'Enter');
        await sleep(35);
        clickOutside();
        await sleep(20);

        if (normalizeText((cell.querySelector('.x-grid3-cell-inner')?.textContent || '').trim()) === normalizeText(desiredLabel)) {
          markCell(cell, 'ok');
          return { ok: true, changed: true };
        }
      }
    }

    return { ok: false, reason: `Durum yazılamadı. Beklenen etiket: ${desiredLabel}` };
  }

  async function setApproval(cell, checked) {
    const current = isApprovalChecked(cell);
    if (current === checked) {
      markCell(cell, 'same');
      return { ok: true, changed: false };
    }

    clickElement(cell.querySelector('img') || cell);
    await sleep(20);
    if (isApprovalChecked(cell) === checked) {
      markCell(cell, 'ok');
      return { ok: true, changed: true };
    }

    clickElement(cell);
    await sleep(30);
    if (isApprovalChecked(cell) === checked) {
      markCell(cell, 'ok');
      return { ok: true, changed: true };
    }

    return { ok: false, reason: 'Onay kutusu işaretlenemedi.' };
  }

  async function clickCommitButton() {
    const button = Array.from(document.querySelectorAll('.x-grid-commit button, table.x-grid-commit button, .x-btn button'))
      .find((el) => {
        const text = (el.textContent || '').trim();
        return text === '' || /commit|kaydet/i.test(text);
      });

    if (!button) {
      return { ok: false, reason: 'Commit butonu bulunamadı.' };
    }

    clickElement(button);
    return { ok: true };
  }

  function findTargetGrid(pageRows) {
    const Ext = window.Ext;
    if (!Ext) return null;
    const components = collectExtComponents(Ext);
    const visibleNames = new Set(pageRows.map((row) => normalizeText(row.baraName)));

    let best = null;
    let bestScore = -1;

    components.forEach((component) => {
      const store = getStore(component);
      const cm = getColumnModel(component);
      if (!store || !cm) return;

      const storeCount = getStoreCount(store);
      if (!storeCount) return;

      const sampleFields = getCandidateFieldNamesFromStore(store);
      if (!sampleFields.length) return;

      let overlap = 0;
      for (const field of sampleFields) {
        const matches = countMatchesForField(store, field, visibleNames);
        overlap = Math.max(overlap, matches);
      }

      const hasStatusField = sampleFields.some((field) => /^lkp_reaktif_yerine_getirme0$/i.test(field));
      const score = overlap * 10 + (hasStatusField ? 5 : 0) + Math.min(storeCount, 50) / 50;

      if (score > bestScore) {
        bestScore = score;
        best = component;
      }
    });

    return bestScore > 0 ? best : null;
  }

  function collectExtComponents(Ext) {
    const list = [];
    const mgr = Ext.ComponentMgr || Ext.ComponentManager;
    if (!mgr || !mgr.all) return list;

    if (typeof mgr.all.each === 'function') {
      mgr.all.each((component) => list.push(component));
      return list;
    }

    if (Array.isArray(mgr.all.items)) {
      return mgr.all.items.slice();
    }

    if (mgr.all.map) {
      return Object.values(mgr.all.map);
    }

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
    if (typeof store.getCount === 'function') return store.getCount();
    if (Array.isArray(store.data?.items)) return store.data.items.length;
    return 0;
  }

  function getStoreRecord(store, index) {
    if (typeof store.getAt === 'function') return store.getAt(index);
    return store.data?.items?.[index] || null;
  }

  function getRecordValue(record, field) {
    if (!record || !field) return undefined;
    if (typeof record.get === 'function') return record.get(field);
    if (record.data) return record.data[field];
    return record[field];
  }

  function getCandidateFieldNamesFromStore(store) {
    const record = getStoreRecord(store, 0);
    if (!record) return [];
    if (record.fields?.items) {
      return record.fields.items.map((item) => item.name);
    }
    if (record.data) return Object.keys(record.data);
    return Object.keys(record);
  }

  function countMatchesForField(store, field, visibleNames) {
    let count = 0;
    const limit = Math.min(getStoreCount(store), 200);
    for (let i = 0; i < limit; i += 1) {
      const value = getRecordValue(getStoreRecord(store, i), field);
      if (visibleNames.has(normalizeText(value))) count += 1;
    }
    return count;
  }

  function buildGridFieldMeta(grid, cm, store, pageRows) {
    const visibleNames = new Set(pageRows.map((row) => normalizeText(row.baraName)));
    const candidateFields = getCandidateFieldNamesFromStore(store);

    let baraField = '';
    let baraScore = -1;
    candidateFields.forEach((field) => {
      const score = countMatchesForField(store, field, visibleNames);
      if (score > baraScore) {
        baraScore = score;
        baraField = field;
      }
    });

    const statusByHour = new Map();
    const approvalByHour = new Map();
    const columnIndexByDataIndex = new Map();

    const columnCount = getColumnCount(cm);
    for (let i = 0; i < columnCount; i += 1) {
      const dataIndex = getDataIndex(cm, i);
      if (!dataIndex) continue;
      columnIndexByDataIndex.set(dataIndex, i);

      const statusMatch = String(dataIndex).match(/^lkp_reaktif_yerine_getirme(\d{1,2})$/i);
      const approvalMatch = String(dataIndex).match(/^onay_durum_flag(\d{1,2})$/i);

      if (statusMatch) statusByHour.set(Number(statusMatch[1]), dataIndex);
      if (approvalMatch) approvalByHour.set(Number(approvalMatch[1]), dataIndex);
    }

    return { baraField, statusByHour, approvalByHour, columnIndexByDataIndex };
  }

  function getColumnCount(cm) {
    if (typeof cm.getColumnCount === 'function') return cm.getColumnCount();
    if (Array.isArray(cm.config)) return cm.config.length;
    return 0;
  }

  function getDataIndex(cm, columnIndex) {
    if (typeof cm.getDataIndex === 'function') return cm.getDataIndex(columnIndex);
    return cm.config?.[columnIndex]?.dataIndex || '';
  }

  function resolveEditorValue(cm, store, columnIndex, desiredLabel) {
    try {
      let editor = null;
      if (typeof cm.getCellEditor === 'function') editor = cm.getCellEditor(columnIndex, 0);
      if (!editor && cm.config?.[columnIndex]?.editor) editor = cm.config[columnIndex].editor;
      const field = editor?.field || editor;
      const comboStore = field?.store;
      if (!comboStore) return { ok: false };

      const displayField = field.displayField || 'text';
      const valueField = field.valueField || 'value';
      const count = getStoreCount(comboStore);

      for (let i = 0; i < count; i += 1) {
        const record = getStoreRecord(comboStore, i);
        const display = getRecordValue(record, displayField);
        if (normalizeText(display) === normalizeText(desiredLabel)) {
          return { ok: true, value: getRecordValue(record, valueField) };
        }
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  function getFirstValueType(store, field) {
    const record = getStoreRecord(store, 0);
    const value = getRecordValue(record, field);
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

  function activateCell(cell) {
    clickElement(cell);
    dispatchMouse(cell, 'dblclick');
  }

  function findVisibleComboItem(desiredLabel) {
    const items = Array.from(document.querySelectorAll('.x-combo-list-item, .x-boundlist-item, li, .x-layer div'));
    return items.find((item) => {
      const style = window.getComputedStyle(item);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const text = (item.textContent || '').trim();
      return text && normalizeText(text) === normalizeText(desiredLabel);
    }) || null;
  }

  function findVisibleInput() {
    const candidates = Array.from(document.querySelectorAll('input.x-form-field, input.x-form-text, textarea.x-form-field, textarea, select'));
    return candidates.find((input) => {
      const style = window.getComputedStyle(input);
      return !input.disabled && style.display !== 'none' && style.visibility !== 'hidden';
    }) || null;
  }

  function focusAndReplaceInputValue(input, value) {
    input.focus();
    if ('value' in input) input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function clickOutside() {
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function clickElement(element) {
    dispatchMouse(element, 'mousedown');
    dispatchMouse(element, 'mouseup');
    dispatchMouse(element, 'click');
  }

  function pressKey(element, key) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }

  function dispatchMouse(element, type) {
    element.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  }

  function isApprovalChecked(cell) {
    const img = cell.querySelector('img');
    const src = img?.getAttribute('src') || '';
    return /checked/i.test(src) && !/unchecked/i.test(src);
  }

  function markCell(cell, kind) {
    cell.dataset.tpysReactiveMark = kind;
    if (kind === 'ok') cell.style.outline = '2px solid #16a34a';
    if (kind === 'same') cell.style.outline = '2px solid #64748b';
  }

  function setNestedMap(map, key1, key2, value) {
    if (!map.has(key1)) map.set(key1, new Map());
    map.get(key1).set(key2, value);
  }

  function getNestedMap(map, key1, key2) {
    return map.get(key1)?.get(key2);
  }


  let csvRunLock = false;

  const RGDH_ALLOWED_PATHS = [
    '/api/rgdh-conventional-busbar-data',
    '/api/rgdh-wind-busbar-data',
    '/api/general-parameter-by-name',
    '/api/busbars'
  ];

  async function fetchRgdhFromContentContext(payload) {
    const endpoint = String(payload?.endpoint || '');
    if (!RGDH_ALLOWED_PATHS.includes(endpoint)) {
      return { ok: false, error: 'RGDH endpoint whitelist disinda.', errorType: 'VALIDATION_ERROR' };
    }
    try {
      const url = new URL(endpoint, 'https://yks.teias.gov.tr');
      Object.entries(payload.params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
      });
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        redirect: 'follow'
      });
      if (!response.ok) {
        return {
          ok: false,
          error: `RGDH content fetch basarisiz (${response.status}).`,
          errorType: response.status === 401 || response.status === 403 ? 'AUTH_REQUIRED' : 'NETWORK_ERROR',
          httpStatus: response.status
        };
      }
      const json = await response.json();
      return { ok: true, rows: Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []), httpStatus: response.status };
    } catch (error) {
      return { ok: false, error: error.message || String(error), errorType: 'CONTENT_FETCH_ERROR' };
    }
  }

  async function scrapeRgdhDom(payload = {}) {
    const rows = payload.discoverOnly ? [] : collectRgdhVisibleRows();
    const busbarInternalIds = discoverRgdhBusbarInternalIds();
    return {
      ok: true,
      sourceOrigin: 'DOM',
      partial: true,
      rows,
      busbarInternalIds,
      warning: rows.length
        ? 'DOM verisi kismi olabilir; API veya CSV ile dogrulama onerilir.'
        : ''
    };
  }

  function discoverRgdhBusbarInternalIds() {
    const ids = new Set();
    Array.from(document.querySelectorAll('input[type="hidden"], option[value]')).forEach((node) => {
      const value = String(node.value || node.getAttribute('value') || '').trim();
      if (/^\d{6,}$/.test(value)) ids.add(value);
    });

    const Ext = window.Ext;
    if (Ext) {
      collectExtComponents(Ext).forEach((component) => {
        const store = component?.store || component?.getStore?.();
        const count = typeof store?.getCount === 'function' ? store.getCount() : 0;
        const valueField = component?.valueField || 'id';
        for (let i = 0; i < count; i += 1) {
          const rec = store.getAt(i);
          const value = rec?.get ? rec.get(valueField) : rec?.data?.[valueField];
          if (/^\d{6,}$/.test(String(value || '').trim())) ids.add(String(value).trim());
        }
        const current = component?.getValue?.() || component?.value || component?.hiddenField?.value;
        if (/^\d{6,}$/.test(String(current || '').trim())) ids.add(String(current).trim());
      });
    }

    return [...ids];
  }

  function collectRgdhVisibleRows() {
    const tableRows = collectRgdhRowsFromTables();
    if (tableRows.length) return tableRows;
    return collectRgdhRowsFromExtGrid();
  }

  function collectRgdhRowsFromTables() {
    const rows = [];
    Array.from(document.querySelectorAll('table')).forEach((table) => {
      const headers = Array.from(table.querySelectorAll('thead th, thead td')).map((cell) => (cell.textContent || '').trim());
      if (!headers.length || !headers.some((header) => /bara/i.test(normalizeText(header)))) return;
      Array.from(table.querySelectorAll('tbody tr')).forEach((tr) => {
        const cells = Array.from(tr.children).map((cell) => (cell.textContent || '').trim());
        const object = {};
        headers.forEach((header, index) => { object[header] = cells[index] || ''; });
        const row = normalizeRgdhDomObject(object);
        if (row.busbarId || row.busbarName) rows.push(row);
      });
    });
    return rows;
  }

  function collectRgdhRowsFromExtGrid() {
    const rows = [];
    const lockedRows = Array.from(document.querySelectorAll('.x-grid3-locked .x-grid3-body .x-grid3-row'));
    const bodyRows = Array.from(document.querySelectorAll('.x-grid3-viewport .x-grid3-body .x-grid3-row, .x-grid3-unlocked .x-grid3-body .x-grid3-row'));
    const count = Math.max(lockedRows.length, bodyRows.length);
    for (let index = 0; index < count; index += 1) {
      const text = `${lockedRows[index]?.textContent || ''} ${bodyRows[index]?.textContent || ''}`.trim();
      if (!text || !/bara|res|ges|hes|tm/i.test(normalizeText(text))) continue;
      const idMatch = text.match(/\b(\d{3,6})\b/);
      rows.push({
        sourceOrigin: 'DOM',
        sourceType: /res|ges|ruzgar|rüzgar/i.test(normalizeText(text)) ? 'WIND' : 'CONVENTIONAL',
        busbarId: idMatch ? Number(idMatch[1]) : null,
        busbarName: text.slice(0, 120),
        flags: { partialSource: true },
        raw: { text }
      });
    }
    return rows;
  }

  function normalizeRgdhDomObject(object) {
    const get = (patterns) => {
      const entry = Object.entries(object).find(([key]) => patterns.some((pattern) => pattern.test(normalizeText(key))));
      return entry ? entry[1] : '';
    };
    const busbarIdRaw = get([/bara id/]);
    const busbarName = get([/bara adi/, /bara ad/]);
    const sourceType = /res|ges|ruzgar|rüzgar/i.test(normalizeText(busbarName)) ? 'WIND' : 'CONVENTIONAL';
    return {
      sourceOrigin: 'DOM',
      sourceType,
      ytm: get([/bytm/, /ytm/]),
      busbarId: /^\d+$/.test(busbarIdRaw) ? Number(busbarIdRaw) : null,
      busbarName,
      flags: { partialSource: true },
      raw: object
    };
  }

  function initializeExtensionEnhancements() {
    // TPYS sayfasına ekstra buton enjekte edilmiyor.
  }


  async function toggleApprovalSimplify() {
    const hidden = !(window.__tpysApprovalSimplified === true);
    window.__tpysApprovalSimplified = hidden;
    applyApprovalSimplifyState(hidden);
    return { ok: true, hidden };
  }

  function applyApprovalSimplifyState(hidden) {
    const styleId = 'tpys-approval-simplify-style';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    if (hidden) {
      const style = document.createElement('style');
      style.id = styleId;
      const selectors = [
        '.x-grid3-td-ytm_kisa_ad',
        '.x-grid3-td-sehir_txt',
        '.x-grid3-td-onay_durum',
        '.x-grid3-td-aciklama',
        ...Array.from({ length: 24 }, (_, i) => `.x-grid3-td-saat${i}`)
      ];
      style.textContent = `${selectors.join(', ')} { display: none !important; width: 0 !important; min-width: 0 !important; max-width: 0 !important; padding: 0 !important; border-left-width: 0 !important; border-right-width: 0 !important; }`;
      document.head.appendChild(style);
    }

    requestAnimationFrame(() => {
      adjustApprovalGridLayout();
      if (window.Ext) {
        try {
          const comps = collectExtComponents(window.Ext);
          comps.forEach((c) => c?.getView?.()?.refresh?.());
        } catch {}
      }
    });
  }

  function adjustApprovalGridLayout() {
    const grids = Array.from(document.querySelectorAll('.x-grid3')).filter((grid) => {
      return grid.querySelector('.x-grid3-td-bara_ad') && grid.querySelector('.x-grid3-td-onay_durum_flag0');
    });

    grids.forEach((grid) => {
      const locked = grid.querySelector('.x-grid3-locked');
      const unlocked = grid.querySelector('.x-grid3-unlocked');
      if (!locked || !unlocked) return;

      const lockedHeaderCells = Array.from(locked.querySelectorAll('.x-grid3-header-offset thead tr:first-child td'))
        .filter((td) => td.offsetParent !== null);
      const lockedWidth = Math.max(140, Math.round(lockedHeaderCells.reduce((sum, td) => sum + td.getBoundingClientRect().width, 0)));

      const gridWidth = Math.round(grid.getBoundingClientRect().width) || (lockedWidth + 400);
      const unlockedWidth = Math.max(180, gridWidth - lockedWidth - 4);

      locked.style.width = `${lockedWidth}px`;
      const lockedHeader = locked.querySelector('.x-grid3-header');
      const lockedScroller = locked.querySelector('.x-grid3-scroller');
      const lockedBody = locked.querySelector('.x-grid3-body');
      const lockedHeaderInner = locked.querySelector('.x-grid3-header-inner');
      if (lockedHeader) lockedHeader.style.width = `${lockedWidth}px`;
      if (lockedScroller) lockedScroller.style.width = `${lockedWidth}px`;
      if (lockedBody) lockedBody.style.width = `${lockedWidth}px`;
      if (lockedHeaderInner) lockedHeaderInner.style.width = `${lockedWidth}px`;

      unlocked.style.left = `${lockedWidth + 1}px`;
      unlocked.style.width = `${unlockedWidth}px`;
      const unlockedHeader = unlocked.querySelector('.x-grid3-header');
      const unlockedScroller = unlocked.querySelector('.x-grid3-scroller');
      const unlockedHeaderInner = unlocked.querySelector('.x-grid3-header-inner');
      if (unlockedHeader) unlockedHeader.style.width = `${unlockedWidth}px`;
      if (unlockedScroller) unlockedScroller.style.width = `${unlockedWidth}px`;
      if (unlockedHeaderInner) unlockedHeaderInner.style.width = `${Math.max(unlockedWidth, unlockedHeaderInner.scrollWidth || 0)}px`;
    });
  }

  async function getDownloadContext() {
    const controls = findCsvDownloadControls();
    if (!controls.ok) return controls;
    const baras = await discoverCsvBaras();
    return {
      ok: true,
      pageDate: controls.pageDate || '',
      baraCount: baras.length,
      baras
    };
  }

  function appendCsvLog(text) {
    console.info('[TPYS CSV]', text);
  }

  function findCsvDownloadControls() {
    const downloadButton = findButtonByText(/^CSV\s*İndir$/i);
    if (!downloadButton) return { ok: false, reason: 'CSV İndir butonu bulunamadı.' };

    const allFormItems = Array.from(document.querySelectorAll('.x-form-item'));
    let baraItem = null;
    for (const item of allFormItems) {
      const label = (item.querySelector('label')?.textContent || '').trim();
      if (normalizeText(label) === 'bara') {
        baraItem = item;
        break;
      }
    }
    if (!baraItem) return { ok: false, reason: 'Bara alanı bulunamadı.' };

    const dateInput = document.querySelector('input[name="xgecerlilik_dt"], input#ext-comp-1353, input#ext-comp-1095, input#ext-comp-1084');
    const textInput = baraItem.querySelector('input[type="text"]');
    const hiddenInput = baraItem.querySelector('input[type="hidden"][name="xbara_id"], input[type="hidden"]');
    const trigger = baraItem.querySelector('.x-form-arrow-trigger, .x-form-trigger');

    if (!textInput || !trigger) return { ok: false, reason: 'Bara combobox tetikleyicisi bulunamadı.' };

    return {
      ok: true,
      pageDate: (dateInput?.value || '').trim(),
      downloadButton,
      baraItem,
      textInput,
      hiddenInput,
      trigger
    };
  }

  async function discoverCsvBaras() {
    const extCombo = findExtCsvCombo();
    const fromExt = getExtComboOptions(extCombo);
    if (fromExt.length) return fromExt;

    const controls = findCsvDownloadControls();
    if (!controls.ok) return [];
    openComboDropdown(controls.trigger);
    await sleep(180);
    const list = findVisibleComboList();
    const items = list
      ? Array.from(list.querySelectorAll('.x-combo-list-item')).map((el) => (el.textContent || '').trim()).filter(Boolean)
      : [];
    clickOutside();
    return [...new Set(items)];
  }

  async function runBulkCsvDownloads(options = {}) {
    if (csvRunLock) return { ok: false, reason: 'İndirme otomasyonu zaten çalışıyor.' };
    csvRunLock = true;
    try {
      const controls = findCsvDownloadControls();
      if (!controls.ok) return controls;

      const discoveredBaras = await discoverCsvBaras();
      const requestedBaras = Array.isArray(options.baraNames) && options.baraNames.length
        ? options.baraNames.map((x) => String(x || '').trim()).filter(Boolean)
        : [];

      const requestedSet = new Set(requestedBaras.map((x) => normalizeText(x)));
      const baras = discoveredBaras.filter((name) => !requestedSet.size || requestedSet.has(normalizeText(name)));
      if (!baras.length) return { ok: false, reason: 'İndirilecek bara listesi okunamadı.' };

      appendCsvLog(`Toplu indirme başladı. Sayfa sırasındaki bara sayısı: ${baras.length}`);

      let successCount = 0;
      let failureCount = 0;
      const errors = [];
      const delayMs = Math.max(1200, Number(options.delayMs || 1800));
      let lastDownloadedHref = '';

      for (let i = 0; i < baras.length; i += 1) {
        const baraName = baras[i];
        appendCsvLog(`${i + 1}/${baras.length} seçiliyor: ${baraName}`);
        closeCsvFileWindows();
        const selected = await selectCsvBara(baraName);
        if (!selected.ok) {
          failureCount += 1;
          errors.push(`${baraName}: ${selected.reason}`);
          continue;
        }

        await sleep(320);
        const triggered = await triggerCsvDownload({ baraName, lastDownloadedHref });
        if (triggered.ok) {
          successCount += 1;
          lastDownloadedHref = triggered.href || lastDownloadedHref;
          appendCsvLog(`İndirildi: ${baraName}${triggered.filename ? ` → ${triggered.filename}` : ''}`);
        } else {
          failureCount += 1;
          errors.push(`${baraName}: ${triggered.reason}`);
          appendCsvLog(`Atlandı/Hata: ${baraName} → ${triggered.reason}`);
        }

        await sleep(delayMs);
      }

      return {
        ok: true,
        pageDate: controls.pageDate || '',
        total: baras.length,
        requestedTotal: requestedBaras.length || baras.length,
        discoveredTotal: discoveredBaras.length,
        successCount,
        failureCount,
        errors
      };
    } catch (error) {
      return { ok: false, error: error.message, stack: error.stack };
    } finally {
      csvRunLock = false;
    }
  }

  async function selectCsvBara(baraName) {
    const extCombo = findExtCsvCombo();
    if (extCombo) {
      const ok = selectExtComboOption(extCombo, baraName);
      if (ok) {
        await sleep(140);
        return { ok: true };
      }
    }

    const controls = findCsvDownloadControls();
    if (!controls.ok) return controls;
    openComboDropdown(controls.trigger);
    await sleep(180);
    const list = findVisibleComboList();
    if (!list) return { ok: false, reason: 'Dropdown listesi açılamadı.' };

    const items = Array.from(list.querySelectorAll('.x-combo-list-item'));
    const item = items.find((el) => normalizeText(el.textContent) === normalizeText(baraName));
    if (!item) {
      clickOutside();
      return { ok: false, reason: 'İstenen bara listede bulunamadı.' };
    }

    item.scrollIntoView({ block: 'nearest' });
    clickElement(item);
    await sleep(160);
    return { ok: true };
  }

  async function triggerCsvDownload(options = {}) {
    const extBtn = findExtCsvDownloadButton();
    try {
      if (extBtn) {
        if (typeof extBtn.handler === 'function') extBtn.handler.call(extBtn.scope || extBtn, extBtn);
        const domBtn = extBtn.el?.dom?.querySelector('button');
        if (domBtn) clickElement(domBtn);
        else if (typeof extBtn.fireEvent === 'function') extBtn.fireEvent('click', extBtn);
      } else {
        const controls = findCsvDownloadControls();
        if (!controls.ok) return controls;
        clickElement(controls.downloadButton);
      }
    } catch (error) {
      const controls = findCsvDownloadControls();
      if (!controls.ok) return controls;
      clickElement(controls.downloadButton);
    }

    const fileWindow = await waitForCsvFileWindow(8000);
    if (!fileWindow) return { ok: false, reason: 'CSV dosya penceresi açılmadı.' };

    const downloadResult = await triggerFirstCsvLink(fileWindow, options);
    closeCsvFileWindows();
    return downloadResult;
  }

  async function waitForCsvFileWindow(timeoutMs = 5000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const existing = findCsvFileWindow();
      if (existing) return existing;
      await sleep(120);
    }
    return null;
  }

  async function waitForCsvLink(fileWindow, timeoutMs = 12000, lastDownloadedHref = '') {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const link = findFirstCsvLink(fileWindow, lastDownloadedHref);
      if (link) return link;
      await sleep(160);
    }
    return null;
  }

  function findCsvFileWindow() {
    const windows = Array.from(document.querySelectorAll('.x-window'));
    return windows.find((win) => {
      const title = normalizeText(win.querySelector('.x-window-header-text')?.textContent || '');
      return title.includes('bara csv dosyalar');
    }) || null;
  }

  function closeCsvFileWindows() {
    Array.from(document.querySelectorAll('.x-window')).forEach((win) => {
      const title = normalizeText(win.querySelector('.x-window-header-text')?.textContent || '');
      if (!title.includes('bara csv dosyalar')) return;
      const closeBtn = win.querySelector('.x-tool-close');
      if (closeBtn) clickElement(closeBtn);
      else win.remove();
    });
  }

  function findFirstCsvLink(fileWindow, lastDownloadedHref = '') {
    const candidates = Array.from(fileWindow.querySelectorAll('.x-grid3-row-selected a[href*="dl/"], .x-grid3-row-first a[href*="dl/"], a[href*="dl/"], a[href^="dl/"]'));
    const previous = String(lastDownloadedHref || '').trim();
    return candidates.find((link) => {
      const rawHref = String(link.getAttribute('href') || '').trim();
      if (!rawHref) return false;
      const absoluteHref = new URL(rawHref, window.location.href).href;
      if (previous && absoluteHref === previous) return false;
      return /\/dl\//i.test(absoluteHref);
    }) || null;
  }

  async function triggerFirstCsvLink(fileWindow, options = {}) {
    const link = await waitForCsvLink(fileWindow, 15000, options.lastDownloadedHref || '');
    if (!link) return { ok: false, reason: 'Dosya bağlantısı bulunamadı.' };

    const href = new URL(link.getAttribute('href'), window.location.href).href;
    const filenameHint = (link.textContent || '').trim() || `${(options.baraName || 'bara').replace(/\s+/g, '_')}.csv`;

    const backgroundResult = await downloadViaBackground(href, filenameHint, 50000);
    if (backgroundResult?.ok) {
      return { ok: true, href, filename: backgroundResult.filename || filenameHint, via: 'downloads-api' };
    }

    try {
      link.setAttribute('target', '_self');
      clickElement(link);
      await sleep(2500);
      return { ok: true, href, filename: filenameHint, via: 'click-fallback' };
    } catch (error) {
      return { ok: false, reason: backgroundResult?.reason || error.message || 'İndirme tetiklenemedi.' };
    }
  }

  async function downloadViaBackground(url, filenameHint, timeoutMs) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'DOWNLOAD_URL_AND_WAIT', payload: { url, filenameHint, timeoutMs } }, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            resolve({ ok: false, reason: err.message });
            return;
          }
          resolve(response || { ok: false, reason: 'Arka plan indirimi yanıt vermedi.' });
        });
      } catch (error) {
        resolve({ ok: false, reason: error.message });
      }
    });
  }

  function findButtonByText(regex) {
    return Array.from(document.querySelectorAll('button')).find((el) => regex.test((el.textContent || '').trim()));
  }

  function openComboDropdown(trigger) {
    clickElement(trigger);
    dispatchMouse(trigger, 'mousedown');
    dispatchMouse(trigger, 'mouseup');
  }

  function findVisibleComboList() {
    return Array.from(document.querySelectorAll('.x-combo-list, .x-layer')).find((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.querySelector('.x-combo-list-item');
    });
  }

  function findExtCsvCombo() {
    const Ext = window.Ext;
    if (!Ext) return null;
    const mgr = Ext.ComponentMgr || Ext.ComponentManager;
    if (!mgr?.all) return null;
    const items = [];
    if (typeof mgr.all.each === 'function') mgr.all.each((cmp) => items.push(cmp));
    else if (Array.isArray(mgr.all.items)) items.push(...mgr.all.items);
    else if (mgr.all.map) items.push(...Object.values(mgr.all.map));

    return items.find((cmp) => {
      const hiddenName = cmp?.hiddenName || cmp?.name || cmp?.hiddenField?.name || '';
      const fieldLabel = cmp?.fieldLabel || '';
      const xtype = cmp?.xtype || cmp?.getXType?.() || '';
      return /combo/i.test(String(xtype)) && (normalizeText(hiddenName) === 'xbara id' || normalizeText(fieldLabel) === 'bara');
    }) || null;
  }

  function getExtComboOptions(combo) {
    if (!combo?.store) return [];
    const count = typeof combo.store.getCount === 'function' ? combo.store.getCount() : 0;
    const displayField = combo.displayField || 'text';
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const rec = combo.store.getAt(i);
      const label = rec?.get ? rec.get(displayField) : rec?.data?.[displayField];
      if (label) out.push(String(label).trim());
    }
    return [...new Set(out)];
  }

  function selectExtComboOption(combo, baraName) {
    try {
      if (!combo?.store) return false;
      const count = typeof combo.store.getCount === 'function' ? combo.store.getCount() : 0;
      const displayField = combo.displayField || 'text';
      const valueField = combo.valueField || 'value';
      for (let i = 0; i < count; i += 1) {
        const rec = combo.store.getAt(i);
        const label = rec?.get ? rec.get(displayField) : rec?.data?.[displayField];
        if (normalizeText(label) !== normalizeText(baraName)) continue;
        const value = rec?.get ? rec.get(valueField) : rec?.data?.[valueField];
        if (typeof combo.setValue === 'function') combo.setValue(value);
        if (typeof combo.setRawValue === 'function') combo.setRawValue(label);
        if (combo.hiddenField) combo.hiddenField.value = value;
        if (combo.el?.dom) {
          combo.el.dom.dispatchEvent(new Event('change', { bubbles: true }));
          combo.el.dom.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (typeof combo.fireEvent === 'function') {
          combo.fireEvent('beforeselect', combo, rec, i);
          combo.fireEvent('select', combo, rec, i);
          combo.fireEvent('change', combo, value, combo.lastSelectionText || '');
        }
        if (typeof combo.collapse === 'function') combo.collapse();
        return true;
      }
    } catch (error) {
    }
    return false;
  }

  function findExtCsvDownloadButton() {
    const Ext = window.Ext;
    if (!Ext) return null;
    const mgr = Ext.ComponentMgr || Ext.ComponentManager;
    if (!mgr?.all) return null;
    const items = [];
    if (typeof mgr.all.each === 'function') mgr.all.each((cmp) => items.push(cmp));
    else if (Array.isArray(mgr.all.items)) items.push(...mgr.all.items);
    else if (mgr.all.map) items.push(...Object.values(mgr.all.map));
    return items.find((cmp) => normalizeText(cmp?.text || '') === normalizeText('CSV İndir')) || null;
  }
  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'g')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'u')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
})();
