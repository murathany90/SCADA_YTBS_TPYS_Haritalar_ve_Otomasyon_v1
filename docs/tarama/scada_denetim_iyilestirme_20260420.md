# SCADA Denetim Analizi ve V2 KML Sonrasi Iyilestirme Onerileri

Tarih: `2026-04-20`

Durum: `V2 runtime + yeni KML modeli sonrasi revize rapor`

Incelenen girdiler:
- [scada_eslesme_denetim_2026-04-20 (1).csv](</C:/Users/Murathan%20YEN%C4%B0CEL%C4%B0/Downloads/scada_eslesme_denetim_2026-04-20%20(1).csv>)
- [network.txt](</C:/Users/Murathan%20YEN%C4%B0CEL%C4%B0/Downloads/network.txt>)
- [kml_layers_v2.json](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/data/kml_layers_v2.json>)
- [kml_layers_v2_validation.md](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/docs/yeni_harita_modeli/kml_layers_v2_validation.md>)
- [map-modern.html](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/map-modern.html>)
- [scada-common.js](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/scada-common.js>)
- [scada-client.js](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/scada-client.js>)
- [scada-v2-runtime.js](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/scada-v2-runtime.js>)
- [background.js](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/background.js>)

## Kisa Sonuc

Bu raporun onceki versiyonu eski `kml_layers.json` ve eski sorgu davranisi uzerinden yazilmisti. V2 gecisi sonrasinda tablo su:

- Superset tablo sorgusu ile eklentinin canli V2 sorgusu artik ayni sey degil.
- `network.txt` icindeki Superset tablo sorgusu genis bir `P` sorgusu. Eklenti ise secili mod ve gorunen entity evrenine gore `P/Q/U + sinsid IN (...)` sorgusu uretiyor.
- Bu nedenle Superset tablosunda `7000-8000` satir gorunmesi, eklentinin `1000-1200` ham satir ya da `338` gorunen hat gormesiyle celismiyor. Bunlar farkli seviyedeki sayaclar.
- Reaktif guc eklenti tarafinda "turetilmiyor". Kaynak `Q` donuyorsa gorunuyor, donmuyorsa `Hat (MVar)` ve `Trafo (MVar)` bos kaliyor.
- Yeni KML V2 ile yapisal model kapsami buyuk olcude duzeldi. Ana problem artik eski KML degil; sorgu kontrati farki, cok adayli SCADA eslesmeleri ve kaynaktaki `missing-source-row` agirligi.
- Indirilen denetim CSV'sinde mevcut filtre altinda `338` gorunen `400 kV` hat icin durum `138 live`, `33 stale`, `162 missing-source-row`, `5 missing-config-id`. Yani bu gorunumde baskin problem veri kaynagina geri donemeyen olcum ID'ler.

## 1. Bugun Ayni Anda Iki Farkli Sorgu Evreni Var

### 1.1 Superset tablo sorgusu

`network.txt` icindeki request/response dump'i, Superset tablosunun kendisinin attigi genis sorguyu gosteriyor.

Bu sorguda gorulen ana filtreler:

- `time_range = DATEADD(DATETIME("now"), -24, hour) : now`
- `elementName = 'P'`
- `b2Name IN ('400', '380', '420', '154')`
- `row_limit = 50000`

Bu dump icinde:

- `sinsid IN (...)` yok
- `tear IN (...)` yok
- `rowcount = 7472`

Yani bu dosya, Superset sayfasindaki tablo/dataset sorgusunun bir ornegi. Bu sorgu "tum uygun P kayitlarini" cekiyor.

### 1.2 Eklentinin V2 canli sorgusu

Canli harita ekraninda `map-modern.html` hem `scada-client.js` hem `scada-v2-runtime.js` yukluyor. Eski `scada-client.js` temel config ve ortak sabitleri tasiyor; V2 canli sorgu mantigini fiilen `scada-v2-runtime.js` override ediyor.

V2 runtime akisi:

