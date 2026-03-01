# Requirements: Slay the Spire Board Game Online

**Defined:** 2026-03-01
**Core Value:** Faithful implementation of the board game rules — players can play a complete Act 1 session online with the same experience as sitting at a table together.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Lobby & Connection

- [ ] **LBBY-01**: Player can create a game room and receive a shareable room code
- [ ] **LBBY-02**: Player can join a game room by entering a room code (nickname only, no account)
- [ ] **LBBY-03**: Player can select a character in the lobby (Ironclad, Silent, Defect, Watcher)
- [ ] **LBBY-04**: Host can toggle optional rules (Last Stand, Choose Your Relic) in lobby
- [ ] **LBBY-05**: Game starts when host initiates and 1-4 players have selected characters
- [ ] **LBBY-06**: Player can reconnect to a running game after disconnect using room code

### Game Setup

- [ ] **SETUP-01**: Each player receives starter deck, starting HP, and energy track per character rules
- [ ] **SETUP-02**: Act 1 map is randomly generated with correct token placement (dark/light)
- [ ] **SETUP-03**: Act 1 boss is randomly selected and placed face-down
- [ ] **SETUP-04**: Each player draws and resolves a Neow's Blessing card
- [ ] **SETUP-05**: Solo player receives Loaded Die relic
- [ ] **SETUP-06**: 1st Encounter is set up and combat begins

### Combat - Player Turn

- [ ] **CMBT-01**: At start of turn, each player's energy resets to 3 and block resets to 0
- [ ] **CMBT-02**: Each player draws 5 cards at start of turn
- [ ] **CMBT-03**: Die is rolled once per round with result visible to all players
- [ ] **CMBT-04**: Start-of-turn abilities trigger in player-chosen order (start of turn, start of combat, die relics)
- [ ] **CMBT-05**: Players can simultaneously play cards, use potions, and activate abilities
- [ ] **CMBT-06**: Card play resolves: pay energy, choose targets, resolve effects top-to-bottom, cleanup
- [ ] **CMBT-07**: Each player individually signals "End Turn" when done
- [ ] **CMBT-08**: End-of-turn abilities trigger after all players signal ready
- [ ] **CMBT-09**: Players discard remaining hand at end of turn

### Combat - Enemy Turn

- [ ] **CMBT-10**: Enemies lose all block at start of enemy turn
- [ ] **CMBT-11**: Enemies act top row to bottom, left to right, bosses last
- [ ] **CMBT-12**: Single action, die action, and cube action enemy patterns resolve correctly
- [ ] **CMBT-13**: Cube actions track position and cycle correctly (gray actions not repeated)
- [ ] **CMBT-14**: Dead enemies flip over and lose tokens; dead player ends game immediately (unless Last Stand)

### Combat - Mechanics

- [ ] **MECH-01**: Vulnerable doubles hit damage, max 3 tokens, removed after attack
- [ ] **MECH-02**: Weak reduces hit damage by 1, max 3 tokens, removed after attack
- [ ] **MECH-03**: Strength adds +1 damage per hit per token, max 8
- [ ] **MECH-04**: Poison deals 1 HP loss per token at end of turn, ignores block, max 30 combined
- [ ] **MECH-05**: Block prevents damage up to its value, max 20 for players
- [ ] **MECH-06**: Multi-hit attacks resolve correctly with Vulnerable/Weak interactions
- [ ] **MECH-07**: Weak vs Vulnerable cancel each other out per rules
- [ ] **MECH-08**: Exhaust removes card from deck for the combat
- [ ] **MECH-09**: Ethereal cards exhaust at end of turn if still in hand
- [ ] **MECH-10**: Retain prevents card from being discarded at end of turn
- [ ] **MECH-11**: Scry lets player look at top X cards and optionally discard

### Characters

- [ ] **CHAR-01**: Ironclad: Strength synergies, exhaust synergies, higher starting HP
- [ ] **CHAR-02**: Silent: Poison mechanic (max 30), Shiv tokens (max 5, deal 1 damage each)
- [ ] **CHAR-03**: Defect: Orb system (Channel, Evoke, end-of-turn effects), Lightning/Frost/Dark orbs
- [ ] **CHAR-04**: Watcher: Stances (Neutral/Calm/Wrath), Miracles (max 5), Scry

### Cards & Data

- [ ] **CARD-01**: All Act 1 player cards per character (85+ each) with both normal and upgraded sides
- [ ] **CARD-02**: Card data extracted from reference sheet images into structured game data
- [ ] **CARD-03**: All Act 1 encounter, elite, and boss enemy cards with actions and HP
- [ ] **CARD-04**: All Act 1 event cards with choice resolution
- [ ] **CARD-05**: Curse, Status, and Daze card pools

