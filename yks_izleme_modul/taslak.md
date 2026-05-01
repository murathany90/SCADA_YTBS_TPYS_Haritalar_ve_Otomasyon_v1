**RGDH İzleme modülü**

Kullanım kılavuzu (PDF) verilen Yan Hizmetler Analiz Platformu'nda, yan hizmetler ve RGDH (Reaktif Güç Destek Hizmeti) performans değerlendirmesi yapılmaktadır. Bu sitede yer alan reaktif izleme sekmesindeki hesaplamaların doğrulanması amacıyla bir Chrome eklentisi geliştirilecektir. Bu eklenti, mevcut "readme.md" dosyası iletilen yapıya yeni bir özellik olarak entegre edilecektir. Ekteki tüm dokümanları incele ve analiz et.  Eklentinin çalışma kurgusu şu şekildedir:

Açılır pencereye (popup) "RGDH İzleme" butonu eklenecektir. Bu butona tıklandığında, yeni bir sekmede Yan Hizmetler Analiz Platformu'nun görselliğiyle uyumlu, modern, koyu temalı ve minimal bir sayfa açılacaktır. Bu sayfada "Ham Data", "Günlük RGDH İzleme" ve "RGDH Grafik Rapor" olmak üzere üç sekme bulunacaktır.
a) "Ham Data" sekmesinde, ekte verilen PDF ve HTML kodlarındaki Konvansiyonel Bara Data ile RES/GES Bara Data verileri aynı sayfada normalleştirilerek, günlük ve saatlik tablo formatında bara bazlı olarak gösterilecektir.
b) "Günlük RGDH İzleme" sekmesinde, "Ham Data" sekmesindeki değerlerin bara ve günlük/saatlik (24 saat kolon formatında) izleme sonuçları sunulacaktır.
c) "RGDH Grafik Rapor" sekmesinde ise bu izleme ve tablo değerlerinin saatlik veya günlük grafik gösterimi yer alacaktır.

Bu eklenti geliştirmesi için ekteki dokümanları inceleyip analiz etmeniz ve kurgulanan yapının uygulanabilirliğini değerlendirmeniz beklenmektedir. En kritik nokta, kullanıcının Yan Hizmetler Analiz Platformu'nda oturum açtığı durumlarda, eklentinin ilgili tablolardan verileri başarılı bir şekilde çekip çekemeyeceğidir. Lütfen tüm sayfa, sekme, renklendirme ve raporlama yapılarıyla ilgili detaylı bir kurgu oluşturun. Ekte sunulan dokümanları (PDF kılavuz, HTML kodları ve mevcut readme.md) inceleyerek yeni RGDH modülü için sistemin uygulanabilirliğini analiz et.

Kullanıcı Yan Hizmetler Analiz Platformu'nda oturum açtığında, eklentinin ilgili tablolardan verileri (DOM manipülasyonu veya ağ istekleriyle) nasıl güvenli ve doğru bir şekilde çekebileceğini detaylıca kurgula.

Eklenti açılır penceresine eklenecek "RGDH İzleme" butonu ve ardından açılacak yeni sekmenin mimarisini tasarla.

Yeni sayfada yer alacak "Ham Data" (normalleştirilmiş, bara bazlı saatlik/günlük veri), "Günlük RGDH İzleme" (24 saat kolon formatında) ve "RGDH Grafik Rapor" (saatlik/günlük görselleştirme) sekmelerinin veri işleme ve gösterim mantığını oluştur.

Sayfa, sekme, renklendirme ve raporlama yapıları için genel mimariyi ve UI kurgusunu planla.

Çıktı Formatı (Output Format): Teknik bir analiz ve mimari tasarım dokümanı olarak madde madde listele. Veri çekme (scraping/fetching) stratejisini, veri yapılarını ve arayüz kurgusunu belirgin alt başlıklar halinde yapılandır.

Kısıtlamalar/Ton (Constraints/Tone): Yazılım mühendisliği standartlarına uygun, profesyonel ve analitik bir dil kullan. Arayüz tasarımı kurgusunda orijinal görsel standartlara sıkı sıkıya bağlı kal; gereksiz boşlukların olmadığı (minimal padding), modern ve koyu temalı (dark mode) bir arayüz yapısı benimse.


İnceleme sonucunda **bu RGDH İzleme modülü uygulanabilir** görünüyor; en sağlam yöntem, kullanıcı YKS/Yan Hizmetler Analiz Platformu’nda zaten oturum açmışken **aynı origin üzerinde yetkili API isteklerini tekrar kullanmak**, DOM scraping’i ise sadece yedek yöntem olarak tutmaktır.

## 1. Uygulanabilirlik Değerlendirmesi

### 1.1. Mevcut eklenti mimarisi uygun mu?

