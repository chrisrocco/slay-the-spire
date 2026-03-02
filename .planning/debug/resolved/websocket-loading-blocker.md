---
status: resolved
trigger: "WebSocket connects but app stuck on 'Connecting to server...'"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - App has no mechanism to transition from 'connecting' phase after WebSocket opens
test: Traced full message flow from client connect through server handler to state transitions
expecting: N/A - root cause confirmed
next_action: Report findings

## Symptoms

expected: After WebSocket connects, app transitions from loading to lobby/game view
actual: App stays on "Connecting to server..." indefinitely despite WebSocket being open
errors: None (WebSocket connects successfully, hello/ping sent)
reproduction: Open the app in browser, observe it never leaves the loading spinner
started: Likely always broken - this is a missing feature/wiring issue

## Eliminated

- hypothesis: WebSocket fails to connect
  evidence: User confirms WS connects, hello/ping are sent and received
  timestamp: 2026-03-01

- hypothesis: Server sends response but client doesn't parse it
  evidence: Server sends NO proactive message on connection. ws.on('connection') only sets up heartbeat and message listener (server/src/index.ts:78-171). No welcome/init message is sent.
  timestamp: 2026-03-01

## Evidence

- timestamp: 2026-03-01
  checked: Client WebSocket service (packages/client/src/services/websocket.ts)
  found: ws.onopen sets a `connected` signal to true, but this signal is NEVER consumed by the app to trigger phase transition. The `connected` accessor is exported but unused in app.tsx.
  implication: WebSocket "connected" state is tracked but disconnected from app phase management

- timestamp: 2026-03-01
  checked: Client game store (packages/client/src/stores/gameStore.ts)
  found: AppPhase starts as 'connecting' (line 51). Phase only changes via handleServerMessage for these message types: ROOM_CREATED -> 'lobby', JOINED -> 'lobby', LOBBY_UPDATE (when connecting) -> 'lobby', STATE_UPDATE -> 'game'. No transition triggered by WebSocket open event itself.
  implication: Phase will stay 'connecting' forever unless server sends one of these specific messages

- timestamp: 2026-03-01
  checked: Client app.tsx
  found: "Connecting to server..." shown when phase === 'connecting' (line 45-51). Lobby UI shown when phase === 'lobby' (line 53-59). The lobby UI has room creation/join controls. onMount only calls connection.connect() and sets up message handler - no CREATE_ROOM or other init message sent.
  implication: User can never reach the lobby UI where they could create/join a room because phase never leaves 'connecting'

- timestamp: 2026-03-01
  checked: Server connection handler (packages/server/src/index.ts:78-171)
  found: On new WebSocket connection, server adds to aliveSet, sets up pong/message/close handlers. It sends NOTHING proactively to the client. It only responds to client messages (CREATE_ROOM, JOIN_LOBBY, RECONNECT, etc.)
  implication: Chicken-and-egg problem: client waits for server message to leave 'connecting', server waits for client message to send anything

- timestamp: 2026-03-01
  checked: Shared message schemas (packages/shared/src/schemas/messages.ts)
  found: No "WELCOME", "CONNECTED", or "HELLO" message type in either ClientMessage or ServerMessage schemas. There is no handshake protocol defined.
  implication: The connection handshake that would trigger state transition was never implemented

## Resolution

root_cause: |
  Chicken-and-egg deadlock in the connection flow:

  1. Client connects WebSocket and waits for a server message to transition
     phase from 'connecting' to 'lobby' (gameStore.ts:51, app.tsx:45-51)
  2. Server receives connection but sends nothing proactively - it only
     responds to client-initiated messages (server/src/index.ts:78-171)
  3. The lobby UI (with create/join room buttons) is only shown when
     phase === 'lobby', which requires a server message that never comes
  4. The WebSocket `connected` signal (websocket.ts:17,40) is exported
     but never used to drive the phase transition

  Result: permanent deadlock where both sides wait for the other.

fix: |
  Two viable approaches (choose one):

  **Option A (simplest): Transition to 'lobby' when WebSocket opens**
  In app.tsx, watch the `connection.connected()` signal and set phase to 'lobby':

  ```tsx
  // In App(), after onMount:
  import { createEffect } from 'solid-js';

  createEffect(() => {
    if (connection.connected()) {
      store.setPhase('lobby');
    } else if (store.state.phase !== 'game') {
      store.setPhase('connecting');
    }
  });
  ```

  **Option B (more robust): Server sends welcome message on connect**
  1. Add a WELCOME server message type to shared/src/schemas/messages.ts
  2. Server sends { type: 'WELCOME' } in wss.on('connection') callback
  3. Client handleServerMessage transitions to 'lobby' on WELCOME

  Option A is recommended as the minimal fix. Option B is better long-term
  but requires changes across 3 packages.

verification: Not yet applied
files_changed: []

### Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `packages/client/src/app.tsx` | 20-23, 45-51 | onMount does not trigger phase transition on connect; lobby UI gated behind 'lobby' phase |
| `packages/client/src/stores/gameStore.ts` | 51, 106-146 | Initial phase 'connecting' has no transition path from WebSocket open event |
| `packages/client/src/services/websocket.ts` | 17, 39-41, 98 | `connected` signal is created and exported but never consumed by app |
| `packages/server/src/index.ts` | 78-80 | No welcome/init message sent to newly connected clients |
| `packages/shared/src/schemas/messages.ts` | 44-52 | No WELCOME or CONNECTED message type defined |
