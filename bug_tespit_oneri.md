# Bug Tespiti ve Geliştirme Önerileri

## 1. Tespit Edilen Hatalar (Bugs)

### BUG-01 · `scada-flow.js` — `updateScadaCardUI` Çift Tanımlanmış (Critical)

**Dosya:** `scada-flow.js` — Satır 281 ve 873  
**Sorun:** `updateScadaCardUI` fonksiyonu dosyada **iki kez** tanımlanmıştır. İlk tanım (satır 281) `state.scada.totalRows` ve `state.scada.matchedLines` gibi ham sayaçları kullanırken, ikinci tanım (satır 873+) `refreshScadaVisibleSummary()` çıktısını ve `fetchMeta` yapısını kullanmaktadır. JavaScript'te ikinci tanım birincinin üzerine yazar; bu nedenle `scadaClient.js`'deki `updateScadaCardUI` çağrıları ikinci implementasyonu çalıştırır. Ancak `scada-client.js` içinde (satır 247, 309, 488) `updateScadaCardUI` referans edilmekte olup bunların hangi versiyona bağlandığı yükleme sırasına göre değişmektedir — bu belirsizlik davranış tutarsızlığına yol açar.  
**Etki:** UI'daki Toplam/Eşleşen/Eşleşmeyen sayaçları her Refresh sonrası farklı veri kaynaklarından beslenebilir.

```javascript
// YANLIŞ: İki ayrı updateScadaCardUI tanımı var
// scada-flow.js:281 — eski versiyon (ham state'i okur)
function updateScadaCardUI() { /* ham state.scada.totalRows kullanır */ }

// scada-flow.js:873 — yeni versiyon (visibleSummary + fetchMeta kullanır)
function updateScadaCardUI() { /* refreshScadaVisibleSummary() kullanır */ }

// ÇÖZÜM: İlk tanımı (satır 281-336) silin, tek kaynak bırakın.
```

---

### BUG-02 · `scada-flow.js` — `renderFlowLayer()` Her Render'da Tüm DOM'u Yeniden İnşa Ediyor (Performance)

**Dosya:** `scada-flow.js` — Satır 23-142  
**Sorun:** `renderFlowLayer()` her çağrıldığında `flowLayer.innerHTML = ''` ile katmanı sıfırlayıp tüm `<path>` ve `<animateMotion>` elementlerini yeniden oluşturur. Pan/zoom sırasında her frame'de bu işlem tetiklenirse (örn. `requestRender` sık çağrıldığında) binlerce DOM node oluşturulup yok edilir.  
**Etki:** Uzun hatlı şebekelerde (2000+ hat) düşük FPS, görünür animasyon takılmaları.

```javascript
// ÖNERİ: İki aşamalı diff yaklaşımı
// 1. Render sırasında mevcut path ID'leri bir Set'te tut
// 2. Sadece değişen/eklenen/silinen flow'ları DOM'da güncelle

const activePathIds = new Set();

function patchFlowLayer(visibleHats) {
  const flowLayer = document.getElementById('flowLayer');
  const currentPathIds = new Set(
    [...flowLayer.querySelectorAll('[data-flow-id]')].map(el => el.dataset.flowId)
  );
  // Artık görünmeyenleri kaldır
  currentPathIds.forEach(id => {
    if (!activePathIds.has(id)) flowLayer.querySelector(`[data-flow-id="${id}"]`)?.remove();
  });
  // Yenileri veya değişenleri ekle
  // ...
}
```

---

### BUG-03 · `background.js` — `waitForTabComplete` Listener Memory Leak (Memory Leak)

