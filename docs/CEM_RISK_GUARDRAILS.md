# CEM CULTURE Risk Guardrails

## Active Policy (Today)
- Max drawdown limit: 65%
- Max daily loss limit: 65%
- Caution state trigger: 65% of daily loss limit

## Caution State Actions
- Set risk state to `Caution`
- Downgrade scalping to `monitor-only`
- Log threshold event in risk dashboard and audit timeline

## Daily Loss Breach (100% of limit)
- Block all new automated entries
- Existing positions move to `monitor / managed exit only`
- Disable ladder/add permissions
- Log breach event in risk dashboard and docs

## Drawdown Breach (100% threshold)
- Pause all automated bots and squads
- Require manual acknowledgment before restart
- Log breach event in risk dashboard and docs

## Integration Notes
- Current implementation is a premium shell + mocked policy surfaces.
- TODO: wire policy engine to live execution controls and broker-side enforcement.
