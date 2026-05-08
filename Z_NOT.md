## Soru

README.md dosyası verilen Chrome eklentisinde bir geliştirme yapılmak isteniyor. Lütfen kod yazmadan fikir ve analiz sunun. Eklentiye bir "Dashboard Modu" butonu eklenecek. Bu mod aktif edildiğinde, eklenti içindeki harita sekmesi ve tarayıcıda açık olan belirlenmiş diğer 5 sekme (örneğin; windy.com, testritm.teias.gov vb.) arasında, önceden ayarlanan süreler boyunca otomatik geçiş yapılacak ve her sayfa tam ekranda (full screen) gösterilecek. Ayrıca, kurum bilgisayarlarında zorunlu olan 15 dakikalık ekran koruyucunun devreye girmesini engellemek için, belirli aralıklarla manuel fare hareketi (ekranın kapanmasını önlemek adına 1-2 saniyelik rastgele hareketler) simüle edilecek. Ancak bu işlem için (ekran kapanmasını engellemek adına) farklı veya daha iyi bir öneriniz varsa onu da belirtin. Bu ayarların tümü eklentinin "Dashboard Ayarları" sekmesinden parametrik olarak yapılandırılabilecek. Örneğin: Hangi sıradaki sekmede 0-600 saniye arası ne kadar bekleneceği ve ekran uyanık tutma işleminin kaç dakikada bir yapılacağı seçilebilecek. Dashboard modu, eklentinin açılır penceresinden (popup) 'Play/Stop' butonları ile kontrol edilebilecek ve mod çalışırken 'ESC' tuşuna basıldığında otomatik olarak duracak. Bu gereksinimleri bütünüyle analiz edin ve nasıl yapılabileceğini açıklayın. Son olarak, eklentideki SCADA harita katmanının arka plandayken (diğer sekmeler gösterilirken) veri çekip çekemeyeceğini ve mevcut kurgunun bu senaryoda sorunsuz çalışıp çalışmayacağını analiz edin.
## Kısa sonuç
Bu geliştirme **Chrome eklentisi içinde yapılabilir**, fakat iki gereksinim aynı şekilde uygulanmamalı:

1. **Sekmeler arası otomatik geçiş:** Uygulanabilir. En doğru yaklaşım, eklentinin `background.js` / MV3 service worker tarafında bir “Dashboard Controller” çalıştırması, popup’taki Play/Stop komutlarının buraya gitmesi ve hedef sekmelerin `chrome.tabs` ile aktif edilmesidir. Mevcut proje zaten MV3, `background.js`, `popup.js`, `map-modern.html`, `scada-client.js` ve `scada-flow.js` ayrımıyla buna uygun bir temele sahip. 

2. **Her sayfayı tam ekran gösterme:** Dış sitelerde DOM seviyesinde `requestFullscreen()` ile garanti edilemez; Fullscreen API kullanıcı etkileşimi ister ve isteğin başarılı olması garanti değildir. Bunun yerine **Chrome penceresini fullscreen state’e almak** daha doğru olur. Chrome `windows` API, tarayıcı penceresinin durumunu `"fullscreen"` yapmayı destekler. ([MDN Web Docs][1])

3. **Fare hareketi simülasyonu:** Bunu önermem. Web/extension seviyesinde sentetik `mousemove` olayları işletim sisteminin gerçek idle durumunu güvenilir biçimde sıfırlamaz; gerçek OS imlecini hareket ettirmek de normal Chrome extension API’leriyle yapılacak temiz bir iş değildir. Bunun yerine, kurum politikası izin veriyorsa **`chrome.power.requestKeepAwake("display")`** kullanılmalı. Chrome’un resmi `power` API’si, ekranın kararmasını/kapanmasını ve sistemin uyumasını engellemek için özellikle bu kullanım senaryosunu destekler. ([Chrome for Developers][2])

---

## Önerilen mimari

Mevcut yapıya yeni bir **Dashboard Modu** üç parçayla eklenmeli:

**1. Popup kontrolü**

