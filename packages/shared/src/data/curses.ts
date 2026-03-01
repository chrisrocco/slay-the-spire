import type { CurseCard } from '../schemas/cards.js';

export const curses = [
  {
    id: 'regret',
    name: 'Regret',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'At end of turn, lose 1 HP for each card in your hand.',
  },
  {
    id: 'shame',
    name: 'Shame',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'At end of turn, gain 1 Frail.',
  },
  {
    id: 'doubt',
    name: 'Doubt',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'At end of turn, gain 1 Weak.',
  },
  {
    id: 'pain',
    name: 'Pain',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Whenever you play a card, lose 1 HP.',
  },
  {
    id: 'decay',
    name: 'Decay',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'At end of turn, take 2 damage.',
  },
  {
    id: 'injury',
    name: 'Injury',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable.',
  },
  {
    id: 'clumsy',
    name: 'Clumsy',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Ethereal.',
  },
  {
    id: 'writhe',
    name: 'Writhe',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Innate.',
  },
  {
    id: 'parasite',
    name: 'Parasite',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'If this card is removed from your deck, lose 3 Max HP.',
  },
  {
    id: 'normality',
    name: 'Normality',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'You cannot play more than 3 cards this turn.',
  },
  {
    id: 'pride',
    name: 'Pride',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Innate. At end of turn, put a copy of Pride in your draw pile.',
  },
  {
    id: 'necronomicurse',
    name: 'Necronomicurse',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. There is no escape from this Curse.',
  },
  {
    id: 'ascenders_bane',
    name: "Ascender's Bane",
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Ethereal. Cannot be removed from your deck.',
  },
  {
    id: 'curse_of_the_bell',
    name: 'Curse of the Bell',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Cannot be removed from your deck.',
  },
  {
    id: 'bite',
    name: 'Bite',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Lose 1 HP.',
  },
  {
    id: 'dazed_curse',
    name: 'Dazed',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. Ethereal.',
  },
  {
    id: 'burn',
    name: 'Burn',
    type: 'Curse' as const,
    cost: 'unplayable' as const,
    text: 'Unplayable. At end of turn, take 2 damage.',
  },
] as const satisfies readonly CurseCard[];

export const curseMap = Object.fromEntries(
  curses.map(c => [c.id, c])
) as Record<string, CurseCard>;
