# SCADA Eslesme Kok Neden Raporu

Tarih: `2026-04-20`

Incelenen kaynaklar:
- [network.md](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/docs/tarama/network.md>)
- [20260420_000120.csv](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/docs/tarama/20260420_000120.csv>)
- [scada_hat_yukleme_2026-04-19 (2).csv](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/docs/tarama/scada_hat_yukleme_2026-04-19%20(2).csv>)

## Kisa Sonuc

`800+` satirlik Superset tablosu ile eklentide gorulen `50-100` eslesmeyi bire bir karsilastirmak dogru degil. Uc farkli evren birbiriyle karisiyor:

1. `852` satirlik Superset veri kumesi `Golbasi_YTM` altindaki tum uygun SCADA olcumlerini getiriyor. Bunlarin buyuk kismi haritadaki `312` gorunur hat evrenine ait degil.
2. `312` sayisi, Orta Anadolu YTM icin haritadaki `154/400 kV` gorunur hat sayisi.
3. Eklentinin CSV ciktilarindaki `56` satir, tum eslesme evreni degil; eklentinin o anki ranking / export kapsamindan uretilmis bir alt kume.

Dogru karsilastirma su:

- `852` ham Superset olcumu
- `553` tanesi mevcut harita hat veri modelinde hicbir hatta baglanmiyor
- `299` adet Orta Anadolu gorunur hat aktif SCADA ID'si Superset CSV icinde mevcut
- `298` adet hat yapisal olarak tekil ve eslesebilir durumda
- eklenti CSV'sine dusen satir: `56`

Yani ana problem, ham kaynak veride toplu bir eslesme kaybi degil. Esas kok nedenler:
- veri evreni farki
- eklenti export kapsam farki
- eklentinin Superset'e ayni sorguyu atmiyor olmasi
- daha kucuk bir ikinci katman olarak da eksik / duplicate SCADA ID sorunlari

## Sayisal Bulgular

### 1. Superset `network` sorgusu

`network.md` icindeki sorgu:
- zaman araligi: son `24 saat`
- filtre: `elementName = 'P'`
- filtre: `b2Name IN ('400', '380', '420', '154')`
- filtre: `tear IN ('Golbasi_YTM')`
- donen satir sayisi: `852`

Bu `852` satirin hepsi hat degil; ayni operasyonel bolgedeki tum uygun aktif guc olcumleri.

### 2. Grid CSV dagilimi

`20260420_000120.csv` icinde:
- toplam satir: `852`
- tekil `sinsid`: `852`
- gerilim dagilimi:
  - `154`: `736`
  - `380`: `88`
  - `400`: `28`

### 3. Haritadaki Orta Anadolu gorunur hat evreni

Mevcut `data/kml_layers.json` ile:
- Orta Anadolu YTM + `154/400 kV` gorunur hat sayisi: `312`
- bunun `259` adedi `154 kV`
- bunun `53` adedi `400 kV`

### 4. Superset CSV -> harita hat eslesmesi

`20260420_000120.csv` verisini `olcumNoktasiIdAktif` ile harita hatlarina caprazlayinca:

- `852` kaydin
  - `298` tanesi tekil olarak bir hatta baglaniyor
  - `1` adet `sinsid` duplicate kullanimda
  - `553` tanesi haritadaki hicbir hatta baglanmiyor

Bu su anlama geliyor:
- `852` sayisi, `312` hat evreninin dogal ust siniri degil
- kaynak veri, haritadaki hat evreninden cok daha genis

### 5. Orta Anadolu gorunur hatlar icin net durum

`312` gorunur hat icin:
- `5` hatta aktif SCADA ID yok
- `306` tekil aktif SCADA ID referansi var
- bu `306` aktif ID'nin `299` tanesi grid CSV icinde mevcut
- `1` duplicate SCADA ID iki hatta paylasiliyor
- net tekil eslesebilir gorunur hat sayisi: `298`

Yani yapisal eslesme bazinda beklenen sayi `50-100` degil, `298` civari.

### 6. Eklenti export CSV gercegi

`scada_hat_yukleme_2026-04-19 (2).csv` icinde:
- veri satiri: `56`
- tum `56` SCADA ID, `20260420_000120.csv` icinde mevcut
- bu `56` satirin hicbiri kaynak CSV disinda degil
- tum satirlar Orta Anadolu ile ilgili hatlara ait

Bu nedenle bu dosya:
- "tum eslesen hatlar listesi" degil
- kaynak veride yalnizca `56` eslesme oldugunu gostermiyor
- eklentinin o anki export / ranking kapsamini gosteriyor

## Kok Nedenler

### Kok Neden 1: Veri evreni farkli

