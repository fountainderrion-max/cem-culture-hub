# Culture Lane Phase 3 Production Core

## Included

- PostgreSQL repository for lane and command snapshots
- Redis pub/sub delivery bus
- distributed command locks
- reporter heartbeat storage
- delayed retry queue and retry worker
- daily compound reset scheduler with per-lane timezone support
- command idempotency, per-target states, retries, verification, and terminal outcomes
- tests for fan-out, acknowledgements, completion, and daily resets

## Required environment

```env
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://default:password@host:6379
PGSSL=true
PG_POOL_MAX=10
CULTURE_COMMAND_MAX_ATTEMPTS=4
CULTURE_COMMAND_TIMEOUT_MS=30000
CULTURE_RETRY_INTERVAL_MS=2000
CULTURE_RETRY_DELAY_MS=3000
CULTURE_LOCK_TTL_MS=15000
CULTURE_DEFAULT_TIMEZONE=America/New_York
```

## Database

Run `app/culture-lane/db/schema.sql` against PostgreSQL before enabling production mode.

## Runtime integration

`createProductionCultureLaneRuntime()` in `app/culture-lane/production-runtime.js` creates and connects:

1. PostgreSQL repository
2. Redis command bus
3. distributed lock adapter
4. command orchestrator
5. retry worker

The current JSON repository remains the safe local fallback. Production startup should select PostgreSQL/Redis only when both `DATABASE_URL` and `REDIS_URL` are present.

## Required reporter flow

1. Reporter sends heartbeat and symbol inventory.
2. Website creates an idempotent command.
3. Redis publishes one account-specific message per target.
4. Reporter acknowledges `RECEIVED`, `EXECUTING`, then `SUCCESS` or failure.
5. Close commands are verified with a final open-trade count.
6. Failed targets enter the delayed retry queue.
7. Harvest is completed only when all selected accounts report success and zero remaining positions.

## Safe rollout

- Run `npm install` inside `app/`.
- Run `npm test`.
- Apply the PostgreSQL schema.
- Connect a Redis instance.
- Test with demo accounts.
- Force one reporter offline and confirm partial-failure behavior.
- Reconnect it and confirm retry delivery.
- Confirm duplicate Harvest triggers produce one active command.
- Confirm the daily reset uses the lane timezone.
- Do not enable funded accounts until close verification and reporter acknowledgements pass repeatedly.
