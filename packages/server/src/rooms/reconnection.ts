import type { WebSocket } from 'ws';
import type { Room } from './Room.js';
import type { RoomManager } from './RoomManager.js';
import type { ServerMessage } from '@slay-online/shared';

const COMBAT_LOG_LIMIT = 20;

/**
 * Handle a reconnection attempt.
 * Validates the token, restores the connection, and returns the appropriate state.
 */
export function handleReconnect(
  roomManager: RoomManager,
  roomCode: string,
  token: string,
  ws: WebSocket,
):
  | { playerId: string; message: ServerMessage }
  | { error: string } {
  const room = roomManager.getRoom(roomCode);
  if (!room) {
    return { error: 'Room not found or expired' };
  }

  // Find player by reconnection token
  let matchedPlayerId: string | null = null;
  for (const [playerId, storedToken] of room.reconnectionTokens) {
    if (storedToken === token) {
      matchedPlayerId = playerId;
      break;
    }
  }

  if (!matchedPlayerId) {
    return { error: 'Invalid reconnection token' };
  }

  // Clear any disconnect timer
  const existingTimer = room.disconnectTimers.get(matchedPlayerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    room.disconnectTimers.delete(matchedPlayerId);
  }

  // Update connection
  room.connections.set(matchedPlayerId, ws);
  room.lastActivity = Date.now();

  // Build reconnection payload
  const message = getReconnectionPayload(room, matchedPlayerId);

  return { playerId: matchedPlayerId, message };
}

/**
 * Handle a player disconnecting.
 * Preserves their slot in the lobby (they can reconnect).
 */
export function handleDisconnect(
  room: Room,
  playerId: string,
  onAutoEndTurn?: (room: Room, playerId: string) => void,
): void {
  // Remove from active connections
  room.connections.delete(playerId);
  room.lastActivity = Date.now();

  // Do NOT remove from lobby.players — they keep their slot

  // Clear any existing timer first
  const existingTimer = room.disconnectTimers.get(playerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // If game is in progress and player hasn't ended turn, start 30s timer
  if (
    room.gameState &&
    room.gameState.phase === 'PLAYER_ACTIONS'
  ) {
    const player = room.gameState.players.find((p) => p.id === playerId);
    if (player && !player.endedTurn) {
      const timer = setTimeout(() => {
        room.disconnectTimers.delete(playerId);
        // Auto-end turn for disconnected player
        if (onAutoEndTurn) {
          onAutoEndTurn(room, playerId);
        }
      }, 30_000);
      room.disconnectTimers.set(playerId, timer);
    }
  }
}

/**
 * Check if a player is currently connected.
 */
export function isPlayerConnected(room: Room, playerId: string): boolean {
  const ws = room.connections.get(playerId);
  if (!ws) return false;
  // WebSocket.OPEN = 1
  return ws.readyState === 1;
}

/**
 * Build the reconnection payload for a player.
 * Trims combat log to last N entries.
 */
export function getReconnectionPayload(
  room: Room,
  _playerId: string,
): ServerMessage {
  if (room.gameState) {
    // Send game state with trimmed combat log
    const trimmedState = {
      ...room.gameState,
      combatLog: room.gameState.combatLog.slice(-COMBAT_LOG_LIMIT),
    };
    return { type: 'STATE_UPDATE' as const, state: trimmedState };
  }

  // Still in lobby
  return { type: 'LOBBY_UPDATE' as const, lobby: room.lobby };
}
