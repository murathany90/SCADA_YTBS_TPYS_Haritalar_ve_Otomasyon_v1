# Hibrit YKS Range Fetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yardımcı kaynaklı RES/GES baralarda YKS ekranının çalışan geniş aralık request biçimini taklit ederek `rgdh-wind-busbar-data` timeout sorununu çözmek.

**Architecture:** Hibrit RES/GES için mevcut saatlik çekim korunacak ama önce veya timeout sonrası page’siz “range cursor” çekim yolu denenecek. Bu yol `page=0` kullanmadan `size + sort + busbarId.equals + geniş tarih aralığı` ile veri alacak, 60 satırlık cevaplarda cursor’u son ölçüm zamanının bir dakika sonrasına taşıyarak tamamını toplayacak.

**Tech Stack:** Chrome extension background service worker, YKS page-context fetch, CommonJS Node tests (`node:test`), mevcut `rgdh-api-client.js`, `background.js`, `rgdh-monitor.js`.

---

## File Structure

- Modify: `rgdh-api-client.js`
  - Yeni page’siz hibrit range parametre üreticisi.
- Modify: `background.js`
  - String/boolean hibrit işaretini normalize etme.
  - Hibrit range cursor fetch helper’ı.
  - Hibrit fallback sırasını güncelleme.
  - Diagnostik log detaylarını genişletme.
- Modify: `rgdh-monitor.js`
  - Seçili bara payload’ında `hasAuxiliarySource` değerini kesin boolean tutma.
- Modify: `tests/rgdh-api-client.test.js`
  - Page’siz range parametre testi.
- Modify: `tests/background.test.js`
  - Hibrit string marker, page’siz range fetch, cursor paging, fallback ve partial error testleri.
- Optional Modify: `tests/rgdh-ui-smoke.test.js`
  - Payload boolean marker smoke testi gerekirse burada tutulur.

---

### Task 1: Normalize Hybrid Marker Types

**Files:**
- Modify: `background.js`
- Modify: `rgdh-monitor.js`
- Test: `tests/background.test.js`

- [x] **Step 1: Write the failing background test**

Add this test near the existing auxiliary RES/GES tests in `tests/background.test.js`:

```js
test('handleRgdhFetch treats string hasAuxiliarySource as hybrid auxiliary', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND',
      hasAuxiliarySource: 'true'
    }
  });

  const windCalls = calls.filter((call) => call.endpoint === '/api/rgdh-wind-busbar-data');
  assert.equal(windCalls.some((call) => String(call.params['busbarId.equals']) === '6002'), true);
});
```

- [x] **Step 2: Run the test and verify it fails**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "string hasAuxiliarySource"
```

Expected: FAIL because string `"true"` is not treated as hybrid consistently.

- [x] **Step 3: Add a boolean coercion helper in `background.js`**

Add near the RGDH helpers:

```js
function isTruthyRgdhFlag(value) {
  if (value === true) return true;
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes' || text === 'evet';
}
```

Update `normalizeSelectedRgdhBusbar`:

```js
const hasAuxiliarySource = isTruthyRgdhFlag(item.hasAuxiliarySource) || isTruthyRgdhFlag(item.hybridAuxiliary);
return {
  busbarInternalId: String(item.busbarInternalId || item.internalId || '').trim(),
  busbarId: String(item.busbarId || '').trim(),
  busbarName: String(item.busbarName || '').trim(),
  sourceType: normalizeRgdhSourceType(item.sourceType || item.busbarType || item.sourceKind || ''),
  plantName: String(item.plantName || '').trim(),
  rgkType: String(item.rgkType || '').trim(),
  sourceKind: String(item.sourceKind || '').trim(),
  hasAuxiliarySource,
  hybridAuxiliary: hasAuxiliarySource
};
```

Update `isAuxiliaryRgdhBusbar`:

```js
if (isTruthyRgdhFlag(selectedBusbar.hasAuxiliarySource) || isTruthyRgdhFlag(selectedBusbar.hybridAuxiliary)) return true;
```

- [x] **Step 4: Keep monitor payload boolean**

In `rgdh-monitor.js`, update `resolveSelectedBusbar` to call the existing marker helper:

```js
const hasAuxiliarySource = hasAuxiliarySourceMarker(selected);
return {
  busbarId: String(selected.busbarId || '').trim(),
  busbarName: selected.busbarName || '',
  sourceType: inferCatalogSourceType(selected),
  ytm: selected.ytm || '',
  plantName: selected.plantName || '',
  hasAuxiliarySource
};
```

- [x] **Step 5: Run verification**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "string hasAuxiliarySource"
```

