# RGDH İzleme Modülü — IDE Agent Uygulama Planı

## 0. Amaç ve Kapsam

Bu doküman, mevcut `README.md` ile tanımlanan Chrome Extension Manifest V3 tabanlı projeye yeni bir **RGDH İzleme** modülünün eklenmesi için IDE agent tarafından uygulanacak ayrıntılı teknik planı içerir.

Yeni modülün hedefi:

- Yan Hizmetler Analiz Platformu / YKS üzerinde yer alan **RGDH İzleme** verilerini doğrulamak,
- **Konvansiyonel Bara Data** ve **RES/GES Bara Data** verilerini aynı ekranda normalize etmek,
- Kullanıcı oturum açmışsa yetkili platform API verilerini çekmek,
- Gerekirse DOM tablosu veya CSV export dosyalarını yedek/doğrulama kaynağı olarak kullanmak,
- “Ham Data”, “Günlük RGDH İzleme” ve “RGDH Grafik Rapor” sekmelerini modern, koyu temalı, minimal bir arayüzde sunmak,
- Platformdaki hesapları API/CSV/DOM/veri-modeli karşılaştırmalarıyla kontrol etmek.

Bu geliştirme **mevcut harita/SCADA fonksiyonlarını bozmadan**, ayrı bir extension sayfası olarak eklenecektir.

---

## 1. Mevcut Proje Yapısına Uyum

Mevcut proje yapısı Chrome Extension MV3, vanilla JavaScript, background service worker, popup, content-script, ayrı HTML sayfaları, ortak JS modülleri ve test altyapısı üzerine kuruludur. Yeni RGDH modülü bu yapıya paralel eklenecektir.

### 1.1. Eklenecek Dosyalar

Proje köküne aşağıdaki dosyaları ekle:

```text
rgdh-monitor.html
rgdh-monitor.css
rgdh-monitor.js
rgdh-api-client.js
rgdh-normalizer.js
rgdh-pivot.js
rgdh-charts.js
rgdh-csv.js
rgdh-storage.js
rgdh-dom-bridge.js
```

Test klasörüne ekle:

```text
tests/rgdh-normalizer.test.js
tests/rgdh-pivot.test.js
tests/rgdh-csv.test.js
tests/rgdh-api-client.test.js
tests/rgdh-ui-smoke.test.js
```

Fixture klasörü yoksa oluştur:

```text
fixtures/rgdh/
  conventional_api_sample.json
  wind_api_sample.json
  konvansiyonel_bara_sample.csv
  resges_bara_sample.csv
```

### 1.2. Mevcut Dosyalarda Değişiklik

Aşağıdaki mevcut dosyalara minimum müdahale et:

```text
manifest.json
popup.html
popup.js
background.js
content-script.js
package.json
```

Kural:

- Mevcut harita, SCADA akış ve TPYS otomasyon kodunu bozma.
- Yeni RGDH kodlarını mümkün olduğunca izole tut.
- Ortak yardımcı fonksiyon gerekiyorsa önce mevcut `map-common.js` veya `scada-common.js` içeriğini incele; ama RGDH’ye özel mantığı ayrı modülde tut.

---

## 2. Mimari Hedef

### 2.1. Ana Akış

```text
popup.html
  └─ RGDH İzleme butonu
      └─ chrome.tabs.create(rgdh-monitor.html)
          ├─ Ham Data sekmesi
          ├─ Günlük RGDH İzleme sekmesi
          └─ RGDH Grafik Rapor sekmesi
```

### 2.2. Veri Akışı

```text
Kullanıcı RGDH İzleme sayfasını açar
  ↓
Kullanıcı tarih / veri tipi / bara filtresi seçer
  ↓
"YKS'den Çek" butonu çalışır
  ↓
rgdh-monitor.js → chrome.runtime.sendMessage
  ↓
background.js → rgdh-api-client.js
  ↓
YKS API çağrıları
  ↓
rgdh-normalizer.js
  ↓
rgdh-pivot.js
  ↓
Ham Data / Günlük İzleme / Grafik Rapor UI güncellenir
```

### 2.3. Veri Kaynağı Öncelik Sırası

Uygulamada veri kaynağı önceliği şu sırada olmalıdır:

1. **Yetkili API fetch**: Kullanıcı YKS/Yan Hizmetler Analiz Platformu’nda oturum açmışsa en güvenilir kaynak.
2. **DOM okuma**: API başarısızsa veya ekranda görünen tabloyu doğrulamak gerekiyorsa yedek kaynak.
3. **CSV yükleme**: Platformdan export edilmiş dosyaları karşılaştırma ve offline doğrulama kaynağı.
4. **Fixture/demo veri**: Sadece test ve geliştirme modunda.

---

## 3. Güvenlik ve Oturum Kuralları

### 3.1. Kesin Yasaklar

Aşağıdaki işlemleri yapma:

