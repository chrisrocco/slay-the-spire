# Phase 2: Game Engine - Research

**Researched:** 2026-03-01
**Domain:** Pure TypeScript game logic, immutable state machines, rule-based simulation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**State Model**
- GameState is immutable — engine functions return new state, never mutate
- PlayerState already defined in packages/shared/src/schemas/gameState.ts — extend as needed for status tokens (Strength, Vulnerable, Weak, Poison, Shivs, Miracles, Orbs, Stance)
- Enemy state needs expansion: current schema uses string IDs only — need full enemy combat state (HP, block, tokens, cube position, action patterns)
- Row-based targeting: enemies are assigned to player rows, bosses are in all rows

**Turn Flow (from rulebook p12-13)**
- Player Turn phases: Start of Turn (reset energy/block, draw 5, roll die, trigger abilities) → Play (simultaneous card play) → End of Turn (trigger end-of-turn, discard hand)
- Enemy Turn phases: Remove enemy block → Enemy actions (top row to bottom, left to right, bosses last) → Move cube actions
- Combat ends when all enemies are dead (or all players dead)

**Card Resolution Order (from rulebook p12)**
- Pay energy cost → Choose targets → Resolve effects top-to-bottom → Cleanup (discard/power/exhaust)
- Triggered abilities from a card don't fire until after the card finishes resolving all text
- Cards that are "being played" are not in hand or discard during resolution

**Status Effect Rules (from rulebook p14, 24)**
- Vulnerable: doubles hit damage, max 3 tokens, lose 1 token after attack resolves
- Weak: reduces hit damage by 1 per hit, max 3 tokens, lose 1 token after attack resolves
- Weak vs Vulnerable on same attack: cancel out — attack unaffected, both lose 1 token
- Strength: +1 damage per hit per token, max 8 — added before Vulnerable doubling
- Poison: loses 1 HP per token at end of turn, ignores block, max 30 combined across all enemies
- Block: prevents damage, max 20 for players, no cap for enemies

**Multi-hit Resolution (from rulebook p14)**
- All hits in a multi-hit have the same target (unless stated otherwise)
- All hits equally affected by damage bonuses (Strength)
- All hits equally affected by Vulnerable/Weak
- Remove one Vulnerable/Weak token when entire multi-hit is complete

**Character Mechanics (from rulebook p16-17)**
- Ironclad: Strength token tracking, Exhaust pile synergies, highest starting HP
- Silent: Poison tokens on enemies (max 30 total), Shiv tokens (max 5, deal 1 damage each, treated as separate Attacks)
- Defect: Orb system — Channel into slots, Evoke to remove and trigger effect, end-of-turn effects for Lightning/Frost orbs. Any orb can go in any slot, any orb can be evoked (unlike video game)
- Watcher: Stances (Neutral/Calm/Wrath), Miracles (max 5, gain 1 energy each). Leaving Calm grants 2 energy. Wrath grants +1 damage on all hits but take 1 damage at end of turn

**Enemy AI (from rulebook p13)**
- Three action pattern types: Single (same action every turn), Die (action based on die result), Cube (track position, cycle through actions)
- Cube actions: gray slots are not repeated when cycling
- Enemies target player in their row; boss targets all players
- "Acts last" enemies act after other enemies but before boss

**Triggered Abilities (from rulebook p19)**
- Must support: start of turn, start of combat, end of turn, end of combat, on death, die relic triggers
- Queue-based resolution to prevent recursive loops
- "Start of turn" abilities fire in player-chosen order