**Dosya:** `background.js` — Satır 396-426  
**Sorun:** `waitForTabComplete` fonksiyonu `chrome.tabs.onUpdated.addListener(onUpdated)` ekler. `settled` flag kullanılarak listener kaldırılmaya çalışılsa da `setTimeout` callback'i içinde `finish(reject, ...)` çağrıldığında `clearTimeout` çalışmaz (timer zaten bitmiştir) ve listener kaldırma, `reject` yolu üzerinden geçmez.  
**Etki:** Hidden-tab login akışı her başarısız olduğunda `onUpdated` listener Service Worker heap'inde birikir. Chrome MV3 Service Worker'ın ömrü kısa olduğundan gerçek bir sızıntı olmasa da beklenmedik çoklu listener çalışması yanlış sekme güncellemelerini yakalayabilir.

```javascript
// YANLIŞ: timeout path'inde listener her zaman kaldırılmıyor
const timer = setTimeout(async () => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === 'complete') finish(resolve, true);
    else finish(reject, new Error('Login sekmesi zaman asimina ugradi.'));
  } catch (error) {
    finish(reject, error); // settled=true yapılmaz eğer finish daha önce çağrıldıysa
  }
}, ...);

// DÜZELTME: finish() içinde her iki dalda da clearTimeout + removeListener garantisi
const finish = (callback, value) => {
  if (settled) return;
  settled = true;
  clearTimeout(timer);                                    // <-- her zaman
  chrome.tabs.onUpdated.removeListener(onUpdated);        // <-- her zaman
  callback(value);
};
```

---

### BUG-04 · `scada-client.js` — `scadaLog` Çağrısı `state.scada` Null Kontrol Eksikliği (Runtime Error)

**Dosya:** `scada-client.js` — Satır 72-86  
**Sorun:** `scadaLog` fonksiyonu başında `if (!state.scada) return;` kontrolü yapıyor; ancak `state.scada.logs` dizisine erişmeden önce `state.scada` objesinin `logs` özelliğinin var olup olmadığı doğrulanmıyor. `scadaBoot()` çağrılmadan önce erken log çağrıları (örn. `scadaBuildIndex` içinde) yapılırsa `state.scada.logs.push(entry)` `TypeError: Cannot read properties of undefined` hatasına yol açar.

```javascript
// YANLIŞ
function scadaLog(level, message, detail) {
  if (!state.scada) return;
  state.scada.logs.push(entry); // logs undefined olabilir!
}

// DÜZELTME
function scadaLog(level, message, detail) {
  if (!state?.scada) return;
  if (!Array.isArray(state.scada.logs)) state.scada.logs = [];
  state.scada.logs.push(entry);
  // ...
}
```

---

### BUG-05 · `scada-client.js` — `applyScadaSnapshot` İçinde Kapasite Hesabı "Divide-by-Zero" Durumu (Logic Bug)

**Dosya:** `scada-client.js` — Satır 543-548  
**Sorun:** Kapasite hesabında `capacityMva = season === 'summer' ? (summerCapacity || winterCapacity || 1) : (winterCapacity || summerCapacity || 1)` yazılmış. Ardından `loadingPct = capacityMva > 0 ? (absMw / capacityMva) * 100 : 0` hesaplanıyor. `capacityMva` 1'e fallback edildiğinde (her iki kapasite de 0/null olduğunda) yükleme %'si anlamsız büyük değer alır (örn. 450 MW / 1 MVA = 45000%). Bu değer `getFlowColor` eşik karşılaştırmalarından geçerek hatta `#7c3aed` (mor/aşırı yüklenme) rengi verilir.

```javascript
// DÜZELTME: Kapasite 0 ise loadingPct = 0 ve özel bir durum bayrağı ekle
const capacityMva = season === 'summer'
  ? (summerCapacity > 0 ? summerCapacity : winterCapacity > 0 ? winterCapacity : 0)
  : (winterCapacity > 0 ? winterCapacity : summerCapacity > 0 ? summerCapacity : 0);

const loadingPct = capacityMva > 0 ? (absMw / capacityMva) * 100 : null;
// null = bilinmiyor; renklendirmeyi atla
const color = loadingPct !== null
  ? (staleState === 'live' ? getFlowColor(loadingPct) : SCADA_CONFIG.STALE_COLOR)
  : SCADA_CONFIG.NO_MATCH_COLOR;
```

