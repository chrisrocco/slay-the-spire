/**
 * rewardHandler.ts — Combat reward generation and selection.
 *
 * Handles reward generation after combat and player reward picks.
 */
import type { CombatGameState } from './state/combatState.js';
import type { RewardState } from '@slay-online/shared';
import {
  ironcladCards,
  silentCards,
  defectCards,
  watcherCards,
  relics,
  potions,
} from '@slay-online/shared';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type Character = 'ironclad' | 'silent' | 'defect' | 'watcher';

/** Return card pool for a character, excluding starter cards. */
function getCardPool(character: Character) {
  const allCards =
    character === 'ironclad'
      ? ironcladCards
      : character === 'silent'
        ? silentCards
        : character === 'defect'
          ? defectCards
          : watcherCards;
  // Exclude starter rarity and upgraded versions of starters
  return allCards.filter(c => c.rarity !== 'starter');
}

/** Draw n unique random items from an array using the rng function. */
function drawRandom<T>(pool: T[], n: number, rng: () => number): T[] {
  const copy = [...pool];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy[idx]!);
    copy.splice(idx, 1);
  }
  return result;
}

/** Collect all relic IDs currently owned by any player. */
function getAllOwnedRelics(state: CombatGameState): Set<string> {
  const owned = new Set<string>();
  for (const player of state.players) {
    for (const r of player.relics) owned.add(r);
  }
  return owned;
}

/** Build relic pool filtered by categories, excluding owned relics. */
function getAvailableRelics(
  excludeIds: Set<string>,
  categories: Array<'common' | 'uncommon' | 'rare'>,
): typeof relics[number][] {
  return relics.filter(
    r => (categories as string[]).includes(r.category) && !excludeIds.has(r.id),
  );
}

/** Get available boss relics, excluding owned ones. */
function getAvailableBossRelics(excludeIds: Set<string>): typeof relics[number][] {
  return relics.filter(r => r.category === 'boss' && !excludeIds.has(r.id));
}

/**
 * Draw a relic from the common/uncommon/rare pool using weighted rarity:
 * 50% common, 33% uncommon, 17% rare.
 */
function drawRandomRelic(
  excludeIds: Set<string>,
  rng: () => number,
): string | null {
  const roll = rng();
  let categories: Array<'common' | 'uncommon' | 'rare'>;
  if (roll < 0.5) {
    categories = ['common'];
  } else if (roll < 0.83) {
    categories = ['uncommon'];
  } else {
    categories = ['rare'];
  }

  let pool = getAvailableRelics(excludeIds, categories);
  // If that category is exhausted, try all tiers
  if (pool.length === 0) {
    pool = getAvailableRelics(excludeIds, ['common', 'uncommon', 'rare']);
  }
  if (pool.length === 0) return null;

  const picked = pool[Math.floor(rng() * pool.length)]!;
  return picked.id;
}

/** Get potion limit for a player. */
function getPotionLimit(playerRelics: string[]): number {
  return playerRelics.includes('potion_belt') ? 5 : 3;
}

/**
 * Check if any player has the Golden Idol relic.
 * If so, gold rewards are increased by 1.
 */
function hasGoldenIdol(state: CombatGameState): boolean {
  return state.players.some(p => p.relics.includes('golden_idol'));
}

/**
 * Determine card count for a player's card reward, accounting for relics.
 */
function getCardRewardCount(playerRelics: string[]): number {
  let count = 3;
  if (playerRelics.includes('question_card')) count += 1;
  if (playerRelics.includes('busted_crown')) count = Math.max(1, count - 2);
  return count;
}

/**
 * Generate card reward IDs for a single player.
 * Golden Ticket guarantees one rare card (if present as relic).
 */
