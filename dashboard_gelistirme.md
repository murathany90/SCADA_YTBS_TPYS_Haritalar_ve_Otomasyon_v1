# Dashboard Modu Geliştirme Promptu

Bu prompt sıfır bir Codex/IDE agent oturumuna verilecektir. Bu nedenle bütün bağlamı kendi içinde taşır. Önce mevcut projeyi analiz et, sonra aşağıdaki fazlı plana göre uygulama yap. Gereksiz refactor yapma; mevcut SCADA, harita, TPYS, RGDH ve CSV otomasyon davranışlarını koru.

## Kısa Görev

Chrome Extension Manifest V3 projesine "Dashboard Modu" ekle.

Dashboard Modu aktifken:

1. Eklentinin `map-modern.html` harita sekmesi ve kullanıcı tarafından tanımlanan en fazla 5 dış Chrome sekmesi arasında otomatik geçiş yapılacak.
2. Her slotta ayarlanan süre kadar kalınacak.
3. Dashboard'un çalıştığı Chrome penceresi fullscreen olacak.
4. Dış sitelerin DOM fullscreen API'sine güvenilmeyecek.
5. Aktif sekme `chrome.tabs.update(tabId, { active: true })` ile değiştirilecek.
6. Pencere `chrome.windows.update(windowId, { state: "fullscreen" })` ile fullscreen yapılacak.
7. Ekranın kapanmaması için ana yöntem olarak `chrome.power.requestKeepAwake("display")` kullanılacak.
8. Dashboard durduğunda, hata aldığında veya recover/cleanup gerektiğinde `chrome.power.releaseKeepAwake()` çağrılacak.
9. Kurumsal 15 dakikalık ekran koruyucu politikası nedeniyle ayarlarda ayrıca manuel fare hareketi simülasyonu seçeneği bulunacak; bu yalnız best-effort fallback olacak, garanti yöntem gibi sunulmayacak.
10. Dashboard popup üzerinden Play/Stop butonlarıyla kontrol edilecek.
11. ESC veya fullscreen'den çıkış Dashboard'u güvenli biçimde durduracak.

## Mevcut Proje Bağlamı

Projeyi uygulamaya başlamadan doğrula. Beklenen yapı:

- MV3 Chrome Extension.
- `manifest.json`: extension manifest.
- `background.js`: MV3 service worker, RGDH/TPYS/SCADA background işleri.
- `popup.html`, `popup.js`, `popup.css`: popup arayüzü.
- `map-modern.html`, `map-modern.js`, `map-modern.css`: modern harita ekranı.
- `scada-client.js`, `scada-v2-runtime.js`, `scada-flow.js`, `scada-common.js`: SCADA veri/fetch/render katmanları.
- `README.md`: proje dokümantasyonu.
- `tests/`: Node test runner ve smoke testler.

Uygulama öncesi şu dosyaları özellikle oku:

- `manifest.json`
- `background.js`
- `popup.html`
- `popup.js`
- `popup.css`
- `map-modern.html`
- `map-modern.js`
- `scada-v2-runtime.js`
- `scada-client.js`
- `README.md`
- `tests/background.test.js`
- `tests/popup-html.test.js`
- `tests/smoke-extension.cjs`

## Kritik Mimari Kararlar

### Fullscreen

DOM fullscreen kullanılmayacak. Şunları ana yöntem yapma:

- `element.requestFullscreen()`
- dış sitelerin kendi sayfa içi fullscreen davranışları
- dış sitelere fullscreen zorlayan injection

Doğru yöntem:

1. Dashboard'un çalışacağı Chrome penceresini seç.
2. Önceki pencere state'ini kaydet.
3. `chrome.windows.update(windowId, { state: "fullscreen" })` çağır.
4. Hangi slot gösterilecekse o tabı `chrome.tabs.update(tabId, { active: true })` ile aktif et.
5. Gerekiyorsa pencere odağını korumak için `chrome.windows.update(windowId, { focused: true })` davranışını değerlendir.

### Power API

Ana ekran açık tutma yöntemi Chrome resmi power API'dir:

```js
chrome.power.requestKeepAwake("display")
```

Stop/cleanup sırasında:

```js
chrome.power.releaseKeepAwake()
```

`"display"` seviyesi, dashboard ekranı için `"system"` seviyesinden daha uygundur; ekranın kapanmasını/kararmasını da engellemeyi hedefler.

Power API başarısız olursa Dashboard tamamen durmak zorunda değildir; kullanıcıya açık uyarı göster, logla, ama mümkünse sekme döngüsünü sürdür.

