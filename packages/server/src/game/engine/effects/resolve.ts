import type { CombatGameState } from '../../state/combatState.js';
import type { CardEffect, EffectContext } from './types.js';
import { applyMultiHit } from '../damage.js';
import { applyStatusToken } from '../status.js';
import { drawCards } from '../deck.js';
import { moveToExhaust } from '../deck.js';

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
 * Resolve a single effect against the game state.
 */
export function resolveEffect(
  state: CombatGameState,
  effect: CardEffect,
  context: EffectContext,
): CombatGameState {
  switch (effect.kind) {
    case 'DealDamage': {
      let result = state;

      if (effect.target === 'chosen') {
        if (!context.targetId) return state;
        result = applyMultiHit(result, 'player', context.playerId, 'enemy', context.targetId, effect.hits, effect.amount);
      } else if (effect.target === 'all' || effect.target === 'all_row') {
        // Target all living enemies
        for (const [enemyId, enemy] of Object.entries(result.enemyCombatStates)) {
          if (!enemy.isDead) {
            result = applyMultiHit(result, 'player', context.playerId, 'enemy', enemyId, effect.hits, effect.amount);
          }
        }
      } else if (effect.target === 'random') {
        // Pick first living enemy for determinism
        const living = Object.entries(result.enemyCombatStates).find(([, e]) => !e.isDead);
        if (living) {
          result = applyMultiHit(result, 'player', context.playerId, 'enemy', living[0], effect.hits, effect.amount);
        }
      }
      return result;
    }

    case 'GainBlock': {
      const PLAYER_BLOCK_CAP = 20;

      if (effect.target === 'self' || effect.target === 'any_player') {
        return updatePlayer(state, context.playerId, (p) => ({
          ...p,
          block: Math.min(PLAYER_BLOCK_CAP, p.block + effect.amount),
        }));
      }

      if (effect.target === 'all_players') {
        let result = state;
        for (const player of result.players) {
          result = updatePlayer(result, player.id, (p) => ({
            ...p,
            block: Math.min(PLAYER_BLOCK_CAP, p.block + effect.amount),
          }));
        }
        return result;
      }

      return state;
    }

    case 'ApplyStatus': {
      if (effect.target === 'chosen') {
        if (!context.targetId) return state;
        return applyStatusToken(state, 'enemy', context.targetId, effect.status, effect.amount);
      }

      if (effect.target === 'self') {
        return applyStatusToken(state, 'player', context.playerId, effect.status, effect.amount);
      }

      if (effect.target === 'any_player') {
        return applyStatusToken(state, 'player', context.playerId, effect.status, effect.amount);
      }

      if (effect.target === 'all_enemies' || effect.target === 'all_row') {
        let result = state;
        for (const [enemyId, enemy] of Object.entries(result.enemyCombatStates)) {
          if (!enemy.isDead) {
            result = applyStatusToken(result, 'enemy', enemyId, effect.status, effect.amount);
          }
        }
        return result;
      }

      return state;
    }

    case 'GainEnergy': {
      return updatePlayer(state, context.playerId, (p) => ({
        ...p,
        energy: Math.min(6, p.energy + effect.amount),
      }));
    }

    case 'DrawCards': {
      return drawCards(state, context.playerId, effect.count);
    }

    case 'DiscardCards': {
      if (effect.target === 'random') {
        const player = state.players.find((p) => p.id === context.playerId);
        if (!player || player.hand.length === 0) return state;

        const count = Math.min(effect.count, player.hand.length);
        // Discard from end of hand for determinism
        const discarded = player.hand.slice(-count);
        const remaining = player.hand.slice(0, player.hand.length - count);

        return updatePlayer(state, context.playerId, (p) => ({
          ...p,
          hand: remaining,
          discardPile: [...p.discardPile, ...discarded],
        }));
      }

      // 'self' target means player chooses — return pending decision (log for now)
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] Player must discard ${effect.count} card(s)`],
      };
    }

    case 'Exhaust': {
      if (effect.target === 'self') {
        const player = state.players.find((p) => p.id === context.playerId);
        if (!player || !player.beingPlayed) return state;
        return moveToExhaust(state, context.playerId, player.beingPlayed, 'hand');
      }

      // chosen_hand / random_hand — log for now
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] Exhaust ${effect.target}`],
      };
    }

    case 'Channel': {
      // Stub — implemented in plan 02-08 (defect mechanics)
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] Channel ${effect.count} ${effect.orbType}`],
      };
    }

    case 'Evoke': {
      // Stub — implemented in plan 02-08 (defect mechanics)
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] Evoke ${effect.count}`],
      };
    }

    case 'EnterStance': {
      // Stub — implemented in plan 02-08 (watcher mechanics)
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] Enter ${effect.stance}`],
      };
    }

    case 'GainShiv': {
      // Stub — implemented in plan 02-08 (silent mechanics)
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] Gain ${effect.count} Shiv(s)`],
      };
    }

    case 'GainMiracle': {
      // Stub — implemented in plan 02-08 (watcher mechanics)
      return {
        ...state,
        combatLog: [...state.combatLog, `[Stub] Gain ${effect.count} Miracle(s)`],
      };
    }

    case 'Scry': {
      // Returns pending decision — player must choose cards to discard from top
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] Scry ${effect.count}`],
      };
    }

    case 'AddCardToDiscard': {
      return updatePlayer(state, context.playerId, (p) => ({
        ...p,
        discardPile: [...p.discardPile, effect.cardId],
      }));
    }

    case 'AddCardToHand': {
      return updatePlayer(state, context.playerId, (p) => ({
        ...p,
        hand: [...p.hand, effect.cardId],
      }));
    }

    case 'UpgradeCard': {
      // Placeholder — upgrading cards requires card lookup and ID remapping
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] Upgrade card (${effect.target})`],
      };
    }

    case 'GainGold': {
      return updatePlayer(state, context.playerId, (p) => ({
        ...p,
        gold: p.gold + effect.amount,
      }));
    }

    case 'LoseHp': {
      // Direct HP loss, bypasses block
      return updatePlayer(state, context.playerId, (p) => ({
        ...p,
        hp: Math.max(0, p.hp - effect.amount),
      }));
    }

    case 'HealHp': {
      if (effect.target === 'self' || effect.target === 'any_player') {
        return updatePlayer(state, context.playerId, (p) => ({
          ...p,
          hp: Math.min(p.maxHp, p.hp + effect.amount),
        }));
      }
      return state;
    }

    case 'Conditional': {
      // Placeholder — condition evaluation requires game context
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] Conditional: ${effect.condition}`],
      };
    }

    case 'PerX': {
      // Placeholder — per-X evaluation requires game context
      return {
        ...state,
        combatLog: [...state.combatLog, `[TODO] PerX: ${effect.per}`],
      };
    }

    case 'Unimplemented': {
      const log = [...state.combatLog, `[Unimplemented] ${effect.description}`];
      return { ...state, combatLog: log };
    }

    default: {
      // Exhaustive check — TypeScript error if a kind is missing
      const _exhaustive: never = effect;
      return _exhaustive;
    }
  }
}

/**
 * Resolve all effects for a card in sequence, threading state through each.
 */
export function resolveCardEffects(
  state: CombatGameState,
  effects: CardEffect[],
  context: EffectContext,
): CombatGameState {
  return effects.reduce(
    (currentState, effect) => resolveEffect(currentState, effect, context),
    state,
  );
}
