# reaktif_gelistirme_plan.md

## Özet

Bu çalışma, `SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501` eklentisindeki RGDH/Reaktif İzleme modülünü ana referans proje davranışıyla hizalar. Referans kaynak olarak kökteki `YKS_Analiz_Istemcisi.html`, README reaktif karar notları ve `docs/rgdh/EK-C_Dosya_Formati_ile_RGDH_Performansi_Izleme_v4.md` kullanılacaktır.

Ana projede reaktif sonuç dili `SAĞLADI / SAĞLAMADI / DD / YY / KY` şeklindedir. Eklentide ise mevcut `rgdh-pivot.js` saatlik hesapları `OK / WARN / FAIL / OFF / NO_DATA` ve yalnız `participationPct` etrafında kuruyor. Bu motor değiştirilecek; platform/API verisi, EK-C verisi ve karşılaştırma ekranı aynı karar semantiğini kullanacaktır.

## Referans Kurallar

Ana projedeki saatlik karar sırası birebir uygulanacak:

```text
KY >= 60                 -> KY
DD = 60                  -> DD
YY = 60                  -> YY
YY + DD > 47             -> çoğunluk sonucu; eşitse YY
aktif yükümlülük < 13    -> YY
uygun olmayan dk <= 12   -> SAĞLADI
aksi                     -> SAĞLAMADI
```

Varsayılan ayarlar:

```js
{
  approvalThresholdPct: 90,
  dhProductionPct: 1,
  yyResGesPct: 10,
  yyConvMkudFactor: 1,
  minActiveLiabilityMinutes: 13,
  dominantOfflineThreshold: 47,
  failMinuteThreshold: 12,
  kyMinuteThreshold: 60
}
```

Dakika sonucu için platform/YKS tarafında şu sıra kullanılacak:

```text
satır yok                  -> KY
devreDurumu != 1           -> DD
yukumlulukDurumu != 1      -> YY
mainApproved == 1
  veya auxApproved == 1    -> SAĞLADI
aksi                       -> SAĞLAMADI
```

Saatlik katılım yüzdesi yalnız normal değerlendirme saatlerinde hesaplanacak:

```text
((YY + DD + SAĞLADI dakika) / 60) * 100
```

DD/YY/KY ile bastırılan saatlerde yüzde gösterilmeyecek veya `null` tutulacak.

## Uygulama Değişiklikleri

`rgdh-monitor.html` ve `rgdh-monitor.js`:

- Üst araç çubuğundaki genel `CSV Yükle` kaldırılacak, yerine `Ek-C CSV Yükle` eklenecek.
- Bu buton artık platform/YKS grafik raporu CSV fallback’i yüklemeyecek; platform verisinin ana kaynağı API olacak.
- EK-C yükleme ayrı state altında tutulacak: `state.ekcRows`, `state.ekcGroups`, `state.ekcLoaded`.
- Gerekirse katalog yükleme işlevi ana araç çubuğundan çıkarılıp `RGDH Testleri` altında ayrı ve açık adlandırılmış bir “Katalog CSV İçe Aktar” kontrolüne taşınacak.
- Yeni sekme eklenecek: `EK-C / Platform Karşılaştırma`.
- Karşılaştırma sekmesinde hem grafik hem tablo yer alacak; join durumları `both`, `ekc_only`, `platform_only` olarak gösterilecek.

`rgdh-pivot.js` ve yeni/ayrılmış reaktif kural modülü:

- `OK/WARN/FAIL/OFF/NO_DATA` merkezli hesap yerine ana projedeki `reactiveHourSummary` davranışı port edilecek.
- Dışa açık saf fonksiyonlar şu sözleşmeyle sağlanacak:

```js
derivePlatformMinuteResult(row) -> { result, reason }
reactiveHourSummary(counts, settings) -> {
  hourResult,
  passRatio,
  passCount,
  failCount,
  kyCount,
  ddCount,
  yyCount,
  missingCount,
  activeLiabilityMinutes,
  pctSuppressed
}
buildPlatformHourStat(rowsForHour, settings) -> hour summary
```

