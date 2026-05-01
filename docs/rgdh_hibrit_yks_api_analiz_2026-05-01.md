# Hibrit RES/GES YKS API Çekim Analizi

## İncelenen Kaynaklar
- Eklenti hata logu: `yks_izleme_modul/yks_docs/RGDH_HATA_DETAYLARI_2026-05-01 (9).csv`
- Kullanıcı tarafından paylaşılan çalışan YKS Network isteği:
  `GET /api/rgdh-wind-busbar-data?measurementDate.greaterOrEqualThan=2026-04-30T21:00:00Z&measurementDate.lessThan=2026-05-01T11:00:00Z&busbarId.equals=9490732369&size=60&sort=measurementDate,asc`
- İlgili kod yolları:
  - `rgdh-api-client.js`
  - `background.js`
  - `rgdh-monitor.js`

## Özet
AKYEL-1 RES hibrit/yardımcı kaynak çekiminde sorun büyük olasılıkla busbar ID çözümlemesinden kaynaklanmıyor. Çalışan YKS Network örneği de eklenti de aynı YKS iç ID değerini kullanıyor: `9490732369`.

Asıl fark istek şekli:
- Eklenti hibrit santral için 24 ayrı saatlik istek yapıyor ve her isteğe `page=0` ekliyor.
- YKS ekranındaki çalışan istek tek geniş aralık gönderiyor ve `page` parametresi kullanmıyor.

Bu nedenle kök neden adayım: YKS `rgdh-wind-busbar-data` endpoint’i AKYEL-1 gibi yardımcı kaynaklı RES/GES baralarda saatlik + pageable (`page=0`) sorgu biçiminde timeout’a düşüyor; aynı veri, YKS ekranının kullandığı geniş aralık + page’siz sorgu biçiminde dönebiliyor.

## Log Bulguları

### İş Özeti
CSV’de 233 satır var. AKYEL-1 job kaydı:
- Job: `rgdh-job-1777639788580-3`
- Seçili bara ID: `6002`
- YKS iç bara ID: `9490732369`
- Kaynak tipi: `WIND`
- Sonuç: `apiRows=0`, `partialErrors=1`, `errorClass=YKS_HOURLY_TIMEOUT`

Karşılaştırma için aynı logda diğer işler başarılı:
- `selected=2890`, `internal=10928268862`, `apiRows=900`
- `selected=5532`, `internal=9333006401`, `apiRows=900`

Bu, genel auth/session veya background fetch mekanizmasının tamamen bozuk olmadığını gösteriyor.

### AKYEL-1 Saatlik İstek Deseni
AKYEL-1 için 24 adet `rgdh-wind-busbar-data` isteği görülüyor:
- `2026-04-30T21:00:00Z -> 2026-05-01T12:00:00Z` aralığındaki 15 saatlik istek `PAGE_FETCH_TIMEOUT` ile yaklaşık 20-21 saniyede abort oluyor.
- `2026-05-01T12:00:00Z -> 2026-05-01T21:00:00Z` aralığındaki 9 saatlik istek `HTTP 200` dönüyor ama `rowCount=0`.

Örnek timeout:
`2026-05-01T10:00:00Z -> 2026-05-01T11:00:00Z page=0 size=60 error=PAGE_FETCH_TIMEOUT`

Örnek boş başarılı yanıt:
`2026-05-01T20:00:00Z -> 2026-05-01T21:00:00Z page=0 size=60 http=200 rows=0`

Bu tarih 2026-05-01 günü çalıştırıldığı için geç saatlerdeki `200/0 satır` sonucu muhtemelen günün henüz oluşmamış gelecek saatlerinden kaynaklanıyor. Ana sorun ilk saatlerdeki timeout dizisi.

### Çalışan YKS İsteği İle Fark
Çalışan istek:
- Aynı endpoint: `/api/rgdh-wind-busbar-data`
- Aynı iç ID: `busbarId.equals=9490732369`
- Geniş aralık: `2026-04-30T21:00:00Z` ile `2026-05-01T11:00:00Z`
- `size=60`
- `sort=measurementDate,asc`
- `page` parametresi yok
- `HTTP 200` ve satır dönüyor.

