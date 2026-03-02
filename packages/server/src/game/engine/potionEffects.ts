import type { CombatGameState } from '../state/combatState.js';
import type { CardEffect } from './effects/types.js';

/**
 * Definition for how a potion resolves its effects.
 */
export type PotionEffectDef = {
  effects:
    | CardEffect[]
    | ((state: CombatGameState, playerId: string, targetId?: string) => CardEffect[]);
  /** Whether this potion requires a target enemy */
  needsTarget?: boolean;
};

/**
 * Registry of all potion IDs mapped to their effect resolution.
 * Potions that are too complex for the current effect system (or require
 * non-combat resolution) use Unimplemented effects.
 */
export const POTION_EFFECTS: Record<string, PotionEffectDef> = {
  fire_potion: {
    needsTarget: true,
    effects: [{ kind: 'DealDamage', hits: 1, amount: 20, target: 'chosen' }],
  },

  block_potion: {
    effects: [{ kind: 'GainBlock', amount: 12, target: 'self' }],
  },

  dexterity_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 2 Dexterity (not in effect system)' }],
  },

  energy_potion: {
    effects: [{ kind: 'GainEnergy', amount: 2 }],
  },

  explosive_potion: {
    effects: [{ kind: 'DealDamage', hits: 1, amount: 10, target: 'all' }],
  },

  fear_potion: {
    needsTarget: true,
    effects: [{ kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'chosen' }],
  },

  strength_potion: {
    effects: [{ kind: 'ApplyStatus', status: 'strength', amount: 2, target: 'self' }],
  },

  swift_potion: {
    effects: [{ kind: 'DrawCards', count: 3 }],
  },

  weak_potion: {
    needsTarget: true,
    effects: [{ kind: 'ApplyStatus', status: 'weak', amount: 3, target: 'chosen' }],
  },

  blood_potion: {
    effects: (state, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player) return [];
      const healAmount = Math.floor(player.maxHp * 0.2);
      return [{ kind: 'HealHp', amount: healAmount, target: 'self' }];
    },
  },

  entropic_brew: {
    effects: [{ kind: 'Unimplemented', description: 'Fill empty potion slots with random potions' }],
  },

  fairy_in_a_bottle: {
    // Fairy in a Bottle is an ON_DEATH auto-trigger, not manually used
    // If somehow manually used, it's a no-op (it only fires on death)
    effects: [{ kind: 'Unimplemented', description: 'Fairy in a Bottle (auto-trigger only)' }],
  },

  fruit_juice: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 1 Max HP (non-combat effect)' }],
  },

  gamblers_brew: {
    effects: [{ kind: 'Unimplemented', description: "Gambler's Brew: discard and redraw" }],
  },

  liquid_bronze: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 3 Thorns (not in effect system)' }],
  },

  liquid_memories: {
    effects: [{ kind: 'Unimplemented', description: 'Return card from discard to hand at 0 cost' }],
  },

  poison_potion: {
    needsTarget: true,
    effects: [{ kind: 'ApplyStatus', status: 'poison', amount: 6, target: 'chosen' }],
  },

  regen_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 5 Regeneration (not in effect system)' }],
  },

  skill_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Next Skill played twice (not in effect system)' }],
  },

  attack_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Next Attack played twice (not in effect system)' }],
  },

  power_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Next Power played twice (not in effect system)' }],
  },

  colorless_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Choose 1 of 3 random colorless cards to add to hand' }],
  },

  cultist_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 1 Ritual (not in effect system)' }],
  },

  distilled_chaos: {
    effects: [{ kind: 'Unimplemented', description: 'Play top 3 cards of draw pile' }],
  },

  duplication_potion: {
    effects: [{ kind: 'Unimplemented', description: 'Next card played twice (not in effect system)' }],
  },

  essence_of_steel: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 4 Plated Armor (not in effect system)' }],
  },

  heart_of_iron: {
    effects: [{ kind: 'Unimplemented', description: 'Gain 6 Metallicize (not in effect system)' }],
  },

  smoke_bomb: {
    effects: [{ kind: 'Unimplemented', description: 'Escape from non-boss combat (not in effect system)' }],
  },

  snecko_oil: {
    effects: [
      { kind: 'DrawCards', count: 5 },
      { kind: 'Unimplemented', description: 'Randomize card costs in hand for rest of combat' },
    ],
  },
};
