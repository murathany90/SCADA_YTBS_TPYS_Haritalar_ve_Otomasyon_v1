# SCADA Audit Karsilastirma ve Guncel Iyilestirme Raporu

Tarih: 2026-04-20

Bu rapor `chrome-devtools-mcp` kalicilastirma calismasi ile birlikte alinan yeni SCADA audit ciktilarini ve V2 KML builder sonucunu ozetler. Kapsam; hat audit `(4)`, gerilim audit `(5)`, trafo panel CSV'si, gerilim overlay modeli ve stale/gecikmeli kayitlarin UI/export tarafinda daha acik gosterilmesidir.

## 1. Chrome DevTools MCP Kaliciligi

Repo artik `chrome-devtools-mcp@0.21.0` paketini dev dependency olarak tasiyor. Bu nedenle her oturumda yeniden kurulum yapmak gerekmiyor; `npm install` yapilmis repo kopyasinda MCP server repo-local olarak calisir.

Eklenen kalici parcaciklar:

- `.mcp.json`: repo-local MCP server tanimi.
- `npm run chrome:debug`: Chrome/Edge'i `127.0.0.1:9222` remote debugging ile acar.
- `npm run mcp:chrome`: repo-local `chrome-devtools-mcp` server'ini baslatir.
- `npm run smoke:mcp`: CLI ve debug endpoint smoke kontrolu yapar.
- `docs/chrome-devtools-mcp.md`: IDE/Antigravity kullanim notlari.

Not: IDE user-level MCP listesini cache'leyebilir. Paket repo icinde kalici olsa bile IDE'nin `.mcp.json` veya user config degisikligini gormesi icin restart/rescan gerekebilir.

## 2. Hat Audit Sonucu

Kaynak CSV: `docs/scada_eslesme_denetim_2026-04-20 (4).csv`

Gorunen hat sayisi: `312`

Durum dagilimi:

| Durum | Adet | Yorum |
|---|---:|---|
| matched-live | 276 | Canli ve dogrudan kullanilabilir |
| matched-stale | 24 | Eslesmis ama zaman olarak bayat |
| ambiguous-warning | 7 | Cozulmus, fakat aday catismasi nedeniyle uyarili |
| missing-config-id | 4 | Modelde ilgili SCADA olcum ID yok |
| missing-source-row | 1 | Modelde ID var, sorgu sonucunda kaynak satir yok |

Kullanilabilir toplam: `276 + 24 + 7 = 307`

Kalan gercek acik: `5`

Yenilenen yon cozumleme sonucu `orientation-unknown = 0`. Bu, onceki ana problemin kaynak mapping eksikligi degil runtime yon/aday cozumleme kuralindan kaynaklandigini dogrular. Yeni alias-aware ve tek-uc yon kurali ile hat tarafinda 300+ hedefi yakalandi.

### Hat Cakisma ve Yedek Kullanimi

Audit debug alanlarina gore:

- `Candidate Conflict = yes`: `7`
- `Backup Used = yes`: `58`
- En sik cozum yontemleri:
  - `tolerance-mean`: `143`
  - `latest-oriented`: `122`
  - `single-candidate`: `32`
  - `primary-conflict`: `7`
  - `same-value`: `3`

`ambiguous-warning` kayitlari hatali veya eksik sayilmadi; kullaniciya veri gosterilir, ancak "uyarili cozum" olarak raporlanir. Bu kayitlarda ok/yon cizimi guvenilirlik kurallarina bagli kalmali, audit alanlari ise secilen aday ve conflict bilgisini korumalidir.

### Kalan 5 Hat

| ID | Hat | Durum | Kisa neden |
|---:|---|---|---|
| 6098 | 154kV AYRANCI GECICI -> EREGLI - KARAMAN BES EIH | missing-source-row | SCADA ID modelde var, kaynak sorguda yok |
| 6509 | 400kV SEYDISEHIR (YENI) -> EREGLI - ADANA EIH | missing-config-id | Ilgili SCADA olcum ID modelde yok |
| 6547 | 400kV KARATAY -> MERSIN380 - AKKUYU NGS GIS EIH | missing-config-id | Ilgili SCADA olcum ID modelde yok |
| 6551 | 154kV UMITKOY -> ALCI OSB MOBIL - TEMELLI EIH | missing-config-id | Ilgili SCADA olcum ID modelde yok |
| 6552 | 154kV TEMELLI -> ALCI OSB MOBIL - UMITKOY EIH | missing-config-id | Ilgili SCADA olcum ID modelde yok |

Bu bes kayit icin runtime tarafinda daha agresif bir cozum onerilmez. `missing-config-id` olanlar icin builder kaynaklarinda ek olcum ID gerekir. `missing-source-row` olan kayit icin ise Superset sorgusunun ilgili ID'yi donup donmedigi ayrica kontrol edilmelidir.

## 3. Gerilim Audit ve Overlay Sonucu

Kaynak CSV: `docs/scada_eslesme_denetim_2026-04-20 (5).csv`

Gorunen bara/gerilim sayisi: `393`

Durum dagilimi:

| Durum | Adet | Yorum |
|---|---:|---|
| matched-live | 151 | Canli gerilim verisi var |
| matched-stale | 44 | Eslesmis ama bayat |
| missing-config-id | 196 | Modelde ilgili gerilim SCADA ID yok |
| missing-source-row | 2 | Modelde ID var, kaynak sorguda yok |

V2 builder'a `docs/yeni_harita_modeli/eslesme_tablolari.xlsx` yardimci kaynak olarak eklendi. Bu dosyadaki ChatGPT gerilim tablosu `Bara ID` bazli overlay icin kullanildi.

