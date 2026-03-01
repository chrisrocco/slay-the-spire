import { z } from 'zod';
import { GameStateSchema, LobbyStateSchema } from './gameState.js';

// Client -> Server intent messages (players send intents only; server resolves all logic)
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PLAY_CARD'), cardId: z.string(), targetIds: z.array(z.string()).optional() }),
  z.object({ type: z.literal('END_TURN') }),
  z.object({ type: z.literal('USE_POTION'), potionId: z.string(), targetId: z.string().optional() }),
  z.object({ type: z.literal('SEND_CHAT'), text: z.string().max(500) }),
  z.object({ type: z.literal('JOIN_LOBBY'), roomCode: z.string(), nickname: z.string() }),
  z.object({ type: z.literal('SELECT_CHARACTER'), character: z.string() }),
  z.object({ type: z.literal('START_GAME') }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client messages
export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('STATE_UPDATE'), state: GameStateSchema }),
  z.object({ type: z.literal('LOBBY_UPDATE'), lobby: LobbyStateSchema }),
  z.object({ type: z.literal('ERROR'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('CHAT_MESSAGE'), playerId: z.string(), text: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
