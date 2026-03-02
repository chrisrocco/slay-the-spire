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
