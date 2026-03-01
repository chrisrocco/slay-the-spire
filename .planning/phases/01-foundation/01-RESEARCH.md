# Phase 1: Foundation - Research

**Researched:** 2026-03-01
**Domain:** pnpm monorepo setup, TypeScript configuration, Zod v4 schema design, game data modeling
**Confidence:** HIGH (stack decisions pre-validated in STACK.md; patterns verified against official docs)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | All Act 1 player cards per character (85+ each) with normal and upgraded sides as typed data structures queryable by card ID | TypeScript discriminated union card types + static data files pattern; card IDs as string literals |
| CARD-02 | Card data extracted from reference sheet images into structured game data | Manual extraction from .webp reference sheets into TypeScript/JSON data files; no automated OCR library available for webp card sheets |
| CARD-03 | All Act 1 encounter, elite, and boss enemy cards with actions and HP | Typed enemy card structures with action pattern discriminated unions (SingleAction, DieAction, CubeAction) |
| CARD-04 | All Act 1 event cards with choice resolution | Event card type with bracketed choices as typed arrays; choice effects as typed discriminated unions |
| CARD-05 | Curse, Status, and Daze card pools | Small typed arrays — 17 curses, 36 status (Wound/Slimed), 10 daze — stored as static data |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire structural foundation of the project: the pnpm monorepo with three packages (`shared`, `client`, `server`), TypeScript compilation configured for all three, Zod v4 schemas defining the WebSocket message protocol and GameState shape, and all Act 1 game data extracted into typed static data structures.

