/**
 * roomHandlers/index.ts
 * Barrel export for all room type handlers.
 */
export { enterEncounter } from './encounterHandler.js';
export { enterElite } from './eliteHandler.js';
export { enterBoss } from './bossHandler.js';
export { enterEvent, resolveEventChoice } from './eventHandler.js';
export { enterCampfire, resolveCampfireChoice } from './campfireHandler.js';
export { enterTreasure } from './treasureHandler.js';
export {
  enterMerchant,
  handleMerchantBuy,
  handleMerchantRemoveCard,
  handleMerchantLeave,
} from './merchantHandler.js';