Evet. Verilen `README.md` dosyasındaki yapı zaten Chrome Extension Manifest V3 mantığıyla kurulmuş: `manifest.json`, `background.js`, `content-script.js`, `popup.html / popup.js`, harita sayfası, ortak JS modülleri ve test altyapısı mevcut. Bu mimari yeni “RGDH İzleme” sayfasını ayrı bir extension tab olarak açmaya uygundur. README’deki mevcut akışta popup ile background/service worker haberleşmesi, content-script ile sayfa etkileşimi ve yeni sekme açma yaklaşımı zaten tanımlanmış durumda. 

Yeni modül şu dosya yapısıyla eklenebilir:

```text
rgdh-monitor.html
rgdh-monitor.css
rgdh-monitor.js
rgdh-api-client.js
rgdh-normalizer.js
rgdh-pivot.js
rgdh-charts.js
rgdh-storage.js
rgdh-types.js
tests/rgdh-normalizer.test.js
tests/rgdh-pivot.test.js
tests/rgdh-api-client.test.js
```

Mevcut `popup.html / popup.js` içine yalnızca yeni bir buton ve `chrome.tabs.create()` çağrısı eklenir.

---

## 2. Kritik Nokta: Kullanıcı Oturum Açtığında Veri Çekilebilir mi?

### 2.1. En güçlü yöntem: API üzerinden veri çekme

Eklerdeki console/network kayıtları, YKS tarafında RGDH verilerinin REST endpoint’leriyle döndüğünü gösteriyor. Konvansiyonel bara verisi için örnek endpoint:

```text
/api/rgdh-conventional-busbar-data
```

RES/GES veya rüzgâr tarafı için örnek endpoint:

```text
/api/rgdh-wind-busbar-data
```

Ayrıca genel parametre almak için:

```text
/api/general-parameter-by-name
```

örneği verilmiş; `KONVGERTOL` parametresinin `0.015` döndüğü görülüyor. Konvansiyonel endpoint çağrılarında `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `size`, `sort` gibi query parametreleri kullanılmış ve cevaplarda `x-total-count`, pagination `link` header’ları ile çok sayfalı veri geldiği görülüyor. 

RES/GES tarafında ise `rgdh-wind-busbar-data` endpoint’i `busbarId.equals` filtresiyle başarılı çalışıyor; aynı dosyada filtresiz veya hatalı kapsamlı çağrıda 500 Internal Server Error dönebildiği de görülüyor. Bu nedenle RES/GES isteklerinde **busbarId bazlı veya kontrollü sayfalı fetch** zorunlu olmalıdır. 

### 2.2. Güvenli oturum yaklaşımı

Eklenti kesinlikle kullanıcı adı/şifre, bearer token veya sabit kimlik bilgisi saklamamalıdır. Console dosyalarında Authorization header görünüyor; bu bilgi **kod içine gömülmemeli, storage’a yazılmamalı, loglanmamalı ve rapora basılmamalıdır**. Doğru yaklaşım:

* Kullanıcı önce `https://yks.teias.gov.tr/` üzerinde normal şekilde oturum açar.
* Eklenti yalnızca kullanıcı tarafından başlatılan “RGDH İzleme” işleminde veri çeker.
* `host_permissions` yalnızca gerekli domain ile sınırlandırılır.
* `fetch` çağrılarında `credentials: "include"` kullanılır.
* Token gerekiyorsa extension bunu **kendisi üretmez veya saklamaz**; yalnızca mevcut sayfa bağlamında yetkili oturumun zaten izin verdiği istekler kullanılır.
* Başarısız isteklerde “Oturum süresi doldu / YKS sekmesinde tekrar giriş yapın” mesajı gösterilir.

Önerilen güvenlik modeli, README’deki host permissions ve storage güvenliği yaklaşımıyla uyumludur; README ayrıca hassas kimlik bilgisi dosyalarının git’e eklenmemesi ve storage’da şifre tutulmaması gerektiğini açıkça vurguluyor. 

### 2.3. DOM scraping ne zaman kullanılmalı?

DOM scraping ana yöntem olmamalıdır. Sadece şu durumlarda yedek olarak kullanılmalıdır:

* API endpoint adı değişirse,
* API response kısıtlanırsa,
* sayfada tablo görünür ama network erişimi başarısız olursa,
* kullanıcının seçtiği filtrelerin aynısını okumak gerekirse.

DOM scraping stratejisi:

```text
content-script.js
  ├─ aktif YKS sekmesini bulur
  ├─ reaktif izleme tablosunu DOM’dan okur
  ├─ başlık satırlarını normalize eder
  ├─ hücreleri baraId + ölçüm zamanı + kolon adı şeklinde map’ler
  └─ rgdh-monitor.html sayfasına snapshot olarak gönderir
```

Ancak tablo sanal scroll, pagination veya lazy loading kullanıyorsa DOM’da yalnızca görünen satırlar bulunabilir. Bu yüzden doğrulama modülünde esas veri kaynağı **API olmalıdır**.

