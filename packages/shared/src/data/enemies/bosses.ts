import type { EnemyCard } from '../../schemas/enemies.js';

export const bossEnemies = [
  {
    id: 'the_guardian',
    name: 'The Guardian',
    act: 1 as const,
    category: 'boss' as const,
    hp: { 1: 30, 2: 40, 3: 50, 4: 60 },
    pattern: {
      kind: 'cube' as const,
      description: 'Has two modes: Attack Mode and Defensive Mode. Starts in Attack Mode.',
      slots: [
        { text: 'Attack Mode: Deal 5 damage to ALL players.', repeating: true },
        { text: 'Attack Mode: Deal 6 damage to ALL players.', repeating: true },
        { text: 'Attack Mode: Deal 3 damage to ALL players twice.', repeating: true },
        { text: 'Defensive Mode: Gain 6 Block.', repeating: true },
        { text: 'Defensive Mode: Gain 4 Block. Deal 2 damage to ALL players.', repeating: true },
      ],
    },
    specialAbilities: [
      'Mode Shift: When The Guardian takes 10+ damage in Attack Mode, enter Defensive Mode.',
      'Sharp Hide: In Defensive Mode, whenever a player plays an Attack, that player takes 1 damage.',
    ],
    summons: [],
    rewards: {
      gold: 10,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
  {
    id: 'hexaghost',
    name: 'Hexaghost',
    act: 1 as const,
    category: 'boss' as const,
    hp: { 1: 30, 2: 40, 3: 50, 4: 60 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern with escalating damage',
      slots: [
        { text: 'Deal 1 damage to ALL players 6 times.', repeating: false },
        { text: 'Deal 3 damage to ALL players.', repeating: true },
        { text: 'Deal 2 damage to ALL players. Gain 2 Strength.', repeating: true },
        { text: 'Deal 4 damage to ALL players.', repeating: true },
        { text: 'Put 3 Burn Status cards in each player\'s discard pile.', repeating: true },
        { text: 'Deal 2 damage to ALL players 6 times.', repeating: true },
      ],
    },
    specialAbilities: [],
    summons: [],
    rewards: {
      gold: 10,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
  {
    id: 'slime_boss',
    name: 'Slime Boss',
    act: 1 as const,
    category: 'boss' as const,
    hp: { 1: 28, 2: 38, 3: 48, 4: 58 },
    pattern: {
      kind: 'cube' as const,
      description: 'Cube action pattern',
      slots: [
        { text: 'Deal 5 damage to ALL players.', repeating: true },
        { text: 'Put 2 Slimed Status cards in each player\'s discard pile.', repeating: true },
        { text: 'Deal 5 damage to ALL players.', repeating: true },
      ],
    },
    specialAbilities: [
      'Split: When reduced to half HP or below, split into 2 Slime summons and remove this enemy.',
    ],
    summons: [],
    rewards: {
      gold: 10,
      cardReward: true,
      potionReward: true,
      relicReward: true,
    },
  },
] as const satisfies readonly EnemyCard[];

// O(1) lookup map — used by game engine in Phase 2
export const bossEnemyMap = Object.fromEntries(
  bossEnemies.map(e => [e.id, e])
) as Record<string, EnemyCard>;
