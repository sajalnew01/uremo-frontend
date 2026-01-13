Add-Type -AssemblyName System.Drawing

$public = Join-Path $PSScriptRoot "..\public"
New-Item -ItemType Directory -Force -Path (Join-Path $public "brand") | Out-Null

function New-UremoLogoPng([string]$path) {
  $bmp = New-Object System.Drawing.Bitmap 600, 180, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $font = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
  $green = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
  $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
  $brushWhite = New-Object System.Drawing.SolidBrush $white
  $brushGreen = New-Object System.Drawing.SolidBrush $green

  $g.DrawString("U", $font, $brushGreen, 0, 30)
  $g.DrawString("REMO", $font, $brushWhite, 70, 30)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

function New-UremoMarkPng([string]$path, [int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $bg = [System.Drawing.Color]::FromArgb(255, 11, 18, 32)
  $green = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size

  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg, $green, 45)
  $g.FillRectangle($lg, $rect)
  $lg.Dispose()

  $fontSize = [Math]::Floor($size * 0.55)
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
  $white = [System.Drawing.Color]::FromArgb(245, 255, 255, 255)
  $brushWhite = New-Object System.Drawing.SolidBrush $white

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString("U", $font, $brushWhite, $rect, $sf)
  $sf.Dispose()

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

function New-UremoOgPng([string]$path) {
  $w = 1200; $h = 630
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bg1 = [System.Drawing.Color]::FromArgb(255, 3, 7, 18)
  $bg2 = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h

  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg1, $bg2, 35)
  $g.FillRectangle($lg, $rect)
  $lg.Dispose()

  $green = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
  $blue = [System.Drawing.Color]::FromArgb(255, 59, 130, 246)
  $top = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $green, $blue, 20)
  $g.FillRectangle($top, (New-Object System.Drawing.Rectangle 0, 0, $w, 10))
  $top.Dispose()

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 72, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
  $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
  $muted = [System.Drawing.Color]::FromArgb(255, 156, 163, 175)

  $brushW = New-Object System.Drawing.SolidBrush $white
  $brushM = New-Object System.Drawing.SolidBrush $muted
  $brushG = New-Object System.Drawing.SolidBrush $green

  $g.DrawString("U", $titleFont, $brushG, 70, 200)
  $g.DrawString("REMO", $titleFont, $brushW, 150, 200)
  $g.DrawString("Verified digital onboarding & marketplace", $subFont, $brushM, 70, 320)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-UremoLogoPng (Join-Path $public "brand\uremo-logo.png")
New-UremoMarkPng (Join-Path $public "brand\uremo-logo-mark.png") 256

# Required naming system (brand folder)
New-UremoLogoPng (Join-Path $public "brand\logo-full.png")
New-UremoMarkPng (Join-Path $public "brand\logo-mark.png") 256
New-UremoMarkPng (Join-Path $public "brand\favicon.png") 64
New-UremoMarkPng (Join-Path $public "brand\apple-touch.png") 180
New-UremoOgPng (Join-Path $public "brand\og.png")

# Keep legacy root-level assets for compatibility
New-UremoMarkPng (Join-Path $public "icon.png") 512
New-UremoMarkPng (Join-Path $public "apple-touch-icon.png") 180
New-UremoMarkPng (Join-Path $public "favicon.png") 64
New-UremoOgPng (Join-Path $public "og.png")

# Remove default template svg assets
$toDelete = @(
  "apple-touch-icon.svg",
  "favicon.svg",
  "file.svg",
  "globe.svg",
  "icon.svg",
  "next.svg",
  "og.svg",
  "vercel.svg",
  "window.svg"
)
foreach ($f in $toDelete) {
  $p = Join-Path $public $f
  if (Test-Path $p) { Remove-Item -Force $p }
}

Write-Output "Brand assets generated in $public"