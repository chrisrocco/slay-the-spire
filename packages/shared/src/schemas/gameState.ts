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

// ---------------------------------------------------------------------------
// Game phase (top-level game loop phase)
// ---------------------------------------------------------------------------

export const GamePhaseSchema = z.enum([
  'MAP',
  'EVENT',
  'CAMPFIRE',
  'TREASURE',
  'MERCHANT',
  'COMBAT',
  'REWARDS',
  'BOSS_REWARD',
]);
export type GamePhase = z.infer<typeof GamePhaseSchema>;

// ---------------------------------------------------------------------------
// Map schemas (mirror mapGenerator.ts interfaces)
// ---------------------------------------------------------------------------

export const RoomTypeSchema = z.enum([
  'encounter',
  'elite',
  'event',
  'campfire',
  'treasure',
  'merchant',
  'boss',
]);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const MapNodeSchema = z.object({
  id: z.string(),
  floor: z.number(),
  type: RoomTypeSchema,
  connections: z.array(z.string()),
});
export type MapNode = z.infer<typeof MapNodeSchema>;

export const GameMapSchema = z.object({
  nodes: z.array(MapNodeSchema),
  bossNodeId: z.string(),
  currentNodeId: z.string().nullable(),
});
export type GameMap = z.infer<typeof GameMapSchema>;

// ---------------------------------------------------------------------------
// Reward state schema
// ---------------------------------------------------------------------------

export const CardRewardSchema = z.object({
  cardIds: z.array(z.string()),
  upgraded: z.boolean().default(false),
});
export type CardReward = z.infer<typeof CardRewardSchema>;

export const RewardStateSchema = z.object({
  gold: z.number().int().min(0).default(0),
  cardRewards: z.array(CardRewardSchema).default([]),    // one per player
  potionReward: z.string().nullable().default(null),     // potion ID or null
  relicReward: z.string().nullable().default(null),      // relic ID or null
  playerChoices: z.record(
    z.string(),
    z.object({
      cardPicked: z.string().nullable().default(null),
      potionPicked: z.boolean().default(false),
      relicPicked: z.boolean().default(false),
      skipped: z.boolean().default(false),
    }),
  ).default({}),
});
export type RewardState = z.infer<typeof RewardStateSchema>;

// ---------------------------------------------------------------------------
// Event state schema
// ---------------------------------------------------------------------------

export const EventStateSchema = z.object({
  eventId: z.string(),
  playerChoices: z.record(
    z.string(),
    z.number().nullable(),
  ).default({}),  // playerId -> choice index or null
});
export type EventState = z.infer<typeof EventStateSchema>;

// ---------------------------------------------------------------------------
// Merchant state schema
// ---------------------------------------------------------------------------

export const MerchantStateSchema = z.object({
  cardPool: z.array(z.object({ cardId: z.string(), price: z.number() })),
  relicPool: z.array(z.object({ relicId: z.string(), price: z.number() })),
  potionPool: z.array(z.object({ potionId: z.string(), price: z.number() })),
  removeCost: z.number().int().default(50),
  playersRemoved: z.array(z.string()).default([]),  // playerIds who already removed
});
export type MerchantState = z.infer<typeof MerchantStateSchema>;

// ---------------------------------------------------------------------------
// Campfire state schema
// ---------------------------------------------------------------------------

export const CampfireChoiceSchema = z.object({
  playerChoices: z.record(
    z.string(),
    z.enum(['rest', 'smith', 'dig', 'lift', 'toke']).nullable(),
  ).default({}),
});
export type CampfireChoice = z.infer<typeof CampfireChoiceSchema>;

// ---------------------------------------------------------------------------
// GameState (extended with optional game flow fields)
// ---------------------------------------------------------------------------

export const GameStateSchema = z.object({
  roomCode: z.string(),
  phase: TurnPhaseSchema,
  round: z.number().int().min(1),
  dieResult: z.number().int().min(1).max(6).nullable(),
  players: z.array(PlayerStateSchema),
  activeEnemies: z.array(z.string()), // enemy card IDs on the field
  combatLog: z.array(z.string()),
  // Game flow fields (optional for backward compatibility)
  gamePhase: GamePhaseSchema.default('COMBAT'),
  currentFloor: z.number().int().min(0).default(0),
  map: GameMapSchema.optional(),
  eventState: EventStateSchema.optional(),
  rewardState: RewardStateSchema.optional(),
  merchantState: MerchantStateSchema.optional(),
  campfireState: CampfireChoiceSchema.optional(),
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
