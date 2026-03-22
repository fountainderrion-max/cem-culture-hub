param(
    [string]$ResultsFile = ".\\data\\backtests\\results.csv",
    [string]$ConfigFile = ".\\config\\mt4\\pipeline.config.json",
    [string]$RankedOutFile = ".\\data\\backtests\\ranked-configurations.csv",
    [string]$SummaryOutFile = ".\\data\\backtests\\summary.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Clamp01 {
    param([double]$Value)
    if ($Value -lt 0) { return 0.0 }
    if ($Value -gt 1) { return 1.0 }
    return $Value
}

function Normalize-ByRange {
    param(
        [double]$Value,
        [double]$Min,
        [double]$Max
    )
    if ($Max -le $Min) { return 0.5 }
    return Clamp01 -Value (($Value - $Min) / ($Max - $Min))
}

function Build-RobustnessMap {
    param([object[]]$Rows)

    $grouped = $Rows | Group-Object ComboKey
    $map = @{}

    foreach ($group in $grouped) {
        $trainRows = @($group.Group | Where-Object { $_.SplitKind -ieq "train" })
        $testRows = @($group.Group | Where-Object { $_.SplitKind -ieq "test" })
        $robustness = 0.0

        if ($trainRows.Count -gt 0 -and $testRows.Count -gt 0) {
            $trainAvg = [double](($trainRows | Measure-Object -Property NetProfit -Average).Average)
            $testAvg = [double](($testRows | Measure-Object -Property NetProfit -Average).Average)

            if ($trainAvg -gt 0) {
                $ratio = $testAvg / $trainAvg
                if ($ratio -lt 0) {
                    $robustness = 0.0
                }
                else {
                    $robustness = [math]::Min(1.0, $ratio)
                }
            }
        }

        $map[$group.Name] = $robustness
    }

    return $map
}

function Get-CycleEstimate {
    param(
        [double]$StartCapital,
        [double]$PerCycleReturn,
        [double]$TargetCapital = 1000000.0
    )

    if ($PerCycleReturn -le 0) {
        return "Not achievable (non-positive cycle return)"
    }

    $growth = 1.0 + $PerCycleReturn
    if ($growth -le 1.0) {
        return "Not achievable (no growth)"
    }

    $cycles = [math]::Ceiling([math]::Log($TargetCapital / $StartCapital) / [math]::Log($growth))
    return "$cycles cycles"
}

if (-not (Test-Path -Path $ResultsFile)) {
    throw "Results file not found: $ResultsFile"
}

$config = Get-Content -Path $ConfigFile -Raw | ConvertFrom-Json
$rows = @((Import-Csv -Path $ResultsFile))

if ($rows.Count -eq 0) {
    "No results to score. Add manual results or run mt4 mode first." | Set-Content -Path $SummaryOutFile -Encoding UTF8
    @() | Export-Csv -Path $RankedOutFile -NoTypeInformation
    Write-Host "No rows found in results file."
    exit 0
}

$netProfits = $rows | ForEach-Object { [double]$_.NetProfit }
$profitFactors = $rows | ForEach-Object { [double]$_.ProfitFactor }
$drawdowns = $rows | ForEach-Object { [double]$_.MaxDrawdownPct }
$sharpes = $rows | ForEach-Object { [double]$_.SharpeProxy }

$minNet = ($netProfits | Measure-Object -Minimum).Minimum
$maxNet = ($netProfits | Measure-Object -Maximum).Maximum
$minPf = ($profitFactors | Measure-Object -Minimum).Minimum
$maxPf = ($profitFactors | Measure-Object -Maximum).Maximum
$minSharpe = ($sharpes | Measure-Object -Minimum).Minimum
$maxSharpe = ($sharpes | Measure-Object -Maximum).Maximum

$robustnessByKey = Build-RobustnessMap -Rows $rows

