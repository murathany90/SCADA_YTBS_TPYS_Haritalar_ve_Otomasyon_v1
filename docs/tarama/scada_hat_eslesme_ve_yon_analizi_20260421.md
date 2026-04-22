# SCADA Hat Eslesme ve Yon Analizi

## Kapsam
Bu rapor su kaynaklar birlikte incelenerek hazirlandi:

- `C:\Users\Murathan YENİCELİ\Downloads\scada_eslesme_denetim_2026-04-21.csv`
- eklenti icindeki `SCADA Mismatch Raporu` ekran goruntusu
- referans alinan YTBS/TPYS MW ok akisi harita goruntusu
- runtime kodu:
  - `scada-v2-runtime.js`
  - `map-modern.js`
  - `build_kml_layers_v2.py`
  - `map-modern.css`
  - `data/kml_layers_v2.json`

Bu raporun hedefi sunlari aciklamaktir:

- hat eslesmesi neden hala `eslesmeyen` veya `belirsiz` kalabiliyor
- yon neden `orientation-unknown` olarak dusuyor
- `ambiguous-warning` ne anlama geliyor
- `stale` veriler neden listede kullanicinin bekledigi kadar gorunur degil
- YTBS referans ok akisi ile eklenti davranisi arasindaki fark nedir
- eslesme ve akis yonu nasil iyilestirilmelidir

## 1. Ozet Sonuc

### 1.1 CSV bazli gercek durum
Incelenen denetim CSV'sinde `338` gorunen hat icin dagilim su:

- `201 matched-live`
- `106 matched-stale`
- `16 orientation-unknown`
- `7 missing-source-row`
- `5 missing-config-id`
- `3 ambiguous-warning`

Toplam acik nokta sayisi dusuk gorunse de, yon belirsizligi tarafinda cok net ve sistematik bir desen var:

- tum `16 orientation-unknown` kaydinin ortak imzasi ayni
- hepsi `Candidate Slot = secondary`
- hepsi `Terminal Side = end`
- hepsi `Formula Sign Applied = +1`
- hepsi `Polarization Consistent = no`
- hepsi `Resolution Method = polarization-mismatch`

Bu, problemin rastgele alias eslesmesi hatasi olmadigini; builder/runtime'in bugun kullandigi **"end uc olcumu ise sign mutlaka -1 olmali"** varsayimindan kaynaklandigini gosteriyor.

### 1.2 En kritik bulgu
Bugunku runtime modeli, terminal tarafi `end` oldugunda `polarizationSign = -1` uretiyor ve `formulaSign != -1` ise kaydi `polarization-mismatch` sayip disliyor.

Ancak eslesme tablosundaki fiili veri buna her zaman uymuyor. Orneklerde:

- `(+1) SIRRIN, 380, ATATURK, P`
- `(+1) HILVAN-Y, 380, ATATURK, P`
- `(+1) ANDIRIN, 380, ERZIN, P`

gibi satirlar var. Bunlar `end` tarafina bagli olcumlerdir ama formul `+1` ile geliyor. Uygulama bunlari bugun tutarsiz sayiyor. Oysa kullanicinin tarif ettigi isletme mantiginda asil anlam sunun uzerinden kurulmalidir:

- SCADA degeri `+` ise olcumun bagli oldugu TM/Bara'dan cikis
- SCADA degeri `-` ise olcumun bagli oldugu TM/Bara'ya giris

Yani `end` tarafinda duran bir olcum `+` ise, bu fiziksel olarak `end -> start` akis demektir. Bu durumda kaydi reddetmek yerine ters yone normalize etmek gerekir.

Sonuc: bugunku `orientation-unknown` kayitlarin buyuk kismi aslinda **cozulebilir** durumdadir.

## 2. Mismatch Raporundaki Durumlarin Anlami

### 2.1 `orientation-unknown`
Bu durum bugunku kodda yalniz "hangi uca ait oldugu bilinmiyor" anlamina gelmiyor. Asagidaki durumlar da ayni sepete dusuyor:

- `source-side-unknown`
- `polarization-mismatch`
- klasik alias tabanli `orientation-unknown`

Kod tarafi:

- `scada-v2-runtime.js` icinde `resolveHatMetric()` terminal metadata varsa once bunu kullaniyor
- terminal tarafi cozulmus olsa bile `polarizationConsistent === false` ise kayit `polarization-mismatch` oluyor
- audit raporu bunu `orientation-unknown` ailesine katiyor