- `offBoardStatus`/`Devre Durumu` DD olarak, `noObligationStatus`/`Yükümlülük Durumu` YY olarak değerlendirilecek.
- Ana/yardımcı onayda `mainApproved === 1 || auxApproved === 1` kuralı uygulanacak. Mevcut tabloda görülen `approvalStatus ?? auxiliaryApprovalStatus` önceliği sonuç hesabında kullanılmayacak; çünkü `approvalStatus=0` ve `auxiliaryApprovalStatus=1` hibrit dakikayı yanlışlıkla başarısız gösterebilir.
- Eksik platform dakikaları YKS karşılaştırma hesabında KY/fail etkisiyle açıkça sayılacak; sessizce yok sayılmayacak.

`rgdh-csv.js`, `rgdh-normalizer.js` ve EK-C adaptörü:

- Platform grafik raporu CSV parser’ı UI fallback olmaktan çıkarılacak; API ile gelen platform satırları ana veri kabul edilecek.
- EK-C CSV için ana projedeki parser/analiz davranışından odaklı bir adaptör oluşturulacak. Kapsam: `RGDH_KONV_2026`, `RGDH_RES_2021`, `RGDH_GES_2021`, hibrit konvansiyonel ve hibrit RES/GES aileleri.
- EK-C satırları dakika bazında şu alanlara normalize edilecek: `tarih`, `saat`, `dakikaIndex`, `hour`, `vBara`, `vSet`, `pTotal`, `pMain`, `pAux`, `qMeas`, `minuteStat`.
- `minuteStat` içinde en az şu alanlar bulunacak: `result`, `qTarget`, `qThreshold`, `limitValue`, `limitLow`, `limitHigh`, `hybridDutyFlag`, `hybridDutySource`, `warnings`.

`rgdh-charts.js`:

- `RGDH Grafik Rapor` tek karma grafik yerine iki grafik üretecek.
- Üst grafik: gerilim + aktif güç.
  - `Canlı Bara`, `TPYS Set`, `Bara Set Alt/Üst Limit`, varsa `Bara 1/2/3`.
  - `P Aktif`, yardımcı kaynak aktif güç.
  - `Pnom`, `MKÜD` ve varsa ana/yardımcı Pnom sabit çizgi olarak gösterilecek. Yeni Chart.js eklentisi eklenmeyecek; sabit değerler dataset olarak çizilecek.
- Alt grafik: reaktif güç.
  - `Q Ölç`, `D.İ./A.İ. MVAr limit`, yardımcı kaynak Q/limitleri.
  - EK-C yüklüyse `Q hedef / tolerans limit` çizgileri ayrıca gösterilecek.
- Karşılaştırma sekmesinde üst grafik EK-C ve platform V/P serilerini, alt grafik EK-C ve platform Q/limit serilerini birlikte gösterecek.
- Ana projedeki yaklaşım korunacak: aktif güç ve gerilim aynı üst grafikte, reaktif güç ayrı alt grafikte izlenecek.

## Karşılaştırma Davranışı

Karşılaştırma anahtarı:

```text
normalizedBaraOrRegistryKey + tarih + dakikaIndex
```

Eşleşme önceliği:

```text
1. katalog/registry eşleşmesi
2. busbarId / internalId
3. normalize edilmiş bara adı
4. dosya/santral adı fallback
```

Karşılaştırma dakika satırı şu alanları taşıyacak:

```js
{
  joinState,
  ekcResult,
  platformResult,
  ekcLimitComparable,
  platformEquivalentLimit,
  deltaV,
  deltaP,
  deltaQ,
  ekcHybridDutyFlag,
  platformProvidedBy,
  hybridConsistency
}
```

Platform eşdeğer Q limiti:

```text
Q ölç < 0 ise D.İ. limit
Q ölç > 0 ise A.İ. limit
tek limit varsa o limit
iki limit varsa Q ölçüme daha yakın olan limit
```

