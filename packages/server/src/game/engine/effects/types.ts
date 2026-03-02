// CardEffect discriminated union — covers all effect verbs for Act 1 board game cards

export type DealDamage = {
  kind: 'DealDamage';
  hits: number;
  amount: number;
  target: 'chosen' | 'all_row' | 'all' | 'random';
};

export type GainBlock = {
  kind: 'GainBlock';
  amount: number;
  target: 'self' | 'any_player' | 'all_players';
};

export type ApplyStatus = {
  kind: 'ApplyStatus';
  status: 'vulnerable' | 'weak' | 'strength' | 'poison';
  amount: number;
  target: 'chosen' | 'self' | 'all_row' | 'all_enemies' | 'any_player';
};

export type GainEnergy = {
  kind: 'GainEnergy';
  amount: number;
};

export type DrawCards = {
  kind: 'DrawCards';
  count: number;
};

export type DiscardCards = {
  kind: 'DiscardCards';
  count: number;
  target: 'self' | 'random';
};

export type Exhaust = {
  kind: 'Exhaust';
  target: 'self' | 'chosen_hand' | 'random_hand';
};

export type Channel = {
  kind: 'Channel';
  orbType: 'lightning' | 'frost' | 'dark';
  count: number;
};

export type Evoke = {
  kind: 'Evoke';
  count: number;
};

export type EnterStance = {
  kind: 'EnterStance';
  stance: 'calm' | 'wrath' | 'neutral';
};

export type GainShiv = {
  kind: 'GainShiv';
  count: number;
};

export type GainMiracle = {
  kind: 'GainMiracle';
  count: number;
};

export type Scry = {
  kind: 'Scry';
  count: number;
};

export type AddCardToDiscard = {
  kind: 'AddCardToDiscard';
  cardId: string;
};

export type AddCardToHand = {
  kind: 'AddCardToHand';
  cardId: string;
};

export type UpgradeCard = {
  kind: 'UpgradeCard';
  target: 'random_hand' | 'chosen_hand' | 'all_hand';
};

export type GainGold = {
  kind: 'GainGold';
  amount: number;
};

export type LoseHp = {
  kind: 'LoseHp';
  amount: number;
  target: 'self';
};

export type HealHp = {
  kind: 'HealHp';
  amount: number;
  target: 'self' | 'any_player';
};

export type Conditional = {
  kind: 'Conditional';
  condition: string;
  then: CardEffect[];
  else?: CardEffect[];
};

export type PerX = {
  kind: 'PerX';
  per: string;
  effect: CardEffect;
};

export type Unimplemented = {
  kind: 'Unimplemented';
  description: string;
};

export type CardEffect =
  | DealDamage
  | GainBlock
  | ApplyStatus
  | GainEnergy
  | DrawCards
  | DiscardCards
  | Exhaust
  | Channel
  | Evoke
  | EnterStance
  | GainShiv
  | GainMiracle
  | Scry
  | AddCardToDiscard
  | AddCardToHand
  | UpgradeCard
  | GainGold
  | LoseHp
  | HealHp
  | Conditional
  | PerX
  | Unimplemented;

export type EffectContext = {
  playerId: string;
  targetId?: string | undefined;
  dieResult: number;
  source: 'card' | 'relic' | 'potion' | 'trigger';
};

export type PowerEffect = {
  trigger:
    | 'start_of_turn'
    | 'end_of_turn'
    | 'on_play_attack'
    | 'on_play_skill'
    | 'on_exhaust'
    | 'on_take_damage';
  effects: CardEffect[];
};
