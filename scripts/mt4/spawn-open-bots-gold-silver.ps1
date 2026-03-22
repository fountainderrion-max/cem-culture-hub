param(
    [string]$TerminalExe = "C:\KOT MT4 Terminal\terminal.exe",
    [string]$DataFolder = "",
    [string[]]$Symbols = @("XAUUSD", "XAGUSD"),
    [string]$Period = "M15",
    [string]$FromDate = "2024.01.01",
    [string]$ToDate = "2025.12.31",
    [int]$Deposit = 1000,
    [int]$DelaySeconds = 2,
    [int]$MaxBots = 100,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-Mt4DataFolder {
    param([string]$Hint)

    if ($Hint -and (Test-Path $Hint)) {
        return (Resolve-Path $Hint).Path
    }

    $terminalRoot = Join-Path $env:APPDATA "MetaQuotes\Terminal"
    if (-not (Test-Path $terminalRoot)) {
        throw "MT4 terminal data root not found: $terminalRoot"
    }

    $candidates = Get-ChildItem -Path $terminalRoot -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName "MQL4\Experts") } |
        Sort-Object LastWriteTime -Descending

    if (-not $candidates -or $candidates.Count -eq 0) {
        throw "No MT4 data folders with MQL4\\Experts were found under $terminalRoot"
    }

    return $candidates[0].FullName
}

if (-not (Test-Path $TerminalExe)) {
    throw "MT4 terminal not found: $TerminalExe"
}

$resolvedData = Resolve-Mt4DataFolder -Hint $DataFolder
$expertsRoot = Join-Path $resolvedData "MQL4\Experts"
if (-not (Test-Path $expertsRoot)) {
    throw "Experts folder not found: $expertsRoot"
}

$cfgDir = Join-Path $PSScriptRoot "..\..\config\mt4\spawn-launch"
$cfgDir = [System.IO.Path]::GetFullPath($cfgDir)
$reportDir = Join-Path $PSScriptRoot "..\..\data\backtests\live-launch"
$reportDir = [System.IO.Path]::GetFullPath($reportDir)
New-Item -ItemType Directory -Force -Path $cfgDir, $reportDir | Out-Null

$experts = Get-ChildItem -Path $expertsRoot -Recurse -File -Filter *.ex4 |
    Where-Object { $_.Name -notmatch "metaeditor|terminal" } |
    Select-Object -First $MaxBots

if (-not $experts -or $experts.Count -eq 0) {
    throw "No .ex4 expert advisors found in $expertsRoot"
}

$launches = @()
foreach ($expert in $experts) {
    $relativeExpertPath = $expert.FullName.Substring($expertsRoot.Length).TrimStart("\")
    $expertMt4Path = $relativeExpertPath -replace "/", "\"
    $expertBase = [System.IO.Path]::GetFileNameWithoutExtension($expert.Name)

    foreach ($symbol in $Symbols) {
        $safeName = ($expertBase + "_" + $symbol + "_" + $Period) -replace "[^a-zA-Z0-9_\-]", "_"
        $cfgPath = Join-Path $cfgDir "$safeName.ini"
        $reportPath = Join-Path $reportDir "$safeName"

        $cfg = @"
[Tester]
Expert=$expertMt4Path
ExpertParameters=
Symbol=$symbol
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

        $launches += [pscustomobject]@{
            Expert = $expertMt4Path
            Symbol = $symbol
            Config = $cfgPath
            Report = "$reportPath.htm"
        }
    }
}

Write-Host "Spawn plan:"
Write-Host "  Terminal: $TerminalExe"
Write-Host "  DataFolder: $resolvedData"
Write-Host "  Bots found: $($experts.Count)"
Write-Host "  Total launches (bots x symbols): $($launches.Count)"

if ($DryRun) {
    Write-Host "DryRun enabled. No MT4 instances launched."
    $launches | Select-Object -First 30 | Format-Table -AutoSize
    exit 0
}

foreach ($job in $launches) {
    Start-Process -FilePath $TerminalExe -ArgumentList "/config:$($job.Config)"
    Start-Sleep -Seconds $DelaySeconds
}

Write-Host "Launched $($launches.Count) MT4 visual sessions."
