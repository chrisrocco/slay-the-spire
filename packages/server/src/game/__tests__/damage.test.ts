import { describe, it, expect } from 'vitest';
import { calculateHitDamage, applyDamage, applyMultiHit } from '../engine/damage.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

describe('calculateHitDamage', () => {
  it('returns base damage with no modifiers', () => {
    expect(calculateHitDamage(6, 0, 0, 0)).toBe(6);
  });

  it('adds strength to base damage', () => {
    expect(calculateHitDamage(6, 2, 0, 0)).toBe(8);
  });

  it('doubles damage when defender is vulnerable', () => {
    expect(calculateHitDamage(6, 0, 0, 1)).toBe(12);
  });

  it('applies strength THEN vulnerable doubling', () => {
    // (6 + 2) * 2 = 16
    expect(calculateHitDamage(6, 2, 0, 1)).toBe(16);
  });

  it('reduces damage by 1 when attacker is weak', () => {
    expect(calculateHitDamage(6, 0, 1, 0)).toBe(5);
  });

  it('cancels weak and vulnerable — no modifier applied', () => {
    // Weak + Vulnerable cancel: base + strength only
    expect(calculateHitDamage(6, 0, 1, 1)).toBe(6);
  });

  it('does not go below 0', () => {
    expect(calculateHitDamage(1, 0, 1, 0)).toBe(0);
  });

  it('handles zero base damage', () => {
    expect(calculateHitDamage(0, 0, 0, 0)).toBe(0);
  });

  it('handles zero base with strength and vulnerable', () => {
    // (0 + 3) * 2 = 6
    expect(calculateHitDamage(0, 3, 0, 1)).toBe(6);
  });
});

describe('applyDamage', () => {
  it('reduces HP when no block', () => {
    const player = buildTestPlayer({ hp: 50, block: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = applyDamage(state, 'player', 'player-1', 10);
    expect(result.players[0]!.hp).toBe(40);
    expect(result.players[0]!.block).toBe(0);
  });

  it('block absorbs damage first', () => {
    const player = buildTestPlayer({ hp: 50, block: 5 });
    const state = buildTestGameState({ players: [player] });

    const result = applyDamage(state, 'player', 'player-1', 10);
    expect(result.players[0]!.hp).toBe(45);
    expect(result.players[0]!.block).toBe(0);
  });

  it('block absorbs all damage if block >= damage', () => {
    const player = buildTestPlayer({ hp: 50, block: 15 });
    const state = buildTestGameState({ players: [player] });

    const result = applyDamage(state, 'player', 'player-1', 10);
    expect(result.players[0]!.hp).toBe(50);
    expect(result.players[0]!.block).toBe(5);
  });

  it('applies damage to enemies', () => {
    const enemy = buildTestEnemy({ hp: 20, block: 3 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = applyDamage(state, 'enemy', 'jaw_worm', 10);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(13);
    expect(result.enemyCombatStates['jaw_worm']!.block).toBe(0);
  });

  it('HP does not go below 0', () => {
    const player = buildTestPlayer({ hp: 5, block: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = applyDamage(state, 'player', 'player-1', 100);
    expect(result.players[0]!.hp).toBe(0);
  });
});

describe('applyMultiHit', () => {
  it('applies each hit separately with vulnerable doubling on each', () => {
    const player = buildTestPlayer();
    const enemy = buildTestEnemy({ hp: 40, vulnerableTokens: 2 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    // 2 hits of 3 damage on vulnerable: (3*2)+(3*2) = 12 total damage
    const result = applyMultiHit(state, 'player', 'player-1', 'enemy', 'jaw_worm', 2, 3);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(28); // 40 - 12
    // Only 1 vulnerable token removed
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(1);
  });

  it('removes only 1 weak token after all hits', () => {
    const player = buildTestPlayer({ weakTokens: 2 });
    const enemy = buildTestEnemy({ hp: 30 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    // 3 hits of 2 damage, weak: (2-1)+(2-1)+(2-1) = 3 total
    const result = applyMultiHit(state, 'player', 'player-1', 'enemy', 'jaw_worm', 3, 2);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(27); // 30 - 3
    expect(result.players[0]!.weakTokens).toBe(1); // only 1 removed
  });

  it('handles weak + vulnerable cancellation on multi-hit', () => {
    const player = buildTestPlayer({ weakTokens: 1 });
    const enemy = buildTestEnemy({ hp: 30, vulnerableTokens: 1 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    // 2 hits of 3: cancel means no modifier: 3+3 = 6
    const result = applyMultiHit(state, 'player', 'player-1', 'enemy', 'jaw_worm', 2, 3);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(24); // 30 - 6
    // Both lose 1 token
    expect(result.players[0]!.weakTokens).toBe(0);
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(0);
  });

  it('single hit also removes 1 token', () => {
    const player = buildTestPlayer();
    const enemy = buildTestEnemy({ hp: 20, vulnerableTokens: 2 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = applyMultiHit(state, 'player', 'player-1', 'enemy', 'jaw_worm', 1, 6);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(8); // 20 - 12
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(1);
  });
});
