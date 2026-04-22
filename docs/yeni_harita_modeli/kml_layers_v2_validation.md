# KML Layers V2 Validation

Uretim zamani: `2026-04-21T20:31:23+00:00`

## Kaynak Ozetleri

- KML TM placemark: `1583`
- KML hat placemark: `2341`
- Excel TM satiri: `1584`
- Excel hat satiri: `2341`
- Excel trafo satiri: `3001`
- Excel bara satiri: `5960`

## KML / Excel Eslesme

- TM eslesmesi: `1583/1583`
- Hat eslesmesi: `2341/2341`

## Parent Baglama

- Trafo -> TM: `3001/3001`
- Bara -> TM: `5960/5960`

## SCADA Kapsami

- Hat aktif: `2290/2341`
- Hat reaktif: `2290/2341`
- Trafo aktif: `2762/3001`
- Trafo reaktif: `2764/3001`
- Bara gerilim (tum): `2108/5960`
- 154/400 bara gerilim: `1811/3303`

## Hat Terminal Polarizasyonu

- Terminal tarafi cozulen aday: `8515`
- Terminal tarafi bilinmeyen aday: `0`
- Polarizasyon uyumsuz config: `4117`

## Gerilim Overlay

- Exact kaynak eslesmesi: `1842`
- ChatGPT Bara ID overlay: `266`
- Guvenli alias fallback: `0`
- Alias ambiguous config: `0`
- 154/400 hala eksik: `1492`

## Ambiguous Kayitlar

- Hat metric ambiguous entity: `2020`
- Trafo metric ambiguous entity: `10`
- Bara metric ambiguous entity: `6`

## KML'de Olmayan Excel Kayitlari

- `2674` / TARSUS OSB

## Notlar

- `trafos` ve `baraNodes` bu fazda `details-only` tutulur; ayri harita koordinati uretilmez.
- Cok adayli SCADA kayitlari dusurulmez; `ids[]`, `rows[]` ve `ambiguous=true` ile saklanir.
- `TARSUS OSB` KML'de olmadigi icin TM listesinde kalir ama `tmPoints` icine giremez.
