# DF_QUANTUM Bot Coordinator

This helper delegates support work from running bots to `DF_QUANTUM`.

It is file-based and safe by default:
- Reads bot heartbeats from a CSV file.
- Creates helper tasks for `DF_QUANTUM`.
- Writes watchdog heartbeat + run log.
- Stops cleanly using a stop-file signal.

## Files

- Script: `scripts/mt4/run-df-quantum-coordinator.ps1`
- Stop script: `scripts/mt4/stop-df-quantum-coordinator.ps1`
- Config: `config/mt4/df-quantum-coordinator.config.json`
- Task output (default): `data/ops/df-quantum-helper-tasks.csv`
- Watchdog heartbeat: `data/ops/df-quantum-coordinator-heartbeat.json`
- Run log: `data/ops/df-quantum-coordinator.log`

## Expected Bot Heartbeat Input

Path is configured as:

`C:\Users\jaque\AppData\Roaming\MetaQuotes\Terminal\Common\Files\bot-heartbeats.csv`

Minimum columns:

- `BotName`
- `Symbol`
- `Status` (`running`, `active`, etc.)
- `UpdatedUtc` (ISO UTC timestamp)

Optional columns used for smarter help decisions:

- `NeedsHelp` (`true`/`false`)
- `Issue` (text)
- `DrawdownPct` (numeric)
- `LastSignalUtc` (ISO UTC timestamp)

## Start

Foreground:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-df-quantum-coordinator.ps1
```

Background:

```powershell
Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File','.\scripts\mt4\run-df-quantum-coordinator.ps1' -WorkingDirectory 'C:\Users\jaque\Documents\TRADING ECOSYSTEM'
```

Run one cycle only:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-df-quantum-coordinator.ps1 -RunOnce
```

## Stop (Clean)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\stop-df-quantum-coordinator.ps1
```

The running loop detects the stop file and exits gracefully.

## What Delegation Produces

Each helper task includes:

- `TaskId`
- `DelegatedTo` (always `DF_QUANTUM`)
- `BotName`, `Symbol`
- `Action` (for example: `tighten_risk`, `regime_recheck`)
- `Priority`, `Reason`
- Source snapshot fields (`SourceIssue`, `SourceDrawdown`, etc.)
- `Status` (starts at `QUEUED`)
