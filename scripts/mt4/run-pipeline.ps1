param(
    [string]$SearchRoot = ".",
    [string]$ConfigFile = ".\\config\\mt4\\pipeline.config.json",
    [string]$ParameterSpaceFile = ".\\config\\mt4\\parameter-space.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$inventoryFile = ".\\data\\backtests\\ea-inventory.csv"
$jobsFile = ".\\data\\backtests\\jobs.csv"
$resultsFile = ".\\data\\backtests\\results.csv"
$rankedFile = ".\\data\\backtests\\ranked-configurations.csv"
$summaryFile = ".\\data\\backtests\\summary.md"

Write-Host "Step 1/4: Discovering EA files..."
powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "discover-eas.ps1") `
    -SearchRoot $SearchRoot `
    -OutFile $inventoryFile

Write-Host "Step 2/4: Generating backtest jobs..."
powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "generate-jobs.ps1") `
    -InventoryFile $inventoryFile `
    -ConfigFile $ConfigFile `
    -ParameterSpaceFile $ParameterSpaceFile `
    -OutFile $jobsFile

Write-Host "Step 3/4: Running backtests (manual or mt4 mode)..."
powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "run-backtests.ps1") `
    -JobsFile $jobsFile `
    -ConfigFile $ConfigFile `
    -OutFile $resultsFile

Write-Host "Step 4/4: Scoring and ranking..."
powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "score-results.ps1") `
    -ResultsFile $resultsFile `
    -ConfigFile $ConfigFile `
    -RankedOutFile $rankedFile `
    -SummaryOutFile $summaryFile

Write-Host "Pipeline complete."
Write-Host "Inventory: $inventoryFile"
Write-Host "Jobs: $jobsFile"
Write-Host "Results: $resultsFile"
Write-Host "Ranked: $rankedFile"
Write-Host "Summary: $summaryFile"
