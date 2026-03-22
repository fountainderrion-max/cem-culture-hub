param(
    [string]$Symbol = "XAUUSD",
    [string]$Period = "M15",
    [switch]$ForceBuyBootstrap,
    [int]$ConsensusIntervalSeconds = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = "C:\Users\jaque\Documents\TRADING ECOSYSTEM"

Write-Host "Starting trading console server..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory "$root\app"
Start-Sleep -Seconds 1

Write-Host "Refreshing AI EA install..."
powershell -ExecutionPolicy Bypass -File "$root\scripts\mt4\install-df-sauce-final-ai.ps1"

Write-Host "Starting AI consensus updater..."
if ($ForceBuyBootstrap) {
    Start-Process -FilePath powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$root\scripts\mt4\update-ai-consensus-from-console.ps1`" -Symbol $Symbol -IntervalSeconds $ConsensusIntervalSeconds -ForceAction BUY -ForceConfidence 0.70 -ForceLotMultiplier 1.20"
}
else {
    Start-Process -FilePath powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$root\scripts\mt4\update-ai-consensus-from-console.ps1`" -Symbol $Symbol -IntervalSeconds $ConsensusIntervalSeconds"
}

Write-Host "Launching DF SAUCE FINAL AI visual test..."
powershell -ExecutionPolicy Bypass -File "$root\scripts\mt4\launch-df-sauce-final-ai-test.ps1" -Symbol $Symbol -Period $Period

Write-Host "Stack running:"
Write-Host "  Console: http://localhost:3000"
Write-Host "  AI feed: $env:APPDATA\MetaQuotes\Terminal\Common\Files\TE\ai\consensus.csv"
Write-Host "  EA: DF SAUCE FINAL AI"