---

## 3. Veri Kaynakları ve Alan Eşleştirmesi

## 3.1. Konvansiyonel bara verisi

Console verilerinde konvansiyonel endpoint cevabında şu alanlar öne çıkıyor:

| Normalize Alan      | API Alanı                         | Açıklama                  |
| ------------------- | --------------------------------- | ------------------------- |
| `measurementDate`   | `measurementDate`                 | UTC ölçüm zamanı          |
| `busbarId`          | `busbar.busbarId` veya `busbarId` | YKS/TPYS bara ID          |
| `busbarName`        | `busbar.busbarName`               | Bara adı                  |
| `plantName`         | `busbar.plantName`                | Santral adı               |
| `busbarType`        | `busbar.busbarType`               | `CONVENTIONAL`            |
| `voltageLevel`      | `busbar.voltageLevel`             | 154 / 400 kV              |
| `mainBusbarVoltage` | `mainBusbarVoltage`               | Canlı bara gerilimi       |
| `tpysSet`           | `tpysNomBusVolt`                  | TPYS nominal/set gerilimi |
| `upperLimit`        | hesaplanan / CSV alanı            | Bara set üst limit        |
| `lowerLimit`        | hesaplanan / CSV alanı            | Bara set alt limit        |
| `pgenMw`            | `sumPgenActive`                   | Toplam aktif güç          |
| `qgenMvar`          | `sumPgenReactive`                 | Toplam reaktif güç        |
| `diLimit`           | `sumDIMvarLimit`                  | Düşük ikaz MVAr limit     |
| `aiLimit`           | `sumAIMvarLimit`                  | Aşırı ikaz MVAr limit     |
| `pnom`              | `pnom`                            | Kurulu güç                |
| `pmkud`             | `sumPmukd`                        | PMKÜD                     |
| `minMkud`           | `minMkud`                         | Minimum MKÜD              |
| `service`           | `typsService`                     | Hizmet kapsamı            |
| `offBoard`          | `rgdhOffBoardStatus`              | Devre dışı durumu         |
| `obligation`        | `noObligationStatus`              | Yükümlülük durumu         |
| `diApprove`         | `diMvarApprove`                   | D.İ. onay                 |
| `aiApprove`         | `aiMvarApprove`                   | A.İ. onay                 |
| `voltageApprove`    | `busbarSetToleranceApprove`       | Bara set onay             |
| `approvalStatus`    | `approvalStatus`                  | Nihai onay                |

Konvansiyonel örnekte ACWA Kırıkkale, Yamula HES, Kargı HES gibi baralar için `pnom`, `sumPgenActive`, `sumPgenReactive`, `sumAIMvarLimit`, `sumDIMvarLimit`, `tpysNomBusVolt`, `mainBusbarVoltage` gibi alanlar doğrudan geliyor. 

CSV örneğinde ise konvansiyonel dosya `;` ayracını kullanıyor ve 29 kolon içeriyor. Kolonlar arasında `BYTM Adı`, `Ölçüm Zamanı`, `Bara ID`, `Bara Adı`, `TPYS Set`, `Kurulu Güç`, `Pmkud`, `MinMkud`, `Canlı Bara`, `Bara Set Üst Limit`, `Bara Set Alt Limit`, `Toplam Ünite Pgen Aktif (MW)`, `Yardımcı Kaynak (MW)`, `Yardımcı Kaynak (MVAr)`, `Toplam Ünite Qgen Reaktif (MVAr)`, `D.İ. MVAR Onay`, `A.İ. MVAR Onay` ve `Onay Durum` bulunuyor.

## 3.2. RES/GES bara verisi

RES/GES tarafında API alanları benzer fakat isimler farklı:

| Normalize Alan   | API Alanı                      | Açıklama                  |
| ---------------- | ------------------------------ | ------------------------- |
| `busbarType`     | `busbar.busbarType`            | Genellikle `WIND`         |
| `tpysSet`        | `tpysBusVoltSet`               | Gerilim set değeri        |
| `droop`          | `tpysBusVoltDrop`              | Gerilim düşümü / droop    |
| `windUnits`      | `busbar.windUnitList`          | Ana RES/GES üniteleri     |
| `auxiliaryUnits` | `busbar.auxiliaryWindUnitList` | Yardımcı kaynak, örn. GES |
| `auxiliaryMw`    | `auxiliarySource`              | Yardımcı kaynak MW        |
| `auxiliaryMvar`  | `auxiliarySourceReactive`      | Yardımcı kaynak MVAr      |
| `unitsInSupply`  | `unitsInSupply`                | Devredeki trafo/ünite     |
| `diApprove`      | `diMvarApprove`                | Düşük ikaz onay           |
| `aiApprove`      | `aiMvarApprove`                | Aşırı ikaz onay           |