- Kullanıcı adı/şifre isteme.
- Bearer token’ı koda gömme.
- Authorization header değerini `chrome.storage`, `localStorage`, dosya, console log veya rapor çıktısına yazma.
- Console/network örneklerinde görünen gerçek token değerlerini herhangi bir dosyaya koyma.
- Token yenileme, oturum taklidi veya credential reuse mekanizması geliştirme.
- Platformun yetki sınırını aşacak endpoint keşfi veya brute-force mantığı yazma.

### 3.2. Doğru Oturum Modeli

- Kullanıcı önce normal şekilde `https://yks.teias.gov.tr/` üzerinde oturum açmış kabul edilir.
- Extension yalnızca kullanıcının manuel başlattığı veri çekme işleminde çalışır.
- API çağrılarında mümkünse `credentials: "include"` kullan.
- API Authorization header gerektiriyorsa iki güvenli seçenek uygula:
  1. **Page-context fetch bridge**: Aktif YKS sekmesinde, sayfa bağlamında `window.fetch` ile aynı endpoint çağrısını yaptır. Token okunmaz, saklanmaz, sadece sayfanın zaten yapabildiği fetch çalışır.
  2. **DOM fallback**: API doğrudan extension’dan çalışmıyorsa tablo verisini DOM’dan oku.
- `background.js` hiçbir zaman ham Authorization token değerini kaydetmemeli.

### 3.3. Manifest İzinleri

`manifest.json` için minimum izin yaklaşımı kullan:

```json
{
  "permissions": ["storage", "tabs", "scripting"],
  "host_permissions": ["https://yks.teias.gov.tr/*"]
}
```

`cookies` izni yalnızca gerçekten gerekiyorsa eklenmelidir. Eğer `credentials: "include"` ve page-context bridge yeterliyse `cookies` iznini ekleme.

---

## 4. Popup Entegrasyonu

### 4.1. `popup.html`

Mevcut popup tasarımına aşağıdaki butonu ekle:

```html
<button id="openRgdhMonitor" class="popup-action popup-action-rgdh">
  RGDH İzleme
</button>
```

Buton konumu:

- Harita / SCADA / TPYS aksiyonlarının bulunduğu ana aksiyon bölümünde olmalı.
- Rengi mevcut dark tema ile uyumlu olmalı.
- Sıkışık ama okunabilir tasarım korunmalı.

### 4.2. `popup.js`

Aşağıdaki davranışı ekle:

```javascript
document.getElementById('openRgdhMonitor')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('rgdh-monitor.html') });
});
```

Hata yakalama:

- Buton bulunamazsa sessiz geçme; development modunda console warning ver.
- `chrome.tabs.create` hatasını kullanıcıya küçük popup mesajı olarak göster.

---

## 5. RGDH Sayfası UI Tasarımı

### 5.1. Genel Görsel Standart

`rgdh-monitor.html` orijinal Yan Hizmetler Analiz Platformu’nun koyu, kurumsal ve teknik panel hissine yakın olmalıdır.

Renk paleti:

```css
:root {
  --rgdh-bg: #0b1120;
  --rgdh-panel: #111827;
  --rgdh-panel-2: #172033;
  --rgdh-border: #263246;
  --rgdh-text: #e5e7eb;
  --rgdh-muted: #94a3b8;
  --rgdh-ok: #22c55e;
  --rgdh-warn: #f59e0b;
  --rgdh-error: #ef4444;
  --rgdh-info: #38bdf8;
  --rgdh-passive: #64748b;
  --rgdh-purple: #a855f7;
}
```

Tasarım kuralları:

- Minimal padding: kartlarda 8-10 px, tablo hücrelerinde 4-6 px.
- Büyük boşluk bırakma.
- Sticky üst toolbar.
- Sticky tablo header.
- 24 saatlik tablolarda sticky ilk kolon ve yatay scroll.
- Küçük font ama okunabilir: 12-13 px tablo, 14 px ana metin.
- Kritik durumlar badge ve sol border ile vurgulanmalı.

### 5.2. Sayfa İskeleti

```text
┌──────────────────────────────────────────────────────────────┐
│ RGDH İzleme ve Doğrulama Paneli                              │
│ Yan Hizmetler Analiz Platformu hesap kontrol modülü           │
├──────────────────────────────────────────────────────────────┤
│ Tarih | Veri Tipi | Bara Ara | YTM | Gerilim | Durum          │
│ [YKS'den Çek] [CSV Yükle] [Karşılaştır] [Dışa Aktar]          │
├──────────────────────────────────────────────────────────────┤
│ [Ham Data] [Günlük RGDH İzleme] [RGDH Grafik Rapor]           │
├──────────────────────────────────────────────────────────────┤
│ Aktif sekme içeriği                                           │
└──────────────────────────────────────────────────────────────┘
```

### 5.3. Üst Toolbar Bileşenleri

