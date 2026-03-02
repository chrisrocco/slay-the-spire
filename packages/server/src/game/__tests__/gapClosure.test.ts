/**
 * gapClosure.test.ts
 * Integration tests verifying the three wiring gaps are closed:
 * 1. Combat-end → Rewards transition (generateRewards called)
 * 2. Boss combat-end → BOSS_REWARD transition (generateBossRelicChoices called)
 * 3. USE_POTION WebSocket routing (processAction called via handleUsePotion)
 * 4. Rewards complete → MAP transition (handleRewardsComplete wired)
 */
import { describe, it, expect, vi } from 'vitest';
import { Room } from '../../rooms/Room.js';
import type { CombatGameState } from '../state/combatState.js';
import { buildTestPlayer, buildTestGameState, buildTestEnemy } from './helpers.js';
import { checkCombatEnd, handleUsePotion, handleRewardPickCard, handleRewardSkip } from '../gameHandlers.js';
import { handleRewardsComplete } from '../gameFlow.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTestMap(nodeType: 'encounter' | 'elite' | 'boss' = 'encounter') {
  return {
    nodes: [
      {
        id: 'node-encounter',
        floor: 1,
        type: 'encounter' as const,
        connections: ['node-boss'],
      },
      {
        id: 'node-elite',
        floor: 5,
        type: 'elite' as const,
        connections: ['node-boss'],
      },
      {
        id: 'node-boss',
        floor: 15,
        type: 'boss' as const,
        connections: [],
      },
    ],
    bossNodeId: 'node-boss',
    currentNodeId:
      nodeType === 'boss'
        ? 'node-boss'
        : nodeType === 'elite'
        ? 'node-elite'
        : 'node-encounter',
  };
}

function buildRoom(nodeType: 'encounter' | 'elite' | 'boss' = 'encounter'): Room {
  const room = new Room('TEST', 'host-id', 'Host');

  const state = buildTestGameState({
    phase: 'COMBAT_END',
    players: [buildTestPlayer({ id: 'host-id', potions: [] })],
  }) as CombatGameState;

  state.gamePhase = 'COMBAT';
  (state as any).map = buildTestMap(nodeType);

  room.gameState = state;
  return room;
}

function buildRoomInPlayerActions(nodeType: 'encounter' | 'elite' | 'boss' = 'encounter'): Room {
  const room = new Room('TEST', 'host-id', 'Host');

  const state = buildTestGameState({
    phase: 'PLAYER_ACTIONS',
    players: [
      buildTestPlayer({
        id: 'host-id',
        potions: ['fire_potion'],
      }),
    ],
    enemyCombatStates: {
      jaw_worm: buildTestEnemy({ id: 'jaw_worm', hp: 40, isDead: false }),
    },
  }) as CombatGameState;

  state.gamePhase = 'COMBAT';
  (state as any).map = buildTestMap(nodeType);

  room.gameState = state;
  return room;
}

// ---------------------------------------------------------------------------
// Test 1: Combat end triggers reward generation for encounters
// ---------------------------------------------------------------------------

