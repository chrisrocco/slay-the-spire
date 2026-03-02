---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/combat/CombatAnimations.tsx
  - packages/client/src/components/combat/CombatAnimations.module.css
  - packages/client/src/components/combat/CombatView.tsx
  - packages/client/src/components/combat/EnemyCard.module.css
autonomous: true
requirements: [QUICK-2]

must_haves:
  truths:
    - "When an Attack card is played on an enemy, a slash/impact animation appears on that enemy card"
    - "When a Skill card is played, a shield shimmer animation appears on the player stats area"
    - "Animations complete quickly (~400ms) and do not block further card plays"
  artifacts:
    - path: "packages/client/src/components/combat/CombatAnimations.tsx"
      provides: "Animation overlay component and animation state management"
    - path: "packages/client/src/components/combat/CombatAnimations.module.css"
      provides: "CSS keyframe animations for slash and shield effects"
  key_links:
    - from: "CombatView.tsx handleCardSelected/handleEnemyClick"
      to: "CombatAnimations animation triggers"
      via: "SolidJS signal setAnimation()"
      pattern: "setAnimation.*type.*attack|defend"
---

<objective>
Add satisfying CSS-driven combat animations for attack and defend card plays.

Purpose: Visual feedback when cards are played makes combat feel responsive and satisfying. Attack cards show a slash/impact on the targeted enemy, Skill cards show a shield shimmer on the player area.
Output: CombatAnimations component with CSS keyframe animations, wired into CombatView card play handlers.
</objective>

<execution_context>
@/home/chris/.claude/get-shit-done/workflows/execute-plan.md
@/home/chris/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/components/combat/CombatView.tsx
@packages/client/src/components/combat/CombatView.module.css
@packages/client/src/components/combat/EnemyCard.tsx
@packages/client/src/components/combat/EnemyCard.module.css
@packages/client/src/components/combat/PlayerBoard.tsx
@packages/client/src/components/combat/PlayerStats.module.css
@packages/client/src/styles/variables.module.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CombatAnimations component with CSS keyframe effects</name>
  <files>packages/client/src/components/combat/CombatAnimations.tsx, packages/client/src/components/combat/CombatAnimations.module.css</files>
  <action>
Create a CombatAnimations component that renders animation overlays based on a reactive animation state signal.

**CombatAnimations.tsx:**
- Export an `AnimationEvent` type: `{ type: 'attack' | 'defend'; targetEnemyId?: string }`
- Export the component `CombatAnimations(props: { animation: AnimationEvent | null })`
- When `props.animation` is non-null with type 'attack': render a slash overlay div (positioned via CSS in the enemy zone area — the parent CombatView will position it). The overlay uses `position: absolute` over the enemies grid area. Use `onAnimationEnd` to clean up (the parent will clear the signal after timeout).
- When `props.animation` is non-null with type 'defend': render a shield shimmer overlay div positioned over the player board area.
- Each animation div auto-removes after the CSS animation completes (~400ms) via `onAnimationEnd`.
- Use `Show` from solid-js for conditional rendering.

**CombatAnimations.module.css:**
- `.attackOverlay`: position absolute, inset 0, pointer-events none, z-index 50. Runs `slashAnimation` keyframe.
- `@keyframes slashAnimation`:
  - 0%: A diagonal line (using linear-gradient or pseudo-elements) at opacity 0, rotated slightly
  - 20%: opacity 1, a bright white/yellow slash line across the center (use background: linear-gradient with a thin sharp band)
  - 50%: slash expands with a red-orange glow (box-shadow or radial-gradient burst)
  - 100%: opacity 0, scale slightly enlarged — fades out
  - Duration: 400ms, ease-out, forwards
  - Add a brief screen-shake effect: use a wrapper with a `@keyframes shake` that translates +-2px over 200ms

