# WebSCADA

WebSCADA v0.1.3 is a standalone Manifest V3 Chrome extension for the current modern
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
