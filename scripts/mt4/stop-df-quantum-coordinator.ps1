param(
    [string]$ConfigFile = ".\config\mt4\df-quantum-coordinator.config.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $ConfigFile)) {
    throw "Config file not found: $ConfigFile"
}

$cfg = Get-Content -Path $ConfigFile -Raw | ConvertFrom-Json
$stopFile = $cfg.paths.stopFile
$stopDir = Split-Path -Parent $stopFile
if ($stopDir -and -not (Test-Path $stopDir)) {
    New-Item -ItemType Directory -Path $stopDir -Force | Out-Null
}

Set-Content -Path $stopFile -Value ([DateTime]::UtcNow.ToString("o")) -Encoding ASCII
Write-Host "Stop signal written: $stopFile"
