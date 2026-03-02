---
phase: 04-core-client-ui
plan: 04
subsystem: ui
tags: [solidjs, enemy-display, hp-bar, status-tokens, die-result, combat-end]

requires:
  - phase: 04-core-client-ui
    provides: Game store, WebSocket service, CSS theme variables
  - phase: 01-foundation
    provides: EnemyCard type, enemy data arrays
provides:
  - Enemy lookup utility (getEnemy, getEnemyOrPlaceholder)
  - EnemyCard component with HP bar, block, status tokens, targeting
  - EnemyZone rendering all active enemies
  - SharedInfo showing die result, turn phase, round, player statuses
  - CombatEnd win/loss overlay with Return to Lobby
affects: [04-core-client-ui]

tech-stack:
  added: []
  patterns: [enemy-combat-state-type-assertion, combat-end-detection]

key-files:
  created:
    - packages/client/src/utils/enemyLookup.ts
    - packages/client/src/components/combat/EnemyCard.tsx
    - packages/client/src/components/combat/EnemyCard.module.css
    - packages/client/src/components/combat/EnemyZone.tsx
    - packages/client/src/components/combat/EnemyZone.module.css
    - packages/client/src/components/combat/SharedInfo.tsx
    - packages/client/src/components/combat/SharedInfo.module.css
    - packages/client/src/components/combat/CombatEnd.tsx
    - packages/client/src/components/combat/CombatEnd.module.css
  modified: []

key-decisions:
  - "enemyCombatStates accessed via type assertion since server CombatGameState extends base GameState"
  - "Win/loss detected by checking if any player has HP > 0 at COMBAT_END"
  - "Dead enemies shown grayed out (opacity 0.3) rather than hidden"
  - "All alive enemies targetable when any card is selected (server validates legality)"

patterns-established:
  - "Type assertion pattern: (gameState as Record<string, unknown>)['enemyCombatStates'] for server-extended state"
  - "EnemyCombatInfo interface defined client-side to type the enemy combat state"

requirements-completed: [UI-04, UI-11]

duration: 7min
completed: 2026-03-02
---

# Plan 04-04: Enemy Zone, Shared Info, Combat End

**Enemy display with HP bars and status tokens, die result display, and win/loss overlay**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- EnemyCard renders enemies with HP bar, block shield, status token indicators, targeting highlight
- EnemyZone renders all active enemies with dead ones grayed out
- SharedInfo shows die result prominently, turn phase label, round counter, player end-turn checkmarks
- CombatEnd overlay displays victory/defeat with Return to Lobby button

## Task Commits

1. **Task 1: Enemy lookup and EnemyCard** - `f0d9319`
2. **Task 2: EnemyZone, SharedInfo, CombatEnd** - `f0d9319`

All tasks committed atomically in `f0d9319`.

## Files Created/Modified
- `packages/client/src/utils/enemyLookup.ts` - Map-based enemy ID lookup
- `packages/client/src/components/combat/EnemyCard.tsx` - Enemy display with HP, tokens, targeting
- `packages/client/src/components/combat/EnemyZone.tsx` - Enemy area layout
- `packages/client/src/components/combat/SharedInfo.tsx` - Die result, phase, round, player statuses
- `packages/client/src/components/combat/CombatEnd.tsx` - Win/loss overlay

## Decisions Made
- EnemyCombatInfo interface defined client-side rather than importing from server package
- Status tokens shown as colored text badges (Vulnerable=orange, Weak=green, Strength=red, Poison=purple)

## Deviations from Plan

### Auto-fixed Issues

**1. Unicode escape in JSX template**
- **Found during:** Task 2 (SharedInfo)
- **Issue:** `\u{1F6E1}` directly in JSX causes TS1351 parse error
- **Fix:** Wrapped in string expression `{'\u{1F6E1}'}`
- **Verification:** pnpm typecheck passes

**2. exactOptionalPropertyTypes compatibility**
- **Found during:** Task 1 (EnemyCard)
- **Issue:** Optional props without `| undefined` fail with exactOptionalPropertyTypes
- **Fix:** Added `| undefined` to optional prop types
- **Verification:** pnpm typecheck passes

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** TypeScript strictness fixes. No scope creep.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- EnemyZone and SharedInfo ready for CombatView integration (Plan 05)
- CombatEnd overlay ready with onReturnToLobby callback

---
*Phase: 04-core-client-ui*
*Completed: 2026-03-02*
