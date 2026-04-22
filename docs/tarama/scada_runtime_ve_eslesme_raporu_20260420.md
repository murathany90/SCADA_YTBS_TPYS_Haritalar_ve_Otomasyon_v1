# SCADA Runtime, Stale Veri ve Eşleşme Zinciri Raporu

Tarih: `2026-04-20`

Bu rapor, mevcut V2 harita runtime'ı ve `data/kml_layers_v2.json` veri modeli üzerinden hazırlanmıştır. Kaynak olarak özellikle şu dosyalar incelenmiştir:

- `scada-v2-runtime.js`
- `scada-client.js`
- `scada-common.js`
- `background.js`
- `build_kml_layers_v2.py`
- `map-v2-runtime.js`
- `map-modern.js`
- `docs/yeni_harita_modeli/kml_layers_v2_validation.md`

## Kısa Yanıtlar

1. `Stale` veri, son ölçüm zamanı güncel eşiklerin dışına düşmüş ama halen elde bulunan veri demektir. Runtime iki alt durum kullanır:
   - `Gecikmeli`: `90 sn < yaş <= 180 sn`
   - `Bayat`: `yaş > 180 sn`
   Kod referansı: `scada-client.js:35-37`, `scada-v2-runtime.js:165-170`, `scada-v2-runtime.js:9-13`

2. Evet, veri stale olsa bile mevcut snapshot içinde gösterilmeye devam eder. Hat ve trafo için hem listede hem popup'ta zaman/durum bilgisi korunur. Bara için de listede ve popup'ta korunur; ancak harita marker'ında stale'e özel renk vurgusu şu an hat/trafo kadar belirgin değildir.

3. Otomatik yenilemenin bazen çalışmıyor gibi görünmesinin başlıca nedenleri:
   - Sekme gizliyken polling bilinçli olarak atlanıyor.
   - Önceki sorgu hâlâ sürüyorsa yeni tetik atlanıyor.
   - Seçili mod + filtre için ölçüm ID bulunamazsa ağ sorgusu hiç gitmiyor.
   - Auth/network hatasında eski veri `dead` durumuna çekiliyor.
   - Sekmeye geri dönünce anlık catch-up fetch yok; bir sonraki 60 sn tick bekleniyor.

4. Evet, mevcut tasarımda farklı sekmeye geçildiğinde otomatik yenileme durur. Bunu açıkça `document.visibilityState === 'hidden'` kontrolü durdurur. Kod referansı: `scada-client.js:622-629`

5. SCADA canlı verisi şu anda kalıcı depolanmıyor; bellek içi `Map`'lerde tutuluyor. Bu yüzden sayfa yenilenince kayboluyor. Kalıcı olması için `chrome.storage.local` veya tercihen uzun geçmiş için `IndexedDB` kullanılmalıdır.

6. Tek bir SCADA öğesi için geçmişe dönük ayrı sorgu teknik olarak yapılabilir; çünkü sorgu payload'ı zaten `measurementIds[]` ve `timeRange` parametreleri ile daraltılabiliyor. Ancak mevcut UI bunu henüz ayrı bir "tarihsel sorgu" olarak sunmuyor. Şu an görülen grafik, oturum içi polling ile biriken kısa geçmişten üretiliyor.

7. Hat yönü tespit edilemiyorsa temel sebep artık sign kaybı değil, alias/yön çözümlemesidir. `SISTEM_ESLEME_LISTESI.xlsx` içindeki `ÖLÇÜM NOKTASI FORMÜLASYONU` sign bilgisini builder parse ediyor; sorun çoğunlukla formüldeki terminal kodlarının hat uç TM alias seti ile tam çözülememesidir.

8. Bir hatın MW veya MVar için 2 eşleşmesi varsa sistem sabit bir "ana + yedek" seçmiyor. Tüm adaylar modele yazılıyor; runtime her snapshot'ta canlı yanıt içinden çözüm yapıyor. Hatlar için çözüm daha muhafazakâr, trafo/bara için daha pragmatik.

