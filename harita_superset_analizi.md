# Eklenti "Harita Göster" ve Superset Entegrasyon Analizi

Bu rapor, eklentinin (Chrome Extension) "Harita Göster" işlevinin nasıl çalıştığını, Superset üzerinden verileri nasıl çektiğini ve gerçekleştirilen parite düzenlemelerini detaylandırmaktadır.

## 1. "Harita Göster" Sayfasının Açılması
Kullanıcı eklenti menüsündeki (popup) "Harita Göster" butonuna tıkladığında, popup.js içerisinde bulunan openMapPage fonksiyonu tetiklenir. Bu fonksiyon chrome.tabs.create({ url: chrome.runtime.getURL('map-modern.html') }); çağrısını yaparak eklenti dosyaları arasındaki **map-modern.html** sayfasını yeni bir sekmede açar.

## 2. Sayfa Yapısı ve Bileşenler
**map-modern.html**, haritanın gösterildiği ana kullanıcı arayüzüdür. Sayfada şunlar yer alır:
- map-modern.css ile modern harita görünümü (UI) stillendirilir.
- Sayfa yüklendiğinde map-common.js, scada-common.js, scada-client.js, scada-flow.js, map-v2-runtime.js ve scada-v2-runtime.js gibi script dosyaları haritanın çalışmasını sağlar.
- map-modern.js haritanın DOM olaylarını ve görselleştirmesini kontrol eder.

## 3. Superset'ten Veri Çekme Akışı (Data Flow)

Haritadaki verilerin güncellenmesi ve Superset'e bağlanılması scada-v2-runtime.js ve arkaplan (background) servisi üzerinden gerçekleştirilir. Süreç şu şekilde ilerler:

1. **İstekte Bulunma (scada-v2-runtime.js):**
   Zamanlanmış (auto-refresh) veya manuel tetiklenen güncellemeler scadaDoFetch fonksiyonuyla başlar. Bu fonksiyon eklentinin arkaplan servisine chrome.runtime.sendMessage({ type: 'SCADA_FETCH', payload: ... }) ile mesaj gönderir. Eklentilerde dış kaynaklara doğrudan istek atmak yerine işlem arkaplan servis çalışanına (background worker) devredilir.

2. **Arkaplan İşlemleri (background.js):**
   Arkaplan dosyası gelen isteği yakalar ve handleScadaFetch fonksiyonuna yönlendirir.
   - **Yetkilendirme (CSRF Token):** Superset API'si kimlik doğrulama gerektirir. İstek öncesinde getSupersetCsrfToken fonksiyonu ile /api/v1/security/csrf_token/ uç noktasına gidilerek güncel bir CSRF token alınır. Ayrıca /api/v1/me uç noktası kullanılarak oturumun geçerliliği alidateSupersetSession ile test edilir. Bu adımdaki kimlik bilgileri diagnosticUser ile saklanır.
   - **Veri Çekme (Fetch):** Kimlik doğrulama başarılı olduğunda, uildChartPayload kullanılarak sorgu yapısı oluşturulur. Ardından /api/v1/chart/data?dashboard_id=&force=true adresine POST isteği atılır. Bu aşamada V2 haritası varsayılan olarak kvFilters ve 	earFilters kısıtlamalarını göndermez.

3. **Verinin İşlenmesi ve Görselleştirilmesi:**
   - ackground.js'den dönen JSON verisi scada-v2-runtime.js'e iletilir.
   - scada-common.js içindeki 
ormalizeMetricRows fonksiyonu ile Superset veri dizisi taranarak (deterministik parser kullanılarak) ölçüm ID'lerine göre gruplanır.
   - esolveHatMetricByTolerance fonksiyonu, ölçüm adaylarını (candidate resolution) değerlendirir. 	olerance-primary yöntemi kullanılarak birincil (primary) aday tercih edilir. Önceden kullanılan ortalama alma (tolerance-mean) yöntemi iptal edilerek Superset'teki orijinal sourceValue değeri korunur.
   - İşlenen veriler ctive.sourceValue (Superset'ten alınan gerçek değer) ve ctive.flowValue (haritadaki yön/polarizasyon hesaplarında kullanılan değer) olarak birbirinden ayrılır.
   - İşlem sonrasında değerler, haritada CANLI veya ÖNBELLEK olduğu ayırt edilerek gösterilir.
   - Timestamp'ler üzerinde otomatik saat çıkarma işlemi yapılmadan, awTimestampString korunarak deterministik bir şekilde ele alınır.

## 4. Query Builder Birleştirmesi
Daha önce ackground.js ve scada-common.js'de tekrarlanan uildChartPayload sorgu yapılandırması tekilleştirilmiştir. Artık ackground.js de SCADA_COMMON.buildChartPayload kullanarak tek source-of-truth ilkesine uymaktadır.

## 5. Güvenlik İyileştirmeleri (Credential Gate)
data/scada_auth.json içerisindeki hassas yetki bilgileri uild-extension.ps1'deki bir denetim bloğu ile build/dist ZIP dosyasının içine girmesi kesin olarak engellenmiştir. Örnek bir data/scada_auth.example.json oluşturulmuştur.
Not: Eklenti manifestosundaki <all_urls> izni, TPYS ve RGDH modüllerine bağlı sebeplerden ötürü şu an için daraltılmamış, bir güvenlik borcu olarak değerlendirilmiştir.

## 6. Doğrulama Durumu (Superset Parity)
- Kod ve fixture düzeyinde Superset parity (veri eşitliği) sorunları (tolerance-mean hatası, source/flow ayrımı vb.) çözülmüştür.
- Koddaki Query Contract'ta MAX(__time) ve AVG(maxValue) yapısı mevcuttur. Ancak canlı Superset bağlantısına ulaşılamadığı için, Chart 454 üzerindeki canlı query sözleşmesi doğrudan **doğrulanamamıştır**.

