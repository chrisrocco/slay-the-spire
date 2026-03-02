---
phase: 05-game-flow
plan: "07"
subsystem: client-ui
tags: [reward-ui, potion-slots, app-routing, game-phase, combat, boss-relic, solid-js, css-modules]
dependency_graph:
  requires:
    - phase: 05-game-flow
      plan: "01"
      provides: GamePhase schema, RewardState schema, all ClientMessage types
    - phase: 05-game-flow
      plan: "04"
      provides: reward generation and selection logic
    - phase: 05-game-flow
      plan: "05"
      provides: server routing for all 12 new messages
    - phase: 05-game-flow
      plan: "06"
      provides: MapView, room views (Event, Campfire, Treasure, Merchant), gameStore updates
  provides:
    - RewardView: gold display, card/potion/relic pick/skip UI with player status
    - BossRelicView: boss relic selection with taken/available states
    - PotionSlots: use/pass/discard potion management in PlayerBoard
    - app.tsx: full gamePhase-aware router for all 8 game phases
    - Map toggle: floating button + read-only overlay during COMBAT
  affects:
    - packages/client/src/app.tsx (full game phase routing)
    - packages/client/src/components/combat/PlayerBoard.tsx (PotionSlots integration)
tech_stack:
  added: []
  patterns:
    - SolidJS Show/For for reactive conditional rendering
    - CSS Modules with dark fantasy theming consistent with Phase 4 components
    - Game-phase routing via gameState.gamePhase discriminator
    - PotionSlots expandable action menu pattern (click to expand, action buttons appear)
key_files:
  created:
    - packages/client/src/components/rewards/RewardView.tsx
    - packages/client/src/components/rewards/RewardView.module.css
    - packages/client/src/components/rewards/BossRelicView.tsx
    - packages/client/src/components/rewards/BossRelicView.module.css
    - packages/client/src/components/combat/PotionSlots.tsx
    - packages/client/src/components/combat/PotionSlots.module.css
  modified:
    - packages/client/src/app.tsx
    - packages/client/src/app.module.css
    - packages/client/src/components/combat/PlayerBoard.tsx
    - packages/client/src/components/combat/PlayerBoard.module.css
decisions:
  - App.tsx uses gameState.gamePhase (not AppPhase) to route between in-game views — AppPhase distinguishes connecting/lobby/game, gamePhase distinguishes game room types
  - PotionSlots show Use button only during COMBAT phase; Pass button only during MAP phase (matching server-side validation)
  - Map toggle button is fixed-position (top-right) during COMBAT, renders MapView as full-screen overlay with readOnly=true
  - BossRelicView uses REWARD_PICK_CARD with boss relic ID to communicate selection (REWARD_PICK_RELIC has no payload)
  - RewardView shows per-player card rewards by player index in cardRewards array
metrics:
  duration_minutes: 8
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_modified: 10
---

# Phase 5 Plan 07: Reward UI, Potion Management, and App Routing Summary

**Full client-side routing for all 8 game phases; RewardView and BossRelicView for post-combat reward selection; PotionSlots integrated into PlayerBoard with use/pass/discard actions; floating map toggle accessible during COMBAT phase.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-02T04:06:53Z
- **Completed:** 2026-03-02T04:15:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

### Task 1: RewardView and BossRelicView components

**RewardView.tsx** (`packages/client/src/components/rewards/`):
- Gold reward displayed with coin icon and "+{amount} Gold (auto-collected)" text
- Card reward section: shows per-player card rewards (indexed by player position in array), uses existing Card component
- Skip button to skip card reward (sends REWARD_SKIP)
- Potion reward: shows name/text, Take button (disabled if at limit with tooltip), Skip button
- Relic reward: shows name/text, Take button
- After picking, shows confirmation message ("Card added to deck", "Potion taken!", "Relic taken!")
- Player choice status at bottom: checkmark (chosen) or hourglass (waiting) per player
- "Waiting for other players..." animated text until all players chose

