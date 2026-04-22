# SCADA / YTBS / TPYS Haritalar ve Otomasyon V1

Bu doküman, TPYS (Türkiye Elektrik İletim Sistemi) KML tabanlı harita görünümü ile gerçek zamanlı SCADA aktif güç verisini aynı tarayıcı eklentisi (Chrome Extension) içinde birleştiren "Haritalar ve Otomasyon" projesinin detaylı, teknik ve kapsamlı başvuru kılavuzudur. Bu kılavuz, kod mimarisinden arayüz kullanımına, Superset veri çekme algoritmalarından hata ayıklama süreçlerine kadar her detayı ince ince açıklamak üzere tasarlanmıştır.

---

## 1. Proje Genel Özeti ve Kapsamı

Proje temelde üç ana sistemin entegrasyonundan oluşmaktadır:
1. **KML Tabanlı Dinamik Harita:** Yüz binlerce düğümü (node) barındırabilen elektrik iletim şebekesinin, tarayıcıda takılmadan çizdirilmesini sağlayan SVG + Raster Tile (parçalı resim) hibrit harita motoru.
2. **SCADA ve Superset Otomasyonu:** `analytics.teias.gov.tr` adresi üzerinde barındırılan Apache Superset platformuna otomatik giriş yaparak, kullanıcı müdahalesi olmadan belirlenen dilim (slice) ve pano (dashboard) id'lerinden ham veri çeken mekanizma.
3. **Gerçek Zamanlı Veri Eşleştirme ve Görselleştirme Sistemi:** Alınan SCADA verilerini, topolojik KML verisindeki baralar ve hatlarla eşleştirerek (mapping); ısı haritası, akış yönleri ve yüklenme oranları gibi formatlarda ekrana yansıtan "State Management" katmanı.

### 1.1. Neden Chrome Eklentisi Kullanılıyor?
CORS (Cross-Origin Resource Sharing) kısıtlamalarını aşmak, tarayıcının sekme yönetimi API'lerini kullanarak gizli sekmelerde otomatik oturum açmak ve kullanıcıların mevcut çalışma ortamını bozmadan arka planda sessizce işlem yürütebilmek adına Chrome Eklentisi mimarisi tercih edilmiştir.

### 1.2. Intranet Ortamı ve Kısıtlamalar
Sistem, güvenlik nedeniyle kurum içi (intranet) ağlarda çalışacak şekilde tasarlanmıştır. `analytics.teias.gov.tr` sunucusu dış dünyaya kapalıdır. Bu nedenle, geliştirme ortamında veya internet üzerinde test yapılırken sistemin çökmemesi için **Mock Data** (Sahte Veri) mimarisi kurgulanmıştır.

---

## 2. Sistem Mimarisi ve Temel Teknolojiler

Proje, klasik Web GIS kütüphanelerinin (Leaflet.js, OpenLayers, Mapbox GL vb.) getirdiği hantallıktan kaçınmak ve tam kontrol sağlamak adına Native DOM ve SVG teknolojileri üzerine inşa edilmiştir.

### 2.1. Kullanılan Ana Teknolojiler
- **Vanilla JavaScript (ES6+):** Hiçbir framework (React, Vue vb.) kullanılmadan, doğrudan DOM manipülasyonu ile performans maksimize edilmiştir.
- **Native SVG (Scalable Vector Graphics):** Hatlar, yön okları, trafo merkezleri ve baralar doğrudan `id="overlaySvg"` içerisine DOM elementleri olarak basılmaktadır. Bu sayede CSS ile anlık renk, transformasyon ve animasyon (akış simülasyonu) uygulamak mümkün olmaktadır.
- **Chrome Extensions API V3:** Eklentinin arka plan görevleri `Service Worker` (`background.js`) üzerinden asenkron yürütülür. `chrome.tabs`, `chrome.scripting`, `chrome.downloads` yetkileri kullanılır.
- **Python 3:** Ham KML verilerini optimize edilmiş hiyerarşik JSON (`kml_layers_v2.json`) dosyalarına dönüştürmek için çevrimdışı derleme senaryolarında kullanılır.

### 2.2. Dizin ve Dosya Yapısı (Çok Ayrıntılı Döküm)

Sistemdeki her bir dosyanın özel bir görevi vardır. Aşağıdaki tabloda proje ağacının ayrıntılı bir listesi sunulmuştur:

