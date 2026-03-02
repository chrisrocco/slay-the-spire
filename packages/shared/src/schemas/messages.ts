import { z } from 'zod';
import { GameStateSchema, LobbyStateSchema } from './gameState.js';

// Client -> Server intent messages (players send intents only; server resolves all logic)
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CREATE_ROOM'), nickname: z.string() }),
  z.object({ type: z.literal('JOIN_LOBBY'), roomCode: z.string(), nickname: z.string() }),
  z.object({ type: z.literal('SELECT_CHARACTER'), character: z.string() }),
  z.object({ type: z.literal('TOGGLE_RULE'), rule: z.enum(['lastStand', 'chooseYourRelic']) }),
  z.object({ type: z.literal('START_GAME') }),
  z.object({ type: z.literal('PLAY_CARD'), cardId: z.string(), targetIds: z.array(z.string()).optional() }),
  z.object({ type: z.literal('END_TURN') }),
  z.object({ type: z.literal('USE_POTION'), potionId: z.string(), targetId: z.string().optional() }),
  z.object({ type: z.literal('SEND_CHAT'), text: z.string().max(500) }),
  z.object({ type: z.literal('RECONNECT'), roomCode: z.string(), token: z.string() }),

  // Map navigation
  z.object({ type: z.literal('SELECT_NODE'), nodeId: z.string() }),

  // Event room
  z.object({ type: z.literal('EVENT_CHOICE'), choiceIndex: z.number().int().min(0) }),

  // Campfire
  z.object({ type: z.literal('CAMPFIRE_CHOICE'), choice: z.enum(['rest', 'smith', 'dig', 'lift', 'toke']), cardId: z.string().optional() }),

  // Merchant
  z.object({ type: z.literal('MERCHANT_BUY'), itemType: z.enum(['card', 'relic', 'potion']), itemId: z.string() }),
  z.object({ type: z.literal('MERCHANT_REMOVE_CARD'), cardId: z.string() }),
  z.object({ type: z.literal('MERCHANT_LEAVE') }),

  // Rewards
  z.object({ type: z.literal('REWARD_PICK_CARD'), cardId: z.string() }),
  z.object({ type: z.literal('REWARD_PICK_POTION') }),
  z.object({ type: z.literal('REWARD_PICK_RELIC') }),
  z.object({ type: z.literal('REWARD_SKIP') }),

  // Potion management
  z.object({ type: z.literal('PASS_POTION'), potionId: z.string(), targetPlayerId: z.string() }),
  z.object({ type: z.literal('DISCARD_POTION'), potionId: z.string() }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client messages
export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ROOM_CREATED'), roomCode: z.string(), playerId: z.string(), reconnectionToken: z.string() }),
  z.object({ type: z.literal('JOINED'), playerId: z.string(), reconnectionToken: z.string() }),
  z.object({ type: z.literal('STATE_UPDATE'), state: GameStateSchema }),
  z.object({ type: z.literal('LOBBY_UPDATE'), lobby: LobbyStateSchema }),
  z.object({ type: z.literal('ERROR'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('CHAT_MESSAGE'), playerId: z.string(), text: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
