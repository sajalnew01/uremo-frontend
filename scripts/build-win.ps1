param(
  [int]$MaxOldSpaceMb = 6144,
  [switch]$DisableSwc,
  [switch]$NoClean
)

$ErrorActionPreference = "Stop"

# Move to frontend root (this script lives in ./scripts)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $NoClean) {
  if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
  }
}

$env:NODE_OPTIONS = "--max_old_space_size=$MaxOldSpaceMb"

# Workaround for intermittent Next.js build worker crashes on some Windows setups.
if ($DisableSwc) {
  $env:NEXT_DISABLE_SWC = "1"
}

# Keep logs quieter in CI-like runs
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "[build-win] NODE_OPTIONS=$env:NODE_OPTIONS"
if ($DisableSwc) { Write-Host "[build-win] NEXT_DISABLE_SWC=1" }

npm run build