$scored = foreach ($row in $rows) {
    $net = [double]$row.NetProfit
    $dd = [double]$row.MaxDrawdownPct
    $pf = [double]$row.ProfitFactor
    $trades = [int]$row.Trades
    $sharpe = [double]$row.SharpeProxy

    $profitScore = Normalize-ByRange -Value $net -Min $minNet -Max $maxNet
    $ddScore = 1.0 - (Clamp01 -Value ($dd / 100.0))
    $pfScore = Normalize-ByRange -Value $pf -Min $minPf -Max $maxPf
    $stabilityScore = Normalize-ByRange -Value $sharpe -Min $minSharpe -Max $maxSharpe
    $tradeCountScore = Clamp01 -Value ([double]$trades / [double]$config.scoring.tradeCountSaturation)
    $robustnessScore = [double]$robustnessByKey[$row.ComboKey]

    $overall =
        ([double]$config.scoring.weights.profit * $profitScore) +
        ([double]$config.scoring.weights.drawdown * $ddScore) +
        ([double]$config.scoring.weights.profitFactor * $pfScore) +
        ([double]$config.scoring.weights.stability * $stabilityScore) +
        ([double]$config.scoring.weights.robustness * $robustnessScore) +
        ([double]$config.scoring.weights.tradeCount * $tradeCountScore)

    [pscustomobject]@{
        Score           = [math]::Round($overall, 6)
        ProfitScore     = [math]::Round($profitScore, 6)
        DrawdownScore   = [math]::Round($ddScore, 6)
        ProfitFactorScore = [math]::Round($pfScore, 6)
        StabilityScore  = [math]::Round($stabilityScore, 6)
        RobustnessScore = [math]::Round($robustnessScore, 6)
        TradeCountScore = [math]::Round($tradeCountScore, 6)
        ComboKey        = $row.ComboKey
        EAName          = $row.EAName
        Symbol          = $row.Symbol
        Timeframe       = $row.Timeframe
        SplitName       = $row.SplitName
        SplitKind       = $row.SplitKind
        Deposit         = [double]$row.Deposit
        NetProfit       = $net
        MaxDrawdownPct  = $dd
        ProfitFactor    = $pf
        Trades          = $trades
        SharpeProxy     = $sharpe
        ParamsJson      = $row.ParamsJson
    }
}

$ranked = $scored | Sort-Object Score -Descending
$ranked | Export-Csv -Path $RankedOutFile -NoTypeInformation

$top = $ranked | Select-Object -First ([int]$config.report.topN)
$topByCombo = $top | Group-Object ComboKey | ForEach-Object { $_.Group | Select-Object -First 1 }
$best = $topByCombo | Select-Object -First 1

$capitalLines = @()
if ($best) {
    $cycleReturn = 0.0
    if ([double]$best.Deposit -gt 0) {
        $cycleReturn = [double]$best.NetProfit / [double]$best.Deposit
    }

    foreach ($start in @([double[]]$config.capitalSensitivity.startBalances)) {
        $estimate = Get-CycleEstimate -StartCapital $start -PerCycleReturn $cycleReturn -TargetCapital 1000000.0
        $capitalLines += "- Start $$([int]$start): $estimate"
    }
}

$summary = @()
$summary += "# MT4 Backtest Summary"
$summary += ""
$summary += "Generated: $(Get-Date -Format o)"
$summary += ""
$summary += "## Top configurations"
$summary += ""
if ($top.Count -eq 0) {
    $summary += "No ranked rows available."
}
else {
    $i = 1
    foreach ($row in $top) {
        $summary += "$i. Score $($row.Score) | EA $($row.EAName) | $($row.Symbol) $($row.Timeframe) | Split $($row.SplitName) ($($row.SplitKind)) | Net $([math]::Round([double]$row.NetProfit,2)) | DD $([math]::Round([double]$row.MaxDrawdownPct,2))% | PF $([math]::Round([double]$row.ProfitFactor,2)) | Trades $($row.Trades)"
        $i += 1
    }
}

$summary += ""
$summary += "## Capital sensitivity (repeat-cycle estimate)"
$summary += ""
$summary += "Warning: fast growth from small capital (for example from `$20`) is highly uncertain, path-dependent, and can fail due to slippage, spread, margin limits, and drawdowns. These estimates are not guarantees."
$summary += ""
if ($capitalLines.Count -gt 0) {
    $summary += $capitalLines
}
else {
    $summary += "- Not available (no best configuration found)."
}

$summaryText = $summary -join [Environment]::NewLine
Set-Content -Path $SummaryOutFile -Value $SummaryText -Encoding UTF8

Write-Host "Ranked results saved: $RankedOutFile"
Write-Host "Summary saved: $SummaryOutFile"
