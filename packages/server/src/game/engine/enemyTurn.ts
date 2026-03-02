import type { CombatGameState } from '../state/combatState.js';
import type { EnemyCombatState } from '../state/enemyCombatState.js';
import type { EnemyCard, EnemyActionPattern } from '@slay-online/shared';
import { applyDamage } from './damage.js';
import { applyStatusToken } from './status.js';

/**
 * Sort enemies by action order: row 0 first, then row 1, bosses last.
 */
export function sortEnemiesByActionOrder(
  enemies: EnemyCombatState[],
  enemyLookup: (id: string) => EnemyCard | undefined,
): EnemyCombatState[] {
  return [...enemies].sort((a, b) => {
    const cardA = enemyLookup(a.id);
    const cardB = enemyLookup(b.id);

    const isBossA = cardA?.category === 'boss';
    const isBossB = cardB?.category === 'boss';

    // Bosses always last
    if (isBossA && !isBossB) return 1;
    if (!isBossA && isBossB) return -1;

    const actsLastA = cardA?.specialAbilities.includes('acts_last') ?? false;
    const actsLastB = cardB?.specialAbilities.includes('acts_last') ?? false;

    // "Acts last" after normal but before boss
    if (actsLastA && !actsLastB) return 1;
    if (!actsLastA && actsLastB) return -1;

    // Sort by row (ascending)
    return a.row - b.row;
  });
}

/**
 * Parse enemy action text and apply effects.
 * Handles common patterns: "Deal X damage", "Gain X block", "Apply X Status"
 */
function parseAndApplyAction(
  state: CombatGameState,
  enemyId: string,
  actionText: string,
  enemyCard: EnemyCard | undefined,
): CombatGameState {
  let result = state;
  const enemy = state.enemyCombatStates[enemyId];
  if (!enemy) return state;

  // Parse multiple effects separated by periods or "and"
  const parts = actionText.split(/\.\s*/).filter((s) => s.trim().length > 0);

  for (const part of parts) {
    const text = part.trim();

    // "Deal X damage to all players"
    const dealAllMatch = text.match(/Deal (\d+) damage to all players/i);
    if (dealAllMatch) {
      const amount = parseInt(dealAllMatch[1]!, 10);
      for (const player of result.players) {
        result = applyDamage(result, 'player', player.id, amount);
      }
      continue;
    }

    // "Deal X damage"
    const dealMatch = text.match(/Deal (\d+) damage/i);
    if (dealMatch) {
      const amount = parseInt(dealMatch[1]!, 10);
      // Target player in same row, or first player if boss
      const isBoss = enemyCard?.category === 'boss';
      if (isBoss) {
        for (const player of result.players) {
          result = applyDamage(result, 'player', player.id, amount);
        }
      } else {
        const targetPlayer = result.players[0]; // Simplified: target first player
        if (targetPlayer) {
          result = applyDamage(result, 'player', targetPlayer.id, amount);
        }
      }
      continue;
    }

    // "Gain X Block"
    const blockMatch = text.match(/Gain (\d+) [Bb]lock/i);
    if (blockMatch) {
      const amount = parseInt(blockMatch[1]!, 10);
      const ecs = { ...result.enemyCombatStates };
      const e = ecs[enemyId];
      if (e) {
        ecs[enemyId] = { ...e, block: e.block + amount };
        result = { ...result, enemyCombatStates: ecs };
      }
      continue;
    }

    // "Apply X Vulnerable"
    const vulnMatch = text.match(/Apply (\d+) Vulnerable/i);
    if (vulnMatch) {
      const amount = parseInt(vulnMatch[1]!, 10);
      const targetPlayer = result.players[0];
      if (targetPlayer) {
        result = applyStatusToken(result, 'player', targetPlayer.id, 'vulnerable', amount);
      }
      continue;
    }

    // "Apply X Weak"
    const weakMatch = text.match(/Apply (\d+) Weak/i);
    if (weakMatch) {
      const amount = parseInt(weakMatch[1]!, 10);
      const targetPlayer = result.players[0];
      if (targetPlayer) {
        result = applyStatusToken(result, 'player', targetPlayer.id, 'weak', amount);
      }
      continue;
    }

    // "Gain X Strength"
    const strMatch = text.match(/Gain (\d+) Strength/i);
    if (strMatch) {
      const amount = parseInt(strMatch[1]!, 10);
      result = applyStatusToken(result, 'enemy', enemyId, 'strength', amount);
      continue;
    }

    // Unhandled action — log it
    result = {
      ...result,
      combatLog: [...result.combatLog, `[Unhandled] ${enemyId}: ${text}`],
    };
  }

  return result;
}

