param(
    [string]$Mt4DataFolder = "C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\BAEC37CBBA31C26B3C8E7E5183FE4CC4",
    [string]$SourceEaFile = "C:\Users\jaque\Documents\TRADING ECOSYSTEM\experts\derived\DF SAUCE FINAL AI.mq4"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$expertsDir = Join-Path $Mt4DataFolder "MQL4\Experts"
if (-not (Test-Path $expertsDir)) {
    throw "MT4 Experts folder not found: $expertsDir"
}
if (-not (Test-Path $SourceEaFile)) {
    throw "Source EA file not found: $SourceEaFile"
}

$destEa = Join-Path $expertsDir "DF SAUCE FINAL AI.mq4"
Copy-Item -Path $SourceEaFile -Destination $destEa -Force

$commonRoot = Join-Path $env:APPDATA "MetaQuotes\Terminal\Common\Files\TE\ai"
New-Item -ItemType Directory -Force -Path $commonRoot | Out-Null
$consensusFile = Join-Path $commonRoot "consensus.csv"
if (-not (Test-Path $consensusFile)) {
    "XAUUSD,BUY,0.70,1.20,0" | Set-Content -Path $consensusFile -Encoding ASCII
}

Write-Host "Installed EA source: $destEa"
Write-Host "AI consensus feed: $consensusFile"
Write-Host "Next: open MetaEditor and compile DF SAUCE FINAL AI.mq4"
