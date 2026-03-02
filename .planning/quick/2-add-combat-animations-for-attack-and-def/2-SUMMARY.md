---
phase: quick
plan: 2
subsystem: client-combat-ui
tags: [animations, css, solid-js, combat, visual-feedback]
dependency_graph:
  requires: []
  provides: [combat-animations]
  affects: [CombatView, EnemyZone, EnemyCard]
tech_stack:
  added: []
  patterns: [CSS keyframe animations, SolidJS signals for animation state, position absolute overlays]
key_files:
  created:
    - packages/client/src/components/combat/CombatAnimations.tsx
    - packages/client/src/components/combat/CombatAnimations.module.css
  modified:
    - packages/client/src/components/combat/CombatView.tsx
    - packages/client/src/components/combat/CombatView.module.css
    - packages/client/src/components/combat/EnemyCard.tsx
    - packages/client/src/components/combat/EnemyCard.module.css
    - packages/client/src/components/combat/EnemyZone.tsx
decisions:
  - "Animation signal cleared via setTimeout(500ms) after card play — animation CSS duration is 400-450ms, 50ms buffer prevents flicker"
  - "CombatAnimations rendered twice: once in enemy zone wrapper (attack), once in board wrapper (defend) — each Show gate prevents unnecessary DOM nodes"
  - "hitEnemyId threaded through EnemyZone to EnemyCard via props — minimal prop drilling for direct enemy flash targeting"
  - "animationContainer uses position: relative so absolute overlays are contained within each zone"
metrics:
  duration: ~2min
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_changed: 7
---

# Quick Task 2: Add Combat Animations for Attack and Defend — Summary

**One-liner:** CSS keyframe slash/impact and shield-shimmer overlays triggered by SolidJS signals on card play, with per-enemy hit flash via hitEnemyId prop threading.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create CombatAnimations component with CSS keyframe effects | b1fe81f | CombatAnimations.tsx, CombatAnimations.module.css |
| 2 | Wire animations into CombatView card play handlers | eeacb0b | CombatView.tsx, CombatView.module.css, EnemyCard.tsx, EnemyCard.module.css, EnemyZone.tsx |

## What Was Built

### CombatAnimations Component
- `AnimationEvent` type: `{ type: 'attack' | 'defend'; targetEnemyId?: string }`
- `CombatAnimations(props: { animation: AnimationEvent | null })` with conditional `Show` rendering
- Position absolute, pointer-events none, z-index 50 on both overlays

### Attack Animation (slashAnimation)
- Diagonal linear-gradient slash band animating from transparent to bright white/yellow at 20%, then red-orange glow at 50%, fading to opacity 0 at 100%
- Duration: 400ms ease-out forwards
- Supplemental shake keyframe (200ms, +-2px translateX) for impact feel

### Defend Animation (shieldShimmer)
- Radial-gradient circle starting at scale 0.5 opacity 0, expanding to full scale at 30% with blue-gray glow (--color-block #546e7a), shimmer sweep at 60%, fading out at 100%
- Duration: 450ms ease-out forwards

### Enemy Hit Flash
- `.hit` CSS class on EnemyCard with `hitFlash` keyframe: brightness(1.8) + red box-shadow at 30%, back to normal at 100%
- Duration: 300ms
- Activated by `hitEnemyId === enemyId` classList check

### CombatView Wiring
- `animation` signal: `createSignal<AnimationEvent | null>(null)`
- Non-Attack card play: `setAnimation({ type: 'defend' })`, cleared after 500ms
- Enemy click (Attack): `setAnimation({ type: 'attack', targetEnemyId: enemyId })`, cleared after 500ms
- Enemy zone wrapped in `animationContainer` div with attack CombatAnimations overlay
- Player board wrapped in `animationContainer` div with defend CombatAnimations overlay

## Decisions Made

1. **Animation signal cleared via setTimeout(500ms):** Animation CSS duration is 400-450ms. The 50ms buffer ensures the CSS animation completes before the DOM node is removed.

2. **CombatAnimations rendered in two locations with Show gates:** Attack overlay lives in the enemy zone wrapper, defend overlay in the player board wrapper. Each `Show` prevents unnecessary DOM nodes when not animating.

3. **hitEnemyId prop threading through EnemyZone to EnemyCard:** Minimal prop drilling added to EnemyZone (one new optional prop) and EnemyCard (one new optional prop + classList entry). No new state or context needed.

4. **animationContainer uses position: relative:** The `.enemies` and `.board` grid areas need a relative-positioned inner container so the absolute overlay is clipped to that zone, not the entire viewport.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `packages/client/src/components/combat/CombatAnimations.tsx` — created
- [x] `packages/client/src/components/combat/CombatAnimations.module.css` — created
- [x] `packages/client/src/components/combat/CombatView.tsx` — modified
- [x] `packages/client/src/components/combat/CombatView.module.css` — modified
- [x] `packages/client/src/components/combat/EnemyCard.tsx` — modified
- [x] `packages/client/src/components/combat/EnemyCard.module.css` — modified
- [x] `packages/client/src/components/combat/EnemyZone.tsx` — modified
- [x] Commit b1fe81f exists
- [x] Commit eeacb0b exists
- [x] TypeScript compiles cleanly: `npx tsc --noEmit` passes with no errors

## Self-Check: PASSED
