# CEM CULTURE QA and Integration Checklist

## Route Consistency
- [x] Central route registry exists and maps all public/app/war-room/admin paths.
- [x] Shell routing boundaries match path prefixes in app-shell and route registry.
- [x] Access control metadata exists per route and is enforced via guard checks.
- [x] Not-found and forbidden fallback surfaces render safely.

## Naming Consistency
- [x] Branded names used across navigation and domains:
  - Culture Feed
  - Link Vault
  - Bot Arena
  - Squads
  - Switch Lab
  - VPS Forge
  - Growth Chamber
  - War Room
  - Leaderboard
  - Mission Control

## Data Realism Labels
- [x] Simulation labels present in core command surfaces.
- [x] User-Supplied labels present for user-entered/configured flows.
- [x] Placeholder Integration labels used where live backend wiring is pending.

## UX State Coverage
- [x] Loading states present in major domains.
- [x] Empty states present where list data may be absent.
- [x] Error states present for key shell/domain loaders.

## Security and Trust UX
- [x] Link Vault includes encrypted credential messaging and trust-oriented panels.
- [x] Account history/audit concepts surfaced in shell.
- [x] Risk guardrail language present with caution/breach behaviors.

## Role Boundary Validation
- [x] Visitor, User, Provider, Operator, Admin roles recognized.
- [x] Default signup role remains user.
- [x] Elevated roles remain admin-vetted in UX language.

## Deploy and Runtime
- [x] Render web service model matches repository config.
- [x] Server host binding supports `0.0.0.0` deployment detection.
- [x] Health endpoint responds when service is active.

## Punch List (Remaining Backend Work)
- [ ] Replace mock social feeds/messages/challenges with live API streams.
- [ ] Wire Link Vault add-account and protections to encrypted backend workflows.
- [ ] Wire remote bot loadout publishing and switch activation APIs.
- [ ] Integrate real VPS provisioning/telemetry control plane.
- [ ] Connect provider payouts and admin payment reconciliation services.
- [ ] Replace role simulation with signed backend RBAC claims.

## Notes
- UI shell is intentionally complete and polished while integration backends remain staged.
- No live execution/provisioning claims should be made until services are wired and verified.
