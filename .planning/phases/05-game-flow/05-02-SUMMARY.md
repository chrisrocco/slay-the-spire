---
phase: 05-game-flow
plan: 02
subsystem: game-engine
tags: [typescript, vitest, tdd, relics, potions, combat, triggers]

# Dependency graph
requires:
  - phase: 02-game-engine
    provides: triggers.ts infrastructure (collectTriggers/processTriggerQueue stubs), CardEffect types, resolveCardEffects
  - phase: 01-data
    provides: relics.ts and potions.ts with IDs and text data

provides:
  - relicEffects.ts: RELIC_TRIGGERS registry mapping relic IDs to trigger phase definitions
  - potionEffects.ts: POTION_EFFECTS registry mapping all 29 potion IDs to CardEffect arrays
  - collectTriggers() fully implemented: returns Trigger[] for all trigger phases from player relics + ON_DEATH potions
  - USE_POTION combat action: validates, resolves effects, removes potion, applies relic interactions
  - Fairy in a Bottle ON_DEATH trigger via POTION_TRIGGERS

affects:
  - 05-game-flow (subsequent plans using triggers for boss/event relics)
  - future relic acquisition and equipped relic tracking

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Registry pattern for relic/potion effects: Record<string, Def> with static or function-form effects"
    - "TDD with vitest: RED (failing tests) -> GREEN (minimal implementation) -> REFACTOR"
    - "Conditional triggers via condition?: (state, playerId) => boolean in RelicTriggerDef"
    - "Sacred Bark scaling via scalePotionEffects() mapping over CardEffect discriminated union"

key-files:
  created:
    - packages/server/src/game/engine/relicEffects.ts
    - packages/server/src/game/engine/potionEffects.ts
    - packages/server/src/game/__tests__/potions.test.ts
  modified:
    - packages/server/src/game/engine/triggers.ts
    - packages/server/src/game/engine/combat.ts
    - packages/server/src/game/__tests__/triggers.test.ts
    - packages/server/src/game/__tests__/combat.test.ts

key-decisions:
  - "Lizard Tail uses function-form effects to compute heal amount dynamically (healTo50% - currentHp)"
  - "Fairy in a Bottle added as POTION_TRIGGERS in relicEffects.ts, collected by collectTriggers() for ON_DEATH"
  - "Sacred Bark applied in usePotion() via scalePotionEffects() before resolveCardEffects, not in registry"
  - "Blood Potion uses function-form to read maxHp at resolution time (20% of current maxHp)"
  - "Pantograph, Boss energy relics included in registry but without combat-type gating (noted as future refinement)"

patterns-established:
  - "RelicTriggerDef: static effects[] or function (state, playerId) => effects[], plus optional condition and oneTime"
  - "PotionEffectDef: static effects[] or function (state, playerId, targetId) => effects[], plus needsTarget flag"
  - "usePotion() in combat.ts: validate -> lookup -> scale (Sacred Bark) -> resolveCardEffects -> remove -> Ornithopter -> log -> checkDeaths"

requirements-completed: [ITEM-01, ITEM-03, ITEM-04]

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 5 Plan 02: Relic Trigger System and Potion Effects Summary

**RELIC_TRIGGERS registry and USE_POTION handler implemented with TDD: 30+ relic triggers across 5 phases, all 29 potions mapped to CardEffect arrays, Toy Ornithopter/Sacred Bark relic interactions working**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-02T03:43:37Z
- **Completed:** 2026-03-02T03:48:49Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- `relicEffects.ts` with `RELIC_TRIGGERS` registry covering all trigger-phase relics (Anchor, Bag of Marbles, Vajra, Mercury Hourglass, Orichalcum, Burning Blood, Lizard Tail, etc.)
- `collectTriggers()` fully implemented: iterates players' relics, evaluates conditions, returns `Trigger[]` in player/relic order
- `potionEffects.ts` with `POTION_EFFECTS` registry for all 29 potions (9 fully implemented, 20 as `Unimplemented` stubs)
- `USE_POTION` combat action replaces stub with real implementation: validates ownership, resolves effects, removes potion, Toy Ornithopter heal, Sacred Bark doubling
- Fairy in a Bottle auto-trigger on ON_DEATH via `POTION_TRIGGERS` in relicEffects.ts

