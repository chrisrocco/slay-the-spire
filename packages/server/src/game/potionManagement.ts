/**
 * potionManagement.ts — Potion pass and discard outside combat.
 */
import type { CombatGameState } from './state/combatState.js';

const MAX_POTIONS_DEFAULT = 3;
const MAX_POTIONS_BELT = 5;

function getPotionLimit(playerRelics: string[]): number {
  return playerRelics.includes('potion_belt') ? MAX_POTIONS_BELT : MAX_POTIONS_DEFAULT;
}

/**
 * Pass a potion from one player to another.
 * Only valid during MAP phase (outside combat).
 *
 * @throws never — returns unchanged state on validation failure
 */
export function passPotion(
  state: CombatGameState,
  playerId: string,
  potionId: string,
  targetPlayerId: string,
): CombatGameState {
  // Only valid outside combat
  if (state.gamePhase !== 'MAP') return state;

  const sourcePlayer = state.players.find((p) => p.id === playerId);
  if (!sourcePlayer) return state;

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) return state;

  // Validate source has the potion
  if (!sourcePlayer.potions.includes(potionId)) return state;

  // Validate target is under potion limit
  const targetLimit = getPotionLimit(targetPlayer.relics);
  if (targetPlayer.potions.length >= targetLimit) return state;

  // Remove from source, add to target
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          potions: p.potions.filter((id) => id !== potionId),
        };
      }
      if (p.id === targetPlayerId) {
        return {
          ...p,
          potions: [...p.potions, potionId],
        };
      }
      return p;
    }),
  };
}

/**
 * Discard a potion from a player's inventory.
 * Valid during any game phase.
 */
export function discardPotion(
  state: CombatGameState,
  playerId: string,
  potionId: string,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  // Validate player has the potion
  if (!player.potions.includes(potionId)) return state;

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          potions: p.potions.filter((id) => id !== potionId),
        };
      }
      return p;
    }),
  };
}