RES/GES console örneklerinde rüzgâr ünitesi için `speedDrop`, `underExcite`, `overExcite`, `pnomUnit`, `taMw`, `taMvar`, `sumPgenActive`, `sumPgenReactive`, `tpysBusVoltSet`, `tpysBusVoltDrop`, `sumDIMvarLimit`, `sumAIMvarLimit` gibi alanlar görülüyor. 

RES/GES CSV örneği de `;` ayracını kullanıyor ve 23 kolon içeriyor. Kolonlar arasında `Ölçüm Zamanı`, `Bara Adı`, `Bara ID`, `Kurulu Güç`, `Pmkud`, `TPYS Bara Gerilim Set`, `TPYS Bara Gerilim Düşümü`, `Canlı Bara`, `Toplam Ünite Pgen Aktif (MW)`, `Toplam Ünite Qgen Reaktif (MVAr)`, `Toplam D.İ. MVar Limit`, `Toplam A.İ. MVar Limit`, `Devre Durumu`, `Yükümlülük Durumu`, `D.İ. MVAR Onay Durumu`, `A.İ. MVAR Onay Durumu` ve `Onay Durum` bulunuyor.

---

## 4. Yeni RGDH Modülünün Genel Mimarisi

## 4.1. Popup butonu

Popup’a eklenecek buton:

```text
[ RGDH İzleme ]
```

Buton davranışı:

```javascript
chrome.tabs.create({
  url: chrome.runtime.getURL("rgdh-monitor.html")
});
```

Popup içinde minimum alan kullanılmalı:

```text
┌────────────────────────────┐
│ SCADA / YTBS / TPYS         │
│ Harita ve Otomasyon         │
├────────────────────────────┤
│ [ Harita ]                  │
│ [ SCADA Akış ]              │
│ [ RGDH İzleme ]             │  ← yeni buton
│ [ Ayarlar ]                 │
└────────────────────────────┘
```

## 4.2. Yeni sekme sayfası

Dosya:

```text
rgdh-monitor.html
```

Ana yerleşim:

```text
┌──────────────────────────────────────────────────────────────┐
│ RGDH İzleme ve Doğrulama Paneli                              │
│ Yan Hizmetler Analiz Platformu ile uyumlu dark tema           │
├──────────────────────────────────────────────────────────────┤
│ Tarih: [2026-04-01]  Tip: [Tümü/Konv/RES-GES]  Bara: [Ara]    │
│ [YKS’den Çek] [CSV Yükle] [Karşılaştır] [Excel/CSV Dışa Aktar]│
├──────────────────────────────────────────────────────────────┤
│ Sekmeler: [Ham Data] [Günlük RGDH İzleme] [RGDH Grafik Rapor] │
├──────────────────────────────────────────────────────────────┤
│ İçerik alanı                                                  │
└──────────────────────────────────────────────────────────────┘
```

Renk standardı:

| Amaç               | Renk              |
| ------------------ | ----------------- |
| Arka plan          | `#0b1120`         |
| Kart / panel       | `#111827`         |
| Tablo başlığı      | `#172033`         |
| Kenarlık           | `#263246`         |
| Normal metin       | `#e5e7eb`         |
| İkincil metin      | `#94a3b8`         |
| Başarılı / uygun   | `#22c55e`         |
| Uyarı              | `#f59e0b`         |
| Hata / uygunsuz    | `#ef4444`         |
| Bilgi              | `#38bdf8`         |
| Pasif / veri yok   | `#64748b`         |
| Aşırı ikaz vurgusu | mavi/cyan ton     |
| Düşük ikaz vurgusu | amber/turuncu ton |

Minimal UI ilkesi:

* Tablo padding: 4-6 px.
* Kart padding: 8-10 px.
* Gereksiz büyük boşluk yok.
* Sticky header ve sticky ilk kolon kullanılmalı.
* 24 saatlik tablolar yatay scroll ile gösterilmeli.
* Kritik değerler renkli badge olarak gösterilmeli.

---

## 5. Veri Çekme Stratejisi

## 5.1. API fetch akışı

```text
Kullanıcı RGDH İzleme sayfasını açar
  ↓
rgdh-monitor.js başlangıç kontrolü yapar
  ↓
background.js’e mesaj gönderir:
  RGDH_FETCH_DAY
  ↓
background.js / rgdh-api-client.js:
  1. YKS oturumu var mı kontrol eder
  2. Konvansiyonel endpoint’i sayfalı çeker
  3. RES/GES endpoint’i busbarId bazlı veya kontrollü çeker
  4. Parametreleri çeker: KONVGERTOL vb.
  5. Ham JSON’u normalize eder
  ↓
rgdh-normalizer.js:
  ortak veri modeline dönüştürür
  ↓
rgdh-pivot.js:
  saatlik/günlük pivot üretir
  ↓
UI:
  Ham Data, Günlük İzleme, Grafik Rapor sekmeleri güncellenir
```

