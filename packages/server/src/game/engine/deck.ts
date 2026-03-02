import type { CombatGameState, CombatPlayerState } from '../state/combatState.js';

/**
 * Fisher-Yates shuffle for a card array.
 */
function shuffle(cards: string[], rng: () => number): string[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function updatePlayer(
  state: CombatGameState,
  playerId: string,
  updater: (p: CombatPlayerState) => CombatPlayerState,
): CombatGameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

/**
 * Shuffle the discard pile into the draw pile.
 */
export function shuffleDiscardIntoDraw(
  state: CombatGameState,
  playerId: string,
  rng: () => number = Math.random,
): CombatGameState {
  return updatePlayer(state, playerId, (p) => {
    if (p.discardPile.length === 0) return p;
    const combined = [...p.drawPile, ...p.discardPile];
    return {
      ...p,
      drawPile: shuffle(combined, rng),
      discardPile: [],
    };
  });
}

/**
 * Draw cards from the draw pile into the hand.
 * If the draw pile runs out, shuffle the discard pile in and continue drawing.
 */
export function drawCards(
  state: CombatGameState,
  playerId: string,
  count: number,
  rng: () => number = Math.random,
): CombatGameState {
  if (count <= 0) return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  let currentState = state;
  let drawn: string[] = [];
  let remaining = count;

  // Draw from current draw pile
  const available = player.drawPile.slice(0, remaining);
  drawn = [...available];
  remaining -= available.length;

  currentState = updatePlayer(currentState, playerId, (p) => ({
    ...p,
    drawPile: p.drawPile.slice(available.length),
  }));

  // If we need more, reshuffle and draw
  if (remaining > 0) {
    currentState = shuffleDiscardIntoDraw(currentState, playerId, rng);

    const reshuffledPlayer = currentState.players.find((p) => p.id === playerId);
    if (reshuffledPlayer && reshuffledPlayer.drawPile.length > 0) {
      const moreAvailable = reshuffledPlayer.drawPile.slice(0, remaining);
      drawn = [...drawn, ...moreAvailable];

      currentState = updatePlayer(currentState, playerId, (p) => ({
        ...p,
        drawPile: p.drawPile.slice(moreAvailable.length),
      }));
    }
  }

  // Add drawn cards to hand
  currentState = updatePlayer(currentState, playerId, (p) => ({
    ...p,
    hand: [...p.hand, ...drawn],
  }));

  return currentState;
}

/**
 * Discard the player's hand at end of turn.
 * - Normal cards go to discard pile
 * - Retain cards stay in hand
 * - Ethereal cards go to exhaust pile
 */
export function discardHand(
  state: CombatGameState,
  playerId: string,
  cardLookup: (id: string) => { ethereal?: boolean; retain?: boolean },
): CombatGameState {
  return updatePlayer(state, playerId, (p) => {
    const newHand: string[] = [];
    const toDiscard: string[] = [];
    const toExhaust: string[] = [];

    for (const cardId of p.hand) {
      const flags = cardLookup(cardId);
      if (flags.retain) {
        newHand.push(cardId);
      } else if (flags.ethereal) {
        toExhaust.push(cardId);
      } else {
        toDiscard.push(cardId);
      }
    }

    return {
      ...p,
      hand: newHand,
      discardPile: [...p.discardPile, ...toDiscard],
      exhaustPile: [...p.exhaustPile, ...toExhaust],
    };
  });
}

/**
 * Move a card to the exhaust pile from the specified zone.
 */
export function moveToExhaust(
  state: CombatGameState,
  playerId: string,
  cardId: string,
  from: 'hand' | 'discard',
): CombatGameState {
  return updatePlayer(state, playerId, (p) => {
    const source = from === 'hand' ? p.hand : p.discardPile;
    const idx = source.indexOf(cardId);
    if (idx === -1) return p;

    const newSource = [...source.slice(0, idx), ...source.slice(idx + 1)];
    const update: Partial<CombatPlayerState> = {
      exhaustPile: [...p.exhaustPile, cardId],
    };

    if (from === 'hand') {
      update.hand = newSource;
    } else {
      update.discardPile = newSource;
    }

    return { ...p, ...update };
  });
}

/**
 * Scry: peek at the top N cards of the draw pile.
 * Returns the card IDs visible without modifying state.
 */
export function scry(
  state: CombatGameState,
  playerId: string,
  count: number,
): { state: CombatGameState; scryCards: string[] } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { state, scryCards: [] };

  const scryCards = player.drawPile.slice(0, count);
  return { state, scryCards };
}

/**
 * Resolve a scry action: discard selected cards, keep rest on top of draw pile.
 */
export function resolveScry(
  state: CombatGameState,
  playerId: string,
  discardIds: string[],
  scryCount: number,
): CombatGameState {
  return updatePlayer(state, playerId, (p) => {
    const scried = p.drawPile.slice(0, scryCount);
    const rest = p.drawPile.slice(scryCount);

    const kept = scried.filter((id) => !discardIds.includes(id));
    const discarded = scried.filter((id) => discardIds.includes(id));

    return {
      ...p,
      drawPile: [...kept, ...rest],
      discardPile: [...p.discardPile, ...discarded],
    };
  });
}