Popup’a “Dashboard Modu” kartı eklenir. Kartta yalnızca operasyonel kontroller olur:

* Play
* Stop
* Durum: Çalışıyor / Durdu / Hedef sekme bulunamadı / Fullscreen dışında
* O an gösterilen slot adı
* Bir sonraki geçişe kalan süre

Popup kalıcı bir runtime değildir; açılır pencere kapandığında çalışmaya devam etmesi gereken işleri popup’ta tutmamak gerekir. Popup sadece komut gönderir.

**2. Dashboard Ayarları sekmesi**

Eklenti içinde ayrı bir “Dashboard Ayarları” sayfası/sekmesi olmalı. Ayarlar `chrome.storage.local` içinde saklanmalı. README’de eklentinin zaten `chrome.storage.local` kullandığı ve MV3 mimarisiyle çalıştığı görülüyor; bu nedenle aynı desenle uyumludur. 

Önerilen ayarlar:

* Dashboard aktif/pasif varsayılanı
* Fullscreen stratejisi: önerilen değer `browserWindowFullscreen`
* Slot listesi:

  * Slot 1: SCADA harita sekmesi
  * Slot 2: windy.com
  * Slot 3: testritm.teias.gov.tr
  * Slot 4-6: diğer URL’ler
* Her slot için:

  * Etiket
  * URL veya URL eşleşme kuralı
  * Bekleme süresi: 0-600 saniye
  * 0 saniye davranışı: “atla” olarak tanımlanmalı
  * Sekme yoksa aç / hata ver
  * Gösterirken sayfayı yenile / yenileme
  * Gösterimden sonra bekleme süresi
* Ekranı uyanık tutma:

  * Açık/kapalı
  * `display` keep-awake seviyesi
  * Stop’ta otomatik release
* ESC davranışı:

  * ESC algılanırsa Dashboard Stop
  * Pencere fullscreen’den çıkarsa Dashboard Stop
* Hata toleransı:

  * Hedef sekme kapanırsa yeniden aç
  * Login sayfası görünürse slotu atla / bekle
  * Ağ hatasında sayfayı yenile

**3. Background Dashboard Controller**

Asıl durum makinesi `background.js` içinde veya ayrı bir `dashboard-controller.js` modülünde olmalı. Service worker’ın uzun süreli global değişkenlere güvenmemesi gerekir; Chrome MV3 service worker normalde 30 saniye inaktiviteden sonra sonlandırılabilir ve global değişkenler kaybolur. Bu yüzden çalışan durum, aktif slot, hedef windowId, hedef tabId’ler ve `nextAt` gibi bilgiler storage’a yazılmalıdır. ([Chrome for Developers][3])

---

## Sekme geçişi nasıl yapılmalı?

Başlangıçta Play’e basıldığında şu akış önerilir:

1. Mevcut aktif pencere ve sekme kaydedilir.
2. Ayarlardaki slot listesi okunur.
3. Her slot için mevcut sekme aranır.
4. Bulunamazsa ayara göre yeni sekme açılır veya slot hata durumuna alınır.
5. Dashboard için tek bir hedef Chrome penceresi belirlenir.
6. Bu pencere `fullscreen` yapılır.
7. İlk slot aktif edilir.
8. Slot süresi bitince sıradaki slot aktif edilir.
9. Stop geldiğinde alarm/timer temizlenir, keep-awake bırakılır, pencere normal/maximized eski hale döndürülür.

Chrome `tabs.update()` bir sekmenin özelliklerini değiştirmek ve sekmeyi aktif yapmak için kullanılabilir; `active` özelliği sekmeyi kendi penceresinde aktif yapar. ([Chrome for Developers][4])

Burada önemli ayrım şu: **Sekme değiştirmek için dış sayfaların içine müdahale etmek gerekmez.** Yalnızca dış sayfaya script enjekte edip ESC dinlemek, DOM fullscreen istemek veya sayfa içi özel davranış yapmak istenirse ilgili domain’ler için `host_permissions` gerekir.

