/**
 * bossHandler.ts
 * Handles entering the boss room.
 */
import type { Room } from '../../rooms/Room.js';
import { bossEnemies } from '@slay-online/shared';
import { initCombat } from '../engine/combat.js';
import type { CombatGameState } from '../state/combatState.js';
import type { EnemyCard } from '@slay-online/shared';

/**
 * Enter the boss room: use room.bossId, apply Pantograph relic if present, start combat.
 */
export function enterBoss(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  const playerCount = room.gameState.players.length;
  const bossId = room.bossId;

  // Find boss by id, fallback to first boss
  const boss = bossId
    ? (bossEnemies.find((b) => b.id === bossId) ?? bossEnemies[0]!)
    : bossEnemies[0]!;

  const bossCard: EnemyCard = { ...boss } as EnemyCard;

  // Apply Pantograph relic: heal 25 HP at boss combat start
  for (const player of room.gameState.players) {
    if (player.relics.includes('pantograph')) {
      player.hp = Math.min(player.maxHp, player.hp + 25);
    }
  }

  const newState = initCombat(
    room.gameState as CombatGameState,
    [bossCard],
    playerCount,
    rng,
  );
  newState.gamePhase = 'COMBAT';
  room.gameState = newState;
}