## 5.2. Tarih aralığı kuralı

YKS verileri UTC geliyor. Türkiye saati UTC+3 olduğundan 1 Nisan 2026 yerel gününü çekmek için istek aralığı yaklaşık şu mantıkla kurulmalı:

```text
Yerel gün başlangıcı: 2026-04-01 00:00 Europe/Istanbul
UTC karşılığı:       2026-03-31T21:00:00Z

Yerel gün bitişi:    2026-04-02 00:00 Europe/Istanbul
UTC karşılığı:       2026-04-01T21:00:00Z
```

Console örneklerinde de 1 Nisan günü için `2026-03-31T21:00:00Z` başlangıcı kullanılmıştır. 

## 5.3. Pagination kuralı

Konvansiyonel veri çok büyük dönebiliyor. Örnekte `x-total-count` ve `link` header’ları var; bu nedenle tek isteğe güvenilmemeli. 

Önerilen strateji:

```text
size = 2000
page = 0
sort = measurementDate,asc

while page <= lastPage:
    fetch page
    append rows
```

RES/GES tarafında ise filtresiz istek 500 dönebildiği için şu yaklaşım daha güvenli:

```text
1. Önce bilinen / seçili busbarId varsa busbarId.equals ile çek.
2. Birden çok bara istenecekse busbarId listesi üzerinden tek tek çek.
3. Filtresiz tüm sistem taraması yapılacaksa küçük tarih aralığı + pagination + retry kullanılmalı.
4. 500 dönerse otomatik küçült:
   - tarih aralığını böl,
   - size değerini düşür,
   - busbarId filtresine dön.
```

---

## 6. Ortak Veri Modeli

Tüm konvansiyonel ve RES/GES verisi aşağıdaki ortak modele normalize edilmeli:

```javascript
{
  sourceType: "CONVENTIONAL" | "WIND" | "SOLAR" | "HYBRID",
  measurementDateUtc: "2026-03-31T21:00:00Z",
  measurementDateLocal: "2026-04-01T00:00:00+03:00",
  localDate: "2026-04-01",
  localHour: 0,
  localMinute: 0,

  ytm: "OA_YTM",
  city: "KIRIKKALE",

  busbarInternalId: 9333006401,
  busbarId: 5532,
  busbarName: "ACWA KIRIKKALE DGKÇ",
  plantName: "ACWA KIRIKKALE",
  voltageLevel: 400,

  tpysVoltageSet: 404,
  tpysVoltageDrop: null,
  liveBusbarVoltage: 409.51,
  busbarUpperLimit: 410.00,
  busbarLowerLimit: 398.00,

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

  raw: {}
}
```

Bu model üç sekme için de ortak veri kaynağı olur.

---

## 7. “Ham Data” Sekmesi

## 7.1. Amaç

PDF/HTML platformundaki Konvansiyonel Bara Data ve RES/GES Bara Data mantığını tek ekranda, aynı kolon isimleriyle ve bara bazlı normalize ederek göstermek.

## 7.2. Görünüm

Üst filtreler:

```text
Tarih | Veri Tipi | YTM | Bara Adı / ID | Gerilim Seviyesi | Onay Durumu | Yalnız Hatalılar
```

Tablo kolonları:

| Grup            | Kolonlar                                                              |
| --------------- | --------------------------------------------------------------------- |
| Kimlik          | Tarih-Saat, Veri Tipi, BYTM/YTM, İl, Bara ID, Bara Adı, Santral       |
| Gerilim         | TPYS Set, Droop, Canlı Bara, Alt Limit, Üst Limit, Bara 1/2/3 Gerilim |
| Güç             | Pnom, PMKÜD, MinMKÜD, Pgen MW, Qgen MVAr                              |
| Yardımcı kaynak | Yardımcı MW, Yardımcı MVAr                                            |
| Limit           | D.İ. Limit, A.İ. Limit                                                |
| Durum           | Devre, Yükümlülük, Hizmet, Off-board                                  |
| Onay            | Bara Set, D.İ., A.İ., Nihai Onay                                      |
| Kalite          | Veri eksik, API/CSV farkı, zaman sapması                              |

## 7.3. Satır renklendirme

| Durum                       | Renklendirme                 |
| --------------------------- | ---------------------------- |
| Tüm kontroller uygun        | Yeşil sol çizgi              |
| Gerilim tolerans dışı       | Amber hücre                  |
| MVAr limit/onay uyumsuz     | Kırmızı hücre                |
| Veri yok / null             | Gri badge                    |
| API ve CSV farkı var        | Mor/amber “Fark” badge       |
| RES/GES yardımcı kaynak var | Cyan “Yardımcı kaynak” badge |
| Hibrit davranış             | Mavi “Hybrid” badge          |

