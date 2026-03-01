# Architecture Research

**Domain:** Real-time multiplayer cooperative board/card game (web)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — patterns drawn from multiple verified sources; specific SolidJS game integration is LOW confidence due to limited documented examples

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                           │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  SolidJS UI (Reactive Components)                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Lobby UI │  │ Game UI  │  │ Chat UI  │            │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │       └─────────────┴─────────────┘                   │    │
│  │                     │                                  │    │
│  │         ┌───────────▼───────────┐                     │    │
│  │         │  Client Game Store    │ ← createStore()     │    │
│  │         │  (authoritative copy  │                     │    │
│  │         │   from server)        │                     │    │
│  │         └───────────┬───────────┘                     │    │
│  │                     │                                  │    │
│  │         ┌───────────▼───────────┐                     │    │
│  │         │  WebSocket Manager    │                     │    │
│  │         │  (send/receive msgs)  │                     │    │
│  │         └───────────┬───────────┘                     │    │
│  └─────────────────────┼───────────────────────────────┘    │
│                         │ WebSocket                          │
└─────────────────────────┼──────────────────────────────────┘
                           │
┌─────────────────────────┼──────────────────────────────────┐
│                  SERVER LAYER (Node.js/TS)                   │
│                         │                                    │
│         ┌───────────────▼───────────────┐                   │
│         │       WebSocket Server        │                   │
│         │   (connection management)     │                   │
│         └───────────────┬───────────────┘                   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │                  Message Router                      │    │
│  │   (routes actions to lobby manager or game engine)   │    │
│  └────┬─────────────────────────────────┬──────────────┘    │
│       │                                 │                    │
│  ┌────▼────────────┐         ┌──────────▼──────────────┐    │
│  │  Lobby Manager  │         │      Game Engine         │    │
│  │  (rooms, codes, │         │  (authoritative state,   │    │
│  │   player slots) │         │   rules, turn flow)      │    │
│  └────┬────────────┘         └──────────┬──────────────┘    │
│       │                                 │                    │
│  ┌────▼────────────────────────────────▼──────────────┐    │
│  │               In-Memory Game Store                   │    │
│  │   (Map<gameId, GameState> — one object per session)  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| SolidJS UI | Render game state reactively; capture player input | SolidJS components with createStore/createSignal |
| Client Game Store | Hold server-authoritative copy of game state; drive all UI | SolidJS createStore, updated on every server message |
| WebSocket Manager (client) | Maintain connection, send player actions, receive state updates | Native WebSocket + Solid Primitives websocket helpers |
| WebSocket Server | Accept connections, identify players, route messages | Node.js `ws` library or built-in Bun WebSocket |
| Message Router | Parse incoming message type, dispatch to correct handler | Switch/dispatch map on `msg.type` |
| Lobby Manager | Create/destroy game rooms, track join codes, seat players | In-memory Map<code, LobbyRoom> |
| Game Engine | Validate actions, apply rules, advance turn phases, broadcast | Pure TypeScript functions + game state object |
| In-Memory Game Store | Hold all active GameState objects for current sessions | Map<gameId, GameState> in Node.js process memory |

## Recommended Project Structure

```
server/
├── websocket/
│   ├── server.ts           # WS server setup, connection lifecycle
│   └── router.ts           # Message type → handler dispatch
├── lobby/
│   ├── lobbyManager.ts     # Create/join/leave lobbies
│   └── lobby.types.ts      # LobbyRoom, Player, LobbyState types
├── game/
│   ├── engine/
│   │   ├── gameEngine.ts   # Top-level: process action → new state
│   │   ├── turnManager.ts  # Turn phases, simultaneous turn resolution
│   │   ├── combatEngine.ts # Card play, block, damage, effects
│   │   ├── enemyAI.ts      # Enemy intent selection, action execution
│   │   └── effectsEngine.ts# Status effects, triggers, relics
│   ├── state/
│   │   ├── gameState.ts    # GameState type definition
│   │   ├── playerState.ts  # PlayerState, Hand, Deck, Discard
│   │   └── storeManager.ts # Map<gameId, GameState>, CRUD
│   └── data/
│       ├── cards/          # Card definitions by character
│       ├── enemies/        # Enemy card data (Act 1)
│       └── relics/         # Relic definitions
├── shared/
│   └── messages.ts         # Shared message type definitions (client/server)
└── index.ts                # Entry point

client/src/
├── ws/
│   ├── wsClient.ts         # WebSocket connection, send, reconnect
│   └── messageHandler.ts   # Receive server messages → update store
├── store/
│   ├── gameStore.ts        # SolidJS createStore for game state
│   └── lobbyStore.ts       # SolidJS createStore for lobby state
├── components/
│   ├── lobby/              # Lobby UI components
│   ├── game/               # Game board, hand, enemies, HP bars
│   │   ├── Board.tsx
│   │   ├── PlayerHand.tsx
│   │   ├── EnemyRow.tsx
│   │   └── CombatLog.tsx
│   └── ui/                 # Shared UI primitives
├── pages/
│   ├── Home.tsx            # Landing / create or join lobby
│   ├── Lobby.tsx           # Pre-game lobby
│   └── Game.tsx            # Active game view
└── app.tsx
```

