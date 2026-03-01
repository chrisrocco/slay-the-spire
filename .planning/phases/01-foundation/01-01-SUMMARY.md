---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [pnpm, typescript, zod, monorepo, solidjs, websocket]

requires:
  - phase: none
    provides: first phase
provides:
  - pnpm monorepo with shared, client, server packages
  - Zod v4 schemas for PlayerCard, EnemyCard, GameState, WebSocket messages
  - Stub data files for all Act 1 game entities
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, phase-2, phase-3, phase-4]

tech-stack:
  added: [pnpm, typescript 5.9, zod 4, solid-js, vite 7, ws, tsx, vitest]
  patterns: [pnpm workspace, barrel exports, Zod schema-first typing, ESM with .js extensions]

key-files:
  created:
    - packages/shared/src/schemas/cards.ts
    - packages/shared/src/schemas/enemies.ts
    - packages/shared/src/schemas/gameState.ts
    - packages/shared/src/schemas/messages.ts
    - packages/shared/src/index.ts
    - packages/shared/src/data/cards/ironclad.ts
    - packages/shared/src/data/cards/silent.ts
    - packages/shared/src/data/cards/defect.ts
    - packages/shared/src/data/cards/watcher.ts
    - packages/shared/src/data/enemies/encounters.ts
    - packages/shared/src/data/enemies/elites.ts
    - packages/shared/src/data/enemies/bosses.ts
    - packages/shared/src/data/events.ts
    - packages/shared/src/data/curses.ts
    - packages/shared/src/data/statuses.ts
    - packages/shared/src/data/relics.ts
    - packages/shared/src/data/potions.ts
  modified: []

key-decisions:
  - "Used Zod v4 API throughout (z.discriminatedUnion, z.record) for schema definitions"
  - "ESM with .js extensions in imports for bundler moduleResolution compatibility"
  - "Stub data files export empty arrays with typed signatures so downstream plans can import immediately"

patterns-established:
  - "Schema-first: define Zod schema, infer TypeScript type, export both"
  - "Data file pattern: export readonly array + Record map for each entity category"
  - "Workspace dependency: workspace:* for cross-package imports"

requirements-completed: [CARD-01, CARD-02, CARD-03, CARD-04, CARD-05]

duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 01: Monorepo Scaffold Summary

**pnpm monorepo with Zod v4 schemas for all game types, stub data files for 12 entity categories, and cross-package TypeScript workspace**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T21:38:57Z
- **Completed:** 2026-03-01T21:43:37Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments
- pnpm monorepo with three packages (shared, client, server) with workspace cross-references
- Zod v4 schemas defining PlayerCard, EnemyCard, GameState, ClientMessage, ServerMessage types
- 12 stub data files ready for population by Plans 02-07
- Full workspace typecheck passes across all three packages

## Task Commits

Each task was committed atomically:

1. **Task 1: Monorepo scaffold and TypeScript configuration** - `a392f30` (feat)
2. **Task 2: Zod v4 schemas and shared data stubs** - `9a13d09` (feat)

## Files Created/Modified
- `pnpm-workspace.yaml` - Workspace package declarations
- `package.json` - Root scripts for dev/build/test/typecheck
- `tsconfig.base.json` - Shared strict TypeScript config
- `packages/shared/src/schemas/cards.ts` - PlayerCard, CurseCard, StatusCard, DazeCard schemas
- `packages/shared/src/schemas/enemies.ts` - EnemyCard, EnemyHP, EnemyActionPattern schemas
- `packages/shared/src/schemas/gameState.ts` - GameState, PlayerState, LobbyState schemas
- `packages/shared/src/schemas/messages.ts` - ClientMessage, ServerMessage WebSocket protocol schemas
- `packages/shared/src/index.ts` - Barrel exports for all schemas and data
- `packages/shared/src/data/cards/*.ts` - Stub data for 4 character card sets
- `packages/shared/src/data/enemies/*.ts` - Stub data for encounters, elites, bosses
- `packages/shared/src/data/*.ts` - Stub data for events, curses, statuses, relics, potions
- `packages/client/` - SolidJS + Vite client placeholder
- `packages/server/` - ws + tsx server placeholder

## Decisions Made
- Used Zod v4 API (z.discriminatedUnion, z.record) for all schema definitions
- ESM with .js extensions in imports for bundler moduleResolution compatibility
- Stub data files export empty typed arrays so downstream plans can import immediately
- Installed pnpm globally as project prerequisite

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed pnpm globally**
- **Found during:** Task 1 (Monorepo scaffold)
- **Issue:** pnpm was not installed on the system
- **Fix:** Ran `npm install -g pnpm`
- **Verification:** pnpm install completed successfully
- **Committed in:** a392f30 (part of Task 1 commit)

**2. [Rule 3 - Blocking] Approved esbuild build scripts**
- **Found during:** Task 1 (Monorepo scaffold)
- **Issue:** pnpm blocked esbuild postinstall scripts by default
- **Fix:** Added pnpm.onlyBuiltDependencies to root package.json
- **Verification:** pnpm install completes without warnings
- **Committed in:** a392f30 (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for installation to succeed. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All stub data files ready for Plans 02-07 to populate
- Schema contracts established for all game entity types
- Cross-package imports verified working

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
