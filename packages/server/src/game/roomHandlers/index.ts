/**
 * roomHandlers/index.ts — Barrel export for all room type handlers.
 *
 * Full implementation in Plan 05-03.
 */
import type { Room } from '../../rooms/Room.js';

// ===== Encounter Handler =====

/**
 * Enter an encounter room: draw 1 enemy per player, start combat.
 */
export function enterEncounter(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full encounter handler
  throw new Error('enterEncounter: not yet implemented (Plan 05-03)');
}

// ===== Elite Handler =====

/**
 * Enter an elite room: select an elite enemy, start combat.
 */
export function enterElite(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full elite handler
  throw new Error('enterElite: not yet implemented (Plan 05-03)');
}

// ===== Boss Handler =====

/**
 * Enter the boss room: use room.bossId, start boss combat.
 */
export function enterBoss(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full boss handler
  throw new Error('enterBoss: not yet implemented (Plan 05-03)');
}

// ===== Event Handler =====

/**
 * Enter an event room: draw a random event card, set gamePhase to EVENT.
 */
export function enterEvent(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full event handler
  throw new Error('enterEvent: not yet implemented (Plan 05-03)');
}

/**
 * Resolve a player's event choice.
 */
export function resolveEventChoice(
  room: Room,
  playerId: string,
  choiceIndex: number,
  rng: () => number = Math.random,
): void {
  // TODO: Plan 05-03 will implement full event choice resolution
  throw new Error('resolveEventChoice: not yet implemented (Plan 05-03)');
}

// ===== Campfire Handler =====

/**
 * Enter a campfire room: set gamePhase to CAMPFIRE.
 */
export function enterCampfire(room: Room): void {
  // TODO: Plan 05-03 will implement full campfire handler
  throw new Error('enterCampfire: not yet implemented (Plan 05-03)');
}

/**
 * Resolve a player's campfire choice.
 */
export function resolveCampfireChoice(
  room: Room,
  playerId: string,
  choice: string,
  cardId: string | undefined,
  rng: () => number = Math.random,
): void {
  // TODO: Plan 05-03 will implement full campfire choice resolution
  throw new Error('resolveCampfireChoice: not yet implemented (Plan 05-03)');
}

// ===== Treasure Handler =====

/**
 * Enter a treasure room: give each player a relic, transition to MAP.
 */
export function enterTreasure(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full treasure handler
  throw new Error('enterTreasure: not yet implemented (Plan 05-03)');
}

// ===== Merchant Handler =====

/**
 * Enter a merchant room: generate inventory, set gamePhase to MERCHANT.
 */
export function enterMerchant(room: Room, rng: () => number = Math.random): void {
  // TODO: Plan 05-03 will implement full merchant handler
  throw new Error('enterMerchant: not yet implemented (Plan 05-03)');
}

/**
 * Handle a merchant buy.
 */
export function handleMerchantBuy(
  room: Room,
  playerId: string,
  itemType: string,
  itemId: string,
): void {
  // TODO: Plan 05-03 will implement full merchant buy
  throw new Error('handleMerchantBuy: not yet implemented (Plan 05-03)');
}

/**
 * Handle card removal at merchant.
 */
export function handleMerchantRemoveCard(
  room: Room,
  playerId: string,
  cardId: string,
): void {
  // TODO: Plan 05-03 will implement full merchant remove card
  throw new Error('handleMerchantRemoveCard: not yet implemented (Plan 05-03)');
}

/**
 * Handle merchant leave: transition to MAP.
 */
export function handleMerchantLeave(room: Room): void {
  // TODO: Plan 05-03 will implement full merchant leave
  throw new Error('handleMerchantLeave: not yet implemented (Plan 05-03)');
}
