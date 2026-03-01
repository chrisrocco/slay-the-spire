export interface PotionCard {
  id: string;
  name: string;
  text: string;
}

export const potions: readonly PotionCard[] = [
  {
    id: 'fire_potion',
    name: 'Fire Potion',
    text: 'Deal 20 damage to target enemy.',
  },
  {
    id: 'block_potion',
    name: 'Block Potion',
    text: 'Gain 12 Block.',
  },
  {
    id: 'dexterity_potion',
    name: 'Dexterity Potion',
    text: 'Gain 2 Dexterity.',
  },
  {
    id: 'energy_potion',
    name: 'Energy Potion',
    text: 'Gain 2 Energy.',
  },
  {
    id: 'explosive_potion',
    name: 'Explosive Potion',
    text: 'Deal 10 damage to ALL enemies.',
  },
  {
    id: 'fear_potion',
    name: 'Fear Potion',
    text: 'Apply 3 Vulnerable to target enemy.',
  },
  {
    id: 'strength_potion',
    name: 'Strength Potion',
    text: 'Gain 2 Strength.',
  },
  {
    id: 'swift_potion',
    name: 'Swift Potion',
    text: 'Draw 3 cards.',
  },
  {
    id: 'weak_potion',
    name: 'Weak Potion',
    text: 'Apply 3 Weak to target enemy.',
  },
  {
    id: 'blood_potion',
    name: 'Blood Potion',
    text: 'Heal 20% of your Max HP.',
  },
  {
    id: 'entropic_brew',
    name: 'Entropic Brew',
    text: 'Fill all your empty potion slots with random potions.',
  },
  {
    id: 'fairy_in_a_bottle',
    name: 'Fairy in a Bottle',
    text: 'When you would die, heal to 30% Max HP instead. Triggers automatically.',
  },
  {
    id: 'fruit_juice',
    name: 'Fruit Juice',
    text: 'Gain 1 Max HP.',
  },
  {
    id: 'gamblers_brew',
    name: "Gambler's Brew",
    text: 'Discard any number of cards, then draw that many.',
  },
  {
    id: 'liquid_bronze',
    name: 'Liquid Bronze',
    text: 'Gain 3 Thorns.',
  },
  {
    id: 'liquid_memories',
    name: 'Liquid Memories',
    text: 'Choose a card in your discard pile and return it to your hand. It costs 0 this turn.',
  },
  {
    id: 'poison_potion',
    name: 'Poison Potion',
    text: 'Apply 6 Poison to target enemy.',
  },
  {
    id: 'regen_potion',
    name: 'Regen Potion',
    text: 'Gain 5 Regeneration.',
  },
  {
    id: 'skill_potion',
    name: 'Skill Potion',
    text: 'The next Skill you play this turn is played twice.',
  },
  {
    id: 'attack_potion',
    name: 'Attack Potion',
    text: 'The next Attack you play this turn is played twice.',
  },
  {
    id: 'power_potion',
    name: 'Power Potion',
    text: 'The next Power you play this turn is played twice.',
  },
  {
    id: 'colorless_potion',
    name: 'Colorless Potion',
    text: 'Choose 1 of 3 random colorless cards to add to your hand.',
  },
  {
    id: 'cultist_potion',
    name: 'Cultist Potion',
    text: 'Gain 1 Ritual.',
  },
  {
    id: 'distilled_chaos',
    name: 'Distilled Chaos',
    text: 'Play the top 3 cards of your draw pile.',
  },
  {
    id: 'duplication_potion',
    name: 'Duplication Potion',
    text: 'The next card you play this turn is played twice.',
  },
  {
    id: 'essence_of_steel',
    name: 'Essence of Steel',
    text: 'Gain 4 Plated Armor.',
  },
  {
    id: 'heart_of_iron',
    name: 'Heart of Iron',
    text: 'Gain 6 Metallicize.',
  },
  {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    text: 'Escape from a non-boss combat. Receive no rewards.',
  },
  {
    id: 'snecko_oil',
    name: 'Snecko Oil',
    text: 'Draw 5 cards. Randomize the costs of all cards in your hand for the rest of combat.',
  },
] as const;

export const potionMap: Record<string, PotionCard> = Object.fromEntries(
  potions.map(p => [p.id, p])
);
