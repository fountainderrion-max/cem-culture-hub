# Culture Lane OS

This build adds the portfolio-level operating system requested for WISDO/CEM CULTURE.

## Included

- Automatic broker symbol discovery and canonical aliases
- Per-account symbol blocking without typing a full whitelist
- Combined lane balance/equity/floating/closed-profit totals
- Harvest Mode with percentage or dollar goals
- `ONCE` behavior: close the lane and block further entries
- `REPEAT` behavior: close, establish a new baseline, and continue toward the next goal
- Lane Profiles: Compound, Income, Capital Preservation, Prop Challenge, Custom
- Mission Control state
- Culture Intelligence reports
- Trade Passports
- Lane Timeline
- Lane DNA
- Lane Genome versioning
- Black Box command/audit records
- Lane Simulator
- Portfolio-wide Close All commands

## Core files

- `app/culture-lane/engine.js`
- `app/culture-lane/symbol-catalog.js`
- `app/culture-lane/service.js`
- `app/culture-lane/engine.test.js`

## Server integration

Add this import near the top of `app/server.js`:

```js
import { handleCultureLaneRequest } from "./culture-lane/service.js";
```

After parsing the request URL and before the generic 404/static fallback, add:

```js
if (await handleCultureLaneRequest(req, res, url.pathname)) {
  return;
}
```

The handler returns `false` for unrelated paths, so it can safely coexist with the current server router.

## Reporter contract

Each reporter should periodically submit:

```json
{
  "balance": 8584.67,
  "equity": 10261.98,
  "floatingProfit": 1677.31,
  "dailyClosedProfit": 0,
  "symbols": ["EURUSD", "NAS100", "US500.cash"],
  "online": true
}
```

When Harvest triggers, the API returns one `CLOSE_ALL` command containing every account target. Production command delivery must persist the command, deliver it to every lane reporter, retry missing acknowledgements, and only call `/harvest/complete` after collecting results.

## Critical safety rule

Do not mark a Harvest complete just because the website sent the command. Mark it complete after all available reporters acknowledge success or the retry/dead-letter policy finishes. Offline and failed accounts must remain visible in the Black Box.

## API summary

- `POST /api/culture-lanes`
- `GET /api/culture-lanes/profiles`
- `GET /api/culture-lanes/:id`
- `GET /api/culture-lanes/:id/mission-control`
- `POST /api/culture-lanes/:id/accounts`
- `POST /api/culture-lanes/:id/accounts/:accountId/telemetry`
- `POST /api/culture-lanes/:id/symbols/discover`
- `POST /api/culture-lanes/:id/symbols/route`
- `PATCH /api/culture-lanes/:id/symbol-policy`
- `PATCH /api/culture-lanes/:id/harvest`
- `POST /api/culture-lanes/:id/harvest/evaluate`
- `POST /api/culture-lanes/:id/harvest/complete`
- `POST /api/culture-lanes/:id/close-all`
- `POST /api/culture-lanes/:id/simulate`
- `POST /api/culture-lanes/:id/intelligence`

## Persistence required before production

The current module is an in-process domain engine. Before enabling live money execution, persist these collections in PostgreSQL:

- culture_lanes
- culture_lane_accounts
- culture_lane_symbol_policies
- culture_lane_harvest_cycles
- trade_passports
- lane_timeline_events
- lane_genomes
- lane_dna_snapshots
- lane_intelligence_reports
- black_box_records
- lane_commands
- lane_command_targets

Use Redis or another durable queue for immediate command distribution and acknowledgements.