Bu nedenle mismatch ekranindaki:

> `orientation-unknown | Terminal tarafi bulundu ancak formul polarizasyonu ile uyusmadi.`

mesaji gercekte su anlama geliyor:

- sistem olcumun hangi uca ait oldugunu buldu
- ama builder/runtime kurali bu formul sign'ini o ucla uyumsuz saydi
- bu yuzden akis oku cizilmedi

### 2.2 `ambiguous-warning`
Bu durum genelde iki farkli fiziksel aday degil, bazen **ayni measurement ID'nin iki farkli formul satiri ile modele iki kez yazilmasi** yuzunden olusuyor.

Ornek:

- `400kV BURSA DGKÇ - BURSA SANAYİ EİH`
- ayni `measurementId = 5c4baca9-09ab-4c57-9133-bc96a7109064`
- modelde biri `(+1)` biri `(-1)` olacak sekilde iki kez bulunuyor

Sonuc:

- runtime ayni kaynak satiri iki farkli polariteyle normalize etmeye calisiyor
- iki sonuc farkli deger veriyor
- kayit `primary-conflict / candidate-conflict` olarak isaretleniyor

Bu problem "canli kaynakta iki olcum var" probleminden cok, **config satirinin cift yazilmasi / ayni ID'nin iki uc adayina dagitilmasi** problemidir.

### 2.3 `missing-source-row`
Bu durum, modelde SCADA ID tanimli olmasina ragmen sorgudan o `sinsid` icin kullanilabilir kaynak satiri gelmedigi anlamina gelir.

Ornekler:

- `400kV BURSA DGKÇ - BANDIRMA DGKÇ EİH`
- `400kV ÇOBANBEYLİ - ELBİSTAN B TES - IV EİH`
- `400kV GÖYNÜK -> ADAPAZARI - AKSA GÖYNÜK TES EİH`

Bunun ana nedenleri:

- ilgili `sinsid` son 24 saatlik Superset sonucunda hic donmemis olabilir
- ilgili satir farkli `elementName` veya farkli isim yapisinda geliyor olabilir
- iki adayli hatta sadece elenen / secilemeyen aday gorunmus olabilir

Not:

- `400kV HATAY - ATLAS TES EİH` gibi bazi satirlarda `Kaynak Zaman` dolu olmasina ragmen durum `missing-source-row` gorunuyor
- bu, audit CSV'nin secilemeyen adaya ait parcali bilgi tasidigi bir kose durumuna isaret ediyor
- raporlamada "gorunen parcali aday var ama secilebilir aday yok" ile "hic kaynak yok" ayrimi ayrica acilmalidir

### 2.4 `missing-config-id`
Bu durum modelde ilgili hat icin SCADA olcum ID'si tanimli olmadigini gosterir.

CSV'de gorunen 5 kayit daha cok yeni veya farkli naming evreninden gelen hatlar:

- `400kV ÇETİN HES -> CİZRE - SİLOPİ TES EİH`
- `400kV SEYDİŞEHİR (YENİ) -> EREĞLİ - ADANA EİH`
- `400kV MERSİN380 -> KARATAY - AKKUYU NGS GİS EİH`
- `400kV KARATAY -> MERSİN380 - AKKUYU NGS GİS EİH`
- `400kV AKKUYU NGS GİS -> MERSİN380 - KARATAY EİH`

Bu grup runtime problemi degil, builder/model kapsami problemidir.

## 3. Ornek Problemli Kayitlarin Teknik Aciklamasi

### 3.1 `400kV ATATÜRK HES - SIRRIN EİH`
Modelde iki aktif guc adayi var:

- primary:
  - `measurementId = 9c0217fe-053a-4f04-ab35-f1e0e063978b`
  - `formulaRaw = (+1) ATATURK, 380, SIRRIN, P`
  - `terminalSide = start`
  - `polarizationConsistent = true`
- secondary:
  - `measurementId = 75e865e9-940a-4a8e-bdab-24330769cd5b`
  - `formulaRaw = (+1) SIRRIN, 380, ATATURK, P`
  - `terminalSide = end`
  - `polarizationConsistent = false`

CSV'de secilen problemli kayit secondary olandir. Bu su anlama gelir:

- primary/start tarafli olcum bu snapshot'ta yok veya secilemedi
- sadece end/SIRRIN terminalinden olcum geldi
- runtime bu kaydi yalnizca `+1` oldugu icin reddetti

