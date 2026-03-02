import type { CardEffect } from './types.js';

/**
 * Card effect registry — maps card IDs to their ordered effect arrays.
 * Covers all Act 1 player cards (base + upgraded) for all four characters.
 *
 * Common effect patterns:
 * - "Deal X damage" → DealDamage
 * - "Gain X Block" → GainBlock
 * - "Apply X Status" → ApplyStatus
 * - "Draw X card(s)" → DrawCards
 * - "Gain X Energy" → GainEnergy
 * - "Exhaust" → Exhaust
 * - Complex/conditional cards → Unimplemented with description
 */
const cardEffects: Record<string, CardEffect[]> = {
  // ======================================================================
  // IRONCLAD STARTERS
  // ======================================================================
  strike_r: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_r_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_r: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_r_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  bash: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' },
  ],
  bash_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'chosen' },
  ],

  // ======================================================================
  // IRONCLAD COMMONS
  // ======================================================================
  anger: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'anger' },
  ],
  anger_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'anger_upgraded' },
  ],
  armaments: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'UpgradeCard', target: 'chosen_hand' },
  ],
  armaments_upgraded: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'UpgradeCard', target: 'all_hand' },
  ],
  body_slam: [
    { kind: 'Unimplemented', description: 'Deal damage equal to current Block' },
  ],
  body_slam_upgraded: [
    { kind: 'Unimplemented', description: 'Deal damage equal to current Block (upgraded, cost 0)' },
  ],
  clash: [
    { kind: 'Unimplemented', description: 'Can only be played if every card in hand is Attack. Deal 14 damage' },
  ],
  clash_upgraded: [
    { kind: 'Unimplemented', description: 'Can only be played if every card in hand is Attack. Deal 18 damage' },
  ],
  cleave: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'all_row' },
  ],
  cleave_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'all_row' },
  ],
  clothesline: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
  ],
  clothesline_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 14, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 3, target: 'chosen' },
  ],
  flex: [
    { kind: 'ApplyStatus', status: 'strength', amount: 2, target: 'self' },
    { kind: 'Unimplemented', description: 'At end of turn, lose 2 Strength' },
  ],
  flex_upgraded: [
    { kind: 'ApplyStatus', status: 'strength', amount: 4, target: 'self' },
    { kind: 'Unimplemented', description: 'At end of turn, lose 4 Strength' },
  ],
  havoc: [
    { kind: 'Unimplemented', description: 'Play top card of draw pile and Exhaust it' },
  ],
  havoc_upgraded: [
    { kind: 'Unimplemented', description: 'Play top card of draw pile and Exhaust it (cost 0)' },
  ],
  headbutt: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Put a card from discard pile on top of draw pile' },
  ],
  headbutt_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Put a card from discard pile on top of draw pile' },
  ],
  heavy_blade: [
    { kind: 'Unimplemented', description: 'Deal 14 damage. Strength affects this card 3 times' },
  ],
  heavy_blade_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 14 damage. Strength affects this card 5 times' },
  ],
  iron_wave: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'chosen' },
  ],
  iron_wave_upgraded: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
  ],
  perfected_strike: [
    { kind: 'Unimplemented', description: 'Deal 6 damage + 2 per Strike card in deck' },
  ],
  perfected_strike_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 6 damage + 3 per Strike card in deck' },
  ],
  pommel_strike: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'DrawCards', count: 1 },
  ],
  pommel_strike_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'DrawCards', count: 2 },
  ],
  shrug_it_off: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'DrawCards', count: 1 },
  ],
  shrug_it_off_upgraded: [
    { kind: 'GainBlock', amount: 11, target: 'self' },
    { kind: 'DrawCards', count: 1 },
  ],
  sword_boomerang: [
    { kind: 'DealDamage', hits: 3, amount: 3, target: 'random' },
  ],
  sword_boomerang_upgraded: [
    { kind: 'DealDamage', hits: 4, amount: 3, target: 'random' },
  ],
  thunderclap: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'all_row' },
  ],
  thunderclap_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'all_row' },
  ],
  true_grit: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'Exhaust', target: 'random_hand' },
  ],
  true_grit_upgraded: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'Exhaust', target: 'chosen_hand' },
  ],
  twin_strike: [
    { kind: 'DealDamage', hits: 2, amount: 5, target: 'chosen' },
  ],
  twin_strike_upgraded: [
    { kind: 'DealDamage', hits: 2, amount: 7, target: 'chosen' },
  ],
  warcry: [
    { kind: 'DrawCards', count: 1 },
    { kind: 'Unimplemented', description: 'Put a card from hand on top of draw pile' },
    { kind: 'Exhaust', target: 'self' },
  ],
  warcry_upgraded: [
    { kind: 'DrawCards', count: 2 },
    { kind: 'Unimplemented', description: 'Put a card from hand on top of draw pile' },
    { kind: 'Exhaust', target: 'self' },
  ],
  wild_strike: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'wound' },
  ],
  wild_strike_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 17, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'wound' },
  ],

  // ======================================================================
  // IRONCLAD UNCOMMONS
  // ======================================================================
  battle_trance: [
    { kind: 'DrawCards', count: 3 },
    { kind: 'Unimplemented', description: 'Cannot draw additional cards this turn' },
  ],
  battle_trance_upgraded: [
    { kind: 'DrawCards', count: 4 },
    { kind: 'Unimplemented', description: 'Cannot draw additional cards this turn' },
  ],
  blood_for_blood: [
    { kind: 'Unimplemented', description: 'Costs 1 less for each HP loss this combat. Deal 18 damage' },
  ],
  blood_for_blood_upgraded: [
    { kind: 'Unimplemented', description: 'Costs 1 less for each HP loss this combat. Deal 22 damage' },
  ],
  bloodletting: [
    { kind: 'LoseHp', amount: 3, target: 'self' },
    { kind: 'GainEnergy', amount: 2 },
  ],
  bloodletting_upgraded: [
    { kind: 'LoseHp', amount: 3, target: 'self' },
    { kind: 'GainEnergy', amount: 3 },
  ],
  burning_pact: [
    { kind: 'Exhaust', target: 'chosen_hand' },
    { kind: 'DrawCards', count: 2 },
  ],
  burning_pact_upgraded: [
    { kind: 'Exhaust', target: 'chosen_hand' },
    { kind: 'DrawCards', count: 3 },
  ],
  carnage: [
    { kind: 'DealDamage', hits: 1, amount: 20, target: 'chosen' },
  ],
  carnage_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 28, target: 'chosen' },
  ],
  combust: [
    { kind: 'Unimplemented', description: 'Power: End of turn lose 1 HP, deal 5 damage to all row' },
  ],
  combust_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn lose 1 HP, deal 7 damage to all row' },
  ],
  dark_embrace: [
    { kind: 'Unimplemented', description: 'Power: Whenever a card is Exhausted, draw 1 card' },
  ],
  dark_embrace_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Whenever a card is Exhausted, draw 1 card (cost 0)' },
  ],
  disarm: [
    { kind: 'Unimplemented', description: 'Enemy loses 2 Strength' },
    { kind: 'Exhaust', target: 'self' },
  ],
  disarm_upgraded: [
    { kind: 'Unimplemented', description: 'Enemy loses 3 Strength' },
    { kind: 'Exhaust', target: 'self' },
  ],
  dropkick: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Vulnerable, gain 1 Energy and draw 1 card' },
  ],
  dropkick_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Vulnerable, gain 1 Energy and draw 1 card' },
  ],
  dual_wield: [
    { kind: 'Unimplemented', description: 'Choose Attack/Power in hand, add copy to hand' },
  ],
  dual_wield_upgraded: [
    { kind: 'Unimplemented', description: 'Choose Attack/Power in hand, add 2 copies to hand' },
  ],
  entrench: [
    { kind: 'Unimplemented', description: 'Double current Block' },
  ],
  entrench_upgraded: [
    { kind: 'Unimplemented', description: 'Double current Block (cost 1)' },
  ],
  evolve: [
    { kind: 'Unimplemented', description: 'Power: When you draw Status/Curse, draw 1 card' },
  ],
  evolve_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When you draw Status/Curse, draw 2 cards' },
  ],
  feel_no_pain: [
    { kind: 'Unimplemented', description: 'Power: When card Exhausted, gain 3 Block' },
  ],
  feel_no_pain_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When card Exhausted, gain 4 Block' },
  ],
  fire_breathing: [
    { kind: 'Unimplemented', description: 'Power: When you draw Status/Curse, deal 6 damage to all row' },
  ],
  fire_breathing_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When you draw Status/Curse, deal 10 damage to all row' },
  ],
  flame_barrier: [
    { kind: 'GainBlock', amount: 12, target: 'self' },
    { kind: 'Unimplemented', description: 'When attacked this turn, deal 4 damage back' },
  ],
  flame_barrier_upgraded: [
    { kind: 'GainBlock', amount: 16, target: 'self' },
    { kind: 'Unimplemented', description: 'When attacked this turn, deal 6 damage back' },
  ],
  ghostly_armor: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
  ],
  ghostly_armor_upgraded: [
    { kind: 'GainBlock', amount: 13, target: 'self' },
  ],
  hemokinesis: [
    { kind: 'LoseHp', amount: 2, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 15, target: 'chosen' },
  ],
  hemokinesis_upgraded: [
    { kind: 'LoseHp', amount: 2, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 20, target: 'chosen' },
  ],
  infernal_blade: [
    { kind: 'Unimplemented', description: 'Add random Attack to hand (costs 0). Exhaust' },
  ],
  infernal_blade_upgraded: [
    { kind: 'Unimplemented', description: 'Add random Attack to hand (costs 0). Exhaust (cost 0)' },
  ],
  inflame: [
    { kind: 'ApplyStatus', status: 'strength', amount: 2, target: 'self' },
  ],
  inflame_upgraded: [
    { kind: 'ApplyStatus', status: 'strength', amount: 3, target: 'self' },
  ],
  intimidate: [
    { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  intimidate_upgraded: [
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  metallicize: [
    { kind: 'Unimplemented', description: 'Power: End of turn gain 3 Block' },
  ],
  metallicize_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn gain 4 Block' },
  ],
  power_through: [
    { kind: 'AddCardToHand', cardId: 'wound' },
    { kind: 'AddCardToHand', cardId: 'wound' },
    { kind: 'GainBlock', amount: 15, target: 'self' },
  ],
  power_through_upgraded: [
    { kind: 'AddCardToHand', cardId: 'wound' },
    { kind: 'AddCardToHand', cardId: 'wound' },
    { kind: 'GainBlock', amount: 20, target: 'self' },
  ],
  pummel: [
    { kind: 'DealDamage', hits: 4, amount: 2, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  pummel_upgraded: [
    { kind: 'DealDamage', hits: 5, amount: 2, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  rage: [
    { kind: 'Unimplemented', description: 'When you play Attack this turn, gain 3 Block' },
  ],
  rage_upgraded: [
    { kind: 'Unimplemented', description: 'When you play Attack this turn, gain 5 Block' },
  ],
  rampage: [
    { kind: 'Unimplemented', description: 'Deal 8 damage, increase by 5 each time played' },
  ],
  rampage_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 8 damage, increase by 8 each time played' },
  ],
  reckless_charge: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'daze' },
  ],
  reckless_charge_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'AddCardToDiscard', cardId: 'daze' },
  ],
  rupture: [
    { kind: 'Unimplemented', description: 'Power: When you lose HP from card, gain 1 Strength' },
  ],
  rupture_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When you lose HP from card, gain 2 Strength' },
  ],
  searing_blow: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
  ],
  searing_blow_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 16, target: 'chosen' },
  ],
  second_wind: [
    { kind: 'Unimplemented', description: 'Exhaust all non-Attack cards, gain 5 Block per card' },
  ],
  second_wind_upgraded: [
    { kind: 'Unimplemented', description: 'Exhaust all non-Attack cards, gain 7 Block per card' },
  ],
  seeing_red: [
    { kind: 'GainEnergy', amount: 2 },
    { kind: 'Exhaust', target: 'self' },
  ],
  seeing_red_upgraded: [
    { kind: 'GainEnergy', amount: 2 },
    { kind: 'Exhaust', target: 'self' },
  ],
  sentinel: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'Unimplemented', description: 'If Exhausted, gain 2 Energy' },
  ],
  sentinel_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'Unimplemented', description: 'If Exhausted, gain 3 Energy' },
  ],
  severance: [
    { kind: 'Unimplemented', description: 'Deal 12 damage to any player. Exhaust' },
  ],
  severance_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 16 damage to any player. Exhaust' },
  ],
  shockwave: [
    { kind: 'ApplyStatus', status: 'weak', amount: 3, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  shockwave_upgraded: [
    { kind: 'ApplyStatus', status: 'weak', amount: 5, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 5, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  spot_weakness: [
    { kind: 'Unimplemented', description: 'If enemy intends to attack, gain 3 Strength' },
  ],
  spot_weakness_upgraded: [
    { kind: 'Unimplemented', description: 'If enemy intends to attack, gain 4 Strength' },
  ],
  uppercut: [
    { kind: 'DealDamage', hits: 1, amount: 13, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'chosen' },
  ],
  uppercut_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 13, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' },
  ],
  whirlwind: [
    { kind: 'Unimplemented', description: 'Deal 5 damage to all row X times (X cost)' },
  ],
  whirlwind_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 8 damage to all row X times (X cost)' },
  ],

  // ======================================================================
  // IRONCLAD RARES
  // ======================================================================
  barricade: [
    { kind: 'Unimplemented', description: 'Power: Keep leftover Block (max 20)' },
  ],
  barricade_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Keep leftover Block (max 20, cost 2)' },
  ],
  berserk: [
    { kind: 'Unimplemented', description: 'Power: When Exhaust a card, deal 1 damage to any row' },
  ],
  berserk_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When Exhaust a card, deal 2 damage to any row' },
  ],
  bludgeon: [
    { kind: 'DealDamage', hits: 1, amount: 32, target: 'chosen' },
  ],
  bludgeon_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 42, target: 'chosen' },
  ],
  brutality: [
    { kind: 'Unimplemented', description: 'Power: Start of turn lose 1 HP, draw 1 card' },
  ],
  brutality_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn lose 1 HP, draw 1 card. Innate' },
  ],
  corruption: [
    { kind: 'Unimplemented', description: 'Power: Skills cost 0, Exhaust when played' },
  ],
  corruption_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Skills cost 0, Exhaust when played (cost 2)' },
  ],
  demon_form: [
    { kind: 'Unimplemented', description: 'Power: Start of turn gain 1 Strength' },
  ],
  demon_form_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn gain 2 Strength' },
  ],
  exhume: [
    { kind: 'Unimplemented', description: 'Put card from Exhaust pile into hand. Exhaust' },
  ],
  exhume_upgraded: [
    { kind: 'Unimplemented', description: 'Put card from Exhaust pile into hand. Exhaust (cost 0)' },
  ],
  feed: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If kills enemy, gain 3 permanent Max HP' },
    { kind: 'Exhaust', target: 'self' },
  ],
  feed_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If kills enemy, gain 4 permanent Max HP' },
    { kind: 'Exhaust', target: 'self' },
  ],
  fiend_fire: [
    { kind: 'Unimplemented', description: 'Exhaust hand, deal 7 damage per card. Exhaust' },
  ],
  fiend_fire_upgraded: [
    { kind: 'Unimplemented', description: 'Exhaust hand, deal 10 damage per card. Exhaust' },
  ],
  immolate: [
    { kind: 'DealDamage', hits: 1, amount: 21, target: 'all_row' },
    { kind: 'AddCardToDiscard', cardId: 'burn' },
  ],
  immolate_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 28, target: 'all_row' },
    { kind: 'AddCardToDiscard', cardId: 'burn' },
  ],
  impervious: [
    { kind: 'GainBlock', amount: 20, target: 'self' },
    { kind: 'Exhaust', target: 'self' },
  ],
  impervious_upgraded: [
    { kind: 'GainBlock', amount: 20, target: 'self' },
    { kind: 'Exhaust', target: 'self' },
  ],
  juggernaut: [
    { kind: 'Unimplemented', description: 'Power: When gain Block, deal 1 damage to random enemy' },
  ],
  juggernaut_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When gain Block, deal 2 damage to random enemy' },
  ],
  limit_break: [
    { kind: 'Unimplemented', description: 'Double Strength (max 10). Exhaust' },
  ],
  limit_break_upgraded: [
    { kind: 'Unimplemented', description: 'Double Strength (max 10)' },
  ],
  offering: [
    { kind: 'LoseHp', amount: 6, target: 'self' },
    { kind: 'GainEnergy', amount: 2 },
    { kind: 'DrawCards', count: 3 },
    { kind: 'Exhaust', target: 'self' },
  ],
  offering_upgraded: [
    { kind: 'LoseHp', amount: 6, target: 'self' },
    { kind: 'GainEnergy', amount: 2 },
    { kind: 'DrawCards', count: 5 },
    { kind: 'Exhaust', target: 'self' },
  ],
  reaper: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'all_row' },
    { kind: 'Unimplemented', description: 'Heal HP equal to unblocked damage dealt' },
  ],
  reaper_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'all_row' },
    { kind: 'Unimplemented', description: 'Heal HP equal to unblocked damage dealt' },
  ],

  // ======================================================================
  // SILENT STARTERS
  // ======================================================================
  strike_g: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_g_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_g: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_g_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  neutralize: [
    { kind: 'DealDamage', hits: 1, amount: 3, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'chosen' },
  ],
  neutralize_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
  ],
  survivor: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  survivor_upgraded: [
    { kind: 'GainBlock', amount: 11, target: 'self' },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],

  // ======================================================================
  // SILENT COMMONS
  // ======================================================================
  acrobatics: [
    { kind: 'DrawCards', count: 3 },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  acrobatics_upgraded: [
    { kind: 'DrawCards', count: 4 },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  backflip: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'DrawCards', count: 2 },
  ],
  backflip_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'DrawCards', count: 2 },
  ],
  bane: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Poison, deal 7 damage again' },
  ],
  bane_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Poison, deal 10 damage again' },
  ],
  blade_dance: [
    { kind: 'GainShiv', count: 3 },
  ],
  blade_dance_upgraded: [
    { kind: 'GainShiv', count: 4 },
  ],
  cloak_and_dagger: [
    { kind: 'GainBlock', amount: 6, target: 'self' },
    { kind: 'GainShiv', count: 1 },
  ],
  cloak_and_dagger_upgraded: [
    { kind: 'GainBlock', amount: 6, target: 'self' },
    { kind: 'GainShiv', count: 2 },
  ],
  dagger_spray: [
    { kind: 'DealDamage', hits: 2, amount: 4, target: 'all_row' },
  ],
  dagger_spray_upgraded: [
    { kind: 'DealDamage', hits: 2, amount: 6, target: 'all_row' },
  ],
  dagger_throw: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'DrawCards', count: 1 },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  dagger_throw_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'DrawCards', count: 1 },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  deadly_poison: [
    { kind: 'ApplyStatus', status: 'poison', amount: 5, target: 'chosen' },
  ],
  deadly_poison_upgraded: [
    { kind: 'ApplyStatus', status: 'poison', amount: 7, target: 'chosen' },
  ],
  deflect: [
    { kind: 'GainBlock', amount: 4, target: 'self' },
  ],
  deflect_upgraded: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
  ],
  dodge_and_roll: [
    { kind: 'GainBlock', amount: 4, target: 'self' },
    { kind: 'Unimplemented', description: 'Next turn gain 4 Block' },
  ],
  dodge_and_roll_upgraded: [
    { kind: 'GainBlock', amount: 6, target: 'self' },
    { kind: 'Unimplemented', description: 'Next turn gain 6 Block' },
  ],
  flying_knee: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Next turn gain 1 Energy' },
  ],
  flying_knee_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Next turn gain 1 Energy' },
  ],
  outmaneuver: [
    { kind: 'Unimplemented', description: 'Next turn gain 2 Energy' },
  ],
  outmaneuver_upgraded: [
    { kind: 'Unimplemented', description: 'Next turn gain 3 Energy' },
  ],
  piercing_wail: [
    { kind: 'Unimplemented', description: 'All enemies in row lose 6 Strength this turn' },
    { kind: 'Exhaust', target: 'self' },
  ],
  piercing_wail_upgraded: [
    { kind: 'Unimplemented', description: 'All enemies in row lose 8 Strength this turn' },
    { kind: 'Exhaust', target: 'self' },
  ],
  poisoned_stab: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'poison', amount: 3, target: 'chosen' },
  ],
  poisoned_stab_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'poison', amount: 4, target: 'chosen' },
  ],
  prepared: [
    { kind: 'DrawCards', count: 1 },
    { kind: 'DiscardCards', count: 1, target: 'self' },
  ],
  prepared_upgraded: [
    { kind: 'DrawCards', count: 2 },
    { kind: 'DiscardCards', count: 2, target: 'self' },
  ],
  quick_slash: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'DrawCards', count: 1 },
  ],
  quick_slash_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'DrawCards', count: 1 },
  ],
  slice: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  slice_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  sneaky_strike: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If discarded card this turn, gain 2 Energy' },
  ],
  sneaky_strike_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 16, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If discarded card this turn, gain 2 Energy' },
  ],
  sucker_punch: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 1, target: 'chosen' },
  ],
  sucker_punch_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
  ],

  // ======================================================================
  // SILENT UNCOMMONS
  // ======================================================================
  accuracy: [
    { kind: 'Unimplemented', description: 'Power: Shivs deal 1 additional damage' },
  ],
  accuracy_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Shivs deal 2 additional damage' },
  ],
  all_out_attack: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'all_row' },
    { kind: 'DiscardCards', count: 1, target: 'random' },
  ],
  all_out_attack_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 14, target: 'all_row' },
    { kind: 'DiscardCards', count: 1, target: 'random' },
  ],
  backstab: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  backstab_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 15, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  caltrops: [
    { kind: 'Unimplemented', description: 'Power: When attacked, deal 3 damage back' },
  ],
  caltrops_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When attacked, deal 5 damage back' },
  ],
  catalyst: [
    { kind: 'Unimplemented', description: 'Double Poison on enemy. Exhaust' },
  ],
  catalyst_upgraded: [
    { kind: 'Unimplemented', description: 'Triple Poison on enemy. Exhaust' },
  ],
  choke: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When play card this turn, enemy loses 3 HP' },
  ],
  choke_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When play card this turn, enemy loses 5 HP' },
  ],
  concentrate: [
    { kind: 'DiscardCards', count: 3, target: 'self' },
    { kind: 'GainEnergy', amount: 2 },
  ],
  concentrate_upgraded: [
    { kind: 'DiscardCards', count: 2, target: 'self' },
    { kind: 'GainEnergy', amount: 2 },
  ],
  crippling_cloud: [
    { kind: 'ApplyStatus', status: 'poison', amount: 4, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  crippling_cloud_upgraded: [
    { kind: 'ApplyStatus', status: 'poison', amount: 7, target: 'all_row' },
    { kind: 'ApplyStatus', status: 'weak', amount: 3, target: 'all_row' },
    { kind: 'Exhaust', target: 'self' },
  ],
  dash: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
  ],
  dash_upgraded: [
    { kind: 'GainBlock', amount: 13, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 13, target: 'chosen' },
  ],
  distraction: [
    { kind: 'Unimplemented', description: 'Add random Skill to hand (costs 0). Exhaust' },
  ],
  distraction_upgraded: [
    { kind: 'Unimplemented', description: 'Add random Skill to hand (costs 0). Exhaust (cost 0)' },
  ],
  endless_agony: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  endless_agony_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  escape_plan: [
    { kind: 'DrawCards', count: 1 },
    { kind: 'Unimplemented', description: 'If drew Skill, gain 3 Block' },
  ],
  escape_plan_upgraded: [
    { kind: 'DrawCards', count: 1 },
    { kind: 'Unimplemented', description: 'If drew Skill, gain 5 Block' },
  ],
  eviscerate: [
    { kind: 'DealDamage', hits: 3, amount: 7, target: 'chosen' },
  ],
  eviscerate_upgraded: [
    { kind: 'DealDamage', hits: 3, amount: 9, target: 'chosen' },
  ],
  expertise: [
    { kind: 'Unimplemented', description: 'Draw until 6 cards in hand' },
  ],
  expertise_upgraded: [
    { kind: 'Unimplemented', description: 'Draw until 7 cards in hand' },
  ],
  finisher: [
    { kind: 'Unimplemented', description: 'Deal 6 damage per Attack played this turn' },
  ],
  finisher_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 8 damage per Attack played this turn' },
  ],
  footwork: [
    { kind: 'Unimplemented', description: 'Power: Gain 2 additional Block from cards' },
  ],
  footwork_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Gain 3 additional Block from cards' },
  ],
  heel_hook: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Weak, gain 1 Energy and draw 1 card' },
  ],
  heel_hook_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy has Weak, gain 1 Energy and draw 1 card' },
  ],
  infinite_blades: [
    { kind: 'Unimplemented', description: 'Power: Start of turn gain 1 Shiv' },
  ],
  infinite_blades_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn gain 2 Shivs' },
  ],
  leg_sweep: [
    { kind: 'ApplyStatus', status: 'weak', amount: 2, target: 'chosen' },
    { kind: 'GainBlock', amount: 11, target: 'self' },
  ],
  leg_sweep_upgraded: [
    { kind: 'ApplyStatus', status: 'weak', amount: 3, target: 'chosen' },
    { kind: 'GainBlock', amount: 14, target: 'self' },
  ],
  masterful_stab: [
    { kind: 'Unimplemented', description: 'Costs 1 more per HP loss this combat. Deal 12 damage' },
  ],
  masterful_stab_upgraded: [
    { kind: 'Unimplemented', description: 'Costs 1 more per HP loss this combat. Deal 16 damage' },
  ],
  noxious_fumes: [
    { kind: 'Unimplemented', description: 'Power: Start of turn apply 2 Poison to all row' },
  ],
  noxious_fumes_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn apply 3 Poison to all row' },
  ],
  phantasmal_killer: [
    { kind: 'Unimplemented', description: 'Next turn Attacks deal double damage' },
  ],
  phantasmal_killer_upgraded: [
    { kind: 'Unimplemented', description: 'Next turn Attacks deal double damage (cost 0)' },
  ],
  predator: [
    { kind: 'DealDamage', hits: 1, amount: 15, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Next turn draw 2 additional cards' },
  ],
  predator_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 20, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Next turn draw 2 additional cards' },
  ],
  reflex: [
    { kind: 'Unimplemented', description: 'Unplayable. If discarded, draw 2 cards' },
  ],
  reflex_upgraded: [
    { kind: 'Unimplemented', description: 'Unplayable. If discarded, draw 3 cards' },
  ],
  riddle_with_holes: [
    { kind: 'DealDamage', hits: 5, amount: 3, target: 'chosen' },
  ],
  riddle_with_holes_upgraded: [
    { kind: 'DealDamage', hits: 5, amount: 4, target: 'chosen' },
  ],
  setup: [
    { kind: 'Unimplemented', description: 'Put card from hand on top of draw pile, costs 0 next time' },
  ],
  setup_upgraded: [
    { kind: 'Unimplemented', description: 'Put card from hand on top of draw pile, costs 0 next time (cost 0)' },
  ],
  skewer: [
    { kind: 'Unimplemented', description: 'Deal 7 damage X times (X cost)' },
  ],
  skewer_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 10 damage X times (X cost)' },
  ],
  tactician: [
    { kind: 'Unimplemented', description: 'Unplayable. If discarded, gain 1 Energy' },
  ],
  tactician_upgraded: [
    { kind: 'Unimplemented', description: 'Unplayable. If discarded, gain 2 Energy' },
  ],
  terror: [
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  terror_upgraded: [
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 3, target: 'chosen' },
    { kind: 'Exhaust', target: 'self' },
  ],
  well_laid_plans: [
    { kind: 'Unimplemented', description: 'Power: End of turn Retain up to 1 card' },
  ],
  well_laid_plans_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn Retain up to 2 cards' },
  ],

  // ======================================================================
  // SILENT RARES
  // ======================================================================
  adrenaline: [
    { kind: 'GainEnergy', amount: 1 },
    { kind: 'DrawCards', count: 2 },
    { kind: 'Exhaust', target: 'self' },
  ],
  adrenaline_upgraded: [
    { kind: 'GainEnergy', amount: 2 },
    { kind: 'DrawCards', count: 2 },
    { kind: 'Exhaust', target: 'self' },
  ],
  after_image: [
    { kind: 'Unimplemented', description: 'Power: When discard, gain 1 Block' },
  ],
  after_image_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When discard, gain 2 Block' },
  ],
  a_thousand_cuts: [
    { kind: 'Unimplemented', description: 'Power: When shuffle, deal 3 damage to any row' },
  ],
  a_thousand_cuts_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When shuffle, deal 4 damage to any row' },
  ],
  bullet_time: [
    { kind: 'Unimplemented', description: 'Cannot draw this turn. Cards cost 0 this turn' },
  ],
  bullet_time_upgraded: [
    { kind: 'Unimplemented', description: 'Cannot draw this turn. Cards cost 0 this turn (cost 2)' },
  ],
  burst: [
    { kind: 'Unimplemented', description: 'Next Skill played twice' },
  ],
  burst_upgraded: [
    { kind: 'Unimplemented', description: 'Next 2 Skills played twice' },
  ],
  corpse_explosion: [
    { kind: 'Unimplemented', description: 'Attach to target. When dies, deal 6 damage to row' },
  ],
  corpse_explosion_upgraded: [
    { kind: 'Unimplemented', description: 'Attach to target. When dies, deal 10 damage to row' },
  ],
  die_die_die: [
    { kind: 'DealDamage', hits: 1, amount: 13, target: 'all' },
    { kind: 'Exhaust', target: 'self' },
  ],
  die_die_die_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 17, target: 'all' },
    { kind: 'Exhaust', target: 'self' },
  ],
  doppelganger: [
    { kind: 'Unimplemented', description: 'Next turn draw X, gain X Energy (X cost). Exhaust' },
  ],
  doppelganger_upgraded: [
    { kind: 'Unimplemented', description: 'Next turn draw X+1, gain X+1 Energy (X cost). Exhaust' },
  ],
  envenom: [
    { kind: 'Unimplemented', description: 'Power: Attacks also apply 1 Poison' },
  ],
  envenom_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Attacks also apply 1 Poison (cost 1)' },
  ],
  grand_finale: [
    { kind: 'Unimplemented', description: 'Only playable with empty draw pile. Deal 50 damage' },
  ],
  grand_finale_upgraded: [
    { kind: 'Unimplemented', description: 'Only playable with empty draw pile. Deal 60 damage. Exhaust' },
  ],
  malaise: [
    { kind: 'Unimplemented', description: 'Apply X+1 damage and Weak (X cost). Exhaust' },
  ],
  malaise_upgraded: [
    { kind: 'Unimplemented', description: 'Apply X+1 damage and 2 Weak (X cost). Exhaust' },
  ],
  storm_of_steel: [
    { kind: 'Unimplemented', description: 'Discard hand, gain 1 Shiv per card' },
  ],
  storm_of_steel_upgraded: [
    { kind: 'Unimplemented', description: 'Discard hand, gain 2 Shivs per card' },
  ],
  tools_of_the_trade: [
    { kind: 'Unimplemented', description: 'Power: Start of turn draw 1, discard 1' },
  ],
  tools_of_the_trade_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn draw 1, discard 1 (cost 0)' },
  ],
  unload: [
    { kind: 'Unimplemented', description: 'Discard any number, deal 3 damage per card' },
  ],
  unload_upgraded: [
    { kind: 'Unimplemented', description: 'Discard any number, deal 5 damage per card' },
  ],
  wraith_form: [
    { kind: 'Unimplemented', description: 'Power: Max 1 HP loss per turn. Cube tracker, Exhaust at 2 cubes' },
  ],
  wraith_form_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Max 1 HP loss per turn. Cube tracker, Exhaust at 3 cubes' },
  ],

  // ======================================================================
  // DEFECT STARTERS
  // ======================================================================
  strike_b: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_b_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_b: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_b_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  zap: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  zap_upgraded: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  dualcast: [
    { kind: 'Evoke', count: 2 },
  ],
  dualcast_upgraded: [
    { kind: 'Evoke', count: 2 },
  ],

  // ======================================================================
  // DEFECT COMMONS
  // ======================================================================
  ball_lightning: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  ball_lightning_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Channel', orbType: 'lightning', count: 1 },
  ],
  barrage: [
    { kind: 'Unimplemented', description: 'Deal 4 damage per channelled Orb' },
  ],
  barrage_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 6 damage per channelled Orb' },
  ],
  beam_cell: [
    { kind: 'DealDamage', hits: 1, amount: 3, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 1, target: 'chosen' },
  ],
  beam_cell_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'ApplyStatus', status: 'vulnerable', amount: 2, target: 'chosen' },
  ],
  charge_battery: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'Unimplemented', description: 'Next turn gain 1 Energy' },
  ],
  charge_battery_upgraded: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'Unimplemented', description: 'Next turn gain 1 Energy' },
  ],
  claw: [
    { kind: 'Unimplemented', description: 'Deal 3 damage. All Claw cards gain +2 damage this combat' },
  ],
  claw_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 5 damage. All Claw cards gain +2 damage this combat' },
  ],
  cold_snap: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'Channel', orbType: 'frost', count: 1 },
  ],
  cold_snap_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'Channel', orbType: 'frost', count: 1 },
  ],
  compile: [
    { kind: 'Unimplemented', description: 'Gain 1 Energy per unique Orb type channelled' },
  ],
  compile_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 1 Energy per unique Orb type channelled (cost 0)' },
  ],
  coolheaded: [
    { kind: 'Channel', orbType: 'frost', count: 1 },
    { kind: 'DrawCards', count: 1 },
  ],
  coolheaded_upgraded: [
    { kind: 'Channel', orbType: 'frost', count: 1 },
    { kind: 'DrawCards', count: 2 },
  ],
  go_for_the_eyes: [
    { kind: 'DealDamage', hits: 1, amount: 3, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy intends attack, apply 1 Weak' },
  ],
  go_for_the_eyes_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy intends attack, apply 2 Weak' },
  ],
  hologram: [
    { kind: 'GainBlock', amount: 3, target: 'self' },
    { kind: 'Unimplemented', description: 'Put card from discard pile into hand. Exhaust' },
  ],
  hologram_upgraded: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
    { kind: 'Unimplemented', description: 'Put card from discard pile into hand' },
  ],
  leap: [
    { kind: 'GainBlock', amount: 9, target: 'self' },
  ],
  leap_upgraded: [
    { kind: 'GainBlock', amount: 12, target: 'self' },
  ],
  reboot: [
    { kind: 'Unimplemented', description: 'Shuffle hand into draw pile. Draw 4 cards. Exhaust' },
  ],
  reboot_upgraded: [
    { kind: 'Unimplemented', description: 'Shuffle hand into draw pile. Draw 6 cards. Exhaust' },
  ],
  stack: [
    { kind: 'Unimplemented', description: 'Gain Block equal to discard pile size' },
  ],
  stack_upgraded: [
    { kind: 'Unimplemented', description: 'Gain Block equal to discard pile size + 3' },
  ],
  steam_barrier: [
    { kind: 'Unimplemented', description: 'Gain 6 Block, loses 1 Block each time played' },
  ],
  steam_barrier_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 8 Block, loses 1 Block each time played' },
  ],
  streamline: [
    { kind: 'Unimplemented', description: 'Deal 15 damage, costs 1 less each time played' },
  ],
  streamline_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 20 damage, costs 1 less each time played' },
  ],
  sweeping_beam: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'all_row' },
    { kind: 'DrawCards', count: 1 },
  ],
  sweeping_beam_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'all_row' },
    { kind: 'DrawCards', count: 1 },
  ],
  turret: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
    { kind: 'Exhaust', target: 'self' },
  ],
  turret_upgraded: [
    { kind: 'Channel', orbType: 'lightning', count: 2 },
    { kind: 'Exhaust', target: 'self' },
  ],

  // ======================================================================
  // DEFECT UNCOMMONS
  // ======================================================================
  aggression: [
    { kind: 'Unimplemented', description: 'Deal 6 damage to any player' },
  ],
  aggression_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 10 damage to any player' },
  ],
  auto_shields: [
    { kind: 'Unimplemented', description: 'If no Block, gain 11 Block' },
  ],
  auto_shields_upgraded: [
    { kind: 'Unimplemented', description: 'If no Block, gain 15 Block' },
  ],
  blizzard: [
    { kind: 'Unimplemented', description: 'Deal 2 damage to all row per Frost channelled this combat' },
  ],
  blizzard_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 3 damage to all row per Frost channelled this combat' },
  ],
  boot_sequence: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'Exhaust', target: 'self' },
  ],
  boot_sequence_upgraded: [
    { kind: 'GainBlock', amount: 13, target: 'self' },
    { kind: 'Exhaust', target: 'self' },
  ],
  bullseye: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Apply 2 Lock-On' },
  ],
  bullseye_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Apply 3 Lock-On' },
  ],
  capacitor: [
    { kind: 'Unimplemented', description: 'Gain 2 Orb slots' },
  ],
  capacitor_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 3 Orb slots' },
  ],
  chaos: [
    { kind: 'Unimplemented', description: 'Channel 1 random Orb' },
  ],
  chaos_upgraded: [
    { kind: 'Unimplemented', description: 'Channel 2 random Orbs' },
  ],
  chill: [
    { kind: 'Unimplemented', description: 'Channel 1 Frost per enemy in row. Exhaust' },
  ],
  chill_upgraded: [
    { kind: 'Unimplemented', description: 'Channel 1 Frost per enemy in row. Innate. Exhaust' },
  ],
  consume: [
    { kind: 'Unimplemented', description: 'Gain 2 Focus. Lose 1 Orb slot' },
  ],
  consume_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 3 Focus. Lose 1 Orb slot' },
  ],
  darkness: [
    { kind: 'Channel', orbType: 'dark', count: 1 },
  ],
  darkness_upgraded: [
    { kind: 'Channel', orbType: 'dark', count: 1 },
    { kind: 'Unimplemented', description: 'Trigger passive of all Dark Orbs' },
  ],
  defragment: [
    { kind: 'Unimplemented', description: 'Gain 1 Focus' },
  ],
  defragment_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 2 Focus' },
  ],
  doom_and_gloom: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'all_row' },
    { kind: 'Channel', orbType: 'dark', count: 1 },
  ],
  doom_and_gloom_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 14, target: 'all_row' },
    { kind: 'Channel', orbType: 'dark', count: 1 },
  ],
  double_energy: [
    { kind: 'Unimplemented', description: 'Double your Energy. Exhaust' },
  ],
  double_energy_upgraded: [
    { kind: 'Unimplemented', description: 'Double your Energy. Exhaust (cost 0)' },
  ],
  equilibrium: [
    { kind: 'GainBlock', amount: 13, target: 'self' },
    { kind: 'Unimplemented', description: 'Retain your hand this turn' },
  ],
  equilibrium_upgraded: [
    { kind: 'GainBlock', amount: 16, target: 'self' },
    { kind: 'Unimplemented', description: 'Retain your hand this turn' },
  ],
  force_field: [
    { kind: 'Unimplemented', description: 'Costs 1 less per Power in play. Gain 12 Block' },
  ],
  force_field_upgraded: [
    { kind: 'Unimplemented', description: 'Costs 1 less per Power in play. Gain 16 Block' },
  ],
  ftl: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If fewer than 3 cards played this turn, draw 1' },
  ],
  ftl_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If fewer than 4 cards played this turn, draw 1' },
  ],
  fusion: [
    { kind: 'Unimplemented', description: 'Channel 1 Plasma' },
  ],
  fusion_upgraded: [
    { kind: 'Unimplemented', description: 'Channel 1 Plasma (cost 0)' },
  ],
  genetic_algorithm: [
    { kind: 'Unimplemented', description: 'Gain 1 Block, permanently increase by 2. Exhaust' },
  ],
  genetic_algorithm_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 1 Block, permanently increase by 3. Exhaust' },
  ],
  glacier: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'Channel', orbType: 'frost', count: 2 },
  ],
  glacier_upgraded: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'Channel', orbType: 'frost', count: 2 },
  ],
  heatsinks: [
    { kind: 'Unimplemented', description: 'Power: When play Power, draw 1 card' },
  ],
  heatsinks_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When play Power, draw 2 cards' },
  ],
  hello_world: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add random Common to hand' },
  ],
  hello_world_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add random Common to hand (cost 0)' },
  ],
  loop: [
    { kind: 'Unimplemented', description: 'Power: Start of turn trigger first Orb passive' },
  ],
  loop_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn trigger first Orb passive twice' },
  ],
  melter: [
    { kind: 'Unimplemented', description: 'Remove enemy Block. Deal 10 damage' },
  ],
  melter_upgraded: [
    { kind: 'Unimplemented', description: 'Remove enemy Block. Deal 14 damage' },
  ],
  overclock: [
    { kind: 'DrawCards', count: 2 },
    { kind: 'AddCardToDiscard', cardId: 'burn' },
  ],
  overclock_upgraded: [
    { kind: 'DrawCards', count: 3 },
    { kind: 'AddCardToDiscard', cardId: 'burn' },
  ],
  recycle: [
    { kind: 'Unimplemented', description: 'Exhaust a card, gain Energy equal to cost' },
  ],
  recycle_upgraded: [
    { kind: 'Unimplemented', description: 'Exhaust a card, gain Energy equal to cost (cost 0)' },
  ],
  reinforced_body: [
    { kind: 'Unimplemented', description: 'Gain 7 Block X times (X cost)' },
  ],
  reinforced_body_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 9 Block X times (X cost)' },
  ],
  reprogram: [
    { kind: 'Unimplemented', description: 'Lose 1 Focus, gain 1 Strength and 1 Dexterity' },
  ],
  reprogram_upgraded: [
    { kind: 'Unimplemented', description: 'Lose 1 Focus, gain 2 Strength and 2 Dexterity' },
  ],
  rip_and_tear: [
    { kind: 'DealDamage', hits: 2, amount: 7, target: 'random' },
  ],
  rip_and_tear_upgraded: [
    { kind: 'DealDamage', hits: 2, amount: 9, target: 'random' },
  ],
  scrape: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Draw 4, discard all drawn that cost > 0' },
  ],
  scrape_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Draw 5, discard all drawn that cost > 0' },
  ],
  self_repair: [
    { kind: 'Unimplemented', description: 'Power: End of combat heal 7 HP' },
  ],
  self_repair_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of combat heal 10 HP' },
  ],
  skim: [
    { kind: 'DrawCards', count: 3 },
  ],
  skim_upgraded: [
    { kind: 'DrawCards', count: 4 },
  ],
  static_discharge: [
    { kind: 'Unimplemented', description: 'Power: When take unblocked attack damage, Channel 1 Lightning' },
  ],
  static_discharge_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When take unblocked attack damage, Channel 2 Lightning' },
  ],
  storm: [
    { kind: 'Unimplemented', description: 'Power: When play Power, Channel 1 Lightning' },
  ],
  storm_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When play Power, Channel 1 Lightning (cost 0)' },
  ],
  sunder: [
    { kind: 'DealDamage', hits: 1, amount: 24, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If kills enemy, gain 3 Energy' },
  ],
  sunder_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 32, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If kills enemy, gain 3 Energy' },
  ],
  tempest: [
    { kind: 'Unimplemented', description: 'Channel X+1 Lightning. Exhaust (X cost)' },
  ],
  tempest_upgraded: [
    { kind: 'Unimplemented', description: 'Channel X+2 Lightning. Exhaust (X cost)' },
  ],
  white_noise: [
    { kind: 'Unimplemented', description: 'Add random Power to hand (costs 0). Exhaust' },
  ],
  white_noise_upgraded: [
    { kind: 'Unimplemented', description: 'Add random Power to hand (costs 0). Exhaust (cost 0)' },
  ],

  // ======================================================================
  // DEFECT RARES
  // ======================================================================
  buffer: [
    { kind: 'Unimplemented', description: 'Power: Prevent next damage, then Exhaust' },
  ],
  buffer_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Prevent next damage, cube tracker, Exhaust at 2+ cubes' },
  ],
  echo_form: [
    { kind: 'Unimplemented', description: 'Power: Ethereal. First Attack/Skill played twice each turn' },
  ],
  echo_form_upgraded: [
    { kind: 'Unimplemented', description: 'Power: First Attack/Skill played twice each turn' },
  ],
  electrodynamics: [
    { kind: 'Channel', orbType: 'lightning', count: 2 },
    { kind: 'Unimplemented', description: 'Lightning hits any row when Evoked and End of Turn' },
  ],
  electrodynamics_upgraded: [
    { kind: 'Channel', orbType: 'lightning', count: 3 },
    { kind: 'Unimplemented', description: 'Lightning hits any row when Evoked and End of Turn' },
  ],
  fission: [
    { kind: 'Unimplemented', description: 'Remove all Orbs. Gain 1 Energy and draw 1 per Orb. Exhaust' },
  ],
  fission_upgraded: [
    { kind: 'Unimplemented', description: 'Evoke all Orbs. Gain 1 Energy and draw 1 per Orb. Exhaust' },
  ],
  amplify: [
    { kind: 'Unimplemented', description: 'Orb End of turn effects +3 damage' },
  ],
  amplify_upgraded: [
    { kind: 'Unimplemented', description: 'Orb End of turn effects +5 damage' },
  ],
  darkness_rare: [
    { kind: 'Unimplemented', description: 'Dark orbs Evoke for +3 damage' },
  ],
  darkness_rare_upgraded: [
    { kind: 'Unimplemented', description: 'Dark orbs Evoke for +5 damage' },
  ],
  biased_cognition: [
    { kind: 'Unimplemented', description: 'Gain 4 Focus. Each turn lose 1 Focus' },
  ],
  biased_cognition_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 5 Focus. Each turn lose 1 Focus' },
  ],
  creative_ai: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add random Power to hand' },
  ],
  creative_ai_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add random Power to hand (cost 2)' },
  ],
  hyperbeam: [
    { kind: 'Unimplemented', description: 'Lightning End of turn +1' },
  ],
  hyperbeam_upgraded: [
    { kind: 'Unimplemented', description: 'Lightning End of turn +2' },
  ],
  multi_cast: [
    { kind: 'Unimplemented', description: 'Remove all Orbs (X cost)' },
  ],
  multi_cast_upgraded: [
    { kind: 'Unimplemented', description: 'Evoke an Orb X+1 times (X cost)' },
  ],
  thunder_strike: [
    { kind: 'Unimplemented', description: 'Deal 3 damage per Lightning Orb' },
  ],
  thunder_strike_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 4 damage per Lightning Orb' },
  ],
  core_surge: [
    { kind: 'Unimplemented', description: 'Retain. Remove negatives from all players. Deal 3 damage' },
  ],
  core_surge_upgraded: [
    { kind: 'Unimplemented', description: 'Retain. Remove negatives from all players. Deal 4 damage' },
  ],
  meteor_strike: [
    { kind: 'Unimplemented', description: 'Deal 12 damage. Costs 1 less per Power in play' },
  ],
  meteor_strike_upgraded: [
    { kind: 'Unimplemented', description: 'Costs 1 less per Power in play' },
  ],
  all_for_one: [
    { kind: 'Unimplemented', description: 'Put all 0-cost cards from discard into hand' },
  ],
  all_for_one_upgraded: [
    { kind: 'Unimplemented', description: 'Put all 0-cost cards from discard into hand (cost 1)' },
  ],
  rainbow: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
    { kind: 'Channel', orbType: 'frost', count: 1 },
    { kind: 'Channel', orbType: 'dark', count: 1 },
    { kind: 'Exhaust', target: 'self' },
  ],
  rainbow_upgraded: [
    { kind: 'Channel', orbType: 'lightning', count: 1 },
    { kind: 'Channel', orbType: 'frost', count: 1 },
    { kind: 'Channel', orbType: 'dark', count: 1 },
  ],
  seek: [
    { kind: 'Unimplemented', description: 'Search draw pile for 1 card, put in hand. Exhaust' },
  ],
  seek_upgraded: [
    { kind: 'Unimplemented', description: 'Search draw pile for 2 cards, put in hand. Exhaust' },
  ],

  // ======================================================================
  // WATCHER STARTERS
  // ======================================================================
  strike_w: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
  ],
  strike_w_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
  ],
  defend_w: [
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  defend_w_upgraded: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
  ],
  eruption: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
  ],
  eruption_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
  ],
  vigilance: [
    { kind: 'GainBlock', amount: 8, target: 'any_player' },
    { kind: 'EnterStance', stance: 'calm' },
  ],
  vigilance_upgraded: [
    { kind: 'GainBlock', amount: 12, target: 'any_player' },
    { kind: 'EnterStance', stance: 'calm' },
  ],

  // ======================================================================
  // WATCHER COMMONS
  // ======================================================================
  bowling_bash: [
    { kind: 'Unimplemented', description: 'Deal 7 damage per enemy in row' },
  ],
  bowling_bash_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 10 damage per enemy in row' },
  ],
  consecrate: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'all_row' },
  ],
  consecrate_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'all_row' },
  ],
  crescendo: [
    { kind: 'EnterStance', stance: 'wrath' },
    { kind: 'Exhaust', target: 'self' },
  ],
  crescendo_upgraded: [
    { kind: 'EnterStance', stance: 'wrath' },
    { kind: 'Exhaust', target: 'self' },
  ],
  crush_joints: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Skill, apply 1 Vulnerable' },
  ],
  crush_joints_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Skill, apply 2 Vulnerable' },
  ],
  cut_through_fate: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Scry', count: 2 },
    { kind: 'DrawCards', count: 1 },
  ],
  cut_through_fate_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'Scry', count: 2 },
    { kind: 'DrawCards', count: 1 },
  ],
  empty_body: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'EnterStance', stance: 'neutral' },
  ],
  empty_body_upgraded: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'EnterStance', stance: 'neutral' },
  ],
  empty_fist: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'EnterStance', stance: 'neutral' },
  ],
  empty_fist_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 14, target: 'chosen' },
    { kind: 'EnterStance', stance: 'neutral' },
  ],
  evaluate: [
    { kind: 'GainBlock', amount: 6, target: 'self' },
    { kind: 'Unimplemented', description: 'Shuffle Insight into draw pile' },
  ],
  evaluate_upgraded: [
    { kind: 'GainBlock', amount: 10, target: 'self' },
    { kind: 'Unimplemented', description: 'Shuffle Insight into draw pile' },
  ],
  flurry_of_blows: [
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When change Stance, return from discard to hand' },
  ],
  flurry_of_blows_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When change Stance, return from discard to hand' },
  ],
  flying_sleeves: [
    { kind: 'DealDamage', hits: 2, amount: 4, target: 'chosen' },
  ],
  flying_sleeves_upgraded: [
    { kind: 'DealDamage', hits: 2, amount: 6, target: 'chosen' },
  ],
  follow_up: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Attack, gain 1 Energy' },
  ],
  follow_up_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Attack, gain 1 Energy' },
  ],
  halt: [
    { kind: 'GainBlock', amount: 3, target: 'self' },
    { kind: 'Unimplemented', description: 'If in Wrath, gain 9 additional Block' },
  ],
  halt_upgraded: [
    { kind: 'GainBlock', amount: 4, target: 'self' },
    { kind: 'Unimplemented', description: 'If in Wrath, gain 14 additional Block' },
  ],
  just_lucky: [
    { kind: 'Scry', count: 1 },
    { kind: 'GainBlock', amount: 2, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 3, target: 'chosen' },
  ],
  just_lucky_upgraded: [
    { kind: 'Scry', count: 2 },
    { kind: 'GainBlock', amount: 3, target: 'self' },
    { kind: 'DealDamage', hits: 1, amount: 4, target: 'chosen' },
  ],
  pressure_points: [
    { kind: 'Unimplemented', description: 'Apply 8 Mark. All enemies with Mark take Mark damage' },
  ],
  pressure_points_upgraded: [
    { kind: 'Unimplemented', description: 'Apply 11 Mark. All enemies with Mark take Mark damage' },
  ],
  prostrate: [
    { kind: 'Unimplemented', description: 'Gain 2 Mantra' },
    { kind: 'GainBlock', amount: 4, target: 'self' },
  ],
  prostrate_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 3 Mantra' },
    { kind: 'GainBlock', amount: 5, target: 'self' },
  ],
  protect: [
    { kind: 'GainBlock', amount: 12, target: 'any_player' },
  ],
  protect_upgraded: [
    { kind: 'GainBlock', amount: 16, target: 'any_player' },
  ],
  sash_whip: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Attack, apply 1 Weak' },
  ],
  sash_whip_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If last card was Attack, apply 2 Weak' },
  ],
  third_eye: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'Scry', count: 3 },
  ],
  third_eye_upgraded: [
    { kind: 'GainBlock', amount: 9, target: 'self' },
    { kind: 'Scry', count: 5 },
  ],
  tranquility: [
    { kind: 'EnterStance', stance: 'calm' },
    { kind: 'Exhaust', target: 'self' },
  ],
  tranquility_upgraded: [
    { kind: 'EnterStance', stance: 'calm' },
    { kind: 'Exhaust', target: 'self' },
  ],

  // ======================================================================
  // WATCHER UNCOMMONS
  // ======================================================================
  battle_hymn: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add Smite to hand' },
  ],
  battle_hymn_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn add 2 Smites to hand' },
  ],
  carve_reality: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'AddCardToHand', cardId: 'smite' },
  ],
  carve_reality_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'AddCardToHand', cardId: 'smite' },
  ],
  collect: [
    { kind: 'Unimplemented', description: 'Put Miracle in hand at start of next X turns (X cost)' },
  ],
  collect_upgraded: [
    { kind: 'Unimplemented', description: 'Put Miracle+ in hand at start of next X turns (X cost)' },
  ],
  conclude: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'all_row' },
    { kind: 'Unimplemented', description: 'End your turn' },
  ],
  conclude_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 16, target: 'all_row' },
    { kind: 'Unimplemented', description: 'End your turn' },
  ],
  deceive_reality: [
    { kind: 'GainBlock', amount: 4, target: 'self' },
    { kind: 'AddCardToHand', cardId: 'safety' },
  ],
  deceive_reality_upgraded: [
    { kind: 'GainBlock', amount: 7, target: 'self' },
    { kind: 'AddCardToHand', cardId: 'safety_upgraded' },
  ],
  fasting: [
    { kind: 'ApplyStatus', status: 'strength', amount: 3, target: 'self' },
    { kind: 'Unimplemented', description: 'Gain 3 Dexterity. Start of turn gain 1 less Energy' },
  ],
  fasting_upgraded: [
    { kind: 'ApplyStatus', status: 'strength', amount: 4, target: 'self' },
    { kind: 'Unimplemented', description: 'Gain 4 Dexterity. Start of turn gain 1 less Energy' },
  ],
  fear_no_evil: [
    { kind: 'DealDamage', hits: 1, amount: 8, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy intends attack, enter Calm' },
  ],
  fear_no_evil_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 11, target: 'chosen' },
    { kind: 'Unimplemented', description: 'If enemy intends attack, enter Calm' },
  ],
  foreign_influence: [
    { kind: 'Unimplemented', description: 'Choose 1 of 3 random Attacks from any character. Exhaust' },
  ],
  foreign_influence_upgraded: [
    { kind: 'Unimplemented', description: 'Choose 1 of 3 random Attacks, costs 0. Exhaust' },
  ],
  indignation: [
    { kind: 'Unimplemented', description: 'If in Wrath, apply 5 Vulnerable to all row. Otherwise enter Wrath' },
  ],
  indignation_upgraded: [
    { kind: 'Unimplemented', description: 'If in Wrath, apply 7 Vulnerable to all row. Otherwise enter Wrath' },
  ],
  inner_peace: [
    { kind: 'Unimplemented', description: 'If in Calm, draw 3 cards. Otherwise enter Calm' },
  ],
  inner_peace_upgraded: [
    { kind: 'Unimplemented', description: 'If in Calm, draw 4 cards. Otherwise enter Calm' },
  ],
  like_water: [
    { kind: 'Unimplemented', description: 'Power: End of turn if in Calm, gain 5 Block' },
  ],
  like_water_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn if in Calm, gain 7 Block' },
  ],
  meditate: [
    { kind: 'Unimplemented', description: 'Put card from discard into hand. Enter Calm. End turn' },
  ],
  meditate_upgraded: [
    { kind: 'Unimplemented', description: 'Put 2 cards from discard into hand. Enter Calm. End turn' },
  ],
  mental_fortress: [
    { kind: 'Unimplemented', description: 'Power: When change Stance, gain 4 Block' },
  ],
  mental_fortress_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When change Stance, gain 6 Block' },
  ],
  nirvana: [
    { kind: 'Unimplemented', description: 'Power: When Scry, gain 3 Block' },
  ],
  nirvana_upgraded: [
    { kind: 'Unimplemented', description: 'Power: When Scry, gain 4 Block' },
  ],
  perseverance: [
    { kind: 'Unimplemented', description: 'Gain 5 Block. When Retained, +2 Block permanently. Retain' },
  ],
  perseverance_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 7 Block. When Retained, +3 Block permanently. Retain' },
  ],
  pray: [
    { kind: 'Unimplemented', description: 'Gain 3 Mantra. Shuffle Insight into draw pile' },
  ],
  pray_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 4 Mantra. Shuffle Insight into draw pile' },
  ],
  reach_heaven: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Shuffle Through Violence into draw pile' },
  ],
  reach_heaven_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 15, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Shuffle Through Violence into draw pile' },
  ],
  sanctity: [
    { kind: 'GainBlock', amount: 6, target: 'self' },
    { kind: 'Unimplemented', description: 'If last card was Skill, draw 2 cards' },
  ],
  sanctity_upgraded: [
    { kind: 'GainBlock', amount: 9, target: 'self' },
    { kind: 'Unimplemented', description: 'If last card was Skill, draw 2 cards' },
  ],
  sands_of_time: [
    { kind: 'Unimplemented', description: 'Deal 20 damage. When Retained, cost -1. Retain' },
  ],
  sands_of_time_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 26 damage. When Retained, cost -1. Retain' },
  ],
  sign_from_beyond: [
    { kind: 'DealDamage', hits: 1, amount: 6, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Add random Wrath card to hand' },
  ],
  sign_from_beyond_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 10, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Add random Wrath card to hand' },
  ],
  study: [
    { kind: 'Unimplemented', description: 'Power: End of turn shuffle Insight into draw pile' },
  ],
  study_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn shuffle Insight into draw pile (cost 1)' },
  ],
  swivel: [
    { kind: 'GainBlock', amount: 8, target: 'self' },
    { kind: 'Unimplemented', description: 'Next Attack played twice' },
  ],
  swivel_upgraded: [
    { kind: 'GainBlock', amount: 11, target: 'self' },
    { kind: 'Unimplemented', description: 'Next Attack played twice' },
  ],
  talk_to_the_hand: [
    { kind: 'DealDamage', hits: 1, amount: 5, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When deal unblocked damage to this enemy, gain 2 Block' },
    { kind: 'Exhaust', target: 'self' },
  ],
  talk_to_the_hand_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 7, target: 'chosen' },
    { kind: 'Unimplemented', description: 'When deal unblocked damage to this enemy, gain 3 Block' },
    { kind: 'Exhaust', target: 'self' },
  ],
  tantrum: [
    { kind: 'DealDamage', hits: 3, amount: 3, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
    { kind: 'Unimplemented', description: 'Shuffle this card into draw pile' },
  ],
  tantrum_upgraded: [
    { kind: 'DealDamage', hits: 3, amount: 4, target: 'chosen' },
    { kind: 'EnterStance', stance: 'wrath' },
    { kind: 'Unimplemented', description: 'Shuffle this card into draw pile' },
  ],
  wallop: [
    { kind: 'DealDamage', hits: 1, amount: 9, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Gain Block equal to unblocked damage dealt' },
  ],
  wallop_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 12, target: 'chosen' },
    { kind: 'Unimplemented', description: 'Gain Block equal to unblocked damage dealt' },
  ],
  wave_of_the_hand: [
    { kind: 'Unimplemented', description: 'When gain Block this turn, apply 1 Weak to all row' },
  ],
  wave_of_the_hand_upgraded: [
    { kind: 'Unimplemented', description: 'When gain Block this turn, apply 2 Weak to all row' },
  ],
  wheel_kick: [
    { kind: 'DealDamage', hits: 1, amount: 15, target: 'chosen' },
    { kind: 'DrawCards', count: 2 },
  ],
  wheel_kick_upgraded: [
    { kind: 'DealDamage', hits: 1, amount: 20, target: 'chosen' },
    { kind: 'DrawCards', count: 2 },
  ],
  windmill_strike: [
    { kind: 'Unimplemented', description: 'Deal 7 damage. When Retained, +4 damage. Retain' },
  ],
  windmill_strike_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 10 damage. When Retained, +5 damage. Retain' },
  ],
  worship: [
    { kind: 'Unimplemented', description: 'Gain 5 Mantra' },
  ],
  worship_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 7 Mantra' },
  ],
  wreath_of_flame: [
    { kind: 'Unimplemented', description: 'Next Attack deals 5 additional damage' },
  ],
  wreath_of_flame_upgraded: [
    { kind: 'Unimplemented', description: 'Next Attack deals 8 additional damage' },
  ],

  // ======================================================================
  // WATCHER RARES
  // ======================================================================
  devotion: [
    { kind: 'Unimplemented', description: 'Power: Start turn, place cube, gain 1 Mantra, draw 1. Exhaust at 3 cubes' },
  ],
  devotion_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start turn, place cube, gain 1 Mantra, draw 1. Exhaust at 4 cubes' },
  ],
  omega: [
    { kind: 'Unimplemented', description: 'Power: End of turn deal 5 damage to all enemies' },
  ],
  omega_upgraded: [
    { kind: 'Unimplemented', description: 'Power: End of turn deal 6 damage to all enemies' },
  ],
  deus_ex_machina: [
    { kind: 'Exhaust', target: 'self' },
  ],
  deus_ex_machina_upgraded: [
    { kind: 'Exhaust', target: 'self' },
  ],
  judgment: [
    { kind: 'Unimplemented', description: 'If enemy has 7 HP or less, they die. Ethereal' },
  ],
  judgment_upgraded: [
    { kind: 'Unimplemented', description: 'If enemy has 8 HP or less, they die. Retain' },
  ],
  blasphemy: [
    { kind: 'Unimplemented', description: 'Next Attack played 3 times. Exhaust draw pile. Exhaust' },
  ],
  blasphemy_upgraded: [
    { kind: 'Unimplemented', description: 'Retain. Next Attack played 3 times. Exhaust draw pile. Exhaust' },
  ],
  scrawl: [
    { kind: 'DrawCards', count: 5 },
    { kind: 'Exhaust', target: 'self' },
  ],
  scrawl_upgraded: [
    { kind: 'DrawCards', count: 5 },
    { kind: 'Exhaust', target: 'self' },
  ],
  ragnarok: [
    { kind: 'DealDamage', hits: 5, amount: 5, target: 'random' },
  ],
  ragnarok_upgraded: [
    { kind: 'DealDamage', hits: 6, amount: 5, target: 'random' },
  ],
  spirit_shield: [
    { kind: 'Unimplemented', description: 'Gain 3 Block per card in hand' },
  ],
  spirit_shield_upgraded: [
    { kind: 'Unimplemented', description: 'Gain 4 Block per card in hand' },
  ],
  wish: [
    { kind: 'Unimplemented', description: 'Choose: 6 Gold, 10 Block, or 4 Strength. Exhaust' },
  ],
  wish_upgraded: [
    { kind: 'Unimplemented', description: 'Choose: 12 Gold, or 4 Strength + 4 Dexterity. Exhaust' },
  ],
  vault: [
    { kind: 'Unimplemented', description: 'Discard hand. Draw 5. Gain 3 Energy. Exhaust' },
  ],
  vault_upgraded: [
    { kind: 'Unimplemented', description: 'Discard hand. Draw 5. Gain 3 Energy. Exhaust (cost 2)' },
  ],
  brilliance: [
    { kind: 'Unimplemented', description: 'Deal 12 damage + 1 per Mantra' },
  ],
  brilliance_upgraded: [
    { kind: 'Unimplemented', description: 'Deal 16 damage + 2 per Mantra' },
  ],
  deva_form: [
    { kind: 'Unimplemented', description: 'Power: Ethereal. Start of turn effects' },
  ],
  deva_form_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Start of turn effects' },
  ],
  establishment: [
    { kind: 'Unimplemented', description: 'Power: Retained cards cost 1 less' },
  ],
  establishment_upgraded: [
    { kind: 'Unimplemented', description: 'Power: Retained cards cost 2 less' },
  ],
  omniscience: [
    { kind: 'Unimplemented', description: 'Search deck for Attack/Skill, play twice, exhaust it. Exhaust' },
  ],
  omniscience_upgraded: [
    { kind: 'Unimplemented', description: 'Search deck for Attack/Skill, play twice, exhaust it. Exhaust (cost 2)' },
  ],
};

const UNIMPLEMENTED_FALLBACK: CardEffect[] = [
  { kind: 'Unimplemented', description: 'Not yet mapped' },
];

/**
 * Get the effect array for a card ID. Returns Unimplemented stub for unmapped cards.
 */
export function getCardEffects(cardId: string): CardEffect[] {
  return cardEffects[cardId] ?? UNIMPLEMENTED_FALLBACK;
}

export { cardEffects };
