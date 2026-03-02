# Phase 4: Core Client UI - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can play a combat encounter end-to-end in the browser with real-time sync across all connected players. Covers: player board (hand, energy, HP, block, draw/discard counts), shared combat view (enemies, die result, turn phase), card interaction, End Turn flow, and win/loss screen. Does NOT cover: map navigation, shop, events, rest sites, deck building, or lobby UI (lobby was Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Board Layout & Zones
- Classic TCG layout — enemies at top, shared info in middle, player's hand/stats at bottom (Hearthstone/StS video game style)
- Other players shown as compact sidebar with stats (HP, energy, block) — no detail on their hands
- Desktop-first, mobile adaptation in a future phase
- Shared info (die result, turn phase) placed center of board between enemies and hand — always visible

### Card Presentation & Interaction
- Click card, then click target — select a card (highlights it), then click an enemy to target. Accessible and works for both mouse and touch
- Hover to enlarge in-place — hovering a card in hand shows enlarged version with full text right where the card is
- Board game card style — mimics the physical Slay the Spire board game card layout with title bar, effect text area, type icon. Faithful adaptation
- Unplayable cards are dimmed/grayed out — still visible but clearly unplayable

### Real-time Sync Feedback
- Brief transitions (200-300ms) — short CSS transitions for number changes, card movements, HP bars. Smooth without being slow
- Checkmark next to player name when they've ended their turn — simple green checkmark indicator
- Combat log as scrollable log panel — side panel or bottom area showing recent events, always visible
- Win/loss: simple overlay with result + Return to Lobby button — minimal but functional

### Styling Approach
- Vanilla CSS with CSS modules — scoped styles per component, no extra deps, Vite supports natively
- Dark fantasy visual tone — dark backgrounds, muted reds/purples, gothic feel matching the Slay the Spire aesthetic
- Character-colored card borders/headers — Ironclad=red, Silent=green, Defect=blue, Watcher=purple
- Claude's discretion on fonts — match the dark fantasy tone

### Claude's Discretion
- Font selection (should match dark fantasy tone)
- Exact transition/animation implementation details
- Combat log event formatting and entry count
- Card hover enlargement sizing and positioning
- Responsive breakpoints if any affordances are easy to add
- HP/energy bar visual style (numeric, bar, both)

</decisions>

<specifics>
## Specific Ideas

- Card style should faithfully mimic the physical Slay the Spire board game cards — title bar at top, art placeholder area, effect text below, type icon
- Character color coding follows the board game: Ironclad=red, Silent=green, Defect=blue, Watcher=purple
- Combat log should feel like watching a game unfold — "Player dealt 6 damage to Jaw Worm", "Vulnerable applied (2 tokens)"
- Win/loss overlay should have a clear "Return to Lobby" button — this reconnects to the lobby state

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@solid-primitives/websocket` — already installed, provides createWebSocket primitive for SolidJS
- `ClientMessageSchema` / `ServerMessageSchema` — message types for WebSocket communication
- `GameStateSchema` / `LobbyStateSchema` — full state types available from shared package
- `PlayerStateSchema` — player board data (hand, hp, energy, block, drawPile, discardPile, exhaustPile)
- Card data in `packages/shared/src/data/cards/` — full card definitions with effects text available

### Established Patterns
- Zod schemas in shared package — client can import types directly
- SolidJS reactive primitives — signals, createEffect, createResource
- Vite for bundling with CSS module support built-in
- pnpm workspace — client imports from @slay-online/shared

### Integration Points
- WebSocket connects to server from Phase 3 — sends ClientMessage, receives ServerMessage
- `STATE_UPDATE` message provides full GameState for rendering
- `LOBBY_UPDATE` for lobby screen (character select, etc.)
- `ERROR` messages for invalid plays (card costs too much, wrong target)
- Client needs to send: PLAY_CARD, END_TURN, USE_POTION, SEND_CHAT

</code_context>

<deferred>
## Deferred Ideas

- Mobile-responsive layout — future phase
- Full card animations (damage numbers floating, cards sliding to discard) — polish phase
- Stats summary on win/loss screen — future enhancement
- Tab/toggle to view other players' full boards — could add if compact sidebar feels insufficient

</deferred>

---

*Phase: 04-core-client-ui*
*Context gathered: 2026-03-01*
