import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../RoomManager.js';
import { generateRoomCode } from '../roomCodes.js';

describe('generateRoomCode', () => {
  it('returns a 4-letter uppercase word', () => {
    const code = generateRoomCode(new Set());
    expect(code).toMatch(/^[A-Z]{4}$/);
  });

  it('avoids existing codes', () => {
    const existing = new Set(['FIRE', 'SLAM']);
    const code = generateRoomCode(existing);
    expect(existing.has(code)).toBe(false);
  });

  it('returns different codes on multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 10; i++) {
      codes.add(generateRoomCode(codes));
    }
    expect(codes.size).toBe(10);
  });
});

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('createRoom', () => {
    it('creates a room with a valid 4-letter code', () => {
      const result = manager.createRoom('Alice');
      expect('room' in result).toBe(true);
      if ('room' in result) {
        expect(result.room.code).toMatch(/^[A-Z]{4}$/);
        expect(result.room.lobby.players).toHaveLength(1);
        expect(result.room.lobby.players[0]!.nickname).toBe('Alice');
        expect(result.room.lobby.players[0]!.isHost).toBe(true);
        expect(result.playerId).toBeTruthy();
      }
    });

    it('rejects invalid nicknames', () => {
      expect(manager.createRoom('')).toEqual({ error: expect.stringContaining('Invalid nickname') });
      expect(manager.createRoom('   ')).toEqual({ error: expect.stringContaining('Invalid nickname') });
      expect(manager.createRoom('a'.repeat(17))).toEqual({ error: expect.stringContaining('Invalid nickname') });
      expect(manager.createRoom('test<script>')).toEqual({ error: expect.stringContaining('Invalid nickname') });
    });

    it('creates rooms with unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const result = manager.createRoom(`Player${i}`);
        if ('room' in result) {
          expect(codes.has(result.room.code)).toBe(false);
          codes.add(result.room.code);
        }
      }
    });
  });

  describe('joinRoom', () => {
    it('adds player to lobby and returns playerId', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      const code = createResult.room.code;

      const joinResult = manager.joinRoom(code, 'Guest');
      expect('room' in joinResult).toBe(true);
      if ('room' in joinResult) {
        expect(joinResult.room.lobby.players).toHaveLength(2);
        expect(joinResult.room.lobby.players[1]!.nickname).toBe('Guest');
        expect(joinResult.room.lobby.players[1]!.isHost).toBe(false);
        expect(joinResult.playerId).toBeTruthy();
      }
    });

    it('returns error for nonexistent room', () => {
      const result = manager.joinRoom('ZZZZ', 'Guest');
      expect(result).toEqual({ error: 'Room not found' });
    });

    it('returns error when room is full (4 players)', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      const code = createResult.room.code;

      manager.joinRoom(code, 'P2');
      manager.joinRoom(code, 'P3');
      manager.joinRoom(code, 'P4');

      const result = manager.joinRoom(code, 'P5');
      expect(result).toEqual({ error: 'Room is full (max 4 players)' });
    });

    it('returns error when game already started', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      createResult.room.lobby.started = true;

      const result = manager.joinRoom(createResult.room.code, 'Late');
      expect(result).toEqual({ error: 'Game already started' });
    });

    it('rejects invalid nicknames', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');

      expect(manager.joinRoom(createResult.room.code, '')).toEqual({ error: expect.stringContaining('Invalid nickname') });
    });
  });

  describe('getRoom', () => {
    it('returns room by code (case-insensitive)', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      const code = createResult.room.code;

      expect(manager.getRoom(code)).toBe(createResult.room);
      expect(manager.getRoom(code.toLowerCase())).toBe(createResult.room);
    });

    it('returns undefined for unknown code', () => {
      expect(manager.getRoom('ZZZZ')).toBeUndefined();
    });
  });

  describe('removePlayer', () => {
    it('removes player from lobby', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      const joinResult = manager.joinRoom(createResult.room.code, 'Guest');
      if (!('playerId' in joinResult)) throw new Error('Should join');

      manager.removePlayer(createResult.room.code, joinResult.playerId);
      expect(createResult.room.lobby.players).toHaveLength(1);
    });
  });

  describe('cleanupExpiredRooms', () => {
    it('removes rooms with no connections past TTL', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');
      const code = createResult.room.code;

      // Simulate expired room: no connections, old lastActivity
      createResult.room.lastActivity = Date.now() - 31 * 60 * 1000;
      createResult.room.connections.clear();

      manager.cleanupExpiredRooms();
      expect(manager.getRoom(code)).toBeUndefined();
    });

    it('keeps rooms with active connections', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');

      // Old activity but has connections
      createResult.room.lastActivity = Date.now() - 31 * 60 * 1000;
      createResult.room.connections.set('fake', {} as any);

      manager.cleanupExpiredRooms();
      expect(manager.getRoom(createResult.room.code)).toBeDefined();
    });

    it('keeps rooms within TTL', () => {
      const createResult = manager.createRoom('Host');
      if (!('room' in createResult)) throw new Error('Should create');

      createResult.room.connections.clear();
      // Recent activity
      createResult.room.lastActivity = Date.now();

      manager.cleanupExpiredRooms();
      expect(manager.getRoom(createResult.room.code)).toBeDefined();
    });
  });
});
