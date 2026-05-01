Sen Codex’sin ve şu repo üzerinde çalışıyorsun:

`c:\yazilim_projeler\SCADA_YTBS_TPYS_Haritalar_ve_Otomasyon_v1`

Görev: **RGDH / YKS Reaktif İzleme modülünü düzelt ve geliştir.** Önce dosyaları ve logları incele, sonra TDD ile uygula. Mevcut kullanıcı değişikliklerini geri alma.

İncelenecek önemli dosyalar:
- `rgdh-monitor.html`
- `rgdh-monitor.css`
- `rgdh-monitor.js`
- `rgdh-api-client.js`
- `rgdh-normalizer.js`
- `rgdh-catalog-data.js`
- `rgdh-csv.js`
- `background.js`
- `tests/background.test.js`
- `tests/rgdh-api-client.test.js`
- `tests/rgdh-normalizer.test.js`
- `tests/rgdh-ui-smoke.test.js`
- `yks_izleme_modul/yks_docs/_RGDH_2026-04-01T00_00_00ZKONVANSIYONEL_BARA_VERİ.csv`
- `yks_izleme_modul/yks_docs/9498932425_2026-04-01T00_00_00ZRUZGAR_BARA_VERİ.csv`
- `yks_izleme_modul/yks_docs/konvansiyonel_data_console_veriler.txt`
- `yks_izleme_modul/yks_docs/resges_data_console_veriler.txt.txt`
- `C:\Users\Murathan YENİCELİ\Downloads\RGDH_HATA_DETAYLARI_2026-04-30 (5).csv`
- `C:\Users\Murathan YENİCELİ\Downloads\RGDH_HAM_DATA_2026-04-01.csv`

Mevcut gözlemler:
- API’den veri geliyor ama çekim çok uzun sürüyor. Örnek logda KARAMAN BES için `YKS cekim isi tamamlandi (117 sn)` ve `2880 API kaydi` görünüyor.
- Tarih bug’ı var: UI’da `01.04.2026` başlangıç, `02.04.2026` bitiş seçiliyken sorgu iki gün gibi çalışıyor ve ayrıca date-only hesaplamada UTC kaymasıyla `2026-03-31` günü de sorgulanabiliyor. Tarih hesabı string-safe yapılmalı.
- `RGDH_HAM_DATA_2026-04-01.csv` içinde `pgenMw`, `qgenMvar`, `diMvarLimit`, `aiMvarLimit`, `approvalStatus` alanları boş geliyor. Referans YKS CSV’lerinde bu alanlar var:
  - Konvansiyonel CSV başlıkları: `Toplam Ünite Pgen Aktif (MW)`, `Toplam Ünite Qgen Reaktif (MVAr)`, `Toplam D.İ. MVar Limit`, `Toplam A.İ. MVar Limit`, `Onay Durum`
  - RES/GES CSV başlıkları da aynı metrikleri içeriyor.
- YKS’de iki ana veri kaynağı var:
  - `/api/rgdh-conventional-busbar-data`
  - `/api/rgdh-wind-busbar-data`
  Eklentide üçüncü “Hibrit” veri tipi kullanıcı seçimi olarak görünmemeli. Hibrit, ayrı endpoint değil; konvansiyonel veya RES/GES baraya bağlı yardımcı kaynak/ünite bilgisidir.
- Dark mode’da bazı tablo satırları beyaz arka plan + beyaz/açık yazı kalıyor. RGDH UI ve grafikler dark/light modda kontrastlı olmalı.
- “Gerilim Kaynaklarını Gizle” default açık olmamalı. Gerilim kaynakları varsayılan olarak gizli gelsin; buton ilk açılışta “Gerilim Kaynaklarını Göster” olmalı.
- “Hibrit GES / yardımcı kaynak” üniteleri Reaktif Testleri tarafında görünmeli ve mümkünse API’den gelen yardımcı kaynak değerleri tablo/grafikte ayrıca izlenmeli.

Uygulama gereksinimleri:

1. Tarih aralığı düzeltmesi
- Tarihleri `new Date(...).toISOString().slice(0,10)` ile üretme; bu İstanbul saatinden dolayı bir gün geri kaydırıyor.
- Date-only string arithmetic kullan.
- Bitiş tarihi **exclusive** olsun:
  - Başlangıç `2026-04-01`, bitiş boşsa: sadece `2026-04-01`
  - Başlangıç `2026-04-01`, bitiş `2026-04-02`: sadece `2026-04-01`
  - Başlangıç `2026-04-01`, bitiş `2026-04-03`: `2026-04-01` ve `2026-04-02`
- UI’da gerekirse “Bitiş Tarihi” label/placeholder açıklamasını “Bitiş Tarihi (hariç)” yap.

