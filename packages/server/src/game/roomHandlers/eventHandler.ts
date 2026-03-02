/**
 * eventHandler.ts
 * Handles entering event rooms and resolving event choices.
 */
import type { Room } from '../../rooms/Room.js';
import { events, relics, curses } from '@slay-online/shared';

/**
 * Enter an event room: draw random event, set phase to EVENT, initialize eventState.
 */
export function enterEvent(room: Room, rng: () => number): void {
  if (!room.gameState) throw new Error('No game state');

  // Check Tiny Chest: every 4th ? room is a treasure
  // (This tracking would be on game state — if implemented, handle separately)

  // Pick a random event
  const shuffled = [...events].sort(() => rng() - 0.5);
  const event = shuffled[0]!;

  // Initialize playerChoices with null for each player
  const playerChoices: Record<string, number | null> = {};
  for (const player of room.gameState.players) {
    playerChoices[player.id] = null;
  }

  room.gameState = {
    ...room.gameState,
    gamePhase: 'EVENT',
    eventState: {
      eventId: event.id,
      playerChoices,
    },
  };
}

/**
 * Parse and apply an event effect to a single player.
 * Effects from events.ts are text strings — we parse them here.
 */
function applyEventEffect(
  room: Room,
  playerId: string,
  effect: string,
  rng: () => number,
): void {
  if (!room.gameState) return;

  const playerIndex = room.gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return;

  const players = [...room.gameState.players];
  const player = { ...players[playerIndex]! };

  // Parse effect string
  // "Nothing happens." - no effect
  if (effect === 'Nothing happens.' || effect.includes('Nothing happens')) {
    return;
  }

  // "Heal X HP" or "Heal X/Y of your Max HP"
  const healMatch = effect.match(/Heal (\d+) HP/);
  if (healMatch) {
    const amount = parseInt(healMatch[1]!, 10);
    player.hp = Math.min(player.maxHp, player.hp + amount);
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
    return;
  }

  // "Heal 1/3 of your Max HP"
  const healFractionMatch = effect.match(/Heal (\d+)\/(\d+) of your Max HP/);
  if (healFractionMatch) {
    const num = parseInt(healFractionMatch[1]!, 10);
    const denom = parseInt(healFractionMatch[2]!, 10);
    const amount = Math.floor((player.maxHp * num) / denom);
    player.hp = Math.min(player.maxHp, player.hp + amount);
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
    return;
  }

  // "Gain X gold"
  const gainGoldMatch = effect.match(/Gain (\d+) gold/i);
  if (gainGoldMatch) {
    player.gold += parseInt(gainGoldMatch[1]!, 10);
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
    // Note: May also lose HP (handled below in multi-effect check)
  }

  // "Lose X HP" or "Lose X HP"
  const loseHpMatch = effect.match(/Lose (\d+) HP/);
  if (loseHpMatch) {
    const amount = parseInt(loseHpMatch[1]!, 10);
    player.hp = Math.max(0, player.hp - amount);
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
  }

  // "Pay X gold"
  const payGoldMatch = effect.match(/Pay (\d+) gold/i);
  if (payGoldMatch) {
    const cost = parseInt(payGoldMatch[1]!, 10);
    if (player.gold < cost) return; // Can't afford
    player.gold -= cost;
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
  }

  // "Gain 1 Max HP"
  if (effect.includes('Gain 1 Max HP')) {
    player.maxHp += 1;
    player.hp = Math.min(player.maxHp, player.hp + 1); // also heal 1
    players[playerIndex] = player;
    room.gameState = { ...room.gameState, players };
    return;
  }

  // "Gain a Curse"
  if (effect.includes('Gain a Curse')) {
    const cursePool = [...curses];
    const shuffledCurses = cursePool.sort(() => rng() - 0.5);
    const curse = shuffledCurses[0];
    if (curse) {
      const updatedPlayer = players[playerIndex]!;
      players[playerIndex] = {
        ...updatedPlayer,
        drawPile: [...updatedPlayer.drawPile, `curse_${curse.id}`],
      };
      room.gameState = { ...room.gameState, players };
    }
    return;
  }

  // "Gain a relic"
  if (effect.includes('Gain a relic')) {
    const commonRelics = relics.filter(
      (r) => r.category === 'common' && !room.gameState!.players.some((p) => p.relics.includes(r.id)),
    );
    const shuffledRelics = [...commonRelics].sort(() => rng() - 0.5);
    const relic = shuffledRelics[0];
    if (relic) {
      const updatedPlayer = players[playerIndex]!;
      players[playerIndex] = {
        ...updatedPlayer,
        relics: [...updatedPlayer.relics, relic.id],
      };
      room.gameState = { ...room.gameState, players };
    }
    return;
  }

  // "Remove a card from your deck" — mark as pending (no UI in this handler)
  // For now, remove a random card from draw pile
  if (effect.includes('Remove a card from your deck')) {
    const updatedPlayer = players[playerIndex]!;
    if (updatedPlayer.drawPile.length > 0) {
      const shuffledDraw = [...updatedPlayer.drawPile].sort(() => rng() - 0.5);
      players[playerIndex] = {
        ...updatedPlayer,
        drawPile: shuffledDraw.slice(1),
      };
      room.gameState = { ...room.gameState, players };
    }
    return;
  }

  // "Upgrade a card" — upgrade a random card
  if (effect.includes('Upgrade a card') || effect.includes('Upgrade 2 random cards')) {
    const count = effect.includes('Upgrade 2') ? 2 : 1;
    const updatedPlayer = players[playerIndex]!;
    const upgradeable = updatedPlayer.drawPile.filter((id) => !id.endsWith('_upgraded'));
    const toUpgrade = [...upgradeable].sort(() => rng() - 0.5).slice(0, count);

    let newDraw = [...updatedPlayer.drawPile];
    for (const cardId of toUpgrade) {
      const idx = newDraw.indexOf(cardId);
      if (idx !== -1) {
        newDraw[idx] = `${cardId}_upgraded`;
      }
    }
    players[playerIndex] = { ...updatedPlayer, drawPile: newDraw };
    room.gameState = { ...room.gameState, players };
    return;
  }

  // "Transform a card" — pick random card, replace with random card of same type
  if (effect.includes('Transform a card')) {
    const updatedPlayer = players[playerIndex]!;
    if (updatedPlayer.drawPile.length > 0) {
      // For simplicity, just remove the card (transformation requires card pool access)
      const shuffledDraw = [...updatedPlayer.drawPile].sort(() => rng() - 0.5);
      players[playerIndex] = {
        ...updatedPlayer,
        drawPile: shuffledDraw.slice(1),
      };
      room.gameState = { ...room.gameState, players };
    }
    return;
  }

  // "Roll the die" effects — these are handled via the game die mechanic
  if (effect.includes('Roll the die')) {
    // Simulate die roll
    const dieResult = Math.floor(rng() * 6) + 1;
    room.gameState = { ...room.gameState, dieResult };

    if (effect.includes('On 1-3: gain a Curse. On 4-6: gain a relic.')) {
      if (dieResult <= 3) {
        // Gain a curse
        const cursePool = [...curses].sort(() => rng() - 0.5);
        const curse = cursePool[0];
        if (curse) {
          const updatedPlayer = players[playerIndex]!;
          players[playerIndex] = {
            ...updatedPlayer,
            drawPile: [...updatedPlayer.drawPile, `curse_${curse.id}`],
          };
          room.gameState = { ...room.gameState, players };
        }
      } else {
        // Gain a relic
        const commonRelics = relics.filter(
          (r) => r.category === 'common' && !room.gameState!.players.some((p) => p.relics.includes(r.id)),
        );
        const shuffledRelics = [...commonRelics].sort(() => rng() - 0.5);
        const relic = shuffledRelics[0];
        if (relic) {
          const updatedPlayer = players[playerIndex]!;
          players[playerIndex] = {
            ...updatedPlayer,
            relics: [...updatedPlayer.relics, relic.id],
          };
          room.gameState = { ...room.gameState, players };
        }
      }
    }
    return;
  }

  // Handled: all multi-effect combos already applied above via individual matches
}

