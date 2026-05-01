# Hibrit YKS Çekimi Kök Neden Raporu ve Uygulama Planı

## Bulgular ve Kök Neden

- GEYCEK RES için YKS tarafında veri var: manuel YKS loglarında `10933818957` iç ID ile `/api/rgdh-wind-busbar-data` page’siz range istekleri HTTP 200 dönüyor ve `x-total-count` 1080/2520 görünüyor.
- Eklenti tarafındaki başarısızlık veri/auth eksikliği değil: eklenti 18 saatlik `page=0` isteklerini 20 sn timeout + 180 sn toplam bütçeyle tüketiyor, sonra `YKS_JOB_TIMEOUT`, `YKS_HOURLY_TIMEOUT`, `NO_NORMALIZED_ROWS` üretiyor.
- Mevcut fallback eşiği hatalı: hibrit page’siz range fallback sadece `failedHours >= 24` olunca çalışıyor. GEYCEK logunda 18 saatlik pencere olduğu için tüm denenen saatler başarısız olsa bile fallback tetiklenmiyor.
- Ham Data tablosunda YKS orijinal tablodaki bazı durum/onay alanları görünür kolon olarak eksik.

## Uygulama Değişiklikleri

- Hibrit RES/GES için çekim sırası değiştirilecek: yardımcı kaynaklı hibrit baralarda önce YKS ekranının çalışan page’siz range biçimi kullanılacak; saatlik `page=0` yolu yalnızca ikincil fallback olacak.
- Page’siz istek biçimi: `/api/rgdh-wind-busbar-data`, `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `busbarId.equals`, `size`, `sort=measurementDate,asc`; kesinlikle `page` parametresi olmayacak.
- Hibrit varsayılanları güncellenecek: `windRangeSize=500`, 4xx/boş gövde + `x-total-count` durumunda `size=60` retry, `windRangeTimeoutMs=60000`, hibrit toplam bütçe üst sınırı 10 dakika.
- Eski saatlik yol çalışırsa korunacak; başarısız olursa fallback artık `failedHours >= attemptedHours` koşuluyla tetiklenecek, sadece 24 saatlik tam gün koşuluna bağlı kalmayacak.
- Ham Data tablosuna şu kolonlar eklenecek/görünür yapılacak:
  - `TPYS GD` -> `tpysVoltageDrop`
  - `Devre Durumu` -> `rgdhOffBoardStatus` terslenmiş gösterim
  - `Yükümlülük Durumu` -> `noObligationStatus` terslenmiş gösterim
  - `D.İ MVAR ONAY` -> `diMvarApprove`
  - `A.İ MVAR ONAY` -> `aiMvarApprove`
  - `Onay Durum` -> `approvalStatus ?? auxiliaryApprovalStatus`
- YKS log kapsamına `#/teias-rgdh-conv-unit-data` route’u eklenecek. Bu route aktifken `https://yks.teias.gov.tr/api/*` network, console, header ve response özetleri YKS Logları panelinde çalışacak.
- YKS log özetinde body preview boş kalsa bile `x-total-count` ve `Link` header bilgileri kaydedilecek; token/cookie/Authorization alanları redakte edilmeye devam edecek.

## Arayüz ve Tip Etkisi

- Normalized row yapısı geriye uyumlu kalacak; mevcut alanlar genişletilip Ham Data’da daha açık kolon adlarıyla gösterilecek.
- Durum/onay kolonlarında `true/1`, `false/0`, `null` için tek formatter kullanılacak: onay/aktif ise işaret, başarısız/pasif ise çarpı, veri yoksa `-`.
- YKS diagnostic event modeline isteğe bağlı `responseTotalCount` ve `responseLink` alanları eklenecek; CSV export bu alanları da içerecek.

## Test Planı

- `background` testleri:
  - Hibrit GEYCEK benzeri payload’da ilk başarılı çağrının page’siz range olduğunu doğrula.
  - 18/18 saatlik timeout durumunda `failedHours >= attemptedHours` ile range fallback tetiklendiğini doğrula.
  - Non-hibrit RES/GES ve konvansiyonel isteklerde mevcut `page=0` davranışının bozulmadığını doğrula.
- `rgdh-normalizer` testleri:
  - `tpysBusVoltDrop`, `rgdhOffBoardStatus`, `noObligationStatus`, `diMvarApprove`, `aiMvarApprove`, `approvalStatus` alanlarının normalize edildiğini doğrula.
- UI smoke testleri:
  - Ham Data başlıklarında yeni 6 kolonun bulunduğunu doğrula.
  - `#/teias-rgdh-conv-unit-data` route’u aktifken YKS loglarının `/api/*` çağrılarını yakaladığını doğrula.
- Kabul testi:
  - GEYCEK RES için çekim sonunda `windRows > 0` olmalı.
  - Final hata `NO_NORMALIZED_ROWS`, `YKS_JOB_TIMEOUT` veya sadece `YKS_HOURLY_TIMEOUT` olmamalı.
  - YKS Logları CSV’sinde conv-unit sayfası ve hibrit range istekleri görünmeli.

## Varsayımlar

- `TPYS GD`, YKS API’deki `tpysBusVoltDrop` değeridir; ekranda görülen `2,00` değeri mevcut normalize alanıyla eşleşiyor.
- `Devre Durumu` için kaynak alan `rgdhOffBoardStatus`, `Yükümlülük Durumu` için kaynak alan `noObligationStatus` kabul edilecek; API farklı alias döndürürse normalizer’a alias olarak eklenecek, veri uydurulmayacak.
- `PLAN_v5.md` bu planla revize edilecek; bu plan mevcut v5’in page’siz fallback fikrini korur ama fallback sırası/eşiği ve eksik Ham Data kolonlarıyla onu tamamlar.
