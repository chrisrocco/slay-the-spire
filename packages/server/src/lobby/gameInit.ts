import type { Room } from '../rooms/Room.js';
import type { CombatGameState, CombatPlayerState } from '../game/state/combatState.js';
import { initCombat } from '../game/engine/index.js';
import { generateMap } from './mapGenerator.js';
import {
  ironcladCards,
  silentCards,
  defectCards,
  watcherCards,
  encounterEnemies,
  bossEnemies,
  events,
} from '@slay-online/shared';
import type { PlayerCard, EnemyCard, Character } from '@slay-online/shared';

// ===== Character Configuration =====

interface CharacterConfig {
  hp: number;
  starterRelic: string;
  // Build the starter deck: returns array of card IDs (with duplicates for Strike/Defend)
  starterDeck: (cards: PlayerCard[]) => string[];
}

const CHARACTER_CONFIG: Record<string, CharacterConfig> = {
  ironclad: {
    hp: 75,
    starterRelic: 'burning_blood',
    starterDeck: () => [
      // 5 Strikes, 4 Defends, 1 Bash
      'strike_r', 'strike_r', 'strike_r', 'strike_r', 'strike_r',
      'defend_r', 'defend_r', 'defend_r', 'defend_r',
      'bash',
    ],
  },
  silent: {
    hp: 70,
    starterRelic: 'ring_of_the_snake',
    starterDeck: () => [
      // 5 Strikes, 5 Defends, 1 Survivor, 1 Neutralize
      'strike_g', 'strike_g', 'strike_g', 'strike_g', 'strike_g',
      'defend_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g',
      'survivor', 'neutralize',
    ],
  },
  defect: {
    hp: 75,
    starterRelic: 'cracked_core',
    starterDeck: () => [
      // 4 Strikes, 4 Defends, 1 Zap, 1 Dualcast
      'strike_b', 'strike_b', 'strike_b', 'strike_b',
      'defend_b', 'defend_b', 'defend_b', 'defend_b',
      'zap', 'dualcast',
    ],
  },
  watcher: {
    hp: 68,
    starterRelic: 'pure_water',
    starterDeck: () => [
      // 4 Strikes, 4 Defends, 1 Eruption, 1 Vigilance
      'strike_p', 'strike_p', 'strike_p', 'strike_p',
      'defend_p', 'defend_p', 'defend_p', 'defend_p',
      'eruption', 'vigilance',
    ],
  },
};

// Card data by character for lookup
const CARD_DATA: Record<string, readonly PlayerCard[]> = {
  ironclad: ironcladCards as unknown as PlayerCard[],
  silent: silentCards as unknown as PlayerCard[],
  defect: defectCards as unknown as PlayerCard[],
  watcher: watcherCards as unknown as PlayerCard[],
};

// ===== Shuffle Utility =====

function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// ===== Main Initialization =====

/**
 * Initialize a game from lobby state. Called when host starts the game.
 *
 * Steps:
 * 1. Build each player's starter deck, HP, relics
 * 2. Solo player gets Loaded Die relic
 * 3. Generate Act 1 map
 * 4. Select random boss
 * 5. Draw Neow's Blessings (one per player)
 * 6. Set up first encounter combat
 */
export function initializeGame(
  room: Room,
  rng: () => number = Math.random,
): CombatGameState {
  const playerCount = room.lobby.players.length;

  // 1. Build players
  const players: CombatPlayerState[] = room.lobby.players.map((lobbyPlayer) => {
    const config = CHARACTER_CONFIG[lobbyPlayer.character!];
    if (!config) {
      throw new Error(`Unknown character: ${lobbyPlayer.character}`);
    }

    const cards = CARD_DATA[lobbyPlayer.character!] ?? [];
    const deck = shuffle(config.starterDeck(cards as PlayerCard[]), rng);

    const relics = [config.starterRelic];

    // 2. Solo player gets Loaded Die
    if (playerCount === 1) {
      relics.push('loaded_die');
    }

    return {
      id: lobbyPlayer.id,
      nickname: lobbyPlayer.nickname,
      character: lobbyPlayer.character! as Character,
      hp: config.hp,
      maxHp: config.hp,
      block: 0,
      energy: 0,
      gold: 0,
      hand: [],
      drawPile: deck,
      discardPile: [],
      exhaustPile: [],
      relics,
      potions: [],
      endedTurn: false,
      // Combat tokens (initialized by initCombat)
      vulnerableTokens: 0,
      weakTokens: 0,
      strengthTokens: 0,
      shivTokens: 0,
      orbs: [],
      maxOrbSlots: 3,
      stance: 'neutral' as const,
      miracleTokens: 0,
      beingPlayed: null,
    };
  });

  // 3. Generate map
  const map = generateMap(rng);
  room.map = map;

  // 4. Select random boss
  const bosses = bossEnemies as unknown as EnemyCard[];
  const bossIndex = Math.floor(rng() * bosses.length);
  const selectedBoss = bosses[bossIndex]!;
  room.bossId = selectedBoss.id;

  // 5. Draw Neow's Blessings (one event per player)
  const eventPool = shuffle([...events], rng);
  for (let i = 0; i < playerCount && i < eventPool.length; i++) {
    const player = room.lobby.players[i]!;
    room.neowBlessings.set(player.id, eventPool[i]!.id);
  }

  // 6. Build initial combat state and set up first encounter
  // Pick encounter enemies for the first fight (1 per player from encounter pool)
  const encounters = encounterEnemies as unknown as EnemyCard[];
  const firstEncounterEnemies = shuffle([...encounters], rng).slice(0, playerCount);

  const initialState: CombatGameState = {
    roomCode: room.code,
    phase: 'PLAYER_ACTIONS',
    round: 0,
    dieResult: null,
    players,
    activeEnemies: [],
    combatLog: [],
    enemyCombatStates: {},
    gamePhase: 'COMBAT',
    currentFloor: 0,
  };

  // Use initCombat to properly set up the first encounter
  const gameState = initCombat(
    initialState,
    firstEncounterEnemies,
    playerCount,
    rng,
  );

  room.gameState = gameState;

  return gameState;
}