function generateCardRewardForPlayer(
  state: CombatGameState,
  playerIdx: number,
  rng: () => number,
): { cardIds: string[]; upgraded: boolean; hasRare?: boolean } {
  const player = state.players[playerIdx]!;
  const character = player.character as Character;
  const pool = getCardPool(character);
  const ownedCards = new Set([
    ...player.drawPile,
    ...player.discardPile,
    ...player.hand,
    ...player.exhaustPile,
  ]);

  // Base pool: non-upgraded cards not already in deck
  const basePool = pool.filter(c => !c.upgraded && !ownedCards.has(c.id));
  const count = getCardRewardCount(player.relics);

  const hasGoldenTicket = player.relics.includes('golden_ticket');
  let cardIds: string[];
  let hasRare = false;

  if (hasGoldenTicket) {
    // Guarantee one rare card
    const rarePool = basePool.filter(c => c.rarity === 'rare');
    const otherPool = basePool.filter(c => c.rarity !== 'rare');

    const rareCards = drawRandom(rarePool, 1, rng);
    const otherCards = drawRandom(otherPool, count - 1, rng);
    cardIds = [...rareCards.map(c => c.id), ...otherCards.map(c => c.id)];
    hasRare = rareCards.length > 0;
  } else {
    const drawn = drawRandom(basePool, count, rng);
    cardIds = drawn.map(c => c.id);
  }

  return { cardIds, upgraded: false, ...(hasGoldenTicket ? { hasRare } : {}) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Extended reward state that may include extra relic and boss relic choices. */
export interface ExtendedRewardState extends RewardState {
  extraRelicReward?: string | null;
  bossRelicChoices?: string[];
}

/**
 * Generate rewards after combat.
 * - encounter: gold (10-20) + card rewards per player
 * - elite: gold (25-35) + card rewards + potion + relic
 * - boss: gold + card rewards (boss relic selection handled separately)
 */
export function generateRewards(
  state: CombatGameState,
  roomType: 'encounter' | 'elite' | 'boss',
  rng: () => number,
): ExtendedRewardState {
  const goldBonus = hasGoldenIdol(state) ? 1 : 0;

  // Initialize playerChoices for all players
  const playerChoices: RewardState['playerChoices'] = {};
  for (const player of state.players) {
    playerChoices[player.id] = {
      cardPicked: null,
      potionPicked: false,
      relicPicked: false,
      skipped: false,
    };
  }

  if (roomType === 'encounter') {
    const baseGold = 10 + Math.floor(rng() * 11); // 10-20
    const gold = baseGold + goldBonus;

    const cardRewards = state.players.map((_, idx) =>
      generateCardRewardForPlayer(state, idx, rng),
    );

    return {
      gold,
      cardRewards,
      potionReward: null,
      relicReward: null,
      playerChoices,
    };
  }

  if (roomType === 'elite') {
    const baseGold = 25 + Math.floor(rng() * 11); // 25-35
    const gold = baseGold + goldBonus;

    const cardRewards = state.players.map((_, idx) =>
      generateCardRewardForPlayer(state, idx, rng),
    );

    // Potion reward — only if at least one player can hold it
    let potionReward: string | null = null;
    const anyPlayerCanHoldPotion = state.players.some(
      p => p.potions.length < getPotionLimit(p.relics),
    );
    if (anyPlayerCanHoldPotion && potions.length > 0) {
      const potionPool = [...potions];
      potionReward = potionPool[Math.floor(rng() * potionPool.length)]!.id;
    }

    // Relic reward — from common/uncommon/rare pool
    const owned = getAllOwnedRelics(state);
    const relicReward = drawRandomRelic(owned, rng);

    // Black Star gives extra relic from elites
    const hasBlackStar = state.players.some(p => p.relics.includes('black_star'));
    let extraRelicReward: string | null = null;
    if (hasBlackStar && relicReward) {
      const updatedOwned = new Set(owned);
      if (relicReward) updatedOwned.add(relicReward);
      extraRelicReward = drawRandomRelic(updatedOwned, rng);
    }

    const result: ExtendedRewardState = {
      gold,
      cardRewards,
      potionReward,
      relicReward,
      playerChoices,
    };
    if (hasBlackStar) result.extraRelicReward = extraRelicReward;

    return result;
  }

  // roomType === 'boss'
  const baseGold = 0; // Boss rewards focus on relics/cards
  const gold = baseGold + goldBonus;

  const cardRewards = state.players.map((_, idx) =>
    generateCardRewardForPlayer(state, idx, rng),
  );

  return {
    gold,
    cardRewards,
    potionReward: null,
    relicReward: null,
    playerChoices,
  };
}

/**
 * Generate boss relic choices.
 * Offers (playerCount + 1) unique boss relics (or 3 for solo).
 */
export function generateBossRelicChoices(
  state: CombatGameState,
  playerCount: number,
  rng: () => number,
): string[] {
  const count = playerCount === 1 ? 3 : playerCount + 1;
  const owned = getAllOwnedRelics(state);
  const pool = getAvailableBossRelics(owned);
  const drawn = drawRandom(pool, count, rng);
  return drawn.map(r => r.id);
}

// ---------------------------------------------------------------------------
// Reward selection handlers
// ---------------------------------------------------------------------------

/** Look up card data across all character pools. */
function findCardById(cardId: string) {
  const allCards = [...ironcladCards, ...silentCards, ...defectCards, ...watcherCards];
  return allCards.find(c => c.id === cardId) ?? null;
}

/** Get the upgraded version of a card ID (appends '_upgraded'). */
function getUpgradedCardId(cardId: string): string {
  return cardId + '_upgraded';
}

/** Check if the upgraded variant exists in any card pool. */
function upgradedVariantExists(cardId: string): boolean {
  const upgradedId = getUpgradedCardId(cardId);
  const allCards = [...ironcladCards, ...silentCards, ...defectCards, ...watcherCards];
  return allCards.some(c => c.id === upgradedId);
}

/**
 * Apply Egg relic auto-upgrades to a card being added to the deck.
 * Returns the card ID to actually add (possibly the upgraded version).
 */
function applyEggUpgrade(cardId: string, playerRelics: string[]): string {
  const card = findCardById(cardId);
  if (!card) return cardId;

  const hasMoltenEgg = playerRelics.includes('molten_egg');
  const hasFrozenEgg = playerRelics.includes('frozen_egg');
  const hasToxicEgg = playerRelics.includes('toxic_egg');

  if (
    (hasMoltenEgg && card.type === 'Attack') ||
    (hasFrozenEgg && card.type === 'Power') ||
    (hasToxicEgg && card.type === 'Skill')
  ) {
    // Only upgrade if not already upgraded and upgraded version exists
    if (!card.upgraded && upgradedVariantExists(cardId)) {
      return getUpgradedCardId(cardId);
    }
  }
  return cardId;
}

/**
 * Handle REWARD_PICK_CARD: player picks a card from reward options.
 * - Special cardId 'max_hp' with Singing Bowl gives 2 Max HP instead.
 * - Egg relics auto-upgrade the card type.
 * - Ceramic Fish gives +1 gold.
 */
export function handleRewardPickCard(
  state: CombatGameState,
  playerId: string,
  cardId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return state;

  const player = state.players[playerIdx]!;

  // Singing Bowl: choosing 'max_hp' gives 2 Max HP instead of a card
  if (cardId === 'max_hp' && player.relics.includes('singing_bowl')) {
    const updatedPlayer = {
      ...player,
      maxHp: player.maxHp + 2,
    };
    const updatedPlayers = [...state.players];
    updatedPlayers[playerIdx] = updatedPlayer;

    return {
      ...state,
      players: updatedPlayers,
      rewardState: {
        ...state.rewardState,
        playerChoices: {
          ...state.rewardState.playerChoices,
          [playerId]: { ...playerChoice, cardPicked: cardId },
        },
      },
    };
  }

  // Apply egg auto-upgrades
  const actualCardId = applyEggUpgrade(cardId, player.relics);

  // Ceramic Fish: +1 gold when adding card to deck
  const goldBonus = player.relics.includes('ceramic_fish') ? 1 : 0;

  const updatedPlayer = {
    ...player,
    drawPile: [...player.drawPile, actualCardId],
    gold: player.gold + goldBonus,
  };
  const updatedPlayers = [...state.players];
  updatedPlayers[playerIdx] = updatedPlayer;

  return {
    ...state,
    players: updatedPlayers,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, cardPicked: cardId },
      },
    },
  };
}