Aslinda fiziksel yorumla bu satir cozulmelidir:

- olcum terminali `SIRRIN`
- deger `+` ise akim/guc `SIRRIN`den cikiyor
- hat referansi `ATATÜRK -> SIRRIN` ise bu akis `end -> start` olur
- yani normalize edilmis yon hesaplanabilir

### 3.2 `400kV ATATÜRK HES - HİLVAN EİH`
Ayni desen tekrar ediyor:

- primary/start formula: tutarli
- secondary/end formula: `(+1) HILVAN-Y, 380, ATATURK, P`
- runtime bunu `end + (+1)` oldugu icin mismatch sayiyor

Bu da cozulmesi gereken bir `reverse terminal measurement` senaryosudur; alias problemi degildir.

### 3.3 `400kV ERZİN - ANDIRIN EİH`
Bu hatta da iki aday var:

- start tarafli `ERZIN -> ANDIRINZ`
- end tarafli `ANDIRIN -> ERZIN`

CSV'de problemli secilen aday secondary/end tarafli olandir ve yine `(+1)` sign ile geldigi icin mismatch olmustur.

Buradan cikan net sonuc:

- `orientation-unknown` 16 kaydin tamami terminal tarafi bulunmus kayitlar
- ama hepsi **end terminal + formula +1** desenine takiliyor

## 4. Bayat Veri Neden Var ve Neden Listede Kullaniciya Zayif Gorunuyor

### 4.1 Kodun stale kurali
Kod stale durumunu gercek zamanli olarak browser saatine gore hesapliyor:

- `> 90 sn` ise `warn`
- `> 180 sn` ise `dead`

Kod:

- `scada-v2-runtime.js`
- `getStaleState(timestamp)`

Bu nedenle ayni veri export aninda `live`, 3-5 dakika sonra ekranda `stale` olabilir.

### 4.2 Neden mismatch ekraninda stale patliyor
Mismatch modal o anki `Date.now()` ile yeniden siniflandirdigi icin:

- otomatik yenileme durursa
- tab arka planda kalirsa
- fetch gecikirse

bir once `live` olan cok sayida kayit hizla `stale` olur.

Bu nedenle ekran goruntusundeki:

- `2 / 308` gibi cok yuksek stale dagilimlari

ile CSV exportundaki:

- `201 live / 106 stale`

birbiriyle tam ayni olmayabilir. Sebep veri degil, **zaman duyarliligi** ve export zamani ile ekranin bakildigi an arasindaki farktir.

### 4.3 Neden listede stale zaman etiketi gozden kaciyor
Kod stale etiketi uretiyor:

- `renderPanelTimeCell(row)`
- zamanin yanina `· Gecikmeli` veya `· Bayat (yas)` ekliyor

Ancak CSS tarafinda zaman kolonu cok dar:

- `.ranking-table .col-ts { width: 98px; font-size: 10px; }`
- hucrelerde `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`

Sonuc:

- etiket DOM'da var
- ama `98px` genislik ve tek satir zorlamasi yuzunden son kisim kirpiliyor
- kullanici genelde sadece saat kismini goruyor

Yani burada temel sorun stale verinin yok olmasi degil; **etiketin gosterim alanina sigmamasi**.

### 4.4 Bir baska UX sebebi
Liste varsayilan olarak skor/yuzdeye gore siralaniyor ve sayfalaniyor. Bu yuzden:

- stale kayitlar her zaman ilk sayfada gelmeyebilir
- ilk 50 satir daha cok live kayitlardan olusabilir

Bu da "stale listede yok" algisini guclendiriyor.

## 5. YTBS Referans Haritasi ile Eklenti MW Akisinin Karsilastirmasi

## 5.1 YTBS referans goruntusunde ne goruluyor
Ekteki YTBS haritasinda:

- oklar neredeyse tum hatlarda var
- renkler canli SCADA threshold rengi degil, daha cok sabit referans/temel gosterim gibi duruyor
- ok yogunlugu, eklentinin o anda akabildigi canli hat sayisindan daha yuksek

Bu goruntu, YTBS tarafinda akisin muhtemelen su mantiklardan biriyle gosterildigini dusunduruyor:

1. tum hatlar icin onceden tanimli `baslangic -> bitis` referans yonu ciziliyor
2. SCADA olcum yoksa bile topology/reference direction korunuyor
3. SCADA varsa bu referans uzerinde dogrulama yapiliyor

