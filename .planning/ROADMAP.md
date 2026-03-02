# Roadmap: Slay the Spire Board Game Online

## Overview

Six phases build from the ground up: structured game data first, then pure game engine logic, then networked session management, then the client rendering layer, then the full Act 1 game flow, and finally polish and differentiating features. Each phase delivers a verifiable capability that unblocks the next. The ordering reflects a hard dependency chain — data before logic, logic before network, network before UI — that prevents the critical architectural mistakes identified during research.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Monorepo scaffold, shared types, and all Act 1 game data extracted into structured form
- [ ] **Phase 2: Game Engine** - Pure TypeScript combat logic, enemy AI, status effects, character mechanics — fully tested without networking
- [x] **Phase 3: Session Management** - Lobby, WebSocket server, reconnection, serialized action queue — all multiplayer infrastructure (completed 2026-03-02)
- [x] **Phase 4: Core Client UI** - SolidJS store, WebSocket client, and the combat-facing UI components needed to play a fight (completed 2026-03-02)
- [x] **Phase 5: Game Flow** - Map, all room types, reward phase, merchant, and the full Act 1 loop from Neow's Blessing to boss (completed 2026-03-02)
- [ ] **Phase 6: Polish** - Character-specific UI, animations, board game aesthetic, and remaining differentiating features

## Phase Details

### Phase 1: Foundation
**Goal**: All Act 1 game data exists in structured, typed form and the monorepo is ready for development
**Depends on**: Nothing (first phase)
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05
**Success Criteria** (what must be TRUE):
  1. All 85+ player cards per character (normal and upgraded sides) are available as typed data structures queryable by card ID
  2. All Act 1 enemy cards (encounter, elite, boss) with HP and action patterns are in structured data
  3. All Act 1 event cards, curse/status/daze card pools, and relic/potion definitions are in structured data
  4. TypeScript builds without errors; pnpm workspace runs client and server dev processes simultaneously
  5. Shared Zod schemas define the WebSocket message protocol and GameState types importable by both client and server
**Plans**: 7 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold, TypeScript config, Zod v4 schemas, and stub data files
- [x] 01-02-PLAN.md — Ironclad player card data extraction (85 cards × 2 sides)
- [x] 01-03-PLAN.md — Silent player card data extraction (87 cards × 2 sides)
- [x] 01-04-PLAN.md — Defect player card data extraction (85 cards × 2 sides)
- [x] 01-05-PLAN.md — Watcher player card data extraction (85 cards × 2 sides)
- [x] 01-06-PLAN.md — Act 1 enemy data (encounters, elites, bosses, summons)
- [x] 01-07-PLAN.md — Event, curse/status/daze, relic, potion data + schema tests + full build verification

### Phase 2: Game Engine
**Goal**: The complete board game combat rules are implemented as pure, tested TypeScript functions
**Depends on**: Phase 1
**Requirements**: CMBT-01, CMBT-02, CMBT-03, CMBT-04, CMBT-05, CMBT-06, CMBT-07, CMBT-08, CMBT-09, CMBT-10, CMBT-11, CMBT-12, CMBT-13, CMBT-14, MECH-01, MECH-02, MECH-03, MECH-04, MECH-05, MECH-06, MECH-07, MECH-08, MECH-09, MECH-10, MECH-11, CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Success Criteria** (what must be TRUE):
  1. A vitest suite can simulate a full combat turn — player draws, plays cards, signals end turn, enemies resolve — and produce the correct resulting GameState
  2. All status effects (Vulnerable, Weak, Strength, Poison, Block) enforce board game caps and interact correctly in multi-hit scenarios
  3. All four character-specific mechanics work correctly: Ironclad exhaust synergies, Silent Shivs and Poison, Defect Orb channel/evoke, Watcher Stances and Miracles
  4. Enemy AI resolves single, die, and cube action patterns in correct row order (top to bottom, bosses last)
  5. Triggered abilities (start of turn, end of turn, on death, die relics) fire in correct phase order without loops
**Plans**: 9 plans

Plans:
- [x] 02-01-PLAN.md — Combat state schemas, vitest config, test helpers
- [x] 02-02-PLAN.md — CardEffect type system and effect registry scaffold
- [x] 02-03-PLAN.md — Damage formula, status effects (Vulnerable, Weak, Strength, Block, multi-hit)
- [x] 02-04-PLAN.md — Deck management (draw, discard, shuffle, exhaust, ethereal, retain, scry)
- [x] 02-05-PLAN.md — Player turn lifecycle (start, play card, end turn, triggers, poison)
- [x] 02-06-PLAN.md — Enemy turn resolution (action ordering, single/die/cube patterns, death checking)
- [x] 02-07-PLAN.md — Effect handlers implementation and full Act 1 card effect registry
- [x] 02-08-PLAN.md — Character mechanics (Ironclad, Silent, Defect, Watcher)
- [x] 02-09-PLAN.md — Combat integration: processAction API and full turn simulation tests

