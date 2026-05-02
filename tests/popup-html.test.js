const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const popupHtmlPath = path.join(__dirname, '..', 'popup.html');
const popupJsPath = path.join(__dirname, '..', 'popup.js');
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const mapModernHtmlPath = path.join(__dirname, '..', 'map-modern.html');

test('popup.html loads map-common.js before popup.js', () => {
  const html = fs.readFileSync(popupHtmlPath, 'utf8');

  assert.match(
    html,
    /<script src="map-common\.js"><\/script>\s*<script src="popup\.js"><\/script>/i
  );
});

test('popup.js resolves text normalization through MAP_COMMON helper', () => {
  const code = fs.readFileSync(popupJsPath, 'utf8');

  assert.match(code, /MAP_COMMON\.normalizeText/);
  assert.doesNotMatch(code, /function normalizeText\(/);
});

test('extension shell uses YKS naming in visible titles', () => {
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  const mapModernHtml = fs.readFileSync(mapModernHtmlPath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.name, 'SCADA/YTBS/TPYS/YKS Haritalar ve Otomasyon');
  assert.equal(manifest.action.default_title, 'SCADA/YTBS/TPYS/YKS Haritalar ve Otomasyon');
  assert.match(popupHtml, /<title>SCADA\/YTBS\/TPYS\/YKS Haritalar ve Otomasyon<\/title>/);
  assert.match(popupHtml, /<h1>SCADA\/YTBS\/TPYS\/YKS Haritalar ve Otomasyon<\/h1>/);
  assert.match(popupHtml, /<h2>RGDH Uzlaştırma Otomasyon<\/h2>/);
  assert.match(mapModernHtml, />SCADA\/YTBS\/TPYS\/YKS Haritalar<\/h2>/);
});
