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

RGDH İzleme Modülü, popup üzerindeki **RGDH İzleme** butonu ile açılan ayrı izleme ekranıdır.
Bu ekranın amacı, YKS tarafındaki RGDH verisini CSV ve DOM kaynakları ile aynı normalize modele taşımaktır.
Modül hem Konvansiyonel Bara Data hem de RES/GES Bara Data ekranlarını destekler.
Modül tek bara odaklı YKS çekimi yapar; toplu YKS çekimi yerine seçili katalog barası üzerinden ilerler.
Modülün ana ekranı `rgdh-monitor.html`, iş mantığı `rgdh-monitor.js`, YKS transport katmanı `background.js` içindedir.
API URL ve parametre üretimi `rgdh-api-client.js` içinde tutulur.
CSV ayrıştırma `rgdh-csv.js`, normalize model `rgdh-normalizer.js`, günlük özet `rgdh-pivot.js` ile yapılır.
Grafik raporu `rgdh-charts.js`, hata ve network kayıtları `rgdh-diagnostics.js` tarafından desteklenir.
YKS sayfası ile köprü kuran kısım `rgdh-dom-bridge.js` dosyasında toplanır.
Ekranın dört ana sekmesi vardır: **Ham Data**, **Günlük RGDH İzleme**, **RGDH Grafik Rapor**, **RGDH Testleri**.
Bu dört sekme aynı veri havuzunu okur.
Veri havuzunda API satırları, CSV satırları ve DOM fallback satırları ayrı tutulur.
Sekmelerde gösterilen tablolar, üst filtrelerin sonucuna göre yeniden hesaplanır.
Üst filtreler tarih, bitiş tarihi, veri tipi ve bara seçimi alanlarından oluşur.
Veri tipi `Tümü`, `Konvansiyonel` veya `RES/GES` olabilir.
Tarih alanı İstanbul yerel günü kabul eder.
Bitiş tarihi seçilirse aralık bitiş tarihi hariç olacak şekilde okunur.
Bara seçimi katalogdan gelen tekil bara özetleri ile doldurulur.
YKS çekimi için katalogdan bara seçmek zorunludur.
CSV yükleme ise bir veya daha fazla dosyayı aynı oturum veri havuzuna ekler.

### Ana Kavramlar

- `API satırı`: YKS endpointlerinden dönen ham JSON satırıdır.
- `CSV satırı`: YKS dışa aktarım CSV dosyasından ayrıştırılan satırdır.
- `DOM satırı`: API erişimi başarısız olduğunda YKS ekran tablosundan okunabilen sınırlı satırdır.
- `Normalize satır`: API, CSV veya DOM satırının ortak RGDH modeline dönüştürülmüş halidir.
- `Katalog satırı`: Bara/Ünite Tanımlama CSV'sinden veya gömülü katalogdan gelen tanım satırıdır.
- `Bara özeti`: Aynı bara altındaki ünitelerin gruplanmış katalog görünümüdür.
- `İç bara ID`: YKS API'nin `busbarId.equals` parametresinde beklediği ID'dir.
- `Görünen bara ID`: YKS ekranında veya katalogda kullanıcıya görünen bara numarasıdır.
- `Hibrit yardımcı kaynak`: RES/GES barasında ana kaynak yanında yardımcı GES veya yardımcı ünite bulunmasıdır.
- `Job`: Uzun YKS çekimini background service worker içinde yürüten izleme işidir.
- `Row chunk`: Büyük cevaplarda satırların status yanıtı yerine parça parça taşınmasıdır.
- `Partial error`: Bazı saatler veya aday ID'ler başarısız olsa bile işin tamamen düşmemesi için saklanan uyarıdır.
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
- `CSV Yükle` butonu YKS CSV dosyalarını veya katalog CSV'sini okur.
- `Gerilim Kaynaklarını Göster` butonu gerilim kolonlarını görünür yapar.
- `Karşılaştır` butonu API ve CSV normalize satırlarını karşılaştırır.
- `CSV Dışarı Aktar` butonu mevcut normalize görünümü dışa aktarır.
- `Hata Detayları` butonu hata panelini açar.
- Hata panelinde hem yerel hata listesi hem de network/console diagnostikleri bulunur.
- `YKS Çekim Detayları` paneli her job sırasında otomatik açılır.

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
- Saat hücreleri ilgili saatteki dakika bazlı katılım yüzdesini gösterir.
- Beklenen dakika sayısı normal durumda 60 dakikadır.
- Başarılı dakika sayısı onay, yükümlülük ve veri kalitesine göre hesaplanır.
- Katılım yüzdesi `successMinuteCount / expectedMinuteCount` üzerinden üretilir.
- Hücre rengi `participationClass` sonucuna göre atanır.
- Yeterli veri varsa hücre yeşil sınıfa yakın görünür.
- Eksik veya uyarılı veri varsa hücre uyarı sınıfına düşer.
- Başarısız veya çok eksik veri varsa hücre kırmızı sınıfa düşer.
- Veri yoksa hücre `-` gösterir.
- Hücre tooltip bilgisinde saat, katılım, set gerilimi, canlı gerilim, P, Q ve başarılı dakika sayısı bulunur.
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
- Ana grafik P, Q, limit ve gerilim serilerini satır içeriğine göre oluşturur.
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

