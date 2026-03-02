import type { EnemyCard } from '@slay-online/shared';
import {
  encounterEnemies,
  eliteEnemies,
  bossEnemies,
} from '@slay-online/shared';

// Build lookup map at module load time
const enemyMap = new Map<string, EnemyCard>();

for (const enemies of [encounterEnemies, eliteEnemies, bossEnemies] as unknown as EnemyCard[][]) {
  for (const enemy of enemies) {
    enemyMap.set(enemy.id, enemy);
  }
}

/**
 * Look up an enemy by ID. Returns undefined if not found.
 */
export function getEnemy(id: string): EnemyCard | undefined {
  return enemyMap.get(id);
}

/**
 * Look up an enemy by ID. Returns a placeholder if not found.
 */
export function getEnemyOrPlaceholder(id: string): EnemyCard {
  return enemyMap.get(id) ?? {
    id,
    name: 'Unknown Enemy',
    act: 1 as const,
    category: 'encounter' as const,
    hp: 1,
    pattern: { kind: 'single' as const, description: '???' },
    specialAbilities: [],
    summons: [],
    rewards: { gold: 0, cardReward: false, potionReward: false, relicReward: false },
  };
}
