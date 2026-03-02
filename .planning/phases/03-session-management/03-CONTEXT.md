# Phase 3: Session Management - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can create and join game rooms via WebSocket, and the server maintains authoritative game state across connections and reconnections. Covers: room creation/joining, lobby management, character selection, game initialization (starter decks, HP, Act 1 map, boss, Neow's Blessings), reconnection, and action serialization. Does NOT cover: actual combat UI, map navigation, shop, events, or rest sites.

</domain>

<decisions>
## Implementation Decisions

### Room & Joining Flow
- Room codes are 4-letter words (e.g., FIRE, SLAM) — easy to say out loud, memorable
- 1-4 players flexible — host can start with any count, solo play possible through the same room system
- Clear error messages for full/started rooms — no spectating, no queuing for now (keep door open for future spectator mode)
- Claude's discretion on nickname validation — reasonable defaults that prevent abuse without being restrictive

### Lobby & Game Start
- Unique characters only — first pick locks it out for others, board game draft rules
- All players must select character before host can start — simple gate, no separate ready-up step
- Host-only controls for optional rules (lastStand, chooseYourRelic), lobby phase only — other players see settings but can't change them
- Neow's Blessings follow board game rules — Claude checks rulebook data and implements accordingly

### Reconnection Handling
- Room TTL: 30 minutes after all players disconnect — covers breaks and interruptions
- Rejoin via same room code + server-issued reconnection token (stored in localStorage) — prevents impersonation
- Auto-end turn after 30s timeout for disconnected players — game keeps moving, disconnected player blocks/defends by default
- Reconnecting player receives full current GameState + recent combat log entries so they can see what happened

### Action Serialization
- Simultaneous turns — all players play cards at the same time during PLAYER_ACTIONS phase, matches the board game
- FIFO ordering — first message received by server wins, network latency determines order (fair enough for casual)
- Real-time visibility — each PLAY_CARD broadcasts the result immediately, players see damage/status live
- Let processAction handle validation — pass everything to the engine, send ERROR for invalid plays, keep server thin

### Claude's Discretion
- Nickname validation specifics (length, character set)
- Neow's Blessings implementation details (based on rulebook)
- WebSocket connection management details (heartbeat, ping/pong intervals)
- Room cleanup and memory management beyond the 30-minute TTL
- Combat log entry count sent on reconnection

</decisions>

<specifics>
## Specific Ideas

- Room codes should feel thematic — 4-letter words that could relate to the game (FIRE, SLAM, IRON, etc.)
- The `processAction` API from Phase 2 is the single entry point for all game mutations — server should be a thin WebSocket layer that routes intents to this function
- LobbyState and ClientMessage/ServerMessage schemas already exist in shared package — extend rather than replace

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `processAction(state, action, rng)` in `packages/server/src/game/engine/index.ts` — the public game mutation API, server just needs to call this
- `ClientMessageSchema` / `ServerMessageSchema` in `packages/shared/src/schemas/messages.ts` — already defines PLAY_CARD, END_TURN, JOIN_LOBBY, SELECT_CHARACTER, START_GAME, SEND_CHAT
- `LobbyStateSchema` in `packages/shared/src/schemas/gameState.ts` — room code, players array, optional rules, started flag
- `GameStateSchema` / `CombatGameStateSchema` — full state schemas for broadcasting

### Established Patterns
- Zod schemas for all data structures — new room/session types should follow this
- Pure function game engine — server orchestrates but engine is stateless
- pnpm workspace with shared package — message types already cross-package
- `ws` library already in server deps — use raw WebSocket, not socket.io

### Integration Points
- `packages/server/src/index.ts` — currently a placeholder, this is where WebSocket server goes
- `processAction` is called when server receives PLAY_CARD or END_TURN
- Server broadcasts `STATE_UPDATE` with new GameState after each action
- Server broadcasts `LOBBY_UPDATE` for lobby changes (join, character select, rule toggle)

</code_context>

<deferred>
## Deferred Ideas

- Spectator mode for full/started rooms — future phase
- Ready-up flow (explicit ready button per player) — could add later if premature starts become an issue

</deferred>

---

*Phase: 03-session-management*
*Context gathered: 2026-03-01*
