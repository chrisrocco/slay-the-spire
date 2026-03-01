import type { StatusCard, DazeCard } from '../schemas/cards.js';

export const statuses = [
  {
    id: 'wound',
    name: 'Wound',
    type: 'Status' as const,
    variant: 'wound' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable.',
  },
  {
    id: 'slimed',
    name: 'Slimed',
    type: 'Status' as const,
    variant: 'slimed' as const,
    cost: 'unplayable' as const,
    text: 'Exhaust.',
  },
] as const satisfies readonly StatusCard[];

export const statusMap = Object.fromEntries(
  statuses.map(s => [s.id, s])
) as Record<string, StatusCard>;

export const dazes = [
  {
    id: 'daze',
    name: 'Daze',
    type: 'Daze' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Ethereal. Put on top of draw pile.',
  },
] as const satisfies readonly DazeCard[];

export const dazeMap = Object.fromEntries(
  dazes.map(d => [d.id, d])
) as Record<string, DazeCard>;
