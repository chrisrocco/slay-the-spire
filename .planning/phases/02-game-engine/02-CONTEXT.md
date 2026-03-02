# Phase 2: Game Engine - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning
**Source:** Auto-generated from rulebook + Phase 1 artifacts

<domain>
## Phase Boundary

Pure TypeScript game engine implementing all board game combat rules: player turn flow, card resolution, enemy AI, status effects, character-specific mechanics. No networking, no UI — pure functions that take GameState and return new GameState. Must be fully testable with vitest.

</domain>

<decisions>
## Implementation Decisions

### State Model
- GameState is immutable — engine functions return new state, never mutate
- PlayerState already defined in packages/shared/src/schemas/gameState.ts — extend as needed for status tokens (Strength, Vulnerable, Weak, Poison, Shivs, Miracles, Orbs, Stance)
- Enemy state needs expansion: current schema uses string IDs only — need full enemy combat state (HP, block, tokens, cube position, action patterns)
- Row-based targeting: enemies are assigned to player rows, bosses are in all rows

### Turn Flow (from rulebook p12-13)
- Player Turn phases: Start of Turn (reset energy/block, draw 5, roll die, trigger abilities) → Play (simultaneous card play) → End of Turn (trigger end-of-turn, discard hand)
- Enemy Turn phases: Remove enemy block → Enemy actions (top row to bottom, left to right, bosses last) → Move cube actions
- Combat ends when all enemies are dead (or all players dead)

### Card Resolution Order (from rulebook p12)
- Pay energy cost → Choose targets → Resolve effects top-to-bottom → Cleanup (discard/power/exhaust)
- Triggered abilities from a card don't fire until after the card finishes resolving all text
- Cards that are "being played" are not in hand or discard during resolution

### Status Effect Rules (from rulebook p14, 24)
- Vulnerable: doubles hit damage, max 3 tokens, lose 1 token after attack resolves
- Weak: reduces hit damage by 1 per hit, max 3 tokens, lose 1 token after attack resolves
- Weak vs Vulnerable on same attack: cancel out — attack unaffected, both lose 1 token
- Strength: +1 damage per hit per token, max 8 — added before Vulnerable doubling
- Poison: loses 1 HP per token at end of turn, ignores block, max 30 combined across all enemies
- Block: prevents damage, max 20 for players, no cap for enemies

### Multi-hit Resolution (from rulebook p14)
- All hits in a multi-hit have the same target (unless stated otherwise)
- All hits equally affected by damage bonuses (Strength)
- All hits equally affected by Vulnerable/Weak
- Remove one Vulnerable/Weak token when entire multi-hit is complete

### Character Mechanics (from rulebook p16-17)
- Ironclad: Strength token tracking, Exhaust pile synergies, highest starting HP
- Silent: Poison tokens on enemies (max 30 total), Shiv tokens (max 5, deal 1 damage each, treated as separate Attacks)
- Defect: Orb system — Channel into slots, Evoke to remove and trigger effect, end-of-turn effects for Lightning/Frost orbs. Any orb can go in any slot, any orb can be evoked (unlike video game)
- Watcher: Stances (Neutral/Calm/Wrath), Miracles (max 5, gain 1 energy each). Leaving Calm grants 2 energy. Wrath grants +1 damage on all hits but take 1 damage at end of turn

### Enemy AI (from rulebook p13)
- Three action pattern types: Single (same action every turn), Die (action based on die result), Cube (track position, cycle through actions)
- Cube actions: gray slots are not repeated when cycling
- Enemies target player in their row; boss targets all players
- "Acts last" enemies act after other enemies but before boss

### Triggered Abilities (from rulebook p19)
- Must support: start of turn, start of combat, end of turn, end of combat, on death, die relic triggers
- Queue-based resolution to prevent recursive loops
- "Start of turn" abilities fire in player-chosen order

### Claude's Discretion
- Internal architecture of the engine (function signatures, module organization)
- How to model card effects programmatically (effect system design)
- Test structure and coverage strategy
- Whether to process all card effects generically or special-case some
- How to handle the "Golden Rule" (card text overrides rules)

</decisions>

<specifics>
## Specific Ideas

- Engine must be pure functions — no side effects, no WebSocket awareness, no UI coupling
- The rulebook PDF (rulebook.txt) is the source of truth for all rule interactions
- Board game rules differ from video game in several ways (e.g., Orbs don't rotate, can evoke any orb, Shivs are tokens not cards)
- Energy max is 6, not 3 — players start at 3 but can gain more from card effects and Miracles

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlayerCard` schema in packages/shared/src/schemas/cards.ts — defines card structure with effects as string arrays
- `EnemyCard` schema in packages/shared/src/schemas/enemies.ts — defines enemy structure with action patterns
- All card data files (ironclad.ts, silent.ts, defect.ts, watcher.ts) — 282 unique cards with effect text
- All enemy data files (encounters.ts, elites.ts, bosses.ts) — 24 Act 1 enemies with HP and actions
- `GameState` and `PlayerState` schemas already defined — need extension for combat tokens

### Established Patterns
- Zod v4 schemas for type contracts — extend existing schemas rather than creating parallel types
- `as const satisfies` pattern for static data — follow same pattern for any new data
- pnpm monorepo with packages/shared importable by both client and server

### Integration Points
- Engine lives in packages/server/src/game/ (or packages/shared/src/engine/ if client needs it for predictions)
- Takes GameState, returns new GameState — this is the contract Phase 3 (Session Management) will call
- Card effect strings in data files need to be parsed/interpreted by the engine

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-game-engine*
*Context gathered: 2026-03-01*
