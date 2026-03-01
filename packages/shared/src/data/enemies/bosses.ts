import type { EnemyCard } from '../../schemas/enemies.js';

// TODO: Filled in by Plan 06 — boss enemies from rulebook
export const bossEnemies: readonly EnemyCard[] = [];

export const bossEnemyMap: Record<string, EnemyCard> = Object.fromEntries(
  bossEnemies.map(e => [e.id, e])
);
