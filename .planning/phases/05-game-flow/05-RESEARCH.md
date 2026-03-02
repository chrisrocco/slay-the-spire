# Phase 5: Game Flow - Research

**Researched:** 2026-03-01
**Status:** Complete

## Executive Summary

Phase 5 transforms the game from a single-combat loop into a full Act 1 session. The codebase already has map generation (`mapGenerator.ts`), event/relic/potion data, a trigger infrastructure stub, and a `USE_POTION` action stub. The major work is: (1) a game-level state machine above combat, (2) map navigation UI, (3) seven room type handlers, (4) combat rewards flow, (5) relic/potion trigger registration, and (6) potion management.

## Architecture Analysis

### Current State Flow
- `Room` holds `gameState: CombatGameState | null` and `map: GameMap | null`
- `AppPhase` is `'connecting' | 'lobby' | 'combat'` — no map/event/reward phases
- `GameState` schema only covers combat fields (round, dieResult, activeEnemies, phase)
- `initializeGame()` immediately starts combat — no map navigation step
- `broadcastState()` sends `STATE_UPDATE` with `GameState` only

### What Needs to Change
1. **Game-level state machine**: A new `GamePhase` that sits above `TurnPhase`. Values: `MAP`, `EVENT`, `CAMPFIRE`, `TREASURE`, `MERCHANT`, `COMBAT`, `REWARDS`, `BOSS_REWARD`. The `GameState` schema must include this phase, plus map data, current room info, and reward state.
2. **Map in GameState**: Currently `map` is on `Room` (server-only). Clients need it broadcast in state to render the map UI.
3. **New ClientMessage types**: `SELECT_NODE`, `EVENT_CHOICE`, `CAMPFIRE_CHOICE`, `MERCHANT_BUY`, `MERCHANT_REMOVE_CARD`, `REWARD_PICK_CARD`, `REWARD_PICK_POTION`, `REWARD_SKIP`, `PASS_POTION`, `DISCARD_POTION`.
4. **New server handlers**: One per room type, plus reward distribution logic.
5. **Trigger system**: `collectTriggers()` currently returns `[]` — needs relic/potion effect registration.

## Detailed Technical Findings

### Map Generation (Already Done)
- `mapGenerator.ts` exports `generateMap()`, `MapNode`, `GameMap`, `RoomType`
- 15 floors (0-14): floor 0 = encounters, floor 6 = treasure, floor 9/13 = campfire, floor 14 = boss
- 3-4 nodes per floor with branching connections
- `currentNodeId` field exists but is always `null` initially
- `Room.map` stores the map server-side

### Event System
- 12 events in `events.ts` with `EventCard { id, name, text, choices: { text, effect }[] }`
- Effects are raw text strings (not typed CardEffect) — need text-to-effect parsing or a manual mapping
- Events like "Mushrooms" can trigger combat ("Fight Fungi Beasts")
- Events with die rolls ("Dead Adventurer", "Scrap Ooze") need RNG integration
- Co-op rule: each player independently chooses from bracketed options

### Relic System
- 72 relics in `relics.ts` with `RelicCard { id, name, text, category }`
- Categories: special (4), common (29), uncommon (28), rare (22), boss (20)
- Effects are raw text — STATE.md notes "Relics/potions store raw text in Phase 1 — typed effects deferred to Phase 5"
- Trigger timing categories from relic text analysis:
  - **Start of combat**: anchor, bag_of_marbles, bag_of_preparation, blood_vial, lantern, oddly_smooth_stone, thread_and_needle, vajra
  - **End of combat**: burning_blood, meat_on_the_bone
  - **Start of turn**: art_of_war, happy_flower, horn_cleat, calipers, mercury_hourglass, orichalcum, pen_nib, nunchaku, ink_bottle
  - **On card play**: kunai, letter_opener, ornamental_fan, shuriken, mummified_hand, dead_branch
  - **On damage taken**: bronze_scales, centennial_puzzle, fossilized_helix, torii, the_boot
  - **On rest**: ancient_tea_set, dream_catcher, eternal_feather, regal_pillow, girya, peace_pipe, shovel, coffee_dripper
  - **On potion use**: toy_ornithopter, sacred_bark
  - **On death**: lizard_tail
  - **Passive/on-acquire**: all others (stat bonuses, cost modifiers, etc.)
- Boss relics: 1 per player + 1 extra (or 3 for solo); some replace starter relics

### Potion System
- 29 potions in `potions.ts` with `PotionCard { id, name, text }`
- Effects are raw text — same as relics, need typed effects
- 3-potion limit (default, +2 with Potion Belt relic)
- `USE_POTION` action stub exists in combat reducer
- Potion interactions: use in combat, pass outside combat, discard to make room
- `fairy_in_a_bottle` triggers automatically on death
- `smoke_bomb` escapes non-boss combat

### Reward System (New)
- **Encounter rewards**: 1 per player from the enemy's row
- **Elite rewards**: all players gain rewards
- **Boss rewards**: boss relic selection (1 per player + 1, or 3 for solo)
- **Card reward**: reveal 3 cards, pick 1 or skip. Golden Ticket reveals a rare. Question Card relic adds +1 card.
- **Upgraded card reward**: same but cards are upgraded
- **Potion reward**: random potion, subject to 3-limit
- **Relic reward**: from rarity pool (common > uncommon > rare progression)
- **Gold reward**: tracked per player
- Each player views ALL rewards before making final choices (RWRD-06)

