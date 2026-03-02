import { describe, it, expect } from 'vitest';
import { initCombat, combatReducer } from '../engine/combat.js';
import type { Action } from '../engine/combat.js';
import type { CombatGameState } from '../state/combatState.js';
import type { PlayerCard, EnemyCard } from '@slay-online/shared';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

// ===== Test Helpers =====

/** Deterministic RNG that always returns 0.5 (die result = 4) */
const fixedRng = () => 0.5;

function makeCardLookup(cards: PlayerCard[]): (id: string) => PlayerCard | undefined {
  const map = new Map<string, PlayerCard>();
  for (const c of cards) map.set(c.id, c);
  return (id) => map.get(id);
}

function makeEnemyLookup(cards: EnemyCard[]): (id: string) => EnemyCard | undefined {
  const map = new Map<string, EnemyCard>();
  for (const c of cards) map.set(c.id, c);
  return (id) => map.get(id);
}

const jawWormCard: EnemyCard = {
  id: 'jaw_worm',
  name: 'Jaw Worm',
  act: 1,
  category: 'encounter',
  hp: 20,
  pattern: {
    kind: 'single',
    description: 'Deal 5 damage.',
  },
  specialAbilities: [],
  summons: [],
  rewards: { gold: 5, cardReward: true, potionReward: false, relicReward: false },
};

const strikeCard: PlayerCard = {
  id: 'strike_r',
  name: 'Strike',
  character: 'ironclad',
  rarity: 'starter',
  type: 'Attack',
  cost: 1,
  text: 'Deal 6 damage.',
  upgraded: false,
  keywords: [],
};

const defendCard: PlayerCard = {
  id: 'defend_r',
  name: 'Defend',
  character: 'ironclad',
  rarity: 'starter',
  type: 'Skill',
  cost: 1,
  text: 'Gain 5 Block.',
  upgraded: false,
  keywords: [],
};

// ===== Tests =====

describe('initCombat', () => {
  it('creates valid CombatGameState with correct enemy HP', () => {
    const player = buildTestPlayer({ drawPile: ['strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r', 'defend_r', 'defend_r', 'defend_r', 'defend_r', 'defend_r'] });
    const state = buildTestGameState({ players: [player], round: 0 });

    const result = initCombat(state, [jawWormCard], 1, fixedRng);

    expect(result.enemyCombatStates['jaw_worm']).toBeDefined();
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(20);
    expect(result.enemyCombatStates['jaw_worm']!.maxHp).toBe(20);
    expect(result.enemyCombatStates['jaw_worm']!.isDead).toBe(false);
    expect(result.round).toBe(1);
    expect(result.phase).toBe('PLAYER_ACTIONS');
    expect(result.players[0]!.energy).toBe(3);
    expect(result.players[0]!.hand).toHaveLength(5);
  });

  it('resolves enemy HP by player count', () => {
    const scaledEnemy: EnemyCard = {
      ...jawWormCard,
      hp: { 1: 20, 2: 30, 3: 40, 4: 50 },
    };
    const player = buildTestPlayer({ drawPile: ['a', 'b', 'c', 'd', 'e', 'f'] });
    const state = buildTestGameState({ players: [player] });

    const result = initCombat(state, [scaledEnemy], 2, fixedRng);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(30);
    expect(result.enemyCombatStates['jaw_worm']!.maxHp).toBe(30);
  });

  it('resets combat tokens on players', () => {
    const player = buildTestPlayer({
      vulnerableTokens: 2,
      strengthTokens: 3,
      shivTokens: 2,
      stance: 'wrath',
      drawPile: ['a', 'b', 'c', 'd', 'e'],
    });
    const state = buildTestGameState({ players: [player] });

    const result = initCombat(state, [jawWormCard], 1, fixedRng);
    expect(result.players[0]!.vulnerableTokens).toBe(0);
    expect(result.players[0]!.strengthTokens).toBe(0);
    expect(result.players[0]!.shivTokens).toBe(0);
    expect(result.players[0]!.stance).toBe('neutral');
  });
});