## 5.2 Eklenti bugun ne yapiyor
Eklenti yalnizca su kayitlar icin ok ciziyor:

- `primaryValue` sayisal olmali
- kayit `sourceAmbiguous`, `unresolved`, `candidateConflict`, `backupUsed`, `uncertaintyReason` tasimamali

Kod:

- `scada-v2-runtime.js`
- `rebuildLineFlowMap()`

Yani eklenti tarafinda ok:

- tum sebeke yonu degil
- yalnizca cozulmus ve guvenilen SCADA akisi

Bu nedenle YTBS ile extension goruntusu bire bir ayni olmaz. Farkin ana nedenleri:

- `orientation-unknown` olan hatlarda extension ok cizmiyor
- `ambiguous-warning` olan hatlarda extension ok cizmiyor
- `missing-source-row` olan hatlarda extension ok cizmiyor
- YTBS muhtemelen bu hatlarda da referans yonu gostermeye devam ediyor

## 5.3 Bu iki harita niye farkli gorunuyor
Kisa cevap:

- YTBS referansi daha cok `network/reference direction`
- eklenti ise daha cok `live SCADA-confirmed direction`

Bu iki kavram bugun uygulamada tek gosterim katmaninda birlesmis durumda. Bu da kullanicida:

- "YTBS'de ok var, eklentide niye yok?"
- "YTBS'deki yone gore dogru ama eklenti ters/eksik gosteriyor"

sorularini doguruyor.

## 6. Eslesme ve Yon Neden Hala Belirsiz Kaliyor

## 6.1 Bugun yon mantigi fazla katı
Bugunku builder su kuralı dayatiyor:

- `start => polarizationSign = +1`
- `end => polarizationSign = -1`
- `formulaSign` bununla ayni degilse `polarizationConsistent = false`

Bu mantik:

- `end` ucunda `(+1)` ile gelen olcumleri otomatik disliyor
- halbuki bunlar fiziksel olarak "end terminalinden cikis" anlaminda cozulmesi gereken gecerli olcumler olabilir

## 6.2 `orientation-unknown` bugun gercekte "cozulemeyen" degil, "kurala uymayan"
CSV kaniti:

- 16 kaydin 16'si de `secondary`
- 16 kaydin 16'si de `end`
- 16 kaydin 16'si de `Formula Sign Applied = +1`
- 16 kaydin 16'si de `Polarization Consistent = no`

Bu kadar temiz bir desen, sistematik mantik sorunu oldugunu gosterir.

## 6.3 `ambiguous-warning` bugun daha cok config ciftlenmesi sorunu
Ozellikle ayni `measurementId`'nin:

- hem `(+1)` hem `(-1)` formul satiriyla
- iki aday gibi modele yazilmasi

warning olusturuyor. Bu durumda sorun canli verinin kararsiz olmasindan cok, config satirlarinin builder'a nasil aktarıldigidir.

## 6.4 `missing-source-row` tamamen runtime sorunu degil
Bu grupta 3 alt durum var:

1. gercekten 24 saatlik sorguda satir yok
2. satir var ama secilebilir aday degil
3. iki adayli hatta dogru uc kaynagi yok

Bu nedenle `missing-source-row` alt kirilimlara bolunmelidir:

- `source-absent`
- `primary-absent-secondary-absent`
- `primary-absent-secondary-present`
- `partial-source-unusable`

## 7. Iyilestirme Onerileri

## 7.1 Yon cozumunu "terminalden cikis/giris" modeline tasi
Mevcut kural:

- `formulaSign == expectedSignByTerminalSide`

yerine su kural kullanilmalidir:

1. once olcumun hangi uca ait oldugu bulunur: `terminalSide = start/end`
2. ham degerin isareti bu uc acisindan yorumlanir:
   - `+` => olculen terminalden cikis
   - `-` => olculen terminale giris
3. sonra hat referansi `start -> end` eksenine normalize edilir:
   - `terminalSide = start` ve `raw > 0` => `start -> end`
   - `terminalSide = start` ve `raw < 0` => `end -> start`
   - `terminalSide = end` ve `raw > 0` => `end -> start`
   - `terminalSide = end` ve `raw < 0` => `start -> end`

Bu modelde `end + (+1)` satiri otomatik mismatch olmaz; ters yone normalize edilmis gecerli akisa donusebilir.

