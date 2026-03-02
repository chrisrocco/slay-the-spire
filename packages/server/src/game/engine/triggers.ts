import type { CombatGameState } from '../state/combatState.js';
import type { CardEffect, EffectContext } from './effects/types.js';
import { resolveCardEffects } from './effects/resolve.js';
import { RELIC_TRIGGERS, POTION_TRIGGERS } from './relicEffects.js';

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
 * Iterates all players, checks their relics against the RELIC_TRIGGERS registry.
 * Returns triggers in player order, and within each player in relic order.
 */
export function collectTriggers(
  state: CombatGameState,
  phase: TriggerPhase,
): Trigger[] {
  const triggers: Trigger[] = [];

  for (const player of state.players) {
    for (const relicId of player.relics) {
      const def = RELIC_TRIGGERS[relicId];
      if (!def) continue;
      if (def.trigger !== phase) continue;

      // Evaluate condition (if any)
      if (def.condition && !def.condition(state, player.id)) continue;

      // Resolve effects (may be a static array or a function)
      const effects: CardEffect[] =
        typeof def.effects === 'function'
          ? def.effects(state, player.id)
          : def.effects;

      if (effects.length === 0) continue;

      triggers.push({
        phase,
        playerId: player.id,
        source: 'relic',
        sourceId: relicId,
        effects,
      });
    }

    // For ON_DEATH phase, also check potions (e.g., Fairy in a Bottle)
    if (phase === 'ON_DEATH') {
      for (const potionId of player.potions) {
        const potionDef = POTION_TRIGGERS[potionId];
        if (!potionDef) continue;

        const effects: CardEffect[] =
          typeof potionDef.effects === 'function'
            ? potionDef.effects(state, player.id)
            : potionDef.effects;

        if (effects.length === 0) continue;

        triggers.push({
          phase,
          playerId: player.id,
          source: 'relic',
          sourceId: potionId,
          effects,
        });
      }
    }
  }

  return triggers;
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
