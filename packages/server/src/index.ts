import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { ClientMessageSchema } from '@slay-online/shared';
import type { ServerMessage } from '@slay-online/shared';
import { RoomManager } from './rooms/RoomManager.js';
import type { Room } from './rooms/Room.js';

const PORT = parseInt(process.env.PORT || '8080', 10);

// Connection tracking: which room/player a WebSocket belongs to
interface ConnectionInfo {
  roomCode: string;
  playerId: string;
}

const roomManager = new RoomManager();
const connectionMap = new Map<WebSocket, ConnectionInfo>();

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

// Ping/pong heartbeat to detect dead connections
const HEARTBEAT_INTERVAL = 30_000;
const aliveSet = new WeakSet<WebSocket>();

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!aliveSet.has(ws)) {
      ws.terminate();
      continue;
    }
    aliveSet.delete(ws);
    ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeat);
  roomManager.destroy();
});

// Helper to send a server message
function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// Helper to send an error
function sendError(ws: WebSocket, code: string, message: string): void {
  send(ws, { type: 'ERROR', code, message });
}

// Broadcast lobby update to all connections in a room
function broadcastLobby(room: Room): void {
  const msg: ServerMessage = { type: 'LOBBY_UPDATE', lobby: room.lobby };
  for (const ws of room.connections.values()) {
    send(ws, msg);
  }
}

// Handle incoming connections
wss.on('connection', (ws: WebSocket) => {
  aliveSet.add(ws);
  ws.on('pong', () => aliveSet.add(ws));

  ws.on('message', (data: Buffer) => {
    let msg;
    try {
      const parsed = JSON.parse(data.toString());
      const result = ClientMessageSchema.safeParse(parsed);
      if (!result.success) {
        sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
        return;
      }
      msg = result.data;
    } catch {
      sendError(ws, 'INVALID_MESSAGE', 'Could not parse message as JSON');
      return;
    }

    switch (msg.type) {
      case 'CREATE_ROOM': {
        const result = roomManager.createRoom(msg.nickname);
        if ('error' in result) {
          sendError(ws, 'CREATE_ERROR', result.error);
          break;
        }
        const { room, playerId } = result;
        const token = randomUUID();
        room.reconnectionTokens.set(playerId, token);
        room.connections.set(playerId, ws);
        connectionMap.set(ws, { roomCode: room.code, playerId });
        send(ws, { type: 'ROOM_CREATED', roomCode: room.code, playerId, reconnectionToken: token });
        break;
      }

      case 'JOIN_LOBBY': {
        const result = roomManager.joinRoom(msg.roomCode, msg.nickname);
        if ('error' in result) {
          sendError(ws, 'JOIN_ERROR', result.error);
          break;
        }
        const { room, playerId } = result;
        const token = randomUUID();
        room.reconnectionTokens.set(playerId, token);
        room.connections.set(playerId, ws);
        connectionMap.set(ws, { roomCode: room.code, playerId });
        send(ws, { type: 'JOINED', playerId, reconnectionToken: token });
        broadcastLobby(room);
        break;
      }

      case 'SELECT_CHARACTER':
      case 'TOGGLE_RULE':
      case 'START_GAME':
      case 'PLAY_CARD':
      case 'END_TURN':
      case 'USE_POTION':
      case 'SEND_CHAT': {
        // These require an active connection mapping
        const info = connectionMap.get(ws);
        if (!info) {
          sendError(ws, 'NOT_IN_ROOM', 'You must create or join a room first');
          break;
        }
        const room = roomManager.getRoom(info.roomCode);
        if (!room) {
          sendError(ws, 'ROOM_NOT_FOUND', 'Room no longer exists');
          break;
        }
        // Handlers for these will be wired in Plans 02-05
        // For now, acknowledge receipt
        handleRoomMessage(ws, room, info.playerId, msg);
        break;
      }

      case 'RECONNECT': {
        // Will be implemented in Plan 04
        sendError(ws, 'NOT_IMPLEMENTED', 'Reconnection not yet implemented');
        break;
      }
    }
  });

  ws.on('close', () => {
    const info = connectionMap.get(ws);
    if (info) {
      const room = roomManager.getRoom(info.roomCode);
      if (room) {
        room.connections.delete(info.playerId);
        room.lastActivity = Date.now();
        // Disconnect handling will be enhanced in Plan 04
      }
      connectionMap.delete(ws);
    }
  });
});

// Stub handler for room-scoped messages — will be filled in by Plans 02-05
function handleRoomMessage(
  ws: WebSocket,
  _room: Room,
  _playerId: string,
  msg: { type: string },
): void {
  // Placeholder — Plans 02-05 will implement real handlers
  sendError(ws, 'NOT_IMPLEMENTED', `${msg.type} handler not yet implemented`);
}

console.log(`Slay the Spire Online — server listening on port ${PORT}`);

// Export for testing
export { roomManager, wss, connectionMap, send, sendError, broadcastLobby };
