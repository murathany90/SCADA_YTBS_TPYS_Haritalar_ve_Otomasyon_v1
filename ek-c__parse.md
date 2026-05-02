# EK-C Karşılaştırma Eşleşme ve Parser Düzeltme Planı

## Özet
EK-C yükleniyor ama karşılaştırma yapılamıyor çünkü örneklerde EK-C satırları YKS ile ortak anahtara bağlanmıyor: EK-C dosyalarında `busbarId` yok, bazı kolon adları parser tarafından kaçırılıyor, ayrıca görselde aktif tarih `2026-04-27` iken örnek EK-C dosyaları `2026-04-28`. Çözüm: EK-C yüklemede seçili YKS barasına bağlama, EK-C tarihine otomatik geçme, parser alias düzeltmeleri ve karşılaştırmada açık teşhis mesajları.

## Key Changes
- EK-C CSV parser:
  - `="..."` Excel-formül sarmalayıcılarını hücre temizleme sırasında normalize et.
  - EK-C kolon alias’larını genişlet: `BARA_GERILIMI_KV`, `TOP_REAKT_CIKIC_GUCU_MVAr`, `TOP_REAKT_CIKIS_GUCU_MVAr` ve benzeri yazım varyasyonları V/Q/P alanlarını doldurmalı.
  - Örnek EK-C dizinindeki tüm dosyalarda dakika satırları, V/P/Q değerleri ve `minuteStat` sonuçları deterministik parse edilmeli.

- EK-C yükleme ve eşleştirme:
  - EK-C yüklendiği anda aktif filtrede tek/seçili YKS barası varsa, `busbarId`, `busbarName`, `plantName`, `sourceType`, `ytm` bilgileri EK-C satırlarına bağlanacak.
  - Orijinal EK-C dosya/meta adı ayrıca korunacak: örn. `ekcOriginalName`, böylece kullanıcıya “şu EK-C şu YKS barasına bağlandı” gösterilebilir.
  - Seçili bara yoksa mevcut katalog/ad eşleştirme denenecek; eşleşme yoksa karşılaştırma yapılmayıp açık uyarı verilecek.

- Tarih davranışı:
  - EK-C yüklendiğinde aktif tarih filtresi EK-C tarihlerini kapsamıyorsa filtre otomatik EK-C tarihine alınacak.
  - Tek EK-C tarihi varsa `filterDate = EK-C tarihi`, `filterEndDate` boş kalacak.
  - Birden fazla EK-C tarihi varsa `filterDate = ilk tarih`, `filterEndDate = son tarihten sonraki gün` olacak.
  - Bu tarihlerde YKS SCADA verisi yoksa karşılaştırma tablosunda `Ortak dakika bulunamadi: EK-C tarihi icin YKS SCADA verisi yok` mesajı gösterilecek.

- Karşılaştırma görünümü:
  - Kaynağı olmayan saatlerde EK-C sonucu `KY` gibi gösterilmeyecek; `-` / `Eşleşmedi` olarak gösterilecek.
  - `Ortak dk = 0` durumunda sebep ayrıştırılacak: tarih uyumsuzluğu, seçili bara yok, YKS verisi yok, EK-C parser alan eksikleri.
  - EK-C/YKS ortak dakika bulunduğunda V/P/Q ortalama ve delta kolonları mevcut hesaplarla dolmaya devam edecek.

## Test Plan
- `rgdh-csv.test.js`:
  - EK-C fixture’larında `BARA_GERILIMI_KV` ve `TOP_REAKT_CIKIC_GUCU_MVAr` parse edildiğini doğrula.
  - `="2026-04-27T00:00:00+03:00"` ve `="10928268862"` gibi Excel-style hücrelerin tarih/sayı olarak çözüldüğünü doğrula.

- `rgdh-ui-smoke.test.js` veya yeni karşılaştırma testi:
  - Seçili YKS barası varken EK-C yüklenince EK-C satırlarına seçili `busbarId` bağlandığını doğrula.
  - Aktif tarih EK-C tarihinden farklıysa filtre tarihinin EK-C tarihine geçtiğini doğrula.
  - Ortak dakika yoksa tabloda `EK-C KY` yerine teşhis mesajı ve `Eşleşmedi/-` gösterildiğini doğrula.

- Regresyon:
  - `node tests\rgdh-reactive-rules.test.cjs`
  - `npm test`
  - `npm run build:extension`
  - `npm run smoke:extension`

## Assumptions
- Kullanıcı kararı: EK-C’de YKS bara ID yoksa seçili YKS barasına bağlanacak.
- Kullanıcı kararı: EK-C tarihi aktif filtreden farklıysa filtre otomatik EK-C tarihine geçecek.
- Yeni harici npm bağımlılığı eklenmeyecek.
- Yanlış santral dosyası seçilirse sistem yine bağlayacak, ama orijinal EK-C adı ve bağlanan YKS barası kullanıcıya açıkça gösterilecek.
