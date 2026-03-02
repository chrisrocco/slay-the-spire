---
phase: 04-core-client-ui
plan: 02
subsystem: ui
tags: [solidjs, card-component, css-modules, board-game-styling]

requires:
  - phase: 01-foundation
    provides: PlayerCard type, card data arrays (ironclad, silent, defect, watcher, curses, statuses, dazes)
provides:
  - Card lookup utility (getCard, getCardOrPlaceholder)
  - Card component with character-colored borders, selection, dimming
  - CardTooltip component with enlarged hover view
affects: [04-core-client-ui]

tech-stack:
  added: []
  patterns: [card-lookup-map, board-game-card-styling]

key-files:
  created:
    - packages/client/src/utils/cardLookup.ts
    - packages/client/src/components/combat/Card.tsx
    - packages/client/src/components/combat/Card.module.css
    - packages/client/src/components/combat/CardTooltip.tsx
    - packages/client/src/components/combat/CardTooltip.module.css
  modified: []

key-decisions:
  - "Card lookup builds Map at module load from all card arrays for O(1) access"
  - "Character colors mapped inline: ironclad=#c62828, silent=#2e7d32, defect=#1565c0, watcher=#6a1b9a"
  - "Unplayable cards get dimmed class (opacity 0.5 + grayscale filter)"
  - "CardTooltip uses position:fixed with viewport clamping"

patterns-established:
  - "Lookup pattern: build Map<string, T> at module load from shared data arrays"
  - "Board game card layout: header → cost → art placeholder → text → type → keywords"

requirements-completed: [UI-02]

duration: 6min
completed: 2026-03-02
---

# Plan 04-02: Card Rendering System

**Card lookup utility and Card/CardTooltip components with board game styling and character-colored borders**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Card lookup resolves all card IDs (player cards, curses, statuses, dazes) to display data
- Card component renders with character-colored borders, selection highlight, playability dimming
- CardTooltip shows enlarged 2x card on hover with viewport clamping

## Task Commits

1. **Task 1: Card lookup utility** - `c09fbe8`
2. **Task 2: Card and CardTooltip components** - `c09fbe8`

All tasks committed atomically in `c09fbe8`.

## Files Created/Modified
- `packages/client/src/utils/cardLookup.ts` - Map-based card ID lookup from shared data
- `packages/client/src/components/combat/Card.tsx` - Board game card with selection/dimming
- `packages/client/src/components/combat/Card.module.css` - Card visual styling
- `packages/client/src/components/combat/CardTooltip.tsx` - Enlarged card hover tooltip
- `packages/client/src/components/combat/CardTooltip.module.css` - Tooltip positioning and styling

## Decisions Made
- Used `as unknown as PlayerCard[][]` cast for readonly array compatibility with shared exports
- Curse/status/daze cards mapped to PlayerCard shape with `cost: 'unplayable'` and `character: 'colorless'`

## Deviations from Plan

### Auto-fixed Issues

**1. Wrong export names from shared package**
- **Found during:** Task 1 (card lookup)
- **Issue:** Plan referenced `curseCards`/`statusCards`/`dazeCards` but actual exports are `curses`/`statuses`/`dazes`
- **Fix:** Changed import names to match actual shared package exports
- **Verification:** pnpm typecheck passes

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Import name correction. No scope creep.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Card and CardTooltip ready for use in HandZone (Plan 03)
- Card lookup available for any component needing card display data

---
*Phase: 04-core-client-ui*
*Completed: 2026-03-02*
