param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Resolve-Path "."
$opsDir = Join-Path $root "data\ops"

if (-not (Test-Path $opsDir)) {
    New-Item -ItemType Directory -Path $opsDir -Force | Out-Null
}

$files = @(
    (Join-Path $opsDir "agent-tasks.csv"),
    (Join-Path $opsDir "agent-handoffs.md"),
    (Join-Path $opsDir "decision-log.md"),
    (Join-Path $opsDir "incidents.md")
)

function Write-IfMissing {
    param(
        [string]$Path,
        [string]$Content
    )

    if ((Test-Path $Path) -and -not $Force) {
        return
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
}

$taskCsv = @"
TaskId,Owner,Status,Priority,Area,Summary,InputPath,OutputPath,UpdatedUtc
TASK-001,Agent-Research,todo,P1,research,Shortlist top EAs by symbol fit,experts/imported,data/backtests/plans/,$([DateTime]::UtcNow.ToString("o"))
TASK-002,Agent-Backtest,todo,P1,backtest,Run pipeline and publish ranked configs,config/mt4,data/backtests/summary.md,$([DateTime]::UtcNow.ToString("o"))
TASK-003,Agent-MarketMonitor,todo,P1,monitor,Start commodity monitor and verify logging,scripts/monitor-commodities.ps1,data/commodity_prices.csv,$([DateTime]::UtcNow.ToString("o"))
TASK-004,Agent-Risk,todo,P0,risk,Define max drawdown and stop conditions,data/backtests/results.csv,data/ops/decision-log.md,$([DateTime]::UtcNow.ToString("o"))
"@

$handoffs = @"
# Agent Handoffs

Use this file for cross-agent updates.

## Template

- Time (UTC):
- From:
- To:
- TaskId:
- Summary:
- Evidence/Paths:
- Blockers:
"@

$decisions = @"
# Decision Log

Record operational and risk decisions.

## Template

- Time (UTC):
- Decision:
- Rationale:
- Owner:
- Related TaskId:
"@

$incidents = @"
# Incidents

Log unexpected behavior, outages, or risk events.

## Template

- Time (UTC):
- Severity:
- System:
- Description:
- Immediate Action:
- Status:
"@

Write-IfMissing -Path $files[0] -Content $taskCsv
Write-IfMissing -Path $files[1] -Content $handoffs
Write-IfMissing -Path $files[2] -Content $decisions
Write-IfMissing -Path $files[3] -Content $incidents

Write-Host "Bootstrap complete. Ops coordination files are ready in data/ops."