The most time-intensive work in this phase is **card data extraction**. The user has reference sheet `.webp` images covering all four characters (ironclad, silent, defect, watcher — each with base and upgraded sheets, plus rare/starter sheets). Each image contains the printed card text that must be read and manually transcribed into TypeScript data objects. The rulebook (already extracted to `rulebook.txt`) provides the canonical rule text for enemy actions, events, relics, and potions. There is no automated extraction path — the cards must be read from the images and typed by hand (or with Claude's vision capabilities reading the webp files).

The monorepo scaffold and Zod schemas are straightforward implementation: pnpm workspace with `pnpm-workspace.yaml`, `workspace:*` package references, a base `tsconfig.json` with strict settings, and per-package tsconfigs extending it. Zod v4 discriminated unions define the WebSocket message protocol and GameState types in `packages/shared`, which both client and server import without a build step using the `exports` field pointing to `.ts` source files during development.

**Primary recommendation:** Scaffold monorepo first (1 day), extract all card/enemy/event data from images second (bulk of the phase), then define Zod schemas last once the data shape is fully understood from the extraction work.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm | 9.x | Monorepo package manager | workspace:* protocol links local packages without publish step; faster than npm; correct symlink handling |
| TypeScript | 5.9.x | Typed language, both client and server | Strict mode + shared types eliminates client/server protocol bugs; TS 6.0 still beta |
| Zod | 4.x (4.3.6+) | Runtime schema validation + type inference | z.infer generates TypeScript types from schemas; Zod v4 is 100x faster type instantiation than v3; pure TS so works in shared package with no node/browser deps |
| tsx | latest | Run TypeScript server without compile step | esbuild-backed; 10-20x faster than tsc --watch for dev loop |
| vitest | 4.x | Testing framework (Phase 1 needs it for schema validation tests) | Pairs with Vite 7; no DOM needed for pure TS schema tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite | 7.x | Client dev server and build | Required for SolidJS frontend; primary in Phase 4+ but configured in Phase 1 |
| vite-plugin-solid | 2.11.x | SolidJS JSX transform | Required alongside Vite for SolidJS compilation |
| solid-js | 1.9.11 | Frontend framework | Installed in Phase 1, used in Phase 4+ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pnpm workspaces | npm workspaces | npm workspaces work but slower installs, less strict hoisting |
| Static TypeScript data files | JSON files | JSON loses TypeScript type inference; TypeScript `as const` data retains full literal types |
| Zod schemas as source of truth | TypeScript interfaces only | Pure interfaces have no runtime validation; Zod gives both compile-time types and runtime parse |

**Installation (from repo root):**
```bash
# Initialize monorepo
pnpm init

# Each package gets its own package.json and tsconfig
# packages/shared — Zod schemas, game types, static data
cd packages/shared && pnpm add zod && pnpm add -D typescript

# packages/client — SolidJS frontend
cd packages/client
pnpm add solid-js @solid-primitives/websocket
pnpm add -D vite vite-plugin-solid typescript vitest @solidjs/testing-library jsdom

# packages/server — Node.js backend
cd packages/server
pnpm add ws
pnpm add -D typescript tsx @types/node @types/ws vitest
```

---

## Architecture Patterns

### Recommended Project Structure
```
slay-the-spire/
├── pnpm-workspace.yaml          # workspace: packages/*
├── package.json                 # root: scripts only (dev, build, test)
├── tsconfig.base.json           # shared strict TS settings
├── packages/
│   ├── shared/
│   │   ├── package.json         # name: @slay-online/shared
│   │   ├── tsconfig.json        # extends tsconfig.base.json
│   │   └── src/
│   │       ├── index.ts         # barrel export
│   │       ├── schemas/
│   │       │   ├── messages.ts  # WS message protocol (Zod + inferred types)
│   │       │   ├── gameState.ts # GameState schema
│   │       │   └── cards.ts     # Card schemas
│   │       └── data/
│   │           ├── cards/
│   │           │   ├── ironclad.ts    # all 85+ ironclad cards
│   │           │   ├── silent.ts      # all 87 silent cards
│   │           │   ├── defect.ts      # all 85 defect cards
│   │           │   └── watcher.ts     # all 85 watcher cards
│   │           ├── enemies/
│   │           │   ├── encounters.ts  # Act 1 encounter enemies
│   │           │   ├── elites.ts      # Act 1 elite enemies
│   │           │   └── bosses.ts      # Act 1 bosses
│   │           ├── events.ts          # Act 1 event cards
│   │           ├── curses.ts          # 17 curse cards
│   │           ├── statuses.ts        # Status/Daze cards
│   │           ├── relics.ts          # 58 relics + 20 boss relics
│   │           └── potions.ts         # 29 potions
│   ├── client/
│   │   ├── package.json         # name: @slay-online/client
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       └── app.tsx          # placeholder for Phase 4
│   └── server/
│       ├── package.json         # name: @slay-online/server
│       ├── tsconfig.json
│       └── src/
│           └── index.ts         # placeholder for Phase 3
├── cards/                       # source .webp reference images (already exists)
│   ├── ironclad_main.webp
│   ├── ironclad_main_upgraded.webp
│   ├── ironclad_rares.webp
│   ├── ironclad_starters.webp
│   └── ... (16 total images)
└── rulebook.txt                 # already extracted from PDF
```

### Pattern 1: pnpm Workspace Setup

**What:** `pnpm-workspace.yaml` declares all packages; each package references shared via `workspace:*` in its `package.json`; packages resolve to each other's `.ts` source files directly without a build step.

**When to use:** From day one — all packages need this wired before any code can import from shared.

**Example:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// packages/shared/package.json
{
  "name": "@slay-online/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  },
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

```json
// packages/server/package.json — references shared
{
  "name": "@slay-online/server",
  "dependencies": {
    "@slay-online/shared": "workspace:*"
  }
}
```

**Critical:** Point `exports["."].import` to `./src/index.ts` (the `.ts` file directly). This is the "live types" pattern — tsx and vitest both follow this and resolve to TypeScript source without a build step. Vite also follows it for the client.

### Pattern 2: TypeScript Base Config with Strict Mode

**What:** Root `tsconfig.base.json` sets strict options inherited by all packages. Each package extends it and adds package-specific settings.

**When to use:** Always in a monorepo — prevents per-package config drift.

**Example:**
```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```json
// packages/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

**Why `noUncheckedIndexedAccess`:** Card arrays and player slot arrays are indexed throughout the game logic. Without this, `cards[0]` returns `Card` instead of `Card | undefined`, causing silent runtime errors when arrays are shorter than expected.

### Pattern 3: Zod v4 Discriminated Unions for WebSocket Messages

**What:** Define all WebSocket message types in `packages/shared/src/schemas/messages.ts` as Zod discriminated unions. Export both the Zod schema and the TypeScript type inferred from it. Client and server both import the same type — drift is impossible.

**When to use:** For every cross-boundary message type — WS messages, GameState, all card/enemy types.

**Example:**
```typescript
// packages/shared/src/schemas/messages.ts
import { z } from 'zod';

// Client → Server messages
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PLAY_CARD'), cardId: z.string(), targets: z.array(z.string()) }),
  z.object({ type: z.literal('END_TURN') }),
  z.object({ type: z.literal('USE_POTION'), potionId: z.string(), target: z.string().optional() }),
  z.object({ type: z.literal('SEND_CHAT'), text: z.string().max(500) }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server → Client messages
export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('STATE_UPDATE'), state: GameStateSchema }),
  z.object({ type: z.literal('LOBBY_UPDATE'), lobby: LobbyStateSchema }),
  z.object({ type: z.literal('ERROR'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('CHAT_MESSAGE'), playerId: z.string(), text: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
```

### Pattern 4: Card Data as `as const` TypeScript Objects

**What:** Each card is a TypeScript object literal with `as const` assertion. The card ID is a string literal type. A lookup map `Record<CardId, Card>` enables O(1) lookup by ID. Upgraded cards are a separate entry with `_upgraded` suffix on the ID or a separate `upgraded` field.

**When to use:** All static game data (cards, enemies, relics, potions, events).

**Why not JSON:** JSON files lose TypeScript literal type inference. With `as const` TS data files, `card.type` narrows to `'Attack' | 'Skill' | 'Power'` as a literal, not just `string`.

**Example:**
```typescript
// packages/shared/src/data/cards/ironclad.ts
import type { PlayerCard } from '../schemas/cards.js';

export const ironcladCards = [
  {
    id: 'strike_r',
    name: 'Strike',
    character: 'ironclad',
    rarity: 'starter',
    type: 'Attack',
    cost: 1,
    text: 'Deal 6 damage.',
    effects: [{ kind: 'damage', amount: 6, hits: 1 }],
  },
  {
    id: 'strike_r_upgraded',
    name: 'Strike+',
    character: 'ironclad',
    rarity: 'starter',
    type: 'Attack',
    cost: 1,
    text: 'Deal 9 damage.',
    effects: [{ kind: 'damage', amount: 9, hits: 1 }],
  },
  // ... all 85+ ironclad cards with upgraded variants
] as const satisfies readonly PlayerCard[];

// Lookup map — O(1) by card ID
export const ironcladCardMap = Object.fromEntries(
  ironcladCards.map(c => [c.id, c])
) as Record<(typeof ironcladCards[number])['id'], PlayerCard>;
```

### Pattern 5: Enemy Action Types as Discriminated Union

**What:** The board game has three enemy action patterns (single, die, cube). These map cleanly to a discriminated union. An enemy card's `actions` field has type `EnemyActionPattern`.

**When to use:** All enemy card definitions.

**Example:**
```typescript
// packages/shared/src/schemas/enemies.ts
import { z } from 'zod';

const EnemyActionSchema = z.object({
  effects: z.array(EnemyEffectSchema),  // damage, block, status application, summon, etc.
});

const EnemyActionPatternSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('single'),
    action: EnemyActionSchema,
  }),
  z.object({
    kind: z.literal('die'),
    // die results 1-6 mapped to actions
    actions: z.record(z.string(), EnemyActionSchema),
  }),
  z.object({
    kind: z.literal('cube'),
    // ordered list of cube positions; gray actions marked as non-repeating
    slots: z.array(z.object({
      action: EnemyActionSchema,
      repeating: z.boolean(),  // false = gray slot, not repeated
    })),
  }),
]);
export type EnemyActionPattern = z.infer<typeof EnemyActionPatternSchema>;
```

### Pattern 6: Root-Level Dev Script

**What:** Root `package.json` has a `dev` script that starts both client and server simultaneously.

**When to use:** In the root package.json.

**Example:**
```json
// package.json (root)
{
  "scripts": {
    "dev": "pnpm --parallel --filter @slay-online/client dev --filter @slay-online/server dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test"
  }
}
```

Or more explicitly with concurrently:
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter @slay-online/server dev\" \"pnpm --filter @slay-online/client dev\""
  },
  "devDependencies": {
    "concurrently": "^9.x"
  }
}
```

### Anti-Patterns to Avoid

- **Putting card data in JSON files:** Loses TypeScript literal type inference. Use `.ts` files with `as const satisfies`.
- **Compiling shared before using it:** In dev, point `exports` to `.ts` source directly. tsx and Vite follow the exports map and resolve TypeScript. A build step for shared in dev adds unnecessary friction.
- **One giant cards.ts file:** 85+ cards × 4 characters × 2 sides = 700+ card entries. Split by character to keep files manageable and diffs readable.
- **Storing GameState type only as TypeScript interface:** If GameState is only a TS interface, the server can't validate that a saved/serialized state round-trips correctly. Define it as a Zod schema; get the TypeScript type from `z.infer<>`.
- **Mixing board game rules with video game rules:** The board game differs from the video game in several critical ways: Orbs don't rotate (any orb can be evoked), Vulnerable/Weak cancel each other (not stack), Poison doesn't deal damage (HP loss), token caps are different. The rulebook.txt is the authority.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket message type validation | Custom type guards for every message type | Zod `z.discriminatedUnion` + `schema.parse()` | Zod handles all edge cases, unknown fields, type coercion, and generates error messages. 3 lines vs 50 lines per message type. |
| Cross-package type sharing | Duplicating types in client and server | `@slay-online/shared` via `workspace:*` | Single source of truth; changes propagate instantly with live types pattern |
| Card lookup | Linear search through card arrays | `Record<CardId, Card>` map built at module load | O(1) vs O(n); with 700+ card entries across all characters, O(n) search in hot paths (combat resolution) matters |
| Enemy HP scaling | Embedding HP as fixed number in enemy objects | HP board pattern from rulebook (HP varies by player count) | Some enemies scale HP with player count (see rulebook page 11). Store as `{ 1: 10, 2: 14, 3: 18, 4: 22 }` map keyed by player count. |

**Key insight:** The foundation phase is mostly data entry work, not algorithmic work. Resist the temptation to build complex data processing pipelines — the card data is static and finite. Simple TypeScript objects are correct.

---

## Common Pitfalls

### Pitfall 1: Conflating Board Game and Video Game Card Data

**What goes wrong:** Developer uses video game card data sources (online wikis, API dumps) instead of the physical board game cards. The board game has different damage values, different mechanics, and different card sets.

**Why it happens:** The Slay the Spire video game is well-documented online. The board game adaptation has different numbers, different rules, and some cards that don't exist in the video game.

**How to avoid:** Use ONLY the `.webp` reference sheet images provided by the user as the source of truth for card data. Cross-check with `rulebook.txt` for rule text. Do not use any online database of video game card stats.

**Warning signs:** Any card with "Relics" as a deck mechanic, or Orbs that rotate, or Watcher cards that mention "Devotion" (video game mechanic not in board game).

### Pitfall 2: Missing the Upgraded Card Side

**What goes wrong:** Only extracting base card data and forgetting upgraded variants. The upgrade side is physically on the back of each card (or a separate card in the component list).

**Why it happens:** Reference images show both sides but it's easy to miss the systematic extraction of both sides.

**How to avoid:** The reference images have a separate `*_upgraded.webp` file per character. Both images must be fully extracted. Each base card maps to exactly one upgraded variant. The upgraded card ID convention should be `{baseId}_upgraded` for consistency.

**Warning signs:** `ironcladCardMap` has half the expected entries; queries for `strike_r_upgraded` return undefined.

### Pitfall 3: HP Board Enemy Scaling Not Modeled

**What goes wrong:** Enemy HP is stored as a single number instead of a per-player-count object. Some Act 1 enemies use the HP board (scaling HP per player count).

**Why it happens:** Most enemies have fixed HP printed on their card. The HP board enemies are a special case that's easy to miss.

**How to avoid:** Check the rulebook page 11 — enemies with HP board notation have `HP: "see HP board"` and separate values per player count (1/2/3/4 players). Model as `hp: number | { 1: number; 2: number; 3: number; 4: number }`.

**Warning signs:** Tests with 4 players show incorrect enemy HP for Gremlin Nob or Lagavulin.

### Pitfall 4: Zod v3 Patterns in Zod v4

**What goes wrong:** Using Zod v3 API patterns that changed in v4 (e.g., `z.union` for discriminated unions where `z.discriminatedUnion` is required in v4 for performance, or `z.enum` with array syntax).

**Why it happens:** Most Stack Overflow answers and blog posts are for Zod v3.

**How to avoid:** Use `z.discriminatedUnion('type', [...])` for all message types — this is both correct and maximally performant in v4. Verify patterns against the official Zod v4 docs at zod.dev/v4.

**Warning signs:** TypeScript error on `.parse()` about union type exhaustion; slower-than-expected schema compilation.

### Pitfall 5: TypeScript `moduleResolution` Mismatch

**What goes wrong:** `moduleResolution: "node16"` or `"node"` in tsconfig causes `Cannot find module '@slay-online/shared'` errors even though the package exists in `node_modules`.

**Why it happens:** The `exports` field in `package.json` is only respected by `moduleResolution: "bundler"` or `"node16"/"nodenext"`. The `"node"` resolution ignores `exports` and looks for `main` field only.

**How to avoid:** Set `"moduleResolution": "bundler"` in `tsconfig.base.json`. This tells TypeScript to use the `exports` field which points to the `.ts` source files. Vite and tsx both use bundler-style resolution and will agree.

**Warning signs:** `tsc` passes but tsx/Vite fail to resolve `@slay-online/shared`; or vice versa.

### Pitfall 6: Missing `satisfies` on Card Data

**What goes wrong:** Declaring card arrays as `PlayerCard[]` loses the literal types — `card.id` is typed as `string` instead of `'strike_r'`. This makes the lookup map less useful.

**Why it happens:** `as const` without type annotation loses structural validation; type annotation without `as const` loses literal types.

**How to avoid:** Use `as const satisfies readonly PlayerCard[]` — this preserves literal types AND validates that the data matches the schema.

**Warning signs:** `ironcladCardMap` accepts any string as key instead of narrowing to known card IDs.

---

## Code Examples

Verified patterns from official sources and project research:

### pnpm-workspace.yaml (Official pnpm docs)
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### Zod v4 Game State Schema (Source: zod.dev/v4)
```typescript
// packages/shared/src/schemas/gameState.ts
import { z } from 'zod';