| Dosya / Klasör Yolu | Tip | Açıklama ve Görev |
|---------------------|-----|-------------------|
| `manifest.json` | Ayar | Chrome eklenti izinleri ve versiyon tanımları. |
| `background.js` | JS Script | Arka planda çalışan servis (Service Worker). SCADA Superset fetch istekleri ve login otomasyonu. |
| `content-script.js` | JS Script | Hedef web sayfalarına müdahale etmek için enjekte edilen script. |
| `map-modern.html` | HTML | Modern UI tasarımına sahip ana harita arayüzü ve kenar çubuğu. |
| `map-modern.css` | CSS | Modern arayüzün (Dark Mode destekli) tüm stil şablonları. |
| `map.html` | HTML | Legacy (eski) arayüz yapısı. Geriye dönük uyumluluk için tutulur. |
| `map.css` | CSS | Eski arayüze ait stiller. |
| `popup.html` | HTML | Chrome eklenti ikonuna tıklanınca açılan menü. |
| `popup.css` | CSS | Açılır menü stilleri. |
| `popup.js` | JS Script | Açılır menünün içindeki buton tetikleyicileri. |
| `map-modern.js` | JS Script | Harita UI etkileşimlerini yöneten ana event kontrolcüsü. |
| `map-common.js` | JS Script | Koordinat, zoom, SVG scale, pan (kaydırma) işlemlerini barındıran çekirdek kütüphane. |
| `map-v2-runtime.js` | JS Script | `kml_layers_v2.json` verisini DOM üzerine renderlayan ana çizim motoru. |
| `scada-client.js` | JS Script | Background script ile haberleşerek veriyi çeken ve formatlayan katman. |
| `scada-common.js` | JS Script | SCADA eşleştirme kuralları, metrik hesaplama, isim normalize etme algoritmaları. |
| `scada-flow.js` | JS Script | SVG üzerine "akış (flow)" ve "ısı haritası (heatmap)" renklerini çizen animasyon motoru. |
| `scada-v2-runtime.js` | JS Script | V2 veri modeliyle SCADA arasındaki bağlantıyı sağlayan entegrasyon dosyası. |
| `data/scada_auth.json` | JSON | **GİZLİ!** Superset kullanıcı adı, şifresi ve dashboard bilgilerini tutan özel ayar dosyası. |
| `data/mock_scada.json` | JSON | Çevrimdışı (Intranet dışı) testler için anonimleştirilmiş sahte SCADA verisi. |
| `data/kml_layers_v2.json` | JSON | Haritada çizilecek binlerce noktanın derlenmiş hiyerarşik JSON topolojisi (34MB). |
| `build_kml_layers_v2.py`| Python | Ham KML dosyalarını okuyarak `data/kml_layers_v2.json` üreten dönüştürücü. |
| `build-extension.ps1` | Script | Projeyi production (canlı) ortama hazır `dist/` klasörüne paketleyen PowerShell komut dizisi. |
| `tests/` | Klasör | Birim testlerini (Smoke, Mock, Parsing) barındıran test dosyaları koleksiyonu. |
| `docs/` | Klasör | Geliştirme süreçlerine dair CSV ve MD formatındaki ekstra dokümanlar. |

---

## 3. Harita Sekmesi ve Kullanıcı Arayüzü (Ayrıntılı İnceleme)

`map-modern.html` üzerinde toplanan harita arayüzü, gelişmiş bir Sidebar (Kenar Çubuğu) ve interaktif bir Map Viewport (Harita Çerçevesi) sunar. 

### 3.1. Araçlar ve Kontroller (Tools Panel)
- **Arama Motoru (Search Shell):** `Bara, TM veya hat ara` uyarısı veren input alanına metin girildiğinde;
  - Önce `kml_layers_v2.json` indeksleri taranır.
  - Eşleşen element bulunursa, harita o elementin koordinatlarına Fractional Zoom matematiği ile anında kayar.
  - Bulunan elementin üzerine dikkat çekici bir "Ping" (SVG çember) animasyonu eklenir.
- **Tema Değiştirme Butonu (btnThemeToggle):** CSS değişkenleri (`var(--accent)`, `var(--bg)`) üzerinden açık ve koyu tema arasında (Dark Mode / Light Mode) dinamik geçiş sağlar.
- **Filtreye Odakla (btnFitFilters):** O an açık olan filtrelerin (örn: Sadece 400kV ve sadece Gölbaşı YTM) bounding box (sınır) koordinatlarını hesaplar ve haritayı tam bu alana sığdıracak şekilde yakınlaştırır.
- **Haritayı Sıfırla (btnResetView):** Zoom seviyesini Türkiye geneline (genellikle Z: 5 veya 6) döndürür ve merkez koordinatlarını Anadolu'ya odaklar.

### 3.2. İstatistik Paneli (Stats Panel)
Ekranda (görünür viewport alanında) bulunan öğelerin dinamik sayımı yapılır:
- **Bara Count (`#baraCount`):** Ekranda görünen bara sayısı.
- **TM Count (`#tmCount`):** Ekranda görünen Trafo Merkezi sayısı.
- **Hat Count (`#hatCount`):** Ekranda görünen iletim/dağıtım hattı sayısı.
*Not: Harita her kaydırıldığında (pan) veya yakınlaştırıldığında (zoom) bu sayılar `Intersection` algoritmalarıyla milisaniyeler içinde tekrar hesaplanır.*

### 3.3. Hat Gösterim Modları
Binlerce hattın ekranda oluşturduğu karmaşayı önlemek için üç mod sunulur:
1. **Detaylı (Detailed):** Hatlar KML dosyasındaki tüm kırılım noktalarıyla, virajlarıyla, fiziksel rotalarına tam sadık kalarak haritaya çizilir. Performans maliyeti en yüksektir.
2. **Sade (Simplified):** Kırılım noktaları tamamen silinir. A noktası (Başlangıç TM) ile B noktası (Bitiş TM) arasına dümdüz bir çizgi (Line) çekilir. Hızlı analiz ve SCADA okuması için idealdir.
3. **Sade (Ayrık / Spaced):** Paralel giden hatlar (Örn: A-B hattı 1 ve A-B hattı 2) sade modda üst üste biner ve tek hat gibi görünür. "Sade Ayrık" modunda ise matematiksel bir `offset` (kaydırma x, y koordinatlarında) uygulanarak çizgiler birbirine paralel uzanacak şekilde görsel olarak ayrılır.