Tablo saat bazlı özet verecek: EK-C sonucu, platform sonucu, ortak dakika, yalnız EK-C, yalnız platform, DD/YY/KY, geçti/kaldı, ortalama ve maksimum ΔV/ΔP/ΔQ.

## Hata ve Hizalama Notları

- Mevcut eklenti `participationPct = successMinuteCount / 60` hesaplıyor; DD/YY/KY bastırma mantığı olmadığı için ana projedeki saat kararıyla hizalı değil.
- `allOff()` sonucu `OFF` olarak kalmamalı; ana sonuç dilinde DD’ye çevrilmeli.
- `noObligationStatus` saat/pivot kararında YY olarak sayılmalı.
- Hibrit onayda yardımcı kaynak onayı ana kaynak onayından bağımsız geçerli kabul edilmeli.
- API metrikleri boş geldiğinde satırlar KY veya açık kalite uyarısı üretmeli; grafik ve tablo sessizce boş kalmamalı.
- Genel CSV fallback kaldırıldığı için kullanıcı metinleri “API platform verisi”, “EK-C kullanıcı dosyası” ve “karşılaştırma” ayrımını net anlatmalı.

## Test Planı

- Birim test: `derivePlatformMinuteResult`
  - satır yok -> KY
  - `devreDurumu=0` -> DD
  - `yukumlulukDurumu=0` -> YY
  - `mainApproved=1` -> SAĞLADI
  - `auxApproved=1` -> SAĞLADI
  - ikisi de 0 -> SAĞLAMADI
- Birim test: `reactiveHourSummary`
  - `KY=60`, `DD=60`, `YY=60`
  - `YY+DD=48`, DD çoğunluk
  - `YY+DD=48`, eşitlikte YY
  - aktif yükümlülük 12 -> YY
  - fail 12 -> SAĞLADI
  - fail 13 -> SAĞLAMADI
- UI smoke:
  - `CSV Yükle` metni kalmamalı.
  - `Ek-C CSV Yükle` görünmeli.
  - `RGDH Grafik Rapor` içinde iki canvas oluşmalı.
  - Karşılaştırma sekmesi grafik ve tabloyla açılmalı.
- Syntax kontrol:
  - `node --check` tüm değişen JS dosyalarına uygulanmalı.
- Manuel kabul:
  - API’den platform verisi çek.
  - EK-C CSV yükle.
  - Aynı bara/tarih için karşılaştırma sekmesinde ortak dakika, ΔV/ΔP/ΔQ ve saat sonuçlarını gör.

## Varsayımlar

- Ana proje yalnız referans alınacak; eklenti dışında kod değiştirilmemeli.
- Platform verisi artık API’den çekildiği için manuel platform CSV fallback UI’dan kaldırılacak.
- EK-C yükleme, kullanıcı tarafından sağlanan ham EK-C dosyaları içindir.
- Yeni Chart.js bağımlılığı eklenmeyecek; sabit referans çizgileri dataset olarak çizilecek.
- Türkçe sonuç etiketleri korunacak: `SAĞLADI`, `SAĞLAMADI`, `DD`, `YY`, `KY`.

## IDE Asistanına Kısa Başlatma Prompt’u

```text
C:\yazilim_projeler\yan_hizmet_raporlama içindeki ana referans proje reaktif kurallarını, özellikle YKS_Analiz_Istemcisi.html içindeki reactiveHourSummary, YKS compare ve iki grafik davranışını esas al. SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501 eklentisinde genel CSV fallback’i kaldırıp Ek-C CSV yükleme, DD/YY/KY/katılım saat kararları, iki parçalı RGDH grafik raporu ve EK-C/API platform karşılaştırma sekmesini bu plandaki sözleşmelere göre uygula. Önce saf kural fonksiyonlarını test et, sonra UI ve grafik entegrasyonunu yap, en sonda node --check ve tarayıcı smoke doğrulaması çalıştır.
```

