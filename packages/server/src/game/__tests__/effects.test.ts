import { describe, it, expect } from 'vitest';
import { resolveEffect, resolveCardEffects } from '../engine/effects/resolve.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';
import type { CardEffect, EffectContext } from '../engine/effects/types.js';

const makeContext = (overrides?: Partial<EffectContext>): EffectContext => ({
  playerId: 'player-1',
  targetId: 'jaw_worm',
  dieResult: 3,
  source: 'card',
  ...overrides,
});

describe('resolveEffect — DealDamage', () => {
  it('deals single-hit damage to chosen target', () => {
    const player = buildTestPlayer({ hp: 50 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const effect: CardEffect = { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(14);
  });

  it('deals multi-hit damage', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 30 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const effect: CardEffect = { kind: 'DealDamage', hits: 3, amount: 2, target: 'chosen' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(24); // 30 - (2*3)
  });

  it('deals damage to all enemies with target:all', () => {
    const e1 = buildTestEnemy({ id: 'a', hp: 20 });
    const e2 = buildTestEnemy({ id: 'b', hp: 20 });
    const state = buildTestGameState({ enemyCombatStates: { a: e1, b: e2 } });

    const effect: CardEffect = { kind: 'DealDamage', hits: 1, amount: 5, target: 'all' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['a']!.hp).toBe(15);
    expect(result.enemyCombatStates['b']!.hp).toBe(15);
  });

  it('deals damage to all enemies in row with target:all_row', () => {
    const e1 = buildTestEnemy({ id: 'a', hp: 20, row: 0 });
    const e2 = buildTestEnemy({ id: 'b', hp: 20, row: 1 });
    const state = buildTestGameState({ enemyCombatStates: { a: e1, b: e2 } });

    const effect: CardEffect = { kind: 'DealDamage', hits: 1, amount: 5, target: 'all_row' };
    // Simplified: targets all enemies for now (row targeting deferred)
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['a']!.hp).toBe(15);
    expect(result.enemyCombatStates['b']!.hp).toBe(15);
  });
});

describe('resolveEffect — GainBlock', () => {
  it('gains block for self', () => {
    const player = buildTestPlayer({ block: 0 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'GainBlock', amount: 5, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.block).toBe(5);
  });

  it('caps block at 20 for players', () => {
    const player = buildTestPlayer({ block: 18 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'GainBlock', amount: 5, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.block).toBe(20);
  });

  it('gains block for any player target', () => {
    const p1 = buildTestPlayer({ id: 'player-1', block: 0 });
    const p2 = buildTestPlayer({ id: 'player-2', block: 0 });
    const state = buildTestGameState({ players: [p1, p2] });

    const effect: CardEffect = { kind: 'GainBlock', amount: 8, target: 'any_player' };
    // any_player targets self by default
    const result = resolveEffect(state, effect, makeContext({ playerId: 'player-1' }));
    expect(result.players[0]!.block).toBe(8);
  });
});

describe('resolveEffect — ApplyStatus', () => {
  it('applies vulnerable to chosen enemy', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', vulnerableTokens: 0 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const effect: CardEffect = { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(2);
  });

  it('applies weak to chosen enemy', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', weakTokens: 0 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const effect: CardEffect = { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'chosen' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.weakTokens).toBe(1);
  });

  it('applies poison to chosen enemy', () => {
    const enemy = buildTestEnemy({ id: 'jaw_worm', poisonTokens: 0 });
    const state = buildTestGameState({ enemyCombatStates: { jaw_worm: enemy } });

    const effect: CardEffect = { kind: 'ApplyStatus', status: 'poison', amount: 5, target: 'chosen' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.poisonTokens).toBe(5);
  });

  it('applies strength to self', () => {
    const player = buildTestPlayer({ strengthTokens: 0 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'ApplyStatus', status: 'strength', amount: 2, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.strengthTokens).toBe(2);
  });
});

describe('resolveEffect — DrawCards', () => {
  it('draws cards from draw pile', () => {
    const player = buildTestPlayer({ hand: [], drawPile: ['card_a', 'card_b', 'card_c'] });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'DrawCards', count: 2 };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hand.length).toBe(2);
    expect(result.players[0]!.drawPile.length).toBe(1);
  });
});

describe('resolveEffect — GainEnergy', () => {
  it('gains energy', () => {
    const player = buildTestPlayer({ energy: 2 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'GainEnergy', amount: 1 };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.energy).toBe(3);
  });

  it('caps energy at 6', () => {
    const player = buildTestPlayer({ energy: 5 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'GainEnergy', amount: 3 };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.energy).toBe(6);
  });
});

describe('resolveEffect — Exhaust', () => {
  it('exhausts card being played', () => {
    const player = buildTestPlayer({ hand: ['some_card'], beingPlayed: 'some_card', exhaustPile: [] });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'Exhaust', target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    // The exhaust flag should be set — playCard cleanup will handle zone routing
    // For now, we verify the card moves to exhaust from hand
    expect(result.players[0]!.exhaustPile).toContain('some_card');
  });
});

describe('resolveEffect — LoseHp', () => {
  it('loses HP directly bypassing block', () => {
    const player = buildTestPlayer({ hp: 50, block: 10 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'LoseHp', amount: 3, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hp).toBe(47);
    expect(result.players[0]!.block).toBe(10); // block untouched
  });
});

describe('resolveEffect — HealHp', () => {
  it('heals HP up to max', () => {
    const player = buildTestPlayer({ hp: 50, maxHp: 80 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'HealHp', amount: 10, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hp).toBe(60);
  });

  it('does not exceed maxHp', () => {
    const player = buildTestPlayer({ hp: 78, maxHp: 80 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'HealHp', amount: 10, target: 'self' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hp).toBe(80);
  });
});

describe('resolveEffect — GainGold', () => {
  it('gains gold', () => {
    const player = buildTestPlayer({ gold: 50 });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'GainGold', amount: 10 };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.gold).toBe(60);
  });
});

describe('resolveEffect — AddCardToDiscard', () => {
  it('adds card to discard pile', () => {
    const player = buildTestPlayer({ discardPile: [] });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'AddCardToDiscard', cardId: 'wound' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.discardPile).toContain('wound');
  });
});

describe('resolveEffect — AddCardToHand', () => {
  it('adds card to hand', () => {
    const player = buildTestPlayer({ hand: [] });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'AddCardToHand', cardId: 'smite' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hand).toContain('smite');
  });
});

describe('resolveEffect — DiscardCards', () => {
  it('random discard removes a card from hand', () => {
    const player = buildTestPlayer({ hand: ['a', 'b', 'c'], discardPile: [] });
    const state = buildTestGameState({ players: [player] });

    const effect: CardEffect = { kind: 'DiscardCards', count: 1, target: 'random' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.players[0]!.hand.length).toBe(2);
    expect(result.players[0]!.discardPile.length).toBe(1);
  });
});

describe('resolveEffect — Unimplemented', () => {
  it('returns state unchanged with log entry', () => {
    const state = buildTestGameState();
    const effect: CardEffect = { kind: 'Unimplemented', description: 'Complex card logic' };
    const result = resolveEffect(state, effect, makeContext());
    expect(result.combatLog.some((l) => l.includes('Complex card logic'))).toBe(true);
    expect(result.players).toEqual(state.players);
  });
});

describe('resolveCardEffects', () => {
  it('chains multiple effects', () => {
    const player = buildTestPlayer({ hp: 50, block: 0 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const effects: CardEffect[] = [
      { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
      { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' },
    ];
    const result = resolveCardEffects(state, effects, makeContext());
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(12);
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(2);
  });
});
