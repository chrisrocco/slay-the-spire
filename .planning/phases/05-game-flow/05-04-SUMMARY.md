---
phase: 05-game-flow
plan: "04"
subsystem: reward-system
tags: [rewards, combat-rewards, tdd, relic-interactions, card-rewards, potion-rewards, boss-relics]
dependency_graph:
  requires: [05-01]
  provides: [generateRewards, generateBossRelicChoices, handleRewardPickCard, handleRewardPickPotion, handleRewardPickRelic, handleRewardSkip, areAllRewardsChosen]
  affects:
    - packages/server/src/game/rewardHandler.ts
    - packages/server/src/game/__tests__/rewards.test.ts
tech_stack:
  added: []
  patterns: [TDD red-green, weighted rarity sampling, rng-based card/relic pool draws, egg relic auto-upgrade pattern]
key_files:
  created:
    - packages/server/src/game/__tests__/rewards.test.ts
  modified:
    - packages/server/src/game/rewardHandler.ts
decisions:
  - generateRewards uses a single rng function for all draws, enabling deterministic tests via seeded rng
  - Potion reward generation checks ALL players' capacity — if any player can hold a potion, one is offered
  - Relic rarity weighted draw: 50% common / 33% uncommon / 17% rare; falls back to all tiers if chosen tier exhausted
  - Golden Ticket treated as an unreleased relic (not in relics.ts data) — flag stored on CardReward for client rendering
  - Singing Bowl uses special 'max_hp' cardId sentinel to distinguish HP gain from card pick
  - handleRewardPickRelic uses deterministic fallback rng (0.5) for on-pickup effects (War Paint/Whetstone upgrades)
  - areAllRewardsChosen checks bossRelicPicked field via type assertion for boss reward flow compatibility
metrics:
  duration_minutes: 4
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_modified: 2
---

# Phase 5 Plan 04: Combat Rewards Generation and Selection Summary

Full reward system: encounter/elite/boss reward generation with weighted rarity draws, all relic modifiers (Question Card, Busted Crown, Golden Idol, Black Star, Egg relics, Ceramic Fish, Singing Bowl), potion limit enforcement, and on-pickup relic effects.

## What Was Built

### Reward Generation (packages/server/src/game/rewardHandler.ts)

**`generateRewards(state, roomType, rng): ExtendedRewardState`**

- **encounter**: 10-20 gold per player, 1 card reward per player (3 cards from player's character pool, non-starter cards only, excluding already-owned cards)
- **elite**: 25-35 gold, 1 card reward per player, potion reward (skipped if all players at capacity), relic reward from weighted rarity pool (50% common / 33% uncommon / 17% rare)
- **boss**: card rewards + (boss relic selection handled by `generateBossRelicChoices`)

**Relic modifiers applied during generation:**
- Golden Idol: +1 gold from all sources
- Question Card: +1 card in reward (4 total)
- Busted Crown: -2 cards in reward (minimum 1)
- Golden Ticket: guarantees one rare card in reward, sets `hasRare: true` flag on CardReward
- Potion Belt: raises per-player potion capacity from 3 to 5
- Black Star: adds `extraRelicReward` field to elite reward (second relic from common/uncommon/rare pool)

**`generateBossRelicChoices(state, playerCount, rng): string[]`**

- Offers `playerCount + 1` unique boss relics (or 3 for solo)
- Never offers a relic already owned by any player
- Returns array of boss relic IDs for client display

### Reward Selection Handlers

**`handleRewardPickCard(state, playerId, cardId)`**
- Adds card to player's `drawPile`
- Singing Bowl: if `cardId === 'max_hp'`, gains 2 Max HP instead of adding card to deck
- Molten Egg: auto-upgrades Attack cards (appends `_upgraded` suffix)
- Frozen Egg: auto-upgrades Power cards
- Toxic Egg: auto-upgrades Skill cards
- Ceramic Fish: +1 gold when adding card to deck

**`handleRewardPickPotion(state, playerId)`**
- Validates potion capacity (3 default, 5 with Potion Belt)
- Rejects silently (returns unchanged state) if at limit
- Adds `potionReward` ID to player's `potions` array

**`handleRewardPickRelic(state, playerId)`**
- Adds `relicReward` to player's `relics` array
- Applies on-pickup effects:
  - Strawberry: +1 Max HP
  - Mango: +1 Max HP
  - Pear: +2 Max HP
  - Old Coin: +3 gold
  - War Paint: upgrade 2 random Skills in drawPile
  - Whetstone: upgrade 2 random Attacks in drawPile

**`handleRewardSkip(state, playerId)`**
- Sets `skipped: true` in playerChoices
- No changes to deck, potions, relics, or gold

**`areAllRewardsChosen(state)`**
- Returns `true` only when every player has `cardPicked !== null || potionPicked || relicPicked || skipped || bossRelicPicked != null`
- Returns `false` if no `rewardState` exists

### Test Coverage (packages/server/src/game/__tests__/rewards.test.ts)

44 tests across 8 describe blocks:
- `generateRewards - encounter`: 5 tests (gold range, card count per player, character pool, no potion/relic)
- `generateRewards - elite`: 4 tests (gold range, all reward types, relic exclusion, Black Star extra relic)
- `generateRewards - boss`: 4 tests (choice count, solo = 3, uniqueness, boss-only relics)
- `generateRewards - relic modifiers`: 7 tests (Question Card, Busted Crown, Golden Ticket, Golden Idol, potion limit, Potion Belt, upgraded flag)
- `handleRewardPickCard`: 7 tests (drawPile add, choice marked, Molten/Frozen/Toxic Egg, Ceramic Fish, Singing Bowl max_hp)
- `handleRewardPickPotion`: 4 tests (add potion, choice marked, limit rejection, Potion Belt allows 5)
- `handleRewardPickRelic`: 9 tests (add relic, choice marked, Strawberry/Pear/Mango/Old Coin/War Paint/Whetstone)
- `handleRewardSkip`: 1 test (skip without state changes)
- `areAllRewardsChosen`: 4 tests (partial false, all chosen true, no reward state, boss relic flow)

## Verification Results

- All 44 reward tests pass
- Full test suite: 421/421 tests pass
- `pnpm typecheck`: All 3 packages compile without errors

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written.

### Notes

- The `rewardHandler.ts` implementation was committed in the same session as plan 05-03 (labeled `feat(05-05)` in commit history) due to a session that ran ahead of the plan ordering. The plan 04 TDD cycle was completed correctly: RED tests committed in `3b9db1a`, GREEN implementation committed in `b837d3e`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| RED (Task 1+2 tests) | 3b9db1a | test(05-05): add potionManagement and gameInit MAP phase tests (TDD RED+GREEN) |
| GREEN (Task 1+2 impl) | b837d3e | feat(05-05): implement reward handler with full generation and selection |

## Self-Check: PASSED
