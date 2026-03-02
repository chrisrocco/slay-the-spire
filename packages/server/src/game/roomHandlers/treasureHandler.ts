/**
 * treasureHandler.ts
 * Handles entering treasure rooms.
 */
import type { Room } from '../../rooms/Room.js';
import { relics, curses } from '@slay-online/shared';

/**
 * Enter a treasure room: give each player a relic, handle relic interactions, transition to MAP.
 * Treasure is resolved instantly (no player interaction needed).
 */
export function enterTreasure(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  const players = [...room.gameState.players];

  for (let i = 0; i < players.length; i++) {
    const player = { ...players[i]! };

    // Check Matryoshka: gives 2 relics instead of 1
    const relicCount = player.relics.includes('matryoshka') ? 2 : 1;

    // Check Cursed Key: gain a curse for each chest opened
    if (player.relics.includes('cursed_key')) {
      const cursePool = [...curses].sort(() => rng() - 0.5);
      const curse = cursePool[0];
      if (curse) {
        player.drawPile = [...player.drawPile, `curse_${curse.id}`];
      }
    }

    // Give relics from common pool (first treasure) or uncommon (later)
    // Track owned relics to avoid duplicates
    const ownedRelics = new Set([
      ...room.gameState.players.flatMap((p) => p.relics),
      ...player.relics,
    ]);

    const availableCommon = relics.filter(
      (r) => r.category === 'common' && !ownedRelics.has(r.id),
    );
    const shuffledRelics = [...availableCommon].sort(() => rng() - 0.5);

    const gained: string[] = [];
    for (let j = 0; j < relicCount; j++) {
      const relic = shuffledRelics[j];
      if (relic) {
        gained.push(relic.id);
        ownedRelics.add(relic.id);
      }
    }

    player.relics = [...player.relics, ...gained];
    players[i] = player;
  }

  room.gameState = {
    ...room.gameState,
    players,
    gamePhase: 'MAP', // treasure is instant
  };
}