1. Secili SCADA modu belirleniyor.
2. Sol sidebar filtrelerinden gecen gorunen entity listesi cikariliyor.
3. Bu entity'lerin ilgili SCADA ID'leri toplanip `measurementIds` olusuyor.
4. Payload `elementName IN (...)` ve `sinsid IN (...)` ile kuruluyor.
5. `kvFilters` ve `tearFilters` V2 sorgusunda bilincli olarak bos geciliyor.
6. Donen veri `sinsid` bazinda normalize edilip entity metric store'a yaziliyor.

Dolayisiyla V2 canli sorgu, Superset tablosunu kopyalamiyor; tablodan daha dar ve harita ihtiyacina ozel bir sorgu kuruyor.

## 2. Superset Tablosunda Sadece `P` Varken Eklenti Nasil Reaktif Guc Gosterebiliyor

Kisa cevap:

- Eklenti `Q` ve `U` icin de sorgu atabiliyor.
- Superset sayfasinda gordugunuz tablo sorgusu sadece `P` olabilir.
- Bu ikisi ayni request olmak zorunda degil.

Kod davranisi:

- `scada-v2-runtime.js` icinde mod tanimlari su sekilde:
  - `Hat (MW)` -> `elementNames: ['P', 'Q']`
  - `Hat (MVar)` -> `elementNames: ['P', 'Q']`
  - `Trafo (MW)` -> `elementNames: ['P', 'Q']`
  - `Trafo (MVar)` -> `elementNames: ['P', 'Q']`
  - `Gerilim (kV)` -> `elementNames: ['U']`
- `scada-common.js` payload kurarken birden fazla element varsa `elementName IN [...]` filtresi olusturuyor.
- `buildEntityMetricRecord()` aktif ve reaktif metric'i ayri ayri cozuluyor. Yani reaktif deger aktiften hesaplanmiyor.
- Denetim CSV export'u `Birincil` ve `Ikincil` kolonlarini ayri yaziyor. `Ikincil`, secili modun ters metrici.

Bu nedenle senaryo su olabilir:

- `Hat (MW)` modunda bir hattan `P` gelmez ama `Q` gelir.
- Bu satir `missing-source-row` olarak gorunur cunku birincil metric `P` yoktur.
- Buna ragmen `Ikincil` kolonunda `Q` degeri dolu olur.

Indirilen denetim CSV bu davraniyi dogruluyor:

- `missing-source-row` toplam: `162`
- bunlarin `85` adedinde `Ikincil` dolu
- bunlarin `0` adedinde `Birincil` dolu

Bu ne demek:

- aktif guc olmayan pek cok kayitta reaktif guc gelmis
- yani eklenti, en azindan bu snapshot'ta, sadece `P` degil `Q` de de veri goruyor

Onemli sonuc:

- `network.txt` icindeki P-only tablo sorgusu, eklentinin su anki canli V2 fetch'ini tek basina aciklamiyor
- reaktif verinin gorunmesi, canli V2 payload'in en az bazi request'lerde `Q` sonucunu alabildigini gosteriyor

## 3. Trafo ve Gerilim Icin Son Sorgular Nasil Yapiliyor

### 3.1 Ortak isleyis

Tum modlarda ortak akim:

1. Secili mod `METRIC_MODES` icinden okunur.
2. Sol sidebar'dan gorunen entity evreni cikarilir.
3. Bu evrenden SCADA ID kumesi toplanir.
4. `buildChartPayload()` ile Superset request body'si kurulur.
5. `background.js` bu body'yi oturum/cookie auth ile Superset'e POST eder.
6. Donen satirlar `normalizeMetricRows()` ile `sinsid` bazinda en yeni kayda indirgenir.
7. Entity bazinda adaylar cozulur, stale hesaplanir, kart ve harita guncellenir.

### 3.2 Hat modlari

Hat modlarinda gorunen hatlar kullanilir.

- `Hat (MW)`:
  - domain: `hat`
  - primary metric: `active`
  - request element'leri: `P + Q`
- `Hat (MVar)`:
  - domain: `hat`
  - primary metric: `reactive`
  - request element'leri: `P + Q`

