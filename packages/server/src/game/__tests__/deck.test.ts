import { describe, it, expect } from 'vitest';
import {
  drawCards,
  shuffleDiscardIntoDraw,
  discardHand,
  moveToExhaust,
  scry,
  resolveScry,
} from '../engine/deck.js';
import { buildTestPlayer, buildTestGameState } from './helpers.js';

// Deterministic RNG for testing (always returns 0.5)
const fixedRng = () => 0.5;

describe('shuffleDiscardIntoDraw', () => {
  it('moves discard pile to draw pile', () => {
    const player = buildTestPlayer({
      drawPile: [],
      discardPile: ['a', 'b', 'c'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = shuffleDiscardIntoDraw(state, 'player-1', fixedRng);
    const p = result.players[0]!;
    expect(p.drawPile.length).toBe(3);
    expect(p.discardPile.length).toBe(0);
    // All cards present
    expect(p.drawPile.sort()).toEqual(['a', 'b', 'c']);
  });

  it('does nothing with empty discard pile', () => {
    const player = buildTestPlayer({
      drawPile: ['x', 'y'],
      discardPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = shuffleDiscardIntoDraw(state, 'player-1', fixedRng);
    expect(result.players[0]!.drawPile).toEqual(['x', 'y']);
  });
});

describe('drawCards', () => {
  it('draws cards from top of draw pile to hand', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = drawCards(state, 'player-1', 5, fixedRng);
    const p = result.players[0]!;
    expect(p.hand.length).toBe(5);
    expect(p.drawPile.length).toBe(5);
  });

  it('reshuffles discard when draw pile runs out mid-draw', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['a', 'b', 'c'],
      discardPile: ['d', 'e', 'f', 'g', 'h', 'i', 'j'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = drawCards(state, 'player-1', 5, fixedRng);
    const p = result.players[0]!;
    expect(p.hand.length).toBe(5);
    expect(p.discardPile.length).toBe(0);
    expect(p.drawPile.length).toBe(5); // 10 total - 5 drawn
  });

  it('draws all available when not enough cards', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['a', 'b'],
      discardPile: ['c'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = drawCards(state, 'player-1', 5, fixedRng);
    const p = result.players[0]!;
    expect(p.hand.length).toBe(3); // only 3 cards total
    expect(p.drawPile.length).toBe(0);
    expect(p.discardPile.length).toBe(0);
  });

  it('draws 0 cards with no change', () => {
    const player = buildTestPlayer({ hand: ['x'], drawPile: ['a', 'b'] });
    const state = buildTestGameState({ players: [player] });

    const result = drawCards(state, 'player-1', 0, fixedRng);
    expect(result.players[0]!.hand).toEqual(['x']);
    expect(result.players[0]!.drawPile).toEqual(['a', 'b']);
  });

  it('handles empty draw and empty discard', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: [],
      discardPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = drawCards(state, 'player-1', 5, fixedRng);
    expect(result.players[0]!.hand.length).toBe(0);
  });
});

describe('discardHand', () => {
  const simpleLookup = (id: string) => {
    if (id === 'retain_card') return { retain: true };
    if (id === 'ethereal_card') return { ethereal: true };
    return {};
  };

  it('moves normal cards to discard pile', () => {
    const player = buildTestPlayer({ hand: ['a', 'b', 'c'] });
    const state = buildTestGameState({ players: [player] });

    const result = discardHand(state, 'player-1', simpleLookup);
    const p = result.players[0]!;
    expect(p.hand.length).toBe(0);
    expect(p.discardPile).toContain('a');
    expect(p.discardPile).toContain('b');
    expect(p.discardPile).toContain('c');
  });

  it('keeps retain cards in hand', () => {
    const player = buildTestPlayer({ hand: ['a', 'retain_card', 'b'] });
    const state = buildTestGameState({ players: [player] });

    const result = discardHand(state, 'player-1', simpleLookup);
    const p = result.players[0]!;
    expect(p.hand).toEqual(['retain_card']);
    expect(p.discardPile).toContain('a');
    expect(p.discardPile).toContain('b');
  });

  it('exhausts ethereal cards', () => {
    const player = buildTestPlayer({
      hand: ['a', 'ethereal_card', 'b'],
      exhaustPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = discardHand(state, 'player-1', simpleLookup);
    const p = result.players[0]!;
    expect(p.hand.length).toBe(0);
    expect(p.exhaustPile).toContain('ethereal_card');
    expect(p.discardPile).toContain('a');
    expect(p.discardPile).toContain('b');
    expect(p.discardPile).not.toContain('ethereal_card');
  });

  it('handles mixed hand correctly', () => {
    const player = buildTestPlayer({
      hand: ['normal1', 'retain_card', 'ethereal_card', 'normal2'],
      exhaustPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = discardHand(state, 'player-1', simpleLookup);
    const p = result.players[0]!;
    expect(p.hand).toEqual(['retain_card']); // 1 stays
    expect(p.discardPile).toEqual(expect.arrayContaining(['normal1', 'normal2'])); // 2 discarded
    expect(p.exhaustPile).toContain('ethereal_card'); // 1 exhausted
  });
});

describe('moveToExhaust', () => {
  it('moves card from hand to exhaust pile', () => {
    const player = buildTestPlayer({
      hand: ['a', 'b', 'c'],
      exhaustPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = moveToExhaust(state, 'player-1', 'b', 'hand');
    const p = result.players[0]!;
    expect(p.hand).toEqual(['a', 'c']);
    expect(p.exhaustPile).toEqual(['b']);
  });

  it('moves card from discard pile to exhaust pile', () => {
    const player = buildTestPlayer({
      discardPile: ['x', 'y', 'z'],
      exhaustPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = moveToExhaust(state, 'player-1', 'y', 'discard');
    const p = result.players[0]!;
    expect(p.discardPile).toEqual(['x', 'z']);
    expect(p.exhaustPile).toEqual(['y']);
  });

  it('does nothing if card not found', () => {
    const player = buildTestPlayer({ hand: ['a', 'b'], exhaustPile: [] });
    const state = buildTestGameState({ players: [player] });

    const result = moveToExhaust(state, 'player-1', 'notfound', 'hand');
    expect(result.players[0]!.hand).toEqual(['a', 'b']);
    expect(result.players[0]!.exhaustPile).toEqual([]);
  });
});

describe('scry', () => {
  it('reveals top N cards from draw pile', () => {
    const player = buildTestPlayer({
      drawPile: ['a', 'b', 'c', 'd', 'e'],
    });
    const state = buildTestGameState({ players: [player] });

    const { scryCards } = scry(state, 'player-1', 3);
    expect(scryCards).toEqual(['a', 'b', 'c']);
  });

  it('reveals fewer cards if draw pile is small', () => {
    const player = buildTestPlayer({ drawPile: ['a', 'b'] });
    const state = buildTestGameState({ players: [player] });

    const { scryCards } = scry(state, 'player-1', 5);
    expect(scryCards).toEqual(['a', 'b']);
  });
});

describe('resolveScry', () => {
  it('discards selected cards and keeps rest on top', () => {
    const player = buildTestPlayer({
      drawPile: ['a', 'b', 'c', 'd', 'e'],
      discardPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    // Scry 3, discard 'a' and 'c'
    const result = resolveScry(state, 'player-1', ['a', 'c'], 3);
    const p = result.players[0]!;
    expect(p.drawPile).toEqual(['b', 'd', 'e']); // 'b' stays on top, then rest
    expect(p.discardPile).toEqual(['a', 'c']);
  });

  it('keeps all scried cards if none selected for discard', () => {
    const player = buildTestPlayer({
      drawPile: ['a', 'b', 'c'],
      discardPile: [],
    });
    const state = buildTestGameState({ players: [player] });

    const result = resolveScry(state, 'player-1', [], 3);
    const p = result.players[0]!;
    expect(p.drawPile).toEqual(['a', 'b', 'c']);
    expect(p.discardPile).toEqual([]);
  });
});