### Claude's Discretion
- Internal architecture of the engine (function signatures, module organization)
- How to model card effects programmatically (effect system design)
- Test structure and coverage strategy
- Whether to process all card effects generically or special-case some
- How to handle the "Golden Rule" (card text overrides rules)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMBT-01 | At start of turn, each player's energy resets to 3 and block resets to 0 | startPlayerTurn() function resets player fields in new state |
| CMBT-02 | Each player draws 5 cards at start of turn | drawCards() pure function shuffles discard→draw when pile empty |
| CMBT-03 | Die is rolled once per round with result visible to all players | dieResult field on GameState, set during startPlayerTurn phase |
| CMBT-04 | Start-of-turn abilities trigger in player-chosen order | TriggerQueue: fire abilities in declared order during START_OF_TURN |
| CMBT-05 | Players can simultaneously play cards, use potions, and activate abilities | PLAYER_ACTIONS phase accepts intents from any player concurrently |
| CMBT-06 | Card play resolves: pay energy, choose targets, resolve effects top-to-bottom, cleanup | playCard() pipeline: checkCost→applyTargets→resolveEffects→cleanup |
| CMBT-07 | Each player individually signals End Turn | endedTurn boolean per PlayerState, transitions phase when all true |
| CMBT-08 | End-of-turn abilities trigger after all players signal ready | TriggerQueue: fire end-of-turn triggers in WAITING_FOR_ALL_PLAYERS |
| CMBT-09 | Players discard remaining hand at end of turn | discardHand() called after end-of-turn triggers resolve |
| CMBT-10 | Enemies lose all block at start of enemy turn | removeEnemyBlock() resets block tokens on each EnemyCombatState |
| CMBT-11 | Enemies act top row to bottom, left to right, bosses last | resolveEnemyActions() iterates sorted rows, boss deferred to end |
| CMBT-12 | Single action, die action, and cube action enemy patterns resolve correctly | resolveEnemyAction() dispatches on pattern.kind |
| CMBT-13 | Cube actions track position and cycle correctly (gray actions not repeated) | cubePosition on EnemyCombatState; advanceCube() skips non-repeating |
| CMBT-14 | Dead enemies flip over and lose tokens; dead player ends game immediately | checkDeaths() called after each damage application |
| MECH-01 | Vulnerable doubles hit damage, max 3 tokens, removed after attack | applyHit() formula: base + strength, then ×2 if vulnerable; cap check |
| MECH-02 | Weak reduces hit damage by 1, max 3 tokens, removed after attack | applyHit() formula: −1 per hit if weak |
| MECH-03 | Strength adds +1 damage per hit per token, max 8 | applyHit() adds strength.count before vulnerable doubling |
| MECH-04 | Poison deals 1 HP loss per token at end of turn, ignores block, max 30 combined | applyPoisonTick() called in end-of-turn phase; max 30 sum check on apply |
| MECH-05 | Block prevents damage up to its value, max 20 for players | applyDamage(): damage − block, block capped at 20 for players |
| MECH-06 | Multi-hit attacks resolve correctly with Vulnerable/Weak interactions | applyMultiHit() loops hits, removes single token after all hits done |
| MECH-07 | Weak vs Vulnerable cancel each other out per rules | applyHit() checks both flags together: cancel damage mods, remove one each |
| MECH-08 | Exhaust removes card from deck for the combat | moveToExhaust() removes from hand/discard, appends to exhaustPile |
| MECH-09 | Ethereal cards exhaust at end of turn if still in hand | discardHand() checks ethereal flag before discarding |
| MECH-10 | Retain prevents card from being discarded at end of turn | discardHand() skips cards with retain flag |
| MECH-11 | Scry lets player look at top X cards and optionally discard | scry() returns top X cards as pending decision; resolveScry() commits |
| CHAR-01 | Ironclad: Strength synergies, exhaust synergies, higher starting HP | strengthTokens on CombatTokens; exhaustPile count accessible |
| CHAR-02 | Silent: Poison mechanic (max 30), Shiv tokens (max 5, deal 1 damage each) | poisonTokens on EnemyCombatState; shivTokens on CombatTokens |
| CHAR-03 | Defect: Orb system (Channel, Evoke, end-of-turn effects), Lightning/Frost/Dark orbs | orbs array on CombatTokens; channelOrb()/evokeOrb()/applyOrbEndOfTurn() |
| CHAR-04 | Watcher: Stances (Neutral/Calm/Wrath), Miracles (max 5), Scry | stance + miracleTokens on CombatTokens; enterStance() with Calm bonus |
</phase_requirements>

## Summary

Phase 2 builds the heart of the game: a pure TypeScript engine that takes a `GameState` and a player action (or system event), and returns a new `GameState`. There are no databases, no WebSockets, no React — just functions. The project already has vitest 4.x configured in both `packages/shared` and `packages/server`, strict TypeScript with `noUncheckedIndexedAccess`, and Zod v4 schemas as the type layer. The engine can live in `packages/server/src/game/` (server-only) or `packages/shared/src/engine/` (if client-side prediction is wanted later — not scoped here).

The hardest design question in this phase is **how card effects are represented in code**. Phase 1 stored effects as raw text strings. Phase 2 must either (a) parse text into structured effect objects, (b) hardcode every card's behavior as a function, or (c) use a hybrid: a typed effect schema matched by card ID lookup. Given the "Golden Rule" (card text overrides base rules) and 282 unique cards, option (c) — a typed effect registry keyed by card ID — is the most practical. The effect schema defines the verbs (DealDamage, GainBlock, ApplyToken, Channel, Exhaust, etc.) and each card entry is a hand-authored list of those effects.

