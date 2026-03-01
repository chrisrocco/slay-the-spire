import type { PlayerCard } from '../../schemas/cards.js';

// TODO: Filled in by Plan 05 — data extracted from watcher reference sheets
export const watcherCards: readonly PlayerCard[] = [];

export const watcherCardMap: Record<string, PlayerCard> = Object.fromEntries(
  watcherCards.map(c => [c.id, c])
);
