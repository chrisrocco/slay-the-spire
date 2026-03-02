---
phase: 05-game-flow
verified: 2026-03-01T20:40:00Z
status: passed
score: 17/17 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 14/17
  gaps_closed:
    - "After combat ends, reward state is generated and players see rewards before returning to map"
    - "BOSS_REWARD phase is reached after defeating the boss"
    - "Players can use potions during combat via USE_POTION"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start a game, complete an encounter room's combat, observe the rewards screen"
    expected: "After the last enemy dies, gamePhase transitions to REWARDS and players see card/gold/relic reward choices before the map reappears"
    why_human: "Runtime browser rendering required to confirm the RewardView renders with real rewardState data"
  - test: "Navigate to the boss node, defeat the boss, observe the boss relic screen"
    expected: "After boss combat ends, gamePhase is BOSS_REWARD, BossRelicView shows 3-4 relic choices per player, selecting completes and returns to MAP"
    why_human: "Requires full game session reaching floor 15 boss; boss relic selection multi-step UI needs browser runtime"
  - test: "During combat, use a potion via PotionSlots UI"
    expected: "Potion is consumed, its effect fires (e.g. Fire Potion deals damage), potion slot empties"
    why_human: "Visual confirmation that potion effects are applied correctly requires browser runtime; only 9 of 29 potions have full effect implementations"
---

# Phase 5: Game Flow Verification Report

**Phase Goal:** Players can play a complete Act 1 session — navigating the map, handling all room types, collecting rewards, and reaching the boss
**Verified:** 2026-03-01T20:40:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure plan 05-08 fixed 3 wiring gaps

## Re-Verification Summary

Plan 05-08 executed 2 tasks targeting the 3 gaps identified in initial verification (2026-03-01T20:25:00Z):

- **Gap 1 closed:** `checkCombatEnd()` is now called after every combat action (play card, end turn, use potion). When `room.gameState.phase === 'COMBAT_END'`, it calls `generateRewards()` and sets `gamePhase` to `'REWARDS'` (or `'BOSS_REWARD'` for boss nodes). Gold is distributed to players immediately.
- **Gap 2 closed:** `checkCombatEnd()` detects boss nodes via `map.currentNodeId` lookup, calls both `generateRewards(state, 'boss', ...)` and `generateBossRelicChoices(state, ...)`, sets `rewardState.bossRelicChoices`, and transitions to `gamePhase: 'BOSS_REWARD'`. `handleRewardsComplete()` was fixed to set `gamePhase: 'MAP'` for all room types (previously set the wrong TurnPhase field for boss rooms).
- **Gap 3 closed:** `index.ts` USE_POTION case now calls `handleUsePotion(room, playerId, msg.potionId, msg.targetId)`. The NOT_IMPLEMENTED stub is gone entirely.
- **18 new integration tests** in `gapClosure.test.ts` verify all three paths. All 414 server tests pass. TypeScript compiles clean.

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                  | Status     | Evidence                                                                                      |
|----|----------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------|
| 1  | GameState includes gamePhase field with all 8 phases                                  | VERIFIED   | gameState.ts: GamePhaseSchema with MAP/EVENT/CAMPFIRE/TREASURE/MERCHANT/COMBAT/REWARDS/BOSS_REWARD |
| 2  | GameState includes map data so clients can render the map                             | VERIFIED   | gameState.ts: map?: GameMapSchema with nodes/bossNodeId/currentNodeId                          |
| 3  | All 12 new ClientMessage types are defined and validated                              | VERIFIED   | messages.ts: all 12 types in discriminated union; index.ts routes all 12                       |
| 4  | Relics with trigger phases fire at the correct combat phase                           | VERIFIED   | relicEffects.ts: RELIC_TRIGGERS registry; triggers.ts collectTriggers; 17 passing tests        |
| 5  | USE_POTION resolves potion effects (Fire Potion, Block Potion, etc.)                  | VERIFIED   | index.ts routes to handleUsePotion; gameHandlers.ts calls processAction; combat.ts usePotion() |
| 6  | Potion limit of 3 enforced (5 with Potion Belt)                                       | VERIFIED   | getPotionLimit checks in potionEffects.ts and rewardHandler.ts                                 |
| 7  | Game starts at MAP phase with map data in state                                       | VERIFIED   | gameInit.ts: sets gamePhase: 'MAP', currentFloor: 0, map: generateMap(rng)                    |
| 8  | Host navigates map by selecting connected nodes                                       | VERIFIED   | gameFlow.ts: handleSelectNode validates host, path connection, Wing Boots bypass               |
| 9  | All 7 room types enter correctly                                                       | VERIFIED   | roomHandlers/: all 7 handler files substantive; 50 passing tests                              |
| 10 | Event choices resolve effects (heal, gold, curse, etc.)                               | VERIFIED   | eventHandler.ts: resolveEventChoice with regex-based effect text parsing for all 12 Act 1 events |
| 11 | Campfire rest/smith/dig/lift/toke with relic modifiers                                | VERIFIED   | campfireHandler.ts: all 5 choices with Coffee Dripper/Fusion Hammer/Regal Pillow/Shovel/Girya/Peace Pipe |
| 12 | Treasure gives each player a relic instantly                                          | VERIFIED   | treasureHandler.ts: distributes relics, checks Matryoshka/Cursed Key, immediately transitions to MAP |
| 13 | Merchant buy/remove/leave with gold validation                                        | VERIFIED   | merchantHandler.ts: generateInventory, handleMerchantBuy, handleMerchantRemoveCard, handleMerchantLeave |
| 14 | Reward generation logic exists and works correctly                                    | VERIFIED   | rewardHandler.ts: generateRewards for encounter/elite/boss, all relic modifiers; 44 passing tests |
| 15 | After combat ends, rewards are presented to players before returning to map           | VERIFIED   | checkCombatEnd() in gameHandlers.ts: detects COMBAT_END TurnPhase, calls generateRewards, sets gamePhase='REWARDS'; 4 tests verify encounter path |
| 16 | BOSS_REWARD phase triggers boss relic selection after boss combat                     | VERIFIED   | checkCombatEnd() sets gamePhase='BOSS_REWARD' and populates rewardState.bossRelicChoices; 3 tests verify boss path |
| 17 | Players can use potions during combat via USE_POTION                                  | VERIFIED   | index.ts USE_POTION case (line 232-239) calls handleUsePotion; NOT_IMPLEMENTED stub removed; handleUsePotion in gameHandlers.ts calls processAction with USE_POTION action |

