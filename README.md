# Commodity USD Monitor

This workspace includes a PowerShell monitor for:

- `XAUUSD` (Gold vs USD)
- `XAGUSD` (Silver vs USD)
- `USOIL` (USD-quoted crude oil proxy)

Script path:

- `scripts/monitor-commodities.ps1`
- `scripts/ops/bootstrap-ecosystem.ps1` (multi-agent coordination bootstrap)

## What it does

1. Fetches latest prices (live or mock provider).
2. Appends timestamped snapshots to CSV.
3. Prints alerts when move size exceeds a configurable percentage threshold.

## Quick start

Run with mock data (works without network):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-commodities.ps1 -Provider mock -IntervalSeconds 10 -AlertThresholdPercent 0.3
```

Run with live data source:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-commodities.ps1 -Provider stooq -IntervalSeconds 60 -AlertThresholdPercent 0.5
```

Run once (or finite loops) for testing:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-commodities.ps1 -Provider mock -Iterations 3 -IntervalSeconds 2
```

## Output

Default CSV output:

- `.\data\commodity_prices.csv`

Override path with:

```powershell
-OutFile .\data\my_prices.csv
```

## Provider model (pluggable)

- `stooq`: concrete live provider via HTTP CSV quotes.
- `mock`: offline fallback generator for local testing.

To add a new provider, extend `Get-ProviderFunction` and implement a new `Get-...Prices` function returning:

- hashtable with keys: `XAUUSD`, `XAGUSD`, `USOIL`
- numeric values for current prices

## Multi-Agent Setup (Trading Ecosystem)

Use this to help all agents work from the same operating model:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\bootstrap-ecosystem.ps1
```

This creates shared coordination files under `data/ops/`:

- `agent-tasks.csv`
- `agent-handoffs.md`
- `decision-log.md`
- `incidents.md`

Runbook:

- `docs/TRADING_ECOSYSTEM_AGENT_SETUP.md`

---

# MT4 Backtesting Pipeline

This workspace now also includes an MT4 backtesting + optimization pipeline:

- `scripts/mt4/run-pipeline.ps1`
- `docs/MT4_BACKTEST_RUNBOOK.md`

Quick run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-pipeline.ps1 -SearchRoot .
```

Main outputs:

- `data/backtests/ea-inventory.csv`
- `data/backtests/jobs.csv`
- `data/backtests/results.csv`
- `data/backtests/ranked-configurations.csv`
- `data/backtests/summary.md`

---

# Trading Ecosystem App

The `app/` folder hosts an operator trading console that includes:

- typed market context + account/risk inputs,
- decision engine output (BUY/SELL/HOLD, lot size, SL/TP, confidence),
- MT4 command queue files for bridge polling,
- bot memory records so bots can retain context,
- swarm bus voting so bots can communicate across charts,
- chart planner that can assign bots across up to 100 charts.

Run local:

```powershell
cd app
node server.js
```

Open:

- `http://localhost:3000`

Main API endpoints:

- `/api/state`
- `/api/decide`
- `/api/commands/queue`
- `/api/commands/{id}/ack`
- `/api/results`
- `/api/swarm/memory`
- `/api/swarm/event`
- `/api/swarm/consensus`
- `/api/swarm/plan`
- `/api/phone/state`
- `/api/phone/ask`
- `/api/phone/message`
- `/api/phone/reply`
- `/api/phone/sms/webhook?token=...`
- `/api/health`

Deployment guide:

- `docs/TRADING_APP_DEPLOYMENT.md`
- `docs/PHONE_CONTROL_RUNBOOK.md`
