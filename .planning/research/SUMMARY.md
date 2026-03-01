# Project Research Summary

**Project:** Slay the Spire Board Game — Online Multiplayer Web App
**Domain:** Real-time multiplayer cooperative board/card game (web)
**Researched:** 2026-03-01
**Confidence:** MEDIUM

## Executive Summary

This project is a faithful digital adaptation of the Slay the Spire cooperative board game for 1-4 players in the browser, built without a database, accounts, or download requirement. Research across the four domains converges on a clear architectural verdict: authoritative server, dumb client. All game logic — card validation, damage calculation, enemy AI, status effect resolution — lives exclusively in a Node.js/TypeScript server. The SolidJS client renders whatever the server broadcasts and sends player intent messages back. This is not a style preference; it is a structural requirement. Client-side game logic causes state divergence in multiplayer that cannot be patched after the fact.

The primary differentiator versus the current benchmark (the Tabletop Simulator official mod) is full rule enforcement and automated enemy AI. The TTS mod requires players to self-referee every rule and manually execute every enemy action. A rules-enforced, automated implementation eliminates the two biggest pain points the community has documented. Every architectural and feature decision should reinforce this advantage: the complex parts (combat resolution, triggered abilities, status effects) must be correct before the UI is polished.

The critical risks are architectural mistakes that are expensive to fix mid-build. Using a socket ID as a player identifier will break reconnection. Skipping a serialized action queue will produce race conditions that only manifest with multiple simultaneous players. Implementing card effects inline rather than through a shared primitives layer will cause inconsistent status effect behavior that must be hunted down individually. All three of these must be addressed in the foundation phases — retrofitting them later costs far more than doing them right the first time.

## Key Findings

### Recommended Stack

The stack is SolidJS 1.9.x on the client (pre-decided), Node.js 22 LTS on the server, `ws` for raw WebSockets, and Zod v4 for message validation at the WebSocket boundary. The monorepo uses pnpm workspaces with a `packages/shared` that holds Zod schemas and TypeScript types for the message protocol — both client and server import from shared, which eliminates protocol drift. TypeScript 5.9.x strict mode is required across all packages. Vite 7.x with `vite-plugin-solid` drives the client build; `tsx watch` drives the dev server.

The key stack decision is the rejection of Socket.IO and Colyseus in favor of raw `ws`. For a 1-4 player browser-only cooperative game, both frameworks add bundle weight and schema overhead that provide no value at this scale. SolidJS's built-in `createStore` + `reconcile` is the correct client state pattern: receive full state snapshots from the server, use `reconcile` to diff and patch the store, let fine-grained reactivity handle re-renders.

**Core technologies:**
- SolidJS 1.9.11 + `createStore`/`reconcile`: reactive UI + client state — fine-grained reactivity maps directly onto server state snapshots
- Node.js 22 LTS + TypeScript 5.9.x: server runtime — LTS stability, strict types eliminate protocol bugs
- `ws` 8.18.x: WebSocket server — zero-dependency, no framework overhead needed for 1-4 players
- Zod 4.x: message validation at WebSocket boundary — schemas serve as the canonical protocol definition, 100x faster type instantiation than v3
- pnpm workspaces: monorepo structure — `packages/shared` for types without a build step
- `@solid-primitives/websocket` 1.3.x: client WebSocket — handles reconnection and heartbeat without boilerplate
- vitest 4.x: testing — game logic functions are pure TypeScript, testable without browser or server

### Expected Features

The MVP is defined as what a group of friends needs to play a full Act 1 session. The biggest UX win is that everything the TTS mod requires players to do manually — roll dice, move enemy cards, count status tokens, find reward cards — is automated. The feature set can be grouped by dependency: room/lobby infrastructure comes first, real-time sync infrastructure second, game mechanics third, UI polish last.

**Must have (table stakes):**
- Room code + nickname-only join — zero friction entry; no account required
- Real-time WebSocket sync of all game state — the spine everything else depends on
- Visual player boards with hand, energy, HP, block, discard count
- Card tooltip showing full card text — 85+ cards, players cannot memorize them
- End Turn / Ready signal with visible per-player ready status
- Automated enemy AI resolution (single/die/cube actions, row targeting)
- Automated die rolling with result broadcast to all players
- Automated status token tracking with board game caps enforced
- In-game text chat
- Action log / event feed
- Visual map with node types, current position, available paths
- Reward phase UI (card choice, gold, relics, potions)
- Win / lose state detection and display
- Disconnect grace period + rejoin to running game

**Should have (competitive differentiators):**
- Rules-enforced automated play — the single biggest differentiator vs. TTS mod
- Character-specific UI regions (Defect orb slots, Watcher stance, etc.)
- Card hand visibility to teammates toggle
- Animated card effects (damage pop-ups, status flashes)
- Integrated optional rules toggles in lobby (Last Stand, Choose Your Relic)

