import type { Room } from '../rooms/Room.js';
import type { LobbyState } from '@slay-online/shared';

const VALID_CHARACTERS = ['ironclad', 'silent', 'defect', 'watcher'] as const;
type Character = (typeof VALID_CHARACTERS)[number];

type LobbyResult = { lobby: LobbyState } | { error: string };

/**
 * Handle character selection. Enforces unique picks (board game draft rules).
 * Players can re-select to change their pick, freeing the previous character.
 */
export function selectCharacter(
  room: Room,
  playerId: string,
  character: string,
): LobbyResult {
  if (room.lobby.started) {
    return { error: 'Game already started' };
  }

  if (!VALID_CHARACTERS.includes(character as Character)) {
    return { error: 'Invalid character' };
  }

  const player = room.lobby.players.find((p) => p.id === playerId);
  if (!player) {
    return { error: 'Player not found in lobby' };
  }

  // Check if another player already has this character
  const takenBy = room.lobby.players.find(
    (p) => p.id !== playerId && p.character === character,
  );
  if (takenBy) {
    return { error: 'Character already taken' };
  }

  // Allow re-selection (frees previous pick)
  player.character = character as Character;

  return { lobby: room.lobby };
}

/**
 * Toggle an optional rule. Host-only.
 */
export function toggleRule(
  room: Room,
  playerId: string,
  rule: 'lastStand' | 'chooseYourRelic',
): LobbyResult {
  if (room.lobby.started) {
    return { error: 'Game already started' };
  }

  const player = room.lobby.players.find((p) => p.id === playerId);
  if (!player || !player.isHost) {
    return { error: 'Only host can change rules' };
  }

  room.lobby.optionalRules[rule] = !room.lobby.optionalRules[rule];

  return { lobby: room.lobby };
}

/**
 * Start the game. Host-only. All players must have selected characters.
 */
export function startGame(room: Room, playerId: string): LobbyResult {
  if (room.lobby.started) {
    return { error: 'Game already started' };
  }

  const player = room.lobby.players.find((p) => p.id === playerId);
  if (!player || !player.isHost) {
    return { error: 'Only host can start game' };
  }

  if (room.lobby.players.length === 0) {
    return { error: 'No players in lobby' };
  }

  const unselected = room.lobby.players.filter((p) => p.character === null);
  if (unselected.length > 0) {
    return { error: 'All players must select a character' };
  }

  room.lobby.started = true;

  return { lobby: room.lobby };
}