Expected: PASS.

---

### Task 2: Add Page-Less Wind Range Params

**Files:**
- Modify: `rgdh-api-client.js`
- Test: `tests/rgdh-api-client.test.js`

- [x] **Step 1: Write the failing API client test**

Add to `tests/rgdh-api-client.test.js`:

```js
test('buildWindRangeParams mirrors YKS table request without page parameter', () => {
  const params = api.buildWindRangeParams('2026-04-30T21:00:00Z', '2026-05-01T11:00:00Z', 9490732369, { size: 60 });

  assert.equal(params['measurementDate.greaterOrEqualThan'], '2026-04-30T21:00:00Z');
  assert.equal(params['measurementDate.lessThan'], '2026-05-01T11:00:00Z');
  assert.equal(params['busbarId.equals'], 9490732369);
  assert.equal(params.size, 60);
  assert.equal(params.sort, 'measurementDate,asc');
  assert.equal(Object.hasOwn(params, 'page'), false);
});
```

- [x] **Step 2: Run the test and verify it fails**

Run:

```powershell
node --test tests/rgdh-api-client.test.js --test-name-pattern "buildWindRangeParams"
```

Expected: FAIL with `api.buildWindRangeParams is not a function`.

- [x] **Step 3: Implement `buildWindRangeParams`**

In `rgdh-api-client.js`, add near other wind param builders:

```js
function buildWindRangeParams(startUtc, endUtc, busbarInternalId, extra = {}) {
  const params = normalizeBusbarExtra({
    'measurementDate.greaterOrEqualThan': startUtc,
    'measurementDate.lessThan': endUtc,
    size: 60,
    sort: 'measurementDate,asc',
    busbarInternalId,
    ...extra
  });
  delete params.page;
  return params;
}
```

Export it in the returned API object:

```js
buildWindRangeParams,
```

- [x] **Step 4: Run verification**

Run:

```powershell
node --test tests/rgdh-api-client.test.js --test-name-pattern "buildWindRangeParams"
```

Expected: PASS.

---

### Task 3: Implement Hybrid Range Cursor Fetch

**Files:**
- Modify: `background.js`
- Test: `tests/background.test.js`

- [x] **Step 1: Write failing range fetch test**

Add to `tests/background.test.js`:

```js
test('handleRgdhFetch uses page-less range cursor fetch for auxiliary RES/GES before hourly timeout fails the job', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.params.page !== undefined) {
      return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
    }
    return {
      ok: true,
      rows: [
        { measurementDate: '2026-04-30T21:00:00Z', busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES' } },
        { measurementDate: '2026-04-30T21:01:00Z', busbar: { id: 9490732369, busbarId: 6002, busbarName: 'AKYEL-1 RES' } }
      ],
      lastPage: null,
      totalCount: null
    };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  const rangeCall = calls.find((call) => call.endpoint === '/api/rgdh-wind-busbar-data' && call.params.page === undefined);
  assert.ok(rangeCall);
  assert.equal(rangeCall.params['measurementDate.greaterOrEqualThan'], '2026-04-30T21:00:00Z');
  assert.equal(rangeCall.params['busbarId.equals'], '9490732369');
  assert.equal(result.windRows.length, 2);
  assert.equal(result.partialErrors.length, 0);
});
```

