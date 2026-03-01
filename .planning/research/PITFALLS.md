# Pitfalls Research

**Domain:** Real-time multiplayer cooperative board/card game web app
**Researched:** 2026-03-01
**Confidence:** MEDIUM (multiple sources consulted; some findings from WebSearch without official doc verification)

---

## Critical Pitfalls

### Pitfall 1: Client-Side Game State Authority

**What goes wrong:**
Game logic runs on clients. Each player's browser becomes the authority for their own actions. Players can trivially cheat by manipulating their local state, sending impossible moves, or playing cards they don't have. Even without cheating, clients diverge over time as subtle differences in JavaScript execution order, floating-point math, or event timing cause state drift. Two players see different game states with no reconciliation.

**Why it happens:**
It feels simpler to just let each client resolve card effects locally and broadcast the results. Early prototypes work fine because nobody is adversarial. State drift appears as rare, hard-to-reproduce bugs rather than the fundamental architecture problem it actually is.

**How to avoid:**
The server is the single source of truth. Clients send *intents* (actions), not *outcomes*. The server validates every action against authoritative state, resolves it, and broadcasts the new canonical state to all clients. Clients render what the server tells them — they do not calculate outcomes locally. This means the game engine (damage calculation, status effect resolution, card effect execution) lives exclusively on the server in TypeScript, not duplicated in SolidJS components.

**Warning signs:**
- Game logic code appearing in SolidJS components or client-side stores
- Clients broadcasting "I dealt 12 damage" instead of "I played Bash"
- State computed differently on server vs. client
- Different players seeing different HP values for the same enemy

**Phase to address:**
Foundation / Architecture phase. The server-authoritative pattern must be established before any game logic is implemented. Retrofitting it later requires rewriting the entire game engine layer.

---

### Pitfall 2: Simultaneous Turn Race Conditions

**What goes wrong:**
Multiple players act simultaneously. Their WebSocket messages arrive at the Node.js server in an interleaved, non-deterministic order. The server processes action A from Player 1 (kills an enemy), then processes action B from Player 2 (attacks that same now-dead enemy). Result: undefined behavior, negative HP, double-trigger effects, or crashes. Node.js is single-threaded but async — two `await` chains can interleave on the same game room state.

**Why it happens:**
Developers trust that "JavaScript is single-threaded" means no race conditions. But async/await creates interleaving: two WebSocket message handlers can both `await` some operation and both access shared room state concurrently. The critical section between "read state" and "write state" is not atomic when any await is in between.

**How to avoid:**
Process all actions for a game room through a serialized queue. Each room maintains a message queue and a "processing" flag. When a message arrives, it is enqueued. A single async processor drains the queue one message at a time — no two messages for the same room are ever processed concurrently. Libraries like `async-mutex` can enforce this. The queue also enables deterministic replay for debugging.

**Warning signs:**
- Intermittent bugs only reproducible with multiple simultaneous players
- Enemy HP going negative
- Effects firing twice for a single trigger
- "Works fine in solo, breaks in 4-player"

**Phase to address:**
WebSocket / Networking phase. The serialized action queue must be built before implementing any combat mechanics, because all combat actions rely on it.

---

### Pitfall 3: Missing Reconnection Handling

**What goes wrong:**
A player's browser refreshes, their connection drops, or they navigate away. When they reconnect, they see a blank screen, a stale state snapshot, or are treated as a new player who has never joined. The other players' game becomes unresponsive or stuck because the system waits for the disconnected player to act. The game session is effectively destroyed by a single dropped connection.

**Why it happens:**
During early development, reconnection is deferred as "we'll handle that later." In practice, the game state is stored only in the WebSocket connection's closure — it doesn't survive disconnection. By the time reconnection is addressed, the session architecture doesn't cleanly support re-attaching a socket to an existing session.

**How to avoid:**
Design reconnection into the session model from day one. Each game session has a stable server-side ID. Each player slot has a stable slot ID that persists independent of the WebSocket connection. When a socket disconnects, mark the player as "disconnected" but preserve their slot and state. When they reconnect with their session token, restore their WebSocket reference, send them a full state snapshot, and resume. Set a generous timeout (e.g., 5 minutes) before treating the disconnect as permanent abandonment.