**Defer (v2+):**
- Persistent accounts / win tracking — requires auth infrastructure
- Acts 2, 3, 4 — explicitly out of scope for v1
- Ascension system — meta-progression
- Spectator mode — non-trivial permission scoping
- Mobile-optimized layout
- Asynchronous / save-and-resume play

### Architecture Approach

The system is a classic authoritative server pattern: one Node.js process holding a `Map<gameId, GameState>` as the source of truth. Clients send intent messages (PLAY_CARD, END_TURN); the server validates, applies, and broadcasts full GameState snapshots to all players in the room. The client has no game logic — it is a reactive view of server state. This keeps multiplayer rule consistency trivial and makes bugs in one place to fix. For 1-4 players with game state under 200KB per session, full-state broadcasting is the correct default — no delta patching needed for v1.

**Major components:**
1. Shared message types (`packages/shared`) — the protocol contract; everything builds on this
2. Lobby Manager (server) — room codes, player slots (stable, not socket-tied), character selection
3. Game Engine (server, pure functions) — card validation, combat resolution, enemy AI, status effects, turn phases; testable in isolation
4. In-Memory Game Store (server) — `Map<gameId, GameState>` with explicit session `destroy()` lifecycle
5. WebSocket Server + Message Router (server) — connection management, per-room serialized action queue
6. SolidJS Client Store + WebSocket Manager (client) — reactive store updated by server messages via `reconcile`
7. SolidJS UI Components (client) — pure rendering layer; no game logic

**Build order** dictated by dependencies: shared types first, then game data and GameState types, then the game engine (pure functions, testable without networking), then the lobby and store, then WebSocket networking, then the client store, then UI components.

### Critical Pitfalls

1. **Client-side game state authority** — any game logic in SolidJS components or client stores causes multiplayer state divergence. Clients send intents only; server computes all outcomes. Address in the foundation phase before any game logic is written.

2. **Simultaneous turn race conditions** — two players' WebSocket messages processed concurrently on the same game room state cause non-deterministic bugs (negative HP, double-trigger effects) that only appear in multiplayer. Serialize all actions for each room through a per-room message queue before implementing any combat mechanics.

3. **Missing reconnection support** — storing player identity in the socket object (socket ID as player ID) breaks on any disconnect. Player slots must be stable server-side IDs independent of the live WebSocket connection from day one.

4. **Triggered ability loops / missed fires** — effects calling effects recursively without a queue cause stack overflows or effects firing at wrong phases. Build a two-phase trigger resolution system (collect triggers, then execute in defined order) before implementing any relics or status effects.

5. **Inconsistent status effect stacking** — cap rules (Vulnerable max 3, Poison max 30, Strength max 8, etc.) applied inconsistently per-card instead of through a central registry create bugs that must be hunted individually. Build the complete status effect registry with all caps before implementing any card that uses status effects.

6. **In-memory state leaked between sessions** — game rooms without explicit `destroy()` methods accumulate as dead sessions, growing the Node.js heap. Every session lifecycle exit path must call `destroy()` which clears all timers and removes from the rooms Map.

## Implications for Roadmap

Based on the combined dependency chains from FEATURES.md and the build order from ARCHITECTURE.md, six phases emerge. The ordering is driven by three principles: (1) shared contract before any implementation, (2) server-side pure logic before networking, (3) networking before UI.

### Phase 1: Foundation — Monorepo, Shared Types, Game Data
**Rationale:** Every subsequent component imports from shared types and reads from the game data registry. Nothing can be built without this contract. Card data extraction (from reference images/rulebook) must happen here because card validation, tooltip display, and reward phase all depend on structured card definitions.
**Delivers:** pnpm workspace scaffold, TypeScript configs, Zod message schemas, `GameState` type definitions, card/enemy/relic data files for Act 1 (all 4 characters, all Act 1 enemies, all relics)
**Addresses:** Card data prerequisite noted in FEATURES.md dependency graph
**Avoids:** Protocol drift between client and server; card effects implemented before card data exists

### Phase 2: Game Engine — Pure Combat Logic (No Networking)
**Rationale:** The game engine is the highest-complexity, highest-risk component. Building it as pure TypeScript functions (`GameState in → GameState out`) before adding WebSocket networking means it can be unit-tested exhaustively without a running server or browser. All combat rules, turn phases, status effects, and enemy AI live here.
**Delivers:** `combatEngine.ts`, `enemyAI.ts`, `effectsEngine.ts`, `turnManager.ts`, status effect registry with all caps, vitest test suite for all card effects and status interactions
**Addresses:** Rules-enforced play (primary differentiator), automated enemy AI, status token tracking
**Avoids:** Pitfalls 4 (trigger loops) and 5 (status stacking inconsistency) — both must be designed here
**Research flag:** Needs deeper research on exact board game rule interactions (Vulnerable/Weak multi-hit, orb evoke rules, enemy summon initialization order, exhaust permanence)