## Uygulama Başlatma Komutları

Eklenti RGDH ekranını statik geliştirme için açmak:

```powershell
Set-Location 'C:\yazilim_projeler\yan_hizmet_raporlama'
python -m http.server 8787 --directory '.\SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501'
```

Ardından:

```text
http://127.0.0.1:8787/rgdh-monitor.html
```

Ana masaüstü referans uygulamayı başlatmak:

```powershell
Set-Location 'C:\yazilim_projeler\yan_hizmet_raporlama\desktop_app'
npm run tauri:dev
```




I’m using superpowers:executing-plans to work through your written plan, plus superpowers:test-driven-development so the rule changes land with executable checks instead of vibes. I’ll keep changes scoped to the eklenti folder unless verification shows a test harness needs a small companion file.


Ran 3 commands
The plan is concrete enough to execute, but I’m going to add tests first around the shared decision rules. One wrinkle: the plan is broad, so I’ll implement it in vertical slices: rules/pivot, UI loading/state, charts, compare, then verification.

Çalıştırıldı Get-Content -Raw "C:\Users\Murathan YENİCELİ\.codex\plugins\cache\openai-curated\superpowers\3c463363\skills\using-git-worktrees\SKILL.md"
I checked the worktree requirement from the execution skill. I’m keeping this in the current checkout because the target SCADA_..._20260501 plugin directory is currently untracked in this workspace; a fresh git worktree would not contain the thing you asked me to modify.

I’m adding the first regression test now. It targets the public contract the plan names directly: platform minute verdicts, hour summary suppression rules, and the auxiliary approval case that the current approvalStatus ?? auxiliaryApprovalStatus pattern can get wrong.


1 dosya oluşturuldu,ran 1 command
Bağlam otomatik olarak daraltıldı
Devam ediyorum. Önce eklediğim kural testlerini çalıştırıp beklediğimiz kırmızı noktayı göreceğim; sonra pivot motorunu ana projedeki DD/YY/KY karar sırasına taşıyacağım.

Çalıştırıldı node .\SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501\tests\rgdh-reactive-rules.test.cjs
Test beklenen yerde kırıldı; motor henüz yeni saf fonksiyonları dışa vermiyor. Şimdi rgdh-pivot.js yapısını okuyup mevcut dış API’yi bozmadan yeni karar sözleşmesini içeri yerleştireceğim.


Ran 6 commands
Pivot tarafındaki düzenleme iki katmanlı olacak: dışarıya eski isimleri de bırakacağım, ama günlük/saatlik hesap artık referans projedeki reactiveHourSummary karar zincirinden beslenecek. Böylece UI’nin eski çağrıları kopmadan yeni anlamı kullanacak.


1 dosya düzenlendi,ran 1 command
Kural katmanı yeşile döndü. Şimdi bunu ekrana bağlayacağım: CSV düğmesini EK-C yüklemeye çevirmek, günlük hücrelerde bastırılmış yüzdeleri doğru göstermek ve grafik/karşılaştırma akışını ayırmak gerekiyor.


Ran 15 commands
Grafik katmanında tek canvas’ı iki ayrı çizime ayırıyorum: üstte gerilim/aktif güç, altta reaktif güç ve limitler. Aynı zamanda heatmap artık sadece yüzde değil, saat sonucunu da gösterecek.


1 dosya düzenlendi,ran 7 commands
EK-C yükleme tarafında gerçek dosyaların başında metadata satırları olduğunu gördüm; bu yüzden genel CSV okuyucudan ayrı, TARIH;SAAT başlığını bulan bir EK-C adaptörü ekliyorum. Bu adaptör compare için dakika modelini ve ilk seviye DD/YY/KY/limit bilgisini üretecek.


3 dosya düzenlendi,ran 2 commands
Karşılaştırma akışını UI’ye bağlarken API/platform satırlarını ana veri olarak bırakıyorum; EK-C satırları ayrı filtrelenip sadece karşılaştırma sekmesinde kullanılıyor. Eşleşme anahtarı katalog/id varsa onu, yoksa normalize bara/santral adını ve dakika indeksini kullanacak.