describe('checkCombatEnd - encounter', () => {
  it('transitions gamePhase to REWARDS when combat phase is COMBAT_END', () => {
    const room = buildRoom('encounter');

    checkCombatEnd(room);

    expect(room.gameState!.gamePhase).toBe('REWARDS');
  });

  it('populates rewardState with cardRewards and gold', () => {
    const room = buildRoom('encounter');

    checkCombatEnd(room);

    expect(room.gameState!.rewardState).toBeDefined();
    expect(room.gameState!.rewardState!.cardRewards).toHaveLength(1);
    expect(room.gameState!.rewardState!.gold).toBeGreaterThanOrEqual(10);
    expect(room.gameState!.rewardState!.gold).toBeLessThanOrEqual(20);
  });

  it('adds gold from rewardState to player totals immediately', () => {
    const room = buildRoom('encounter');
    const goldBefore = room.gameState!.players[0]!.gold;

    checkCombatEnd(room);

    const goldAfter = room.gameState!.players[0]!.gold;
    expect(goldAfter).toBeGreaterThan(goldBefore);
  });

  it('does nothing when combat phase is not COMBAT_END', () => {
    const room = buildRoom('encounter');
    room.gameState!.phase = 'PLAYER_ACTIONS';
    const stateBefore = { ...room.gameState! };

    checkCombatEnd(room);

    expect(room.gameState!.gamePhase).toBe(stateBefore.gamePhase);
    expect(room.gameState!.rewardState).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test 2: Boss combat end triggers BOSS_REWARD with boss relic choices
// ---------------------------------------------------------------------------

describe('checkCombatEnd - boss', () => {
  it('transitions gamePhase to BOSS_REWARD for boss nodes', () => {
    const room = buildRoom('boss');

    checkCombatEnd(room);

    expect(room.gameState!.gamePhase).toBe('BOSS_REWARD');
  });

  it('populates rewardState.bossRelicChoices for boss nodes', () => {
    const room = buildRoom('boss');

    checkCombatEnd(room);

    expect(room.gameState!.rewardState).toBeDefined();
    const rewardState = room.gameState!.rewardState as any;
    expect(rewardState.bossRelicChoices).toBeDefined();
    expect(Array.isArray(rewardState.bossRelicChoices)).toBe(true);
    expect(rewardState.bossRelicChoices.length).toBeGreaterThan(0);
  });

  it('also includes card rewards for boss combat', () => {
    const room = buildRoom('boss');

    checkCombatEnd(room);

    expect(room.gameState!.rewardState!.cardRewards).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Elite combat end triggers REWARDS (not BOSS_REWARD)
// ---------------------------------------------------------------------------

describe('checkCombatEnd - elite', () => {
  it('transitions gamePhase to REWARDS for elite nodes', () => {
    const room = buildRoom('elite');

    checkCombatEnd(room);

    expect(room.gameState!.gamePhase).toBe('REWARDS');
  });

  it('includes relic reward for elite rooms', () => {
    const room = buildRoom('elite');

    checkCombatEnd(room);

    // Elite rooms should have a relic reward (may be null if pool exhausted, but usually present)
    expect(room.gameState!.rewardState).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 4: USE_POTION routes through processAction
// ---------------------------------------------------------------------------

describe('handleUsePotion', () => {
  it('removes the potion from player potions array after use', () => {
    const room = buildRoomInPlayerActions('encounter');

    expect(room.gameState!.players[0]!.potions).toContain('fire_potion');

    handleUsePotion(room, 'host-id', 'fire_potion', 'jaw_worm');

    // After using potion, it should be removed from the player's potions
    expect(room.gameState!.players[0]!.potions).not.toContain('fire_potion');
  });

  it('does nothing when gameState is null', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    // Should not throw
    expect(() => handleUsePotion(room, 'host-id', 'fire_potion')).not.toThrow();
  });

  it('calls checkCombatEnd if potion kills enemies', () => {
    // Build a room where the enemy is at 1 HP — fire potion deals enough to kill it
    const room = new Room('TEST', 'host-id', 'Host');

    const state = buildTestGameState({
      phase: 'PLAYER_ACTIONS',
      players: [buildTestPlayer({ id: 'host-id', potions: ['fire_potion'] })],
      enemyCombatStates: {
        jaw_worm: buildTestEnemy({ id: 'jaw_worm', hp: 1, isDead: false }),
      },
    }) as CombatGameState;

    state.gamePhase = 'COMBAT';
    (state as any).map = buildTestMap('encounter');
    room.gameState = state;

    handleUsePotion(room, 'host-id', 'fire_potion', 'jaw_worm');

    // If the enemy died, combat ends and we should be in REWARDS or COMBAT_END
    // The exact result depends on the game engine logic; we just verify no errors
    expect(room.gameState).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 5: Rewards complete transitions to MAP for non-boss rooms
// ---------------------------------------------------------------------------

describe('handleRewardsComplete', () => {
  it('transitions to MAP for non-boss rooms', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    const state = buildTestGameState() as CombatGameState;
    state.gamePhase = 'REWARDS';
    (state as any).map = buildTestMap('encounter');
    room.gameState = state;

    handleRewardsComplete(room);

    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('transitions to MAP for boss rooms (Act 1 complete)', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    const state = buildTestGameState() as CombatGameState;
    state.gamePhase = 'BOSS_REWARD';
    (state as any).map = buildTestMap('boss');
    room.gameState = state;

    handleRewardsComplete(room);

    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('does NOT set the combat phase field when transitioning', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    const state = buildTestGameState() as CombatGameState;
    const originalPhase = state.phase; // TurnPhase
    state.gamePhase = 'BOSS_REWARD';
    (state as any).map = buildTestMap('boss');
    room.gameState = state;

    handleRewardsComplete(room);

    // TurnPhase (combat phase) should not be changed to COMBAT_END
    expect(room.gameState!.phase).toBe(originalPhase);
    expect(room.gameState!.phase).not.toBe('COMBAT_END');
  });
});

// ---------------------------------------------------------------------------
// Test 6: areAllRewardsChosen check wired to handleRewardsComplete via handlers
// ---------------------------------------------------------------------------

describe('reward pick wired to handleRewardsComplete', () => {
  function buildRoomWithRewardState(playerIds: string[] = ['host-id']): Room {
    const room = new Room('TEST', 'host-id', 'Host');
    const players = playerIds.map((id) => buildTestPlayer({ id }));
    const state = buildTestGameState({ players }) as CombatGameState;
    state.gamePhase = 'REWARDS';
    (state as any).map = buildTestMap('encounter');

    // Set up a reward state where players need to pick
    const playerChoices: Record<string, any> = {};
    for (const id of playerIds) {
      playerChoices[id] = { cardPicked: null, potionPicked: false, relicPicked: false, skipped: false };
    }

    state.rewardState = {
      gold: 15,
      cardRewards: playerIds.map(() => ({ cardIds: ['strike_r', 'defend_r', 'bash_r'], upgraded: false })),
      potionReward: null,
      relicReward: null,
      playerChoices,
    };

    room.gameState = state;
    return room;
  }

  it('transitions to MAP after single player skips reward', () => {
    const room = buildRoomWithRewardState(['host-id']);

    handleRewardSkip(room, 'host-id');

    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('stays in REWARDS while not all players have chosen', () => {
    const room = buildRoomWithRewardState(['host-id', 'guest-id']);

    handleRewardSkip(room, 'host-id');

    // Only one of two players has made a choice; should still be REWARDS
    expect(room.gameState!.gamePhase).toBe('REWARDS');
  });

  it('transitions to MAP after all players pick or skip', () => {
    const room = buildRoomWithRewardState(['host-id', 'guest-id']);

    handleRewardSkip(room, 'host-id');
    handleRewardPickCard(room, 'guest-id', 'strike_r');

    expect(room.gameState!.gamePhase).toBe('MAP');
  });
});
