/**
 * potionManagement.test.ts
 * Tests for passPotion and discardPotion functions.
 */
import { describe, it, expect } from 'vitest';
import { passPotion, discardPotion } from '../potionManagement.js';
import { buildTestPlayer, buildTestGameState } from './helpers.js';
import type { CombatGameState } from '../state/combatState.js';

function buildMapState(overrides?: Partial<CombatGameState>): CombatGameState {
  const base = buildTestGameState();
  return { ...base, gamePhase: 'MAP', ...overrides };
}

function buildTwoPlayerMapState(): CombatGameState {
  const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
  const p2 = buildTestPlayer({ id: 'player-2', potions: [] });
  const base = buildTestGameState({ players: [p1, p2] });
  return { ...base, gamePhase: 'MAP' };
}

// ============================================================
// passPotion
// ============================================================

describe('passPotion', () => {
  it('moves potion from source to target player', () => {
    const state = buildTwoPlayerMapState();
    const result = passPotion(state, 'player-1', 'health_potion', 'player-2');

    const source = result.players.find((p) => p.id === 'player-1')!;
    const target = result.players.find((p) => p.id === 'player-2')!;

    expect(source.potions).not.toContain('health_potion');
    expect(target.potions).toContain('health_potion');
  });

  it('returns unchanged state if gamePhase is not MAP (combat)', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
    const p2 = buildTestPlayer({ id: 'player-2', potions: [] });
    const state = buildTestGameState({ players: [p1, p2] });
    // gamePhase defaults to COMBAT in buildTestGameState

    const result = passPotion(state, 'player-1', 'health_potion', 'player-2');

    const source = result.players.find((p) => p.id === 'player-1')!;
    const target = result.players.find((p) => p.id === 'player-2')!;

    // Should be unchanged since not in MAP phase
    expect(source.potions).toContain('health_potion');
    expect(target.potions).not.toContain('health_potion');
  });

  it('returns unchanged state if source player does not have the potion', () => {
    const state = buildTwoPlayerMapState();
    const result = passPotion(state, 'player-1', 'nonexistent_potion', 'player-2');

    // State should be unchanged
    expect(result).toBe(state);
  });

  it('returns unchanged state if target player is at potion limit (3)', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
    const p2 = buildTestPlayer({
      id: 'player-2',
      potions: ['fire_potion', 'swift_potion', 'strength_potion'],
    });
    const base = buildTestGameState({ players: [p1, p2] });
    const state = { ...base, gamePhase: 'MAP' as const };

    const result = passPotion(state, 'player-1', 'health_potion', 'player-2');

    // Target was full, should be unchanged
    const source = result.players.find((p) => p.id === 'player-1')!;
    const target = result.players.find((p) => p.id === 'player-2')!;
    expect(source.potions).toContain('health_potion');
    expect(target.potions.length).toBe(3);
  });

  it('allows pass if target has Potion Belt relic (limit 5)', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
    const p2 = buildTestPlayer({
      id: 'player-2',
      potions: ['fire_potion', 'swift_potion', 'strength_potion'],
      relics: ['potion_belt'],
    });
    const base = buildTestGameState({ players: [p1, p2] });
    const state = { ...base, gamePhase: 'MAP' as const };

    const result = passPotion(state, 'player-1', 'health_potion', 'player-2');

    const target = result.players.find((p) => p.id === 'player-2')!;
    expect(target.potions).toContain('health_potion');
    expect(target.potions.length).toBe(4);
  });

  it('returns unchanged state if source player does not exist', () => {
    const state = buildTwoPlayerMapState();
    const result = passPotion(state, 'nonexistent', 'health_potion', 'player-2');
    expect(result).toBe(state);
  });

  it('returns unchanged state if target player does not exist', () => {
    const state = buildTwoPlayerMapState();
    const result = passPotion(state, 'player-1', 'health_potion', 'nonexistent');
    expect(result).toBe(state);
  });
});