2 dosya düzenlendi
Ana UI bağlantıları tamamlandı; şimdi sözdizimi ve küçük parser denemesiyle yakalayabileceğimiz kırıkları temizleyeceğim. Özellikle EK-C adaptörünün örnek dosyada 1440 dakika üretmesini kontrol edeceğim.


1 dosya düzenlendi,ran 22 commands
Eşleşme anahtarında küçük ama önemli bir ayar yapıyorum: platformda ID varken EK-C’de sadece ad varsa yine eşleşebilsin diye her satıra öncelikli aday anahtarlar üretiyorum. Böylece katalog/id eşleşmesi korunurken ad fallback’i gerçekten çalışıyor.


1 dosya düzenlendi,ran 8 commands
Kural testleri ve JS sözdizimi temiz. Şimdi statik sunucuyu kaldırıp tarayıcı smoke kontrolünde sekme/düğme/canvas durumunu doğrulayacağım; bu, özellikle iki canvas ve yeni karşılaştırma panelinin gerçekten DOM’a düştüğünü görmemizi sağlayacak.


Ran 8 commands
Smoke testi yeni karşılaştırma panelinin boş kalmasını yakaladı; sebep örnek EK-C tarihinin varsayılan filtre tarihinden farklı olması. Testi gerçek kullanım gibi EK-C tarihine alıp tekrar çalıştırıyorum; kod tarafında da filtreye bağlı davranış beklenen bir şey.
Uyguladım. Reaktif izleme akışı artık eklentide ana proje semantiğine göre `SAGLADI / SAGLAMADI / DD / YY / KY` kararlarını, saatlik bastırma kurallarını ve yardımcı onayın ana onaydan bağımsız geçerliliğini kullanıyor.

Başlıca değişiklikler:
- [rgdh-pivot.js](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/rgdh-pivot.js:14): `derivePlatformMinuteResult`, `reactiveHourSummary`, `buildPlatformHourStat` eklendi.
- [rgdh-csv.js](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/rgdh-csv.js:423): EK-C parser/adaptör eklendi; metadata, dakika normalize, DD/YY/KY ve qTarget/limit alanları üretiliyor.
- [rgdh-monitor.html](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/rgdh-monitor.html:47): genel yükleme butonu `Ek-C CSV Yukle` oldu; yeni `EK-C / Platform Karsilastirma` sekmesi eklendi.
- [rgdh-monitor.js](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/rgdh-monitor.js:478): EK-C state ayrıldı, platform CSV fallback akışı kaldırıldı, karşılaştırma join/özet/tablo akışı eklendi.
- [rgdh-charts.js](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/rgdh-charts.js:21): RGDH grafik raporu iki canvas’a ayrıldı; karşılaştırma grafikleri de iki parçalı hale geldi.
- [rgdh-reactive-rules.test.cjs](c:/yazilim_projeler/yan_hizmet_raporlama/SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1.0.0_20260501/tests/rgdh-reactive-rules.test.cjs:1): kural sözleşmesi için hedefli Node testleri eklendi.

Doğrulama:
- `node --check` geçti: `rgdh-pivot.js`, `rgdh-csv.js`, `rgdh-charts.js`, `rgdh-monitor.js`, `popup.js`
- Kural testleri geçti.
- Playwright smoke geçti: `Ek-C CSV Yukle` görünüyor, genel `CSV Yukle` yok, RGDH raporda 2 canvas, karşılaştırmada 2 canvas ve 24 saatlik tablo satırı oluştu.

Statik sunucu çalışıyor:
`http://127.0.0.1:8787/rgdh-monitor.html`

Not: Repo zaten çok kirli ve eklenti klasörü git’e göre komple untracked görünüyor; mevcut kullanıcı değişikliklerine dokunmadım.


