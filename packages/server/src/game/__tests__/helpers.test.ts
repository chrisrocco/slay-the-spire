import { describe, it, expect } from 'vitest';
import { CombatPlayerStateSchema, CombatGameStateSchema } from '../state/combatState.js';
import { EnemyCombatStateSchema } from '../state/enemyCombatState.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

describe('Test helpers', () => {
  it('buildTestPlayer returns valid CombatPlayerState', () => {
    const player = buildTestPlayer();
    const result = CombatPlayerStateSchema.safeParse(player);
    expect(result.success).toBe(true);
  });

  it('buildTestEnemy returns valid EnemyCombatState', () => {
    const enemy = buildTestEnemy();
    const result = EnemyCombatStateSchema.safeParse(enemy);
    expect(result.success).toBe(true);
  });

  it('buildTestGameState returns valid CombatGameState', () => {
    const state = buildTestGameState();
    const result = CombatGameStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  it('buildTestPlayer overrides work', () => {
    const player = buildTestPlayer({ hp: 50, energy: 5 });
    expect(player.hp).toBe(50);
    expect(player.energy).toBe(5);
    expect(player.maxHp).toBe(80); // default preserved
  });

  it('buildTestEnemy overrides work', () => {
    const enemy = buildTestEnemy({ hp: 100, maxHp: 100, row: 2 });
    expect(enemy.hp).toBe(100);
    expect(enemy.row).toBe(2);
    expect(enemy.isDead).toBe(false); // default preserved
  });

  it('buildTestGameState with custom players and enemies', () => {
    const player = buildTestPlayer({ character: 'silent' });
    const enemy = buildTestEnemy({ id: 'cultist', maxHp: 48, hp: 48 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { cultist: enemy },
      phase: 'ENEMY_TURN',
      round: 3,
      dieResult: 4,
    });

    expect(state.players[0]!.character).toBe('silent');
    expect(state.enemyCombatStates['cultist']!.maxHp).toBe(48);
    expect(state.phase).toBe('ENEMY_TURN');
    expect(state.round).toBe(3);
    expect(state.dieResult).toBe(4);
  });
});
