# CSV Otomasyon Geliştirme Planı

## Özet

Bu plan, bir Chrome Manifest V3 eklentisine TPYS ERP üzerinden tarih parametresiyle CSV indirme, indirilen CSV dosyalarını standart adlandırma ve Chrome Downloads altında standart klasörlere dosyalama kabiliyeti ekler.

Varsayılan hedef yapı:

`TPYS_CSV_Standartlastirilmis/SANTRAL_ADI/[SANTRAL_ADI]_DD.MM.YYYY.csv`

Native helper kullanılmayacak. Bu nedenle eklenti, işletim sistemindeki keyfi klasörlere doğrudan yazmayacak; Chrome’un Downloads API’si ile varsayılan Downloads klasörü altında göreli klasör yapısı oluşturacaktır.

## Mimari Değişiklikler

- **Manifest V3:** `downloads`, `storage`, `tabs`, `scripting` izinleri doğrulanır; host izinleri TPYS/YKS alanlarıyla sınırlandırılır.
- **Popup UI:** Kullanıcıdan tarih, hedef klasör kökü, ASCII normalize ve aynı içerik kopyasını atlama seçenekleri alınır. “Analiz et”, “Standart CSV indir” ve “Rapor indir” aksiyonları eklenir.
- **Content Script:** TPYS sayfasındaki tarih alanını doldurur, bara listesini keşfeder, her bara için CSV indirme akışını tetikler ve CSV linkini yakalar.
- **Background Service Worker:** İndirme kuyruğunu yönetir, hedef dosya yolunu üretir, `chrome.downloads.download` ile indirir, tamamlanma/timeout/hata durumlarını izler.
- **CSV Standardizer Modülü:** CSV içeriğinden santral adı ve tarih çıkarır; dosya adı, klasör adı, duplicate ve conflict kararlarını üretir.
- **Raporlama:** Her batch sonunda işlem özeti ve satır bazlı hata/başarı raporu üretilir.

## Standartlaştırma Kuralları

- Santral adı, CSV’nin ilk metadata satırlarından veya “adı” içeren alanlardan çıkarılır.
- Tarih, `TARIH` başlığını izleyen ilk geçerli veri satırından çıkarılır.
- Desteklenen tarih girişleri `2.04.2026`, `02.04.2026`, `2.4.2026`, `02.4.2026`; çıktı formatı her zaman `DD.MM.YYYY`.
- Dosya adı formatı `[SANTRAL_ADI]_DD.MM.YYYY.csv`.
- Aynı ek-c dosyası aynı isimle iki dosyaya kopyalanacaktır. 1) İndirilen klasöre klasör bara adı için `SANTRAL_ADI_MM.YYYY`. 2) İndirilen klasöre ilgili gün için `RGDH_GUN_DD.MM.YYYY`
- Windows dosya adında yasak karakterler temizlenir, boşluklar `_` yapılır, ardışık `_` sadeleştirilir.
- Aynı batch içinde aynı hedef ada düşen farklı içerikler `__1`, `__2` suffix’i alır.
- Aynı içerik hash’i tespit edilirse ve “kopyayı atla” seçeneği açıksa dosya indirilmez, raporda `duplicate` olarak işaretlenir.
- CSV içeriğinden tarih veya santral adı çıkarılamazsa, seçili TPYS bara adı ve kullanıcı tarihi kontrollü fallback olarak kullanılır; bu durum raporda uyarı olarak görünür.

## Veri Akışı

1. Kullanıcı popup üzerinden hedef tarihi seçer.
2. Popup aktif TPYS sekmesine sayfa analizi mesajı gönderir.
3. Content script TPYS tarih alanını doğrular veya hedef tarihe günceller.
4. Content script bara listesini okur.
5. Her bara için CSV indirme işlemi tetiklenir.
6. CSV linki yakalanır ve background’a standart indirme isteği gönderilir.
7. Background CSV içeriği veya metadata üzerinden hedef dosya adını üretir.
8. Dosya Chrome Downloads altında standart klasöre indirilir.
9. Her indirme sonucu job state’e yazılır.
10. İşlem sonunda rapor CSV/JSON olarak indirilebilir hale getirilir.

## Hata ve Durum Yönetimi

- Tarih alanı bulunamazsa işlem başlamaz.
- Bara listesi boşsa kullanıcıya açık hata verilir.
- Tek bara indirme hatası tüm batch’i durdurmaz; ilgili bara atlanır ve sıradaki işlenir.
- Download timeout, interrupted, auth/session, CSV link bulunamadı ve parse başarısız durumları ayrı hata tipleriyle raporlanır.
- Service worker uykuya geçme riskine karşı job state kısa aralıklarla `chrome.storage.local` içine yazılır.
- Uzun batch akışında popup kapansa bile background işlem durumu sorgulanabilir olmalıdır.

## Test Planı

- CSV parser testleri: santral adı, tarih çıkarımı, tarih normalize, eksik tarih, eksik santral, bozuk/uyumsuz içerik.
- Planner testleri: standart hedef yol, sanitize, ASCII normalize, duplicate skip, conflict suffix.
- Background testleri: indirme başlatma, tamamlanma takibi, timeout, interrupted, rapor satırı üretimi.
- Content script testleri: tarih alanı set etme, bara combobox keşfi, CSV link yakalama, hatalı bara sonrası devam.
- Popup testleri: kullanıcı ayarları, başlat/durdur durumu, rapor butonu ve job özetleri.
- Manuel kabul: TPYS indirme ekranında seçilen tarih için tüm baralar standart klasör yapısına iner, hatalar raporlanır, başarılı dosyalar beklenen ad formatını taşır.