### Phase 3: Session Management — Lobby, WebSocket, Reconnection
**Rationale:** Networking connects the game engine to players. The session model (stable player slots, room codes, serialized action queue) must be established before any multiplayer game action can be tested end-to-end.
**Delivers:** Lobby Manager with room codes and player slots independent of socket IDs, WebSocket server with per-room serialized action queue, reconnection support (grace period, full state resync on rejoin), session `destroy()` lifecycle
**Addresses:** Room code / invite link, disconnect detection and rejoin, no-account join
**Avoids:** Pitfalls 2 (race conditions), 3 (reconnection), and 6 (memory leak) — all must be addressed here

### Phase 4: SolidJS Client — Store, WebSocket Manager, Core UI
**Rationale:** With the server fully functional, the client can be built as a pure rendering layer. The store mirrors server state; the WebSocket manager updates it via `reconcile`. Core game UI components — player boards, enemy row, action log, chat, turn indicators — bring the game to a playable state.
**Delivers:** SolidJS `createStore` game store, WebSocket client with reconnect via `@solid-primitives/websocket`, message handler routing server messages to store, player board components, enemy row, action log, in-game chat, End Turn / Ready signal UI, turn/phase indicators, win/lose overlay
**Addresses:** Visual player boards, real-time game state sync, in-game text chat, End Turn signal, waiting states, action log
**Avoids:** Pitfall of SolidJS reactivity failures — use `batch()` and `reconcile()` correctly; never compute game outcomes client-side

### Phase 5: Game Flow UI — Map, Lobby, Reward Phase, Full Act 1
**Rationale:** Once combat works end-to-end, the meta-game layer (lobby flow, map navigation, reward selection, all room types) must be wired together to support a complete Act 1 session.
**Delivers:** Lobby UI with character selection and optional rules toggles, visual map with node types and path selection, reward phase UI (card choice, gold, relic reveal), all room type handlers (encounter, elite, boss, event, campfire, treasure, merchant), card tooltip implementation, Neow blessing selection
**Addresses:** Visual map navigation, reward phase UI, optional rules toggles, card tooltip, character selection
**Avoids:** Reward phase / map state conflict — combat must fully close before map advances (per FEATURES.md dependency note)
**Research flag:** Board game event and merchant card text needs verification against official rulebook

### Phase 6: Polish — Differentiators, Animations, Stability
**Rationale:** After a full Act 1 session is playable, differentiation and polish can be added without risk of foundational rework.
**Delivers:** Character-specific UI regions (Defect orb slots, Watcher stance, shiv tracker), card hand visibility toggle for teammates, CSS transitions for card play and damage pop-ups, animated die roll, keyboard shortcuts for End Turn and card play, lobby code persistent in game header, rate limiting on WebSocket messages
**Addresses:** Animated card effects, character-specific UI, hand visibility toggle, security mistakes from PITFALLS.md

### Phase Ordering Rationale

- **Data before logic, logic before network, network before UI:** The dependency chain from ARCHITECTURE.md's build order section maps directly onto phases 1-4. Skipping ahead violates the chain.
- **Game engine isolated before integration:** Pitfall 1 (client-side authority) is avoided by building and testing the engine as pure functions first, making it structurally impossible to accidentally duplicate logic in the client.
- **Session model before game mechanics:** Pitfall 2 (race conditions) and Pitfall 3 (reconnection) both require the serialized queue and stable player slots to exist before any combat action is processed. These are Phase 3, before any end-to-end multiplayer testing.
- **Full Act 1 before polish:** The differentiating value is a complete, correct implementation. A half-correct game with animations is worse than a fully-correct game without them.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Game Engine):** The exact rule interactions for the Slay the Spire board game require verified source material — the official rulebook, not the video game. Key gaps: Vulnerable/Weak per-hit vs. per-card application, Defect orb evoke order (board game differs from video game), enemy summon initialization sequence, exact status effect caps for all statuses, Poison tick phase (end of player turn vs. start of enemy turn), exhaust permanence across combats.
- **Phase 5 (Game Flow):** Event card and merchant card text for Act 1 needs to be sourced from the physical rulebook or official card reference. TTS mod assets may not be legally usable.

