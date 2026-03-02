import type { CombatGameState } from '../../state/combatState.js';
import type { OrbType } from '../../state/combatState.js';
import { applyDamage } from '../damage.js';

/**
 * Defect starter deck card IDs.
 */
export function defectStarterDeck(): string[] {
  return [
    'strike_b', 'strike_b', 'strike_b', 'strike_b',
    'defend_b', 'defend_b', 'defend_b', 'defend_b',
    'zap',
    'dualcast',
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
 * Channel an orb into the player's orb slots.
 * If slots are full, auto-evoke the first orb (index 0) before channeling.
 */
export function channelOrb(
  state: CombatGameState,
  playerId: string,
  orbType: OrbType,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  let result = state;

  // If full, must evoke first orb
  if (player.orbs.length >= player.maxOrbSlots) {
    result = evokeOrb(result, playerId, 0);
  }

  // Channel the new orb
  return updatePlayer(result, playerId, (p) => ({
    ...p,
    orbs: [...p.orbs, orbType],
  }));
}

/**
 * Evoke an orb at the specified index.
 * Removes the orb and triggers its evoke effect.
 *   - Lightning: deal 8 damage to first living enemy
 *   - Frost: gain 5 block for the player
 *   - Dark: deal 8 damage (simplified for Phase 2)
 */
export function evokeOrb(
  state: CombatGameState,
  playerId: string,
  orbIndex: number,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || orbIndex < 0 || orbIndex >= player.orbs.length) return state;

  const orbType = player.orbs[orbIndex]!;

  // Remove the orb
  let result = updatePlayer(state, playerId, (p) => ({
    ...p,
    orbs: [...p.orbs.slice(0, orbIndex), ...p.orbs.slice(orbIndex + 1)],
  }));

  // Apply evoke effect
  switch (orbType) {
    case 'lightning': {
      // Deal 8 damage to first living enemy
      const living = Object.entries(result.enemyCombatStates).find(([, e]) => !e.isDead);
      if (living) {
        result = applyDamage(result, 'enemy', living[0], 8);
      }
      break;
    }
    case 'frost': {
      // Gain 5 block
      const PLAYER_BLOCK_CAP = 20;
      result = updatePlayer(result, playerId, (p) => ({
        ...p,
        block: Math.min(PLAYER_BLOCK_CAP, p.block + 5),
      }));
      break;
    }
    case 'dark': {
      // Deal 8 damage (simplified for Phase 2)
      const living = Object.entries(result.enemyCombatStates).find(([, e]) => !e.isDead);
      if (living) {
        result = applyDamage(result, 'enemy', living[0], 8);
      }
      break;
    }
  }

  return result;
}

/**
 * Apply end-of-turn orb effects.
 *   - Lightning: deal 3 damage to first living enemy
 *   - Frost: gain 2 block
 *   - Dark: no passive end-of-turn effect (charges for evoke)
 */
export function applyOrbEndOfTurn(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  let result = state;
  const PLAYER_BLOCK_CAP = 20;

  for (const orb of player.orbs) {
    switch (orb) {
      case 'lightning': {
        const living = Object.entries(result.enemyCombatStates).find(([, e]) => !e.isDead);
        if (living) {
          result = applyDamage(result, 'enemy', living[0], 3);
        }
        break;
      }
      case 'frost': {
        result = updatePlayer(result, playerId, (p) => ({
          ...p,
          block: Math.min(PLAYER_BLOCK_CAP, p.block + 2),
        }));
        break;
      }
      case 'dark': {
        // No passive end-of-turn effect
        break;
      }
    }
  }

  return result;
}
