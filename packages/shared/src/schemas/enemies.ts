import { z } from 'zod';

// HP is either a fixed number or scales with player count (see rulebook p.11)
export const EnemyHPSchema = z.union([
  z.number().int().positive(),
  z.object({
    1: z.number().int().positive(),
    2: z.number().int().positive(),
    3: z.number().int().positive(),
    4: z.number().int().positive(),
  }),
]);
export type EnemyHP = z.infer<typeof EnemyHPSchema>;

// Phase 1: store action text only. Phase 2 adds typed effects.
export const EnemyActionPatternSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('single'),
    description: z.string(),
  }),
  z.object({
    kind: z.literal('die'),
    description: z.string(),
    // Map die result as string key ("1"-"6") to action description
    actions: z.record(z.string(), z.string()),
  }),
  z.object({
    kind: z.literal('cube'),
    description: z.string(),
    slots: z.array(z.object({
      text: z.string(),
      repeating: z.boolean(), // false = gray slot, not repeated when cube loops
    })),
  }),
]);
export type EnemyActionPattern = z.infer<typeof EnemyActionPatternSchema>;

export const EnemyCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  act: z.literal(1),
  category: z.enum(['encounter', 'elite', 'boss', 'summon', 'first_encounter']),
  hp: EnemyHPSchema,
  pattern: EnemyActionPatternSchema,
  specialAbilities: z.array(z.string()).default([]),
  summons: z.array(z.string()).default([]), // enemy IDs summoned at combat start
  rewards: z.object({
    gold: z.number().int().min(0).default(0),
    cardReward: z.boolean().default(false),
    potionReward: z.boolean().default(false),
    relicReward: z.boolean().default(false),
  }),
});
export type EnemyCard = z.infer<typeof EnemyCardSchema>;
