# Stack Research

**Domain:** Real-time multiplayer board/card game web app
**Researched:** 2026-03-01
**Confidence:** MEDIUM-HIGH (core stack HIGH; version-specific patch numbers LOW for items not verified via official npm)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SolidJS | 1.9.11 | Frontend UI framework | Pre-decided. Fine-grained reactivity without VDOM diffing makes game state updates (card plays, HP changes, status effects) fast with zero extra configuration. `createStore` + `reconcile` pattern maps directly onto authoritative server state pushes. |
| TypeScript | 5.9.x | Typed language for both client and server | Stable release (6.0 is still in beta as of March 2026). Strict mode + shared types across packages eliminates a category of client/server protocol bugs. Game logic with 85+ cards and complex state transitions benefits enormously from type checking. |
| Node.js | 22 LTS | Backend runtime | LTS with long support window. Non-blocking event loop handles 1-4 WebSocket connections trivially. Native TypeScript support improving (tsx runner covers rest). |
| Vite | 7.x | Frontend build tool / dev server | Current stable (7.3.1 as of March 2026). Fastest HMR available; SolidJS has first-class `vite-plugin-solid` support. Aligns with vitest for unified config. |
| vite-plugin-solid | 2.11.x | SolidJS/Vite integration | Official plugin from solidjs org. Required to transform SolidJS JSX. Version 2.11.10 includes Vite 6/7 compatibility fixes. |

### WebSocket Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| ws | 8.18.x | WebSocket server on Node.js | Lowest-overhead raw WebSocket library for Node.js. No framework overhead, no fallback polling, no magic. For a 1-4 player game where every client is a modern browser, raw WebSockets via `ws` is sufficient. Avoids Socket.IO's ~45KB client bundle and reconnection complexity you'd have to fight around. Weekly downloads in the tens of millions; zero dependencies. |
| @types/ws | 8.18.x | TypeScript types for ws | Required for full type safety on the server. Install as dev dependency. |
| @solid-primitives/websocket | 1.3.x | Reactive WebSocket client primitive for SolidJS | Provides `createReconnectingWS` and `makeHeartbeatWS` — handles reconnection and heartbeat without manual implementation. Returns a `message` signal accessor you can drive reactive state updates from. Eliminates boilerplate event listener wiring. |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SolidJS built-in `createStore` + `reconcile` | (solid-js 1.9.x) | Client-side game state | No external state library needed. `createStore` makes nested reactive state (player HP, card hands, enemy states). `reconcile` does deep diff when applying server state snapshots — only rerenders what changed. This is exactly the correct pattern for authoritative server + replicated client state. |
| In-memory plain objects (server) | — | Authoritative game state on server | No Redux, no MobX, no state machine library needed server-side for v1. TypeScript interfaces + plain objects + explicit mutation functions. Complexity belongs in the game logic, not the state container. Add XState if the turn/phase state machine gets unwieldy. |

### Validation & Shared Types

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | 4.x | Runtime message validation at WebSocket boundary | v4.3.6 is current stable (released 2025). Validate incoming WebSocket messages on the server before processing. Also validates client→server messages. `z.infer<>` generates TypeScript types from schemas — the canonical source of truth for the WS protocol. Zod v4 is 100x faster at type instantiation than v3. |

### Project Structure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| pnpm workspaces | 9.x | Monorepo package manager | Enables `packages/shared` for game types/constants shared between client and server without a build step (live types via `workspace:*` protocol). Faster than npm, stricter hoisting than yarn, correct symlink handling for monorepos. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx | Run TypeScript server without compile step (dev) | Used as Node.js runner: `tsx watch src/index.ts`. Wraps esbuild for fast TS stripping. For production, compile with `tsc` or `esbuild` to plain JS. |
| vitest | Unit testing (game logic + frontend) | v4.x current. Integrates with Vite config. Use `@solidjs/testing-library` for component tests. Game logic (card effects, damage calculation, state transitions) should be tested as pure TypeScript functions — no DOM needed. |
| @solidjs/testing-library | Latest | SolidJS component testing | The official testing utility. Works with vitest. Use `renderHook` for testing reactive hooks/contexts without full component renders. |
| ESLint + Prettier | Code quality | Flat config ESLint for 2025. TypeScript-ESLint for type-aware rules. Prettier for formatting. |
| TypeScript strict mode | Compile-time safety | Enable `"strict": true`, `"noUncheckedIndexedAccess": true`. Card arrays and player slots are indexed — unchecked access causes subtle bugs. |

