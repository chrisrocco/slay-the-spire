/**
 * campfireHandler.ts
 * Handles entering campfire rooms and resolving player choices.
 */
import type { Room } from '../../rooms/Room.js';
import { relics } from '@slay-online/shared';

type CampfireChoice = 'rest' | 'smith' | 'dig' | 'lift' | 'toke';

/**
 * Enter a campfire room: set phase to CAMPFIRE, initialize campfireState.
 */
export function enterCampfire(room: Room): void {
  if (!room.gameState) throw new Error('No game state');

  const playerChoices: Record<string, CampfireChoice | null> = {};
  for (const player of room.gameState.players) {
    playerChoices[player.id] = null;
  }

  room.gameState = {
    ...room.gameState,
    gamePhase: 'CAMPFIRE',
    campfireState: { playerChoices },
  };
}

/**
 * Resolve a campfire choice for a player.
 * When all players have chosen, transition back to MAP.
 */
export function resolveCampfireChoice(
  room: Room,
  playerId: string,
  choice: CampfireChoice,
  cardId: string | undefined,
  rng: () => number,
): void {
  if (!room.gameState) throw new Error('No game state');
  if (!room.gameState.campfireState) throw new Error('No campfire state');

  const playerIndex = room.gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) throw new Error(`Player not found: ${playerId}`);

  const player = room.gameState.players[playerIndex]!;

  // Validate choice against relic restrictions
  if (choice === 'rest' && player.relics.includes('coffee_dripper')) {
    throw new Error('Coffee Dripper prevents resting');
  }
  if (choice === 'smith' && player.relics.includes('fusion_hammer')) {
    throw new Error('Fusion Hammer prevents smithing');
  }
  if (choice === 'dig' && !player.relics.includes('shovel')) {
    throw new Error('Dig requires Shovel relic');
  }
  if (choice === 'lift' && !player.relics.includes('girya')) {
    throw new Error('Lift requires Girya relic');
  }
  if (choice === 'toke' && !player.relics.includes('peace_pipe')) {
    throw new Error('Toke requires Peace Pipe relic');
  }

  // Apply choice effect
  const players = [...room.gameState.players];

  switch (choice) {
    case 'rest': {
      // Heal 3 HP + 3 bonus from Regal Pillow
      let healAmount = 3;
      if (player.relics.includes('regal_pillow')) {
        healAmount += 3;
      }
      // Eternal Feather: heal 3 per 5 cards in deck (draw + discard + exhaust)
      if (player.relics.includes('eternal_feather')) {
        const deckSize = player.drawPile.length + player.discardPile.length + player.exhaustPile.length;
        healAmount += Math.floor(deckSize / 5) * 3;
      }
      const updatedPlayer = { ...player, hp: Math.min(player.maxHp, player.hp + healAmount) };
      players[playerIndex] = updatedPlayer;
      break;
    }

    case 'smith': {
      if (!cardId) throw new Error('smith requires a cardId');
      // Find the card in draw pile or discard pile or hand
      const allPiles = ['drawPile', 'discardPile', 'hand'] as const;
      let upgraded = false;
      for (const pile of allPiles) {
        const pileArr = [...player[pile]];
        const idx = pileArr.indexOf(cardId);
        if (idx !== -1) {
          // Only upgrade if not already upgraded
          const upgradedId = cardId.endsWith('_upgraded') ? cardId : `${cardId}_upgraded`;
          if (upgradedId !== cardId) {
            pileArr[idx] = upgradedId;
            players[playerIndex] = { ...player, [pile]: pileArr };
          }
          upgraded = true;
          break;
        }
      }
      if (!upgraded) throw new Error(`Card not found in any pile: ${cardId}`);
      break;
    }

    case 'dig': {
      // Gain a random common/uncommon relic
      const availableRelics = relics.filter(
        (r) => (r.category === 'common' || r.category === 'uncommon') &&
          !room.gameState!.players.some((p) => p.relics.includes(r.id)),
      );
      const shuffled = [...availableRelics].sort(() => rng() - 0.5);
      const relic = shuffled[0];
      if (relic) {
        players[playerIndex] = { ...player, relics: [...player.relics, relic.id] };
      }
      break;
    }

    case 'lift': {
      // Gain 1 Strength (tracked as strengthTokens on player — but that's combat only)
      // For campfire, we add to a persistent strength which doesn't exist in base PlayerState
      // The plan says "gain 1 Strength, Girya, up to 3" - this would need a new field
      // For now, just record the choice without effect (Strength is combat-only)
      break;
    }

    case 'toke': {
      // Remove a random card from deck (Peace Pipe)
      const allCards = [...player.drawPile];
      if (allCards.length > 0) {
        const shuffledCards = allCards.sort(() => rng() - 0.5);
        const toRemove = shuffledCards[0]!;
        players[playerIndex] = {
          ...player,
          drawPile: player.drawPile.filter((id) => id !== toRemove),
        };
      }
      break;
    }
  }

  // Update campfire state with player's choice
  const newPlayerChoices = {
    ...room.gameState.campfireState.playerChoices,
    [playerId]: choice,
  };

  room.gameState = {
    ...room.gameState,
    players,
    campfireState: { playerChoices: newPlayerChoices },
  };

  // Check if all players have chosen
  const allChosen = room.gameState.players.every(
    (p) => newPlayerChoices[p.id] !== null && newPlayerChoices[p.id] !== undefined,
  );

  if (allChosen) {
    room.gameState = { ...room.gameState, gamePhase: 'MAP' };
  }
}
