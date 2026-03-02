import { z } from 'zod';
import { PlayerStateSchema, GameStateSchema, TurnPhaseSchema } from '@slay-online/shared';
import { EnemyCombatStateSchema } from './enemyCombatState.js';
import { OrbTypeSchema } from './enemyCombatState.js';

export const StanceSchema = z.enum(['neutral', 'calm', 'wrath']);
export type Stance = z.infer<typeof StanceSchema>;

export const CombatTokensSchema = z.object({
  vulnerableTokens: z.number().int().min(0).max(3).default(0),
  weakTokens: z.number().int().min(0).max(3).default(0),
  strengthTokens: z.number().int().min(0).max(8).default(0),
  shivTokens: z.number().int().min(0).max(5).default(0),
  orbs: z.array(OrbTypeSchema).default([]),
  maxOrbSlots: z.number().int().positive().default(3),
  stance: StanceSchema.default('neutral'),
  miracleTokens: z.number().int().min(0).max(5).default(0),
  beingPlayed: z.string().nullable().default(null),
});
export type CombatTokens = z.infer<typeof CombatTokensSchema>;

export const CombatPlayerStateSchema = PlayerStateSchema.extend(
  CombatTokensSchema.shape,
);
export type CombatPlayerState = z.infer<typeof CombatPlayerStateSchema>;

export const CombatGameStateSchema = GameStateSchema.extend({
  players: z.array(CombatPlayerStateSchema),
  enemyCombatStates: z.record(z.string(), EnemyCombatStateSchema),
});
export type CombatGameState = z.infer<typeof CombatGameStateSchema>;

// Re-export for convenience
export { TurnPhaseSchema, EnemyCombatStateSchema, OrbTypeSchema };
export type { EnemyCombatState, OrbType } from './enemyCombatState.js';
