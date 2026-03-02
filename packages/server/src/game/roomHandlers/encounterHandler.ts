/**
 * encounterHandler.ts
 * Handles entering encounter (regular enemy) rooms.
 */
import type { Room } from '../../rooms/Room.js';
import { encounterEnemies } from '@slay-online/shared';
import { initCombat } from '../engine/combat.js';
import type { CombatGameState } from '../state/combatState.js';

/**
 * Enter an encounter room: pick 1 enemy per player, start combat.
 */
export function enterEncounter(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  const playerCount = room.gameState.players.length;
  const currentFloor = room.gameState.currentFloor;

  // Determine which pool to draw from based on floor
  // Floor 0 = first encounters, floors 1+ = regular encounters
  const pool = currentFloor === 0
    ? encounterEnemies.filter((e) => e.category === 'first_encounter')
    : encounterEnemies.filter((e) => e.category === 'encounter');

  // Use all enemies if pool is empty (fallback)
  const drawPool = pool.length > 0 ? pool : encounterEnemies;

  // Shuffle pool and pick playerCount enemies
  const shuffled = [...drawPool].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, playerCount);

  // Fallback: if we don't have enough, repeat from pool
  while (selected.length < playerCount) {
    selected.push(shuffled[selected.length % shuffled.length]!);
  }

  // Deduplicate by adding index suffix if same id
  const deduped = selected.map((e, i) => ({
    ...e,
    id: selected.slice(0, i).some((prev) => prev.id === e.id) ? `${e.id}_${i}` : e.id,
  }));

  const newState = initCombat(
    room.gameState as CombatGameState,
    deduped as Parameters<typeof initCombat>[1],
    playerCount,
    rng,
  );
  newState.gamePhase = 'COMBAT';
  room.gameState = newState;
}
