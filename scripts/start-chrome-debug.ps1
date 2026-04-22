param(
  [int]$Port = 9222,
  [string]$UserDataDir = "$env:TEMP\tpys-chrome-devtools-mcp-profile",
  [switch]$LoadExtension
)

$ErrorActionPreference = "Stop"

$candidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

$browser = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) {
  throw "Chrome veya Edge executable bulunamadi."
}

New-Item -ItemType Directory -Force -Path $UserDataDir | Out-Null

$args = @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=$UserDataDir",
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank"
)

if ($LoadExtension) {
  $extensionDir = Join-Path (Resolve-Path ".").Path "dist\chrome-extension"
  if (-not (Test-Path -LiteralPath $extensionDir)) {
    throw "Extension klasoru bulunamadi. Once npm run build:extension calistirin."
  }
  $args = @("--load-extension=$extensionDir") + $args
}

Start-Process -FilePath $browser -ArgumentList $args
Write-Host "[OK] Chrome debug port $Port ile baslatildi."
Write-Host "[OK] MCP server icin: npm run mcp:chrome"
