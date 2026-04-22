# SCADA Panel Audit Yeniden Uretim Ozeti

Tarih: `2026-04-20T09:43:07.112Z`

Incelenen dosyalar:
- `docs\scada_panel_hat_2026-04-20.csv`
- `docs\network_table.md`
- `data\kml_layers_v2.json`

## Ozet

- Gorunen panel satiri: `338`
- V2 modele eslesen hat: `338`
- `missing-config-id`: `5`
- `missing-source-row`: `7`
- `ambiguous-live`: `121`
- `matched-single`: `191`
- `matched-tolerance`: `14`

## Panel Bos MW Dagilimi

- MW dolu satir: `146`
- MW bos satir: `192`
- MW bos + MVAR dolu: `102`
- MW bos + MVAR bos: `90`
- Panelde MW bos gorunmesine ragmen broad kaynakta eslesebilen satir: `74`

## Neden Istenen Iyilesme Gorunmedi

- Gercek `missing-source-row` sayisi bu broad P kaynaginda yalnizca `7`. Ana kayip artik kaynak yoklugundan degil, `121` adet aktif coklu adaydan geliyor.
- Ambiguous satirlarin `69` adedi, terminal kodlari icin alias-aware yon normalizasyonu olsaydi cozulmeye aday. `28` adette sorun dogrudan alias/exact-name uyumsuzlugundan kaynaklaniyor.
- Panel exportu audit exportu degil. Bu nedenle panelde MW bos kalan `74` satir, broad Superset kaynaginda aslinda eslesebilir gorunuyor.

## Ornekler

- missing-config-id: 400kV ÇETİN HES -> CİZRE - SİLOPİ TES EİH | 400kV SEYDİŞEHİR (YENİ) -> EREĞLİ - ADANA EİH | 400kV MERSİN380 -> KARATAY - AKKUYU NGS GİS EİH | 400kV KARATAY -> MERSİN380 - AKKUYU NGS GİS EİH | 400kV AKKUYU NGS GİS -> MERSİN380 - KARATAY EİH
- missing-source-row: 400kV ERZİN - ANDIRIN EİH | 400kV ÇOBANBEYLİ - ELBİSTAN B TES - IV EİH | 400kV ATATÜRK HES - YEŞİLHİSAR - I (KUZEY) EİH | 400kV ATATÜRK HES - YEŞİLHİSAR - II (GÜNEY) EİH | 400kV GÖYNÜK -> ADAPAZARI - AKSA GÖYNÜK TES EİH | 400kV HATAY - ATLAS TES EİH | 400kV ATATÜRK HES -> BİRECİK HES - ZEUGMA EİH
- ambiguous-live: 400kV GÜRAĞAÇ - SEYİTÖMER TES EİH | 400kV GELİBOLU - BEKİRLİ TES - II EİH | 400kV CENGİZ DGKÇ - ÇARŞAMBA EİH | 400kV GELİBOLU - CENAL TES - I EİH | 400kV DİYARBAKIR3 - BEYHAN1 HES EİH | 400kV SEYİTÖMER TES - ESKİŞEHİR3 EİH | 400kV YEŞİLHİSAR - KOZAN HAVZA - I EİH | 400kV BATMAN2 - SİİRT400 EİH