**Score:** 17/17 truths verified

---

## Required Artifacts

| Artifact                                                              | Expected                                           | Status   | Details                                                               |
|-----------------------------------------------------------------------|----------------------------------------------------|----------|-----------------------------------------------------------------------|
| `packages/shared/src/schemas/gameState.ts`                           | GamePhase enum, map/reward/event schemas           | VERIFIED | All 8 phases, all new schemas present                                  |
| `packages/shared/src/schemas/messages.ts`                            | 12 new ClientMessage types                         | VERIFIED | All 12 types present in discriminated union                            |
| `packages/server/src/game/engine/relicEffects.ts`                    | RELIC_TRIGGERS registry                            | VERIFIED | 30+ relics mapped to trigger definitions                               |
| `packages/server/src/game/engine/potionEffects.ts`                   | POTION_EFFECTS registry for 29 potions             | VERIFIED | 29 potions registered (9 fully resolved, 20 Unimplemented stubs)       |
| `packages/server/src/game/__tests__/triggers.test.ts`                | 17 trigger tests                                   | VERIFIED | 17 tests passing                                                       |
| `packages/server/src/game/__tests__/potions.test.ts`                 | 16 potion tests                                    | VERIFIED | 16 tests passing                                                       |
| `packages/server/src/game/gameFlow.ts`                               | handleSelectNode, handleRoomComplete, handleRewardsComplete | VERIFIED | All three functions substantive; handleRewardsComplete fixed to set gamePhase:'MAP' |
| `packages/server/src/game/roomHandlers/index.ts`                     | Barrel export for 7 room handlers                  | VERIFIED | Exports all 7 handlers                                                 |
| `packages/server/src/game/roomHandlers/encounterHandler.ts`          | enterEncounter                                     | VERIFIED | Draws enemies per floor, calls initCombat                              |
| `packages/server/src/game/roomHandlers/eliteHandler.ts`              | enterElite with Preserved Insect                   | VERIFIED | Present and substantive                                                |
| `packages/server/src/game/roomHandlers/bossHandler.ts`               | enterBoss with Pantograph                          | VERIFIED | Present and substantive                                                |
| `packages/server/src/game/roomHandlers/eventHandler.ts`              | enterEvent + resolveEventChoice                    | VERIFIED | Effect text parsing for all 12 events                                  |
| `packages/server/src/game/roomHandlers/campfireHandler.ts`           | All 5 campfire choices + relic modifiers           | VERIFIED | Present and substantive                                                |
| `packages/server/src/game/roomHandlers/treasureHandler.ts`           | enterTreasure instant resolution                   | VERIFIED | Present and substantive                                                |
| `packages/server/src/game/roomHandlers/merchantHandler.ts`           | Full merchant with buy/remove/leave                | VERIFIED | Present and substantive                                                |
| `packages/server/src/game/rewardHandler.ts`                          | generateRewards, selection handlers                | VERIFIED | Functions wired — imported and called in checkCombatEnd; 44 tests pass |
| `packages/server/src/game/potionManagement.ts`                       | passPotion, discardPotion                          | VERIFIED | Both functions substantive; 16 tests passing                           |
| `packages/server/src/game/gameHandlers.ts`                           | All 12 new handlers wired + checkCombatEnd + handleUsePotion | VERIFIED | All 14 handlers present; checkCombatEnd exported; handleUsePotion added |
| `packages/server/src/game/__tests__/gapClosure.test.ts`             | 18 integration tests for gap closure               | VERIFIED | 18 tests passing; covers encounter/elite/boss/USE_POTION/reward-complete paths |
| `packages/client/src/components/map/MapView.tsx`                     | 15-floor vertical map with node types              | VERIFIED | Present and substantive                                                |
| `packages/client/src/components/map/MapNode.tsx`                     | Node with icons and click handling                 | VERIFIED | Present with type icons, boot meeple, host-only click                  |
| `packages/client/src/components/rooms/EventView.tsx`                 | Event choices UI                                   | VERIFIED | Reads eventState, shows choices, sends EVENT_CHOICE                    |
| `packages/client/src/components/rooms/CampfireView.tsx`              | Campfire choices with relic gates                  | VERIFIED | Two-step flow for smith/toke; relic modifiers shown                    |
| `packages/client/src/components/rooms/TreasureView.tsx`              | Display relics gained                              | VERIFIED | Shows per-player relics                                                |
| `packages/client/src/components/rooms/MerchantView.tsx`              | Cards/relics/potions with prices + remove          | VERIFIED | Full buy/remove/leave UI                                               |
| `packages/client/src/components/rewards/RewardView.tsx`              | Card/potion/relic pick/skip UI                     | VERIFIED | Present and substantive; will now render (REWARDS phase wired)         |
| `packages/client/src/components/rewards/BossRelicView.tsx`           | Boss relic selection UI                            | VERIFIED | Present; BOSS_REWARD phase now wired so it will render                 |
| `packages/client/src/components/combat/PotionSlots.tsx`              | Potion use/pass/discard UI                         | VERIFIED | Present; USE_POTION now routes through combat engine                   |
| `packages/client/src/app.tsx`                                         | Routes all 8 gamePhase values to correct view      | VERIFIED | All 8 routes present with Show components                              |

