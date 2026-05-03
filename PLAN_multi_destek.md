# Günlük RGDH İzleme İçin YKS/EK-C Kaynak Tipi Planı

## Summary
`Günlük RGDH İzleme` sekmesi hem Yan Hizmetler/YKS verisini hem de yalnız Ek-C yüklenen veriyi aynı reaktif günlük kontrol tablosunda gösterecek. YKS satırları `YKS Kontrol`, Ek-C satırları `EK-C Kontrol` olarak ayrılacak; tarih ve saat tıklamaları ilgili kaynak moduyla `RGDH Grafik Rapor` sekmesini açacak.

## Key Changes
- `rgdh-monitor.js` içinde günlük tablo için yeni birleşik veri hazırlama akışı eklenecek:
  - YKS/API rows ayrı pivotlanacak ve `controlSource: 'YKS'`, `controlType: 'YKS Kontrol'` atanacak.
  - Ek-C rows ayrı pivotlanacak ve `controlSource: 'EKC'`, `controlType: 'EK-C Kontrol'` atanacak.
  - İki kaynak aynı gün/santral için gelirse aynı tabloda ayrı satırlar olarak gösterilecek.
- Günlük tablo başlığı `Kontrol` yerine `Kaynak Tipi` olacak.
- Kaynak tipi hücresi badge gibi gösterilecek:
  - `YKS Kontrol`: mavi ton
  - `EK-C Kontrol`: turuncu ton
- Ek-C CSV yüklenince otomatik hedef sekme `Günlük RGDH İzleme` olacak; karşılaştırma verisi yine arka planda hazırlanabilir, ancak kullanıcı ilk olarak günlük kontrolü görecek.
- Tarih ve saat tıklamalarında `state.calculationMode` ilgili satır kaynağına göre set edilecek:
  - YKS satırı: `YKS`
  - Ek-C satırı: `EKC`
- Tarih hücresi ve saat hücre içeriği link görünümüne alınacak; saat hücresinin mevcut `participation-*` renk sınıfları hücrede kalacağı için sonuç renklendirmesi bozulmayacak.

## Interface / Behavior Details
- Günlük tablo satır modeli şu dahili alanları taşıyacak:
  - `controlSource: 'YKS' | 'EKC'`
  - `controlType: 'YKS Kontrol' | 'EK-C Kontrol'`
- Grafik drilldown seçiminde mevcut `chartSelection` korunacak; sadece kaynak modunu belirlemek için `state.calculationMode` güncellenecek.
- Ek-C-only senaryoda `RGDH Grafik Rapor` doğrudan Ek-C hesaplama verisiyle açılacak; YKS verisi yoksa YKS fallback mesajı gösterilmeyecek.

## Test Plan
- `rgdh-ui-smoke.test.js`:
  - Günlük tablo başlığında `Kaynak Tipi` olduğunu doğrula.
  - `YKS Kontrol` ve `EK-C Kontrol` badge sınıflarının varlığını doğrula.
  - Tarih/saat hücrelerinin link görünümlü sınıflarla render edildiğini doğrula.
- `rgdh-monitor` davranış testleri:
  - YKS-only veri günlük tabloda `YKS Kontrol` üretir.
  - Ek-C-only veri günlük tabloda `EK-C Kontrol` üretir.
  - YKS + Ek-C aynı gün/santral yüklendiğinde iki ayrı günlük kontrol satırı oluşur.
  - Ek-C günlük satırındaki tarih/saat tıklaması grafik modunu `EKC` yapar.
  - YKS günlük satırındaki tarih/saat tıklaması grafik modunu `YKS` yapar.
- Tam doğrulama:
  - `npm test`

## Assumptions
- Ek-C CSV yüklendikten sonra kullanıcı otomatik olarak `Günlük RGDH İzleme` sekmesine yönlendirilecek.
- Mevcut YKS veri çekme, karşılaştırma ve grafik davranışları korunacak.
- Saat hücrelerinde renk kodu hücre sınıfında kalacak; link görünümü içerideki metin/stil ile sınırlı olacak.
