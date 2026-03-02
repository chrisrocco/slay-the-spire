---
phase: 02-game-engine
plan: "08"
subsystem: engine
tags: [characters, ironclad, silent, defect, watcher, orbs, stances, shivs, miracles]

requires:
  - phase: 02-game-engine
    provides: damage system (plan 03), deck management (plan 04), player turn (plan 05)
provides:
  - Ironclad: starter deck, exhaust count tracking
  - Silent: shiv resolution as separate attacks, gainShivs with cap 5
  - Defect: orb channel/evoke/end-of-turn with forced evoke on full slots
  - Watcher: stance transitions with Calm energy, same-stance no-op, Wrath end-of-turn, miracles
affects: [02-09]

tech-stack:
  added: []
  patterns: [character module pattern, separate pure function modules per character]

key-files:
  created:
    - packages/server/src/game/engine/characters/ironclad.ts
    - packages/server/src/game/engine/characters/silent.ts
    - packages/server/src/game/engine/characters/defect.ts
    - packages/server/src/game/engine/characters/watcher.ts
    - packages/server/src/game/__tests__/characters.test.ts

requirements-completed: [CHAR-01, CHAR-02, CHAR-03, CHAR-04]

duration: 5min
completed: 2026-03-01
---

# Phase 02 Plan 08: Character Mechanics Summary

**All four character-specific mechanics: Ironclad exhaust, Silent shivs, Defect orbs, Watcher stances/miracles**

## Task Commits

1. **Task 1+2: All character mechanics** - `bedf1cd` (feat)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

---
*Phase: 02-game-engine*
*Completed: 2026-03-01*
