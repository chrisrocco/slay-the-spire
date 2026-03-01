import type { CurseCard } from '../schemas/cards.js';

// TODO: Filled in by Plan 07 — curse cards from rulebook
export const curses: readonly CurseCard[] = [];

export const curseMap: Record<string, CurseCard> = Object.fromEntries(
  curses.map(c => [c.id, c])
);
