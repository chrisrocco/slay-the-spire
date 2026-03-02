---
phase: 02-game-engine
plan: "03"
subsystem: engine
tags: [damage, status, vulnerable, weak, strength, tdd]

requires:
  - phase: 02-game-engine
    provides: CombatGameState, EnemyCombatState, test builders (plan 01)
provides:
  - calculateHitDamage with Strength/Weak/Vulnerable interactions
  - applyDamage with block absorption
  - applyMultiHit with per-hit modifiers and single token removal
  - applyStatusToken and removeStatusToken with caps
affects: [02-05, 02-06, 02-07, 02-08, 02-09]

tech-stack:
  added: []
  patterns: [pure function damage pipeline, token cap enforcement]

key-files:
  created:
    - packages/server/src/game/engine/damage.ts
    - packages/server/src/game/engine/status.ts
    - packages/server/src/game/__tests__/damage.test.ts
    - packages/server/src/game/__tests__/status.test.ts
  modified: []

key-decisions:
  - "Weak+Vulnerable cancel: when both apply, neither modifier takes effect and both lose 1 token"
  - "Strength applied before Vulnerable doubling: (base + strength) * 2"
  - "Multi-hit removes exactly 1 token after ALL hits, not per hit"

patterns-established:
  - "Damage pipeline: calculateHitDamage -> applyDamage -> applyMultiHit"
  - "Status caps enforced at application time (vulnerable/weak: 3, strength: 8)"

requirements-completed: [MECH-01, MECH-02, MECH-03, MECH-05, MECH-06, MECH-07]

duration: 5min
completed: 2026-03-01
---

# Phase 02 Plan 03: Damage Formula and Status Effects Summary

**TDD damage formula with Vulnerable doubling, Weak/Vulnerable cancellation, multi-hit token removal, and capped status token management**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Damage formula correctly implements board game's Strength -> Vulnerable -> Weak ordering
- Weak+Vulnerable cancellation rule tested and verified
- Multi-hit attacks apply modifiers to every hit but remove only 1 token total
- Status token caps enforced (vulnerable/weak: 3, strength: 8, poison: uncapped)
- 29 test cases covering all edge cases

## Task Commits

1. **Task 1: TDD damage formula** - `d38baf1` (feat)
2. **Task 2: TDD status token management** - `4b7ef7f` (feat)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Damage and status systems ready for player turn (02-05) and enemy turn (02-06)

---
*Phase: 02-game-engine*
*Completed: 2026-03-01*