export const CharacterSchema = z.enum(['ironclad', 'silent', 'defect', 'watcher']);
export type Character = z.infer<typeof CharacterSchema>;

export const CardTypeSchema = z.enum(['Attack', 'Skill', 'Power', 'Curse', 'Status', 'Daze']);
export type CardType = z.infer<typeof CardTypeSchema>;

export const RaritySchema = z.enum(['starter', 'common', 'uncommon', 'rare', 'colorless', 'special']);
export type Rarity = z.infer<typeof RaritySchema>;

export const PlayerCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  character: CharacterSchema.or(z.literal('colorless')),
  rarity: RaritySchema,
  type: CardTypeSchema,
  cost: z.number().int().min(0).max(6).or(z.literal('X')).or(z.literal('unplayable')),
  text: z.string(),
  upgraded: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
  // Effects are modeled in Phase 2 game engine — Phase 1 stores raw text only
});
export type PlayerCard = z.infer<typeof PlayerCardSchema>;

export const TurnPhaseSchema = z.enum([
  'PLAYER_ACTIONS',
  'WAITING_FOR_ALL_PLAYERS',
  'ENEMY_TURN',
  'CLEANUP',
  'COMBAT_END',
]);
export type TurnPhase = z.infer<typeof TurnPhaseSchema>;
```

### Enemy Card Data Structure
```typescript
// packages/shared/src/schemas/enemies.ts
import { z } from 'zod';

