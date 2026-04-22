# TPYS Harita + SCADA

Bu repo, TPYS/KML tabanli harita gorunumu ile SCADA aktif guc verisini ayni uzanti icinde birlestirir. Ana ekran `map-modern.html` ve ilgili akistir.

## Guncel Mimari

- Harita motoru: `map-modern.js`
- SCADA istemci state ve snapshot uygulama: `scada-client.js`
- SCADA gorsellestirme ve ranking paneli: `scada-flow.js`
- Background transport/auth: `background.js`
- Ortak parser/helpers:
  - `map-common.js`
  - `scada-common.js`

## SCADA Canli Auth Akisi

Canli veri cekimi artik sadece `background.js` uzerinden yapilir.

`SCADA_FETCH` yaniti standarttir:

```json
{
  "ok": true,
  "data": {},
  "authMode": "session",
  "usedFallback": false,
  "httpStatus": 200
}
```

Desteklenen `authMode` degerleri:

- `session`: mevcut Superset oturumu yeniden kullanildi
- `direct-login`: `GET /login/` + form `POST /login/` ile oturum acildi
- `hidden-tab`: direct login olmazsa gizli sekmede form doldurularak login denendi
- `mock`: yerel mock veri kullanildi

Akis sirasi:

1. Mevcut oturum ile chart verisi denenir.
2. 401/403 benzeri auth hatasinda `data/scada_auth.json` okunur.
3. Config `enabled=true` ise direct login denenir.
4. Direct login basarisizsa hidden-tab fallback devreye girer.
5. Auth/fetch yine basarisiz olursa eski veri canli gibi birakilmaz; mevcut akimlar `dead/stale` duruma cekilir.

## Credential Konfigurasyonu

Repo-tracked konfigurasyon dosyasi:

`data/scada_auth.json`

Ornek:

```json
{
  "baseUrl": "https://analytics.teias.gov.tr",
  "username": "",
  "password": "",
  "dashboardId": 89,
  "chartSliceId": 454,
  "enabled": false
}
```

Notlar:

- Bu repo ek bir popup/options page istemez.
- `enabled=false` ise sadece mevcut Superset oturumu kullanilir.
- Canli auth icin dosyaya intranet kullanici bilgileri yazilmalidir.

## Harita Davranislari

Bu surumde kapatilan ana sorunlar:

- Fractional zoom sirasinda tile URL'leri artik integer `z` ile uretilir.
- Fractional zoom sadece overlay/tile transform olceginde kullanilir.
- Dark altlik hata verirse light altliga donulur.
- Light altlik da hata verirse overlay-only moduna gecilir; harita kullanilamaz hale gelmez.
- Arama sonucu filtre arkasindaysa ilgili `kV` ve `YTM` filtreleri gecici olarak genisletilir.
- Durum mesajlari gorunur bir status alani olan `#mapStatus` uzerinden verilir.
- Bara Set esleme artik deterministic sirayla cozulur:
  - `tpysBaraId exact`
  - `tpysBaraAdi exact`
  - `yksBaraAdi exact`
  - `alias exact`
- Birden fazla aday varsa satir `ambiguous` kabul edilir ve haritaya alinmaz.

## SCADA Veri Kalitesi

`state.scada` icine eklenen ana alanlar:

- `duplicateMappings`
- `duplicateHatIds`
- `ambiguousRows`
- `lastTransport`
- `authState`
- `dataQualitySummary`

Kurallar:

- Ayni `olcumNoktasiIdAktif` birden fazla hatta bagliysa bu kayitlar duplicate kabul edilir.
- Duplicate mapping olan hatlar canli renklendirmeye ve ranking paneline sokulmaz.
- Bilgi karti ve SCADA kalite satiri bu durumu gosterir.
- Veri fetch hatasinda onceki akimlar `live` olarak tutulmaz.

## SCADA Denetim ve Mismatch Raporu

SCADA kartinda iki yeni aksiyon vardir:

- `Denetim CSV`: gorunur hat evreni icin audit export indirir
- `Mismatch Raporu`: eslesen, stale, duplicate, kaynagi olmayan ve aktif ID'si bos hatlarin ozetini modal olarak gosterir

Denetim CSV, ranking exportundan farklidir. Ranking CSV sadece o anki yuklenme listesini disari alir; audit export ise gorunur hat evreninin tamamini ve mismatch nedenini satir bazinda raporlar.

## Superset Sorgu Kontrati

Eklenti SCADA fetch akisi artik `network` sayfasiyla ayni temel kontrati kullanir:

- zaman araligi: son `24 saat`
- `elementName = 'P'`
- `b2Name IN ('400', '380', '420', '154')`
- `tear IN ('Golbasi_YTM')`
- yuksek satir limiti: `50000`

Bu degisim, Superset ekranindaki ham kaynak ile eklentinin arka planda cektigi veri evrenini ayni tabana getirir.

## Testler

Yerel test komutu:

```bash
npm test
```

Mevcut deterministic test kapsami:

- `tests/scada-common.test.js`
  - `docs/20260419_191935.csv`
  - `docs/20260419_192257.csv`
  - parser satir sayisi
  - `elementName=P` filtresi
  - `sinsid` bazli newest timestamp secimi
- `tests/map-common.test.js`
  - deterministic Bara Set esleme
  - ambiguous alias senaryosu
  - fractional zoom split davranisi

## KML V2 Build

Yeni hiyerarsik model su komutla uretilir:

```bash
python build_kml_layers_v2.py
```

Uretilen ciktilar:

- `data/kml_layers_v2.json`
- `docs/yeni_harita_modeli/kml_layers_v2_validation.md`

Not:

- Build script Python 3 ve `openpyxl` gerektirir.
- Bu cikti mevcut `data/kml_layers.json` yerine gecmez; V2 yan yana tutulur.

## Bu Ortamda Dogrulanamayan Nokta

`analytics.teias.gov.tr` bu calisma ortaminda 19 Nisan 2026 tarihinde DNS olarak cozulemedigi icin canli intranet smoke test burada tamamlanamadi. Kod yazildi ve fixture testleri gecti, ancak gercek auth akisi icin asagidaki fixturelar hala faydali olur:

1. `GET /login/` HTML dump
2. Basarili login request/response izi veya HAR
3. Basarili `POST /api/v1/chart/data...` request ayrintisi ve JSON dump

Bu fixturelar geldiginde auth parser ve transport icin ek deterministic test yazilabilir.
