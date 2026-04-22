# SCADA Eslesme Runtime Iyilestirme Raporu - 2026-04-20

## Ozet

Bu calisma, dusuk gorunen hat eslesme sayisinin ana nedeninin kaynak model eksikligi degil runtime yon ve aday cozumleme mantigi oldugunu teyit etti.

- ChatGPT denetim raporu / eslesme tablolarinda KML hat eslesmesi `2341/2341`, en az bir P/Q olcumu olan hat sayisi `2291/2341`.
- Mevcut `data/kml_layers_v2.json` hat tarafinda ayni kapsami tasiyor: `hatActive=2290`, `hatReactive=2290`, en az bir P/Q olcumu olan hat `2291`.
- Eklenti audit CSV'sinde `312` gorunen hat icin dagilim: `242 matched-live`, `21 matched-stale`, `37 orientation-unknown`, `7 ambiguous-live`, `4 missing-config-id`, `1 missing-source-row`.
- Bu nedenle 312 hattan 242 canli eslesme sonucu, KML/Excel eslestirme eksiginden cok, Superset satirinin hat yonune normalize edilememesinden kaynaklaniyor.

## Kaynak Sayilari

### ChatGPT Eslesme Tablosu

`eslesme_tablolari.xlsx` icindeki ozet:

| Sayfa | Satir | Tekil entity |
| --- | ---: | ---: |
| Hat Eslesme Tablosu | 4580 | 2291 hat |
| Trafo Eslesme Tablosu | 5545 | 2767 trafo |
| Gerilim Eslesme Tablosu | 2115 | 2108 bara/gerilim |

### Yeni V2 Model

Son uretilen `data/kml_layers_v2.json` ozetleri:

| Kapsam | Deger |
| --- | ---: |
| Hat aktif | 2290 / 2341 |
| Hat reaktif | 2290 / 2341 |
| Hat P/Q en az bir olcum | 2291 / 2341 |
| Trafo aktif | 2762 / 3001 |
| Trafo reaktif | 2764 / 3001 |
| Trafo P/Q en az bir olcum | 2767 / 3001 |
| Bara gerilim tum | 1842 / 5960 |
| 154/400 bara gerilim | 1811 / 3303 |

Trafo kapsami, onceki yaklasik `2318` tekil trafo seviyesinden `2767` seviyesine cikarildi. Gerilimde varsayilan harita kapsami olan 154/400 kV `1811` olarak korunuyor; tum gerilim adaylari ise mevcut kaynak dosyalarla `1842` seviyesinde yakalaniyor. ChatGPT tablosundaki `2108` seviyesine cikmak icin gerilim tarafinda ek isim/ID tabanli builder iyilestirmesi gerekir.

## Kök Neden

Eski runtime kuralinda yon cozumlemek icin cogunlukla su varsayim kullaniliyordu:

1. Formul veya Superset satirindaki kaynak kodu hat baslangic TM'sine eslesmeli.
2. Formul veya Superset satirindaki hedef kodu hat bitis TM'sine eslesmeli.
3. Tersi durumda reverse kabul edilmeli.

Bu kural sahada fazla kati kaliyor. Ornekler:

- `400kV ADA1 DGKC - TEMELLI`: formulde `GEBZ-DG -> TEMELLI` gorulebiliyor. `TEMELLI` gercek hat ucu, fakat `GEBZ-DG` KML'deki `ADA1 DGKCS` ile exact eslesmiyor.
- `154kV TEMELLI - BAYMINA DGKC`: formulde `TEMELLI -> ANKDG-G1` gorulebiliyor. `TEMELLI` gercek hat ucu, hedef ise uretim/grup kodu.
- `154kV KIRIKKALE -> KIZILIRMAK - KESIKKOPRU HES`: kaynak kodu gercek uca yakin, hedef kodu santral/terminal kisa kodu olabiliyor.

Bu nedenle tek taraf guvenilir oldugu halde eski runtime `orientation-unknown` uretiyordu.

## Uygulanan Degisiklikler

### 1. Builder: side-aware aday modeli

`build_kml_layers_v2.py` artik hat SCADA adaylarina su alanlari yaziyor:

- `sourceTmName`
- `sourceSide`
- `targetSide`
- `candidateSlot`
- `formulaSign`
- `formulaStationCode`
- `formulaTargetCode`

`candidateSlot` su sekilde yorumlanir:

- `primary`: olcum kaynagi hat baslangic tarafi gibi gorunuyor.
- `secondary`: olcum kaynagi hat bitis tarafi gibi gorunuyor.
- `extra`: taraf kesin degil.

Bu veri runtime'a "ID-1 / ID-2" siralama mantigini tamamen kaybetmeden cozumleme yapma imkani verir.

### 2. Runtime: tek tarafli yon cozumleme

`scada-v2-runtime.js` artik yon icin su onceligi uygular:

1. Formul `stationCode -> targetCode` ile iki uclu alias eslesmesi.
2. Formulde yalniz `stationCode` veya yalniz `targetCode` guvenilir eslesirse tek tarafli cozum.
3. Builder'dan gelen `sourceSide / targetSide`.
4. Superset row `tmName / remoteName` alias eslesmesi.
5. Hicbiri guvenilir degilse `orientation-unknown`.