**Warning signs:**
- Game state stored as a property of the socket object (`socket.gameState`)
- No concept of "player slot" independent of "live connection"
- Reconnect triggers a fresh lobby join instead of resuming session
- Other players get frozen/stuck when one player disconnects

**Phase to address:**
WebSocket / Lobby phase. Session model with stable player slots must be established before any game logic. Retrofitting later requires changing every piece of code that references players by socket rather than by slot ID.

---

### Pitfall 4: Triggered Abilities Cause Infinite Loops or Missed Fires

**What goes wrong:**
A card effect triggers another effect, which triggers another. The engine has no cycle detection and calls stack until the process crashes (stack overflow or infinite loop). Alternatively, the engine processes effects eagerly during another effect's execution, mutating state mid-resolution and causing effects to fire at wrong times or not at all. In this game specifically: "start of combat" relics fire at the wrong time, Defect's passive orb abilities trigger when they shouldn't, or Poison ticks during the wrong phase.

**Why it happens:**
Effects are implemented as direct function calls: `card.play()` calls `applyPoison()` which emits an event which calls `checkDeathTriggers()` which calls `onDeath()` which modifies state that a still-executing loop is iterating over. This works for 80% of cases and fails subtly for the 20% involving chains.

**How to avoid:**
Implement a two-phase effect resolution system. Phase 1: collect all effects that should trigger given current state (do not execute them yet). Phase 2: execute them in defined order. Between phases, check for new triggers and queue them rather than executing immediately. Use an explicit queue/stack rather than recursive function calls. Establish a strict resolution order: start of turn → player actions → end of turn → enemy phase → end of round. No effect is allowed to interrupt another executing effect; it must wait in the queue.

**Warning signs:**
- Effects implemented with direct recursive calls (`triggerEffect` → `triggerEffect`)
- No explicit trigger queue or resolution stack
- Status effect timing being wrong (Poison ticking mid-player-turn)
- Relic "start of combat" effects firing before characters are initialized

**Phase to address:**
Combat Engine phase. Design the trigger/effect queue architecture before implementing any cards with triggered abilities. Cards without triggers can come first, but the queue must be in place before any relic or status effect implementation.

---

### Pitfall 5: Inconsistent Status Effect Stacking Rules

**What goes wrong:**
The board game has specific, non-uniform stacking rules: Vulnerable and Weak cap at 3, Poison caps at 30, Strength caps at 8, Block caps at 20, etc. Some effects add on application (Poison, Strength), some do not stack (Barricade-style), and some reset rather than stack. Developers implement a generic "add value" pattern and apply it to all status effects. The caps are missed entirely or implemented inconsistently across different card effects. Multiplayer amplifies this because multiple players can apply the same status effect in the same resolution window.

**Why it happens:**
Effects are added incrementally by card — the Ironclad's card adds Strength correctly, then three cards later someone adds a new Vulnerable application that ignores the cap because it was coded independently. No central status effect registry enforces rules.

**How to avoid:**
Model each status effect as a typed object with its own apply/tick/remove rules defined once, centrally. `applyVulnerable(target, amount)` is the only way to apply Vulnerable anywhere — it enforces the cap of 3, handles existing stacks, and emits the correct events. Card effects call these central functions; they do not directly mutate status counts. Write the status effect registry with all board game caps before implementing any card that uses status effects.

**Warning signs:**
- Status effect values mutated directly from card effect code (`enemy.vulnerable += 2`)
- No single source of truth for what caps each status effect
- Different cards applying the same status with different cap logic
- Status effects that should tick not ticking, or ticking multiple times per turn

**Phase to address:**
Combat Engine / Status Effects phase. Build the complete status effect registry (all effects with correct caps and stacking rules) before implementing any card that applies or checks status effects.

---

### Pitfall 6: In-Memory State Leaked Between Sessions