Neden iki mod da `P + Q` istiyor:

- popup ve panelde `MW + MVar` birlikte gosteriliyor
- audit export'ta `Birincil` ve `Ikincil` birlikte yaziliyor
- hat renk ve akis yonu primary metric'e gore secilirken yardimci metric de elde tutuluyor

Hat aday cozumleme kurali:

- aday satirlar varsa `startTm -> endTm` yonu normalize edilir
- `formulaParts` icindeki isaret bilgisi uygulanir
- en yeni zamanli kayit tercih edilir
- ayni anda birden fazla ve tutarsiz aday kalirsa kayit `ambiguous` olur ve canli renklendirmeye alinmaz

### 3.3 Trafo modlari

Trafo modlarinda gorunen trafo entity'leri kullanilir.

- `Trafo (MW)`:
  - domain: `trafo`
  - primary metric: `active`
  - request element'leri: `P + Q`
- `Trafo (MVar)`:
  - domain: `trafo`
  - primary metric: `reactive`
  - request element'leri: `P + Q`

Trafo aday cozumleme kurali:

- en yeni zamanli satir secilir
- zaman ayniysa mutlak degeri buyuk olan secilir
- birden fazla aday varsa secilmis olsa bile `sourceAmbiguous=true` korunur

Burada kritik nokta:

- Trafo modunda da sorgu `P + Q` istiyor
- yani tabloda sadece `P` goruluyor olsa bile, eklenti backend'e ayri bir payload ile `Q` istemis olabilir

### 3.4 Gerilim modu

`Gerilim (kV)` modunda:

- domain: `bara`
- primary metric: `voltage`
- request element'leri: yalniz `U`
- gorunen entity evreni: yalniz `154/400 kV` bara node'lari

Gerilim modunda trafo voltage dikkate alinmiyor. Runtime bu fazda sadece `baraNodes.scada.voltage` alanlarini kullaniyor.

## 4. Superset Tablosunda 8000 Kayit Varken Eklenti Neden 1000 Kusur Ham Satir Goruuyor

Bu soruda birbiriyle karisan dort farkli sayac var:

1. Superset tablo rowcount
   Bu, sayfadaki genis dataset sorgusunun sonucu.
   `network.txt` orneginde `7472`.

2. Request edilen olcum ID sayisi
   Bu, eklentinin gorunen entity evreninden uretdigi `measurementIds` sayisi.
   Ekran goruntusundeki `1219 olcum ID` benzeri log buna ait.

3. Normalize edilmis ham satir sayisi
   Donen satirlar `sinsid` bazinda en yeni kayda indirgenir.
   UI'deki `Ham satir kalite: 1171/1171` benzeri metin bu seviyeye aittir.

4. Gorunen entity sayisi
   SCADA kartindaki `Toplam 338` gibi sayi, secili filtre ve secili moda gore canli deger beklenen gorunen entity adedidir.

Bu nedenle su esitlik yanlistir:

- "Superset tablo rowcount" = "haritada gorunen canli hat sayisi"

Dogru yorum su:

- Superset tablo rowcount genis dataset evrenidir
- eklenti ise bunun icinden sadece ihtiyac duydugu `sinsid` alt kumesini ister
- sonra gelen satirlari tekillestirir
- en son sadece gorunen entity'lere ozet yazar

Yani `8000 -> 1000 -> 338` dususu tek bir bug'i gostermiyor; farkli katmanlardaki filtre ve normalize adimlarini gosteriyor.

## 5. Yeni KML V2 Sonrasi Ne Duzeldi

Yeni modelin getirdigi en onemli kazanclar:

- TM eslesmesi: `1583/1583`
- Hat eslesmesi: `2341/2341`
- Trafo -> TM baglama: `3001/3001`
- Bara -> TM baglama: `5960/5960`

SCADA kapsami:

- hat aktif: `2290/2341`
- hat reaktif: `2290/2341`
- trafo aktif: `2314/3001`
- trafo reaktif: `2317/3001`
- `154/400` bara gerilim: `1811/3303`

