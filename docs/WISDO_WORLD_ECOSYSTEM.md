# WISDO World Ecosystem

## Purpose

WISDO World is the immersive navigation and progression layer for CEM CULTURE. It does not replace the fast dashboard. Members can use the normal application for direct work or choose **ENTER WISDO** to enter a Wii-style virtual headquarters where platform domains become destinations, rooms, towers, labs, arenas, and locked access zones.

## Product contract

- The dashboard remains the fastest operational interface.
- WISDO World is an optional immersive layer over the existing application.
- Existing authentication, role checks, trading controls, safety checks, and backend services remain authoritative.
- Visual locks must eventually read from a production entitlement ledger; the initial world uses an explicitly labeled local preview tier.
- World progression in the initial build is device-local demonstration data and is not presented as production rank.
- Live trading, broker linking, copier execution, voice commands, billing, and VPS provisioning must never be represented as live unless their real integrations are confirmed.

## World map

### WISDO Plaza
Central spawn point, world map, identity, progression, and quick navigation.

### Trading Tower
Links into Link Vault analytics and represents account health, trading context, copier configuration, protections, and future Commander surfaces.

### WISDO Academy
Learning, practice missions, challenge progression, certification, and guided education.

### The Vault
Owned bots, presets, licenses, premium releases, and protected digital inventory. Sovereign-gated in the preview.

### Bot Arena
Bot catalog, families, profiles, loadouts, and compatible switches.

### Switch Lab
Capability discovery, owned switches, activations, and unlock path. Sovereign-gated in the preview.

### Growth Chamber
Account growth, rank path, milestones, unlock ladder, and rewards.

### Strategy Lab
Campaign autopsy, backtest review, heat maps, optimization, and experiment workflows. Elite-gated in the preview.

### Coach Center
Home for the WISDO/Coach intelligence experience. The first world only provides the shell and clearly marks AI/voice execution as pending integration.

### Culture Arena
Leaderboards, community challenges, reputation, and future events.

### Marketplace
Plans, access options, product discovery, and future entitlement checkout.

### VPS Forge
Server plans, health, terminal manager, and deployment operations. Sovereign-gated in the preview.

### Private Rooms
Personal headquarters, trophies, avatar identity, custom command layouts, and invite-only spaces. Commander-gated in the preview.

### War Room
Existing provider/operator operations surface. The world can visually preview access, but application RBAC still controls final authorization.

## Current vertical slice

The first implementation includes:

- standalone `/wisdo-world.html` experience
- persistent local avatar/profile shell
- keyboard movement with WASD/arrows
- touch directional controls
- nearest-building interaction with E/Enter
- clickable buildings and world map
- responsive desktop/tablet/mobile layout
- browser session detection through `/api/auth/me`
- optional prototype state hydration through `/api/state`
- safe degradation when the state endpoint is unavailable
- local preview progression and visited destinations
- four preview access tiers: Member, Sovereign, Elite, Commander
- locked-room purchase/access routing to `/pricing`
- direct portals into existing CEM CULTURE domains
- persistent **ENTER WISDO** launcher on the main application
- explicit WebXR roadmap labeling without claiming headset VR is implemented

## Existing architecture mapped into the world

| Existing product domain | World expression |
| --- | --- |
| Culture Feed | Plaza / Coach social pulse |
| Link Vault | Trading Tower |
| Bot Arena | Bot Arena / The Vault |
| Squads | Quick portal; future Squad Hall |
| Switch Lab | Switch Lab |
| VPS Forge | VPS Forge |
| Growth Chamber | Growth Chamber |
| Leaderboard / Challenges | Culture Arena / Academy |
| War Room | War Room |
| Profile | Avatar / Private Rooms |
| Reporter Mesh specification | Future Trading Tower network room |

## Next integration contracts

### Entitlement ledger
Replace the local tier preview with a backend endpoint such as:

```json
{
  "plan": "SOVEREIGN",
  "entitlements": ["vault", "switch-lab", "vps-forge"],
  "products": [],
  "updatedAt": "..."
}
```

World locks should only open from verified entitlements.

### Progression service
Persist XP, ranks, badges, certifications, challenges, achievements, and room upgrades server-side. Keep financial performance separate from social reputation where required to prevent misleading ranking incentives.

### Reporter Mesh room
Expose workspace nodes, account assignments, execution route status, last heartbeat, and permissions. Execution must continue to require a valid route for the exact account and confirmation for dangerous actions.

### Coach Center
Connect the existing Wisdo AI / Coach command layer with explicit action confirmation, account context, and audit events. Voice is an interface to validated commands, not a bypass around permission checks.

### Commerce
Connect pricing products to payments and then to an entitlement ledger. The UI should unlock a room only after the backend confirms the entitlement.

### WebXR
Add a real 3D renderer and WebXR session only after the browser-world interaction model is stable. Desktop/mobile access remains first-class even when headset support is introduced.

## Definition of done for production entitlement unlocks

1. Authenticated user identity resolves server-side.
2. Billing event is verified server-side.
3. Product-to-entitlement mapping is deterministic and versioned.
4. Entitlement response is authoritative and cache-safe.
5. World reads entitlements; it never trusts a client-only tier value.
6. Existing route/RBAC checks remain in force after a door opens.
7. Revocation closes access without deleting owned progress/history.
8. Every high-impact trading action remains independently permissioned and auditable.
