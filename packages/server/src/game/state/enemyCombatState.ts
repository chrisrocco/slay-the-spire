import { z } from 'zod';

export const OrbTypeSchema = z.enum(['lightning', 'frost', 'dark']);
export type OrbType = z.infer<typeof OrbTypeSchema>;

export const EnemyCombatStateSchema = z.object({
  id: z.string(),
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  block: z.number().int().min(0),
  row: z.number().int().min(0),
  isDead: z.boolean(),
  vulnerableTokens: z.number().int().min(0).max(3),
  weakTokens: z.number().int().min(0).max(3),
  strengthTokens: z.number().int().min(0).max(8),
  poisonTokens: z.number().int().min(0),
  cubePosition: z.number().int().min(0),
});
export type EnemyCombatState = z.infer<typeof EnemyCombatStateSchema>;
