import { describe, it, expect } from 'vitest';
import { PlayerCardSchema } from './cards.js';
import { ironcladCards, ironcladCardMap } from '../data/cards/ironclad.js';
import { silentCards } from '../data/cards/silent.js';
import { defectCards } from '../data/cards/defect.js';
import { watcherCards } from '../data/cards/watcher.js';
import { curses } from '../data/curses.js';
import { events } from '../data/events.js';

describe('PlayerCardSchema', () => {
  it('parses a valid ironclad card', () => {
    const card = ironcladCards[0];
    expect(() => PlayerCardSchema.parse(card)).not.toThrow();
  });

  it('rejects an empty object', () => {
    expect(() => PlayerCardSchema.parse({})).toThrow();
  });
});

describe('Card data completeness', () => {
  it('ironclad has entries (base + upgraded)', () => {
    expect(ironcladCards.length).toBeGreaterThanOrEqual(100);
  });

  it('silent has entries (base + upgraded)', () => {
    expect(silentCards.length).toBeGreaterThanOrEqual(100);
  });

  it('defect has entries (base + upgraded)', () => {
    expect(defectCards.length).toBeGreaterThanOrEqual(100);
  });

  it('watcher has entries (base + upgraded)', () => {
    expect(watcherCards.length).toBeGreaterThanOrEqual(100);
  });

  it('ironclad card IDs are unique', () => {
    const ids = ironcladCards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('silent card IDs are unique', () => {
    const ids = silentCards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defect card IDs are unique', () => {
    const ids = defectCards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('watcher card IDs are unique', () => {
    const ids = watcherCards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ironclad map has base and upgraded strike', () => {
    expect(ironcladCardMap['strike_r']).toBeDefined();
    expect(ironcladCardMap['strike_r_upgraded']).toBeDefined();
  });
});

describe('Misc data completeness', () => {
  it('has 17 curse cards', () => {
    expect(curses.length).toBe(17);
  });

  it('has at least 12 Act 1 events', () => {
    expect(events.length).toBeGreaterThanOrEqual(12);
  });
});
