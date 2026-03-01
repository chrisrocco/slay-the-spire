// TODO: Filled in by Plan 07 — relic definitions from rulebook

export interface RelicCard {
  id: string;
  name: string;
  text: string;
  category: 'common' | 'uncommon' | 'rare' | 'boss' | 'special';
}

export const relics: readonly RelicCard[] = [];

export const relicMap: Record<string, RelicCard> = Object.fromEntries(
  relics.map(r => [r.id, r])
);
