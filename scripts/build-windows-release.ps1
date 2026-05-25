# Build installateur Windows production AT72Manager
# Prérequis : Node.js, Rust, Visual Studio Build Tools, WiX (MSI), NSIS (via Tauri)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== AT72Manager — build Windows release ===" -ForegroundColor Cyan

if (-not (Test-Path ".env.production")) {
  Write-Warning "Fichier .env.production absent. Copiez .env.production.example et renseignez Supabase / Google."
}

if (-not (Test-Path "src-tauri\icons\icon.ico")) {
  Write-Host "Génération des icônes Tauri…" -ForegroundColor Yellow
  npm run icons:generate
}

npm run version:sync
npm run build:windows

Write-Host ""
Write-Host "Artefacts générés (dossier src-tauri\target\release\bundle\) :" -ForegroundColor Green
Write-Host "  - .exe portable"
Write-Host "  - installateur NSIS (.exe setup)"
Write-Host "  - package MSI (WiX)"
