Aşağıda, proje kodlarını derinlemesine inceleyerek hazırladığım analiz raporu sunulmaktadır. Rapor, doğrudan `scada-client.js`, `scada-v2-runtime.js`, `scada-flow.js`, `scada-common.js` ve `build_kml_layers_v2.py` dosyalarındaki algoritmik akışı temel almaktadır.

---

# SCADA Hat Akış Yönü Algoritma Analizi ve İyileştirme Raporu

## 1. Algoritma Analizi: Yön Belirleme Matematiği ve Kod Akışı

### 1.1 Derleme Zamanı: Terminal Polarizasyonu ve Formül İşlenmesi (`build_kml_layers_v2.py`)

Hat akış yönünün çözümlenmesi, Python derleyici katmanında başlar. `build_kml_layers_v2.py` betiği, `SISTEM_ESLEME_LISTESI.xlsx` içindeki her bir SCADA formül satırını `parse_formula_parts()` ile parçalar:

```text
(+1) ISTANBUL_TM, 400, KOCAELI_TM, P
  │      │          │      │        └── Quantity (P = Aktif Güç)
  │      │          │      └── Hedef İstasyon (TargetCode)
  │      │          └── Gerilim Seviyesi
  │      └── Kaynak İstasyon (StationCode)
  └── Formül İşareti (Sign)
```

Daha sonra `enrich_hat_candidate()` fonksiyonu devreye girer. Bu fonksiyonun temel görevleri şunlardır:

1. **Terminal Tespiti:** `resolve_terminal_side()` ile ölçüm noktasının hattın hangi ucuna (A/B veya Start/End) ait olduğu belirlenir. Eşleştirme şu sırayla yapılır:
   - `tm-name-exact`, `ucte-exact`, `psse-exact`
   - Normalize edilmiş alias eşleştirmesi (`normalized-alias-exact`)
2. **Polarizasyon İşareti (`polarizationSign`):**
   - Terminal `start` ise `+1`
   - Terminal `end` ise `-1`
   - Bilinmiyorsa `null`
3. **Tutarlılık Kontrolü (`polarizationConsistent`):**
   - `formulaSign == polarizationSign` ise `true`, değilse `false`.

Bu metadatalar (`sourceSide`, `targetSide`, `candidateSlot`, `polarizationSign`, `polarizationConsistent`, `formulaSign`) `kml_layers_v2.json` içinde her hattın `scada.active.rows[]` ve `scada.reactive.rows[]` dizilerine gömülür. Tarayıcı runtime'ı bu json'u O(1) indeksleme ile kullanır.

### 1.2 Çalışma Zamanı: SCADA Veri Normalizasyonu ve Yön Çözümleme (`scada-v2-runtime.js`)

Canlı veri geldiğinde akış şu şekilde işler:

**Adım A — Ham Veri Normalizasyonu (`scada-common.js`):**
Superset'ten dönen JSON, `normalizeMetricRows()` ile `Map<measurementId, {value, tmName, remoteName, timestamp}>` yapısına dönüştürülür. `MAX(__time)` kontrolü ile aynı ID'ye ait birden fazla satırdan en günceli tutulur.

**Adım B — Hat Metriğinin Çözümlenmesi (`resolveHatMetric`):**
Her hat için `scada.active.rows` (adaylar) ile canlı `measurementRowsById` kesiştirilir. Her aday için iki ayrı yol izlenir:

**B1. Terminal-Exit Modeli (Öncelikli Yol):**
Eğer adayın `terminalSide` (`start` veya `end`) biliniyorsa (builder meta veya `row.tmName` alias eşleşmesi ile), aşağıdaki matematik uygulanır (`scada-v2-runtime.js:1061-1067`):

```javascript
normalizedValue = rawValue * candidatePolarizationSign;
// candidatePolarizationSign: start = +1, end = -1
directionValue = normalizedValue;
orientationMatch = normalizedValue >= 0 ? 'forward' : 'reverse';
```

Bu modelin fiziksel anlamı şudur: Ölçüm cihazına göre **pozitif değer, ölçümün bağlı olduğu terminalden çıkış** demektir. `candidatePolarizationSign` ile bu çıkış, hattın `startTm → endTm` referans eksenine normalize edilir. Eğer formül işareti ile terminal polarizasyonu uyuşmazsa (`polarizationConsistent === false`), kayıt yine de normalize edilir ancak `resolvedTerminalMismatch = true` bayrağı kalkar.

