---
phase: 05-game-flow
plan: "01"
subsystem: shared-schemas
tags: [schemas, game-state, messages, zod, phase-5-foundation]
dependency_graph:
  requires: []
  provides: [GamePhaseSchema, GameMapSchema, RewardStateSchema, EventStateSchema, MerchantStateSchema, CampfireChoiceSchema, Phase5ClientMessages]
  affects: [packages/server/src/game/state/combatState.ts, packages/server/src/lobby/gameInit.ts, packages/server/src/rooms/__tests__/reconnection.test.ts, packages/server/src/game/__tests__/helpers.ts]
tech_stack:
  added: []
  patterns: [Zod discriminated unions, Zod schema extension with .extend(), optional fields with .default() for backward compatibility]
key_files:
  created: []
  modified:
    - packages/shared/src/schemas/gameState.ts
    - packages/shared/src/schemas/messages.ts
    - packages/server/src/game/__tests__/helpers.ts
    - packages/server/src/lobby/gameInit.ts
    - packages/server/src/rooms/__tests__/reconnection.test.ts
decisions:
  - gamePhase field defaults to COMBAT so existing combat-only code paths continue without explicit assignment
  - All new GameState fields use .optional() or .default() to maintain full backward compatibility with existing CombatGameState creation code
  - CampfireChoiceSchema reuses the same ['rest','smith','dig','lift','toke'] enum as CAMPFIRE_CHOICE client message for consistency
  - REWARD_PICK_POTION and REWARD_PICK_RELIC have no payload since there is only one potion/relic reward item per room
metrics:
  duration_minutes: 5
  completed_date: "2026-03-02"
  tasks_completed: 3
  files_modified: 5
---

# Phase 5 Plan 01: Extend Schemas for Game Flow Summary

Zod schemas extended to cover the full game loop — MAP, EVENT, CAMPFIRE, TREASURE, MERCHANT, COMBAT, REWARDS, BOSS_REWARD — with new GameState fields and 12 new ClientMessage types.

## What Was Built

### GameState Extensions (packages/shared/src/schemas/gameState.ts)

- `GamePhaseSchema` enum: `MAP | EVENT | CAMPFIRE | TREASURE | MERCHANT | COMBAT | REWARDS | BOSS_REWARD`
- `RoomTypeSchema` and `MapNodeSchema` / `GameMapSchema`: mirror the TypeScript interfaces in mapGenerator.ts with full Zod validation
- `RewardStateSchema`: gold, per-player card reward arrays, optional potion/relic rewards, per-player choice tracking
- `EventStateSchema`: eventId + per-player choice index tracking
- `MerchantStateSchema`: card/relic/potion pools with prices, remove cost, removal tracking
- `CampfireChoiceSchema`: per-player campfire option (rest/smith/dig/lift/toke)
- `GameStateSchema` extended with: `gamePhase` (default COMBAT), `currentFloor` (default 0), `map?`, `eventState?`, `rewardState?`, `merchantState?`, `campfireState?`

### New ClientMessage Types (packages/shared/src/schemas/messages.ts)

12 new message types added to the discriminated union:
- `SELECT_NODE` (map navigation)
- `EVENT_CHOICE` (event room)
- `CAMPFIRE_CHOICE` (rest/smith/dig/lift/toke with optional cardId for smith)
- `MERCHANT_BUY`, `MERCHANT_REMOVE_CARD`, `MERCHANT_LEAVE` (merchant interactions)
- `REWARD_PICK_CARD`, `REWARD_PICK_POTION`, `REWARD_PICK_RELIC`, `REWARD_SKIP` (rewards)
- `PASS_POTION`, `DISCARD_POTION` (potion management)

### CombatGameState Verification

`CombatGameStateSchema = GameStateSchema.extend({...})` automatically inherits all new optional fields. No changes to combatState.ts required. Existing object literals in helpers, gameInit, and reconnection tests were updated to include `gamePhase: 'COMBAT'` and `currentFloor: 0`.

## Verification Results

- `pnpm typecheck`: All 3 packages compile without errors
- `pnpm test` (server): 269/269 tests pass
- `pnpm test` (shared): 25/25 tests pass
- All new schema types are auto-exported via existing `export * from './schemas/gameState.js'` in index.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CombatGameState literal objects missing new required fields**
- **Found during:** Task 1 verification (typecheck)
- **Issue:** Three files created `CombatGameState` object literals without the new `gamePhase` and `currentFloor` fields. TypeScript correctly flagged them as TS2739 errors since Zod `.default()` makes the inferred type require the field.
- **Fix:** Added `gamePhase: 'COMBAT'` and `currentFloor: 0` to object literals in helpers.ts, gameInit.ts, and reconnection.test.ts
- **Files modified:** packages/server/src/game/__tests__/helpers.ts, packages/server/src/lobby/gameInit.ts, packages/server/src/rooms/__tests__/reconnection.test.ts
- **Commit:** 4458f50

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4458f50 | feat(05-01): extend GameState schema with game flow fields |
| 2 | 0751ce3 | feat(05-01): add Phase 5 client message types |

## Self-Check: PASSED
