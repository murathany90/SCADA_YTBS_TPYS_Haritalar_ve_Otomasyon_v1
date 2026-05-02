# EK-C / YKS SCADA Karşılaştırma Grafik ve Tablo Planı

## Summary
- EK-C / YKS SCADA Karşılaştırma sekmesine RGDH Grafik Rapor’daki kompakt grafik filtre barı eklenecek.
- Filtre barı grafikleri filtreleyecek; tablo saat filtresiyle daralmayacak, ancak sekme genelinde maksimum tek gün gösterilecek.
- Karşılaştırma tablosunda saat hücresine tıklanınca filtre barında ilgili saat seçilecek ve grafikler o saate göre yeniden çizilecek.
- Karşılaştırma grafikleri sadeleşecek: ilk grafik yalnız Gerilim + P, ikinci grafik yalnız Q gösterecek.

## Key Changes
- `rgdh-charts.js` içinde mevcut grafik filtre barı tekrar kullanılabilir hale getirilecek ve `renderComparison` için de kullanılacak.
  - Bara, BYTM, Tarih, Saat Modu, Başlangıç Saat, Bitiş Saat, `[-] slider [+]`, Sorgula, Tam Ekran aynı tek satır düzeninde olacak.
  - Karşılaştırma grafikleri `date` için tek güne zorlanacak; seçili gün yoksa uygun ilk karşılaştırma günü kullanılacak.
  - Saat filtresi sadece grafik verisini daraltacak; tablo seçili günün tüm saatlerini göstermeye devam edecek.
- Karşılaştırma grafik dataset’leri güncellenecek.
  - İlk grafik: `YKS SCADA V`, `EK-C V`, `YKS SCADA P`, `EK-C P`.
  - İkinci grafik: `YKS SCADA Q`, `EK-C Q`.
  - Limit, TPYS set, yardımcı kaynak ve ek karşılaştırma çizgileri bu sekmeden kaldırılacak.
  - Renk/çizgi mantığı RGDH Grafik Rapor ile uyumlu olacak: YKS serileri düz çizgi, EK-C serileri aynı renk ailesinde kesikli ve daha ince çizgi.
- `rgdh-monitor.js` içinde karşılaştırma seçim durumu eklenecek.
  - Yeni state: `compareSelection`.
  - Tarih seçimi tabloyu ve grafikleri aynı tek güne alacak.
  - Saat seçimi yalnız grafikleri filtreleyecek.
  - Karşılaştırma tablosundaki saat hücreleri tıklanabilir ve klavye ile seçilebilir olacak.
- Karşılaştırma tablosu kolonları düzenlenecek.
  - Kaldırılacak: `Varlik`, `Yalniz EK-C`, `Yalniz YKS SCADA`, eski `EK-C Sonuc`, eski `YKS SCADA Sonuc`, `DD/YY/KY`, `Gecti/Kaldi`.
  - `Ortak dk` adı `Eşleşen DK` olacak.
  - Eklenecek: `Ek-C Değerlendirme`, `YKS Değerlendirme`.
  - Değerlendirme formatı: `✓ 55 ✕ 2 DD 1 / YY 2 / KY 0`.
  - `✓` dakika sayısı yeşil, `✕` dakika sayısı kırmızı gösterilecek; DD/YY/KY nötr renkte kalacak.

## Public Interfaces / Compatibility
- `RGDH_CHARTS.renderComparison(root, compareRows, options)` geriye uyumlu kalacak, ancak şu opsiyonları destekleyecek:
  - `selection`: `{ busbarId, ytm, date, hourMode, hourStart, hourEnd, hour }`
  - `onFilterApply(selection)`: filtre barında Sorgula veya saat kaydırma sonrası monitor state’ini güncellemek için callback.
- Mevcut `renderReport` davranışı korunacak.
- `RGDH_COMPARISON.buildEkcPlatformComparison` veri modeli korunacak; tablo değerlendirme hücreleri mevcut `ekcStat` ve `platformStat` sayımlarından üretilecek.

## Test Plan
- `tests/rgdh-charts.test.js`
  - Karşılaştırma üst grafik dataset etiketleri sadece `YKS SCADA V`, `EK-C V`, `YKS SCADA P`, `EK-C P` olsun.
  - Karşılaştırma Q grafik dataset etiketleri sadece `YKS SCADA Q`, `EK-C Q` olsun.
  - EK-C karşılaştırma çizgileri kesikli ve YKS çizgilerinden daha ince olsun.
  - Karşılaştırma grafik filtre seçimi tek güne ve saat aralığına göre minute-row filtrelesin.
- `tests/rgdh-comparison.test.js`
  - `hourRows` içindeki `ekcStat` ve `platformStat` değerlendirme hücresinde kullanılacak pass/fail/DD/YY/KY sayımlarını doğru taşısın.
- `tests/rgdh-ui-smoke.test.js`
  - Karşılaştırma sekmesinde grafik filtre barı kontrolleri bulunsun.
  - Eski kolon adları bulunmasın; `Eşleşen DK`, `Ek-C Değerlendirme`, `YKS Değerlendirme` bulunsun.
  - Saat hücresine tıklama için `data-compare-hour` veya eşdeğer event bağlama izi bulunsun.
- Regresyon:
  - `npm test`
  - `node tests\rgdh-reactive-rules.test.cjs`
  - `npm run build:extension`

## Assumptions
- Filtre barındaki saat aralığı sadece grafikleri etkiler.
- Karşılaştırma tablosu saat filtresiyle daralmaz; seçili tek günün tüm saatlerini gösterir.
- Filtre barındaki tarih seçimi hem tabloyu hem grafikleri tek güne indirir.
- Saat hücresine tıklama yeni veri çekmez; mevcut karşılaştırma verisini istemci tarafında filtreleyip grafikleri yeniden çizer.
