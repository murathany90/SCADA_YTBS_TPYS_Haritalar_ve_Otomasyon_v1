# Hat Akis Yonu ve Gosterim Raporu

## Kapsam
Bu rapor mevcut V2 runtime koduna bakilarak hazirlandi. Odak konu:

- hat akis oku yonu nasil belirleniyor
- cizikli cizgi hangi durumlarda ciziliyor
- hatlar haritada, popup'ta ve SCADA panelinde nasil gosteriliyor

Incelenen ana dosyalar:

- `scada-v2-runtime.js`
- `map-modern.js`
- `scada-client.js`
- `map-v2-runtime.js`
- `tests/scada-v2-runtime.test.js`

## 1. Hat akis yonu nasil belirleniyor

### 1.1 Temel ilke
Hat yonu dogrudan `row.value` isaretine bakilarak cizilmiyor. Runtime once ham SCADA degerini hatin `startTm -> endTm` referansina normalize ediyor. Ana formul su:

```text
normalizedValue = rawValue * formulaSign * orientationSign
```

Burada:

- `rawValue`: Superset satirindan gelen ham olcum degeri
- `formulaSign`: `SISTEM_ESLEME_LISTESI.xlsx` tarafindan builder ile modele tasinan `(+1) / (-1)` katsayisi
- `orientationSign`: runtime'in hatin hangi ucundan hangi ucuna baktigina gore buldugu `+1` veya `-1`

Kod referansi:

- `resolveHatMetric()` icinde hesap: `scada-v2-runtime.js:712-779`

### 1.2 Yon cozumleme icin kullanilan veri kaynaklari
Runtime yonu cozerken birden fazla bilgi kaynagi kullanir:

1. Builder tarafindan gelen aday meta alani
   - `sourceSide`
   - `targetSide`
   - `candidateSlot`

2. Formulasyondan parse edilen kodlar
   - `formula.stationCode`
   - `formula.targetCode`

3. Superset satirindan gelen isimler
   - `row.tmName`
   - `row.remoteName`

4. Hatin iki ucu icin olusturulan alias kumeleri
   - `startTmRef.name`
   - `startTmRef.ucteKodu`
   - `startTmRef.psseAdi`
   - aynisi `endTmRef` icin

Kod referanslari:

- aday taraf bilgisi ile cozum: `scada-v2-runtime.js:479-527`
- alias ile cozum: `scada-v2-runtime.js:529-617`
- ana karar zinciri: `scada-v2-runtime.js:712-779`

### 1.3 Oncelik sirasi
Bir aday SCADA satiri icin runtime su sirayla karar veriyor:

1. `formulaOrientation`
   - formuladaki `stationCode/targetCode` alias ile eslesiyorsa once bu kullaniliyor

2. `candidateSideOrientation`
   - builder `sourceSide/start` veya `sourceSide/end` gibi bilgi uretmisse ikinci oncelik bu

3. `rowOrientation`
   - Superset satirindaki `tmName/remoteName` alias ile eslesiyorsa son fallback olarak bu kullaniliyor

Kod:

- `chosenOrientation` secimi: `scada-v2-runtime.js:729-746`

Bu kritik bir nokta: runtime, formulasyondan gelen yon bilgisini satir label'larina gore daha guvenilir kabul ediyor.

### 1.4 Orientation ile nihai akis ayni sey degil
`orientationMatch = forward` demek, kaynak-hedef eslesmesinin `startTm -> endTm` ile uyumlu oldugu anlamina gelir. Ancak nihai akis oku bununla bitmez. `formulaSign` ve ham deger de carpildigi icin son akis tam tersi yone donebilir.

Ornek:

- test: `DAVUTPASA - YILDIZTEPE`
- formula alias `D.PASA -> YILDIZTE`
- `orientationMatch = forward`
- ama `sign = -1`, `rawValue = 120`
- sonuc: `normalizedValue = -120`

Bu durumda haritada ok `reverse` olur.

Kod referansi:

- test ornegi: `tests/scada-v2-runtime.test.js:122-144`
- ok yonu hesaplamasi: `scada-v2-runtime.js:1046-1048`

## 2. Hat yonu icin ornek senaryolar

### 2.1 Cift ucu da net cozulmus temiz kayit
Ornek:

- `DAVUTPASA -> YILDIZTEPE`
- formula station code `D.PASA`
- formula target code `YILDIZTE`
- `sign = +1`
- `raw = 230.85`

Sonuc:

- `orientationMatch = forward`
- `normalizedValue = 230.85`
- ok `startTm -> endTm`

Test referansi:

- `tests/scada-v2-runtime.test.js:106-120`

