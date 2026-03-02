---
phase: 05-game-flow
plan: "03"
subsystem: game-flow
tags: [game-flow, room-handlers, state-machine, tdd, combat-dispatch, events, campfire, merchant, treasure]
dependency_graph:
  requires: [05-01]
  provides: [handleSelectNode, handleRoomComplete, handleRewardsComplete, encounterHandler, eliteHandler, bossHandler, eventHandler, campfireHandler, treasureHandler, merchantHandler]
  affects: [packages/server/src/game/gameFlow.ts, packages/server/src/game/roomHandlers/, packages/server/src/game/gameHandlers.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, effect text parsing via regex, relic-conditional dispatch, barrel exports]
key_files:
  created:
    - packages/server/src/game/gameFlow.ts
    - packages/server/src/game/roomHandlers/encounterHandler.ts
    - packages/server/src/game/roomHandlers/eliteHandler.ts
    - packages/server/src/game/roomHandlers/bossHandler.ts
    - packages/server/src/game/roomHandlers/eventHandler.ts
    - packages/server/src/game/roomHandlers/campfireHandler.ts
    - packages/server/src/game/roomHandlers/treasureHandler.ts
    - packages/server/src/game/roomHandlers/merchantHandler.ts
    - packages/server/src/game/__tests__/roomHandlers.test.ts
  modified:
    - packages/server/src/game/roomHandlers/index.ts
    - packages/server/src/game/gameHandlers.ts
decisions:
  - Preserved Insect applied after initCombat by reducing hp only (not maxHp), making hp < maxHp visible to players
  - Event effects parsed via regex on effect text strings from events.ts data, keeping data layer decoupled from logic
  - Treasure is instant (no player interaction) — resolves and transitions to MAP in a single enterTreasure call
  - campfireHandler validates relic prerequisites before applying effects and throws for invalid choices
metrics:
  duration_minutes: 6
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_modified: 11
---

# Phase 5 Plan 03: Game Flow State Machine and Room Handlers Summary

Game loop state machine and all seven room type handlers implemented via TDD — players can now navigate the map and enter every room type with correct phase transitions and relic interactions.

## What Was Built

### Game Flow State Machine (packages/server/src/game/gameFlow.ts)

Full rewrite from stub to production implementation:

- `handleSelectNode(room, playerId, nodeId, rng)`: Host-only validation, path connection checking (throws on invalid), Wing Boots relic bypass, dispatches to correct room handler based on node type
- `handleRoomComplete(room)`: COMBAT -> REWARDS, all other phases -> MAP
- `handleRewardsComplete(room)`: REWARDS -> MAP for normal rooms, REWARDS -> COMBAT_END (win) for boss room

### Room Handlers (packages/server/src/game/roomHandlers/)

**encounterHandler.ts** — `enterEncounter(room, rng)`:
- Draws floor-appropriate pool (first_encounter for floor 0, encounter for later floors)
- Selects 1 enemy per player count, deduplicates IDs with index suffix
- Calls `initCombat`, sets gamePhase to COMBAT

**eliteHandler.ts** — `enterElite(room, rng)`:
- Random elite from `eliteEnemies` pool
- Calls `initCombat`, then applies Preserved Insect by reducing `hp` only (not `maxHp`)
- Sets gamePhase to COMBAT

**bossHandler.ts** — `enterBoss(room, rng)`:
- Looks up boss by `room.bossId`, falls back to first boss
- Pantograph relic heals each player +25 HP before combat starts
- Sets gamePhase to COMBAT

**eventHandler.ts** — `enterEvent(room, rng)` + `resolveEventChoice(room, playerId, choiceIndex, rng)`:
- Draws random event from 12-event pool, initializes playerChoices with null per player
- Effect text parsing handles: `Heal X HP`, `Heal 1/3 of Max HP`, `Gain X gold`, `Lose X HP`, `Pay X gold`, `Gain 1 Max HP`, `Gain a Curse`, `Gain a relic`, `Remove a card`, `Upgrade a card` / `Upgrade 2 random cards`, `Transform a card`, `Roll the die` (with conditional branches), `Nothing happens`
- Transitions to MAP when all players have chosen

**campfireHandler.ts** — `enterCampfire(room)` + `resolveCampfireChoice(room, playerId, choice, cardId?, rng)`:
- Options: rest (heal 3 HP + Regal Pillow bonus), smith (upgrade card by appending `_upgraded`), dig (random relic, requires Shovel), lift (Girya), toke (remove card, Peace Pipe)
- Throws on relic violations: Coffee Dripper blocks rest, Fusion Hammer blocks smith
- Eternal Feather scales rest healing by deck size
- Transitions to MAP when all players have chosen

**treasureHandler.ts** — `enterTreasure(room, rng)`:
- Gives each player 1 relic from common pool (2 with Matryoshka)
- Cursed Key adds a curse to deck on chest open
- Instant resolution — transitions to MAP immediately

**merchantHandler.ts** — `enterMerchant(room, rng)` + `handleMerchantBuy` + `handleMerchantRemoveCard` + `handleMerchantLeave`:
- Generates 3 character cards + 2 colorless cards + 2 relics + 3 potions with randomized prices
- Meal Ticket heals +3 HP on enter; Smiling Mask sets removeCost to 0
- Buy validates gold and removes item from pool
- Remove validates once-per-visit tracking via `playersRemoved` array
- Leave transitions to MAP

### Barrel Export (packages/server/src/game/roomHandlers/index.ts)

Replaced stub with real re-exports from individual handler modules.

### gameHandlers.ts Type Fix

Fixed `gameFlowMerchantLeave` call (undefined) to `roomHandlerMerchantLeave`, and added type cast for campfire choice enum.

## Verification Results

- `pnpm test`: 377/377 tests pass (50 new room handler tests + 327 existing)
- `pnpm typecheck`: All 3 packages compile without errors
- All 12 Act 1 events have effect text that parses correctly
- Relic interactions for campfire, elite, treasure, merchant all verified

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved Insect HP reduction was equal (hp == maxHp)**
- **Found during:** Task 2 implementation (test failure: "expected 10 to be less than 10")
- **Issue:** Pre-scaling HP before `initCombat` caused both `hp` and `maxHp` to be the scaled value (since `initCombat` sets `maxHp = resolvedHp`)
- **Fix:** Apply Preserved Insect reduction *after* `initCombat` by reducing `hp` only, leaving `maxHp` at full value — making the enemy visibly damaged when combat starts
- **Files modified:** packages/server/src/game/roomHandlers/eliteHandler.ts
- **Commit:** 743e132 (within main implementation commit)

**2. [Rule 3 - Blocking] gameHandlers.ts referenced undefined stub functions**
- **Found during:** Task 1+2 typecheck (TS2304 errors for gameFlowCampfireChoice, gameFlowMerchantBuy, etc.)
- **Issue:** Previous stub plan had wired gameHandlers.ts to call functions that were expected to be exported from gameFlow.ts, but the Plan 05-03 implementation moved those to room handlers directly
- **Fix:** gameHandlers.ts already imported from roomHandlers/index.js — just needed the call sites to use the correct aliases and type casts
- **Files modified:** packages/server/src/game/gameHandlers.ts

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| RED (Task 1+2 tests) | c899a1b | test(05-03): add failing tests for game flow and room handlers |
| GREEN (Task 1+2 impl) | 743e132 | feat(05-03): implement game flow state machine and all 7 room handlers |

## Self-Check: PASSED