- Tarih seçici: default bugün, Europe/Istanbul günü.
- Veri tipi: `Tümü`, `Konvansiyonel`, `RES/GES`, `Hibrit`.
- Bara arama: ad veya ID.
- YTM/BYTM filtresi.
- Gerilim seviyesi: `154`, `400`, `Tümü`.
- Durum filtresi: `Tümü`, `Uygun`, `Uyarı`, `Hatalı`, `Veri Yok`.
- Butonlar:
  - `YKS'den Çek`
  - `CSV Yükle`
  - `Karşılaştır`
  - `JSON Dışa Aktar`
  - `CSV Dışa Aktar`

---

## 6. API Entegrasyon Planı

### 6.1. Kullanılacak Endpoint Desenleri

Konvansiyonel bara verisi:

```text
GET /api/rgdh-conventional-busbar-data
  ?measurementDate.greaterOrEqualThan=<UTC_START>
  &measurementDate.lessThan=<UTC_END>
  &size=<SIZE>
  &sort=measurementDate,asc
```

RES/GES bara verisi:

```text
GET /api/rgdh-wind-busbar-data
  ?measurementDate.greaterOrEqualThan=<UTC_START>
  &measurementDate.lessThan=<UTC_END>
  &busbarId.equals=<BUSBAR_INTERNAL_ID>
  &size=<SIZE>
  &sort=measurementDate,asc
```

Genel parametre:

```text
GET /api/general-parameter-by-name
  ?generalParametersMeasurementDate=<UTC_DATETIME>
  &paramName=KONVGERTOL
```

### 6.2. Tarih Dönüşümü

Türkiye günü UTC+3 dikkate alınarak çevrilmeli.

Örnek:

```text
Yerel gün: 2026-04-01 00:00 Europe/Istanbul
UTC start: 2026-03-31T21:00:00Z
UTC end:   2026-04-01T21:00:00Z
```

Fonksiyon:

```javascript
function buildUtcDayRangeForIstanbul(localDate) {
  // localDate: YYYY-MM-DD
  // return { startUtc, endUtc }
}
```

Tarayıcı `Intl.DateTimeFormat` kullanılabilir. Harici timezone kütüphanesi eklenmeyecekse Türkiye sabit UTC+3 kabul edilebilir; fakat fonksiyon testlenmelidir.

### 6.3. Pagination

Konvansiyonel ve RES/GES endpoint cevaplarında `link` ve `x-total-count` header’ları dikkate alınmalı.

Fonksiyon:

```javascript
async function fetchAllPages(baseUrl, params, options) {
  const rows = [];
  let page = 0;
  let lastPage = null;
  while (lastPage === null || page <= lastPage) {
    const response = await fetchPage(baseUrl, { ...params, page });
    rows.push(...await response.json());
    lastPage = parseLastPageFromLinkHeader(response.headers.get('link'));
    if (lastPage === null && rows.length >= Number(response.headers.get('x-total-count') || 0)) break;
    page += 1;
  }
  return rows;
}
```

### 6.4. RES/GES İçin 500 Hata Stratejisi

RES/GES endpoint’i bazı filtresiz çağrılarda 500 dönebildiği için şu strateji uygulanmalı:

1. Eğer kullanıcı bara seçtiyse `busbarId.equals` ile çek.
2. Kullanıcı tüm RES/GES isterse önce DOM’daki select seçeneklerinden veya daha önce cache’lenen busbar listesinden bara ID listesini çıkar.
3. Her bara için ayrı endpoint çağrısı yap.
4. Hata alan baraları `partialErrors` listesine ekle.
5. Kullanıcıya “bazı baralar çekilemedi” uyarısı göster.

### 6.5. Oturum Kontrolü

Fonksiyon:

```javascript
async function checkYksSession() {
  // Önce hafif bir endpoint denenir.
  // 200 ise OK.
  // 401/403 ise oturum yok.
  // 500 ise endpoint kaynaklı hata olabilir, oturum yok varsayma.
}
```

UI mesajları:

- 200: `YKS oturumu aktif.`
- 401/403: `YKS oturumu bulunamadı. Lütfen YKS sekmesinde giriş yapın.`
- Network: `YKS ağına erişilemiyor veya kurum içi bağlantı yok.`
- 500: `Endpoint hata döndürdü. Filtre daraltılarak tekrar denenecek.`

---

## 7. Page-context Fetch Bridge

### 7.1. Neden Gerekli?

Bazı YKS endpoint’leri Authorization header ile çalışabilir. Extension context doğrudan bu header’a sahip olmayabilir. Güvenli yöntem token okumak değil, kullanıcının açık YKS sayfasında aynı origin fetch’i çalıştırmaktır.

### 7.2. Uygulama Prensibi

