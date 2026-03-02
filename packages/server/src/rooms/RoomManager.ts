import { randomUUID } from 'node:crypto';
import { Room } from './Room.js';
import { generateRoomCode } from './roomCodes.js';
import type { WebSocket } from 'ws';

const MAX_PLAYERS = 4;
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Nickname validation: 1-16 chars, alphanumeric + spaces, trimmed
const NICKNAME_REGEX = /^[a-zA-Z0-9 ]{1,16}$/;

export class RoomManager {
  rooms: Map<string, Room> = new Map();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanupExpiredRooms(), CLEANUP_INTERVAL_MS);
  }

  /**
   * Create a new room. The creator becomes the host.
   */
  createRoom(nickname: string): { room: Room; playerId: string } | { error: string } {
    const trimmed = nickname.trim();
    if (!trimmed || !NICKNAME_REGEX.test(trimmed)) {
      return { error: 'Invalid nickname: must be 1-16 alphanumeric characters' };
    }

    const existingCodes = new Set(this.rooms.keys());
    const code = generateRoomCode(existingCodes);
    const playerId = randomUUID();
    const room = new Room(code, playerId, trimmed);

    this.rooms.set(code, room);
    return { room, playerId };
  }

  /**
   * Get a room by code.
   */
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code?.toUpperCase());
  }

  /**
   * Join an existing room by code with a nickname.
   */
  joinRoom(
    code: string,
    nickname: string,
  ): { room: Room; playerId: string } | { error: string } {
    const trimmed = nickname.trim();
    if (!trimmed || !NICKNAME_REGEX.test(trimmed)) {
      return { error: 'Invalid nickname: must be 1-16 alphanumeric characters' };
    }

    const room = this.rooms.get(code?.toUpperCase());
    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.lobby.started) {
      return { error: 'Game already started' };
    }

    if (room.lobby.players.length >= MAX_PLAYERS) {
      return { error: 'Room is full (max 4 players)' };
    }

    const playerId = randomUUID();
    room.lobby.players.push({
      id: playerId,
      nickname: trimmed,
      character: null,
      isHost: false,
    });
    room.lastActivity = Date.now();

    return { room, playerId };
  }

  /**
   * Remove a player from a room's lobby.
   */
  removePlayer(code: string, playerId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    room.lobby.players = room.lobby.players.filter((p) => p.id !== playerId);
    room.lastActivity = Date.now();
  }

  /**
   * Remove rooms where all connections are empty and TTL has expired.
   */
  cleanupExpiredRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.connections.size === 0 && now - room.lastActivity > ROOM_TTL_MS) {
        // Clear any remaining timers
        for (const timer of room.disconnectTimers.values()) {
          clearTimeout(timer);
        }
        this.rooms.delete(code);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown).
   */
  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}
