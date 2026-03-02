import type { WebSocket } from 'ws';
import type { Room } from '../rooms/Room.js';
import type { ServerMessage } from '@slay-online/shared';
import { processAction } from './engine/index.js';
import type { Action } from './engine/index.js';
import { ActionQueue } from './actionQueue.js';
import { handleSelectNode as gameFlowSelectNode, handleRewardsComplete } from './gameFlow.js';
import {
  resolveEventChoice as roomHandlerEventChoice,
  resolveCampfireChoice as roomHandlerCampfireChoice,
  handleMerchantBuy as roomHandlerMerchantBuy,
  handleMerchantRemoveCard as roomHandlerMerchantRemoveCard,
  handleMerchantLeave as roomHandlerMerchantLeave,
} from './roomHandlers/index.js';
import {
  generateRewards,
  generateBossRelicChoices,
  areAllRewardsChosen,
  handleRewardPickCard as rewardPickCard,
  handleRewardPickPotion as rewardPickPotion,
  handleRewardPickRelic as rewardPickRelic,
  handleRewardSkip as rewardSkip,
} from './rewardHandler.js';
import { passPotion, discardPotion } from './potionManagement.js';

// Each room gets its own action queue
const roomQueues = new Map<string, ActionQueue>();

function getQueue(roomCode: string): ActionQueue {
  let queue = roomQueues.get(roomCode);
  if (!queue) {
    queue = new ActionQueue();
    roomQueues.set(roomCode, queue);
  }
  return queue;
}

// Helper to send a message to a WebSocket
function sendMsg(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Check if combat has ended and transition to REWARDS or BOSS_REWARD phase.
 * Called after any action that could end combat (play card, end turn, use potion).
 * Checks the combat TurnPhase (room.gameState.phase), not gamePhase.
 */
export function checkCombatEnd(room: Room): void {
  if (!room.gameState) return;
  if (room.gameState.phase !== 'COMBAT_END') return;

  const state = room.gameState;
  const map = state.map;
  if (!map) return;

  const currentNode = map.nodes.find((n) => n.id === map.currentNodeId);
  if (!currentNode) return;

  const nodeType = currentNode.type;

  if (nodeType === 'boss') {
    // Boss combat: generate card/gold rewards AND boss relic choices
    const rewardState = generateRewards(state, 'boss', Math.random);
    const bossRelicChoices = generateBossRelicChoices(state, state.players.length, Math.random);
    rewardState.bossRelicChoices = bossRelicChoices;

    // Add gold to each player immediately
    const updatedPlayers = state.players.map((p) => ({
      ...p,
      gold: p.gold + (rewardState.gold ?? 0),
    }));

    room.gameState = {
      ...state,
      gamePhase: 'BOSS_REWARD',
      players: updatedPlayers,
      rewardState,
    };
  } else {
    // Encounter or elite combat
    const roomType = nodeType === 'elite' ? 'elite' : 'encounter';
    const rewardState = generateRewards(state, roomType, Math.random);

    // Add gold to each player immediately
    const updatedPlayers = state.players.map((p) => ({
      ...p,
      gold: p.gold + (rewardState.gold ?? 0),
    }));

    room.gameState = {
      ...state,
      gamePhase: 'REWARDS',
      players: updatedPlayers,
      rewardState,
    };
  }
}

/**
 * Broadcast game state to all connected players.
 * Redacts other players' drawPile (replace with same-length array of empty strings).
 */
export function broadcastState(room: Room): void {
  if (!room.gameState) return;

  for (const [playerId, ws] of room.connections) {
    // Create per-player view with redacted draw piles
    const redactedPlayers = room.gameState.players.map((p) => {
      if (p.id === playerId) {
        return p; // Player sees their own full state
      }
      return {
        ...p,
        drawPile: p.drawPile.map(() => ''), // Redact draw pile order
      };
    });

    const redactedState = {
      ...room.gameState,
      players: redactedPlayers,
    };

    sendMsg(ws, { type: 'STATE_UPDATE', state: redactedState });
  }
}

/**
 * Broadcast lobby update to all connected players.
 */
export function broadcastLobby(room: Room): void {
  const msg: ServerMessage = { type: 'LOBBY_UPDATE', lobby: room.lobby };
  for (const ws of room.connections.values()) {
    sendMsg(ws, msg);
  }
}

/**
 * Handle PLAY_CARD message.
 * Routes through action queue for serialized processing.
 */
export function handlePlayCard(
  room: Room,
  playerId: string,
  cardId: string,
  targetIds?: string[],
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;

    const action: Action = {
      type: 'PLAY_CARD',
      playerId,
      cardId,
      targetId: targetIds?.[0],
    };

    room.gameState = processAction(room.gameState, action);
    checkCombatEnd(room);
    broadcastState(room);
  });
}

/**
 * Handle END_TURN message.
 * Routes through action queue for serialized processing.
 */
export function handleEndTurn(room: Room, playerId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;

    const action: Action = {
      type: 'END_TURN',
      playerId,
    };

    room.gameState = processAction(room.gameState, action);
    checkCombatEnd(room);

    // Clear any disconnect timer for this player
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    broadcastState(room);
  });
}

