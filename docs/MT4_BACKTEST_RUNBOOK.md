# MT4 Backtesting and Optimization Runbook

This pipeline discovers all MT4 EAs in the workspace, generates parameter combinations, runs backtests, and ranks configurations with risk-adjusted scoring plus out-of-sample robustness.

## Files

- `scripts/mt4/discover-eas.ps1`
- `scripts/mt4/generate-jobs.ps1`
- `scripts/mt4/run-backtests.ps1`
- `scripts/mt4/score-results.ps1`
- `scripts/mt4/run-pipeline.ps1`
- `config/mt4/pipeline.config.json`
- `config/mt4/parameter-space.json`

## 1) Configure

Edit:

- `config/mt4/pipeline.config.json`
- `config/mt4/parameter-space.json`

Important fields:

- `runner.mode`: `manual` or `mt4`
- `runner.terminalPath`: local MT4 terminal path when using `mt4`
- `symbols`, `timeframes`, and `splits`: train/test windows
- parameter ranges in `parameter-space.json`

## 2) Run End-to-End Pipeline

From workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-pipeline.ps1 -SearchRoot .
```

Outputs:

- `data/backtests/ea-inventory.csv`
- `data/backtests/jobs.csv`
- `data/backtests/results.csv`
- `data/backtests/ranked-configurations.csv`
- `data/backtests/summary.md`

## 3) Manual Runner Flow (default)

When `runner.mode` is `manual`, the script exports:

- `data/backtests/runner/manual-handoff-jobs.csv`

Run each job in MT4 Strategy Tester, then create:

- `data/backtests/manual-results.csv`

With columns:

- `JobId`
- `NetProfit`
- `MaxDrawdownPct`
- `ProfitFactor`
- `Trades`

Template:

- `data/backtests/manual-results.template.csv`

Re-run from step 3 onward:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-backtests.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\score-results.ps1
```

## 4) Direct MT4 Runner Flow

Switch `runner.mode` to `mt4` and confirm `runner.terminalPath`.

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-pipeline.ps1 -SearchRoot .
```

The runner creates `.set`, `.ini`, and `.htm` report artifacts under:

- `data/backtests/runner/`

## 5) Ranking Logic

Each result is scored on:

- net profit
- drawdown (lower is better)
- profit factor
- Sharpe-like proxy (`(NetProfit/Deposit) / (DrawdownPct/100)`)
- trade count saturation
- train/test robustness (test profit vs train profit by `ComboKey`)

The summary includes a small-capital sensitivity section (including `$20`) and an explicit uncertainty warning.

## Risk Note

No backtest can guarantee future performance. Extremely fast growth targets are high risk and often not repeatable after costs, slippage, and changing market regimes.