The second major challenge is **state mutation discipline**. With `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` on, TypeScript will force explicit null checks. All engine functions must return new state objects (spread-copy the relevant slices). Using `structuredClone` or targeted object spread is fine — no need for Immer given the small state size (< 200KB).

**Primary recommendation:** Model the engine as a pipeline of pure reducer functions (`(GameState, Action) => GameState`), use a typed effect registry for card effects, and test every rule boundary (caps, cancellations, ordering) with focused vitest unit tests.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.0 | Type system | Already in project; strict mode enforced |
| vitest | ^4.0.0 | Test runner | Already in both packages; `describe/it/expect` pattern established |
| zod | ^4.3.6 | Schema validation + type inference | Already the contract layer; extend existing schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | No new runtime dependencies needed — pure functions need no libraries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Typed effect registry | Text parsing | Parsing 282 cards' text is fragile and slow to write; registry is explicit |
| Typed effect registry | Full hardcode per card | Registry is a middle path: structured data, not 282 unique functions |
| Object spread for immutability | Immer | Immer adds dependency; state is small enough that manual spread is clear |
| vitest | jest | vitest is already installed, ESM-native, faster for this project |

**Installation:**
```bash
# No new packages required — vitest and zod already installed in packages/shared and packages/server
```

---

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/game/
├── engine/
│   ├── index.ts              # Public API: processAction(state, action) => GameState
│   ├── combat.ts             # Top-level combat reducer and phase transitions
│   ├── playerTurn.ts         # startPlayerTurn, playCard, endTurn
│   ├── enemyTurn.ts          # resolveEnemyTurn, resolveEnemyAction, advanceCube
│   ├── damage.ts             # applyHit, applyMultiHit, applyDamage, applyPoison
│   ├── status.ts             # Token application with caps
│   ├── deck.ts               # drawCards, shuffleDiscard, discardHand, scry
│   ├── characters/
│   │   ├── ironclad.ts       # Exhaust synergies, strength interactions
│   │   ├── silent.ts         # Shiv tokens, poison application
│   │   ├── defect.ts         # Orb channel/evoke/end-of-turn
│   │   └── watcher.ts        # Stance transitions, miracle tokens
│   ├── triggers.ts           # TriggerQueue: start-of-turn, end-of-turn, on-death
│   └── effects/
│       ├── registry.ts       # Map<cardId, CardEffect[]>
│       ├── types.ts          # Discriminated union of all effect verbs
│       └── resolve.ts        # resolveEffect(state, effect, context) => GameState
└── state/
    ├── combatState.ts        # CombatState schema (extends GameState for combat)
    └── enemyCombatState.ts   # EnemyCombatState (HP, block tokens, cube pos, tokens)
```

### Pattern 1: Pure Reducer Pipeline
**What:** Every engine function is `(state: GameState, ...) => GameState`. No mutation, no side effects. Compose small reducers into larger ones.
**When to use:** All combat transitions.
**Example:**
```typescript
// packages/server/src/game/engine/playerTurn.ts
export function startPlayerTurn(state: GameState): GameState {
  return {
    ...state,
    phase: 'PLAYER_ACTIONS',
    round: state.round + 1,
    dieResult: rollDie(),
    players: state.players.map(p => ({
      ...p,
      energy: 3,
      block: 0,
      endedTurn: false,
      hand: drawCards(p, 5).hand,
      drawPile: drawCards(p, 5).drawPile,
      discardPile: drawCards(p, 5).discardPile,
    })),
  };
}
```

### Pattern 2: Typed Effect Registry
**What:** Card effects are stored as a typed discriminated union. Each card ID maps to an ordered list of effects. The resolver dispatches on `effect.kind`.
**When to use:** Card effect resolution — replaces text parsing.
**Example:**
```typescript
// packages/server/src/game/engine/effects/types.ts
export type CardEffect =
  | { kind: 'DealDamage'; hits: number; amount: number; target: 'chosen' | 'all_row' | 'all' }
  | { kind: 'GainBlock'; amount: number; target: 'self' | 'any_player' }
  | { kind: 'ApplyToken'; token: 'vulnerable' | 'weak' | 'strength' | 'poison'; amount: number; target: 'chosen' | 'self' | 'all_row' }
  | { kind: 'Channel'; orbType: 'lightning' | 'frost' | 'dark'; count: number }
  | { kind: 'Evoke'; count: number }
  | { kind: 'EnterStance'; stance: 'calm' | 'wrath' | 'neutral' }
  | { kind: 'GainShiv'; count: number }
  | { kind: 'GainMiracle'; count: number }
  | { kind: 'DrawCards'; count: number }
  | { kind: 'Exhaust'; target: 'self' | 'chosen' }
  | { kind: 'Scry'; count: number }
  | { kind: 'AddCopyToDiscard' }
  // ... extend as needed

