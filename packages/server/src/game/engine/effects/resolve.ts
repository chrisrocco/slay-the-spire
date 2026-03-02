import type { CombatGameState } from '../../state/combatState.js';
import type { CardEffect, EffectContext } from './types.js';

/**
 * Resolve a single effect against the game state.
 * Dispatches on effect.kind — most handlers are stubs until the
 * damage/status/deck systems are built in plans 02-03 through 02-06.
 * Handlers will be wired up in plan 02-07.
 */
export function resolveEffect(
  state: CombatGameState,
  effect: CardEffect,
  _context: EffectContext,
): CombatGameState {
  switch (effect.kind) {
    case 'DealDamage':
      // TODO: implement in plan 02-03 (damage system)
      return state;

    case 'GainBlock':
      // TODO: implement in plan 02-03 (damage system)
      return state;

    case 'ApplyStatus':
      // TODO: implement in plan 02-03 (status system)
      return state;

    case 'GainEnergy':
      // TODO: implement in plan 02-05 (player turn)
      return state;

    case 'DrawCards':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'DiscardCards':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'Exhaust':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'Channel':
      // TODO: implement in plan 02-08 (defect mechanics)
      return state;

    case 'Evoke':
      // TODO: implement in plan 02-08 (defect mechanics)
      return state;

    case 'EnterStance':
      // TODO: implement in plan 02-08 (watcher mechanics)
      return state;

    case 'GainShiv':
      // TODO: implement in plan 02-08 (silent mechanics)
      return state;

    case 'GainMiracle':
      // TODO: implement in plan 02-08 (watcher mechanics)
      return state;

    case 'Scry':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'AddCardToDiscard':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'AddCardToHand':
      // TODO: implement in plan 02-04 (deck management)
      return state;

    case 'UpgradeCard':
      // TODO: implement in plan 02-07 (effect handlers)
      return state;

    case 'GainGold':
      // TODO: implement in plan 02-07 (effect handlers)
      return state;

    case 'LoseHp':
      // TODO: implement in plan 02-03 (damage system)
      return state;

    case 'HealHp':
      // TODO: implement in plan 02-07 (effect handlers)
      return state;

    case 'Conditional':
      // TODO: implement in plan 02-07 (effect handlers)
      return state;

    case 'PerX':
      // TODO: implement in plan 02-07 (effect handlers)
      return state;

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
