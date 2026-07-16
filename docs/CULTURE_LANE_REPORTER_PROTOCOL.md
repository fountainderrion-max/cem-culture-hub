# Culture Lane Reporter Protocol v1

## Purpose

This protocol makes every Culture Lane command traceable from website creation through MT4 execution and final verification.

A reporter must never execute a command for a different trading account. `accountId`, broker server, and login must match the reporter registration.

## Reporter heartbeat

Recommended demo interval: 2 seconds. Production interval should be configurable between 1 and 5 seconds.

```json
{
  "nodeId": "rpt-123",
  "accountId": "acct-123",
  "broker": "Broker Name",
  "server": "Broker-Live",
  "login": "1234567",
  "reporterVersion": "1.60.0",
  "balance": 1000.00,
  "equity": 1025.50,
  "floatingProfit": 25.50,
  "dailyClosedProfit": 0,
  "openTradeCount": 3,
  "tradingEnabled": true,
  "entriesPaused": false,
  "symbolsHash": "sha256",
  "timestamp": "2026-07-16T21:00:00Z"
}
```

## Symbol discovery

The reporter uploads the full broker symbol inventory when:

- it first connects;
- `symbolsHash` changes;
- the website sends `REFRESH_SYMBOLS`;
- at least once every 24 hours.

```json
{
  "nodeId": "rpt-123",
  "accountId": "acct-123",
  "symbols": ["SPXUSD", "NASUSD", "XAUUSD", "EURUSD"],
  "timestamp": "2026-07-16T21:00:00Z"
}
```

## Supported commands

- `CLOSE_ALL`
- `CLOSE_WINNERS`
- `CLOSE_LOSERS`
- `PAUSE_ENTRIES`
- `RESUME_ENTRIES`
- `SECURE_PROFIT`
- `BREAK_EVEN_ALL`
- `REFRESH_SYMBOLS`
- `SYNC_STATUS`

## Command payload

```json
{
  "commandId": "cmd-123",
  "laneId": "lane-123",
  "accountId": "acct-123",
  "type": "CLOSE_ALL",
  "reason": "HARVEST_GOAL_REACHED",
  "freezeEntries": true,
  "expiresAt": "2026-07-16T21:00:30Z",
  "payload": {
    "harvestCycle": 2,
    "goalPercent": 2,
    "triggerEquity": 5100.00
  }
}
```

## Acknowledgement lifecycle

The reporter sends each state change separately:

1. `RECEIVED` — command downloaded and account identity checked.
2. `ACCEPTED` — command passed permissions, expiry, and duplicate checks.
3. `EXECUTING` — MT4 action started.
4. `SUCCESS` — execution completed and verification values included.

Failure states:

- `FAILED`
- `REJECTED`
- `TIMED_OUT`

```json
{
  "commandId": "cmd-123",
  "accountId": "acct-123",
  "state": "SUCCESS",
  "reporterNodeId": "rpt-123",
  "reporterVersion": "1.60.0",
  "details": {
    "closedTickets": [123, 124, 125],
    "failedTickets": [],
    "openTradeCountAfter": 0,
    "balanceAfter": 1025.50,
    "equityAfter": 1025.50,
    "executionStartedAt": "2026-07-16T21:00:01.050Z",
    "executionCompletedAt": "2026-07-16T21:00:01.340Z"
  }
}
```

## Required safety behavior

- Store the last 500 processed command IDs locally to prevent duplicate execution.
- Reject expired commands.
- Reject commands when the account identity does not match.
- Freeze new entries before processing any Harvest `CLOSE_ALL`.
- Do not report `SUCCESS` until the requested positions are gone.
- Include remaining open-ticket IDs when reporting failure.
- Continue heartbeats while entries are paused.
- A reconnect must not automatically resume entries.
- Manual local emergency control must remain available.

## Harvest sequence

```text
GOAL_REACHED
→ PAUSE_ENTRIES delivered to all accounts
→ every account acknowledges pause
→ CLOSE_ALL delivered simultaneously
→ reporters execute and report results
→ website verifies openTradeCountAfter = 0
→ Trade Passport and Black Box records created
→ CLOSE_AND_PAUSE: remain paused
→ CLOSE_AND_CONTINUE: reset baseline, then RESUME_ENTRIES
```

The website must display `PARTIAL CLOSE` whenever at least one account has not verified zero open trades.
