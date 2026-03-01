---
phase: 01-foundation
plan: "02"
subsystem: data
tags: [ironclad, cards, typescript, game-data]

requires:
  - phase: 01-foundation/01
    provides: PlayerCard schema and stub data file
provides:
  - All 74 unique Ironclad cards with base and upgraded variants (148 entries)
affects: [phase-2, phase-4]

tech-stack:
  added: []
  patterns: [as const satisfies readonly PlayerCard[], card data extraction from reference images]

key-files:
  created: []
  modified:
    - packages/shared/src/data/cards/ironclad.ts

key-decisions:
  - "74 unique cards (not 85) — physical card count includes duplicate copies of commons and starters"
  - "Card text sourced exclusively from board game reference sheet images, not video game wikis"

patterns-established:
  - "Card data extraction: read webp reference images, transcribe to typed TypeScript objects"

requirements-completed: [CARD-01, CARD-02]

duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 02: Ironclad Card Data Summary

**74 unique Ironclad player cards (148 entries with upgraded variants) extracted from board game reference sheets**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T21:43:37Z
- **Completed:** 2026-03-01T21:50:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- All Ironclad starter, common, uncommon, and rare cards extracted with base and upgraded sides
- Card data uses typed PlayerCard schema with as const satisfies pattern
- Includes keyword tagging for exhaust, ethereal, retain, innate, vulnerable, weak, strength

## Task Commits

1. **Task 1: Extract and write all Ironclad card data** - `cadd99d` (feat)

## Files Created/Modified
- `packages/shared/src/data/cards/ironclad.ts` - 148 card entries (74 base + 74 upgraded)

## Decisions Made
- 74 unique card designs, not 85 — the physical count of 85 includes duplicate copies of commons and starters
- Card text sourced exclusively from board game reference sheet images

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ironclad card data complete for Phase 2 game engine
- Pattern established for remaining character extractions (Silent, Defect, Watcher)

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