## 7.4. Ham Data’da hesaplanacak ek alanlar

```text
voltageDelta = liveBusbarVoltage - tpysVoltageSet
voltageDeltaPct = voltageDelta / tpysVoltageSet
isVoltageHigh = liveBusbarVoltage > upperLimit
isVoltageLow = liveBusbarVoltage < lowerLimit
isQUnderLimit = qgenMvar < diMvarLimit
isQOverLimit = qgenMvar > aiMvarLimit
pgenPct = pgenMw / pnomMw
isBelowMkud = pgenMw < pmkudMw
```

---

## 8. “Günlük RGDH İzleme” Sekmesi

## 8.1. Amaç

Ham dakikalık veriyi günlük ve saatlik karar tablosuna dönüştürmek. Kullanıcının istediği “24 saat kolon formatı” bu sekmede uygulanmalı.

## 8.2. Pivot tablo yapısı

Satırlar:

```text
Bara ID
Bara Adı
Veri Tipi
Kontrol Türü
```

Kolonlar:

```text
00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23
Günlük Özet
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
```

## 8.3. Saatlik özet hesaplama

Dakikalık veriden saatlik sonuç üretirken:

```text
hourRows = aynı bara + aynı localHour içindeki 60 dakikalık kayıtlar

hourStatus:
  OK       = tüm geçerli dakikalar uygun
  WARN     = bazı dakikalar eksik veya sınır yakın
  FAIL     = en az bir kritik uygunsuzluk
  NO_DATA  = veri yok
  OFF      = devre/hizmet dışı
```

Saatlik skor:

```text
okMinuteCount
failMinuteCount
missingMinuteCount
validMinuteCount
availabilityPct = validMinuteCount / 60
failPct = failMinuteCount / validMinuteCount
```

Önerilen karar:

| Koşul              | Saat hücresi   |
| ------------------ | -------------- |
| Veri yok           | `NO DATA` gri  |
| Devre/hizmet dışı  | `OFF` gri      |
| Tüm dakika uygun   | `OK` yeşil     |
| %1-10 uygunsuz     | `WARN` sarı    |
| %10 üzeri uygunsuz | `FAIL` kırmızı |

Bu eşikler kodda ayarlanabilir olmalı.

## 8.4. Günlük özet

Her bara için:

```text
Toplam kayıt
Beklenen kayıt
Veri tamlık %
OK saat
WARN saat
FAIL saat
NO DATA saat
Günlük uygunluk %
En kötü saat
En yüksek gerilim sapması
En yüksek MVAr limit aşımı
```

---

## 9. “RGDH Grafik Rapor” Sekmesi

## 9.1. Grafik türleri

Bu sekme tabloyu görsel olarak doğrulamalı. Önerilen grafikler:

1. **Gerilim grafiği**

   * X: saat/dakika
   * Y: canlı bara gerilimi
   * referans: TPYS set
   * bant: alt/üst limit

2. **Aktif güç grafiği**

   * Pgen MW
   * PMKÜD / MinMKÜD çizgisi
   * Pnom referans çizgisi

3. **Reaktif güç grafiği**

   * Qgen MVAr
   * D.İ. limit
   * A.İ. limit
   * aşım bölgeleri

4. **Onay durum grafiği**

   * D.İ. onay
   * A.İ. onay
   * bara set onay
   * nihai onay

5. **Günlük 24 saat ısı haritası**

   * satır: bara
   * kolon: saat
   * renk: OK/WARN/FAIL/NO DATA/OFF

## 9.2. Grafik filtreleri

```text
Bara seçimi
Tarih seçimi
Veri tipi
Saatlik / dakikalık çözünürlük
Sadece uygunsuz saatleri göster
Limit çizgilerini göster/gizle
CSV ile farkları göster/gizle
```

## 9.3. Rapor çıktısı

İlk fazda:

```text
CSV export
JSON snapshot export
Ekran görüntüsü / print CSS
```

İkinci fazda:

```text
PDF rapor
Excel rapor
```

PDF raporda:

```text
Kapak
Özet metrikler
Bara bazlı 24 saat tablo
En kritik 10 uygunsuzluk
Grafikler
Ham veri kaynak özeti
```

---

## 10. Veri Doğrulama ve Hesap Kontrolleri

## 10.1. Platform verisini doğrulama mantığı

Bu modül, platformdaki hesapları baştan yazmak yerine önce **platformun döndürdüğü alanları yeniden hesaplanan kontrol alanlarıyla karşılaştırmalı**.

Kontrol katmanları:

```text
1. API ham değer kontrolü
2. CSV export değer kontrolü
3. Eklenti normalize değer kontrolü
4. Saatlik/günlük pivot kontrolü
5. Platform onay alanı ile yeniden hesaplanan sonuç karşılaştırması
```

## 10.2. Karşılaştırma alanları

