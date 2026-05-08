# Dashboard Geliştirme Promptu Uygulanabilirlik Raporu

Tarih: 2026-05-07

## Kısa sonuç

`dashboard_gelistirme.md` içindeki prompt genel olarak projeye uygundur ve uygulanabilir bir geliştirme talimatı üretir. Promptun en güçlü tarafı, doğru ana mimari kararları açık yazmasıdır: dış sitelerde DOM fullscreen'e güvenmemek, Chrome penceresini `chrome.windows.update(..., { state: "fullscreen" })` ile fullscreen yapmak, sekmeleri `chrome.tabs.update(..., { active: true })` ile döndürmek, MV3 service worker global state'ine güvenmemek ve ekranı açık tutmak için `chrome.power.requestKeepAwake("display")` kullanmak.

Ancak prompt tek seferde oldukça geniş bir iş paketi tarif ediyor. Dashboard döngüsü, popup UI, ayarlar sayfası, izin sadeleştirme, ESC/content script davranışı, power API, mouse fallback, SCADA snapshot/cache ve test/smoke kapsamı birlikte ele alındığında bu iş bir "tek patch" yerine aşamalı uygulanmalıdır.

Önerilen karar: Prompt uygulanabilir; ama IDE agent'a verilecekse "faz 1: dashboard controller + popup + ayarlar + fullscreen/tab switching + power", "faz 2: ESC/content script + diagnostic/log", "faz 3: SCADA background snapshot/cache" şeklinde bölünmesi daha güvenlidir.

## İncelenen kaynaklar

- `dashboard_gelistirme.md`: IDE agent'a verilecek nihai Dashboard Modu geliştirme promptu.
- `Z_NOT.md`: Promptu doğuran önceki chat geçmişi; orijinal gereksinim, önerilen mimari ve prompt üretim isteği bulunuyor.
- `manifest.json`: MV3 yapı, mevcut izinler ve content script kapsamı incelendi.
- `background.js`: service worker mesajlaşma, SCADA fetch/auth ve mevcut background yoğunluğu incelendi.
- `popup.html` / `popup.js`: mevcut popup kart düzeni, ayar saklama ve runtime mesajlaşma deseni incelendi.
- `map-modern.html` / `map-modern.js` / `scada-v2-runtime.js`: harita ve SCADA runtime davranışı, auto refresh ve visibility handling incelendi.
- `README.md`: mevcut mimari özeti, test altyapısı ve "ileride yapılacak geliştirmeler" bölümü incelendi.

## Z_NOT.md değerlendirmesi

`Z_NOT.md`, dashboard promptunun hangi analizden üretildiğini açık biçimde gösteriyor. Önceki cevapta üç kritik karar doğru kurulmuş:

- Sekme geçişinin background/controller tarafından yapılması.
- Fullscreen için DOM yerine Chrome pencere fullscreen stratejisinin seçilmesi.
- Fare hareketi yerine ana çözüm olarak `chrome.power.requestKeepAwake("display")` önerilmesi; mouse hareketinin yalnız best-effort fallback olması.

`dashboard_gelistirme.md`, bu geçmişi iyi şekilde operasyonel prompta çevirmiş. Özellikle "fare simülasyonu garanti değil", "Native Messaging kapsam dışı", "service worker global state'e güvenme", "SCADA arka plan veri durumu ayrıca ele alınmalı" maddeleri doğrudan önceki analizin doğru genişletilmiş hali.

Z_NOT kaynaklı tek risk şu: Önceki analizde bazı noktalar README üzerinden varsayılmış; bu raporda kod taramasıyla doğrulandığında ana yön doğru çıktı, ama promptun SCADA kısmı mevcut geliştirme kapsamını ciddi büyütüyor.

## Proje uyumluluğu

Mevcut proje promptta varsayılan mimariye büyük ölçüde uyuyor:

- `manifest.json` Manifest V3 ve `background.js` service worker kullanıyor.
- `popup.html` / `popup.js` zaten popup üzerinden buton ve runtime mesajlaşma akışı kurmuş.
- `map-modern.html` harita ekranı olarak ayrı extension page.
- `scada-v2-runtime.js` içinde SCADA state, fetch tetikleme, visibility/overdue davranışı ve render katmanı mevcut.
- Test altyapısı `node --test tests/*.test.js`, extension smoke ve Puppeteer akışlarıyla dashboard testlerine genişletilebilir.

Bu nedenle promptun "mevcut mimariye uygun, minimum riskli, modüler geliştir" talimatı doğru. Özellikle `dashboard-controller.js` gibi ayrı bir modül önerisi yerinde; çünkü `background.js` zaten büyük ve RGDH/TPYS/SCADA sorumluluklarıyla kalabalık.

## Mevcut kodla çakışan veya dikkat isteyen yerler

1. `host_permissions` zaten geniş.
   `manifest.json` şu anda `<all_urls>` kullanıyor; ayrıca content script tarafında da `<all_urls>` match var. Promptun "geniş `<all_urls>` kullanma" önerisi doğru bir hedef, fakat mevcut projede zaten geniş izin var. Dashboard uygulanırken yeni geniş izin eklenmemeli; izin daraltma işi ise mevcut TPYS/RGDH akışlarını kırabileceği için ayrı bir güvenlik/refactor fazı olmalı.

2. `power` izni eksik.
   Dashboard için `manifest.json` içine `"power"` eklenmesi gerekir. `tabs`, `storage`, `alarms`, `scripting` zaten var. Chrome izin listesine göre `"power"` ayrı izin ister; `tabs` ise tab/window API'lerinde hassas tab alanlarına erişim sağlar.

3. `"windows"` izni muhtemelen eklenmemeli.
   Chrome permissions listesinde ayrı bir `"windows"` permission yok; `chrome.windows` API kullanılabilir, hassas tab/window alanları için genelde `"tabs"` veya host permission gerekir. Prompttaki "windows gerekiyorsa kontrol et" maddesi iyi; uygulamada gereksiz manifest girdisi eklenmemeli.

4. `background.js` modülerleştirilmeli.
   Dashboard state machine doğrudan mevcut message handler içine gömülürse dosya daha da büyür. En iyi yol `dashboard-controller.js` dosyasını service worker'a `importScripts('dashboard-controller.js')` ile dahil etmek ve background'da yalnız mesaj/alarm delegasyonu bırakmaktır.

5. MV3 alarm davranışı doğru ele alınmalı.
   Chrome alarms dokümanı Chrome 120 sonrası minimum 30 saniye davranışını belirtir. Promptun 30 saniye altını best-effort sayması doğru. 0 saniye "slotu atla" olarak kalmalı; 1-29 saniye üretim dashboardunda güvenilir kabul edilmemeli.

6. SCADA arka plan konusu gerçek risk.
   `scada-v2-runtime.js` görünürlük kontrolüyle sekme hidden olduğunda auto refresh'i beklemeye alıyor ve görünür olunca overdue refresh deniyor. Bu mevcut davranış dashboard için minimum kurtarma sağlar ama "harita arka plandayken sürekli canlı veri çeker" garantisi vermez. Promptun SCADA snapshot/cache önerisi doğru, fakat ayrı faz olmalı.

7. ESC davranışı %100 yakalanamaz.
   Harita extension page içinde ESC listener kolaydır. Dış sitelerde content script gerekir ve browser fullscreen ESC'yi tüketebilir. Bu yüzden prompttaki fullscreen-exit detection şartı yerinde. Uygulamada ESC'ye güvenmek yerine `chrome.windows.get(windowId)` ile state kontrolü ve popup Stop temel güvenli durdurma yolları olmalı.

8. Mouse jiggle beklentisi doğru çerçevelenmeli.
   Chrome extension gerçek işletim sistemi imlecini güvenilir hareket ettiremez. Sentetik `MouseEvent` OS idle state'i sıfırlamayabilir. Bu yüzden UI metni "ek deneme/fallback" olarak kalmalı; kurum politikasını bypass eden garanti özellik gibi sunulmamalı.

## Uygulanabilirlik puanı

Genel uygulanabilirlik: Yüksek.

