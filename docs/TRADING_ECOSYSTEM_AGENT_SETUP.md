# Trading Ecosystem Agent Setup

Purpose: help multiple agents collaborate safely and consistently while building and operating this trading ecosystem.

## 1) Shared Operating Rules

- Keep strategy research, backtesting, and live execution separated.
- Do not edit or overwrite historical outputs in `data/backtests/` unless explicitly requested.
- Treat every change as reversible: log what changed, who changed it, and why.
- Before promoting any strategy, require train/test validation plus risk review.

## 2) Standard Agent Roles

- `Agent-Research`: curates EAs, symbols, and parameter ideas.
- `Agent-Backtest`: runs `scripts/mt4/run-pipeline.ps1` and updates ranked results.
- `Agent-MarketMonitor`: runs `scripts/monitor-commodities.ps1` for XAUUSD/XAGUSD/USOIL.
- `Agent-Execution`: manages controlled deployment steps (never direct live deployment without approval).
- `Agent-Risk`: validates drawdown, exposure, and guardrails.

## 3) Shared Handoff Files

Use these paths for cross-agent coordination:

- `data/ops/agent-tasks.csv`
- `data/ops/agent-handoffs.md`
- `data/ops/decision-log.md`
- `data/ops/incidents.md`

Required task columns (`agent-tasks.csv`):

- `TaskId`
- `Owner`
- `Status` (`todo|in_progress|blocked|done`)
- `Priority` (`P0|P1|P2`)
- `Area` (`research|backtest|monitor|execution|risk|app`)
- `Summary`
- `InputPath`
- `OutputPath`
- `UpdatedUtc`

## 4) Coordination Loop

Run this loop for each work cycle:

1. Pull top `todo`/`blocked` tasks from `agent-tasks.csv`.
2. Mark one task `in_progress` with timestamp.
3. Complete work and append notes to `agent-handoffs.md`.
4. Record decisions in `decision-log.md` (especially risk-related).
5. If something breaks or behavior deviates, log in `incidents.md`.
6. Mark task `done` or `blocked` and update `UpdatedUtc`.

## 5) Promotion Gates (Backtest -> Candidate -> Live)

Minimum gates before any live consideration:

- At least one out-of-sample test window with non-trivial trade count.
- Drawdown within your defined limit.
- No critical incidents unresolved in `incidents.md`.
- Risk sign-off entry in `decision-log.md`.

## 6) Daily Startup Checklist

1. Run bootstrap script:
   - `powershell -ExecutionPolicy Bypass -File .\scripts\ops\bootstrap-ecosystem.ps1`
2. Verify monitor feed is updating:
   - `data/commodity_prices.csv`
3. Verify latest backtest summary exists:
   - `data/backtests/summary.md`
4. Review blocked tasks and incidents.
5. Prioritize next tasks by risk impact first, return impact second.

## 7) Suggested First Task Split

- Research: shortlist top 5 EAs by symbol/timeframe fit.
- Backtest: regenerate jobs and score latest configurations.
- Monitor: run commodity monitor with alert threshold.
- Risk: define max daily loss and max drawdown policy.
- App: wire communicator events to ops files for transparency.

This process keeps agents aligned and creates clear audit trails for trading decisions.