// packages/server/src/game/engine/effects/registry.ts
export const cardEffects: Record<string, CardEffect[]> = {
  'strike_r': [{ kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' }],
  'bash': [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'ApplyToken', token: 'vulnerable', amount: 2, target: 'chosen' },
  ],
  // ...
};
```

### Pattern 3: Damage Formula
**What:** The canonical damage formula for a hit, incorporating all modifiers in correct order.
**When to use:** Every hit (player attack, enemy attack, Shiv).
**Formula:** `finalDamage = Math.max(0, (base + strength) * (vulnerable ? 2 : 1) - (weak ? 1 : 0))`
- Note: Weak vs Vulnerable cancels both — check for co-occurrence first
- Weak applies per-hit; remove one token after entire multi-hit
- Vulnerable: double entire (base + strength); remove one token after entire multi-hit
- Strength added before Vulnerable doubling (confirmed rulebook p24)
**Example:**
```typescript
// packages/server/src/game/engine/damage.ts
export function calculateHitDamage(
  baseAmount: number,
  strengthTokens: number,
  attackerWeakTokens: number,
  defenderVulnerableTokens: number,
): number {
  const withStrength = baseAmount + strengthTokens;
  // Weak vs Vulnerable cancel each other
  if (attackerWeakTokens > 0 && defenderVulnerableTokens > 0) {
    return Math.max(0, withStrength);
  }
  const afterWeak = attackerWeakTokens > 0 ? Math.max(0, withStrength - 1) : withStrength;
  const afterVulnerable = defenderVulnerableTokens > 0 ? afterWeak * 2 : afterWeak;
  return Math.max(0, afterVulnerable);
}
```

### Pattern 4: Trigger Queue
**What:** All triggered abilities go into a queue rather than firing immediately. Process queue after the triggering event finishes. Prevents recursive loops.
**When to use:** Start-of-turn, end-of-turn, on-death triggers.
**Example:**
```typescript
// packages/server/src/game/engine/triggers.ts
export type Trigger =
  | { phase: 'START_OF_TURN'; playerId: string; source: 'relic' | 'power'; effectId: string }
  | { phase: 'END_OF_TURN'; playerId: string; source: 'relic' | 'power'; effectId: string }
  | { phase: 'ON_DEATH'; enemyId: string; effectId: string }

export function collectTriggers(state: GameState, phase: Trigger['phase']): Trigger[] {
  // Inspect relics and powers in play, return matching triggers
}

export function processTriggerQueue(state: GameState, triggers: Trigger[]): GameState {
  return triggers.reduce((s, t) => applyTrigger(s, t), state);
}
```

### Pattern 5: EnemyCombatState Schema Extension
**What:** The current `GameState.activeEnemies` is a `string[]` of IDs. Phase 2 needs full combat state per enemy. Extend with a parallel map.
**When to use:** All enemy combat operations.
**Example:**
```typescript
// packages/server/src/game/state/enemyCombatState.ts
import { z } from 'zod';

export const OrbTypeSchema = z.enum(['lightning', 'frost', 'dark']);
export type OrbType = z.infer<typeof OrbTypeSchema>;

export const EnemyCombatStateSchema = z.object({
  id: z.string(),            // references EnemyCard.id
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  block: z.number().int().min(0),
  row: z.number().int().min(0),  // 0 = top row
  isDead: z.boolean(),
  // Status tokens
  vulnerableTokens: z.number().int().min(0).max(3),
  weakTokens: z.number().int().min(0).max(3),
  strengthTokens: z.number().int().min(0).max(8),
  poisonTokens: z.number().int().min(0),  // capped at 30 total across all enemies
  // Action tracking
  cubePosition: z.number().int().min(0),  // current slot index for cube enemies
});
export type EnemyCombatState = z.infer<typeof EnemyCombatStateSchema>;
```

### Pattern 6: CombatTokens Extension on PlayerState
**What:** Extend `PlayerState` with character-specific combat tokens not in the current schema.
**When to use:** All character mechanic operations.
**Example:**
```typescript
// Extend PlayerStateSchema — add to gameState.ts
export const CombatTokensSchema = z.object({
  vulnerableTokens: z.number().int().min(0).max(3).default(0),
  weakTokens: z.number().int().min(0).max(3).default(0),
  strengthTokens: z.number().int().min(0).max(8).default(0),
  // Silent
  shivTokens: z.number().int().min(0).max(5).default(0),
  // Defect
  orbs: z.array(OrbTypeSchema).default([]),  // max orb slots per board (typically 3)
  // Watcher
  stance: z.enum(['neutral', 'calm', 'wrath']).default('neutral'),
  miracleTokens: z.number().int().min(0).max(5).default(0),
});
```

### Anti-Patterns to Avoid
- **Mutating state in place:** Never `state.players[0].hp -= 5`. Always return `{ ...state, players: state.players.map(...) }`.
- **Firing triggers inside card resolution:** Queue triggers; don't nest them. The rulebook explicitly says triggered abilities from a card don't fire until after the card finishes.
- **Using video game rules:** Orbs rotate in the video game, not the board game. Shivs are tokens (not cards) in the board game. Poison max is 30 combined. These are distinct.
- **Floating-point arithmetic:** All values are integers. Use `Math.floor` or integer arithmetic only.
- **Parsing card text at runtime:** Never regex the text field to determine effects. Use the effect registry.
- **Single giant `processAction` function:** Break into phase-specific modules that are individually testable.
- **`noUncheckedIndexedAccess` violations:** Arrays accessed by index return `T | undefined` in this config. Always check array access results.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Immutable state updates | Custom deep clone utility | `structuredClone()` (native) or targeted object spread | Built into Node 17+; no dependency |
| Type-safe schema extension | Parallel TypeScript interfaces | Extend Zod schemas with `.extend()` or `.merge()` | Already the project's contract layer |
| Test fixtures | Complex setup factories | Simple inline state builders per test | Keeps tests readable and self-contained |
| Random die roll | Crypto-secure random | `Math.floor(Math.random() * 6) + 1` | Die rolls are not security-sensitive |

**Key insight:** This phase is pure logic — the risk is in rule correctness, not in technical complexity. The hard work is getting the rules right, not the libraries.

---

## Common Pitfalls

### Pitfall 1: Vulnerable/Weak Token Removal Timing
**What goes wrong:** Removing the Vulnerable/Weak token after each hit in a multi-hit attack instead of after the entire attack.
**Why it happens:** Intuitive to remove immediately after each hit; rulebook is explicit that you remove one token when the entire multi-hit completes.
**How to avoid:** `applyMultiHit()` applies all hits first, then removes one token as a final step.
**Warning signs:** Tests show Vulnerable reduces only first hit of Twin Strike instead of all hits.

### Pitfall 2: Weak vs Vulnerable Cancellation
**What goes wrong:** Applying both modifiers when attacker is Weak AND defender is Vulnerable.
**Why it happens:** Easy to apply each modifier independently without checking for co-occurrence.
**How to avoid:** In `calculateHitDamage`, check for both flags first; if both present, apply neither and remove one of each.
**Warning signs:** A Weak attacker hitting a Vulnerable target still gets doubled damage.

### Pitfall 3: Strength Added After Vulnerable Doubling
**What goes wrong:** Applying Vulnerable doubling to (base + strength) but in wrong order — doubling base first, then adding strength.
**Why it happens:** Ambiguity in how to sequence modifiers.
**How to avoid:** Order is explicit: `(base + strength) * 2` — Strength is added first, then Vulnerable doubles the total. This is confirmed by the rulebook p24 example.
**Warning signs:** An Ironclad with 2 Strength hitting a Vulnerable enemy for "base 6" should deal (6+2)×2=16, not 6×2+2=14.

### Pitfall 4: Poison Max 30 is Shared Across All Enemies
**What goes wrong:** Applying Poison tokens per-enemy without checking the combined total.
**Why it happens:** Easy to cap per-enemy; the cap is actually across all active enemies simultaneously.
**How to avoid:** In `applyPoison()`, sum all existing poison tokens across `activeEnemies` before applying new tokens.
**Warning signs:** Two enemies each have 20 poison for a total of 40.

### Pitfall 5: Cube Position Advancement on Gray Slots
**What goes wrong:** Cube cycles back through gray (non-repeating) slots when looping.
**Why it happens:** Simple modulo cycling doesn't skip gray slots.
**How to avoid:** `advanceCube()` collects repeating slots only for the cycle; grays are one-time and excluded from the loop index.
**Warning signs:** An enemy with one gray "first-turn" slot keeps re-doing it after cycling.

### Pitfall 6: Energy Cap is 6, Max Starting Energy is 3
**What goes wrong:** Capping energy at 3 in `PlayerStateSchema` (current schema has `.max(3)`).
**Why it happens:** Schema from Phase 1 caps at 3; context says energy max is 6.
**How to avoid:** Update the energy field to `.max(6)` before implementing any energy-granting effects.
**Warning signs:** Miracles and energy-granting relics silently fail to push beyond 3.

### Pitfall 7: Card "Being Played" Is Absent from Hand and Discard
**What goes wrong:** Card effects that look at hand size or trigger on "discard" fire on the card currently being played.
**Why it happens:** Easiest implementation leaves the card in hand until cleanup.
**How to avoid:** During playCard(), remove the card from hand immediately before resolving effects, track it in a separate `beingPlayed` slot on player state, move to discard/exhaust during cleanup.
**Warning signs:** Ironclad's Dark Embrace (draw on exhaust) draws a card when the card itself is being exhausted, feeding a loop.

### Pitfall 8: Defect Orb Slot Overflow
**What goes wrong:** Channeling an Orb when all slots are full silently discards the Channel.
**Why it happens:** The rulebook says "if slots are full, evoke any orb first" — easy to forget the forced evoke.
**How to avoid:** In `channelOrb()`, check if `orbs.length >= maxOrbSlots`; if so, evoke player's choice of orb first, then channel. When multiple orbs channeled at once, process one at a time.
**Warning signs:** A player channels 3 orbs in one turn but only has 2 slots; the 3rd channel is silently dropped.

### Pitfall 9: Watcher Stance Enter-Same-Stance is a No-Op
**What goes wrong:** Entering Wrath when already in Wrath triggers the "enter Wrath" bonus again.
**Why it happens:** Easy to apply stance effects on every call to `enterStance()`.
**How to avoid:** `enterStance()` checks if already in target stance and returns state unchanged if so.
**Warning signs:** Playing two Eruptions in one turn applies +2 damage in Wrath instead of +1.

### Pitfall 10: TypeScript `noUncheckedIndexedAccess` Array Access
**What goes wrong:** `state.players[0].hp` fails type check because it's `PlayerState | undefined` under this config.
**Why it happens:** The project tsconfig has `"noUncheckedIndexedAccess": true`.
**How to avoid:** Always use `.find()`, `.at()`, or explicit undefined checks when accessing arrays by index.
**Warning signs:** Build errors `Object is possibly 'undefined'` throughout engine code.

---

## Code Examples

Verified patterns from existing codebase:

### Extending PlayerStateSchema with Combat Tokens
```typescript
// Source: packages/shared/src/schemas/gameState.ts (existing pattern, extend with .extend())
import { z } from 'zod';
import { PlayerStateSchema } from '@slay-online/shared';

// Extend — don't replace — the existing schema
export const CombatPlayerStateSchema = PlayerStateSchema.extend({
  // Fix energy cap (Phase 1 had max 3, Phase 2 needs max 6)
  energy: z.number().int().min(0).max(6),
  // Status tokens
  vulnerableTokens: z.number().int().min(0).max(3).default(0),
  weakTokens: z.number().int().min(0).max(3).default(0),
  strengthTokens: z.number().int().min(0).max(8).default(0),
  // Silent
  shivTokens: z.number().int().min(0).max(5).default(0),
  // Defect
  orbs: z.array(z.enum(['lightning', 'frost', 'dark'])).default([]),
  maxOrbSlots: z.number().int().positive().default(3),
  // Watcher
  stance: z.enum(['neutral', 'calm', 'wrath']).default('neutral'),
  miracleTokens: z.number().int().min(0).max(5).default(0),
});
export type CombatPlayerState = z.infer<typeof CombatPlayerStateSchema>;
```

### Vitest Test Pattern (from existing cards.test.ts)
```typescript
// Source: packages/shared/src/schemas/cards.test.ts
import { describe, it, expect } from 'vitest';

describe('applyHit — Vulnerable', () => {
  it('doubles damage when target has Vulnerable token', () => {
    const result = calculateHitDamage(6, 0, 0, 1); // 1 vulnerable
    expect(result).toBe(12);
  });

  it('adds Strength before doubling', () => {
    const result = calculateHitDamage(6, 2, 0, 1); // base 6, strength 2, vulnerable
    expect(result).toBe(16); // (6+2)*2
  });

  it('cancels with Weak when both present', () => {
    const result = calculateHitDamage(6, 0, 1, 1); // weak attacker, vulnerable target
    expect(result).toBe(6); // neither modifier applies
  });
});

describe('applyMultiHit — Twin Strike', () => {
  it('removes only one Vulnerable token after all hits', () => {
    const state = buildTestState({ enemy: { vulnerableTokens: 2 } });
    const result = applyMultiHit(state, { hits: 2, amount: 3, target: 'enemy_0' });
    expect(result.enemyState.vulnerableTokens).toBe(1); // 2 → 1, not 2 → 0
    expect(result.damageDealt).toBe(12); // (3*2) + (3*2) = 12
  });
});
```

### Cube Action Advancement
```typescript
// packages/server/src/game/engine/enemyTurn.ts
export function advanceCubePosition(
  enemy: EnemyCombatState,
  pattern: { kind: 'cube'; slots: { text: string; repeating: boolean }[] },
): number {
  const nextPos = enemy.cubePosition + 1;
  if (nextPos >= pattern.slots.length) {
    // Loop back — find first repeating slot
    const firstRepeating = pattern.slots.findIndex(s => s.repeating);
    return firstRepeating === -1 ? 0 : firstRepeating;
  }
  return nextPos;
}
```

### Poison Application with Global Cap
```typescript
// packages/server/src/game/engine/status.ts
export function applyPoison(
  state: CombatGameState,
  targetEnemyId: string,
  amount: number,
): CombatGameState {
  const totalExisting = Object.values(state.enemyCombatStates)
    .reduce((sum, e) => sum + e.poisonTokens, 0);
  const canApply = Math.min(amount, 30 - totalExisting);
  if (canApply <= 0) return state;
  return {
    ...state,
    enemyCombatStates: {
      ...state.enemyCombatStates,
      [targetEnemyId]: {
        ...state.enemyCombatStates[targetEnemyId]!,
        poisonTokens: state.enemyCombatStates[targetEnemyId]!.poisonTokens + canApply,
      },
    },
  };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 1: enemies as string IDs only | Phase 2: full EnemyCombatState per active enemy | Phase 2 | Need parallel combat state map alongside activeEnemies |
| Phase 1: card effects as raw text strings | Phase 2: typed effect registry | Phase 2 | Engine can dispatch on `effect.kind` rather than parsing text |
| PlayerState energy capped at 3 | Energy capped at 6 (Miracles, relics can push beyond 3) | Phase 2 | Requires schema update before implementing energy effects |

**Deprecated/outdated:**
- `activeEnemies: string[]` on GameState: still needed for ordering, but a parallel `enemyCombatStates: Record<string, EnemyCombatState>` map is required for Phase 2 combat logic. Consider whether to replace or augment the existing field.

---

## Open Questions

1. **Where does the engine live: `packages/server/src/game/` or `packages/shared/src/engine/`?**
   - What we know: Context says "packages/server/src/game/ (or packages/shared/src/engine/ if client needs it for predictions)"
   - What's unclear: Phase 3 (Session Management) will call the engine; whether the client needs to run predictions is not scoped for Phase 2
   - Recommendation: Place in `packages/server/src/game/` for Phase 2. If client-side prediction is needed in a later phase, move to shared then. Keeping it server-only is simpler and Phase 3's WebSocket layer is server-side anyway.

2. **How to handle the "Golden Rule" (card text overrides base rules)?**
   - What we know: This is in Claude's Discretion
   - What's unclear: Some cards have atypical interaction patterns that break general rules
   - Recommendation: The effect registry handles this naturally — special cards get special effect entries rather than relying on generic resolution. No need for a separate "Golden Rule" mechanism; the registry is the override.

3. **GameState schema extension strategy: extend in place or create CombatGameState?**
   - What we know: GameState is in packages/shared and is used by both server and client. Combat tokens are server-side concerns during Phase 2.
   - Recommendation: Create `CombatGameState` as an extended type in `packages/server/src/game/state/`. The server hydrates from `GameState` → `CombatGameState` when entering combat, and strips back to `GameState` when broadcasting to clients. This keeps the shared schema clean.

4. **Effect registry authoring scope for Phase 2**
   - What we know: 282 unique cards exist across 4 characters. Not all are Act 1 encounter rewards.
   - What's unclear: Do all 282 cards need effects in Phase 2, or just the cards needed for Act 1 combat?
   - Recommendation: Author effects only for cards that can appear in Act 1 play (starter decks + Act 1 card rewards). Stub remaining cards with `{ kind: 'Unimplemented' }` to prevent silent failures during testing.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.0 |
| Config file | `packages/shared/vitest.config.ts` (exists), `packages/server/` has no vitest.config.ts yet |
| Quick run command | `pnpm --filter @slay-online/server test` |
| Full suite command | `pnpm test` (runs all packages) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMBT-01 | Energy resets to 3, block resets to 0 at start of turn | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-02 | Draw 5 cards; reshuffle discard when draw pile empty | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-03 | Die result set once per round on GameState | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-04 | Start-of-turn triggers fire in declared player order | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-05 | Multiple players can play cards concurrently in PLAYER_ACTIONS | integration | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-06 | Card resolution pipeline: cost paid → effects resolved → cleanup | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-07 | Phase transitions to WAITING_FOR_ALL_PLAYERS when all players endedTurn | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-08 | End-of-turn triggers fire after all players signal | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-09 | Hand discarded at end of turn (except Retain cards) | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-10 | Enemies lose all block at start of enemy turn | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-11 | Enemy action order: row 0 L→R, row 1 L→R, ..., boss last | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-12 | Single/die/cube patterns each resolve correctly | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-13 | Cube position advances; gray slots skipped on loop | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CMBT-14 | Dead enemy loses tokens, flips; dead player ends game | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-01 | Vulnerable doubles damage; capped at 3 tokens | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-02 | Weak reduces damage by 1 per hit; capped at 3 tokens | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-03 | Strength +1 per hit per token; added before Vulnerable; capped at 8 | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-04 | Poison loses 1 HP per token end-of-turn; ignores block; max 30 combined | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-05 | Block prevents damage; max 20 for players | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-06 | Multi-hit: Vulnerable/Weak token removed once after all hits | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-07 | Weak vs Vulnerable: both cancel; one of each removed | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-08 | Exhaust removes card from available cards for combat | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-09 | Ethereal cards exhaust at end of turn if in hand | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-10 | Retain prevents discard at end of turn | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| MECH-11 | Scry: view top X cards, optionally discard some | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CHAR-01 | Ironclad Strength synergies and exhaust pile interactions | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CHAR-02 | Silent Poison (max 30 combined) and Shiv tokens (max 5, each a separate Attack) | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CHAR-03 | Defect Orb channel/evoke/end-of-turn (any orb, any slot, force-evoke when full) | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |
| CHAR-04 | Watcher Stances (no re-enter, Calm bonus on leave, Wrath damage + end damage), Miracles | unit | `pnpm --filter @slay-online/server test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @slay-online/server test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/server/vitest.config.ts` — no vitest config exists in packages/server yet
- [ ] `packages/server/src/game/engine/__tests__/` directory — no test files exist
- [ ] `packages/server/src/game/engine/__tests__/helpers.ts` — shared test state builders (buildTestGameState, buildTestEnemy, etc.)
- [ ] Framework already installed: `vitest ^4.0.0` in packages/server devDependencies

---

## Sources

### Primary (HIGH confidence)
- Rulebook text (`/home/chris/projects/slay-the-spire/rulebook.txt`) — Combat rules p12-13, status effect rules p14/24, character mechanics p16-17, triggered abilities p19, keywords p24 (back of rulebook)
- `packages/shared/src/schemas/gameState.ts` — Existing PlayerState and GameState shapes
- `packages/shared/src/schemas/cards.ts` — PlayerCard schema with existing flags (exhaust, ethereal, retain, innate)
- `packages/shared/src/schemas/enemies.ts` — EnemyActionPattern discriminated union (single/die/cube)
- `packages/shared/src/schemas/cards.test.ts` — Established vitest test pattern for this project
- `packages/shared/package.json` / `packages/server/package.json` — vitest ^4.0.0, zod ^4.3.6, TypeScript ^5.9.0

### Secondary (MEDIUM confidence)
- TypeScript strict options from `tsconfig.base.json` — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strict: true` — verified by reading file directly

### Tertiary (LOW confidence)
- None — all findings verified from project files and rulebook text directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json files directly; no new dependencies needed
- Architecture: HIGH — patterns derived from existing codebase conventions and rulebook source of truth
- Pitfalls: HIGH — derived from careful reading of rulebook text; damage formula order verified against p24 examples
- Rule interactions: HIGH — read from rulebook.txt directly; noted where board game diverges from video game

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain — board game rules don't change; TypeScript/vitest are stable at these versions)
