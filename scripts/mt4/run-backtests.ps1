param(
    [string]$JobsFile = ".\\data\\backtests\\jobs.csv",
    [string]$ConfigFile = ".\\config\\mt4\\pipeline.config.json",
    [string]$OutFile = ".\\data\\backtests\\results.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-SetFile {
    param(
        [string]$Path,
        [hashtable]$Params
    )
    $lines = foreach ($key in ($Params.Keys | Sort-Object)) {
        "$key=$($Params[$key])"
    }
    Set-Content -Path $Path -Value $lines -Encoding ASCII
}

function New-IniFile {
    param(
        [string]$Path,
        [pscustomobject]$Job,
        [string]$SetPath,
        [string]$ReportPath,
        [string]$Model = "0"
    )

    $content = @"
[Tester]
Expert=$($Job.EAName)
ExpertParameters=$SetPath
Symbol=$($Job.Symbol)
Period=$($Job.Timeframe)
Model=$Model
FromDate=$($Job.FromDate)
ToDate=$($Job.ToDate)
Report=$ReportPath
ReplaceReport=1
ShutdownTerminal=1
Deposit=$($Job.Deposit)
Currency=USD
Optimization=0
Visual=0
"@
    Set-Content -Path $Path -Value $content -Encoding ASCII
}

function Parse-Mt4Report {
    param(
        [string]$ReportPath,
        [pscustomobject]$Job
    )

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

    $sharpeProxy = 0.0
    if ($maxDdPct -gt 0) {
        $sharpeProxy = ($netProfit / [double]$Job.Deposit) / ($maxDdPct / 100.0)
    }

    return [pscustomobject]@{
        JobId          = $Job.JobId
        ComboKey       = $Job.ComboKey
        EAName         = $Job.EAName
        Symbol         = $Job.Symbol
        Timeframe      = $Job.Timeframe
        SplitName      = $Job.SplitName
        SplitKind      = $Job.SplitKind
        FromDate       = $Job.FromDate
        ToDate         = $Job.ToDate
        Deposit        = [double]$Job.Deposit
        NetProfit      = $netProfit
        MaxDrawdownPct = $maxDdPct
        ProfitFactor   = $profitFactor
        Trades         = $trades
        SharpeProxy    = [math]::Round($sharpeProxy, 6)
        ParamsJson     = $Job.ParamsJson
        Source         = "mt4-report"
    }
}

function Parse-ManualResultRow {
    param(
        [pscustomobject]$Row,
        [pscustomobject]$Job
    )

    $sharpeProxy = 0.0
    if ([double]$Row.MaxDrawdownPct -gt 0) {
        $sharpeProxy = ([double]$Row.NetProfit / [double]$Job.Deposit) / ([double]$Row.MaxDrawdownPct / 100.0)
    }

    return [pscustomobject]@{
        JobId          = $Job.JobId
        ComboKey       = $Job.ComboKey
        EAName         = $Job.EAName
        Symbol         = $Job.Symbol
        Timeframe      = $Job.Timeframe
        SplitName      = $Job.SplitName
        SplitKind      = $Job.SplitKind
        FromDate       = $Job.FromDate
        ToDate         = $Job.ToDate
        Deposit        = [double]$Job.Deposit
        NetProfit      = [double]$Row.NetProfit
        MaxDrawdownPct = [double]$Row.MaxDrawdownPct
        ProfitFactor   = [double]$Row.ProfitFactor
        Trades         = [int]$Row.Trades
        SharpeProxy    = [math]::Round($sharpeProxy, 6)
        ParamsJson     = $Job.ParamsJson
        Source         = "manual-results"
    }
}

if (-not (Test-Path -Path $JobsFile)) {
    throw "Jobs file not found: $JobsFile"
}
if (-not (Test-Path -Path $ConfigFile)) {
    throw "Config file not found: $ConfigFile"
}

$jobs = Import-Csv -Path $JobsFile
$config = Get-Content -Path $ConfigFile -Raw | ConvertFrom-Json

$runner = [string]$config.runner.mode
$workDir = [string]$config.runner.workDir
$reportsDir = Join-Path $workDir "reports"
$setDir = Join-Path $workDir "sets"
$iniDir = Join-Path $workDir "ini"

foreach ($dir in @($workDir, $reportsDir, $setDir, $iniDir)) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$results = @()

if ($runner -ieq "manual") {
    $handoffFile = Join-Path $workDir "manual-handoff-jobs.csv"
    $jobs | Export-Csv -Path $handoffFile -NoTypeInformation
    Write-Host "Manual runner mode: execute jobs in MT4 and save metrics to $($config.runner.manualResultsFile)"
    Write-Host "Handoff jobs exported: $handoffFile"

    if (Test-Path -Path $config.runner.manualResultsFile) {
        $manualRows = Import-Csv -Path $config.runner.manualResultsFile
        $rowByJobId = @{}
        foreach ($row in $manualRows) {
            $rowByJobId[[string]$row.JobId] = $row
        }

        foreach ($job in $jobs) {
            $jobKey = [string]$job.JobId
            if ($rowByJobId.ContainsKey($jobKey)) {
                $results += Parse-ManualResultRow -Row $rowByJobId[$jobKey] -Job $job
            }
        }
    }
}
elseif ($runner -ieq "mt4") {
    if (-not (Test-Path -Path $config.runner.terminalPath)) {
        throw "MT4 terminal path not found: $($config.runner.terminalPath)"
    }

    foreach ($job in $jobs) {
        $params = ConvertFrom-Json -InputObject $job.ParamsJson -AsHashtable
        $setPath = Join-Path $setDir "job-$($job.JobId).set"
        $reportPath = Join-Path $reportsDir "job-$($job.JobId).htm"
        $iniPath = Join-Path $iniDir "job-$($job.JobId).ini"

        New-SetFile -Path $setPath -Params $params
        New-IniFile -Path $iniPath -Job $job -SetPath $setPath -ReportPath $reportPath -Model $config.runner.mt4Model

        $args = @("/portable", "/config:$iniPath")
        $proc = Start-Process -FilePath $config.runner.terminalPath -ArgumentList $args -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Warning "MT4 returned non-zero exit code for job $($job.JobId): $($proc.ExitCode)"
            continue
        }
        if (Test-Path -Path $reportPath) {
            $results += Parse-Mt4Report -ReportPath $reportPath -Job $job
        }
    }
}
else {
    throw "Unsupported runner mode '$runner'. Use 'manual' or 'mt4'."
}

$outDir = Split-Path -Path $OutFile -Parent
if (-not (Test-Path -Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$results | Export-Csv -Path $OutFile -NoTypeInformation
Write-Host "Results saved: $OutFile"
Write-Host "Result rows: $($results.Count)"