`content-script.js` içine RGDH için mesaj dinleyici ekle:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'RGDH_PAGE_FETCH') {
    // sayfa bağlamına script inject et
  }
});
```

Inject edilen script:

- Sadece izin verilen endpoint path’lerine istek atmalı.
- Token okumamalı.
- Header dump etmemeli.
- Response JSON’u `window.postMessage` ile content-script’e göndermeli.
- Content-script sonucu background/monitor sayfasına iletmeli.

Whitelist:

```javascript
const ALLOWED_RGDH_PATHS = [
  '/api/rgdh-conventional-busbar-data',
  '/api/rgdh-wind-busbar-data',
  '/api/general-parameter-by-name'
];
```

### 7.3. Güvenlik Filtreleri

- Path whitelist dışında istek yasak.
- Method sadece `GET`.
- Body yasak.
- Response boyutu limiti koy: örn. 30 MB.
- Hata durumunda token/header bilgisi döndürme.

---

## 8. DOM Fallback Planı

### 8.1. DOM Okuma Hedefleri

Aşağıdaki sayfalar okunabilir olmalı:

- `#/rgdh-conventional-busbar-data`
- `#/rgdh-wind-busbar-data`
- `#/analogchart-busbar-data`
- `#/rgdh-busbar-participant`

### 8.2. DOM Selector Stratejisi

Selector’lar kırılgan olabileceği için şu sırayla dene:

1. Semantik başlık metni: `Konvansiyonel Bara Data`, `RES/GES Bara Data`, `RGDH Grafik Rapor`, `Günlük RGDH Busbar İzleme`.
2. Angular route fragment.
3. Tablo `thead` başlıkları.
4. Fallback CSS selector.

### 8.3. Sanal Scroll Riski

DOM’da yalnızca görünen satırlar olabilir. Bu durumda UI’da kaynak etiketi şu olmalı:

```text
DOM-PARTIAL
```

ve kullanıcıya şu uyarı gösterilmeli:

```text
Bu veri DOM üzerinden okunmuştur; tabloda sanal scroll/pagination varsa tüm kayıtları içermeyebilir. API veya CSV ile doğrulama önerilir.
```

---

## 9. CSV Yükleme ve Normalize Planı

### 9.1. CSV Kaynakları

Desteklenecek dosya tipleri:

- Konvansiyonel Bara Veri CSV
- RES/GES Bara Veri CSV

Dosyalar `;` ayracıyla gelebilir. Ondalık değerler Türkçe biçimde virgüllü olabilir.

### 9.2. Parser Kuralları

`rgdh-csv.js` fonksiyonları:

```javascript
parseSemicolonCsv(text)
parseTurkishNumber(value)
normalizeCsvHeader(header)
detectRgdhCsvType(headers, firstRows)
normalizeConventionalCsvRow(row)
normalizeWindCsvRow(row)
```

Sayı dönüşümü:

```text
"409,51" → 409.51
"-0,95" → -0.95
""       → null
"-"      → null
"null"   → null
```

### 9.3. CSV Karşılaştırma

Karşılaştırma anahtarı:

```text
sourceType + busbarId + measurementDateLocalMinute
```

Karşılaştırılacak alanlar:

- `liveBusbarVoltage`
- `tpysVoltageSet`
- `pgenMw`
- `qgenMvar`
- `diMvarLimit`
- `aiMvarLimit`
- `voltageApprove`
- `diMvarApprove`
- `aiMvarApprove`
- `approvalStatus`

Toleranslar:

```javascript
const RGDH_COMPARE_TOLERANCE = {
  voltageKv: 0.01,
  mw: 0.01,
  mvar: 0.01,
  ratio: 0.0001
};
```

---

## 10. Ortak Veri Modeli

Tüm kaynaklar aşağıdaki modele dönüştürülmelidir:

```javascript
{
  id: 'CONVENTIONAL:5532:2026-04-01T00:00:00+03:00',
  sourceOrigin: 'API' | 'CSV' | 'DOM' | 'API+CSV_COMPARE',
  sourceType: 'CONVENTIONAL' | 'WIND' | 'SOLAR' | 'HYBRID',

  measurementDateUtc: '2026-03-31T21:00:00Z',
  measurementDateLocal: '2026-04-01T00:00:00+03:00',
  localDate: '2026-04-01',
  localHour: 0,
  localMinute: 0,

  ytm: 'OA_YTM',
  city: 'KIRIKKALE',

  busbarInternalId: 9333006401,
  busbarId: 5532,
  busbarName: 'ACWA KIRIKKALE DGKÇ',
  plantName: 'ACWA KIRIKKALE',
  voltageLevel: 400,

  tpysVoltageSet: 404,
  tpysVoltageDrop: null,
  liveBusbarVoltage: 409.51,
  busbarUpperLimit: null,
  busbarLowerLimit: null,

  pnomMw: 927.4,
  pmkudMw: 460,
  minMkudMw: 217,
  pgenMw: 0.42,
  qgenMvar: -0.51,

  auxiliaryMw: null,
  auxiliaryMvar: null,

  diMvarLimit: null,
  aiMvarLimit: null,

  serviceActive: true,
  offBoardStatus: 1,
  noObligationStatus: 1,

  voltageApprove: null,
  diMvarApprove: null,
  aiMvarApprove: null,
  approvalStatus: null,

  flags: {
    voltageOutOfBand: false,
    qOutOfLimit: false,
    missingCriticalValue: false,
    platformMismatch: false,
    partialSource: false
  },

  raw: {}
}
```

