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

Popup üzerindeki **RGDH İzleme** butonu ile açılan modül; Konvansiyonel Bara Data ve RES/GES Bara Data verilerini YKS API, CSV veya DOM kaynaklarından ortak normalize modele dönüştürür. Ham Data, Günlük RGDH İzleme, RGDH Grafik Rapor ve RGDH Testleri sekmeleri aynı normalize veri üzerinden çalışır.

Bara/Ünite Tanımlama CSV'si katalog olarak algılanır; santral, bara ve ünite combobox'ları bu katalogdan beslenir. RES/GES API çağrılarında `busbarId.equals` değeri katalog, yüklenen dosya adı veya YKS sayfasındaki seçimlerden çözümlenir. YKS'den çekme paneli, direct/page-context/DOM fallback adımlarını ve satır sayılarını kullanıcıya detaylı log olarak gösterir.

Modül kullanıcı oturum bilgisi saklamaz. Bearer token, cookie, Authorization header veya kullanıcı kimliği console'a, storage'a, fixture'a ya da rapora yazılmaz. YKS oturumu açıksa önce yetkili API erişimi denenir; başarısız olursa whitelisted page-context fetch ve kısmi DOM fallback kullanılır.

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
- Popup/extension adı güncellendi: **`SCADA/YTBS/TPYS/ Haritalar ve Otomasyon`**. Popup kart sırası yeniden düzenlendi; `Haritada Göster` ayrı üst karta taşındı.


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
