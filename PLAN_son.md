# Hibrit RES/GES YKS Çekimi ve RGDH Grafik İyileştirme Planı

## Summary
- Hibrit/yardımcı kaynak RES-GES baralarda, özellikle Geycek RES ve Erciyes RES gibi santrallerde, YKS çekimi timeout’a düşmeyecek şekilde hibrit özel çekim yolu güçlendirilecek.
- RGDH Grafik Rapor’da gerilim kaynakları, TPYS Set gerilimi ve güç serileri birbirinden ayrılacak.
- Günlük RGDH İzleme’de saat hücresine tıklayınca grafik rapor seçili bara+tarih+saat için çizilecek; Grafik Rapor’daki 24 saat hücreleri de saat kırılımı seçebilecek.

## Key Changes

### Hibrit RES/GES Çekim Algoritması
- Hibrit tespit edilen baralarda ilk internal ID denemesi de hibrit varsayılanlarıyla çalışacak:
  - `windHourTimeoutMs: 20000`
  - `windHourConcurrency: 2`
  - `windProbeTimeoutMs: 20000`
  - `jobTimeoutMs: 180000`
- `background.js` job timeout üst limiti hibrit işler için 60 sn’den 180 sn’ye çıkarılacak; `rgdh-monitor.js` polling süresi de payload’daki gerçek `jobTimeoutMs` değerine göre bekleyecek.
- Display ID fallback probe tek saat `0` ile sınırlı kalmayacak. Hibrit probe saatleri varsayılan olarak `[11, 12, 0]` olacak; Geycek logunda veri `2026-05-01T08:00Z` yani İstanbul 11:00 civarında geldiği için ilk probe 11. saatten başlayacak.
- Internal ID 24 saat timeout olursa aday hemen başarısız sayılmadan önce hibrit için chunk/day fallback denenecek. Satır gelirse o aday başarılı sayılacak; gelmezse display ID adayı denenmeye devam edecek.
- Hata logları “0 kayıt” ile “24 saat timeout” ayrımını net gösterecek; aday ID, display ID, probe saati, timeout, concurrency ve fallback aşaması log detaylarında kalacak.
- Hibrit olmayan RES/GES ve konvansiyonel çekim davranışı aynı kalacak.

### Veri Modeli ve Normalizasyon
- Normalize satıra şu alanlar eklenecek:
  - `busbar1Voltage`, `busbar1Quality`
  - `busbar2Voltage`, `busbar2Quality`
  - `busbar3Voltage`, `busbar3Quality`
- API alias eşleşmeleri:
  - `busbar1Voltage <- raw.busTa1Volt`, fallback olarak `mainBusbarVoltage`
  - `busbar1Quality <- raw.busTa1VoltQ0Txt`
  - `busbar2Voltage <- raw.busTa2Volt`
  - `busbar2Quality <- raw.busTa2VoltQ0Txt`
  - `busbar3Voltage <- raw.busTa3Volt`
  - `busbar3Quality <- raw.busTa3VoltQ0Txt`
- `tpysVoltageSet` ayrı kalacak; artık “Bara 2(kV)” yerine kullanılmayacak.
- CSV yüklemede varsa `Bara 1(kV)`, `Bara 1 Kalite`, `Bara 2(kV)`, `Bara 2 Kalite`, `Bara 3(kV)`, `Bara 3 Kalite` kolonları bu yeni alanlara parse edilecek.

### Grafik Rapor UI
- `Gerilim Kaynaklarını Göster/Gizle` butonu sadece şu tablo kolonlarını ve grafik serilerini kontrol edecek:
  - `Bara 1(kV)`, `Bara 1 Kalite`
  - `Bara 2(kV)`, `Bara 2 Kalite`
  - `Bara 3(kV)`, `Bara 3 Kalite`
- Mevcut hata düzeltilecek: `Bara 2(kV)` de toggle kapsamına alınacak.
- TPYS Set gerilimi ayrı seri olacak:
  - Label: `TPYS Set Gerilim (kV)`
  - Varsayılan: kapalı, Chart.js legend üzerinden açılabilir.
  - `Gerilim Kaynaklarını Göster/Gizle` butonundan etkilenmeyecek.