### 2.2 Formul label ile Superset label catisiyor ama formula kazanıyor
Ornek:

- formula `D.PASA -> YILDIZTE`
- Superset satiri ters gibi gorunuyor: `tmName = YILDIZTE`, `remoteName = DAVUTPAS`
- `sign = -1`
- `raw = 120`

Sonuc:

- yon cozumlemesi `formula-alias`
- `normalizedValue = -120`
- ok ters yone gider

Yani satir isimleri ters/karisik olsa bile runtime formulu daha ustte tutuyor.

Test referansi:

- `tests/scada-v2-runtime.test.js:122-144`

### 2.3 Tek tarafli cozum
Ornek:

- hat: `TEMELLI -> BAYMINA DGKCS`
- formula: `stationCode = TEMELLI`, `targetCode = ANKDG-G1`
- hedef kodu gercek karsi uc TM olmayabilir

Sonuc:

- runtime sadece `source` tarafini taniyip yine yon cikarir
- `directionResolvedBy = formula-alias-single-source`
- `sign = -1`, `raw = 12`
- `normalizedValue = -12`

Test referansi:

- `tests/scada-v2-runtime.test.js:146-170`

### 2.4 Ayni zamanli iki uc olcumu birbirine yakin
Ornek:

- aday 1 normalize edilince `100`
- aday 2 normalize edilince `108`

Eger fark tolerans icindeyse runtime bunlari `tolerance-mean` ile birlestirir.

Sonuc:

- belirsiz sayilmaz
- ortalama deger kullanilir

Kod:

- toleransli ortalama cozum: `scada-v2-runtime.js:689-710`
- test: `tests/scada-v2-runtime.test.js:95-104`

### 2.5 Ayni zamanli iki uc olcumu birbirinden cok farkli
Ornek:

- aday 1 `100`
- aday 2 `140`

Eger fark toleransi asiyorsa ve slot bilgisi yoksa:

- `unresolved = true`
- `unresolvedReason = ambiguous-live`

Kod:

- `scada-v2-runtime.js:816-858`
- test: `tests/scada-v2-runtime.test.js:106-120`

### 2.6 Primary / secondary conflict
Builder ayni hat icin `primary` ve `secondary` aday uretebilir.

Eger:

- iki aday da canli
- degerler birbiriyle uyumsuz
- ama slot bilgisi varsa

runtime primary adayi secer, kaydi tamamen atmaz; fakat warning ile isaretler:

- `resolutionMethod = primary-conflict`
- `candidateConflict = true`
- bazen `backupUsed = true`

Bu durumda hat cizilir ama warning/dashed stil alir.

Kod:

- `scada-v2-runtime.js:833-844`
- test: `tests/scada-v2-runtime.test.js:197-231`

## 3. Ok yonu haritada nasil ciziliyor

### 3.1 lineFlowByLineId olusumu
Hatlarin akisi icin runtime once `entityMetricsByKey` icindeki temiz kayitlardan `lineFlowByLineId` map'i uretiyor.

Buraya sadece su kayitlar girer:

- `primaryValue` sayisal olacak
- `sourceAmbiguous = false`
- `unresolved = false`

Yani:

- `orientation-unknown` girmez
- `ambiguous-live` girmez
- ama `candidateConflict = true` olan warning kayit girebilir

Kod:

- `rebuildLineFlowMap()`: `scada-v2-runtime.js:1028-1070`

### 3.2 Nihai yon
Ok yonu su sekilde belirleniyor:

```text
direction = directionValue >= 0 ? forward : reverse
```

Kod:

- `scada-v2-runtime.js:1046-1048`

Yani okun yonu, normalize edilmis nihai aktif veya reaktif degerin isaretine bakiyor.

### 3.3 Hangi metrige gore ok ciziliyor
Seçili SCADA moda gore:

- `Hat (MW)` modunda primary metric = `active`
- `Hat (MVar)` modunda primary metric = `reactive`

Bu nedenle ayni hat, `Hat (MW)` ile `Hat (MVar)` modunda farkli yone ok gosterebilir.

Kod:

- mod tanimi: `scada-v2-runtime.js:2-7`
- `directionMetric` kaydi: `scada-v2-runtime.js:1001-1003`

### 3.4 Ok cizimi
Oklar SVG `polygon` olarak uretiliyor ve `animateMotion` ile bir path uzerinde akiyor.

- `flow` modu degilse ok cizilmiyor
- `state.filters.showHat = false` ise ok cizilmiyor
- `hatDisplayMode = sade` veya `sade-ayrik` ise oklar tum geometri yerine TM-TM dogrusu uzerinde akar
- `detayli` modda ise gercek KML koordinatlari boyunca akar

