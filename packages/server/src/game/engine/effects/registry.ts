import type { CardEffect } from './types.js';

/**
 * Card effect registry — maps card IDs to their ordered effect arrays.
 * Starter deck cards are populated here; remaining Act 1 cards
 * will be added in Plan 02-07 after all mechanics are implemented.
 */
const cardEffects: Record<string, CardEffect[]> = {
  // ===== IRONCLAD STARTERS =====
  strike_r: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_r_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_r: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_r_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  bash: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' },
  ],
  bash_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'chosen' },
  ],

  // ===== SILENT STARTERS =====
  strike_g: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_g_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_g: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_g_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  neutralize: [
    { kind: 'DealDamage', hits: 1, amount: 3, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'chosen' },
  ],
  neutralize_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
  ],
  survivor: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  survivor_upgraded: [
    { kind: 'GainBlock', amount: 11, target: 'self' },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],

  // ===== DEFECT STARTERS =====
  strike_b: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_b_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_b: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_b_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  zap: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  zap_upgraded: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  dualcast: [
    { kind: 'Evoke', count: 2 },
  ],
  dualcast_upgraded: [
    { kind: 'Evoke', count: 2 },
  ],

  // ===== WATCHER STARTERS =====
  strike_w: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_w_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_w: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_w_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  eruption: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
  ],
  eruption_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
  ],
  vigilance: [
    { kind: 'GainBlock', amount: 8, target: 'any_player' },
    { kind: 'EnterStance', stance: 'calm' },
  ],
  vigilance_upgraded: [
    { kind: 'GainBlock', amount: 12, target: 'any_player' },
    { kind: 'EnterStance', stance: 'calm' },
  ],
};

const UNIMPLEMENTED_FALLBACK: CardEffect[] = [
  { kind: 'Unimplemented', description: 'Not yet mapped' },
];

/**
 * Get the effect array for a card ID. Returns Unimplemented stub for unmapped cards.
 */
export function getCardEffects(cardId: string): CardEffect[] {
  return cardEffects[cardId] ?? UNIMPLEMENTED_FALLBACK;
}

export { cardEffects };
