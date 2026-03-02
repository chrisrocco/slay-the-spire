import type { PlayerCard } from '@slay-online/shared';
import {
  ironcladCards,
  silentCards,
  defectCards,
  watcherCards,
  curses,
  statuses,
  dazes,
} from '@slay-online/shared';

// Build lookup map at module load time
const cardMap = new Map<string, PlayerCard>();

// Add all player cards (readonly arrays need type assertion)
for (const cards of [ironcladCards, silentCards, defectCards, watcherCards] as unknown as PlayerCard[][]) {
  for (const card of cards) {
    cardMap.set(card.id, card);
  }
}

// Add curse cards (mapped to PlayerCard shape)
for (const card of curses) {
  cardMap.set(card.id, {
    id: card.id,
    name: card.name,
    character: 'colorless',
    rarity: 'common',
    type: 'Curse',
    cost: 'unplayable',
    text: card.text,
    upgraded: false,
    keywords: [],
  } as PlayerCard);
}

// Add status cards (mapped to PlayerCard shape)
for (const card of statuses) {
  cardMap.set(card.id, {
    id: card.id,
    name: card.name,
    character: 'colorless',
    rarity: 'common',
    type: 'Status',
    cost: 'unplayable',
    text: card.text,
    upgraded: false,
    keywords: [],
  } as PlayerCard);
}

// Add daze cards (mapped to PlayerCard shape)
for (const card of dazes) {
  cardMap.set(card.id, {
    id: card.id,
    name: card.name,
    character: 'colorless',
    rarity: 'common',
    type: 'Daze',
    cost: 'unplayable',
    text: card.text,
    upgraded: false,
    keywords: [],
  } as PlayerCard);
}

/**
 * Look up a card by ID. Returns undefined if not found.
 */
export function getCard(id: string): PlayerCard | undefined {
  return cardMap.get(id);
}

const PLACEHOLDER_CARD: PlayerCard = {
  id: 'unknown',
  name: 'Unknown Card',
  character: 'colorless',
  rarity: 'common',
  type: 'Attack',
  cost: 0,
  text: '???',
  upgraded: false,
  keywords: [],
};

/**
 * Look up a card by ID. Returns a placeholder if not found.
 */
export function getCardOrPlaceholder(id: string): PlayerCard {
  return cardMap.get(id) ?? { ...PLACEHOLDER_CARD, id };
}