9. KML -> Excel -> SCADA zinciri genel olarak doğrudur ve şu sırayla çalışır:
   - KML `Placemark.description` -> `kmlDescriptionId`
   - `kmlDescriptionId` -> Excel ID eşleşmesi
   - Hat için `09-HAT_LISTESI`, TM için `01-TRAFO_MERKEZI_LISTESI`
   - Hatın başlangıç/bitiş TM adları -> TM ID bağlantısı
   - `SISTEM_ESLEME_LISTESI.xlsx` içinden analog ölçüm adı ayrıştırılarak hat/trafo/bara SCADA adayları bağlanır
   - Runtime, Superset'ten gelen canlı `sinsid` satırları arasından o an için çözüm yapar

## 1. Stale Veri Tam Olarak Ne Demek?

Mevcut runtime'ta stale tek seviyeli değil, iki alt seviyeli çalışır:

- `live`: yaş `<= 90 sn`
- `warn`: yaş `> 90 sn`
- `dead`: yaş `> 180 sn`

Bu kurallar `scada-v2-runtime.js:165-170` içinde uygulanır. UI tarafındaki metin eşlemesi ise:

- `live -> Canli`
- `warn -> Gecikmeli`
- `dead -> Bayat`
- `ambiguous -> Belirsiz`

Kod referansı: `scada-v2-runtime.js:9-13`

Önemli ayrım:

- Karttaki `Stale` sayacı, `warn` ve `dead` durumlarını tek torbada toplar.
- Yani kartta tek sayı görseniz de altta hem "gecikmeli" hem "bayat" kayıt olabilir.

Kod referansı: `scada-v2-runtime.js:747-780`, `scada-v2-runtime.js:1249-1252`

## 2. Stale Veri Harita ve Listede Nasıl Görünüyor?

### 2.1 Hatlar

Hatlarda stale veri kaybolmaz; çözülmüş kayıt ise haritada tutulur:

- canlı ise threshold rengine boyanır
- stale ise `STALE_COLOR` ile boyanır
- popup'ta `Olcum Zamani` ve `Veri Durumu` gösterilir
- listede zaman ve durum gösterilir

Kod referansları:

- `scada-v2-runtime.js:704-743`
- `scada-v2-runtime.js:1328-1341`
- `scada-v2-runtime.js:1344-1377`
- `scada-v2-runtime.js:1513-1528`

Ek not:

- Transport hata verirse önceki çözülen kayıtlar tamamen silinmez; `dead` durumuna çekilir.
- Bu yüzden kullanıcı eski veriyi "görmeye devam eder", ama artık canlı değil bayat olarak işaretlenir.

Kod referansı: `scada-v2-runtime.js:856-884`

### 2.2 Trafolar

Trafolarda stale kayıt:

- haritada marker üstündeki ring rengi ile stale görünür
- popup'ta `Olcum Zamani` ve `Veri Durumu` alanı gösterilir
- listede zaman ve durum gösterilir

Kod referansları:

- `scada-v2-runtime.js:1315-1324`
- `map-v2-runtime.js:368-382`
- `scada-v2-runtime.js:1530-1548`

### 2.3 Gerilim / Baralar

Baralarda stale veri popup ve listede gösterilmeye devam eder:

- popup: `Olculen Gerilim (kV)`, `Olcum Zamani`, `Veri Durumu`
- liste: zaman ve durum

Kod referansları:

- `map-v2-runtime.js:398-410`
- `scada-v2-runtime.js:1550-1565`

Ancak harita marker'ı için kritik nüans şudur:

- bara marker rengi şu an esas olarak gerilim değerinden türetilen renkle veriliyor
- stale durum bilgisi `statusClass` olarak üretiliyor ama marker çiziminde ayrı stale rengi olarak kullanılmıyor

Kod referansları:

- `scada-v2-runtime.js:1303-1312`
- `map-v2-runtime.js:553-570`

Bu nedenle "bara verisi stale olsa bile haritada kalır", ama hat/trafo kadar belirgin stale görselleştirmesi yoktur.

## 3. Veri Bayat Olsa Bile Zaman Bilgisiyle Gösterilmeye Devam Ediyor mu?

Kısa cevap: `Evet`, ama kapsamı şu şekildedir:

- Hat: evet
- Trafo: evet
- Gerilim/Bara: evet
- Sayfa yenilenirse: hayır, çünkü oturum içi bellek sıfırlanır

Ne zaman gösterilmeye devam eder?

- Veri bir önceki başarılı fetch'te çözülmüşse
- Sonraki fetch hata verse bile kayıt `dead` statüsüne çevrilip tutulur

Ne zaman kaybolur?

