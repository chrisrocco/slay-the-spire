/**
 * gameFlow.ts
 * Top-level game loop coordinator.
 * Handles map navigation, room dispatch, and game phase transitions.
 */
import type { Room } from '../rooms/Room.js';
import {
  enterEncounter,
  enterElite,
  enterBoss,
  enterEvent,
  enterCampfire,
  enterTreasure,
  enterMerchant,
} from './roomHandlers/index.js';

/**
 * Handle SELECT_NODE: validate host, validate path connection,
 * update currentNodeId, dispatch to appropriate room handler.
 * Throws on invalid input.
 */
export function handleSelectNode(
  room: Room,
  playerId: string,
  nodeId: string,
  rng: () => number = Math.random,
): void {
  if (!room.gameState) throw new Error('No game state');

  // Validate host-only action
  if (playerId !== room.hostId) throw new Error('Only the host can select nodes');

  const state = room.gameState;
  const map = state.map;
  if (!map) throw new Error('No map in game state');

  const targetNode = map.nodes.find((n) => n.id === nodeId);
  if (!targetNode) throw new Error(`Node not found: ${nodeId}`);

  // Validate path connection (unless starting from null = beginning of game)
  if (map.currentNodeId !== null) {
    const currentNode = map.nodes.find((n) => n.id === map.currentNodeId);
    const hasWingBoots = state.players.some((p) => p.relics.includes('wing_boots'));

    if (!hasWingBoots) {
      if (!currentNode || !currentNode.connections.includes(nodeId)) {
        throw new Error(`Node ${nodeId} is not connected to current node ${map.currentNodeId}`);
      }
    }
  }

  // Update map position and floor
  const updatedMap = {
    ...map,
    currentNodeId: nodeId,
  };

  room.gameState = {
    ...state,
    map: updatedMap,
    currentFloor: targetNode.floor,
  };

  // Dispatch to room handler
  switch (targetNode.type) {
    case 'encounter':
      enterEncounter(room, rng);
      break;
    case 'elite':
      enterElite(room, rng);
      break;
    case 'boss':
      enterBoss(room, rng);
      break;
    case 'event':
      enterEvent(room, rng);
      break;
    case 'campfire':
      enterCampfire(room);
      break;
    case 'treasure':
      enterTreasure(room, rng);
      break;
    case 'merchant':
      enterMerchant(room, rng);
      break;
  }
}

/**
 * Handle room completion — transition back to MAP or REWARDS for combat.
 */
export function handleRoomComplete(room: Room): void {
  if (!room.gameState) return;

  const state = room.gameState;
  if (state.gamePhase === 'COMBAT') {
    room.gameState = { ...state, gamePhase: 'REWARDS' };
  } else {
    room.gameState = { ...state, gamePhase: 'MAP' };
  }
}

/**
 * Handle rewards completion — transition to MAP, or COMBAT_END if boss was defeated.
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
