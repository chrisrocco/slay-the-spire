import type { EnemyCard } from '../../schemas/enemies.js';

// TODO: Filled in by Plan 06 — elite enemies from rulebook
export const eliteEnemies: readonly EnemyCard[] = [];

export const eliteEnemyMap: Record<string, EnemyCard> = Object.fromEntries(
  eliteEnemies.map(e => [e.id, e])
);