Kod:

- `renderFlowLayer()`: `scada-v2-runtime.js:2651-2710`

## 4. Cizikli cizgi neden ciziliyor

Hatlarda cizikli cizgi tek bir anlama gelmiyor. Kodda iki farkli ana sebep var.

### 4.1 Uyarili ama yine de cozulmus kayit
Eger hat `lineFlowByLineId` icine girmisse, yani kullanilabilir bir sonuc uretilmisse, ama:

- `candidateConflict = true`
- veya `backupUsed = true`

ise cizgi:

- yine renklenir
- yine ok alabilir
- ama `stroke-dasharray = 8 5` ile warning olarak cizilir

Kod:

- `map-modern.js:1241-1249`

Anlam:

- veri tamamen atilmadi
- runtime bir adayi kullanarak hatti cizmeye devam etti
- ama kullanilan cozum "temiz / tekil / tam guvenilir" degil

### 4.2 Yon cozulmedi veya canli conflict cozulmedi
Eger kayit:

- `sourceAmbiguous = true`
- veya `unresolved = true`

ise path yine cizilir ama `lineFlowByLineId` icine girmez. Bu durumda:

- ok cizilmez
- renk, mumkunse `loadingPct` varsa threshold renginden gelir
- yoksa stale/uyari rengi gelir
- cizgi dashed olur

Iki alt tip:

1. `orientation-unknown`
   - `stroke-dasharray = 10 6`
   - yani yon hic cozulmedi

2. diger ambiguous/unresolved durumlar
   - `stroke-dasharray = 6 4`
   - yani canli veri var ama tek ve guvenilir bir yone inemedi

Kod:

- `map-modern.js:1252-1260`

### 4.3 Eslesmeyen hat
SCADA modu acik ve hat icin `flow` yoksa:

- `UNMATCHED_HAT_COLOR`
- dusuk opacity
- dashed degil

Kod:

- `map-modern.js:1260-1263`

## 5. Hatlarin haritadaki gosterim mantigi

## 5.1 Geometri modu
Hat geometrisi iki ayri filtreyle sekilleniyor:

### A. `hatDisplayMode`

- `detayli`
  - KML'deki tum koordinatlar cizilir

- `sade`
  - hat, `startTm` ile `endTm` arasinda tek dogru cizgiye indirgenir

- `sade-ayrik`
  - paralel hatlar ayni dogru ustune binmesin diye ofsetlenir

Kod:

- `map-modern.js:1194-1217`

### B. `scadaMapDisplayMode`

- `flow`
  - SCADA renkleri + akis oklar

- `heatmap`
  - SCADA renkleri korunur
  - oklar kapatilir
  - stroke kalinligi biraz daha artar

- `current`
  - hatlar tekrar temel gerilim rengine doner
  - SCADA renk override'i uygulanmaz

Kod:

- `map-modern.js:1232-1267`
- `renderFlowLayer` sadece `flow` modunda calisir: `scada-v2-runtime.js:2656-2657`

## 5.2 Temel renkler
SCADA kapaliyken veya `current` modunda temel hat renkleri:

- `400 kV`: `#dc2626`
- `154 kV`: `var(--line-154-color)`
- `66 kV`: `#7c3aed`
- diger: `#64748b`

Kod:

- `map-modern.js:1`

## 5.3 Yuklenmeye gore renk
SCADA renkleri `loadingPct` uzerinden geliyor.

Esikler:

- `0-30%`: yesil `#22c55e`
- `30-55%`: sari `#eab308`
- `55-65%`: turuncu `#f97316`
- `65-80%`: kirmizi `#ef4444`
- `80-90%`: koyu kirmizi `#dc2626`
- `90%+`: mor `#7c3aed`

Kod:

- `SCADA_CONFIG.LOADING_THRESHOLDS`: `scada-client.js:37-44`
- renk secimi: `scada-client.js:610-615`

## 5.4 Yuklenme yuzdesi nasil hesaplanıyor
Hatlarda yuzde dogrudan sadece MW'den gelmiyor. Kod su mantigi kullaniyor:

- aktif varsa
- reaktif varsa birlikte kok toplam ile yuklenme bulunur
- reaktif yoksa fallback olarak `1` kabul edilir

Yani:

```text
loadingMagnitude = sqrt(MW^2 + MVar^2)
loadingPct = loadingMagnitude / capacityMva * 100
```

Ama `MVar` yoksa gorunumde `-` kalir, sadece hesap icin `1` kullanilir.

Kod:

- `computeLoadingMagnitude()`: `scada-v2-runtime.js:666-687`
- `buildEntityMetricRecord()`: `scada-v2-runtime.js:920-926`

