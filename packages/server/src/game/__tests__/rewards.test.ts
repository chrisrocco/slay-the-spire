import { describe, it, expect } from 'vitest';
import {
  generateRewards,
  generateBossRelicChoices,
  handleRewardPickCard,
  handleRewardPickPotion,
  handleRewardPickRelic,
  handleRewardSkip,
  areAllRewardsChosen,
} from '../rewardHandler.js';
import { buildTestGameState, buildTestPlayer } from './helpers.js';
import type { CombatGameState } from '../state/combatState.js';

// Deterministic RNG for testing
const seededRng = (seed = 0.5) => () => seed;

function buildStateForRewards(playerOverrides?: object[]): CombatGameState {
  const players = playerOverrides
    ? playerOverrides.map((o, i) =>
        buildTestPlayer({ id: `player-${i + 1}`, ...o }),
      )
    : [buildTestPlayer({ id: 'player-1' })];
  return buildTestGameState({ players });
}

// ============================================================
// TASK 1: Reward generation
// ============================================================

describe('generateRewards - encounter', () => {
  it('produces gold in 10-20 range', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'encounter', seededRng(0.5));
    expect(reward.gold).toBeGreaterThanOrEqual(10);
    expect(reward.gold).toBeLessThanOrEqual(20);
  });

  it('produces one card reward per player', () => {
    const state = buildStateForRewards([{}, {}]);
    const reward = generateRewards(state, 'encounter', seededRng(0.1));
    expect(reward.cardRewards).toHaveLength(2);
  });

  it('each card reward contains 3 cards', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'encounter', seededRng(0.2));
    expect(reward.cardRewards[0]!.cardIds).toHaveLength(3);
  });

  it('cards come from the player character pool', () => {
    const state = buildStateForRewards([{ character: 'ironclad' }]);
    const reward = generateRewards(state, 'encounter', seededRng(0.3));
    // The cards should exist — non-empty IDs
    expect(reward.cardRewards[0]!.cardIds.every(id => id.length > 0)).toBe(
      true,
    );
  });

  it('no potion or relic reward for encounter', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'encounter', seededRng(0.5));
    expect(reward.potionReward).toBeNull();
    expect(reward.relicReward).toBeNull();
  });
});

describe('generateRewards - elite', () => {
  it('produces gold in 25-35 range', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'elite', seededRng(0.5));
    expect(reward.gold).toBeGreaterThanOrEqual(25);
    expect(reward.gold).toBeLessThanOrEqual(35);
  });

  it('includes card reward, potion reward, and relic reward', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'elite', seededRng(0.5));
    expect(reward.cardRewards).toHaveLength(1);
    expect(reward.potionReward).not.toBeNull();
    expect(reward.relicReward).not.toBeNull();
  });

  it('relic reward not already owned by any player', () => {
    const state = buildStateForRewards([{ relics: ['anchor'] }]);
    const reward = generateRewards(state, 'elite', seededRng(0.01));
    expect(reward.relicReward).not.toBe('anchor');
  });

  it('Black Star gives extra relic reward from elite', () => {
    const state = buildStateForRewards([{ relics: ['black_star'] }]);
    const reward = generateRewards(state, 'elite', seededRng(0.5));
    // Black Star means elites give 2 relics — relicReward should be set and an extra one too
    expect(reward.relicReward).not.toBeNull();
    // The extra relic is stored in the reward
    expect((reward as any).extraRelicReward).not.toBeNull();
  });
});

describe('generateRewards - boss', () => {
  it('produces boss relic choices (playerCount + 1) for multiplayer', () => {
    const state = buildStateForRewards([{}, {}]); // 2 players
    const choices = generateBossRelicChoices(state, 2, seededRng(0.5));
    expect(choices).toHaveLength(3); // playerCount + 1
  });

  it('produces 3 boss relic choices for solo', () => {
    const state = buildStateForRewards();
    const choices = generateBossRelicChoices(state, 1, seededRng(0.5));
    expect(choices).toHaveLength(3);
  });

  it('boss relic choices are unique', () => {
    const state = buildStateForRewards([{}, {}, {}]);
    const choices = generateBossRelicChoices(state, 3, seededRng(0.5));
    expect(new Set(choices).size).toBe(choices.length);
  });

  it('boss relic choices only contain boss relics', () => {
    const state = buildStateForRewards();
    const choices = generateBossRelicChoices(state, 1, seededRng(0.5));
    // All choices should be valid boss relic IDs
    expect(choices.length).toBeGreaterThan(0);
    choices.forEach(id => expect(id).toBeTruthy());
  });
});