- Tam sayfa yenilenirse
- Seçili görünür evren için hiç `measurementId` kalmazsa ilgili metrik `Map`'leri boşalır

Kod referansları:

- `scada-v2-runtime.js:897-931`
- `scada-v2-runtime.js:856-884`

## 4. Otomatik Yenileme Neden Bazen Çalışmıyor?

Mevcut sistemde en sık görülen 5 sebep vardır.

### 4.1 Sekme gizliyken polling atlanıyor

Otomatik yenileme `setInterval` ile çalışıyor ama callback içinde şu kontrol var:

`if (document.visibilityState === 'hidden') return;`

Bu nedenle başka sekmeye geçtiğinizde arka plandaki auto refresh fiilen durur.

Kod referansı: `scada-client.js:622-629`

### 4.2 Önceki sorgu bitmeden yeni sorgu tetiklenirse istek atlanıyor

Hem manuel hem otomatik tetikte `fetchInProgress` kontrolü var. Eski istek sürüyorsa yeni istek log'a "atlanildi" diye düşer.

Kod referansları:

- `scada-v2-runtime.js:886-894`
- `scada-client.js:304-305`

### 4.3 Seçili filtre/mod için ölçüm ID bulunamıyor

V2 runtime broad sorgu yerine sadece görünür öğelerin `measurementIds` kümesini sorgular. Eğer seçili evrende hiçbir ID yoksa ağ isteği hiç gitmez; UI `idle` durumuna alınır.

Kod referansı: `scada-v2-runtime.js:75-97`, `scada-v2-runtime.js:897-931`

### 4.4 Auth veya transport hatası

Auth/network/superset boş veri durumunda mevcut çözülen kayıtlar `dead` yapılır, fakat yeni veri gelmez.

Kod referansı: `scada-v2-runtime.js:999-1015`, `scada-v2-runtime.js:1026-1038`, `scada-v2-runtime.js:1099-1104`

### 4.5 Sekmeye geri dönünce anlık catch-up fetch yok

Şu an `visibilitychange` eventi ile "sekme görünür olunca hemen fetch et" davranışı yok. Bu yüzden kullanıcı sekmeye döndüğünde bazen 1 dakikaya yakın bekler ve "otomatik yenileme çalışmıyor" hissi oluşur.

Repo taramasında `visibilitychange` veya `chrome.alarms` kullanımı yoktur.

## 5. Arka Planda Sekme Değişince Otomatik Yenileme Duruyor mu?

Evet, duruyor.

Mimari olarak mevcut polling content/runtime tarafında çalışıyor; service worker alarm tabanlı bir scheduler yok. Bu yüzden:

- sekme görünmezse fetch tetiklenmiyor
- tarayıcının timer throttling davranışı da ek gecikme yaratabiliyor

Gerçek arka plan yenileme istiyorsak en temiz çözüm:

1. `chrome.alarms` ile background tetik
2. sonucu `chrome.storage.local` veya `IndexedDB`'ye yazma
3. harita sayfası açıldığında son snapshot'ı okuma

## 6. Veriler Tarayıcıda Depolanıyor mu?

SCADA canlı veri tarafı şu anda kalıcı depolanmıyor.

Bellekte tutulan ana yapılar:

- `state.scada.entityMetricsByKey`
- `state.scada.measurementRowsById`
- `state.scada.history`
- `state.scada.lineFlowByLineId`

Kod referansları:

- `scada-v2-runtime.js:32-46`
- `scada-v2-runtime.js:798-802`

Kalıcı depolananlar ise farklı şeyler:

- harita tercihleri: `tpysMapPrefs`
- bara set cache: `tpysBaraSetCache`
- popup ayarları / son CSV metadata'sı

Kod referansları:

- `map-modern.js:13-14`, `map-modern.js:202-215`, `map-modern.js:442`, `map-modern.js:552-553`
- `popup.js:89-117`, `popup.js:142-143`, `popup.js:417-433`

### Sonuç

Bu yüzden sayfa yenilenince SCADA verisi kayboluyor; çünkü kalıcı storage'a yazılmıyor.

### Kalıcı Tutma İçin Öneri

En etkili yaklaşım:

