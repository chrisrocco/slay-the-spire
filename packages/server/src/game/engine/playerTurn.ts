import type { CombatGameState } from '../state/combatState.js';
import type { PlayerCard } from '@slay-online/shared';
import { drawCards, discardHand, moveToExhaust } from './deck.js';
import { collectTriggers, processTriggerQueue } from './triggers.js';
import { applyPoisonTick } from './status.js';
import { getCardEffects } from './effects/registry.js';
import { resolveCardEffects } from './effects/resolve.js';
import type { EffectContext } from './effects/types.js';

/**
 * Start the player turn: reset energy/block, draw cards, roll die, fire triggers.
 */
export function startPlayerTurn(
  state: CombatGameState,
  rng: () => number = Math.random,
): CombatGameState {
  const round = state.round + 1;
  const dieResult = Math.floor(rng() * 6) + 1;

  // Reset energy, block, endedTurn for all players
  let newState: CombatGameState = {
    ...state,
    round,
    dieResult,
    phase: 'PLAYER_ACTIONS',
    players: state.players.map((p) => ({
      ...p,
      energy: 3,
      block: 0,
      endedTurn: false,
    })),
  };

  // Draw 5 cards for each player
  for (const player of newState.players) {
    newState = drawCards(newState, player.id, 5, rng);
  }

  // Fire start-of-turn triggers
  const triggers = collectTriggers(newState, 'START_OF_TURN');
  newState = processTriggerQueue(newState, triggers);

  return newState;
}

/**
 * Signal that a player has ended their turn.
 * If all players have signaled, transitions to end-of-turn processing.
 */
export function signalEndTurn(
  state: CombatGameState,
  playerId: string,
  cardLookup: (id: string) => { ethereal?: boolean; retain?: boolean },
): CombatGameState {
  // Set the player's endedTurn flag
  const newState: CombatGameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, endedTurn: true } : p,
    ),
  };

  // Check if all players have ended turn
  const allEnded = newState.players.every((p) => p.endedTurn);

  if (allEnded) {
    return endPlayerTurn(newState, cardLookup);
  }

  return newState;
}

/**
 * End the player turn: fire end-of-turn triggers, apply poison, discard hands.
 */
export function endPlayerTurn(
  state: CombatGameState,
  cardLookup: (id: string) => { ethereal?: boolean; retain?: boolean },
): CombatGameState {
  // Fire end-of-turn triggers
  const triggers = collectTriggers(state, 'END_OF_TURN');
  let newState = processTriggerQueue(state, triggers);

  // Apply poison tick
  newState = applyPoisonTick(newState);

  // Discard each player's hand
  for (const player of newState.players) {
    newState = discardHand(newState, player.id, cardLookup);
  }

  // Transition to enemy turn
  newState = { ...newState, phase: 'ENEMY_TURN' };

  return newState;
}

/**
 * Play a card from a player's hand.
 */
export function playCard(
  state: CombatGameState,
  playerId: string,
  cardId: string,
  targetId: string | undefined,
  cardLookup: (id: string) => PlayerCard | undefined,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  // Check card is in hand
  const cardIdx = player.hand.indexOf(cardId);
  if (cardIdx === -1) return state;

  // Look up card data
  const card = cardLookup(cardId);
  if (!card) return state;

  // Check energy
  const cost = typeof card.cost === 'number' ? card.cost : 0;
  if (player.energy < cost) {
    return {
      ...state,
      combatLog: [...state.combatLog, `[Failed] ${playerId} cannot play ${card.name}: insufficient energy`],
    };
  }

  // Remove card from hand, deduct energy, set beingPlayed
  let newState: CombatGameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hand: [...p.hand.slice(0, cardIdx), ...p.hand.slice(cardIdx + 1)],
            energy: p.energy - cost,
            beingPlayed: cardId,
          }
        : p,
    ),
  };

  // Resolve card effects
  const effects = getCardEffects(cardId);
  const context: EffectContext = {
    playerId,
    targetId,
    dieResult: state.dieResult ?? 0,
    source: 'card',
  };
  newState = resolveCardEffects(newState, effects, context);

  // Move card to appropriate zone
  if (card.exhaust) {
    // Card has exhaust keyword — goes to exhaust pile
    newState = {
      ...newState,
      players: newState.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              exhaustPile: [...p.exhaustPile, cardId],
              beingPlayed: null,
            }
          : p,
      ),
    };
  } else if (card.type === 'Power') {
    // Powers stay in play (for Phase 2, just clear beingPlayed)
    newState = {
      ...newState,
      players: newState.players.map((p) =>
        p.id === playerId ? { ...p, beingPlayed: null } : p,
      ),
    };
  } else {
    // Attacks and Skills go to discard
    newState = {
      ...newState,
      players: newState.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              discardPile: [...p.discardPile, cardId],
              beingPlayed: null,
            }
          : p,
      ),
    };
  }

  // Add combat log entry
  newState = {
    ...newState,
    combatLog: [...newState.combatLog, `${playerId} played ${card.name}`],
  };

  return newState;
}
