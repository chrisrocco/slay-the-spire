---
phase: 01-foundation
plan: "05"
subsystem: data
tags: [watcher, cards, typescript, game-data, stances]

requires:
  - phase: 01-foundation/01
    provides: PlayerCard schema and stub data file
provides:
  - All 67 unique Watcher cards with base and upgraded variants (134 entries)
affects: [phase-2, phase-4]

tech-stack:
  added: []
  patterns: [as const satisfies readonly PlayerCard[], card data extraction from reference images]

key-files:
  created: []
  modified:
    - packages/shared/src/data/cards/watcher.ts

key-decisions:
  - "67 unique cards (not 85) — physical card count includes duplicate copies"
  - "Stance mechanics: Wrath, Calm, Mantra, Scry faithfully transcribed from board game"

patterns-established: []

requirements-completed: [CARD-01, CARD-02]

duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 05: Watcher Card Data Summary

**67 unique Watcher player cards (134 entries with upgraded variants) extracted from board game reference sheets**

## Performance

- **Duration:** 5 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- All Watcher starter, common, uncommon, and rare cards extracted with base and upgraded sides
- Board game Stance mechanics faithfully transcribed (Wrath, Calm, Mantra, Scry)
- Includes keyword tagging for wrath, calm, mantra, scry, retain

## Task Commits

1. **Task 1: Extract and write all Watcher card data** - `3b82ccb` (feat)

## Files Created/Modified
- `packages/shared/src/data/cards/watcher.ts` - 134 card entries (67 base + 67 upgraded)

## Decisions Made
- 67 unique card designs: 4 starters (Strike, Defend, Vigilance, Eruption), 20 commons, 29 uncommons, 14 rares

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