| Karşılaştırma                                                  | Amaç                   |
| -------------------------------------------------------------- | ---------------------- |
| API `sumPgenActive` ↔ CSV `Toplam Ünite Pgen Aktif (MW)`       | Export doğruluğu       |
| API `sumPgenReactive` ↔ CSV `Toplam Ünite Qgen Reaktif (MVAr)` | Reaktif veri doğruluğu |
| API `mainBusbarVoltage` ↔ CSV `Canlı Bara`                     | Gerilim doğruluğu      |
| API `sumDIMvarLimit` ↔ CSV `Toplam D.İ. MVar Limit`            | Düşük ikaz limit       |
| API `sumAIMvarLimit` ↔ CSV `Toplam A.İ. MVar Limit`            | Aşırı ikaz limit       |
| API onay alanları ↔ CSV onay kolonları                         | Hesap sonucu doğrulama |
| Yeniden hesaplanan durum ↔ platform `approvalStatus`           | Kritik hesap doğrulama |

## 10.3. Sayısal tolerans

Türkçe CSV değerleri virgüllü ondalık geliyor. Normalize parser şu dönüşümü yapmalı:

```text
"409,51" → 409.51
""       → null
"-"      → null / NOT_APPLICABLE
"null"   → null
```

Önerilen tolerans:

```text
MW/MVAr fark toleransı: 0.01
kV fark toleransı: 0.01
oran fark toleransı: 0.0001
```

---

## 11. SCADA/PDF Kılavuzundan Çıkan Tasarım İlkeleri

SCADA şartnamesinde veri aktarımı, zaman etiketi ve haberleşme sürekliliği kritik görülüyor: analog verilerin belirli değişimlerde genel sorgulama beklenmeden merkeze aktarılması, enerji ölçüm verilerinin eş zamanlı gönderilmesi ve haberleşme kesilirse RTU üzerinde zaman etiketli arşivlenmesi bekleniyor. Bu nedenle RGDH eklentisinde **zaman etiketi, veri tamlığı ve eksik veri raporu** mutlaka bulunmalı. 

Ayrıca şartnamede 2 haftalık kesintisiz çalışmada SCADA/IoT haberleşmesinde %99 devamlılık ve RTU’nun NTP/SNTP ile doğru zaman senkronu alabilmesi gibi maddeler yer alıyor. Bu, eklenti tarafında “ölçüm zamanı UTC mi, yerel saate doğru çevrildi mi, 24 saatlik gün eksiksiz mi?” kontrollerinin zorunlu olduğunu gösterir. 

PTP test yaklaşımı da önemlidir: RTU’lar ile kontrol merkezi arasındaki sinyallerin SCADA ile eşleştirildiğinin doğrulanması, hatalı sinyallerin ve problemlerin belirlenmesi beklenir. Eklentideki RGDH modülü de benzer şekilde API/CSV/DOM verisini baraId, setNum, ölçüm zamanı ve sinyal adı üzerinden izlenebilir şekilde eşleştirmelidir. 

---

## 12. Teknik Bileşen Tasarımı

## 12.1. `rgdh-api-client.js`

Görevleri:

```text
fetchConventionalBusbarData(date)
fetchWindBusbarData(date, busbarId?)
fetchGeneralParameter(date, paramName)
fetchAllPages(url, params)
checkSession()
```

Hata yönetimi:

```text
401/403 → Oturum yok / yetki yok
500     → Parametre daralt, busbarId ile tekrar dene
429     → Bekle ve retry
Network → Kullanıcıya bağlantı uyarısı
```

## 12.2. `rgdh-normalizer.js`

Görevleri:

```text
normalizeConventionalRow(raw)
normalizeWindRow(raw)
parseTurkishNumber(value)
parseMeasurementDateUtc(value)
toIstanbulLocalTime(value)
resolveBusbarIdentity(raw)
resolveApprovalStatus(raw)
```

## 12.3. `rgdh-pivot.js`

Görevleri:

```text
groupByBusbarAndHour(rows)
buildHourlyStatus(rows)
buildDailySummary(rows)
build24HourMatrix(rows)
```

## 12.4. `rgdh-charts.js`

Görevleri:

```text
renderVoltageChart(rows)
renderPgenChart(rows)
renderQgenChart(rows)
renderApprovalTimeline(rows)
renderDailyHeatmap(matrix)
```

Grafik kütüphanesi için seçenekler:

| Seçenek    | Değerlendirme                                   |
| ---------- | ----------------------------------------------- |
| Native SVG | Mevcut README mimarisiyle uyumlu, bağımlılık az |
| Chart.js   | Hızlı geliştirme, sade grafikler                |
| ECharts    | Büyük veri ve heatmap için güçlü                |
| Recharts   | React yoksa önerilmez                           |

