import type { CombatGameState } from '../../state/combatState.js';
import { applyMultiHit } from '../damage.js';

/**
 * Silent starter deck card IDs.
 */
export function silentStarterDeck(): string[] {
  return [
    'strike_g', 'strike_g', 'strike_g', 'strike_g', 'strike_g',
    'defend_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g',
    'neutralize',
    'survivor',
  ];
}

/**
 * Helper: update a specific player immutably.
 */
function updatePlayer(
  state: CombatGameState,
  playerId: string,
  updater: (p: CombatGameState['players'][0]) => CombatGameState['players'][0],
): CombatGameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

/**
 * Resolve all shiv attacks for a player.
 * Each shiv deals 1 damage as a separate Attack (affected by Strength, Vulnerable, Weak independently).
 * After all shivs resolve, shiv tokens reset to 0.
 */
export function resolveShivs(
  state: CombatGameState,
  playerId: string,
  targetId: string,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.shivTokens <= 0) return state;

  let result = state;

  // Each shiv is a separate 1-damage attack
  for (let i = 0; i < player.shivTokens; i++) {
    result = applyMultiHit(result, 'player', playerId, 'enemy', targetId, 1, 1);
  }

  // Reset shiv tokens to 0
  result = updatePlayer(result, playerId, (p) => ({
    ...p,
    shivTokens: 0,
  }));

  return result;
}

/**
 * Gain shiv tokens, capped at 5.
 */
export function gainShivs(
  state: CombatGameState,
  playerId: string,
  count: number,
): CombatGameState {
  return updatePlayer(state, playerId, (p) => ({
    ...p,
    shivTokens: Math.min(5, p.shivTokens + count),
  }));
}
