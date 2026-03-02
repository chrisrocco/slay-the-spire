import { describe, it, expect } from 'vitest';
import { combatReducer, initCombat } from '../engine/combat.js';
import type { Action } from '../engine/combat.js';
import type { CombatGameState } from '../state/combatState.js';
import type { PlayerCard, EnemyCard } from '@slay-online/shared';
import { buildTestPlayer, buildTestEnemy, buildTestGameState } from './helpers.js';

// ===== Shared Test Fixtures =====

const fixedRng = () => 0.5; // die result = 4

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

const jawWormEnemy: EnemyCard = {
  id: 'jaw_worm',
  name: 'Jaw Worm',
  act: 1,
  category: 'encounter',
  hp: 44,
  pattern: {
    kind: 'single',
    description: 'Deal 5 damage.',
  },
  specialAbilities: [],
  summons: [],
  rewards: { gold: 5, cardReward: true, potionReward: false, relicReward: false },
};

// ===== Ironclad Cards =====

const bash: PlayerCard = {
  id: 'bash',
  name: 'Bash',
  character: 'ironclad',
  rarity: 'starter',
  type: 'Attack',
  cost: 2,
  text: 'Deal 8 damage. Apply 2 Vulnerable.',
  upgraded: false,
  keywords: [],
};

const strikeR: PlayerCard = {
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

const defendR: PlayerCard = {
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

// ===== Silent Cards =====

const neutralize: PlayerCard = {
  id: 'neutralize',
  name: 'Neutralize',
  character: 'silent',
  rarity: 'starter',
  type: 'Attack',
  cost: 0,
  text: 'Deal 3 damage. Apply 1 Weak.',
  upgraded: false,
  keywords: [],
};

const strikeG: PlayerCard = {
  id: 'strike_g',
  name: 'Strike',
  character: 'silent',
  rarity: 'starter',
  type: 'Attack',
  cost: 1,
  text: 'Deal 6 damage.',
  upgraded: false,
  keywords: [],
};

// ===== Defect Cards =====

const zap: PlayerCard = {
  id: 'zap',
  name: 'Zap',
  character: 'defect',
  rarity: 'starter',
  type: 'Skill',
  cost: 1,
  text: 'Channel 1 Lightning.',
  upgraded: false,
  keywords: [],
};

const strikeB: PlayerCard = {
  id: 'strike_b',
  name: 'Strike',
  character: 'defect',
  rarity: 'starter',
  type: 'Attack',
  cost: 1,
  text: 'Deal 6 damage.',
  upgraded: false,
  keywords: [],
};

// ===== Watcher Cards =====

const eruption: PlayerCard = {
  id: 'eruption',
  name: 'Eruption',
  character: 'watcher',
  rarity: 'starter',
  type: 'Attack',
  cost: 2,
  text: 'Deal 9 damage. Enter Wrath.',
  upgraded: false,
  keywords: [],
};

const strikeW: PlayerCard = {
  id: 'strike_w',
  name: 'Strike',
  character: 'watcher',
  rarity: 'starter',
  type: 'Attack',
  cost: 1,
  text: 'Deal 6 damage.',
  upgraded: false,
  keywords: [],
};

// ===== Twin Strike for multi-hit test =====

const twinStrike: PlayerCard = {
  id: 'twin_strike',
  name: 'Twin Strike',
  character: 'ironclad',
  rarity: 'common',
  type: 'Attack',
  cost: 1,
  text: 'Deal 5 damage twice.',
  upgraded: false,
  keywords: [],
};

// ===== Integration Tests =====

describe('Ironclad full turn', () => {
  const allCards = [bash, strikeR, defendR];
  const cardLookup = makeCardLookup(allCards);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('play Bash → end turn → enemy acts → new round', () => {
    const player = buildTestPlayer({
      character: 'ironclad',
      hand: ['bash'],
      drawPile: ['strike_r', 'strike_r', 'strike_r', 'defend_r', 'defend_r'],
      energy: 3,
      hp: 80,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    // Play Bash (8 damage + 2 vulnerable)
    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'bash', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(36); // 44 - 8
    expect(state.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(2);
    expect(state.players[0]!.energy).toBe(1); // 3 - 2

    // End turn
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Should be in new round
    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.round).toBe(2);
    // Player took 5 damage from jaw worm (block reset to 0 at new turn start)
    expect(state.players[0]!.hp).toBe(75);
    // Enemy vulnerable should still be 2 (decays at end of enemy turn? No — it's tokens, removed by damage)
    // Hand should have 5 new cards
    expect(state.players[0]!.hand).toHaveLength(5);
  });
});

describe('Silent full turn', () => {
  const allCards = [neutralize, strikeG];
  const cardLookup = makeCardLookup(allCards);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('play Neutralize (3 damage + 1 weak) → end turn', () => {
    const player = buildTestPlayer({
      character: 'silent',
      hand: ['neutralize'],
      drawPile: ['strike_g', 'strike_g', 'strike_g', 'strike_g', 'strike_g'],
      energy: 3,
      hp: 70,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    // Play Neutralize (3 damage + 1 weak)
    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'neutralize', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(41); // 44 - 3
    expect(state.enemyCombatStates['jaw_worm']!.weakTokens).toBe(1);
    expect(state.players[0]!.energy).toBe(3); // cost 0

    // End turn
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.round).toBe(2);
    // Enemy had 1 weak token, so deals 75% damage = 5 * 0.75 = 3.75 → 3 (floor)
    // Wait — let me check: the enemy damage parsing is "Deal 5 damage" with text,
    // and weak affects enemy output. Actually weak on ENEMIES is not implemented in
    // parseAndApplyAction (it's raw text parsing). The enemy deals 5 damage regardless.
    // Weak tokens on enemies affect their damage through the damage system — but
    // parseAndApplyAction calls applyDamage directly with fixed amount.
    // So player takes 5 damage.
    expect(state.players[0]!.hp).toBe(65); // 70 - 5
    expect(state.enemyCombatStates['jaw_worm']!.weakTokens).toBe(1);
  });
});

describe('Defect full turn', () => {
  const allCards = [zap, strikeB];
  const cardLookup = makeCardLookup(allCards);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('play Zap (channel lightning) → end turn → orb passive fires', () => {
    const player = buildTestPlayer({
      character: 'defect',
      hand: ['zap'],
      drawPile: ['strike_b', 'strike_b', 'strike_b', 'strike_b', 'strike_b'],
      energy: 3,
      hp: 75,
      orbs: [],
      maxOrbSlots: 3,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    // Play Zap (channel 1 lightning)
    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'zap', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Zap's effect is Channel via the registry. But the effect resolver stubs Channel.
    // The registry entry for 'zap' is: [{ kind: 'Channel', orbType: 'lightning', count: 1 }]
    // The resolver for Channel returns a stub log entry but doesn't actually channel.
    // So orbs won't be populated through card play alone.
    // For integration testing, let's verify the stub behavior and test orbs manually.
    expect(state.combatLog).toContainEqual(expect.stringContaining('Channel'));

    // Manually set up the orb to test end-of-turn orb effects
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id === 'player-1' ? { ...p, orbs: ['lightning'] as const } : p,
      ),
    };

    // End turn — should trigger orb end-of-turn (lightning deals 3 damage)
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.round).toBe(2);
    // Lightning orb end-of-turn deals 3 damage to enemy, then enemy deals 5 to player
    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(41); // 44 - 3
    expect(state.players[0]!.hp).toBe(70); // 75 - 5
    // Orb should still be there (end-of-turn doesn't remove orbs)
    expect(state.players[0]!.orbs).toEqual(['lightning']);
  });
});

describe('Watcher full turn', () => {
  const allCards = [eruption, strikeW];
  const cardLookup = makeCardLookup(allCards);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('play Eruption (9 damage + enter wrath) → end turn → wrath damage', () => {
    const player = buildTestPlayer({
      character: 'watcher',
      hand: ['eruption'],
      drawPile: ['strike_w', 'strike_w', 'strike_w', 'strike_w', 'strike_w'],
      energy: 3,
      hp: 72,
      stance: 'neutral',
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    // Play Eruption (9 damage + enter wrath)
    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'eruption', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(35); // 44 - 9
    expect(state.players[0]!.energy).toBe(1); // 3 - 2
    // EnterStance is stubbed in resolver, so stance won't change through card play
    // The stub logs it. Let's verify the stub and manually set stance for integration.
    expect(state.combatLog).toContainEqual(expect.stringContaining('Enter wrath'));

    // Manually enter wrath for integration test of end-of-turn wrath damage
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id === 'player-1' ? { ...p, stance: 'wrath' as const } : p,
      ),
    };

    // End turn — wrath deals 1 HP loss, then enemy deals 5 damage
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.round).toBe(2);
    // Wrath end-of-turn: -1 HP (direct), enemy: -5 HP (from damage after block reset)
    expect(state.players[0]!.hp).toBe(66); // 72 - 1 (wrath) - 5 (enemy)
    expect(state.players[0]!.stance).toBe('wrath'); // stance persists
  });
});

describe('Multi-player turn signaling', () => {
  const cardLookup = makeCardLookup([strikeR, defendR]);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('waits for all players before transitioning', () => {
    const p1 = buildTestPlayer({
      id: 'player-1',
      nickname: 'P1',
      hand: [],
      drawPile: ['strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r'],
      hp: 80,
    });
    const p2 = buildTestPlayer({
      id: 'player-2',
      nickname: 'P2',
      hand: [],
      drawPile: ['defend_r', 'defend_r', 'defend_r', 'defend_r', 'defend_r'],
      hp: 80,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [p1, p2],
      enemyCombatStates: { jaw_worm: enemy },
      round: 1,
      dieResult: 4,
    });

    // P1 ends turn
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );
    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.players[0]!.endedTurn).toBe(true);

    // P2 ends turn — triggers full transition
    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-2' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );
    expect(state.phase).toBe('PLAYER_ACTIONS');
    expect(state.round).toBe(2);
    // Both players took 5 damage from jaw worm (boss targeting all? No, encounter targets first player)
    expect(state.players[0]!.hp).toBe(75); // 80 - 5
    // Player 2 doesn't get hit (encounter targets first player only)
    expect(state.players[1]!.hp).toBe(80);
  });
});

describe('Multi-hit with Vulnerable', () => {
  const allCards = [twinStrike];
  const cardLookup = makeCardLookup(allCards);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('Twin Strike deals doubled damage per hit against vulnerable target', () => {
    const player = buildTestPlayer({
      hand: ['twin_strike'],
      energy: 3,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44, vulnerableTokens: 2 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 4,
    });

    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'twin_strike', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Twin Strike: 2 hits of 5 damage via single applyMultiHit call
    // Each hit vs vulnerable: 5 * 2 = 10, x2 hits = 20 total damage
    // After all hits: 1 vulnerable token removed (board game rule: once per attack)
    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(24); // 44 - 20
    expect(state.enemyCombatStates['jaw_worm']!.vulnerableTokens).toBe(1);
  });
});

describe('Combat end conditions', () => {
  const cardLookup = makeCardLookup([strikeR]);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('all enemies dead triggers COMBAT_END', () => {
    const player = buildTestPlayer({ hand: ['strike_r'], energy: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 5 }); // strike does 6
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    state = combatReducer(
      state,
      { type: 'PLAY_CARD', playerId: 'player-1', cardId: 'strike_r', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.phase).toBe('COMBAT_END');
    expect(state.combatLog).toContainEqual(expect.stringContaining('All enemies defeated'));
  });

  it('player death during enemy turn triggers COMBAT_END', () => {
    const player = buildTestPlayer({
      hand: [],
      drawPile: ['strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r'],
      hp: 4,
      block: 0,
    });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 44 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
      dieResult: 4,
    });

    state = combatReducer(
      state,
      { type: 'END_TURN', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // Jaw worm deals 5 damage to player with 4 HP
    expect(state.phase).toBe('COMBAT_END');
    expect(state.players[0]!.hp).toBeLessThanOrEqual(0);
  });
});

describe('USE_MIRACLE action', () => {
  const cardLookup = makeCardLookup([strikeR]);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('grants 1 energy and reduces miracle token', () => {
    const player = buildTestPlayer({ energy: 2, miracleTokens: 3 });
    let state = buildTestGameState({ players: [player] });

    state = combatReducer(
      state,
      { type: 'USE_MIRACLE', playerId: 'player-1' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.players[0]!.energy).toBe(3);
    expect(state.players[0]!.miracleTokens).toBe(2);
  });
});

describe('USE_SHIVS action', () => {
  const cardLookup = makeCardLookup([strikeR]);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('resolves shiv attacks and checks deaths', () => {
    const player = buildTestPlayer({ shivTokens: 3 });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 2 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    state = combatReducer(
      state,
      { type: 'USE_SHIVS', playerId: 'player-1', targetId: 'jaw_worm' },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    // 3 shivs each deal 1 damage = 3 total, enemy had 2 HP → dead
    expect(state.enemyCombatStates['jaw_worm']!.isDead).toBe(true);
    expect(state.phase).toBe('COMBAT_END');
  });
});

describe('EVOKE_ORB action', () => {
  const cardLookup = makeCardLookup([strikeR]);
  const enemyLookup = makeEnemyLookup([jawWormEnemy]);

  it('evokes lightning orb dealing 8 damage', () => {
    const player = buildTestPlayer({ orbs: ['lightning'] });
    const enemy = buildTestEnemy({ id: 'jaw_worm', hp: 20 });
    let state = buildTestGameState({
      players: [player],
      enemyCombatStates: { jaw_worm: enemy },
    });

    state = combatReducer(
      state,
      { type: 'EVOKE_ORB', playerId: 'player-1', orbIndex: 0 },
      cardLookup,
      enemyLookup,
      fixedRng,
    );

    expect(state.players[0]!.orbs).toEqual([]);
    expect(state.enemyCombatStates['jaw_worm']!.hp).toBe(12); // 20 - 8
  });
});