---

## 11. Normalizasyon Kuralları

### 11.1. Konvansiyonel API Alan Haritası

```text
measurementDate              → measurementDateUtc
busbar.id                    → busbarInternalId
busbar.busbarId              → busbarId
busbar.busbarName            → busbarName
busbar.plantName             → plantName
busbar.busbarType            → sourceType
busbar.city                  → city
busbar.distributionCenter    → ytm
busbar.voltageLevel          → voltageLevel
mainBusbarVoltage            → liveBusbarVoltage
tpysNomBusVolt               → tpysVoltageSet
pnom                         → pnomMw
sumPmukd                     → pmkudMw
minMkud                      → minMkudMw
sumPgenActive                → pgenMw
sumPgenReactive              → qgenMvar
sumDIMvarLimit               → diMvarLimit
sumAIMvarLimit               → aiMvarLimit
typsService                  → serviceActive
rgdhOffBoardStatus           → offBoardStatus
noObligationStatus           → noObligationStatus
busbarSetToleranceApprove    → voltageApprove
diMvarApprove                → diMvarApprove
aiMvarApprove                → aiMvarApprove
approvalStatus               → approvalStatus
```

### 11.2. RES/GES API Alan Haritası

```text
measurementDate              → measurementDateUtc
busbar.id                    → busbarInternalId
busbar.busbarId              → busbarId
busbar.busbarName            → busbarName
busbar.plantName             → plantName
busbar.busbarType            → sourceType WIND/HYBRID
busbar.city                  → city
busbar.distributionCenter    → ytm
busbar.voltageLevel          → voltageLevel
mainBusbarVoltage            → liveBusbarVoltage
tpysBusVoltSet               → tpysVoltageSet
tpysBusVoltDrop              → tpysVoltageDrop
pnom                         → pnomMw
sumPmukd                     → pmkudMw
sumPgenActive                → pgenMw
sumPgenReactive              → qgenMvar
auxiliarySource              → auxiliaryMw
auxiliarySourceReactive      → auxiliaryMvar
sumDIMvarLimit               → diMvarLimit
sumAIMvarLimit               → aiMvarLimit
typsService                  → serviceActive
rgdhOffBoardStatus           → offBoardStatus
noObligationStatus           → noObligationStatus
diMvarApprove                → diMvarApprove
aiMvarApprove                → aiMvarApprove
approvalStatus               → approvalStatus
```

### 11.3. Hibrit Tespiti

`sourceType = HYBRID` şu koşullardan biri varsa atanabilir:

- `auxiliarySource` veya `auxiliarySourceReactive` null değilse,
- `busbar.auxiliaryWindUnitList` doluysa,
- `busbar.auxiliaryConventionalUnitList` doluysa,
- ana kaynak RES/GES iken yardımcı kaynak GES/konvansiyonel varsa.

---

## 12. Ham Data Sekmesi

### 12.1. Amaç

Konvansiyonel ve RES/GES ham verilerini aynı tabloda, ortak kolonlarla ve bara bazlı olarak göstermek.

### 12.2. Tablo Kolon Grupları

```text
Kimlik:
  Kaynak, Tarih-Saat, Veri Tipi, YTM, İl, Bara ID, Bara Adı, Santral

Gerilim:
  TPYS Set, Droop, Canlı Bara, Alt Limit, Üst Limit, Bara-1, Bara-2, Bara-3

Güç:
  Pnom, PMKÜD, MinMKÜD, Pgen MW, Qgen MVAr

Yardımcı Kaynak:
  Yardımcı MW, Yardımcı MVAr, Yardımcı Onay

Limit:
  D.İ. Limit, A.İ. Limit

Durum:
  Hizmet, Devre Dışı, Yükümlülük, Ünite/Trafo Durumu

Onay:
  Bara Set, D.İ., A.İ., Nihai Onay

Kalite:
  Veri Tamlığı, Kaynak, Fark Durumu
```

### 12.3. Renklendirme

```text
OK          → yeşil badge / sol border
WARN        → amber badge
FAIL        → kırmızı badge
NO_DATA     → gri badge
DOM-PARTIAL → amber outline
API         → mavi badge
CSV         → gri badge
MISMATCH    → mor/kırmızı badge
HYBRID      → cyan badge
```

### 12.4. Kullanıcı Aksiyonları

- Sırala.
- Filtrele.
- Sadece hatalıları göster.
- Satır detay modalı aç.
- Raw JSON görüntüle, fakat header/token gösterme.
- Satır CSV olarak dışa aktar.

---

## 13. Günlük RGDH İzleme Sekmesi

### 13.1. Amaç

Dakikalık veriyi saatlik ve günlük izleme sonucuna dönüştürmek. 24 saat kolon formatı zorunludur.

