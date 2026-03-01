import type { EnemyCard } from '../../schemas/enemies.js';

export const eliteEnemies = [
  {
    id: 'gremlin_nob',
    name: 'Gremlin Nob',
    act: 1 as const,
    category: 'elite' as const,
    hp: { 1: 14, 2: 18, 3: 22, 4: 26 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Deal 4 damage.', repeating: false },
        { text: 'Deal 5 damage.', repeating: true },
        { text: 'Deal 3 damage to ALL players.', repeating: true },
      ],
    },
    specialAbilities: ['Enraged: Starting turn 2, whenever a player plays a Skill, this enemy gains 1 Strength.'],
    summons: [],
    rewards: {
      gold: 5,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
  {
    id: 'lagavulin',
    name: 'Lagavulin',
    act: 1 as const,
    category: 'elite' as const,
    hp: { 1: 16, 2: 20, 3: 24, 4: 28 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Gain 4 Block.', repeating: false },
        { text: 'Gain 4 Block.', repeating: false },
        { text: 'Gain 4 Block.', repeating: false },
        { text: 'Deal 4 damage to ALL players. Apply 1 Vulnerable to ALL players.', repeating: true },
        { text: 'Deal 4 damage to ALL players. Apply 1 Weak to ALL players.', repeating: true },
      ],
    },
    specialAbilities: ['Asleep: Starts with 4 Block. Wakes up when attacked or after 3 turns of sleeping.'],
    summons: [],
    rewards: {
      gold: 5,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
  {
    id: 'sentries',
    name: 'Sentries',
    act: 1 as const,
    category: 'elite' as const,
    hp: { 1: 12, 2: 16, 3: 20, 4: 24 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Deal 3 damage. Put a Daze card on top of the player\'s draw pile.', repeating: true },
        { text: 'Deal 4 damage.', repeating: true },
      ],
    },
    specialAbilities: [],
    summons: ['sentry_summon', 'sentry_summon_2'],
    rewards: {
      gold: 5,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
  // Sentry summons
  {
    id: 'sentry_summon',
    name: 'Sentry',
    act: 1 as const,
    category: 'summon' as const,
    hp: { 1: 12, 2: 16, 3: 20, 4: 24 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Deal 4 damage.', repeating: true },
        { text: 'Deal 3 damage. Put a Daze card on top of the player\'s draw pile.', repeating: true },
      ],
    },
    specialAbilities: [],
    summons: [],
    rewards: {
      gold: 0,
      cardReward: false,
      potionReward: false,
      relicReward: false,
    },
  },
  {
    id: 'sentry_summon_2',
    name: 'Sentry',
    act: 1 as const,
    category: 'summon' as const,
    hp: { 1: 12, 2: 16, 3: 20, 4: 24 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Deal 3 damage. Put a Daze card on top of the player\'s draw pile.', repeating: true },
        { text: 'Deal 4 damage.', repeating: true },
      ],
    },
    specialAbilities: [],
    summons: [],
    rewards: {
      gold: 0,
      cardReward: false,
      potionReward: false,
      relicReward: false,
    },
  },
] as const satisfies readonly EnemyCard[];

// O(1) lookup map — used by game engine in Phase 2
export const eliteEnemyMap = Object.fromEntries(
  eliteEnemies.map(e => [e.id, e])
) as Record<string, EnemyCard>;
