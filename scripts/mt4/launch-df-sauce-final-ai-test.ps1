param(
    [string]$TerminalExe = "C:\KOT MT4 Terminal\terminal.exe",
    [string]$Expert = "DF SAUCE FINAL AI.ex4",
    [string]$Symbol = "XAUUSD",
    [string]$Period = "M15",
    [string]$FromDate = "2024.01.01",
    [string]$ToDate = "2025.12.31",
    [int]$Deposit = 1000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $TerminalExe)) {
    throw "Terminal not found: $TerminalExe"
}

$cfgPath = "C:\Users\jaque\Documents\TRADING ECOSYSTEM\config\mt4\df-sauce-final-ai-test.ini"
$reportPath = "C:\Users\jaque\Documents\TRADING ECOSYSTEM\data\backtests\df-sauce-final-ai-$Symbol-$Period"

$content = @"
[Tester]
Expert=$Expert
ExpertParameters=
Symbol=$Symbol
Period=$Period
Model=0
FromDate=$FromDate
ToDate=$ToDate
Report=$reportPath
ReplaceReport=1
ShutdownTerminal=0
Deposit=$Deposit
Currency=USD
Optimization=0
Visual=1
"@

Set-Content -Path $cfgPath -Value $content -Encoding ASCII
Start-Process -FilePath $TerminalExe -ArgumentList "/config:$cfgPath"

Write-Host "Launched DF SAUCE FINAL AI visual test:"
Write-Host "  Expert: $Expert"
Write-Host "  Symbol: $Symbol"
Write-Host "  Period: $Period"
Write-Host "  Config: $cfgPath"
