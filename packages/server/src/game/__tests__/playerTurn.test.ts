import { describe, it, expect } from 'vitest';
import { startPlayerTurn, signalEndTurn, playCard } from '../engine/playerTurn.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

const fixedRng = () => 0.5; // die result: Math.floor(0.5 * 6) + 1 = 4

const noFlagsLookup = (_id: string) => ({});

describe('startPlayerTurn', () => {
  it('resets energy to 3 for all players', () => {
    const p1 = buildTestPlayer({ id: 'p1', energy: 0 });
    const p2 = buildTestPlayer({ id: 'p2', energy: 1 });
    const state = buildTestGameState({ players: [p1, p2] });

    const result = startPlayerTurn(state, fixedRng);
    expect(result.players[0]!.energy).toBe(3);
    expect(result.players[1]!.energy).toBe(3);
  });

  it('resets block to 0', () => {
    const player = buildTestPlayer({ block: 15 });
    const state = buildTestGameState({ players: [player] });

    const result = startPlayerTurn(state, fixedRng);
    expect(result.players[0]!.block).toBe(0);
  });

  it('draws 5 cards for each player', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = startPlayerTurn(state, fixedRng);
    expect(result.players[0]!.hand.length).toBe(5);
  });

  it('rolls the die (1-6)', () => {
    const state = buildTestGameState();
    const result = startPlayerTurn(state, fixedRng);
    expect(result.dieResult).toBe(4); // Math.floor(0.5 * 6) + 1
  });

  it('increments round', () => {
    const state = buildTestGameState({ round: 2 });
    const result = startPlayerTurn(state, fixedRng);
    expect(result.round).toBe(3);
  });

  it('sets phase to PLAYER_ACTIONS', () => {
    const state = buildTestGameState({ phase: 'ENEMY_TURN' });
    const result = startPlayerTurn(state, fixedRng);
    expect(result.phase).toBe('PLAYER_ACTIONS');
  });

  it('resets endedTurn to false', () => {
    const player = buildTestPlayer({ endedTurn: true });
    const state = buildTestGameState({ players: [player] });

    const result = startPlayerTurn(state, fixedRng);
    expect(result.players[0]!.endedTurn).toBe(false);
  });
});

describe('signalEndTurn', () => {
  it('sets endedTurn for specified player', () => {
    const p1 = buildTestPlayer({ id: 'p1', endedTurn: false });
    const p2 = buildTestPlayer({ id: 'p2', endedTurn: false });
    const state = buildTestGameState({ players: [p1, p2] });

    const result = signalEndTurn(state, 'p1', noFlagsLookup);
    expect(result.players[0]!.endedTurn).toBe(true);
    expect(result.players[1]!.endedTurn).toBe(false);
  });

  it('does NOT transition if not all players done', () => {
    const p1 = buildTestPlayer({ id: 'p1', endedTurn: false });
    const p2 = buildTestPlayer({ id: 'p2', endedTurn: false });
    const state = buildTestGameState({ players: [p1, p2], phase: 'PLAYER_ACTIONS' });

    const result = signalEndTurn(state, 'p1', noFlagsLookup);
    expect(result.phase).toBe('PLAYER_ACTIONS');
  });

  it('transitions to ENEMY_TURN when all players signal', () => {
    const p1 = buildTestPlayer({ id: 'p1', endedTurn: true });
    const p2 = buildTestPlayer({ id: 'p2', endedTurn: false });
    const state = buildTestGameState({ players: [p1, p2], phase: 'PLAYER_ACTIONS' });

    const result = signalEndTurn(state, 'p2', noFlagsLookup);
    expect(result.phase).toBe('ENEMY_TURN');
  });

  it('single player immediately transitions', () => {
    const player = buildTestPlayer({ endedTurn: false });
    const state = buildTestGameState({ players: [player], phase: 'PLAYER_ACTIONS' });

    const result = signalEndTurn(state, 'player-1', noFlagsLookup);
    expect(result.phase).toBe('ENEMY_TURN');
  });
});

describe('playCard', () => {
  const mockCardLookup = (id: string) => {
    const cards: Record<string, { id: string; name: string; character: 'ironclad'; rarity: 'starter'; type: 'Attack' | 'Skill' | 'Power'; cost: number; text: string; upgraded: boolean; keywords: string[]; exhaust?: boolean }> = {
      strike_r: { id: 'strike_r', name: 'Strike', character: 'ironclad', rarity: 'starter', type: 'Attack', cost: 1, text: 'Deal 6 damage.', upgraded: false, keywords: [] },
      defend_r: { id: 'defend_r', name: 'Defend', character: 'ironclad', rarity: 'starter', type: 'Skill', cost: 1, text: 'Gain 5 Block.', upgraded: false, keywords: [] },
      exhaust_card: { id: 'exhaust_card', name: 'Exhaust Card', character: 'ironclad', rarity: 'starter', type: 'Attack', cost: 1, text: 'Exhaust.', upgraded: false, keywords: [], exhaust: true },
      power_card: { id: 'power_card', name: 'Test Power', character: 'ironclad', rarity: 'starter', type: 'Power', cost: 1, text: 'Power.', upgraded: false, keywords: [] },
    };
    return cards[id];
  };

  it('removes card from hand and deducts energy', () => {
    const player = buildTestPlayer({ hand: ['strike_r', 'defend_r'], energy: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'strike_r', 'jaw_worm', mockCardLookup);
    expect(result.players[0]!.hand).toEqual(['defend_r']);
    expect(result.players[0]!.energy).toBe(2);
  });

  it('moves attack card to discard pile after resolution', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 3, discardPile: [] });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'strike_r', 'jaw_worm', mockCardLookup);
    expect(result.players[0]!.discardPile).toContain('strike_r');
    expect(result.players[0]!.beingPlayed).toBeNull();
  });

  it('moves exhaust card to exhaust pile', () => {
    const player = buildTestPlayer({ hand: ['exhaust_card'], energy: 3, exhaustPile: [] });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'exhaust_card', 'jaw_worm', mockCardLookup);
    expect(result.players[0]!.exhaustPile).toContain('exhaust_card');
  });

  it('power card stays in play (not discarded)', () => {
    const player = buildTestPlayer({ hand: ['power_card'], energy: 3, discardPile: [] });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'power_card', undefined, mockCardLookup);
    expect(result.players[0]!.discardPile).not.toContain('power_card');
    expect(result.players[0]!.exhaustPile).not.toContain('power_card');
    expect(result.players[0]!.beingPlayed).toBeNull();
  });

  it('fails when insufficient energy', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'strike_r', 'jaw_worm', mockCardLookup);
    expect(result.players[0]!.hand).toContain('strike_r');
    expect(result.combatLog.some((l) => l.includes('insufficient energy'))).toBe(true);
  });

  it('does nothing if card not in hand', () => {
    const player = buildTestPlayer({ hand: ['defend_r'], energy: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'strike_r', 'jaw_worm', mockCardLookup);
    expect(result).toEqual(state);
  });

  it('adds combat log entry on successful play', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = playCard(state, 'player-1', 'strike_r', 'jaw_worm', mockCardLookup);
    expect(result.combatLog).toContain('player-1 played Strike');
  });
});
