import { describe, it, expect } from 'vitest';
import { collectTriggers, processTriggerQueue } from '../engine/triggers.js';
import { buildTestGameState, buildTestPlayer, buildTestEnemy } from './helpers.js';

describe('collectTriggers (Phase 2 stub)', () => {
  it('returns empty array for START_OF_TURN when no relics', () => {
    const state = buildTestGameState();
    const triggers = collectTriggers(state, 'START_OF_TURN');
    expect(triggers).toEqual([]);
  });

  it('returns empty array for END_OF_TURN when no relics', () => {
    const state = buildTestGameState();
    const triggers = collectTriggers(state, 'END_OF_TURN');
    expect(triggers).toEqual([]);
  });
});

describe('collectTriggers - relic triggers', () => {
  it('Anchor gives 10 Block at START_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['anchor'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('anchor');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'GainBlock', amount: 10, target: 'self' },
    ]);
  });

  it('Bag of Marbles applies 1 Vulnerable to all enemies at START_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['bag_of_marbles'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('bag_of_marbles');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'all_enemies' },
    ]);
  });

  it('Vajra gives 1 Strength at START_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['vajra'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('vajra');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'ApplyStatus', status: 'strength', amount: 1, target: 'self' },
    ]);
  });

  it('Lantern gives 1 Energy at START_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['lantern'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('lantern');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'GainEnergy', amount: 1 },
    ]);
  });

  it('Mercury Hourglass deals 3 damage to all enemies at START_OF_TURN', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['mercury_hourglass'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_TURN');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('mercury_hourglass');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'DealDamage', hits: 1, amount: 3, target: 'all' },
    ]);
  });

  it('Orichalcum gives 6 Block if player has 0 Block at END_OF_TURN', () => {
    const stateNoBlock = buildTestGameState({
      players: [buildTestPlayer({ relics: ['orichalcum'], block: 0 })],
    });
    const triggersNoBlock = collectTriggers(stateNoBlock, 'END_OF_TURN');
    expect(triggersNoBlock).toHaveLength(1);
    expect(triggersNoBlock[0]!.sourceId).toBe('orichalcum');

    const stateWithBlock = buildTestGameState({
      players: [buildTestPlayer({ relics: ['orichalcum'], block: 5 })],
    });
    const triggersWithBlock = collectTriggers(stateWithBlock, 'END_OF_TURN');
    expect(triggersWithBlock).toHaveLength(0);
  });

  it('Burning Blood heals 6 HP at END_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['burning_blood'] })],
    });
    const triggers = collectTriggers(state, 'END_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('burning_blood');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'HealHp', amount: 6, target: 'self' },
    ]);
  });

  it('Meat on the Bone heals 3 HP at END_OF_COMBAT if HP <= 50%', () => {
    const stateHalfHp = buildTestGameState({
      players: [buildTestPlayer({ relics: ['meat_on_the_bone'], hp: 40, maxHp: 80 })],
    });
    const triggersHalfHp = collectTriggers(stateHalfHp, 'END_OF_COMBAT');
    expect(triggersHalfHp).toHaveLength(1);
    expect(triggersHalfHp[0]!.sourceId).toBe('meat_on_the_bone');

    const stateFullHp = buildTestGameState({
      players: [buildTestPlayer({ relics: ['meat_on_the_bone'], hp: 80, maxHp: 80 })],
    });
    const triggersFullHp = collectTriggers(stateFullHp, 'END_OF_COMBAT');
    expect(triggersFullHp).toHaveLength(0);
  });

  it('Lizard Tail heals to 50% HP on ON_DEATH (one-time use, skips if used)', () => {
    // Player at 0 HP (dying) — Lizard Tail should fire and bring them to 50% maxHp
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['lizard_tail'], hp: 0, maxHp: 80 })],
    });
    const triggers = collectTriggers(state, 'ON_DEATH');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('lizard_tail');
    // Effects should heal 40 HP (50% of 80)
    expect(triggers[0]!.effects).toEqual([
      { kind: 'HealHp', amount: 40, target: 'self' },
    ]);
  });

  it('Player with no relics produces no triggers', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: [] })],
    });
    expect(collectTriggers(state, 'START_OF_COMBAT')).toHaveLength(0);
    expect(collectTriggers(state, 'START_OF_TURN')).toHaveLength(0);
    expect(collectTriggers(state, 'END_OF_TURN')).toHaveLength(0);
    expect(collectTriggers(state, 'END_OF_COMBAT')).toHaveLength(0);
    expect(collectTriggers(state, 'ON_DEATH')).toHaveLength(0);
  });

  it('Player with multiple relics produces triggers in order', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['anchor', 'lantern', 'bag_of_marbles'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(3);
    expect(triggers[0]!.sourceId).toBe('anchor');
    expect(triggers[1]!.sourceId).toBe('lantern');
    expect(triggers[2]!.sourceId).toBe('bag_of_marbles');
  });

  it('Blood Vial heals 2 HP at START_OF_COMBAT', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['blood_vial'] })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    expect(triggers).toHaveLength(1);
    expect(triggers[0]!.sourceId).toBe('blood_vial');
    expect(triggers[0]!.effects).toEqual([
      { kind: 'HealHp', amount: 2, target: 'self' },
    ]);
  });
});

describe('processTriggerQueue', () => {
  it('returns state unchanged with empty queue', () => {
    const state = buildTestGameState();
    const result = processTriggerQueue(state, []);
    expect(result).toEqual(state);
  });

  it('processes triggers sequentially', () => {
    const state = buildTestGameState();
    const triggers = [
      {
        phase: 'START_OF_TURN' as const,
        playerId: 'player-1',
        source: 'relic' as const,
        sourceId: 'test-relic',
        effects: [{ kind: 'Unimplemented' as const, description: 'trigger test' }],
      },
    ];

    const result = processTriggerQueue(state, triggers);
    expect(result.combatLog).toContain('[Unimplemented] trigger test');
  });

  it('Anchor trigger applied via processTriggerQueue gives player 10 Block', () => {
    const state = buildTestGameState({
      players: [buildTestPlayer({ relics: ['anchor'], block: 0 })],
    });
    const triggers = collectTriggers(state, 'START_OF_COMBAT');
    const result = processTriggerQueue(state, triggers);
    const player = result.players.find(p => p.id === 'player-1');
    expect(player?.block).toBe(10);
  });
});
