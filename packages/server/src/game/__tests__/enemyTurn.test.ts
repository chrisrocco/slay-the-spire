import { describe, it, expect } from 'vitest';
import {
  sortEnemiesByActionOrder,
  resolveEnemyAction,
  advanceCubePosition,
  removeEnemyBlock,
  checkDeaths,
  isAllEnemiesDead,
  resolveEnemyTurn,
} from '../engine/enemyTurn.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';
import type { EnemyCard } from '@slay-online/shared';

const makeEnemyCard = (overrides?: Partial<EnemyCard>): EnemyCard => ({
  id: 'jaw_worm',
  name: 'Jaw Worm',
  act: 1,
  category: 'encounter',
  hp: 20,
  pattern: { kind: 'single', description: 'Deal 5 damage' },
  specialAbilities: [],
  summons: [],
  rewards: { gold: 10, cardReward: true, potionReward: false, relicReward: false },
  ...overrides,
});

describe('sortEnemiesByActionOrder', () => {
  it('sorts by row ascending', () => {
    const e1 = buildTestEnemy({ id: 'a', row: 1 });
    const e2 = buildTestEnemy({ id: 'b', row: 0 });

    const lookup = (id: string) => makeEnemyCard({ id });
    const sorted = sortEnemiesByActionOrder([e1, e2], lookup);

    expect(sorted[0]!.id).toBe('b');
    expect(sorted[1]!.id).toBe('a');
  });

  it('bosses go last', () => {
    const normal = buildTestEnemy({ id: 'normal', row: 0 });
    const boss = buildTestEnemy({ id: 'boss', row: 0 });

    const lookup = (id: string) =>
      id === 'boss'
        ? makeEnemyCard({ id: 'boss', category: 'boss' })
        : makeEnemyCard({ id });

    const sorted = sortEnemiesByActionOrder([boss, normal], lookup);
    expect(sorted[0]!.id).toBe('normal');
    expect(sorted[1]!.id).toBe('boss');
  });
});

describe('resolveEnemyAction', () => {
  it('resolves single action — deals damage', () => {
    const player = buildTestPlayer({ hp: 50 });
    const enemy = buildTestEnemy({ id: 'jaw_worm' });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 3,
    });

    const card = makeEnemyCard({ pattern: { kind: 'single', description: 'Deal 5 damage' } });
    const result = resolveEnemyAction(state, enemy, card, 3);
    expect(result.players[0]!.hp).toBe(45);
  });

  it('resolves die action based on die result', () => {
    const player = buildTestPlayer({ hp: 50 });
    const enemy = buildTestEnemy({ id: 'cultist' });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { cultist: enemy },
      dieResult: 3,
    });

    const card = makeEnemyCard({
      id: 'cultist',
      pattern: {
        kind: 'die',
        description: 'Die action',
        actions: {
          '1': 'Deal 3 damage',
          '2': 'Deal 3 damage',
          '3': 'Deal 6 damage',
          '4': 'Deal 6 damage',
          '5': 'Gain 3 Strength',
          '6': 'Gain 3 Strength',
        },
      },
    });

    const result = resolveEnemyAction(state, enemy, card, 3);
    expect(result.players[0]!.hp).toBe(44); // Deal 6 damage
  });

  it('resolves cube action and advances position', () => {
    const player = buildTestPlayer({ hp: 50 });
    const enemy = buildTestEnemy({ id: 'gremlin', cubePosition: 0 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { gremlin: enemy },
    });

    const card = makeEnemyCard({
      id: 'gremlin',
      pattern: {
        kind: 'cube',
        description: 'Cube action',
        slots: [
          { text: 'Deal 4 damage', repeating: false },
          { text: 'Deal 7 damage', repeating: true },
          { text: 'Gain 5 Block', repeating: true },
        ],
      },
    });

    const result = resolveEnemyAction(state, enemy, card, 0);
    expect(result.players[0]!.hp).toBe(46); // Deal 4 from slot 0
    expect(result.enemyCombatStates['gremlin']!.cubePosition).toBe(1);
  });

  it('resolves "Gain X Block" action', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', block: 0 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const card = makeEnemyCard({ pattern: { kind: 'single', description: 'Gain 8 Block' } });
    const result = resolveEnemyAction(state, enemy, card, 0);
    expect(result.enemyCombatStates['jaw_worm']!.block).toBe(8);
  });
});

