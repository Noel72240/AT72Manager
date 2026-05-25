# Vérifie les prérequis build Windows AT72Manager
$ErrorActionPreference = "Continue"
$ok = $true

function Test-Cmd($name, $cmd) {
  $found = Get-Command $cmd -ErrorAction SilentlyContinue
  if ($found) {
    Write-Host "[OK] $name : $($found.Source)" -ForegroundColor Green
    return $true
  }
  Write-Host "[MANQUANT] $name ($cmd)" -ForegroundColor Red
  return $false
}

Write-Host "=== Prérequis build AT72Manager ===" -ForegroundColor Cyan

$ok = (Test-Cmd "Node.js" "node") -and $ok
$ok = (Test-Cmd "npm" "npm") -and $ok
$ok = (Test-Cmd "Rust (rustc)" "rustc") -and $ok
$ok = (Test-Cmd "Cargo" "cargo") -and $ok
$ok = (Test-Cmd "Tauri CLI" "tauri") -and $ok

# MSVC via rustup target
$target = rustup show 2>$null | Select-String "x86_64-pc-windows-msvc"
if ($target) {
  Write-Host "[OK] Cible Rust windows-msvc installée" -ForegroundColor Green
} else {
  Write-Host "[AVERTISSEMENT] Cible x86_64-pc-windows-msvc - rustup default stable-msvc" -ForegroundColor Yellow
}

# WiX pour MSI
$wixPaths = @(
  "${env:ProgramFiles(x86)}\WiX Toolset v3.14\bin\candle.exe",
  "${env:ProgramFiles(x86)}\WiX Toolset v3.11\bin\candle.exe",
  "${env:ProgramFiles}\WiX Toolset v3.14\bin\candle.exe"
)
$wix = $wixPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($wix) {
  Write-Host "[OK] WiX Toolset (MSI) : $wix" -ForegroundColor Green
} else {
  Write-Host "[MANQUANT] WiX Toolset v3 - MSI non genere" -ForegroundColor Yellow
  Write-Host "         Installez: winget install WiXToolset.WiXToolset" -ForegroundColor Yellow
  Write-Host "         Ou build NSIS seul: npm run build:windows:nsis" -ForegroundColor Yellow
}

# NSIS souvent fourni par Tauri / CI
if (Test-Cmd "NSIS (optionnel)" "makensis") { } else {
  Write-Host "[INFO] makensis absent du PATH — Tauri peut utiliser son bundler NSIS interne" -ForegroundColor DarkGray
}

if (-not (Test-Path ".env.production")) {
  Write-Host "[MANQUANT] .env.production - copiez depuis .env.production.example" -ForegroundColor Red
  $ok = $false
} else {
  Write-Host "[OK] .env.production présent" -ForegroundColor Green
}

if (-not (Test-Path "src-tauri\icons\icon.ico")) {
  Write-Host "[MANQUANT] Icones - npm run icons:generate" -ForegroundColor Red
  $ok = $false
} else {
  Write-Host "[OK] Icone icon.ico" -ForegroundColor Green
}

if ($ok) {
  Write-Host "`nPrêt pour le build (MSI nécessite WiX)." -ForegroundColor Green
} else {
  Write-Host "`nCorrigez les elements manquants avant build:windows." -ForegroundColor Red
  exit 1
}
