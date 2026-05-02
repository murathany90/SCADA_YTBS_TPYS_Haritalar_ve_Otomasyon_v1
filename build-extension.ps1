$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root 'dist'
$extensionRoot = Join-Path $dist 'chrome-extension'
$manifestPath = Join-Path $root 'manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

function Get-SafeArtifactName([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    $safe = 'chrome-extension'
  } else {
    $safe = $value.Trim()
  }
  $safe = $safe -replace '[\\/:*?"<>|]+', ' '
  $safe = $safe -replace '\s+', ' '
  $safe = $safe.Trim()
  $safe = $safe -replace ' ', '_'
  return $safe
}

$extensionName = Get-SafeArtifactName $manifest.name
if ([string]::IsNullOrWhiteSpace([string]$manifest.version)) {
  $extensionVersion = '0.0.0'
} else {
  $extensionVersion = [string]$manifest.version
}
$buildDate = Get-Date -Format 'yyyyMMdd'
$zipFileName = '{0}_v{1}_{2}.zip' -f $extensionName, $extensionVersion, $buildDate
$zipPath = Join-Path $dist $zipFileName

$files = @(
  'manifest.json',
  'background.js',
  'content-script.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'rgdh-monitor.html',
  'rgdh-monitor.css',
  'rgdh-monitor.js',
  'rgdh-api-client.js',
  'rgdh-normalizer.js',
  'rgdh-pivot.js',
  'rgdh-comparison.js',
  'rgdh-charts.js',
  'rgdh-csv.js',
  'rgdh-storage.js',
  'rgdh-dom-bridge.js',
  'rgdh-diagnostics.js',
  'rgdh-catalog-data.js',
  'rgdh-auxiliary-catalog.js',
  'yks_izleme_modul/yks_docs/rgdh_unite_tanimi_v2.csv',
  'yks_izleme_modul/yks_docs/rgdh_unite_tanimi_.csv',
  'yks-rgdh-instrumentation.js',
  'yks-rgdh-diagnostic-bridge.js',
  'map.html',
  'map.css',
  'map.js',
  'map-common.js',
  'map-modern.html',
  'map-modern.css',
  'map-modern.js',
  'map-v2-runtime.js',
  'scada-common.js',
  'scada-client.js',
  'scada-flow.js',
  'scada-v2-runtime.js'
)

$directories = @(
  'data',
  'lib'
)

if (Test-Path -LiteralPath $extensionRoot) {
  Remove-Item -LiteralPath $extensionRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $extensionRoot -Force | Out-Null

foreach ($relativePath in $files) {
  $sourcePath = Join-Path $root $relativePath
  $targetPath = Join-Path $extensionRoot $relativePath
  $targetDirectory = Split-Path -Parent $targetPath
  if (-not (Test-Path -LiteralPath $targetDirectory)) {
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
  }
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
}

foreach ($relativePath in $directories) {
  $sourcePath = Join-Path $root $relativePath
  Copy-Item -LiteralPath $sourcePath -Destination $extensionRoot -Recurse -Force
}

$reservedPaths = Get-ChildItem -LiteralPath $extensionRoot -Recurse -Force -File |
  Where-Object { $_.Name.StartsWith('_') -and -not $_.Name.EndsWith('.csv') } |
  Select-Object -ExpandProperty FullName

if ($reservedPaths) {
  throw "Chrome reserved path bulundu:`n$($reservedPaths -join "`n")"
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $extensionRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal

Write-Output "[OK] Unpacked: $extensionRoot"
Write-Output "[OK] Zip: $zipPath"
