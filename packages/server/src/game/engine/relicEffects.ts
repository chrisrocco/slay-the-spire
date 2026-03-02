import type { CombatGameState } from '../state/combatState.js';
import type { CardEffect } from './effects/types.js';
import type { TriggerPhase } from './triggers.js';

/**
 * Definition for a relic's trigger-based effect.
 * Relics that are passive modifiers (not trigger-based) are handled inline
 * in the relevant game systems (potion limit, merchant cost, etc.).
 */
export type RelicTriggerDef = {
  trigger: TriggerPhase;
  effects: CardEffect[] | ((state: CombatGameState, playerId: string) => CardEffect[]);
  /** For one-time relics like Lizard Tail — checked against a state marker */
  oneTime?: boolean;
  /** Conditional trigger — relic only fires if this returns true */
  condition?: (state: CombatGameState, playerId: string) => boolean;
};

/**
 * Registry of all relic IDs that have trigger-based effects.
 * Passive relics (Potion Belt, Smiling Mask, etc.) are NOT here.
 */
export const RELIC_TRIGGERS: Record<string, RelicTriggerDef> = {
  // ===== START_OF_COMBAT relics =====

  anchor: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'GainBlock', amount: 10, target: 'self' }],
  },

  bag_of_marbles: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'all_enemies' }],
  },

  bag_of_preparation: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'DrawCards', count: 2 }],
  },

  blood_vial: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'HealHp', amount: 2, target: 'self' }],
  },

  cracked_core: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'Channel', orbType: 'lightning', count: 1 }],
  },

  lantern: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  pure_water: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'GainMiracle', count: 1 }],
  },

  ring_of_the_snake: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'DrawCards', count: 2 }],
  },

  ring_of_the_serpent: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'DrawCards', count: 1 }],
  },

  vajra: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'ApplyStatus', status: 'strength', amount: 1, target: 'self' }],
  },

  holy_water: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'GainMiracle', count: 3 }],
  },

  pantograph: {
    trigger: 'START_OF_COMBAT',
    effects: [{ kind: 'HealHp', amount: 25, target: 'self' }],
    // Note: Pantograph only triggers at boss combat start — would need combat type context
    // For now implementing unconditionally, can be refined when boss detection is added
  },

  // ===== START_OF_TURN relics =====

  mercury_hourglass: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'DealDamage', hits: 1, amount: 3, target: 'all' }],
  },

  happy_flower: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
    // Note: Happy Flower only fires every 3rd turn — needs turn counter tracking
    // Implemented as conditional based on round number
    condition: (state, _playerId) => state.round % 3 === 0,
  },

  horn_cleat: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainBlock', amount: 14, target: 'self' }],
    condition: (state, _playerId) => state.round === 2,
  },

  busted_crown: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  coffee_dripper: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  cursed_key: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  ectoplasm: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  fusion_hammer: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  mark_of_pain: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  runic_dome: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  slavers_collar: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
    // Note: Only during Boss/Elite combats — needs combat type context for full accuracy
  },

  philosophers_stone: {
    trigger: 'START_OF_TURN',
    effects: [{ kind: 'GainEnergy', amount: 1 }],
  },

  // ===== END_OF_TURN relics =====

  orichalcum: {
    trigger: 'END_OF_TURN',
    effects: [{ kind: 'GainBlock', amount: 6, target: 'self' }],
    condition: (state, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      return player ? player.block === 0 : false;
    },
  },

  // ===== END_OF_COMBAT relics =====

  burning_blood: {
    trigger: 'END_OF_COMBAT',
    effects: [{ kind: 'HealHp', amount: 6, target: 'self' }],
  },

  black_blood: {
    trigger: 'END_OF_COMBAT',
    effects: [{ kind: 'HealHp', amount: 12, target: 'self' }],
  },

  meat_on_the_bone: {
    trigger: 'END_OF_COMBAT',
    effects: [{ kind: 'HealHp', amount: 3, target: 'self' }],
    condition: (state, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      return player ? player.hp <= player.maxHp * 0.5 : false;
    },
  },

  // ===== ON_DEATH relics =====

  lizard_tail: {
    trigger: 'ON_DEATH',
    effects: (state, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player) return [];
      // Heal to 50% max HP — computed as a heal effect
      const healAmount = Math.floor(player.maxHp * 0.5) - player.hp;
      if (healAmount <= 0) return [];
      return [{ kind: 'HealHp', amount: healAmount, target: 'self' }];
    },
    oneTime: true,
  },
};

/**
 * Potion-based ON_DEATH triggers (potions that auto-fire on death).
 * Key: potion ID, Value: trigger definition.
 * These are checked separately from relic triggers in the ON_DEATH flow.
 */
export type PotionTriggerDef = {
  trigger: 'ON_DEATH';
  effects: CardEffect[] | ((state: CombatGameState, playerId: string) => CardEffect[]);
};

export const POTION_TRIGGERS: Record<string, PotionTriggerDef> = {
  fairy_in_a_bottle: {
    trigger: 'ON_DEATH',
    effects: (state, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player) return [];
      // Heal to 30% max HP
      const healAmount = Math.floor(player.maxHp * 0.3) - player.hp;
      if (healAmount <= 0) return [];
      return [{ kind: 'HealHp', amount: healAmount, target: 'self' }];
    },
  },
};
