# Commercial Distribution Readiness - CEM CULTURE

## Scope
This checklist validates that the current release can be commercially distributed as a premium shell without overclaiming live integrations.

## Product checks
- Public marketing routes exist: Home, Bots, Squads, Providers, Results, Community, Pricing, FAQ, Contact, Login, Sign up
- Legal/trust routes exist: Privacy, Terms, Risk Disclosure
- Logged-in app shell includes: Feed, Link Vault, Bot Arena, Squads, Switch Lab, VPS Forge, Growth Chamber, Leaderboard, Messages, Challenges, Profile, Settings
- Provider/Operator routes exist under War Room
- Admin routes exist under Admin Console

## Monetization and access checks
- Command-tier pricing present:
  - Cadet: $0
  - Operator: $150/mo
  - Squadron: $500/mo
  - Command: invite-only
- Default signup role is `user`
- Provider/operator require admin approval flow messaging in onboarding and settings

## Trust and compliance checks
- Risk guardrails encoded:
  - max drawdown 65%
  - max daily loss 65%
  - caution at 42.25% (65% of daily limit)
- Hybrid data badging applied:
  - Simulation
  - User-Supplied
  - Placeholder Integration
- No claims of live broker linking/copier/VPS provisioning unless implemented

## Engineering checks
- Host binding set to `0.0.0.0` for Render readiness
- `/api/health` returns healthy response
- SPA route fallback enabled for deep links
- Environment template present at `app/.env.example`
- Route registry centralized at `app/public/src/core/routes.js`

## Remaining production integrations (expected)
- Broker connection and account ownership verification service
- Live copier execution orchestration
- VPS provider API integration
- Payment processor and reconciliation
- Legal consent capture and retention

## Release note language
Use this wording for launch communications:
"CEM CULTURE is released as a production-ready premium shell with simulated and placeholder-labeled integrations where live services are still being connected."