- [x] **Step 2: Run the test and verify it fails**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "page-less range cursor"
```

Expected: FAIL because no page-less range path exists.

- [x] **Step 3: Add range boundary helpers in `background.js`**

Add:

```js
function resolveHybridWindRangeEndUtc(api, localDate, payload = {}) {
  if (payload.windRangeEndUtc) return String(payload.windRangeEndUtc);
  const range = api.buildUtcDayRangeForIstanbul(localDate);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  if (localDate !== today) return range.endUtc;
  const now = new Date();
  const end = new Date(Math.min(now.getTime(), new Date(range.endUtc).getTime()));
  return end.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function addOneMinuteUtc(isoValue) {
  const date = new Date(isoValue);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() + 60000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
```

- [x] **Step 4: Add `fetchRgdhWindBusbarByYksUiRange`**

Add near `fetchRgdhWindBusbarByDayPages`:

```js
async function fetchRgdhWindBusbarByYksUiRange({ api, source, endpoint, localDate, busbarId, payload, deadlineAt, logContext = {} }) {
  const sourceKey = String(source || 'WIND').toUpperCase();
  const logs = [];
  const rows = [];
  const dayRange = api.buildUtcDayRangeForIstanbul(localDate);
  const endUtc = resolveHybridWindRangeEndUtc(api, localDate, payload);
  const pageSize = Math.max(1, Math.min(500, Number(payload.windRangeSize || payload.windPageSize || 60)));
  const maxRequests = Math.max(1, Math.min(200, Number(payload.windRangeMaxRequests || 80)));
  const pageTimeoutMs = Number(payload.windRangeTimeoutMs || payload.windFullDayTimeoutMs || 60000);
  let cursorUtc = String(payload.windRangeStartUtc || dayRange.startUtc);

  for (let index = 0; index < maxRequests && cursorUtc && cursorUtc < endUtc; index += 1) {
    const effectiveTimeoutMs = clampRgdhRequestTimeout(pageTimeoutMs, deadlineAt);
    if (effectiveTimeoutMs <= 0) {
      return {
        rows,
        logs,
        partialErrors: [{
          source: sourceKey,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          chunkStart: cursorUtc,
          chunkEnd: endUtc,
          errorType: 'YKS_JOB_TIMEOUT',
          errorClass: 'YKS_JOB_TIMEOUT',
          fallbackPhase: 'hybrid-yks-ui-range',
          message: `YKS cekimi ${Math.round(Number(payload.jobTimeoutMs || RGDH_JOB_TIMEOUT_MS) / 1000)} sn toplam sure butcesini doldurdu.`
        }]
      };
    }

    const params = api.buildWindRangeParams(cursorUtc, endUtc, busbarId, { size: pageSize });
    const requestUrl = buildSafeRgdhRequestUrl(api, endpoint, params);
    logs.push(createRgdhLog('info', sourceKey, `${localDate}: hibrit YKS ekran araligi sorgulanacak: ${busbarId}`, {
      endpoint,
      params: sanitizeRgdhParams(params),
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      chunkStart: cursorUtc,
      chunkEnd: endUtc,
      requestUrl,
      pageTimeoutMs: effectiveTimeoutMs,
      fallbackPhase: 'hybrid-yks-ui-range',
      ...logContext
    }));

    const pageResult = await runRgdhPageFetchInYksTab({ endpoint, params, timeoutMs: effectiveTimeoutMs });
    if (!pageResult?.ok) {
      const sanitized = sanitizeRgdhBackgroundError({ ...(pageResult || {}), message: pageResult?.error || pageResult?.reason || pageResult?.message });
      logs.push(createRgdhLog('warn', sourceKey, `${localDate}: hibrit YKS ekran araligi basarisiz: ${sanitized.message}`, {
        ...sanitized,
        endpoint,
        busbarId,
        internalBusbarId: busbarId,
        localDate,
        chunkStart: cursorUtc,
        chunkEnd: endUtc,
        requestUrl,
        fallbackPhase: 'hybrid-yks-ui-range',
        ...logContext
      }));
      return {
        rows,
        logs,
        partialErrors: [{
          source: sourceKey,
          busbarId,
          internalBusbarId: busbarId,
          localDate,
          chunkStart: cursorUtc,
          chunkEnd: endUtc,
          requestUrl,
          fallbackPhase: 'hybrid-yks-ui-range',
          errorClass: sanitized.errorType,
          ...logContext,
          ...sanitized
        }]
      };
    }

    const pageRows = pageResult.rows || [];
    rows.push(...pageRows);
    logs.push(createRgdhLog('success', sourceKey, `${localDate}: hibrit YKS ekran araligi ${pageRows.length} kayit aldi.`, {
      endpoint,
      busbarId,
      internalBusbarId: busbarId,
      localDate,
      chunkStart: cursorUtc,
      chunkEnd: endUtc,
      rowCount: pageRows.length,
      apiRows: rows.length,
      fallbackPhase: 'hybrid-yks-ui-range',
      ...logContext
    }));

    if (pageRows.length < pageSize) break;
    const lastMeasurement = pageRows[pageRows.length - 1]?.measurementDate;
    const nextCursor = addOneMinuteUtc(lastMeasurement);
    if (!nextCursor || nextCursor <= cursorUtc) break;
    cursorUtc = nextCursor;
  }

  return { rows: sortRgdhRowsByMeasurementDate(rows), logs, partialErrors: [] };
}
```

- [x] **Step 5: Run verification**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "page-less range cursor"
```

Expected: PASS.

---

### Task 4: Wire Hybrid Fallback Order

**Files:**
- Modify: `background.js`
- Test: `tests/background.test.js`

- [x] **Step 1: Write failing timeout fallback test**

Add:

```js
test('handleRgdhFetch falls back to page-less range when auxiliary hourly calls all time out', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (payload.params.page === undefined) {
      return {
        ok: true,
        rows: [{ measurementDate: '2026-04-30T21:00:00Z', busbar: { id: 9490732369, busbarId: 6002 } }]
      };
    }
    return { ok: false, error: 'signal is aborted without reason', errorType: 'PAGE_FETCH_TIMEOUT' };
  };

  const result = await context.handleRgdhFetch({
    localDate: '2026-05-01',
    sourceType: 'WIND',
    busbarInternalIds: ['9490732369'],
    selectedBusbar: {
      busbarId: '6002',
      busbarName: 'AKYEL-1 RES',
      sourceType: 'WIND',
      hasAuxiliarySource: true
    }
  });

  assert.equal(result.windRows.length, 1);
  assert.equal(result.partialErrors.length, 0);
  assert.equal(calls.some((call) => call.params.page === undefined), true);
});
```

- [x] **Step 2: Run the test and verify it fails**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "falls back to page-less range"
```

Expected: FAIL until fallback is wired.

- [x] **Step 3: Update `fetchRgdhWindBusbarWithCandidateFallback`**

After `const partialErrors = annotateRgdhCandidateErrors(...)`, add a hybrid range fallback branch before deciding to return timeout failure:

```js
if (!fetched.rows.length && hybridAuxiliary && isFullDayHourlyTimeout(partialErrors)) {
  const rangeFallback = await fetchRgdhWindBusbarByYksUiRange({
    api,
    source,
    endpoint,
    localDate,
    busbarId: candidateBusbarId,
    payload: candidatePayload,
    deadlineAt,
    logContext
  });
  logs.push(...rangeFallback.logs);
  if (rangeFallback.rows.length) {
    return {
      rows: rangeFallback.rows,
      logs,
      partialErrors: failedCandidateErrors,
      usedBusbarId: candidateBusbarId
    };
  }
  failedCandidateErrors.push(...annotateRgdhCandidateErrors(rangeFallback.partialErrors, logContext));
}
```

Add helper:

```js
function isFullDayHourlyTimeout(partialErrors) {
  return (partialErrors || []).some((error) => {
    const type = String(error?.errorType || error?.errorClass || '');
    return type === 'YKS_HOURLY_TIMEOUT' && Number(error?.failedHours || 0) >= 24;
  });
}
```

Then update `shouldTryNextRgdhWindCandidate` to use the helper:

```js
function shouldTryNextRgdhWindCandidate({ hybridAuxiliary, candidateIds, index, partialErrors }) {
  if (!hybridAuxiliary || index >= candidateIds.length - 1) return false;
  return isFullDayHourlyTimeout(partialErrors);
}
```

- [x] **Step 4: Run verification**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "falls back to page-less range|page-less range cursor"
```

Expected: PASS.

---

### Task 5: Add Cursor Continuation Coverage

**Files:**
- Modify: `tests/background.test.js`
- Modify: `background.js` if needed

- [x] **Step 1: Write cursor continuation test**

Add:

```js
test('hybrid page-less range cursor advances from last measurement when page is full', async () => {
  const context = loadBackground({ fetch: async () => ({ ok: true, json: async () => [] }) });
  const calls = [];
  context.runRgdhPageFetchInYksTab = async (payload) => {
    calls.push(payload);
    if (calls.filter((call) => call.params.page === undefined).length === 1) {
      return {
        ok: true,
        rows: Array.from({ length: 60 }, (_value, index) => ({
          measurementDate: `2026-04-30T21:${String(index).padStart(2, '0')}:00Z`
        }))
      };
    }
    return {
      ok: true,
      rows: [{ measurementDate: '2026-04-30T22:00:00Z' }]
    };
  };

  const result = await context.fetchRgdhWindBusbarByYksUiRange({
    api: context.getRgdhApiClient(),
    source: 'WIND',
    endpoint: '/api/rgdh-wind-busbar-data',
    localDate: '2026-05-01',
    busbarId: '9490732369',
    payload: { windRangeEndUtc: '2026-04-30T23:00:00Z', windRangeSize: 60, jobTimeoutMs: 180000 },
    deadlineAt: Date.now() + 180000
  });

  const rangeCalls = calls.filter((call) => call.params.page === undefined);
  assert.equal(rangeCalls.length, 2);
  assert.equal(rangeCalls[1].params['measurementDate.greaterOrEqualThan'], '2026-04-30T22:00:00Z');
  assert.equal(result.rows.length, 61);
});
```

- [x] **Step 2: Export helper for tests**

If `fetchRgdhWindBusbarByYksUiRange` is not available in the VM test context, add it to the background test export list near other helper exports.

- [x] **Step 3: Run verification**

Run:

```powershell
node --test tests/background.test.js --test-name-pattern "cursor advances"
```

Expected: PASS.

---

### Task 6: Improve Diagnostics For Future Log Analysis

**Files:**
- Modify: `background.js`
- Modify: `rgdh-diagnostics.js` if column allow-list needs updates
- Test: `tests/rgdh-diagnostics.test.js` or `tests/background.test.js`

- [x] **Step 1: Add diagnostic assertions to an existing background test**

In the page-less range fallback test, assert these log details:

```js
assert.equal(result.logs.some((log) => log.detail?.fallbackPhase === 'hybrid-yks-ui-range'), true);
assert.equal(result.logs.some((log) => log.detail?.requestUrl && !String(log.detail.requestUrl).includes('&page=')), true);
```

- [x] **Step 2: Ensure log detail includes request mode**

In range fetch logs, keep:

```js
fallbackPhase: 'hybrid-yks-ui-range',
pageTimeoutMs: effectiveTimeoutMs,
chunkStart: cursorUtc,
chunkEnd: endUtc,
requestUrl
```

- [x] **Step 3: Run diagnostics tests**

Run:

```powershell
node --test tests/rgdh-diagnostics.test.js tests/background.test.js --test-name-pattern "diagnostic|page-less range|falls back"
```

Expected: PASS.

---

### Task 7: Final Verification And Build

**Files:**
- No code changes unless tests reveal a defect.

- [x] **Step 1: Run the RGDH focused tests**

Run:

```powershell
node --test tests/background.test.js tests/rgdh-api-client.test.js tests/rgdh-normalizer.test.js tests/rgdh-charts.test.js tests/rgdh-ui-smoke.test.js
```

Expected: all tests pass.

- [x] **Step 2: Run full test suite**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [x] **Step 3: Build extension**

Run:

```powershell
npm run build:extension
```

Expected:

```text
[OK] Unpacked: ...\dist\chrome-extension
[OK] Zip: ...\dist\SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_YYYYMMDD.zip
```

- [x] **Step 4: Smoke extension**

Run:

```powershell
npm run smoke:extension
```

Expected: JSON output contains `"ok": true`.

- [ ] **Step 5: Manual YKS verification**

In the built extension, run AKYEL-1 RES (`busbarId=6002`, internal `9490732369`) for `2026-05-01`.

Expected diagnostic signs:
- A log with `fallbackPhase=hybrid-yks-ui-range`.
- Request URL does not contain `page=0`.
- Request range begins at `2026-04-30T21:00:00Z`.
- `apiRows > 0`.
- Final job is not `YKS_HOURLY_TIMEOUT`.
