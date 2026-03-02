import type { CombatGameState } from '../state/combatState.js';
import type { PlayerCard, EnemyCard, EnemyHP } from '@slay-online/shared';
import type { EnemyCombatState } from '../state/enemyCombatState.js';
import { startPlayerTurn, playCard, signalEndTurn } from './playerTurn.js';
import { resolveEnemyTurn, checkDeaths, isAllEnemiesDead } from './enemyTurn.js';
import { resolveScry } from './deck.js';
import { useMiracle } from './characters/watcher.js';
import { applyWrathEndOfTurn } from './characters/watcher.js';
import { resolveShivs } from './characters/silent.js';
import { evokeOrb, applyOrbEndOfTurn } from './characters/defect.js';

// ===== Action Types =====

export type Action =
  | { type: 'START_COMBAT'; playerIds: string[]; enemyIds: string[]; playerCount: number }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; targetId?: string | undefined }
  | { type: 'USE_POTION'; playerId: string; potionId: string; targetId?: string | undefined }
  | { type: 'USE_MIRACLE'; playerId: string }
  | { type: 'USE_SHIVS'; playerId: string; targetId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'EVOKE_ORB'; playerId: string; orbIndex: number }
  | { type: 'RESOLVE_SCRY'; playerId: string; discardIds: string[] };

// ===== Init Combat =====

/**
 * Resolve enemy HP based on player count.
 */
function resolveHP(hp: EnemyHP, playerCount: number): number {
  if (typeof hp === 'number') return hp;
  const key = playerCount as 1 | 2 | 3 | 4;
  return hp[key] ?? hp[1];
}

/**
 * Initialize combat: hydrate CombatGameState from base state + enemy cards.
 */
export function initCombat(
  state: CombatGameState,
  enemyCards: EnemyCard[],
  playerCount: number,
  rng: () => number = Math.random,
): CombatGameState {
  // Create enemy combat states
  const enemyCombatStates: Record<string, EnemyCombatState> = {};
  for (let i = 0; i < enemyCards.length; i++) {
    const card = enemyCards[i]!;
    const hp = resolveHP(card.hp, playerCount);

    // Row assignment: encounter = row index, elite/boss = row 0
    const row = card.category === 'encounter' || card.category === 'first_encounter'
      ? Math.min(i, playerCount - 1)
      : 0;

    enemyCombatStates[card.id] = {
      id: card.id,
      hp,
      maxHp: hp,
      block: 0,
      row,
      isDead: false,
      vulnerableTokens: 0,
      weakTokens: 0,
      strengthTokens: 0,
      poisonTokens: 0,
      cubePosition: 0,
    };
  }

  // Set up initial combat state
  let newState: CombatGameState = {
    ...state,
    round: 0, // startPlayerTurn increments to 1
    phase: 'PLAYER_ACTIONS',
    dieResult: null,
    activeEnemies: enemyCards.map((e) => e.id),
    enemyCombatStates,
    combatLog: [`Combat started with ${enemyCards.length} enemy(ies) and ${playerCount} player(s)`],
    players: state.players.map((p) => ({
      ...p,
      block: 0,
      energy: 0,
      hand: [],
      endedTurn: false,
      vulnerableTokens: 0,
      weakTokens: 0,
      strengthTokens: 0,
      shivTokens: 0,
      orbs: [],
      stance: 'neutral' as const,
      miracleTokens: 0,
      beingPlayed: null,
    })),
  };

  // Start the first player turn (round 0 -> 1, draws cards, rolls die)
  newState = startPlayerTurn(newState, rng);

  return newState;
}

// ===== Combat Reducer =====

/**
 * Apply character-specific end-of-turn effects for all players.
 */
function applyCharacterEndOfTurn(state: CombatGameState): CombatGameState {
  let result = state;

  for (const player of result.players) {
    // Watcher: wrath end-of-turn damage
    if (player.stance === 'wrath') {
      result = applyWrathEndOfTurn(result, player.id);
    }

    // Defect: orb end-of-turn effects
    if (player.orbs.length > 0) {
      result = applyOrbEndOfTurn(result, player.id);
    }
  }

  return result;
}

