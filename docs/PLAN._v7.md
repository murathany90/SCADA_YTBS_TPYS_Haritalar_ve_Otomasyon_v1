# Hibrit RES/GES YKS Çekimi Kök Neden Raporu ve İyileştirme Planı

## Kök Neden Özeti

- AKYEL-1 RES için YKS iç bara ID doğru: eklenti ve manuel YKS logları aynı ID’yi kullanıyor: `9490732369`.
- Veri YKS’de mevcut: manuel `/api/rgdh-wind-busbar-data-csv` isteği aynı aralıkta `1200` satır döndürmüş, fakat `334160 ms` sürmüş.
- Yeni hibrit akışında temel hata: `size=500` boş/hatalı dönünce `size=60` retry başarıyla `60` satır alıyor, ancak `fetchRgdhWindBusbarByYksUiRange()` devam kontrolünde hâlâ ilk `pageSize=500` değerini kullanıyor. Bu yüzden `60 < 500` kabul edilip aralık tamamlandı sanılıyor.
- İkinci hata: `rangePrimary.rows.length > 0` başarı sayılıyor; beklenen satır, `x-total-count`, `Link rel=last` veya zaman aralığına göre tamamlık kontrolü yapılmıyor.
- GEYCEK manuel logundaki `x-total-count=1440` ve `Link page=23` kanıtı, `size=60` cevabının tam veri değil ilk sayfa/pencere olduğunu gösteriyor.
- Eski saatlik `page=0` yolu hibritlerde hâlâ riskli: önceki AKYEL logunda 24 saatlik isteğin 15’i `PAGE_FETCH_TIMEOUT`, 9’u `HTTP 200 / 0 satır` dönmüş.
- Normalizer, auth veya ID çözümleme ana neden değil; veri ya hiç gelmiyor ya da ilk 60 satır “tam gün” sanılıyor.

## Uygulama Planı

- Hibrit çekimi iki aşamalı yapılacak:
  - Aşama 1: UI en fazla `300 sn` bekler, mümkün olan veriyi çeker ve eksikse sonucu `partial` olarak açıkça işaretler.
  - Aşama 2: Eksik pencereler arka planda tamamlanır; kullanıcı ilk sonucu görürken devam işi ayrı `continuationJobId` ile izlenir.

- Range fetch düzeltilecek:
  - `size=500 -> size=60` retry sonrası devam koşulu aktif deneme boyutunu kullanacak.
  - `rows.length > 0` tek başına başarı olmayacak.
  - Sonuçta `expectedRows`, `fetchedRows`, `responseTotalCount`, `responseLink`, `missingWindows`, `isComplete` alanları üretilecek.
  - Satırlar `id` veya `measurementDate + busbarId` anahtarıyla tekilleştirilecek.

- Hibrit hızlı yol değiştirilecek:
  - Tam gün `size=500` isteği birincil yol olmaktan çıkarılacak veya kısa probe’a düşürülecek.
  - Ana hızlı yol: 1 saatlik page’siz pencereler, `size=60`, `sort=measurementDate,asc`, `page` parametresi olmadan, sınırlı paralellik ile çalışacak.
  - Önerilen varsayılan: `concurrency=4`, pencere timeout’u `45 sn`, toplam UI bütçesi `300 sn`.

- Arka plan tamamlama eklenecek:
  - Eksik pencereler ikinci job’da yeniden denenecek.
  - Gerekirse `/api/rgdh-wind-busbar-data-csv` endpoint’i arka plan fallback’i olarak kullanılacak.
  - CSV fallback timeout’u `420 sn` olacak; bu, manuel AKYEL örneğindeki `334 sn` süreye tampon bırakır.
  - CSV endpoint’i whitelist ve YKS diagnostic target listesine eklenecek.

