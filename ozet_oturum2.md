# Oturum Özeti 2

Bu oturumda önceki dönemlik TPYS/RGDH otomasyon geliştirmelerinin üzerine, canlı TPYS sayfasında combobox seçimlerinin yazılamaması problemi analiz edilip düzeltildi.

## Proje Kökü

`C:\yazilim_projeler\SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1`

## 1. Başlangıç Durumu

Kullanıcı `RGDH Uzlaştırma Otomasyon` üzerinden `yks_izleme_modul\RGDH_GUNLUK.csv` dosyasını yükleyip `CSV TPYS Eşleştirme` çalıştırdığında TPYS sayfasındaki ExtJS combobox hücrelerine seçim yapılamıyordu.

Canlı popup logunda eşleşme kısmı başarılıydı:

- CSV gün sayısı: `30`
- TPYS sayfa satırı: `30`
- Eşleşen gün: `30`
- Eşleşen bara: `ÇAYIRHAN TES 380`
- Tarih sayısı: `30`
- Saat sayısı: `720`

Fakat uygulama aşamasında MAIN-world hızlı mod şu hatayla duruyordu:

`Hizli mod icin deger cozulemedi: saat 0, etiket Sağladı`

Ardından DOM fallback çalışıyor, fakat ExtJS combobox editörleri sentetik mouse/keyboard eventleri güvenilir kabul etmediği için yazım başarısız oluyordu. Önceki loglarda görülen ana hata:

`Untrusted event`

## 2. Teknik Kök Neden

Önceki MAIN-world çözümü doğru grid/store yapısına erişebiliyordu, fakat `Sağladı`, `Sağlamadı`, `Yükümlülüğü Yok` gibi görünen etiketleri TPYS'nin beklediği raw ID değerlerine çevirmek için yalnızca combo editor store'una bakıyordu.

Canlı sayfada editor store her durumda dolu veya label bazlı değildi. Chrome AI incelemesinde görülen kanıtlar:

- ExtJS 3.3 kullanılıyor.
- Aktif grid `.x-grid3`, görünür grid id örneği `ext-gen188`.
- Durum kolonları: `lkp_reaktif_yerine_getirme0..23`.
- Onay kolonları: `onay_durum_flag0..23`.
- Gizli editor inputlarında `value="11"` sık görülüyor.
- Dropdown/etiketler arasında `Sağladı`, `Sağlamadı`, `Yükümlülüğü Yok`, `Devre Dışı`, `Muaf`, `Onay Bekliyor` var.

Sonuç: Asıl sorun grid/store bulma değil, label -> raw value resolver eksikliğiydi.

## 3. Uygulanan Ana Çözüm

`tpys-extjs-main-apply.js` içinde status mapping çözümü genişletildi. Artık raw değer keşfi yalnızca editor combo store'a bağlı değil.

Yeni keşif sırası:

1. Editor combo store: `displayField/valueField`.
2. `store.getRange()` companion alanları:
   - `${field}_qw_`
   - `${field}_txt`
   - `${field}_text`
   - `${field}_dsc`
   - `${field}_ad`
   - `${field}_adi`
3. Column renderer:
   - `renderer(rawValue, meta, record, rowIndex, colIndex, store)` çağrılıyor.
   - Dönen HTML/metin normalize edilerek label/raw eşleşmesi çıkarılıyor.
4. Visible grid mapping:
   - Render edilmiş `.x-grid3-row` hücrelerinden görünen label alınıyor.
   - Aynı satırdaki store raw value ile eşleştiriliyor.
5. Global lookup scan:
   - `window._lookups`, `lookups`, `lookupStore` benzeri global map yapıları taranıyor.
   - Sadece birden fazla bilinen durum etiketi içeriyorsa güvenilir kabul ediliyor.

Kullanıcının verdiği tahmini ID tablosu doğrudan hardcode gerçek olarak kullanılmadı:

- `Sağladı -> 9`
- `Sağlamadı -> 11`
- `Yükümlülüğü Yok -> 13`
- `Devre Dışı -> 15`
- `Muaf -> 17`
- `Onay Bekliyor -> 1`

Bu değerler sadece diagnostics/hint olarak bırakıldı; otomatik yazımda ancak sayfadaki store/renderer/lookup kaynaklarıyla doğrulanan değerler kullanılıyor.

## 4. Popup Davranışı

`popup.js` tarafında MAIN-world hızlı mod sonucu daha ayrıntılı ele alınacak şekilde güncellendi.

Önemli değişiklik:

- Mapping çözülemezse artık otomatik olarak yavaş DOM fallback'e düşülmüyor.
- Çünkü DOM fallback, ExtJS combobox tarafında sentetik event nedeniyle güvenilmez.
- Bunun yerine kullanıcıya açık teşhis bilgisi loglanıyor:
  - çözülen mappingler
  - mapping kaynakları
  - çözülemeyen etiketler

