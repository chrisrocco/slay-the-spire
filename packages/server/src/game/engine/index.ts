import type { CombatGameState } from '../state/combatState.js';
import type { PlayerCard, EnemyCard } from '@slay-online/shared';
import {
  ironcladCards,
  silentCards,
  defectCards,
  watcherCards,
  encounterEnemies,
  eliteEnemies,
  bossEnemies,
} from '@slay-online/shared';
import { combatReducer } from './combat.js';
import type { Action } from './combat.js';

// Re-export Action type for consumers
export type { Action } from './combat.js';
export { initCombat, combatReducer } from './combat.js';

// ===== Build Lookup Maps =====

const allPlayerCards: PlayerCard[] = [
  ...ironcladCards,
  ...silentCards,
  ...defectCards,
  ...watcherCards,
] as PlayerCard[];

const playerCardMap = new Map<string, PlayerCard>();
for (const card of allPlayerCards) {
  playerCardMap.set(card.id, card);
}

const allEnemyCards: EnemyCard[] = [
  ...encounterEnemies,
  ...eliteEnemies,
  ...bossEnemies,
] as EnemyCard[];

const enemyCardMap = new Map<string, EnemyCard>();
for (const card of allEnemyCards) {
  enemyCardMap.set(card.id, card);
}

// ===== Lookup Functions =====

export function cardLookup(id: string): PlayerCard | undefined {
  return playerCardMap.get(id);
}

export function enemyLookup(id: string): EnemyCard | undefined {
  return enemyCardMap.get(id);
}

// ===== Public API =====

/**
 * processAction is the single public API for all game mutations.
 * The server calls this when it receives a player intent over WebSocket.
 *
 * @param state - The current combat game state
 * @param action - The action to process
 * @param rng - Optional RNG function for deterministic testing
 * @returns The new combat game state after processing the action
 */
export function processAction(
  state: CombatGameState,
  action: Action,
  rng: () => number = Math.random,
): CombatGameState {
  return combatReducer(state, action, cardLookup, enemyLookup, rng);
}
