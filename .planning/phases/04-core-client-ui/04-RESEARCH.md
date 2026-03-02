# Phase 4: Core Client UI - Research

**Researched:** 2026-03-01
**Domain:** SolidJS reactive UI, WebSocket client integration, real-time game board rendering
**Confidence:** HIGH

## Summary

Phase 4 builds the combat-facing browser UI using SolidJS. The client receives full `GameState` objects via WebSocket (`STATE_UPDATE` messages) and renders a player board (hand, energy, HP, block, pile counts), a shared combat view (enemies, die result, turn phase), card interaction (click-to-select, click-to-target), End Turn flow with per-player indicators, a combat log, a text chat panel, and a win/loss overlay. The architecture is straightforward: a single reactive store derived from WebSocket messages, with pure rendering components that read from the store.

The existing codebase provides strong foundations: typed Zod schemas for `GameState`, `PlayerState`, `ClientMessage`, and `ServerMessage` in `@slay-online/shared`; `@solid-primitives/websocket` already installed; Vite with `vite-plugin-solid` configured; and full card data (282+ cards across 4 characters) available as structured data. The server already handles `PLAY_CARD`, `END_TURN`, `SEND_CHAT`, and `RECONNECT` message types with serialized action queues.

**Primary recommendation:** Build a thin WebSocket service layer that feeds a SolidJS `createStore`, then implement pure UI components that read from the store. Use CSS modules with dark fantasy styling. Keep the architecture simple — no state management library beyond SolidJS's built-in reactivity.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Classic TCG layout — enemies at top, shared info in middle, player's hand/stats at bottom (Hearthstone/StS video game style)
- Other players shown as compact sidebar with stats (HP, energy, block) — no detail on their hands
- Desktop-first, mobile adaptation in a future phase
- Shared info (die result, turn phase) placed center of board between enemies and hand — always visible
- Click card, then click target — select a card (highlights it), then click an enemy to target
- Hover to enlarge in-place — hovering a card in hand shows enlarged version with full text right where the card is
- Board game card style — mimics the physical Slay the Spire board game card layout with title bar, effect text area, type icon
- Unplayable cards are dimmed/grayed out — still visible but clearly unplayable
- Brief transitions (200-300ms) — short CSS transitions for number changes, card movements, HP bars
- Checkmark next to player name when they've ended their turn — simple green checkmark indicator
- Combat log as scrollable log panel — side panel or bottom area showing recent events, always visible
- Win/loss: simple overlay with result + Return to Lobby button — minimal but functional
- Vanilla CSS with CSS modules — scoped styles per component, no extra deps, Vite supports natively
- Dark fantasy visual tone — dark backgrounds, muted reds/purples, gothic feel matching the Slay the Spire aesthetic
- Character-colored card borders/headers — Ironclad=red, Silent=green, Defect=blue, Watcher=purple

### Claude's Discretion
- Font selection (should match dark fantasy tone)
- Exact transition/animation implementation details
- Combat log event formatting and entry count
- Card hover enlargement sizing and positioning
- Responsive breakpoints if any affordances are easy to add
- HP/energy bar visual style (numeric, bar, both)

### Deferred Ideas (OUT OF SCOPE)
- Mobile-responsive layout — future phase
- Full card animations (damage numbers floating, cards sliding to discard) — polish phase
- Stats summary on win/loss screen — future enhancement
- Tab/toggle to view other players' full boards — could add if compact sidebar feels insufficient
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Visual player boards showing hand, energy, HP, block, discard/draw pile counts | SolidJS reactive store from GameState; PlayerBoard component reads PlayerState |
| UI-02 | Card tooltip showing full card text on hover/tap | Card data available from @slay-online/shared; hover-to-enlarge pattern with CSS |
| UI-04 | Shared view of die result, enemy intents, boss HP, map state | SharedCombatView component reading from GameState; enemy data from shared package |
| UI-05 | Turn/phase indicators visible to all players | TurnPhaseSchema enum already defined; render as banner/indicator |
| UI-06 | End Turn button with visual indicator of who has/hasn't ended turn | PlayerState.endedTurn boolean; checkmark indicator per context decisions |
| UI-09 | In-game text chat panel | SEND_CHAT/CHAT_MESSAGE already in message schemas; simple scrollable chat UI |
| UI-10 | Action log / event feed showing card plays, damage, status effects | GameState.combatLog array already exists; scrollable log component |
| UI-11 | Win/lose screen with outcome and return-to-lobby option | Check GameState.phase === 'COMBAT_END'; overlay component |
| UI-13 | Waiting/loading states during server resolution | Show spinner/indicator during WAITING_FOR_ALL_PLAYERS and ENEMY_TURN phases |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| solid-js | ^1.9.11 | Reactive UI framework | Already installed; fine-grained reactivity ideal for real-time game state |
| @solid-primitives/websocket | ^1.3.0 | WebSocket primitive for SolidJS | Already installed; provides createWebSocket with auto-reconnect |
| vite | ^7.0.0 | Build tool | Already configured with vite-plugin-solid |
| @slay-online/shared | workspace:* | Shared types, schemas, card data | Already available; provides GameState, messages, card data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS Modules | built-in | Scoped component styles | Every component — Vite supports natively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SolidJS createStore | Redux/MobX | Unnecessary — SolidJS has built-in fine-grained reactivity |
| CSS Modules | Tailwind/styled-components | User locked decision: vanilla CSS with CSS modules |
| Custom WebSocket | Socket.IO client | Unnecessary — raw ws matches server; @solid-primitives/websocket handles reconnection |

