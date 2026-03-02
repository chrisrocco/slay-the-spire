/**
 * rewardHandler.ts — Combat reward generation and selection.
 *
 * Handles reward generation after combat and player reward picks.
 * Full implementation in Plan 05-04.
 */
import type { CombatGameState } from './state/combatState.js';

/**
 * Handle REWARD_PICK_CARD: player picks a card from reward options.
 * Full implementation in Plan 05-04.
 */
export function handleRewardPickCard(
  state: CombatGameState,
  playerId: string,
  cardId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, cardPicked: cardId },
      },
    },
  };
}

/**
 * Handle REWARD_PICK_POTION: player picks the potion reward.
 * Full implementation in Plan 05-04.
 */
export function handleRewardPickPotion(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, potionPicked: true },
      },
    },
  };
}

/**
 * Handle REWARD_PICK_RELIC: player picks the relic reward.
 * Full implementation in Plan 05-04.
 */
export function handleRewardPickRelic(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, relicPicked: true },
      },
    },
  };
}

/**
 * Handle REWARD_SKIP: player skips their reward.
 * Full implementation in Plan 05-04.
 */
export function handleRewardSkip(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, skipped: true },
      },
    },
  };
}
