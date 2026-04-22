const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const popupHtmlPath = path.join(__dirname, '..', 'popup.html');
const popupJsPath = path.join(__dirname, '..', 'popup.js');

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