/**
 * The combat reducer: dispatches actions to the appropriate handler.
 * Returns the new state after processing the action.
 */
export function combatReducer(
  state: CombatGameState,
  action: Action,
  cardLookup: (id: string) => PlayerCard | undefined,
  enemyLookup: (id: string) => EnemyCard | undefined,
  rng: () => number = Math.random,
): CombatGameState {
  // Reject all actions when combat is over
  if (state.phase === 'COMBAT_END') {
    return state;
  }

  switch (action.type) {
    case 'START_COMBAT': {
      // Look up enemy cards from the IDs provided
      const enemyCards: EnemyCard[] = [];
      for (const enemyId of action.enemyIds) {
        const card = enemyLookup(enemyId);
        if (card) enemyCards.push(card);
      }
      return initCombat(state, enemyCards, action.playerCount, rng);
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'PLAYER_ACTIONS') {
        return {
          ...state,
          combatLog: [...state.combatLog, `[Rejected] Cannot play cards during ${state.phase}`],
        };
      }
      let result = playCard(state, action.playerId, action.cardId, action.targetId, cardLookup);
      result = checkDeaths(result);
      if (isAllEnemiesDead(result)) {
        return {
          ...result,
          phase: 'COMBAT_END',
          combatLog: [...result.combatLog, 'All enemies defeated!'],
        };
      }
      return result;
    }

    case 'END_TURN': {
      if (state.phase !== 'PLAYER_ACTIONS') {
        return {
          ...state,
          combatLog: [...state.combatLog, `[Rejected] Cannot end turn during ${state.phase}`],
        };
      }

      // Signal end turn; signalEndTurn handles discarding/transitions when all players signal
      const cardFlagsLookup = (id: string) => {
        const card = cardLookup(id);
        return {
          ethereal: card?.ethereal ?? false,
          retain: card?.retain ?? false,
        };
      };
      let result = signalEndTurn(state, action.playerId, cardFlagsLookup);

      // If all players ended, signalEndTurn transitions to ENEMY_TURN
      if (result.phase === 'ENEMY_TURN') {
        // Apply character-specific end-of-turn effects before enemy turn
        result = applyCharacterEndOfTurn(result);

        // Resolve enemy turn
        result = resolveEnemyTurn(result, enemyLookup);

        // Check if combat continues
        if (result.phase === 'COMBAT_END') {
          return result;
        }

        // CLEANUP or ENEMY_TURN returned — start new player turn
        result = startPlayerTurn(result, rng);
      }

      return result;
    }

    case 'USE_MIRACLE': {
      if (state.phase !== 'PLAYER_ACTIONS') return state;
      return useMiracle(state, action.playerId);
    }

    case 'USE_SHIVS': {
      if (state.phase !== 'PLAYER_ACTIONS') return state;
      let result = resolveShivs(state, action.playerId, action.targetId);
      result = checkDeaths(result);
      if (isAllEnemiesDead(result)) {
        return {
          ...result,
          phase: 'COMBAT_END',
          combatLog: [...result.combatLog, 'All enemies defeated!'],
        };
      }
      return result;
    }

    case 'EVOKE_ORB': {
      if (state.phase !== 'PLAYER_ACTIONS') return state;
      let result = evokeOrb(state, action.playerId, action.orbIndex);
      result = checkDeaths(result);
      if (isAllEnemiesDead(result)) {
        return {
          ...result,
          phase: 'COMBAT_END',
          combatLog: [...result.combatLog, 'All enemies defeated!'],
        };
      }
      return result;
    }

    case 'RESOLVE_SCRY': {
      if (state.phase !== 'PLAYER_ACTIONS') return state;
      // scryCount defaults to the number of discardIds — the client sends all seen cards
      return resolveScry(state, action.playerId, action.discardIds, action.discardIds.length);
    }

    case 'USE_POTION': {
      // Stub for Phase 5
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] ${action.playerId} used potion ${action.potionId}`],
      };
    }
  }
}