Bu neyi degistirdi:

- onceki rapordaki "model eski, kapsama dusuk" tespiti artik tek basina ana sorun degil
- onceki rapordaki "visible `sinsid` bazli canli sorguya gecilmeli" onerisi de fiilen uygulandi
- dolayisiyla mevcut darbogaz artik eski KML degil

Yeni ana risk:

- hat tarafinda `2020` adet ambiguous entity var
- trafo tarafinda `9`
- bara tarafinda `10`

Yani yapisal kapsama artik guclu, fakat `SISTEM_ESLEME` tarafindaki cok adayli kayitlar halen buyuk bir kalite maliyeti uretiyor.

## 6. Guncel Audit CSV Ne Soyluyor

Incelenen denetim CSV, secili filtre altinda `338` adet `400 kV` hatlik bir gorunum veriyor.

Dagilim:

- `matched-live`: `138`
- `matched-stale`: `33`
- `missing-source-row`: `162`
- `missing-config-id`: `5`

Bu dagilimdan cikan sonuc:

- mevcut gorunumde baskin problem stale degil, `missing-source-row`
- yani config tarafinda ID var ama kaynak sorguda o ID ile satir bulunamiyor
- ikinci sira problem stale
- config eksigi nispeten az ama kritik, cunku bu kayitlar hic cozulmuyor

Ek bulgu:

- `missing-source-row` satirlarinin `85` adedinde `Ikincil` dolu
- bu, bazi hatlarda birincil metric kaynagi kayipken yardimci metric kaynaginin geldigini gosteriyor
- bu durum raporlama icin faydali, fakat kullanici tarafinda kafa karistirici olabilir

Bu nedenle denetim ekraninda artik su ayrim acikca gosterilmelidir:

- `primary missing / secondary present`
- `primary present / stale`
- `config missing`
- `ambiguous live`

## 7. Onceki Raporun Artik Gecersiz Kalan Kisimlari

Asagidaki oneriler artik tam olarak eski anlamiyla gecerli degil:

- "Canli sorguyu visible `sinsid` bazli hale getir"
  Bu artik yapildi.
- "Ana problem eski `kml_layers.json` kapsami"
  Bu artik ikincil problem seviyesine dustu.
- "Sabit `tear=Golbasi_YTM` filtresi canli sorguyu daraltiyor"
  Kodda default olarak hala duruyor, fakat V2 runtime kendi `chartPayload` body'sini olusturdugu icin aktif canli sorguda asil belirleyici artik bu degil.

Yani `background.js` icinde `Golbasi_YTM` ve `P` default'lari gorunmeye devam etse de, V2 runtime kendi payload'ini yolladiginda bu default'lar fiili sorguyu yonetmiyor.

## 8. Revize Iyilestirme Oncelikleri

### 8.1 Ilk oncelik: sorgu kontratini gozle gorunur yap

Kullanici bugun su soruyu soruyor:

- "Tablo P ise MVar nasil geliyor?"

Bu sorunun nedeni koddan cok gozlemlenebilirlik eksigi.

Oneri:

- SCADA kartina son sorgu kontrati ozetini ekle:
  - mod
  - `elementNames`
  - request edilen `measurementId` sayisi
  - donen `P` satir sayisi
  - donen `Q` satir sayisi
  - donen `U` satir sayisi
  - normalize sonrasi tekil sayi
- `Denetim CSV` ve `Mismatch Raporu` icine ham query contract'i yaz

Beklenen fayda:

- P-only / Q-only / U-missing gibi problemler aninda gorulur
- kullanici Superset tablo query'si ile extension query'sini karistirmaz

### 8.2 Ikinci oncelik: canli mod ve audit modunu ayir

Bugun canli ekran ile denetim mantigi birbirine yakin ama farkli amac tasiyor.

Oneri:

- `Canli mod`: yalniz gorunen `sinsid` listesi ile calissin
- `Audit mod`: istenirse Superset tabloya daha yakin genis query de calistirilsin
- rapor iki farkli sayi yazsin:
  - `kaynak rowcount`
  - `gorunen evren rowcount`

