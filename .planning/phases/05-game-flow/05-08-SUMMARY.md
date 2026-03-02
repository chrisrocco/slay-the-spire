---
phase: 05-game-flow
plan: 08
subsystem: api
tags: [websocket, game-flow, combat, rewards, potion]

# Dependency graph
requires:
  - phase: 05-game-flow
    provides: reward generation (generateRewards, generateBossRelicChoices, areAllRewardsChosen), game flow (handleRewardsComplete), combat engine (processAction with USE_POTION action)

provides:
  - checkCombatEnd() wiring: detects COMBAT_END TurnPhase and transitions gamePhase to REWARDS or BOSS_REWARD
  - handleUsePotion() handler: routes USE_POTION WebSocket message through processAction
  - Reward-pick handlers now call areAllRewardsChosen and trigger handleRewardsComplete
  - handleRewardsComplete boss path fixed: returns to MAP (not incorrect combat phase COMBAT_END)
  - 18 integration tests proving all three wiring gaps closed

affects: [game-client, end-to-end session]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "checkCombatEnd called after any combat action (play card, end turn, use potion) to detect phase transition"
    - "areAllRewardsChosen checked after each reward pick/skip; triggers handleRewardsComplete automatically"
    - "Gold from rewardState distributed to players immediately when combat ends"

key-files:
  created:
    - packages/server/src/game/__tests__/gapClosure.test.ts
  modified:
    - packages/server/src/game/gameHandlers.ts
    - packages/server/src/game/gameFlow.ts
    - packages/server/src/index.ts
    - packages/server/src/game/__tests__/roomHandlers.test.ts

key-decisions:
  - "checkCombatEnd exported from gameHandlers.ts to enable direct testing without mocking processAction"
  - "Gold from rewardState added to player totals immediately in checkCombatEnd (not deferred to reward pick)"
  - "handleRewardsComplete boss path returns gamePhase MAP for both boss and non-boss rooms — no special VICTORY state needed"
  - "Existing roomHandlers.test.ts boss test updated to reflect correct behavior (MAP, not COMBAT_END on TurnPhase)"

requirements-completed:
  - MAP-01
  - MAP-02
  - MAP-03
  - ROOM-01
  - ROOM-02
  - ROOM-03
  - ROOM-04
  - ROOM-05
  - ROOM-06
  - ROOM-07
  - RWRD-01
  - RWRD-02
  - RWRD-03
  - RWRD-04
  - RWRD-05
  - RWRD-06
  - ITEM-01
  - ITEM-02
  - ITEM-03
  - ITEM-04

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 05 Plan 08: Gap Closure Summary

**Three wiring gaps closed: combat-end generates rewards, boss combat triggers BOSS_REWARD with relics, USE_POTION routes through combat engine instead of NOT_IMPLEMENTED stub**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T20:28:00Z
- **Completed:** 2026-03-01T20:36:00Z
- **Tasks:** 2
- **Files modified:** 5 (3 source + 2 test)

## Accomplishments
- `checkCombatEnd()` helper detects `phase === 'COMBAT_END'` (TurnPhase) and transitions `gamePhase` to `REWARDS` or `BOSS_REWARD` with populated `rewardState`
- `handleUsePotion()` handler wired; `USE_POTION` WebSocket case in `index.ts` no longer returns NOT_IMPLEMENTED
- All four reward pick/skip handlers now call `areAllRewardsChosen` and trigger `handleRewardsComplete` when all players complete
- `handleRewardsComplete` boss path fixed: sets `gamePhase: 'MAP'` (not the wrong `phase: 'COMBAT_END'` combat TurnPhase)
- 18 integration tests in `gapClosure.test.ts`; all 414 server tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire combat-end reward generation and USE_POTION routing** - `050091a` (feat)
2. **Task 2: Fix handleRewardsComplete boss path and add integration tests** - `bfb13d4` (test)

## Files Created/Modified
- `packages/server/src/game/gameHandlers.ts` - Added `checkCombatEnd()`, `handleUsePotion()`, imports for `generateRewards`/`generateBossRelicChoices`/`areAllRewardsChosen`/`handleRewardsComplete`; updated reward handlers
- `packages/server/src/game/gameFlow.ts` - Fixed `handleRewardsComplete` boss path to set `gamePhase: 'MAP'` instead of wrong `phase: 'COMBAT_END'`
- `packages/server/src/index.ts` - Replaced NOT_IMPLEMENTED USE_POTION stub with `handleUsePotion` call
- `packages/server/src/game/__tests__/gapClosure.test.ts` - 18 integration tests covering all wired paths
- `packages/server/src/game/__tests__/roomHandlers.test.ts` - Updated boss rewards test to expect correct behavior (MAP not COMBAT_END)

## Decisions Made
- `checkCombatEnd` exported so it can be tested directly without mocking `processAction`
- Gold distributed to players immediately in `checkCombatEnd` rather than during reward pick (simpler, avoids off-by-one gold accounting)
- `handleRewardsComplete` made uniform for all room types — always returns to MAP; client determines victory state from context (boss defeated + MAP)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale roomHandlers.test.ts boss test to match corrected behavior**
- **Found during:** Task 2 (integration test run revealed 1 failing test)
- **Issue:** Existing test expected `room.gameState.phase` (TurnPhase) to be `'COMBAT_END'` after boss rewards — this was the old wrong behavior the plan told us to fix
- **Fix:** Updated test to assert `gamePhase === 'MAP'` and verify TurnPhase is NOT set to `COMBAT_END`
- **Files modified:** `packages/server/src/game/__tests__/roomHandlers.test.ts`
- **Verification:** All 414 tests pass
- **Committed in:** `bfb13d4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: stale test for corrected behavior)
**Impact on plan:** The test update was necessary — the old test was asserting incorrect behavior that the plan explicitly told us to fix.

## Issues Encountered
None beyond the stale test above.

## Next Phase Readiness
- All three wiring gaps closed — Act 1 session can run end-to-end
- Combat rewards, boss relic selection, and potion use all functional
- No remaining NOT_IMPLEMENTED stubs in combat flow
- All 414 server tests pass; TypeScript compiles clean

---
*Phase: 05-game-flow*
*Completed: 2026-03-01*
