# SCADA / YTBS / TPYS — Haritalar ve Otomasyon v1

> **Chrome Extension Manifest V3** · Vanilla JS · Native SVG · Python 3 (openpyxl)  
> Superset üzerinden SCADA verilerini çekip KML/Excel tabanlı topolojik harita üzerinde  
> canlı yük akışı, ısı haritası ve TPYS reaktif eşleştirme otomasyonu sağlayan yüksek ölçekli sistem.

---

## İçindekiler

1. [Proje Yapısı](#1-proje-yapısı)
2. [Sistem Mimarisi](#2-sistem-mimarisi)
3. [Veri Derleme Pipeline (build_kml_layers_v2.py)](#3-veri-derleme-pipeline)
4. [SCADA Entegrasyon Mimarisi](#4-scada-entegrasyon-mimarisi)
5. [Harita Motoru](#5-harita-motoru)
6. [Chrome Extension Bileşenleri](#6-chrome-extension-bileşenleri)
7. [Kurulum ve Geliştirme](#7-kurulum-ve-geliştirme)
8. [NPM Betikleri](#8-npm-betikleri)
9. [Test Altyapısı](#9-test-altyapısı)
10. [Güvenlik Notları](#10-güvenlik-notları)
11. [RGDH İzleme Modülü](#rgdh-izleme-modülü)

---

## 1. Proje Yapısı

```
SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/
│
├── manifest.json                  # Chrome Extension MV3 manifest
├── background.js                  # Service Worker: Superset auth + fetch
├── content-script.js              # TPYS ERP sayfa etkileşimi
├── popup.html / popup.js          # Extension popup UI + CSV eşleştirme
│
├── map-modern.html                # Ana harita sayfası
├── map-modern.css                 # Harita stilleri (dark/light tema)
├── map-modern.js                  # Harita motoru: pan/zoom/tile/SVG
├── map-common.js                  # UMD: normalizeText, splitZoom, resolveBaraSetMatch
├── map-v2-runtime.js              # KML v2 modeli yükleme ve render bootstrap
│
├── scada-common.js                # UMD: SCADA_CONFIG, eşleştirme algoritmaları, audit
├── scada-client.js                # SCADA state yönetimi, polling, snapshot uygulaması
├── scada-flow.js                  # SVG flow/heatmap render, ranking paneli, grafik modal
├── scada-v2-runtime.js            # scada-client + scada-flow'u map-v2 ile bağlayan runtime
│
├── build_kml_layers_v2.py         # Python: KML+Excel → kml_layers_v2.json (34 MB)
│
├── data/
│   ├── kml_layers_v2.json         # Derlenen topoloji modeli (üretim çıktısı)
│   ├── mapping.json               # TPYS←→YKS bara eşleştirme tablosu
│   └── scada_auth.json            # Superset kimlik bilgileri (GİTİGNORE'da olmalı!)
│
├── docs/yeni_harita_modeli/       # Kaynak Excel ve KML dosyaları
│   ├── 01-TRAFO_MERKEZI_LISTESI.xlsx
│   ├── 02-BARA_LISTESI.xlsx
│   ├── 09-HAT_LISTESI.xlsx
│   ├── 11-TRAFO_LISTESI.xlsx
│   ├── 20-YTBS_Detayli_Harita.kml
│   ├── SISTEM_ESLEME_LISTESI.xlsx
│   └── eslesme_tablolari.xlsx     # Gerilim overlay yardımcı tablosu
│
├── lib/
│   └── xlsx.full.min.js           # SheetJS (Bara Set XLS okuma)
│
├── tests/
│   ├── scada-common.test.js
│   ├── scada-v2-runtime.test.js
│   ├── kml-layers-v2.test.js
│   ├── map-common.test.js
│   ├── map-modern-ui.test.js
│   ├── scada-audit-fixtures.test.js
│   ├── smoke-extension.cjs        # Puppeteer ile e2e smoke testi
│   └── smoke-mcp.cjs              # MCP Chrome DevTools smoke testi
│
├── scripts/
│   └── start-chrome-debug.ps1     # CDP debug modunda Chrome başlatma
├── build-extension.ps1            # Extension ZIP paketleme
└── package.json
```

---

## 2. Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Extension MV3                         │
│                                                                 │
│  ┌──────────────┐   chrome.runtime   ┌──────────────────────┐  │
│  │  popup.js    │ ◄────────────────► │   background.js      │  │
│  │  (UI + CSV)  │                    │  (Service Worker)    │  │
│  └──────────────┘                    │  Superset Auth+Fetch │  │
│                                      └──────────┬───────────┘  │
│  ┌──────────────┐   chrome.tabs      │           │              │
│  │content-script│ ◄──────────────── │    chrome.tabs.create   │
│  │(TPYS ERP DOM)│                    └───────────┼─────────────┘
│  └──────────────┘                               │
│                                                  │ chrome.runtime.sendMessage
│  ┌───────────────────────────────────────────────▼─────────────┐
│  │              map-modern.html (Extension Tab)                 │
│  │                                                              │
│  │  map-modern.js     → Pan/Zoom/Tile motor, SVG overlay       │
│  │  map-v2-runtime.js → kml_layers_v2.json yükleme            │
│  │  scada-client.js   → SCADA state + polling                  │
│  │  scada-flow.js     → SVG render (flow/heatmap/ranking)      │
│  │  scada-v2-runtime.js→ Bağlantı katmanı                     │
│  └──────────────────────────────────────────────────────────────┘
```

### Veri Akışı (Canlı mod)

```
Superset Dashboard
      │  POST /api/v1/chart/data
      ▼
background.js (Service Worker)
  ├─ scada_auth.json → oturum yönetimi
  ├─ CSRF token alma → /api/v1/security/csrf_token/
  ├─ Fallback: SessionReuse → DirectLogin → HiddenTabLogin
  └─ Ham JSON satırları → chrome.runtime.sendMessage

scada-client.js (applyScadaSnapshot)
  ├─ Ham satır → rowsBySinsid Map indexleme
  ├─ Hat eşleştirme (kml_layers_v2.json hatLines ile)
  ├─ Polarizasyon hesabı (terminalSide + formulaSign)
  ├─ loadingPct = |MW| / capacityMva × 100
  ├─ staleState = 'live' | 'warn' | 'dead'
  └─ lineFlowByLineId Map güncelleme

scada-flow.js (renderFlowLayer)
  ├─ Her görünür hat için SVG <path> + <animateMotion>
  ├─ flow mod: yönlü animated akış çizgisi
  ├─ heatmap mod: kapasite yükleme rengi
  └─ current mod: mevcut renk (animasyonsuz)
```

---

## 3. Veri Derleme Pipeline

`build_kml_layers_v2.py` scripti aşağıdaki girdi dosyalarını okuyarak `data/kml_layers_v2.json` üretir:

### Girdiler

| Dosya | İçerik |
|-------|--------|
| `20-YTBS_Detayli_Harita.kml` | TM koordinat noktaları + Hat LineString geometrileri |
| `01-TRAFO_MERKEZI_LISTESI.xlsx` | TM meta (YTM, il, UCTE kodu, PSSE, koordinat onayı) |
| `02-BARA_LISTESI.xlsx` | Bara tanımları (gerilim kV, voltageGroup) |
| `09-HAT_LISTESI.xlsx` | Hat meta (uzunluk km, kış/yaz kapasitesi MVA, normal işletme) |
| `11-TRAFO_LISTESI.xlsx` | Trafo parametreleri (ONAN/ONAF/OFAF MVA, empedans) |
| `SISTEM_ESLEME_LISTESI.xlsx` | SCADA ölçüm noktası eşleştirme listesi |
| `eslesme_tablolari.xlsx` | Gerilim overlay yardımcı tablosu (Bara ID bazlı) |

### Derleme Adımları

1. **KML parse** — `xml.etree.ElementTree` ile `Folder/Placemark` ağacı recursive taranır. `Point` → TM, `LineString` → Hat.
2. **Excel eşleştirme** — `kmlDescriptionId` (KML Placemark description) ↔ Excel ID eşleştirmesi.
3. **Koordinat normalizasyonu** — `[lon, lat]` çiftleri 6 decimal hassasiyetle saklanır; bbox (min_lon, min_lat, max_lon, max_lat) hesaplanır.
4. **KV çıkarımı** — `infer_kv()` ile styleUrl ve isimden gerilim seviyesi çıkarılır (400/154/66 kV).
5. **SCADA eşleştirme** — Her hat için aktif/reaktif güç ölçüm noktası adayları belirlenir.
6. **Terminal polarizasyonu** — `enrich_hat_candidate()` ile formüldeki istasyon kodunun başlangıç/bitiş terminaline karşılık gelip gelmediği çözümlenir.
7. **Gerilim overlay** — Üç kademeli bara gerilim eşleştirme: exact-source → ChatGPT overlay → alias fallback.
8. **Hiyerarşi** — `build_hierarchy()` ile YTM×kV bazlı `hatIds/tmIds/trafoIds/baraIds` listeleri derlenir.
9. **Validation report** — `kml_layers_v2_validation.md` dosyası eşleşme sayıları, SCADA kapsamı ve polarizasyon uyum istatistikleriyle üretilir.

### Çıktı Şeması (kml_layers_v2.json)

```json
{
  "meta": {
    "schemaVersion": 2,
    "generatedAt": "ISO-8601",
    "validation": { ... }
  },
  "ytmNames": ["Orta Anadolu YTM", ...],
  "defaultYtm": "Orta Anadolu YTM",
  "tmPoints": [
    {
      "id": "1234", "name": "ANKARA TM", "lon": 32.85, "lat": 39.92,
      "kv": "154", "ytm": "Orta Anadolu YTM",
      "ucteKodu": "ANKR1", "psseAdi": "ANKARA",
      "childHatIds": [".."], "childTrafoIds": [".."], "childBaraIds": [".."]
    }
  ],
  "hatLines": [
    {
      "id": "5678", "name": "ANKARA-KONYA EİH",
      "coords": [[32.85,39.92], ...],
      "bbox": [32.1, 37.8, 33.5, 40.1],
      "kv": "154", "lengthKm": 245.3,
      "winterCapacityMva": 300, "summerCapacityMva": 250,
      "startTm": "ANKARA TM", "endTm": "KONYA TM",
      "scada": {
        "active": { "ids": ["SINSID_1"], "rows": [...], "ambiguous": false },
        "reactive": { "ids": [], "rows": [], "ambiguous": false }
      }
    }
  ],
  "trafos": [ { "renderMode": "details-only", "scada": { "active":..., "reactive":..., "voltage":... } } ],
  "baraNodes": [ { "voltageGroup": "bara-154-400", "scada": { "voltage": {...} } } ],
  "hierarchy": { "ytm": { "Orta Anadolu YTM": { "gerilim": { "154": { "hatIds":[..] } } } } }
}
```

---

## 4. SCADA Entegrasyon Mimarisi

### 4.1 Yapılandırma (scada-common.js — SCADA_CONFIG)

```javascript
const SCADA_CONFIG = {
  BASE_URL: 'https://superset.example.com',
  DASHBOARD_ID: 42,
  CHART_SLICE_ID: 1234,
  QUERY_TIME_RANGE: 'Last 30 minutes',
  QUERY_KV_FILTERS: ['154', '400'],
  QUERY_TEAR_FILTERS: [],
  QUERY_ELEMENT_NAME: 'EİH',
  QUERY_ROW_LIMIT: 10000,
  STALE_THRESHOLD_WARN_MS: 15 * 60 * 1000,   // 15 dk
  STALE_THRESHOLD_DEAD_MS: 60 * 60 * 1000,   // 60 dk
  HISTORY_MAX: 20,
  POLL_INTERVAL_MS: 5 * 60 * 1000,            // 5 dk
  // Renk eşikleri (loadingPct)
  COLOR_THRESHOLDS: [
    { pct: 50, color: '#22c55e' },   // yeşil
    { pct: 75, color: '#eab308' },   // sarı
    { pct: 90, color: '#f97316' },   // turuncu
    { pct: 100, color: '#ef4444' },  // kırmızı
    { pct: Infinity, color: '#7c3aed' } // mor (aşırı)
  ]
};
```

### 4.2 Oturum Yönetimi (background.js — Üç Kademeli Fallback)

```
1. Session Reuse (Cookie-based)
   └─ /api/v1/me → HTTP 200 → Mevcut oturum geçerli → Direkt fetch

2. Direct Login
   └─ POST /api/v1/security/login (username/password from scada_auth.json)
   └─ 200 → access_token alındı → Bearer auth ile fetch

3. Hidden Tab Login (Sıfır Hata Yöntemi)
   └─ chrome.tabs.create({ url: loginUrl, active: false })
   └─ Sekme yüklendi → chrome.cookies.getAll → oturum çerezleri alındı
   └─ Tab kapatıldı → fetch
```

### 4.3 Veri İşleme (scada-client.js — applyScadaSnapshot)

**Adım 1: Ham satır indexleme**
```javascript
// rawRows (Superset JSON satırları) → rowsBySinsid Map
// Key: normalize(ölçüm_noktası_id)
// Value: { mw, mvar, timestamp }
```

**Adım 2: Hat eşleştirme**
```javascript
// Her hat için hat.scada.active.ids → SCADA satırı lookup
// Duplicate detection: aynı ID birden fazla hatta bağlıysa → duplicateHatIds Set
```

**Adım 3: Kapasite ve yükleme hesabı**
```javascript
const season = state.scada.capacitySeason; // 'winter' | 'summer'
const capacityMva = season === 'summer'
  ? (hat.summerCapacityMva > 0 ? hat.summerCapacityMva : hat.winterCapacityMva)
  : (hat.winterCapacityMva > 0 ? hat.winterCapacityMva : hat.summerCapacityMva);
const loadingPct = capacityMva > 0 ? (Math.abs(mw) / capacityMva) * 100 : null;
```

**Adım 4: Stale state belirleme**
```javascript
const age = Date.now() - timestamp.getTime();
const staleState = age < STALE_WARN ? 'live'
                 : age < STALE_DEAD ? 'warn'
                 : 'dead';
```

**Adım 5: Flow kaydı**
```javascript
state.scada.lineFlowByLineId.set(hatId, {
  mw, loadingPct, direction, capacityMva,
  staleState, timestamp, sinsid, isMock
});
```

### 4.4 SVG Render (scada-flow.js — renderFlowLayer)

Her görünür hat için:
- **flow modu:** Renkli animasyonlu `<path>` + `<animateMotion>` ile akış yönü gösterimi
- **heatmap modu:** Sabit renk çizgi (kapasite yükleme gradyanı)
- **current modu:** Mevcut renk, animasyonsuz

Renk, `getFlowColor(loadingPct)` ile `SCADA_CONFIG.COLOR_THRESHOLDS` eşiğine göre belirlenir.

### 4.5 Audit ve Denetim

`buildScadaAuditReport()` → görünür hatların eşleşme durumunu, mismatch nedenlerini ve sorgu kontratını raporlar.  
`exportScadaAuditCsv()` → denetim verilerini UTF-8 BOM'lu `;` sınırlı CSV olarak indirir.

---

## 5. Harita Motoru

### 5.1 Projeksiyon ve Zoom

`map-modern.js` Web Mercator projeksiyonu ile çalışır.  
`MAP_COMMON.splitZoom(zoom)` — `tileZoom` (integer) + `scale` (2^frac) döndürür:
```javascript
// Örnek: zoom=12.7 → { tileZoom:12, scale:1.624 }
```

SVG overlay, `transform="scale(scale) translate(-ox, -oy)"` ile tile grid üzerine hizalanır.

### 5.2 Katman Sırası (SVG)

```
<svg id="overlaySvg">
  <g id="hatLayer">      <!-- Statik hat çizgileri (kV rengi) -->
  <g id="flowLayer">     <!-- SCADA dinamik akış katmanı -->
  <g id="measureLayer">  <!-- Ölçüm noktaları (Bara Set) -->
  <g id="tmLayer">       <!-- Trafo Merkezi ikonları -->
  <g id="trafoLayer">    <!-- Trafo detayları -->
  <g id="baraLayer">     <!-- Bara düğümleri -->
  <g id="baraSetLayer">  <!-- Bara Set yük ısı haritası -->
</svg>
```

### 5.3 Tile Sistemi

OpenStreetMap tile URL şablonu:  
`https://tile.openstreetmap.org/{z}/{x}/{y}.png`  
Tile cache: `state.map.tileCache` — Map<key, HTMLImageElement>

### 5.4 Gerilim Filtreleri

`SCADA_CONFIG.QUERY_KV_FILTERS` ile aynı filtre set haritada kV checkbox kontrolü üzerinden yönetilir. `scadaGetFilterKey()` o anki KV ve YTM filtre kombinasyonunu canonical string olarak döndürür; bu key `scadaVisibleSummary` cache'ini geçersiz kılar.

### 5.5 Bara Set (XLS İzleme)

- Kullanıcı `.xls/.xlsx` yükler → `SheetJS` parse
- 0-23 saatlik gerilim/yük verisi
- Saat slider kontrolü ile anlık ısı haritası
- `MAP_COMMON.resolveBaraSetMatch()` ile TPYS←→KML bara eşleştirmesi

---

## 6. Chrome Extension Bileşenleri

### 6.1 manifest.json

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "tabs", "scripting", "cookies"],
  "host_permissions": ["https://superset.example.com/*", "https://tpys.example.com/*"],
  "background": { "service_worker": "background.js" },
  "action": { "default_popup": "popup.html" }
}
```

### 6.2 popup.js — TPYS ERP Otomasyon Akışı

```
Kullanıcı CSV yükler (aylık özet)
    ↓
parseSemicolonCsv() → {headers, rows}
    ↓
persistLastCsvSnapshot() → chrome.storage.local
  (3 MB altı ise full cache, üstü ise metadata-only)
    ↓
analyzeCurrentTab() → content-script.js'e GET_PAGE_CONTEXT
    ↓
buildPlanForPage() → tarih eşleştirmesi + operasyon listesi
    ↓
applyToCurrentTab() → content-script.js'e APPLY_PLAN
    ↓
commitCurrentTab() → content-script.js'e CLICK_COMMIT
```

**Tarih seçim mantığı:**
1. Sayfa tarihi CSV'de varsa → direkt kullan
2. CSV'de tek tarih varsa → o tarihi kullan (uyarı ile)
3. Çoklu tarih varsa → en güncel tarihi kullan (uyarı ile)

### 6.3 content-script.js — ERP DOM Etkileşimi

- `GET_PAGE_CONTEXT` → sayfadaki tarih ve bara satırlarını scrape eder
- `APPLY_PLAN` → `fastExtMode` aktifse `input.value=` + `dispatchEvent`, değilse click simulation
- `CLICK_COMMIT` → ERP kaydet butonunu bulup tıklar
- `GET_DOWNLOAD_CONTEXT` → CSV indirme sayfası analizi
- `DOWNLOAD_ALL_CSVS` → sayfa sayfa 1800ms aralıklarla CSV indirir
- `TOGGLE_APPROVAL_SIMPLIFY` → onay sütununu gizle/göster

---

### 6.4 Dashboard Modu

Dashboard Modu, popup icindeki **Dashboard Modu** kartindan baslatilir ve durdurulur. Ayarlar ekrani `dashboard-settings.html` uzerinden acilir. Mod aktifken eklenti, `map-modern.html` harita sekmesi ve kullanicinin tanimladigi dis sekmeler arasinda `chrome.tabs.update(tabId, { active: true })` ile gecis yapar.

- Fullscreen davranisi DOM fullscreen API ile yapilmaz. Dis sitelere `requestFullscreen()` veya fullscreen injection uygulanmaz. Dashboard penceresi `chrome.windows.update(windowId, { state: "fullscreen" })` ile browser window fullscreen durumuna alinir.
- Ekrani acik tutmanin ana yontemi `chrome.power.requestKeepAwake("display")` cagrisidir. Dashboard durdugunda, recover edildiginde veya hata temizligi gerektiginde `chrome.power.releaseKeepAwake()` cagrilir.
- Fare hareketi simulasyonu yalniz best-effort fallback secenegidir. Chrome extension gercek isletim sistemi faresini veya kurumsal ekran koruyucu politikasini guvenilir bicimde kontrol edemez. Kurumsal kiosk/dashboard kullanimi icin IT tarafinda ekran koruyucu veya kiosk istisnasi onerilir.
- Runtime state `chrome.storage.local` icindeki `dashboardRuntime` anahtarinda tutulur. MV3 service worker yeniden basladiginda eski `running=true` state otomatik devam ettirilmez; guvenli cleanup yapilir.
- Slot zamanlamasi `chrome.alarms` ile yapilir. Uretim icin guvenilir aralik 30-600 saniyedir; 1-29 saniye yalniz unpacked/dev best-effort davranisi olarak gorulmelidir.
- ESC harita extension sayfasinda `DASHBOARD_STOP` mesaji gonderir. Dis sitelerde ESC yalniz dashboard slot sekmelerine eklenen gecici listener ile denenir; browser fullscreen ESC'yi tuketirse dusuk frekansli fullscreen-state kontrolu Dashboard'u durdurur.

Dashboard SCADA davranisi iki katmanlidir. Harita slotu tekrar gorunur oldugunda background, harita sekmesine `DASHBOARD_MAP_SLOT_ACTIVE` mesaji gonderir; `scada-v2-runtime.js` mevcut overdue/auto refresh mekanizmasini tetikler ve aktif sorgu varsa ikinci fetch baslatmadan pending auto refresh isaretler. Son basarili SCADA olcum snapshot'i JSON dostu bicimde `scadaDashboardSnapshot` icine yazilir; harita acilisinda bu snapshot once onbellek etiketiyle restore edilir, ardindan canli fetch denenir. Arka plan yenileme `scada.backgroundRefresh` alarmi ve `scadaBackgroundRefreshState` uzerinden raw/normalized snapshot uretir; render islemi yine acik harita sayfasinda yapilir.

---

## 7. Kurulum ve Geliştirme

### Ön Koşullar

- **Node.js** ≥ 18 (testler için)
- **Python** ≥ 3.10 + `openpyxl` (KML derleme için)
- **Google Chrome** (extension yükleme için)

### Kurulum Adımları

```bash
# 1. Bağımlılıkları yükle (sadece devDependencies)
npm install

# 2. KML+Excel modelini derle
npm run build:kml-v2
# Çıktı: data/kml_layers_v2.json (~34 MB)

# 3. Chrome Extension olarak yükle
# Chrome → chrome://extensions → "Paketlenmemiş uzantı yükle" → proje klasörü seç

# 4. (İsteğe bağlı) Extension ZIP paketi oluştur
npm run build:extension
```

### SCADA Bağlantısı Yapılandırma

```json
// data/scada_auth.json — ASLA GIT'E EKLEME
{
  "baseUrl": "https://your-superset-instance.com",
  "username": "scada_user",
  "password": "secret",
  "dashboardId": 42,
  "chartSliceId": 1234
}
```

`scada-common.js` içindeki `SCADA_CONFIG` sabitlerinin de aynı değerleri yansıttığından emin olun.

### Chrome DevTools MCP ile Debug

```bash
# 1. Chrome'u CDP debug modunda başlat
npm run chrome:debug

# 2. MCP bağlantısını başlat
npm run mcp:chrome

# 3. MCP smoke testini çalıştır
npm run smoke:mcp
```

---

## 8. NPM Betikleri

| Betik | Açıklama |
|-------|----------|
| `npm test` | Tüm `*.test.js` birim testlerini çalıştır (Node test runner) |
| `npm run build:kml-v2` | KML + Excel → `data/kml_layers_v2.json` derle |
| `npm run build:extension` | `.ps1` ile extension ZIP paketi oluştur |
| `npm run smoke:extension` | Puppeteer ile e2e smoke testi |
| `npm run chrome:debug` | Chrome'u `--remote-debugging-port=9222` ile başlat |
| `npm run mcp:chrome` | Chrome DevTools MCP sunucusunu başlat |
| `npm run smoke:mcp` | MCP bağlantı smoke testi |

---

## 9. Test Altyapısı

| Dosya | Kapsam |
|-------|--------|
| `scada-common.test.js` | SCADA eşleştirme algoritmaları, `resolveQueryContract`, audit hesapları |
| `scada-v2-runtime.test.js` | Snapshot uygulama, stale detection, polarizasyon, duplicate tespiti |
| `kml-layers-v2.test.js` | KML JSON şema doğrulama, bbox kontrolü |
| `map-common.test.js` | `normalizeText`, `splitZoom`, `resolveBaraSetMatch` |
| `map-modern-ui.test.js` | Harita UI eleman testleri |
| `scada-audit-fixtures.test.js` | Audit rapor fixture testleri |
| `smoke-extension.cjs` | Puppeteer: Extension yükleme → harita açma → temel etkileşim |
| `smoke-mcp.cjs` | CDP MCP bağlantı doğrulama |

```bash
npm test
# Expected: ✅ tüm testler geçer
```

---

## 10. Güvenlik Notları

> ⚠️ **KRİTİK:** `data/scada_auth.json` dosyası Superset şifresini açık metin içerir.  
> Bu dosya **kesinlikle** `.gitignore`'a eklenmelidir.

```gitignore
# .gitignore — bu satırın varlığını doğrulayın
data/scada_auth.json
data/kml_layers_v2.json   # 34 MB — gereksiz yere commit etmeyin
```

**Chrome Storage:** CSV verileri `chrome.storage.local`'da saklanır (3 MB sınırı üstünde metadata-only moda geçer). Şifre bilgisi storage'a yazılmaz; yalnızca `data/scada_auth.json` dosyasından okunur.

**Host Permissions:** `manifest.json` içindeki `host_permissions` yalnızca Superset ve TPYS domain'leri ile sınırlandırılmıştır.

---

## RGDH İzleme Modülü

RGDH İzleme Modülü, popup üzerindeki **RGDH İzleme** butonu ile açılan ayrı izleme ekranıdır.
Bu ekranın amacı, YKS tarafındaki RGDH API/DOM verisini ve kullanıcı tarafından yüklenen EK-C CSV verisini aynı normalize modele taşımaktır.
Modül hem Konvansiyonel Bara Data hem de RES/GES Bara Data ekranlarını destekler.
Modül tek bara odaklı YKS çekimi yapar; toplu YKS çekimi yerine seçili katalog barası üzerinden ilerler.
Modülün ana ekranı `rgdh-monitor.html`, iş mantığı `rgdh-monitor.js`, YKS transport katmanı `background.js` içindedir.
API URL ve parametre üretimi `rgdh-api-client.js` içinde tutulur.
CSV ayrıştırma `rgdh-csv.js`, normalize model `rgdh-normalizer.js`, günlük özet `rgdh-pivot.js` ile yapılır.
Grafik raporu `rgdh-charts.js`, hata ve network kayıtları `rgdh-diagnostics.js` tarafından desteklenir.
YKS sayfası ile köprü kuran kısım `rgdh-dom-bridge.js` dosyasında toplanır.
EK-C/YKS karşılaştırma ve dakika eşleştirme mantığı `rgdh-comparison.js` içinde tutulur.
Ekranın beş ana sekmesi vardır: **Ham Data**, **Günlük RGDH İzleme**, **RGDH Grafik Rapor**, **EK-C / YKS SCADA Karşılaştırma**, **RGDH Testleri**.
Bu beş sekme aynı ana veri havuzunu okur; EK-C satırları karşılaştırma için ayrı state altında tutulur.
Veri havuzunda API satırları, DOM fallback satırları, hibrit YKS CSV fallback satırları ve kullanıcı EK-C satırları ayrı tutulur.
Hibrit RES/GES baralarda YKS API'nin saatlik veya page'li isteklerde takılabildiği durumlar için özel hızlı prob, continuation job ve CSV fallback akışı bulunur.
Bu hibrit akış, AKYEL-1 RES gibi page-less API pencerelerinde satır dönmeyen ama YKS CSV endpointinden veri alınabilen santraller için tasarlanmıştır.
Sekmelerde gösterilen tablolar, üst filtrelerin sonucuna göre yeniden hesaplanır.
Üst filtreler tarih, bitiş tarihi, veri tipi ve bara seçimi alanlarından oluşur.
Veri tipi `Tümü`, `Konvansiyonel` veya `RES/GES` olabilir.
Tarih alanı İstanbul yerel günü kabul eder.
Bitiş tarihi seçilirse aralık bitiş tarihi hariç olacak şekilde okunur.
Bara seçimi katalogdan gelen tekil bara özetleri ile doldurulur.
YKS çekimi için katalogdan bara seçmek zorunludur.
`Ek-C CSV Yükle` bir veya daha fazla kullanıcı EK-C dosyasını aynı oturum karşılaştırma havuzuna ekler; ekrandaki buton etiketi `Ek-C CSV Yukle` şeklindedir.
EK-C yükleme `state.ekcRows`, `state.ekcGroups` ve `state.ekcLoaded` ayrımıyla platform/YKS verisinden ayrı izlenir.
Platform/YKS verisinin ana kaynağı API'dir; hibrit CSV fallback yalnız background job tarafından kullanılan YKS endpoint tamamlamasıdır.

### Ana Kavramlar

- `API satırı`: YKS endpointlerinden dönen ham JSON satırıdır.
- `CSV satırı`: YKS dışa aktarım veya hibrit fallback CSV içeriğinden ayrıştırılan satırdır.
- `EK-C satırı`: Kullanıcının yüklediği EK-C CSV dosyasından üretilen dakika bazlı satırdır.
- `DOM satırı`: API erişimi başarısız olduğunda YKS ekran tablosundan okunabilen sınırlı satırdır.
- `Normalize satır`: API, CSV veya DOM satırının ortak RGDH modeline dönüştürülmüş halidir.
- `Katalog satırı`: Bara/Ünite Tanımlama CSV'sinden veya gömülü katalogdan gelen tanım satırıdır.
- `Bara özeti`: Aynı bara altındaki ünitelerin gruplanmış katalog görünümüdür.
- `İç bara ID`: YKS API'nin `busbarId.equals` parametresinde beklediği ID'dir.
- `Görünen bara ID`: YKS ekranında veya katalogda kullanıcıya görünen bara numarasıdır.
- `Hibrit yardımcı kaynak`: RES/GES barasında ana kaynak yanında yardımcı GES veya yardımcı ünite bulunmasıdır.
- `Job`: Uzun YKS çekimini background service worker içinde yürüten izleme işidir.
- `Continuation job`: Parent YKS job'un hızlı veya kısmi sonuçtan sonra başlattığı, özellikle hibrit eksik pencereleri tamamlayan ikinci background işidir.
- `Row chunk`: Büyük cevaplarda satırların status yanıtı yerine parça parça taşınmasıdır.
- `Partial error`: Bazı saatler veya aday ID'ler başarısız olsa bile işin tamamen düşmemesi için saklanan uyarıdır.
- `Fast probe`: Hibrit RES/GES için tam gün taramaya başlamadan önce en fazla üç page'siz, kısa timeout'lu API penceresinin denenmesidir.
- `CSV fallback`: Hibrit continuation içinde `/api/rgdh-wind-busbar-data-csv` endpointinin önce denenmesidir.
- `preferCsvFallback`: Continuation payload'ında CSV yolunun saatlik API denemelerinden önce kullanılacağını gösteren flag'dir.
- `missingWindows`: Hibrit job'un parent aşamasında tamamlayamadığı UTC pencere listesidir.
- `Dakika sonucu`: Tek dakika için `SAĞLADI`, `SAĞLAMADI`, `DD`, `YY` veya `KY` karar kodudur.
- `Saatlik karar`: Dakika sonuçlarının `reactiveHourSummary()` ile tek saat sonucuna çevrilmiş halidir.
- `Katılım yüzdesi`: Yalnız normal değerlendirme saatlerinde gösterilen, DD/YY dakikalarını katılıma dahil eden saatlik yüzdedir.
- `Diagnostic event`: Background, content script veya YKS sayfasından toplanan debug kaydıdır.
- `Fetch log`: Kullanıcının panelde gördüğü, her aşamayı okunabilir şekilde anlatan iş günlüğüdür.

### Üst Araç Çubuğu

- `Tarih` alanı çekilecek ana İstanbul gününü belirler.
- `Bitiş Tarihi (hariç)` alanı çok günlük rapor için kullanılır.
- Boş bitiş tarihi tek gün anlamına gelir.
- Bitiş tarihi doluysa `buildLocalDateRange` ile gün listesi üretilir.
- `Veri Tipi` seçimi endpoint kararını etkiler.
- `Konvansiyonel` seçilirse yalnız `/api/rgdh-conventional-busbar-data` okunur.
- `RES/GES` seçilirse yalnız `/api/rgdh-wind-busbar-data` okunur.
- `Tümü` seçiliyse seçili baranın tipine göre etkili veri tipi yeniden çözümlenir.
- `Bara Ara` alanı katalogdaki bara özetlerini listeler.
- Hibrit baralar listede `[Yardimci kaynak]` etiketiyle ayırt edilir.
- Hibrit baralar tabloda küçük işaret ile görünür.
- `YKS'den Çek` butonu background job başlatır.
- `İptal` butonu aktif job için cancel isteği gönderir.
- `Ek-C CSV Yükle` butonu kullanıcı tarafından sağlanan EK-C CSV dosyalarını okur; ekrandaki buton etiketi `Ek-C CSV Yukle` şeklindedir.
- EK-C dosyaları platform/YKS ana veri havuzuna karıştırılmaz; karşılaştırma sekmesi için `state.ekcRows` ve `state.ekcGroups` altında tutulur.
- `Gerilim Kaynaklarını Göster` butonu gerilim kolonlarını görünür yapar.
- `EK-C / YKS SCADA Karşılaştırma` sekmesi API platform satırları ile EK-C dakika satırlarını karşılaştırır.
- `CSV Dışarı Aktar` butonu mevcut normalize görünümü dışa aktarır.
- `Hata Detayları` butonu hata panelini açar.
- Hata panelinde hem yerel hata listesi hem de network/console diagnostikleri bulunur.
- `YKS Çekim Detayları` paneli her job sırasında otomatik açılır.
- Hibrit continuation başlarsa aynı panel parent job ve continuation job loglarını tek kullanıcı işlemi gibi göstermeye devam eder.
- Continuation beklenirken kullanıcıya erken `kayıt yok` final hatası gösterilmez.

### Sekme 1: Ham Data

- Ham Data sekmesi normalize edilmiş satırları satır satır gösterir.
- Kaynak kolonu satırın `API`, `CSV` veya `DOM` kökenini gösterir.
- Tarih-Saat kolonu İstanbul yerel zamanına göre gösterilir.
- Tip kolonu `CONVENTIONAL` veya `WIND` değerini taşır.
- YTM kolonu katalog zenginleştirmesinden gelir.
- Santral kolonu `plantName` alanından okunur.
- Bara ID kolonu görünen bara kimliğini gösterir.
- Bara Adı kolonu kullanıcıya tanıdık bara adını gösterir.
- İç ID kolonu YKS API sorgusunda kullanılan iç bara ID bilgisini gösterir.
- TPYS Set kolonu `tpysBusVoltSet` veya karşılık gelen normalize değerden gelir.
- Canlı Bara kolonu canlı bara gerilim değerini gösterir.
- Pgen MW kolonu aktif üretimi gösterir.
- Qgen MVAr kolonu reaktif üretimi gösterir.
- Yrd. MW kolonu yardımcı kaynak aktif gücünü gösterir.
- Yrd. MVAr kolonu yardımcı kaynak reaktif gücünü gösterir.
- Yrd. D.I. kolonu yardımcı kaynak düşük ikaz limitini gösterir.
- Yrd. A.I. kolonu yardımcı kaynak aşırı ikaz limitini gösterir.
- D.I. kolonu ana kaynağın düşük ikaz limitini gösterir.
- A.I. kolonu ana kaynağın aşırı ikaz limitini gösterir.
- Onay kolonu ana veya yardımcı onay durumunu gösterir.
- Kalite kolonu normalize kalite ve karşılaştırma farkı bilgisini gösterir.
- Tablo ilk 2000 satırı render eder.
- Daha fazla satır bellekte kalır, fakat UI performansı için ekranda sınır uygulanır.
- Üst filtreler değiştikçe tablo yeniden süzülür.
- Bir CSV ve bir API yükü birlikte varsa aynı tablo içinde kaynak rozetiyle ayrılır.
- Eğer metrik alanları kaynakta boşsa satır kalite alanında uyarı üretebilir.
- DOM satırları sıfır ölçüm ise normalize modele alınmadan elenir.
- Ham Data sekmesi en iyi debug başlangıç noktasıdır.
- YKS'den veri geldi mi sorusuna ilk cevap bu sekmedeki satır sayısıdır.
- İç ID doğru mu sorusu için İç ID kolonu kontrol edilir.
- Hibrit yardımcı veriler geldi mi sorusu için Yrd. MW ve Yrd. MVAr kolonları kontrol edilir.
- Gerilim farkı analizi için TPYS Set ve Canlı Bara kolonları birlikte okunur.

### Sekme 2: Günlük RGDH İzleme

- Günlük RGDH İzleme sekmesi normalize satırları saatlik katılım tablosuna çevirir.
- Her satır bir tarih, bir bara ve bir kontrol tipi kombinasyonudur.
- Tablo başında Tarih, Bara, Tip ve Kontrol kolonları bulunur.
- Sonrasında 00 ile 23 arasında 24 saat kolonu yer alır.
- Saat hücreleri ilgili saatteki saatlik reaktif sonucu veya normal saatlerde dakika bazlı katılım yüzdesini gösterir.
- Beklenen dakika sayısı normal durumda 60 dakikadır.
- Başarılı dakika sayısı onay, yükümlülük, devre durumu ve veri kalitesine göre hesaplanır.
- Dakika sonucu `SAĞLADI`, `SAĞLAMADI`, `DD`, `YY` veya `KY` olarak normalize edilir.
- Katılım yüzdesi yalnız normal değerlendirme saatlerinde `((SAĞLADI + DD + YY) / 60) * 100` üzerinden üretilir.
- `DD`, `YY` veya `KY` ile bastırılan saatlerde katılım yüzdesi `null` kabul edilir ve hücrede sonuç kodu gösterilir.
- Hücre rengi `participationClass` sonucuna göre atanır.
- Yeterli veri varsa hücre yeşil sınıfa yakın görünür.
- Eksik veya uyarılı veri varsa hücre uyarı sınıfına düşer.
- Başarısız veya çok eksik veri varsa hücre kırmızı sınıfa düşer.
- Veri yoksa veya saat tamamen boşsa hücre `KY` sonucuna düşebilir.
- Hücre tooltip bilgisinde saat, sonuç, katılım, set gerilimi, canlı gerilim, P, Q, geçen/kalan dakika ve DD/YY/KY sayıları bulunur.
- Tarih hücresine tıklanırsa aynı bara için tam gün grafik rapora geçilir.
- Saat hücresine tıklanırsa aynı bara, aynı tarih ve seçili saat için grafik rapora geçilir.
- Bu davranış `state.chartSelection` üzerinden taşınır.
- Günlük tablo grafik sekmesine bağlanan ana drilldown ekranıdır.
- Çok günlük aralık seçilirse her yerel gün ayrı satır grubu olarak hesaplanır.
- Bitiş tarihi hariç mantığı sayesinde rapor aralıkları üst üste binmez.
- RES/GES ve konvansiyonel satırlar aynı pivot mantığıyla işlenir.
- Hibrit yardımcı kaynak etiketi günlük tabloda da bara adının yanında korunur.
- Gerilim kolonları günlük tabloda doğrudan kolon olarak gösterilmez, fakat hücre tooltipinde özetlenir.
- Günlük sekme operasyonel izleme için en hızlı genel durum ekranıdır.
- Hangi saatte veri boş kaldı sorusu bu sekmede hemen görülür.
- Hangi saatin grafiğine bakılmalı sorusu saat hücrelerinden seçilerek cevaplanır.
- CSV ve API karşılaştırması yapılmışsa kalite rozetleri ham data üzerinden kontrol edilir.
- Günlük tablo, normalize edilmiş veri yoksa boş kalır.
- YKS çekimi tamamlandı ama bu sekme boşsa önce Ham Data ve hata paneli kontrol edilmelidir.

### Reaktif Karar Kuralları

- Platform/YKS dakika kararı `derivePlatformMinuteResult()` ile üretilir.
- Platform/YKS tarafında satır yoksa dakika sonucu `KY` olur.
- Platform/YKS tarafında `devreDurumu != 1`, `serviceActive=false`, `offBoardStatus=1` veya `offBoard=1` ise dakika sonucu `DD` olur.
- Platform/YKS tarafında `yukumlulukDurumu != 1`, `noObligationStatus=1` veya `noObligation=1` ise dakika sonucu `YY` olur.
- Platform/YKS tarafında `mainApproved`, `approvalStatus`, `mainApprovalStatus`, `rgdhApprovalStatus`, `auxApproved`, `auxiliaryApprovalStatus` veya `auxApprovalStatus` alanlarından herhangi biri `1` ise dakika sonucu `SAĞLADI` olur.
- Platform/YKS tarafında onay alanı var ama ana veya yardımcı onay yoksa dakika sonucu `SAĞLAMADI` olur.
- Eksik kritik ölçüm varsa dakika sonucu `KY` olur; eski kalite kodları gerekiyorsa `OK` sonucu `SAĞLADI`, `WARN/FAIL` sonucu `SAĞLAMADI`, `OFF` sonucu `DD`, `NO_DATA` sonucu `KY` olarak normalize edilir.
- EK-C dakika kararı `deriveEkcMinuteStat()` ile üretilir.
- EK-C tarafında zaman bilgisi veya aktif güç okunamazsa dakika sonucu `KY` olur.
- EK-C tarafında `P < Pnom * 0.01` ise dakika sonucu `DD` olur.
- EK-C tarafında `P < Pnom * 0.10` ise dakika sonucu `YY` olur.
- EK-C tarafında reaktif güç okunamazsa dakika sonucu `SAĞLAMADI` olur.
- EK-C tarafında Q hedefi hesaplanabiliyorsa ölçülen Q, hedefin yönüne göre limitlerle karşılaştırılır ve dakika sonucu `SAĞLADI` veya `SAĞLAMADI` olur.
- EK-C tarafında Q hedefi hesaplanamıyorsa dakika veri var/yok kuralından geçer ve uyarı ile `SAĞLADI` kabul edilir.
- Saatlik karar `reactiveHourSummary()` ile ortak kurala göre verilir.
- Saatte `KY >= 60` ise saat sonucu `KY` olur.
- Saatte `DD = 60` ise saat sonucu `DD` olur.
- Saatte `YY = 60` ise saat sonucu `YY` olur.
- Saatte `YY + DD > 47` ise çoğunluk sonucu kullanılır; eşitlikte `YY` seçilir.
- Saatte aktif yükümlülük dakika sayısı `13` altındaysa saat sonucu `YY` olur.
- Saatte uygunsuz dakika sayısı `12` veya daha azsa saat sonucu `SAĞLADI` olur.
- Saatte uygunsuz dakika sayısı `12` üstündeyse saat sonucu `SAĞLAMADI` olur.
- `DD`, `YY` ve `KY` saatleri katılım yüzdesini bastırır; normal saatlerde katılım yüzdesi `((SAĞLADI + DD + YY) / beklenen dakika) * 100` olarak hesaplanır.

### Sekme 3: RGDH Grafik Rapor

- RGDH Grafik Rapor sekmesi zaman serisini Chart.js ile çizer.
- Grafik sekmesi yalnız aktif sekme olduğunda render edilir.
- Başlangıç seçimleri Günlük RGDH İzleme drilldown durumundan gelir.
- Seçili bara yoksa filtrelenmiş satırlardaki ilk bara varsayılan alınır.
- Seçili tarih yoksa ilgili baranın ilk mevcut tarihi kullanılır.
- Sekme üstünde bağlam etiketi bulunur.
- Bağlam etiketi bara adını, tarihi ve saat seçimini gösterir.
- Tam gün seçiliyse etikette `tüm gün` mantığı gösterilir.
- Saat seçiliyse etikette `HH:00` formatı gösterilir.
- Grafik araç çubuğunda Bara seçimi bulunur.
- Grafik araç çubuğunda BYTM seçimi bulunur.
- Grafik araç çubuğunda Tarih seçimi bulunur.
- Grafik araç çubuğunda Başlangıç saat/dakika alanları bulunur.
- Grafik araç çubuğunda Bitiş saat/dakika alanları bulunur.
- `Sorgula` butonu bu grafik içi filtreleri uygular.
- `Tam Ekran` butonu grafik alanını geniş okumaya uygun hale getirir.
- Grafik raporu iki ayrı çizim üretir.
- Üst grafik gerilim ve aktif güç serilerini birlikte gösterir.
- Alt grafik reaktif güç ve limit serilerini gösterir.
- EK-C verisi bulunan karşılaştırma görünümünde Q hedefi ve tolerans limitleri ayrıca çizilebilir.
- TPYS Set gerilimi ayrı seri olarak tutulur.
- Canlı bara gerilimi ayrı seri olarak tutulur.
- Gerilim kaynakları görünürlüğü üstteki gerilim toggle ile yönetilir.
- Konvansiyonel tolerans bantları uygun veri olduğunda grafiğe eklenebilir.
- Detay tablosu varsayılan gizlidir.
- `Tablo Göster` butonu seçili grafik satırlarını tablo olarak açar.
- Detay tablosu grafikle aynı filtreyi kullanır.
- 24 saat sonuçlar paneli grafik sekmesinin altında bulunur.
- 24 saat sonuçlar paneli günlük pivotun kompakt ısı haritasıdır.
- Isı haritasındaki saat hücreleri de saat seçimi yapabilir.
- Isı haritası tıklanınca grafik aynı bara ve aynı saat için yeniden render edilir.
- Grafik rapor saatlik anomali incelemesi için kullanılır.
- Eğer ham veri satırı geldiği halde grafik boşsa tarih, bara ve saat filtresi kontrol edilmelidir.
- Eğer gerilim çizgileri görünmüyorsa `Gerilim Kaynaklarını Göster` butonu kontrol edilmelidir.
- Eğer yardımcı kaynak verileri bekleniyorsa Ham Data sekmesindeki yardımcı kolonlarla grafik birlikte okunmalıdır.

### Sekme 4: EK-C / YKS SCADA Karşılaştırma

- EK-C / YKS SCADA Karşılaştırma sekmesi kullanıcı EK-C dosyası ile API platform satırlarını aynı dakika anahtarında eşleştirir.
- Karşılaştırma için EK-C satırları platform satırlarından ayrı tutulur.
- EK-C satırları seçili YKS barasına bağlanırken önce katalog bara ID, sonra iç bara ID, sonra görünen bara ID, en son normalize ad anahtarları denenir.
- Dakika eşleşme anahtarı bara kimliği, yerel tarih ve gün içi dakika indeksinden oluşur.
- Join durumu `both`, `ekc_only` veya `platform_only` olarak saklanır.
- `both` satırlarında EK-C ve YKS dakika sonucu, gerilim, aktif güç, reaktif güç ve hibrit aktif güç farkları hesaplanır.
- `ekc_only` satırları EK-C'de olup aktif filtrede YKS SCADA karşılığı bulunmayan dakikalardır.
- `platform_only` satırları YKS SCADA tarafında olup EK-C karşılığı bulunmayan dakikalardır.
- Sekme bağlam etiketinde ortak dakika, yalnız EK-C, yalnız YKS SCADA ve sonuç farkı sayıları gösterilir.
- Ortak dakika bulunamazsa tanı metni tarih uyumsuzluğu, seçili bara/binding eksikliği, EK-C V/P/Q alan eksikliği veya YKS veri yokluğu ayrımını gösterir.
- Karşılaştırma grafiği üstte EK-C ve YKS gerilim/aktif güç serilerini, altta EK-C ve YKS reaktif güç/limit serilerini birlikte gösterir.
- Karşılaştırma tablosu saat bazlı özet üretir.
- Saat özetinde EK-C değerlendirme, YKS değerlendirme, EK-C katılım yüzdesi, YKS katılım yüzdesi, eşleşen dakika, ortalama ve maksimum `dV`, `dP`, `dQ` değerleri bulunur.
- Hibrit kaynaklarda YKS yardımcı aktif güç ile EK-C hibrit aktif güç ayrıca karşılaştırılır.
- Saat satırına tıklanınca karşılaştırma grafiği ilgili tarih ve saat filtresine geçer.
- Karşılaştırma CSV dışa aktarımı saatlik özetleri Excel/TR uyumlu semicolon CSV olarak üretir.

### Sekme 5: RGDH Testleri

- RGDH Testleri sekmesi ölçüm satırlarından çok katalog ve sertifika tanımlarına odaklanır.
- Ana kaynak Bara/Ünite Tanımlama CSV'sidir.
- Gömülü katalog verileri de ekran açılışında yüklenir.
- Yardımcı kaynak katalog overlay'i hibrit santral bilgilerini zenginleştirir.
- Sekmede Santral/Bara Ara filtresi bulunur.
- Sekmede Bara Tipi filtresi bulunur.
- Sekmede Bara Adı filtresi bulunur.
- Sekmede Hibrit santraller checkbox filtresi bulunur.
- Hibrit filtresi yalnız `hasAuxiliarySource` işareti taşıyan baraları gösterir.
- Ana test tablosunda bara tipi gösterilir.
- Ana test tablosunda bara ID gösterilir.
- Ana test tablosunda bara adı gösterilir.
- Ana test tablosunda RGK tipi gösterilir.
- Ana test tablosunda bara gerilim seviyesi gösterilir.
- Ana test tablosunda BYTM gösterilir.
- Ana test tablosunda TPYS santral ID gösterilir.
- Ana test tablosunda TPYS santral ismi gösterilir.
- Ana test tablosunda Bara 1 TA ve Setnum gösterilir.
- Ana test tablosunda Bara 2 TA ve Setnum gösterilir.
- Ana test tablosunda Bara 3 TA ve Setnum gösterilir.
- Bir bara satırına tıklanınca ünite detay tablosu güncellenir.
- Ünite detay tablosunda ünite adı gösterilir.
- Ünite detay tablosunda UEVCB adı gösterilir.
- Ünite detay tablosunda TPYS UEVCB ID gösterilir.
- Ünite detay tablosunda kaynak tipi gösterilir.
- Ünite detay tablosunda aktif güç TA ve setnum gösterilir.
- Ünite detay tablosunda reaktif güç TA ve setnum gösterilir.
- Ünite detay tablosunda ünite nominal güç gösterilir.
- Ünite detay tablosunda ünite PMKUD gösterilir.
- Ünite detay tablosunda nominal düşük ikaz değeri gösterilir.
- Ünite detay tablosunda nominal aşırı ikaz değeri gösterilir.
- `CSV İndir` butonu test/katalog görünümünü dışa aktarır.
- Bu sekme YKS veri çekiminden bağımsız olarak katalog doğrulama için kullanılabilir.
- YKS çekiminde seçilecek baranın yardımcı kaynak taşıyıp taşımadığı bu sekmeden doğrulanabilir.
- Hibrit sorunlarında önce bu sekmede baranın `[Yardimci kaynak]` olarak işaretlenip işaretlenmediği kontrol edilmelidir.

### YKS'den Çek Akışı: Kullanıcı Tarafı

- Kullanıcı önce tarih seçer.
- Kullanıcı gerekirse bitiş tarihi seçer.
- Kullanıcı veri tipini seçer.
- Kullanıcı katalogdan tek bir bara seçer.
- Kullanıcı `YKS'den Çek` butonuna basar.
- `rgdh-monitor.js` mevcut filtreleri `readFilters()` ile okur.
- `resolveSelectedBusbar()` katalog seçimini normalize eder.
- `resolveSelectedInternalIds()` seçili bara için bilinen iç ID adaylarını çıkarır.
- `resolveFetchSourceType()` etkili kaynak tipini belirler.
- Fetch log paneli açılır.
- Butonlar job süresince kilitlenir.
- Payload içine `localDate`, `endDate`, `sourceType`, `busbarInternalIds`, `selectedBusbar` ve `jobTimeoutMs` yazılır.
- Hibrit yardımcı RES/GES için parent job timeout değeri 300 saniyeye çıkarılır.
- Normal işler için job timeout değeri 60 saniye civarında tutulur.
- Payload `RGDH_DOM_BRIDGE.startRgdhFetchJob()` üzerinden background'a gönderilir.
- Eski köprü yoksa doğrudan request yolu kullanılabilir.
- Background job ID döndürür.
- UI her saniye `getRgdhFetchJobStatus(jobId)` ile durumu poll eder.
- Status içinde loglar taşınır.
- Status tamamlandığında satırlar doğrudan status içinde taşınmaz.
- Büyük satırlar için `getRgdhFetchRows(jobId, kind, offset, limit)` çağrıları yapılır.
- UI `conventionalRows`, `windRows` ve `domRows` parçalarını hydrate eder.
- Parent job `continuationJobId` döndürürse UI continuation job'u otomatik poll eder.
- Continuation job tamamlanınca onun `windRows`, `conventionalRows` ve `domRows` parçaları hydrate edilir.
- Continuation satırları parent job'un sonucu gibi aynı normalize akışına verilir.
- Gelen API satırları normalizer'dan geçirilir.
- Normalize edilen satırlar katalog bilgisiyle zenginleştirilir.
- Ekran istatistikleri ve sekmeler yeniden render edilir.
- Partial error varsa iş tamamen başarısız sayılmayabilir.
- Partial error kullanıcıya hata panelinde ve fetch log panelinde gösterilir.
- API satırı gelmediyse ve continuation yoksa durum `YKS çekimi başarısız: kayıt yok` mesajına dönebilir.
- Continuation varsa bu hata ancak continuation da satır getiremezse final hale gelir.

### YKS'den Çek Akışı: Background Job Katmanı

- `handleRgdhFetchStart()` yeni job ID üretir.
- Job ID formatı `rgdh-job-{timestamp}-{seq}` şeklindedir.
- Job başlangıç zamanı kaydedilir.
- Job payload'ı sanitize edilerek diagnostik kayda yazılır.
- Hassas header, token veya cookie bilgisi job kaydına yazılmaz.
- Asıl fetch işi promise zinciriyle arka planda başlar.
- UI thread uzun fetch boyunca bloklanmaz.
- `handleRgdhFetchStatus()` job durumunu döndürür.
- `handleRgdhFetchRows()` büyük satır parçalarını döndürür.
- `handleRgdhFetchCancel()` çalışan job için iptal durumu yazar.
- Job `running`, `completed`, `failed` veya `cancelled` durumlarından birini alır.
- Başarılı job sonucunda satırlar `rowStore` içine taşınır.
- Status sonucunda yalnız özet bilgiler döner.
- Satırların parça parça taşınması Chrome mesaj boyutu sorunlarını azaltır.
- Her job sonunda diagnostik event üretilir.
- Diagnostik event içinde job ID, kaynak tipi, seçili bara, iç ID, satır sayıları ve hata sınıfı bulunur.
- Hibrit parent job satır getirmese bile continuation payload üretebilir.
- Continuation job ID formatı `rgdh-cont-{timestamp}-{seq}` şeklindedir.
- Continuation job satırları da `rowStore` içinde parça parça saklanır.
- Continuation job parent işin `parentJobId` bilgisini loglarda taşır.
- Hibrit continuation için background çalışma bütçesi 900 saniyedir.
- UI, background continuation sonucunu kaçırmamak için bu bütçenin üstüne 60 saniye poll toleransı ekler.
- Job hataya düşerse hata `sanitizeRgdhBackgroundError()` ile güvenli hale getirilir.
- Hata loglarında Authorization, cookie ve token benzeri alanlar redakte edilir.

### Tarih ve Saat Dönüşümü

- UI tarihleri İstanbul yerel günü olarak kabul eder.
- API ise UTC ISO zaman aralığı bekler.
- `buildUtcDayRangeForIstanbul(localDate)` yerel günü UTC başlangıç ve bitişe çevirir.
- Örneğin `2026-05-01` İstanbul günü `2026-04-30T21:00:00Z` başlangıcına karşılık gelir.
- Aynı günün bitişi `2026-05-01T21:00:00Z` olur.
- Saatlik sorgularda `buildUtcHourRangeForIstanbul()` kullanılır.
- Yerel 00:00 saati UTC'de bir önceki gün 21:00 aralığına denk gelir.
- Bu dönüşüm hem konvansiyonel hem RES/GES sorgularında aynıdır.
- Çok günlük çekimde her yerel gün ayrı ayrı işlenir.
- Bitiş tarihi hariç tutulur.
- Bugünün hibrit range fallback'inde bitiş zamanı gün sonunu aşmaz.
- Bugünün range fallback'inde bitiş zamanı mevcut zamana kadar kısaltılabilir.
- Bugünün hibrit fast-probe ve CSV fallback aralığında bitiş zamanı mevcut YKS bitiş zamanına kadar kısaltılabilir.
- AKYEL-1 RES örneğinde `2026-05-01` yerel günü için tam aralık başlangıcı `2026-04-30T21:00:00Z` olur.

### Endpoint ve Parametre Üretimi

- Konvansiyonel veri endpointi `/api/rgdh-conventional-busbar-data` yoludur.
- RES/GES veri endpointi `/api/rgdh-wind-busbar-data` yoludur.
- RES/GES CSV fallback endpointi `/api/rgdh-wind-busbar-data-csv` yoludur.
- Genel parametre endpointi `/api/general-parameter-by-name` yoludur.
- Bara katalog endpointi `/api/busbars` yoludur.
- `buildRgdhUrl()` yalnız izin verilen path değerlerini kabul eder.
- Bu allow-list hatalı veya dış domainli RGDH path üretimini engeller.
- Ortak query alanı `measurementDate.greaterOrEqualThan` başlangıç zamanını taşır.
- Ortak query alanı `measurementDate.lessThan` bitiş zamanını taşır.
- Sıralama çoğunlukla `measurementDate,asc` olarak verilir.
- Sayfa boyutu endpoint ve akışa göre 60 veya daha yüksek olabilir.
- `busbarId.equals` alanı YKS iç bara ID değerini alır.
- API helper fonksiyonları `busbarInternalId` alanını `busbarId.equals` parametresine dönüştürür.
- Konvansiyonel saatlik sorguda `page=0` kullanılır.
- Standart RES/GES saatlik sorguda `page=0` kullanılır.
- Hibrit özel range sorguda `page` parametresi özellikle silinir.
- Page'siz hibrit sorgu YKS ekranındaki çalışan request biçimini taklit eder.
- Hibrit fast-probe isteklerinde `size=60`, `sort=measurementDate,asc`, `busbarId.equals={iç ID}` bulunur ve `page` bulunmaz.
- Hibrit CSV fallback isteğinde `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `sort=measurementDate,asc` ve `busbarId.equals={iç ID}` bulunur.
- Hibrit CSV fallback isteğinde `page` parametresi bulunmaz.
- Hibrit CSV fallback isteğinde `size` parametresi zorunlu değildir; YKS endpointi geniş aralığı kendi CSV/JSON cevabında döndürebilir.
- AKYEL-1 RES için isteklerde görünen ID `6002` değil, YKS iç ID `9490732369` `busbarId.equals` değeridir.

### Konvansiyonel YKS Çekimi

- Konvansiyonel seçildiğinde önce seçili bara iç ID değeri kullanılır.
- Her yerel gün 24 saatlik parçalara bölünür.
- Her saat için bir API isteği hazırlanır.
- Parametreler `buildConventionalHourParams()` ile üretilir.
- Her istek `page=0`, `size=60`, `sort=measurementDate,asc` taşır.
- Saatlik istekler deadline bütçesine göre timeout alır.
- Satır geldikçe sonuç listesine eklenir.
- Bazı saatler boş gelebilir.
- Bazı saatler timeout olabilir.
- Tüm saatler başarısız olursa partial error üretilir.
- Konvansiyonel hata durumunda DOM fallback denenebilir.
- DOM fallback yalnız YKS ekranından okunabilen tablo satırlarını döndürebilir.
- DOM fallback API'nin tüm zengin alanlarını garanti etmez.

### Standart RES/GES YKS Çekimi

- RES/GES seçildiğinde endpoint `/api/rgdh-wind-busbar-data` olur.
- Seçili bara için iç ID adayları hazırlanır.
- İç ID katalogdan, yüklenen dosya adından veya YKS katalog lookup sonucundan gelebilir.
- Her iç ID için saatlik çekim denenir.
- Standart saatlik çekim `buildWindHourParams()` ile hazırlanır.
- Standart saatlik çekimde `page=0` bulunur.
- Standart saatlik çekimde saat aralığı tek yerel saatle sınırlıdır.
- Bu yol normal RES/GES baralar için hızlı ve öngörülebilir çalışır.
- Başarılı satırlar `windRows` listesine eklenir.
- Sonuçta kullanılan ID beklenenden farklı ise cache güncellenir.
- Satır yoksa ve hata tam gün saatlik timeout değilse iş o aday için sonuçlanabilir.

### Hibrit ve Yardımcı Kaynak RES/GES Tespiti

- Hibrit tespiti `selectedBusbar` üzerinden yapılır.
- `hasAuxiliarySource` alanı boolean `true` ise hibrit kabul edilir.
- `hasAuxiliarySource` alanı string `"true"` ise de hibrit kabul edilir.
- `hybridAuxiliary` alanı boolean veya string true ise hibrit kabul edilir.
- Bara adı, santral adı veya kaynak türünde yardımcı kaynak ipucu aranır.
- `yardimci`, `hibrit` veya `auxiliary` metinleri hibrit ipucu sayılır.
- Katalog overlay'i yardımcı kaynak GES ünitelerini işaretleyebilir.
- Hibrit işlerde parent job timeout 300 saniyeye kadar uzatılır.
- Hibrit işlerde aday ID sıralaması daha dikkatli yürütülür.
- İlk aday genellikle YKS iç bara ID değeridir.
- Görünen bara ID yalnız doğrulama ve log ayrımı için önemlidir; YKS API isteğinde öncelik iç bara ID değerindedir.
- AKYEL-1 RES için doğru iç bara ID `9490732369`, görünen bara ID `6002` değeridir.
- Hibrit fast-probe aşamasında görünen ID ile geniş deneme yapılmaz.
- Probe pencereleri veri çıkma ihtimali yüksek ve aralığı temsil eden en fazla üç page'siz pencereden seçilir.
- Varsayılan probe sırası son tamamlanmış saat, gün başlangıç saati ve bir önceki tamamlanmış saat mantığıyla tekilleştirilir.
- Her fast-probe isteği 15 saniye timeout ile çalışır.
- Fast-probe concurrency değeri 1'dir.
- Amaç yanlış request şekliyle veya yavaş YKS pencereleriyle 24 saat beklememektir.

### Hibrit Page'siz Prob, Continuation ve CSV Fallback

- Hibrit yardımcı RES/GES baralarda YKS backend bazı saatlik `page=0` isteklerde timeout verebilir.
- AKYEL-1 RES incelemesinde doğru iç ID ile standart page-less API pencerelerinin de 0 satır veya timeout dönebildiği görülmüştür.
- Aynı santral için YKS CSV endpointi geniş aralıkta veri döndürebildiği için hibrit akış artık CSV-first continuation ile tamamlanır.
- Hibrit özel akışın amacı YKS ekranının request şekline yaklaşmak, fakat 24 pencereyi tüketmeden hızlı karar vermektir.
- Hibrit akış önce `fetchRgdhWindBusbarByYksUiFastProbeWindows()` ile en fazla üç page'siz fast-probe penceresi dener.
- Fast-probe pencereleri tam günlük aralıktan seçilir.
- İlk probe adayı son tamamlanmış saat veya mevcut aralığın son penceresidir.
- İkinci probe adayı yerel gün başlangıcının UTC karşılığıdır.
- Üçüncü probe adayı son tamamlanmış saatten bir önceki penceredir.
- Probe pencereleri tekilleştirilir; aynı pencere iki kez sorgulanmaz.
- Her fast-probe isteği `size=60`, `sort=measurementDate,asc`, `busbarId.equals={iç ID}` taşır.
- Fast-probe isteklerinde `page` parametresi bulunmaz.
- Fast-probe timeout değeri 15 saniyedir.
- Fast-probe concurrency değeri 1'dir.
- Fast-probe satır döndürürse mevcut page'siz saatlik akış devam eder.
- Bu durumda gelen partial satırlar korunur ve normalize edilir.
- Fast-probe hiç satır döndürmezse veya timeout alırsa AKYEL tipi yavaş hibrit akış kabul edilir.
- AKYEL tipi akışta 24 saatlik API pencereleri tek tek tüketilmez.
- Bu durumda parent job `baseRows=[]` ile continuation payload oluşturabilir.
- Continuation payload satır olmasa bile oluşturulur.
- Continuation payload tüm istenen YKS aralığını kapsar.
- `2026-05-01` İstanbul günü için başlangıç `2026-04-30T21:00:00Z` olur.
- Bugün çekiminde continuation bitişi gün sonu yerine mevcut YKS bitiş zamanına kadar kısaltılır.
- Continuation payload içinde `missingWindows`, `preferCsvFallback=true`, `sourceKey=WIND`, `endpoint=/api/rgdh-wind-busbar-data` ve `busbarId` bulunur.
- Parent job bu durumda `continuationJobId` döndürür.
- Parent job 0 satır döndürse bile `continuationJobId` varsa UI bunu final `NO_NORMALIZED_ROWS` hatası saymaz.
- UI continuation job'u otomatik poll eder.
- Kullanıcı açısından parent job ve continuation job tek çekim işlemi gibi görünür.
- Continuation job `runRgdhHybridContinuationJob()` ile çalışır.
- `preferCsvFallback=true` ise continuation önce `/api/rgdh-wind-busbar-data-csv` endpointini dener.
- CSV fallback timeout bütçesi 900 saniyedir.
- CSV fallback isteği geniş aralığı tek seferde ister.
- CSV fallback query içinde `measurementDate.greaterOrEqualThan` bulunur.
- CSV fallback query içinde `measurementDate.lessThan` bulunur.
- CSV fallback query içinde `busbarId.equals` bulunur.
- CSV fallback query içinde `sort=measurementDate,asc` bulunur.
- CSV fallback query içinde `page` bulunmaz.
- CSV fallback başarılı olduğunda `csvFallbackRows` satır sayısı loglanır.
- CSV endpoint `application/json` dönerse JSON array yolu kullanılır.
- CSV endpoint `text/csv` veya text içerik dönerse `rgdh-csv.js` içindeki mevcut CSV parser kullanılır.
- CSV'den ayrıştırılan WIND satırları API benzeri raw row şekline çevrilir.
- Bu API benzeri satırlar `normalizeWindApiRow()` yoluyla mevcut normalize modele girer.
- Yardımcı kaynak MW/MVAr alanları CSV fallback satırlarında da `auxiliarySource` ve `auxiliarySourceReactive` benzeri alanlardan taşınır.
- CSV fallback satır getirirse continuation saatlik API denemelerine düşmeden tamamlanır.
- CSV fallback başarısız olursa continuation mevcut missing window listesini page'siz saatlik pencerelerle tamamlamayı deneyebilir.
- Bu ikincil continuation saatlik akışta varsayılan pencere timeout değeri 45 saniyedir.
- Bu ikincil continuation saatlik akışta concurrency değeri 4 ile sınırlıdır.
- Eski page'siz range fallback mantığı `fetchRgdhWindBusbarByYksUiRange()` içinde korunur.
- Eski range fallback `buildWindRangeParams()` ile geniş aralık requesti üretebilir.
- Eski range fallback query içinde `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `busbarId.equals`, `size=60` ve `sort=measurementDate,asc` bulunur.
- Eski range fallback query içinde de `page` bulunmaz.
- Eski range fallback tam 60 satır aldığında cursor'u son `measurementDate` sonrasına taşıyarak devam edebilir.
- Cursor ilerlemiyorsa döngü güvenli şekilde kırılır.
- Maksimum request sayısı limitlidir.
- Page timeout değeri job deadline bütçesini aşmayacak şekilde clamp edilir.
- Parent deadline biterse `YKS_JOB_TIMEOUT` partial error üretilir.
- Continuation deadline biterse continuation tarafında hata üretilir; parent satırları varsa korunur.
- Fallback başarılı olursa saatlik timeout hatası nihai hataya dönüştürülmez.
- Fast-probe loglarında `fallbackPhase=hybrid-yks-fast-probe` bulunur.
- CSV fallback loglarında `fallbackPhase=hybrid-yks-csv-fallback` bulunur.
- Eski range fallback loglarında `fallbackPhase=hybrid-yks-ui-range` bulunabilir.
- Fallback loglarında `requestUrl`, `missingWindows`, `responseTotalCount`, `responseLink`, `preferCsvFallback`, `csvFallbackRows` ve `continuationJobId` alanları görülebilir.
- Fallback request URL içinde `page=` görülmemelidir.
- AKYEL-1 RES için fallback requestlerinde `busbarId.equals=9490732369` görülmelidir.
- AKYEL-1 RES için `6002` yalnız görünen bara ID'dir; API requestinde kullanılmamalıdır.
- Fallback başarı ölçütü `apiRows > 0` veya `windRows > 0` olmasıdır.
- Fallback sonrası job final hatası `YKS_HOURLY_TIMEOUT` olmamalıdır.
- Continuation da satır getiremezse final hata `NO_NORMALIZED_ROWS_AFTER_CONTINUATION` olabilir.

### İç Bara ID Çözümleme

- YKS API için kritik parametre `busbarId.equals` değeridir.
- Bu değer her zaman kullanıcıya görünen bara ID ile aynı olmayabilir.
- Katalog satırları iç ID bilgisini sağlayabilir.
- Dosya adlarından iç ID çıkarılabilir.
- Seçili YKS katalog barası üzerinden targeted lookup yapılabilir.
- Broad catalog paging yalnız gerekli olduğunda kullanılır.
- Broad catalog paging sayfa sınırı ile korunur.
- Çözümleme sonucu `busbarInternalIds` listesine yazılır.
- İlk uygun ID asıl aday olarak denenir.
- Hibrit işlerde görünen ID log ve kullanıcı doğrulaması için saklanır.
- AKYEL tipi hızlı-probe başarısızlığında görünen ID ile 24 saatlik tekrar yapılmaz.
- Başarılı fallback ID cache'e yazılabilir.
- Cache sonraki çekimlerde tekrar çözümleme maliyetini azaltır.
- Loglarda `resolverMethod` ve `resolverPageCount` alanları bulunabilir.
- Loglarda `displayBusbarId`, `resolvedInternalBusbarId` ve `candidateBusbarId` ayrımı önemlidir.
- İç ID yanlışsa genellikle HTTP 200 ama 0 satır veya tüm saatlerde boş sonuç görülür.
- İç ID doğru ama request şekli sorunluysa fast-probe timeout/0 satır ve CSV fallback başarı paterni görülebilir.
- İç ID doğru, page'siz API çalışıyor ama bazı saatler eksik kalıyorsa continuation missing window tamamlaması görülebilir.

### Normalizasyon

- Konvansiyonel API satırları `normalizeConventionalApiRow()` ile işlenir.
- RES/GES API satırları `normalizeWindApiRow()` ile işlenir.
- CSV parse sonucu `normalizeCsvParseResult()` ile ortak modele çevrilir.
- Hibrit CSV fallback sonucu JSON array dönerse doğrudan WIND API raw row olarak işlenebilir.
- Hibrit CSV fallback sonucu text/csv dönerse önce CSV parser ile okunur, sonra WIND API benzeri raw row'a çevrilir.
- Bu dönüşüm sayesinde CSV fallback satırları Ham Data sekmesinde `API`/WIND akışına uyumlu normalize edilir.
- DOM satırları `finalizeRow()` ile tamamlanır.
- Normalize modelde yerel tarih, yerel saat ve yerel dakika alanları bulunur.
- Normalize modelde kaynak tipi bulunur.
- Normalize modelde bara ID, bara adı, santral adı ve YTM bulunur.
- Normalize modelde TPYS set gerilimi ayrı tutulur.
- Normalize modelde canlı bara gerilimi ayrı tutulur.
- Normalize modelde ana aktif ve reaktif güç değerleri ayrı tutulur.
- Normalize modelde yardımcı aktif ve reaktif güç değerleri ayrı tutulur.
- Normalize modelde ana düşük/aşırı ikaz limitleri ayrı tutulur.
- Normalize modelde yardımcı düşük/aşırı ikaz limitleri ayrı tutulur.
- Normalize modelde onay durumları korunur.
- Kaynakta metrik alanları boşsa `metricFieldsEmptySource` flag'i üretilebilir.
- Bu flag normalizer hatası değil, YKS kaynağında veri boşluğu göstergesidir.
- Normalize satırlar katalog ile zenginleştirilebilir.
- Zenginleştirme santral adı, YTM ve iç ID gibi alanları tamamlar.
- Karşılaştırma işlemi API platform satırları ile EK-C satırları arasında toleranslı alan farkı üretir.

### CSV Kullanımı

- `Ek-C CSV Yükle` birden fazla kullanıcı EK-C dosyası kabul eder; ekrandaki buton etiketi `Ek-C CSV Yukle` şeklindedir.
- EK-C parser `TARIH` ve `SAAT` başlığını bulur; boş `SAAT` başlığı ve eski `TARIH` ağırlıklı şablonlar için onarım yapabilir.
- EK-C satırları dakika bazında `tarih`, `saat`, `dakikaIndex`, `hour`, `vBara`, `vSet`, `pTotal`, `pMain`, `pAux`, `qMeas` ve `minuteStat` alanlarına normalize edilir.
- EK-C yükleri `state.ekcRows`, `state.ekcGroups` ve `state.ekcLoaded` altında platform/YKS satırlarından ayrı tutulur.
- EK-C satırları Ham Data sekmesinin ana platform listesine karıştırılmaz; EK-C / YKS SCADA Karşılaştırma sekmesinde kullanılır.
- EK-C tipi veya zorunlu alanları tanınamazsa hata paneline tanı yazılır.
- Bara/Ünite Tanımlama CSV'si katalog doğrulama ve test akışı için kullanılabilir.
- Hibrit CSV fallback kullanıcı dosya yüklemesi değildir; background job tarafından YKS CSV endpointinden alınan satırları normalize akışına verir.
- Hibrit CSV fallback JSON döndüğünde satırlar kaynak API satırı gibi, text/csv döndüğünde parser üzerinden dönüştürülmüş satır gibi işlenir.
- Karşılaştırma akışı API platform verisini EK-C kullanıcı dosyasıyla aynı normalize dakika modeli üzerinden kıyaslar.
- Dışa aktarım Excel/TR uyumlu semicolon CSV üretir.

### Hata, Log ve Diagnostik Sistemi

- Fetch log paneli job sırasında adım adım bilgi verir.
- Log seviyesi `debug`, `info`, `success`, `warn` veya `error` olabilir.
- Loglarda endpoint bilgisi bulunabilir.
- Loglarda sanitize edilmiş params bilgisi bulunabilir.
- Loglarda HTTP status bilgisi bulunabilir.
- Loglarda row count bilgisi bulunabilir.
- Loglarda candidate ID bilgileri bulunabilir.
- Loglarda fallback aşaması bulunabilir.
- Hibrit loglarında `continuationJobId` ve `parentJobId` bilgileri bulunabilir.
- Hibrit loglarında `missingWindows` tamamlanacak pencere sayısını gösterir.
- Hibrit loglarında `fallbackPhase=hybrid-yks-fast-probe` hızlı prob aşamasını gösterir.
- Hibrit loglarında `fallbackPhase=hybrid-yks-csv-fallback` CSV-first continuation aşamasını gösterir.
- Hibrit loglarında `fallbackPhase=hybrid-yks-ui-range` eski page'siz range fallback aşamasını gösterebilir.
- Hibrit CSV fallback loglarında `preferCsvFallback=true` ve `csvFallbackRows` alanları görünür.
- Network özetlerinde `responseTotalCount`, `responseLink` ve `responseContentType` alanları debug için korunur.
- Hata paneli kullanıcıya özet hata listesini gösterir.
- Aynı hata tekrarlanırsa sayaçla birleştirilebilir.
- Diagnostik paneli network, console, header ve response kayıtlarını gösterir.
- Diagnostikler en fazla 300 kayıt olarak ekranda gösterilir.
- Hata detayları CSV olarak indirilebilir.
- CSV dosya adı `RGDH_HATA_DETAYLARI_YYYY-MM-DD.csv` formatındadır.
- Diagnostik CSV ek kolonlar taşır.
- Ek kolonlar job ID, kaynak tipi, seçili bara ID ve YKS iç bara ID bilgisini içerir.
- Ek kolonlar saat başlangıç ve bitiş bilgilerini içerir.
- Ek kolonlar chunk başlangıç ve bitiş bilgilerini içerir.
- Ek kolonlar hata sınıfı ve istek URL bilgisini içerir.
- Ek kolonlar API satır ve metrik boş satır sayılarını içerir.
- Token, cookie ve Authorization bilgileri diagnostik çıktıda redakte edilir.
- Hata sınıfları debug sırasında kök neden ayrımı yapmak için kullanılır.
- `NO_YKS_TAB` açık YKS sekmesi bulunamadığını gösterir.
- `AUTH_REQUIRED` YKS oturumu veya yetki sorunu olduğunu gösterir.
- `PAGE_FETCH_TIMEOUT` YKS sayfası içi fetch isteğinin süresinde dönmediğini gösterir.
- `YKS_HOURLY_TIMEOUT` tüm saatlik isteklerin başarısız olduğunu gösterir.
- `YKS_JOB_TIMEOUT` toplam job süresinin dolduğunu gösterir.
- `INCOMPLETE_HYBRID_FETCH` hibrit çekimde bazı pencerelerin eksik kaldığını, fakat fallback/continuation denenebileceğini gösterir.
- `MISSING_BUSBAR_SELECTION` tekli bara seçimi yapılmadığını gösterir.
- `NO_NORMALIZED_ROWS` fetch tamamlandığı halde normalize satır oluşmadığını gösterir.
- `NO_NORMALIZED_ROWS_AFTER_CONTINUATION` parent job ve continuation tamamlandığı halde normalize satır oluşmadığını gösterir.
- `METRIC_FIELDS_EMPTY_SOURCE` satır geldiğini fakat metrik alanların kaynakta boş olduğunu gösterir.

### Güvenlik ve Oturum İlkeleri

- Modül kullanıcı oturum bilgisi saklamaz.
- Bearer token storage'a yazılmaz.
- Cookie storage'a yazılmaz.
- Authorization header rapora yazılmaz.
- Kullanıcı kimliği fixture dosyalarına yazılmaz.
- YKS requestleri mevcut tarayıcı oturumunun yetkileriyle yapılır.
- Açık YKS sekmesi yoksa kullanıcıdan YKS sayfasında oturum açması beklenir.
- `rgdhPageFetchMainWorld` YKS sayfa bağlamında fetch yapar.
- Page-context fetch sonucu token bilgisini dışarı taşımaz.
- Sadece response satırları, HTTP özetleri ve sanitize hata bilgileri taşınır.
- `buildRgdhUrl()` allow-list dışı endpoint üretmez.
- Diagnostik export güvenlik açısından sanitize edilir.
- Chrome storage yalnız filtre, tema ve güvenli kullanıcı tercihleri için kullanılır.

### Canlı YKS Doğrulama Reçeteleri

- AKYEL-1 RES için tarih `2026-05-01` seçilir.
- Veri tipi `RES/GES` seçilir.
- Katalogdan `AKYEL-1 RES` barası seçilir.
- `YKS'den Çek` butonuna basılır.
- Fetch log panelinde önce iç ID çözümleme sonucu izlenir.
- AKYEL-1 RES için loglarda `internalBusbarId=9490732369` ve `displayBusbarId=6002` görülmelidir.
- Fetch log panelinde en fazla üç hızlı hibrit prob izlenir.
- Hızlı prob loglarında `fallbackPhase=hybrid-yks-fast-probe` görülür.
- Hızlı prob request URL içinde `page=` olmamalıdır.
- Hızlı prob requestlerinde `size=60`, `sort=measurementDate,asc` ve `busbarId.equals=9490732369` bulunmalıdır.
- Hızlı problar 0 satır veya timeout dönerse `hibrit YKS hizli problari sonuc vermedi; CSV tamamlama baslatilacak` logu beklenir.
- Bu logda `preferCsvFallback=true`, `missingWindows`, `probedWindows=3` ve tam aralık bilgisi bulunmalıdır.
- Parent job bu aşamada `continuationJobId` döndürmelidir.
- UI `Hibrit YKS tamamlama isi bekleniyor` loguyla continuation job'u otomatik beklemelidir.
- Continuation job loglarında `fallbackPhase=hybrid-yks-csv-fallback` görülmelidir.
- Başarılı CSV fallback request URL içinde `/api/rgdh-wind-busbar-data-csv` bulunmalıdır.
- Başarılı CSV fallback request URL içinde `page=` olmamalıdır.
- Başarılı CSV fallback request URL içinde `busbarId.equals=9490732369` bulunmalıdır.
- Başarılı CSV fallback başlangıcı `2026-04-30T21:00:00Z` olmalıdır.
- CSV fallback logunda `pageTimeoutMs=900000`, `preferCsvFallback=true`, `csvFallbackRows` ve `responseContentType` alanları görünmelidir.
- AKYEL-1 RES canlı doğrulamasında `2026-05-01` için 1260 API/WIND satırının normalize edildiği görülmüştür.
- Başarılı sonuçta Ham Data sekmesinde API satırları görünmelidir.
- Başarılı sonuçta Günlük RGDH sekmesinde ilgili saatler dolmalıdır.
- Başarılı sonuçta final hata `YKS_HOURLY_TIMEOUT` olmamalıdır.
- Başarılı sonuçta final hata `NO_NORMALIZED_ROWS` olmamalıdır.
- Continuation da satır getiremezse beklenen final hata `NO_NORMALIZED_ROWS_AFTER_CONTINUATION` olmalıdır.
- Hata devam ederse Hata Detayları CSV'si indirilmelidir.
- CSV'de `selectedBusbar`, `internalBusbarId`, `candidateBusbarId`, `continuationJobId`, `fallbackPhase`, `preferCsvFallback`, `csvFallbackRows` ve `requestUrl` kolonları kontrol edilmelidir.
- YKS Network panelinde çalışan request ile eklenti request URL'si karşılaştırılmalıdır.

### Bakım ve Test Referansları

- RGDH background davranışları `tests/background.test.js` ile korunur.
- API parametre üretimi `tests/rgdh-api-client.test.js` ile korunur.
- Normalizer davranışları `tests/rgdh-normalizer.test.js` ile korunur.
- Reaktif dakika/saat kararları `tests/rgdh-reactive-rules.test.cjs` ve `tests/rgdh-pivot.test.js` ile korunur.
- EK-C/YKS karşılaştırma davranışı `tests/rgdh-comparison.test.js` ile korunur.
- EK-C parser ve CSV export davranışları `tests/rgdh-csv.test.js` ile korunur.
- Grafik davranışları `tests/rgdh-charts.test.js` ile korunur.
- UI smoke kontrolleri `tests/rgdh-ui-smoke.test.js` ile korunur.
- Diagnostik export davranışları `tests/rgdh-diagnostics.test.js` ile korunur.
- Tam test paketi `npm test` ile çalışır.
- Eklenti paketi `npm run build:extension` ile üretilir.
- Paket smoke kontrolü `npm run smoke:extension` ile yapılır.
- Hibrit range fallback için özel testlerde page'siz request ve cursor ilerleme doğrulanır.
- Hibrit fast-probe testlerinde en fazla üç page'siz probe, 15 saniye timeout ve `page` parametresinin olmaması doğrulanır.
- Akyel senaryosu testlerinde tüm hızlı problar timeout/0 satır döndüğünde parent job'un `NO_NORMALIZED_ROWS` üretmeden `continuationJobId` döndürmesi doğrulanır.
- Boş `baseRows=[]` continuation testlerinde CSV fallback'in `/api/rgdh-wind-busbar-data-csv` endpointini `page` olmadan çağırdığı doğrulanır.
- CSV fallback testlerinde JSON array ve text/csv dönüşlerinin WIND raw row'a çevrilip normalize edilebilir hale geldiği doğrulanır.
- Monitor testlerinde continuation devam ederken erken `NO_NORMALIZED_ROWS` loglanmadığı doğrulanır.
- Erciyes benzeri hızlı page-less pencere başarı testlerinde CSV fallback'e geçmeden mevcut hızlı yolun korunduğu doğrulanır.
- String `"true"` gelen `hasAuxiliarySource` değeri testlerle hibrit kabul edilir.
- Bu bölüm güncellenirken gerçek kod davranışı ile README anlatımı birlikte tutulmalıdır.

### Katılım Yüzdesi ve Saatlik Karar Özeti

| Kaynak | Dakika Kararı | Saatlik Karar | Katılım Yüzdesi |
|---|---|---|---|
| YKS / Platform | `derivePlatformMinuteResult()` ile `KY`, `DD`, `YY`, `SAĞLADI`, `SAĞLAMADI` üretir; yardımcı onay ana onay gibi geçer kabul edilir. | `reactiveHourSummary()` ortak karar sırasını uygular; eksik dakikalar YKS saat hesabında başarısız dakika olarak sayılır, tamamen boş saat `KY` olur. | Yalnız normal `SAĞLADI/SAĞLAMADI` saatlerinde `((SAĞLADI + DD + YY) / 60) * 100`; `DD/YY/KY` saatlerinde yüzde `null`/gizli. |
| EK-C | `deriveEkcMinuteStat()` Pnom eşikleri, Q hedefi ve Q limitlerine göre karar üretir; Q hedefi yoksa veri var/yok kuralı ile geçer. | Karşılaştırma saat özetinde EK-C sonuçları da aynı `reactiveHourSummary()` sırasına sokulur; saat beklenen dakika sayısı eldeki EK-C dakika sayısıdır. | Normal saatlerde `((SAĞLADI + DD + YY) / beklenen dakika) * 100`; `DD/YY/KY` saatlerinde yüzde bastırılır. |

---

## Mimari Kararlar

| Karar | Neden |
|-------|-------|
| Vanilla JS + Native SVG | Framework bağımlılığı olmadan Chrome extension içinde maksimum kontrol |
| KML→JSON ön derleme | 34 MB JSON, runtime'da parse kolaylığı; ham KML 5-7 dakika sürer |
| MV3 Service Worker | Chrome'un zorunlu MV3 gerekliliği; background page artık yok |
| UMD modül formatı | `map-common.js` ve `scada-common.js` hem tarayıcı hem Node test ortamında çalışır |
| SheetJS runtime | Python build yerine tarayıcı tarafında XLS parse — Bara Set için anlık yükleme |
| Üç kademeli auth fallback | Superset oturum güvenilirliği değişken; her yöntem başarısız olduğunda bir sonraki denenir |

## Kritik Güncel Durum Özeti

- Uygulamanın ana harita runtime’ı V2 modele taşındı ve temel veri kaynağı `data/kml_layers_v2.json` oldu. Hat, TM, trafo ve bara yapıları artık bu model üzerinden çalışıyor.
- SCADA tarafında hat yönü, eşleşme kalitesi, audit/mismatch raporları ve görünür özetler V2 akışa bağlandı. Hat renklendirme, popup ve liste aynı çözülmüş metric kaynağını kullanıyor.
- Hover sistemi iyileştirildi: hat ve TM üzerinde görünmez buffer alanları eklendi, tooltip kapanışı gecikmeli hale getirildi, hover yakalama kolaylaştı.
- Gerilim ve trafo için SCADA overlay mantığı genişletildi. Seçili SCADA metriği aktifken overlay, statik katman checkbox’larından bağımsız render alabiliyor. Desteklenen modlar: `Kutu`, `Nokta (Ad)`, `Nokta (Adsız)`, `Isı Haritası`.
- Yoğun TM bölgeleri için ekran-uzayı tabanlı declutter eklendi. Düşük zoom’da yalnız en kritik öğeler gösteriliyor, zoom arttıkça daha fazla öğe açılıyor. Seçili öğe her zaman görünür kalıyor.
- Otomatik yenileme yeniden kuruldu: eski çoklu timer mantığı yerine tek sahipli `setTimeout` scheduler kullanılıyor. Sekme arka planda kalınca yenileme boşa düşmüyor; görünür olunca overdue kontrolüyle telafi fetch tetikleniyor.
- Popup/extension adı güncellendi: **`SCADA/YTBS/TPYS/YKS Haritalar ve Otomasyon`**. Popup kart sırası yeniden düzenlendi; `Haritada Göster` ayrı üst karta taşındı.


**İleride Yapılacak Geliştirmeler**

- `SCADA snapshot kalıcılığı:` Mevcut canlı veri `entityMetricsByKey`, `measurementRowsById` ve `history` içinde yalnız bellekte tutuluyor; sayfa yenilenince kaybolmasının ana nedeni bu ([scada-v2-runtime.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-v2-runtime.js:92), [scada-v2-runtime.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-v2-runtime.js:108)). En doğru geliştirme, son başarılı snapshot’ı `chrome.storage.local` içine serialize ederek yazmak ve harita açılışında bunu geri yüklemektir. Burada `visibleSummary`, `fetchMeta`, `lastTransport`, `currentScope`, `lastDataTimestamp` ve seçili metrik birlikte saklanmalıdır; kullanıcı ilk açılışta “önbellekten yüklendi” etiketi görmelidir.
- `Depolama mimarisi iki katmanlı olmalı:` Kısa süreli son durum için `chrome.storage.local`, uzun geçmiş için `IndexedDB` kullanılmalı. Çünkü uzantı zaten prefs, bara set cache ve popup CSV snapshot’larını `chrome.storage.local` ile yönetiyor; bu desen mevcut kodla uyumlu ([map-modern.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/map-modern.js:281), [map-modern.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/map-modern.js:629), [popup.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/popup.js:142), [popup.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/popup.js:417)). `Map` nesneleri doğrudan yazılamayacağı için JSON dostu dizi/obje formatına çeviren ayrı bir serializer katmanı eklenmelidir.
- `Geçmişe dönük gerçek SCADA sorgusu:` Bu öneri bugün de tamamen geçerli ve mevcut mimariye uygundur. Çünkü payload katmanı zaten `measurementIds[]`, `elementNames[]` ve `timeRange` destekliyor; runtime da görünür scope’tan sorgu üretiyor, background da bunu taşımaya hazır ([scada-common.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-common.js:48), [background.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/background.js:42), [scada-v2-runtime.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-v2-runtime.js:1670)). İleri aşamada hat/trafo/gerilim popup’ına “Kaynak Geçmişi” aksiyonu eklenmeli; preset aralıklar `1 saat`, `6 saat`, `24 saat`, `7 gün` ve özel aralık olmalıdır.
- `Oturum grafiği ile kaynak geçmişi ayrılmalı:` Bugünkü grafik modalı session history çizdiği için kullanıcı bunu gerçek kaynak geçmişi sanabiliyor. İleride iki mod açıkça ayrılmalıdır: `Oturum Geçmişi` mevcut hafif grafik olarak kalmalı, `Kaynak Geçmişi` ise Superset’ten ayrı sorgu çekmelidir. Bu ayrım hem UX’i temizler hem debug sırasında “elde vardı ama yenilemede kayboldu” karmaşasını azaltır.
- `Arka plan yenileme page-scoped kalmamalı:` Mevcut scheduler sayfa açıkken iyi çalışıyor, ama harita tamamen kapalıyken veri üretmiyor. Manifest’te `alarms` izni zaten var, fakat kullanım yok; bu nedenle bir sonraki doğru adım background tabanlı `chrome.alarms` scheduler’dır ([manifest.json](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/manifest.json:12)). Background son snapshot’ı storage’a yazmalı, açık harita sekmeleri bunu okuyup render etmelidir.
- `SCADA fetch kontratı tekilleştirilmeli:` Şu an query payload builder hem ortak katmanda hem background tarafında bulunuyor; bu ileride drift riski yaratır ([scada-common.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-common.js:48), [background.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/background.js:428)). README’ye ileri geliştirme olarak “SCADA query contract tek kaynaklı hale getirilecek, background yalnız taşıma/auth katmanı olacak” maddesi eklenmeli.
- `Kalıcı audit ve karşılaştırma katmanı:` Runtime bugün candidate detaylarını, seçim nedenini ve eşleşme debug alanlarını üretiyor; bu güçlü temel korunmalı ([scada-v2-runtime.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-v2-runtime.js:1352), [scada-v2-runtime.js](C:/yazilim_projeler/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1/scada-v2-runtime.js:2380)). Gelecekte son 10-20 fetch için audit özetleri saklanmalı; kullanıcı “hangi hat neden unmatched/uyarılı/bayat oldu”yu zaman içinde karşılaştırabilmelidir.
- `Alias override ve manuel düzeltme tablosu:` Bugünkü runtime, hat yönü ve eşleşme için aday detaylarını üretiyor; bu yüzden artık eksik olan şey yeni heuristik değil, kontrollü override katmanıdır. Özellikle sık tekrarlayan `bara adı`, `TM alias`, `ölçüm terminali` ve `kurumsal kısa kod` uyuşmazlıkları için repo-tracked küçük bir override tablosu eklenmesi, builder ve runtime kalitesini sahaya uygun şekilde artırır.
- `Açılış deneyimi ve veri kaybı kontrolü:` Harita açıldığında önce cache restore, sonra canlı refresh yaklaşımı uygulanmalı. Eğer canlı fetch başarısızsa kullanıcı yine son snapshot’ı görmeli; ama kartta `önbellek`, `gecikmeli`, `bayat` ve `kaynak zamanı` net ayrılmalıdır. Bu geliştirme özellikle sayfa yenilemesi sonrası “veri kayboldu” algısını büyük ölçüde kapatır.
- `Ek öneri:` SCADA history retention bugünkü `HISTORY_MAX = 20` sınırından çıkarılmalı, ama bu yalnız sayıyı büyütmekle çözülmemeli. Oturum içi history kısa tutulmalı; uzun seri ihtiyacı doğrudan IndexedDB veya kaynak sorgu üzerinden çözülmelidir. Aksi halde bellek büyür ama sayfa yenilemesinde veri yine kaybolur.

---

*Son güncelleme: 2026-04-23 · Antigravity AI — kaynak kod doğrulamalı otomatik dokümantasyon*