---

### BUG-06 · `build_kml_layers_v2.py` — `load_excel_rows` BOM/Encoding Hatası (Data Corruption)

**Dosya:** `build_kml_layers_v2.py` — Satır 128-129  
**Sorun:** `if "AdÄ±" in row and "Adı" not in row:` koşulu Excel dosyasının `cp1252` ile yanlış okunduğunda oluşan bozuk kodlamayı telafi etmeye çalışıyor. Ancak `openpyxl` zaten UTF-8 okuduğundan bu check asla `True` olmaz; gerçek sorun `read_only=True` modunda bazı `.xlsx` dosyalarının stil bilgilerini hatalı yüklemesidir (`UserWarning: stylesheet`). Filtreleme eksik/yanlış sütun adıyla TM eşleşmesi başarısız olabilir.

```python
# DÜZELTME: Robust sütun normalizasyonu
def normalize_header(value: Any) -> str:
    raw = str(value or "").strip()
    # BOM temizle
    raw = raw.lstrip("\ufeff")
    # Encoding hatasını düzelt
    try:
        raw = raw.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return raw

def load_excel_rows(path: Path) -> list[dict[str, Any]]:
    # ...
    headers = [normalize_header(cell) for cell in next(iterator)]
    # ...
```

---

### BUG-07 · `background.js` — `fetchChartData` Timeout Yönetimi Eksik (Network Reliability)

