import type { WebSocket } from 'ws';
import type { Room } from '../rooms/Room.js';
import type { ServerMessage } from '@slay-online/shared';
import { processAction } from './engine/index.js';
import type { Action } from './engine/index.js';
import { ActionQueue } from './actionQueue.js';

// Each room gets its own action queue
const roomQueues = new Map<string, ActionQueue>();

function getQueue(roomCode: string): ActionQueue {
  let queue = roomQueues.get(roomCode);
  if (!queue) {
    queue = new ActionQueue();
    roomQueues.set(roomCode, queue);
  }
  return queue;
}

// Helper to send a message to a WebSocket
function sendMsg(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Broadcast game state to all connected players.
 * Redacts other players' drawPile (replace with same-length array of empty strings).
 */
export function broadcastState(room: Room): void {
  if (!room.gameState) return;

  for (const [playerId, ws] of room.connections) {
    // Create per-player view with redacted draw piles
    const redactedPlayers = room.gameState.players.map((p) => {
      if (p.id === playerId) {
        return p; // Player sees their own full state
      }
      return {
        ...p,
        drawPile: p.drawPile.map(() => ''), // Redact draw pile order
      };
    });

    const redactedState = {
      ...room.gameState,
      players: redactedPlayers,
    };

    sendMsg(ws, { type: 'STATE_UPDATE', state: redactedState });
  }
}

/**
 * Broadcast lobby update to all connected players.
 */
export function broadcastLobby(room: Room): void {
  const msg: ServerMessage = { type: 'LOBBY_UPDATE', lobby: room.lobby };
  for (const ws of room.connections.values()) {
    sendMsg(ws, msg);
  }
}

/**
 * Handle PLAY_CARD message.
 * Routes through action queue for serialized processing.
 */
export function handlePlayCard(
  room: Room,
  playerId: string,
  cardId: string,
  targetIds?: string[],
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;

    const action: Action = {
      type: 'PLAY_CARD',
      playerId,
      cardId,
      targetId: targetIds?.[0],
    };

    room.gameState = processAction(room.gameState, action);
    broadcastState(room);
  });
}

/**
 * Handle END_TURN message.
 * Routes through action queue for serialized processing.
 */
export function handleEndTurn(room: Room, playerId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;

    const action: Action = {
      type: 'END_TURN',
      playerId,
    };

    room.gameState = processAction(room.gameState, action);

    // Clear any disconnect timer for this player
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    broadcastState(room);
  });
}

/**
 * Handle SEND_CHAT message.
 * Broadcasts to all connected players without affecting game state.
 */
export function handleChat(room: Room, playerId: string, text: string): void {
  const msg: ServerMessage = {
    type: 'CHAT_MESSAGE',
    playerId,
    text,
  };
  for (const ws of room.connections.values()) {
    sendMsg(ws, msg);
  }
}

/**
 * Clean up room queue when room is destroyed.
 */
export function cleanupRoomQueue(roomCode: string): void {
  roomQueues.delete(roomCode);
}
