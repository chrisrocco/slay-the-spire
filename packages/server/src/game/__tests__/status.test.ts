import { describe, it, expect } from 'vitest';
import { applyStatusToken, removeStatusToken } from '../engine/status.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

describe('applyStatusToken', () => {
  it('applies vulnerable tokens to a player', () => {
    const player = buildTestPlayer({ vulnerableTokens: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = applyStatusToken(state, 'player', 'player-1', 'vulnerable', 2);
    expect(result.players[0]!.vulnerableTokens).toBe(2);
  });

  it('caps vulnerable at 3', () => {
    const player = buildTestPlayer({ vulnerableTokens: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = applyStatusToken(state, 'player', 'player-1', 'vulnerable', 2);
    expect(result.players[0]!.vulnerableTokens).toBe(3);
  });

  it('caps weak at 3', () => {
    const player = buildTestPlayer({ weakTokens: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = applyStatusToken(state, 'player', 'player-1', 'weak', 3);
    expect(result.players[0]!.weakTokens).toBe(3);
  });

  it('caps strength at 8', () => {
    const player = buildTestPlayer({ strengthTokens: 5 });
    const state = buildTestGameState({ players: [player] });

    const result = applyStatusToken(state, 'player', 'player-1', 'strength', 5);
    expect(result.players[0]!.strengthTokens).toBe(8);
  });

  it('does not exceed cap when already at max', () => {
    const player = buildTestPlayer({ strengthTokens: 8 });
    const state = buildTestGameState({ players: [player] });

    const result = applyStatusToken(state, 'player', 'player-1', 'strength', 1);
    expect(result.players[0]!.strengthTokens).toBe(8);
  });

  it('applies status tokens to enemies', () => {
    const enemy = buildTestEnemy({ vulnerableTokens: 0 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = applyStatusToken(state, 'enemy', 'jaw_worm', 'vulnerable', 2);
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(2);
  });

  it('applies poison to enemies (no cap)', () => {
    const enemy = buildTestEnemy({ poisonTokens: 10 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = applyStatusToken(state, 'enemy', 'jaw_worm', 'poison', 5);
    expect(result.enemyCombatStates['jaw_worm']!.poisonTokens).toBe(15);
  });
});

describe('removeStatusToken', () => {
  it('removes tokens from a player', () => {
    const player = buildTestPlayer({ vulnerableTokens: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = removeStatusToken(state, 'player', 'player-1', 'vulnerable', 1);
    expect(result.players[0]!.vulnerableTokens).toBe(2);
  });

  it('does not go below 0', () => {
    const player = buildTestPlayer({ vulnerableTokens: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = removeStatusToken(state, 'player', 'player-1', 'vulnerable', 1);
    expect(result.players[0]!.vulnerableTokens).toBe(0);
  });

  it('removes tokens from enemies', () => {
    const enemy = buildTestEnemy({ weakTokens: 2 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = removeStatusToken(state, 'enemy', 'jaw_worm', 'weak', 1);
    expect(result.enemyCombatStates['jaw_worm']!.weakTokens).toBe(1);
  });

  it('removes poison from enemies', () => {
    const enemy = buildTestEnemy({ poisonTokens: 5 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const result = removeStatusToken(state, 'enemy', 'jaw_worm', 'poison', 2);
    expect(result.enemyCombatStates['jaw_worm']!.poisonTokens).toBe(3);
  });
});