### 13.2. Pivot Yapısı

Satırlar:

```text
Bara ID
Bara Adı
Kaynak Tipi
Kontrol Türü
```

Kolonlar:

```text
00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 | Günlük Özet
```

Kontrol türleri:

```text
Gerilim Set Kontrolü
Düşük İkaz MVAr Kontrolü
Aşırı İkaz MVAr Kontrolü
Aktif Güç / Yükümlülük Kontrolü
Devre Durumu
Yardımcı Kaynak Kontrolü
Nihai RGDH Onay Durumu
Veri Tamlığı
```

### 13.3. Saatlik Karar Algoritması

```javascript
function buildHourlyStatus(rowsForHour) {
  const expected = 60;
  const valid = countValid(rowsForHour);
  const fail = countFail(rowsForHour);
  const warn = countWarn(rowsForHour);

  if (valid === 0) return 'NO_DATA';
  if (allOff(rowsForHour)) return 'OFF';
  if (fail / valid > 0.10) return 'FAIL';
  if (fail > 0 || warn > 0 || valid < expected) return 'WARN';
  return 'OK';
}
```

Bu eşikler ayarlanabilir olmalı:

```javascript
const RGDH_HOURLY_RULES = {
  expectedMinuteCount: 60,
  failRatioForFail: 0.10,
  minAvailabilityForOk: 0.98
};
```

### 13.4. Günlük Özet

Her bara için hesapla:

```text
Beklenen kayıt
Gelen kayıt
Veri tamlık %
OK saat sayısı
WARN saat sayısı
FAIL saat sayısı
NO_DATA saat sayısı
OFF saat sayısı
En problemli saat
En yüksek gerilim sapması
En yüksek MVAr limit aşımı
Günlük uygunluk %
```

---

## 14. RGDH Grafik Rapor Sekmesi

### 14.1. Grafikler

En az aşağıdaki grafikler olmalı:

1. **Gerilim Zaman Grafiği**
   - Canlı bara gerilimi
   - TPYS set
   - Alt/üst limit bandı

2. **Aktif Güç Grafiği**
   - Pgen MW
   - PMKÜD
   - MinMKÜD
   - Pnom referans

3. **Reaktif Güç Grafiği**
   - Qgen MVAr
   - D.İ. limit
   - A.İ. limit

4. **Onay Durumu Timeline**
   - Bara set onay
   - D.İ. onay
   - A.İ. onay
   - Nihai onay

5. **24 Saat Isı Haritası**
   - Satır: bara
   - Kolon: saat
   - Renk: OK/WARN/FAIL/NO_DATA/OFF

### 14.2. Grafik Teknolojisi

Öncelik:

1. Native SVG: Mevcut proje yaklaşımıyla uyumlu.
2. Chart.js: Eğer projede zaten varsa veya hızlı prototip gerekiyorsa.
3. Yeni ağır kütüphane ekleme.

### 14.3. Grafik Filtreleri

- Bara seçimi.
- Saatlik/dakikalık çözünürlük.
- Sadece uygunsuz saatler.
- Limit çizgilerini göster/gizle.
- API/CSV farklarını göster/gizle.

---

## 15. Hesap ve Doğrulama Mantığı

### 15.1. Temel Hesaplar

```javascript
voltageDelta = liveBusbarVoltage - tpysVoltageSet;
voltageDeltaPct = voltageDelta / tpysVoltageSet;
isVoltageHigh = liveBusbarVoltage > busbarUpperLimit;
isVoltageLow = liveBusbarVoltage < busbarLowerLimit;
isQUnderLimit = diMvarLimit !== null && qgenMvar < diMvarLimit;
isQOverLimit = aiMvarLimit !== null && qgenMvar > aiMvarLimit;
pgenPct = pnomMw ? pgenMw / pnomMw : null;
isBelowPmkud = pmkudMw !== null && pgenMw < pmkudMw;
```

### 15.2. Platform Onayıyla Karşılaştırma

```javascript
computedStatus = computeRgdhStatus(row);
platformStatus = row.approvalStatus;
row.flags.platformMismatch = computedStatus !== null && platformStatus !== null && computedStatus !== platformStatus;
```

Not:

- İlk sürümde platformun tüm mevzuat/algoritma ayrıntılarını yeniden yazmak yerine, API/CSV/platform onay alanları ile yeniden hesaplanan temel kontroller karşılaştırılmalıdır.
- Algoritma ayrıntıları kesinleştikçe `computeRgdhStatus` genişletilebilir.

---

## 16. Storage ve Cache Planı

### 16.1. Saklanacak Veriler

`chrome.storage.local` içine yalnızca aşağıdakileri yaz:

```javascript
{
  rgdhLastFilters: {},
  rgdhLastSummary: {},
  rgdhUserPreferences: {
    theme: 'dark',
    pageSize: 100,
    defaultDateMode: 'today'
  }
}
```

### 16.2. Saklanmayacak Veriler

