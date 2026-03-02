import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { ClientMessageSchema } from '@slay-online/shared';
import type { ServerMessage } from '@slay-online/shared';
import { RoomManager } from './rooms/RoomManager.js';
import { handleReconnect, handleDisconnect } from './rooms/reconnection.js';
import { selectCharacter, toggleRule, startGame } from './lobby/lobbyHandlers.js';
import { initializeGame } from './lobby/gameInit.js';
import {
  handlePlayCard,
  handleEndTurn,
  handleUsePotion,
  handleChat,
  broadcastState,
  broadcastLobby,
  handleSelectNode,
  handleEventChoice,
  handleCampfireChoice,
  handleMerchantBuy,
  handleMerchantRemoveCard,
  handleMerchantLeave,
  handleRewardPickCard,
  handleRewardPickPotion,
  handleRewardPickRelic,
  handleRewardSkip,
  handlePassPotion,
  handleDiscardPotion,
} from './game/gameHandlers.js';
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
        broadcastLobby(room);
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

      case 'RECONNECT': {
        const result = handleReconnect(roomManager, msg.roomCode, msg.token, ws);
        if ('error' in result) {
          sendError(ws, 'RECONNECT_ERROR', result.error);
          break;
        }
        connectionMap.set(ws, { roomCode: msg.roomCode, playerId: result.playerId });
        send(ws, result.message);
        break;
      }

      // All remaining message types require an active room connection
      default: {
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

        handleRoomMessage(ws, room, info.playerId, msg);
      }
    }
  });

  ws.on('close', () => {
    const info = connectionMap.get(ws);
    if (info) {
      const room = roomManager.getRoom(info.roomCode);
      if (room) {
        handleDisconnect(room, info.playerId, (r, pid) => {
          // Auto-end turn callback for disconnected player after 30s
          handleEndTurn(r, pid);
        });
      }
      connectionMap.delete(ws);
    }
  });
});

// Route room-scoped messages to appropriate handlers
function handleRoomMessage(
  ws: WebSocket,
  room: Room,
  playerId: string,
  msg: { type: string; [key: string]: unknown },
): void {
  switch (msg.type) {
    case 'SELECT_CHARACTER': {
      const result = selectCharacter(room, playerId, msg.character as string);
      if ('error' in result) {
        sendError(ws, 'SELECT_ERROR', result.error);
        break;
      }
      broadcastLobby(room);
      break;
    }

    case 'TOGGLE_RULE': {
      const result = toggleRule(room, playerId, msg.rule as 'lastStand' | 'chooseYourRelic');
      if ('error' in result) {
        sendError(ws, 'TOGGLE_ERROR', result.error);
        break;
      }
      broadcastLobby(room);
      break;
    }

    case 'START_GAME': {
      const result = startGame(room, playerId);
      if ('error' in result) {
        sendError(ws, 'START_ERROR', result.error);
        break;
      }
      // Initialize game
      const gameState = initializeGame(room);
      room.gameState = gameState;
      broadcastState(room);
      break;
    }

    case 'PLAY_CARD': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handlePlayCard(room, playerId, msg.cardId as string, msg.targetIds as string[] | undefined);
      break;
    }

    case 'END_TURN': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleEndTurn(room, playerId);
      break;
    }

    case 'USE_POTION': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleUsePotion(room, playerId, msg.potionId as string, msg.targetId as string | undefined);
      break;
    }

    case 'SELECT_NODE': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleSelectNode(room, playerId, msg.nodeId as string);
      break;
    }

    case 'EVENT_CHOICE': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleEventChoice(room, playerId, msg.choiceIndex as number);
      break;
    }

    case 'CAMPFIRE_CHOICE': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleCampfireChoice(room, playerId, msg.choice as string, msg.cardId as string | undefined);
      break;
    }

    case 'MERCHANT_BUY': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleMerchantBuy(room, playerId, msg.itemType as string, msg.itemId as string);
      break;
    }

    case 'MERCHANT_REMOVE_CARD': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleMerchantRemoveCard(room, playerId, msg.cardId as string);
      break;
    }

    case 'MERCHANT_LEAVE': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleMerchantLeave(room);
      break;
    }

    case 'REWARD_PICK_CARD': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleRewardPickCard(room, playerId, msg.cardId as string);
      break;
    }

    case 'REWARD_PICK_POTION': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleRewardPickPotion(room, playerId);
      break;
    }

    case 'REWARD_PICK_RELIC': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleRewardPickRelic(room, playerId);
      break;
    }

    case 'REWARD_SKIP': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleRewardSkip(room, playerId);
      break;
    }

    case 'PASS_POTION': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handlePassPotion(room, playerId, msg.potionId as string, msg.targetPlayerId as string);
      break;
    }

    case 'DISCARD_POTION': {
      if (!room.gameState) {
        sendError(ws, 'NO_GAME', 'Game has not started');
        break;
      }
      handleDiscardPotion(room, playerId, msg.potionId as string);
      break;
    }

    case 'SEND_CHAT': {
      handleChat(room, playerId, msg.text as string);
      break;
    }

    default:
      sendError(ws, 'UNKNOWN_MESSAGE', `Unknown message type: ${msg.type}`);
  }
}

console.log(`Slay the Spire Online — server listening on port ${PORT}`);

// Export for testing
export { roomManager, wss, connectionMap, send, sendError };