- Konvansiyonel santrallerde TPYS Set serisiyle birlikte iki noktalı tolerans çizgisi üretilecek:
  - `TPYS Set +%1,5`
  - `TPYS Set -%1,5`
  - Formül: `tpysVoltageSet * 1.015` ve `tpysVoltageSet * 0.985`
  - Varsayılan kapalı; TPYS Set ile aynı legend mantığında açılacak.
- Grafik renkleri tema uyumlu CSS değişkenlerinden gelecek:
  - Aktif güç: light modda siyah/nötr koyu, dark modda yüksek kontrast nötr.
  - Reaktif güç: sarı.
  - Gerilim kaynakları ve TPYS Set/bant çizgileri: mavi ve mavi tonları.
- `rgdh-charts.js` içinde dataset üretimi saf bir yardımcıya ayrılacak ve test edilebilir hale getirilecek.

### Saat Drilldown
- Günlük RGDH İzleme tablosunda tarih hücresi tam gün, saat hücresi seçili saat grafiğini açacak davranış korunup testle güvenceye alınacak.
- RGDH Grafik Rapor’daki “24 saat Sonuçlar” hücreleri de tıklanabilir olacak:
  - Tıklanınca aynı chart root içinde seçili bara+tarih+saat için ana grafik yeniden çizilecek.
  - Başlık `Bara - YYYY-MM-DD - HH:00` formatına güncellenecek.
- `RGDH_CHARTS.renderReport` opsiyonlarına `onHourSelect({ busbarId, date, hour })` callback’i eklenecek; `rgdh-monitor.js` bu callback ile `state.chartSelection` güncelleyecek.

## Test Plan
- `node --test tests/background.test.js tests/rgdh-normalizer.test.js tests/rgdh-charts.test.js tests/rgdh-ui-smoke.test.js`
- Background testleri:
  - Hibrit Geycek benzeri seçimde ilk internal ID çağrıları `timeout <= 20000`, `concurrency = 2`, `jobTimeoutMs = 180000` ile gider.
  - Display ID probe saatleri `[11, 12, 0]` sırasıyla denenir; 11. saat başarılıysa fallback devam eder.
  - Hibrit olmayan RES/GES hâlâ mevcut 10 sn / concurrency 6 davranışını korur.
  - Tüm adaylar timeout olursa hata özeti `candidateBusbarIds: ['10933818957', '5052']` bilgisini korur.
- Normalizer testleri:
  - `busTa1Volt/busTa2Volt/busTa3Volt` ve kalite alanları yeni normalized alanlara taşınır.
  - `tpysVoltageSet` hiçbir zaman `busbar2Voltage` yerine yazılmaz.
- Chart testleri:
  - `Bara 2 kV` serisi `busbar2Voltage` kullanır, `tpysVoltageSet` kullanmaz.
  - `showVoltage: false` iken Bara 1/2/3 kaynak serileri yoktur veya gizlidir; TPYS Set serisi ayrı ve varsayılan hidden kalır.
  - Konvansiyonel satırlarda ±%1,5 band verileri doğru hesaplanır.
  - Aktif güç, reaktif güç ve gerilim serileri beklenen tema renk tokenlarını kullanır.
- UI smoke testleri:
  - Gerilim toggle regex/metadata’sı `Bara 1`, `Bara 2`, `Bara 3` kaynaklarını kapsar; `TPYS Set` ve `Canlı Bara` kapsam dışıdır.
  - Grafik Rapor heatmap saat hücreleri tıklanabilir callback üretir.
  - Günlük RGDH İzleme saat hücresinden Grafik Rapor’a geçiş seçili saatle çalışır.

## Assumptions
- “4-%1.5 gerilim bandı” gereksinimi `±%1,5` olarak uygulanacak.
- TPYS Set gerilimi yeni ayrı grafik serisi olacak, default kapalı başlayacak ve legend üzerinden açılacak.
- `Gerilim Kaynaklarını Göster/Gizle` butonu TPYS Set, Canlı Bara, Bara Set Üst/Alt Limit serilerini etkilemeyecek.
- Hibrit özel timeout ve concurrency yalnızca `hasAuxiliarySource` veya `hybridAuxiliary` işaretli RES/GES baralarda uygulanacak.