---

## Key Link Verification

| From                                    | To                                        | Via                                              | Status  | Details                                                                              |
|-----------------------------------------|-------------------------------------------|--------------------------------------------------|---------|--------------------------------------------------------------------------------------|
| combat engine COMBAT_END                | REWARDS gamePhase + rewardState           | checkCombatEnd in gameHandlers.ts                | WIRED   | checkCombatEnd() checks phase==='COMBAT_END', calls generateRewards, sets gamePhase='REWARDS' |
| REWARDS phase completion                | MAP gamePhase transition                  | areAllRewardsChosen + handleRewardsComplete       | WIRED   | All 4 reward handlers (pick card/potion/relic/skip) call areAllRewardsChosen; if true, call handleRewardsComplete |
| boss combat COMBAT_END                  | BOSS_REWARD phase + bossRelicChoices      | checkCombatEnd boss branch                       | WIRED   | Boss node detected via currentNodeId lookup; generateBossRelicChoices called; gamePhase='BOSS_REWARD' set |
| BOSS_REWARD completion                  | MAP gamePhase                             | handleRewardsComplete                            | WIRED   | handleRewardsComplete (gameFlow.ts line 115) sets gamePhase:'MAP' for all room types including boss |
| USE_POTION WebSocket msg                | usePotion() in combat.ts                  | index.ts -> handleUsePotion -> processAction     | WIRED   | index.ts line 237 calls handleUsePotion; gameHandlers.ts creates USE_POTION action, calls processAction |
| MapView host click                      | SELECT_NODE -> gameFlow.handleSelectNode  | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged from initial verification)                  |
| EventView choice button                 | EVENT_CHOICE -> eventHandler              | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged)                                            |
| CampfireView choice                     | CAMPFIRE_CHOICE -> campfireHandler        | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged)                                            |
| MerchantView buy button                 | MERCHANT_BUY -> merchantHandler           | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged)                                            |
| RewardView pick buttons                 | REWARD_PICK_* -> rewardHandler            | gameHandlers.ts -> index.ts                      | WIRED   | All reward pick/skip handlers wired to rewardHandler functions + areAllRewardsChosen check |
| PotionSlots pass button                 | PASS_POTION -> passPotion                 | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged)                                            |
| PotionSlots discard button              | DISCARD_POTION -> discardPotion           | gameHandlers.ts -> index.ts                      | WIRED   | Full path exists and verified (unchanged)                                            |
| app.tsx gamePhase router                | Correct view component                    | Show when={gamePhase() === ...}                  | WIRED   | All 8 phases routed; REWARDS and BOSS_REWARD views will now render                  |