Superset `network` sorgusu `Golbasi_YTM` altindaki tum uygun aktif guc olcumlerini getiriyor. Harita ise yalnizca belirli bir hat evrenini ciziyor.

Somut kanit:
- `852` kaydin `553` tanesi mevcut harita hat modeliyle hic eslesmiyor
- yani kaynak veri kumesi, haritadaki hat listesinden cok daha genis

Ornek kayitlar:
- `TEMELLI -> YUNUSEMR` `380 kV`
- `ANKARA-2 -> TEMELLI` `400 kV`
- `GOLBASI -> SINCAN-1` `400 kV`
- `POLATCMT -> TEMELLI` `154 kV`
- `K.PINARG -> Plnt_avP` `380 kV`

Bu tip kayitlar, haritadaki mevcut hat modelinde bire bir karsilik bulmuyor.

### Kok Neden 2: Eklenti, Superset sayfasiyla ayni sorguyu atmiyor

Mevcut kodda arka plan tasima katmani Superset'e kaydedilmis chart sorgusunu bire bir tekrar kullanmiyor.

Kod tarafinda:
- [background.js](</C:/yazilim_projeler/tpys-reaktif-eslestirme-extension-v7/background.js:400>) `POST body` icinde ozel bir `buildChartPayload()` kuruyor
- bu payload son `60 dakika` zaman araligini kullaniyor
- `tear` ve `b2Name` filtrelerini acik sekilde tasimiyor
- buna karsilik `network.md` icindeki Superset sorgusu son `24 saat` + `Golbasi_YTM` + `b2Name` filtreleriyle calisiyor

Bu nedenle kullanicinin Superset ekraninda gordugu tablo ile eklentinin fetch ettigi veri kontrati ayni degil.

Bu, sayisal fark uretir ve audit yapmayi zorlastirir.

### Kok Neden 3: Eklenti CSV'si tum eslesme raporu degil

`scada_hat_yukleme_2026-04-19 (2).csv` dosyasi, ham eslesme denetim CSV'si degil; ranking/export akisindan uretilen alt kume.

Kaniti:
- dosyada sadece `56` satir var
- ama ayni zaman dilimindeki grid CSV icinde bunlarin tamami mevcut
- dolayisiyla problem "kaynakta yalnizca 56 veri var" problemi degil

Bu export dosyasi, audit karsilastirmasi icin uygun format degil.

### Kok Neden 4: Harita veri modelinde eksik ve problemli SCADA ID'ler var

Orta Anadolu gorunur `312` hat icinde:
- `5` hatta `olcumNoktasiIdAktif` bos
- `7` hatta tanimli SCADA ID kaynak CSV'de hic gelmiyor
- `1` SCADA ID iki farkli hatta paylasiliyor

Problemli ornekler:

Aktif ID'si bos hatlar:
- `400kV SEYDISEHIR (YENI) -> EREGLI - ADANA EIH`
- `400kV KARATAY -> MERSIN380 - AKKUYU NGS GIS EIH`
- `154kV UMITKOY -> ALCI OSB MOBIL - TEMELLI EIH`
- `154kV TEMELLI -> ALCI OSB MOBIL - UMITKOY EIH`
- `400kV ADANA -> EREGLI - SEYDISEHIR EIH`

Kaynak CSV'de bulunmayan aktif ID'ler:
- `154kV DDY CAYIRBASI - ADATOPRAKPINAR EIH`
- `154kV KOCAHACILI - ADATOPRAKPINAR EIH`
- `154kV DDY CAYIRBASI - ALTINOVA EIH`
- `154kV AYRANCI GECICI -> EREGLI - KARAMAN BES EIH`
- `154kV BEYLIKKOPRU - DDY SAZAK EIH`
- `154kV BEYLIKKOPRU - DDY BEYLIKKOPRU EIH`
- `154kV ALCI OSB MOBIL -> UMITKOY - TEMELLI EIH`

Duplicate aktif ID:
- `a95265e7-80a2-43c1-b730-136b67d3aa6f`
- bagli oldugu hatlar:
  - `400kV YESILHISAR - ATATURK - KUZEY EIH`
  - `400kV YESILHISAR - ATATURK - GUNEY EIH`

Bu problemler gercek eslesme kaybi yaratiyor ama boyutu `50-100` seviyesinde degil; toplam kayip `14` hat mertebesinde.

### Kok Neden 5: Sorgu semantigi anlik deger degil

Superset sorgusu `max(__time)` ile birlikte `AVG(maxValue)` kullaniyor.

Bu, satirdaki zaman ile MW degerinin ayni orijinal olcum anina ait olmayabilecegi anlamina gelir. Bu eslesme sayisini direkt dusurmez ama:
- yuklenme siralamasi
- stale karari
- audit karsilastirmasi

