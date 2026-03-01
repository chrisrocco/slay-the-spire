---
phase: 01-foundation
plan: "04"
subsystem: data
tags: [defect, cards, typescript, game-data, orbs]

requires:
  - phase: 01-foundation/01
    provides: PlayerCard schema and stub data file
provides:
  - All 73 unique Defect cards with base and upgraded variants (146 entries)
affects: [phase-2, phase-4]

tech-stack:
  added: []
  patterns: [as const satisfies readonly PlayerCard[], card data extraction from reference images]

key-files:
  created: []
  modified:
    - packages/shared/src/data/cards/defect.ts

key-decisions:
  - "73 unique cards (not 85) — physical card count includes duplicate copies"
  - "Board game Orb mechanics: Channel/Evoke without rotation, any Orb can be evoked directly"

patterns-established: []

requirements-completed: [CARD-01, CARD-02]

duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 04: Defect Card Data Summary

**73 unique Defect player cards (146 entries with upgraded variants) extracted from board game reference sheets**

## Performance

- **Duration:** 5 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- All Defect starter, common, uncommon, and rare cards extracted with base and upgraded sides
- Board game Orb mechanics faithfully transcribed (Channel/Evoke without rotation)
- Includes keyword tagging for channel, evoke, focus

## Task Commits

1. **Task 1: Extract and write all Defect card data** - `6d2d6b6` (feat)

## Files Created/Modified
- `packages/shared/src/data/cards/defect.ts` - 146 card entries (73 base + 73 upgraded)

## Decisions Made
- 73 unique card designs: 4 starters (Strike, Defend, Zap, Dualcast), 20 commons, 34 uncommons, 15 rares
- Orb text uses board game rules (no rotation, direct evoke of any Orb)

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
