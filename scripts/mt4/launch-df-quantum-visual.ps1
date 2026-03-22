param(
    [string]$Symbol = "XAUUSD",
    [string]$Period = "M15",
    [string]$FromDate = "2024.01.01",
    [string]$ToDate = "2025.12.31",
    [int]$Deposit = 1000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Primary MT4 selection pinned to DF HIGHTOWER terminal/data pair.
$terminalExe = "C:\KOT MT4 Terminal\terminal.exe"
$dataFolder = "C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\BAEC37CBBA31C26B3C8E7E5183FE4CC4"
$expertPath = Join-Path $dataFolder "MQL4\Experts\DF_QUANTUM\DF_QUANTUM.ex4"

if (-not (Test-Path $terminalExe)) {
    throw "Primary terminal not found: $terminalExe"
}
if (-not (Test-Path $expertPath)) {
    throw "DF_QUANTUM.ex4 not found: $expertPath"
}

$cfgPath = Join-Path $PSScriptRoot "..\..\config\mt4\df-quantum-visual-test.ini"
$cfgPath = [System.IO.Path]::GetFullPath($cfgPath)
$reportPath = Join-Path $dataFolder "DF_QUANTUM_${Symbol}_${Period}_${FromDate}_${ToDate}.htm"

$cfg = @"
[Common]
Login=0
ProxyEnable=0

[Charts]
MaxBars=5000000
MaxBarsInChart=5000000

[Tester]
Expert=DF_QUANTUM\DF_QUANTUM.ex4
ExpertParameters=
Symbol=$Symbol
Period=$Period
Model=0
FromDate=$FromDate
ToDate=$ToDate
Visual=1
Optimization=0
Report=$reportPath
ReplaceReport=1
ShutdownTerminal=0
Deposit=$Deposit
Currency=USD
Leverage=500
"@

Set-Content -Path $cfgPath -Value $cfg -Encoding ASCII
Start-Process -FilePath $terminalExe -ArgumentList "/config:$cfgPath"

Write-Host "Launched:"
Write-Host "  Terminal: $terminalExe"
Write-Host "  DataFolder: $dataFolder"
Write-Host "  Config: $cfgPath"
