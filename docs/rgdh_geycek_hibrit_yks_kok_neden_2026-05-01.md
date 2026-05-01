# GEYCEK RES Hibrit YKS Çekimi Kök Neden Raporu

Tarih: 2026-05-01

İncelenen ana log:

- `yks_izleme_modul/yks_docs/RGDH_EKLENTI_LOGLARI_2026-05-01 (2).csv`

İlgili plan:

- `PLAN._v6.md`

## Yönetici Özeti

GEYCEK RES için sorun normalizasyon, tablo gösterimi veya YKS iç bara ID çözümlemesi aşamasında başlamıyor. Verilen loga göre eklenti doğru iç ID ile (`10933818957`) YKS `rgdh-wind-busbar-data` endpoint'ine gidiyor, ancak API cevabı alınmadan istekler eklenti tarafında `PAGE_FETCH_TIMEOUT` ile abort ediliyor. Bu yüzden `windRows` oluşmuyor ve zincir sonunda `NO_NORMALIZED_ROWS` görülüyor.

PLAN v6'daki ana fikir kısmen uygulanmış: hibrit santralde önce page'siz range isteği deneniyor. Ancak GEYCEK logunda bu range isteği yalnızca `size=500` ile denenmiş, `PAGE_FETCH_TIMEOUT` alınca `size=60` page'siz retry hiç yapılmamış. Ardından kod eski saatlik `page=0` yoluna dönmüş; bu yol da 12 benzersiz saatlik istekte timeout'a düşmüş. İş 180 saniyelik bütçede bittiği için ikinci aday/display ID (`5052`) için gerçek bir API isteği de oluşmamış.

## Kanıtlar

### 1. Job 180 saniyede kapanıyor

Log akışı:

- Başlangıç: `01.05.2026 19:31:16` - `YKS cekim isi basladi: rgdh-job-1777653076696-1`
- Bitiş: `01.05.2026 19:34:16` - `YKS cekim isi tamamlandi (180 sn).`

Kod tarafındaki neden:

- `rgdh-monitor.js` payload içine hibrit WIND için `jobTimeoutMs: 180000` yazıyor.
- Aynı dosyada polling sınırı da `Math.min(180000, ...)` ile 180 saniyeye sabitleniyor.
- Buna karşılık `background.js` tarafındaki yeni hibrit default `600000` olsa da, UI açıkça `180000` gönderdiği için background default pratikte devreye girmiyor.

İlgili kod:

- `rgdh-monitor.js:225-232`
- `rgdh-monitor.js:265-282`
- `rgdh-monitor.js:529-532`
- `background.js:426-430`

### 2. Page'siz range isteği var ama sadece `size=500`

GEYCEK için benzersiz page'siz range isteği:

```text
GET /api/rgdh-wind-busbar-data
measurementDate.greaterOrEqualThan=2026-04-27T21:00:00Z
measurementDate.lessThan=2026-04-28T21:00:00Z
size=500
sort=measurementDate,asc
busbarId.equals=10933818957
page parametresi yok
```

Sonuç:

- Mesaj: `2026-04-28: hibrit YKS ekran araligi basarisiz: signal is aborted without reason`
- Hata sınıfı: `PAGE_FETCH_TIMEOUT`
- HTTP, response row count ve response total count boş.

Bu, page'siz range yolunun çalıştırıldığını ama YKS cevabı alınmadan abort edildiğini gösteriyor.

### 3. `size=60` page'siz retry hiç yapılmamış

CSV'de:

- Benzersiz page'siz `size=500` range isteği: `1`
- Page'siz `size=60` range isteği: `0`
- Display ID `busbarId.equals=5052` ile gerçek istek: `0`

Kod tarafındaki neden:

- `background.js` içinde `fetchRgdhWindBusbarByYksUiRange()` `sizeAttempts = [pageSize, 60]` hazırlıyor.
- Fakat `size=60` retry koşulu yalnızca şu durumlarda çalışıyor:
  - `ok && rows.length === 0 && totalCount > 0`
  - veya 4xx sınıfı hata.
- `PAGE_FETCH_TIMEOUT` durumunda `httpStatus` yok ve error class timeout olduğu için retry koşulu sağlanmıyor; fonksiyon doğrudan başarısız dönüyor.

İlgili kod:

- `background.js:1439-1516`
- `background.js:1576-1580`
- `background.js:2197-2263`

### 4. Range başarısız olunca eski saatlik `page=0` yoluna düşüyor

Range timeout sonrası eklenti saatlik endpoint'e dönüyor. GEYCEK için benzersiz 12 saatlik istek oluşmuş:

- İlk saat: `2026-04-27T21:00:00Z -> 2026-04-27T22:00:00Z`
- Son görünen saat: `2026-04-28T08:00:00Z -> 2026-04-28T09:00:00Z`
- Tüm bu saatlik isteklerde URL `page=0&size=60` içeriyor.
- Hepsi `PAGE_FETCH_TIMEOUT` ile düşüyor.

Özet log:

- `12 RES/GES saatlik YKS istegi zaman asimina ugradi.`
- `Saatlik toplam 0 kayit alindi.`