Risk düzeyi: Orta-yüksek. Risk, sekme switching veya fullscreen kısmından değil, kapsamın genişliğinden ve SCADA arka plan verisinin ayrı mimari gerektirmesinden geliyor.

Teknik doğruluk: Yüksek. Promptun Chrome API kararları güncel resmi dokümantasyonla uyumlu:

- `chrome.power` `"display"` seviyesi ekranın kapanmasını/kararmasını ve sistemin uyumasını engellemek için doğru seviyedir.
- `chrome.alarms` 30 saniye altı güvenilir zamanlama için uygun değildir.
- MV3 service worker global değişkenleri kalıcı kabul edilmemeli, state storage'a yazılmalıdır.
- `chrome.windows.update` içinde `state: "fullscreen"` desteklenir.
- `chrome.tabs.update` içinde `active: true` sekmeyi kendi penceresinde aktif yapar.

## Prompt için önerilen düzeltmeler

Prompt uygulanmadan önce şu küçük revizyonları öneririm:

1. "windows izni eklenmeli mi kontrol et" maddesini şu hale getir:
   "Chrome'da ayrı bir `windows` manifest izni gerekmediğini resmi dokümanla doğrula; gerekmiyorsa ekleme. `chrome.windows` kullanımı için mevcut `tabs`/host permission etkilerini değerlendir."

2. `host_permissions` bölümünü daha gerçekçi yaz:
   "Projede mevcut `<all_urls>` kullanımı varsa bu fazda genişletme yapma. Permission hardening ayrı faz olarak raporlanmalı; Dashboard implementasyonu mevcut TPYS/RGDH content script davranışlarını kırmamalı."

3. SCADA kısmını iki seviyeye ayır:
   "Minimum faz: harita slotuna dönüldüğünde overdue refresh ve son snapshot restore davranışını güvenceye al."
   "İleri faz: background SCADA refresh daemon + snapshot serializer + storage restore."

4. Dashboard settings için URL yerine map slotunda runtime URL saklama:
   `url: chrome.runtime.getURL("map-modern.html")` çalışma anında üretilmeli; storage'a `chrome-extension://...` sabit URL yazılmamalı, çünkü extension id değişebilir.

5. Timer kabul kriterini netleştir:
   "Üretimde güvenilir süre aralığı 30-600 saniye; 1-29 saniye yalnız unpacked/dev veya best-effort."

6. Durum restore kararını netleştir:
   Service worker/browser restart sonrası eski `running=true` bulunursa varsayılan olarak güvenli stop + `releaseKeepAwake()` yapılmalı. Otomatik devam opsiyonel ve ayrı ayara bağlı olmalı.

7. Test kapsamını dosya bazında somutlaştır:
   `tests/dashboard-controller.test.js`, `tests/dashboard-settings.test.js`, `tests/popup-html.test.js` genişletmesi ve `tests/smoke-extension.cjs` dashboard smoke akışı eklenmeli.

## Önerilen uygulama fazları

### Faz 1 - Çekirdek Dashboard

- `dashboard-controller.js` ekle.
- `background.js` içine `DASHBOARD_START`, `DASHBOARD_STOP`, `DASHBOARD_GET_STATE`, `DASHBOARD_SAVE_SETTINGS` delegasyonu ekle.
- `chrome.alarms.onAlarm` listener'ı ekle.
- `manifest.json` içine yalnız `"power"` ekle.
- `chrome.storage.local` içinde `dashboardSettings` ve `dashboardRuntime` şemasını uygula.
- `chrome.windows.update(..., { state: "fullscreen" })`, `chrome.tabs.update(..., { active: true })`, `chrome.power.requestKeepAwake("display")`, `chrome.power.releaseKeepAwake()` akışını tamamla.

### Faz 2 - UI ve Güvenli Durdurma

- Popup'a Dashboard kartı ekle.
- Ayrı `dashboard-settings.html/js/css` ekle veya mevcut popup akışına ayar açma butonu bağla.
- Harita sayfası için ESC listener ekle.
- Dış siteler için content script gerekiyorsa sadece tanımlı slot domainlerinde çalışacak mekanizma tasarla.
- Fullscreen exit kontrolünü slot geçişlerinde ve düşük frekanslı alarm/poll ile uygula.
- Son 100 kayıtlık dashboard log ekle.