Eklenen davranışlar:

- `shouldUseDomFallback(result)` ile fallback kapısı ayrıldı.
- `logMainWorldMappingDiagnostics(result)` ile popup loguna mapping özeti yazılıyor.

## 5. Yazım/Kayıt Semantiği

TPYS grid store'una yazım hâlâ MAIN-world üzerinden `record.set(...)` ile yapılıyor.

Bilinçli olarak eklenmeyenler:

- `record.commit()` eklenmedi.
- Otomatik `store.save()` eklenmedi.
- ERP/TPYS commit veya backend save otomatik tetiklenmedi.

Böylece değişiklikler TPYS grid üzerinde dirty state olarak kalıyor; kullanıcı mevcut TPYS akışında kontrol edip kaydedebiliyor.

## 6. Değişen Ana Dosyalar

Bu oturumda doğrudan üzerinde çalışılan dosyalar:

- `tpys-extjs-main-apply.js`
- `popup.js`
- `tests/tpys-extjs-main-apply.test.js`
- `tests/popup-html.test.js`

Not: Çalışma ağacı oturum başında zaten temiz değildi. Önceki oturumdan gelen diğer dönemlik TPYS/RGDH dosyaları ve fixture dosyaları korunmuştur.

## 7. Eklenen Test Senaryoları

`tests/tpys-extjs-main-apply.test.js` genişletildi.

Yeni kapsanan senaryolar:

- Editor store doluyken `Sağladı -> raw ID` çözümü.
- Editor store boşken `store.getRange()` + `${field}_qw_` üzerinden `Sağladı -> 9`.
- Görünür gridde `Sağladı` hücresi olmasa bile column renderer üzerinden `9 -> Sağladı`.
- Görünür grid hücresinden label okuyup aynı satırdaki raw değerle eşleme.
- `_lookups` benzeri global map yapısında sadece çoklu bilinen status label varsa lookup kabulü.
- Mapping çözülemezse sonuçta:
  - `unresolvedLabels`
  - `mappingDiagnostics`
  - `candidateDiagnostics`
  - `resolvedStatusMap`
  alanlarının dönmesi.

`tests/popup-html.test.js` içinde popup'ın:

- MAIN-world helper'ı kullandığı,
- `shouldUseDomFallback` kapısına sahip olduğu,
- `mappingDiagnostics` ve `resolvedStatusMap` logiklerini içerdiği
statik olarak doğrulandı.

## 8. Doğrulama Sonuçları

Çalıştırılan doğrulamalar başarıyla geçti:

- `node --test tests\tpys-extjs-main-apply.test.js`
  - `6/6` geçti
- `node --test tests\popup-html.test.js`
  - `9/9` geçti
- `npm test`
  - `310/310` geçti
- `npm run build:extension`
  - başarılı
- `npm run smoke:extension`
  - başarılı

Derleme çıktısı:

- Unpacked: `dist\chrome-extension`
- Zip: `dist\SCADA_YTBS_TPYS_YKS_Haritalar_ve_Otomasyon_v1.0.0_20260504.zip`

## 9. Son Durum

Bu oturum sonunda TPYS ExtJS combobox yazım problemi için beklenen ana akış şudur:

1. Popup `CSV TPYS Eşleştirme` ile planı oluşturur.
2. MAIN-world helper aktif TPYS ExtJS grid/store yapısını bulur.
3. Durum etiketleri için raw ID mapping şu kaynaklardan keşfedilir:
   - editor store
   - `store.getRange()` companion alanları
   - renderer çıktısı
   - görünür grid hücreleri
   - doğrulanmış global lookup map
4. `record.set(...)` ile grid store güncellenir.
5. TPYS sayfası refresh edilir.
6. Mapping çözülemezse DOM fallback ile uzun süre combobox denemesi yapılmaz; popup anlaşılır teşhis logu üretir.

## 10. Devam Ederken Bakılacak Yerler

Canlı TPYS sayfasında tekrar test yapılırken popup logunda özellikle şu satırlar kontrol edilmeli:

- `Uygulama modu: ext-main-batch`
- `Durum mapping: ...`
- `Mapping kaynakları: ...`
- `Çözülemeyen durum etiketleri: ...` görünmemeli.

Eğer hâlâ mapping çözülemezse, popup logundaki `mappingDiagnostics` ve `candidateDiagnostics` çıktıları yeni resolver'ın hangi kaynakları gördüğünü gösterecek. Bu durumda ek canlı HTML/store örneğiyle resolver'a yeni bir discovery kaynağı eklenebilir.
