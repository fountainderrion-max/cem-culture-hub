# Trading Decision Console Deployment

## Purpose

Deploy a shared web console where you type market context and account inputs, generate trade decisions, and push MT4-ready commands into queue files.

## Local run

```powershell
cd "C:\Users\jaque\Documents\TRADING ECOSYSTEM\app"
node server.js
```

Open:

- `http://localhost:3000`

## Environment

Use:

- `app/.env.example`

Required in most cases:

- `PORT`
- `HOST`

Optional hardening:

- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `MAX_BODY_BYTES`

## Production checklist

1. Deploy app to a public host (Render, Railway, Fly, VPS, etc.).
2. Point domain to host and enforce HTTPS.
3. Restrict inbound access by IP/VPN if only your team should use it.
4. Back up `app/data/` regularly (contains decision, command, and result history).
5. Add your MT4 bridge process to poll queue file and acknowledge command status.

## MT4 handoff files

Queue file (new commands):

- `app/data/mt4/commands-queue.jsonl`

Execution updates file:

- `app/data/mt4/commands-executed.jsonl`

Application store:

- `app/data/trade-console-store.json`

## Safety note

The decision engine is support logic, not guaranteed alpha. Validate fills, spread, slippage, and risk controls before any live deployment.