**What goes wrong:**
When a game ends or all players disconnect, the game room object is not cleaned up. Over hours of operation, memory fills with dead sessions, dead timers, and accumulated event listeners. Node.js heap grows until the process crashes or becomes unresponsive. With 4-player games running for 1-2 hours, even a small leak per session compounds quickly.

**Why it happens:**
Session cleanup is not a feature anyone tests for. The happy path (game completes successfully) may clean up correctly. Edge cases — all players disconnect mid-game, game crashes due to a bug, browser tab closed — leave orphaned state. Timers (reconnection timeouts, turn timers) that reference the room object prevent garbage collection even after the Map entry is deleted.

**How to avoid:**
Every game room has an explicit `destroy()` method called on all exit paths: game complete, all players disconnected, timeout. The `destroy()` method clears all timers (`clearTimeout`, `clearInterval`), removes all event listeners added by the room, removes the room from the global rooms Map, and nulls internal references. Track all timers created by the room in an array for cleanup. Write a test that creates and destroys 100 sessions and verifies memory does not grow.

**Warning signs:**
- No explicit room/session `destroy()` function
- Timers created with `setTimeout`/`setInterval` without tracking for cleanup
- Node.js process memory growing over multiple game sessions
- Event listeners added to shared emitters without corresponding removal on session end

**Phase to address:**
WebSocket / Session Management phase. Build cleanup into the session lifecycle from the first implementation.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Duplicating game logic on client for "instant feedback" | Responsive UI | State drift, cheating vector, two codepaths to maintain | Never for game-critical logic; acceptable only for purely cosmetic animations |
| Using socket ID as player identifier | Simple | Breaks on reconnect; no session persistence | Never — use stable player slot IDs from day one |
| Mutating game state directly from WebSocket handlers | Easy to write | Race conditions on any async operation | Never — always route through serialized action queue |
| Implementing each card's effects inline (no shared primitives) | Faster first cards | Inconsistent behavior, no way to fix a bug in one place | Never — build primitives (dealDamage, applyStatus) first |
| Skipping turn phase validation ("if wrong phase, just ignore") | Simpler branching | Obscures bugs; illegal actions silently succeed | Never — reject illegal actions with explicit error messages |
| Broadcasting full state on every change | Simple to implement | Fine at 4 players; not necessary to optimize | Acceptable for v1 given the player cap of 4 |

---

## Integration Gotchas

Common mistakes when connecting components of this system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SolidJS Store + WebSocket | Receiving server state and mutating store properties directly in message handlers outside any tracking scope — reactivity silently fails | Update stores only inside `batch()` calls to ensure all reactive effects see a consistent state snapshot |
| SolidJS Store + WebSocket | Replacing the entire game state object on each server message, causing all components to re-render | Use Solid's `reconcile()` or `produce()` to patch only changed parts of the store — preserves fine-grained reactivity |
| SolidJS + async effects | Using `createEffect` to kick off async operations that reference signals — the signal is only tracked synchronously | Capture signal values synchronously inside the effect before any `await`; or use `on()` to explicitly declare dependencies |
| WebSocket + Node.js event handlers | Adding `socket.on('message', handler)` inside a per-request scope without removing on disconnect — each reconnect stacks another listener | Track and remove listeners on disconnect with `socket.off()` using named handler references |
| Game action queue + WebSocket | Awaiting inside the queue processor on a Promise that never resolves (e.g., waiting for a player UI response) — queue stalls for all players | Timeout all user-response waits; never block the queue indefinitely |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Broadcasting full game state JSON on every card play | Noticeable input lag for complex states | Acceptable for v1 with 4 players; profile if state exceeds ~50KB | Not a concern at v1 scale (4 players, in-memory) |
| Deep-cloning game state for immutability on every action | High GC pressure, memory spikes during combat | Use structural sharing / Immer-style produce; only clone mutated subtrees | At moderate action frequency with large state trees |
| Storing all game history in memory for replay/undo | Memory grows linearly with game length | Store only current state for v1; add log as ring buffer if needed | Not a concern for v1 given no persistence requirement |
| Synchronous JSON.stringify of large state in WebSocket send | Blocks event loop, causes latency spike | Stream state diffs rather than full snapshots | Not a concern at 4-player scale but bad habit to start |

