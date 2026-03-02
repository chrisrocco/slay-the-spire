import { createStore, reconcile } from 'solid-js/store';
import type { GameState, LobbyState, PlayerState, ServerMessage } from '@slay-online/shared';

export interface ChatMessage {
  playerId: string;
  nickname: string;
  text: string;
}

export type AppPhase = 'connecting' | 'lobby' | 'combat';

export interface AppState {
  playerId: string | null;
  reconnectionToken: string | null;
  roomCode: string | null;
  game: GameState | null;
  lobby: LobbyState | null;
  chatMessages: ChatMessage[];
  error: string | null;
  phase: AppPhase;
}

export interface AppStore {
  state: AppState;
  setPlayerId: (id: string) => void;
  setReconnectionToken: (token: string) => void;
  setRoomCode: (code: string) => void;
  updateGame: (game: GameState) => void;
  updateLobby: (lobby: LobbyState) => void;
  addChat: (msg: ChatMessage) => void;
  setError: (err: string | null) => void;
  setPhase: (phase: AppPhase) => void;
  resetToLobby: () => void;
}

/**
 * Create the main application store.
 * Single source of truth for all client state.
 */
export function createAppStore(): AppStore {
  const [state, setState] = createStore<AppState>({
    playerId: null,
    reconnectionToken: null,
    roomCode: null,
    game: null,
    lobby: null,
    chatMessages: [],
    error: null,
    phase: 'connecting',
  });

  return {
    state,
    setPlayerId: (id: string) => setState('playerId', id),
    setReconnectionToken: (token: string) => setState('reconnectionToken', token),
    setRoomCode: (code: string) => setState('roomCode', code),
    updateGame: (game: GameState) => setState('game', reconcile(game)),
    updateLobby: (lobby: LobbyState) => setState('lobby', reconcile(lobby)),
    addChat: (msg: ChatMessage) =>
      setState('chatMessages', (prev) => [...prev, msg]),
    setError: (err: string | null) => setState('error', err),
    setPhase: (phase: AppPhase) => setState('phase', phase),
    resetToLobby: () => {
      setState('game', null);
      setState('chatMessages', []);
      setState('error', null);
      setState('phase', 'lobby');
    },
  };
}

/**
 * Find the current player's state from the game state.
 */
export function getMyPlayer(state: AppState): PlayerState | undefined {
  if (!state.game || !state.playerId) return undefined;
  return state.game.players.find((p) => p.id === state.playerId);
}

/**
 * Get a player's nickname by ID from game or lobby state.
 */
function getNickname(state: AppState, playerId: string): string {
  // Try game state first
  if (state.game) {
    const player = state.game.players.find((p) => p.id === playerId);
    if (player) return player.nickname;
  }
  // Try lobby state
  if (state.lobby) {
    const player = state.lobby.players.find((p) => p.id === playerId);
    if (player) return player.nickname;
  }
  return 'Unknown';
}

/**
 * Handle a server message by updating the store.
 * Central dispatch for all ServerMessage types.
 */
export function handleServerMessage(store: AppStore, msg: ServerMessage): void {
  switch (msg.type) {
    case 'ROOM_CREATED':
      store.setPlayerId(msg.playerId);
      store.setRoomCode(msg.roomCode);
      store.setReconnectionToken(msg.reconnectionToken);
      store.setPhase('lobby');
      break;

    case 'JOINED':
      store.setPlayerId(msg.playerId);
      store.setReconnectionToken(msg.reconnectionToken);
      store.setPhase('lobby');
      break;

    case 'STATE_UPDATE':
      store.updateGame(msg.state);
      store.setPhase('combat');
      store.setError(null);
      break;

    case 'LOBBY_UPDATE':
      store.updateLobby(msg.lobby);
      if (store.state.phase === 'connecting') {
        store.setPhase('lobby');
      }
      break;

    case 'ERROR':
      store.setError(`${msg.code}: ${msg.message}`);
      break;

    case 'CHAT_MESSAGE':
      store.addChat({
        playerId: msg.playerId,
        nickname: getNickname(store.state, msg.playerId),
        text: msg.text,
      });
      break;
  }
}
