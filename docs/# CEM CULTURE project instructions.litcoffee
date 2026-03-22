# CEM CULTURE project instructions

## Product goal
Build cemculture.tech into a social trading operating system with:
- social feed
- MT4/MT5 account linking and analytics
- remote bot control from the website
- smart switch unlock system
- squads and bot families
- VPS launch and management
- provider/operator dashboards
- admin controls

## Product tone
- premium
- high visual appeal
- modern
- dark luxury UI
- social-platform feel
- gamer-style progression and badges
- command-center energy

## Build priorities
1. App shell and information architecture
2. Auth and user roles
3. Feed, profile, rank, badges
4. Link Vault and account analytics
5. Bot Arena and Squads
6. Switch Lab
7. VPS Forge
8. Provider tools
9. Admin tools

## Hard requirements
- Keep the UI visually premium and polished.
- Design for mobile and desktop.
- Avoid raw ugly variable names in user-facing UI.
- Use branded labels like Trend Guardian, VPS Forge, Link Vault, Growth Chamber, Bot Arena, Switch Lab.
- Remote bot controls should use website-managed config profiles, not direct raw code editing.
- Smart switches must support unlock-by-payment and unlock-by-growth/rank.
- MT4/MT5 account pages must show growth, drawdown, health, and active bots/squads.
- VPS pages must support deployment, health, restart, and monitoring concepts.
- Social features must include posts, results, comments, follow, and profile badges.
- Build reusable components and a clean architecture.

## Engineering requirements
- Propose architecture before large implementation changes.
- Keep modules separated by domain.
- Use clean naming and document key files.
- Preserve existing working marketing pages unless intentionally replaced.
- Add TODO markers where backend integrations are stubbed.
- Prefer typed code and clear interfaces.

## Output style
- Summarize what changed
- List files added/updated
- Note blockers clearly
- Never claim integrations are complete if they are mocked