### Merchant System (New)
- Buy cards, relics, potions at gold prices
- Card remove: once per player per merchant visit
- Smiling Mask relic: card remove costs 0
- The Courier relic: merchant restocks after card buy, card remove costs less

### Campfire System (New)
- Each player independently: Rest (heal 3 HP) or Smith (upgrade a card)
- Regal Pillow: +3 HP on rest
- Coffee Dripper: cannot rest
- Fusion Hammer: cannot smith
- Peace Pipe: can remove cards at rest sites
- Shovel: can dig for relics at rest sites
- Girya: can gain strength instead (up to 3 uses)

## Integration Strategy

### GameState Schema Extension
The `GameStateSchema` needs to grow from combat-only to game-flow-aware:
```
GameState += {
  gamePhase: 'MAP' | 'EVENT' | 'CAMPFIRE' | 'TREASURE' | 'MERCHANT' | 'COMBAT' | 'REWARDS' | 'BOSS_REWARD',
  map: GameMap,
  currentFloor: number,
  currentEvent?: EventCard,
  rewardState?: RewardState,
  merchantState?: MerchantState,
}
```

### Room Type Handler Pattern
Each room type needs a server-side handler that:
1. Sets `gamePhase` to the appropriate value
2. Initializes room-specific state (event choices, merchant inventory, etc.)
3. Processes player choices via new ClientMessage types
4. Transitions back to `MAP` phase when complete

### Trigger Registration Pattern
The `collectTriggers()` function should:
1. Iterate player relics
2. Look up each relic's trigger definition from a registry
3. Return matching `Trigger[]` for the current phase
4. Same pattern for active power cards (already typed via `PowerEffect`)

### Relic/Potion Effect Typing
Need a mapping from relic/potion IDs to typed `CardEffect[]`:
```typescript
const relicEffects: Record<string, { trigger: TriggerPhase; effects: CardEffect[] }> = {
  'anchor': { trigger: 'START_OF_COMBAT', effects: [{ kind: 'GainBlock', amount: 10, target: 'self' }] },
  // ...
};
```

## Requirement Coverage Plan

| Req ID | Implementation Area |
|--------|-------------------|
| MAP-01 | Map UI component, GameState map field, node type icons |
| MAP-02 | SELECT_NODE message, host-only path selection |
| MAP-03 | Boot meeple visual on current node |
| ROOM-01 | Encounter handler: draw enemy per player, start combat, rewards from row |
| ROOM-02 | Elite handler: single elite + summons, all players get rewards |
| ROOM-03 | Boss handler: boss in all rows, all players get rewards |
| ROOM-04 | Event handler: draw event, each player picks choice |
| ROOM-05 | Campfire handler: rest/smith per player |
| ROOM-06 | Treasure handler: each player gains relic |
| ROOM-07 | Merchant handler: buy/sell/remove UI |
| RWRD-01 | Card reward: reveal 3, pick 1 or skip, Golden Ticket = rare |
| RWRD-02 | Upgraded card reward variant |
| RWRD-03 | Potion reward with 3-limit |
| RWRD-04 | Relic + boss relic rewards |
| RWRD-05 | Gold tracked per player |
| RWRD-06 | View all rewards before choosing |
| ITEM-01 | Relic trigger effect registry + collectTriggers implementation |
| ITEM-02 | Boss relic selection (1 per player + 1, or 3 solo) |
| ITEM-03 | Potion: single-use, 3 max, tradeable outside combat |
| ITEM-04 | Potion management: skip, pass, discard/use |

## Risk Assessment

1. **GameState schema change is breaking** — all clients and server code reference current GameState. Must extend, not replace.
2. **Effect typing for 72 relics + 29 potions** — large surface area, but most effects map directly to existing CardEffect types.
3. **Event effect parsing** — event effects are text strings with complex conditions (die rolls, gold costs). Need a small interpreter or manual mapping.
4. **Co-op room resolution rules** — user context says "Claude decides based on the board game rules." Must be faithful to board game co-op rules.
5. **Merchant restocking and pricing** — no price data exists yet; needs to be defined.

## Recommended Plan Decomposition

1. **GameState & Messages** — Extend schemas, add game phases, add map to state, add new message types
2. **Map UI & Navigation** — Map component, boot meeple, host node selection, map toggle during combat
3. **Room Type Handlers (Server)** — Event, campfire, treasure, merchant resolution logic
4. **Combat Rewards** — Reward state, card/potion/relic/gold distribution, reward UI
5. **Relic & Potion Effects** — Type all relic/potion effects, implement collectTriggers, implement USE_POTION
6. **Potion Management** — Pass, discard, use flow; 3-limit enforcement; fairy_in_a_bottle auto-trigger
7. **Room Type UIs (Client)** — EventView, CampfireView, TreasureView, MerchantView, RewardView components

## RESEARCH COMPLETE

---

*Phase: 05-game-flow*
*Research completed: 2026-03-01*