### Phase 3: Session Management
**Goal**: Players can create and join game rooms, and the server maintains authoritative game state across connections and reconnections
**Depends on**: Phase 2
**Requirements**: LBBY-01, LBBY-02, LBBY-03, LBBY-04, LBBY-05, LBBY-06, SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, SETUP-06
**Success Criteria** (what must be TRUE):
  1. A host creates a room, receives a code, shares it, and up to 3 others join by entering the code with a nickname — no account needed
  2. Each player selects a character; host can toggle optional rules; host starts the game when ready
  3. Game initializes correctly: each player receives their starter deck and HP, Act 1 map generates, boss is placed face-down, Neow's Blessings are drawn
  4. A player who disconnects and reconnects with the same room code rejoins their slot and receives the full current game state
  5. All player intent messages (PLAY_CARD, END_TURN) for a room are serialized — no race conditions with simultaneous play
**Plans**: TBD

### Phase 4: Core Client UI
**Goal**: Players can play a combat encounter end-to-end in the browser with real-time sync across all connected players
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-04, UI-05, UI-06, UI-09, UI-10, UI-11, UI-13
**Success Criteria** (what must be TRUE):
  1. Each player sees their own board (hand, energy track, HP, block, discard/draw counts) updating in real time as cards are played
  2. The shared view shows die result, all enemy intents, boss HP, and turn/phase indicators visible to every player simultaneously
  3. Players can read full card text on hover/tap for any card in hand, discard, or on the field
  4. Each player can click End Turn; all players can see who has and hasn't ended their turn
  5. A win or loss screen appears when the combat resolves, with a return-to-lobby option
**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — App shell, WebSocket service, game store, CSS theme variables
- [x] 04-02-PLAN.md — Card lookup utility, Card component, CardTooltip
- [x] 04-03-PLAN.md — HandZone, PlayerStats, EndTurnButton, PlayerBoard
- [x] 04-04-PLAN.md — EnemyCard, EnemyZone, SharedInfo, CombatEnd
- [x] 04-05-PLAN.md — CombatLog, ChatPanel, TeamSidebar, CombatView, App integration

### Phase 5: Game Flow
**Goal**: Players can play a complete Act 1 session — navigating the map, handling all room types, collecting rewards, and reaching the boss
**Depends on**: Phase 4
**Requirements**: MAP-01, MAP-02, MAP-03, ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, ROOM-06, ROOM-07, RWRD-01, RWRD-02, RWRD-03, RWRD-04, RWRD-05, RWRD-06, ITEM-01, ITEM-02, ITEM-03, ITEM-04
**Success Criteria** (what must be TRUE):
  1. After completing a room, players see the Act 1 map with available paths, move the boot meeple, and enter the next room
  2. All seven room types resolve correctly: encounter combat, elite combat with summons, boss fight, event card choices, campfire rest/smith, treasure relic selection, merchant buying and card removal
  3. After combat, each player can view all available rewards before making final choices: card picks, potions (with 3-limit enforcement), relics, and gold
  4. Relics and potions with triggered abilities fire at the correct moment (start of turn, die result, end of combat, on death)
  5. Potion management works: players can skip, pass to a teammate outside combat, and discard/use to make room for a new one
**Plans**: 9 plans

Plans:
- [x] 05-01-PLAN.md — Game flow state schema, map generation, room type routing
- [x] 05-02-PLAN.md — Map UI, node selection, floor grouping
- [x] 05-03-PLAN.md — Room type handlers (event, campfire, treasure, merchant)
- [x] 05-04-PLAN.md — Reward generation and reward phase logic
- [x] 05-05-PLAN.md — Relic and potion triggered effects
- [x] 05-06-PLAN.md — Room type UI views (event, campfire, treasure, merchant)
- [x] 05-07-PLAN.md — Reward UI, boss relic selection, potion management UI
- [x] 05-08-PLAN.md — Gap closure: combat-end rewards, USE_POTION, boss reward path
- [ ] 05-09-PLAN.md — Gap closure: fix WebSocket connection deadlock (app stuck on loading screen)

### Phase 6: Polish
**Goal**: The game looks and feels like the board game, with character-specific visual regions and smooth interactions
**Depends on**: Phase 5
**Requirements**: UI-03, UI-07, UI-08, UI-12
**Success Criteria** (what must be TRUE):
  1. Each character has a visible UI region specific to their mechanics: Defect shows orb slots, Watcher shows current stance, Silent shows shiv count and poison total, Ironclad shows strength tokens
  2. A player can toggle visibility of a teammate's hand to coordinate plays
  3. Card plays, damage events, and status token changes have visual feedback (damage pop-ups, status flashes, card animations)
  4. The overall aesthetic reads as a board game: tile textures, card frames, and token visuals match the physical board game feel rather than the video game
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 7/7 | Complete | 2026-03-01 |
| 2. Game Engine | 9/9 | Complete | 2026-03-01 |
| 3. Session Management | 0/TBD | Complete    | 2026-03-02 |
| 4. Core Client UI | 5/5 | Complete | 2026-03-02 |
| 5. Game Flow | 8/9 | In Progress | - |
| 6. Polish | 0/TBD | Not started | - |