- Authorization header.
- Bearer token.
- Cookie değeri.
- Kullanıcı adı/şifre.
- Tam ham response büyük veri setleri.

### 16.3. Büyük Veri Yönetimi

- Büyük ham veri bellekte tutulur.
- Kullanıcı isterse JSON/CSV olarak dışa aktarılır.
- Storage’a sadece özet ve filtreler yazılır.

---

## 17. Hata Yönetimi

### 17.1. Kullanıcı Mesajları

```text
YKS oturumu bulunamadı. Lütfen YKS sayfasında giriş yapın ve tekrar deneyin.
YKS ağına erişilemiyor. Kurum ağı/VPN bağlantısını kontrol edin.
RES/GES verisi tüm sistem için alınamadı; bara bazlı çekim deneniyor.
Bazı baralar çekilemedi. Detaylar hata panelinde listelenmiştir.
CSV formatı tanınamadı. Konvansiyonel veya RES/GES Bara Veri export dosyası yükleyin.
DOM verisi kısmi olabilir; API/CSV ile doğrulama önerilir.
```

### 17.2. Hata Paneli

Sağ üstte küçük “Hata Detayları” butonu olsun. İçerik:

- Zaman.
- Kaynak.
- Endpoint path.
- HTTP status.
- Teknik mesaj.
- Kullanıcı aksiyonu önerisi.

Header, token, cookie gösterme.

---

## 18. Export ve Raporlama

### 18.1. İlk Sürüm Export

- Ham normalize veri CSV.
- Günlük 24 saat pivot CSV.
- JSON snapshot.

### 18.2. Sonraki Sürüm Export

- HTML print raporu.
- PDF rapor.
- Excel rapor.

### 18.3. Export Dosya İsimleri

```text
RGDH_HAM_DATA_YYYY-MM-DD.csv
RGDH_GUNLUK_IZLEME_YYYY-MM-DD.csv
RGDH_GRAFIK_RAPOR_YYYY-MM-DD.json
```

---

## 19. Test Planı

### 19.1. Unit Testler

```text
rgdh-normalizer.test.js
  - conventional API row normalize
  - wind API row normalize
  - hybrid tespit
  - null alanlar
  - Türkçe sayı parse

rgdh-pivot.test.js
  - 60 dakikalık OK saat
  - eksik dakikalı WARN saat
  - fail oranı > %10 ise FAIL
  - hiç veri yoksa NO_DATA

rgdh-csv.test.js
  - ; ayracı
  - virgüllü ondalık
  - konvansiyonel CSV tipi algılama
  - RES/GES CSV tipi algılama

rgdh-api-client.test.js
  - URL builder
  - UTC gün aralığı
  - link header last page parse
  - 401/403/500 hata sınıflandırma
```

### 19.2. UI Smoke Test

```text
1. Extension yüklenir.
2. Popup açılır.
3. RGDH İzleme butonu görünür.
4. Butona basınca rgdh-monitor.html açılır.
5. CSV yüklenir.
6. Ham Data tablosu dolar.
7. Günlük RGDH İzleme pivotu oluşur.
8. Grafik Rapor sekmesi render edilir.
```

### 19.3. Manuel Test Senaryoları

- YKS oturumu açık, API başarılı.
- YKS oturumu kapalı, kullanıcıya giriş uyarısı.
- Konvansiyonel API çok sayfalı veri.
- RES/GES busbarId ile başarılı veri.
- RES/GES filtresiz 500 sonrası busbar bazlı fallback.
- CSV-only offline doğrulama.
- API + CSV fark raporu.
- DOM partial fallback.

---

## 20. Uygulama Sırası

### Faz 1 — Dosya iskeleti ve popup entegrasyonu

- `rgdh-monitor.html/css/js` oluştur.
- Popup’a `RGDH İzleme` butonu ekle.
- Butonla yeni sekme aç.
- Sekme yapısını oluştur: Ham Data, Günlük RGDH İzleme, RGDH Grafik Rapor.

Kabul kriteri:

- Extension yüklenir.
- Popup butonu görünür.
- Sayfa açılır.
- Üç sekme çalışır.

### Faz 2 — CSV parser ve Ham Data

- `rgdh-csv.js` yaz.
- Konvansiyonel ve RES/GES CSV algılama ekle.
- Normalize model oluştur.
- Ham Data tablosunu render et.

Kabul kriteri:

- İki CSV tipi yüklenir.
- Ortak tabloya normalize edilir.
- Türkçe sayılar doğru parse edilir.

### Faz 3 — Pivot / Günlük İzleme

- `rgdh-pivot.js` yaz.
- 24 saat kolon formatı oluştur.
- OK/WARN/FAIL/NO_DATA/OFF renklerini uygula.

Kabul kriteri:

- Bara bazlı 24 saat tablo oluşur.
- Günlük özet kolonları hesaplanır.

### Faz 4 — Grafik Rapor

