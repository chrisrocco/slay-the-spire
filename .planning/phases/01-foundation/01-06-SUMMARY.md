---
phase: 01-foundation
plan: "06"
subsystem: data
tags: [enemies, encounters, elites, bosses, typescript, game-data]

requires:
  - phase: 01-foundation/01
    provides: EnemyCard schema and stub data files
provides:
  - All Act 1 encounter, elite, and boss enemy data
affects: [phase-2]

tech-stack:
  added: []
  patterns: [as const satisfies readonly EnemyCard[], HP board scaling as player-count objects]

key-files:
  created: []
  modified:
    - packages/shared/src/data/enemies/encounters.ts
    - packages/shared/src/data/enemies/elites.ts
    - packages/shared/src/data/enemies/bosses.ts

key-decisions:
  - "HP board scaling modeled as { 1: N, 2: N, 3: N, 4: N } objects for elites and bosses"
  - "No Ascension enemy variants included per project scope"
  - "All three action pattern types (single/die/cube) used where appropriate"

patterns-established:
  - "Enemy data pattern: fixed HP (number) vs scaled HP (object by player count)"

requirements-completed: [CARD-03]

duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 06: Enemy Data Summary

**24 Act 1 enemy entries across 3 files extracted from rulebook**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- 16 encounter enemies (4 first encounters + 12 regular) with die, cube, and single action patterns
- 5 elite enemies (3 elites + 2 sentry summons) with HP board scaling
- 3 Act 1 bosses (The Guardian, Hexaghost, Slime Boss) with HP board scaling

## Task Commits

1. **Task 1 & 2: Extract all Act 1 enemy data** - `968ad92` (feat)

## Files Created/Modified
- `packages/shared/src/data/enemies/encounters.ts` - 16 entries
- `packages/shared/src/data/enemies/elites.ts` - 5 entries
- `packages/shared/src/data/enemies/bosses.ts` - 3 entries

## Action Pattern Breakdown
- **Single:** 2 (Mad Gremlin, Sneaky Gremlin)
- **Die:** 5 (Louse 1st, Slime 1st, Red Louse, Green Louse, Acid Slime, Spike Slime)
- **Cube:** 17 (all remaining encounters, all elites, all bosses)

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