---

## Security Mistakes

Domain-specific security issues for this multiplayer game.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-sent action payloads without validation | Cheat: play cards not in hand, deal arbitrary damage, skip enemy turns | Server validates every action: card must be in hand, player must have enough energy, it must be the correct phase |
| Accepting card IDs from clients that don't exist in the card registry | Server crash (null reference) or exploit (invent powerful cards) | Look up all card data server-side by ID from the authoritative registry; never accept client-provided card stat values |
| Exposing full game state to all clients including hidden information | If future mechanics add hidden information, trivial to cheat | Filter state per-player: only send what each player is entitled to see. For v1 (cooperative, no hidden info) this is less critical but establishes the correct pattern |
| No rate limiting on WebSocket messages | DoS via message flood; bad actor can spam actions and stall the server | Limit actions per player per second; reject excess with a rate-limit error |
| Session join with no lobby code validation | Anyone can join any active game by guessing a short code | Use cryptographically random lobby codes (6-8 chars from large charset) and expire them after use |

---

## UX Pitfalls

Common user experience mistakes in multiplayer board game web apps.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication of what other players are doing during simultaneous turns | Players feel disconnected; nobody knows if others are ready or still playing cards | Show live status per player: cards played count, energy remaining, "ready" indicator; animate card plays in near-real-time |
| Waiting silently when it's the "enemy resolution phase" | Players think the game froze | Show explicit phase banners: "Players resolving...", "Enemy phase...", "Round complete" |
| No undo / confirmation on irreversible actions | Misclick leads to card being played unintentionally — devastating in a cooperative game | Confirm destructive actions (exhaust, discard); or show a brief undo window before committing to server |
| Lobby code is invisible after game starts | Player who needs to share the code with a friend can't find it | Persist lobby code display in game UI |
| Card text is only readable when played — no way to inspect hand cards | Players can't plan or read effect text during others' turns | Implement card detail view accessible from hand at any time |
| No indication that your "End Turn" was received | Player mashes End Turn button, causes duplicate sends or confusion | Disable/grey the button and show "Waiting for others..." immediately on click |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Combat resolution:** Often missing correct multi-hit Vulnerable/Weak interaction — verify that Vulnerable applies per-hit on multi-hit attacks, not once per card
- [ ] **Die roll system:** Often missing correct relic interaction ordering — verify die relics fire before enemy actions that use the die result
- [ ] **Status effects:** Often missing end-of-turn tick ordering — verify Poison ticks in correct phase (end of player turn or start of enemy turn per board game rules)
- [ ] **Simultaneous turn "End Turn":** Often missing the case where Player A ends turn while Player B is mid-play — verify partial state during resolution is handled correctly
- [ ] **Reconnect:** Often missing the "rejoin during active combat" case — verify a reconnecting player gets correct current phase state, not just lobby state
- [ ] **Enemy summon system:** Often missing the case where a summoned enemy itself has triggered abilities — verify summoned enemies are fully initialized before any effects fire on them
- [ ] **Orb evoke (Defect):** Often missing that the board game allows evoking any orb regardless of channel order — verify this differs from video game rules
- [ ] **Card exhaust:** Often missing that exhausted cards are removed from all future draws for the run (not just the combat) — verify exhaust is permanent
- [ ] **Room cleanup:** Often missing that the rooms Map has the dead session removed — verify memory after 10 completed games
- [ ] **Lobby full:** Often missing race condition where two players both join the last slot simultaneously — verify the 4-player limit is enforced atomically

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Client-side authority (implemented wrong) | HIGH | Rewrite game engine to server-only; strip all game logic from client components; clients become pure renderers |
| Missing action queue (race conditions in prod) | MEDIUM | Wrap all game room action handlers in a per-room serialization mutex; can be added without rewriting game logic |
| No reconnection support | MEDIUM | Separate socket ID from player slot ID; add state snapshot endpoint; requires touching all player-reference code |
| Triggered ability infinite loop | MEDIUM | Add cycle detection (max depth counter) as emergency fix; proper fix requires refactoring to explicit queue |
| Status effect cap bugs | LOW | Fix the central status effect registry functions; all cards that use them get the fix automatically |
| Memory leak (sessions not cleaned up) | LOW | Add `destroy()` method with explicit cleanup; call from all exit paths; add a periodic sweep for sessions idle >30 min |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Client-side game state authority | Foundation / Architecture | All game outcome calculations exist only in server-side TypeScript; SolidJS components have zero game logic |
| Simultaneous turn race conditions | WebSocket / Networking | Load test with 4 bots spamming simultaneous actions; no state inconsistency |
| Missing reconnection handling | WebSocket / Lobby | Disconnect mid-combat and reconnect; game continues correctly for all players |
| Triggered ability loops/missed fires | Combat Engine | Full triggered ability test suite; all relic triggers fire exactly once at correct phase |
| Inconsistent status effect stacking | Combat Engine / Status Effects | Test: apply Vulnerable 5 times; verify cap of 3 enforced; test all capped effects |
| In-memory state leaked between sessions | Session Management | Create and destroy 50 game sessions; Node.js heap size does not grow |
| SolidJS store reactivity failures | Frontend / UI | All game state changes visible in UI without manual refresh; no stale renders |
| UX confusion during simultaneous turns | Frontend / UI | Playtest with 4 players; nobody is confused about current phase or others' status |

