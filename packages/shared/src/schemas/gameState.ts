import { z } from 'zod';
import { CharacterSchema } from './cards.js';

export const TurnPhaseSchema = z.enum([
  'PLAYER_ACTIONS',
  'WAITING_FOR_ALL_PLAYERS',
  'ENEMY_TURN',
  'CLEANUP',
  'COMBAT_END',
]);
export type TurnPhase = z.infer<typeof TurnPhaseSchema>;

export const PlayerStateSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  character: CharacterSchema,
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  block: z.number().int().min(0).max(20),
  energy: z.number().int().min(0).max(6),
  gold: z.number().int().min(0),
  hand: z.array(z.string()),         // card IDs
  drawPile: z.array(z.string()),
  discardPile: z.array(z.string()),
  exhaustPile: z.array(z.string()),
  relics: z.array(z.string()),       // relic IDs
  potions: z.array(z.string()),      // potion IDs, max 3
  endedTurn: z.boolean(),
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const GameStateSchema = z.object({
  roomCode: z.string(),
  phase: TurnPhaseSchema,
  round: z.number().int().min(1),
  dieResult: z.number().int().min(1).max(6).nullable(),
  players: z.array(PlayerStateSchema),
  activeEnemies: z.array(z.string()), // enemy card IDs on the field
  combatLog: z.array(z.string()),
});
export type GameState = z.infer<typeof GameStateSchema>;

export const LobbyStateSchema = z.object({
  roomCode: z.string(),
  players: z.array(z.object({
    id: z.string(),
    nickname: z.string(),
    character: CharacterSchema.nullable(),
    isHost: z.boolean(),
  })),
  optionalRules: z.object({
    lastStand: z.boolean(),
    chooseYourRelic: z.boolean(),
  }),
  started: z.boolean(),
});
export type LobbyState = z.infer<typeof LobbyStateSchema>;
