# CEM CULTURE Architecture and Route Map

## Current Stack
- Runtime: Node.js HTTP server in `app/server.js`.
- Frontend: static SPA in `app/public` with ES modules and CSS token system.
- Routing: custom client-side router (`app/public/src/core/router.js`) with central route registry (`app/public/src/core/routes.js`).
- Data: realistic mock domain datasets under `app/public/src/data/*`.
- Auth shell: backend auth endpoints + frontend role simulation overlay (`app/public/src/core/auth.js`) with role-aware route guards.
- Deployment: Render Web Service (`app/render.yaml`) serving Node process and static assets.

## Current Routing and Layout Boundaries
- Public shell: marketing and auth pages.
- App shell: `/app/*` social, Link Vault, Bot Arena, Squads, Switch Lab, VPS Forge, Growth Chamber, messages/challenges/profile/settings.
- War Room shell: `/war-room/*` and `/mission-control` for provider/operator control.
- Admin shell: `/admin*` governance and platform controls.

The shared shell frame is in `app/public/src/app-shell.js`:
- primary shell nav (Public/App/War Room/Admin)
- context nav grouped by domain
- route outlet with domain mounting

## Auth and Role Model
Roles:
- Visitor
- User
- Provider
- Operator
- Admin

Defaults and guardrails:
- Default signup role is `user`.
- Provider/operator require admin vetting.
- Route access checks are enforced from route metadata and auth context.
- Role simulation exists for shell validation and is explicitly marked as development-only.

## Styling System and Reusable Components
Shared design system:
- Tokens: `app/public/src/design/tokens.css`
- Base/layout: `app/public/src/design/base.css`, `layout.css`
- Reusable UI families: `app/public/src/components/ui/primitives.css`, `cards.css`, `overlays-states.css`

Reusable visual patterns used across domains:
- premium cards and metric cards
- chips/badges including Simulation/User-Supplied/Placeholder Integration
- nav tabs and grouped sections
- table wrappers and state blocks (loading/empty/error)

## Existing Domain Modules
- Marketing: `domains/marketing`
- Social: `domains/social`
- Link Vault: `domains/link-vault`
- Bot Arena: `domains/bot-arena`
- Squads: `domains/squads`
- Switch Lab: `domains/switch-lab`
- VPS Forge: `domains/vps-forge`
- Growth Chamber: `domains/growth`
- Provider/War Room: `domains/provider`
- Admin: `domains/admin`

## Deployment Setup
Render settings proven by repository:
- Service Type: Web Service
- Root directory: `app`
- Build command: `node -v`
- Start command: `node server.js`

Runtime bind requirement:
- Host must bind to `0.0.0.0` for Render port scanning.
- Server now normalizes localhost host values to `0.0.0.0` fallback.

## What Is Preserved
- Existing modular domain folder structure.
- Centralized route registry with explicit role access per path.
- Existing shell architecture and domain mount model.
- Existing mock data model depth (53 bots, switch ladders, provider/admin records).

## What Is Upgraded
- Premium command-center visual consistency and badge/state language.
- Hero narrative emphasis order:
  1. Bot Arena
  2. Switch Lab
  3. VPS Forge
  4. Link Vault
  5. Culture Feed
  6. Growth Chamber
- Command-tier monetization framing:
  - Cadet: 0
  - Operator: 150/mo
  - Squadron: 500/mo
  - Command: invite-only
- Risk guardrails language:
  - Max drawdown 65%
  - Max daily loss 65%
  - Caution at 65% of daily-loss limit
  - Managed-exit and automation pause behaviors on threshold breach

## Final Route Map

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
- `/legal/privacy`
- `/legal/terms`
- `/legal/risk-disclosure`
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

### Provider and Operator
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

## Integration Boundaries and Truthfulness
- Live broker linking is not claimed complete.
- Live copier execution is not claimed complete.
- Live VPS provisioning is not claimed complete.
- Placeholder labels and TODO markers are used where backend services are pending.

## Delivery Priority Order (Today)
1. Public marketing + login gate polish for shareable URL quality.
2. Logged-in app shell continuity and full route coverage.
3. Domain-level interaction polish with explicit simulation/trust labeling.