**Installation:**
```bash
# No new dependencies needed — everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
packages/client/src/
├── app.tsx                   # Root component, router (lobby vs combat)
├── index.tsx                 # Entry point, render to DOM
├── services/
│   └── websocket.ts          # WebSocket connection, message dispatch
├── stores/
│   └── gameStore.ts          # SolidJS createStore for game state
├── components/
│   ├── combat/
│   │   ├── CombatView.tsx    # Main combat layout container
│   │   ├── PlayerBoard.tsx   # Player's own board (hand, stats)
│   │   ├── HandZone.tsx      # Cards in hand
│   │   ├── Card.tsx          # Individual card rendering
│   │   ├── CardTooltip.tsx   # Enlarged card on hover
│   │   ├── PlayerStats.tsx   # HP, energy, block display
│   │   ├── EnemyZone.tsx     # Enemy area at top
│   │   ├── EnemyCard.tsx     # Individual enemy display
│   │   ├── SharedInfo.tsx    # Die result, turn phase, center area
│   │   ├── TeamSidebar.tsx   # Other players' compact stats
│   │   ├── CombatLog.tsx     # Action log panel
│   │   ├── EndTurnButton.tsx # End Turn button with status
│   │   └── CombatEnd.tsx     # Win/loss overlay
│   ├── chat/
│   │   └── ChatPanel.tsx     # Text chat UI
│   └── lobby/
│       └── LobbyView.tsx     # Lobby screen (from Phase 3 server)
├── styles/
│   ├── variables.module.css  # CSS custom properties (colors, fonts)
│   ├── combat.module.css     # Combat layout styles
│   ├── card.module.css       # Card styling
│   └── ...                   # Per-component module CSS
└── utils/
    └── cardLookup.ts         # Client-side card data lookup
```

### Pattern 1: Reactive Store from WebSocket
**What:** Single `createStore` that holds the current game state, updated on each `STATE_UPDATE` message.
**When to use:** For all game state — no derived signals needed for initial implementation.
**Example:**
```typescript
import { createStore, reconcile } from 'solid-js/store';
import type { GameState, LobbyState, ServerMessage } from '@slay-online/shared';

const [gameState, setGameState] = createStore<GameState | null>(null);
const [lobbyState, setLobbyState] = createStore<LobbyState | null>(null);

// On WebSocket message:
function handleMessage(msg: ServerMessage) {
  switch (msg.type) {
    case 'STATE_UPDATE':
      setGameState(reconcile(msg.state));
      break;
    case 'LOBBY_UPDATE':
      setLobbyState(reconcile(msg.lobby));
      break;
  }
}
```

### Pattern 2: Click-to-Select, Click-to-Target
**What:** Two-phase card play interaction. First click selects a card (highlighted), second click on a valid target sends PLAY_CARD.
**When to use:** All card play interactions.
**Example:**
```typescript
const [selectedCard, setSelectedCard] = createSignal<string | null>(null);

function onCardClick(cardId: string) {
  if (selectedCard() === cardId) {
    setSelectedCard(null); // Deselect
  } else {
    setSelectedCard(cardId); // Select
  }
}

function onEnemyClick(enemyId: string) {
  const card = selectedCard();
  if (card) {
    sendMessage({ type: 'PLAY_CARD', cardId: card, targetIds: [enemyId] });
    setSelectedCard(null);
  }
}
```

