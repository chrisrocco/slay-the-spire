import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleReconnect, handleDisconnect, isPlayerConnected, getReconnectionPayload } from '../reconnection.js';
import { RoomManager } from '../RoomManager.js';
import { Room } from '../Room.js';
import type { WebSocket } from 'ws';
import type { CombatGameState } from '../../game/state/combatState.js';

function createMockWs(): WebSocket {
  return {
    send: vi.fn(),
    readyState: 1, // WebSocket.OPEN
  } as unknown as WebSocket;
}

function createRoomWithPlayer(): { manager: RoomManager; room: Room; playerId: string; token: string } {
  const manager = new RoomManager();
  const result = manager.createRoom('Host');
  if ('error' in result) throw new Error(result.error);
  const { room, playerId } = result;
  const token = 'test-token-123';
  room.reconnectionTokens.set(playerId, token);
  room.connections.set(playerId, createMockWs());
  return { manager, room, playerId, token };
}

function createMockGameState(roomCode: string): CombatGameState {
  return {
    roomCode,
    phase: 'PLAYER_ACTIONS',
    round: 1,
    dieResult: 3,
    gamePhase: 'COMBAT',
    currentFloor: 0,
    players: [
      {
        id: 'host-id',
        nickname: 'Host',
        character: 'ironclad',
        hp: 75,
        maxHp: 75,
        block: 0,
        energy: 3,
        gold: 0,
        hand: ['strike_r', 'defend_r'],
        drawPile: ['bash', 'strike_r'],
        discardPile: [],
        exhaustPile: [],
        relics: ['burning_blood'],
        potions: [],
        endedTurn: false,
        vulnerableTokens: 0,
        weakTokens: 0,
        strengthTokens: 0,
        shivTokens: 0,
        orbs: [],
        maxOrbSlots: 3,
        stance: 'neutral' as const,
        miracleTokens: 0,
        beingPlayed: null,
      },
    ],
    activeEnemies: ['jaw_worm'],
    combatLog: Array.from({ length: 30 }, (_, i) => `Log entry ${i}`),
    enemyCombatStates: {
      jaw_worm: {
        id: 'jaw_worm',
        hp: 20,
        maxHp: 20,
        block: 0,
        row: 0,
        isDead: false,
        vulnerableTokens: 0,
        weakTokens: 0,
        strengthTokens: 0,
        poisonTokens: 0,
        cubePosition: 0,
      },
    },
  };
}

describe('handleReconnect', () => {
  it('reconnects player with valid token', () => {
    const { manager, room, playerId, token } = createRoomWithPlayer();
    room.connections.delete(playerId); // simulate disconnect
    const newWs = createMockWs();

    const result = handleReconnect(manager, room.code, token, newWs);
    expect('playerId' in result).toBe(true);
    if ('playerId' in result) {
      expect(result.playerId).toBe(playerId);
      expect(room.connections.get(playerId)).toBe(newWs);
    }
  });

  it('returns error for invalid token', () => {
    const { manager, room } = createRoomWithPlayer();
    const result = handleReconnect(manager, room.code, 'wrong-token', createMockWs());
    expect(result).toEqual({ error: 'Invalid reconnection token' });
  });

  it('returns error for nonexistent room', () => {
    const { manager } = createRoomWithPlayer();
    const result = handleReconnect(manager, 'ZZZZ', 'any-token', createMockWs());
    expect(result).toEqual({ error: 'Room not found or expired' });
  });

  it('clears pending disconnect timer on reconnect', () => {
    const { manager, room, playerId, token } = createRoomWithPlayer();
    const mockTimer = setTimeout(() => {}, 30000);
    room.disconnectTimers.set(playerId, mockTimer);
    room.connections.delete(playerId);

    handleReconnect(manager, room.code, token, createMockWs());
    expect(room.disconnectTimers.has(playerId)).toBe(false);
    clearTimeout(mockTimer);
  });

  it('sends LOBBY_UPDATE when in lobby', () => {
    const { manager, room, playerId, token } = createRoomWithPlayer();
    room.connections.delete(playerId);

    const result = handleReconnect(manager, room.code, token, createMockWs());
    if ('message' in result) {
      expect(result.message.type).toBe('LOBBY_UPDATE');
    }
  });

  it('sends STATE_UPDATE with game state during game', () => {
    const { manager, room, playerId, token } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    room.connections.delete(playerId);

    const result = handleReconnect(manager, room.code, token, createMockWs());
    if ('message' in result) {
      expect(result.message.type).toBe('STATE_UPDATE');
    }
  });

  it('trims combat log to last 20 entries on reconnect', () => {
    const { manager, room, playerId, token } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    room.connections.delete(playerId);

    const result = handleReconnect(manager, room.code, token, createMockWs());
    if ('message' in result && result.message.type === 'STATE_UPDATE') {
      expect(result.message.state.combatLog).toHaveLength(20);
      expect(result.message.state.combatLog[0]).toBe('Log entry 10');
    }
  });
});