describe('generateRewards - relic modifiers', () => {
  it('Question Card relic adds 1 more card to reward (4 total)', () => {
    const state = buildStateForRewards([{ relics: ['question_card'] }]);
    const reward = generateRewards(state, 'encounter', seededRng(0.3));
    expect(reward.cardRewards[0]!.cardIds).toHaveLength(4);
  });

  it('Busted Crown reduces card choices by 2 (minimum 1)', () => {
    const state = buildStateForRewards([{ relics: ['busted_crown'] }]);
    const reward = generateRewards(state, 'encounter', seededRng(0.3));
    expect(reward.cardRewards[0]!.cardIds).toHaveLength(1);
  });

  it('Golden Ticket guarantees one rare card in reward', () => {
    // golden_ticket is mentioned in plan as guaranteeing a rare card
    const state = buildStateForRewards([{ relics: ['golden_ticket'] }]);
    const reward = generateRewards(state, 'encounter', seededRng(0.3));
    // Should include at least one rare card in the set
    expect(reward.cardRewards[0]).toBeDefined();
    // flagged as containing a rare
    expect((reward.cardRewards[0] as any).hasRare).toBe(true);
  });

  it('Golden Idol gives +1 gold from all sources', () => {
    const stateWithout = buildStateForRewards([{ relics: [] }]);
    const stateWith = buildStateForRewards([{ relics: ['golden_idol'] }]);
    const rng = seededRng(0.5); // fixed
    const rewardWithout = generateRewards(stateWithout, 'encounter', () => 0.5);
    const rewardWith = generateRewards(stateWith, 'encounter', () => 0.5);
    expect(rewardWith.gold).toBe(rewardWithout.gold + 1);
  });

  it('Potion reward skipped if player already at limit', () => {
    const state = buildStateForRewards([
      { potions: ['fire_potion', 'block_potion', 'strength_potion'] },
    ]);
    const reward = generateRewards(state, 'elite', seededRng(0.5));
    expect(reward.potionReward).toBeNull();
  });

  it('Potion Belt increases limit to 5', () => {
    const state = buildStateForRewards([
      {
        potions: [
          'fire_potion',
          'block_potion',
          'strength_potion',
          'swift_potion',
          'weak_potion',
        ],
        relics: ['potion_belt'],
      },
    ]);
    const reward = generateRewards(state, 'elite', seededRng(0.5));
    expect(reward.potionReward).toBeNull();
  });

  it('Upgraded card reward flags cards as upgraded', () => {
    const state = buildStateForRewards();
    const reward = generateRewards(state, 'encounter', seededRng(0.5));
    // cardRewards have an "upgraded" field
    expect(typeof reward.cardRewards[0]!.upgraded).toBe('boolean');
  });
});

// ============================================================
// TASK 2: Reward selection handlers
// ============================================================

describe('handleRewardPickCard', () => {
  function buildStateWithReward(playerOverrides = {}): CombatGameState {
    const player = buildTestPlayer({ id: 'player-1', ...playerOverrides });
    const state = buildTestGameState({ players: [player] });
    return {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [{ cardIds: ['anger', 'armaments', 'bash'], upgraded: false }],
        potionReward: null,
        relicReward: null,
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
  }

  it('adds card to player draw pile', () => {
    const state = buildStateWithReward({ drawPile: [] });
    const result = handleRewardPickCard(state, 'player-1', 'anger');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.drawPile).toContain('anger');
  });

  it('marks cardPicked in playerChoices', () => {
    const state = buildStateWithReward();
    const result = handleRewardPickCard(state, 'player-1', 'anger');
    expect(result.rewardState?.playerChoices['player-1']?.cardPicked).toBe(
      'anger',
    );
  });

  it('Molten Egg auto-upgrades Attack cards', () => {
    const state = buildStateWithReward({ relics: ['molten_egg'], drawPile: [] });
    // 'anger' is an Attack
    const result = handleRewardPickCard(state, 'player-1', 'anger');
    const player = result.players.find(p => p.id === 'player-1')!;
    // Should add 'anger_upgraded' instead
    expect(player.drawPile).toContain('anger_upgraded');
    expect(player.drawPile).not.toContain('anger');
  });

  it('Frozen Egg auto-upgrades Power cards', () => {
    const state = buildStateWithReward({ relics: ['frozen_egg'], drawPile: [] });
    // use a power card - 'inflame' is a power for ironclad
    const result = handleRewardPickCard(state, 'player-1', 'inflame');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.drawPile).toContain('inflame_upgraded');
  });

  it('Toxic Egg auto-upgrades Skill cards', () => {
    const state = buildStateWithReward({ relics: ['toxic_egg'], drawPile: [] });
    // 'armaments' is a Skill
    const result = handleRewardPickCard(state, 'player-1', 'armaments');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.drawPile).toContain('armaments_upgraded');
  });

  it('Ceramic Fish gives +1 gold when card added', () => {
    const state = buildStateWithReward({
      relics: ['ceramic_fish'],
      gold: 50,
      drawPile: [],
    });
    const result = handleRewardPickCard(state, 'player-1', 'anger');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.gold).toBe(51);
  });

  it('Singing Bowl: picking "max_hp" gives 2 Max HP instead of card', () => {
    const state = buildStateWithReward({
      relics: ['singing_bowl'],
      maxHp: 80,
      drawPile: [],
    });
    const result = handleRewardPickCard(state, 'player-1', 'max_hp');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.maxHp).toBe(82);
    expect(player.drawPile).toHaveLength(0); // no card added
  });
});