Builder validasyon sonucu:

| Metrik | Deger |
|---|---:|
| Bara gerilim tum kapsam | 2108 / 5960 |
| 154/400 bara gerilim kapsam | 1811 / 3303 |
| Exact kaynak eslesmesi | 1842 |
| ChatGPT Bara ID overlay | 266 |
| Guvenli alias fallback | 0 |
| Alias ambiguous config | 0 |
| 154/400 hala eksik | 1492 |

Onemli bulgu: Audit `(5)` icindeki `196` visible `missing-config-id` kaydinin `Bara ID` degerleri ChatGPT gerilim ara tablosunda bulunmuyor. Bu nedenle `1842 -> 2108` genel model iyilesmesi saglandi, fakat mevcut gorunen 393 bara evrenindeki 196 eksik otomatik olarak dusmedi.

Bu noktada guvenli tekil alias fallback de eslesme uretmedi. Bu iyi bir guvenlik sinyalidir: builder `154 B-1`, `154 B-1A`, `BB_1`, `BB_A` gibi isimleri yalnizca ayni TM ve tek aday durumunda baglayacak sekilde tasarlandi; cok aday varsa yanlis gerilim baglamamak icin otomatik secim yapmaz.

### Gerilimde Sonraki Guvenli Adim

196 eksigi kapatmak icin en saglikli yol, ChatGPT gerilim tablosuna veya resmi ara tabloya su alanlari eklemektir:

- `Bara ID`
- `Trafo Merkezi`
- `Bara Adi`
- `Gerilim kV`
- `SCADA voltage measurementId`
- varsa analog/formulasyon ham metni

Bu alanlar olmadan runtime'da isim benzerligi ile otomatik baglamak risklidir; ayni TM icinde `B-1`, `B-1A`, `B-2`, `BB_A` gibi birden cok fiziksel bara olabiliyor.

## 4. Trafo Paneli ve Stale Gosterimi

Kaynak CSV: `docs/scada_panel_trafo-dist_2026-04-20.csv`

Mevcut panel exportunda `324` dagitim trafosu satiri var. Bu batch ile runtime row modeline ortak zaman/durum alanlari eklendi:

- `staleState`
- `statusLabel`
- `ageLabel`
- `resolutionMethod`
- `candidateConflict`
- `backupUsed`

Panel ve CSV export tarafinda hat, trafo ve gerilim icin su kolonlar desteklenir:

- `Zaman`
- `Durum`
- `Veri Yasi`
- ilgili entity tipinde `Resolution Method`, `Candidate Conflict`, `Backup Used`

Beklenen UI davranisi:

- Canli kayit: zaman normal gosterilir.
- Gecikmeli kayit: zamanin yaninda `Gecikmeli` etiketi gorunur.
- Bayat kayit: zamanin yaninda `Bayat` etiketi gorunur.
- Eksik kayit: listeden dusmez; durum ve `-` degerleriyle kalir.

Bu davranis, "stale veri kaybolmasin ama canli gibi de gorunmesin" kuralini uygular.

## 5. Neden Hat 300+ Oldu, Gerilim Ayni Oranda Artmadi?

Hat tarafinda problem buyuk olcude runtime cozumleme problemiydi. Modelde olcum ID vardi, ancak runtime:

- iki ucu ayni anda exact eslestirmeye fazla bagimliydi,
- sanal terminal veya GIS kisa kodlarini KML ucu gibi yorumlayamiyordu,
- primary/secondary adaylari yeterince side-aware degerlendirmiyordu.

Yeni kural ile tek uc alias, formulasyon sign'i, primary/secondary sirasi ve toleransli secim birlikte calistigi icin `orientation-unknown` sifirlandi.

Gerilim tarafinda problem daha cok model kapsamidir. Gorunen 196 missing kaydin SCADA ID'si modelde yok ve ChatGPT overlay dosyasinda da bu `Bara ID` ler bulunmuyor. Bu nedenle runtime iyilestirmesi tek basina gerilim missing sayisini dusuremez.

## 6. Kabul Durumu

Tamamlananlar:

- MCP repo-local dependency ve `.mcp.json` eklendi.
- Hat audit `(4)` icin hedef saglandi: `307/312` kullanilabilir, `orientation-unknown=0`.
- `ambiguous-warning` yanlis/eksik sayilmadan "uyarili cozum" olarak ayrildi.
- Gerilim overlay kaynak dosyasi builder'a resmi yardimci girdi olarak eklendi.
- V2 model gerilim tum kapsam `2108` seviyesine cikarildi.
- Stale/gecikmeli kayitlar icin panel/export alanlari eklendi.

Kalan aciklar:

- Gerilim visible audit `(5)` icindeki `196 missing-config-id`, mevcut overlay dosyasinda karsilik bulmadigi icin dusmedi.
- Bu 196 icin ek resmi `Bara ID -> SCADA voltage ID` ara tablo gerekir.
- Trafo panel eski CSV'si zaman kolonu icermiyor; yeni export alindiginda zaman/durum kolonlari gorulecektir.

## 7. Onerilen Sonraki Faz

1. Gerilim icin eksik 196 `Bara ID` listesini resmi veya ChatGPT ara tabloya ekleyin.
2. Builder'i tekrar calistirin: `npm run build:kml-v2`.
3. Intranet/live veya fixture snapshot ile yeni gerilim audit CSV alin.
4. `missing-config-id` dususunu tekrar karsilastirin.
5. Stale/gecikmeli etiketlerin panelde gorundugunu MCP ile ekran uzerinden dogrulayin.

