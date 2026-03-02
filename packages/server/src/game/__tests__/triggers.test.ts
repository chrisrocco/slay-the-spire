import { describe, it, expect } from 'vitest';
import { collectTriggers, processTriggerQueue } from '../engine/triggers.js';
import { buildTestGameState } from './helpers.js';

describe('collectTriggers', () => {
  it('returns empty array for START_OF_TURN (Phase 2 stub)', () => {
    const state = buildTestGameState();
    const triggers = collectTriggers(state, 'START_OF_TURN');
    expect(triggers).toEqual([]);
  });

  it('returns empty array for END_OF_TURN (Phase 2 stub)', () => {
    const state = buildTestGameState();
    const triggers = collectTriggers(state, 'END_OF_TURN');
    expect(triggers).toEqual([]);
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
});