### Pattern 3: CSS Module Scoping
**What:** Import `.module.css` files for per-component scoped styles.
**When to use:** Every component.
**Example:**
```typescript
import styles from './Card.module.css';

function Card(props: { card: PlayerCard }) {
  return <div class={styles.card}>{props.card.name}</div>;
}
```

### Anti-Patterns to Avoid
- **Derived state in components:** Don't recompute player's own state in every component. Extract once in a derived helper.
- **Direct WebSocket sends from deep components:** Route all sends through a single service layer. Components call action functions, not raw WebSocket.
- **Uncontrolled re-renders:** SolidJS is fine-grained but using `reconcile` on large state objects can be tricky — use it correctly at the store level.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnection | Custom retry logic | @solid-primitives/websocket | Already installed, handles reconnection and cleanup |
| State diffing | Manual state comparison | SolidJS reconcile | Built into solid-js/store, handles deep object reconciliation |
| Card data lookup | Rebuild card maps | Import from @slay-online/shared | All 282+ cards already structured and exported |
| Message serialization | Custom wire format | JSON.stringify/parse with Zod schemas | Server already uses this pattern; schemas validate both sides |

**Key insight:** The server already does all game logic. The client is purely a rendering layer that sends intents and renders state. No game logic belongs in the client.

## Common Pitfalls

### Pitfall 1: Putting Game Logic in the Client
**What goes wrong:** Client attempts to validate card plays, calculate damage, or predict state changes.
**Why it happens:** Natural instinct to add client-side validation for responsiveness.
**How to avoid:** Client sends intents only. Server responds with new state or ERROR. Client renders whatever state it receives.
**Warning signs:** Any import of game engine code into the client package.

### Pitfall 2: Not Finding "My" Player
**What goes wrong:** Components assume player position in the `players` array.
**Why it happens:** The server sends all players; client needs to find its own player by ID.
**How to avoid:** Store the `playerId` from ROOM_CREATED/JOINED response. Use `state.players.find(p => p.id === myPlayerId)` to get own state.
**Warning signs:** Hardcoded player indices.

### Pitfall 3: SolidJS Reactivity Gotchas
**What goes wrong:** Destructuring props kills reactivity; accessing store properties outside of tracking scopes doesn't re-render.
**Why it happens:** SolidJS uses Proxy-based reactivity that requires property access within tracked scopes.
**How to avoid:** Never destructure props in SolidJS components. Use `props.x` not `const { x } = props`. Use `<Show>` and `<For>` components for conditional and list rendering.
**Warning signs:** UI not updating when state changes.

### Pitfall 4: Card ID vs Card Data Confusion
**What goes wrong:** Rendering card IDs instead of looking up full card data.
**Why it happens:** GameState stores card IDs (strings) in hand/drawPile/discardPile, not full card objects.
**How to avoid:** Build a client-side lookup map from the shared card data at startup. Look up card details by ID for rendering.
**Warning signs:** Rendering raw strings like "ironclad-strike" instead of "Strike" with full card text.

### Pitfall 5: WebSocket Message Ordering
**What goes wrong:** Chat messages and state updates arriving in unexpected order.
**Why it happens:** Server broadcasts state and chat independently.
**How to avoid:** Handle each message type independently. Chat messages append to a local list; state updates replace the store. Don't couple them.
**Warning signs:** Chat disappearing on state updates.

## Code Examples

### WebSocket Service Setup
```typescript
import { createSignal } from 'solid-js';
import type { ClientMessage, ServerMessage } from '@slay-online/shared';

export function createGameConnection(url: string) {
  const [connected, setConnected] = createSignal(false);
  let ws: WebSocket | null = null;
  let messageHandler: ((msg: ServerMessage) => void) | null = null;

  function connect() {
    ws = new WebSocket(url);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 2s
      setTimeout(connect, 2000);
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      messageHandler?.(msg);
    };
  }

  function send(msg: ClientMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function onMessage(handler: (msg: ServerMessage) => void) {
    messageHandler = handler;
  }

  return { connect, send, onMessage, connected };
}
```

