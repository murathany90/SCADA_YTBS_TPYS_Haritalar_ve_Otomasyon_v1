#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
EXT="$DIST/chrome-extension"
ZIP="$DIST/tpys-reaktif-eslestirme-extension.zip"

FILES=(
  manifest.json
  background.js
  content-script.js
  popup.html
  popup.css
  popup.js
  map.html
  map.css
  map.js
  map-common.js
  map-modern.html
  map-modern.css
  map-modern.js
  map-v2-runtime.js
  scada-common.js
  scada-client.js
  scada-flow.js
  scada-v2-runtime.js
)

DIRS=(
  data
  lib
)

rm -rf "$EXT"
mkdir -p "$EXT"

for file in "${FILES[@]}"; do
  cp "$ROOT/$file" "$EXT/$file"
done

for dir in "${DIRS[@]}"; do
  cp -R "$ROOT/$dir" "$EXT/$dir"
done

if find "$EXT" -mindepth 1 \( -name '_*' -o -path '*/_*' \) | grep -q .; then
  echo "[ERR] Reserved path detected in $EXT"
  find "$EXT" -mindepth 1 \( -name '_*' -o -path '*/_*' \)
  exit 1
fi

rm -f "$ZIP"
(
  cd "$EXT"
  zip -rq "$ZIP" .
)
echo "[OK] Unpacked: $EXT"
echo "[OK] Zip: $ZIP"
