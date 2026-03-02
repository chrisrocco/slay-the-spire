import { describe, it, expect, beforeEach } from 'vitest';
import { selectCharacter, toggleRule, startGame } from '../lobbyHandlers.js';
import { Room } from '../../rooms/Room.js';

function createTestRoom(playerCount: number): Room {
  const room = new Room('TEST', 'host-id', 'Host');
  for (let i = 1; i < playerCount; i++) {
    room.lobby.players.push({
      id: `player-${i}`,
      nickname: `Player${i}`,
      character: null,
      isHost: false,
    });
  }
  return room;
}

describe('selectCharacter', () => {
  let room: Room;

  beforeEach(() => {
    room = createTestRoom(4);
  });

  it('selects a character for a player', () => {
    const result = selectCharacter(room, 'host-id', 'ironclad');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.players[0]!.character).toBe('ironclad');
    }
  });

  it('rejects duplicate character selection by another player', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    const result = selectCharacter(room, 'player-1', 'ironclad');
    expect(result).toEqual({ error: 'Character already taken' });
  });

  it('allows re-selection (change character)', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    const result = selectCharacter(room, 'host-id', 'silent');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.players[0]!.character).toBe('silent');
    }
  });

  it('frees previous pick when re-selecting', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    selectCharacter(room, 'host-id', 'silent');
    // Now ironclad should be available for another player
    const result = selectCharacter(room, 'player-1', 'ironclad');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.players[1]!.character).toBe('ironclad');
    }
  });

  it('rejects invalid character', () => {
    const result = selectCharacter(room, 'host-id', 'wizard');
    expect(result).toEqual({ error: 'Invalid character' });
  });

  it('rejects selection after game started', () => {
    room.lobby.started = true;
    const result = selectCharacter(room, 'host-id', 'ironclad');
    expect(result).toEqual({ error: 'Game already started' });
  });

  it('rejects unknown player', () => {
    const result = selectCharacter(room, 'unknown-id', 'ironclad');
    expect(result).toEqual({ error: 'Player not found in lobby' });
  });
});

describe('toggleRule', () => {
  let room: Room;

  beforeEach(() => {
    room = createTestRoom(2);
  });

  it('host toggles lastStand on', () => {
    const result = toggleRule(room, 'host-id', 'lastStand');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.optionalRules.lastStand).toBe(true);
    }
  });

  it('host toggles lastStand off again', () => {
    toggleRule(room, 'host-id', 'lastStand');
    const result = toggleRule(room, 'host-id', 'lastStand');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.optionalRules.lastStand).toBe(false);
    }
  });

  it('host toggles chooseYourRelic', () => {
    const result = toggleRule(room, 'host-id', 'chooseYourRelic');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.optionalRules.chooseYourRelic).toBe(true);
    }
  });

  it('non-host cannot toggle rules', () => {
    const result = toggleRule(room, 'player-1', 'lastStand');
    expect(result).toEqual({ error: 'Only host can change rules' });
  });

  it('rejects toggle after game started', () => {
    room.lobby.started = true;
    const result = toggleRule(room, 'host-id', 'lastStand');
    expect(result).toEqual({ error: 'Game already started' });
  });
});

describe('startGame', () => {
  let room: Room;

  beforeEach(() => {
    room = createTestRoom(2);
  });

  it('host starts game when all characters selected', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    selectCharacter(room, 'player-1', 'silent');
    const result = startGame(room, 'host-id');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.started).toBe(true);
    }
  });

  it('non-host cannot start game', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    selectCharacter(room, 'player-1', 'silent');
    const result = startGame(room, 'player-1');
    expect(result).toEqual({ error: 'Only host can start game' });
  });

  it('rejects start with unselected characters', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    // player-1 hasn't selected
    const result = startGame(room, 'host-id');
    expect(result).toEqual({ error: 'All players must select a character' });
  });

  it('rejects starting an already started game', () => {
    selectCharacter(room, 'host-id', 'ironclad');
    selectCharacter(room, 'player-1', 'silent');
    startGame(room, 'host-id');
    const result = startGame(room, 'host-id');
    expect(result).toEqual({ error: 'Game already started' });
  });

  it('solo host with character selected can start', () => {
    const soloRoom = createTestRoom(1);
    selectCharacter(soloRoom, 'host-id', 'ironclad');
    const result = startGame(soloRoom, 'host-id');
    expect('lobby' in result).toBe(true);
    if ('lobby' in result) {
      expect(result.lobby.started).toBe(true);
    }
  });
});
