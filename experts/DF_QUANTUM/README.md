# DF QUANTUM (MT4 Super Bot Framework)

`DF_QUANTUM.mq4` is a unified EA framework that combines:
- Multi-strategy voting engine
- Legacy bot manifest weighting (all your bot names can vote)
- Persistent memory (win rate, PF, behavior mode) across sessions
- Adaptive integer parameters (`SL`, `TP`, trailing stop) based on regime and performance
- Institutional breakout detection (round-number + prior day level breaks)

## Important Constraint

Compiled `.ex4` internals cannot be extracted or merged directly.  
This framework supports:
- Direct logic integration from `.mq4` sources
- Manifest-based participation for every bot name
- Progressive migration of specific bot logic modules into one EA

## Files

- `DF_QUANTUM.mq4` -> main EA
- `../../config/mt4/df-quantum-bot-manifest.csv` -> generated list of your bot names and weights

## Install

1. Copy `DF_QUANTUM.mq4` into your MT4 `MQL4/Experts/` folder.
2. Copy `config/mt4/df-quantum-bot-manifest.csv` into:
   - `MQL4/Files/Common/df-quantum-bot-manifest.csv` (recommended), or
   - `MQL4/Files/df-quantum-bot-manifest.csv`
3. Compile in MetaEditor.
4. Attach to chart (`XAUUSD` or `XAGUSD`) and enable AutoTrading.

## How Adaptation Works

- If recent performance weakens, behavior shifts conservative:
  - Wider `SL`, tighter risk posture, less aggressive execution.
- If recent performance is strong and stable, behavior shifts aggressive:
  - Tighter `SL` multipliers and stronger follow-through on confirmed regimes.
- Institutional breakout can bias votes and switch parameter profile automatically.

## How To Extend

- Add dedicated function blocks per EA family (example: `DF_HIGHTOWER`, `DF_KNOT`, `KINGDOM`) and inject into `LegacyBotVotes()`.
- Keep each module isolated so you can test and tune it independently.
- Re-run your optimizer pipeline and adjust `BaseWeight` per bot in manifest.
