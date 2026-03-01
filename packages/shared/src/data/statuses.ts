import type { StatusCard } from '../schemas/cards.js';

// TODO: Filled in by Plan 07 — status cards (Wound, Slimed) from rulebook
export const statuses: readonly StatusCard[] = [];

export const statusMap: Record<string, StatusCard> = Object.fromEntries(
  statuses.map(s => [s.id, s])
);
