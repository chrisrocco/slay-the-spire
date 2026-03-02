import type { CombatGameState } from '../../state/combatState.js';

/**
 * Ironclad starter deck card IDs.
 */
export function ironcladStarterDeck(): string[] {
  return [
    'strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r',
    'defend_r', 'defend_r', 'defend_r', 'defend_r',
    'bash',
  ];
}

/**
 * Get the number of cards in a player's exhaust pile.
 * Used for exhaust-synergy cards like Sentinel, Feel No Pain, etc.
 */
export function getExhaustCount(
  state: CombatGameState,
  playerId: string,
): number {
  const player = state.players.find((p) => p.id === playerId);
  return player?.exhaustPile.length ?? 0;
}
