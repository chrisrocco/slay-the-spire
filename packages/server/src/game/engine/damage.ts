import type { CombatGameState } from '../state/combatState.js';

/**
 * Calculate the damage of a single hit, accounting for Strength, Weak, and Vulnerable.
 *
 * Board game rules:
 * 1. Add Strength to base damage
 * 2. If BOTH Weak and Vulnerable apply: neither modifier applies (cancel)
 * 3. If only Weak: reduce by 1 (min 0)
 * 4. If only Vulnerable: double the damage
 */
export function calculateHitDamage(
  baseAmount: number,
  strengthTokens: number,
  attackerWeakTokens: number,
  defenderVulnerableTokens: number,
): number {
  const withStrength = baseAmount + strengthTokens;

  // Weak + Vulnerable cancel each other
  if (attackerWeakTokens > 0 && defenderVulnerableTokens > 0) {
    return Math.max(0, withStrength);
  }

  // Only Weak: reduce by 1
  if (attackerWeakTokens > 0) {
    return Math.max(0, withStrength - 1);
  }

  // Only Vulnerable: double
  if (defenderVulnerableTokens > 0) {
    return withStrength * 2;
  }

  return Math.max(0, withStrength);
}

/**
 * Apply raw damage to a target, accounting for block.
 * Block absorbs damage first; remaining goes to HP. HP cannot go below 0.
 */
export function applyDamage(
  state: CombatGameState,
  targetType: 'player' | 'enemy',
  targetId: string,
  rawDamage: number,
): CombatGameState {
  if (targetType === 'player') {
    const players = state.players.map((p) => {
      if (p.id !== targetId) return p;
      const blocked = Math.min(p.block, rawDamage);
      const remainingDamage = rawDamage - blocked;
      return {
        ...p,
        block: p.block - blocked,
        hp: Math.max(0, p.hp - remainingDamage),
      };
    });
    return { ...state, players };
  }

  // Enemy target
  const enemyCombatStates = { ...state.enemyCombatStates };
  const enemy = enemyCombatStates[targetId];
  if (!enemy) return state;

  const blocked = Math.min(enemy.block, rawDamage);
  const remainingDamage = rawDamage - blocked;
  enemyCombatStates[targetId] = {
    ...enemy,
    block: enemy.block - blocked,
    hp: Math.max(0, enemy.hp - remainingDamage),
  };

  return { ...state, enemyCombatStates };
}

/**
 * Apply multiple hits from an attacker to a target.
 *
 * Board game rules:
 * - Each hit uses the current Vulnerable/Weak/Strength modifiers
 * - After ALL hits complete: remove 1 Vulnerable from defender (if any),
 *   remove 1 Weak from attacker (if any)
 * - Token removal is ONCE regardless of hit count
 */
export function applyMultiHit(
  state: CombatGameState,
  attackerType: 'player' | 'enemy',
  attackerId: string,
  targetType: 'player' | 'enemy',
  targetId: string,
  hits: number,
  baseAmount: number,
): CombatGameState {
  // Read attacker modifiers
  let attackerStrength = 0;
  let attackerWeak = 0;

  if (attackerType === 'player') {
    const attacker = state.players.find((p) => p.id === attackerId);
    if (attacker) {
      attackerStrength = attacker.strengthTokens;
      attackerWeak = attacker.weakTokens;
    }
  } else {
    const attacker = state.enemyCombatStates[attackerId];
    if (attacker) {
      attackerStrength = attacker.strengthTokens;
      attackerWeak = attacker.weakTokens;
    }
  }

  // Read defender vulnerable
  let defenderVulnerable = 0;
  if (targetType === 'player') {
    const defender = state.players.find((p) => p.id === targetId);
    if (defender) {
      defenderVulnerable = defender.vulnerableTokens;
    }
  } else {
    const defender = state.enemyCombatStates[targetId];
    if (defender) {
      defenderVulnerable = defender.vulnerableTokens;
    }
  }

  // Calculate per-hit damage (same for all hits)
  const hitDamage = calculateHitDamage(baseAmount, attackerStrength, attackerWeak, defenderVulnerable);

  // Apply each hit
  let currentState = state;
  for (let i = 0; i < hits; i++) {
    currentState = applyDamage(currentState, targetType, targetId, hitDamage);
  }

  // After all hits: remove 1 token from each applicable status
  if (defenderVulnerable > 0) {
    if (targetType === 'player') {
      currentState = {
        ...currentState,
        players: currentState.players.map((p) =>
          p.id === targetId
            ? { ...p, vulnerableTokens: Math.max(0, p.vulnerableTokens - 1) }
            : p,
        ),
      };
    } else {
      const ecs = { ...currentState.enemyCombatStates };
      const e = ecs[targetId];
      if (e) {
        ecs[targetId] = { ...e, vulnerableTokens: Math.max(0, e.vulnerableTokens - 1) };
      }
      currentState = { ...currentState, enemyCombatStates: ecs };
    }
  }

  if (attackerWeak > 0) {
    if (attackerType === 'player') {
      currentState = {
        ...currentState,
        players: currentState.players.map((p) =>
          p.id === attackerId
            ? { ...p, weakTokens: Math.max(0, p.weakTokens - 1) }
            : p,
        ),
      };
    } else {
      const ecs = { ...currentState.enemyCombatStates };
      const e = ecs[attackerId];
      if (e) {
        ecs[attackerId] = { ...e, weakTokens: Math.max(0, e.weakTokens - 1) };
      }
      currentState = { ...currentState, enemyCombatStates: ecs };
    }
  }

  return currentState;
}

/**
 * Convenience wrapper for a single hit.
 */
export function applyHit(
  state: CombatGameState,
  attackerType: 'player' | 'enemy',
  attackerId: string,
  targetType: 'player' | 'enemy',
  targetId: string,
  baseAmount: number,
): CombatGameState {
  return applyMultiHit(state, attackerType, attackerId, targetType, targetId, 1, baseAmount);
}
