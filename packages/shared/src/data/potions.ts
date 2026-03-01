// TODO: Filled in by Plan 07 — potion definitions from rulebook

export interface PotionCard {
  id: string;
  name: string;
  text: string;
}

export const potions: readonly PotionCard[] = [];

export const potionMap: Record<string, PotionCard> = Object.fromEntries(
  potions.map(p => [p.id, p])
);