---

## Requirements Coverage

| Requirement | Source Plan       | Description                                                    | Status    | Evidence                                                                                           |
|-------------|-------------------|----------------------------------------------------------------|-----------|----------------------------------------------------------------------------------------------------|
| MAP-01      | 05-01, 05-06      | Visual Act 1 map with node types displayed                    | SATISFIED | MapView + MapNode render 15 floors with 7 room type icons                                          |
| MAP-02      | 05-01, 05-05      | Players choose path collectively after completing a room       | SATISFIED | SELECT_NODE routed; room completion -> rewards -> handleRewardsComplete -> MAP now fully wired      |
| MAP-03      | 05-01, 05-06      | Boot meeple tracks current position on map                     | SATISFIED | MapNode renders boot meeple below current node                                                     |
| ROOM-01     | 05-03             | Encounter rooms: draw enemy per player, resolve combat, gain rewards | SATISFIED | Combat enters correctly; checkCombatEnd generates REWARDS after COMBAT_END; 4 tests verify         |
| ROOM-02     | 05-03             | Elite rooms: single elite, all players gain rewards            | SATISFIED | Elite combat enters correctly; checkCombatEnd generates REWARDS for elite node type                |
| ROOM-03     | 05-03             | Boss room: boss combat + all players gain rewards              | SATISFIED | Boss combat enters; checkCombatEnd generates BOSS_REWARD with bossRelicChoices; 3 tests verify     |
| ROOM-04     | 05-03, 05-06      | Event rooms: draw event, each player chooses                  | SATISFIED | eventHandler + EventView fully wired end-to-end (unchanged)                                        |
| ROOM-05     | 05-03, 05-06      | Campfire: rest/smith choices per player                        | SATISFIED | campfireHandler + CampfireView fully wired end-to-end (unchanged)                                  |
| ROOM-06     | 05-03, 05-06      | Treasure: each player gains a relic                            | SATISFIED | treasureHandler instant resolution + TreasureView display (unchanged)                              |
| ROOM-07     | 05-03, 05-06      | Merchant: buy/relics/potions, remove card                      | SATISFIED | merchantHandler + MerchantView fully wired end-to-end (unchanged)                                  |
| RWRD-01     | 05-04             | Card reward: reveal 3, pick 1 or skip, Golden Ticket = rare    | SATISFIED | rewardHandler generates correctly; now called from checkCombatEnd after combat ends                |
| RWRD-02     | 05-04             | Upgraded card reward variant                                   | SATISFIED | generateRewards marks upgraded flag; now triggered in production via checkCombatEnd                |
| RWRD-03     | 05-04             | Potion reward with 3-potion limit enforcement                  | SATISFIED | generateRewards includes potion; now triggered via checkCombatEnd; limit checked in rewardHandler  |
| RWRD-04     | 05-04             | Relic and Boss Relic rewards with reveal rules                 | SATISFIED | Elite relic in generateRewards; boss relic choices via generateBossRelicChoices; both now wired     |
| RWRD-05     | 05-04             | Gold rewards tracked per player                                | SATISFIED | Gold from rewardState distributed to players immediately in checkCombatEnd                         |
| RWRD-06     | 05-01, 05-04, 05-07 | Players can view all combat rewards before making choices   | SATISFIED | RewardView + BossRelicView will now render because REWARDS/BOSS_REWARD phases are set              |
| ITEM-01     | 05-02             | Relics with triggered abilities                                | SATISFIED | RELIC_TRIGGERS registry + collectTriggers fully implemented; 17 tests pass (unchanged)             |
| ITEM-02     | 05-04             | Boss relics with selection rules                               | SATISFIED | generateBossRelicChoices now called from production code; BOSS_REWARD path wired                   |
| ITEM-03     | 05-02, 05-07      | Potions: single-use, 3 max, tradeable outside combat           | SATISFIED | USE_POTION now routes through processAction; potion consumed on use; limit enforced                |
| ITEM-04     | 05-02, 05-05, 05-07 | Potion management: pass, discard                            | SATISFIED | passPotion/discardPotion wired (unchanged); handleUsePotion now also wired                         |