icin ek belirsizlik yaratir.

## Neden `852 -> 312 -> 56` oluyor?

En dogru aciklama zinciri su:

1. `852`
   Superset ham olcum satiri.

2. `312`
   Haritadaki Orta Anadolu `154/400 kV` gorunur hat sayisi.

3. `298`
   Bu `312` hattan yapisal olarak eslesebilen tekil hat sayisi.

4. `56`
   Eklentinin export ettigi alt kume. Bu, tum yapisal eslesmeleri temsil etmiyor.

Dolayisiyla "852 veri var ama sadece 56 eslesiyor" cikarimi teknik olarak yanlis. Dogru ifade:

- `852` ham veri icinde Orta Anadolu gorunur hatlar icin kullanilabilir tekil eslesme kapasitesi `298`
- eklenti exportu ise bu `298`'in tamamini degil, kendi export kapsamindaki `56` satiri veriyor

## Cozum Onerileri

### 1. Audit modu ile ranking exportunu ayirin

Mevcut export dosyasi ranking/export akisindan geliyor. Buna ek olarak ikinci bir export uretilmeli:

- `scada_eslesme_denetim.csv`

Alanlar:
- `hatId`
- `hatAdi`
- `ytm`
- `kv`
- `olcumNoktasiIdAktif`
- `kaynaktaVarMi`
- `eslesmeDurumu`
- `engelNedeni`
- `duplicateGroup`
- `sonVeriZamani`
- `aktifGucMw`

Boylece kullanici ranking listesini degil, gercek eslesme denetim sonucunu indirebilir.

### 2. Eklenti fetch kontratini Superset ekrani ile bire bir ayni yapin

Audit amacli modda:
- `24 saat` pencere
- `tear = Golbasi_YTM`
- `b2Name IN (400, 380, 420, 154)`
- kaydedilmis chart filtreleri

bire bir tasinmali.

Pratik secenekler:
- Superset'in kaydettigi chart form_data'sini oldugu gibi kullanmak
- ya da eklenti tarafinda explicit `adhoc_filters` kurmak

Eklenti ile Superset sayfasi ayni veri kontratini kullanmadikca sayi karsilastirmasi guvenilir olmaz.

### 3. Sayaclari katman katman gosterin

SCADA kartinda ve log panelinde su sayilar ayri gosterilmeli:
- ham kaynak satiri
- haritadaki herhangi bir hatta baglanan satir
- secili gorunur hat evrenine baglanan satir
- tekil eslesme
- duplicate nedeniyle dislanan
- aktif ID'si olmayan
- kaynakta bulunmayan aktif ID

Boylece kullanici `852` ile `56` arasindaki farkin nerede eridigini ekrandan gorebilir.

### 4. Harita veri modelindeki eksik ID'leri temizleyin

Oncelikli duzeltme listesi:
- aktif ID'si bos `5` hat
- kaynakta hic gelmeyen `7` aktif ID
- `YESILHISAR - ATATURK` ciftindeki duplicate aktif ID

Bu duzeltmeler yapisal kaybi `14` hat seviyesinden daha da asagi indirir.

### 5. "Tam eslesme" ve "export kapsami" ayrimini UI'de acik yazin

Ranking paneli veya CSV indirme butonunda metin net olmali:
- `Bu dosya tum eslesmeler degil, mevcut ranking/export kapsamidir.`

Ayrica ikinci buton:
- `Eslesme denetim CSV indir`

eklendiginde kullanici yanlis karsilastirma yapmaz.

### 6. MW degeri icin zaman uyumlu sorgu tasarlayin

Mumkunse:
- en son timestamp satirinin degeri alinmali
- `MAX(__time)` + `AVG(maxValue)` kombinasyonu audit modunda kullanilmamali

Bu iyilestirme eslesme sayisindan cok veri dogrulugunu iyilestirir.

## Karar

Kullaniciya gorunen ana problem "mapping tamamen bozuk" problemi degil.

Asil problem:
- ayni sayi tabani karsilastirilmiyor
- eklenti exportu audit raporu saniliyor
- eklenti Superset'le ayni sorguyu calistirmiyor

Bu uc baslik duzeltilirse beklenen tablo su olur:
- ham Superset veri sayisi yuksek kalir
- ama audit ekraninda bunun ne kadarinin harita hatlarina baglandigi net gorulur
- Orta Anadolu `312` hat icin gercek beklenen eslesme sayisi `~298` seviyesine oturur
- kalan fark ise kucuk ve aksiyon alinabilir veri kalitesi listesidir