Phases with standard patterns (research not required):
- **Phase 1 (Foundation):** pnpm workspace + TypeScript + Vite + SolidJS is well-documented; all versions are current stable.
- **Phase 3 (Session Management):** Authoritative server + reconnection + serialized action queue are well-documented patterns with high-confidence sources.
- **Phase 4 (SolidJS Client):** SolidJS store + `reconcile` + WebSocket primitive is documented in official SolidJS docs.
- **Phase 6 (Polish):** CSS animations and accessibility patterns are well-known; no research phase needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack (SolidJS, Node.js, ws, Zod, pnpm) HIGH confidence from official docs. Specific patch versions (1.9.11, 7.3.1, etc.) MEDIUM — npm pages, not directly verified via package manager. |
| Features | MEDIUM | Feature set consistent across multiple platform comparisons (BGA, TTS, Tabletopia). TTS mod pain points confirmed by community sources. Anti-feature rationale (undo complexity, async architecture) is solid. |
| Architecture | MEDIUM | Core patterns (authoritative server, full-state broadcast, simultaneous turn commit) are well-supported. SolidJS-specific game integration is LOW confidence — limited documented examples of SolidJS used for real-time multiplayer games specifically. |
| Pitfalls | MEDIUM | Race condition and reconnection pitfalls are well-sourced. Status effect and trigger loop pitfalls are supported by STS-specific implementations found in research. Memory leak and session cleanup patterns are standard Node.js guidance. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Board game rule source of truth:** No primary source for the exact Slay the Spire board game rules was available during research. Implementation must be validated against the physical rulebook. The video game (and any implementations derived from it) has different rules from the board game for several mechanics (orb evoke order, Watcher stances, relic interactions). Flag for Phase 2 planning.
- **Card and enemy data extraction:** Structured card data for all 4 characters and all Act 1 enemies does not yet exist in machine-readable form. This must be created in Phase 1 before game logic can be implemented. Complexity is unknown — estimate 85+ cards per character plus enemy card data.
- **SolidJS game integration examples:** No high-confidence documented examples of SolidJS used for real-time multiplayer games were found. The `reconcile` + `createStore` approach is the correct idiomatic pattern, but integration edge cases (store update ordering, batching during rapid WebSocket messages) may surface during Phase 4 that require experimentation.
- **Act 1 completeness scope:** The full scope of Act 1 — number of event cards, merchant inventory, number of elite/boss enemies, Neow blessings — was not enumerated during research. Phase 5 scope depends on this.

## Sources

### Primary (HIGH confidence)
- [SolidJS official docs — stores, reconcile, context](https://docs.solidjs.com/concepts/stores)
- [SolidJS batching tutorial](https://www.solidjs.com/tutorial/reactivity_batch)
- [Zod v4 official release notes](https://zod.dev/v4)
- [pnpm workspace docs](https://pnpm.io/workspaces)
- [ws WebSocket library — GitHub](https://github.com/websockets/ws)
- [Game Programming Patterns — Command and Event Queue](https://gameprogrammingpatterns.com/)
- [Colyseus docs — architectural patterns reference](https://docs.colyseus.io/)
- [Socket.IO connection state recovery docs](https://socket.io/docs/v4/connection-state-recovery)

### Secondary (MEDIUM confidence)
- [SolidJS GitHub releases](https://github.com/solidjs/solid/releases)
- [Vite releases page](https://vite.dev/releases)
- [Solid Primitives websocket package](https://primitives.solidjs.community/package/websocket/)
- [STS:TBG TTS Official Mod (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=2884027954)
- [STS:TBG TTS Improvements Mod (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=2916329543)
- [Board Game Arena — live platform analysis](https://en.boardgamearena.com/)
- [BGA Undo Policy](https://en.boardgamearena.com/doc/BGA_Undo_policy)
- [MiniSTS GitHub — STS effect/status system reference](https://github.com/iambb5445/MiniSTS)
- [Node.js race conditions — NodeJS Design Patterns Blog](https://nodejsdesignpatterns.com/blog/node-js-race-conditions/)
- [Avoiding Memory Leaks in Node.js — AppSignal](https://blog.appsignal.com/2020/05/06/avoiding-memory-leaks-in-nodejs-best-practices-for-performance.html)
- [A Status Effect Stacking Algorithm — Game Developer](https://www.gamedeveloper.com/design/a-status-effect-stacking-algorithm)
- [Gabriel Gambetta — Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)

### Tertiary (LOW confidence — findings need validation during implementation)
- [Platform comparison: Tabletopia vs TTS vs BGA](https://kick.agency/news/online-board-games-4-best-places-to-play/)
- [Card game UI design lessons — Medium](https://medium.com/@acbassettone/5-ux-ui-lessons-from-designing-a-card-game-b689d3f3187)
- [Game Networking Fundamentals 2025 — generalistprogrammer.com](https://generalistprogrammer.com/tutorials/game-networking-fundamentals-complete-multiplayer-guide-2025)
- [Multiplayer Sync in 2025: WebTransport — Markaicode](https://markaicode.com/webtransport-multiplayer-games-2025/)
- [Simultaneous Turns — rasie1's blog](https://kvachev.com/blog/posts/simultaneous-turns/)

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
