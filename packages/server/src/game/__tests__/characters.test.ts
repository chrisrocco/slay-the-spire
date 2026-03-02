import { describe, it, expect } from 'vitest';
import { ironcladStarterDeck, getExhaustCount } from '../engine/characters/ironclad.js';
import { silentStarterDeck, resolveShivs, gainShivs } from '../engine/characters/silent.js';
import { defectStarterDeck, channelOrb, evokeOrb, applyOrbEndOfTurn } from '../engine/characters/defect.js';
import { watcherStarterDeck, enterStance, applyWrathEndOfTurn, gainMiracle, useMiracle } from '../engine/characters/watcher.js';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

// ===== IRONCLAD =====

describe('Ironclad', () => {
  it('ironcladStarterDeck returns 10 cards', () => {
    const deck = ironcladStarterDeck();
    expect(deck).toHaveLength(10);
    expect(deck.filter((c) => c === 'strike_r')).toHaveLength(5);
    expect(deck.filter((c) => c === 'defend_r')).toHaveLength(4);
    expect(deck).toContain('bash');
  });

  it('getExhaustCount returns exhaust pile length', () => {
    const player = buildTestPlayer({ exhaustPile: ['a', 'b', 'c'] });
    const state = buildTestGameState({ players: [player] });
    expect(getExhaustCount(state, 'player-1')).toBe(3);
  });

  it('getExhaustCount returns 0 for empty exhaust pile', () => {
    const player = buildTestPlayer({ exhaustPile: [] });
    const state = buildTestGameState({ players: [player] });
    expect(getExhaustCount(state, 'player-1')).toBe(0);
  });
});

// ===== SILENT =====

