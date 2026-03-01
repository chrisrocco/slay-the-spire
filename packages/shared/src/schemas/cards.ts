import { z } from 'zod';

export const CharacterSchema = z.enum(['ironclad', 'silent', 'defect', 'watcher']);
export type Character = z.infer<typeof CharacterSchema>;

export const CardTypeSchema = z.enum(['Attack', 'Skill', 'Power', 'Curse', 'Status', 'Daze']);
export type CardType = z.infer<typeof CardTypeSchema>;

export const RaritySchema = z.enum(['starter', 'common', 'uncommon', 'rare', 'colorless', 'special']);
export type Rarity = z.infer<typeof RaritySchema>;

export const PlayerCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  character: CharacterSchema.or(z.literal('colorless')),
  rarity: RaritySchema,
  type: CardTypeSchema,
  cost: z.number().int().min(0).max(6).or(z.literal('X')).or(z.literal('unplayable')),
  text: z.string(),
  upgraded: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
  // Effects typed in Phase 2 — Phase 1 stores raw text only
  exhaust: z.boolean().optional(),
  ethereal: z.boolean().optional(),
  retain: z.boolean().optional(),
  innate: z.boolean().optional(),
});
export type PlayerCard = z.infer<typeof PlayerCardSchema>;

export const CurseCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('Curse'),
  cost: z.literal('unplayable'),
  text: z.string(),
});
export type CurseCard = z.infer<typeof CurseCardSchema>;

export const StatusCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('Status'),
  variant: z.enum(['wound', 'slimed']),
  cost: z.literal('unplayable'),
  text: z.string(),
});
export type StatusCard = z.infer<typeof StatusCardSchema>;

export const DazeCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('Daze'),
  cost: z.literal('unplayable'),
  text: z.string(),
});
export type DazeCard = z.infer<typeof DazeCardSchema>;
