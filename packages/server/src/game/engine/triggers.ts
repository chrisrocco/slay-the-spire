import type { CombatGameState } from '../state/combatState.js';
import type { CardEffect, EffectContext } from './effects/types.js';
import { resolveCardEffects } from './effects/resolve.js';

export type TriggerPhase =
  | 'START_OF_TURN'
  | 'END_OF_TURN'
  | 'START_OF_COMBAT'
  | 'END_OF_COMBAT'
  | 'ON_DEATH';

export type Trigger = {
  phase: TriggerPhase;
  playerId?: string;
  enemyId?: string;
  source: 'relic' | 'power';
  sourceId: string;
  effects: CardEffect[];
};

/**
 * Collect all triggers that match the given phase.
 * For Phase 2, this returns an empty array — actual relic/power trigger
 * registration will be implemented in Phase 5.
 */
export function collectTriggers(
  _state: CombatGameState,
  _phase: TriggerPhase,
): Trigger[] {
  // Infrastructure ready — Phase 5 will register relic/power triggers
  return [];
}

/**
 * Process a trigger queue sequentially. No nesting — triggers generated
 * during processing do NOT fire in this queue.
 */
export function processTriggerQueue(
  state: CombatGameState,
  triggers: Trigger[],
): CombatGameState {
  let currentState = state;

  for (const trigger of triggers) {
    const context: EffectContext = {
      playerId: trigger.playerId ?? '',
      dieResult: currentState.dieResult ?? 0,
      source: trigger.source === 'relic' ? 'relic' : 'trigger',
    };

    currentState = resolveCardEffects(currentState, trigger.effects, context);
  }

  return currentState;
}
