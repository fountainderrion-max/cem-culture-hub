# CEM CULTURE Architecture Blueprint

## Current State Audit
- Runtime: Node.js ES modules (`app/server.js`) + static assets in `app/public`.
- Frontend: Single-page operator console (`index.html`, `style.css`, `app.js`) without modular routing.
- Auth: Cookie session (`/api/auth/dev-login`, `/api/auth/logout`, `/api/auth/me`) and optional API key gate.
- Data: JSON file persistence (`app/data/trade-console-store.json`) and MT4 queue/executed JSONL files.
- Deployment: Render web service (`app/render.yaml`) running `node server.js`.

## Preserve
- HTTP server, security headers, rate limiting, session signing, API key gate.
- Existing MT4 queue concepts and command persistence patterns.
- Existing API health/auth/state endpoints as compatibility layer.

## Upgrade Scope
- Full premium product shell for public marketing + logged-in social trading app.
- Route system with role boundaries (visitor, user, provider, operator, admin).
- Reusable visual component system, branded naming, progression UX, trust UX.
- Domain-oriented frontend modules with realistic mock/stub integration boundaries.

## Domain Structure (Frontend)
- `app/public/src/core`: app bootstrap, router, auth gate, role guards.
- `app/public/src/design`: tokens/theme and shared styles.
- `app/public/src/components`: reusable cards, tabs, chips, tables, modals, metric components.
- `app/public/src/data`: typed mock models + fixtures.
- `app/public/src/domains/marketing`: public site pages.
- `app/public/src/domains/social`: feed/profile/messages/challenges/leaderboard.
- `app/public/src/domains/linkVault`: accounts, analytics, copier, protections, history.
- `app/public/src/domains/botArena`: bots, families, loadout, squads.
- `app/public/src/domains/switchLab`: switches, activation, unlock path.
- `app/public/src/domains/growth`: rank path, badges, unlock ladder.
- `app/public/src/domains/vpsForge`: plans, servers, health, terminal manager, logs.
- `app/public/src/domains/provider`: provider profile/followers/mission control/war room/payouts.
- `app/public/src/domains/admin`: admin management surfaces.

## Target Route Map

### Public
- `/`
- `/bots`
- `/squads`
- `/providers`
- `/results`
- `/community`
- `/pricing`
- `/faq`
- `/contact`
- `/login`
- `/signup`

### Logged-In App
- `/app/feed`
- `/app/link-vault/my-accounts`
- `/app/link-vault/add-account`
- `/app/link-vault/analytics`
- `/app/link-vault/copier-profiles`
- `/app/link-vault/protections`
- `/app/link-vault/history`
- `/app/bot-arena/all-bots`
- `/app/bot-arena/my-bots`
- `/app/bot-arena/profiles`
- `/app/bot-arena/families`
- `/app/bot-arena/compatible-switches`
- `/app/bot-arena/loadout`
- `/app/squads/explore`
- `/app/squads/my-squads`
- `/app/squads/profiles`
- `/app/squads/builder`
- `/app/switch-lab/explore`
- `/app/switch-lab/my-switches`
- `/app/switch-lab/active`
- `/app/switch-lab/unlock-path`
- `/app/vps-forge/plans`
- `/app/vps-forge/servers`
- `/app/vps-forge/launch`
- `/app/vps-forge/health`
- `/app/vps-forge/terminal-manager`
- `/app/vps-forge/deployment-logs`
- `/app/growth-chamber/account-growth`
- `/app/growth-chamber/unlock-ladder`
- `/app/growth-chamber/rank-path`
- `/app/growth-chamber/milestones`
- `/app/growth-chamber/rewards`
- `/app/leaderboard`
- `/app/messages`
- `/app/challenges`
- `/app/profile`
- `/app/settings`

### Provider/Operator
- `/war-room/overview`
- `/war-room/provider-profile`
- `/war-room/followers`
- `/war-room/squads`
- `/war-room/mission-control`
- `/war-room/posts`
- `/war-room/payouts`
- `/war-room/alerts`
- `/mission-control`

### Admin
- `/admin`
- `/admin/users`
- `/admin/providers`
- `/admin/bots`
- `/admin/squads`
- `/admin/switches`
- `/admin/vps`
- `/admin/accounts`
- `/admin/payments`
- `/admin/moderation`
- `/admin/analytics`

## Integration Boundaries (Stub Today)
- TODO: live MT4/MT5 broker linking + ownership verification.
- TODO: live copier execution and order routing.
- TODO: live smart switch activation billing + entitlement service.
- TODO: VPS provisioning/orchestration and terminal runtime control.
- TODO: payment processor webhooks and payout engine.
- TODO: real-time messaging and notifications.

## UX/Trust Standards
- Premium dark-luxury visual system with clear role separation.
- Trust panels for permissions, encrypted credential messaging, action history, emergency disconnect.
- All mocked states explicitly labeled as simulation/stub where appropriate.

## Server Constraints Inspected (March 22, 2026)
- Static root is `app/public` and unknown non-API `GET` paths already fall back to `index.html` for SPA history routing.
- API endpoints remain under `/api/*`; frontend routes must never shadow API namespace.
- Auth contract currently available:
  - `GET /api/auth/config` returns `allowDevLogin`.
  - `GET /api/auth/me` returns `{ authenticated, member }`.
  - `POST /api/auth/dev-login` issues cookie session and currently creates members with role `"member"`.
  - `POST /api/auth/logout` clears cookie session.
- API key guard and member-login guard can be enabled by environment; frontend must tolerate auth endpoint failures and show safe fallback states.

## Implemented Core Scaffold (Subagent 1 Scope)
- Added SPA core modules in `app/public/src/core`:
  - role normalization and access helpers (`roles.js`).
  - canonical route registry with role-aware permissions for public/app/war-room/admin (`routes.js`).
  - auth context resolver and route access checks (`auth.js`).
  - history-based SPA router with link interception, guard flow, and not-found/forbidden hooks (`router.js`).
- Added typed shared model contracts in `app/public/src/data/models.js`:
  - JSDoc typedefs for users, bots, squads, switches, accounts, vps, posts, badges, ranks, unlocks.
  - reusable empty store factory and explicit integration TODO notes.
- Added top-level shell assembler in `app/public/src/app-shell.js`:
  - public/app/war-room/admin nav shells.
  - role-aware route guarding and outlet rendering.
  - loading, warning, not-found, and forbidden states.
  - explicit TODO markers where backend integrations remain pending.
