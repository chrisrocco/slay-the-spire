import type { PlayerCard } from '../../schemas/cards.js';

// TODO: Filled in by Plan 04 — data extracted from defect reference sheets
export const defectCards: readonly PlayerCard[] = [];

export const defectCardMap: Record<string, PlayerCard> = Object.fromEntries(
  defectCards.map(c => [c.id, c])
);
