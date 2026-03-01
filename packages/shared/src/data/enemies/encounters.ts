import type { EnemyCard } from '../../schemas/enemies.js';

// TODO: Filled in by Plan 06 — encounter enemies from rulebook
export const encounterEnemies: readonly EnemyCard[] = [];

export const encounterEnemyMap: Record<string, EnemyCard> = Object.fromEntries(
  encounterEnemies.map(e => [e.id, e])
);
