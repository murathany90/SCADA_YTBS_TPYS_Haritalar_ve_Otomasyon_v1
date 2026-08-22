# WebSCADA

WebSCADA v0.2.0 is a standalone Manifest V3 Chrome extension for the current modern
map and Superset SCADA experience. It is intentionally self-contained: all
runtime code and topology data live below this folder, and it does not import
or fetch parent-repository files.

## Run and package

1. Copy `data/scada_auth.example.json` to `data/scada_auth.json` and provide
   the local Superset credentials. This file is ignored by Git.
2. Run `npm.cmd test` and `npm.cmd run build` in this folder.
3. Load `dist/chrome-extension` with Chrome's **Load unpacked** command, or
   use the timestamped ZIP beside it.

`Web_SCADA/` can be moved to its own repository as-is; it has its own tests,
build script, runtime data, and extension manifest.

## v0.2.0

- Query/Data workspace normalizes real Superset `__timestamp`, `sinsid`,
  `elementName`, and `AVG(maxValue)` rows through the same SCADA timestamp parser
  used by the map.
- Terminal-aware measurement descriptors keep P/Q measurements separate in charts,
  tables, and normalized UTF-8 BOM CSV exports.
- Query summaries report requested/effective grain, response quality statistics,
  pagination, conservative request limits, and partial batches.