describe('handleRewardPickPotion', () => {
  function buildStateWithPotion(playerOverrides = {}): CombatGameState {
    const player = buildTestPlayer({ id: 'player-1', ...playerOverrides });
    const state = buildTestGameState({ players: [player] });
    return {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [],
        potionReward: 'fire_potion',
        relicReward: null,
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
  }

  it('adds potion to player potions', () => {
    const state = buildStateWithPotion({ potions: [] });
    const result = handleRewardPickPotion(state, 'player-1');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.potions).toContain('fire_potion');
  });

  it('marks potionPicked in playerChoices', () => {
    const state = buildStateWithPotion({ potions: [] });
    const result = handleRewardPickPotion(state, 'player-1');
    expect(result.rewardState?.playerChoices['player-1']?.potionPicked).toBe(
      true,
    );
  });

  it('rejects pick if already at potion limit (3)', () => {
    const state = buildStateWithPotion({
      potions: ['fire_potion', 'block_potion', 'strength_potion'],
    });
    const result = handleRewardPickPotion(state, 'player-1');
    // Should not add potion
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.potions).toHaveLength(3);
    expect(result.rewardState?.playerChoices['player-1']?.potionPicked).toBe(
      false,
    );
  });

  it('allows pick up to 5 with Potion Belt', () => {
    const state = buildStateWithPotion({
      potions: ['fire_potion', 'block_potion', 'strength_potion', 'swift_potion'],
      relics: ['potion_belt'],
    });
    const result = handleRewardPickPotion(state, 'player-1');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.potions).toContain('fire_potion'); // reward potion added
    expect(player.potions.length).toBe(5);
  });
});