1. Son başarılı normalized snapshot'ı `chrome.storage.local` içine yaz
2. Yanına `savedAt`, `sourceTimestamp`, `metricMode`, `filterKey`, `transport` bilgilerini koy
3. Sayfa açılışında önce storage'dan yükle, sonra canlı fetch ile güncelle
4. Uzun geçmiş gerekiyorsa `IndexedDB` kullan
5. Storage'dan geri yüklenen veri için TTL uygula

## 7. Sadece Belirli Bir SCADA Öğesi İçin Geçmişe Dönük Ayrı Sorgu Yapılabilir mi?

Teknik olarak `evet`, mevcut kontrat buna uygundur.

Çünkü payload üreticisi şu parametreleri destekliyor:

- `elementNames`
- `measurementIds`
- `timeRange`
- `rowLimit`

Kod referansları:

- `scada-common.js:12-35`
- `scada-common.js:48-105`
- `background.js:428-527`

### Bugün Gerçekte Ne Var?

Bugün ekrandaki büyük grafik, gerçek bir "geçmiş sorgu" değildir. Oturum sırasında polling ile toplanan kısa history'den çizilir.

- history bellekte tutulur
- üst sınır `20` noktadır
- grafik yalnız hat için açılır

Kod referansları:

- `scada-client.js:57`
- `scada-v2-runtime.js:690-701`
- `scada-v2-runtime.js:1425-1508`

### Ne Eksik?

Henüz şu özellik yok:

- "bu tek hatı son 24 saat / 7 gün sorgula"
- "bu tek trafoyu tarih aralığı ile getir"
- "bu tek baranın geçmiş gerilimini getir"

### Nasıl Yapılır?

Yeni bir geçmiş sorgu akışı eklenirse:

1. seçilen entity'nin `measurementIds[]` kümesi çıkarılır
2. kullanıcıdan veya preset'ten `timeRange` alınır
3. aynı `buildChartPayload()` ile source'a dar sorgu atılır
4. hat ise yine çok adaylı çözüm mantığı tarihsel satırlar üzerinde uygulanır

## 8. Hat Yönü Neden Bazen Tespit Edilemiyor?

Buradaki kritik nokta şu:

- sign bilgisi builder aşamasında kaybolmuyor
- sorun çoğu zaman alias/yön çözümleme tarafında yaşanıyor

### 8.1 Sign bilgisi gerçekten var mı?

Evet. `build_kml_layers_v2.py` formül satırını parse ediyor:

- `(+1) D.PASA, 380, YILDIZTE, P`
- `(-1) SINOP, 31, swTRB, Q`

ve bunları `formulaParts[]` içine `sign`, `stationCode`, `targetCode`, `quantity` alanlarıyla yazıyor.

Kod referansı: `build_kml_layers_v2.py:270-305`

### 8.2 Runtime yönü nasıl çözüyor?

Hat çözümlemesi şu sırayla yapılır:

1. Hatın başlangıç ve bitiş TM'leri için alias seti üretilir
   - `tm.name`
   - `tm.ucteKodu`
   - `tm.psseAdi`

2. Önce formüldeki `stationCode/targetCode` ile eşleşme denenir

3. Yetmezse canlı Superset row içindeki `tmName/remoteName` ile eşleşme denenir

4. Eşleşirse:

`normalizedValue = sourceValue * formulaSign * directionOrientation`

5. Eşleşme yoksa kayıt `orientation-unknown` olur

Kod referansı: `scada-v2-runtime.js:437-557`

### 8.3 Neden başarısız olabilir?

Başlıca sebepler:

- formüldeki terminal kodu TM adının kısaltılmış farklı bir alias'ı olabilir
- `row.tmName` / `row.remoteName` sahadaki isimlendirme ile model alias'ları farklı olabilir
- iki uçtan gelen iki aday aynı anda canlı olabilir
- aynı timestamp'te çelişen değerler gelebilir

### 8.4 Yön çözülemezse ne olur?

- `orientation-unknown` olarak işaretlenir
- hat yanlış yöne ok çizmez
- haritada dashed / warning-threshold stili alabilir
- audit raporunda ayrı sınıf olarak görünür

## 9. MW ve MVar İçin 1 veya 2 Eşleşme Varsa Hangi Kayıt Baz Alınıyor?

### 9.1 Builder aşaması

Builder sabit bir "birincil kayıt" seçmez.

Her metric için:

- `ids[]`
- `rows[]`
- `resolvedId: null`
- `ambiguous: boolean`

