# Prepare square 1024x1024 icon from branding/app-icon.png for Tauri
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $root "branding\app-icon.png"
$outPath = Join-Path $root "branding\app-icon-square.png"

if (-not (Test-Path $sourcePath)) {
  Write-Error "Placez votre logo dans branding\app-icon.png"
}

$size = 1024
$padding = 96

$source = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Fond atelier (proche du logo)
$g.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 18))

$maxDim = $size - (2 * $padding)
$scale = [Math]::Min($maxDim / $source.Width, $maxDim / $source.Height)
$newW = [int][Math]::Round($source.Width * $scale)
$newH = [int][Math]::Round($source.Height * $scale)
$x = [int](($size - $newW) / 2)
$y = [int](($size - $newH) / 2)
$g.DrawImage($source, $x, $y, $newW, $newH)

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$source.Dispose()

Write-Host "Icone carree generee: $outPath (${size}x${size})"