Eklenti istekleri:
- Aynı endpoint ve aynı ID
- 1 saatlik aralıklar
- `size=60`
- `page=0`
- `sort=measurementDate,asc`
- Veri olan ilk saatlerde timeout.

Bu fark, “iç ID yanlış” hipotezini zayıflatıyor ve “YKS ekranının request şekli kopyalanmalı” hipotezini güçlendiriyor.

## İkincil Bulgular

### Hibrit Fallback Logları Görünmüyor
CSV içinde `probe`, `candidate`, `tam gun fallback`, `hybrid-full-day` veya `busbarId.equals=6002` ile wind-data fallback izi yok. Bu iki olasılığa işaret ediyor:
- Çalışan eklenti paketinde son fallback kodu aktif olmayabilir.
- `selectedBusbar.hasAuxiliarySource` değeri logda string `"true"` olarak geliyor; background tarafında bazı kontroller sadece boolean `true` kabul ediyor olabilir.

Bu ikinci nokta kritik: `rgdh-monitor.js` katalogdan seçerken yardımcı kaynak bilgisini boolean üretiyor gibi görünse de log export’ta `"hasAuxiliarySource":"true"` string olarak kaydedilmiş. `background.js` içindeki `isAuxiliaryRgdhBusbar` ve `normalizeSelectedRgdhBusbar` string true değerini hibrit kabul etmezse hibrit fallback zinciri devreye girmeyebilir.

### Normalizasyon Sorunu Değil
Kullanıcının paylaştığı çalışan JSON satırları `busTa1Volt`, `tpysBusVoltSet`, `sumPgenActive`, `sumPgenReactive`, `auxiliarySource`, `auxiliarySourceReactive` gibi beklenen alanları içeriyor. Eklentide `apiRows=0` olduğu için sorun normalizer aşamasına gelmeden, fetch/request aşamasında oluşuyor.

## Kök Neden Adayları
1. YKS endpoint’i yardımcı kaynaklı RES/GES baralarda saatlik + `page=0` sorgularda timeout’a düşüyor.
2. YKS ekranı aynı veriyi geniş aralık + page’siz sorguyla aldığı için eklenti bu özel santral tipinde ekranın request biçimini taklit etmeli.
3. Hibrit fallback sadece “24 saat timeout + sonraki aday var” gibi dar koşullarda çalışıyor olabilir; tek doğru iç ID bulunduğunda geniş aralık fallback denenmeden job `YKS_HOURLY_TIMEOUT` ile bitiyor.
4. `hasAuxiliarySource` string/boolean uyumsuzluğu hibrit yolun bazı kurulumlarda devreye girmemesine neden olabilir.
5. Gün içi çekimde gelecek saatler de sorgulandığı için `200/0 satır` logları oluşuyor; bu ana timeout nedeni değil ama hata özetini bulanıklaştırıyor.

## Önerilen Çözüm Yönü
Hibrit/yardımcı kaynak RES/GES için YKS ekranıyla aynı request biçimine yakın yeni bir “range cursor” çekim yolu eklenmeli:

- İlk tercih: geniş aralık + `page` parametresiz istek.
- Aralık: seçili günün İstanbul 00:00 UTC karşılığı ile seçili gün bugünse “şimdiye kadar”, geçmiş günse gün sonuna kadar.
- Parametreler: `measurementDate.greaterOrEqualThan`, `measurementDate.lessThan`, `busbarId.equals`, `size`, `sort`; `page` yok.
- 60 satır gelirse son `measurementDate` değerinden bir dakika sonrasına cursor ilerletilip aynı page’siz istek tekrarlanmalı.
- 60’tan az satır gelirse aralık tamamlanmış kabul edilmeli.
- Bu yol satır döndürürse saatlik timeout hataları job sonucuna partial error olarak taşınmamalı; sadece diagnostik logda kalmalı.

Bu yaklaşım YKS ekranındaki başarılı davranışı baz alır ve `page=0` kaynaklı backend timeout ihtimalini azaltır.

