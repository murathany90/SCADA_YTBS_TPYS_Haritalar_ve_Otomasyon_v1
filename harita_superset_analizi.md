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

1. **İstekte Bulunma (scada-v2-runtime.js):**
   Zamanlanmış (auto-refresh) veya manuel tetiklenen güncellemeler scadaDoFetch fonksiyonuyla başlar. Bu fonksiyon eklentinin arkaplan servisine chrome.runtime.sendMessage({ type: 'SCADA_FETCH', payload: ... }) ile mesaj gönderir. Eklentilerde dış kaynaklara doğrudan istek atmak yerine işlem arkaplan servis çalışanına devredilir.

2. **Arkaplan İşlemleri (background.js):**
   Arkaplan dosyası gelen isteği yakalar ve handleScadaFetch fonksiyonuna yönlendirir.
   - **Yetkilendirme (CSRF Token) ve 401 Retry:** İstek öncesinde güncel bir CSRF token alınır ve session doğrulanır. Eğer POST /api/v1/chart/data isteğinde 401 (Unauthorized) hatası alınırsa, sistem token'ı iptal ederek mevcut oturumu bir kez daha doğrular ve (başarılıysa) otomatik 1 defalık session-retry dener. Bu mekanizma geçici session düşmelerinde kullanıcıyı rahatsız etmeden toparlar.
   - **Query Builder Birleştirmesi:** ackground.js içerisinde bulunan kopya fallback query implementation silinmiştir. Tüm sorgu oluşturma işlemleri deterministik bir şekilde SCADA_COMMON.buildChartPayload üzerinden yapılır (kvFilters ve 	earFilters gönderilmemişse boş bırakılır).

3. **Verinin İşlenmesi ve Görselleştirilmesi:**
   - **Composite Key ve Parser:** Eski (MAX(__time) + AVG(maxValue)) kullanımından vazgeçilerek, Raw Record semantiğine geçilmiştir.
Yeni algoritma (Latest-Row): Superset'ten dönen yanıt (json.result[0].data ile deterministik şekilde alınır) scada-common.js içindeki 
ormalizeMetricEntries tarafından işlenir.Her sinsid + elementName için en yeni __time satırındaki maxValue değeri seçilir. Ölçümler birbirini ezmemesi için sinsid|elementName (örn. 123|P) composite anahtarıyla tutulur.
   - **Saat Farkı (Zaman Dilimi) Düzeltmesi:** Superset'ten gelen 2026-08-19T22:35:00.000Z şeklindeki UTC etiketli ancak aslında yerel (TR) saati ifade eden ham verilerdeki Z (Zulu) karakteri parseSupersetScadaTimestamp fonksiyonu ile kırpılır. Böylece +3 saat kayması önlenir ve Harita saati Superset saati ile birebir aynı kalır.
   - **Aday Çözümü (Tolerance-Primary):** esolveHatMetricByTolerance içerisindeki ölçüm adayı seçim mantığı, candidateSlotRank kullanılarak deterministik hale getirilmiştir (Primary > Secondary > Yeni Timestamp > ID alfabetik sıralama). Tesadüfi entries[0] kullanımı kaldırılmıştır.
   - **Superset Ham Değer / Harita Akış Değeri Ayrımı:** Harita UI'ında, polarizasyon işlemi uygulanmış yönlü akış değeri (Harita Akış Değeri) ile Superset'ten gelen işlenmemiş orijinal değer (Superset Kaynak Değeri) tamamen ayrılmıştır ve kullanıcının görebileceği şekilde kartlara yansıtılmıştır.
   - **Cache / Canlı Gösterimi:** Kullanıcının hangi veriye baktığını netleştirmek için SCADA yenileme mesajlarına (Canlı — 12 sn önce) veya (Önbellek — 6 dk eski) şeklinde doğrudan UI bildirimleri eklenmiştir.
   - **Belirsiz Kayıtlar:** Daha önce toplu gösterilen belirsiz kayıt mesajı, UI üzerinde (Aday çakışması, Yön belirsiz, Kaynak eksik vb.) olarak detaylandırılmıştır.

## 4. Güvenlik İyileştirmeleri (Credential Gate)
data/scada_auth.json içerisindeki hassas yetki bilgileri uild-extension.ps1'deki denetim bloğu ile build/dist ZIP dosyasının içine girmesi kesin olarak engellenmiştir (Secret Scan).

## 5. Doğrulama Durumu (Superset Parity)
- Kod düzeyindeki düzeltmeler (saat farkı, composite key id uyuşmazlıkları, akış ayrımı vb.) tamamlanmıştır.
- Canlı Superset (Chart 454) doğrulaması agent tarafından yapılamadığından, hazırlanan yeni build kullanılarak **manuel doğrulama kullanıcı tarafından yapılacaktır**.

## 6. Timeout, Performans ve 24 Saat Grafik Güncellemeleri
- **Batch İstek Mimarisi:** 1148 ölçüm noktası tek bir dev istekte 25 saniyelik timeout sınırına takılmaktaydı. İstekler SCADA_LIVE_BATCH_SIZE = 200 olacak şekilde, max concurrency = 3 ile paralel etch bloklarına ayrıldı. Kısmi başarı (partial success) desteği ile hata alan batch'lerin tüm overlay'i çökertmesi önlendi.
- **Sorgu Aralığı Küçültüldü:** Canlı veri sorgusunda zaman aralığı (timeRange) son 24 saatten (DATEADD(-24, hour)) son 10 dakikaya (DATEADD(-10, minute)) düşürülerek Superset veritabanı yükü büyük oranda azaltıldı.
- **Render Ayrıştırması:** SCADA veri güncellemelerinde tüm sayfanın yeniden çizilmesini (topology dahil) engellemek adına, sadece ilgili overlay'i (Hat renkleri, animasyonlar, mw, mvar etiketleri) çizen equestScadaOverlayRender() oluşturuldu. Ranking paneli kapalıyken HTML (innerHTML) üretilmesi durduruldu.
- **24 Saat Geçmiş Görünümü:** Ranking paneline '24s' butonu eklendi. Çift terminalli hatlar (aynı timestamp, iki P, iki Q) desteklendi ve 5 dakikalık TTL bazlı History cache oluşturuldu.

