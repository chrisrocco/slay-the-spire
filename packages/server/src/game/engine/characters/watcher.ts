import type { CombatGameState, Stance } from '../../state/combatState.js';

/**
 * Watcher starter deck card IDs.
 */
export function watcherStarterDeck(): string[] {
  return [
    'strike_w', 'strike_w', 'strike_w', 'strike_w',
    'defend_w', 'defend_w', 'defend_w', 'defend_w',
    'eruption',
    'vigilance',
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
 * Enter a stance. Board game rules:
 * - Same stance = no-op
 * - Leaving Calm grants 2 energy
 * - Sets stance to target
 */
export function enterStance(
  state: CombatGameState,
  playerId: string,
  targetStance: Stance,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  // Same stance is a no-op
  if (player.stance === targetStance) return state;

  let result = state;

  // Leaving Calm grants 2 energy
  if (player.stance === 'calm') {
    result = updatePlayer(result, playerId, (p) => ({
      ...p,
      energy: Math.min(6, p.energy + 2),
    }));
  }

  // Set the new stance
  result = updatePlayer(result, playerId, (p) => ({
    ...p,
    stance: targetStance,
  }));

  return result;
}

/**
 * Apply Wrath end-of-turn effect: if in Wrath, deal 1 damage to player (direct HP loss, bypasses block).
 */
export function applyWrathEndOfTurn(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.stance !== 'wrath') return state;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    hp: Math.max(0, p.hp - 1),
  }));
}

/**
 * Gain miracle tokens, capped at 5.
 */
export function gainMiracle(
  state: CombatGameState,
  playerId: string,
  count: number,
): CombatGameState {
  return updatePlayer(state, playerId, (p) => ({
    ...p,
    miracleTokens: Math.min(5, p.miracleTokens + count),
  }));
}

/**
 * Use a miracle: gain 1 energy, reduce miracles by 1.
 * If 0 miracles, no change.
 */
export function useMiracle(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.miracleTokens <= 0) return state;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    miracleTokens: p.miracleTokens - 1,
    energy: Math.min(6, p.energy + 1),
  }));
}
