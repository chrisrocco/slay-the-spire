# Phase 3: Session Management - Research

**Researched:** 2026-03-01
**Domain:** WebSocket multiplayer session management
**Confidence:** HIGH

## Summary

Phase 3 builds the multiplayer infrastructure: a WebSocket server that manages game rooms (create, join, reconnect), lobby state (character selection, optional rules, game start), game initialization (starter decks, HP, map generation, boss selection, Neow's Blessings), and serialized action processing. The project already has `ws` as a dependency, Zod schemas for all message types (`ClientMessageSchema`, `ServerMessageSchema`), lobby state (`LobbyStateSchema`), game state (`GameStateSchema`), and a fully functional `processAction` API from Phase 2.

The core architecture is a thin WebSocket server that routes client intents to the game engine. Room state is in-memory (1-4 players per room, state under 200KB). The `processAction` reducer from Phase 2 handles all combat mutations; the server layer adds room management, lobby lifecycle, reconnection via tokens, and FIFO message serialization.

**Primary recommendation:** Build a RoomManager class that holds room state (lobby + game), with the WebSocket server delegating all game logic to existing engine functions. Keep the server layer thin — it maps WebSocket messages to engine calls and broadcasts results.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Room codes are 4-letter words (e.g., FIRE, SLAM) — easy to say out loud, memorable
- 1-4 players flexible — host can start with any count, solo play possible through the same room system
- Clear error messages for full/started rooms — no spectating, no queuing
- Unique characters only — first pick locks it out for others, board game draft rules
- All players must select character before host can start — simple gate, no separate ready-up step
- Host-only controls for optional rules (lastStand, chooseYourRelic), lobby phase only
- Room TTL: 30 minutes after all players disconnect
- Rejoin via same room code + server-issued reconnection token (stored in localStorage)
- Auto-end turn after 30s timeout for disconnected players
- Reconnecting player receives full current GameState + recent combat log entries
- Simultaneous turns — all players play cards at the same time during PLAYER_ACTIONS phase
- FIFO ordering — first message received by server wins
- Real-time visibility — each PLAY_CARD broadcasts the result immediately
- Let processAction handle validation — pass everything to the engine, send ERROR for invalid plays

### Claude's Discretion
- Nickname validation specifics (length, character set)
- Neow's Blessings implementation details (based on rulebook)
- WebSocket connection management details (heartbeat, ping/pong intervals)
- Room cleanup and memory management beyond the 30-minute TTL
- Combat log entry count sent on reconnection

### Deferred Ideas (OUT OF SCOPE)
- Spectator mode for full/started rooms
- Ready-up flow (explicit ready button per player)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LBBY-01 | Player can create a game room and receive a shareable room code | RoomManager.createRoom() generates 4-letter word codes from curated list |
| LBBY-02 | Player can join a game room by entering a room code (nickname only, no account) | RoomManager.joinRoom() validates code, adds player with nickname |
| LBBY-03 | Player can select a character in the lobby | Lobby character selection with unique-pick enforcement |
| LBBY-04 | Host can toggle optional rules in lobby | Host-only message handling for rule toggles |
| LBBY-05 | Game starts when host initiates and 1-4 players have selected characters | START_GAME handler validates all-selected gate |
| LBBY-06 | Player can reconnect to a running game after disconnect | Reconnection token system with 30-min TTL |
| SETUP-01 | Each player receives starter deck, starting HP, and energy per character | Character data lookup for initial deck/HP/energy |
| SETUP-02 | Act 1 map is randomly generated with correct token placement | Map generation algorithm (nodes, paths, room types) |
| SETUP-03 | Act 1 boss is randomly selected and placed face-down | Random boss selection from boss pool |
| SETUP-04 | Each player draws and resolves a Neow's Blessing card | Neow's Blessing card draw and resolution |
| SETUP-05 | Solo player receives Loaded Die relic | Conditional relic grant on 1-player start |
| SETUP-06 | 1st Encounter is set up and combat begins | Map node resolution into combat via processAction |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | ^8.18.0 | WebSocket server | Already in deps, raw WS per project decision |
| zod | ^4.3.6 | Message validation | Already in deps, validates all client messages |
| uuid/crypto | Node built-in | Player IDs, reconnection tokens | No external dep needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @slay-online/shared | workspace:* | Schemas, types, game data | All message/state types |
| tsx | latest | Development server | Dev mode with watch |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw ws | Socket.IO | Project decision: raw ws, no framework overhead for 1-4 players |
| In-memory rooms | Redis | Overkill for single-server, 1-4 player sessions |
| UUID tokens | JWT | Simpler opaque tokens sufficient for reconnection |

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
├── index.ts                 # WebSocket server setup + message routing
├── rooms/
│   ├── RoomManager.ts       # Room lifecycle (create, join, leave, cleanup)
│   ├── Room.ts              # Single room state (lobby + game)
│   ├── roomCodes.ts         # 4-letter word code generation
│   └── reconnection.ts      # Token management + TTL
├── lobby/
│   ├── lobbyHandlers.ts     # Character select, rule toggle, start game
│   └── gameInit.ts          # Starter decks, HP, map gen, boss, Neow
├── game/
│   ├── actionQueue.ts       # FIFO serialization of player intents
│   ├── gameHandlers.ts      # PLAY_CARD, END_TURN → processAction
│   └── disconnectTimer.ts   # 30s auto-end-turn for disconnected players
└── game/engine/             # (existing Phase 2 code)
```

### Pattern 1: Thin Server Layer
**What:** WebSocket server validates messages, routes to handlers, broadcasts results
**When to use:** Always — the game engine does all logic
**Example:**
```typescript
// Server receives ClientMessage, routes to handler
ws.on('message', (raw) => {
  const msg = ClientMessageSchema.parse(JSON.parse(raw));
  const room = roomManager.getRoom(connectionToRoom.get(ws));
  if (!room) return ws.send(errorMsg('ROOM_NOT_FOUND'));

  switch (msg.type) {
    case 'PLAY_CARD': gameHandlers.playCard(room, playerId, msg); break;
    case 'END_TURN': gameHandlers.endTurn(room, playerId); break;
    // ...
  }
});
```

### Pattern 2: Room as State Container
**What:** Each Room holds lobby state OR game state, with lifecycle transitions
**When to use:** Room management
**Example:**
```typescript
interface Room {
  code: string;
  hostId: string;
  lobby: LobbyState;
  gameState: CombatGameState | null; // null until game starts
  connections: Map<string, WebSocket>; // playerId -> ws
  reconnectionTokens: Map<string, string>; // playerId -> token
  disconnectTimers: Map<string, NodeJS.Timeout>; // playerId -> 30s timer
  lastActivity: number; // for 30-min TTL
}
```

### Pattern 3: FIFO Action Queue
**What:** Serialize all game actions through a queue to prevent race conditions
**When to use:** During PLAYER_ACTIONS phase
**Example:**
```typescript
// Each room has a processing lock — actions queue and process sequentially
async processAction(room: Room, playerId: string, action: Action) {
  // processAction is synchronous (pure function), so simple mutex suffices
  const newState = processAction(room.gameState!, action, Math.random);
  room.gameState = newState;
  broadcastState(room);
}
```

### Anti-Patterns to Avoid
- **Stateful WebSocket handlers:** Don't put game logic in message handlers — delegate to engine
- **Mutable shared state without serialization:** Even though processAction is synchronous, ensure one action completes before next starts
- **Client-side game state:** Server is authoritative — client only renders what server sends

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket ping/pong | Custom heartbeat protocol | ws built-in ping/pong | ws handles this natively |
| Message validation | Manual if/else chains | Zod discriminatedUnion parse | Already defined in shared |
| Unique IDs | Custom counters | crypto.randomUUID() | Node.js built-in, cryptographically secure |
| Timer management | Manual setInterval tracking | Simple Map<string, Timeout> with clearTimeout | Straightforward for 1-4 players |

## Common Pitfalls

### Pitfall 1: Race Conditions with Simultaneous Card Plays
**What goes wrong:** Two players play cards at the same time, both read same state, both write — one overwrites the other
**Why it happens:** processAction is pure/synchronous but if called from async message handlers without serialization
**How to avoid:** Process one message at a time per room. Since processAction is synchronous, just ensure sequential processing within a room's message handler
**Warning signs:** Inconsistent state, "phantom" damage, cards playing but effects not applying

### Pitfall 2: Reconnection Token Leaking Player Identity
**What goes wrong:** If room code alone allows reconnection, anyone with the code can impersonate a player
**Why it happens:** Missing authentication step on reconnect
**How to avoid:** Issue a reconnection token (opaque UUID) on first connect, require it for reconnection. Store in client localStorage.
**Warning signs:** Players accidentally joining as someone else

### Pitfall 3: Room Memory Leaks
**What goes wrong:** Rooms never cleaned up, server memory grows indefinitely
**Why it happens:** Missing cleanup on disconnect/game-end
**How to avoid:** 30-min TTL timer after all players disconnect, periodic sweep of expired rooms
**Warning signs:** Server memory growing over time, eventually crashing

### Pitfall 4: Broadcasting Full State to Wrong Players
**What goes wrong:** Player sees another player's hand (draw pile is private)
**Why it happens:** Broadcasting raw GameState includes all player hands
**How to avoid:** Create per-player views that redact other players' hands/draw piles
**Warning signs:** Cheating, players seeing cards they shouldn't

### Pitfall 5: Map Generation Not Matching Board Game Rules
**What goes wrong:** Invalid map structure (wrong node counts, missing connections)
**Why it happens:** Board game has specific rules for map generation
**How to avoid:** Follow board game rulebook exactly for Act 1 map structure
**Warning signs:** Maps that don't look like the board game

## Code Examples

### WebSocket Server Setup
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessageSchema } from '@slay-online/shared';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: Buffer) => {
    try {
      const msg = ClientMessageSchema.parse(JSON.parse(data.toString()));
      handleMessage(ws, msg);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'INVALID_MESSAGE', message: 'Invalid message format' }));
    }
  });
});
```

### Room Code Generation
```typescript
// Curated list of 4-letter thematic words
const ROOM_WORDS = [
  'FIRE', 'SLAM', 'IRON', 'DARK', 'GLOW', 'RUNE', 'MIST',
  'FANG', 'BOLT', 'CLAW', 'DUSK', 'FURY', 'GRIM', 'HAZE',
  'JADE', 'KEEN', 'LASH', 'MYTH', 'ORBS', 'PIKE', 'RAGE',
  'SCAR', 'TOMB', 'VOID', 'WARP', 'ZEAL', 'APEX', 'BANE',
  // ... ~100+ words for sufficient room capacity
];

function generateRoomCode(existingCodes: Set<string>): string {
  const available = ROOM_WORDS.filter(w => !existingCodes.has(w));
  if (available.length === 0) throw new Error('No room codes available');
  return available[Math.floor(Math.random() * available.length)];
}
```

### Character Starter Data
```typescript
const CHARACTER_STARTERS: Record<string, { hp: number; deck: string[] }> = {
  ironclad: { hp: 75, deck: ['strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r', 'defend_r', 'defend_r', 'defend_r', 'defend_r', 'bash'] },
  silent:   { hp: 70, deck: ['strike_g', 'strike_g', 'strike_g', 'strike_g', 'strike_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g', 'survivor', 'neutralize'] },
  defect:   { hp: 75, deck: ['strike_b', 'strike_b', 'strike_b', 'strike_b', 'defend_b', 'defend_b', 'defend_b', 'defend_b', 'zap', 'dualcast'] },
  watcher:  { hp: 68, deck: ['strike_p', 'strike_p', 'strike_p', 'strike_p', 'defend_p', 'defend_p', 'defend_p', 'defend_p', 'eruption', 'vigilance'] },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.IO for everything | Raw WebSocket for small-scale | Always valid for <10 players | Less overhead, simpler debugging |
| Delta patching | Full-state broadcast | Project decision | Simpler code, acceptable for <200KB state |

## Open Questions

1. **Act 1 Map Generation Algorithm**
   - What we know: Board game has specific node types (encounter, elite, boss, event, campfire, treasure, merchant) arranged in a branching path
   - What's unclear: Exact board game rules for map generation (number of nodes, branch probabilities, guaranteed nodes)
   - Recommendation: Research board game rulebook for map structure. Implement a simplified version that matches the feel — exact randomization parameters can be adjusted during testing

2. **Neow's Blessings Specifics**
   - What we know: Each player draws a Neow's Blessing card at game start
   - What's unclear: Exact Neow's Blessing card pool and effects from the board game
   - Recommendation: Reference existing card data in shared package for Neow's Blessings if present, or add to event data

3. **Per-Player State Redaction**
   - What we know: Need to prevent players from seeing each other's draw piles
   - What's unclear: Exact fields to redact (hand visibility is a Phase 6 toggle)
   - Recommendation: Redact drawPile order for all players, keep hand visible to owner only by default

## Sources

### Primary (HIGH confidence)
- Existing codebase: `packages/shared/src/schemas/messages.ts` — message schemas
- Existing codebase: `packages/shared/src/schemas/gameState.ts` — state schemas
- Existing codebase: `packages/server/src/game/engine/index.ts` — processAction API
- ws library docs — WebSocket server API

### Secondary (MEDIUM confidence)
- Board game rules for map generation and Neow's Blessings — need physical rulebook verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project
- Architecture: HIGH — thin server over existing engine is well-understood pattern
- Pitfalls: HIGH — race conditions and reconnection are well-documented challenges
- Game rules (map, Neow): MEDIUM — need board game rulebook verification

**Research date:** 2026-03-01
**Valid until:** 2026-04-01
