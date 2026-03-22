param(
    [string]$Expert = "DF_QUANTUM\\DF_QUANTUM.ex4",
    [string]$Symbol = "XAUUSD",
    [string]$Period = "M15",
    [string]$FromDate = "2024.01.01",
    [string]$ToDate = "2025.12.31",
    [int]$Deposit = 50,
    [string]$SetFile = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$terminalExe = "C:\KOT MT4 Terminal\terminal.exe"
$cfgPath = "C:\Users\jaque\Documents\TRADING ECOSYSTEM\config\mt4\live-ea-test.ini"

if (-not (Test-Path $terminalExe)) {
    throw "Terminal not found: $terminalExe"
}

$expertParams = ""
if ($SetFile -ne "" -and (Test-Path $SetFile)) {
    $expertParams = [System.IO.Path]::GetFullPath($SetFile)
}

$content = @"
[Tester]
Expert=$Expert
ExpertParameters=$expertParams
Symbol=$Symbol
Period=$Period
Model=0
FromDate=$FromDate
ToDate=$ToDate
Report=C:\Users\jaque\Documents\TRADING ECOSYSTEM\data\backtests\optimization-50\last-live-test
ReplaceReport=1
ShutdownTerminal=0
Deposit=$Deposit
Currency=USD
Optimization=0
Visual=1
"@

Set-Content -Path $cfgPath -Value $content -Encoding ASCII
Start-Process -FilePath $terminalExe -ArgumentList "/config:$cfgPath"

Write-Host "Launched MT4 tester:"
Write-Host "  Expert: $Expert"
Write-Host "  Symbol: $Symbol"
Write-Host "  Period: $Period"
Write-Host "  From/To: $FromDate -> $ToDate"
Write-Host "  Deposit: $Deposit"
if ($expertParams -ne "") {
    Write-Host "  SetFile: $expertParams"
}
