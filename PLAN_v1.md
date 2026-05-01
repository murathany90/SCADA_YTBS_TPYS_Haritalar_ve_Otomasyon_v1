# RGDH API, Test Sertifikası ve Katılım Yüzdesi Planı

**Summary**
- RGDH veri çekimi DOM yerine YKS API üzerinden çalışacak; 401 kök nedeni için YKS sayfası içinde tokenlı fetch yapılacak, token eklentiye/loglara/storage’a taşınmayacak.
- `_BARA_VE_ÜNİTE_TANIMLAMA...csv` katalog yüklemesi RGDH Testleri sekmesinde 42 bara üst satırı ve 75 ünite detayını gösterecek.
- Günlük RGDH İzleme ve Grafik Rapor sekmeleri YKS kılavuzundaki gibi saatlik Set, Gerilim, MW, MVAr ve Katılım Yüzd. değerlerini gösterecek; yüzdeye tıklayınca ilgili bara+saat grafiği açılacak.

**Key Changes**
- `background.js` içindeki page-context API fetch varsayılan yol olacak. YKS sayfası `localStorage/sessionStorage` içinden JHipster token anahtarlarını sadece aynı fonksiyon içinde okuyup `Authorization: Bearer ...` header’ı ile `/api/rgdh-conventional-busbar-data`, `/api/rgdh-wind-busbar-data`, `/api/general-parameter-by-name` çağrılarını yapacak. Token hiçbir response, log veya hata detayına yazılmayacak.
- RES/GES otomasyonu için YKS busbar katalog API’si eklenecek: `/api/busbars` sayfalı ve tokenlı çekilecek, `busbar.id` değerleri `busbarId.equals` için kullanılacak. DOM sadece tanı/son çare ID keşfi olarak kalacak; DOM’dan gelen sıfır ölçüm satırları ana veri setine dahil edilmeyecek.
- `rgdh-csv.js` katalog parser’ı Türkçe `AKTİF/PASİF` değerlerini doğru boolean’a çevirecek; rüzgar katalog alanları için `Düşük İkaz 2`, `Aşırı İkaz 2`, `Speed Drop` opsiyonel alanları korunacak.
- `rgdh-normalizer.js` katalogdan 42 bara özeti üretecek: bara, santral, RGK tipi, gerilim, ünite sayısı, aktif ünite sayısı, toplam Pnom/PMKUD ve ünite test sertifika detayları.
- `rgdh-monitor.js/html/css` RGDH Testleri sekmesini 42 bara üst tablosu + seçili bara ünite detay tablosu olarak yenileyecek. ACWA gibi çok üniteli baralarda düşük/aşırı ikaz, nominal ikaz, güç faktörü, terminal gerilimi ve aktiflik değerleri detayda görünecek.
- `rgdh-pivot.js` saat hücrelerine metrik ekleyecek: ortalama TPYS set, canlı bara gerilimi, Pgen MW, Qgen MVAr, başarılı dakika, gelen dakika ve `participationPct = başarılı dakika / 60 * 100`. `approvalStatus` varsa öncelikli kullanılacak; yoksa mevcut hesaplanan satır durumu yedek olacak.
- `rgdh-charts.js` saat filtresi alacak. Günlük tabloda Katılım Yüzd. hücresine tıklanınca `charts` sekmesine geçilecek ve sadece seçili bara ile seçili saatin grafik raporu çizilecek; günlük görünüm için mevcut tüm gün grafiği korunacak.

**Public Interfaces**
- `RGDH_API_CLIENT.RGDH_ENDPOINTS.busbars = '/api/busbars'` eklenecek.
- Pivot saat nesnesi şu alanlarla genişleyecek: `setAvg`, `voltageAvg`, `pgenAvg`, `qgenAvg`, `participationPct`, `successMinuteCount`, `expectedMinuteCount`, `minuteCount`.
- Chart render opsiyonu `{ busbarId, hour }` destekleyecek.
- Katalog özet fonksiyonu `buildCatalogBusbarSummaries(catalogRows)` olarak dışa açılacak.

**Test Plan**
- Unit testler:
  - Sayfa içi tokenlı fetch `Authorization` header gönderiyor, token response/log içinde dönmüyor.
  - 401/403 durumları `AUTH_REQUIRED` olarak kalıyor, DOM sıfır satırları ana tabloya karışmıyor.
  - `yks_docs/data1/_BARA_VE_ÜNİTE_TANIMLAMA...csv` 75 katalog satırı ve 42 bara özeti üretiyor; `AKTİF` true parse ediliyor.
  - Saatlik katılım yüzdesi 60 dakika paydasıyla hesaplanıyor; eksik veri yüzdeyi düşürüyor.
  - Saat seçimi grafik raporunu bara+saat aralığına filtreliyor.
- Smoke test:
  - `npm test` tüm testleri çalıştıracak.
  - `npm run build:extension` ile dist yenilenecek.
  - Chrome DevTools MCP ile debug Chrome’a bağlanıp `rgdh-monitor.html` açılacak, `upload_file` ile `yks_docs/data1` altındaki katalog + RGDH CSV dosyaları yüklenecek.
  - Smoke doğrulamaları: RGDH Testleri 42 bara gösterir, seçili bara detayında ünite sertifika değerleri görünür, Günlük RGDH İzleme’de Katılım Yüzd. hücreleri yüzde formatındadır, yüzdeye tıklayınca Grafik Rapor seçili saat için çizilir.

**Assumptions**
- Seçilen güvenlik varsayımı: token yalnızca YKS sayfası içinde anlık API çağrısı için kullanılacak, eklenti tarafında saklanmayacak.
- Seçilen tablo varsayımı: RGDH Testleri sekmesi 42 bara üst satırı gösterecek, 75 ünite sertifika değeri detayda listelenecek.
- Seçilen yüzde varsayımı: Katılım Yüzd. paydası her saat için 60 dakikadır.
