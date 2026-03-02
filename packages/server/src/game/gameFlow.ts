/**
 * gameFlow.ts — Top-level game loop coordinator.
 *
 * Handles map navigation and room transitions.
 * Full implementation in Plan 05-03.
 */
import type { Room } from '../rooms/Room.js';
import type { CombatGameState } from './state/combatState.js';

/**
 * Handle SELECT_NODE: validate host, validate path connection,
 * update currentNodeId, dispatch to appropriate room handler.
 */
export function handleSelectNode(
  room: Room,
  playerId: string,
  nodeId: string,
  rng: () => number = Math.random,
): void {
  if (!room.gameState) return;

  // Validate host-only action
  if (playerId !== room.hostId) return;

  const state = room.gameState;
  const map = state.map;
  if (!map) return;

  const targetNode = map.nodes.find((n) => n.id === nodeId);
  if (!targetNode) return;

  // Validate path connection (unless at starting position)
  if (map.currentNodeId !== null) {
    const currentNode = map.nodes.find((n) => n.id === map.currentNodeId);
    const hasWingBoots = state.players.some((p) => p.relics.includes('wing_boots'));
    if (!hasWingBoots && (!currentNode || !currentNode.connections.includes(nodeId))) {
      return; // Not a valid path
    }
  }

  // Update map position
  const updatedMap = {
    ...map,
    currentNodeId: nodeId,
  };

  room.gameState = {
    ...state,
    map: updatedMap,
    currentFloor: targetNode.floor,
    gamePhase: 'COMBAT' as const, // Default; room handler will set the correct phase
  };

  // TODO: Plan 05-03 will implement full room handler dispatch
  // For now, stub: set gamePhase based on node type
  switch (targetNode.type) {
    case 'encounter':
    case 'elite':
    case 'boss':
      room.gameState = { ...room.gameState, gamePhase: 'COMBAT' };
      break;
    case 'event':
      room.gameState = { ...room.gameState, gamePhase: 'EVENT' };
      break;
    case 'campfire':
      room.gameState = { ...room.gameState, gamePhase: 'CAMPFIRE' };
      break;
    case 'treasure':
      room.gameState = { ...room.gameState, gamePhase: 'TREASURE' };
      break;
    case 'merchant':
      room.gameState = { ...room.gameState, gamePhase: 'MERCHANT' };
      break;
  }
}

/**
 * Handle room completion — transition back to MAP or REWARDS.
 * Full implementation in Plan 05-03.
 */
export function handleRoomComplete(room: Room): void {
  if (!room.gameState) return;

  const state = room.gameState;
  // Non-combat rooms go back to MAP; combat goes to REWARDS
  if (state.gamePhase === 'COMBAT') {
    room.gameState = { ...state, gamePhase: 'REWARDS' };
  } else {
    room.gameState = { ...state, gamePhase: 'MAP' };
  }
}

/**
 * Handle EVENT_CHOICE: route to event room handler.
 * Full implementation in Plan 05-03.
 */
export function handleEventChoice(
  room: Room,
  playerId: string,
  choiceIndex: number,
  rng: () => number = Math.random,
): void {
  if (!room.gameState) return;
  // TODO: Plan 05-03 will implement full event choice handling
}

/**
 * Handle CAMPFIRE_CHOICE: route to campfire room handler.
 * Full implementation in Plan 05-03.
 */
export function handleCampfireChoice(
  room: Room,
  playerId: string,
  choice: string,
  cardId?: string,
  rng: () => number = Math.random,
): void {
  if (!room.gameState) return;
  // TODO: Plan 05-03 will implement full campfire choice handling
}

/**
 * Handle MERCHANT_BUY: route to merchant handler.
 * Full implementation in Plan 05-03.
 */
export function handleMerchantBuy(
  room: Room,
  playerId: string,
  itemType: string,
  itemId: string,
  rng: () => number = Math.random,
): void {
  if (!room.gameState) return;
  // TODO: Plan 05-03 will implement full merchant buy handling
}

/**
 * Handle MERCHANT_REMOVE_CARD: route to merchant handler.
 * Full implementation in Plan 05-03.
 */
export function handleMerchantRemoveCard(
  room: Room,
  playerId: string,
  cardId: string,
): void {
  if (!room.gameState) return;
  // TODO: Plan 05-03 will implement full merchant remove card handling
}

/**
 * Handle MERCHANT_LEAVE: transition back to MAP.
 * Full implementation in Plan 05-03.
 */
export function handleMerchantLeave(room: Room): void {
  if (!room.gameState) return;
  room.gameState = { ...room.gameState, gamePhase: 'MAP' };
}

/**
 * Handle rewards completion — transition to MAP or COMBAT_END if boss.
 * Full implementation in Plan 05-03.
 */
export function handleRewardsComplete(room: Room): void {
  if (!room.gameState) return;

  const state = room.gameState;
  const map = state.map;

  // Check if this was the boss room
  if (map && map.currentNodeId === map.bossNodeId) {
    room.gameState = { ...state, phase: 'COMBAT_END' as const };
  } else {
    room.gameState = { ...state, gamePhase: 'MAP' };
  }
}