## Task Commits

Each task was committed atomically:

1. **Test (RED): Relic trigger tests** - `6dfc396` (test)
2. **Task 1: Relic effect registry and collectTriggers** - `1cd1465` (feat)
3. **Test (RED): Potion effect tests** - `1835bab` (test)
4. **Task 2: Potion effects and USE_POTION handler** - `39b6d63` (feat)

_TDD tasks have separate test (RED) and implementation (GREEN) commits_

## Files Created/Modified
- `packages/server/src/game/engine/relicEffects.ts` - RELIC_TRIGGERS registry + POTION_TRIGGERS for ON_DEATH potion auto-triggers
- `packages/server/src/game/engine/potionEffects.ts` - POTION_EFFECTS registry for all 29 potions
- `packages/server/src/game/engine/triggers.ts` - collectTriggers() implemented using RELIC_TRIGGERS + POTION_TRIGGERS
- `packages/server/src/game/engine/combat.ts` - USE_POTION case replaced with usePotion() function; imports added
- `packages/server/src/game/__tests__/triggers.test.ts` - 17 tests for relic trigger system (overwrite of Phase 2 stub tests)
- `packages/server/src/game/__tests__/potions.test.ts` - 16 tests for potion effects and USE_POTION
- `packages/server/src/game/__tests__/combat.test.ts` - Updated stale "[Stub]" test to test actual [Failed] rejection behavior

## Decisions Made
- Lizard Tail uses function-form effects to dynamically compute heal amount: `floor(maxHp * 0.5) - currentHp`, so the HealHp amount is determined at trigger-collection time based on actual player state
- Fairy in a Bottle added as a separate `POTION_TRIGGERS` record (not `RELIC_TRIGGERS`) since it's a potion, not a relic; `collectTriggers()` checks player potions for ON_DEATH triggers
- Sacred Bark scaling applied in `usePotion()` before calling `resolveCardEffects` via `scalePotionEffects()` — keeps the registry clean with base values
- Blood Potion uses function-form to capture `maxHp` at resolution time for percent-based healing
- 20 complex potions (Gambler's Brew, Snecko Oil, etc.) implemented as `Unimplemented` stubs — correct behavior for the current effect system scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale Phase 2 stub test in combat.test.ts**
- **Found during:** Task 2 verification (full test suite run)
- **Issue:** `combat.test.ts` had `USE_POTION returns stub log` testing for `[Stub]` string — test was written when USE_POTION was a stub. After implementing the real handler, it failed with `[Failed]` (player had no potion).
- **Fix:** Updated test to `USE_POTION rejects potion player does not have` testing for `[Failed]` — the actual correct behavior
- **Files modified:** `packages/server/src/game/__tests__/combat.test.ts`
- **Committed in:** `39b6d63` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in stale test)
**Impact on plan:** Required to maintain test suite integrity. No scope creep.

## Issues Encountered
- Initial Lizard Tail test used a player at full HP — the function-form effects returned empty array (heal would be negative). Fixed by using a player at 0 HP (dying state) which is the correct semantic for ON_DEATH trigger.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Relic triggers now fire at all 5 combat phases — ready for integration with boss relics and event-based relic acquisition
- All 29 potions registered — complex potions (duplication, distilled chaos, etc.) marked as Unimplemented and can be implemented incrementally
- Trigger infrastructure fully operational: `collectTriggers` -> `processTriggerQueue` pipeline tested end-to-end
- Test count: 310 total passing across all 19 test files

---
*Phase: 05-game-flow*
*Completed: 2026-03-02*
