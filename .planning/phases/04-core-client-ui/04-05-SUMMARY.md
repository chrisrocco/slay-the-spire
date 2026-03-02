---
phase: 04-core-client-ui
plan: 05
subsystem: ui
tags: [solidjs, css-grid, combat-layout, combat-log, chat, team-sidebar]

requires:
  - phase: 04-core-client-ui
    provides: PlayerBoard, EnemyZone, SharedInfo, CombatEnd, game store, WebSocket service
provides:
  - CombatLog component with auto-scrolling event display
  - ChatPanel component with message input and display
  - TeamSidebar showing all players' compact stats
  - CombatView CSS Grid layout composing all combat components
  - Full card play targeting flow (select card → click enemy → PLAY_CARD sent)
  - App.tsx wired to render CombatView in combat phase
affects: [05-game-flow, 06-polish]

tech-stack:
  added: []
  patterns: [css-grid-combat-layout, card-targeting-flow, auto-scroll-effect]

key-files:
  created:
    - packages/client/src/components/combat/CombatLog.tsx
    - packages/client/src/components/combat/CombatLog.module.css
    - packages/client/src/components/chat/ChatPanel.tsx
    - packages/client/src/components/chat/ChatPanel.module.css
    - packages/client/src/components/combat/TeamSidebar.tsx
    - packages/client/src/components/combat/TeamSidebar.module.css
    - packages/client/src/components/combat/CombatView.tsx
    - packages/client/src/components/combat/CombatView.module.css
  modified:
    - packages/client/src/app.tsx

key-decisions:
  - "CSS Grid layout: enemies/shared/board rows + sidebar column + log/chat footer"
  - "Non-targeted cards (Skills, Powers) auto-play on selection; Attacks wait for enemy click"
  - "CombatLog shows last 50 entries with auto-scroll to bottom"
  - "Return to Lobby implemented as window.location.reload() for simplicity"

patterns-established:
  - "Card targeting flow: CombatView manages selectedCard signal, passes to EnemyZone for targeting"
  - "Auto-scroll pattern: createEffect watching array length, scrollTop = scrollHeight"
  - "CSS Grid named areas for combat layout composition"

requirements-completed: [UI-09, UI-10]

duration: 7min
completed: 2026-03-02
---

# Plan 04-05: CombatView Layout, CombatLog, ChatPanel, TeamSidebar

**Full combat layout with CSS Grid, combat log, chat panel, team sidebar, and end-to-end card targeting**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- CombatView assembles all components in CSS Grid layout (enemies top, shared center, board bottom, sidebar right, log/chat footer)
- Card targeting works end-to-end: select Attack card → click enemy → PLAY_CARD with targetIds sent to server
- Non-targeted cards (Skills, Powers) auto-play immediately on selection
- CombatLog displays game events with auto-scroll
- ChatPanel handles message input/display with Enter-to-send
- TeamSidebar shows all players' HP bars, energy, block, end-turn status

## Task Commits

1. **Task 1: CombatLog, ChatPanel, TeamSidebar** - `db35197`
2. **Task 2: CombatView layout and App update** - `db35197`

All tasks committed atomically in `db35197`.

## Files Created/Modified
- `packages/client/src/components/combat/CombatLog.tsx` - Scrollable combat event log
- `packages/client/src/components/chat/ChatPanel.tsx` - Chat with input and auto-scroll
- `packages/client/src/components/combat/TeamSidebar.tsx` - Compact player stat cards
- `packages/client/src/components/combat/CombatView.tsx` - CSS Grid combat layout with targeting
- `packages/client/src/components/combat/CombatView.module.css` - Grid area definitions
- `packages/client/src/app.tsx` - Updated to render CombatView in combat phase

## Decisions Made
- CSS Grid with named template areas for clear layout structure
- TeamSidebar shows all players including self for team awareness consistency

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Complete combat UI ready for end-to-end gameplay
- Build output: 135 modules, 250KB JS, 19KB CSS
- All 9 Phase 4 requirements covered across 5 plans

---
*Phase: 04-core-client-ui*
*Completed: 2026-03-02*