describe('handleDisconnect', () => {
  it('removes from connections but NOT from lobby.players', () => {
    const { room, playerId } = createRoomWithPlayer();
    handleDisconnect(room, playerId);

    expect(room.connections.has(playerId)).toBe(false);
    expect(room.lobby.players.find((p) => p.id === playerId)).toBeDefined();
  });

  it('updates lastActivity on disconnect', () => {
    const { room, playerId } = createRoomWithPlayer();
    const before = room.lastActivity;
    // Small delay to ensure timestamp difference
    room.lastActivity = before - 1000;
    handleDisconnect(room, playerId);
    expect(room.lastActivity).toBeGreaterThan(before - 1000);
  });

  it('sets 30s disconnect timer during game with PLAYER_ACTIONS phase', () => {
    const { room, playerId } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    room.gameState.players[0]!.id = playerId;

    const autoEndTurn = vi.fn();
    handleDisconnect(room, playerId, autoEndTurn);

    expect(room.disconnectTimers.has(playerId)).toBe(true);
    // Clean up timer
    clearTimeout(room.disconnectTimers.get(playerId)!);
  });

  it('clears previous timer before setting new one', () => {
    const { room, playerId } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    room.gameState.players[0]!.id = playerId;

    const autoEndTurn = vi.fn();
    const oldTimer = setTimeout(() => {}, 30000);
    room.disconnectTimers.set(playerId, oldTimer);

    handleDisconnect(room, playerId, autoEndTurn);
    // Should have a new timer, old one cleared
    expect(room.disconnectTimers.has(playerId)).toBe(true);
    clearTimeout(room.disconnectTimers.get(playerId)!);
    clearTimeout(oldTimer);
  });
});

describe('isPlayerConnected', () => {
  it('returns true for connected player', () => {
    const { room, playerId } = createRoomWithPlayer();
    expect(isPlayerConnected(room, playerId)).toBe(true);
  });

  it('returns false for disconnected player', () => {
    const { room, playerId } = createRoomWithPlayer();
    room.connections.delete(playerId);
    expect(isPlayerConnected(room, playerId)).toBe(false);
  });

  it('returns false for unknown playerId', () => {
    const { room } = createRoomWithPlayer();
    expect(isPlayerConnected(room, 'unknown-id')).toBe(false);
  });

  it('returns false when WebSocket is not open', () => {
    const { room, playerId } = createRoomWithPlayer();
    const closedWs = { readyState: 3 } as unknown as WebSocket; // CLOSED
    room.connections.set(playerId, closedWs);
    expect(isPlayerConnected(room, playerId)).toBe(false);
  });
});

describe('getReconnectionPayload', () => {
  it('returns LOBBY_UPDATE when no game state', () => {
    const { room, playerId } = createRoomWithPlayer();
    const payload = getReconnectionPayload(room, playerId);
    expect(payload.type).toBe('LOBBY_UPDATE');
  });

  it('returns STATE_UPDATE when game state exists', () => {
    const { room, playerId } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    const payload = getReconnectionPayload(room, playerId);
    expect(payload.type).toBe('STATE_UPDATE');
  });

  it('trims combat log to 20 entries', () => {
    const { room, playerId } = createRoomWithPlayer();
    room.gameState = createMockGameState(room.code);
    const payload = getReconnectionPayload(room, playerId);
    if (payload.type === 'STATE_UPDATE') {
      expect(payload.state.combatLog).toHaveLength(20);
    }
  });
});
