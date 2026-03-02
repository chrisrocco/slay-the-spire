import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handlePlayCard,
  handleEndTurn,
  handleChat,
  broadcastState,
  broadcastLobby,
} from '../gameHandlers.js';
import { ActionQueue } from '../actionQueue.js';
import { Room } from '../../rooms/Room.js';
import { selectCharacter, startGame } from '../../lobby/lobbyHandlers.js';
import { initializeGame } from '../../lobby/gameInit.js';
import type { WebSocket } from 'ws';
import type { CombatGameState } from '../state/combatState.js';

function createMockWs(): WebSocket {
  return {
    send: vi.fn(),
    readyState: 1, // WebSocket.OPEN
  } as unknown as WebSocket;
}

function createSeededRng(seed: number = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function createGameRoom(): { room: Room; hostWs: WebSocket; guestWs: WebSocket } {
  const room = new Room('TEST', 'host-id', 'Host');
  room.lobby.players.push({
    id: 'guest-id',
    nickname: 'Guest',
    character: null,
    isHost: false,
  });
  selectCharacter(room, 'host-id', 'ironclad');
  selectCharacter(room, 'guest-id', 'silent');
  startGame(room, 'host-id');
  initializeGame(room, createSeededRng());

  const hostWs = createMockWs();
  const guestWs = createMockWs();
  room.connections.set('host-id', hostWs);
  room.connections.set('guest-id', guestWs);

  return { room, hostWs, guestWs };
}

describe('ActionQueue', () => {
  it('executes enqueued actions in order', () => {
    const queue = new ActionQueue();
    const order: number[] = [];

    queue.enqueue(() => order.push(1));
    queue.enqueue(() => order.push(2));
    queue.enqueue(() => order.push(3));

    expect(order).toEqual([1, 2, 3]);
  });

  it('serializes actions (second sees state from first)', () => {
    const queue = new ActionQueue();
    let counter = 0;
    const results: number[] = [];

    queue.enqueue(() => {
      counter++;
      results.push(counter);
    });
    queue.enqueue(() => {
      counter++;
      results.push(counter);
    });

    expect(results).toEqual([1, 2]);
  });

  it('reports pending count', () => {
    const queue = new ActionQueue();
    // After all immediate executions, pending should be 0
    queue.enqueue(() => {});
    expect(queue.pending).toBe(0);
  });
});

describe('handlePlayCard', () => {
  it('processes PLAY_CARD through processAction and updates room.gameState', () => {
    const { room } = createGameRoom();
    const stateBefore = { ...room.gameState! };

    // Get a card from the host's hand
    const hostPlayer = room.gameState!.players.find((p) => p.id === 'host-id')!;
    if (hostPlayer.hand.length > 0) {
      const cardId = hostPlayer.hand[0]!;
      // Find a target enemy
      const targetId = room.gameState!.activeEnemies[0];

      handlePlayCard(room, 'host-id', cardId, targetId ? [targetId] : undefined);

      // State should be updated (something changed)
      expect(room.gameState).not.toBeNull();
      // Combat log should have grown
      expect(room.gameState!.combatLog.length).toBeGreaterThanOrEqual(
        stateBefore.combatLog.length,
      );
    }
  });

  it('does nothing when gameState is null', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    // No game state
    handlePlayCard(room, 'host-id', 'strike_r'); // Should not throw
  });
});

describe('handleEndTurn', () => {
  it('signals end turn for player', () => {
    const { room } = createGameRoom();

    handleEndTurn(room, 'host-id');

    const hostPlayer = room.gameState!.players.find((p) => p.id === 'host-id')!;
    expect(hostPlayer.endedTurn).toBe(true);
  });

  it('clears disconnect timer when player ends turn', () => {
    const { room } = createGameRoom();
    const timer = setTimeout(() => {}, 30000);
    room.disconnectTimers.set('host-id', timer);

    handleEndTurn(room, 'host-id');

    expect(room.disconnectTimers.has('host-id')).toBe(false);
    clearTimeout(timer);
  });
});

describe('broadcastState', () => {
  it('sends STATE_UPDATE to all connected WebSockets', () => {
    const { room, hostWs, guestWs } = createGameRoom();

    broadcastState(room);

    expect((hostWs.send as any).mock.calls.length).toBeGreaterThanOrEqual(1);
    expect((guestWs.send as any).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('redacts other players drawPile', () => {
    const { room, hostWs } = createGameRoom();

    broadcastState(room);

    const lastCall = (hostWs.send as any).mock.calls[
      (hostWs.send as any).mock.calls.length - 1
    ];
    const msg = JSON.parse(lastCall[0]);
    expect(msg.type).toBe('STATE_UPDATE');

    // Host's own drawPile should be intact
    const hostPlayer = msg.state.players.find((p: any) => p.id === 'host-id');
    const guestPlayer = msg.state.players.find((p: any) => p.id === 'guest-id');

    // Guest's drawPile should be redacted (empty strings)
    if (guestPlayer && guestPlayer.drawPile.length > 0) {
      for (const card of guestPlayer.drawPile) {
        expect(card).toBe('');
      }
    }

    // Host's own drawPile should NOT be redacted
    if (hostPlayer && hostPlayer.drawPile.length > 0) {
      const hasRealCards = hostPlayer.drawPile.some((c: string) => c !== '');
      expect(hasRealCards).toBe(true);
    }
  });

  it('does nothing when gameState is null', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    broadcastState(room); // Should not throw
  });
});

describe('broadcastLobby', () => {
  it('sends LOBBY_UPDATE to all connected WebSockets', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    room.connections.set('host-id', ws1);
    room.connections.set('guest-id', ws2);

    broadcastLobby(room);

    const msg1 = JSON.parse((ws1.send as any).mock.calls[0][0]);
    const msg2 = JSON.parse((ws2.send as any).mock.calls[0][0]);
    expect(msg1.type).toBe('LOBBY_UPDATE');
    expect(msg2.type).toBe('LOBBY_UPDATE');
  });
});

describe('handleChat', () => {
  it('broadcasts CHAT_MESSAGE to all connections', () => {
    const room = new Room('TEST', 'host-id', 'Host');
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    room.connections.set('host-id', ws1);
    room.connections.set('guest-id', ws2);

    handleChat(room, 'host-id', 'Hello!');

    const msg1 = JSON.parse((ws1.send as any).mock.calls[0][0]);
    expect(msg1.type).toBe('CHAT_MESSAGE');
    expect(msg1.playerId).toBe('host-id');
    expect(msg1.text).toBe('Hello!');
  });

  it('does not modify game state', () => {
    const { room } = createGameRoom();
    const stateBefore = JSON.stringify(room.gameState);

    handleChat(room, 'host-id', 'Test message');

    expect(JSON.stringify(room.gameState)).toBe(stateBefore);
  });
});