yapısı tutulur.

Kod referansı: `build_kml_layers_v2.py:296-320`

Yani model şunu söyler:

- "Bu hatta 1 aday var"
- veya
- "Bu hatta 2 canlı aday olabilir, ikisini de saklıyorum"

### 9.2 Hatlar için runtime seçim mantığı

Hatlarda çözüm şu öncelikle yapılır:

1. O an Superset yanıtında gerçekten görünen adaylar alınır
2. Yönü alias ile çözülebilen adaylar tercih edilir
3. Tek aday kalırsa o alınır
4. Birden fazla aday varsa en yeni timestamp'e bakılır
5. Aynı timestamp ve aynı değer ise `same-value`
6. Aynı timestamp ama tolerans içinde ise `tolerance-mean`
7. Hâlâ çelişki varsa `ambiguous-live`

Kod referansları:

- `scada-v2-runtime.js:437-557`
- `scada-v2-runtime.js:576-585`

### 9.3 Trafo ve bara için runtime seçim mantığı

Trafo ve bara daha basit çözülür:

1. en yeni timestamp
2. timestamp eşitse mutlak değeri büyük olan

Ama birden fazla aday varsa kayıt yine `sourceAmbiguous=true` bilgisini taşır.

Kod referansı: `scada-v2-runtime.js:560-574`

### 9.4 Yedek kayıt mantığı var mı?

Sabit anlamda "şu ana, şu yedek" mantığı yok.

Doğrusu şu:

- model tüm adayları saklar
- runtime o snapshot için en iyi çözümü seçer

Bu, statik backup'tan daha esnektir; çünkü bazı saatlerde sadece bir uçtaki ölçüm canlı olabilir, başka saatte diğer uçtaki olabilir.

## 10. SCADA Sorgu Kontratı Şu Anda Nasıl Çalışıyor?

V2 runtime broad "tüm network" sorgusu atmıyor. Sadece görünür evrenden üretilen `measurementIds` kümesini istiyor.

Kod referansı: `scada-v2-runtime.js:75-97`

### Modlara göre `elementName`

- `Hat (MW)` -> `['P', 'Q']`
- `Hat (MVar)` -> `['P', 'Q']`
- `Trafo (MW)` -> `['P', 'Q']`
- `Trafo (MVar)` -> `['P', 'Q']`
- `Gerilim (kV)` -> `['U']`

Kod referansı: `scada-v2-runtime.js:2-7`

### Superset payload'a nasıl gidiyor?

`buildChartPayload()` artık şöyle çağrılıyor:

- `kvFilters: []`
- `tearFilters: []`
- `elementNames: scope.elementNames`
- `measurementIds: scope.measurementIds`

Kod referansı: `scada-v2-runtime.js:829-839`

Bu da `SCADA_COMMON.buildChartPayload()` içinde şu filtrelere dönüşüyor:

- `elementName == / IN`
- `sinsid IN [...]`

Kod referansları:

- `scada-common.js:48-105`
- `background.js:428-527`

Bu önemli bir tasarım değişikliğidir:

- eski tara filtresi / kV filtresi ana daraltma değil
- ana daraltma artık doğrudan `sinsid IN görünür_IDler`

## 11. KML'den SCADA'ya Uzanmış Tam Eşleşme Zinciri

Bu zinciri adım adım anlatmak en doğru yaklaşım olacaktır.

### 11.1 KML parse aşaması

KML içindeki her `Placemark` okunur:

- `Point` ise TM adayı
- `LineString` ise hat adayı
- `description` alanı `kmlDescriptionId` olarak alınır

Kod referansı: `build_kml_layers_v2.py:193-231`

### 11.2 TM eşleşmesi

TM için eşleşme tamamen ID bazlıdır:

- `KML Placemark.description`
- `-> 01-TRAFO_MERKEZI_LISTESI.xlsx / ID`

Sonra TM entity oluşturulur.

Kod referansları:

- `build_kml_layers_v2.py:340-368`
- `build_kml_layers_v2.py:611-614`

### 11.3 Hat eşleşmesi

Hat için de ilk eşleşme tamamen ID bazlıdır:

- `KML Placemark.description`
- `-> 09-HAT_LISTESI.xlsx / ID`

Kod referansları:

- `build_kml_layers_v2.py:371-392`
- `build_kml_layers_v2.py:623-628`

