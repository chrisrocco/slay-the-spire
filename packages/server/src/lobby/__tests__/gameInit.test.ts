import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGame } from '../gameInit.js';
import { generateMap } from '../mapGenerator.js';
import { Room } from '../../rooms/Room.js';
import { selectCharacter, startGame } from '../lobbyHandlers.js';

// Deterministic RNG for reproducible tests
function createSeededRng(seed: number = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function createReadyRoom(
  characters: string[],
): Room {
  const room = new Room('TEST', 'host-id', 'Host');
  selectCharacter(room, 'host-id', characters[0]!);

  for (let i = 1; i < characters.length; i++) {
    room.lobby.players.push({
      id: `player-${i}`,
      nickname: `Player${i}`,
      character: null,
      isHost: false,
    });
    selectCharacter(room, `player-${i}`, characters[i]!);
  }

  startGame(room, 'host-id');
  return room;
}

describe('generateMap', () => {
  const rng = createSeededRng();

  it('generates map with 15 floors (0-14)', () => {
    const map = generateMap(rng);
    const floors = new Set(map.nodes.map((n) => n.floor));
    expect(floors.size).toBe(15);
    expect(floors.has(0)).toBe(true);
    expect(floors.has(14)).toBe(true);
  });

  it('floor 0 nodes are encounter type', () => {
    const map = generateMap(createSeededRng());
    const floor0 = map.nodes.filter((n) => n.floor === 0);
    expect(floor0.length).toBeGreaterThanOrEqual(3);
    for (const node of floor0) {
      expect(node.type).toBe('encounter');
    }
  });

  it('floor 14 has exactly 1 boss node', () => {
    const map = generateMap(createSeededRng());
    const floor14 = map.nodes.filter((n) => n.floor === 14);
    expect(floor14).toHaveLength(1);
    expect(floor14[0]!.type).toBe('boss');
  });

  it('all nodes are connected (no orphans)', () => {
    const map = generateMap(createSeededRng());
    for (let floor = 1; floor <= 14; floor++) {
      const floorNodes = map.nodes.filter((n) => n.floor === floor);
      const prevNodes = map.nodes.filter((n) => n.floor === floor - 1);
      for (const node of floorNodes) {
        const hasIncoming = prevNodes.some((prev) =>
          prev.connections.includes(node.id),
        );
        expect(hasIncoming).toBe(true);
      }
    }
  });

  it('has guaranteed treasure at floor 6', () => {
    const map = generateMap(createSeededRng());
    const floor6 = map.nodes.filter((n) => n.floor === 6);
    for (const node of floor6) {
      expect(node.type).toBe('treasure');
    }
  });

  it('has guaranteed campfire at floors 9 and 13', () => {
    const map = generateMap(createSeededRng());
    const floor9 = map.nodes.filter((n) => n.floor === 9);
    const floor13 = map.nodes.filter((n) => n.floor === 13);
    for (const node of floor9) {
      expect(node.type).toBe('campfire');
    }
    for (const node of floor13) {
      expect(node.type).toBe('campfire');
    }
  });

  it('same seed produces same map', () => {
    const map1 = generateMap(createSeededRng(123));
    const map2 = generateMap(createSeededRng(123));
    expect(map1.nodes.length).toBe(map2.nodes.length);
    for (let i = 0; i < map1.nodes.length; i++) {
      expect(map1.nodes[i]!.id).toBe(map2.nodes[i]!.id);
      expect(map1.nodes[i]!.type).toBe(map2.nodes[i]!.type);
    }
  });

  it('currentNodeId starts as null', () => {
    const map = generateMap(createSeededRng());
    expect(map.currentNodeId).toBeNull();
  });
});

describe('initializeGame', () => {
  it('4-player game: each player gets correct starter deck size', () => {
    const room = createReadyRoom(['ironclad', 'silent', 'defect', 'watcher']);
    const state = initializeGame(room, createSeededRng());

    // Ironclad: 10 cards (5 Strike, 4 Defend, 1 Bash) — all in drawPile at MAP phase (no hand drawn)
    const icPlayer = state.players.find((p) => p.character === 'ironclad')!;
    expect(icPlayer.drawPile.length).toBe(10);

    // Silent: 12 cards
    const siPlayer = state.players.find((p) => p.character === 'silent')!;
    expect(siPlayer.drawPile.length).toBe(12);

    // Defect: 10 cards
    const dePlayer = state.players.find((p) => p.character === 'defect')!;
    expect(dePlayer.drawPile.length).toBe(10);

    // Watcher: 10 cards
    const waPlayer = state.players.find((p) => p.character === 'watcher')!;
    expect(waPlayer.drawPile.length).toBe(10);
  });

  it('each player gets correct starting HP for their character', () => {
    const room = createReadyRoom(['ironclad', 'silent', 'defect', 'watcher']);
    const state = initializeGame(room, createSeededRng());

    expect(state.players.find((p) => p.character === 'ironclad')!.maxHp).toBe(75);
    expect(state.players.find((p) => p.character === 'silent')!.maxHp).toBe(70);
    expect(state.players.find((p) => p.character === 'defect')!.maxHp).toBe(75);
    expect(state.players.find((p) => p.character === 'watcher')!.maxHp).toBe(68);
  });

  it('each player gets their starter relic', () => {
    const room = createReadyRoom(['ironclad', 'silent', 'defect', 'watcher']);
    const state = initializeGame(room, createSeededRng());

    expect(state.players.find((p) => p.character === 'ironclad')!.relics).toContain('burning_blood');
    expect(state.players.find((p) => p.character === 'silent')!.relics).toContain('ring_of_the_snake');
    expect(state.players.find((p) => p.character === 'defect')!.relics).toContain('cracked_core');
    expect(state.players.find((p) => p.character === 'watcher')!.relics).toContain('pure_water');
  });

  it('solo player receives Loaded Die relic', () => {
    const room = createReadyRoom(['ironclad']);
    const state = initializeGame(room, createSeededRng());

    expect(state.players[0]!.relics).toContain('loaded_die');
    expect(state.players[0]!.relics).toContain('burning_blood');
  });

  it('multi-player game does NOT give Loaded Die', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    const state = initializeGame(room, createSeededRng());

    for (const player of state.players) {
      expect(player.relics).not.toContain('loaded_die');
    }
  });

  it('game state has MAP gamePhase after init (no auto-combat)', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    const state = initializeGame(room, createSeededRng());

    expect(state.gamePhase).toBe('MAP');
  });

  it('no active enemies at MAP phase (combat not started)', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    const state = initializeGame(room, createSeededRng());

    expect(state.activeEnemies.length).toBe(0);
    expect(Object.keys(state.enemyCombatStates).length).toBe(0);
  });

  it('players have no hand at MAP phase (combat not started)', () => {
    const room = createReadyRoom(['ironclad']);
    const state = initializeGame(room, createSeededRng());

    expect(state.players[0]!.hand).toHaveLength(0);
  });

  it('map data is included in game state', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    const state = initializeGame(room, createSeededRng());

    expect(state.map).toBeDefined();
    expect(state.map!.nodes.length).toBeGreaterThan(0);
  });

  it('map is generated and stored on room', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    initializeGame(room, createSeededRng());

    expect(room.map).not.toBeNull();
    expect(room.map!.nodes.length).toBeGreaterThan(0);
    expect(room.map!.bossNodeId).toBeTruthy();
  });

  it('boss is selected from boss pool', () => {
    const room = createReadyRoom(['ironclad']);
    initializeGame(room, createSeededRng());

    expect(room.bossId).toBeTruthy();
  });

  it('same seed produces same boss', () => {
    const room1 = createReadyRoom(['ironclad']);
    initializeGame(room1, createSeededRng(99));

    const room2 = createReadyRoom(['ironclad']);
    initializeGame(room2, createSeededRng(99));

    expect(room1.bossId).toBe(room2.bossId);
  });

  it('each player receives a Neow Blessing', () => {
    const room = createReadyRoom(['ironclad', 'silent']);
    initializeGame(room, createSeededRng());

    expect(room.neowBlessings.size).toBe(2);
    expect(room.neowBlessings.has('host-id')).toBe(true);
    expect(room.neowBlessings.has('player-1')).toBe(true);
  });

  it('round starts at 0 in MAP phase (combat not yet started)', () => {
    const room = createReadyRoom(['ironclad']);
    const state = initializeGame(room, createSeededRng());

    expect(state.round).toBe(0);
  });
});