Beklenen fayda:

- `8000 neden 1000 oldu` sorusu teknik olarak acik hale gelir
- operasyon ekibi ile yazilim ekibi ayni sayaclara bakar

### 8.3 Ucuncu oncelik: V2 modeldeki ambiguous kayitlari katmanli sekilde temizle

Yeni KML modeli yapisal olarak guclu ama ambiguous sayisi cok yuksek.

Oneri:

- once gorunen ve operasyonel olarak kritik entity'lerden basla
- `resolvedId` veya override katmani ekle
- `SISTEM_ESLEME_LISTESI` icindeki cok adayli hat/trafo/bara satirlarini adim adim netlestir

Beklenen fayda:

- canli renklendirme kapsami artar
- `ambiguous-live` / `missing-source-row` karmasi azalir

### 8.4 Dorduncu oncelik: primary ve secondary kayiplarini ayri raporla

Mevcut export'ta `missing-source-row` tek bir kategori gibi gorunuyor. Oysa iki farkli durum var:

- primary de yok, secondary de yok
- primary yok ama secondary var

Oneri:

- yeni durum anahtarlari ekle:
  - `missing-primary-secondary-present`
  - `missing-primary-secondary-missing`

Beklenen fayda:

- aktif ve reaktif kaynak problemleri birbirinden ayrisir
- "tablo P-only mi" sorusu daha kolay cevaplanir

### 8.5 Besinci oncelik: stale esiklerini tekrar degerlendir

Mevcut stale esikleri:

- `warn = 90 sn`
- `dead = 180 sn`

Dakikalik aggregate ve intranet cache davranisi dusunulunce bu esikler sert kalabilir.

Oneri:

- `warn = 180-240 sn`
- `dead = 420-600 sn`

ya da

- stale hesabini `fetchCompletedAt` ve dataset bucket toleransi ile yap

Beklenen fayda:

- gereksiz stale alarmi azalir
- operasyonel ekranda daha istikrarli gorunum saglanir

### 8.6 Altinci oncelik: canli pencereyi daralt

Bugun canli sorgu `24 saat` penceresi kullaniyor.

`sinsid IN (...)` daraltmasi yapilmis olsa da, canli ekran icin `24 saat` halen genis bir pencere.

Oneri:

- canli modda `2-6 saat`
- audit modda `24 saat`

Beklenen fayda:

- gereksiz eski satir riski azalir
- stale degerlendirmesi daha saglikli hale gelir

## 9. Uygulanabilir Sonraki Adimlar

Bu rapora gore siradaki en dogru teknik adimlar:

1. Son sorgu kontratini UI ve audit export icinde gorunur yap
2. `P/Q/U` bazli donen satir sayilarini log ve bilgi kartina yaz
3. `missing-source-row` kayitlarini `primary/secondary` bazinda alt kategorilere ayir
4. V2 modelde en cok gorunen ambiguous hat/trafo adaylarini override veya `resolvedId` ile netlestir
5. Canli ve audit sorgusunu ayri modlar haline getir

## Son Hukum

Yeni KML V2 gecisi dogru yonde buyuk bir adim oldu. Yapisal model kapsami artik onceki rapora gore cok daha guclu. Bu nedenle bugunku ana konu "harita modeli eksik" degil.

Bugunku ana konu su:

- kullanici Superset tablosunun gordugu genis dataset ile eklentinin gorunen-evren tabanli canli query'sini ayni sorgu saniyor
- runtime ise artik daha akilli ama daha karmasik bir kontrat kullaniyor
- bu kontrat gorunur olmadigi icin `P`, `Q`, `U`, `rowcount`, `visible total`, `normalized rows` gibi kavramlar birbirine karisiyor

Kisacasi:

- V2 KML modeli tabani toparladi
- siradaki iyilestirme konusu sorgu saydamligi ve cok adayli SCADA eslesme kalitesidir