- Log/CSV görünürlüğü iyileştirilecek:
  - Background page-context fetch sonucu `responseRowCount`, `responseTotalCount`, `responseLink`, `responseHeaders`, süre ve URL ile kaydedilecek.
  - Eklenti CSV export’unda ekranda görünen JSON detayları boş kolona düşmeyecek.
  - Partial sonuçlar `INCOMPLETE_HYBRID_FETCH` olarak işaretlenecek; `NO_NORMALIZED_ROWS` yalnızca gerçekten hiç satır yoksa üretilecek.

## Test Planı

- `background.test.js`: `size=500` timeout/boş, ardından `size=60` ile 60 satır gelince ikinci cursor/chunk isteğinin devam ettiğini test et.
- `background.test.js`: `totalCount=1200` ve ilk cevap `60` satır olduğunda job’ın tamamlanmış sayılmadığını test et.
- `background.test.js`: 20 adet saatlik page’siz AKYEL penceresinden `1200` satır birleştiğini test et.
- `background.test.js`: 300 sn bütçe dolunca partial result + `continuationJobId` döndüğünü test et.
- `background.test.js`: continuation job tamamlanınca partial verinin tekilleştirilerek tam veriyle değiştiğini test et.
- `rgdh-diagnostics.test.js`: CSV export’ta `Response Row Count`, `Response Total Count`, `Response Link` kolonlarının dolduğunu test et.
- `rgdh-api-client.test.js`: `/api/rgdh-wind-busbar-data-csv` URL üretimi ve whitelist davranışını test et.
- Son doğrulama: `npm test` ve ardından `npm run build:extension`.

## Varsayımlar

- UI bekleme üst sınırı katı olarak `300 sn` kalacak.
- Tam veri önceliği arka plan continuation job’a taşınacak.
- AKYEL için 20 saatlik beklenti yaklaşık `1200` satır, tam gün için `1440` satırdır.
- Hibrit olmayan RES/GES ve konvansiyonel çekim davranışı korunacak.



**Hibrit Çekim Kapasite Raporu**

Kısa cevap: **Akyel tipi hibrit santralde güvenli kapasite şu an tek çalıştırmada 1 gün**. Bir ayı normal santral gibi tek job içinde beklemek doğru değil.

Ölçülen canlı Akyel sonucu:
- Tarih: `2026-05-01`
- İç ID: `9490732369`
- CSV fallback süresi: `384 sn`
- Toplam kullanıcı bekleme süresi: yaklaşık `400 sn`
- Normalize edilen satır: `1260`
- Bu, yaklaşık `21 saat` dakikalık veri demek. Tam gün olsaydı beklenen üst sınır `1440` satır.

**Kapasite hesabı**

| Senaryo | Güvenli veri aralığı | Tahmini süre |
|---|---:|---:|
| Normal santral | 30 gün | ~60 sn |
| Akyel tipi hibrit, mevcut akış | 1 gün | ~6.5-7 dk |
| Akyel tipi hibrit, 7 gün ardışık | 7 gün | ~45-50 dk |
| Akyel tipi hibrit, 30 gün ardışık | 30 gün | ~3 saat 15 dk - 3 saat 30 dk |

Önemli sınırlama: mevcut kodda çok günlük seçim yapılsa bile parent job birden fazla `continuationPayload` üretebilir, fakat otomatik continuation tarafında pratikte **ilk continuation job takip ediliyor**. Bu yüzden Akyel gibi CSV fallback isteyen hibritlerde “1 aylık aralığı seçip hepsini tek seferde alayım” güvenilir değil.

**Sonuç**

- Erciyes tipi, page-less API penceresinden hızlı satır döndüren hibritlerde kapasite daha yüksek olabilir.
- Akyel tipi, CSV fallback’e düşen hibritlerde güvenli operasyon: **1 gün / 1 çekim**.
- Bir aylık hibrit veri için bugünkü akışla en doğru yöntem: gün gün çekmek.
- Bir aylık hibrit çekimi normal santral hızına yaklaşsın istenirse ayrıca batch continuation queue gerekir: her gün için ayrı CSV continuation, sırayla çalışma, resume/progress ve hata sonrası kaldığı günden devam etme.