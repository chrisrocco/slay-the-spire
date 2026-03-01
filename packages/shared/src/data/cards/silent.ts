import type { PlayerCard } from '../../schemas/cards.js';

// TODO: Filled in by Plan 03 — data extracted from silent reference sheets
export const silentCards: readonly PlayerCard[] = [];

export const silentCardMap: Record<string, PlayerCard> = Object.fromEntries(
  silentCards.map(c => [c.id, c])
);
