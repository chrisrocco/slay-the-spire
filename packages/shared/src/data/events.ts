export interface EventChoice {
  text: string;
  effect: string;
}

export interface EventCard {
  id: string;
  name: string;
  text: string;
  choices: EventChoice[];
}

export const events: readonly EventCard[] = [
  {
    id: 'big_fish',
    name: 'Big Fish',
    text: 'You spot a giant fish flopping on the riverbank.',
    choices: [
      { text: 'Banana', effect: 'Heal 1/3 of your Max HP.' },
      { text: 'Donut', effect: 'Gain 1 Max HP.' },
      { text: 'Box', effect: 'Gain a relic. Gain a Curse.' },
    ],
  },
  {
    id: 'the_cleric',
    name: 'The Cleric',
    text: 'A cloaked figure offers their services.',
    choices: [
      { text: 'Heal', effect: 'Pay 2 gold. Heal 5 HP.' },
      { text: 'Purify', effect: 'Pay 3 gold. Remove a card from your deck.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'dead_adventurer',
    name: 'Dead Adventurer',
    text: 'You find the corpse of an adventurer.',
    choices: [
      { text: 'Search', effect: 'Roll the die. On 1-3: gain a Curse. On 4-6: gain a relic.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'golden_idol',
    name: 'Golden Idol',
    text: 'You see a golden idol sitting on a pedestal.',
    choices: [
      { text: 'Take', effect: 'Gain 5 gold. Gain a Curse.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'golden_wing',
    name: 'Golden Wing',
    text: 'A golden wing rests before you.',
    choices: [
      { text: 'Pray', effect: 'Remove a card from your deck.' },
      { text: 'Leave', effect: 'Gain 3 gold.' },
    ],
  },
  {
    id: 'living_wall',
    name: 'Living Wall',
    text: 'A living wall blocks your path.',
    choices: [
      { text: 'Forget', effect: 'Remove a card from your deck.' },
      { text: 'Change', effect: 'Transform a card.' },
      { text: 'Grow', effect: 'Upgrade a card.' },
    ],
  },
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    text: 'You find a patch of mushrooms.',
    choices: [
      { text: 'Stomp', effect: 'Fight Fungi Beasts. Gain an upgraded card reward on victory.' },
      { text: 'Eat', effect: 'Heal 3 HP.' },
    ],
  },
  {
    id: 'scrap_ooze',
    name: 'Scrap Ooze',
    text: 'An ooze-covered relic lies before you.',
    choices: [
      { text: 'Reach Inside', effect: 'Roll the die. Lose 1 HP. On 4-6: gain a relic. Otherwise, you may try again.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'shining_light',
    name: 'Shining Light',
    text: 'A warm shining light fills the room.',
    choices: [
      { text: 'Enter', effect: 'Lose 2 HP. Upgrade 2 random cards.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'the_ssssserpent',
    name: 'The Ssssserpent',
    text: 'A cloaked serpent offers you riches.',
    choices: [
      { text: 'Agree', effect: 'Gain 6 gold. Gain a Curse.' },
      { text: 'Disagree', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'world_of_goop',
    name: 'World of Goop',
    text: 'You enter a room covered in goop.',
    choices: [
      { text: 'Gather Gold', effect: 'Gain 4 gold. Lose 1 HP.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
  {
    id: 'wing_statue',
    name: 'Wing Statue',
    text: 'A winged statue stands before you.',
    choices: [
      { text: 'Offer', effect: 'Lose 3 HP. Gain a relic.' },
      { text: 'Leave', effect: 'Nothing happens.' },
    ],
  },
] as const;

export const eventMap: Record<string, EventCard> = Object.fromEntries(
  events.map(e => [e.id, e])
);
