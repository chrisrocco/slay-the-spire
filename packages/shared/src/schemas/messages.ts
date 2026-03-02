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