- `.defendOverlay`: position absolute, inset 0, pointer-events none, z-index 50. Runs `shieldShimmer` keyframe.
- `@keyframes shieldShimmer`:
  - 0%: A semi-transparent blue-gray shield shape (radial-gradient circle) at scale 0.5, opacity 0
  - 30%: scale 1, opacity 0.7, border glow using box-shadow with var(--color-block, #546e7a)
  - 60%: shimmer sweep — moving linear-gradient highlight across (use background-position animation)
  - 100%: opacity 0, scale 1.1
  - Duration: 450ms, ease-out, forwards
  - Color: Use the existing --color-block (#546e7a) variable for consistency

Both overlays: `animation-fill-mode: forwards`, no `pointer-events` so gameplay is never blocked.
  </action>
  <verify>
    <automated>cd /home/chris/projects/slay-the-spire && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>CombatAnimations.tsx exports AnimationEvent type and component. CSS module has slashAnimation and shieldShimmer keyframes. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Wire animations into CombatView card play handlers</name>
  <files>packages/client/src/components/combat/CombatView.tsx, packages/client/src/components/combat/CombatView.module.css, packages/client/src/components/combat/EnemyCard.module.css</files>
  <action>
**CombatView.tsx modifications:**
- Import `CombatAnimations` and `AnimationEvent` from `./CombatAnimations.tsx`
- Add signal: `const [animation, setAnimation] = createSignal<AnimationEvent | null>(null);`
- In `handleCardSelected`: when a non-Attack card is auto-played (the `card.type !== 'Attack'` branch), after calling `props.send()`, set `setAnimation({ type: 'defend' })`. Then `setTimeout(() => setAnimation(null), 500)` to clear after animation completes.
- In `handleEnemyClick`: after calling `props.send()`, set `setAnimation({ type: 'attack', targetEnemyId: enemyId })`. Then `setTimeout(() => setAnimation(null), 500)` to clear.
- Render `<CombatAnimations animation={animation()} />` twice:
  1. Inside the `.enemies` div wrapper (for attack animations overlaying enemy zone). Wrap the existing EnemyZone and the attack CombatAnimations in a container with `position: relative`. Only pass animation when type is 'attack'.
  2. Inside the `.board` div wrapper (for defend animations overlaying player board). Wrap existing PlayerBoard and the defend CombatAnimations in a container with `position: relative`. Only pass animation when type is 'defend'.

**CombatView.module.css modifications:**
- Add `.animationContainer`: position relative, width 100%, height 100% (to contain the absolute-positioned animation overlays).

**EnemyCard.module.css addition:**
- Add `.hit` class: brief animation `@keyframes hitFlash` — 0%: normal, 30%: brightness(1.8) with red-tinted box-shadow, 100%: normal. Duration 300ms. This class gets toggled on the specific targeted enemy card.

**EnemyCard hit flash wiring (in CombatView.tsx):**
- Pass a `hitEnemyId` prop through to EnemyZone. When animation type is 'attack', the `targetEnemyId` identifies which enemy card should get the `.hit` class. Since EnemyZone iterates enemies, pass the hitEnemyId as a prop to EnemyZone, and forward it to EnemyCardComponent. In EnemyCard.tsx, add `hitEnemyId` to classList check: `[styles.hit]: props.hitEnemyId === props.enemyId`. Note: This means also updating EnemyZone.tsx and EnemyCard.tsx to accept and use the `hitEnemyId` prop.

Update the files_modified to also include:
- packages/client/src/components/combat/EnemyZone.tsx (add hitEnemyId prop passthrough)
- packages/client/src/components/combat/EnemyCard.tsx (add hit classList)
  </action>
  <verify>
    <automated>cd /home/chris/projects/slay-the-spire && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>Playing an Attack card on an enemy triggers slash overlay on enemy zone and hit flash on the targeted enemy card. Playing a Skill card triggers shield shimmer on player board. Animations auto-clear after ~500ms. TypeScript compiles cleanly. No gameplay is blocked by animations (pointer-events: none).</done>
</task>

</tasks>

<verification>
- TypeScript compiles: `cd packages/client && npx tsc --noEmit`
- Visual check: Start the app, play an Attack card targeting an enemy — see slash animation + enemy flash. Play a Skill/Defend card — see shield shimmer on player area.
- Animations do not prevent subsequent card plays (pointer-events: none on overlays).
- Animations complete and clean up (no lingering DOM elements after 500ms).
</verification>

<success_criteria>
- Attack card plays produce visible slash/impact animation on the enemy zone, with the targeted enemy card flashing
- Skill card plays produce visible shield shimmer animation on the player board area
- Animations last ~400-450ms and do not interfere with gameplay input
- All existing combat functionality (card selection, targeting, end turn) works unchanged
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/2-add-combat-animations-for-attack-and-def/2-SUMMARY.md`
</output>
