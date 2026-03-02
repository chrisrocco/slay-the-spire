---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/combat/EnemyCard.tsx
  - packages/client/src/components/combat/EnemyCard.module.css
  - packages/client/src/components/combat/EnemyZone.tsx
  - packages/client/src/components/combat/CombatView.tsx
  - packages/client/src/utils/enemyIntent.ts
autonomous: true
requirements: [INTENT-DISPLAY]

must_haves:
  truths:
    - "Player can see what each enemy intends to do this turn"
    - "Intent shows the action type (attack, block, buff, debuff) with specific values"
    - "Die-pattern enemies show intent based on current dieResult"
    - "Cube-pattern enemies show intent based on their cubePosition"
    - "Single-pattern enemies always show their one action"
    - "Intent updates when game state changes (new round, new die result)"
  artifacts:
    - path: "packages/client/src/utils/enemyIntent.ts"
      provides: "Intent resolution logic — maps enemy pattern + game state to display text and icon"
      exports: ["getEnemyIntent", "IntentInfo"]
    - path: "packages/client/src/components/combat/EnemyCard.tsx"
      provides: "Intent display section on each enemy card"
    - path: "packages/client/src/components/combat/EnemyCard.module.css"
      provides: "Intent display styling"
  key_links:
    - from: "packages/client/src/utils/enemyIntent.ts"
      to: "packages/client/src/utils/enemyLookup.ts"
      via: "getEnemyOrPlaceholder to resolve EnemyCard data"
      pattern: "getEnemyOrPlaceholder"
    - from: "packages/client/src/components/combat/EnemyCard.tsx"
      to: "packages/client/src/utils/enemyIntent.ts"
      via: "getEnemyIntent call with enemyId, cubePosition, dieResult"
      pattern: "getEnemyIntent"
---

<objective>
Display enemy intents during combat so players can see what each enemy plans to do (attack with damage values, block amounts, buff/debuff effects).

Purpose: Core combat UI requirement — players need intent information to make strategic card-play decisions, just like in the board game where enemy action cubes/die results are visible.

Output: Intent badges on each enemy card showing their current action with parsed type icons and specific values.
</objective>

<execution_context>
@/home/chris/.claude/get-shit-done/workflows/execute-plan.md
@/home/chris/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/shared/src/schemas/enemies.ts
@packages/shared/src/data/enemies/encounters.ts
@packages/client/src/components/combat/EnemyCard.tsx
@packages/client/src/components/combat/EnemyCard.module.css
@packages/client/src/components/combat/EnemyZone.tsx
@packages/client/src/components/combat/CombatView.tsx
@packages/client/src/utils/enemyLookup.ts
@packages/server/src/game/state/enemyCombatState.ts

<interfaces>
<!-- Key types the executor needs -->

From packages/shared/src/schemas/enemies.ts:
```typescript
export type EnemyActionPattern =
  | { kind: 'single'; description: string }
  | { kind: 'die'; description: string; actions: Record<string, string> }
  | { kind: 'cube'; description: string; slots: Array<{ text: string; repeating: boolean }> };

export type EnemyCard = {
  id: string; name: string; act: 1;
  category: 'encounter' | 'elite' | 'boss' | 'summon' | 'first_encounter';
  hp: EnemyHP; pattern: EnemyActionPattern;
  specialAbilities: string[]; summons: string[];
  rewards: { gold: number; cardReward: boolean; potionReward: boolean; relicReward: boolean };
};
```

From packages/client/src/components/combat/EnemyCard.tsx:
```typescript
export interface EnemyCombatInfo {
  hp: number; maxHp: number; block: number; isDead: boolean;
  vulnerableTokens: number; weakTokens: number;
  strengthTokens: number; poisonTokens: number;
}
// Note: cubePosition is on EnemyCombatState (server) but NOT on EnemyCombatInfo (client).
// The server broadcasts CombatGameState which includes enemyCombatStates with cubePosition.
// CombatView accesses it via type assertion: (g as Record<string, unknown>)['enemyCombatStates']
```

From packages/server/src/game/state/enemyCombatState.ts:
```typescript
// The actual server EnemyCombatState includes cubePosition:
export const EnemyCombatStateSchema = z.object({
  id: string, hp: number, maxHp: number, block: number,
  row: number, isDead: boolean,
  vulnerableTokens: number, weakTokens: number,
  strengthTokens: number, poisonTokens: number,
  cubePosition: number,  // <-- needed for intent resolution
});
```

From packages/client/src/components/combat/CombatView.tsx:
```typescript
// dieResult is available on GameState: g().dieResult (number | null)
// enemyCombatStates accessed via type assertion from game state
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create intent resolution utility and extend EnemyCombatInfo</name>
  <files>packages/client/src/utils/enemyIntent.ts, packages/client/src/components/combat/EnemyCard.tsx</files>
  <action>
1. Create `packages/client/src/utils/enemyIntent.ts` with:

```typescript
export type IntentType = 'attack' | 'block' | 'buff' | 'debuff' | 'mixed' | 'unknown';

