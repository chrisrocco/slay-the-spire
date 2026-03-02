/**
 * eliteHandler.ts
 * Handles entering elite enemy rooms.
 */
import type { Room } from '../../rooms/Room.js';
import { eliteEnemies } from '@slay-online/shared';
import { initCombat } from '../engine/combat.js';
import type { CombatGameState } from '../state/combatState.js';
import type { EnemyCard } from '@slay-online/shared';

/**
 * Enter an elite room: pick 1 elite, apply Preserved Insect if present, start combat.
 */
export function enterElite(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  const playerCount = room.gameState.players.length;

  // Pick a random elite
  const shuffled = [...eliteEnemies].sort(() => rng() - 0.5);
  const elite = shuffled[0]!;

  // Apply Preserved Insect: any player has it -> elite starts with 25% less HP
  const hasPreservedInsect = room.gameState.players.some((p) =>
    p.relics.includes('preserved_insect'),
  );

  const eliteCard: EnemyCard = { ...elite } as EnemyCard;

  let newState = initCombat(
    room.gameState as CombatGameState,
    [eliteCard],
    playerCount,
    rng,
  );
  newState.gamePhase = 'COMBAT';

  // Apply Preserved Insect AFTER initCombat: reduce current HP by 25% (maxHp unchanged)
  if (hasPreservedInsect) {
    const enemyId = elite.id;
    const enemyCombatStates = { ...newState.enemyCombatStates };
    if (enemyCombatStates[enemyId]) {
      const enemyState = { ...enemyCombatStates[enemyId]! };
      enemyState.hp = Math.floor(enemyState.maxHp * 0.75);
      enemyCombatStates[enemyId] = enemyState;
    }
    newState = { ...newState, enemyCombatStates };
  }

  room.gameState = newState;
}
