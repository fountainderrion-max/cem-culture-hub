param(
    [int]$JobId,
    [string]$ReportPath = "C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\BAEC37CBBA31C26B3C8E7E5183FE4CC4\StrategyTester.htm",
    [string]$ManualResultsFile = ".\\data\\backtests\\manual-results-50.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $ReportPath)) {
    throw "Report not found: $ReportPath"
}
if (-not (Test-Path $ManualResultsFile)) {
    throw "Manual results file not found: $ManualResultsFile"
}

$html = Get-Content -Path $ReportPath -Raw

$netProfit = 0.0
$maxDdPct = 100.0
$profitFactor = 0.0
$trades = 0

if ($html -match "Total net profit.*?(-?\d+(\.\d+)?)") {
    $netProfit = [double]$matches[1]
}
if ($html -match "Profit factor.*?(\d+(\.\d+)?)") {
    $profitFactor = [double]$matches[1]
}
if ($html -match "Total trades.*?(\d+)") {
    $trades = [int]$matches[1]
}
if ($html -match "Maximal drawdown.*?\((\d+(\.\d+)?)%\)") {
    $maxDdPct = [double]$matches[1]
}

$rows = Import-Csv -Path $ManualResultsFile
$target = $rows | Where-Object { [int]$_.JobId -eq $JobId } | Select-Object -First 1
if (-not $target) {
    throw "JobId $JobId not found in $ManualResultsFile"
}

$target.NetProfit = [string]$netProfit
$target.MaxDrawdownPct = [string]$maxDdPct
$target.ProfitFactor = [string]$profitFactor
$target.Trades = [string]$trades

$rows | Export-Csv -Path $ManualResultsFile -NoTypeInformation

Write-Host "Captured report into JobId $JobId"
Write-Host "NetProfit=$netProfit DrawdownPct=$maxDdPct ProfitFactor=$profitFactor Trades=$trades"