---

## Anti-Patterns Found

| File                                                  | Line     | Pattern                                                     | Severity | Impact                                                                          |
|-------------------------------------------------------|----------|-------------------------------------------------------------|----------|---------------------------------------------------------------------------------|
| `packages/server/src/game/engine/potionEffects.ts`    | multiple | 20 of 29 potions are `Unimplemented` stubs                  | WARNING  | Most complex potions silently no-op rather than producing effects; USE_POTION wiring works but many potions have no effect |
| `packages/server/src/game/engine/effects/resolve.ts`  | 136-261  | 6 effect kinds log `[TODO]` to combatLog instead of resolving | WARNING | Discard, Exhaust, Scry, Upgrade, Conditional, PerX effects inactive; these are known Phase 5 scope boundaries |

No blockers found. The NOT_IMPLEMENTED stub in index.ts (line 237) has been removed. No new stubs introduced.

---

## Human Verification Required

### 1. Reward Screen After Combat

**Test:** Start a two-player game, navigate to an encounter node as host, play combat until all enemies are defeated.
**Expected:** The view transitions to RewardView showing card choices, gold amount, and any relic. Each player picks or skips their card. After all players have chosen, the map reappears.
**Why human:** Requires a full running game session; visual confirmation that RewardView renders with real rewardState data from checkCombatEnd; multiplayer coordination of all-players-done check.

### 2. Boss Relic Selection After Boss Combat

**Test:** Navigate to floor 15 boss node, complete boss combat. Observe the transition.
**Expected:** After boss is defeated, BossRelicView appears showing 3-4 boss relic choices per player. After all players select, gamePhase returns to MAP (Act 1 complete).
**Why human:** Requires full Act 1 session reaching floor 15; boss relic selection multi-step UI needs browser runtime to confirm correct rendering.

### 3. Potion Use During Combat

**Test:** Obtain a Fire Potion (via merchant or reward), enter an encounter, use the Fire Potion on an enemy via PotionSlots UI.
**Expected:** Potion is consumed, Fire Potion deals 20 damage to target enemy, potion slot empties. No NOT_IMPLEMENTED error appears.
**Why human:** Visual confirmation that potion effects apply and UI updates correctly; 20 of 29 potions are Unimplemented stubs so specific potion choice matters for testing.

---

## Gaps Summary

No gaps remain. All three wiring failures identified in initial verification have been closed by plan 05-08:

1. **Combat-end -> Rewards (ROOM-01, ROOM-02, RWRD-01 through RWRD-06):** `checkCombatEnd()` now called after every combat action. When `phase === 'COMBAT_END'`, it generates rewards and transitions to `gamePhase: 'REWARDS'`.

2. **Boss relic selection (ROOM-03, RWRD-04, ITEM-02):** `checkCombatEnd()` detects boss nodes, generates `bossRelicChoices`, and sets `gamePhase: 'BOSS_REWARD'`. `handleRewardsComplete()` fixed to return `gamePhase: 'MAP'` for both boss and non-boss rooms.

3. **Potion use (ITEM-03, ITEM-04):** `index.ts` USE_POTION case calls `handleUsePotion()`. The NOT_IMPLEMENTED stub is gone.

**What is fully working:** All 7 room types enter from the map. Encounter/elite/boss combat ends generate rewards. Events, campfires, treasure, and merchants work end-to-end. All reward pick/skip handlers call `areAllRewardsChosen` and trigger `handleRewardsComplete`. Potion use routes through the combat engine. All client views are routed by `app.tsx`. TypeScript compiles clean. 414 server tests pass (including 18 new integration tests).

**Known non-blocking limitations (Phase 5 scope boundaries):** 20 of 29 potions are `Unimplemented` stubs that silently no-op; 6 effect kinds in `resolve.ts` log `[TODO]` instead of executing (Discard, Exhaust, Scry, Upgrade, Conditional, PerX). These are documented warnings, not blockers for Act 1 completion.

---

_Verified: 2026-03-01T20:40:00Z_
_Verifier: Claude (gsd-verifier)_