### Faz 3 - SCADA Dayanıklılığı

- Minimum: Harita slotu aktif olduğunda `scadaDoFetch({ trigger: "dashboard-visible" })` benzeri güvenli tetikleme veya mevcut overdue resume akışını dashboard mesajıyla destekle.
- Daha sağlam: Son başarılı SCADA snapshot'ı JSON dostu formata serialize edip `chrome.storage.local` içine yaz.
- Harita açılışında önce snapshot restore, sonra canlı fetch uygula.
- Background `chrome.alarms` tabanlı SCADA refresh daemon'u ayrı planla; bu faz mevcut SCADA kontratını etkilediği için kapsamlı test ister.

## Ek öneriler

- Dashboard için "tek pencere sahipliği" kuralı net olmalı: start sırasında hedef `windowId` kaydedilmeli, tüm slotlar mümkünse aynı pencereye taşınmalı/açılmalı.
- `autoDiscardable: false` ilgili dashboard tabları için değerlendirilebilir; yine de bellek baskısında garanti olarak sunulmamalı.
- Dış sitelerde reload davranışı slot bazlı olmalı; varsayılan kapalı kalmalı.
- Slot validasyonunda URL normalize edilmeli, `javascript:`, `file:`, `chrome://` gibi desteklenmeyen/tehlikeli şemalar reddedilmeli.
- Dashboard Stop her koşulda merkezi `stopDashboard(reason)` üzerinden geçmeli; keepAwake release ve alarm cleanup tek yerde yapılmalı.
- Popup açık değilken runtime durum güncellemesi storage üzerinden izlenmeli; popup yalnız açıldığında state okumalı.
- README'ye eklenecek Dashboard bölümü teknik dürüstlük içermeli: power API ana yöntemdir, mouse simülasyonu garanti değildir, kurumsal ekran koruyucu için IT/kiosk istisnası önerilir.

## Son karar

`dashboard_gelistirme.md` promptu projeye uygundur ve doğru teknik yönü veriyor. Uygulama için en önemli değişiklik, promptu tek büyük iş olarak çalıştırmak yerine fazlara bölmek ve ilk fazda SCADA background daemon'u kapsam dışı bırakıp yalnız harita slotuna dönüşte güvenli refresh/cache davranışını almak olacaktır.

Bu yaklaşım mevcut SCADA/TPYS/RGDH işlevlerini korurken Dashboard Modu'nun değerini hızlıca üretir; SCADA'nın arka planda gerçekten kesintisiz güncel kalması ise ikinci/üçüncü fazda daha kontrollü yapılır.

## Resmi dokümantasyon notları

- Chrome `power` API: `display` seviyesi ekranın kapanmasını/kararmasını ve sistem uyumasını engeller. Kaynak: https://developer.chrome.com/docs/extensions/reference/api/power
- Chrome `alarms` API: Chrome 120 sonrası minimum alarm aralığı 30 saniyedir; daha kısa delay/period garanti edilmez. Kaynak: https://developer.chrome.com/docs/extensions/reference/api/alarms
- MV3 service worker lifecycle: global değişkenler service worker kapanınca kaybolur; state storage'a yazılmalıdır. Kaynak: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- Chrome `windows.update`: pencere state'i `fullscreen` yapılabilir. Kaynak: https://developer.chrome.com/docs/extensions/reference/api/windows
- Chrome `tabs.update`: `active: true` sekmeyi aktif yapar, pencere odağını ayrıca `windows.update` etkiler. Kaynak: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome permissions listesi: `power`, `alarms`, `scripting`, `storage`, `tabs` izinleri listelenir; ayrı bir `windows` permission yoktur. Kaynak: https://developer.chrome.com/docs/extensions/reference/permissions-list
- Page Lifecycle API: hidden/frozen/discarded sayfalarda timer ve fetch callback'leri çalışmayabilir. Kaynak: https://developer.chrome.com/docs/web-platform/page-lifecycle-api
