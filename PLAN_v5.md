# Hibrit YKS Çekimi Kök Neden Raporu ve Uygulama Planı

## Bulgular ve Kök Neden

- GEYCEK RES için YKS tarafında veri var: manuel YKS loglarında `10933818957` iç ID ile `/api/rgdh-wind-busbar-data` page'siz range istekleri HTTP 200 dönüyor ve `x-total-count` 1080/2520 görünüyor.
- Eklenti tarafındaki başarısızlık veri/auth eksikliği değil: eklenti saatlik `page=0` isteklerinde süre bütçesini tüketiyor, sonra `YKS_JOB_TIMEOUT`, `YKS_HOURLY_TIMEOUT`, `NO_NORMALIZED_ROWS` üretiyor.
- Eski fallback eşiği hibrit için fazla katıydı: page'siz range fallback yalnızca `failedHours >= 24` olduğunda devreye giriyordu. Kısmi günlerde 18/18 saat başarısız olsa bile fallback tetiklenmeyebiliyordu.
- Ham Data tablosunda YKS orijinal tablodaki `TPYS GD`, devre/yükümlülük ve MVAR onay alanları görünür kolon olarak eksikti.

## Uygulama Değişiklikleri

- Yardımcı kaynaklı hibrit RES/GES baralarda ilk çekim yolu YKS ekranının çalışan page'siz range biçimi olacak; saatlik `page=0` yolu sadece ikincil fallback olarak korunacak.
- Page'siz istek biçimi `/api/rgdh-wind-busbar-data` üzerinde `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `busbarId.equals`, `size`, `sort=measurementDate,asc` parametreleriyle çalışacak ve URL'ye `page` eklenmeyecek.
- Hibrit varsayılanları: `windRangeSize=500`, `windRangeTimeoutMs=60000`, toplam hibrit iş bütçesi 10 dakika. Range gövdesi boş ama `x-total-count > 0` ise `size=60` ile tekrar denenecek.
- Fallback eşiği `failedHours >= 24` yanında `failedHours >= attemptedHours` koşulunu da kabul edecek.
- Ham Data tablosuna şu kolonlar eklenecek:
  - `TPYS GD` -> `tpysVoltageDrop`
  - `Devre Durumu` -> `offBoardStatus` ters gösterim
  - `Yukumluluk Durumu` -> `noObligationStatus` ters gösterim
  - `D.I MVAR ONAY` -> `diMvarApprove`
  - `A.I MVAR ONAY` -> `aiMvarApprove`
  - `Onay Durum` -> `approvalStatus ?? auxiliaryApprovalStatus`
- YKS log kapsamına `#/teias-rgdh-conv-unit-data` route'u eklenecek; bu route aktifken `https://yks.teias.gov.tr/api/*` network, console, header ve response özetleri YKS Logları panelinde çalışacak.
- YKS diagnostic event ve CSV çıktısına `responseTotalCount` ve `responseLink` alanları eklenecek. Body preview boş olsa bile `x-total-count` ve `Link` header bilgileri kaydedilecek.

## Test Planı

- `tests/background.test.js`
  - Hibrit payload'da ilk çağrının page'siz range olduğunu doğrula.
  - 18/18 saatlik timeout özetinin fallback için yeterli olduğunu doğrula.
  - Non-hibrit RES/GES ve konvansiyonel `page=0` davranışının bozulmadığını doğrula.
- `tests/rgdh-normalizer.test.js`
  - `tpysBusVoltDrop`, `rgdhOffBoardStatus`, `noObligationStatus`, `diMvarApprove`, `aiMvarApprove`, `approvalStatus` alanlarının normalize edildiğini doğrula.
- `tests/rgdh-ui-smoke.test.js`
  - Ham Data başlıklarında yeni YKS status/onay kolonlarının bulunduğunu doğrula.
- `tests/rgdh-diagnostics.test.js` ve `tests/yks-rgdh-instrumentation.test.js`
  - `teias-rgdh-conv-unit-data` route'unun YKS hedefi olduğunu doğrula.
  - Conv-unit route aktifken `/api/*` çağrılarının loglandığını doğrula.
  - `Response Total Count` ve `Response Link` CSV kolonlarını doğrula.

## Kabul Kriterleri

- GEYCEK RES gibi hibrit baralarda başarılı page'siz range çekiminde `windRows > 0` oluşur.
- Final hata yalnız `NO_NORMALIZED_ROWS`, `YKS_JOB_TIMEOUT` veya `YKS_HOURLY_TIMEOUT` olarak kalmaz.
- Hibrit range request URL'lerinde `page=` bulunmaz.
- Ham Data tablosunda YKS orijinal tablosundaki durum/onay kolonları görünür.
- YKS Logları CSV'sinde conv-unit sayfası, hibrit range istekleri, `x-total-count` ve `Link` bilgileri yer alır.
- Token, cookie, Authorization veya session bilgisi UI, CSV, console veya test çıktısına sızmaz.