**BossRelicView.tsx** (`packages/client/src/components/rewards/`):
- Shows (playerCount + 1) boss relic cards in a horizontal flex row
- Each card shows: relic name, category, text, "Replaces: [starter relic name]" for replacement relics
- Taken relics grayed out (opacity + grayscale filter)
- Player's own pick highlighted with green border
- Player status list below showing who picked what
- Uses REWARD_PICK_CARD with bossRelicId as the communication mechanism (REWARD_PICK_RELIC has no payload)

### Task 2: PotionSlots and app.tsx routing

**PotionSlots.tsx** (`packages/client/src/components/combat/`):
- 3 slots (5 with Potion Belt relic) rendered via dynamic `slots()` array
- Empty slots shown as dashed outline
- Filled slots show potion icon + name, click to expand action menu
- Action menu (appears above slot): tooltip with name/text, Use (combat only), Pass (map phase only, shows player list), Discard (always)
- Integrated into `PlayerBoard.tsx` between stats and end-turn button
- Sends USE_POTION, PASS_POTION, DISCARD_POTION messages

**App.tsx routing** (full gamePhase-aware):
```
gamePhase === 'MAP'         -> <MapView />
gamePhase === 'COMBAT'      -> <CombatView /> + map toggle button
gamePhase === 'EVENT'       -> <EventView />
gamePhase === 'CAMPFIRE'    -> <CampfireView />
gamePhase === 'TREASURE'    -> <TreasureView />
gamePhase === 'MERCHANT'    -> <MerchantView />
gamePhase === 'REWARDS'     -> <RewardView />
gamePhase === 'BOSS_REWARD' -> <BossRelicView />
```

**Map toggle during COMBAT**:
- Floating button (fixed top-right, z-index 200) labeled "Map"
- Calls `store.toggleMap()` to flip `mapVisible` boolean
- When visible: full-screen dark overlay (z-index 150) with `<MapView readOnly onClose={...} />`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (via plan 06) | 366aed8 | feat(05-06): non-combat room views — includes RewardView, BossRelicView |
| Task 2 (via plan 06 docs) | aff53ed | docs(05-06): includes PotionSlots, app.tsx routing, PlayerBoard integration |

Note: All files were committed as part of plan 06 state update commits. Plan 07 work verified clean — TypeScript compiles, all 8 game phases routed.

## Deviations from Plan

### [Rule 3 - Blocking] Plan 06 files already committed — nothing to create for Task 1

- **Found during:** Task 1 verification
- **Issue:** RewardView.tsx, BossRelicView.tsx, and all room views were already committed as part of plan 06 (commits 52a32e6, 366aed8, aff53ed)
- **Fix:** Verified existing files met plan 07 requirements; confirmed TypeScript compiles cleanly
- **Impact:** No rework needed; plan 07 work was captured in plan 06's final commit

### [Rule 2 - Missing] MerchantView, TreasureView CSS missing from plan 06 commit

- **Found during:** Task 2 (file inventory)
- **Issue:** TreasureView.module.css and MerchantView.tsx/.module.css were not in git before plan 06's second commit
- **Fix:** Files were already created and committed in plan 06's second feat commit (366aed8) before plan 07 execution
- **Impact:** None

## Self-Check: PASSED

- FOUND: packages/client/src/components/rewards/RewardView.tsx
- FOUND: packages/client/src/components/rewards/RewardView.module.css
- FOUND: packages/client/src/components/rewards/BossRelicView.tsx
- FOUND: packages/client/src/components/rewards/BossRelicView.module.css
- FOUND: packages/client/src/components/combat/PotionSlots.tsx
- FOUND: packages/client/src/components/combat/PotionSlots.module.css
- FOUND: packages/client/src/app.tsx (updated with all 8 game phase routes)
- FOUND commit aff53ed (PotionSlots + app.tsx routing)
- TypeScript: CLEAN (all packages compile)
