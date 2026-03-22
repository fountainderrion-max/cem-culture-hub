# QA Automation Guide

## Purpose
This guide captures how to exercise the new routine checks that keep the shared marketing/app shell honest and highlight missing public-facing tooling.

## Smoke checks (`scripts/qa/smoke.ps1`)
- **What it does:** spins up `node app/server.js` on a randomized port, waits for `/api/health` to respond, hits one route for each shell (`/`, `/app/feed`, `/war-room/overview`, `/admin`), and finishes by verifying `/api/health` and `/api/public-config` again. All requests must return 2xx before the script exits cleanly; otherwise it prints the failing endpoints and returns a non-zero status.
- **How to run:** from the repository root, execute `pwsh .\scripts\qa\smoke.ps1`. Optional parameters include `-StartupTimeoutSeconds` (default 30) and `-RequestTimeoutSeconds` (default 8) to tune waits in slower environments.
- **Requirements:** Node 18+/20+, PowerShell (pwsh or Windows PS). The script forces a temporary `PORT`, inherits credentials from `app/.env*`, and ensures the server is stopped even when a check fails.
- **Interpretation:** look at the `[PASS]` lines for each route; if one fails you’ll see a short reason (non-2xx code or network error). If startup stalls, increase `-StartupTimeoutSeconds` or inspect `app/log` output.

## Route registry validator (`scripts/qa/validate-routes.mjs`)
- **What it does:** imports `ROUTE_REGISTRY` from `app/public/src/core/routes.js` and ensures there are no duplicates plus that every commercial/legal landing page (`/terms`, `/privacy`, `/risk`, `/security`) plus the key UX paths listed below exist.
- **Key app routes checked:** `/app/feed`, `/app/link-vault/my-accounts`, `/app/link-vault/history`, `/app/bot-arena/all-bots`, `/app/squads/explore`, `/app/switch-lab/explore`, `/app/vps-forge/plans`, `/app/growth-chamber/account-growth`, `/app/leaderboard`, `/app/messages`, `/app/profile`, `/app/settings`. Extend the list before running the validator if the UX expands.
- **How to run:** `node scripts/qa/validate-routes.mjs`. It prints a success line when everything is wired or lists missing routes/duplicates and exits with code 1.
- **Why it matters:** this script complements `app/public/src/qa/route-validator.js` (used inside the SPA) so both marketing and QA routines stay honest about the pages that must exist before a release.

## Next steps
1. When a required route is missing, add it to `app/public/src/core/routes.js` with appropriate `label`, `summary`, and `navGroup`, then rerun both validators.
2. Combine these checks into CI once manual runs are stable: start the smoke check after the build step and run the route validator before deploying marketing content.
