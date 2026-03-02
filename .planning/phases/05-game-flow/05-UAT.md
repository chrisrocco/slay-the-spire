---
status: resolved
phase: 05-game-flow
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md, 05-07-SUMMARY.md, 05-08-SUMMARY.md
started: 2026-03-02T04:30:00Z
updated: 2026-03-02T06:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navigate map with node selection
expected: Host can click available nodes on the map. Node becomes current with boot meeple indicator. Floor grouping displays correctly.
result: issue
reported: "The web page hangs in the loading state with 'Connecting to server...'. The websocket gets connected and sends 'hello' and 'ping', but the state doesn't update."
severity: blocker

### 2. Enter encounter and receive rewards
expected: Clicking encounter node starts combat. After defeating enemies, REWARDS phase appears with gold, card choices, and possibly potions. Selecting/skipping rewards returns to MAP.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 3. Enter elite and receive enhanced rewards
expected: Clicking elite node shows enemy with reduced HP (Preserved Insect). After defeat, elite rewards appear (gold + card + potion + relic). Phase transitions to MAP when all players choose.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 4. Select card from combat rewards
expected: After combat, player sees card reward options. Clicking a card adds it to deck. Phase transitions to MAP when all players choose.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 5. Accept potion from rewards
expected: Potion appears in rewards. Clicking "Take" adds to potion slots. Disabled if at capacity (3 slots, or 5 with Potion Belt).
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 6. Skip combat rewards
expected: Player can click "Skip" to decline rewards. Phase advances when all players have chosen or skipped.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 7. Boss relic selection after boss fight
expected: After boss combat, BOSS_REWARD phase shows (playerCount + 1) relic options. Clicking relic adds to inventory. Taken relics grayed out. Returns to MAP.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 8. Use potion during combat
expected: In COMBAT phase, clicking potion slot shows action menu. "Use" resolves potion effects (heal, buffs, damage). Potion removed from slots after use.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 9. Pass potion to another player
expected: In MAP phase, clicking potion shows action menu. "Pass" shows player list. Selecting player transfers potion to their slots.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 10. Discard potion
expected: In any phase, clicking potion shows action menu. "Discard" removes potion permanently.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 11. Event room choices
expected: Clicking event node shows event title, flavor text, and choice buttons. Selecting choice applies effects (heal/damage/gold/curse/relic/card changes). Per-player status shown. Transitions to MAP when all choose.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 12. Campfire rest
expected: Clicking campfire shows options. Selecting "Rest" heals 3 HP (+3 with Regal Pillow). Coffee Dripper blocks rest. Transitions to MAP when all choose.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 13. Campfire smith (upgrade card)
expected: Selecting "Smith" shows deck cards. Clicking card upgrades it. Fusion Hammer blocks smith.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 14. Treasure room
expected: Treasure resolves instantly — player receives relic(s). Cursed Key adds curse. Matryoshka gives 2 relics. Transitions to MAP automatically.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 15. Merchant buy card
expected: Merchant shows cards with prices. Clicking "Buy" deducts gold, adds card to deck. Item removed from shop.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 16. Merchant remove card
expected: "Remove" shows deck cards. Clicking removes card permanently. Free with Smiling Mask. Once per visit — button grays out after use.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 17. Leave merchant
expected: Clicking "Leave" closes merchant. Phase transitions to MAP.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

### 18. Map overlay during combat
expected: Floating "Map" button top-right during COMBAT. Clicking shows read-only map overlay showing current position and connections.
result: skipped
reason: Blocked by Test 1 blocker — app stuck on loading screen

## Summary

total: 18
passed: 0
issues: 1
pending: 0
skipped: 17

## Gaps

- truth: "Host can click available nodes on the map. Node becomes current with boot meeple indicator. Floor grouping displays correctly."
  status: resolved
  reason: "User reported: The web page hangs in the loading state with 'Connecting to server...'. The websocket gets connected and sends 'hello' and 'ping', but the state doesn't update."
  severity: blocker
  test: 1
  root_cause: "Chicken-and-egg deadlock: client waits for server message to transition from 'connecting' phase, server sends nothing on connect, lobby UI gated behind 'lobby' phase. WebSocket connected signal exists but is never consumed to drive phase transition."
  artifacts:
    - path: "packages/client/src/app.tsx"
      issue: "onMount does not trigger phase transition on connect; lobby UI gated behind 'lobby' phase"
    - path: "packages/client/src/stores/gameStore.ts"
      issue: "Initial phase 'connecting' has no transition path from WebSocket open event"
    - path: "packages/client/src/services/websocket.ts"
      issue: "connected signal exported but never consumed"
    - path: "packages/server/src/index.ts"
      issue: "No welcome/init message sent to newly connected clients"
  missing:
    - "Watch connection.connected() signal in app.tsx and transition to 'lobby' phase when true"
    - "Revert to 'connecting' on disconnect when not in-game"
  debug_session: ".planning/debug/websocket-loading-blocker.md"
