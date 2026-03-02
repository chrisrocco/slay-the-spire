---
phase: 02-game-engine
plan: "04"
subsystem: engine
tags: [deck, draw, discard, exhaust, scry, retain, ethereal, tdd]

requires:
  - phase: 02-game-engine
    provides: CombatGameState, test builders (plan 01)
provides:
  - drawCards with automatic reshuffle from discard
  - discardHand with Retain and Ethereal support
  - moveToExhaust for hand and discard sources
  - scry/resolveScry for selective top-deck discard
  - shuffleDiscardIntoDraw with injectable RNG
affects: [02-05, 02-07, 02-08, 02-09]

tech-stack:
  added: []
  patterns: [injectable RNG for deterministic testing, updatePlayer helper]

key-files:
  created:
    - packages/server/src/game/engine/deck.ts
    - packages/server/src/game/__tests__/deck.test.ts
  modified: []

key-decisions:
  - "Injectable RNG parameter for shuffle/draw enables deterministic testing"
  - "discardHand uses cardLookup callback to resolve Ethereal/Retain flags without importing card data"

patterns-established:
  - "updatePlayer helper for immutable player state updates"
  - "Card zone operations as pure functions returning new CombatGameState"

requirements-completed: [CMBT-02, CMBT-09, MECH-08, MECH-09, MECH-10, MECH-11]

duration: 5min
completed: 2026-03-01
---

# Phase 02 Plan 04: Deck Management Summary

**TDD deck operations: draw with auto-reshuffle, discard with Retain/Ethereal, exhaust, and Scry**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Draw cards with automatic reshuffle when draw pile depleted
- Discard hand respects Retain (stays) and Ethereal (exhaust instead of discard)
- Move to exhaust from hand or discard pile
- Scry peek + selective discard
- Fisher-Yates shuffle with injectable RNG for deterministic tests
- 18 test cases

## Task Commits

1. **Task 1+2: TDD deck management** - `0062ee4` (feat)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Deck operations ready for player turn lifecycle (02-05)

---
*Phase: 02-game-engine*
*Completed: 2026-03-01*
