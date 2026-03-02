import { describe, it, expect } from 'vitest';
import { combatReducer } from '../engine/combat.js';
import { collectTriggers } from '../engine/triggers.js';
import { buildTestGameState, buildTestPlayer, buildTestEnemy } from './helpers.js';

/**
 * Helper: build a game state with a player who has specific potions.
 */
function buildStateWithPotion(potionId: string, playerOverrides = {}) {
  return buildTestGameState({
    players: [
      buildTestPlayer({
        potions: [potionId],
        ...playerOverrides,
      }),
    ],
  });
}

const noopCardLookup = () => undefined;
const noopEnemyLookup = () => undefined;

describe('USE_POTION - basic potions', () => {
  it('Fire Potion deals 20 damage to target enemy', () => {
    const state = buildStateWithPotion('fire_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'fire_potion', targetId: 'jaw_worm' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBeLessThan(20);
  });

  it('Block Potion gives player 12 Block', () => {
    const state = buildStateWithPotion('block_potion', { block: 0 });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'block_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.block).toBe(12);
  });

  it('Strength Potion gives player 2 Strength', () => {
    const state = buildStateWithPotion('strength_potion', { strengthTokens: 0 });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'strength_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.strengthTokens).toBe(2);
  });

  it('Energy Potion gives player 2 Energy', () => {
    const state = buildStateWithPotion('energy_potion', { energy: 0 });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'energy_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.energy).toBe(2);
  });

  it('Poison Potion applies 6 Poison to target enemy', () => {
    const state = buildStateWithPotion('poison_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'poison_potion', targetId: 'jaw_worm' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.enemyCombatStates['jaw_worm']!.poisonTokens).toBe(6);
  });

  it('Fear Potion applies 3 Vulnerable to target enemy', () => {
    const state = buildStateWithPotion('fear_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'fear_potion', targetId: 'jaw_worm' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(3);
  });

  it('Explosive Potion deals 10 damage to ALL enemies', () => {
    const twoEnemyState = buildTestGameState({
      players: [buildTestPlayer({ potions: ['explosive_potion'] })],
      enemyCombatStates: {
        jaw_worm: buildTestEnemy({ id: 'jaw_worm', hp: 20, maxHp: 20 }),
        cultist: buildTestEnemy({ id: 'cultist', hp: 15, maxHp: 15 }),
      },
    });
    const result = combatReducer(
      twoEnemyState,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'explosive_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBeLessThan(20);
    expect(result.enemyCombatStates['cultist']!.hp).toBeLessThan(15);
  });

  it('Blood Potion heals 20% of max HP', () => {
    const state = buildStateWithPotion('blood_potion', { hp: 40, maxHp: 80 });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'blood_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    // 40 + floor(80 * 0.2) = 40 + 16 = 56
    expect(player.hp).toBe(56);
  });

  it('Swift Potion draws 3 cards', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({
        potions: ['swift_potion'],
        drawPile: ['card-1', 'card-2', 'card-3', 'card-4'],
        hand: [],
      })],
    });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'swift_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.hand).toHaveLength(3);
  });

  it('Weak Potion applies 3 Weak to target enemy', () => {
    const state = buildStateWithPotion('weak_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'weak_potion', targetId: 'jaw_worm' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.enemyCombatStates['jaw_worm']!.weakTokens).toBe(3);
  });
});

describe('USE_POTION - potion management', () => {
  it('Using a potion removes it from player potion slot', () => {
    const state = buildStateWithPotion('block_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'block_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.potions).not.toContain('block_potion');
  });

  it('Cannot use potion player does not have', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ potions: [] })],
    });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'fire_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    // State should be unchanged (or with rejection log)
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.hp).toBe(80); // Unchanged
    expect(result.combatLog.some(l => l.includes('[Failed]') || l.includes('[Rejected]') || l.includes('does not have'))).toBe(true);
  });

  it('Using a potion logs the action', () => {
    const state = buildStateWithPotion('block_potion');
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'block_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    expect(result.combatLog.some(l => l.includes('block_potion') || l.includes('Block Potion'))).toBe(true);
  });
});

describe('USE_POTION - relic interactions', () => {
  it('Toy Ornithopter heals 5 HP when potion is used', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({
        potions: ['block_potion'],
        relics: ['toy_ornithopter'],
        hp: 60,
        maxHp: 80,
      })],
    });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'block_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.hp).toBe(65); // 60 + 5
  });

  it('Sacred Bark doubles potion effect values', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({
        potions: ['block_potion'],
        relics: ['sacred_bark'],
        block: 0,
      })],
    });
    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'block_potion' },
      noopCardLookup,
      noopEnemyLookup,
    );
    const player = result.players.find(p => p.id === 'player-1')!;
    // Block Potion gives 12 Block, doubled by Sacred Bark = 24, but capped at 20
    expect(player.block).toBe(20);
  });
});

describe('USE_POTION - Fairy in a Bottle (ON_DEATH)', () => {
  it('Fairy in a Bottle auto-triggers when player would die', () => {
    // This potion is an ON_DEATH trigger, not manually used
    // We test the trigger system handles it
    const state = buildTestGameState({
      players: [buildTestPlayer({
        potions: ['fairy_in_a_bottle'],
        hp: 0,
        maxHp: 80,
      })],
    });
    // Fairy in a Bottle is handled by the ON_DEATH trigger system
    // It should be collected as a trigger when player HP reaches 0
    // Test that collectTriggers includes it
    const triggers = collectTriggers(state, 'ON_DEATH');
    const fairyTrigger = triggers.find(t => t.sourceId === 'fairy_in_a_bottle');
    expect(fairyTrigger).toBeDefined();
  });
});