Bu yol, PLAN v6'nın kaçınmak istediği eski davranışın hâlâ aktif olduğunu ve timeout sonrası bütçeyi tükettiğini gösteriyor.

### 5. Tam gün fallback de hibrit için eski sayfalı yolu kullanıyor

Saatlik istekler başarısız olduktan sonra logda:

- `hibrit RES/GES aday tam gun fallback denenecek: 10933818957`
- ardından `YKS cekimi 180 sn toplam sure butcesini doldurdu.`

Kodda bu fallback `fetchRgdhWindBusbarByDayPages()` fonksiyonuna gidiyor. Bu fonksiyon tam gün için yine `page=0`, `page=1`, ... sayfalı yaklaşımı kullanıyor. Yani hibrit için bilinen problemli `page` davranışından tamamen çıkılmış değil.

İlgili kod:

- `background.js:689-733`
- `background.js:1351-1437`

### 6. Bu log YKS network logu değil, eklenti logu

Verilen CSV `RGDH_EKLENTI_LOGLARI` dosyası. İçindeki `HTTP`, `Response Headers`, `Response Row Count`, `Response Total Count` alanları GEYCEK denemesi için boş. Dolayısıyla bu dosya tek başına YKS'nin gerçekten 200/4xx/5xx ne döndürdüğünü göstermiyor; yalnızca eklenti tarafındaki abort/timeout kararını gösteriyor.

Bu gözlem kök nedeni değiştirmiyor ama teşhisin güven sınırını belirliyor: elimizde kesin olarak görülen kırılım, YKS cevabının eklenti tarafına ulaşmadan `AbortController` timeout'u ile kesilmesi.

## Kök Neden

Birincil kök neden:

PLAN v6'nın page'siz range stratejisi GEYCEK için bilinen çalışan biçime yeterince yaklaşmıyor. Eklenti 24 saatlik full-day page'siz range'i `size=500` ile deniyor; bu istek timeout alınca `size=60` page'siz retry veya daha küçük page'siz chunk denemesi yapmadan eski saatlik `page=0` akışına dönüyor.

Destekleyici kök neden:

UI tarafı hibrit çekim için hâlâ 180 saniyelik `jobTimeoutMs` gönderiyor ve polling'i 180 saniyeye sabitliyor. Bu yüzden background tarafında tanımlanan 10 dakikalık hibrit bütçe uygulanmıyor. GEYCEK gibi yavaş/yoğun hibrit veride range timeout + saatlik fallback kombinasyonu 180 saniyeyi tüketiyor.

Sonuç:

`windRows=0` kalıyor, normalize edilecek API satırı oluşmuyor ve final hata `NO_NORMALIZED_ROWS` oluyor.

## Kök Neden Olmayanlar

- YKS iç ID'nin yanlış olduğu bu logla desteklenmiyor. Eklenti `10933818957` iç ID'sini bulmuş ve bu ID ile endpoint'e gitmiş.
- Normalizer ana neden değil. Normalizer'a veri gelmiyor; `API kaydi normalize edilmedi` sonucu fetch'in boş dönmesinden kaynaklanıyor.
- Genel auth bozukluğu bu logla kanıtlanmıyor. HTTP 401/403 yok; hata sınıfı response değil abort/timeout.

## Önerilen Düzeltme Sırası

1. Hibrit WIND için UI'daki `resolveFetchJobTimeoutMs()` değerini `600000` yapın ve `runFetchJob()` içindeki `Math.min(180000, ...)` sınırını kaldırın ya da hibrit payload için 600 saniyeye izin verin.
2. `fetchRgdhWindBusbarByYksUiRange()` içinde `PAGE_FETCH_TIMEOUT` durumunda da `size=60` page'siz retry çalıştırın. Daha güvenli seçenek: hibrit page'siz range'de ilk denemeyi doğrudan `size=60` yapmak.
3. `size=60` da timeout olursa full-day yerine page'siz küçük aralıklar deneyin: örneğin 2/4/6 saatlik chunk, yine `page` parametresiz.
4. Hibrit range başarısız olduğunda hemen saatlik `page=0` yoluna dönmeyin; önce page'siz küçük chunk stratejisini tüketin.
5. `tryHybridWindCandidateDayFallback()` hibrit için `fetchRgdhWindBusbarByDayPages()` yerine page'siz range/chunk fonksiyonunu kullanmalı veya sayfalı fallback en son, düşük öncelikli teşhis adımı olmalı.
6. YKS Logları panelinden ayrıca `RGDH_YKS_LOGLARI` export'u alınmalı. Kabul testinde GEYCEK için HTTP, süre, `x-total-count`, response preview ve row count alanları görünmeden başarı/başarısızlık kapatılmamalı.

## Kabul Kriteri

GEYCEK RES için başarılı sayılacak durum:

- İlk başarılı hibrit istek page'siz olmalı.
- `busbarId.equals=10933818957` ile `windRows > 0` dönmeli.
- Final hata `NO_NORMALIZED_ROWS`, `YKS_JOB_TIMEOUT` veya yalnızca `YKS_HOURLY_TIMEOUT` olmamalı.
- CSV'de en az bir başarılı YKS network kaydı `HTTP 200`, `Response Row Count > 0` veya `Response Total Count > 0` ile görünmeli.
