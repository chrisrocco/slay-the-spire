import { describe, it, expect } from 'vitest';
import { EnemyCardSchema } from './enemies.js';
import { encounterEnemies } from '../data/enemies/encounters.js';
import { eliteEnemies } from '../data/enemies/elites.js';
import { bossEnemies } from '../data/enemies/bosses.js';

describe('EnemyCardSchema', () => {
  it('parses a cube-action enemy', () => {
    const enemy = encounterEnemies[0];
    expect(() => EnemyCardSchema.parse(enemy)).not.toThrow();
  });

  it('parses a die-action enemy', () => {
    const dieEnemy = encounterEnemies.find(e => e.pattern.kind === 'die');
    expect(dieEnemy).toBeDefined();
    if (dieEnemy) {
      expect(() => EnemyCardSchema.parse(dieEnemy)).not.toThrow();
    }
  });

  it('parses a single-action enemy', () => {
    const singleEnemy = encounterEnemies.find(e => e.pattern.kind === 'single');
    expect(singleEnemy).toBeDefined();
    if (singleEnemy) {
      expect(() => EnemyCardSchema.parse(singleEnemy)).not.toThrow();
    }
  });

  it('parses an elite with HP board scaling', () => {
    const elite = eliteEnemies[0];
    expect(() => EnemyCardSchema.parse(elite)).not.toThrow();
    expect(typeof elite.hp).toBe('object');
  });

  it('parses a boss enemy', () => {
    const boss = bossEnemies[0];
    expect(() => EnemyCardSchema.parse(boss)).not.toThrow();
  });

  it('rejects an empty object', () => {
    expect(() => EnemyCardSchema.parse({})).toThrow();
  });
});

describe('Enemy data completeness', () => {
  it('has encounter enemies', () => {
    expect(encounterEnemies.length).toBeGreaterThanOrEqual(12);
  });

  it('has exactly 3 elite enemies', () => {
    const elites = eliteEnemies.filter(e => e.category === 'elite');
    expect(elites.length).toBe(3);
  });

  it('has 3 Act 1 bosses', () => {
    expect(bossEnemies.length).toBe(3);
  });

  it('encounter enemy IDs are unique', () => {
    const ids = encounterEnemies.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elite enemy IDs are unique', () => {
    const ids = eliteEnemies.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('boss enemy IDs are unique', () => {
    const ids = bossEnemies.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
