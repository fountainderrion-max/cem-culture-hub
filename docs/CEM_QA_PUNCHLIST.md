# CEM CULTURE QA Punch List

## Validation Checks
- Route registry reviewed for public/app/war-room/admin coverage.
- Domain mapping reviewed in `app-shell.js` for nav continuity.
- Shell placeholders labeled as simulated where backend integrations are staged.
- Loading/empty/error states present across social, link vault, bot arena, switch lab, growth, and VPS forge modules.
- Server SPA history fallback enabled for deep route refreshes.

## Open Integration TODOs
- Broker linking + MT4/MT5 ownership verification (Link Vault).
- Live copier execution and routing engine.
- Live VPS provisioning/orchestration APIs.
- Billing entitlements for switch and tier unlocks.
- Production auth/registration provider upgrade.
- Real-time messaging and notifications.
- Live risk policy enforcement engine (see `docs/CEM_RISK_GUARDRAILS.md`).

## Recommended Follow-Up
1. Add smoke tests for key routes and shell mounts.
2. Add API adapter layer per domain to replace in-file mock imports.
3. Add role-based e2e tests for visitor/user/provider/operator/admin boundaries.
4. Add visual regression snapshots for key premium shell pages.