Mevcut README’de manifest örneği `storage`, `tabs`, `scripting`, `cookies` izinleri ve Superset/TPYS host izinleriyle sınırlı görünüyor. Dış dashboard sitelerinde content script çalıştırılacaksa windy.com, testritm.teias.gov.tr gibi domain’ler ayrıca izin kapsamına alınmalıdır. 

---

## Fullscreen için doğru strateji

İki farklı fullscreen türünü ayırmak gerekir.

**DOM fullscreen:** Sayfanın kendi HTML elementini fullscreen yapar. Harita sayfası eklentiye ait olduğu için Play tıklamasının hemen ardından `map-modern.html` içinde denenebilir. Ancak dış siteler için güvenilir değildir; `requestFullscreen()` kullanıcı etkileşimi ister ve istek reddedilebilir. ([MDN Web Docs][1])

**Chrome window fullscreen:** Tarayıcı penceresini fullscreen yapar. Dashboard senaryosu için önerilen budur. Böylece hangi sekme aktifse o sekme tam ekran görünür. `chrome.windows` API’sinde `"fullscreen"` pencere durumu vardır; `chrome.windows.update()` ile pencere state’i değiştirilebilir. ([Chrome for Developers][5])

Bu nedenle gereksinimi şöyle yorumlamak daha sağlıklı olur: “Her sayfa kendi DOM fullscreen moduna alınacak” yerine, “Dashboard’un çalıştığı Chrome penceresi fullscreen olacak ve aktif sekme değiştirilecek.”

`locked-fullscreen` seçeneği normal kurumsal Windows Chrome kullanımında hedeflenmemeli; Chrome dokümanında bunun kullanıcı aksiyonuyla çıkılamayan, yalnızca allowlist edilmiş ChromeOS eklentileri için geçerli bir durum olduğu belirtiliyor. ([Chrome for Developers][5])

---

## Timer / süre yönetimi

Bu gereksinimde en hassas konu sürelerdir. Kullanıcı 0-600 saniye arası bekleme süresi istiyor. MV3 service worker içinde uzun `setTimeout` / global state’e güvenmek doğru değildir; service worker sonlanabilir. Chrome dokümanı, state’in global değişken yerine storage’a yazılmasını özellikle önerir. ([Chrome for Developers][3])

En sağlam yaklaşım:

* Dashboard state storage’da tutulur.
* Her slot için `nextAt` hesaplanır.
* `chrome.alarms` ile sıradaki geçiş planlanır.
* Alarm tetiklenince storage’dan son durum okunur, süre geçmişse sıradaki slot aktif edilir.
* Service worker yeniden başlasa bile state restore edilir.

Ancak bir pratik sınır var: Chrome alarms API, Chrome 120 itibarıyla minimum 30 saniye periyodu destekler; daha kısa süreler güvenilir alarm davranışı için uygun değildir ve alarm gecikebilir. ([Chrome for Developers][6])

Bu yüzden 0-600 saniye için tavsiyem:

* `0`: slotu atla.
* `1-29`: “hassas olmayan kısa gösterim” olarak desteklenebilir ama MV3’te garanti edilmemeli.
* `30-600`: güvenilir dashboard süresi olarak desteklenmeli.
* Operasyonel kullanımda varsayılan süreler 60, 120, 300 saniye gibi seçilmeli.

Eğer kurum gerçekten 5-10 saniyelik hassas döngü isterse, Chrome extension yerine kiosk/native yardımcı uygulama veya kurumsal kiosk modu daha doğru olur.

---

## Ekran koruyucu / ekran kapanmasını önleme

Fare hareketi simülasyonu yerine şu strateji önerilir:

**Dashboard Play:**

* `chrome.power.requestKeepAwake("display")`

**Dashboard Stop / hata / sekme kapanması / ESC:**

* `chrome.power.releaseKeepAwake()`

Chrome `power` API’de `"display"` seviyesi ekranın kapanmasını veya kararmasını ve sistemin uyumasını engellemek için tanımlıdır. `"system"` yalnızca sistemi uyanık tutar, ekranın kararmasına/kapanmasına izin verebilir; bu nedenle dashboard ekranı için `"display"` daha uygundur. ([Chrome for Developers][2])