## 5.5 Kalinlik nasil belirleniyor
SCADA modunda hat stroke kalinligi de yuklenme ile artar:

- taban genislik `FLOW_MIN_WIDTH`
- ust sinir `FLOW_MAX_WIDTH`

Kod:

- `getFlowWidth()`: `scada-client.js:617-620`
- render'a uygulanmasi: `map-modern.js:1243`, `scada-v2-runtime.js:1059`

## 5.6 Secili hat vurgusu
Secilen hatin ana rengi degismiyor; ustune glow geliyor.

- light mod: koyu glow
- dark mod: acik glow

Kod:

- class ekleme: `map-modern.js:1272`
- CSS glow: `map-modern.css:639-643`

## 6. Popup ve panelde hat bilgileri nasil gosteriliyor

### 6.1 Hat popup
Popup icinde hat icin kompakt alanlar:

- Uzunluk
- Kapasite
- Aktif Guc (MW)
- Reaktif Guc (MVar)
- Akis Yonu
- Olcum Zamani

Detay alani:

- Hat ID
- YTM
- Hat Kesit
- aktif / reaktif olcum ID
- veri durumu
- yon cozumleme yontemi
- alias eslesme bilgisi
- formula sign
- cozum yontemi

Kod:

- `buildHatPopupModel()`: `scada-v2-runtime.js:1692-1718`

`Akis Yonu` popup'ta su sekilde yaziliyor:

- `directionValue >= 0` ise `startTm -> endTm`
- `directionValue < 0` ise `endTm -> startTm`
- belirsizse `Yon belirsiz` veya `Belirsiz`

Kod:

- `scada-v2-runtime.js:1694-1704`

### 6.2 SCADA paneli
Hat panelinde kolonlar:

- `Hat Adi`
- `km`
- `Zaman`
- `MW`
- `MVAR`
- `%`

Zaman sutununda:

- canli kayit sadece saat/tarih
- gecikmeli veya bayat kayitta ek etiket

Kod:

- basliklar: `scada-v2-runtime.js:2000-2010`
- zaman etiketi: `scada-v2-runtime.js:2032-2038`
- satir render: `scada-v2-runtime.js:2055-2082`

## 7. Cizikli cizgi ile ok birlikte gorunebilir mi

Evet, ama sadece bir durumda:

- kayit cozulmustur
- `candidateConflict` veya `backupUsed` vardir

Bu durumda:

- hat dashed olur
- yine ok cizilir

Cunku bu tip kayitlar `lineFlowByLineId` icine aliniyor.

Hayir, su durumlarda ok olmaz:

- `orientation-unknown`
- `ambiguous-live`

Cunku bu kayitlar `lineFlowByLineId` olusurken dislanir.

Kod:

- ok icin kabul kosulu: `scada-v2-runtime.js:1035-1038`
- dashed warning ama cozulmus hat: `map-modern.js:1246-1249`
- dashed unresolved hat: `map-modern.js:1252-1259`

## 8. Pratik ozet

Hat akis oku icin kisa karar zinciri:

1. Hatin aktif veya reaktif secili metriği bulunur
2. Her aday satir icin formula sign ve orientation hesaplanir
3. Ham deger normalize edilir
4. Tek temiz sonuc varsa o kullanilir
5. Coklu sonuc varsa:
   - tolerans ici ise birlestirilir
   - slot bilgisi varsa primary/secondary warning ile secilir
   - yoksa `ambiguous-live`
6. Son normalize degerin isareti okun yonunu belirler
7. Temiz sonuc varsa ok cizilir
8. Belirsiz sonuc varsa cizgi dashed olur, genelde ok cizilmez

## 9. Sonuc

Mevcut kodda hat akis yonu "sadece Superset satirindaki arti/eksi" ile degil, daha kapsamli bir cozumleme ile uretiliyor:

- formula sign
- builder source/target side
- TM alias eslesmesi
- primary/secondary slot mantigi
- toleransli birlestirme

Bu nedenle okun dogru gorunmesi icin en kritik alanlar:

- builder'in `sourceSide / targetSide / candidateSlot / formulaSign` alanlarini dogru doldurmasi
- TM alias sozlugunun guclu olmasi
- `orientation-unknown` ve `ambiguous-live` kayitlarin false positive olarak ok cizmemesi

Bu rapora gore bug ayiklama yaparken ilk bakilacak debug alanlari sunlar olmalidir:

- `directionResolvedBy`
- `orientationMatch`
- `aliasMatchBasis`
- `formulaSign`
- `resolutionMethod`
- `candidateConflict`
- `backupUsed`