### Card Component with Character Colors
```typescript
import type { PlayerCard } from '@slay-online/shared';
import styles from './Card.module.css';

const CHARACTER_COLORS: Record<string, string> = {
  ironclad: '#c62828',
  silent: '#2e7d32',
  defect: '#1565c0',
  watcher: '#6a1b9a',
};

function Card(props: { card: PlayerCard; selected: boolean; playable: boolean }) {
  return (
    <div
      class={styles.card}
      classList={{
        [styles.selected]: props.selected,
        [styles.dimmed]: !props.playable,
      }}
      style={{ '--char-color': CHARACTER_COLORS[props.card.character] || '#666' }}
    >
      <div class={styles.header}>{props.card.name}</div>
      <div class={styles.cost}>{props.card.cost}</div>
      <div class={styles.text}>{props.card.text}</div>
      <div class={styles.type}>{props.card.type}</div>
    </div>
  );
}
```

### SolidJS Store with Reconcile
```typescript
import { createStore, reconcile } from 'solid-js/store';
import type { GameState, LobbyState } from '@slay-online/shared';

interface AppState {
  playerId: string | null;
  reconnectionToken: string | null;
  roomCode: string | null;
  game: GameState | null;
  lobby: LobbyState | null;
  chatMessages: Array<{ playerId: string; text: string }>;
  error: string | null;
}

export function createAppStore() {
  const [state, setState] = createStore<AppState>({
    playerId: null,
    reconnectionToken: null,
    roomCode: null,
    game: null,
    lobby: null,
    chatMessages: [],
    error: null,
  });

  return {
    state,
    setPlayerId: (id: string) => setState('playerId', id),
    setReconnectionToken: (token: string) => setState('reconnectionToken', token),
    setRoomCode: (code: string) => setState('roomCode', code),
    updateGame: (game: GameState) => setState('game', reconcile(game)),
    updateLobby: (lobby: LobbyState) => setState('lobby', reconcile(lobby)),
    addChat: (msg: { playerId: string; text: string }) =>
      setState('chatMessages', (prev) => [...prev, msg]),
    setError: (err: string | null) => setState('error', err),
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Component-level state | Store-level state with createStore | SolidJS 1.0+ | Single source of truth for game state |
| Manual DOM manipulation | Fine-grained SolidJS reactivity | N/A (project decision) | Automatic UI updates on state change |
| REST polling for state | WebSocket full-state broadcast | N/A (project architecture) | Real-time sync, server-authoritative |

**Deprecated/outdated:**
- None specific to this stack — SolidJS 1.9.x is current and stable

## Open Questions

1. **Enemy intent display**
   - What we know: `activeEnemies` is an array of enemy card IDs. Server tracks `EnemyCombatState` per enemy (HP, block, tokens, cube position).
   - What's unclear: The `GameState` only has `activeEnemies: string[]` — the full enemy combat state (HP, block, tokens) is in the server's `CombatGameState` but `GameStateSchema` doesn't include `enemyCombatStates`. The server may need to extend `STATE_UPDATE` to include enemy display data, or the client uses enemy card data for static info.
   - Recommendation: The server's `broadcastState` sends `GameState` which only has enemy IDs. We need to check if the combat state being broadcast includes `enemyCombatStates` or if it's stripped. If not included, the plans should add it to the broadcast or use a separate message. The `CombatGameState` extends `GameState` with `enemyCombatStates` — so if the server sends the full `CombatGameState`, the client already gets enemy HP/block/tokens. The `broadcastState` function sends `room.gameState` which IS a `CombatGameState`. The client just needs to handle the extra fields.

2. **Card playability determination**
   - What we know: Unplayable cards should be dimmed. A card is unplayable if the player doesn't have enough energy or if it's during the wrong phase.
   - What's unclear: Should the client compute playability or should the server include it in state?
   - Recommendation: Client can determine basic playability: `card.cost <= player.energy && state.phase === 'PLAYER_ACTIONS' && !player.endedTurn`. This is display-only — server still validates on play attempt.

## Sources

### Primary (HIGH confidence)
- Codebase analysis — `packages/shared/src/schemas/` (GameState, messages, cards)
- Codebase analysis — `packages/server/src/game/gameHandlers.ts` (broadcastState, message handling)
- Codebase analysis — `packages/client/package.json` (installed dependencies)
- SolidJS documentation — createStore, reconcile, reactive primitives

### Secondary (MEDIUM confidence)
- SolidJS patterns — CSS modules integration, component patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and configured
- Architecture: HIGH — follows established patterns from Phases 1-3
- Pitfalls: HIGH — based on known SolidJS patterns and project-specific data structures

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable stack, no moving targets)