`chrome.idle` API ise makinenin `active`, `idle`, `locked` durumlarını algılamak için kullanılabilir; ekranı açık tutan asıl mekanizma değildir. Bu nedenle `idle` yalnızca izleme/diagnostic için opsiyonel kullanılmalı. ([Chrome for Developers][7])

Kurumsal 15 dakikalık ekran koruyucu bir güvenlik politikası olarak zorunluysa, bunu teknik olarak “dolaylı bypass” etmek yerine IT’den **dashboard cihazı / NOC ekranı / kiosk profili için politika istisnası** almak en temiz çözümdür. Extension tarafındaki `chrome.power` yaklaşımı da bu onayla kullanılmalı.

---

## ESC ile durdurma

ESC gereksinimi uygulanabilir ama tek başına %100 güvenilir kontrol noktası olarak düşünülmemeli.

Önerilen katmanlar:

1. **Eklenti harita sekmesinde ESC listener:** `map-modern.html` aktifken ESC doğrudan yakalanabilir.
2. **Dış sekmelerde content script:** Yalnız izin verilen dashboard domain’lerinde ESC yakalanıp background’a “stopDashboard” mesajı gönderilebilir.
3. **Fullscreen çıkışını stop sayma:** Kullanıcı ESC’ye bastığında Chrome fullscreen’den çıkarsa, Dashboard Controller pencere state’inin artık fullscreen olmadığını görüp modu durdurmalı.
4. **Popup Stop her zaman güvenilir olmalı.**
5. Opsiyonel olarak Chrome `commands` ile Ctrl/Alt kombinasyonlu bir stop kısayolu eklenebilir; ESC browser fullscreen tarafından tüketilebileceği için tek stop yöntemi olmamalı.

Bu tasarımda ESC hem kullanıcı beklentisini karşılar hem de tarayıcının fullscreen davranışıyla çakışma riskini azaltır.

---

## Güvenlik ve izin tasarımı

Bu geliştirme gereksiz geniş izinle yapılmamalı.

Minimum öneri:

* Mevcut `tabs`: sekmeleri bulma/aktif etme için.
* Mevcut `storage`: dashboard ayarları ve çalışma durumu için.
* `power`: ekranı açık tutmak için.
* `alarms`: MV3 uyumlu geçiş planlama için.
* `scripting`: yalnız dış sayfalara ESC listener veya yardımcı content script enjekte edilecekse.
* `host_permissions`: yalnız yönetilecek dış domain’ler için.

`activeTab` bu senaryoda tek başına yeterli değildir; çünkü `activeTab` izni kullanıcı eklenti aksiyonunu çalıştırdığında mevcut sekmeye geçici erişim verir ve sayfa değiştiğinde/kapatıldığında erişim biter. Sürekli dönen, önceden tanımlı 5 dış site için kalıcı ve sınırlı host izinleri daha doğru olur. ([Chrome for Developers][8])

---

## SCADA harita katmanı arka plandayken veri çekebilir mi?

Mevcut kurguda cevap: **kısmen, ama garanti edilmemeli.**

README’ye göre canlı SCADA akışında Superset fetch işi `background.js` tarafından yapılabiliyor; fakat polling/state uygulama tarafında `scada-client.js` ve harita runtime’ı önemli rol oynuyor. Harita sayfası `map-modern.html` içinde `scada-client.js` polling, snapshot uygulama ve `scada-flow.js` SVG render akışıyla çalışıyor. 

Dashboard senaryosunda SCADA harita sekmesi diğer 5 sekme gösterilirken **arka plan sekmesi** olur. Chrome, arka plandaki sayfaları gizli/frozen/discarded durumlara alabilir; frozen durumda JavaScript timer’ları ve fetch callback’leri çalışmayabilir. ([Chrome for Developers][9])