## 7.2 `formulaSign` alanini terminal dogrulama degil, cihaz/formul inversion alanı olarak kullan
Formuldeki `+1 / -1` bazi satirlarda terminal referansini degil, cihaz/formul yonunu de tasiyor olabilir. Bu nedenle:

- `formulaSign` dogrudan `start/end consistency gate` olmamali
- once tam formula yonu (`station -> target`) parse edilmeli
- sonra `terminalSide` ile birlestirilerek `orientationTransform` uretmeli

Onerilen yeni alanlar:

- `formulaDirection = station-to-target | target-to-station | unknown`
- `terminalFlowConvention = export-positive | import-positive`
- `networkDirectionSign = +1 / -1`
- `normalizedSignRule = terminal-exit-model`

## 7.3 Ayni `measurementId` tekrarlarini builder seviyesinde dedupe et
Ozellikle:

- ayni `measurementId`
- ayni `metric`
- ayni hat

icin iki zıt formul varsa builder bunlari iki aday olarak birakmamali.

Onerilen kurallar:

- ayni ID ayni hatta tekrar ediyorsa once grupla
- formul kombinasyonlarini karsilastir
- eger fark yalniz polarite ise bunu `single-id-dual-formula` olarak validation raporuna yaz
- runtime'a iki aday diye gonderme

Bu duzeltme `ambiguous-warning` grubunu belirgin sekilde azaltir.

## 7.4 YTBS referans yonunu ayri katman olarak tut
Kullanici referans olarak YTBS MW ok haritasini dogru kabul ediyorsa, uygulamada iki yon kavrami ayrilmalidir:

- `referenceDirection`
  - hat listesindeki `baslangic -> bitis`
  - YTBS topology referansi
- `liveScadaDirection`
  - terminal olcumu + ham isaret ile hesaplanan anlik yon

Harita davranisi:

- SCADA yoksa veya belirsizse ince gri referans ok kalabilir
- canli SCADA cozulurse bunun uzerine renkli/anlik ok cizilir
- referans ile canli akis tersse popup'ta `Referans yone gore ters akis` bilgisi verilir

Bu, YTBS ile eklenti arasindaki algi farkini ciddi bicimde azaltir.

## 7.5 Stale etiketi UI'da gercekten gorunur hale getirilmeli
Mevcut render mantigi dogru ama sunum zayif. Su degisiklikler gerekir:

- zaman kolonu `98px` yerine en az `140-150px`
- stale etiketi ikinci satira dusmeli
- `Bayat` ve `Gecikmeli` icin ayri status chip kullanilmali
- panelde `Tum / Canli / Gecikmeli / Bayat / Belirsiz` filtreleri eklenmeli

Boylece stale veri "yok" degil, kullanici tarafinda net gorunur olur.

## 7.6 Audit CSV daha iyi kirilmali
Mevcut `orientation-unknown` fazla genis bir sepet. Asagidaki ayrim netlestirilmelidir:

- `terminal-side-known-formula-conflict`
- `terminal-side-unknown`
- `primary-missing-secondary-present`
- `same-id-dual-formula-conflict`
- `source-absent`

Bu ayrim olmadan operasyonel kok neden zor okunuyor.

## 8. Sonuc

Bu incelemenin ana sonucu su:

- hat eslesmesi genel olarak zayif degil
- asil acik nokta, `end` terminalinden gelen `(+1)` formul satirlarinin bugunku kuralla otomatik `polarization-mismatch` sayilmasidir

Yani problem daha cok:

- eksik alias
- eksik KML
- eksik start/end bilgisi

degil; daha cok:

- **terminal-polarizasyon kuralinin fazla katı yorumlanmasi**
- **ayni measurement ID'nin iki kez modele yazilmasi**
- **stale durumunun UI'da yeterince okunakli sunulamamasi**

En hizli kazanimi getirecek adimlar:

1. `end + (+1)` satirlarini otomatik reddetmeyen yeni yon normalizasyonu
2. ayni `measurementId` tekrarlarini builder'da dedupe etme
3. YTBS referans yonunu ayri bir taban katman olarak gostermek
4. stale etiketini panelde iki satirli ve filtrelenebilir hale getirmek

Bu dort adim birlikte uygulanirsa:

- `orientation-unknown` grubunun buyuk bolumu cozulur
- `ambiguous-warning` sayisi azalir
- YTBS referans haritasi ile eklenti davranisi birbirine daha yakin hale gelir
- kullanici stale/belirsiz veriyi net gorebilir
