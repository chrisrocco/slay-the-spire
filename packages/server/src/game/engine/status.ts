import type { CombatGameState } from '../state/combatState.js';

type StatusToken = 'vulnerable' | 'weak' | 'strength' | 'poison';

const STATUS_CAPS: Record<StatusToken, number> = {
  vulnerable: 3,
  weak: 3,
  strength: 8,
  poison: Infinity, // poison has no cap (but 30 total across all enemies is a physical component limit)
};

const TOKEN_FIELD_MAP: Record<StatusToken, string> = {
  vulnerable: 'vulnerableTokens',
  weak: 'weakTokens',
  strength: 'strengthTokens',
  poison: 'poisonTokens',
};

/**
 * Apply status tokens to a target, respecting caps.
 */
export function applyStatusToken(
  state: CombatGameState,
  targetType: 'player' | 'enemy',
  targetId: string,
  token: StatusToken,
  amount: number,
): CombatGameState {
  const field = TOKEN_FIELD_MAP[token] as keyof typeof TOKEN_FIELD_MAP;
  const cap = STATUS_CAPS[token];

  if (targetType === 'player') {
    const players = state.players.map((p) => {
      if (p.id !== targetId) return p;
      const current = (p as Record<string, unknown>)[field] as number;
      return { ...p, [field]: Math.min(cap, current + amount) };
    });
    return { ...state, players };
  }

  // Enemy target
  const enemyCombatStates = { ...state.enemyCombatStates };
  const enemy = enemyCombatStates[targetId];
  if (!enemy) return state;

  const current = (enemy as Record<string, unknown>)[field] as number;
  enemyCombatStates[targetId] = {
    ...enemy,
    [field]: Math.min(cap, current + amount),
  };

  return { ...state, enemyCombatStates };
}

/**
 * Remove status tokens from a target. Cannot go below 0.
 */
export function removeStatusToken(
  state: CombatGameState,
  targetType: 'player' | 'enemy',
  targetId: string,
  token: StatusToken,
  amount: number,
): CombatGameState {
  const field = TOKEN_FIELD_MAP[token];

  if (targetType === 'player') {
    const players = state.players.map((p) => {
      if (p.id !== targetId) return p;
      const current = (p as Record<string, unknown>)[field] as number;
      return { ...p, [field]: Math.max(0, current - amount) };
    });
    return { ...state, players };
  }

  // Enemy target
  const enemyCombatStates = { ...state.enemyCombatStates };
  const enemy = enemyCombatStates[targetId];
  if (!enemy) return state;

  const current = (enemy as Record<string, unknown>)[field] as number;
  enemyCombatStates[targetId] = {
    ...enemy,
    [field]: Math.max(0, current - amount),
  };

  return { ...state, enemyCombatStates };
}

/**
 * Apply poison damage to all poisoned targets at end of turn.
 * Each poison token deals 1 HP, bypassing block. Tokens persist (not reduced per turn).
 */
export function applyPoisonTick(state: CombatGameState): CombatGameState {
  let currentState = state;

  // Poison tick on enemies
  const enemyCombatStates = { ...currentState.enemyCombatStates };
  for (const [id, enemy] of Object.entries(enemyCombatStates)) {
    if (enemy.poisonTokens > 0 && !enemy.isDead) {
      enemyCombatStates[id] = {
        ...enemy,
        hp: Math.max(0, enemy.hp - enemy.poisonTokens),
      };
    }
  }
  currentState = { ...currentState, enemyCombatStates };

  return currentState;
}

/**
 * Apply poison to a target, enforcing 30 max combined across all enemies.
 */
export function applyPoison(
  state: CombatGameState,
  targetType: 'player' | 'enemy',
  targetId: string,
  amount: number,
): CombatGameState {
  if (targetType === 'enemy') {
    let totalPoison = 0;
    for (const enemy of Object.values(state.enemyCombatStates)) {
      totalPoison += enemy.poisonTokens;
    }
    const maxAdd = Math.max(0, 30 - totalPoison);
    const actualAmount = Math.min(amount, maxAdd);
    return applyStatusToken(state, targetType, targetId, 'poison', actualAmount);
  }

  return applyStatusToken(state, targetType, targetId, 'poison', amount);
}