### Structure Rationale

- **server/game/engine/:** Isolated pure functions — testable without WebSocket; each sub-engine handles one concern (combat vs. turn flow vs. AI)
- **server/game/data/:** Static game data separate from runtime state — easy to update card definitions without touching engine logic
- **server/shared/messages.ts:** Single source of truth for message types shared between client and server — prevents drift
- **client/store/:** Mirrors server-side state shape, updated only by server messages — client never computes game logic

## Architectural Patterns

### Pattern 1: Authoritative Server — Client as View

**What:** All game logic lives on the server. The client sends player intent (actions), never outcomes. The server validates, applies the action to its GameState, then broadcasts the updated state to all players in the room.

**When to use:** Any multiplayer game where cheating prevention or rule consistency matters. Board game adaptations especially benefit because the rules are fixed and complex — a single implementation on the server prevents rule disputes.

**Trade-offs:** Simplifies client significantly (just renders what server says). Adds round-trip latency for every action, but for a cooperative board game with no fast-paced action, 100-300ms round-trips are imperceptible.

**Example:**
```typescript
// Client sends intent only
wsClient.send({ type: 'PLAY_CARD', cardId: 'strike_r', targets: ['enemy_0'] });

// Server validates, applies, broadcasts result
function handlePlayCard(gameState: GameState, playerId: string, action: PlayCardAction): GameState {
  if (!isValidPlay(gameState, playerId, action)) {
    sendError(playerId, 'Invalid card play');
    return gameState;
  }
  const next = applyCardEffect(gameState, action);
  broadcastToRoom(gameState.gameId, { type: 'STATE_UPDATE', state: next });
  return next;
}
```

### Pattern 2: Full State Broadcast (not delta patching)

**What:** After every state change, broadcast the complete GameState to all clients. Don't attempt to send only "what changed."

**When to use:** Games with small state objects (< 50KB), 1-4 players, no requirement to support thousands of concurrent rooms. This is appropriate for v1 of this project.

**Trade-offs:** Simpler to implement and debug. Works fine for 1-4 players with typical board game state sizes. For large state or many players, delta compression would be needed — but that's a later optimization.

**Example:**
```typescript
function broadcastState(room: GameRoom): void {
  const snapshot = serializeGameState(room.state);
  for (const player of room.connectedPlayers) {
    player.ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: snapshot }));
  }
}
```

### Pattern 3: Simultaneous Turn "Commit" Model

**What:** During the player action phase, all players act freely (play cards, use potions) without waiting for each other. Each player's actions are applied immediately to their own subset of game state (their energy, their hand). When a player signals "end turn," the server records their commitment. Once ALL players commit, the server resolves end-of-turn effects, then executes enemy actions in the defined order (top row to bottom, left to right, bosses last), then broadcasts the resulting state.

**When to use:** Cooperative board games with simultaneous turns. Avoids one player blocking all others. Matches the physical board game experience.

**Trade-offs:** Requires tracking per-player "ready" status. Must handle conflict resolution (e.g., two players target same enemy with multi-hit). State updates during card play are still broadcast immediately so all players see each other's actions in real-time — only the "end turn" resolution waits.

**Example:**
```typescript
type TurnPhase = 'PLAYER_ACTIONS' | 'WAITING_FOR_ALL' | 'ENEMY_TURN' | 'CLEANUP';

interface TurnState {
  phase: TurnPhase;
  playersReady: Set<string>; // player IDs who clicked "end turn"
  totalPlayers: number;
}

function handleEndTurn(gameState: GameState, playerId: string): GameState {
  const next = { ...gameState };
  next.turn.playersReady.add(playerId);

  if (next.turn.playersReady.size === next.turn.totalPlayers) {
    // All committed — resolve enemy turn
    return resolveEnemyTurn(next);
  }

  return next; // partial commit — broadcast updated ready status
}
```

### Pattern 4: Command/Message Protocol

**What:** All communication uses typed message objects with a `type` discriminator field. Both client-to-server and server-to-client messages are defined in a shared type file. The router on the server switches on `msg.type` to dispatch to the appropriate handler.

**When to use:** Always, for multiplayer games. Provides a clear protocol contract.

**Trade-offs:** More upfront type definition work. Pays back immediately in debuggability and type safety.