/**
 * Handle REWARD_PICK_POTION: player picks the potion reward.
 * Validates potion limit (3 default, +2 with Potion Belt).
 */
export function handleRewardPickPotion(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  const potionId = state.rewardState.potionReward;
  if (!potionId) return state;

  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return state;

  const player = state.players[playerIdx]!;
  const limit = getPotionLimit(player.relics);

  // Reject if at potion limit
  if (player.potions.length >= limit) return state;

  const updatedPlayer = {
    ...player,
    potions: [...player.potions, potionId],
  };
  const updatedPlayers = [...state.players];
  updatedPlayers[playerIdx] = updatedPlayer;

  return {
    ...state,
    players: updatedPlayers,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, potionPicked: true },
      },
    },
  };
}

/**
 * Process on-pickup relic effects.
 * Returns updated player state after picking up a relic.
 */
function applyRelicPickupEffects(
  player: CombatGameState['players'][0],
  relicId: string,
  rng: () => number,
): CombatGameState['players'][0] {
  switch (relicId) {
    case 'strawberry':
      return { ...player, maxHp: player.maxHp + 1 };
    case 'mango':
      return { ...player, maxHp: player.maxHp + 1 };
    case 'pear':
      return { ...player, maxHp: player.maxHp + 2 };
    case 'old_coin':
      return { ...player, gold: player.gold + 3 };
    case 'war_paint': {
      // Upgrade 2 random Skills in deck
      return upgradeRandomCardsOfType(player, 'Skill', 2, rng);
    }
    case 'whetstone': {
      // Upgrade 2 random Attacks in deck
      return upgradeRandomCardsOfType(player, 'Attack', 2, rng);
    }
    default:
      return player;
  }
}