### Sekme 4: RGDH Testleri

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
- Hibrit yardımcı RES/GES için job timeout değeri 180 saniyeye çıkarılır.
- Normal işler için job timeout değeri 60 saniye civarında tutulur.
- Payload `RGDH_DOM_BRIDGE.startRgdhFetchJob()` üzerinden background'a gönderilir.
- Eski köprü yoksa doğrudan request yolu kullanılabilir.
- Background job ID döndürür.
- UI her saniye `getRgdhFetchJobStatus(jobId)` ile durumu poll eder.
- Status içinde loglar taşınır.
- Status tamamlandığında satırlar doğrudan status içinde taşınmaz.
- Büyük satırlar için `getRgdhFetchRows(jobId, kind, offset, limit)` çağrıları yapılır.
- UI `conventionalRows`, `windRows` ve `domRows` parçalarını hydrate eder.
- Gelen API satırları normalizer'dan geçirilir.
- Normalize edilen satırlar katalog bilgisiyle zenginleştirilir.
- Ekran istatistikleri ve sekmeler yeniden render edilir.
- Partial error varsa iş tamamen başarısız sayılmayabilir.
- Partial error kullanıcıya hata panelinde ve fetch log panelinde gösterilir.
- API satırı gelmediyse durum `YKS çekimi başarısız: kayıt yok` mesajına dönebilir.

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

### Endpoint ve Parametre Üretimi

- Konvansiyonel veri endpointi `/api/rgdh-conventional-busbar-data` yoludur.
- RES/GES veri endpointi `/api/rgdh-wind-busbar-data` yoludur.
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
- Hibrit işlerde job timeout 180 saniyeye kadar uzatılır.
- Hibrit işlerde aday ID sıralaması daha dikkatli yürütülür.
- İlk aday genellikle YKS iç bara ID değeridir.
- Ek aday olarak görünen bara ID denenebilir.
- Display ID fallback öncesinde probe istekleri çalışabilir.
- Probe saatleri veri çıkma ihtimali yüksek saatlerden seçilir.
- Amaç yanlış ID ile 24 saat beklememektir.

### Hibrit Page'siz Range Fallback

- Hibrit yardımcı RES/GES baralarda YKS backend bazı saatlik `page=0` isteklerde timeout verebilir.
- AKYEL-1 RES incelemesinde aynı iç ID ile YKS ekranındaki geniş aralık isteğinin çalıştığı görülmüştür.
- Bu nedenle hibrit özel fallback YKS ekranının request şekline yaklaşır.
- Saatlik isteklerin tamamı timeout olursa page'siz range fallback devreye girer.
- Fallback fonksiyonu `fetchRgdhWindBusbarByYksUiRange()` adını taşır.
- Parametre üretimi `buildWindRangeParams()` ile yapılır.
- Üretilen query içinde `measurementDate.greaterOrEqualThan` bulunur.
- Üretilen query içinde `measurementDate.lessThan` bulunur.
- Üretilen query içinde `busbarId.equals` bulunur.
- Üretilen query içinde `size=60` bulunur.
- Üretilen query içinde `sort=measurementDate,asc` bulunur.
- Üretilen query içinde `page` bulunmaz.
- Bu fark bilerek korunur.
- Başlangıç cursor değeri normalde yerel gün başlangıcının UTC karşılığıdır.
- Bitiş değeri normalde yerel gün bitişinin UTC karşılığıdır.
- Bugün çekiliyorsa bitiş gün sonu yerine mevcut zamana kadar kısaltılabilir.
- İlk range isteği en geniş gerekli aralığı ister.
- Cevap 60 satırdan azsa çekim tamamlanmış kabul edilir.
- Cevap tam 60 satırsa daha fazla veri olabileceği varsayılır.
- Tam sayfa cevabında son satırın `measurementDate` alanı okunur.
- Cursor son ölçüm zamanının bir dakika sonrasına taşınır.
- Yeni istek aynı bitiş zamanına kadar tekrar gönderilir.
- Cursor ilerlemiyorsa döngü güvenli şekilde kırılır.
- Maksimum request sayısı limitlidir.
- Page timeout değeri job deadline bütçesini aşmayacak şekilde clamp edilir.
- Deadline biterse `YKS_JOB_TIMEOUT` partial error üretilir.
- Fallback başarılı olursa saatlik timeout hatası nihai hataya dönüştürülmez.
- Fallback loglarında `fallbackPhase=hybrid-yks-ui-range` bulunur.
- Fallback loglarında `requestUrl` bulunur.
- Fallback request URL içinde `page=` görülmemelidir.
- Fallback request başlangıcı AKYEL-1 örneğinde `2026-04-30T21:00:00Z` olmalıdır.
- Fallback başarı ölçütü `apiRows > 0` olmasıdır.
- Fallback sonrası job final hatası `YKS_HOURLY_TIMEOUT` olmamalıdır.

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
- Hibrit işlerde görünen ID de ek aday olarak değerlendirilebilir.
- Başarılı fallback ID cache'e yazılabilir.
- Cache sonraki çekimlerde tekrar çözümleme maliyetini azaltır.
- Loglarda `resolverMethod` ve `resolverPageCount` alanları bulunabilir.
- Loglarda `displayBusbarId`, `resolvedInternalBusbarId` ve `candidateBusbarId` ayrımı önemlidir.
- İç ID yanlışsa genellikle HTTP 200 ama 0 satır veya tüm saatlerde boş sonuç görülür.
- İç ID doğru ama request şekli sorunluysa saatlik timeout ve page'siz range başarı paterni görülür.