### Map & Rooms

- [ ] **MAP-01**: Visual Act 1 map with node types displayed (encounter, elite, boss, event, campfire, treasure, merchant)
- [ ] **MAP-02**: Players choose path collectively after completing a room
- [ ] **MAP-03**: Boot meeple tracks current position on map

### Room Types

- [ ] **ROOM-01**: Encounter rooms: draw enemy per player, resolve combat, gain rewards from row
- [ ] **ROOM-02**: Elite rooms: single elite with possible summons, all players gain rewards
- [ ] **ROOM-03**: Boss room: boss treated as in all rows, all players gain rewards
- [ ] **ROOM-04**: Event rooms: draw event, each player chooses from bracketed options
- [ ] **ROOM-05**: Campfire: each player chooses Rest (heal 3 HP) or Smith (upgrade a card)
- [ ] **ROOM-06**: Treasure: each player gains a relic
- [ ] **ROOM-07**: Merchant: buy cards/relics/potions, card remove (once per player per merchant)

### Rewards

- [ ] **RWRD-01**: Card reward: reveal 3, pick 1 or skip, Golden Ticket reveals rare
- [ ] **RWRD-02**: Upgraded card reward variant
- [ ] **RWRD-03**: Potion reward with 3-potion limit enforcement
- [ ] **RWRD-04**: Relic and Boss Relic rewards with reveal rules
- [ ] **RWRD-05**: Gold rewards tracked per player
- [ ] **RWRD-06**: Players can view all combat rewards before making final choices

### Items

- [ ] **ITEM-01**: Relics with triggered abilities (start of turn, die result, end of combat, etc.)
- [ ] **ITEM-02**: Boss relics with selection rules (1 per player + 1, or 3 for solo)
- [ ] **ITEM-03**: Potions: single-use, 3 max, tradeable outside combat
- [ ] **ITEM-04**: Potion management: skip, pass to teammate, discard/use to make room

### UI & Communication

- [ ] **UI-01**: Visual player boards showing hand, energy, HP, block, discard/draw pile counts
- [ ] **UI-02**: Card tooltip showing full card text on hover/tap
- [ ] **UI-03**: Character-specific UI: Defect orb slots, Watcher stance, Silent shiv/poison, Ironclad strength
- [ ] **UI-04**: Shared view of die result, enemy intents, boss HP, map state
- [ ] **UI-05**: Turn/phase indicators visible to all players
- [ ] **UI-06**: End Turn button with visual indicator of who has/hasn't ended turn
- [ ] **UI-07**: Card hand visible to teammates (toggle)
- [ ] **UI-08**: Animated card effects: damage pop-ups, status flashes, card play transitions
- [ ] **UI-09**: In-game text chat panel
- [ ] **UI-10**: Action log / event feed showing card plays, damage, status effects
- [ ] **UI-11**: Win/lose screen with outcome and return-to-lobby option
- [ ] **UI-12**: Board game visual aesthetic (tiles, cards, tokens feel)
- [ ] **UI-13**: Waiting/loading states during server resolution

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Meta-Progression

- **META-01**: Ascension system with progressive difficulty modifiers
- **META-02**: Unlock system for character-specific cards
- **META-03**: Achievement tracking

### Extended Content

- **CONT-01**: Acts 2, 3, and 4 with full enemy/event/boss decks
- **CONT-02**: Daily Climb mode with random modifiers
- **CONT-03**: Custom Run mode

### Platform

- **PLAT-01**: Persistent accounts with win/loss tracking
- **PLAT-02**: Game state persistence / save & resume
- **PLAT-03**: Spectator mode
- **PLAT-04**: Mobile-optimized layout
- **PLAT-05**: Keyboard shortcuts for power users

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Video game rules/mechanics | This is the board game adaptation — different rules |
| Video game art/assets | Board game aesthetic, not video game aesthetic |
| Matchmaking / public lobbies | Friends-only co-op, not random strangers |
| Asynchronous play | Real-time sessions only; requires different architecture |
| Voice chat | Use Discord/phone; WebRTC is a separate engineering domain |
| Undo/take-back moves | Breaks simultaneous play; use confirmation dialogs instead |
| Sequential Turns optional rule | Simultaneous turns only for v1 |
| Mobile-first touch UX | Desktop/laptop web browser is primary target |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 0
- Unmapped: 60 ⚠️

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
