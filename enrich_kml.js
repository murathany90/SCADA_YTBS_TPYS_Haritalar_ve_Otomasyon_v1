const fs = require('fs');
const path = require('path');

console.log("Reading CSV file...");
const csvPath = path.join(__dirname, 'hat_scada_eslestirme.csv');
const csvStr = fs.readFileSync(csvPath, 'utf8');

const lines = csvStr.split('\n');
const idMap = {};

for (let i = 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;

    const parts = l.split(';');
    // parts[0]: ID
    // parts[1]: SİSTEM TÜRÜ
    // parts[2]: TRAFO MERKEZİ
    // parts[3]: HAT Adı
    // parts[4]: HAT ID
    // parts[5]: ANALOG ÖLÇÜM (Aktif Güç (MW) / Reaktif Güç (MVAr))
    // parts[6]: ÖLÇÜM NOKTASI ID
    // parts[7]: ÖLÇÜM NOKTASI FORMÜLASYONU

    if (parts.length < 7) continue;

    const hatId = parts[4].trim();
    const olcumType = parts[5].trim();
    const olcumId = parts[6].trim();

    if (!hatId) continue;

    if (!idMap[hatId]) {
        idMap[hatId] = {};
    }

    if (olcumType.includes('Aktif Güç')) {
        idMap[hatId].olcumNoktasiIdAktif = olcumId;
    } else if (olcumType.includes('Reaktif Güç')) {
        idMap[hatId].olcumNoktasiIdReaktif = olcumId;
    }
}

console.log(`Parsed ${Object.keys(idMap).length} unique Hat IDs from CSV.`);

const kmlPath = path.join(__dirname, 'data', 'kml_layers.json');
console.log("Reading kml_layers.json...");
const dataStr = fs.readFileSync(kmlPath, 'utf8');
const data = JSON.parse(dataStr);

let enrichedCount = 0;

if (data.hatLines && Array.isArray(data.hatLines)) {
    for (const hat of data.hatLines) {
        const strId = String(hat.kmlDescriptionId);
        if (idMap[strId]) {
            let matched = false;
            if (idMap[strId].olcumNoktasiIdAktif) {
                hat.olcumNoktasiIdAktif = idMap[strId].olcumNoktasiIdAktif;
                matched = true;
            }
            if (idMap[strId].olcumNoktasiIdReaktif) {
                hat.olcumNoktasiIdReaktif = idMap[strId].olcumNoktasiIdReaktif;
                matched = true;
            }
            
            if (matched) {
                enrichedCount++;
            }
        }
    }
} else {
    console.warn("Could not find 'hatLines' array in kml_layers.json.");
}

console.log(`Enriched ${enrichedCount} hatLines elements with SCADA IDs.`);

console.log("Writing changes back to kml_layers.json...");
fs.writeFileSync(kmlPath, JSON.stringify(data, null, 2), 'utf8');

console.log("Done.");