export interface IntentInfo {
  type: IntentType;
  text: string;        // The raw action text (e.g., "Deal 3 damage. Gain 1 Strength.")
  summary: string;     // Short display (e.g., "3 dmg + 1 Str")
  icon: string;        // Unicode icon for the intent type
}
```

Implement `getEnemyIntent(enemyId: string, cubePosition: number, dieResult: number | null): IntentInfo`:
  - Use `getEnemyOrPlaceholder(enemyId)` from enemyLookup.ts to get the EnemyCard
  - For `kind: 'single'` — always return the description
  - For `kind: 'die'` — look up `pattern.actions[String(dieResult)]`, return "Waiting for die" if dieResult is null
  - For `kind: 'cube'` — look up `pattern.slots[cubePosition].text`
  - Parse the action text to determine IntentType:
    - Contains "Deal X damage" -> 'attack'
    - Contains "Gain X Block" -> 'block'
    - Contains "Gain X Strength" -> 'buff'
    - Contains "Apply X Vulnerable" or "Apply X Weak" -> 'debuff'
    - Multiple effect types -> 'mixed'
  - Parse summary from action text: extract numbers and effect names into compact form (e.g., "Deal 3 damage. Gain 1 Strength." -> "3 dmg + 1 Str")
  - Icon mapping: attack -> crossed swords U+2694, block -> shield U+1F6E1, buff -> up arrow U+2B06, debuff -> down arrow U+2B07, mixed -> lightning U+26A1, unknown -> question U+2753

2. In `EnemyCard.tsx`, extend `EnemyCombatInfo` to include `cubePosition: number` so intent data flows through. Add the field as optional with a default of 0 for backward compatibility:
```typescript
export interface EnemyCombatInfo {
  // ... existing fields ...
  cubePosition: number;  // Add this — needed for cube-pattern intent resolution
}
```

This is safe because the server's CombatGameState already broadcasts `cubePosition` as part of `enemyCombatStates` — the client just wasn't reading it.
  </action>
  <verify>
    <automated>cd /home/chris/projects/slay-the-spire && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>enemyIntent.ts exports getEnemyIntent and IntentInfo. EnemyCombatInfo includes cubePosition. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Display intent on EnemyCard and pass dieResult through component tree</name>
  <files>packages/client/src/components/combat/EnemyCard.tsx, packages/client/src/components/combat/EnemyCard.module.css, packages/client/src/components/combat/EnemyZone.tsx, packages/client/src/components/combat/CombatView.tsx</files>
  <action>
1. **EnemyCard.tsx** — Add intent display section:
  - Import `getEnemyIntent` from `../../utils/enemyIntent.ts`
  - Add `dieResult?: number | null` to `EnemyCardProps`
  - Create a reactive `intent()` signal: `const intent = () => getEnemyIntent(props.enemyId, props.combatState?.cubePosition ?? 0, props.dieResult ?? null);`
  - Add an intent display section between the portrait and HP bar:
    ```jsx
    <Show when={props.combatState && !isDead()}>
      <div class={styles.intentSection}>
        <span class={styles.intentIcon}>{intent().icon}</span>
        <span class={styles.intentText}>{intent().summary}</span>
      </div>
    </Show>
    ```
  - Only show intent when the enemy has combat state and is alive

2. **EnemyCard.module.css** — Add intent styling:
  ```css
  .intentSection {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    min-height: 28px;
  }

  .intentIcon {
    font-size: 0.9rem;
  }

  .intentText {
    font-size: 0.7rem;
    color: var(--text-primary, #e0e0e0);
    font-weight: 600;
    text-align: center;
  }
  ```
  Color-code by adding intent-type classes if desired, but keep it simple — the icon already communicates type.

3. **EnemyZone.tsx** — Pass `dieResult` through:
  - Add `dieResult: number | null` to `EnemyZoneProps`
  - Pass it to each `EnemyCardComponent`: `dieResult={props.dieResult}`

4. **CombatView.tsx** — Wire dieResult to EnemyZone:
  - Add `dieResult={g().dieResult}` prop to the `<EnemyZone>` component call (line ~80)
  </action>
  <verify>
    <automated>cd /home/chris/projects/slay-the-spire && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>Each enemy card displays an intent badge showing the action type icon and a compact summary with specific values (e.g., crossed-swords "3 dmg" for attacks, shield "3 block" for defense). Intent updates reactively when dieResult or cubePosition changes. Dead enemies show no intent.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles with no errors: `cd packages/client && npx tsc --noEmit`
2. Visual check: Enemy cards in combat show intent badges between portrait and HP bar
3. Intent correctly reflects enemy pattern type:
   - Single-pattern enemies: always show their one action
   - Cube-pattern enemies: show the action at their current cubePosition
   - Die-pattern enemies: show the action matching the current dieResult
</verification>

<success_criteria>
- Every living enemy in combat displays a visible intent indicator
- Intent shows both the type (via icon) and specific values (damage numbers, block amounts, buff/debuff details)
- Intent is reactive — updates when game state changes (new round with new die result, cube advances)
- Dead enemies do not show intent
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-display-enemy-intents-during-combat/1-SUMMARY.md`
</output>