/**
 * Handle USE_POTION message.
 * Routes through action queue for serialized processing.
 */
export function handleUsePotion(
  room: Room,
  playerId: string,
  potionId: string,
  targetId?: string,
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;

    const action: Action = {
      type: 'USE_POTION',
      playerId,
      potionId,
      targetId,
    };

    room.gameState = processAction(room.gameState, action);
    checkCombatEnd(room);
    broadcastState(room);
  });
}

/**
 * Handle SEND_CHAT message.
 * Broadcasts to all connected players without affecting game state.
 */
export function handleChat(room: Room, playerId: string, text: string): void {
  const msg: ServerMessage = {
    type: 'CHAT_MESSAGE',
    playerId,
    text,
  };
  for (const ws of room.connections.values()) {
    sendMsg(ws, msg);
  }
}

/**
 * Handle SELECT_NODE message.
 * Routes through action queue for serialized processing.
 */
export function handleSelectNode(room: Room, playerId: string, nodeId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    gameFlowSelectNode(room, playerId, nodeId);
    broadcastState(room);
  });
}

/**
 * Handle EVENT_CHOICE message.
 * Routes through action queue for serialized processing.
 */
export function handleEventChoice(room: Room, playerId: string, choiceIndex: number): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    roomHandlerEventChoice(room, playerId, choiceIndex, Math.random);
    broadcastState(room);
  });
}

/**
 * Handle CAMPFIRE_CHOICE message.
 * Routes through action queue for serialized processing.
 */
export function handleCampfireChoice(
  room: Room,
  playerId: string,
  choice: string,
  cardId?: string,
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    roomHandlerCampfireChoice(room, playerId, choice as 'rest' | 'smith' | 'dig' | 'lift' | 'toke', cardId, Math.random);
    broadcastState(room);
  });
}

/**
 * Handle MERCHANT_BUY message.
 * Routes through action queue for serialized processing.
 */
export function handleMerchantBuy(
  room: Room,
  playerId: string,
  itemType: string,
  itemId: string,
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    roomHandlerMerchantBuy(room, playerId, itemType as 'card' | 'relic' | 'potion', itemId);
    broadcastState(room);
  });
}

/**
 * Handle MERCHANT_REMOVE_CARD message.
 * Routes through action queue for serialized processing.
 */
export function handleMerchantRemoveCard(room: Room, playerId: string, cardId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    roomHandlerMerchantRemoveCard(room, playerId, cardId);
    broadcastState(room);
  });
}

/**
 * Handle MERCHANT_LEAVE message.
 * Routes through action queue for serialized processing.
 */
export function handleMerchantLeave(room: Room): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    roomHandlerMerchantLeave(room);
    broadcastState(room);
  });
}

/**
 * Handle REWARD_PICK_CARD message.
 * Routes through action queue for serialized processing.
 */
export function handleRewardPickCard(room: Room, playerId: string, cardId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = rewardPickCard(room.gameState, playerId, cardId);
    if (areAllRewardsChosen(room.gameState)) {
      handleRewardsComplete(room);
    }
    broadcastState(room);
  });
}

/**
 * Handle REWARD_PICK_POTION message.
 * Routes through action queue for serialized processing.
 */
export function handleRewardPickPotion(room: Room, playerId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = rewardPickPotion(room.gameState, playerId);
    if (areAllRewardsChosen(room.gameState)) {
      handleRewardsComplete(room);
    }
    broadcastState(room);
  });
}

/**
 * Handle REWARD_PICK_RELIC message.
 * Routes through action queue for serialized processing.
 */
export function handleRewardPickRelic(room: Room, playerId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = rewardPickRelic(room.gameState, playerId);
    if (areAllRewardsChosen(room.gameState)) {
      handleRewardsComplete(room);
    }
    broadcastState(room);
  });
}

/**
 * Handle REWARD_SKIP message.
 * Routes through action queue for serialized processing.
 */
export function handleRewardSkip(room: Room, playerId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = rewardSkip(room.gameState, playerId);
    if (areAllRewardsChosen(room.gameState)) {
      handleRewardsComplete(room);
    }
    broadcastState(room);
  });
}

/**
 * Handle PASS_POTION message.
 * Routes through action queue for serialized processing.
 * Only valid outside combat (during MAP phase).
 */
export function handlePassPotion(
  room: Room,
  playerId: string,
  potionId: string,
  targetPlayerId: string,
): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = passPotion(room.gameState, playerId, potionId, targetPlayerId);
    broadcastState(room);
  });
}

/**
 * Handle DISCARD_POTION message.
 * Routes through action queue for serialized processing.
 */
export function handleDiscardPotion(room: Room, playerId: string, potionId: string): void {
  if (!room.gameState) return;

  const queue = getQueue(room.code);
  queue.enqueue(() => {
    if (!room.gameState) return;
    room.gameState = discardPotion(room.gameState, playerId, potionId);
    broadcastState(room);
  });
}

/**
 * Clean up room queue when room is destroyed.
 */
export function cleanupRoomQueue(roomCode: string): void {
  roomQueues.delete(roomCode);
}