**B2. Alias Tabanlı Yön Çözümlemesi (Fallback):**
Eğer terminal metadata yoksa, `formulaOrientation` (stationCode↔start, targetCode↔end alias eşleşmesi), `candidateSideOrientation` (builder sourceSide/targetSide) ve `rowOrientation` (tmName/remoteName) sırasıyla değerlendirilir. Bu durumda:

```javascript
normalizedValue = rawValue * (formulaSign || 1) * orientationSign;
```

**Adım C — Çoklu Aday Çözümlemesi:**
- **Tek Aday:** Doğrudan `single-candidate` olarak seçilir.
- **Tolerans İçinde Çoklu Aday:** `resolveHatMetricByTolerance()` ile adayların `normalizedValue` farkı mutlak (12 MW) veya göreli (%8) toleransın altındaysa aritmetik ortalama alınır (`tolerance-mean`).
- **Tolerans Dışı Çakışma:** `primary-conflict` olarak işaretlenir; primary (start) aday tercih edilir, diğeri `backupUsed` bayrağı ile yedeklenir.

**Adım D — Nihai Yön Kaydı (`rebuildLineFlowMap`):**
`lineFlowByLineId` Map'i şu koşulları sağlayan kayıtlarla doldurulur (`scada-v2-runtime.js:1546-1550`):
- `primaryValue` sayısal ve sonlu
- `primaryStaleState !== 'dead'`
- `sourceAmbiguous === false`
- `unresolved === false`
- `candidateConflict === false`
- `backupUsed === false`

Yön nihai olarak:
```javascript
direction = (directionValue >= 0) ? 'forward' : 'reverse';
```

### 1.3 Görselleştirme ve Akış Animasyonu (`scada-flow.js`)

`renderFlowLayer()` fonksiyonu, `lineFlowByLineId` üzerinden görünür hatlar için SVG `<path>` ve `<animateMotion>` elemanları üretir.

**Geometri Yönetimi:**
- **Detaylı Mod:** KML koordinatları kullanılır. `flow.direction === 'reverse'` ise `[...row.coords].reverse()` ile path ters çevrilir.
- **Sade / Sade-Ayrık Mod:** `startTm` ile `endTm` arasına düz çizgi çizilir. Reverse durumunda `M x2 y2 L x1 y1` formatıyla koordinatlar takas edilir.

**Animasyon:**
- `<animateMotion dur="${getArrowSpeed(flow.loadingPct)}s">` ile oklar hareket eder.
- Ok hızı yüklenme yüzdesine bağlıdır: `%80+` → 4 sn, `%55+` → 6 sn, `%30+` → 8 sn, diğer → 10 sn.
- Ok sayısı hat uzunluğuna göre belirlenir (`getArrowCount`).

### 1.4 Eski/Legacy Yön Matematiği (`scada-client.js`)

`applyScadaSnapshot()` (legacy V1) içinde yön belirleme şu şekildedir:
```javascript
direction: row.activePowerMw >= 0 ? 'forward' : 'reverse';
```
Bu kod, V2 runtime aktif olduğunda bypass edilir. Ancak `scada-client.js` içinde hala canlıdır ve mock/geri uyumluluk senaryolarında devreye girebilir. V2'deki `terminal-exit-model` ve alias çözümlemesi olmadan çalıştığı için aynı ham veri farklı yön sonuçları üretebilir.

---

## 2. Tespit Edilen Hatalar / Mantıksal Boşluklar (Bugs)

### Bug 1: Builder Katmanında Polarizasyon Kuralının Sertliği
`build_kml_layers_v2.py` içinde `polarizationConsistent = formula_sign == polarization_sign` kuralı, end terminaline bağlı bir ölçümde `formulaSign = +1` ise tutarsız kabul eder. Oysa fiili veride (örnek: `(+1) SIRRIN, 380, ATATURK, P`) bu tür kayıtlar mevcuttur. Runtime (`scada-v2-runtime.js`) bu kayıtları `terminal-exit-model` ile çözebilmekte ve `resolvedTerminalMismatch = true` olarak işaretlemektedir. Ancak builder validasyon raporuna `polarizationMismatch` olarak yansıması, config kalitesi izlenirken yanıltıcıdır ve audit/mismatch raporlarında gereksiz "uyumsuz" etiketi oluşturur.

### Bug 2: `computeLoadingMagnitude` içinde Reaktif Yoksa `1` Kullanılması
`scada-v2-runtime.js:893` satırında:
```javascript
const reactiveForLoading = Number.isFinite(reactiveMagnitude) ? reactiveMagnitude : 1;
return Math.sqrt((activeMagnitude ** 2) + (reactiveForLoading ** 2));
```
Reaktif ölçümü olmayan bir hat için `1` sabiti eklenerek hesaplanmaktadır. Bu, fiziksel olarak temelsizdir. Reaktif yoksa `sqrt(MW^2 + 0) = |MW|` olmalıdır; `1` eklenmesi özellikle düşük yüklenmeli hatlarda (`|MW| < 10`) görünür bir sapma yaratır.

