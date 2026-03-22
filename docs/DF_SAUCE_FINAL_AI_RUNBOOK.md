# DF SAUCE FINAL AI Runbook

## What this is

`DF SAUCE FINAL AI.mq4` is a separate EA cloned from your original `DF SAUCE FINAL` logic, with an added AI overlay gate that can:

- block trades against AI consensus,
- require minimum confidence,
- scale lot size with AI lot multiplier.

Original bot remains unchanged.

## File locations

- Workspace source:
  - `experts/derived/DF SAUCE FINAL AI.mq4`
- MT4 install target:
  - `...MQL4/Experts/DF SAUCE FINAL AI.mq4`
- AI feed file (read by EA):
  - `%APPDATA%\MetaQuotes\Terminal\Common\Files\TE\ai\consensus.csv`

## Install / refresh

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\install-df-sauce-final-ai.ps1
```

Compile in MetaEditor after install.

## Feed from trading console swarm

One-time update:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\update-ai-consensus-from-console.ps1 -Symbol XAUUSD
```

Continuous sync every 5 seconds:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\update-ai-consensus-from-console.ps1 -Symbol XAUUSD -IntervalSeconds 5
```

If API key is enabled:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\update-ai-consensus-from-console.ps1 -Symbol XAUUSD -ApiKey "YOUR_KEY"
```

## Launch visual test

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\launch-df-sauce-final-ai-test.ps1 -Symbol XAUUSD -Period M15
```

## One-command stack start

Starts console, refreshes EA install, starts consensus updater loop, and launches visual test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-df-sauce-final-ai-stack.ps1 -Symbol XAUUSD -Period M15
```

Bootstrap with forced BUY consensus at startup:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mt4\run-df-sauce-final-ai-stack.ps1 -Symbol XAUUSD -Period M15 -ForceBuyBootstrap
```

## consensus.csv format

`SYMBOL,DIRECTION,CONFIDENCE,LOTMULT,TIMESTAMP`

Example:

`XAUUSD,BUY,0.70,1.20,1711075000`

## AI overlay inputs in EA

- `InpAI_Enable`
- `InpAI_UseExternalFeed`
- `InpAI_ExternalFeedFile`
- `InpAI_MinConfidence`
- `InpAI_BlockAgainstConsensus`
- `InpAI_DefaultLotMultiplier`
- `InpAI_MaxFeedAgeSeconds`
