# Slay the Spire: Board Game Online

## What This Is

A web-based multiplayer implementation of the Slay the Spire cooperative board game (not the video game). 1-4 players can create or join lobbies and play through the board game's Act 1 together in real-time, with simultaneous player turns and board-game-faithful rules. Built for friends who own the board game but can't meet in person.

## Core Value

Faithful implementation of the board game rules — players can play a complete Act 1 session online with the same experience as sitting at a table together.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Lobby system: create game, share code, join game (1-4 players)
- [ ] Solo mode (1 player with Loaded Die relic)
- [ ] All 4 characters: Ironclad, Silent, Defect, Watcher with full starter decks
- [ ] Character selection during lobby
- [ ] Neow's Blessing: draw and resolve at game start
- [ ] Act 1 map: random map selection, token placement, path navigation
- [ ] Combat system: simultaneous player turns with real-time card play and resolution
- [ ] Energy, Block, and HP tracking per player
- [ ] Card mechanics: play, discard, exhaust, retain, ethereal
- [ ] Die roll system: shared die result per round affecting enemies and relics
- [ ] Enemy AI: single action, die action, and cube action patterns
- [ ] Enemy targeting: row-based for regular enemies, all-rows for bosses
- [ ] Summon system: enemies that summon additional enemies
- [ ] Status effects: Vulnerable, Weak, Strength, Poison (with board game limits/caps)
- [ ] Multi-hit resolution with correct Vulnerable/Weak interaction
- [ ] Character-specific mechanics: Orbs (Defect), Stances (Watcher), Shivs (Silent), Exhaust synergies (Ironclad)
- [ ] All Act 1 encounter, elite, and boss enemy cards
- [ ] All Act 1 player cards (85+ per character) with upgrade sides
- [ ] Room types: Encounter, Elite, Boss, Event, Campfire, Treasure, Merchant
- [ ] Reward system: card rewards, gold, potions, relics, boss relics
- [ ] Deck management: remove, upgrade, transform
- [ ] Merchant shop with pricing rules
- [ ] End of combat: cleanup, reset, row switching
- [ ] Item system: relics, boss relics, potions (3 potion limit)
- [ ] Triggered abilities: start of turn, end of turn, start of combat, end of combat, on death, die relics
- [ ] Player communication: text chat during gameplay
- [ ] Optional rule: Last Stand (dead players in boss fights don't end game immediately)
- [ ] Optional rule: Choose Your Relic (reveal relics equal to player count at Elite/Treasure)
- [ ] Card data extracted from reference sheet images into structured game data
- [ ] Board game visual aesthetic: tiles, cards, tokens

### Out of Scope

- Acts 2, 3, and 4 — v1 is Act 1 only
- Ascension system — meta-progression deferred
- Unlock system — all Act 1 content available from start
- Daily Climb / Custom Run — modifier modes deferred
- Sequential Turns optional rule — simultaneous turns only for v1
- Game state persistence / save & resume — in-memory for v1
- Matchmaking — lobby-based only
- Mobile app — web only
- Voice chat — use external tools (Discord, etc.)
- Video game art/assets — board game aesthetic, not video game aesthetic

## Context

- Source material: Official Slay the Spire board game rulebook (24 pages, PDF available in repo)
- Card data source: Reference sheet images (.webp) to be provided by user for data extraction
- The board game simplifies some video game mechanics (e.g., Orbs don't rotate, can evoke any orb)
- Token limits from board game: Strength max 8, Poison max 30, Block max 20, Vulnerable max 3, Weak max 3, Shivs max 5, Miracles max 5, Energy max 6
- Simultaneous player turns are the default — all players play and resolve cards freely, then signal "end turn" individually
- Enemy actions resolve after all players end turn, top row to bottom, left to right, bosses last
- The "Golden Rule": card text overrides rulebook rules when they conflict

## Constraints

- **Frontend**: SolidJS
- **Backend**: Node.js + TypeScript
- **Real-time**: WebSockets for multiplayer communication
- **State**: In-memory game state for v1 (no database required)
- **Players**: Exactly 1-4 players per game session
- **Rules fidelity**: Must match board game rules, not video game rules

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Board game rules, not video game | This is the board game adaptation — different mechanics | — Pending |
| SolidJS + Node/TS/WebSockets | User preference for reactive frontend + type-safe backend | — Pending |
| In-memory state for v1 | Simplicity; persistence deferred to future version | — Pending |
| Act 1 only for v1 | Manageable scope; complete playable experience | — Pending |
| All 4 characters in v1 | Full character roster from the start | — Pending |
| Lobby-based multiplayer | Friends playing together, no matchmaking needed | — Pending |
| Board game visual aesthetic | Match the physical board game feel, not the video game | — Pending |

---
*Last updated: 2026-03-01 after initialization*