---

## Sources

- [Game Networking Demystified, Part I: State vs. Input](https://ruoyusun.com/2019/03/28/game-networking-1.html) — state vs. input synchronization tradeoffs (MEDIUM confidence)
- [Building Scalable Real-Time Multiplayer Card Games — DEV Community](https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6) — card game-specific server authority patterns (MEDIUM confidence)
- [Multiplayer Sync in 2025: WebTransport — Markaicode](https://markaicode.com/webtransport-multiplayer-games-2025/) — WebSocket race condition overview (LOW confidence, WebSearch only)
- [Card Game Design as Systems Architecture — CritPoints](https://critpoints.net/2023/05/26/card-game-design-as-systems-architecture/) — event system and triggered ability architectural patterns (MEDIUM confidence)
- [MiniSTS — GitHub](https://github.com/iambb5445/MiniSTS) — Slay the Spire simplified implementation; effect/status system design (MEDIUM confidence)
- [A Status Effect Stacking Algorithm — Game Developer](https://www.gamedeveloper.com/design/a-status-effect-stacking-algorithm) — stacking and cap implementation (MEDIUM confidence)
- [SolidJS Stores — Official Docs](https://docs.solidjs.com/concepts/stores) — reactivity pitfalls with nested state (HIGH confidence)
- [SolidJS Batching — Official Tutorial](https://www.solidjs.com/tutorial/reactivity_batch) — batch update patterns (HIGH confidence)
- [Connection State Recovery — Socket.IO Docs](https://socket.io/docs/v4/connection-state-recovery) — WebSocket reconnection strategies (HIGH confidence)
- [Node.js Race Conditions — NodeJS Design Patterns Blog](https://nodejsdesignpatterns.com/blog/node-js-race-conditions/) — async mutex patterns for Node.js (MEDIUM confidence)
- [Handle Race Conditions Using Mutex — Theodo Blog](https://blog.theodo.com/2019/09/handle-race-conditions-in-nodejs-using-mutex/) — mutex implementation patterns (MEDIUM confidence)
- [Avoiding Memory Leaks in Node.js — AppSignal](https://blog.appsignal.com/2020/05/06/avoiding-memory-leaks-in-nodejs-best-practices-for-performance.html) — timer and listener cleanup patterns (MEDIUM confidence)
- [Concurrency in Cooperative Board Games — Coopgestalt](https://coopgestalt.com/2020/04/08/concurrency-in-cooperative-board-and-card-games/) — simultaneous action edge cases in cooperative games (MEDIUM confidence)

---
*Pitfalls research for: Real-time multiplayer cooperative board/card game (Slay the Spire board game web adaptation)*
*Researched: 2026-03-01*