### 11.4 Hat uç TM'lerinin bağlanması

Hat Excel satırındaki:

- `Başlangıç Trafo Merkezi`
- `Bitiş Trafo Merkezi`

alanları normalize edilip TM tablosunda aranır. Böylece:

- `startTm`
- `endTm`
- `startTmId`
- `endTmId`

alanları dolar.

Kod referansı: `build_kml_layers_v2.py:371-392`

### 11.5 Trafo ve bara parent bağlama

Trafo ve bara için ilk ilişki coğrafi değil, parent TM adıdır:

- `11-TRAFO_LISTESI.xlsx / Trafo Merkezi`
- `02-BARA_LISTESI.xlsx / Trafo Merkezi`

Bu parent TM bulununca child entity TM altına bağlanır.

Kod referansı: `build_kml_layers_v2.py:641-663`

### 11.6 SCADA eşleşmesi

`SISTEM_ESLEME_LISTESI.xlsx` içinde yalnız `SİSTEM TÜRÜ = SCADA` satırları alınır.

Kod referansı: `build_kml_layers_v2.py:666-673`

Sonra `ANALOG ÖLÇÜM` içinden metric türü çıkarılır:

- `Aktif Güç (MW)` -> `active`
- `Reaktif Güç (MVAr)` -> `reactive`
- `Gerilim (kV)` -> `voltage`

Hatlar için eşleşme:

- `detail` kısmında `EIH` varsa
- normalize edilmiş hat adı ile `hat_by_name` içinde exact match aranır

Trafolar için eşleşme:

- detail `TR-...` formatındaysa
- `(TRAFO MERKEZI, detail)` anahtarı ile bağlanır

Baralar için eşleşme:

- sadece `voltage`
- `(TRAFO MERKEZI, detail)` anahtarı ile bağlanır
- ayrıca bara `154/400 kV` olmalıdır

Kod referansları:

- `build_kml_layers_v2.py:674-693`

### 11.7 Runtime canlı çözüm

Modelde bağlı aday `measurementIds` listesi vardır. Canlı fetch sonrası Superset'ten gelen `sinsid` satırları ile:

- ölçüm mevcut mu
- hangisi daha yeni
- yön çözülebiliyor mu
- çelişki var mı

soruları runtime'ta çözülür.

Kod referansları:

- `scada-common.js:176-213`
- `scada-v2-runtime.js:576-688`

## 12. Gerçek Örnekler

### 12.1 Hat Örneği: `400kV DAVUTPAŞA - YILDIZTEPE EİH`

Modelden çıkarılan gerçek zincir:

- Hat ID: `1789`
- KML description ID: `1789`
- Başlangıç TM: `DAVUTPAŞA` / `56`
- Bitiş TM: `YILDIZTEPE` / `57`
- YTM: `Trakya YTM`

Aktif güç adayları:

- `baa40b2b-6303-4191-8d10-22b09c12c2bd` -> `(+1) D.PASA, 380, YILDIZTE, P`
- `e80089f2-ac9f-486f-94c1-b0a16b5bcc74` -> `(+1) YILDIZTE, 380, DAVUTPAS, P`

Reaktif güç adayları:

- `76ea509a-59bc-4aa0-82eb-948c2b83e039` -> `(+1) D.PASA, 380, YILDIZTE, Q`
- `f2068a32-e840-4037-a185-9d652d208a6d` -> `(+1) YILDIZTE, 380, DAVUTPAS, Q`

Bu örnek şunu gösterir:

- KML -> hat listesi eşleşmesi `ID = 1789` ile bire bir
- SCADA tarafında tek bir "hat sensörü" yok; iki uçtan iki aday olabiliyor
- Runtime, o an Superset'te görünen ve yönü çözülebilen adayı kullanmak zorunda

### 12.2 Trafo Örneği: `SİNOP / TR-B`

Modelden çıkarılan gerçek zincir:

- Trafo ID: `2348`
- TM ID: `207`
- TM adı: `SİNOP`
- Trafo adı: `TR-B`

Aktif güç:

- `997b0dc2-568e-40de-8a83-58455b75ae7c` -> `(-1) SINOP, 31, swTRB, P`

Reaktif güç:

- `f570389d-a069-43af-bf91-6cfeb5e7005f` -> `(-1) SINOP, 31, swTRB, Q`