**Dosya:** `background.js` — Satır 112-174  
**Sorun:** `fetchChartData` içindeki `fetch()` çağrısında `signal` (AbortController) veya timeout parametresi kullanılmamaktadır. Superset sunucusu yanıt vermezse veya yavaş yanıt verirse, Service Worker sonsuza kadar bekleyebilir (Chrome MV3'te SW 30 sn idle sonrası kill edilebilir).  
**Etki:** Kullanıcı arayüzü "SCADA sorgusu sürüyor" durumunda takılı kalır; `fetchInProgress = true` bayrağı asla `false` olmaz → UI bloke.

```javascript
// DÜZELTME
async function fetchChartData(config, authMode, usedFallback) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 sn
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(config.chartPayload),
      signal: controller.signal,  // <-- EKLENDİ
      redirect: 'follow'
    });
    // ...
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout ? 'Superset istek zaman aşımı (25 sn).' : error.message,
      errorType: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      // ...
    };
  } finally {
    clearTimeout(timeoutId); // <-- Her durumda temizle
  }
}
```

---

### BUG-08 · `scada-flow.js` — `exportRankingCsv` Çift Tanımlanmış (Logic Bug)

**Dosya:** `scada-flow.js` — Satır 604 ve 1162  
**Sorun:** `exportRankingCsv` fonksiyonu da tıpkı `updateScadaCardUI` gibi iki kez tanımlanmıştır. Birinci versiyon `getFilteredFlows()` kullanarak tüm akışları CSV'e döker; ikinci versiyon `getVisibleFlowEntries({applySearch:true})` üzerinden çalışarak farklı bir filtre uygular. İkinci tanım birincinin üzerine yazar.

---

### BUG-09 · `scada-client.js` — `scadaStartPolling` Visibility Check Yetersiz (Background Tab Bug)

**Dosya:** `scada-client.js` — Satır 622-630  
**Sorun:** `document.visibilityState === 'hidden'` kontrolü yalnızca auto-poll sırasında yapılmaktadır. Ancak manuel "Yenile" tetiklendiğinde bu kontrol atlanmaktadır. Harita sekmesi gizliyken kullanıcı başka bir yerden mesaj göndererek `scadaDoFetch({trigger:'manual'})` tetiklerse, arka plan Superset çağrısı yapılır ama UI güncellemesi kör olur.

---

### BUG-10 · `build_kml_layers_v2.py` — Hat Koordinat Birleştirme Hatası (Data Integrity)

**Dosya:** `build_kml_layers_v2.py` — Satır 251-273  
**Sorun:** Çoklu `LineString` parçaları birleştirilirken `if coords and coords[-1] == seq[0]: coords.extend(seq[1:])` kontrolü yapılıyor. Koordinatlar float olduğundan `==` karşılaştırması doğrudan uygulanamaz (floating point hassasiyeti). `round(lon, 6)` sonrası eşleşme genellikle çalışsa da kenar durumlarda parça kopukluğu oluşabilir.

```python
# DÜZELTME: Epsilon toleranslı karşılaştırma
def coords_close(a: list[float], b: list[float], eps: float = 1e-6) -> bool:
    return abs(a[0] - b[0]) < eps and abs(a[1] - b[1]) < eps

# Kullanım
if coords and coords_close(coords[-1], seq[0]):
    coords.extend(seq[1:])
```

---

## 2. Optimizasyon ve Geliştirme Önerileri

### OPT-01 · SVG Render: `requestRender` Debounce / RAF Throttling

**Dosya:** `scada-flow.js` — `updateScadaCardUI()` sonu, `renderFlowLayer()` etrafı  
**Sorun:** `updateScadaCardUI` her bitişinde `requestRender()` çağırmaktadır. Bu fonksiyonun ne sıklıkta çağrıldığına göre aynı frame'de çok sayıda render isteği birikebilir.

```javascript
// ÖNERİ: requestRender'ı RAF ile zaten throttle ediyorsanız
// iç içe çağrıları idempotent yapın
let _renderScheduled = false;
function requestRender(opts) {
  if (_renderScheduled) return;
  _renderScheduled = true;
  requestAnimationFrame(() => {
    _renderScheduled = false;
    doActualRender(opts);
  });
}
```

---

### OPT-02 · `scada-client.js` — `pushFlowHistory` Map Sınırsız Büyüme Riski

**Dosya:** `scada-client.js` — Satır 602-608  
**Sorun:** `state.scada.history` Map'i her hat için `HISTORY_MAX` (20) girdi tutuyor. 2341 hat için bu 2341×20 = ~46.820 Date objesi anlamına gelir. `while (history.length > HISTORY_MAX) history.shift()` kullanımı doğru ama `shift()` O(n) işlemdir; `HISTORY_MAX` değeri büyük tutulursa performans düşer.

```javascript
// ÖNERİ: Circular buffer implementasyonu
function pushFlowHistory(hatId, mw, pct, timestamp) {
  if (!state.scada.history) state.scada.history = new Map();
  let buf = state.scada.history.get(hatId);
  if (!buf) { buf = { data: new Array(SCADA_CONFIG.HISTORY_MAX), head: 0, size: 0 }; }
  buf.data[buf.head % SCADA_CONFIG.HISTORY_MAX] = { mw, pct, ts: timestamp };
  buf.head++;
  buf.size = Math.min(buf.size + 1, SCADA_CONFIG.HISTORY_MAX);
  state.scada.history.set(hatId, buf);
}
```

---

### OPT-03 · `background.js` — CSRF Token Her Fetch'te Yeniden Alınıyor

**Dosya:** `background.js` — Satır 114, `getSupersetCsrfToken`  
**Sorun:** Her `fetchChartData` çağrısında `getSupersetCsrfToken` yapılmaktadır. Bu ek bir `GET /api/v1/security/csrf_token/` isteği demektir. CSRF token'ı oturum boyunca geçerliyse gereksiz ağ trafiği oluşturur.

```javascript
// ÖNERİ: Token'ı session'da cache'le
let _cachedCsrfToken = null;
let _csrfTokenFetchedAt = 0;
const CSRF_TTL_MS = 5 * 60 * 1000; // 5 dakika

async function getSupersetCsrfToken(baseUrl) {
  const now = Date.now();
  if (_cachedCsrfToken && (now - _csrfTokenFetchedAt) < CSRF_TTL_MS) {
    return _cachedCsrfToken;
  }
  // ... mevcut fetch mantığı ...
  _cachedCsrfToken = token;
  _csrfTokenFetchedAt = now;
  return token;
}
```

---

### OPT-04 · `scada-common.js` — `findDataArray` Sonsuz Özyineleme Potansiyeli

**Dosya:** `scada-common.js` — Satır 114-135  
**Sorun:** `findDataArray` WeakSet ile döngüsel referans koruması yapıyor, bu doğru. Ancak fonksiyon `seen` parametresini isteğe bağlı kabul edip `seen = seen || new WeakSet()` ile ilklendiriyor. İlk çağrı `seen=undefined` ile yapılırsa her özyinelemeli çağrı yeni bir WeakSet oluşturabileceği tehlikesi var — ama aslında `seen` değişkeni closure üzerinden doğru iletilmekte. Yine de daha temiz kod için:

```javascript
// ÖNERİ: seen'i her zaman dışarıdan zorla
function findDataArray(obj) {
  return _findDataArrayInternal(obj, new WeakSet());
}
function _findDataArrayInternal(obj, seen) {
  if (!obj || typeof obj !== 'object') return null;
  if (seen.has(obj)) return null;
  seen.add(obj);
  // ... mevcut mantık ...
}
```

---

### OPT-05 · `popup.js` — `normalizeText` Fonksiyonu İki Kez Tanımlanmış

**Dosya:** `popup.js` — Satır 593-603  
**Durum:** `map-common.js`'de de aynı mantık `MAP_COMMON.normalizeText` olarak export edilmiştir. `popup.js` bundle içinde bağımsız bir kopyasını kullanmakta; bu kod tekrarı bakımı zorlaştırır.

---

### OPT-06 · `scada-flow.js` — Ranking Panel Çift `toggleRankingPanel` Tanımı

**Dosya:** `scada-flow.js` — Satır 388 ve 1191  
**Sorun:** `toggleRankingPanel` fonksiyonu da iki kez tanımlanmıştır. İkinci versiyon `syncRankingKvFilterControl()` çağrısını içerirken birincisi içermemektedir.

---

### OPT-07 · `build_kml_layers_v2.py` — `tm_by_id` Değişkeninin Loop İçinde Yeniden Atanması

**Dosya:** `build_kml_layers_v2.py` — Satır 901-907  
**Sorun:** Hat-TM bağlantısı döngüsünde `tm_by_id = next(tm for tm in tm_points if tm["id"] == tm_id)` ifadesiyle her iterasyonda tüm `tm_points` listesi taranmaktadır. 1583 TM × 2341 Hat için bu O(n²) karmaşıklığı anlamına gelir. Ardından satır 907'de `tm_by_id = {tm["id"]: tm for tm in tm_points}` ile dict olarak yeniden tanımlanmaktadır — bu da değişken adı çakışması yaratmaktadır.

```python
# DÜZELTME: Loop'tan önce dict index oluştur
tm_by_id_dict = {tm["id"]: tm for tm in tm_points}
for hat in hat_lines:
    for tm_id in (hat.get("startTmId"), hat.get("endTmId")):
        if tm_id and tm_id in tm_by_id_dict:
            tm_by_id_dict[tm_id]["childHatIds"].append(hat["id"])
```

---

## 3. Çözüm Planı — Adım Adım Uygulama Yol Haritası

### Faz 1: Kritik Bug Düzeltmeleri (1-2 gün)

**Adım 1.1 — `scada-flow.js` duplikasyon temizliği**

```bash
# Hedef: updateScadaCardUI, exportRankingCsv, toggleRankingPanel fonksiyonlarının
# ilk (eski/basit) tanımlarını dosyadan kaldır; sadece kapsamlı son versiyonları bırak.
# Satır 281-336 (updateScadaCardUI v1) -> SİL
# Satır 604-640 (exportRankingCsv v1) -> SİL  
# Satır 388-476 (toggleRankingPanel v1) -> SİL
```

**Adım 1.2 — `background.js` timeout ekleme**

`fetchChartData` fonksiyonuna AbortController ekle (bkz. BUG-07 çözüm bloğu).

**Adım 1.3 — `build_kml_layers_v2.py` O(n²) düzeltmesi**

`main()` içindeki hat-TM bağlantı döngüsünü dict tabanlı O(n) yapıya geçir (bkz. OPT-07).

---

### Faz 2: Güvenilirlik İyileştirmeleri (2-3 gün)

**Adım 2.1 — Kapasite fallback mantığı**

`applyScadaSnapshot` içindeki `capacityMva` hesabını `null`-safe yaparak 1 MVA fallback'ini kaldır; bunun yerine `loadingPct = null` döndür ve flow renklendirmesinde `null` durumunu `NO_MATCH_COLOR` ile işle.

**Adım 2.2 — CSRF token caching**

`getSupersetCsrfToken` fonksiyonuna 5 dakikalık in-memory cache ekle.

**Adım 2.3 — `scadaLog` guard**

`state.scada.logs` erişiminden önce dizi kontrolü ekle.

---

### Faz 3: Performans Optimizasyonu (3-5 gün)

**Adım 3.1 — `renderFlowLayer` incremental diff**

Flow layer'ı her render'da tamamen silip yeniden oluşturmak yerine `data-flow-id` attribute'ü ile mevcut elementleri güncelle:

```javascript
function renderFlowLayer() {
  const flowLayer = document.getElementById('flowLayer');
  if (!flowLayer) return;
  
  const bounds = currentGeoBounds();
  const visibleHats = getVisibleHats().filter(row => intersects(row.bbox, bounds));
  const newFlowIds = new Set();

  visibleHats.forEach(row => {
    const flow = state.scada.lineFlowByLineId.get(row.id);
    if (!flow) return;
    newFlowIds.add(row.id);
    
    const existingGroup = flowLayer.querySelector(`[data-flow-id="${row.id}"]`);
    if (existingGroup && !flowChanged(existingGroup, flow)) return; // Değişmediyse atla
    
    if (existingGroup) existingGroup.remove();
    flowLayer.appendChild(buildFlowGroup(row, flow));
  });

  // Artık görünmeyen flow'ları temizle
  [...flowLayer.querySelectorAll('[data-flow-id]')].forEach(el => {
    if (!newFlowIds.has(el.dataset.flowId)) el.remove();
  });
}

function flowChanged(groupEl, flow) {
  return groupEl.dataset.flowColor !== flow.color ||
         groupEl.dataset.flowDir !== flow.direction;
}
```

**Adım 3.2 — History circular buffer**

`pushFlowHistory` fonksiyonunu `Array.shift()` yerine ring buffer ile değiştir (bkz. OPT-02).

---

### Faz 4: Kod Kalitesi ve Bakım (süregelen)

- `popup.js` içindeki `normalizeText` yerel kopyasını kaldırıp `MAP_COMMON.normalizeText` kullan  
- `build_kml_layers_v2.py` içine `coords_close()` epsilon karşılaştırması ekle  
- `background.js` `waitForTabComplete` listener cleanup'ını `finally` bloğuna taşı  
- `scada-client.js` polling görünürlük kontrolünü manuel trigger için de uygula  
- Tüm async fetch çağrılarına birim test kapsaması genişlet (`tests/scada-common.test.js` modeli)

---

*Rapor tarihi: 2026-04-23 · Antigravity AI tarafından kaynak kod statik analizi ile üretilmiştir.*