Bu projenin mevcut “Vanilla JS + Native SVG” yaklaşımı nedeniyle ilk tercih **Native SVG veya Chart.js** olmalı. README’de mevcut sistemin Vanilla JS + Native SVG üzerine kurulduğu belirtiliyor. 

---

## 13. Manifest ve Permission Tasarımı

Önerilen `manifest.json` ekleri:

```json
{
  "permissions": [
    "storage",
    "tabs",
    "scripting",
    "cookies"
  ],
  "host_permissions": [
    "https://yks.teias.gov.tr/*"
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "rgdh-monitor.html",
        "rgdh-monitor.css",
        "rgdh-monitor.js"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

Daha güvenli seçenek:

```json
"host_permissions": [
  "https://yks.teias.gov.tr/api/*"
]
```

Ancak content-script DOM okuması da yapılacaksa ilgili sayfa route’ları da izin kapsamına alınmalıdır.

---

## 14. API ve DOM Stratejisinin Birlikte Kullanımı

## 14.1. Öncelik sırası

```text
1. Yetkili API fetch
2. API başarısızsa aktif YKS sekmesinden content-script ile DOM tablo okuma
3. Kullanıcının manuel yüklediği CSV ile doğrulama
4. Hiçbiri yoksa boş demo/şablon ekran
```

## 14.2. Veri kaynağı etiketi

Her satıra veri kaynağı yazılmalı:

```javascript
dataOrigin: "API" | "DOM" | "CSV" | "API+CSV_COMPARE"
```

UI’da:

```text
API       → mavi badge
CSV       → gri badge
DOM       → amber badge
FARK VAR  → kırmızı badge
```

---

## 15. Test Planı

## 15.1. Birim testleri

```text
parseTurkishNumber.test.js
normalizeConventionalRow.test.js
normalizeWindRow.test.js
pivot24Hour.test.js
approvalCompare.test.js
```

## 15.2. Fixture testleri

Eklerdeki CSV örneklerinden fixture üretilmeli:

```text
fixtures/konvansiyonel_bara_2026_04_01.csv
fixtures/ruzgar_bara_2026_04_01.csv
fixtures/conventional_api_sample.json
fixtures/wind_api_sample.json
```

## 15.3. E2E test

```text
1. Chrome extension yüklenir
2. Popup açılır
3. RGDH İzleme butonuna basılır
4. rgdh-monitor.html açılır
5. CSV yüklenir
6. Ham Data tablosu oluşur
7. Günlük RGDH İzleme pivotu oluşur
8. Grafik rapor render edilir
```

README’de mevcut test altyapısı Node test runner, Puppeteer smoke test ve MCP smoke test yapısını içerdiği için yeni RGDH testleri bu yapıya eklenebilir. 

---

## 16. Uygulama Fazları

## Faz 1 — Temel RGDH sayfası

* Popup’a “RGDH İzleme” butonu eklenir.
* `rgdh-monitor.html` açılır.
* CSV yükleme ve Ham Data tablosu yapılır.
* Konvansiyonel ve RES/GES CSV normalize edilir.
* 24 saatlik pivot oluşturulur.

## Faz 2 — API entegrasyonu

* YKS oturum kontrolü eklenir.
* Konvansiyonel API fetch yapılır.
* RES/GES API fetch yapılır.
* Pagination ve busbarId bazlı retry eklenir.
* API + CSV karşılaştırma yapılır.

## Faz 3 — Grafik rapor

* Gerilim, P, Q, onay ve heatmap grafikleri eklenir.
* Saatlik/günlük çözünürlük seçimi yapılır.
* Uygunsuzluk listesi eklenir.

## Faz 4 — Raporlama ve doğrulama

* CSV/JSON export.
* Excel/PDF rapor.
* Audit log.
* Test fixture setleri.
* Kullanıcıya “hesap farkı” raporu.

---

## 17. Sonuç

Bu modül mevcut Chrome eklenti mimarisine teknik olarak uyumludur. En kritik karar, veri çekmenin DOM scraping yerine öncelikle **yetkili API fetch** ile yapılmasıdır. Eklerdeki network kayıtları gerekli RGDH endpoint’lerinin mevcut olduğunu, konvansiyonel tarafta sayfalama gerektiğini, RES/GES tarafında ise busbarId filtresiyle daha güvenli veri çekilmesi gerektiğini gösteriyor.  

Önerilen nihai yapı:

```text
Popup
  └─ RGDH İzleme butonu
      └─ rgdh-monitor.html
          ├─ Ham Data
          ├─ Günlük RGDH İzleme
          └─ RGDH Grafik Rapor
```

Bu yapı hem platformun görsel standardına yakın, koyu temalı ve minimal bir doğrulama paneli sağlar hem de YKS oturumu açıkken API/DOM/CSV üçlüsüyle RGDH hesaplarının izlenebilir, karşılaştırılabilir ve raporlanabilir hale gelmesini mümkün kılar.
