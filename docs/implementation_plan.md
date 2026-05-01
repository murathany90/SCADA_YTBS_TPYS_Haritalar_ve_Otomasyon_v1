# implementation_plan.md

## Summary
- Bu plan yalnizca `TEYIT` ve `KISMI` olarak isaretlenen maddeleri kapsar.
- Varsayilan uygulama karari: canli SCADA runtime sahipligi `scada-v2-runtime.js` tarafinda tutulacak; `scada-flow.js` ve `scada-client.js` icindeki stale/duplikasyonlu legacy parcalar temizlenecek.

## Implementation Changes
- `BUG-07` - `background.js:112-174`: `fetchChartData()` icine `AbortController` tabanli istek zaman asimi, timeout hata tipi ve her durumda cleanup eklenecek.
- `BUG-05` - aktif yol `scada-v2-runtime.js:435-446, 1391-1406`, legacy yol `scada-client.js:543-560`: kapasite fallback'indeki `|| 1` kaldirilacak, kapasite bilinmiyorsa `loadingPct/displayPct = null` uretilecek ve renklendirme "bilinmiyor/no-data" akisina dusecek.
- `BUG-02` - aktif yol `scada-v2-runtime.js:3628-3694`, legacy referans `scada-flow.js:23-142`: `renderFlowLayer()` tam `innerHTML` reset yerine `data-flow-id` anahtarli incremental patch mantigina gececek.
- `OPT-03` - `background.js:176-185` ve auth retry cevresi `42-82`: CSRF token icin kisa omurlu in-memory cache eklenecek; `401/403` veya auth fallback sonrasi cache invalidation yapilacak.
- `OPT-07` - `build_kml_layers_v2.py:900-907`: `tm_points` icin dict index donguden once kurulacak, `childHatIds` baglama lineer arama yerine O(1) erisimle yapilacak.
- `BUG-01` - `scada-flow.js:281-336, 873-926, 1501-1636`; kanonik hedef `scada-v2-runtime.js:2194-2249`: `updateScadaCardUI` tek sahipli hale getirilecek, `scada-flow.js` icindeki uc kopya kaldirilacak ve cagrilar yalniz `scada-v2-runtime.js` icindeki final implementasyona birakilacak.
- `BUG-08` - `scada-flow.js:478-497, 604-640, 1282-1315, 1162-1189`: ranking CSV export zinciri teklesecek; tek `getFilteredFlows()` ve tek `exportRankingCsv()` birakilacak.
- `BUG-09` - legacy `scada-client.js:622-637`, aktif scheduler `scada-v2-runtime.js:1712-1777, 3697-3703`, manuel tetik `scada-flow.js:218-225`: polling sahipligi netlestirilecek; legacy interval kodu kaldirilacak veya no-op wrapper'a indirgenecek ve gizli sekmede manuel fetch icin acik policy uygulanacak.
- `OPT-06` - `scada-flow.js:388-467, 1191-1270`: ranking panel olusturma akisi tek `toggleRankingPanel()` implementasyonunda toplanacak.
- `OPT-05` - `popup.js:593-603` ve `popup.html:89`: popup tarafinda `map-common.js` `popup.js` oncesinde yuklenecek ve yerel `normalizeText()` kopyasi kaldirilip `MAP_COMMON.normalizeText` kullanilacak.
- `OPT-02` - `scada-client.js:602-607`: legacy history saklama icin `shift()` kullanan dizi yapisi sabit boyutlu ring buffer ile degistirilecek.

## Test Plan
- `background.js` icin: timeout senaryosunda `SCADA_FETCH` cagrisi kontrollu `TIMEOUT` hatasi dondurmelidir.
- SCADA kapasite senaryolari icin: kapasite bos oldugunda sahte yuklenme yuzdesi uretilmemeli, "bilinmiyor" akisi kullanilmalidir.
- Flow render icin: pan/zoom sirasinda `flowLayer` node kimlikleri stabil kalmali, yalniz delta kadar DOM guncellenmelidir.
- Ranking/panel deduplikasyonu icin: arama, KV filtresi, CSV export ve panel ac/kapa akislari tek implementasyonla ayni sonucu vermelidir.
- Builder performansi icin: `childHatIds` icerikleri ayni kalirken baglama maliyeti dusmelidir.
- Popup ortak helper icin: `normalizeText` kullanan mapping senaryolarinda davranis korunmalidir.

## Assumptions
- Canli SCADA UX ve render sahipligi `scada-v2-runtime.js` icinde tutulur; `scada-flow.js` ve `scada-client.js` uzerindeki karsiliklar legacy kabul edilir.
- `popup.html` icine `map-common.js` eklemek uzanti paketlemesi acisindan kabul edilebilir.
- `BUG-09` icin tercih edilen davranis, gizli sekmede manuel fetch'i sessizce calistirmak degil, kullaniciya mesaj verip tetigi ertelemektir.