### 3.4. Katman Filtreleri (Layers)
Kullanıcı, arayüzdeki "Katmanlar" (Layers) detayı altından işaret kutuları (checkbox) ile şu öğeleri açıp kapatabilir:
- **Baralar:** Yuvarlak, renkli düğüm noktaları.
- **Trafo Merkezleri (TM):** Genellikle üçgen veya daha büyük dairesel SVG yapılar.
- **Hatlar:** İletim çizgileri.
- **Trafolar (İletim/Dağıtım):** Şebekenin ana enerji dönüştürme birimleri.
- **Bara Setleri:** Saatlik analizler için özel overlay katmanı.

### 3.5. Gerilim (kV) Filtreleri
Türkiye iletim standartlarında renk kodlaması:
- **400 kV (Kırmızı Tonları):** Ana iletim otobanları.
- **154 kV (Yeşil/Mavi Tonları):** Şehirlerarası alt iletim.
- **66 kV (Sarı Tonları):** Eski ve yerel sistem hatları.
Kullanıcılar bu checkboxları kapatarak sadece ilgilendikleri gerilim seviyelerine ait şebekeyi analiz edebilirler.

### 3.6. YTM (Yük Tevzi Müdürlüğü) Filtreleri
Tüm Türkiye; Adapazarı, Ankara (Gölbaşı), İstanbul, İzmir, Keban gibi bölgesel YTM'lere bölünmüştür. Harita üzerinden belirli bir YTM kapatıldığında, o bölgeye ait elemanların haritadaki `display` stili sıfırlanır, böylece CPU ve RAM rahatlar.

### 3.7. Bara Set Zaman Çizelgesi
`btnLoadBaraSet` butonu üzerinden kullanıcının yerel bilgisayarından `.xls` veya `.xlsx` yüklemesi istenir. 
- Yüklenen veri, `xlsx.full.min.js` yardımıyla tarayıcıda parse edilir.
- Slider (kaydırıcı) objesi kullanılarak 0'dan 23'e (24 saat) geçiş yapılır.
- Her saat değişiminde, haritadaki baraların üzerine **kV** veya **p.u.** cinsinden değerler kutu (box) olarak basılır. Voltaj düşüklükleri izlenir.

---

## 4. Harita Render Motoru: Fractional Zoom ve Native SVG Altyapısı

Bu uygulamanın harita kısmı hiçbir şekilde Leaflet, OpenLayers veya Google Maps bağımlılığı içermez. Çıplak (Native) web teknolojileri kullanılarak yazılmıştır. Neden? Çünkü DOM'a doğrudan müdahale etmek, yüz binlerce hat segmenti olan şebekede saniyede 60 kare (60FPS) akış animasyonları gösterebilmek için tek yoldur.

