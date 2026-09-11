# CEM CULTURE - Social Trading Operating System Shell

## What this repo is
CEM CULTURE is a premium web shell that combines:
- public marketing site
- logged-in social trading application
- MT4/MT5 Link Vault UX
- Bot Arena, Squads, and Switch Lab control surfaces
- VPS Forge hosting command center
- Provider/Operator War Room
- Admin console
- WISDO World immersive ecosystem layer

This release is designed for commercial distribution of the frontend and API shell while clearly labeling mock/simulated integrations.

## Current stack
- Runtime: Node.js (`app/launch.js` -> WISDO World sidecar -> `app/server.js`)
- Frontend: vanilla JS SPA modules in `app/public/src`
- Styling: tokenized CSS + premium card/layout styles in `app/public/style.css` and `app/public/src/design/*`
- Data layer: mocked domain models in `app/public/src/data/*` plus prototype WISDO World server state
- Routing/auth: client route registry in `app/public/src/core/routes.js`, auth context in `app/public/src/core/auth.js`

## Commercial readiness posture
- Default signup role is `user`
- Provider/operator/admin access is approval-gated
- Simulation, User-Supplied, and Placeholder Integration badges are used across critical system views
- Risk guardrails are encoded:
  - max drawdown: 65%
  - max daily loss: 65%
  - caution threshold: 42.25% (65% of daily-loss limit)
- No live broker, copier, billing, or VPS claims are made unless truly integrated

## Local run
```powershell
cd app
npm start
```

`npm start` launches `launch.js`, which loads WISDO World services before the existing application server. For legacy debugging only, use `npm run start:legacy`.

App health:
```powershell
curl http://127.0.0.1:3000/api/health
```

WISDO World catalog:
```powershell
curl http://127.0.0.1:3000/api/world/catalog
```

## Render deployment baseline
- Service type: `Web Service`
- Root directory: `app`
- Build command: `node -v`
- Start command: `node launch.js`
- Health check: `/api/health`
- Must bind: `HOST=0.0.0.0`
- Must expose: `PORT` (Render injects value)
- Production safety: `ALLOW_DEV_LOGIN=false`, `WORLD_ALLOW_DEV_TIER=false`

The current prototype stores runtime data as local JSON. Render filesystems are ephemeral unless a Persistent Disk is attached, so production entitlement/progression/account state should ultimately move to a managed database.

See:
- `app/render.yaml`
- `docs/render-production-settings.md`
- `docs/WISDO_WORLD_ECOSYSTEM.md`
- `docs/commercial-distribution-readiness.md`

## Key folders
- `app/public/src/domains/marketing` - public routes
- `app/public/src/domains/social` - feed/profile/messages/challenges/leaderboard
- `app/public/src/domains/link-vault` - account linking and analytics shell
- `app/public/src/domains/bot-arena` - bots, loadouts, remote control shell
- `app/public/src/domains/switch-lab` - switch catalog and unlock ladders
- `app/public/src/domains/vps-forge` - VPS plans, launch, health, terminal manager
- `app/public/src/domains/wisdo-world` - immersive WISDO World experience and sync client
- `app/public/src/domains/provider` - provider/operator tools
- `app/public/src/domains/admin` - admin tools

## Integration boundaries
The following remain shell-level or pending verified integrations unless backend services are wired:
- MT4/MT5 live broker linking
- copier execution
- VPS provisioning and lifecycle automation
- payment settlement / billing entitlements
- legal acceptance logging
- WebXR headset mode

Use TODO labels and badge states in UI to preserve trust and compliance messaging.