---

## Installation

```bash
# Initialize pnpm workspace
pnpm init
# workspace packages: packages/shared, packages/client, packages/server

# packages/shared (no framework dependencies)
cd packages/shared
pnpm add -D typescript

# packages/client (SolidJS frontend)
cd packages/client
pnpm add solid-js
pnpm add -D vite vite-plugin-solid typescript vitest @solidjs/testing-library jsdom @testing-library/jest-dom
pnpm add @solid-primitives/websocket

# packages/server (Node.js backend)
cd packages/server
pnpm add ws zod
pnpm add -D typescript tsx @types/node @types/ws vitest
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `ws` (raw WebSocket) | Socket.IO | Use Socket.IO if you need HTTP long-polling fallback (old browsers/proxies), namespaces, or automatic reconnection with no custom code. For this project's modern-browser-only target, the overhead is not worth it. |
| `ws` (raw WebSocket) | Colyseus | Use Colyseus if you're building a game with 100+ concurrent rooms, need binary delta-compressed state sync, or are targeting Unity/native clients alongside web. For 1-4 player lobby-based games in browser only, Colyseus adds schema-definition overhead with limited benefit. |
| SolidJS built-in stores | Zustand / Redux | Use external stores if your team knows them and dislikes SolidJS's store API. For a SolidJS project, built-ins are idiomatic and avoid an extra dependency. |
| pnpm workspaces | Turborepo or Nx | Add Turborepo if the build pipeline grows complex and you need caching/parallelization. Overkill for a 3-package monorepo. |
| Vite | esbuild (server) | Use esbuild directly for production server builds if you want a fast single-file output. tsx is fine for dev; esbuild for prod bundling. |
| Zod v4 | Zod v3 | Use v3 only if a dependency pins to it. v4 is production-stable, faster, and the default on npm install. |
| TypeScript 5.9.x | TypeScript 6.0 beta | Use TS 6 when it stabilizes (later in 2026). Beta is not recommended for production projects. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Socket.IO | Adds ~45KB to client bundle, HTTP polling fallback complexity, and a non-standard API layer. Native WebSockets are universally supported in 2026 modern browsers. For 1-4 player sessions it adds zero value. | `ws` on server + native browser `WebSocket` / `@solid-primitives/websocket` on client |
| Colyseus | Designed for games needing binary delta-compressed state sync, matchmaking queues, and multi-platform SDKs. For 1-4 player browser-only games with custom game logic, the schema-annotation ceremony adds complexity without benefit at this scale. | Raw `ws` + Zod-validated JSON messages |
| React (or any other frontend framework) | Project constraint mandates SolidJS. React would require different state management patterns and has higher re-render overhead for deeply nested game state. | SolidJS |
| Any database (for v1) | Project constraint: in-memory state only for v1. Adding a DB layer in v1 introduces connection management, serialization, and migration complexity with no requirement to match. | In-memory Maps/objects in Node.js process |
| `tsc --watch` for dev server | Slow. tsx (backed by esbuild) is 10-20x faster for the edit→run loop on a TypeScript server. | `tsx watch` |
| Global state patterns from React (Context + useReducer as Redux-like store) | SolidJS's store/signal model is fundamentally different. Trying to replicate React patterns causes unnecessary complexity and misses performance benefits. | SolidJS `createStore`, `createContext` with signals, `reconcile` |
| XState (for v1) | State machines are appropriate for complex game phase transitions, but add learning overhead. For v1, explicit phase flags in game state are simpler. Revisit if turn/phase logic becomes unwieldy. | Plain TypeScript enums + switch statements for phase management |

---

## Stack Patterns by Variant

**For shared game types (client + server both need them):**
- Put TypeScript interfaces and Zod schemas in `packages/shared`
- Export both the Zod schema and the inferred type: `export type GameState = z.infer<typeof GameStateSchema>`
- Client and server both import from `@slay-online/shared`
- Because Zod v4 is pure TypeScript, `packages/shared` has no Node.js or browser-specific dependencies

**For WebSocket message protocol:**
- Define discriminated union message types in `packages/shared`:
  ```typescript
  export type ClientMessage =
    | { type: 'PLAY_CARD'; cardId: string; targetRow?: number }
    | { type: 'END_TURN' }
    | { type: 'CHAT'; text: string }

  export type ServerMessage =
    | { type: 'GAME_STATE'; state: GameState }
    | { type: 'GAME_EVENT'; event: GameEvent }
    | { type: 'ERROR'; message: string }
  ```
- Validate on server with Zod before processing any client message
- Client uses TypeScript discriminated union narrowing (`switch (msg.type)`) to route to store updates

**For SolidJS reactive game state:**
- Receive full or partial `GameState` from server
- Use `reconcile` when applying server snapshots: `setGameState(reconcile(newState))`
- Use `produce` for optimistic local updates (if any) before server confirmation
- Wrap WebSocket + store in a SolidJS Context so all components can subscribe reactively

**For game logic testing:**
- Extract all game logic (card effects, combat resolution, enemy AI, damage calculation) into pure functions in `packages/server/src/game/`
- These functions take state + action, return new state — no I/O, no WebSocket
- vitest can test them without a running server or browser
- This is the most important architecture decision for testability

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| solid-js@1.9.11 | vite-plugin-solid@2.11.x | vite-plugin-solid 2.x required for solid-js 1.8+ |
| vite-plugin-solid@2.11.x | vite@7.x | 2.11.10 explicitly fixes Vite 6/7 compatibility |
| @solid-primitives/websocket@1.3.x | solid-js@1.9.x | Solid Primitives packages track solid-js closely; verify peer dep on install |
| vitest@4.x | vite@7.x | Vitest 4 pairs with Vite 7; do not mix vitest@3 with vite@7 |
| zod@4.x | TypeScript@5.x | Zod v4 requires TypeScript 4.9+ for full inference; works with TS 5.9 |
| ws@8.x | Node.js 22 LTS | ws@8 supports Node.js 18+; no issues on Node.js 22 |
| tsx@latest | Node.js 22 LTS | tsx uses esbuild; fully compatible with Node.js 22 |

---

## Sources

- [solid-js on npm (version 1.9.11 confirmed)](https://www.npmjs.com/package/solid-js) — MEDIUM confidence (npm page, not Context7)
- [SolidJS releases on GitHub](https://github.com/solidjs/solid/releases) — HIGH confidence
- [vite-plugin-solid on npm (version 2.11.10)](https://www.npmjs.com/package/vite-plugin-solid) — MEDIUM confidence
- [Vite releases — v7.3.1 current](https://vite.dev/releases) — MEDIUM confidence (search result)
- [ws on GitHub](https://github.com/websockets/ws) — HIGH confidence, zero-dependency, blazing fast
- [ws version 8.18.x — confirmed current](https://www.npmjs.com/package/ws) — MEDIUM confidence
- [@types/ws version 8.18.1](https://www.npmjs.com/package/@types/ws) — MEDIUM confidence
- [Zod v4 release notes](https://zod.dev/v4) — HIGH confidence (official docs)
- [Zod v4.3.6 current on npm](https://www.npmjs.com/package/zod) — MEDIUM confidence
- [@solid-primitives/websocket docs](https://primitives.solidjs.community/package/websocket/) — MEDIUM confidence
- [SolidJS stores and reconcile docs](https://docs.solidjs.com/concepts/stores) — HIGH confidence (official docs)
- [TypeScript 5.9.x stable, 6.0 beta as of March 2026](https://devblogs.microsoft.com/typescript/) — MEDIUM confidence (search result)
- [Vitest v4.x current](https://vitest.dev/guide/) — MEDIUM confidence
- [pnpm workspace docs](https://pnpm.io/workspaces) — HIGH confidence (official docs)
- [Socket.IO vs ws comparison](https://ably.com/topic/socketio-vs-websocket) — LOW confidence (third-party analysis)
- [Colyseus overview and when to use](https://colyseus.io/) — MEDIUM confidence (official site)

---

*Stack research for: Real-time multiplayer board/card game (Slay the Spire board game web adaptation)*
*Researched: 2026-03-01*