### Bug 3: `resolvedTerminalMismatch` Kayıtlarının Audit ve Flow Map Arasındaki Tutarsızlığı
`rebuildLineFlowMap` içinde (`scada-v2-runtime.js:1550`) `sourceAmbiguous`, `unresolved`, `candidateConflict`, `backupUsed` kontrolleri yapılırken `resolvedTerminalMismatch` kontrol edilmemektedir. Sonuç olarak, formül polarizasyonu builder'a göre "uyumsuz" olarak işaretlenen ama runtime tarafından `terminal-exit-model` ile çözülen kayıtlar hem haritada ok çizilir hem de audit raporunda `polarization-mismatch` veya `orientation-unknown` sepetine düşebilir. Kullanıcı "mismatch raporunda hata var ama haritada ok var" şeklinde tutarsız bir deneyim yaşar.

### Bug 4: Legacy `applyScadaSnapshot` ile V2 Runtime Arasındaki Yön Tutarsızlığı
`scada-client.js` (satır 627) ile `scada-v2-runtime.js` (satır 1564) arasında `direction` hesaplaması farklıdır. Eğer V2 runtime bir sebeple atlanır veya mock veri legacy yolla işlenirse, aynı `activePowerMw` değeri için `forward/reverse` kararı farklı çıkabilir. Bu, özellikle test ve mock geçişlerinde regresyon riski taşır.

### Bug 5: Aynı `measurementId`'nin Builder Seviyesinde Çift Kaydı
`build_kml_layers_v2.py` içinde `append_scada_metric()` fonksiyonu, aynı `measurementId`'ye sahip farklı formül satırlarını (örneğin biri `(+1)`, diğeri `(-1)`) aynı metrik altında iki ayrı `row` olarak saklar ve `ambiguous = true` set eder. Bu durum runtime'da `candidateConflict = true` olarak yansır. Builder'da bu tür çift kayıtlar deduplicate edilmediği için, kaynak veri temiz olmasa bile runtime "iki uc ölçümü çakışıyor" gibi davranır.

### Bug 6: Bayat (Stale) Veri UI'da Görünürlük Sorunu
`scada-flow.js` ve panel render kodunda zaman/sütun genişliği (`98px`) dar tutulmuş ve `white-space: nowrap` uygulanmıştır. `getAgeLabel()` ile üretilen `· Gecikmeli` veya `· Bayat` etiketleri DOM'da mevcut olmasına rağmen, hücre genişliği ve `text-overflow: ellipsis` nedeniyle kullanıcıya görünmez hale gelir. Sonuç olarak operatör, verinin bayat olduğunu fark edemez.

### Bug 7: `getFlowColor` / `getFlowWidth` Eşiklerinde Reaktif Mod İçin Ayrı Hesap Yetersizliği
`scada-client.js` içindeki `LOADING_THRESHOLDS` yalnızca aktif güç (MW) yüklenmesine göre kurgulanmıştır. `scada-v2-runtime.js` içinde `MVAR_RATIO_THRESHOLDS` tanımlı olsa da, legacy `getFlowColor()` ve `getFlowWidth()` fonksiyonları bu yeni eşikleri kullanmaz. Reaktif modda (`Hat (MVar)`) görselleştirme, aktif güç eşikleriyle renklendirilir; bu da reaktif yüklenmenin farklı fiziksel anlamını yansıtmaz.

---

## 3. Çözüm ve Geliştirme Önerileri

### Öneri 1: Terminal-Exit Modelinin Builder'a Taşınması
`build_kml_layers_v2.py` içindeki `polarizationConsistent` kuralı, end terminali +1 formülünü otomatik "hatalı" saymamalıdır. Bunun yerine builder, ölçümün bağlı olduğu terminal ve formül işareti üzerinden **beklenen fiziksel yönü** (`expectedNetworkDirection`) hesaplamalıdır:
- `terminal = start`, `raw > 0` → `start → end` (forward)
- `terminal = end`, `raw > 0` → `end → start` (reverse)

`polarizationConsistent` alanı yerine `directionConfidence` (0-1 arası güven skoru) ve `resolvedTerminalMismatch` (boolean) alanları taşınmalıdır. Böylece runtime, builder'dan gelen "uyumsuz" etiketi yerine "düşük güvenilirlikli ama çözülebilir" etiketi alır.