// ============================================================
// discardPotion
// ============================================================

describe('discardPotion', () => {
  it('removes potion from player inventory', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion', 'fire_potion'] });
    const state = buildMapState({ players: [p1] });

    const result = discardPotion(state, 'player-1', 'health_potion');

    const player = result.players.find((p) => p.id === 'player-1')!;
    expect(player.potions).not.toContain('health_potion');
    expect(player.potions).toContain('fire_potion');
  });

  it('works during MAP phase', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
    const state = buildMapState({ players: [p1] });

    const result = discardPotion(state, 'player-1', 'health_potion');

    const player = result.players.find((p) => p.id === 'player-1')!;
    expect(player.potions).not.toContain('health_potion');
  });

  it('works during COMBAT phase', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['health_potion'] });
    const state = buildTestGameState({ players: [p1] }); // COMBAT phase

    const result = discardPotion(state, 'player-1', 'health_potion');

    const player = result.players.find((p) => p.id === 'player-1')!;
    expect(player.potions).not.toContain('health_potion');
  });

  it('returns unchanged state if player does not have the potion', () => {
    const p1 = buildTestPlayer({ id: 'player-1', potions: ['fire_potion'] });
    const state = buildMapState({ players: [p1] });

    const result = discardPotion(state, 'player-1', 'nonexistent_potion');
    expect(result).toBe(state);
  });

  it('returns unchanged state if player does not exist', () => {
    const state = buildMapState();
    const result = discardPotion(state, 'nonexistent', 'health_potion');
    expect(result).toBe(state);
  });
});

// ============================================================
// gameInit MAP phase
// ============================================================

describe('Game initialization at MAP phase', () => {
  it('initializeGame returns MAP gamePhase', async () => {
    const { initializeGame } = await import('../../lobby/gameInit.js');
    const { Room } = await import('../../rooms/Room.js');
    const { selectCharacter, startGame } = await import('../../lobby/lobbyHandlers.js');

    const room = new Room('TEST', 'host-id', 'Host');
    selectCharacter(room, 'host-id', 'ironclad');
    startGame(room, 'host-id');

    const state = initializeGame(room);

    expect(state.gamePhase).toBe('MAP');
  });

  it('initializeGame includes map data in state', async () => {
    const { initializeGame } = await import('../../lobby/gameInit.js');
    const { Room } = await import('../../rooms/Room.js');
    const { selectCharacter, startGame } = await import('../../lobby/lobbyHandlers.js');

    const room = new Room('TEST', 'host-id', 'Host');
    selectCharacter(room, 'host-id', 'ironclad');
    startGame(room, 'host-id');

    const state = initializeGame(room);

    expect(state.map).toBeDefined();
    expect(state.map!.nodes.length).toBeGreaterThan(0);
    expect(state.map!.currentNodeId).toBeNull();
  });

  it('initializeGame sets currentFloor to 0', async () => {
    const { initializeGame } = await import('../../lobby/gameInit.js');
    const { Room } = await import('../../rooms/Room.js');
    const { selectCharacter, startGame } = await import('../../lobby/lobbyHandlers.js');

    const room = new Room('TEST', 'host-id', 'Host');
    selectCharacter(room, 'host-id', 'ironclad');
    startGame(room, 'host-id');

    const state = initializeGame(room);

    expect(state.currentFloor).toBe(0);
  });

  it('initializeGame has no active enemies at MAP phase', async () => {
    const { initializeGame } = await import('../../lobby/gameInit.js');
    const { Room } = await import('../../rooms/Room.js');
    const { selectCharacter, startGame } = await import('../../lobby/lobbyHandlers.js');

    const room = new Room('TEST', 'host-id', 'Host');
    selectCharacter(room, 'host-id', 'ironclad');
    startGame(room, 'host-id');

    const state = initializeGame(room);

    expect(state.activeEnemies.length).toBe(0);
  });
});