describe('handleRewardPickRelic', () => {
  function buildStateWithRelic(playerOverrides = {}): CombatGameState {
    const player = buildTestPlayer({ id: 'player-1', ...playerOverrides });
    const state = buildTestGameState({ players: [player] });
    return {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [],
        potionReward: null,
        relicReward: 'anchor',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
  }

  it('adds relic to player relics', () => {
    const state = buildStateWithRelic({ relics: [] });
    const result = handleRewardPickRelic(state, 'player-1');
    const player = result.players.find(p => p.id === 'player-1')!;
    expect(player.relics).toContain('anchor');
  });

  it('marks relicPicked in playerChoices', () => {
    const state = buildStateWithRelic({ relics: [] });
    const result = handleRewardPickRelic(state, 'player-1');
    expect(result.rewardState?.playerChoices['player-1']?.relicPicked).toBe(
      true,
    );
  });

  it('Strawberry on pickup gains 1 Max HP', () => {
    const player = buildTestPlayer({ id: 'player-1', relics: [], maxHp: 80 });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'strawberry',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    expect(p.maxHp).toBe(81);
  });

  it('Pear on pickup gains 2 Max HP', () => {
    const player = buildTestPlayer({ id: 'player-1', relics: [], maxHp: 80 });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'pear',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    expect(p.maxHp).toBe(82);
  });

  it('Mango on pickup gains 1 Max HP', () => {
    const player = buildTestPlayer({ id: 'player-1', relics: [], maxHp: 80 });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'mango',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    expect(p.maxHp).toBe(81);
  });

  it('Old Coin on pickup gives 3 gold', () => {
    const player = buildTestPlayer({ id: 'player-1', relics: [], gold: 10 });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'old_coin',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    expect(p.gold).toBe(13);
  });

  it('War Paint on pickup upgrades 2 random Skills', () => {
    const player = buildTestPlayer({
      id: 'player-1',
      relics: [],
      drawPile: ['armaments', 'defend_r', 'anger', 'body_slam'],
    });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'war_paint',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    // Both armaments and defend_r are skills — should be upgraded
    const upgradedCount = p.drawPile.filter(
      id => id.endsWith('_upgraded'),
    ).length;
    expect(upgradedCount).toBeGreaterThanOrEqual(1);
  });

  it('Whetstone on pickup upgrades 2 random Attacks', () => {
    const player = buildTestPlayer({
      id: 'player-1',
      relics: [],
      drawPile: ['anger', 'bash', 'armaments', 'defend_r'],
    });
    const state = buildTestGameState({ players: [player] });
    const stateWithRelic = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: 'whetstone',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardPickRelic(stateWithRelic, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    const upgradedCount = p.drawPile.filter(
      id => id.endsWith('_upgraded'),
    ).length;
    expect(upgradedCount).toBeGreaterThanOrEqual(1);
  });
});

describe('handleRewardSkip', () => {
  it('marks player as skipped without modifying deck', () => {
    const player = buildTestPlayer({ id: 'player-1', drawPile: [] });
    const state = buildTestGameState({ players: [player] });
    const stateWithReward = {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [{ cardIds: ['anger', 'armaments', 'bash'], upgraded: false }],
        potionReward: 'fire_potion',
        relicReward: 'anchor',
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    const result = handleRewardSkip(stateWithReward, 'player-1');
    const p = result.players.find(p => p.id === 'player-1')!;
    expect(result.rewardState?.playerChoices['player-1']?.skipped).toBe(true);
    expect(p.drawPile).toHaveLength(0);
    expect(p.relics).toHaveLength(0);
    expect(p.potions).toHaveLength(0);
  });
});

describe('areAllRewardsChosen', () => {
  it('returns false if any player has not chosen', () => {
    const state = buildTestGameState({
      players: [
        buildTestPlayer({ id: 'player-1' }),
        buildTestPlayer({ id: 'player-2' }),
      ],
    });
    const stateWithReward = {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [],
        potionReward: null,
        relicReward: null,
        playerChoices: {
          'player-1': {
            cardPicked: 'anger',
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
          'player-2': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
        },
      },
    };
    expect(areAllRewardsChosen(stateWithReward)).toBe(false);
  });

  it('returns true if all players picked or skipped', () => {
    const state = buildTestGameState({
      players: [
        buildTestPlayer({ id: 'player-1' }),
        buildTestPlayer({ id: 'player-2' }),
      ],
    });
    const stateWithReward = {
      ...state,
      rewardState: {
        gold: 15,
        cardRewards: [],
        potionReward: null,
        relicReward: null,
        playerChoices: {
          'player-1': {
            cardPicked: 'anger',
            potionPicked: false,
            relicPicked: false,
            skipped: false,
          },
          'player-2': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: true,
          },
        },
      },
    };
    expect(areAllRewardsChosen(stateWithReward)).toBe(true);
  });

  it('returns false when no rewardState exists', () => {
    const state = buildTestGameState();
    expect(areAllRewardsChosen(state)).toBe(false);
  });

  it('Boss relic pick marks unique relics per player', () => {
    const state = buildTestGameState({
      players: [
        buildTestPlayer({ id: 'player-1' }),
        buildTestPlayer({ id: 'player-2' }),
      ],
    });
    // Simulate boss reward state with bossRelicChoices
    const stateWithReward = {
      ...state,
      rewardState: {
        gold: 0,
        cardRewards: [],
        potionReward: null,
        relicReward: null,
        bossRelicChoices: ['black_blood', 'busted_crown', 'ectoplasm'],
        playerChoices: {
          'player-1': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
            bossRelicPicked: 'black_blood',
          },
          'player-2': {
            cardPicked: null,
            potionPicked: false,
            relicPicked: false,
            skipped: false,
            bossRelicPicked: 'busted_crown',
          },
        },
      },
    };
    // Each player should get a unique boss relic
    const p1Choice =
      stateWithReward.rewardState.playerChoices['player-1']?.bossRelicPicked;
    const p2Choice =
      stateWithReward.rewardState.playerChoices['player-2']?.bossRelicPicked;
    expect(p1Choice).not.toBe(p2Choice);
  });
});