### Normalizasyon

- Konvansiyonel API satırları `normalizeConventionalApiRow()` ile işlenir.
- RES/GES API satırları `normalizeWindApiRow()` ile işlenir.
- CSV parse sonucu `normalizeCsvParseResult()` ile ortak modele çevrilir.
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
- Karşılaştırma işlemi API ve CSV satırları arasında toleranslı alan farkı üretir.

### CSV Kullanımı

- `CSV Yükle` birden fazla dosya kabul eder.
- Bara/Ünite Tanımlama CSV'si katalog olarak algılanır.
- Konvansiyonel RGDH CSV'si ölçüm satırı olarak algılanır.
- RES/GES RGDH CSV'si ölçüm satırı olarak algılanır.
- CSV tipi tanınamazsa hata paneline yazılır.
- Katalog CSV'si yüklenirse mevcut katalog satırlarıyla birleştirilir.
- Ölçüm CSV'si yüklenirse `state.csvRows` içine normalize edilerek eklenir.
- CSV satırları API satırlarıyla aynı sekmelerde gösterilir.
- CSV satırları `CSV` kaynak rozetiyle ayrılır.
- Karşılaştırma butonu API ve CSV verisini aynı normalize model üzerinden kıyaslar.
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
- `MISSING_BUSBAR_SELECTION` tekli bara seçimi yapılmadığını gösterir.
- `NO_NORMALIZED_ROWS` fetch tamamlandığı halde normalize satır oluşmadığını gösterir.
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
- Fetch log panelinde saatlik istekler izlenir.
- Eğer saatlik istekler timeout olursa hibrit range fallback beklenir.
- Başarılı hibrit fallback logunda `fallbackPhase=hybrid-yks-ui-range` görülür.
- Başarılı hibrit fallback request URL içinde `page=` olmamalıdır.
- Başarılı hibrit fallback başlangıcı `2026-04-30T21:00:00Z` olmalıdır.
- Başarılı sonuçta Ham Data sekmesinde API satırları görünmelidir.
- Başarılı sonuçta Günlük RGDH sekmesinde ilgili saatler dolmalıdır.
- Başarılı sonuçta final hata `YKS_HOURLY_TIMEOUT` olmamalıdır.
- Hata devam ederse Hata Detayları CSV'si indirilmelidir.
- CSV'de `selectedBusbar`, `internalBusbarId`, `candidateBusbarId` ve `requestUrl` kolonları kontrol edilmelidir.
- YKS Network panelinde çalışan request ile eklenti request URL'si karşılaştırılmalıdır.

### Bakım ve Test Referansları

- RGDH background davranışları `tests/background.test.js` ile korunur.
- API parametre üretimi `tests/rgdh-api-client.test.js` ile korunur.
- Normalizer davranışları `tests/rgdh-normalizer.test.js` ile korunur.
- Grafik davranışları `tests/rgdh-charts.test.js` ile korunur.
- UI smoke kontrolleri `tests/rgdh-ui-smoke.test.js` ile korunur.
- Diagnostik export davranışları `tests/rgdh-diagnostics.test.js` ile korunur.
- Tam test paketi `npm test` ile çalışır.
- Eklenti paketi `npm run build:extension` ile üretilir.
- Paket smoke kontrolü `npm run smoke:extension` ile yapılır.
- Hibrit range fallback için özel testlerde page'siz request ve cursor ilerleme doğrulanır.
- String `"true"` gelen `hasAuxiliarySource` değeri testlerle hibrit kabul edilir.
- Bu bölüm güncellenirken gerçek kod davranışı ile README anlatımı birlikte tutulmalıdır.

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
