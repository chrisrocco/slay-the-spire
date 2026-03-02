# Phase 5: Game Flow - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can play a complete Act 1 session — navigating the map, handling all seven room types, collecting rewards, and reaching the boss. Covers: map UI, room entry, event/campfire/treasure/merchant resolution, combat rewards, relic & potion trigger system, and potion management (pass/discard). Does NOT cover: Acts 2-3, card upgrading UI details beyond smith at campfire, or new combat mechanics.

</domain>

<decisions>
## Implementation Decisions

### Map Navigation & Room Entry
- Vertical scrollable map, bottom-to-top — matches the StS video game layout. Current position highlighted, scroll to see ahead
- Host decides which path to take — host clicks the next node, other players see the choice
- Map accessible anytime via toggle — a map button lets players view the map read-only during combat
- Icons per room type — sword for encounter, skull for elite, ? for event, fire for campfire, chest for treasure, $ for merchant, crown for boss

### Non-Combat Room Resolution
- Events: Claude decides based on the board game rules for how event choices work in co-op
- Campfire: Claude decides based on the board game rules for rest/smith in co-op
- Merchant: Claude decides based on the board game rules for merchant in co-op
- Treasure: Claude decides based on the board game rules for treasure relic assignment in co-op

### Combat Rewards Flow
- Reward picks: Claude decides based on the board game reward rules for co-op
- Card reward: Claude decides based on the board game's card reward rules
- Reward UI: Claude decides — the approach that lets players see all rewards and decide
- Potion limit: Claude decides — smoothest flow for potion management at 3-limit

### Relic & Potion Triggers
- Trigger visibility: Claude decides — appropriate trigger feedback for the dark fantasy UI
- Potion passing: Claude decides — interaction consistent with the card-play click-to-target from Phase 4
- Potion usage timing: Claude decides based on the board game rules
- Relic/potion display: Claude decides — fit into the existing Phase 4 combat layout naturally

### Claude's Discretion
- All non-combat room multiplayer resolution rules (follow the board game)
- Combat reward distribution (follow the board game)
- Potion management UX details
- Relic/potion trigger feedback style
- Map node styling and connection line rendering
- Boot meeple visual representation
- Transition animations between map and rooms

</decisions>

<specifics>
## Specific Ideas

- Map should feel like the Slay the Spire video game — vertical, branching paths, room type icons
- Host controls path decisions to keep the game moving — no voting delays
- Map toggle lets players plan ahead even during combat (read-only)
- All board game rules for co-op room resolution should be followed faithfully — the board game's co-op design is the source of truth for multiplayer interactions in events, campfire, merchant, treasure, and rewards

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapGenerator` in `packages/server/src/lobby/mapGenerator.ts` — already creates 15-floor maps with RoomType, MapNode, GameMap types and path connections
- Event data in `packages/shared/src/data/events.ts` — EventCard with id, name, text, choices (text + effect)
- Relic data in `packages/shared/src/data/relics.ts` — RelicCard with category (common/uncommon/rare/boss/special)
- Potion data in `packages/shared/src/data/potions.ts` — PotionCard with id, name, text
- `processAction` API — single entry point for combat mutations, already integrates with WebSocket
- Combat UI components from Phase 4 — CombatView, PlayerBoard, EnemyZone, SharedInfo, CombatEnd, CombatLog, TeamSidebar

### Established Patterns
- Click-to-select, click-to-target interaction (Phase 4 card playing)
- CSS modules with dark fantasy theme (Phase 4 styling)
- GameState broadcast via STATE_UPDATE WebSocket message
- SolidJS reactive stores for client state
- Zod schemas for all data types in shared package

### Integration Points
- `GameMap` needs to be included in GameState or a parallel state broadcast
- Map navigation requires new ClientMessage types (SELECT_NODE or similar)
- Room entry triggers different flows: combat → existing CombatView, event → new EventView, campfire → new CampfireView, etc.
- Reward screen is a new view that appears after CombatEnd
- Relic/potion triggers need to hook into the existing trigger system in `packages/server/src/game/engine/triggers.ts`
- Potion pass/discard needs new ClientMessage types

</code_context>

<deferred>
## Deferred Ideas

- Acts 2 and 3 — future phases
- Detailed card upgrade UI — polish phase
- Relic synergy tooltips (showing how relics interact) — future enhancement
- Map room preview on hover — could add later

</deferred>

---

*Phase: 05-game-flow*
*Context gathered: 2026-03-01*