describe('advanceCubePosition', () => {
  it('advances normally within bounds', () => {
    const pattern = {
      kind: 'cube' as const,
      description: 'test',
      slots: [
        { text: 'A', repeating: false },
        { text: 'B', repeating: true },
        { text: 'C', repeating: true },
      ],
    };
    expect(advanceCubePosition(0, pattern)).toBe(1);
    expect(advanceCubePosition(1, pattern)).toBe(2);
  });

  it('loops to first repeating slot after end', () => {
    const pattern = {
      kind: 'cube' as const,
      description: 'test',
      slots: [
        { text: 'A', repeating: false },
        { text: 'B', repeating: true },
        { text: 'C', repeating: true },
      ],
    };
    expect(advanceCubePosition(2, pattern)).toBe(1); // loops to first repeating (index 1)
  });

  it('loops to 0 if no repeating slots', () => {
    const pattern = {
      kind: 'cube' as const,
      description: 'test',
      slots: [
        { text: 'A', repeating: false },
        { text: 'B', repeating: false },
      ],
    };
    expect(advanceCubePosition(1, pattern)).toBe(0);
  });
});

describe('removeEnemyBlock', () => {
  it('sets all enemy block to 0', () => {
    const e1 = buildTestEnemy({ id: 'a', block: 10 });
    const e2 = buildTestEnemy({ id: 'b', block: 5 });
    const state = buildTestGameState({ enemyCombatStates: { a: e1, b: e2 } });

    const result = removeEnemyBlock(state);
    expect(result.enemyCombatStates['a']!.block).toBe(0);
    expect(result.enemyCombatStates['b']!.block).toBe(0);
  });
});

describe('checkDeaths', () => {
  it('marks dead enemies', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 0, isDead: false, vulnerableTokens: 2 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = checkDeaths(state);
    const e = result.enemyCombatStates['jaw_worm']!;
    expect(e.isDead).toBe(true);
    expect(e.vulnerableTokens).toBe(0);
    expect(e.weakTokens).toBe(0);
    expect(e.strengthTokens).toBe(0);
    expect(e.poisonTokens).toBe(0);
    expect(e.block).toBe(0);
  });

  it('does not reprocess already dead enemies', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 0, isDead: true });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = checkDeaths(state);
    expect(result).toEqual(state);
  });

  it('sets COMBAT_END when player dies', () => {
    const player = buildTestPlayer({ hp: 0 });
    const state = buildTestGameState({ players: [player], phase: 'ENEMY_TURN' });

    const result = checkDeaths(state);
    expect(result.phase).toBe('COMBAT_END');
    expect(result.combatLog.some((l) => l.includes('Game Over'))).toBe(true);
  });

  it('leaves living enemies unchanged', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 10 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = checkDeaths(state);
    expect(result.enemyCombatStates['jaw_worm']!.isDead).toBe(false);
  });
});

describe('isAllEnemiesDead', () => {
  it('returns true when all dead', () => {
    const state = buildTestGameState({
      enemyCombatStates: {
        a: buildTestEnemy({ id: 'a', isDead: true }),
        b: buildTestEnemy({ id: 'b', isDead: true }),
      },
    });
    expect(isAllEnemiesDead(state)).toBe(true);
  });

  it('returns false when any alive', () => {
    const state = buildTestGameState({
      enemyCombatStates: {
        a: buildTestEnemy({ id: 'a', isDead: true }),
        b: buildTestEnemy({ id: 'b', isDead: false }),
      },
    });
    expect(isAllEnemiesDead(state)).toBe(false);
  });
});

describe('resolveEnemyTurn', () => {
  it('resolves full turn: remove block, act, check deaths', () => {
    const player = buildTestPlayer({ hp: 50 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20, block: 5 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 3,
      phase: 'ENEMY_TURN',
    });

    const lookup = (_id: string) => makeEnemyCard({ pattern: { kind: 'single', description: 'Deal 8 damage' } });
    const result = resolveEnemyTurn(state, lookup);

    expect(result.players[0]!.hp).toBe(42); // 50 - 8
    expect(result.enemyCombatStates['jaw_worm']!.block).toBe(0); // block removed
    expect(result.phase).toBe('CLEANUP');
  });

  it('sets COMBAT_END when all enemies killed', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 0, isDead: true });
    const state = buildTestGameState({
      enemyCombatStates: { jaw_worm: enemy },
      phase: 'ENEMY_TURN',
    });

    const lookup = (_id: string) => makeEnemyCard();
    const result = resolveEnemyTurn(state, lookup);
    expect(result.phase).toBe('COMBAT_END');
  });
});