### Öneri 2: Builder Seviyesinde `measurementId` Dedup Mekanizması
`append_scada_metric()` içinde aynı `measurementId`'ye sahip kayıtlar gruplanmalıdır. Eğer aynı ID için zıt polariteli formüller varsa:
- Validation raporuna `single-id-dual-formula` uyarısı yazılmalı,
- İki ayrı aday yerine `formulaVariants` altında birleştirilmeli,
- Runtime'a `candidateConflict = false` olarak iletilmelidir.

Bu, `ambiguous-warning` grubunu belirgin şekilde azaltır.

### Öneri 3: `computeLoadingMagnitude` Düzeltmesi
`scada-v2-runtime.js:893` satırı şu şekilde değiştirilmelidir:
```javascript
const reactiveForLoading = Number.isFinite(reactiveMagnitude) ? reactiveMagnitude : 0;
```
Reaktif ölçüm yoksa `0` alınarak `loadingMagnitude = |MW|` sağlanmalıdır. Mevcut `1` değeri fiziksel temelsizdir.

### Öneri 4: `resolvedTerminalMismatch` Durumunun Tutarlı İşlenmesi
`rebuildLineFlowMap` içinde `resolvedTerminalMismatch` true olan kayıtlar **haritada ok çizilmeye devam etmeli** (çünkü yön çözülmüştür), ancak audit raporunda ve popup detayında `resolved-terminal-mismatch` (düşük güvenilirlikli ama çözülmüş) olarak ayrı bir kategoride raporlanmalıdır. Mevcut durumda bu kayıtlar `orientation-unknown` sepetine düşmemesi için `pickHatUnresolvedReason` fonksiyonunda `resolvedTerminalMismatch` kontrolü eklenmeli ve bu kayıtlar `unresolved = false` olarak işaretlenmelidir.

### Öneri 5: SCADA Snapshot Kalıcılığı ve İki Katmanlı Depolama
`chrome.storage.local` (kısa vadeli son durum) ve `IndexedDB` (uzun vadeli history) mimarisi kurulmalıdır. `entityMetricsByKey`, `lineFlowByLineId` ve `visibleSummary` sayfa yenilemede kaybolmamalıdır. Bu, README'de de vurgulanan en kritik eksikliklerden biridir.

### Öneri 6: UI ve Deneyim İyileştirmeleri
- **Zaman Kolonu Genişliği:** `.col-ts` minimum `150px` yapılmalı; stale etiketi ikinci satıra düşürülmeli veya ayrı bir chip olarak gösterilmelidir.
- **Durum Filtreleri:** SCADA paneline `Tümü / Canlı / Gecikmeli / Bayat / Belirsiz` filtreleri eklenmelidir.
- **YTBS Referans Yön Katmanı:** Haritada, SCADA verisi olmayan veya belirsiz olan hatlar için ince gri referans okları (`startTm → endTm`) sürekli gösterilmelidir. Canlı SCADA yönü bu referansın üzerine renkli/anlık ok olarak çizilmelidir. Bu, kullanıcı algısındaki "YTBS'de var burada yok" farkını kapatır.

### Öneri 7: Legacy ve V2 Kod Yollarının Tam Ayrılması
`scada-client.js` içindeki `applyScadaSnapshot` fonksiyonu, V2 runtime aktif olduğunda tamamen bypass edilmeli; `lineFlowByLineId` üretimi yalnızca `scada-v2-runtime.js` içindeki `rebuildLineFlowMap` üzerinden yürütülmelidir. Aksi halde, mock geçişleri, test senaryoları veya hata durumlarında iki farklı matematik çakışabilir ve yön tutarsızlıklarına yol açabilir. V2 devredeyken legacy `direction` hesabına hiç güvenilmemelidir.

---

**Raporu Özetleyen Anahtar Çıkarımlar:**
1. Yön belirleme algoritması aslında oldukça gelişmiş (`terminal-exit-model` + alias fallback + toleranslı ortalama).
2. En büyük darboğaz, builder katmanının end-terminal + (+1) formülünü hatalı saymasıdır. Runtime bunu çözmektedir ancak builder'dan gelen `polarizationConsistent=false` bayrağı audit/mismatch raporlarını kirletmektedir.
3. `computeLoadingMagnitude` içindeki `1` sabiti ve `resolvedTerminalMismatch`'in tutarsız işlenmesi, operasyonel güvenilirliği hafifçe düşüren teknik detaylardır.
4. UI'da stale etiketlerinin görünmezliği ve YTBS referans yönünün eksikliği, kullanıcı tarafında "veri kayboldu / yön yok" algısını güçlendirmektedir.