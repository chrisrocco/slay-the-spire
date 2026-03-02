/**
 * merchantHandler.ts
 * Handles entering merchant rooms and buy/remove/leave interactions.
 */
import type { Room } from '../../rooms/Room.js';
import {
  relics,
  potions,
  ironcladCards,
  silentCards,
  defectCards,
  watcherCards,
} from '@slay-online/shared';
import type { PlayerCard } from '@slay-online/shared';

type ItemType = 'card' | 'relic' | 'potion';

// Character-specific card pools (commons and uncommons)
function getCharacterCards(character: string): PlayerCard[] {
  const allCards: PlayerCard[] = (() => {
    switch (character) {
      case 'ironclad': return ironcladCards as unknown as PlayerCard[];
      case 'silent': return silentCards as unknown as PlayerCard[];
      case 'defect': return defectCards as unknown as PlayerCard[];
      case 'watcher': return watcherCards as unknown as PlayerCard[];
      default: return ironcladCards as unknown as PlayerCard[];
    }
  })();
  // Filter to buyable cards (common + uncommon, not starter, not upgraded)
  return allCards.filter(
    (c) => (c.rarity === 'common' || c.rarity === 'uncommon') && !c.upgraded,
  );
}

// Colorless cards
function getColorlessCards(): PlayerCard[] {
  const allCards = [
    ...ironcladCards as unknown as PlayerCard[],
  ];
  return allCards.filter((c) => c.character === 'colorless' && !c.upgraded);
}

function randomPrice(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Enter the merchant: generate inventory, apply relic bonuses, set phase to MERCHANT.
 */
export function enterMerchant(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  const players = [...room.gameState.players];

  // Apply Meal Ticket: heal 3 HP for each player who has it
  for (let i = 0; i < players.length; i++) {
    const player = players[i]!;
    if (player.relics.includes('meal_ticket')) {
      players[i] = { ...player, hp: Math.min(player.maxHp, player.hp + 3) };
    }
  }

  // Check Smiling Mask (any player)
  const hasSmillingMask = room.gameState.players.some((p) => p.relics.includes('smiling_mask'));
  const removeCost = hasSmillingMask ? 0 : 50;

  // Generate character-specific cards (from first player's character)
  const character = room.gameState.players[0]?.character ?? 'ironclad';
  const characterCardPool = getCharacterCards(character);
  const shuffledCharCards = [...characterCardPool].sort(() => rng() - 0.5);
  const selectedCharCards = shuffledCharCards.slice(0, 3);

  // Colorless cards
  const colorlessPool = getColorlessCards();
  const shuffledColorless = [...colorlessPool].sort(() => rng() - 0.5);
  const selectedColorless = shuffledColorless.slice(0, 2);

  const cardPool = [
    ...selectedCharCards.map((c) => ({ cardId: c.id, price: randomPrice(50, 150, rng) })),
    ...selectedColorless.map((c) => ({ cardId: c.id, price: randomPrice(50, 150, rng) })),
  ];

  // Generate relics (common/uncommon, not already owned)
  const ownedRelicIds = new Set(room.gameState.players.flatMap((p) => p.relics));
  const availableRelics = relics.filter(
    (r) => (r.category === 'common' || r.category === 'uncommon') && !ownedRelicIds.has(r.id),
  );
  const shuffledRelics = [...availableRelics].sort(() => rng() - 0.5);
  const relicPool = shuffledRelics.slice(0, 2).map((r) => ({
    relicId: r.id,
    price: randomPrice(150, 300, rng),
  }));

  // Generate potions
  const shuffledPotions = [...potions].sort(() => rng() - 0.5);
  const potionPool = shuffledPotions.slice(0, 3).map((p) => ({
    potionId: p.id,
    price: randomPrice(50, 100, rng),
  }));

  room.gameState = {
    ...room.gameState,
    players,
    gamePhase: 'MERCHANT',
    merchantState: {
      cardPool,
      relicPool,
      potionPool,
      removeCost,
      playersRemoved: [],
    },
  };
}

/**
 * Handle buying an item from the merchant.
 */
export function handleMerchantBuy(
  room: Room,
  playerId: string,
  itemType: ItemType,
  itemId: string,
): void {
  if (!room.gameState) throw new Error('No game state');
  if (!room.gameState.merchantState) throw new Error('No merchant state');

  const playerIndex = room.gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) throw new Error(`Player not found: ${playerId}`);

  const player = { ...room.gameState.players[playerIndex]! };
  const ms = room.gameState.merchantState;

  switch (itemType) {
    case 'card': {
      const item = ms.cardPool.find((c) => c.cardId === itemId);
      if (!item) throw new Error(`Card not in merchant pool: ${itemId}`);
      if (player.gold < item.price) throw new Error(`Insufficient gold: need ${item.price}, have ${player.gold}`);

      player.gold -= item.price;
      player.discardPile = [...player.discardPile, itemId];

      // Remove from pool
      const newCardPool = ms.cardPool.filter((c) => c.cardId !== itemId);
      const players = [...room.gameState.players];
      players[playerIndex] = player;
      room.gameState = {
        ...room.gameState,
        players,
        merchantState: { ...ms, cardPool: newCardPool },
      };
      break;
    }

    case 'relic': {
      const item = ms.relicPool.find((r) => r.relicId === itemId);
      if (!item) throw new Error(`Relic not in merchant pool: ${itemId}`);
      if (player.gold < item.price) throw new Error(`Insufficient gold: need ${item.price}, have ${player.gold}`);

      player.gold -= item.price;
      player.relics = [...player.relics, itemId];

      const newRelicPool = ms.relicPool.filter((r) => r.relicId !== itemId);
      const players = [...room.gameState.players];
      players[playerIndex] = player;
      room.gameState = {
        ...room.gameState,
        players,
        merchantState: { ...ms, relicPool: newRelicPool },
      };
      break;
    }

    case 'potion': {
      const item = ms.potionPool.find((p) => p.potionId === itemId);
      if (!item) throw new Error(`Potion not in merchant pool: ${itemId}`);
      if (player.gold < item.price) throw new Error(`Insufficient gold: need ${item.price}, have ${player.gold}`);

      const maxPotions = player.relics.includes('potion_belt') ? 5 : 3;
      if (player.potions.length >= maxPotions) throw new Error('Potion slots full');

      player.gold -= item.price;
      player.potions = [...player.potions, itemId];

      const newPotionPool = ms.potionPool.filter((p) => p.potionId !== itemId);
      const players = [...room.gameState.players];
      players[playerIndex] = player;
      room.gameState = {
        ...room.gameState,
        players,
        merchantState: { ...ms, potionPool: newPotionPool },
      };
      break;
    }

    default:
      throw new Error(`Unknown item type: ${itemType}`);
  }
}