describe('Silent', () => {
  it('silentStarterDeck returns 12 cards', () => {
    const deck = silentStarterDeck();
    expect(deck).toHaveLength(12);
    expect(deck.filter((c) => c === 'strike_g')).toHaveLength(5);
    expect(deck.filter((c) => c === 'defend_g')).toHaveLength(5);
    expect(deck).toContain('neutralize');
    expect(deck).toContain('survivor');
  });

  it('resolveShivs deals 1 damage per shiv token as separate attacks', () => {
    const player = buildTestPlayer({ shivTokens: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = resolveShivs(state, 'player-1', 'jaw_worm');
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(17); // 3 separate 1-damage hits
    expect(result.players[0]!.shivTokens).toBe(0); // reset after resolving
  });

  it('shivs are affected by Strength', () => {
    const player = buildTestPlayer({ shivTokens: 2, strengthTokens: 2 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = resolveShivs(state, 'player-1', 'jaw_worm');
    // Each shiv: base 1 + 2 strength = 3 damage, times 2 shivs = 6 total
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(14);
  });

  it('shivs are affected by Vulnerable on target', () => {
    const player = buildTestPlayer({ shivTokens: 1 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20, vulnerableTokens: 1 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = resolveShivs(state, 'player-1', 'jaw_worm');
    // base 1 * 2 (vulnerable) = 2 damage
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(18);
  });

  it('resolveShivs does nothing with 0 shiv tokens', () => {
    const player = buildTestPlayer({ shivTokens: 0 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = resolveShivs(state, 'player-1', 'jaw_worm');
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(20);
  });

  it('gainShivs adds tokens capped at 5', () => {
    const player = buildTestPlayer({ shivTokens: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = gainShivs(state, 'player-1', 4);
    expect(result.players[0]!.shivTokens).toBe(5);
  });
});

// ===== DEFECT =====

describe('Defect', () => {
  it('defectStarterDeck returns 10 cards', () => {
    const deck = defectStarterDeck();
    expect(deck).toHaveLength(10);
    expect(deck.filter((c) => c === 'strike_b')).toHaveLength(4);
    expect(deck.filter((c) => c === 'defend_b')).toHaveLength(4);
    expect(deck).toContain('zap');
    expect(deck).toContain('dualcast');
  });

  it('channelOrb adds orb to empty slots', () => {
    const player = buildTestPlayer({ orbs: [], maxOrbSlots: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = channelOrb(state, 'player-1', 'lightning');
    expect(result.players[0]!.orbs).toEqual(['lightning']);
  });

  it('channelOrb with full slots forces evoke of first orb', () => {
    const player = buildTestPlayer({ orbs: ['frost', 'frost', 'frost'], maxOrbSlots: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    const result = channelOrb(state, 'player-1', 'lightning');
    // First frost evoked (gain 5 block), then lightning channeled
    expect(result.players[0]!.orbs).toEqual(['frost', 'frost', 'lightning']);
    expect(result.players[0]!.block).toBe(5); // frost evoke = 5 block
  });

  it('evokeOrb lightning deals 8 damage', () => {
    const player = buildTestPlayer({ orbs: ['lightning'] });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    const result = evokeOrb(state, 'player-1', 0);
    expect(result.players[0]!.orbs).toEqual([]);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(12); // 20 - 8
  });

  it('evokeOrb frost gains 5 block', () => {
    const player = buildTestPlayer({ orbs: ['frost'], block: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = evokeOrb(state, 'player-1', 0);
    expect(result.players[0]!.orbs).toEqual([]);
    expect(result.players[0]!.block).toBe(5);
  });

  it('evokeOrb at specific index removes correct orb', () => {
    const player = buildTestPlayer({ orbs: ['lightning', 'frost', 'dark'] });
    const state = buildTestGameState({ players: [player] });

    const result = evokeOrb(state, 'player-1', 1);
    expect(result.players[0]!.orbs).toEqual(['lightning', 'dark']);
    expect(result.players[0]!.block).toBe(5); // frost evoke = 5 block
  });

  it('applyOrbEndOfTurn: lightning deals 3 damage', () => {
    const player = buildTestPlayer({ orbs: ['lightning'] });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    const result = applyOrbEndOfTurn(state, 'player-1');
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(17);
  });

  it('applyOrbEndOfTurn: frost gains 2 block', () => {
    const player = buildTestPlayer({ orbs: ['frost'], block: 0 });
    const state = buildTestGameState({ players: [player] });

    const result = applyOrbEndOfTurn(state, 'player-1');
    expect(result.players[0]!.block).toBe(2);
  });

  it('applyOrbEndOfTurn: multiple orbs apply cumulatively', () => {
    const player = buildTestPlayer({ orbs: ['frost', 'frost', 'lightning'], block: 0 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    const result = applyOrbEndOfTurn(state, 'player-1');
    expect(result.players[0]!.block).toBe(4); // 2 + 2
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(17); // -3 from lightning
  });
});

// ===== WATCHER =====

describe('Watcher', () => {
  it('watcherStarterDeck returns 10 cards', () => {
    const deck = watcherStarterDeck();
    expect(deck).toHaveLength(10);
    expect(deck.filter((c) => c === 'strike_w')).toHaveLength(4);
    expect(deck.filter((c) => c === 'defend_w')).toHaveLength(4);
    expect(deck).toContain('eruption');
    expect(deck).toContain('vigilance');
  });

  it('enterStance wrath from neutral: sets stance', () => {
    const player = buildTestPlayer({ stance: 'neutral', energy: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = enterStance(state, 'player-1', 'wrath');
    expect(result.players[0]!.stance).toBe('wrath');
    expect(result.players[0]!.energy).toBe(3); // no energy change
  });

  it('enterStance same stance is no-op', () => {
    const player = buildTestPlayer({ stance: 'wrath', energy: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = enterStance(state, 'player-1', 'wrath');
    expect(result).toEqual(state);
  });

  it('enterStance neutral from calm grants 2 energy', () => {
    const player = buildTestPlayer({ stance: 'calm', energy: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = enterStance(state, 'player-1', 'neutral');
    expect(result.players[0]!.stance).toBe('neutral');
    expect(result.players[0]!.energy).toBe(4); // +2 from leaving calm
  });

  it('enterStance wrath from calm grants 2 energy', () => {
    const player = buildTestPlayer({ stance: 'calm', energy: 1 });
    const state = buildTestGameState({ players: [player] });

    const result = enterStance(state, 'player-1', 'wrath');
    expect(result.players[0]!.stance).toBe('wrath');
    expect(result.players[0]!.energy).toBe(3); // +2 from leaving calm
  });

  it('enterStance calm from wrath: no energy bonus', () => {
    const player = buildTestPlayer({ stance: 'wrath', energy: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = enterStance(state, 'player-1', 'calm');
    expect(result.players[0]!.stance).toBe('calm');
    expect(result.players[0]!.energy).toBe(2); // no change (only leaving calm gives energy)
  });

  it('applyWrathEndOfTurn deals 1 HP loss in wrath', () => {
    const player = buildTestPlayer({ stance: 'wrath', hp: 50, block: 10 });
    const state = buildTestGameState({ players: [player] });

    const result = applyWrathEndOfTurn(state, 'player-1');
    expect(result.players[0]!.hp).toBe(49); // -1 direct HP
    expect(result.players[0]!.block).toBe(10); // block untouched
  });

  it('applyWrathEndOfTurn does nothing if not in wrath', () => {
    const player = buildTestPlayer({ stance: 'calm', hp: 50 });
    const state = buildTestGameState({ players: [player] });

    const result = applyWrathEndOfTurn(state, 'player-1');
    expect(result.players[0]!.hp).toBe(50);
  });

  it('gainMiracle adds tokens capped at 5', () => {
    const player = buildTestPlayer({ miracleTokens: 3 });
    const state = buildTestGameState({ players: [player] });

    const result = gainMiracle(state, 'player-1', 1);
    expect(result.players[0]!.miracleTokens).toBe(4);
  });

  it('gainMiracle caps at 5', () => {
    const player = buildTestPlayer({ miracleTokens: 4 });
    const state = buildTestGameState({ players: [player] });

    const result = gainMiracle(state, 'player-1', 2);
    expect(result.players[0]!.miracleTokens).toBe(5);
  });

  it('useMiracle gains 1 energy and reduces by 1', () => {
    const player = buildTestPlayer({ miracleTokens: 3, energy: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = useMiracle(state, 'player-1');
    expect(result.players[0]!.miracleTokens).toBe(2);
    expect(result.players[0]!.energy).toBe(3);
  });

  it('useMiracle with 0 miracles does nothing', () => {
    const player = buildTestPlayer({ miracleTokens: 0, energy: 2 });
    const state = buildTestGameState({ players: [player] });

    const result = useMiracle(state, 'player-1');
    expect(result.players[0]!.miracleTokens).toBe(0);
    expect(result.players[0]!.energy).toBe(2);
  });

  it('useMiracle caps energy at 6', () => {
    const player = buildTestPlayer({ miracleTokens: 2, energy: 6 });
    const state = buildTestGameState({ players: [player] });

    const result = useMiracle(state, 'player-1');
    expect(result.players[0]!.miracleTokens).toBe(1);
    expect(result.players[0]!.energy).toBe(6); // already at cap
  });
});