**Example:**
```typescript
// shared/messages.ts
type ClientMessage =
  | { type: 'JOIN_LOBBY'; code: string; playerName: string }
  | { type: 'PLAY_CARD'; cardId: string; targets: string[] }
  | { type: 'END_TURN' }
  | { type: 'SEND_CHAT'; text: string };

type ServerMessage =
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'LOBBY_UPDATE'; lobby: LobbyState }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'CHAT_MESSAGE'; playerId: string; text: string };
```

## Data Flow

### Player Action Flow

```
Player clicks "Play Card" (SolidJS component)
    ↓
wsClient.send({ type: 'PLAY_CARD', cardId, targets })
    ↓ WebSocket
WebSocket Server receives message
    ↓
Message Router: msg.type === 'PLAY_CARD' → combatEngine.handlePlayCard()
    ↓
Game Engine validates action against GameState
    ↓ (valid)
applyCardEffect() → new GameState
    ↓
broadcastState() → sends STATE_UPDATE to all players in room
    ↓ WebSocket (to all clients)
Client WebSocket Manager receives STATE_UPDATE
    ↓
messageHandler.ts updates SolidJS gameStore (setStore)
    ↓
SolidJS reactive system re-renders affected components
```

### Simultaneous Turn Resolution Flow

```
Each player acts freely during PLAYER_ACTIONS phase
(card plays broadcast immediately — all see each other)
    ↓
Player signals "End Turn"
    ↓
Server records player as ready; broadcasts partial ready state
    ↓ (when ALL players ready)
Server enters ENEMY_TURN phase
    ↓
enemyAI resolves: top row → bottom row, left → right, bosses last
    ↓
resolveEnemyAttacks() applies damage/effects per player targeting rules
    ↓
cleanupTurn() resets energy, discards hands, applies end-of-turn triggers
    ↓
Server enters PLAYER_ACTIONS phase for next turn
    ↓
Broadcast full STATE_UPDATE to all clients
```

### Lobby → Game Lifecycle Flow

```
Player A creates lobby → server assigns 4-char code → returns LOBBY_UPDATE
    ↓
Player B-D join by code → server seats them → broadcasts LOBBY_UPDATE
    ↓
Players select characters → server records → broadcasts LOBBY_UPDATE
    ↓
Player A (host) starts game
    ↓
Server creates GameState (shuffle decks, select map, draw Neow blessings)
    ↓
Server sends STATE_UPDATE with initial game state to all players
    ↓
Lobby destroyed; game session begins
    ↓ (during game)
Player disconnects → server marks as disconnected, keeps state
    ↓
Player reconnects with same playerId → server sends full STATE_UPDATE
```

### State Management