2. Performans düzeltmesi
- Konvansiyonel ve RES/GES çekimleri tek günlük büyük istek yerine saatlik küçük isteklerle çalışsın.
- `rgdh-api-client.js` içine gerekirse:
  - `buildConventionalHourParams(localDate, busbarInternalId, hour)`
  - `buildWindHourParams(localDate, busbarInternalId, hour)`
- Her saat için:
  - `measurementDate.greaterOrEqualThan`
  - `measurementDate.lessThan`
  - `busbarId.equals`
  - `size=60`
  - `sort=measurementDate,asc`
- Saatlik sorguları düşük kontrollü paralellikle çalıştır: örn. concurrency `6`, timeout `15s`.
- Direct fetch 401 fallback veri yolu gibi kullanılmasın; yalnız tanısal log olarak kalsın.
- Loglarda hangi saat aralığının sorgulandığı açık görünsün.
- Kabul kriteri: `01.04.2026 -> 02.04.2026` tek gün için 1440 kayıt hedeflemeli, 2880 değil.

3. Boş/sıfır metrik düzeltmesi
- `rgdh-normalizer.js` içinde API raw field mapping’i yeniden doğrula.
- Şu alanların hem konvansiyonel hem RES/GES API raw payload’dan doğru dolduğunu test et:
  - `pgenMw`
  - `qgenMvar`
  - `diMvarLimit`
  - `aiMvarLimit`
  - `approvalStatus`
- Alan adları için alias/fallback ekle:
  - `sumPgenActive`
  - `sumPgenReactive`
  - `sumDIMvarLimit`
  - `sumAIMvarLimit`
  - `approvalStatus`
  - highlighted veya alternatif field adları varsa console dosyalarından doğrula.
- Test fixture’larını `yks_izleme_modul/yks_docs/*console*` ve CSV örneklerinden türet.
- Eğer API raw row’da bu alanlar yoksa Hata Detayları’na güvenli schema/sample logu ekle; token/header sızdırma.

4. Hibrit / yardımcı kaynak desteği
- UI’daki “Veri Tipi” seçeneklerinden ayrı “Hibrit” endpoint seçimini kaldır veya kullanıcıya ayrı ana veri tipi gibi göstermeyecek şekilde düzenle.
- Seçenekler:
  - `Tümü`
  - `Konvansiyonel`
  - `RES/GES`
- Hibrit santral/baralar, katalogda ve raporda “yardımcı kaynak” olarak gösterilsin.
- API raw alanlarında şu yardımcı kaynak alanlarını destekle:
  - `auxiliarySource`
  - `auxiliarySourceReactive`
  - `sumAuxiliaryDIMvarLimit`
  - `sumAuxiliaryAIMvarLimit`
  - `approvalStatusAuxiliary`
  - `auxiliarySourceApprovalStatus`
  - `teiasAuxiliaryRgdhConvUnitData`
  - `auxiliaryWindUnitList`
  - `auxiliaryConventionalUnitList`
- Tablo ve grafiklerde yardımcı kaynak serileri görünmeli:
  - Yardımcı Kaynak MW
  - Yardımcı Kaynak MVAr
  - Yardımcı Kaynak D.İ./A.İ. limitleri varsa
  - Yardımcı kaynak onay durumu varsa
- Ana kaynak ve yardımcı kaynak karışmasın; ayrı kolon/seri adı kullan.

5. Yardımcı kaynak ünite kayıtlarını ekle
Reaktif Testleri / katalog tarafına aşağıdaki yardımcı kaynak kayıtlarını ekle. Mevcut katalog üretim akışını incele; doğrudan generated dosyayı elle bozma, mümkünse kaynak/veri normalize katmanında ekle.

Eklenecek kayıtlar:

KARAMAN BES
- Ana bara: `6137`
- Bara adı: `KARAMAN BES`
- Tip: Konvansiyonel + yardımcı GES
- Yardımcı kaynak ünite adı: `YARDIMCI KAYNAK GES`
- UEVBC: `KARAMAN BES`
- TPYS UEVBC ID: `3214971`
- Yardımcı kaynak türü: `GES (Güneş Enerji Santrali)`
- TA MW: `KARMNBES/1/GESHAT-1/P`
- SetNum MW: `2,1,160513`
- TA MVAR: `KARMNBES/1/GESHAT-1/Q`
- SetNum MVAR: `2,1,160514`
- Kurulu Güç Mekaniksel: `5.99`
- Nominal İkaz Düşük: `-2.901`
- Nominal İkaz Aşırı: `2.901`
- Drop/Gerilim Düşümü: `4`
- Aktif: `Evet`