README’nin güncel durum özetinde de otomatik yenilemenin sayfa açıkken iyi çalıştığı, sekme arka planda kalınca görünür olduğunda overdue kontrolüyle telafi fetch tetiklendiği; ayrıca ileri geliştirme olarak arka plan yenilemenin page-scoped kalmaması ve `chrome.alarms` tabanlı background scheduler’a taşınması gerektiği belirtiliyor.  

Bu şu anlama gelir:

* Harita sekmesi kısa aralıklarla tekrar görünür oluyorsa, görünür olduğunda gecikmiş fetch tetiklenip veri güncellenebilir.
* Harita uzun süre görünmez kalırsa, SCADA verisi arka planda sürekli taze kalmayabilir.
* Mevcut stale eşikleri 15 dakika warn, 60 dakika dead olarak tanımlı olduğu için, harita sekmesi 15 dakikadan uzun süre görünmez kalırsa kullanıcı geri döndüğünde önce “bayat/uyarı” durumları görebilir. SCADA yapılandırmasında `STALE_THRESHOLD_WARN_MS = 15 dk`, `STALE_THRESHOLD_DEAD_MS = 60 dk`, `POLL_INTERVAL_MS = 5 dk` olarak verilmiş. 
* Harita görünür olduğunda fetch tamamlanırsa katman toparlanır; fakat bu “dashboard boyunca arka planda kesintisiz veri çekti” anlamına gelmez.

Bu nedenle Dashboard Modu için mevcut kurgu **sorunsuz sayılmaz**. Sorunsuz hale getirmek için SCADA fetch, harita sayfasından ayrılmalı.

---

## SCADA için önerilen doğru mimari

Dashboard Modu ile birlikte şu geliştirme yapılmalı:

**Background SCADA Refresh Daemon**

* `chrome.alarms` ile 5 dakikada bir SCADA fetch tetiklenir.
* Fetch, zaten auth/fetch katmanı olan `background.js` üzerinden yapılır.
* Son başarılı snapshot `chrome.storage.local` içine yazılır.
* Daha uzun geçmiş gerekiyorsa IndexedDB kullanılır.
* Harita sekmesi görünür olduğunda önce son snapshot’ı storage’dan okur.
* Sonra canlı refresh varsa uygular.
* Açık harita sekmelerine `runtime.sendMessage` ile “snapshotUpdated” mesajı gönderilir.
* Harita DOM/SVG render işi yine sadece görünür/aktif olduğunda yapılır.

Bu README’deki ileri geliştirme önerisiyle de örtüşüyor: Son snapshot’ın storage’a serialize edilmesi, harita açılışında geri yüklenmesi ve page-scoped yenilemenin background `chrome.alarms` scheduler’a taşınması önerilmiş.  

Bu ayrım çok önemli: **Veri çekme background’da, görselleştirme harita sekmesinde olmalı.** Böylece harita sekmesi görünmezken bile SCADA verisi güncellenir; kullanıcı harita slotuna döndüğünde SVG katman yalnızca son snapshot’ı render eder.

---

## Dış siteler için arka plan durumu

Windy, TEİAŞ veya benzeri dış siteler de arka planda kendi veri yenilemelerini garanti etmeyebilir. Chrome arka plan sekmelerinde kaynak kullanımını azaltabilir; gizli/frozen sayfalarda timer ve callback çalışması sınırlanabilir. ([Chrome for Developers][9])

Bu nedenle her dış slot için şu opsiyonlar ayarlanmalı:

* Gösterirken sayfayı yenile
* Gösterdikten sonra 2-10 saniye “settle” bekle
* Login/oturum sayfası algılanırsa slotu atla veya uyarı ver
* Kritik dashboard sayfaları için otomatik reload sıklığı tanımla

Özellikle canlı hava/harita sitelerinde, sayfa sekme aktif olduğunda kendini toparlar; fakat arka plandayken sürekli gerçek zamanlı güncellendiği varsayılmamalı.

---

## Riskler ve kararlar

En önemli ürün kararları şunlar:

* **Fullscreen:** DOM fullscreen değil, browser window fullscreen.
* **Mouse hareketi:** Simülasyon değil, `chrome.power` + IT onayı.
* **Timer:** MV3 service worker global timer’ına değil, storage + alarms mantığına dayanmalı.
* **Kısa süreler:** 30 saniye altı hassas döngü “best effort” kabul edilmeli veya destek dışı bırakılmalı.
* **ESC:** Hem content script hem fullscreen-state değişimiyle yakalanmalı.
* **SCADA:** Mevcut page-scoped polling Dashboard için yeterli görülmemeli; background snapshot mimarisi eklenmeli.
* **Host izinleri:** Yalnız tanımlı dashboard domain’leriyle sınırlı tutulmalı.

---

## Kabul kriterleri

Bu geliştirme tamamlandığında şu testler geçmeli:

* Play’e basınca hedef pencere fullscreen olur.
* Tanımlı 6 slot sırayla açılır/aktif edilir.
* 0 saniyelik slot atlanır.
* 30-600 saniye arası süreler kalıcı state üzerinden çalışır.
* Stop’a basınca sekme geçişi durur, keep-awake release edilir.
* ESC veya fullscreen’den çıkış Dashboard’u durdurur.
* Hedef sekme kapatılırsa ayara göre yeniden açılır veya slot atlanır.
* Chrome yeniden başlatıldığında eski “running” state güvenli biçimde durdurulur veya kullanıcıya kurtarma seçeneği gösterilir.
* Dashboard aktifken ekran kapanmaz; Stop sonrası normal güç yönetimine dönülür.
* Harita sekmesi 20-30 dakika arka planda kaldıktan sonra tekrar gösterildiğinde son SCADA snapshot’ı storage’dan gelir ve canlı fetch ile tazelenir.
* SCADA fetch başarısızsa kullanıcı son başarılı snapshot’ı “önbellek/bayat” etiketiyle görür.

Genel değerlendirme: Bu özellik, mevcut eklenti mimarisine mantıklı şekilde eklenebilir. Ancak sağlam bir operasyon ekranı isteniyorsa, yalnız sekme döndürme değil, **background SCADA snapshot**, **power API**, **fullscreen window state** ve **kalıcı dashboard state** birlikte tasarlanmalı.

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen "Element: requestFullscreen() method - Web APIs | MDN"
[2]: https://developer.chrome.com/docs/extensions/reference/api/power "chrome.power  |  API  |  Chrome for Developers"
[3]: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle "The extension service worker lifecycle  |  Chrome for Developers"
[4]: https://developer.chrome.com/docs/extensions/reference/api/tabs "chrome.tabs  |  API  |  Chrome for Developers"
[5]: https://developer.chrome.com/docs/extensions/reference/api/windows "chrome.windows  |  API  |  Chrome for Developers"
[6]: https://developer.chrome.com/docs/extensions/reference/api/alarms "chrome.alarms  |  API  |  Chrome for Developers"
[7]: https://developer.chrome.com/docs/extensions/reference/api/idle "chrome.idle  |  API  |  Chrome for Developers"
[8]: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab "The \"activeTab\" permission  |  Chrome Extensions  |  Chrome for Developers"
[9]: https://developer.chrome.com/docs/web-platform/page-lifecycle-api "Page Lifecycle API  |  Web Platform  |  Chrome for Developers"
plan: 

yukarıda önerdiğin mimariyi aytıntılı olarak  projenin geliştiridiği ide agenta verilecek promt olarak yaz bunlara göre “Dashboard’un çalıştığı Chrome penceresi fullscreen olacak ve aktif sekme değiştirilecek.”  "chrome.power.requestKeepAwake("display") kullanılmalı. Chrome’un resmi power API’si, ekranın kararmasını/kapanmasını ve sistemin uyumasını engellemek için özellikle bu kullanım senaryosunu destekler." bunu kullan ve garanti olması açısından ayarlarda eklenecek manuel Fare hareketi simülasyonu da ekle  süre olarak 3-15 dakida set edilebilsin.  çalışmasada olsun bu ayar çünkü kurum politikası 15 dakikada ısrarcı fakat dasboard devamlı çalışmalı "