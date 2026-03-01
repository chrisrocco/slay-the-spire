import type { PlayerCard } from '../../schemas/cards.js';

// TODO: Filled in by Plan 02 — data extracted from ironclad reference sheets
export const ironcladCards: readonly PlayerCard[] = [];

export const ironcladCardMap: Record<string, PlayerCard> = Object.fromEntries(
  ironcladCards.map(c => [c.id, c])
);
