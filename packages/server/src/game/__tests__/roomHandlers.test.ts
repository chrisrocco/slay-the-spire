/**
 * roomHandlers.test.ts
 * Tests for game flow state machine and all room type handlers.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Room } from '../../rooms/Room.js';
import type { CombatGameState } from '../state/combatState.js';
import { buildTestPlayer, buildTestGameState } from './helpers.js';
import {
  handleSelectNode,
  handleRoomComplete,
  handleRewardsComplete,
} from '../gameFlow.js';
import {
  enterEncounter,
  enterElite,
  enterBoss,
  enterEvent,
  resolveEventChoice,
  enterCampfire,
  resolveCampfireChoice,
  enterTreasure,
  enterMerchant,
  handleMerchantBuy,
  handleMerchantRemoveCard,
  handleMerchantLeave,
} from '../roomHandlers/index.js';

// Deterministic RNG
const seededRng = (values: number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0.5;
};

const rng = () => 0.5;

// Build a test map
function buildTestMap() {
  return {
    nodes: [
      { id: '0-0', floor: 0, type: 'encounter' as const, connections: ['1-0', '1-1'] },
      { id: '0-1', floor: 0, type: 'encounter' as const, connections: ['1-0'] },
      { id: '1-0', floor: 1, type: 'event' as const, connections: ['2-0'] },
      { id: '1-1', floor: 1, type: 'campfire' as const, connections: ['2-0'] },
      { id: '2-0', floor: 2, type: 'treasure' as const, connections: ['3-0'] },
      { id: '3-0', floor: 3, type: 'merchant' as const, connections: ['4-0'] },
      { id: '4-0', floor: 4, type: 'elite' as const, connections: ['5-0'] },
      { id: '5-0', floor: 5, type: 'encounter' as const, connections: ['6-0'] },
      { id: '6-0', floor: 6, type: 'campfire' as const, connections: ['7-0'] },
      { id: '7-0', floor: 7, type: 'campfire' as const, connections: ['14-0'] },
      { id: '14-0', floor: 14, type: 'boss' as const, connections: [] },
    ],
    bossNodeId: '14-0',
    currentNodeId: null as string | null,
  };
}

function buildTestRoom(overrides?: Partial<Room>): Room {
  const state = buildTestGameState() as CombatGameState;
  state.gamePhase = 'MAP';
  state.map = buildTestMap();

  return {
    code: 'TEST',
    hostId: 'player-1',
    lobby: {
      roomCode: 'TEST',
      players: [{ id: 'player-1', nickname: 'P1', character: 'ironclad', isHost: true }],
      optionalRules: { lastStand: false, chooseYourRelic: false },
      started: true,
    },
    gameState: state,
    connections: new Map(),
    reconnectionTokens: new Map(),
    disconnectTimers: new Map(),
    lastActivity: Date.now(),
    createdAt: Date.now(),
    map: buildTestMap(),
    bossId: 'the_guardian',
    neowBlessings: new Map(),
    ...overrides,
  } as Room;
}

// ============================================================
// Task 1: Game flow state machine and map navigation
// ============================================================

describe('handleSelectNode', () => {
  it('transitions from MAP to COMBAT for an encounter node', () => {
    const room = buildTestRoom();
    handleSelectNode(room, 'player-1', '0-0', rng);
    expect(room.gameState!.gamePhase).toBe('COMBAT');
    expect(room.gameState!.map!.currentNodeId).toBe('0-0');
  });

  it('transitions from MAP to EVENT for an event node', () => {
    const room = buildTestRoom();
    // Move to floor 0 first
    room.gameState!.map!.currentNodeId = '0-0';
    handleSelectNode(room, 'player-1', '1-0', rng);
    expect(room.gameState!.gamePhase).toBe('EVENT');
    expect(room.gameState!.map!.currentNodeId).toBe('1-0');
  });

  it('transitions from MAP to CAMPFIRE for a campfire node', () => {
    const room = buildTestRoom();
    room.gameState!.map!.currentNodeId = '0-0';
    handleSelectNode(room, 'player-1', '1-1', rng);
    expect(room.gameState!.gamePhase).toBe('CAMPFIRE');
  });

  it('transitions from MAP to TREASURE for a treasure node', () => {
    const room = buildTestRoom();
    room.gameState!.map!.currentNodeId = '1-0';
    handleSelectNode(room, 'player-1', '2-0', rng);
    expect(room.gameState!.gamePhase).toBe('MAP'); // treasure is instant -> back to MAP
  });

  it('transitions from MAP to MERCHANT for a merchant node', () => {
    const room = buildTestRoom();
    room.gameState!.map!.currentNodeId = '2-0';
    handleSelectNode(room, 'player-1', '3-0', rng);
    expect(room.gameState!.gamePhase).toBe('MERCHANT');
  });

  it('rejects nodes not connected to current position', () => {
    const room = buildTestRoom();
    room.gameState!.map!.currentNodeId = '0-0';
    expect(() => handleSelectNode(room, 'player-1', '0-1', rng)).toThrow();
    // State should not have changed
    expect(room.gameState!.map!.currentNodeId).toBe('0-0');
  });

  it('accepts any node when currentNodeId is null (start of game)', () => {
    const room = buildTestRoom();
    // Starting from null, floor 0 nodes should be accessible
    handleSelectNode(room, 'player-1', '0-0', rng);
    expect(room.gameState!.map!.currentNodeId).toBe('0-0');
  });

  it('updates currentFloor when selecting a node', () => {
    const room = buildTestRoom();
    handleSelectNode(room, 'player-1', '0-0', rng);
    expect(room.gameState!.currentFloor).toBe(0);
  });

  it('rejects non-host player selection', () => {
    const room = buildTestRoom();
    expect(() => handleSelectNode(room, 'player-2', '0-0', rng)).toThrow();
  });

  it('Wing Boots relic allows ignoring path connections', () => {
    const room = buildTestRoom();
    room.gameState!.map!.currentNodeId = '0-0';
    // player-1 has Wing Boots
    room.gameState!.players[0]!.relics = ['wing_boots'];
    // 0-0 connects to 1-0 and 1-1, not 5-0; Wing Boots skip constraint
    expect(() => handleSelectNode(room, 'player-1', '5-0', rng)).not.toThrow();
  });
});

describe('handleRoomComplete', () => {
  it('transitions COMBAT phase to REWARDS', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'COMBAT';
    handleRoomComplete(room);
    expect(room.gameState!.gamePhase).toBe('REWARDS');
  });

  it('transitions EVENT phase back to MAP', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'EVENT';
    handleRoomComplete(room);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('transitions CAMPFIRE phase back to MAP', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'CAMPFIRE';
    handleRoomComplete(room);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('transitions MERCHANT phase back to MAP', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'MERCHANT';
    handleRoomComplete(room);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });
});

describe('handleRewardsComplete', () => {
  it('transitions REWARDS to MAP for non-boss combat', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'REWARDS';
    room.gameState!.map!.currentNodeId = '0-0'; // not boss node
    handleRewardsComplete(room);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('transitions REWARDS to COMBAT_END for boss combat', () => {
    const room = buildTestRoom();
    room.gameState!.gamePhase = 'REWARDS';
    room.gameState!.map!.currentNodeId = '14-0'; // boss node
    handleRewardsComplete(room);
    expect(room.gameState!.phase).toBe('COMBAT_END');
  });
});

// ============================================================
// Task 2: Room type handlers
// ============================================================

describe('encounterHandler', () => {
  it('draws 1 enemy per player and starts combat', () => {
    const room = buildTestRoom();
    enterEncounter(room, rng);
    expect(room.gameState!.gamePhase).toBe('COMBAT');
    expect(room.gameState!.activeEnemies.length).toBe(1); // 1 player -> 1 enemy
  });

  it('draws 2 enemies for 2 players', () => {
    const room = buildTestRoom();
    const p2 = buildTestPlayer({ id: 'player-2', nickname: 'P2' });
    (room.gameState!.players as unknown[]).push(p2);
    enterEncounter(room, rng);
    expect(room.gameState!.gamePhase).toBe('COMBAT');
    expect(room.gameState!.activeEnemies.length).toBe(2);
  });
});

describe('eliteHandler', () => {
  it('selects an elite enemy and starts combat with all players', () => {
    const room = buildTestRoom();
    enterElite(room, rng);
    expect(room.gameState!.gamePhase).toBe('COMBAT');
    expect(room.gameState!.activeEnemies.length).toBe(1);
  });

  it('Preserved Insect reduces elite HP by 25%', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = ['preserved_insect'];
    enterElite(room, rng);
    // Elite should have HP reduced — it was in enemyCombatStates
    const enemyId = room.gameState!.activeEnemies[0]!;
    const enemyState = (room.gameState as CombatGameState & { enemyCombatStates: Record<string, { hp: number; maxHp: number }> }).enemyCombatStates[enemyId]!;
    expect(enemyState.hp).toBeLessThan(enemyState.maxHp);
  });
});

describe('bossHandler', () => {
  it('uses room.bossId and starts boss combat', () => {
    const room = buildTestRoom();
    enterBoss(room, rng);
    expect(room.gameState!.gamePhase).toBe('COMBAT');
    expect(room.gameState!.activeEnemies).toContain('the_guardian');
  });
});

describe('eventHandler', () => {
  it('draws a random event and sets gamePhase to EVENT', () => {
    const room = buildTestRoom();
    enterEvent(room, rng);
    expect(room.gameState!.gamePhase).toBe('EVENT');
    expect(room.gameState!.eventState).toBeDefined();
    expect(room.gameState!.eventState!.eventId).toBeTruthy();
  });

  it('populates eventState with player choice slots', () => {
    const room = buildTestRoom();
    enterEvent(room, rng);
    const playerId = room.gameState!.players[0]!.id;
    expect(room.gameState!.eventState!.playerChoices[playerId]).toBe(null);
  });

  describe('resolveEventChoice', () => {
    it('heals HP for "Heal X HP" effect', () => {
      const room = buildTestRoom();
      // Set up mushrooms event (eat -> Heal 3 HP)
      room.gameState!.gamePhase = 'EVENT';
      room.gameState!.eventState = { eventId: 'mushrooms', playerChoices: { 'player-1': null } };
      room.gameState!.players[0]!.hp = 50;
      resolveEventChoice(room, 'player-1', 1, rng); // choice 1 = Eat = Heal 3 HP
      expect(room.gameState!.players[0]!.hp).toBe(53);
    });

    it('gains gold for "Gain X gold" effect', () => {
      const room = buildTestRoom();
      room.gameState!.gamePhase = 'EVENT';
      // world_of_goop: "Gather Gold" = Gain 4 gold. Lose 1 HP.
      room.gameState!.eventState = { eventId: 'world_of_goop', playerChoices: { 'player-1': null } };
      room.gameState!.players[0]!.gold = 10;
      room.gameState!.players[0]!.hp = 30;
      resolveEventChoice(room, 'player-1', 0, rng); // choice 0 = Gather Gold
      expect(room.gameState!.players[0]!.gold).toBe(14);
    });

    it('adds a curse for "Gain a Curse" effect', () => {
      const room = buildTestRoom();
      room.gameState!.gamePhase = 'EVENT';
      // golden_idol: Take = Gain 5 gold. Gain a Curse.
      room.gameState!.eventState = { eventId: 'golden_idol', playerChoices: { 'player-1': null } };
      room.gameState!.players[0]!.drawPile = [];
      resolveEventChoice(room, 'player-1', 0, rng);
      // Player should have a curse card in their deck
      const allCards = [
        ...room.gameState!.players[0]!.drawPile,
        ...room.gameState!.players[0]!.discardPile,
      ];
      const hasCurse = allCards.some((id) => id.startsWith('curse_') || ['regret', 'shame', 'doubt', 'pain', 'decay', 'injury', 'normality', 'parasite', 'pride'].includes(id));
      expect(hasCurse).toBe(true);
    });

    it('resolves "Nothing happens" with no state change', () => {
      const room = buildTestRoom();
      room.gameState!.gamePhase = 'EVENT';
      // the_cleric: Leave = Nothing happens
      room.gameState!.eventState = { eventId: 'the_cleric', playerChoices: { 'player-1': null } };
      const goldBefore = room.gameState!.players[0]!.gold;
      const hpBefore = room.gameState!.players[0]!.hp;
      resolveEventChoice(room, 'player-1', 2, rng); // choice 2 = Leave
      expect(room.gameState!.players[0]!.gold).toBe(goldBefore);
      expect(room.gameState!.players[0]!.hp).toBe(hpBefore);
    });

    it('transitions to MAP when all players have chosen', () => {
      const room = buildTestRoom();
      room.gameState!.gamePhase = 'EVENT';
      room.gameState!.eventState = { eventId: 'mushrooms', playerChoices: { 'player-1': null } };
      resolveEventChoice(room, 'player-1', 1, rng);
      // Only 1 player -> should transition
      expect(room.gameState!.gamePhase).toBe('MAP');
    });
  });
});

describe('campfireHandler', () => {
  it('sets gamePhase to CAMPFIRE on enter', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    expect(room.gameState!.gamePhase).toBe('CAMPFIRE');
    expect(room.gameState!.campfireState).toBeDefined();
  });

  it('rest heals 3 HP', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.hp = 50;
    room.gameState!.players[0]!.maxHp = 80;
    resolveCampfireChoice(room, 'player-1', 'rest', undefined, rng);
    expect(room.gameState!.players[0]!.hp).toBe(53);
  });

  it('rest heals 6 HP with Regal Pillow (3 base + 3 bonus)', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.hp = 50;
    room.gameState!.players[0]!.maxHp = 80;
    room.gameState!.players[0]!.relics = ['regal_pillow'];
    resolveCampfireChoice(room, 'player-1', 'rest', undefined, rng);
    expect(room.gameState!.players[0]!.hp).toBe(56);
  });

  it('rest does not exceed maxHp', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.hp = 79;
    room.gameState!.players[0]!.maxHp = 80;
    resolveCampfireChoice(room, 'player-1', 'rest', undefined, rng);
    expect(room.gameState!.players[0]!.hp).toBe(80);
  });

  it('smith upgrades a card (appends _upgraded suffix)', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.drawPile = ['strike_r'];
    resolveCampfireChoice(room, 'player-1', 'smith', 'strike_r', rng);
    expect(room.gameState!.players[0]!.drawPile).toContain('strike_r_upgraded');
    expect(room.gameState!.players[0]!.drawPile).not.toContain('strike_r');
  });

  it('rejects rest if player has Coffee Dripper', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.relics = ['coffee_dripper'];
    expect(() => resolveCampfireChoice(room, 'player-1', 'rest', undefined, rng)).toThrow();
  });

  it('rejects smith if player has Fusion Hammer', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.drawPile = ['strike_r'];
    room.gameState!.players[0]!.relics = ['fusion_hammer'];
    expect(() => resolveCampfireChoice(room, 'player-1', 'smith', 'strike_r', rng)).toThrow();
  });

  it('dig is available with Shovel relic and gives a relic', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.relics = ['shovel'];
    const relicsBefore = room.gameState!.players[0]!.relics.length;
    resolveCampfireChoice(room, 'player-1', 'dig', undefined, rng);
    expect(room.gameState!.players[0]!.relics.length).toBeGreaterThan(relicsBefore);
  });

  it('rejects dig without Shovel relic', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.relics = [];
    expect(() => resolveCampfireChoice(room, 'player-1', 'dig', undefined, rng)).toThrow();
  });

  it('transitions to MAP when all players have chosen', () => {
    const room = buildTestRoom();
    enterCampfire(room);
    room.gameState!.players[0]!.hp = 50;
    room.gameState!.players[0]!.maxHp = 80;
    resolveCampfireChoice(room, 'player-1', 'rest', undefined, rng);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });
});

describe('treasureHandler', () => {
  it('gives each player a random relic from common pool', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = [];
    enterTreasure(room, rng);
    expect(room.gameState!.players[0]!.relics.length).toBe(1);
  });

  it('transitions immediately back to MAP (treasure is instant)', () => {
    const room = buildTestRoom();
    enterTreasure(room, rng);
    expect(room.gameState!.gamePhase).toBe('MAP');
  });

  it('Matryoshka gives 2 relics instead of 1', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = ['matryoshka'];
    enterTreasure(room, rng);
    // Player had 1 relic (matryoshka) -> now has 3 (matryoshka + 2 new)
    expect(room.gameState!.players[0]!.relics.length).toBe(3);
  });

  it('Cursed Key adds a curse to deck on chest open', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = ['cursed_key'];
    room.gameState!.players[0]!.drawPile = [];
    enterTreasure(room, rng);
    const allCards = [
      ...room.gameState!.players[0]!.drawPile,
      ...room.gameState!.players[0]!.discardPile,
    ];
    expect(allCards.length).toBeGreaterThan(0); // got a curse
  });
});

describe('merchantHandler', () => {
  it('generates card/relic/potion pools with prices', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.character = 'ironclad';
    enterMerchant(room, rng);
    expect(room.gameState!.gamePhase).toBe('MERCHANT');
    expect(room.gameState!.merchantState).toBeDefined();
    const ms = room.gameState!.merchantState!;
    expect(ms.cardPool.length).toBeGreaterThan(0);
    expect(ms.relicPool.length).toBeGreaterThan(0);
    expect(ms.potionPool.length).toBeGreaterThan(0);
    expect(ms.removeCost).toBeGreaterThan(0);
  });

  it('Meal Ticket heals 3 HP on enter', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = ['meal_ticket'];
    room.gameState!.players[0]!.hp = 50;
    room.gameState!.players[0]!.maxHp = 80;
    enterMerchant(room, rng);
    expect(room.gameState!.players[0]!.hp).toBe(53);
  });

  it('Smiling Mask sets remove cost to 0', () => {
    const room = buildTestRoom();
    room.gameState!.players[0]!.relics = ['smiling_mask'];
    enterMerchant(room, rng);
    expect(room.gameState!.merchantState!.removeCost).toBe(0);
  });

  describe('handleMerchantBuy', () => {
    it('deducts gold and adds card to player deck', () => {
      const room = buildTestRoom();
      enterMerchant(room, rng);
      const ms = room.gameState!.merchantState!;
      const item = ms.cardPool[0]!;
      room.gameState!.players[0]!.gold = 200;
      handleMerchantBuy(room, 'player-1', 'card', item.cardId);
      expect(room.gameState!.players[0]!.gold).toBeLessThan(200);
      const allCards = [
        ...room.gameState!.players[0]!.drawPile,
        ...room.gameState!.players[0]!.discardPile,
      ];
      expect(allCards).toContain(item.cardId);
    });

    it('rejects buy if insufficient gold', () => {
      const room = buildTestRoom();
      enterMerchant(room, rng);
      const ms = room.gameState!.merchantState!;
      const item = ms.cardPool[0]!;
      room.gameState!.players[0]!.gold = 0;
      expect(() => handleMerchantBuy(room, 'player-1', 'card', item.cardId)).toThrow();
    });
  });

  describe('handleMerchantRemoveCard', () => {
    it('removes card from deck and deducts gold', () => {
      const room = buildTestRoom();
      enterMerchant(room, rng);
      room.gameState!.players[0]!.drawPile = ['strike_r'];
      room.gameState!.players[0]!.gold = 200;
      handleMerchantRemoveCard(room, 'player-1', 'strike_r');
      expect(room.gameState!.players[0]!.gold).toBeLessThan(200);
      expect(room.gameState!.players[0]!.drawPile).not.toContain('strike_r');
    });

    it('only allows one removal per player per visit', () => {
      const room = buildTestRoom();
      enterMerchant(room, rng);
      room.gameState!.players[0]!.drawPile = ['strike_r', 'defend_r'];
      room.gameState!.players[0]!.gold = 500;
      handleMerchantRemoveCard(room, 'player-1', 'strike_r');
      expect(() => handleMerchantRemoveCard(room, 'player-1', 'defend_r')).toThrow();
    });
  });

  describe('handleMerchantLeave', () => {
    it('transitions to MAP on leave', () => {
      const room = buildTestRoom();
      enterMerchant(room, rng);
      handleMerchantLeave(room);
      expect(room.gameState!.gamePhase).toBe('MAP');
    });
  });
});