describe('combatReducer', () => {
  const cardLookup = makeCardLookup([strikeCard, defendCard]);
  const enemyLookup = makeEnemyLookup([jawWormCard]);

  it('rejects PLAY_CARD when phase is not PLAYER_ACTIONS', () => {
    const state = buildTestGameState({ phase: 'ENEMY_TURN' });

    const result = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'strike_r', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result.combatLog).toContainEqual(expect.stringContaining('[Rejected]'));
  });

  it('rejects all actions when phase is COMBAT_END', () => {
    const state = buildTestGameState({ phase: 'COMBAT_END' });

    const result = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'strike_r', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result).toEqual(state);
  });

  it('PLAY_CARD resolves effects and deducts energy', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'strike_r', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result.players[0]!.energy).toBe(2);
    expect(result.enemyCombatStates['jaw_worm']!.hp).toBe(14); // 20 - 6
    expect(result.players[0]!.hand).not.toContain('strike_r');
  });

  it('combat ends when all enemies die from PLAY_CARD', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 3 }); // 6 damage kills it
    const state = buildTestGameState({ players: [player], enemyCombatStates: { jaw_worm: enemy } });

    const result = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'strike_r', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result.phase).toBe('COMBAT_END');
    expect(result.enemyCombatStates['jaw_worm']!.isDead).toBe(true);
  });

  it('END_TURN transitions through enemy turn and back to PLAYER_ACTIONS', () => {
    const player = buildTestPlayer({
      hand: ['strike_r'],
      drawPile: ['defend_r', 'defend_r', 'defend_r', 'defend_r', 'defend_r'],
      energy: 3,
      hp: 80,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    const result = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // After end turn: discard hand, enemy acts (5 damage), new round starts
    expect(result.phase).toBe('PLAYER_ACTIONS');
    expect(result.round).toBe(2);
    expect(result.players[0]!.energy).toBe(3); // Reset for new turn
    expect(result.players[0]!.hand).toHaveLength(5); // Drew 5 new cards
    // Player took 5 damage from jaw_worm (block was reset to 0 at start of new turn)
    expect(result.players[0]!.hp).toBe(75); // 80 - 5
  });

  it('combat ends when player dies from enemy attack', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['a', 'b', 'c', 'd', 'e'],
      hp: 3,
      block: 0,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 4,
    });

    const result = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result.phase).toBe('COMBAT_END');
    expect(result.players[0]!.hp).toBe(0);
  });

  it('multi-player: phase stays PLAYER_ACTIONS until all players end turn', () => {
    const player1 = buildTestPlayer({ id: 'player-1', nickname: 'P1', hand: [] });
    const player2 = buildTestPlayer({ id: 'player-2', nickname: 'P2', hand: [] });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    const state = buildTestGameState({
      players: [player1, player2],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 4,
    });

    // Player 1 ends turn
    const afterP1 = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Phase should still be PLAYER_ACTIONS (waiting for player 2)
    expect(afterP1.phase).toBe('PLAYER_ACTIONS');
    expect(afterP1.players[0]!.endedTurn).toBe(true);
    expect(afterP1.players[1]!.endedTurn).toBe(false);

    // Player 2 ends turn — now transitions
    const afterP2 = combatReducer(
      afterP1,
      { type: 'END_TURN', playerId: 'player-2' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Should have transitioned through enemy turn and back to PLAYER_ACTIONS
    expect(afterP2.phase).toBe('PLAYER_ACTIONS');
    expect(afterP2.round).toBe(2);
  });

  it('USE_POTION rejects potion player does not have', () => {
    // Player starts with no potions — trying to use one should fail
    const state = buildTestGameState();

    const result = combatReducer(
      state,
      { type: 'USE_POTION', playerId: 'player-1', potionId: 'heal_potion' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(result.combatLog).toContainEqual(expect.stringContaining('[Failed]'));
  });
});