AKYEL-1 RES
- Ana bara: `6002`
- Bara adı: `AKYEL-1 RES`
- Tip: RES/GES + yardımcı GES
- Yardımcı kaynak ünite adı: `YARDIMCI KAYNAK GES`
- UEVBC: `AKYEL-1 RES`
- TPYS UEVBC ID: `3213030`
- Yardımcı kaynak türü: `GES (Güneş Enerji Santrali)`
- TA MW: `AKYEL-1/34.5/GenHAT-6/P`
- SetNum MW: `2,1,138286`
- TA MVAR: `AKYEL-1/34.5/GenHAT-6/Q`
- SetNum MVAR: `2,1,138287`
- Kurulu Güç Mekaniksel: `39.99`
- Düşük İkaz TEST: `-19.367`
- Nominal İkaz Düşük: `-19.367`
- Aşırı İkaz TEST: `19.367`
- Nominal İkaz Aşırı: `19.367`
- Drop/Gerilim Düşümü: `4`
- Aktif: `Evet`

GEYCEK RES
- Ana bara: `5052`
- Bara adı: `GEYCEK RES`
- Tip: RES/GES + yardımcı GES
- Yardımcı kaynak ünite adı: `YARDIMCI KAYNAK GES`
- UEVBC: `AL-YEL ELEKTRİK ÜRETİM A.Ş.`
- TPYS UEVBC ID: `340575`
- Yardımcı kaynak türü: `GES (Güneş Enerji Santrali)`
- TA MW: `GEYCEK/34.5/Gen-15/P`
- SetNum MW: `2,1,158380`
- TA MVAR: `GEYCEK/34.5/Gen-15/Q`
- SetNum MVAR: `2,1,158381`
- Kurulu Güç Mekaniksel: `46.63`
- Düşük İkaz TEST: `-22.588`
- Nominal İkaz Düşük: `-22.585`
- Aşırı İkaz TEST: `22.588`
- Nominal İkaz Aşırı: `22.585`
- Drop/Gerilim Düşümü: `4`
- Aktif: `Evet`

6. Dark/light mode düzeltmesi
- RGDH modülü dark/light temada kontrastlı olmalı.
- Beyaz arka plan + beyaz/açık yazı kalmamalı.
- Özellikle düzelt:
  - Reaktif Testleri tablo satırları
  - selected/hover satırlar
  - input/select/button renkleri
  - status badge’leri
  - chart canvas legend, axis labels, grid, tooltip renkleri
  - error/log panels
- CSS değişkenleri kullan; tema değişiminde Chart.js yeniden render/update edilmeli.
- Dark mode screenshot benzeri durumda test tablosu okunabilir olmalı.

7. Gerilim kaynakları varsayılan gizli
- `state.showVoltage` default `false` olsun.
- İlk açılışta gerilim kaynak kolonları/seri görünmesin.
- Buton metni ilk açılışta `Gerilim Kaynaklarını Göster` olsun.
- Tıklayınca göster/gizle doğru çalışsın.
- Grafiklerde gerilim kaynak datasetleri de aynı state’e göre gizli/açık olsun.

8. Test ve doğrulama
Önce failing test yaz, sonra uygula.
En az şu testleri ekle/güncelle:
- Date range:
  - `2026-04-01` + blank end => `['2026-04-01']`
  - `2026-04-01` + `2026-04-02` => `['2026-04-01']`
  - UTC kaymasıyla `2026-03-31` oluşmamalı.
- Hourly params:
  - conventional/wind saatlik parametreleri doğru UTC aralığı üretmeli.
- Fetch:
  - single selected busbar one-day fetch 24 hourly calls yapmalı, full-day 1440 tek istek yapmamalı.
- Normalizer:
  - API raw sample’dan `pgenMw`, `qgenMvar`, `diMvarLimit`, `aiMvarLimit`, `approvalStatus` dolmalı.
  - auxiliary source fields normalize edilmeli.
- UI:
  - “Hibrit” ana veri tipi select’inde görünmemeli.
  - “Gerilim Kaynaklarını Göster” default görünmeli.
  - dark mode’da test tablosu için beyaz üstüne beyaz yazı kalmamalı.
- Catalog:
  - Karaman BES, Akyel-1 RES, Geycek RES yardımcı GES üniteleri Reaktif Testleri özetlerinde görünmeli.

Son doğrulama komutları:
- `npm test`
- `npm run build:extension`
- `npm run smoke:extension`

Çalışma sonunda kısa rapor ver:
- Kök nedenler
- Değişen dosyalar
- Kullanıcıya Chrome eklentisini reload edip tekrar test etmesi gereken net senaryo:
  - 01.04.2026 başlangıç, 02.04.2026 bitiş, KARAMAN BES
  - AKYEL-1 RES
  - GEYCEK RES
- Hata Detayları’nda beklenen yeni log biçimi: saatlik sorgu aralıkları, API row count, normalize edilen metriklerin boş olmadığını gösteren özet.