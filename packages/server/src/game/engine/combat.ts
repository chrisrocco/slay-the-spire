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
import { POTION_EFFECTS } from './potionEffects.js';
import { resolveCardEffects } from './effects/resolve.js';
import type { CardEffect, EffectContext } from './effects/types.js';

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

// ===== Potion Handler =====

/**
 * Check if a player has a given relic.
 */
function hasRelic(state: CombatGameState, playerId: string, relicId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  return player?.relics.includes(relicId) ?? false;
}

/**
 * Scale potion effect amounts by a multiplier (for Sacred Bark).
 * Only numeric effect amounts are scaled.
 */
function scalePotionEffects(effects: CardEffect[], multiplier: number): CardEffect[] {
  return effects.map(effect => {
    switch (effect.kind) {
      case 'DealDamage':
        return { ...effect, amount: effect.amount * multiplier };
      case 'GainBlock':
        return { ...effect, amount: effect.amount * multiplier };
      case 'ApplyStatus':
        return { ...effect, amount: effect.amount * multiplier };
      case 'GainEnergy':
        return { ...effect, amount: effect.amount * multiplier };
      case 'DrawCards':
        return { ...effect, count: effect.count * multiplier };
      case 'HealHp':
        return { ...effect, amount: effect.amount * multiplier };
      default:
        return effect;
    }
  });
}

/**
 * Use a potion: validate, resolve effects, remove from potion slot,
 * and apply relic interactions (Toy Ornithopter, Sacred Bark).
 */
function usePotion(
  state: CombatGameState,
  playerId: string,
  potionId: string,
  targetId?: string,
): CombatGameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return state;

  // Validate player has the potion
  if (!player.potions.includes(potionId)) {
    return {
      ...state,
      combatLog: [
        ...state.combatLog,
        `[Failed] ${playerId} does not have potion ${potionId}`,
      ],
    };
  }

  // Look up potion in registry
  const def = POTION_EFFECTS[potionId];
  if (!def) {
    return {
      ...state,
      combatLog: [
        ...state.combatLog,
        `[Unimplemented] Potion ${potionId} has no effect definition`,
      ],
    };
  }

  // Resolve base effects
  let effects: CardEffect[] =
    typeof def.effects === 'function'
      ? def.effects(state, playerId, targetId)
      : def.effects;

  // Apply Sacred Bark doubling
  if (hasRelic(state, playerId, 'sacred_bark')) {
    effects = scalePotionEffects(effects, 2);
  }

  // Build effect context
  const context: EffectContext = {
    playerId,
    targetId,
    dieResult: state.dieResult ?? 0,
    source: 'potion',
  };

  // Apply effects
  let result = resolveCardEffects(state, effects, context);

  // Remove potion from player's potion slot
  result = {
    ...result,
    players: result.players.map(p =>
      p.id === playerId
        ? { ...p, potions: p.potions.filter(pid => pid !== potionId) }
        : p,
    ),
  };

  // Apply Toy Ornithopter: heal 5 HP when any potion is used
  if (hasRelic(result, playerId, 'toy_ornithopter')) {
    const healContext: EffectContext = {
      playerId,
      dieResult: result.dieResult ?? 0,
      source: 'relic',
    };
    result = resolveCardEffects(result, [{ kind: 'HealHp', amount: 5, target: 'self' }], healContext);
  }

  // Add combat log entry
  result = {
    ...result,
    combatLog: [...result.combatLog, `${playerId} used potion ${potionId}`],
  };

  // Check deaths after damage potions
  result = checkDeaths(result);

  return result;
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
      return usePotion(state, action.playerId, action.potionId, action.targetId);
    }
  }
}
