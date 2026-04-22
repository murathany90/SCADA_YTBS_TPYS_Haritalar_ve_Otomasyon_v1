# SCADA Uygulama Notlari

## Uygulanan Akis

SCADA canli veri cekimi iki parcaya ayrildi:

- `background.js`: auth + transport
- `scada-client.js`: normalize + state + snapshot uygulama

Tarayici sayfasi artik Superset'e dogrudan `fetch` atmaz. Harita tarafindan sadece `chrome.runtime.sendMessage({ type: 'SCADA_FETCH' })` cagrilir.

## Auth Sirasi

1. Session reuse
2. Direct login
3. Hidden-tab fallback

Direct login asamalari:

1. `GET /login/`
2. Form action / hidden input / csrf alanlarini parse et
3. `POST /login/`
4. `GET /api/v1/me` ile oturumu dogrula

Hidden-tab fallback:

1. `chrome.tabs.create({ active: false })`
2. Login form alanlarini `chrome.scripting.executeScript` ile doldur
3. Form submit et
4. `GET /api/v1/me` polling ile oturumu dogrula

## Beklenen Config

Dosya:

`data/scada_auth.json`

Alanlar:

- `baseUrl`
- `username`
- `password`
- `dashboardId`
- `chartSliceId`
- `enabled`

`enabled=false` ise direct login ve hidden-tab fallback devreye girmez.

## Veri Isleme Kurallari

- Sadece `elementName = P` satirlari kullanilir.
- Ayni `sinsid` icin en yeni timestamp secilir.
- `sinsid` -> `olcumNoktasiIdAktif` eslemesi kullanilir.
- Ayni aktif olcum ID birden fazla hatta bagliysa duplicate mapping sayilir.
- Duplicate mapping olan hatlar:
  - canli renklendirmeye girmez
  - ranking paneline girmez
  - popup ve kalite alaninda gorunur

## Superset Query Contract

Arka plan fetch akisi artik Superset `network` ekranindaki ana kontrata hizalidir:

- zaman araligi: son `24 saat`
- `elementName = 'P'`
- `b2Name IN ('400', '380', '420', '154')`
- `tear IN ('Golbasi_YTM')`
- `row_limit = 50000`

Boylece ham kaynak, grid export ve eklenti fetch'i ayni veri evreninden karsilastirilabilir.

## Harita Tarafinda Guncel Davranis

- Fractional zoom tile URL'lerini bozmaz; tile zoom integer tutulur.
- Altlik provider yuklenemezse overlay-only moda gecilebilir.
- SCADA oku tiklaninca ilgili hat detay karti acilir.
- Grafik modal close davranisi runtime event listener ile baglanir.
- Durum mesajlari `#mapStatus` alanina yazilir.
- SCADA kalite ozeti `#scadaKalite` alanina yazilir.
- `Denetim CSV` butonu gorunur hat evreni icin audit export indirir.
- `Mismatch Raporu` modal'i mismatch nedenlerini toplu ozetler.

## Test Durumu

Calisan deterministic testler:

- `npm test`
- CSV fixture parser testleri:
  - `docs/20260419_191935.csv`
  - `docs/20260419_192257.csv`
- deterministic Bara Set match testleri

## Bekleyen Canli Dogrulama

Bu ortamda `analytics.teias.gov.tr` DNS cozumlenmedigi icin gercek intranet smoke test tamamlanamadi.

Canli dogrulama icin kontrol listesi:

1. Mevcut oturumla sifresiz veri cekebiliyor mu
2. Oturum yoksa `data/scada_auth.json` ile login oluyor mu
3. `GET /api/v1/me` dogrulamasi geciyor mu
4. Dashboard 89 / chart 454 verisi geliyor mu
5. Hata aninda eski veri canli gibi gorunmuyor mu

## Ek Fixture Ihtiyaci

Auth akisini tam deterministic teste tasimak icin su dump'lar faydali:

1. Login HTML dump
2. Login sonrasi request/response izi veya HAR
3. Chart data request/response dump