// HP is either a fixed number or scales with player count
export const EnemyHPSchema = z.union([
  z.number().int().positive(),
  z.object({ 1: z.number(), 2: z.number(), 3: z.number(), 4: z.number() }),
]);

export const EnemyActionPatternSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('single'),
    description: z.string(),  // raw action text for Phase 1; effects parsed in Phase 2
  }),
  z.object({
    kind: z.literal('die'),
    description: z.string(),
    // Map die result (1-6) to action description
    // Not all die results need separate actions; consecutive results can share
    actions: z.record(z.string(), z.string()),
  }),
  z.object({
    kind: z.literal('cube'),
    description: z.string(),
    slots: z.array(z.object({
      text: z.string(),
      repeating: z.boolean(),  // false = gray slot, not repeated when looping
    })),
  }),
]);

export const EnemyCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  act: z.literal(1),
  category: z.enum(['encounter', 'elite', 'boss', 'summon', 'first_encounter']),
  hp: EnemyHPSchema,
  pattern: EnemyActionPatternSchema,
  specialAbilities: z.array(z.string()).default([]),  // Yellow text abilities
  summons: z.array(z.string()).default([]),  // IDs of enemies summoned at combat start
  rewards: z.object({
    gold: z.number().int().min(0).default(0),
    cardReward: z.boolean().default(false),
    potionReward: z.boolean().default(false),
    relicReward: z.boolean().default(false),
  }),
});
export type EnemyCard = z.infer<typeof EnemyCardSchema>;
```

### Root Package.json Dev Script
```json
{
  "name": "slay-the-spire-online",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter './packages/*' dev",
    "build": "pnpm --recursive --filter './packages/*' build",
    "test": "pnpm --recursive --filter './packages/*' test",
    "typecheck": "pnpm --recursive --filter './packages/*' typecheck"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

### Shared Package Index Barrel Export
```typescript
// packages/shared/src/index.ts
// Re-export all types and schemas for consumer packages
export * from './schemas/messages.js';
export * from './schemas/gameState.js';
export * from './schemas/cards.js';
export * from './schemas/enemies.js';

// Re-export static data maps (consumed by server game engine)
export * from './data/cards/ironclad.js';
export * from './data/cards/silent.js';
export * from './data/cards/defect.js';
export * from './data/cards/watcher.js';
export * from './data/enemies/encounters.js';
export * from './data/enemies/elites.js';
export * from './data/enemies/bosses.js';
export * from './data/events.js';
export * from './data/curses.js';
export * from './data/statuses.js';
export * from './data/relics.js';
export * from './data/potions.js';
```

Note: `.js` extensions in imports are required when `moduleResolution` is `bundler` with ESM output — TypeScript convention even for `.ts` source files.

---

## Card Data Inventory (from rulebook.txt page 3)

This is the complete count of card data to be extracted in Phase 1:

| Data Type | Count | Source |
|-----------|-------|--------|
| Ironclad player cards (both sides) | 85 × 2 sides = 170 card faces | ironclad_main.webp, ironclad_main_upgraded.webp, ironclad_rares.webp, ironclad_starters.webp |
| Silent player cards (both sides) | 87 × 2 sides = 174 card faces | silent_main.webp, silent_main_upgraded.webp, silent_rares.webp, silent_starters.webp |
| Defect player cards (both sides) | 85 × 2 sides = 170 card faces | defect_main.webp, defect_main_upgraded.webp, defect_rares.webp, defect_starters.webp |
| Watcher player cards (both sides) | 85 × 2 sides = 170 card faces | watcher_main_base.webp, watcher_main_upgraded.webp, watcher_rares.webp, watcher_starters.webp |
| Act 1 Encounter enemies | 12 cards | rulebook.txt + visual reference |
| Act 1 Elite enemies | 3 cards | rulebook.txt |
| Act 1 Boss cards | ~3 options | rulebook.txt |
| Act 1 Summons | ~35 | rulebook.txt component list |
| Act 1 Events | 12 cards (+ 6 Ascension, skip for v1) | rulebook.txt |
| Curses | 17 cards | rulebook.txt component list |
| Status cards | 36 cards (Wound / Slimed) | rulebook.txt page 24 |
| Daze cards | 10 cards | rulebook.txt component list |
| Relics | 58 + 20 boss relics | rulebook.txt |
| Potions | 29 cards | rulebook.txt component list |

**Total player card faces to extract: ~684** across 16 .webp reference images

**Extraction approach:** Claude can read the .webp images directly using the vision tool. The recommended plan is to process one character at a time: read both base and upgraded reference images, extract all cards, write the TypeScript data file.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod v3 schemas | Zod v4 (4.3.6+) | Mid-2025 | 100x faster TS type instantiation; smaller bundle; use `z.discriminatedUnion` for performance |
| `moduleResolution: "node"` | `moduleResolution: "bundler"` | TS 5.0 (2023) | Required to respect `exports` field in package.json; enables live types pattern |
| Build shared package before using | Point exports to `.ts` source directly | Ongoing best practice 2024+ | No build step in dev; tsx and Vite follow exports map |
| TypeScript 5.x `satisfies` operator | Standard pattern for typed `as const` data | TS 4.9 (2022) | `as const satisfies T[]` preserves literal types AND validates shape |

**Deprecated/outdated:**
- `paths` in tsconfig for cross-package resolution: Works but fragile and doesn't survive publishing. Superseded by `exports` field in package.json with `moduleResolution: bundler`.
- `zod@3` for new projects: v4 is production-stable, faster, and the default on `npm install zod`.

---

## Open Questions

1. **Enemy card data completeness for Act 1**
   - What we know: Rulebook lists 12 encounters, 3 elites, and bosses for Act 1. Summons deck has 35 Act 1 entries.
   - What's unclear: Exact count of distinct Act 1 bosses (rulebook page 3 shows "11 Boss Cards (26 including unlocks)"; for v1 only base game bosses needed, not Ascension unlocks)
   - Recommendation: Extract base game bosses only (no Ascension prefix cards) — consistent with project scope (no Ascension for v1)

2. **Relic and potion effect modeling depth for Phase 1**
   - What we know: Phase 1 requires all relic/potion definitions in structured data. Phase 5 implements triggered abilities.
   - What's unclear: Should Phase 1 model effects as raw text only, or attempt to model them as typed effect objects?
   - Recommendation: **Phase 1: raw text only.** Store `{ id, name, text: "..." }`. Phase 5 will add typed effect representations when implementing triggers. Avoids premature effect modeling that may need to change.

3. **Status card variants (Wound vs Slimed)**
   - What we know: Rulebook page 24 says "Status / — Status cards use the top or bottom effect, whichever icon is on the enemy that gave it to you." There appear to be two variants.
   - What's unclear: Are these one card with two sides, or two separate cards?
   - Recommendation: Model as a single `StatusCard` type with `variant: 'wound' | 'slimed'` field. Phase 2 engine picks the variant based on which enemy applied it.

---

## Sources

### Primary (HIGH confidence)
- [pnpm workspaces — official docs](https://pnpm.io/workspaces) — workspace:* protocol, pnpm-workspace.yaml format
- [Zod v4 official docs](https://zod.dev/v4) — discriminatedUnion API, z.infer, performance characteristics
- [SolidJS stores documentation](https://docs.solidjs.com/concepts/stores) — createStore + reconcile pattern
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig) — moduleResolution bundler, noUncheckedIndexedAccess, strict mode settings
- Rulebook.txt (on disk at `/home/chris/projects/slay-the-spire/rulebook.txt`) — card counts, enemy types, game component inventory

### Secondary (MEDIUM confidence)
- [Live types in a TypeScript monorepo — Colin McDonnell](https://colinhacks.com/essays/live-types-typescript-monorepo) — exports field pointing to .ts source files pattern; custom conditions approach
- STACK.md (project research) — version pinning for all dependencies verified by project researchers
- ARCHITECTURE.md (project research) — folder structure and build order decisions

### Tertiary (LOW confidence)
- WebSearch results on TypeScript discriminated unions — general pattern confirmation only; not used for specific API claims

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions and library choices verified in project STACK.md against official sources
- Architecture/folder structure: HIGH — follows patterns from ARCHITECTURE.md, consistent with established monorepo conventions
- Card data inventory counts: MEDIUM — counts from rulebook.txt component list (page 3); some ambiguity on exact Act 1 subset of bosses/summons
- Zod v4 patterns: HIGH — verified against official zod.dev/v4 docs
- pnpm workspace config: HIGH — verified against official pnpm.io/workspaces docs

**Research date:** 2026-03-01
**Valid until:** 2026-06-01 (stable ecosystem; Zod v4 and pnpm workspace conventions unlikely to change materially)