### MV3 State

MV3 service worker kapanıp yeniden açılabilir. Bu yüzden:

- Uzun süreli global değişkenlere güvenme.
- Runtime state'i `chrome.storage.local` içinde sakla.
- Alarm tetiklenince state'i storage'dan yeniden oku.
- Service worker yeniden başladığında `recoverRuntimeStateOnStartup()` çalıştır.
- Eski `running=true` state'i bulunursa varsayılan davranış güvenli cleanup olmalı: alarm temizle, `releaseKeepAwake()` çağır, runtime'ı stopped/recovered durumuna çek. Otomatik devam ayrı ayar olmadan yapılmamalı.

### Zamanlayıcı

Ana slot geçişleri `chrome.alarms` ile planlanmalı.

- `0` saniye: slotu atla.
- `1-29` saniye: yalnız best-effort/dev davranışı; üretim güvenilirliği vaat etme.
- `30-600` saniye: güvenilir dashboard aralığı.
- Varsayılan bekleme süresi: `120` saniye.
- `nextSwitchAt` storage'da saklanmalı.
- Alarm geç tetiklenirse `Date.now() >= nextSwitchAt` kontrolüyle sıradaki slot gösterilmeli.

### İzinler

Manifest'i minimum riskle güncelle.

Mevcut izinleri önce analiz et. Bu proje zaten `tabs`, `storage`, `alarms`, `scripting` ve geniş `host_permissions` kullanıyor olabilir.

Yapılacaklar:

- `"power"` iznini ekle.
- `"tabs"`, `"storage"`, `"alarms"` zaten varsa koru.
- `"scripting"` yalnız mevcut proje veya ESC/content script ihtiyacı için varsa koru; sırf dashboard için gereksiz injection yapma.
- Chrome'da ayrı bir `"windows"` manifest izni yoktur; resmi permissions listesine göre gerekmiyorsa ekleme. `chrome.windows` API kullanımını mevcut `tabs`/host permission etkileriyle değerlendir.
- Projede zaten `<all_urls>` varsa bu fazda yeni geniş izin ekleme ve mevcut izinleri daraltma refactor'una girme. Permission hardening ayrı faz olarak raporlanmalı; Dashboard implementasyonu mevcut TPYS/RGDH content script davranışlarını kırmamalı.
- Dış sitelerde ESC yakalamak için content script gerekiyorsa önce güvenli whitelist yaklaşımı tasarla. Dashboard için yeni `<all_urls>` bağımlılığı ekleme.

## Uygulama Stratejisi

Bu işi tek devasa patch olarak yapma. Fazlı ilerle.

### Faz 1 - Çekirdek Dashboard

Bu faz ana kabul değeri üretmelidir.

Kapsam:

- `dashboard-controller.js` ekle.
- `background.js` içine yalnız import/delegation ekle.
- Manifest'e `"power"` ekle.
- `dashboardSettings` ve `dashboardRuntime` storage şemalarını ekle.
- Dashboard start/stop mesajlaşmasını ekle.
- Slot resolution ve tab switching ekle.
- Pencere fullscreen geçişini ekle.
- KeepAwake start/stop entegrasyonunu ekle.
- `chrome.alarms` tabanlı slot scheduler ekle.
- Popup'a Play/Stop/Ayarlar butonları ve runtime state göstergesi ekle.
- Minimum SCADA güvence: harita slotuna dönüldüğünde harita sekmesine "dashboard map slot active" mesajı gönder ve mevcut overdue/refresh davranışını güvenli şekilde tetikle.
- Unit testleri ekle.

Faz 1 sonunda `npm test` çalışmalı.

### Faz 2 - UI, ESC, Diagnostic

Kapsam:

- Ayrı Dashboard Ayarları sayfası ekle:
  - `dashboard-settings.html`
  - `dashboard-settings.js`
  - `dashboard-settings.css`
- Popup'taki Ayarlar butonu bu sayfayı açsın.
- Harita extension page içinde ESC listener ekle.
- Fullscreen exit detection ekle.
- Son 100 kayıtlık dashboard log/diagnostic ekle.
- Dış sitelerde ESC gerekiyorsa sadece tanımlı dashboard domainleri için güvenli content script/injection tasarla.
- Extension smoke testini dashboard akışını kapsayacak şekilde genişlet.

### Faz 3 - SCADA Dayanıklılığı

Bu faz daha büyük ve risklidir. Faz 1/2 tamamlanmadan tam background SCADA daemon'a girme.

Minimum davranış Faz 1'de sağlanmalı:

- Harita sekmesi dashboard döngüsünde arka planda kalsa bile harita slotuna dönüldüğünde overdue SCADA refresh tetiklenmeli.
- Son mevcut snapshot/state varsa harita bunu korumalı; fetch başarısızsa kullanıcıya bayat/önbellek durumu dürüstçe gösterilmeli.

İleri davranış:

- Son başarılı SCADA snapshot'ı JSON dostu formata serialize et.
- `chrome.storage.local` içine yaz.
- Harita açılışında önce snapshot restore, sonra canlı fetch uygula.
- Background `chrome.alarms` tabanlı SCADA refresh daemon'u ayrıca tasarla.
- Bu faz mevcut SCADA kontratını etkileyebileceği için kapsamlı test yaz.

## Yeni Dosya ve Modül Önerisi

Tercih edilen yapı:

- `dashboard-controller.js`
- `dashboard-settings.html`
- `dashboard-settings.js`
- `dashboard-settings.css`
- `tests/dashboard-controller.test.js`
- `tests/dashboard-settings.test.js`

`background.js` fazla büyütülmemeli.

Önerilen service worker entegrasyonu:

```js
try {
  if (typeof importScripts === 'function') importScripts('dashboard-controller.js');
} catch (error) {
  console.warn('[Dashboard] Controller yuklenemedi.', error?.message || error);
}
```

`dashboard-controller.js` test edilebilir olmalı. Tarayıcıda `globalThis.DASHBOARD_CONTROLLER` gibi bir namespace'e bağlanabilir; Node test ortamında saf helper fonksiyonları import/eval edilebilir şekilde tasarlanmalı.

## Storage Şemaları

### dashboardSettings

`chrome.storage.local` anahtarı: `dashboardSettings`

Önerilen şema:

```js
{
  schemaVersion: 1,
  enabled: false,

  fullscreenMode: "browserWindow",
  keepAwakeEnabled: true,
  keepAwakeLevel: "display",

  mouseJiggleEnabled: false,
  mouseJiggleIntervalMinutes: 10,

  stopOnEsc: true,
  stopOnFullscreenExit: true,

  openMissingTabs: true,
  reloadTabOnShow: false,
  restorePreviousWindowStateOnStop: true,
  restorePreviousActiveTabOnStop: true,
  autoResumeAfterBrowserRestart: false,

  slots: [
    {
      id: "map",
      label: "SCADA Harita",
      type: "extension-map",
      url: "",
      path: "map-modern.html",
      matchPattern: "map-modern.html",
      waitSeconds: 120,
      enabled: true,
      reloadOnShow: false
    },
    {
      id: "windy",
      label: "Windy",
      type: "external",
      url: "https://www.windy.com/",
      matchPattern: "https://www.windy.com/*",
      waitSeconds: 120,
      enabled: true,
      reloadOnShow: false
    },
    {
      id: "testritm",
      label: "TEIAS Test RITM",
      type: "external",
      url: "https://testritm.teias.gov.tr/",
      matchPattern: "https://testritm.teias.gov.tr/*",
      waitSeconds: 120,
      enabled: true,
      reloadOnShow: false
    },
    {
      id: "slot4",
      label: "Dashboard 4",
      type: "external",
      url: "",
      matchPattern: "",
      waitSeconds: 120,
      enabled: false,
      reloadOnShow: false
    },
    {
      id: "slot5",
      label: "Dashboard 5",
      type: "external",
      url: "",
      matchPattern: "",
      waitSeconds: 120,
      enabled: false,
      reloadOnShow: false
    },
    {
      id: "slot6",
      label: "Dashboard 6",
      type: "external",
      url: "",
      matchPattern: "",
      waitSeconds: 120,
      enabled: false,
      reloadOnShow: false
    }
  ]
}
```

Önemli:

- Extension map slotunda `chrome-extension://...` sabit URL storage'a yazılmamalı.
- Harita URL'si çalışma anında `chrome.runtime.getURL("map-modern.html")` ile üretilmeli. Extension id unpacked/build ortamında değişebilir.
- URL validasyonunda `javascript:`, `file:`, `chrome://`, `chrome-extension://` dış kaynak slotlarında reddedilmeli.
- External slot URL boşsa slot disabled sayılmalı veya validasyon hatası gösterilmeli.
- `waitSeconds` 0-600 aralığında olmalı.
- `mouseJiggleIntervalMinutes` 3-15 aralığında olmalı.

### dashboardRuntime

`chrome.storage.local` anahtarı: `dashboardRuntime`

Önerilen şema:

```js
{
  schemaVersion: 1,
  running: false,
  status: "stopped",
  startedAt: null,
  stoppedAt: null,
  stopReason: "",

  windowId: null,
  previousWindowState: null,
  previousActiveTabId: null,

  currentSlotIndex: 0,
  currentSlotId: "",
  currentSlotLabel: "",
  nextSwitchAt: null,

  resolvedTabs: {},
  skippedSlots: {},

  keepAwakeRequested: false,
  mouseJiggleActive: false,

  lastError: null,
  lastActivityAt: null,
  recoveredAt: null,
  cycleCount: 0
}
```

### dashboardLogs

`chrome.storage.local` anahtarı: `dashboardLogs`

- Son 100 kayıt sakla.
- Hassas credential, cookie, token, Authorization header, URL query token loglama.
- Log formatı:

```js
{
  at: 1710000000000,
  level: "info",
  event: "slot-switched",
  message: "Windy slot aktif edildi.",
  detail: { slotId: "windy" }
}
```

## Controller Sorumlulukları

`dashboard-controller.js` içinde en az şu sorumluluklar olmalı:

1. `getDefaultDashboardSettings()`
2. `normalizeDashboardSettings(settings)`
3. `validateDashboardSettings(settings)`
4. `loadDashboardSettings()`
5. `saveDashboardSettings(settings)`
6. `loadDashboardRuntime()`
7. `saveDashboardRuntime(runtimePatch)`
8. `appendDashboardLog(event)`
9. `startDashboard(options)`
10. `stopDashboard(reason)`
11. `recoverRuntimeStateOnStartup()`
12. `resolveDashboardTabs(settings, runtime)`
13. `resolveMapSlotTab(windowId)`
14. `resolveExternalSlotTab(slot, windowId)`
15. `ensureDashboardWindowFullscreen(runtime, settings)`
16. `switchToSlot(slotIndexOrId)`
17. `findNextEnabledSlot(settings, currentIndex)`
18. `scheduleNextSwitch(runtime, settings)`
19. `handleDashboardAlarm(alarm)`
20. `startKeepAwake(settings)`
21. `stopKeepAwake()`
22. `startMouseJiggleFallback(settings)`
23. `stopMouseJiggleFallback()`
24. `handleEscStop(source)`
25. `handleFullscreenExitCheck()`
26. `notifyDashboardStateChanged(runtime)`

Alarm adları sabit olsun:

```js
const DASHBOARD_SWITCH_ALARM = "dashboard.switch";
const DASHBOARD_MOUSE_JIGGLE_ALARM = "dashboard.mouseJiggle";
const DASHBOARD_FULLSCREEN_CHECK_ALARM = "dashboard.fullscreenCheck";
```

## Start Akışı

Popup Play butonuna basınca:

1. `popup.js`, background'a mesaj göndersin:

```js
{ type: "DASHBOARD_START" }
```

2. Controller settings'i storage'dan okusun ve normalize etsin.
3. En az bir enabled ve `waitSeconds > 0` slot olduğunu doğrulasın.
4. Aktif Chrome penceresini ve aktif tabı bulsun.
5. Dashboard için hedef `windowId` kaydedilsin.
6. Önceki pencere state'i ve aktif tab id kaydedilsin.
7. Slot tabları çözülsün:
   - Map slotu için `chrome.runtime.getURL("map-modern.html")` kullan.
   - Map tabı yoksa hedef pencerede aç.
   - External slot için önce hedef pencerede mevcut tab ara.
   - Bulunamazsa `openMissingTabs=true` ise hedef pencerede inactive tab aç.
   - Bulunamazsa ve `openMissingTabs=false` ise slotu skip et ve logla.
8. Hedef pencere fullscreen yapılsın.
9. `keepAwakeEnabled=true` ise `chrome.power.requestKeepAwake("display")` çağrılıp runtime'a `keepAwakeRequested=true` yazılsın.
10. `mouseJiggleEnabled=true` ise mouse fallback alarmı başlatılsın.
11. İlk aktif slot gösterilsin.
12. Harita slotu gösteriliyorsa harita tabına dashboard visible mesajı gönderilsin.
13. `nextSwitchAt` hesaplanıp storage'a yazılsın.
14. `chrome.alarms` ile sıradaki geçiş planlansın.
15. Popup'a güncel runtime dönsün.

## Stop Akışı

Stop şu kaynaklardan gelebilir:

- Popup Stop butonu.
- Harita ESC listener.
- Dış slot content script ESC listener.
- Fullscreen exit detection.
- Hata/recover cleanup.

Her durumda tek merkez:

```js
stopDashboard(reason)
```

Stop akışı:

1. Dashboard alarm'larını temizle:
   - `dashboard.switch`
   - `dashboard.mouseJiggle`
   - `dashboard.fullscreenCheck`
2. `keepAwakeRequested` true ise `chrome.power.releaseKeepAwake()` çağır.
3. Mouse fallback'i durdur.
4. Runtime'ı `running=false`, `status="stopped"`, `stopReason=reason`, `stoppedAt=Date.now()` olarak yaz.
5. `restorePreviousActiveTabOnStop=true` ise önceki tab hala varsa aktif et.
6. `restorePreviousWindowStateOnStop=true` ise pencereyi eski state'e döndür. Eski state bilinmiyorsa zorlamama.
7. State değişimini popup/settings/map ekranlarına bildirmeyi dene.
8. Hata olsa bile cleanup kalan adımları bozmasın; `try/finally` veya merkezi cleanup kullan.

## Slot Geçiş Algoritması

Kurallar:

- Sadece `enabled=true` ve `waitSeconds > 0` olan slotlar döngüye girer.
- `waitSeconds=0` slotu atlanır.
- Sıradaki slotun tabı kapanmışsa:
  - `openMissingTabs=true`: yeniden aç.
  - `openMissingTabs=false`: skip + log.
- Slot aktif edilmeden önce pencere state kontrol edilir.
- Pencere fullscreen değilse:
  - `stopOnFullscreenExit=true`: `stopDashboard("fullscreen-exit")`
  - false ise tekrar fullscreen yapmayı dene ve logla.
- `reloadOnShow=true` ise tab reload edilebilir, fakat varsayılan kapalı kalmalı.
- Dış sitelerde çok sık reload yapma.
- Slot değiştiğinde runtime'da `currentSlotIndex`, `currentSlotId`, `currentSlotLabel`, `nextSwitchAt`, `lastActivityAt`, `cycleCount` güncellenmeli.

## Pencere ve Tab Sahipliği

Dashboard için tek pencere sahipliği kuralı kullan:

- Start sırasında hedef `windowId` belirlenir.
- Yeni açılan slot tabları bu pencerede açılır.
- Başka penceredeki kullanıcı tablarını otomatik taşımak risklidir; varsayılan olarak taşıma yapma.
- Hedef pencerede eşleşen tab yoksa ve `openMissingTabs=true` ise aynı URL ile yeni tab aç.
- İleride "mevcut tabı hedef pencereye taşı" ayrı ayar olabilir, bu geliştirme kapsamına alma.

`autoDiscardable: false` dashboard tabları için değerlendirilebilir, ama bellek baskısında garanti olarak sunulmasın.

## ESC ile Durdurma

ESC güvenilir tek durdurma mekanizması değildir. Katmanlı uygula:

1. `map-modern.html` / `map-modern.js` içinde keydown listener:

```js
if (event.key === "Escape") {
  chrome.runtime.sendMessage({ type: "DASHBOARD_STOP", reason: "esc-map" });
}
```

2. Dış domainlerde ESC gerekiyorsa yalnız izinli/whitelist slot domainlerinde content script veya `chrome.scripting.executeScript` yaklaşımı kullan.
3. Browser fullscreen ESC'yi tüketebilir; bu yüzden fullscreen exit detection şart.
4. Popup Stop her zaman ana güvenilir manuel durdurma yolu olmalı.

## Fullscreen Exit Detection

Dashboard running iken:

- Slot geçişlerinde pencere state'i kontrol et.
- Düşük frekanslı alarm veya schedule ile fullscreen check yap.
- `chrome.windows.get(windowId)` ile `state` oku.
- `state !== "fullscreen"` ve `stopOnFullscreenExit=true` ise `stopDashboard("fullscreen-exit")`.

Bu kontrol sık ve pahalı olmamalı.

## Mouse Jiggle Fallback

Bu özellik kullanıcı isteği nedeniyle bulunacak, ama garanti yöntem olarak uygulanmayacak.

Ayarlar:

- `mouseJiggleEnabled`: boolean, default `false`
- `mouseJiggleIntervalMinutes`: 3-15, default `10`

UI metni açık olsun:

> Ekranı açık tutmak için ana yöntem Chrome power API'dir. Fare hareketi simülasyonu kurum politikası veya işletim sistemi düzeyindeki ekran koruyucuyu her zaman engellemeyebilir. Bu seçenek yalnız ek deneme/fallback olarak kullanılır.

Teknik sınırlar:

- Chrome extension gerçek işletim sistemi faresini güvenilir şekilde hareket ettiremez.
- Sentetik `MouseEvent` OS idle state'i sıfırlamayabilir.
- Native Messaging veya harici uygulama gerekiyorsa bunu yalnız README/not seviyesinde belirt; bu geliştirme kapsamına alma.
- Fallback başarısız olursa Dashboard durmamalı; sadece logla.

Uygulama:

- Alarm ile 3-15 dakika arası tetikle.
- Aktif dashboard tabında güvenli sentetik event dene.
- Dış site injection izni yoksa deneme yapma, logla.

## Dashboard Ayarları UI

Yeni sayfa önerisi:

- `dashboard-settings.html`
- `dashboard-settings.js`
- `dashboard-settings.css`

Bu sayfa popup'tan "Ayarlar" butonuyla açılmalı.

Ayarlar ekranı:

1. Genel ayarlar:
   - Keep Awake aktif
   - Fullscreen aktif
   - ESC ile durdur
   - Fullscreen'den çıkınca durdur
   - Eksik sekmeleri otomatik aç
   - Stop sonrası pencereyi eski haline döndür
   - Stop sonrası eski aktif sekmeye dön
2. Fare hareketi fallback:
   - Aktif/Pasif
   - Aralık: 3-15 dakika
   - Açık uyarı metni
3. Slot tablosu:
   - Sıra
   - Aktif/Pasif
   - Etiket
   - URL
   - Match pattern
   - Bekleme süresi: 0-600 saniye
   - Gösterirken yenile
4. Aksiyonlar:
   - Kaydet
   - Varsayılana dön
   - Ayarları test et / sekmeleri doğrula

Validasyon:

- URL boşsa external slot disabled olmalı veya kaydetme hatası göstermeli.
- `waitSeconds` 0-600 dışında kaydedilmemeli.
- `mouseJiggleIntervalMinutes` 3-15 dışında kaydedilmemeli.
- Unsupported URL scheme reddedilmeli.

## Popup UI

`popup.html` içine Dashboard kartı ekle. Mevcut popup stiline uy.

Kartta:

- Başlık: Dashboard Modu
- Play butonu
- Stop butonu
- Ayarlar butonu
- Çalışma durumu
- Aktif slot etiketi
- Sonraki geçiş zamanı veya kalan süre
- Son hata kısa mesajı

Davranış:

- Popup açıldığında `DASHBOARD_GET_STATE` ile runtime oku.
- Running ise Play disabled, Stop enabled.
- Stopped ise Play enabled, Stop disabled.
- Play/Stop sonuçlarını popup log alanında veya status alanında anlaşılır göster.

## SCADA Harita Slotu

SCADA harita Dashboard slotlarından biridir.

Map slot çözümü:

- URL runtime'da `chrome.runtime.getURL("map-modern.html")` ile oluştur.
- Var olan hedef pencere tabı bulunursa kullan.
- Yoksa hedef pencerede aç.

Harita slotu aktif olduğunda:

- Harita tabına mesaj gönder:

```js
{
  type: "DASHBOARD_MAP_SLOT_ACTIVE",
  payload: { at: Date.now() }
}
```

Map runtime tarafında:

- Bu mesaj alınırsa mevcut SCADA auto refresh/overdue mekanizması güvenli şekilde tetiklensin.
- Eğer SCADA disabled ise hiçbir şeyi zorlamasın.
- Eğer fetch zaten sürüyorsa yeni fetch başlatmasın; mevcut pending/overdue davranışı kullansın.
- Kullanıcıya "dashboard dönüşü veri yenileme deneniyor" gibi kısa, dürüst durum mesajı verilebilir.

## SCADA Arka Plan Veri Stratejisi

Mevcut SCADA fetch/render davranışı harita sayfası runtime'ına bağlı olabilir. Arka plan sekmelerinde JS timer/fetch davranışı yavaşlayabilir veya beklemeye alınabilir.

Bu nedenle:

### Minimum Kabul Edilebilir Davranış

Bu geliştirmede en az şunlar sağlanmalı:

- Harita sekmesi 15+ dakika arka planda kalsa bile harita slotuna dönüldüğünde overdue refresh tetiklenmeli.
- Fetch sürüyorsa ikinci fetch başlatılmamalı.
- Son veri varsa korunmalı.
- Fetch başarısızsa kullanıcı son durumu bayat/uyarı olarak görmeli.

### İleri Faz

Tam dayanıklılık için ayrı fazda:

- SCADA veri çekme işi background alarms scheduler'a taşınmalı veya background'dan periyodik tetiklenmeli.
- Son başarılı SCADA snapshot `chrome.storage.local` içine JSON dostu formatta yazılmalı.
- Harita açılışında önce snapshot restore edilmeli, sonra canlı refresh denenmeli.
- Render işi harita görünürken yapılmalı; veri fetch işi background'da kalmalı.

Bu ileri faz mevcut SCADA kontratını büyütür; Faz 1/2'yi bitirmeden bu refactor'a girme.

## Hata Yönetimi

Şu durumlar açık ve güvenli yönetilmeli:

- Hiç aktif slot yok: Dashboard başlatma, kullanıcıya hata göster.
- Fullscreen başarısız: Hata göster; ayara göre normal pencerede devam edip etmeme kararını netleştir. Varsayılan olarak başlatmayı başarısız saymak daha güvenli.
- KeepAwake başarısız: Uyarı/log; sekme döngüsü mümkünse devam edebilir.
- Mouse fallback başarısız: Sadece log; Dashboard devam eder.
- Tab kapanmış: Ayara göre yeniden aç veya skip et.
- Storage bozuk: Defaults'a dön, logla.
- Service worker recover: Güvenli stop + cleanup.

## Test Planı

Mevcut test altyapısını bozma. Yeni testleri küçük ve odaklı yaz.

Önerilen dosyalar:

- `tests/dashboard-settings.test.js`
- `tests/dashboard-controller.test.js`
- `tests/popup-html.test.js` genişletmesi
- `tests/background.test.js` genişletmesi
- `tests/smoke-extension.cjs` dashboard smoke genişletmesi

Test alanları:

1. Settings validation:
   - `waitSeconds` 0-600
   - `mouseJiggleIntervalMinutes` 3-15
   - boş external URL davranışı
   - unsupported URL scheme reddi
   - disabled slot skip
2. Slot selection:
   - 0 saniye slot atlanır
   - disabled slot atlanır
   - sıradaki aktif slot bulunur
   - map slot URL runtime'da üretilir
3. Runtime state:
   - start `running=true` yazar
   - stop `running=false` yazar
   - `nextSwitchAt` hesaplanır
   - recover eski `running=true` state'i güvenli stop'a çeker
4. Permission-safe behavior:
   - `power.requestKeepAwake("display")` mock edilir
   - `power.releaseKeepAwake()` stop/recover sırasında çağrılır
   - gereksiz `"windows"` permission eklenmez
5. SCADA minimum fallback:
   - map slot aktif olduğunda harita tabına `DASHBOARD_MAP_SLOT_ACTIVE` mesajı gönderilir
   - fetch sürüyorsa yeniden fetch başlatılmaz
6. Popup state:
   - running ise Play disabled, Stop enabled
   - stopped ise Play enabled, Stop disabled
   - Ayarlar butonu doğru sayfayı açar

Smoke test senaryosu:

1. Extension yükle.
2. Popup aç.
3. Dashboard Ayarları'nı aç.
4. Harita + 1-2 test URL slotu tanımla.
5. Kısa ama güvenilir süreler kullan; 30 saniye altını smoke için best-effort say.
6. Play'e bas.
7. Pencerenin fullscreen olduğunu doğrula.
8. Aktif tab değişimini doğrula.
9. Stop'a bas.
10. `releaseKeepAwake` cleanup davranışını mock/log üzerinden doğrula.
11. Pencere eski state'e dönüyor mu kontrol et.
12. ESC/fullscreen exit durdurma davranışını test et.

## Kabul Kriterleri

Faz 1 kabul kriterleri:

- Dashboard ayar defaults ve validation çalışıyor.
- Popup'ta Dashboard kartı var.
- Play Dashboard'u başlatıyor.
- Stop Dashboard'u durduruyor.
- Dashboard penceresi Chrome window fullscreen oluyor.
- Slotlar DOM fullscreen kullanılmadan aktif tab switching ile gösteriliyor.
- `chrome.power.requestKeepAwake("display")` start sırasında çağrılıyor.
- `chrome.power.releaseKeepAwake()` stop ve recover cleanup sırasında çağrılıyor.
- `chrome.alarms` ile sıradaki geçiş planlanıyor.
- Runtime state `chrome.storage.local` içinde tutuluyor.
- Service worker global state'e güvenilmiyor.
- Map slotuna dönüldüğünde SCADA overdue/refresh mesajı güvenli tetikleniyor.
- Mevcut SCADA/TPYS/RGDH/harita davranışları bozulmuyor.
- `npm test` geçiyor.

Faz 2 kabul kriterleri:

- Dashboard Ayarları sayfası çalışıyor.
- Slotlar 0-600 saniye arası ayarlanabiliyor.
- Mouse fallback 3-15 dakika arası ayarlanabiliyor.
- ESC veya fullscreen exit Dashboard'u durduruyor.
- Son 100 log storage'da tutuluyor.
- Extension smoke test dashboard akışını kapsıyor.

Faz 3 kabul kriterleri:

- Son başarılı SCADA snapshot storage'a yazılıyor.
- Harita açılışında snapshot restore ediliyor.
- Canlı fetch başarısızsa son snapshot bayat/önbellek etiketiyle korunuyor.
- Background SCADA refresh varsa `chrome.alarms` ve storage üzerinden çalışıyor.

## README Güncellemesi

README'ye "Dashboard Modu" bölümü ekle.

Açıkla:

- Dashboard penceresi fullscreen yapılır.
- Aktif sekme değiştirilir.
- DOM fullscreen kullanılmaz.
- Ekranı açık tutmak için `chrome.power.requestKeepAwake("display")` kullanılır.
- Stop edildiğinde `releaseKeepAwake()` çağrılır.
- Fare hareketi simülasyonu yalnız best-effort fallback'tir.
- Kurumsal ekran koruyucu politikaları işletim sistemi/IT politikası seviyesinde davranabilir.
- En güvenilir kullanım için IT tarafından dashboard/kiosk istisnası önerilir.
- SCADA arka plan verisi için minimum davranış ve ileri snapshot/cache yaklaşımı açıklanır.

## Uygulama Sırası

1. Repo durumunu ve mevcut değişiklikleri kontrol et; kullanıcı değişikliklerini revert etme.
2. Manifest, background, popup, map ve SCADA runtime dosyalarını analiz et.
3. Faz 1 için kısa uygulama planı çıkar.
4. `dashboard-controller.js` helper/controller modülünü yaz.
5. Dashboard settings/runtime/log storage helperlarını ekle.
6. Background import ve runtime message delegation ekle.
7. `chrome.alarms.onAlarm` dashboard delegation ekle.
8. Manifest'e yalnız gerekli `"power"` iznini ekle.
9. Popup Dashboard kartını ekle.
10. Start/Stop akışını bağla.
11. Fullscreen window ve tab switching davranışını ekle.
12. KeepAwake start/stop cleanup davranışını ekle.
13. Map slot active mesajı ve SCADA overdue minimum tetiklemeyi ekle.
14. Unit testleri yaz ve çalıştır.
15. Faz 2 UI/settings/ESC/log işlerini uygula.
16. Smoke testleri güncelle.
17. README'yi güncelle.
18. `npm test` çalıştır.
19. Mümkünse `npm run smoke:extension` çalıştır.
20. Sonuçta değişen dosyaları, test çıktılarını ve varsa kalan riskleri raporla.

## Kod Yazarken Dikkat

- Hassas credential, cookie, bearer token veya auth header loglama.
- Geniş host permission ekleme.
- Mevcut `<all_urls>` izinlerini bu fazda daraltıp TPYS/RGDH akışlarını kırma.
- Gereksiz `"windows"` permission ekleme.
- `chrome-extension://...` sabit map URL'sini storage'a yazma.
- Dashboard stop sırasında keepAwake release etmeyi unutma.
- Service worker global state'e güvenme.
- Çok sık tab reload yapma.
- Dış sitelere gereksiz script inject etme.
- Fare simülasyonunu garanti yöntem gibi sunma.
- SCADA polling/render performansını bozma.
- Background SCADA daemon'u Faz 1/2 tamamlanmadan büyük refactor olarak ele alma.
- Kullanıcıya açık, dürüst ve kısa durum mesajları göster.

## Resmi Dokümantasyon Kontrol Notları

Uygulama sırasında gerekirse resmi dokümanları kontrol et:

- Chrome power API: `chrome.power.requestKeepAwake("display")`
  https://developer.chrome.com/docs/extensions/reference/api/power
- Chrome alarms API: minimum alarm davranışı ve MV3 uyumu
  https://developer.chrome.com/docs/extensions/reference/api/alarms
- Extension service worker lifecycle
  https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- Chrome windows API: `state: "fullscreen"`
  https://developer.chrome.com/docs/extensions/reference/api/windows
- Chrome tabs API: `active: true`
  https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome permissions listesi
  https://developer.chrome.com/docs/extensions/reference/permissions-list
- Page Lifecycle API: hidden/frozen/discarded sekme davranışı
  https://developer.chrome.com/docs/web-platform/page-lifecycle-api
