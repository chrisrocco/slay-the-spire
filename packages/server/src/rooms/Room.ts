import type { WebSocket } from 'ws';
import type { LobbyState } from '@slay-online/shared';
import type { CombatGameState } from '../game/state/combatState.js';

export interface MapNode {
  id: string;
  floor: number;
  type: 'encounter' | 'elite' | 'event' | 'campfire' | 'treasure' | 'merchant' | 'boss';
  connections: string[];
}

export interface GameMap {
  nodes: MapNode[];
  bossNodeId: string;
  currentNodeId: string | null;
}

/**
 * A single game room. Holds lobby state, game state, and connection tracking.
 */
export class Room {
  code: string;
  hostId: string;
  lobby: LobbyState;
  gameState: CombatGameState | null;
  connections: Map<string, WebSocket>;
  reconnectionTokens: Map<string, string>;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  lastActivity: number;
  createdAt: number;
  map: GameMap | null;
  bossId: string | null;
  neowBlessings: Map<string, string>;

  constructor(code: string, hostId: string, hostNickname: string) {
    this.code = code;
    this.hostId = hostId;
    this.lobby = {
      roomCode: code,
      players: [
        {
          id: hostId,
          nickname: hostNickname,
          character: null,
          isHost: true,
        },
      ],
      optionalRules: {
        lastStand: false,
        chooseYourRelic: false,
      },
      started: false,
    };
    this.gameState = null;
    this.connections = new Map();
    this.reconnectionTokens = new Map();
    this.disconnectTimers = new Map();
    this.lastActivity = Date.now();
    this.createdAt = Date.now();
    this.map = null;
    this.bossId = null;
    this.neowBlessings = new Map();
  }
}