/**
 * Handle removing a card at the merchant (once per player per visit).
 */
export function handleMerchantRemoveCard(
  room: Room,
  playerId: string,
  cardId: string,
): void {
  if (!room.gameState) throw new Error('No game state');
  if (!room.gameState.merchantState) throw new Error('No merchant state');

  const ms = room.gameState.merchantState;

  // Check once-per-visit limit
  if (ms.playersRemoved.includes(playerId)) {
    throw new Error('Player already removed a card this visit');
  }

  const playerIndex = room.gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) throw new Error(`Player not found: ${playerId}`);

  const player = { ...room.gameState.players[playerIndex]! };

  if (player.gold < ms.removeCost) {
    throw new Error(`Insufficient gold: need ${ms.removeCost}, have ${player.gold}`);
  }

  // Find card in all piles
  let removed = false;
  for (const pile of ['drawPile', 'discardPile', 'hand'] as const) {
    if (player[pile].includes(cardId)) {
      player[pile] = player[pile].filter((id) => id !== cardId);
      removed = true;
      break;
    }
  }

  if (!removed) throw new Error(`Card not found: ${cardId}`);

  player.gold -= ms.removeCost;

  const players = [...room.gameState.players];
  players[playerIndex] = player;

  room.gameState = {
    ...room.gameState,
    players,
    merchantState: {
      ...ms,
      playersRemoved: [...ms.playersRemoved, playerId],
    },
  };
}

/**
 * Handle leaving the merchant: transition back to MAP.
 */
export function handleMerchantLeave(room: Room): void {
  if (!room.gameState) throw new Error('No game state');
  room.gameState = { ...room.gameState, gamePhase: 'MAP' };
}