Normalize edilen deger:

```text
normalizedStartToEnd = rawValue * formulaSign * orientationSign
```

Burada:

- `formulaSign`: `SISTEM_ESLEME_LISTESI.xlsx` icindeki `(+1)` / `(-1)` katsayisi.
- `orientationSign`: olcumun KML hat baslangicindan bitisine gore yonu. `start -> end` icin `+1`, `end -> start` icin `-1`.

### 3. Ana / yedek aday davranisi

Ayni hat icin iki canli aday varsa:

- Tolerans icindeyse ortalama / tek normalize deger kullanilir.
- Tolerans disindeyse artik tum kayit dusurulmez.
- `primary` aday secilir, kayit `ambiguous-warning` olarak isaretlenir.
- `secondary` secilirse `backupUsed=true` yazilir.
- Tamamen yon belirsizse hat yine `orientation-unknown` kalir ve ok cizilmez.

Bu sayede kullanici veri gorur, fakat audit CSV'de kaydin uyarili oldugu izlenebilir.

### 4. Alias normalizasyonu

Alias cozumleme su yonde iyilestirildi:

- lowercase / suffix bug'i giderildi.
- `TM`, `GIS`, `HES`, `TES`, `OSB`, `SANTRAL` gibi suffix temizleme normalize formda calisir hale geldi.
- `KAPAS-H1`, `GEBZ-DG`, `ANKDG-G1` gibi formul tokenlari parcalanip prefix ve rakam/kod varyantlariyla deneniyor.

## Audit CSV Degisiklikleri

Yeni denetim CSV kolonlari:

- `Candidate Slot`
- `Source Side`
- `Target Side`
- `Selected Candidate`
- `Backup Used`
- `Formula Sign Applied`
- `Orientation Rule`
- `Candidate Conflict`

Bu kolonlar ozellikle su sorulara cevap verir:

- Hangi olcum ID secildi?
- Birincil mi yedek mi kullanildi?
- Katsayi uygulandi mi?
- Yon hangi kuralla bulundu?
- Coklu aday conflict'i var mi?

## Beklenen Etki

312 hatlik son audit snapshot icin eski dagilim:

| Durum | Eski adet |
| --- | ---: |
| matched-live | 242 |
| matched-stale | 21 |
| orientation-unknown | 37 |
| ambiguous-live | 7 |
| missing-config-id | 4 |
| missing-source-row | 1 |

Yeni runtime ile beklenen degisim:

- `orientation-unknown` sinifi anlamli bicimde dusmeli.
- Tek tarafli cozumlenen kayitlar `matched-live` veya `matched-stale` sinifina girmeli.
- Tolerans disi ama taraf bilgisi olan cift adaylar `ambiguous-live` yerine `ambiguous-warning` olarak gorunmeli.
- `missing-config-id` ve `missing-source-row` siniflari kaynak/sorgu kapsami oldugu icin buyuk degisim beklenmez.

Canli veya kayitli Superset snapshot tekrar alindiginda hedef, 312 gorunen hat icin kullanilabilir/cozulmus kayit sayisini `300+` seviyesine yaklastirmaktir.

## Trafo ve Gerilim Durumu

Trafo tarafinda builder katiligi asil problemdi. Eski mantik `TR-*` detaylarini kabul ediyordu; yeni mantik ayni TM + trafo adi exact eslesmesini de kabul ediyor. Bu nedenle model kapsami:

```text
Trafo P/Q en az bir olcum: 2767 / 3001
```

Gerilim tarafinda 154/400 kV varsayilan harita gorunumu korunuyor. Yeni model tum exact bara gerilim adaylarini sakliyor:

```text
Bara gerilim tum: 1842 / 5960
154/400 bara gerilim: 1811 / 3303
```

ChatGPT tablosundaki `2108` gerilim hedefi icin kalan fark muhtemelen bara isimlerinin `SISTEM_ESLEME_LISTESI.xlsx` icindeki analog detayla birebir ayni olmamasindan veya ChatGPT tablosunun ek isim/ID heuristikleri kullanmasindan kaynaklaniyor. Bu kisim sonraki fazda `eslesme_tablolari.xlsx` benzeri ara tabloyu builder'a resmi girdi yapmak veya bara isim alias sozlugu uretmekle kapatilabilir.

## Test Sonucu

- `npm test`: basarili.
- `npm run build:kml-v2`: basarili.

## Sonraki Onerilen Adim

1. Intranet veya fixture snapshot ile yeni audit CSV tekrar alinmali.
2. `orientation-unknown`, `ambiguous-warning`, `missing-source-row` dagilimi yeni CSV uzerinden karsilastirilmali.
3. Gerilimde `1842 -> 2108` farki icin ChatGPT gerilim tablosundaki eksik `Bara ID` listesi builder'a alias kaynagi olarak eklenmeli.
4. Hat conflict kayitlari sahadan orneklenip `primary/secondary` davranisi dogrulanmali.