### 4.1. Tile (Karo) Altyapısı ve Fractional Zoom
```html
<div id="tileLayer" class="tile-layer"></div>
```
- Ekranda 256x256 piksellik arka plan resimleri (Tile'lar) sıralanır.
- Kullanıcı Mouse Scroll ile küsüratlı yakınlaştırma yaptığında (Örn: 5.5 Zoom);
  - Geleneksel kütüphaneler bu işlemi bulanık bir geçişle veya ağır bir şekilde çözümlerken, bizim sistemimiz Tile'ları tam sayı olan (Z=5) seviyesinde çeker.
  - Daha sonra `transform: scale(1.41)` gibi bir CSS fonksiyonu ile SVG ile eş zamanlı büyütür. Bu işleme "Fractional Zoom" denir.

### 4.2. SVG Overlay (Arayüz Katmanı)
```html
<svg id="overlaySvg" class="overlay-svg">
  <g id="hatLayer"></g>
  <g id="flowLayer"></g>
  <g id="tmLayer"></g>
  ...
</svg>
```
Bütün elektrik ağ topolojisi, `<path>`, `<circle>`, `<rect>` gibi native SVG elemanları olarak `<g>` (grup) etiketleri altına eklenir. `map-v2-runtime.js` içerisindeki render döngüsü, KML verisini DOM'a aktarır.

---

## 5. SCADA ve Superset Entegrasyonu (Arka Plan Otomasyonu)

Eklentinin asıl zekası, kullanıcının hiçbir şifre girmesine gerek kalmadan, tamamen arka planda (background.js üzerinden) Apache Superset'e bağlanıp, veriyi çekip haritaya aktarmasıdır.

### 5.1. SCADA_FETCH Akışı (Message Passing)
Haritadaki "Oto Yenile" (Auto Refresh) checkbox'ı işaretli olduğunda her 1 ila 5 dakikada bir tetiklenir:
1. `map-modern.js`, `scada-client.js`'e veriyi güncellemesini söyler.
2. `scada-client.js`, Chrome Extensions API'sini kullanarak arka plana mesaj yollar:
```javascript
chrome.runtime.sendMessage({
  type: 'SCADA_FETCH',
  payload: {
    dashboardId: 89,
    elementName: 'P' // Aktif Güç
  }
});
```

### 5.2. Superset API Kontratı ve Payload (Sorgu İçeriği)
`background.js` içindeki `buildChartPayload()` fonksiyonu, aşağıdaki JSON'u inşa ederek `https://analytics.teias.gov.tr/api/v1/chart/data` adresine `POST` isteği atar.

**Örnek Superset Payload (Kısaltılmış):**
```json
{
  "datasource": { "id": 3, "type": "table" },
  "force": true,
  "form_data": {
    "slice_id": 454,
    "viz_type": "table",
    "granularity_sqla": "__time",
    "time_range": "DATEADD(DATETIME(\"now\"), -24, hour) : now",
    "groupby": ["sinsid", "b1Name", "b2Name", "b3Name", "elementName"],
    "metrics": [
      { "label": "MAX(__time)", "expressionType": "SQL", "sqlExpression": "MAX(__time)" },
      { "label": "AVG(maxValue)", "expressionType": "SQL", "sqlExpression": "AVG(maxValue)" }
    ],
    "adhoc_filters": [
      {
        "clause": "WHERE",
        "subject": "elementName",
        "operator": "==",
        "comparator": "P"
      }
    ],
    "row_limit": 50000
  }
}
```
Bu sayede veritabanına büyük bir yük bindirmeden, sadece son 24 saatin maksimum (en güncel) verisi SQL seviyesinde derlenerek haritaya JSON formatında geri döner.

---

## 6. Otomatik Giriş (Auto-Login) Sisteminin Kusursuz Mimarisi

Superset gibi sistemler güvenlik gereği oturumları sık sık düşürür (Session Timeout). Bu durum analizciyi çalışırken bezdirir. Eklentimiz `background.js` içinde çok özel bir "Fallback" (Yedekli) giriş mekanizması barındırır.

### 6.1. Birinci Aşama: Session Reuse (Oturumun Yeniden Kullanımı)
Öncelikle tarayıcının mevcut çerezleri (cookies) denenir. `fetch` isteği `credentials: 'include'` ile yollanır. 200 OK gelirse şifre girmeye gerek kalmaz.

### 6.2. İkinci Aşama: Direct-Login (Gizli POST İsteği)
Eğer sunucu 401/403 dönerse, eklenti `data/scada_auth.json` dosyasını okur.
- Eklenti arka planda Superset'in `GET /login/` sayfasına görünmez bir istek atar.
- Gelen HTML cevabının içindeki CSRF (Cross-Site Request Forgery) tokenları Regex ile bulunur.
- Kullanıcı adı ve şifre ile bir x-www-form-urlencoded paketi hazırlanarak `POST /login/` yollanır. Bu işlem saniyeden kısa sürer.

### 6.3. Üçüncü Aşama: Hidden-Tab Fallback (Sıfır Hata Yöntemi)
Bazı Single Sign-On (SSO) altyapılarında veya yönlendirme (redirect) kurallarında Direct-Login başarısız olabilir. Bu durumda en "ilkel ama kesin" yöntem devreye girer:
1. Kullanıcı hissetmeden Chrome'un arka planında `active: false` parametresiyle yeni bir gizli sekme açılır.
2. `chrome.scripting.executeScript` metoduyla o sekmeye JavaScript kodu enjekte edilir.
3. Formdaki kullanıcı adı ve şifre inputları bulunup sanal klavye vuruşlarıyla doldurulur (`dispatchEvent(new Event('input'))`).
4. `form.submit()` tetiklenir.
5. Oturum açıldığında sekme kendini imha eder (kapatılır) ve veri çekme işlemi başarıyla tamamlanır.

---

## 7. SCADA Verisi ile Haritanın Eşleştirilmesi (Matching)

Superset'ten veya Mock veriden çekilen anlık güç verilerinin (MW), statik harita çizgileriyle bütünleşerek "canlı" bir organizmaya dönüşmesi, projenin en büyük otomasyon başarılarından biridir. Bu süreç `scada-common.js`, `scada-client.js` ve `scada-flow.js` dosyalarının koordine çalışmasıyla sağlanır.

### 7.1. SCADA İndeksleme ve Eşleştirme (Matching) Algoritmaları
Eşleştirme işlemi, harita üzerindeki her bir cisme (Hat, Trafo) JSON veri kümesinden tek tek arama yapılarak **gerçekleştirilmez**. Tarayıcının ana işlemcisini kilitlememek için şu algoritma izlenir:

1. **Ön-İndeksleme (Build Index):** Harita ilk yüklendiğinde, `scada-client.js` içerisindeki `scadaBuildIndex()` fonksiyonu çalışır. Haritadaki tüm hatların `olcumNoktasiIdAktif` değerleri okunarak bir `Map` (Hash Table) oluşturulur (`hatsBySinsid`). Böylece O(1) hızında eşleşme aranabilir.
2. **Kopya (Duplicate) Denetimi:** Aynı SCADA ölçüm kimliği (`sinsid`) birden fazla harita çizgisine tanımlanmışsa (Örn. hatalı KML verisi), sistem bu kimliği `duplicateMappings` listesine alır. Kopya hatlar canlı renklendirme (Flow) dışı bırakılır, böylece hatalı yönlendirmelerin önüne geçilir.
3. **Normalizasyon (`scada-common.js`):** Superset'ten dönen düz (flat) JSON dizisi `normalizeScadaRows()` ile temizlenir. Birden çok tarih kaydı varsa, `MAX(__time)` hücresine bakılarak sadece en güncel tarihli veri belleğe alınır.
4. **Snapshot Uygulaması (`applyScadaSnapshot`):** SCADA'dan gelen taze veriler, İndeks Haritasındaki (Hash Table) hatlarla eşleştirilir. 

### 7.2. Yüklenme (% Loading) ve Yön (Direction) Matematiği
Bir SCADA ölçüm satırı (`sinsid`), İndeks Haritasındaki (`hatsBySinsid`) bir hatta başarıyla eşleştiğinde `scada-client.js` içerisindeki `applyScadaSnapshot()` fonksiyonu tetiklenir ve sırasıyla şu matematiksel hesaplamalar yapılır:

1. **Akış Yönü (Direction) ve Polarizasyon Tespiti:**
   SCADA'dan gelen `activePowerMw` değerinin haritada hangi yöne doğru akacağını hesaplayan modüldür. KML ve Excel topolojisi derlenirken (`build_kml_layers_v2.py` -> `enrich_hat_candidate`), haritadaki A noktası (Başlangıç TM) ve B noktası (Bitiş TM) için bir **Terminal Polarizasyonu (Polarization Sign)** çıkarılır.
   * Superset formülündeki ölçüm noktası **A noktasındaysa (Start)**, `polarization_sign = 1` atanır.
   * Formüldeki ölçüm noktası **B noktasındaysa (End)**, `polarization_sign = -1` atanır.
   * `scada-client.js` tarafına gelen `activePowerMw` değeri eğer sıfırdan büyük veya eşitse `direction = 'forward'`, küçükse `direction = 'reverse'` olarak işaretlenir. 
   * Eğer nihai yön **ters (reverse)** ise, `scada-flow.js` tarafında çizilen görünmez animasyon vektörü `.reverse()` metoduyla çevrilir ve oktan parçacıklar haritada ters yöne doğru koşturulur.

   **Örnek Senaryolar:**
   * **Örnek 1 (Pozitif Akış - A'dan B'ye):** Hat Keban TM (A) ile Karakaya TM (B) arasında. SCADA verisi `+150 MW` gelirse, akış Keban'dan Karakaya'ya doğrudur. Yön `forward` olur.
   * **Örnek 2 (Negatif Akış - B'den A'ya):** Aynı hat için SCADA verisi `-85.5 MW` gelirse, akış Karakaya'dan Keban'a dönmüştür. Yön `reverse` olur ve `scada-flow.js` animasyonu tersine oynatır.
   * **Örnek 3 (Terminal Karmaşası - Ambiguous):** Eğer Excel formülünde ölçüm noktası tespit edilemezse (`terminalSideUnknown`), sistem varsayılan olarak Excel sırasını (A'dan B'ye) kabul eder ancak loglara `polarizationMismatch` uyarısı düşer.

   **Teknik Terimler Sözlüğü (Bu Bölüm İçin):**
   * **Terminal Polarizasyonu:** Ölçüm cihazının hattın hangi ucunda (A veya B) bulunduğuna göre akış vektörünün (+1 veya -1) işaretlenmesi işlemidir.
   * **Forward / Reverse (İleri / Geri):** Vektörel çizimde hattın başlangıcından bitişine (Forward) veya bitişinden başlangıcına (Reverse) giden rotayı belirtir.
   * **activePowerMw:** Hattan geçen aktif gücün Megawatt (MW) cinsinden sayısal ve işaretli değeridir. İşaret (+ veya -) direkt olarak yönü ifade eder.
   * **.reverse() Metodu:** JS Array veya SVG path'lerinin uç noktalarının yer değiştirmesi işlemidir. Geriye akan güçlerde animasyon rotasını döndürmek için kullanılır.

2. **Kapasite Seçimi ve Yüzdelik Yüklenme (Loading Pct):**
   Uygulamanın kenar çubuğundan operatörün seçtiği mevsime ("Yaz" veya "Kış") göre ilgili hattın Excel'den alınan `summerCapacityMva` veya `winterCapacityMva` limit değeri `capacityMva` değişkenine alınır. Eğer seçilen mevsim kapasitesi `0` veya eksikse, sistem otomatik olarak diğer mevsimin kapasitesine Fallback (Geri Dönüş) yapar; o da yoksa güvenli bölme işlemi (Divide by Zero hatasını engellemek) için `1` kabul edilir.
   Daha sonra yüklenme yüzdesi `loadingPct = (Math.abs(row.activePowerMw) / capacityMva) * 100` formülüyle bulunur.
   * **Örnek:** Seçili mevsim "Yaz", hattın yaz kapasitesi `1000 MVA`, kış kapasitesi `1200 MVA` olsun. Gelen güç `-450 MW` ise formül şu şekilde çalışır: `Math.abs(-450) / 1000 * 100`. Sonuç olarak hattın `%45` yüklü olduğu tespit edilir ve yeşil renge boyanır. Mevsim "Kış" seçilseydi oran `%37.5` çıkardı.

3. **Bayatlık Testi (Staleness ve Veri Kalitesi):**
   SCADA'dan gelen paketin zaman damgası (`row.timestamp`), tarayıcının o anki yerel saatiyle (`nowMs = Date.now()`) karşılaştırılarak `ageSec` (Saniye cinsinden veri yaşı) hesaplanır.
   Sistem yapılandırmasındaki (`SCADA_CONFIG`) eşik değerlerine göre verinin tazeliği derecelendirilir:
   * `ageSec > 3600` (60 dakika): Veriye `staleState = 'dead'` (Bayat) damgası vurulur.
   * `ageSec > 600` (10 dakika): Veriye `staleState = 'warn'` (Gecikmeli) damgası vurulur.
   * `ageSec <= 600`: Veriye `staleState = 'live'` (Canlı) damgası vurulur.
   Bayat veriler canlı renkler yerine `SCADA_CONFIG.STALE_COLOR` (varsayılan: Turuncu/Sarı) rengine boyanır. Eğer bir SCADA paketi hiç gelmezse (örn. sorguda hata çıkarsa), önceki turdan kalan tüm hatlar iterasyondan geçerek `dead` damgasıyla şeffaflaştırılır ve görünmez animasyonlara dönüştürülür (`unavailable = true`).
   * **Örnek:** Şu an saat `14:30` olsun. Superset'ten gelen veri paketi `13:15` zaman damgasına sahipse, aradaki fark 75 dakika (`ageSec = 4500`) olur. 60 dakikalık (`3600 sn`) eşik aşıldığı için bu hatta `%80` yüklenme olsa bile kırmızı yanmaz; soluk turuncu bir renkle `dead` state'inde gösterilir. Eğer veri `14:25` tarihli olsaydı aradaki fark 5 dakika olacağından `live` state'inde yani tam performanslı canlı renklendirme ile çizilirdi.

### 7.3. Görselleştirme ve Renklendirme Modları (Display Modes)
Matematiksel eşleşmesi tamamlanan hatlar, `scada-flow.js` tarafında anında SVG katmanına (Flow Layer) renderlanır. Kenar çubuğundaki (Sidebar) ayarlara göre farklı görselleştirme teknikleri vardır:

1. **Isı Haritası (Heatmap) ve Yüklenme:** Hattın hesaplanan `loadingPct` (Yüklenme Yüzdesi) değerine göre çizgi genişliği (`getFlowWidth`) ve rengi (`getFlowColor`) anlık değişir:
   - `< %30:` Yeşil (Normal)
   - `%30 - %55:` Sarı (Dikkat)
   - `%55 - %65:` Turuncu (Uyarı)
   - `%65 - %80:` Kırmızı (Kritik)
   - `> %90:` Mor (Aşırı Yüklenme / Overload)
2. **Akış Animasyonu (Flow Arrows):** `renderFlowLayer()` fonksiyonu, statik çizginin üzerine görünmez bir animasyon rotası (`<path>`) ekler. Gücün aktığı yöne doğru koşan oklardan (`<animateMotion>`) oluşan bu parçacıklar, `getArrowSpeed` fonksiyonuyla yönetilir. Hat ne kadar yüklenmişse oklar o kadar **hızlı** akar, hat ne kadar uzunsa ekrana o kadar **çok ok** çizilir.
3. **Sade ve Ayrık Görünüm:** Karmaşık Trafo Merkezlerinde yüzlerce çizgi üst üste binebilir. "Sade-Ayrık" modunda `offsetLine()` geometrisi devreye girer ve paralel hatları (Örn: A-B hattı 1 ve 2) birbirinden 4 piksel ayırarak, iç içe geçmelerini engeller.

---

## 8. Veri Kalitesi, Denetim (Audit) ve Hata Raporlaması

Harita üzerindeki güçler izlenirken, hangi verinin güvenilir olduğu, hangi verinin sistem arızasından kaynaklı "donuk" kaldığı hayati önem taşır. Eklenti bu konuda 4 temel kalite filtresi kullanır.

### 8.1. Hata Türleri Sınıflandırması
1. **Duplicate Mappings (Çift Düşen Kayıtlar):** Aynı SCADA kimliğine sahip verinin haritada iki farklı hatta bağlanmış olması durumudur. Bu hatlar görselleştirmede soluk (muted) bırakılır.
2. **Ambiguous Rows (Belirsiz Eşleşmeler):** İsim benzerliği çok olan ve hangi hatta ait olduğu saptanamayan veriler.
3. **Stale Data (Bayat / Eskimiş Veri):** Superset'ten dönen `MAX(__time)` değeri, şu anki saatten 30 dakika veya daha eskiyse, RTU cihazı veya iletişim hattı kopmuş demektir. Veri "Bayat" (Stale) sayılarak görselde farklı bir opasite (%50 şeffaf) ile gösterilir.
4. **Unmatched (Kaynağı Olmayan):** KML'de hattı olan ancak SCADA'da kaydı bulunamayan ölü hatlar.

### 8.2. Denetim ve CSV Dışa Aktarımı
Analizcilerin sorunlu hatları bulması için iki özel buton tasarlanmıştır:
- **Mismatch Raporu (Modal Gösterim):** Ekranda hızlıca hataların özetini çıkarır.
- **Denetim CSV (Audit CSV Export):** `scada-client.js` üzerindeki `exportAuditCSV()` metodu çalıştırılarak, o anki harita üzerindeki **tüm hatların** eşleşme durumunu (neden eşleşmedi, ID'si neydi, beklenen Bara adı neydi) satır satır Excel uyumlu CSV formatına döker ve Chrome Downloads API ile cihaza kaydeder.

---

## 9. Kurulum ve Güvenlik Ayarları (`scada_auth.json`)

### 9.1. Geliştirici Ortamında Kurulum
1. Projeyi bilgisayarınıza indirin (Git Clone / ZIP).
2. Chrome veya Chromium tabanlı bir tarayıcıda (Edge, Brave vb.) `chrome://extensions/` adresini açın.
3. Sağ üstteki "Geliştirici Modu" (Developer Mode) anahtarını aktifleştirin.
4. "Paketlenmemiş öğe yükle" (Load unpacked) tuşuna basarak projenin bulunduğu kök klasörü (klasörün içinde `manifest.json` olmalıdır) seçin.
5. Eklenti yüklendikten sonra Chrome çubuğundaki puzzle ikonuna tıklayarak uygulamanın "Açılır Menüsünü" (Popup) görebilir ve haritayı tam ekranda başlatabilirsiniz.

### 9.2. Güvenlik Konfigürasyonu
Uygulamanın Intranet içindeki Superset'e tự động bağlanabilmesi için `data/scada_auth.json` dosyasını manuel olarak oluşturmalısınız.

**`data/scada_auth.json` Şablonu:**
```json
{
  "baseUrl": "https://analytics.teias.gov.tr",
  "username": "sizin_intranet_kullanici_adiniz",
  "password": "sifreniz_gizli_tutulmalidir",
  "dashboardId": 89,
  "chartSliceId": 454,
  "datasourceId": 3,
  "enabled": true
}
```
**ÇOK ÖNEMLİ GÜVENLİK UYARISI:**
Bu dosyada parolanız düz metin (plain text) olarak yer alacaktır. Bu yüzden `.gitignore` dosyası, `data/scada_auth.json` klasörünü ve içeriğini GitHub'a göndermenizi (commit/push) engelleyecek şekilde ayarlanmıştır. Hiçbir koşulda bu dosyayı başkalarıyla paylaşmayın. Eğer `enabled: false` yaparsanız, otomatik giriş sistemi çalışmaz; şifrenizi girmenize gerek kalmaz ve sadece tarayıcıda önceden açılmış olan açık Superset oturumunuz (varsa) kullanılır.

---

## 10. Çevrimdışı Geliştirme, Test ve Mock Veri Kullanımı

Proje ofis dışında, standart bir internet bağlantısında `analytics.teias.gov.tr` sunucusunu çözemeyecektir (DNS Hatası). Kod geliştirmeye devam edebilmek için bir simülasyon (Mock) sistemi kurgulanmıştır.

### 10.1. Mock Veri Dosyası (`mock_scada.json`)
Proje dizininde yer alan `data/mock_scada.json` dosyası, canlı sunucudan daha önce alınmış tamamen yasal ve anonimleştirilmiş dev bir JSON dökümüdür.

### 10.2. "Kaynak" (Mock / Canlı Geçişi) Butonu
Haritadaki SCADA Veri kartında yer alan **"Kaynak" (btnScadaMock)** düğmesine tıklandığında:
- Eklenti canlı sunucuya fetch atmayı anında keser.
- `background.js` içindeki `handleScadaFetch` fonskiyonu, `payload.mockData` üzerinden doğrudan bu yerel dosyayı işlemeye başlar.
- Arayüzde "MOCK" yazısı sarı renkli belirgin bir şekilde ekrana basılır.

Bu sayede geliştiriciler evdeyken, uçaktayken veya internet yokken eşleştirme algoritmaları, SVG boyamaları ve CSS animasyonları üzerinde çalışmaya devam edebilirler.

### 10.3. Birim Testleri (Unit Testing)
Sistemin algoritmik doğruluğunu kanıtlamak için `tests/` klasöründe test dosyaları yazılmıştır. NodeJS ortamında `npm install` komutu ile kütüphaneler kurulduktan sonra;
```bash
npm test
```
komutu ile şu senaryolar test edilir:
- **Eşleştirme Başarısı:** Bara isimlerindeki Türkçe karakterlerin (Ç, Ş, Ğ, Ü, Ö, İ) algoritmalarca yutulmadan doğru parse edilmesi.
- **Fractional Zoom Hesabı:** Küsuratlı zoom'un tile koordinatlarını taşırmaması.
- **SCADA Kalite Puanlaması:** Stale (Bayat) ve Duplicate (Çift) test fixtürlerinin doğru ayırt edilmesi.

---

## 11. KML Veri Derleme: V2 Topolojisi (`build_kml_layers_v2.py`)

Projenin tarayıcı üzerinde akıcı şekilde (60 FPS) çalışabilmesinin anahtarı, XML tabanlı devasa KML dosyalarının harita sekmesinde canlı olarak parse edilmemesidir. Bunun yerine, KML ve Excel topoloji listeleri, Python kullanılarak derlenir (build) ve tarayıcının doğrudan belleğe alabileceği, indexlenmiş bir hiyerarşik JSON yapısına (`data/kml_layers_v2.json`) dönüştürülür.

### 11.1. Derleme Sürecinin Girdileri (Inputs)
Derleme betiği (`build_kml_layers_v2.py`), `docs/yeni_harita_modeli/` dizinindeki 6 temel dosyayı okur:
- **KML Geometrisi:** `20-YTBS_Detayli_Harita (3).kml` (Hat koordinatları ve TM noktaları).
- **Excel Listeleri:** `01-TRAFO_MERKEZI_LISTESI.xlsx`, `02-BARA_LISTESI.xlsx`, `09-HAT_LISTESI.xlsx`, `11-TRAFO_LISTESI.xlsx` (Veri zenginleştirme ve isim normalizasyon listeleri).
- **SCADA Eşleşme Matrisi:** `SISTEM_ESLEME_LISTESI.xlsx` ve `eslesme_tablolari.xlsx` (Hangi hattın, hangi SCADA formülüne sahip olduğunu belirten ölçüm tanımları).

### 11.2. Python Betiğinin Çalışma Mantığı (Algoritmalar)
1. **Veri Temizleme ve Normalizasyon:** Excel dosyalarından okunan tüm Trafo, Bara ve Hat isimleri `normalize_text()` fonksiyonundan geçer. Türkçe karakterler silinir (Ş->S, Ö->O, vb.), büyük harfe çevrilir ve gereksiz boşluklar atılarak tam eşleşme (Exact Match) aramasına hazır hale getirilir.
2. **KML BBox (Bounding Box) Çıkarımı:** KML içindeki `LineString` koordinatları diziye alınır ve her hattın Min-Max (Enlem/Boylam) sınırları hesaplanarak `bbox` niteliğine yazılır. Bu, tarayıcıda filtreye odaklanma (`btnFitFilters`) işlevini milisaniyeler içinde çözer.
3. **SCADA Formül Ayrıştırması:** Excel'deki `ÖLÇÜM NOKTASI FORMÜLASYONU` sütunu (Örn: `(+1) ISTANBUL_TM, 400, KOCAELI_TM, P`) Regex ile parçalanır. Terminalin artı (+1) mı eksi (-1) mi basacağı, hedefin (TargetCode) hangi Trafo Merkezine denk düştüğü saptanır.
4. **Hat Terminal Polarizasyonu (Polarization):** Çizgilerin (hatların) yönü KML'de rastgele çizilmiş olabilir. Python betiği; "Start TM" ve "End TM" tanımlarını SCADA formülündeki Hedef ve Kaynak TM ile karşılaştırarak "Akış Yönü" matematiğini kurgular. Uyumsuz olan polarizasyonlar raporlanır.
5. **Hiyerarşik Ağaç (Tree) Oluşturumu:** Veriler düz bir liste olarak değil, `YTM (Yük Tevzi Müdürlüğü) > Gerilim (kV)` dallanmasıyla dev bir `dict` yapısında toplanır. Böylece haritada "154 kV Filtresini Kapat" dendiğinde sadece o dal döngüden çıkarılır.

### 11.3. Validasyon Raporu (`kml_layers_v2_validation.md`)
Derleme her bittiğinde, betik bir doğrulama ve sağlamlık (health check) raporu oluşturur. Bu raporda:
- **Eşleşme Sayıları:** Kaç TM (`1583/1583`) ve Kaç Hat (`2341/2341`) KML ile Excel arasında başarılı eşleşti.
- **SCADA Kapsamı:** Hat Aktif/Reaktif eşleşme oranları (Örn: 2290/2341).
- **Ambiguous (Belirsiz) Kayıtlar:** İsim benzerliği sebebiyle çatışan SCADA kayıtları.
- **Gerilim Overlay:** Hangi baraların eşleştiği veya alias fallback ile bulunduğu şeffafça yazdırılır.

### 11.4. Python Derleyicisini Çalıştırma
Sisteme yeni bir TM veya Hat eklendiğinde KML dosyasını ve Excel'i güncelledikten sonra şu komutu çalıştırmalısınız:

```bash
pip install openpyxl
python build_kml_layers_v2.py
```
Bu işlem yaklaşık 1-2 saniye sürer ve 34 MB büyüklüğünde, tamamen optimize edilmiş `data/kml_layers_v2.json` dosyasını kullanıma hazır hale getirir.

---

## 12. Sıkça Sorulan Sorular (SSS) ve Geliştirici Notları

**S: Harita bazen bembeyaz görünüyor, neden?**
C: Tile sunucusuna erişiminiz kurum ağı kaynaklı engellenmiş olabilir. Arayüzden "Tema" tuşuna basarak (Dark Mode) varsayılan haritanın yüklenip yüklenmediğini kontrol edin. Mock Moda almayı deneyin.

**S: Yeni bir SCADA metriği (Örneğin Akım / Amper) eklemek istersem ne yapmalıyım?**
C: `map-modern.html` içine yeni bir buton `<button data-scada-metric="amper">` ekleyin. Ardından `scada-flow.js` ve `scada-common.js` içindeki Metric Dictionary yapılarına "amper" değişkeninin karşılığını (Superset'teki kolon adı) tanıtın.

**S: Türkçe Karakterlerde sorun yaşıyorum?**
C: `scada-common.js` içindeki `normalizeBaraAd()` fonksiyonu, Türkçe karakterleri (Ü, Ş, Ğ, Ç, İ, Ö) tamamen İngilizce karakterlere normalize eden özel Regex blokları kullanır (`Ş` -> `S`, `İ` -> `I` vb.). Kodlara müdahale ederken dosya formatınızın her zaman `UTF-8` olduğundan emin olun. Kesinlikle ANSI kodlaması kullanmayın.

---

## 13. Sürüm ve Katkı Durumu
Bu sürüm, **Otomasyon V1** mimarisinin tamamlanmış halidir. Gelecekte eklenecek olan üretim tahmini (Forecast), yapay zeka destekli yük analizi (AI Load Prediction) veya RGDH performans takipleri bu mimarinin üstüne modüler biçimde inşa edilecektir. 

Geliştirici ekibe katkı sağlamak (Pull Request) veya hata (Issue) bildirmek için GitHub reponuzdaki "Issues" sekmesini veya dahili Git sistemlerinizi kullanabilirsiniz.

*Dokümantasyon Kod Cihazı: Antigravity AI tarafından derlenmiş ve düzenlenmiştir.*
