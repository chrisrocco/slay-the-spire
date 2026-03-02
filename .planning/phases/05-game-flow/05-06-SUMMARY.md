---
phase: 05-game-flow
plan: "06"
subsystem: client-ui
tags: [map-view, room-views, event, campfire, treasure, merchant, solid-js, css-modules]
dependency_graph:
  requires: [05-01, 05-03]
  provides: [MapView, MapNode, EventView, CampfireView, TreasureView, MerchantView]
  affects:
    - packages/client/src/stores/gameStore.ts
    - packages/client/src/app.tsx
tech_stack:
  added: []
  patterns: [SolidJS createMemo/createSignal, CSS Modules, per-player state derived from GameState, dark fantasy theme]
key_files:
  created:
    - packages/client/src/components/map/MapNode.tsx
    - packages/client/src/components/map/MapNode.module.css
    - packages/client/src/components/map/MapView.tsx
    - packages/client/src/components/map/MapView.module.css
    - packages/client/src/components/rooms/EventView.tsx
    - packages/client/src/components/rooms/EventView.module.css
    - packages/client/src/components/rooms/CampfireView.tsx
    - packages/client/src/components/rooms/CampfireView.module.css
    - packages/client/src/components/rooms/TreasureView.tsx
    - packages/client/src/components/rooms/TreasureView.module.css
    - packages/client/src/components/rooms/MerchantView.tsx
    - packages/client/src/components/rooms/MerchantView.module.css
  modified:
    - packages/client/src/stores/gameStore.ts
    - packages/client/src/app.tsx
    - packages/client/src/components/rewards/BossRelicView.tsx
decisions:
  - AppPhase 'combat' renamed to 'game' since the game now encompasses MAP/EVENT/CAMPFIRE/TREASURE/MERCHANT/COMBAT/REWARDS phases, not just combat
  - MapView uses createMemo for floor grouping and available node computation, auto-scrolls to current node via createEffect
  - TreasureView is display-only since treasure resolves instantly on server (consistent with Plan 03 decision)
  - MerchantView derives deck cards from drawPile+discardPile+hand using Set for deduplication
  - CampfireView handles smith/toke as two-step flows (option select -> card select) via local signal
metrics:
  duration_minutes: 12
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_modified: 14
---

# Phase 5 Plan 06: Map UI and Non-Combat Room Views Summary

MapView with vertical 15-floor layout and boot meeple indicator, plus all four non-combat room views (Event, Campfire, Treasure, Merchant) wired to send correct ClientMessages.

## What Was Built

### GameStore Updates (packages/client/src/stores/gameStore.ts)

- Changed `AppPhase` from `'connecting' | 'lobby' | 'combat'` to `'connecting' | 'lobby' | 'game'` — the game now has multiple phases beyond just combat
- Added `mapVisible: boolean` to `AppState` (default `false`) for the map toggle overlay
- Added `toggleMap()` method to `AppStore`
- Updated `STATE_UPDATE` handler to set phase to `'game'` instead of `'combat'`
- Updated `resetToLobby()` to reset `mapVisible` to `false`

### MapNode (packages/client/src/components/map/MapNode.tsx)

- Props: `node`, `isCurrent`, `isAvailable`, `isVisited`, `isHost`, `onClick`
- Room type icons via unicode: encounter (swords), elite (skull), event (?), campfire (flame), treasure (package), merchant (money bag), boss (crown)
- CSS state classes: `.current` (gold glow border), `.available` (pulsing green), `.visited` (dimmed), `.unavailable` (grayed out)
- Boot meeple (boot emoji) rendered below the current node
- Only host can click available nodes; non-host cursor stays default
- Hover scale transform for clickable nodes

### MapView (packages/client/src/components/map/MapView.tsx)

