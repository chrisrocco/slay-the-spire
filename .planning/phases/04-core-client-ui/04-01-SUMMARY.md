---
phase: 04-core-client-ui
plan: 01
subsystem: ui
tags: [solidjs, websocket, vite, css-modules, reactive-store]

requires:
  - phase: 03-session-management
    provides: WebSocket server, ServerMessage/ClientMessage types, GameState/LobbyState schemas
provides:
  - SolidJS app shell with phase-based routing (connecting/lobby/combat)
  - WebSocket client service with auto-reconnect
  - Reactive game store using SolidJS createStore with reconcile
  - CSS custom properties for dark fantasy theme
  - HTML entry point and Vite bootstrap
affects: [04-core-client-ui, 05-game-flow, 06-polish]

tech-stack:
  added: [solid-js, vite]
  patterns: [createStore-with-reconcile, css-modules, websocket-service-pattern]

key-files:
  created:
    - packages/client/index.html
    - packages/client/src/index.tsx
    - packages/client/src/services/websocket.ts
    - packages/client/src/stores/gameStore.ts
    - packages/client/src/styles/variables.module.css
    - packages/client/src/app.tsx
    - packages/client/src/app.module.css
    - packages/client/src/env.d.ts
  modified:
    - packages/client/tsconfig.json

key-decisions:
  - "Use SolidJS reconcile for full-state updates from server broadcasts"
  - "Auto-reconnect WebSocket with 2-second delay on close"
  - "Phase-based routing: connecting → lobby → combat based on server messages"
  - "Added allowImportingTsExtensions and noEmit to tsconfig for Vite compatibility"

patterns-established:
  - "WebSocket service pattern: createGameConnection returns { connect, send, onMessage, connected }"
  - "Store pattern: createAppStore returns store with state getter and mutation functions"
  - "Message dispatch: handleServerMessage maps ServerMessage types to store mutations"
  - "CSS Modules: each component has co-located .module.css file"

requirements-completed: [UI-13]

duration: 8min
completed: 2026-03-02
---

# Plan 04-01: App Shell, WebSocket Service, Game Store, CSS Theme

**SolidJS app shell with WebSocket client, reactive store using reconcile, and dark fantasy CSS theme variables**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Working Vite + SolidJS app that connects to WebSocket server and dispatches messages
- Reactive game store handles all 6 ServerMessage types with reconcile for efficient updates
- Dark fantasy CSS custom properties (backgrounds, character colors, typography, spacing)
- Phase-based routing renders connecting/lobby/combat views

## Task Commits

1. **Task 1: HTML entry, index.tsx, CSS theme** - `12b7a4b`
2. **Task 2: WebSocket service and game store** - `12b7a4b`
3. **Task 3: App component with connection flow** - `12b7a4b`

All tasks committed atomically in `12b7a4b`.

## Files Created/Modified
- `packages/client/index.html` - Vite entry point with root div
- `packages/client/src/index.tsx` - SolidJS render bootstrap
- `packages/client/src/env.d.ts` - Vite client types and CSS module declarations
- `packages/client/src/services/websocket.ts` - WebSocket client with auto-reconnect
- `packages/client/src/stores/gameStore.ts` - SolidJS reactive store with reconcile
- `packages/client/src/styles/variables.module.css` - Dark fantasy CSS custom properties
- `packages/client/src/app.tsx` - App shell with phase routing
- `packages/client/src/app.module.css` - App layout styles with spinner
- `packages/client/tsconfig.json` - Added allowImportingTsExtensions, noEmit, vite/client types

## Decisions Made
- Used `reconcile` from solid-js/store for full-state updates (server broadcasts entire GameState)
- Added `allowImportingTsExtensions: true` and `noEmit: true` to tsconfig since Vite handles bundling
- Created `env.d.ts` with CSS module type declarations for TypeScript
- Server URL uses `import.meta.env.DEV` to switch between localhost and production host

## Deviations from Plan

### Auto-fixed Issues

**1. TS5097 - allowImportingTsExtensions required**
- **Found during:** Task 2 (typecheck)
- **Issue:** .ts/.tsx extensions in imports not allowed without allowImportingTsExtensions
- **Fix:** Added allowImportingTsExtensions and noEmit to tsconfig.json
- **Verification:** pnpm typecheck passes

**2. TS2307 - CSS module imports unrecognized**
- **Found during:** Task 3 (typecheck)
- **Issue:** No type declarations for *.module.css imports
- **Fix:** Created env.d.ts with `declare module '*.module.css'` and added vite/client types
- **Verification:** pnpm typecheck passes

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Both fixes necessary for TypeScript + Vite compatibility. No scope creep.

## Issues Encountered
None beyond the auto-fixed TypeScript configuration issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell ready for component integration
- WebSocket service and store ready for use by all combat components
- CSS theme variables available for all component styling

---
*Phase: 04-core-client-ui*
*Completed: 2026-03-02*
