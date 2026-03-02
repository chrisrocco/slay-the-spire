import type { CombatPlayerState, CombatGameState } from '../state/combatState.js';
import type { EnemyCombatState } from '../state/enemyCombatState.js';
import type { TurnPhase } from '@slay-online/shared';
import type { EnemyActionPattern } from '@slay-online/shared';

export function buildTestPlayer(
  overrides?: Partial<CombatPlayerState>,
): CombatPlayerState {
  return {
    id: 'player-1',
    nickname: 'TestPlayer',
    character: 'ironclad',
    hp: 80,
    maxHp: 80,
    block: 0,
    energy: 3,
    gold: 99,
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    potions: [],
    endedTurn: false,
    vulnerableTokens: 0,
    weakTokens: 0,
    strengthTokens: 0,
    shivTokens: 0,
    orbs: [],
    maxOrbSlots: 3,
    stance: 'neutral',
    miracleTokens: 0,
    beingPlayed: null,
    ...overrides,
  };
}

export function buildTestEnemy(
  overrides?: Partial<EnemyCombatState>,
): EnemyCombatState {
  return {
    id: 'jaw_worm',
    hp: 20,
    maxHp: 20,
    block: 0,
    row: 0,
    isDead: false,
    vulnerableTokens: 0,
    weakTokens: 0,
    strengthTokens: 0,
    poisonTokens: 0,
    cubePosition: 0,
    ...overrides,
  };
}

export function buildTestEnemyWithPattern(
  _pattern: EnemyActionPattern,
  overrides?: Partial<EnemyCombatState>,
): EnemyCombatState {
  return buildTestEnemy(overrides);
}

export function buildTestGameState(overrides?: {
  players?: CombatPlayerState[];
  enemyCombatStates?: Record<string, EnemyCombatState>;
  phase?: TurnPhase;
  round?: number;
  dieResult?: number | null;
}): CombatGameState {
  const defaultPlayer = buildTestPlayer();
  const defaultEnemy = buildTestEnemy();

  return {
    roomCode: 'TEST',
    phase: overrides?.phase ?? 'PLAYER_ACTIONS',
    round: overrides?.round ?? 1,
    dieResult: overrides?.dieResult ?? null,
    players: overrides?.players ?? [defaultPlayer],
    activeEnemies: ['jaw_worm'],
    combatLog: [],
    enemyCombatStates: overrides?.enemyCombatStates ?? {
      jaw_worm: defaultEnemy,
    },
    gamePhase: 'COMBAT',
    currentFloor: 0,
  };
}