Bu örnek daha basittir; tek adaylı olduğu için yön/çakışma problemi daha azdır.

### 12.3 Bara Örneği: `DAVUTPAŞA / 400 B-1`

Modelden çıkarılan gerçek zincir:

- Bara ID: `3140`
- TM ID: `56`
- TM adı: `DAVUTPAŞA`
- Bara adı: `400 B-1`
- Gerilim seviyesi: `400`

Gerilim ölçümü:

- `4a9db189-b06e-470b-a8c3-b887b0dc8404` -> `(+1) D.PASA, 380, BB_1, U`

Bu örnek şunu gösterir:

- bara eşleşmesi hat gibi ID bazlı değil
- önce TM parent bağlanıyor
- sonra `(TRAFO MERKEZI, bara adı)` ile `U` ölçümü bağlanıyor

## 13. Yeni KML Modeli İçin Mevcut Doğrulama Durumu

`docs/yeni_harita_modeli/kml_layers_v2_validation.md` dosyasına göre:

- TM eşleşmesi: `1583/1583`
- Hat eşleşmesi: `2341/2341`
- Trafo -> TM parent eşleşmesi: `3001/3001`
- Bara -> TM parent eşleşmesi: `5960/5960`
- Hat aktif kapsama: `2290/2341`
- Hat reaktif kapsama: `2290/2341`
- Trafo aktif kapsama: `2314/3001`
- Trafo reaktif kapsama: `2317/3001`
- 154/400 bara gerilim kapsama: `1811/3303`

Bu tablo, temel veri modelinin artık sağlam olduğunu; asıl sorunların büyük ölçüde runtime çözümleme, alias standardizasyonu ve persistence katmanında olduğunu gösteriyor.

## 14. En Etkili İyileştirme Önerileri

### 14.1 Otomatik yenileme ve kalıcılık

En yüksek etkili paket:

1. `chrome.alarms` ile gerçek arka plan scheduler
2. son snapshot + summary + transport bilgisini `chrome.storage.local` içine yazma
3. açılışta storage restore
4. sekme görünür olunca `visibilitychange` ile anlık catch-up fetch

### 14.2 Stale görünürlüğü

Şu an kartta tek `Stale` sayısı var. Bunu ikiye ayırmak daha anlamlı olur:

- `Gecikmeli`
- `Bayat`

Ayrıca bara marker'ında da stale için ayrı görsel dil kullanılmalı.

### 14.3 Hat yön çözümleme kalitesi

En etkili teknik iyileştirme:

1. alias sözlüğünü büyütmek
2. `tm.name + ucteKodu + psseAdi` yanına kurumsal kısa kod tablosu eklemek
3. audit CSV'de alias başarısız örneklerini biriktirmek
4. gerekirse sorunlu hatlar için manuel override tablosu tanımlamak

### 14.4 Geçmiş sorgu

İş değeri yüksek bir sonraki adım:

- hat / trafo / bara için ayrı tarihsel sorgu modalı
- preset aralıklar: `Son 1 saat`, `6 saat`, `24 saat`, `7 gün`
- aynı `measurementIds[]` kontratı ile kaynak sorgusu

## Sonuç

Mevcut V2 mimarisi temel olarak doğru yönde ilerliyor:

- KML -> Excel -> SCADA zinciri kurulmuş durumda
- broad sorgu yerine görünür öğe bazlı `sinsid` sorgusuna geçilmiş durumda
- stale/ambiguous/orientation-unknown ayrımı runtime'ta mevcut

Ancak kullanıcı deneyimindeki ana eksikler şunlar:

- arka plan yenilemenin sekme görünürlüğüne bağlı olması
- canlı snapshot'ın kalıcı depolanmaması
- bara stale görselliğinin zayıf olması
- hat yön çözümlemesinde alias kapsamasının hâlâ sınırlı olması

Özetle:

- `Stale` şu an gerçekten bir veri yaşı kavramıdır
- veri stale olsa bile çoğu durumda ekranda tutulur
- tam sayfa yenilemede kaybolmasının nedeni persistence eksikliğidir
- çift adaylı hatlarda sabit backup değil, snapshot bazlı çözüm yapılır
- hat yön problemi artık ağırlıklı olarak alias standardizasyonu problemidir, sign kaybı problemi değildir
