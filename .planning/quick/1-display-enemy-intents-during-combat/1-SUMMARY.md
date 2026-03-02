---
phase: quick
plan: 1
subsystem: combat-ui
tags: [combat, enemy, intent, ui, solidjs]
dependency_graph:
  requires: []
  provides: [enemy-intent-display]
  affects: [EnemyCard, EnemyZone, CombatView]
tech_stack:
  added: []
  patterns: [reactive-derived-signal, utility-module]
key_files:
  created:
    - packages/client/src/utils/enemyIntent.ts
  modified:
    - packages/client/src/components/combat/EnemyCard.tsx
    - packages/client/src/components/combat/EnemyCard.module.css
    - packages/client/src/components/combat/EnemyZone.tsx
    - packages/client/src/components/combat/CombatView.tsx
decisions:
  - getEnemyIntent is a pure function (not a store) — SolidJS reactivity is achieved by calling it inside arrow functions that depend on reactive props
  - summary parser uses targeted regex per known effect type, falling back to truncated raw text for unrecognized patterns
  - cubePosition added to EnemyCombatInfo as a required field (not optional) since server always broadcasts it via EnemyCombatStateSchema
metrics:
  duration: ~2min
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_changed: 5
---

# Quick 1: Display Enemy Intents During Combat Summary

**One-liner:** Intent badges on each enemy card showing action type icon and compact value summary (e.g., "⚔ 3 dmg", "🛡 5 blk") derived from enemy pattern + live game state.

## What Was Built

Enemy intent display for the combat UI. Each living enemy card now shows a small badge between its portrait and HP bar that communicates what the enemy intends to do this turn.

The implementation consists of:

1. **`packages/client/src/utils/enemyIntent.ts`** — Pure intent resolution utility:
   - `getEnemyIntent(enemyId, cubePosition, dieResult)` resolves the current action text for all three enemy pattern kinds (single/die/cube)
   - `parseIntentType()` classifies action text into attack/block/buff/debuff/mixed/unknown via keyword matching
   - `parseSummary()` extracts compact display strings from raw action text using targeted regex (e.g., "Deal 3 damage. Gain 1 Strength." → "3 dmg + 1 Str")
   - Icon mapping: attack → ⚔, block → 🛡, buff → ⬆, debuff → ⬇, mixed → ⚡, unknown → ❓

2. **`EnemyCard.tsx`** — Intent display:
   - Added `dieResult?: number | null` to props
   - Added `cubePosition: number` to `EnemyCombatInfo` (server already broadcasts this field)
   - Reactive `intent()` arrow function calls `getEnemyIntent` using live props
   - Intent badge rendered between portrait and HP bar, hidden for dead enemies

3. **`EnemyZone.tsx`** — Plumbing: added `dieResult: number | null` to props, forwarded to each card.

4. **`CombatView.tsx`** — Wiring: passes `g().dieResult` to `<EnemyZone>`.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit --project packages/client/tsconfig.json` — clean (no errors)
- Logic: all three pattern kinds (single/die/cube) handled; die-pattern enemies show "Waiting…" when dieResult is null
- Reactivity: intent() is a derived signal inside SolidJS render functions — updates automatically when props change

## Self-Check

### Created files exist:
- packages/client/src/utils/enemyIntent.ts — FOUND
- packages/client/src/components/combat/EnemyCard.module.css (modified) — FOUND
- packages/client/src/components/combat/EnemyCard.tsx (modified) — FOUND
- packages/client/src/components/combat/EnemyZone.tsx (modified) — FOUND
- packages/client/src/components/combat/CombatView.tsx (modified) — FOUND

### Commits exist:
- eccec07 feat(quick-1): create intent resolution utility and extend EnemyCombatInfo — FOUND
- fad3462 feat(quick-1): display intent badge on each enemy card in combat — FOUND

## Self-Check: PASSED