```
Server: Map<gameId, GameState>   ← source of truth
    ↓ broadcasts STATE_UPDATE
Client: SolidJS createStore(initialState)
    ↓ setStore() on every STATE_UPDATE
SolidJS reactivity → only affected components re-render
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10 concurrent games | Single Node.js process, in-memory Map — no changes needed |
| 10-100 concurrent games | Same — in-memory Map holds easily; monitor memory per game (~50-100KB state) |
| 100-1000 concurrent games | Consider Redis for session persistence; sticky WebSocket routing if load-balanced |
| 1000+ concurrent games | Horizontal scaling with Redis pub/sub for cross-node room broadcasts; outside v1 scope |

### Scaling Priorities

1. **First bottleneck:** Memory per game session — a GameState for 4 players with full card data is ~100-200KB. At 1000 concurrent games, that's ~200MB — well within a typical Node.js process. Not a real concern for v1.
2. **Second bottleneck:** Single-process Node.js event loop saturation from many simultaneous games. Mitigation: game logic should be synchronous and fast (board games process in microseconds, not milliseconds).

## Anti-Patterns

### Anti-Pattern 1: Shared Mutable State Without Immutability

**What people do:** Mutate the GameState object in-place inside engine functions, then broadcast the mutated reference.

**Why it's wrong:** Functions that mutate shared state are hard to test and create subtle bugs (e.g., broadcasting the same object before effects are fully resolved). Debugging game replay becomes impossible.

**Do this instead:** Engine functions take GameState and return a new GameState. Keep functions pure. Use `structuredClone()` or shallow spread when creating new state, only copying deeply what changed.

### Anti-Pattern 2: Trusting Client-Side Game Logic

**What people do:** Compute damage, card effects, or turn resolution on the client and send results to the server. "The client already computed it — just broadcast it."

**Why it's wrong:** Any player can send fabricated results. Even in cooperative games, this makes bugs hard to diagnose (which client's version is right?) and makes cheating trivial.

**Do this instead:** Client sends only intent (which card, which target). Server computes everything and sends authoritative results back.

### Anti-Pattern 3: Storing Game Phase in Client State

**What people do:** Track turn phase or "whose turn is it" in the SolidJS client store, updated by local logic rather than server messages.

**Why it's wrong:** Client and server phase can diverge. Player A's client might think it's the enemy turn while the server is still waiting for player B.

**Do this instead:** TurnPhase is always part of GameState on the server. Client renders based only on what the server's STATE_UPDATE says the phase is.

### Anti-Pattern 4: Fine-Grained Delta Updates for v1

**What people do:** Attempt to send only changed fields ("player 1's HP went from 50 to 42") rather than full state, reasoning this is more efficient.

**Why it's wrong:** Delta patching requires complex diff/merge logic and makes reconnect (full state resync) harder to implement correctly. The efficiency gain is negligible for 1-4 player sessions.

**Do this instead:** Broadcast full GameState on every change. Profile first. Optimize delta compression only if benchmarks show it as a real bottleneck at scale.

### Anti-Pattern 5: Implementing Game Logic in SolidJS Components

**What people do:** Put card effect calculations, damage formulas, or enemy AI logic in SolidJS components or stores because "it's easier to access state there."

**Why it's wrong:** Couples rendering to rules. Makes testing game logic require spinning up a browser. Creates a second source of truth.

**Do this instead:** All game rules live in `server/game/engine/`. Components are dumb views. The only logic in client code is "how to display this state."

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None (v1) | — | v1 is self-contained; no auth, no persistence, no third-party services |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client UI ↔ Client Store | SolidJS reactive signals/stores | Components read store; never write directly to store (go through wsClient) |
| Client Store ↔ WebSocket Manager | Message handler calls setStore() | One-way: server messages update store; store does not push to server |
| WebSocket Manager ↔ Server | JSON over WebSocket | All messages typed via shared/messages.ts |
| Message Router ↔ Game Engine | Direct TypeScript function calls | No async; game engine is synchronous |
| Game Engine ↔ In-Memory Store | Read/write GameState via storeManager | Engine functions never access the Map directly — storeManager abstraction |
| Lobby Manager ↔ Game Engine | Lobby creates initial GameState, then hands off | After game starts, lobby manager is done; game engine owns state |

## Build Order Implications

The component dependencies dictate this build order:

1. **Shared message types** (`shared/messages.ts`) — everything else depends on this contract
2. **Game data** (card definitions, enemy data) — engine depends on static data
3. **GameState type definitions** — engine, store, and client all depend on the state shape
4. **Game Engine** (pure functions, no WebSocket) — testable in isolation before adding networking
5. **In-Memory Store + Lobby Manager** — wraps game engine with session management
6. **WebSocket Server + Message Router** — connects networking to the above
7. **SolidJS Client Store** — mirrors server state shape; needs STATE_UPDATE message type defined
8. **WebSocket Client Manager** — connects client store to server
9. **SolidJS UI Components** — pure rendering layer, built last

The game engine (step 4) is the highest-value component to isolate. Write it as pure functions that take GameState and return GameState. This makes the complex combat rules (Vulnerable/Weak multi-hit, triggered abilities, simultaneous turn resolution) testable without any browser or WebSocket involved.

## Sources

- [Building a Multiplayer Board Game with JavaScript and WebSockets](https://dev.to/krishanvijay/building-a-multiplayer-board-game-with-javascript-and-websockets-4fae) — MEDIUM confidence (WebSearch, single source)
- [Client-Server Game Architecture — Gabriel Gambetta](https://www.gabrielgambetta.com/client-server-game-architecture.html) — MEDIUM confidence (widely cited authoritative reference)
- [Designing Scalable and Secure Server-Authoritative Card Games — MPL](https://www.mplgaming.com/server-authoritative-games/) — LOW confidence (WebSearch, industry blog)
- [Colyseus Multiplayer Framework Documentation](https://docs.colyseus.io/) — HIGH confidence (official docs; architectural patterns adapted for custom implementation)
- [Game Networking Fundamentals 2025](https://generalistprogrammer.com/tutorials/game-networking-fundamentals-complete-multiplayer-guide-2025) — LOW confidence (WebSearch only)
- [Simultaneous Turns — rasie1's blog](https://kvachev.com/blog/posts/simultaneous-turns/) — LOW confidence (WebSearch, single source)
- [SolidJS WebSocket Primitives — Solid Primitives](https://primitives.solidjs.community/package/websocket/) — MEDIUM confidence (official community library)
- [Game Programming Patterns — Event Queue](https://gameprogrammingpatterns.com/event-queue.html) — HIGH confidence (widely cited book, stable patterns)
- [Game Programming Patterns — Command](https://gameprogrammingpatterns.com/command.html) — HIGH confidence (widely cited book, stable patterns)

---
*Architecture research for: Real-time multiplayer cooperative board/card game web application*
*Researched: 2026-03-01*