/**
 * Resolve an event choice for a player.
 * When all players have chosen, transition back to MAP.
 */
export function resolveEventChoice(
  room: Room,
  playerId: string,
  choiceIndex: number,
  rng: () => number,
): void {
  if (!room.gameState) throw new Error('No game state');
  if (!room.gameState.eventState) throw new Error('No event state');

  const eventState = room.gameState.eventState;
  const event = events.find((e) => e.id === eventState.eventId);
  if (!event) throw new Error(`Unknown event: ${eventState.eventId}`);

  const choice = event.choices[choiceIndex];
  if (!choice) throw new Error(`Invalid choice index: ${choiceIndex}`);

  // Record player's choice
  const newPlayerChoices = {
    ...eventState.playerChoices,
    [playerId]: choiceIndex,
  };
  room.gameState = {
    ...room.gameState,
    eventState: {
      ...eventState,
      playerChoices: newPlayerChoices,
    },
  };

  // Apply the effect to this player
  applyEventEffect(room, playerId, choice.effect, rng);

  // Check if all players have chosen
  const allChosen = room.gameState.players.every(
    (p) => newPlayerChoices[p.id] !== null && newPlayerChoices[p.id] !== undefined,
  );

  if (allChosen) {
    room.gameState = { ...room.gameState, gamePhase: 'MAP' };
  }
}
