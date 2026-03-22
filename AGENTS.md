# AGENTS.md - CEM CULTURE Implementation Guardrails

## Product Goal
Build `cemculture.tech` as a premium Social Trading Operating System with:
- marketing site + logged-in application shell
- social community features
- MT4/MT5 link vault + analytics
- remote bot control loadouts
- smart switch economy and unlock logic
- bot families and squads
- VPS launch/operations center
- provider/operator command tools
- admin control console

## Product Tone
- premium
- dark luxury
- polished desktop and mobile
- command-center quality
- social and progression-driven

## Branded Product Naming (Use These)
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

## Hard Requirements
1. Keep visual appeal high and cohesive.
2. Avoid exposing raw technical variable names in user-facing UI.
3. Use reusable components and domain boundaries.
4. Keep remote website-managed bot config as a first-class concept.
5. Keep MT4/MT5 tracking, growth, and risk context first-class.
6. Keep VPS launch and health management first-class.
7. Keep progression (ranks, badges, unlock ladder) first-class.
8. Keep squads central to bot orchestration.
9. Keep role boundaries clear: visitor, user, provider, operator, admin.
10. Do not overclaim live integrations.

## Architecture Expectations
- Shared app shell with route-based sections.
- Domain folders for social, linking, bots, switches, growth, vps, provider, admin.
- Shared design tokens, card systems, tabs, chips, metric components.
- Explicit TODO markers where backend services are pending.

## Integration Truthfulness Rules
- Do not claim broker linking is live unless implemented end-to-end.
- Do not claim copier execution is live unless actually wired.
- Do not claim VPS provisioning is live unless real infrastructure is connected.
- Mark simulated data and placeholder states clearly.

## Output Expectations for Agents
- Build complete and polished UX shells rather than fragmented deep integrations.
- Include loading, empty, and error states.
- Keep navigation continuity and route consistency.
- Document file changes and remaining TODO integration points.

## Visual Quality Requirements
- premium dark base with accent strategy
- subtle glow/glass accents where tasteful
- clean spacing and typography system
- strong cards, leaderboards, profile panels, rank/badge visuals
- avoid bland generic SaaS appearance