/**
 * Upgrade up to `count` random cards of a given type in the player's drawPile.
 */
function upgradeRandomCardsOfType(
  player: CombatGameState['players'][0],
  cardType: string,
  count: number,
  rng: () => number,
): CombatGameState['players'][0] {
  const allCards = [...ironcladCards, ...silentCards, ...defectCards, ...watcherCards];
  // Use a typed Map with string keys for lookup
  const cardMap = new Map<string, typeof allCards[0]>(allCards.map(c => [c.id as string, c]));

  // Find indices of upgradeable cards of the given type in draw pile
  const upgradeable: number[] = [];
  for (let i = 0; i < player.drawPile.length; i++) {
    const cardId = player.drawPile[i]!;
    const card = cardMap.get(cardId);
    if (card && card.type === cardType && !card.upgraded && upgradedVariantExists(cardId)) {
      upgradeable.push(i);
    }
  }

  // Randomly pick up to `count` of them
  const toUpgrade = drawRandom(upgradeable, count, rng);
  const newDrawPile = [...player.drawPile];
  for (const idx of toUpgrade) {
    newDrawPile[idx] = getUpgradedCardId(newDrawPile[idx]!);
  }

  return { ...player, drawPile: newDrawPile };
}

/**
 * Handle REWARD_PICK_RELIC: player picks the relic reward.
 * Processes on-pickup relic effects.
 */
export function handleRewardPickRelic(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  const relicId = state.rewardState.relicReward;
  if (!relicId) return state;

  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return state;

  const player = state.players[playerIdx]!;

  // Add relic to player
  const playerWithRelic = {
    ...player,
    relics: [...player.relics, relicId],
  };

  // Apply on-pickup effects with a deterministic fallback rng
  const rng = () => 0.5;
  const updatedPlayer = applyRelicPickupEffects(playerWithRelic, relicId, rng);

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIdx] = updatedPlayer;

  return {
    ...state,
    players: updatedPlayers,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, relicPicked: true },
      },
    },
  };
}

/**
 * Handle REWARD_SKIP: player skips their reward without modifying deck/items.
 */
export function handleRewardSkip(
  state: CombatGameState,
  playerId: string,
): CombatGameState {
  if (!state.rewardState) return state;

  const playerChoice = state.rewardState.playerChoices[playerId];
  if (!playerChoice) return state;

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      playerChoices: {
        ...state.rewardState.playerChoices,
        [playerId]: { ...playerChoice, skipped: true },
      },
    },
  };
}

/**
 * Check if all living players have made a reward choice (picked or skipped).
 */
export function areAllRewardsChosen(state: CombatGameState): boolean {
  if (!state.rewardState) return false;

  for (const player of state.players) {
    const choice = state.rewardState.playerChoices[player.id];
    if (!choice) return false;

    const hasMadeChoice =
      choice.cardPicked !== null ||
      choice.potionPicked ||
      choice.relicPicked ||
      choice.skipped ||
      (choice as any).bossRelicPicked != null;

    if (!hasMadeChoice) return false;
  }
  return true;
}