/**
 * Resolve a single enemy's action based on their pattern type.
 */
export function resolveEnemyAction(
  state: CombatGameState,
  enemy: EnemyCombatState,
  enemyCard: EnemyCard,
  dieResult: number,
): CombatGameState {
  const pattern = enemyCard.pattern;

  switch (pattern.kind) {
    case 'single':
      return parseAndApplyAction(state, enemy.id, pattern.description, enemyCard);

    case 'die': {
      const action = pattern.actions[String(dieResult)];
      if (!action) return state;
      return parseAndApplyAction(state, enemy.id, action, enemyCard);
    }

    case 'cube': {
      const slot = pattern.slots[enemy.cubePosition];
      if (!slot) return state;
      let result = parseAndApplyAction(state, enemy.id, slot.text, enemyCard);

      // Advance cube position
      const newPos = advanceCubePosition(enemy.cubePosition, pattern);
      const ecs = { ...result.enemyCombatStates };
      const e = ecs[enemy.id];
      if (e) {
        ecs[enemy.id] = { ...e, cubePosition: newPos };
        result = { ...result, enemyCombatStates: ecs };
      }
      return result;
    }
  }
}

/**
 * Advance cube position. After the last slot, loop to the first repeating slot.
 */
export function advanceCubePosition(
  currentPosition: number,
  pattern: Extract<EnemyActionPattern, { kind: 'cube' }>,
): number {
  const nextPos = currentPosition + 1;

  // If within bounds, advance normally
  if (nextPos < pattern.slots.length) {
    return nextPos;
  }

  // Past end: find first repeating slot
  const firstRepeating = pattern.slots.findIndex((s) => s.repeating);
  if (firstRepeating === -1) {
    // No repeating slots (shouldn't happen per rules), loop to 0
    return 0;
  }

  return firstRepeating;
}

/**
 * Remove all enemy block at the start of the enemy turn.
 */
export function removeEnemyBlock(state: CombatGameState): CombatGameState {
  const enemyCombatStates: Record<string, EnemyCombatState> = {};
  for (const [id, enemy] of Object.entries(state.enemyCombatStates)) {
    enemyCombatStates[id] = { ...enemy, block: 0 };
  }
  return { ...state, enemyCombatStates };
}

/**
 * Check for deaths after each action.
 */
export function checkDeaths(state: CombatGameState): CombatGameState {
  let result = state;

  // Check enemy deaths
  const ecs = { ...result.enemyCombatStates };
  for (const [id, enemy] of Object.entries(ecs)) {
    if (enemy.hp <= 0 && !enemy.isDead) {
      ecs[id] = {
        ...enemy,
        isDead: true,
        block: 0,
        vulnerableTokens: 0,
        weakTokens: 0,
        strengthTokens: 0,
        poisonTokens: 0,
      };
    }
  }
  result = { ...result, enemyCombatStates: ecs };

  // Check player deaths
  for (const player of result.players) {
    if (player.hp <= 0) {
      result = {
        ...result,
        phase: 'COMBAT_END',
        combatLog: [...result.combatLog, `Game Over: ${player.nickname} has been defeated`],
      };
      break;
    }
  }

  return result;
}

/**
 * Check if all enemies are dead.
 */
export function isAllEnemiesDead(state: CombatGameState): boolean {
  return Object.values(state.enemyCombatStates).every((e) => e.isDead);
}

/**
 * Resolve the full enemy turn: remove block, sort, act, check deaths, transition.
 */
export function resolveEnemyTurn(
  state: CombatGameState,
  enemyLookup: (id: string) => EnemyCard | undefined,
): CombatGameState {
  let result = removeEnemyBlock(state);

  // Get living enemies
  const livingEnemies = Object.values(result.enemyCombatStates).filter((e) => !e.isDead);
  const sorted = sortEnemiesByActionOrder(livingEnemies, enemyLookup);

  for (const enemy of sorted) {
    const card = enemyLookup(enemy.id);
    if (!card) continue;

    result = resolveEnemyAction(result, enemy, card, result.dieResult ?? 0);
    result = checkDeaths(result);

    // Short-circuit if combat over
    if (result.phase === 'COMBAT_END') return result;
    if (isAllEnemiesDead(result)) {
      return {
        ...result,
        phase: 'COMBAT_END',
        combatLog: [...result.combatLog, 'All enemies defeated!'],
      };
    }
  }

  // All enemies acted, no deaths — transition to cleanup/next player turn
  if (isAllEnemiesDead(result)) {
    return {
      ...result,
      phase: 'COMBAT_END',
      combatLog: [...result.combatLog, 'All enemies defeated!'],
    };
  }

  return { ...result, phase: 'CLEANUP' };
}