- `rgdh-charts.js` yaz.
- Gerilim, P, Q, onay timeline ve heatmap grafikleri ekle.

Kabul kriteri:

- Seçili bara için grafikler render edilir.
- Limit çizgileri ve durum renkleri görünür.

### Faz 5 — API client

- `rgdh-api-client.js` yaz.
- Konvansiyonel endpoint fetch.
- RES/GES endpoint fetch.
- General parameter fetch.
- Pagination.
- 401/403/500 hata yönetimi.

Kabul kriteri:

- YKS oturumu açıkken veri çekilir.
- Pagination doğru çalışır.
- RES/GES busbarId stratejisi çalışır.

### Faz 6 — Page-context bridge ve DOM fallback

- `rgdh-dom-bridge.js` yaz.
- Aktif YKS sekmesini bul.
- Whitelist endpoint page-context fetch yap.
- DOM tablo fallback ekle.

Kabul kriteri:

- Extension context fetch başarısızsa page-context veya DOM fallback denenir.
- Token/header loglanmaz.

### Faz 7 — API/CSV karşılaştırma

- Aynı bara + dakika anahtarıyla eşleştir.
- Farkları hesapla.
- UI’da MISMATCH badge göster.
- Fark raporu üret.

Kabul kriteri:

- API ve CSV aynıysa OK.
- Fark varsa alan bazlı gösterilir.

### Faz 8 — Test ve paketleme

- Unit testleri yaz.
- UI smoke test yaz.
- README’ye RGDH modül notu ekle.
- Build/extension paketleme testini çalıştır.

Kabul kriteri:

- `npm test` geçer.
- Extension Chrome’da hatasız yüklenir.
- RGDH modülü temel akışı çalışır.

---

## 21. Kod Kalite Standartları

- Vanilla JS kullan; proje React değilse React ekleme.
- Global scope kirletme; RGDH modüllerini `window.RGDH_*` namespace altında veya ES module yapısı uygunsa module olarak tut.
- Büyük fonksiyonları böl.
- Magic stringleri sabitlere al.
- Endpoint path whitelist kullan.
- Token/cookie/header loglama.
- Kullanıcı hatalarını anlaşılır göster.
- UI aşırı boşluklu olmayacak; teknik panel yoğunluğu korunacak.
- Türkçe karakterleri doğru göster: UTF-8.

---

## 22. README Güncellemesi

Mevcut README’ye kısa bir bölüm ekle:

```markdown
## RGDH İzleme Modülü

Popup üzerindeki "RGDH İzleme" butonu ile açılan modül; Konvansiyonel Bara Data ve RES/GES Bara Data verilerini API/CSV/DOM kaynaklarından normalize eder, Ham Data, Günlük RGDH İzleme ve RGDH Grafik Rapor sekmelerinde gösterir. Modül kullanıcı oturum bilgisi saklamaz; YKS oturumu açıkken yetkili API erişimini kullanır, gerekirse DOM/CSV fallback ile doğrulama yapar.
```

---

## 23. Teslim Kontrol Listesi

- [ ] Popup’ta `RGDH İzleme` butonu var.
- [ ] `rgdh-monitor.html` yeni sekmede açılıyor.
- [ ] Dark/minimal UI hazır.
- [ ] Ham Data sekmesi çalışıyor.
- [ ] Günlük RGDH İzleme 24 saat pivot çalışıyor.
- [ ] Grafik Rapor sekmesi çalışıyor.
- [ ] Konvansiyonel CSV parse ediliyor.
- [ ] RES/GES CSV parse ediliyor.
- [ ] API URL builder testli.
- [ ] Pagination testli.
- [ ] RES/GES busbarId fallback var.
- [ ] Page-context fetch bridge token saklamıyor.
- [ ] DOM fallback kısmi veri uyarısı veriyor.
- [ ] API/CSV fark raporu var.
- [ ] Unit testler eklendi.
- [ ] Smoke test eklendi.
- [ ] README güncellendi.
- [ ] Hassas bilgi loglanmıyor.

---

## 24. En Kritik Teknik Notlar

1. Bu modülün güvenilirliği API verisine dayanmalıdır; DOM sadece fallback’tir.
2. RES/GES endpoint’i tüm sistem çağrısında hata verebildiği için busbarId bazlı çekim önceliklidir.
3. Konvansiyonel veri çok sayfalı gelebilir; pagination zorunludur.
4. Türkiye günü UTC’ye çevrilmelidir; günlük raporda 00-23 saat Europe/Istanbul esas alınır.
5. Authorization token veya cookie asla saklanmaz/loglanmaz.
6. CSV, API ve DOM verileri aynı ortak modele normalize edilmeden UI’a verilmez.
7. 24 saatlik Günlük İzleme tablosu, Ham Data’dan türetilmiş tek veri modelini kullanmalıdır.
8. Grafik Rapor, aynı pivot ve normalize veriyi kullanmalıdır; ayrı hesap mantığı yazılmamalıdır.
