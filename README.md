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

This release is designed for commercial distribution of the frontend and API shell while clearly labeling mock/simulated integrations.

## Current stack
- Runtime: Node.js (`app/server.js`)
- Frontend: vanilla JS SPA modules in `app/public/src`
- Styling: tokenized CSS + premium card/layout styles in `app/public/style.css` and `app/public/src/design/*`
- Data layer: mocked domain models in `app/public/src/data/*`
- Routing/auth: client route registry in `app/public/src/core/routes.js`, auth context in `app/public/src/core/auth.js`

## Commercial readiness posture
- Default signup role is `user`
- Provider/operator/admin access is approval-gated
- Simulation, User-Supplied, and Placeholder Integration badges are used across critical system views
- Risk guardrails are encoded:
  - max drawdown: 65%
  - max daily loss: 65%
  - caution threshold: 42.25% (65% of daily-loss limit)
- No live broker, copier, or VPS claims are made unless truly integrated

## Local run
```powershell
cd app
node server.js
```

App health:
```powershell
curl http://127.0.0.1:3000/api/health
```

## Render deployment baseline
- Service type: `Web Service`
- Root directory: `app`
- Build command: `node -v`
- Start command: `node server.js`
- Must bind: `HOST=0.0.0.0`
- Must expose: `PORT` (Render injects value)

See:
- `app/render.yaml`
- `docs/render-production-settings.md`
- `docs/commercial-distribution-readiness.md`

## Key folders
- `app/public/src/domains/marketing` - public routes
- `app/public/src/domains/social` - feed/profile/messages/challenges/leaderboard
- `app/public/src/domains/link-vault` - account linking and analytics shell
- `app/public/src/domains/bot-arena` - bots, loadouts, remote control shell
- `app/public/src/domains/switch-lab` - switch catalog and unlock ladders
- `app/public/src/domains/vps-forge` - VPS plans, launch, health, terminal manager
- `app/public/src/domains/provider` - provider/operator tools
- `app/public/src/domains/admin` - admin tools

## Integration boundaries
The following are shell-level with placeholders unless backend services are wired:
- MT4/MT5 live broker linking
- copier execution
- VPS provisioning and lifecycle automation
- payment settlement
- legal acceptance logging

Use TODO labels and badge states in UI to preserve trust and compliance messaging.