- Reads `state.game.map` from game store
- Groups nodes by floor using `createMemo`, renders floors in descending order (boss at top, start at bottom)
- Computes available next nodes from current node's connections via `createMemo`
- Auto-scrolls to current node on change via `createEffect`
- `readOnly` prop for overlay mode during combat (no click handlers, pass `readOnly={true}`)
- `onClose` prop renders a close button when provided
- Supports overlay mode via `.overlay` CSS class (fixed position, right side)
- Connection count hint shown in footer

### EventView (packages/client/src/components/rooms/EventView.tsx)

- Looks up event data from `eventMap` using `eventState.eventId`
- Shows event name, flavor text, and choice buttons
- Per-player status indicators with checkmarks and chosen option labels
- Choice buttons switch to waiting state after selection, showing chosen option and waiting count
- Sends `EVENT_CHOICE` with `choiceIndex`

### CampfireView (packages/client/src/components/rooms/CampfireView.tsx)

- Shows Rest, Smith options always
- Rest blocked by Coffee Dripper relic; Smith blocked by Fusion Hammer
- Rest heal amount: base 3 HP + 3 if Regal Pillow is held
- Extra options: Dig (requires Shovel), Lift (requires Girya), Toke (requires Peace Pipe)
- Smith/Toke are two-step: select option -> show deck card list -> select card
- Sends `CAMPFIRE_CHOICE` with `choice` and optional `cardId` for smith/toke
- Per-player status showing who has chosen and their selected option

### TreasureView (packages/client/src/components/rooms/TreasureView.tsx)

- Display-only since treasure resolves instantly on server
- Shows each player's most recently acquired relic (last element of `player.relics`)
- Relic name, category, and text displayed with gold accent border

### MerchantView (packages/client/src/components/rooms/MerchantView.tsx)

- Three sections: Cards for Sale, Relics for Sale, Potions for Sale
- Each item shows name, type, text, price; Buy button disabled if insufficient gold
- Player's gold displayed prominently with gold border
- Card Removal section with cost display; grayed out if already removed this visit
- Card removal shows two-step flow: click Remove -> select from deck list
- Leave button sends `MERCHANT_LEAVE`
- Sends `MERCHANT_BUY` with `itemType` (card/relic/potion) and `itemId`
- Sends `MERCHANT_REMOVE_CARD` with `cardId`

## Verification Results

- `pnpm typecheck`: All 3 packages compile without errors
- TypeScript strict mode satisfied across all new components
- MapView and room views all read from `GameState` fields defined in Plan 01
- All ClientMessage types from Plan 01 schemas are correctly used

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] BossRelicView.tsx had invalid `typeof` in type position**
- **Found during:** Task 1 verification (pnpm typecheck)
- **Issue:** `typeof game().rewardState` inside a type assertion — TypeScript TS1005/TS1109 errors since `game()` is a function call, not a valid `typeof` operand in type position
- **Fix:** Replaced `typeof game().rewardState & { bossRelicChoices?: string[] }` with simple `{ bossRelicChoices?: string[] }` type assertion
- **Files modified:** packages/client/src/components/rewards/BossRelicView.tsx
- **Commit:** 52a32e6

**2. [Rule 1 - Bug] app.tsx used deprecated `'combat'` phase string**
- **Found during:** Task 1 verification (typecheck error TS2367: types 'AppPhase' and '"combat"' have no overlap)
- **Issue:** After changing AppPhase enum to rename 'combat' to 'game', app.tsx still had `phase === 'combat'` in Show condition
- **Fix:** Updated to `phase === 'game'`
- **Files modified:** packages/client/src/app.tsx
- **Commit:** 52a32e6

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 52a32e6 | feat(05-06): MapView and MapNode components with game phase update |
| 2 | 366aed8 | feat(05-06): non-combat room views (Event, Campfire, Treasure, Merchant) |

## Self-Check: PASSED

All 13 files created/modified confirmed present. Both commits (52a32e6, 366aed8) verified in git log. TypeScript compiles cleanly with 0 errors across all 3 packages.
